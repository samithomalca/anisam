/**
 * ANISAM - Backend con Appwrite (Auth + TablesDB)
 * ------------------------------------------------------------------
 * - Login / registro con email y contraseña
 * - Sincroniza el historial de estados de ánimo del usuario
 * - Mantiene localStorage como caché / modo invitado (offline)
 *
 * Requiere cargarse DESPUÉS de app.js y de:
 *   <script src="https://cdn.jsdelivr.net/npm/appwrite@29.0.0"></script>
 */
(function () {
  'use strict';

  // ------------------------------------------------------------------
  // Configuración
  // ------------------------------------------------------------------
  const CFG = Object.assign(
    {
      endpoint: 'https://fra.cloud.appwrite.io/v1',
      projectId: '',
      databaseId: '6ad644c7001212715993',
      tableId: '6ad645330023c95ed756'
    },
    window.ANISAM_APPWRITE_CONFIG || {}
  );

  const GUEST_CACHE_KEY = 'anisam_history';
  const PAGE_LIMIT = 100;
  const SDK = window.Appwrite || null;

  const isConfigured =
    !!SDK &&
    !!CFG.projectId &&
    !/^(TU_|YOUR_|REEMPLAZA|PROJECT_ID$)/i.test(String(CFG.projectId).trim());

  let client = null;
  let account = null;
  let tablesDB = null;
  let user = null; // sesión activa de Appwrite (null = invitado)

  if (isConfigured) {
    client = new SDK.Client().setEndpoint(CFG.endpoint).setProject(CFG.projectId);
    account = new SDK.Account(client);
    tablesDB = new SDK.TablesDB(client);
  } else {
    console.warn(
      '[ANISAM] Appwrite no está configurado. Edita appwrite-config.js con tu Project ID. ' +
        'La app seguirá funcionando en modo invitado con localStorage.'
    );
  }

  // ------------------------------------------------------------------
  // Utilidades de caché local
  // ------------------------------------------------------------------
  function cacheKey(uid) {
    return uid ? 'anisam_history_' + uid : GUEST_CACHE_KEY;
  }

  function readCache(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function writeCache(key, entries) {
    try {
      localStorage.setItem(key, JSON.stringify(entries));
    } catch (err) {
      console.warn('[ANISAM] No se pudo escribir en localStorage.', err);
    }
  }

  function mergeEntries(entries) {
    const map = new Map();
    entries.forEach(function (entry) {
      if (!entry || entry.id === undefined || entry.id === null) return;
      map.set(String(entry.id), entry);
    });
    return Array.from(map.values()).sort(function (a, b) {
      return Number(b.id) - Number(a.id);
    });
  }

  function rowToEntry(row) {
    return {
      id: Number(row.clientId) || new Date(row.$createdAt).getTime(),
      appwriteId: row.$id,
      date: row.date || '',
      moodKey: row.moodKey || 'relax',
      moodLabel: row.moodLabel || 'Relax',
      emoji: row.emoji || '🧘',
      intensity: Number(row.intensity) || 0,
      note: row.note || ''
    };
  }

  function entryToRowData(entry) {
    return {
      clientId: String(entry.id),
      date: entry.date || '',
      moodKey: entry.moodKey || 'relax',
      moodLabel: entry.moodLabel || 'Relax',
      emoji: entry.emoji || '🧘',
      intensity: Number(entry.intensity) || 0,
      note: entry.note || ''
    };
  }

  function currentState() {
    // `state` es un binding global declarado en app.js
    return typeof state !== 'undefined' ? state : null;
  }

  function rerender() {
    if (typeof renderHistory === 'function') renderHistory();
    if (typeof renderInsights === 'function') renderInsights();
    if (typeof renderWeeklyCalendar === 'function') renderWeeklyCalendar();
  }

  function emitChange(entries) {
    const appState = currentState();
    if (appState) appState.history = entries;
    rerender();
  }

  // ------------------------------------------------------------------
  // Operaciones con Appwrite
  // ------------------------------------------------------------------
  async function fetchRemoteRows() {
    const response = await tablesDB.listRows({
      databaseId: CFG.databaseId,
      tableId: CFG.tableId,
      queries: [SDK.Query.orderDesc('$createdAt'), SDK.Query.limit(PAGE_LIMIT)]
    });
    return response.rows || [];
  }

  async function createRemoteRow(entry) {
    return tablesDB.createRow({
      databaseId: CFG.databaseId,
      tableId: CFG.tableId,
      rowId: SDK.ID.unique(),
      data: entryToRowData(entry),
      // Cada fila queda visible solo para su dueño
      permissions: [
        SDK.Permission.read(SDK.Role.user(user.$id)),
        SDK.Permission.update(SDK.Role.user(user.$id)),
        SDK.Permission.delete(SDK.Role.user(user.$id))
      ]
    });
  }

  /**
   * Trae las filas del usuario, sube los registros locales que falten
   * (incluye el historial de invitado al iniciar sesión) y refresca la UI.
   */
  async function syncWithRemote(options) {
    if (!user) return;
    const importGuest = !options || options.importGuest !== false;

    const key = cacheKey(user.$id);
    const remoteRows = await fetchRemoteRows();
    const remoteIds = new Set(remoteRows.map(function (row) { return String(row.clientId); }));

    const local = readCache(key);
    const guest = importGuest ? readCache(GUEST_CACHE_KEY) : [];
    const candidates = mergeEntries(local.concat(guest));

    const pending = candidates.filter(function (entry) {
      return !remoteIds.has(String(entry.id));
    });

    if (pending.length) {
      await Promise.allSettled(pending.slice(0, PAGE_LIMIT).map(createRemoteRow));
    }

    const rows = pending.length ? await fetchRemoteRows() : remoteRows;
    const merged = mergeEntries(rows.map(rowToEntry).concat(candidates));

    writeCache(key, merged);
    if (importGuest && guest.length) {
      try { localStorage.removeItem(GUEST_CACHE_KEY); } catch (err) { /* noop */ }
    }
    emitChange(merged);
  }

  // ------------------------------------------------------------------
  // Autenticación
  // ------------------------------------------------------------------
  async function register(name, email, password) {
    await account.create({
      userId: SDK.ID.unique(),
      email: email,
      password: password,
      name: name || undefined
    });
    await account.createEmailPasswordSession({ email: email, password: password });
    await adoptSession();
  }

  async function login(email, password) {
    await account.createEmailPasswordSession({ email: email, password: password });
    await adoptSession();
  }

  async function adoptSession() {
    user = await account.get();
    updateAuthUI();
    await syncWithRemote({ importGuest: true });
  }

  async function logout() {
    try {
      await account.deleteSession({ sessionId: 'current' });
    } catch (err) {
      console.warn('[ANISAM] No se pudo cerrar la sesión.', err);
    }
    user = null;
    updateAuthUI();
    emitChange(readCache(GUEST_CACHE_KEY));
  }

  // ------------------------------------------------------------------
  // API usada por app.js
  // ------------------------------------------------------------------
  function onEntryAdded(entry) {
    const key = cacheKey(user ? user.$id : null);
    writeCache(key, mergeEntries([entry].concat(readCache(key))));

    if (user) {
      createRemoteRow(entry).catch(function (err) {
        console.warn('[ANISAM] Registro guardado localmente; se sincronizará luego.', err);
      });
    }
  }

  async function clearEntries() {
    writeCache(cacheKey(user ? user.$id : null), []);
    try { localStorage.removeItem(GUEST_CACHE_KEY); } catch (err) { /* noop */ }

    if (!user) return;
    try {
      const rows = await fetchRemoteRows();
      await Promise.allSettled(
        rows.map(function (row) {
          return tablesDB.deleteRow({
            databaseId: CFG.databaseId,
            tableId: CFG.tableId,
            rowId: row.$id
          });
        })
      );
    } catch (err) {
      console.warn('[ANISAM] No se pudo limpiar el historial remoto.', err);
    }
  }

  window.AnisamBackend = {
    configured: isConfigured,
    onEntryAdded: onEntryAdded,
    clearEntries: clearEntries,
    login: login,
    register: register,
    logout: logout,
    getUser: function () { return user; }
  };

  // ------------------------------------------------------------------
  // Interfaz de autenticación (modal + navbar)
  // ------------------------------------------------------------------
  const els = {};

  function cacheElements() {
    els.openBtn = document.getElementById('auth-open-btn');
    els.logoutBtn = document.getElementById('auth-logout-btn');
    els.chip = document.getElementById('auth-user-chip');
    els.chipLabel = document.getElementById('auth-user-email');
    els.modal = document.getElementById('auth-modal');
    els.closeBtn = document.getElementById('auth-close-btn');
    els.form = document.getElementById('auth-form');
    els.nameField = document.getElementById('auth-name-field');
    els.nameInput = document.getElementById('auth-name');
    els.emailInput = document.getElementById('auth-email');
    els.passwordInput = document.getElementById('auth-password');
    els.error = document.getElementById('auth-error');
    els.submit = document.getElementById('auth-submit');
    els.hint = document.getElementById('auth-config-hint');
    els.tabs = document.querySelectorAll('[data-auth-tab]');
  }

  let authMode = 'login';

  function setAuthMode(mode) {
    authMode = mode;
    els.tabs.forEach(function (tab) {
      tab.classList.toggle('active', tab.dataset.authTab === mode);
    });
    if (els.nameField) els.nameField.hidden = mode !== 'register';
    if (els.nameInput) els.nameInput.required = mode === 'register';
    if (els.submit) {
      els.submit.textContent = mode === 'register' ? 'Crear cuenta' : 'Entrar';
    }
    showError('');
  }

  function showError(message) {
    if (!els.error) return;
    els.error.textContent = message || '';
  }

  function openModal() {
    if (!isConfigured) return;
    if (els.form) els.form.reset();
    setAuthMode('login');
    showError('');
    els.modal.classList.add('active');
    if (els.emailInput) els.emailInput.focus();
  }

  function closeModal() {
    if (els.modal) els.modal.classList.remove('active');
  }

  function updateAuthUI() {
    const loggedIn = !!user;
    if (els.chip) els.chip.hidden = !loggedIn;
    if (els.chipLabel) els.chipLabel.textContent = loggedIn ? (user.email || user.name || 'Mi cuenta') : '';
    if (els.openBtn) els.openBtn.hidden = loggedIn;
    if (els.logoutBtn) els.logoutBtn.hidden = !loggedIn;
  }

  function setBusy(busy) {
    if (!els.submit) return;
    els.submit.disabled = busy;
    els.submit.textContent = busy
      ? 'Conectando…'
      : authMode === 'register'
        ? 'Crear cuenta'
        : 'Entrar';
  }

  function friendlyError(err) {
    const message = (err && err.message) || 'Ocurrió un error inesperado.';
    if (/invalid credentials/i.test(message)) return 'Email o contraseña incorrectos.';
    if (/already exists/i.test(message)) return 'Ya existe una cuenta con ese email.';
    if (/password/i.test(message) && /least|between|long/i.test(message)) {
      return 'La contraseña no cumple los requisitos (mínimo 8 caracteres).';
    }
    if (/network|fetch|cors|failed to fetch/i.test(message)) {
      return 'No se pudo conectar con Appwrite. Revisa tu conexión y el dominio autorizado (platform) en la consola.';
    }
    return message;
  }

  function wireAuthUI() {
    if (els.openBtn) els.openBtn.addEventListener('click', openModal);
    if (els.closeBtn) els.closeBtn.addEventListener('click', closeModal);
    if (els.modal) {
      els.modal.addEventListener('click', function (event) {
        if (event.target === els.modal) closeModal();
      });
    }
    if (els.logoutBtn) {
      els.logoutBtn.addEventListener('click', function () {
        logout();
      });
    }
    els.tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        setAuthMode(tab.dataset.authTab);
      });
    });
    if (els.form) {
      els.form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (!isConfigured) return;

        const email = (els.emailInput.value || '').trim();
        const password = els.passwordInput.value || '';
        const name = (els.nameInput.value || '').trim();

        showError('');
        setBusy(true);
        try {
          if (authMode === 'register') {
            await register(name, email, password);
          } else {
            await login(email, password);
          }
          closeModal();
          els.form.reset();
        } catch (err) {
          console.error('[ANISAM] Error de autenticación:', err);
          showError(friendlyError(err));
        } finally {
          setBusy(false);
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    cacheElements();
    wireAuthUI();
    updateAuthUI();

    if (!isConfigured) {
      if (els.openBtn) {
        els.openBtn.disabled = true;
        els.openBtn.title = 'Configura tu Project ID en appwrite-config.js';
      }
      if (els.hint) els.hint.hidden = false;
      return;
    }
    if (els.hint) els.hint.hidden = true;

    // Restaurar sesión existente (si hay)
    account
      .get()
      .then(function (current) {
        user = current;
        updateAuthUI();
        return syncWithRemote({ importGuest: true });
      })
      .catch(function () {
        user = null;
        updateAuthUI();
      });
  });
})();
