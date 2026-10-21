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
  const pendingRemoteEntries = new Map();

  const isConfigured =
    !!SDK &&
    !!CFG.projectId &&
    !/^(TU_|YOUR_|REEMPLAZA|PROJECT_ID$)/i.test(String(CFG.projectId).trim());

  let client = null;
  let account = null;
  let tablesDB = null;
  let user = null; // sesión activa de Appwrite (null = invitado)
  let realtimeSubscription = null;
  let realtimeRefreshQueue = Promise.resolve();

  // Auth Guard
  let authState = 'loading';   // 'loading' | 'locked' | 'unlocked'
  let gateEl = null;           // contenedor #auth-gate
  let gateMode = 'login';      // pestaña activa dentro de la pantalla de acceso

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
    const rows = [];
    let cursor = null;

    while (true) {
      const queries = [
        SDK.Query.orderDesc('$createdAt'),
        SDK.Query.limit(PAGE_LIMIT)
      ];
      if (cursor) queries.push(SDK.Query.cursorAfter(cursor));

      const response = await tablesDB.listRows({
        databaseId: CFG.databaseId,
        tableId: CFG.tableId,
        queries: queries
      });
      const page = response.rows || [];
      rows.push.apply(rows, page);

      if (page.length < PAGE_LIMIT) break;
      const lastRow = page[page.length - 1];
      if (!lastRow || !lastRow.$id || lastRow.$id === cursor) {
        throw new Error('La paginación de Appwrite no avanzó al siguiente lote de registros.');
      }
      cursor = lastRow.$id;
    }

    return rows;
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
      pendingRemoteEntries.clear();
      for (let offset = 0; offset < pending.length; offset += PAGE_LIMIT) {
        const pendingBatch = pending.slice(offset, offset + PAGE_LIMIT);
        const results = await Promise.allSettled(pendingBatch.map(createRemoteRow));
        results.forEach(function (result, index) {
          if (result.status === 'rejected') {
            pendingRemoteEntries.set(String(pendingBatch[index].id), pendingBatch[index]);
            console.warn('[ANISAM] No se pudo sincronizar un registro pendiente.', result.reason);
          }
        });
      }
    }

    const rows = pending.length ? await fetchRemoteRows() : remoteRows;
    const remoteIdsAfterSync = new Set(rows.map(function (row) { return String(row.clientId); }));
    pendingRemoteEntries.forEach(function (_entry, id) {
      if (remoteIdsAfterSync.has(id)) pendingRemoteEntries.delete(id);
    });
    const merged = mergeEntries(candidates.concat(rows.map(rowToEntry)));

    writeCache(key, merged);
    if (importGuest && guest.length) {
      try { localStorage.removeItem(GUEST_CACHE_KEY); } catch (err) { /* noop */ }
    }
    emitChange(merged);
  }

  async function refreshFromRemote() {
    if (!user) return;
    const userId = user.$id;
    const rows = await fetchRemoteRows();
    if (!user || user.$id !== userId) return;

    const remoteIds = new Set(rows.map(function (row) { return String(row.clientId); }));
    const unsynced = [];
    pendingRemoteEntries.forEach(function (entry, id) {
      if (remoteIds.has(id)) {
        pendingRemoteEntries.delete(id);
      } else {
        unsynced.push(entry);
      }
    });

    const merged = mergeEntries(unsynced.concat(rows.map(rowToEntry)));
    writeCache(cacheKey(userId), merged);
    emitChange(merged);
  }

  function stopRealtimeSubscription() {
    if (!realtimeSubscription) return;
    realtimeSubscription.unsubscribe();
    realtimeSubscription = null;
  }

  function startRealtimeSubscription() {
    if (!user || !client || typeof client.subscribe !== 'function') return;
    stopRealtimeSubscription();

    const channel = 'tablesdb.' + CFG.databaseId + '.tables.' + CFG.tableId + '.rows';
    try {
      realtimeSubscription = client.subscribe(channel, function () {
        realtimeRefreshQueue = realtimeRefreshQueue
          .then(refreshFromRemote)
          .catch(function (err) {
            console.warn('[ANISAM] No se pudo actualizar el historial en tiempo real.', err);
          });
      });
    } catch (err) {
      console.warn('[ANISAM] No se pudo suscribir a los cambios en tiempo real de Appwrite.', err);
    }
  }

  // ------------------------------------------------------------------
  // Autenticación
  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // Auth Guard: estado de acceso (loading -> locked -> unlocked)
  // ------------------------------------------------------------------
  var authListener = null;

  /**
   * Aplica el estado de acceso a toda la app.
   * - 'loading'  : aún comprobando la sesión (no se ve nada)
   * - 'locked'   : sin sesión -> solo se ve la pantalla de acceso
   * - 'unlocked' : con sesión -> se ve el dashboard
   */
  function setAuthState(nextState) {
    authState = nextState;
    document.body.setAttribute('data-auth-state', nextState);

    if (gateEl) gateEl.hidden = nextState !== 'locked';

    if (nextState === 'locked') {
      document.body.classList.add('auth-locked');
      focusGate();
    } else {
      document.body.classList.remove('auth-locked');
    }

    if (nextState === 'unlocked') {
      // Al entrar, llevar al dashboard (no a pantallas intermedias)
      if (typeof window.switchScreen === 'function') {
        window.switchScreen('screen-welcome');
      } else if (typeof switchScreen === 'function') {
        switchScreen('screen-welcome');
      }
    }

    if (typeof authListener === 'function') {
      try { authListener(nextState, user); } catch (err) { /* noop */ }
    }
  }

  function focusGate() {
    // Enfoca el primer campo vacío de la pantalla de acceso
    window.setTimeout(function () {
      if (authState !== 'locked') return;
      var target = gateMode === 'login' ? els.gateEmail : els.gateName;
      if (!target) target = els.gateEmail;
      if (target) target.focus();
    }, 60);
  }

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
    // Desbloquea la app inmediatamente; la sincronización sigue en segundo plano
    setAuthState('unlocked');
    try {
      await syncWithRemote({ importGuest: true });
    } catch (err) {
      console.warn('[ANISAM] No se pudo sincronizar con Appwrite.', err);
    }
    startRealtimeSubscription();
  }

  async function logout() {
    try {
      await account.deleteSession({ sessionId: 'current' });
    } catch (err) {
      console.warn('[ANISAM] No se pudo cerrar la sesión.', err);
    }
    user = null;
    stopRealtimeSubscription();
    pendingRemoteEntries.clear();
    updateAuthUI();
    // Limpia la caché del usuario y vuelve a bloquear la app
    emitChange(readCache(GUEST_CACHE_KEY));
    resetGateForm();
    setAuthState('locked');
  }

  async function checkSession() {
    if (!isConfigured) {
      // Sin backend no hay autenticación posible: se deja pasar en modo invitado.
      updateAuthUI();
      setAuthState('unlocked');
      return null;
    }
    try {
      user = await account.get();
      updateAuthUI();
      setAuthState('unlocked');
      try {
        await syncWithRemote({ importGuest: true });
      } catch (err) {
        console.warn('[ANISAM] No se pudo sincronizar con Appwrite.', err);
      }
      startRealtimeSubscription();
      return user;
    } catch (err) {
      // 401 = no hay sesión válida -> pantalla de acceso
      user = null;
      updateAuthUI();
      setAuthState('locked');
      return null;
    }
  }

  // ------------------------------------------------------------------
  // API usada por app.js
  // ------------------------------------------------------------------
  /**
   * Guarda una entrada nueva.
   * - Siempre la escribe en la caché local (para historial/estadísticas inmediatos).
   * - Si hay sesión, la guarda en la base de datos de Appwrite.
   * Devuelve { saved, remote, error } para que la UI pueda confirmar el resultado.
   */
  async function onEntryAdded(entry) {
    const key = cacheKey(user ? user.$id : null);
    writeCache(key, mergeEntries([entry].concat(readCache(key))));

    if (!user) {
      return { saved: true, remote: false, error: null };
    }

    try {
      await createRemoteRow(entry);
      pendingRemoteEntries.delete(String(entry.id));
      return { saved: true, remote: true, error: null };
    } catch (err) {
      pendingRemoteEntries.set(String(entry.id), entry);
      console.warn('[ANISAM] Registro guardado localmente; se sincronizará luego.', err);
      return { saved: true, remote: false, error: err };
    }
  }

  async function clearEntries() {
    writeCache(cacheKey(user ? user.$id : null), []);
    pendingRemoteEntries.clear();
    try { localStorage.removeItem(GUEST_CACHE_KEY); } catch (err) { /* noop */ }

    if (!user) return;
    try {
      const rows = await fetchRemoteRows();
      const results = await Promise.allSettled(
        rows.map(function (row) {
          return tablesDB.deleteRow({
            databaseId: CFG.databaseId,
            tableId: CFG.tableId,
            rowId: row.$id
          });
        })
      );
      const failures = results.filter(function (result) { return result.status === 'rejected'; });
      if (failures.length) {
        console.warn('[ANISAM] No se pudieron eliminar todos los registros remotos.', failures);
      }
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
    checkSession: checkSession,
    getUser: function () { return user; }
  };

  // ------------------------------------------------------------------
  // Interfaz de autenticación (pantalla de acceso + modal + navbar)
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

    // Pantalla de bloqueo (Auth Guard)
    els.gate = document.getElementById('auth-gate');
    els.gateForm = document.getElementById('auth-gate-form');
    els.gateNameField = document.getElementById('auth-gate-name-field');
    els.gateName = document.getElementById('auth-gate-name');
    els.gateEmail = document.getElementById('auth-gate-email');
    els.gatePassword = document.getElementById('auth-gate-password');
    els.gateError = document.getElementById('auth-gate-error');
    els.gateSubmit = document.getElementById('auth-gate-submit');
    els.gateHint = document.getElementById('auth-gate-hint');

    // Pestañas de ambos formularios
    els.tabs = document.querySelectorAll('[data-auth-tab]');
  }

  let authMode = 'login'; // 'login' | 'register' (comparten estado)

  /**
   * Cambia entre "Iniciar sesión" y "Crear cuenta" en los dos formularios.
   */
  function setAuthMode(mode) {
    authMode = mode;
    gateMode = mode;

    els.tabs.forEach(function (tab) {
      tab.classList.toggle('active', tab.dataset.authTab === mode);
    });

    // Formulario de la pantalla de acceso
    if (els.gateNameField) els.gateNameField.hidden = mode !== 'register';
    if (els.gateName) els.gateName.required = mode === 'register';
    if (els.gateSubmit) {
      els.gateSubmit.textContent = mode === 'register' ? 'Crear cuenta' : 'Entrar';
    }

    // Modal del navbar
    if (els.nameField) els.nameField.hidden = mode !== 'register';
    if (els.nameInput) els.nameInput.required = mode === 'register';
    if (els.submit) {
      els.submit.textContent = mode === 'register' ? 'Crear cuenta' : 'Entrar';
    }

    showError('', els.error);
    showError('', els.gateError);
  }

  function showError(message, target) {
    const el = target || els.error;
    if (!el) return;
    el.textContent = message || '';
  }

  function openModal() {
    if (!isConfigured) return;
    if (authState === 'locked') return; // el guard manda: no se abre el modal
    if (els.form) els.form.reset();
    setAuthMode('login');
    showError('', els.error);
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

  function resetGateForm() {
    if (els.gateForm) els.gateForm.reset();
    setAuthMode('login');
    showError('', els.gateError);
    setGateBusy(false);
    resetPasswordToggles();
  }

  function setGateBusy(busy) {
    if (!els.gateSubmit) return;
    els.gateSubmit.disabled = busy;
    els.gateSubmit.textContent = busy
      ? 'Conectando…'
      : authMode === 'register'
        ? 'Crear cuenta'
        : 'Entrar';
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

  /**
   * Ejecuta login/registro y gestiona el estado de los dos formularios.
   */
  async function submitAuth(form, errorEl, busyFn, closeFn, values) {
    const email = (values.email || '').trim();
    const password = values.password || '';
    const name = (values.name || '').trim();

    showError('', errorEl);
    busyFn(true);
    try {
      if (authMode === 'register') {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      if (form) form.reset();
      if (closeFn) closeFn();
      resetPasswordToggles();
    } catch (err) {
      console.error('[ANISAM] Error de autenticación:', err);
      showError(friendlyError(err), errorEl);
    } finally {
      busyFn(false);
    }
  }

  /**
   * Alterna la visibilidad de un campo de contraseña y su icono (ojo / ojo tachado).
   */
  function togglePasswordVisibility(button) {
    const inputId = button.getAttribute('data-password-toggle');
    const input = inputId ? document.getElementById(inputId) : null;
    if (!input) return;

    const willShow = input.type === 'password';
    input.type = willShow ? 'text' : 'password';

    button.setAttribute('aria-pressed', willShow ? 'true' : 'false');
    const label = willShow ? 'Ocultar contraseña' : 'Mostrar contraseña';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);

    const icon = button.querySelector('i');
    if (icon) {
      icon.classList.toggle('ph-eye', !willShow);
      icon.classList.toggle('ph-eye-slash', willShow);
    }

    // Mantiene el foco en el campo para no interrumpir la escritura
    input.focus();
  }

  function wirePasswordToggles() {
    const buttons = document.querySelectorAll('[data-password-toggle]');
    buttons.forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        togglePasswordVisibility(button);
      });
    });
  }

  /**
   * Restablece ambos campos de contraseña a estado oculto.
   */
  function resetPasswordToggles() {
    document.querySelectorAll('[data-password-toggle]').forEach(function (button) {
      const inputId = button.getAttribute('data-password-toggle');
      const input = inputId ? document.getElementById(inputId) : null;
      if (input) input.type = 'password';

      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', 'Mostrar contraseña');
      button.setAttribute('title', 'Mostrar contraseña');

      const icon = button.querySelector('i');
      if (icon) {
        icon.classList.add('ph-eye');
        icon.classList.remove('ph-eye-slash');
      }
    });
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

    // Pestañas (afectan a ambos formularios)
    els.tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        setAuthMode(tab.dataset.authTab);
      });
    });

    // Pantalla de acceso (Auth Guard)
    if (els.gateForm) {
      els.gateForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!isConfigured) return;
        submitAuth(els.gateForm, els.gateError, setGateBusy, null, {
          email: els.gateEmail ? els.gateEmail.value : '',
          password: els.gatePassword ? els.gatePassword.value : '',
          name: els.gateName ? els.gateName.value : ''
        });
      });
    }

    // Modal del navbar
    if (els.form) {
      els.form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!isConfigured) return;
        submitAuth(els.form, els.error, setBusy, closeModal, {
          email: els.emailInput ? els.emailInput.value : '',
          password: els.passwordInput ? els.passwordInput.value : '',
          name: els.nameInput ? els.nameInput.value : ''
        });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    cacheElements();
    gateEl = els.gate;
    wireAuthUI();
    wirePasswordToggles();
    resetPasswordToggles();
    updateAuthUI();

    if (!isConfigured) {
      if (els.openBtn) {
        els.openBtn.disabled = true;
        els.openBtn.title = 'Configura tu Project ID en appwrite-config.js';
      }
      if (els.hint) els.hint.hidden = false;
      if (els.gateHint) els.gateHint.hidden = false;
      // Sin Appwrite la app queda en modo invitado (no se puede autenticar).
      setAuthState('unlocked');
      return;
    }

    if (els.hint) els.hint.hidden = true;
    if (els.gateHint) els.gateHint.hidden = true;

    // Aplica el estado 'loading' y comprueba la sesión existente
    setAuthState('loading');
    checkSession();
  });

  // ------------------------------------------------------------------
  // API pública (incluye el guard para app.js / index.html)
  // ------------------------------------------------------------------
  window.AnisamGuard = {
    getState: function () { return authState; },
    isLocked: function () { return authState === 'locked'; },
    isUnlocked: function () { return authState === 'unlocked'; },
    onChange: function (fn) { authListener = fn; },
    lock: function () { setAuthState('locked'); },
    unlock: function () { setAuthState('unlocked'); }
  };
})();
