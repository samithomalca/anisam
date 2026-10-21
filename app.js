/**
 * ANISAM (Moodly) - Core Application Logic
 * Navigation SPA, Sentiment NLP Analyzer, Audio Synthesizer & Dynamic Recommendations Engine
 */

// Global Application State
const initialFavorites = loadFavorites();
const state = {
  activeScreen: 'screen-welcome',
  selectedMood: 'feliz',
  intensity: 70,
  nlpText: '',
  activeFilter: 'all',
  habits: [],
  history: JSON.parse(localStorage.getItem('anisam_history') || '[]'),
  favorites: initialFavorites.items,
  favoriteStorageError: initialFavorites.error,
  playingTrack: null,
  audioCtx: null,
  oscillator: null,
  gainNode: null,
  isPlayingAudio: false
};

function loadFavorites() {
  try {
    const storedFavorites = localStorage.getItem('anisam_favorites');
    if (!storedFavorites) return { items: [], error: null };

    const favorites = JSON.parse(storedFavorites);
    if (!Array.isArray(favorites)) {
      throw new Error('El formato de favoritos guardado no es válido.');
    }

    return {
      items: favorites.filter(favorite =>
        favorite &&
        (favorite.type === 'song' || favorite.type === 'movie') &&
        favorite.item &&
        typeof favorite.item === 'object'
      ),
      error: null
    };
  } catch (err) {
    console.error('[ANISAM] No se pudieron cargar los favoritos:', err);
    return {
      items: [],
      error: 'No se pudieron cargar los favoritos guardados en este navegador.'
    };
  }
}

// Mood Midpoints mapping for Card -> Slider (0-100 Range)
const MOOD_MIDPOINTS = {
  triste: 10,       // 0 a 20
  relax: 30,        // 21 a 40
  entretenido: 50,  // 41 a 60
  feliz: 70,        // 61 a 80
  energia: 90       // 81 a 100
};

// Function for Slider Range -> Mood Card Mapping
function getMoodFromIntensity(val) {
  const v = parseInt(val, 10);
  if (v <= 20) return 'triste';
  if (v <= 40) return 'relax';
  if (v <= 60) return 'entretenido';
  if (v <= 80) return 'feliz';
  return 'energia';
}

// Helper Cover Asset per Mood
// Portadas locales (SVG dentro de /assets): nunca dependen de la red externa.
const FALLBACK_COVER = 'assets/fallback-cover.svg';

const MOOD_COVERS = {
  Feliz: 'assets/happy_series_poster.svg',
  Triste: 'assets/movie_poster_echoes.svg',
  Energia: 'assets/energetic_synth_art.svg',
  Relax: 'assets/musica_relajante.svg',
  Entretenido: 'assets/happy_series_art.svg'
};

/**
 * Resuelve la portada de un elemento (canción o película).
 * Si ya trae `poster` se respeta; si no, se usa la portada del estado de ánimo.
 * Siempre devuelve una URL local válida (nunca cadena vacía).
 */
function resolveCover(item, moodKey) {
  const label = (moodKey || 'Relax');
  // Normaliza etiquetas tipo "Con Energía" -> "Energia"
  const normalized = label === 'Con Energía' ? 'Energia' : label;
  return (item && (item.poster || item.cover))
    || MOOD_COVERS[normalized]
    || MOOD_COVERS[label]
    || FALLBACK_COVER;
}

/**
 * Devuelve los atributos <img> para una portada, con respaldo ante fallos.
 * La portada real se toma de `url` (o del respaldo si falta).
 */
function coverImgAttrs(url, alt) {
  const safeUrl = url || FALLBACK_COVER;
  const safeAlt = alt || 'Portada de contenido';
  return `src="${safeUrl}" data-fallback="${FALLBACK_COVER}" alt="${escapeHtml(safeAlt)}" loading="lazy" decoding="async"`;
}

// Emotional Dataset Configuration & Daily Habits
const MOOD_DATA = {
  feliz: {
    label: 'Feliz',
    emoji: '😊',
    color: '#a1c7ec',
    description: 'Alegre, optimista y radiante',
    habits: [
      { id: 'h1', text: 'Comparte tu buena energía enviando un mensaje positivo a un amigo', done: false },
      { id: 'h2', text: 'Escucha una playlist llena de ritmo y vibra arriba', done: false },
      { id: 'h3', text: 'Apunta 3 logros recientes de los que te sientas orgulloso', done: false }
    ]
  },
  triste: {
    label: 'Triste',
    emoji: '😔',
    color: '#789fc8',
    description: 'Sensible, reflexivo o necesitando apoyo',
    habits: [
      { id: 'h1', text: 'Prepara una bebida caliente (té de manzanilla o chocolate)', done: false },
      { id: 'h2', text: 'Tómate 15 minutos sin pantallas ni presiones externas', done: false },
      { id: 'h3', text: 'Escucha música suave y reconfortante para procesar tus emociones', done: false }
    ]
  },
  energia: {
    label: 'Con Energía',
    emoji: '⚡',
    color: '#83addb',
    description: 'Motivado, activo y listo para actuar',
    habits: [
      { id: 'h1', text: 'Realiza una rutina rápida de ejercicio de 10 minutos', done: false },
      { id: 'h2', text: 'Avanza en tu proyecto personal más desafiante', done: false },
      { id: 'h3', text: 'Escucha un podcast de ritmo dinámico', done: false }
    ]
  },
  relax: {
    label: 'Relax',
    emoji: '🧘',
    color: '#91bdcf',
    description: 'En paz, equilibrado y sereno',
    habits: [
      { id: 'h1', text: 'Haz 5 minutos de respiración diafragmática profunda', done: false },
      { id: 'h2', text: 'Da una caminata corta observando la naturaleza', done: false },
      { id: 'h3', text: 'Lee un capítulo de tu libro favorito con música suave', done: false }
    ]
  },
  entretenido: {
    label: 'Entretenido',
    emoji: '🎬',
    color: '#9cafe0',
    description: 'Curioso, buscando diversión e intriga',
    habits: [
      { id: 'h1', text: 'Descubre un nuevo dato curioso o documental fascinante', done: false },
      { id: 'h2', text: 'Juega una partida rápida o resuelve un acertijo', done: false },
      { id: 'h3', text: 'Mira las sugerencias de películas recomendadas para hoy', done: false }
    ]
  }
};

// Keyword Sentiment Dictionary
const KEYWORD_MAP = {
  pesado: 'relax',
  relajarme: 'relax',
  descansar: 'relax',
  estrés: 'relax',
  estresado: 'triste',
  cansado: 'relax',
  alegre: 'feliz',
  contento: 'feliz',
  fiesta: 'energia',
  ejercicio: 'energia',
  motivado: 'energia',
  triste: 'triste',
  solo: 'triste',
  película: 'entretenido',
  diversión: 'entretenido',
  aburrido: 'entretenido'
};

// Nombres cortos de los días, en orden de lunes a domingo.
// El índice 0 corresponde al lunes (la semana empieza el lunes).
const WEEK_DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Emoji neutral que se muestra cuando un día no tiene registro guardado.
const EMPTY_DAY_EMOJI = '·';

/**
 * Devuelve la fecha (a medianoche local) del lunes de la semana actual.
 * Se usa como referencia para situar cada registro en su día de la semana.
 */
function getStartOfWeek(referenceDate) {
  const d = new Date(referenceDate || new Date());
  d.setHours(0, 0, 0, 0);
  // getDay(): 0 = domingo ... 6 = sábado. Convertimos a base lunes (0 = lunes).
  const offsetFromMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offsetFromMonday);
  return d;
}

/**
 * Obtiene la fecha real de un registro.
 * Se prioriza el timestamp `id` (Date.now()); si no existe, se intenta
 * interpretar el campo `date` como respaldo.
 */
function getEntryDate(entry) {
  if (!entry) return null;
  const ts = Number(entry.id);
  if (Number.isFinite(ts) && ts > 0) {
    const fromId = new Date(ts);
    if (!isNaN(fromId.getTime())) return fromId;
  }
  if (entry.date) {
    const parsed = new Date(entry.date);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

/**
 * Construye los 7 días de la semana actual (Lun - Dom) combinando:
 *  - la fecha real del sistema (para saber cuál es "hoy"),
 *  - los registros reales guardados en Appwrite/localStorage.
 *
 * Cada día devuelve: { day, date, dayOfMonth, isToday, entry }
 * donde `entry` es el registro más reciente de ese día, o null si no hay.
 */
function buildCurrentWeek() {
  const startOfWeek = getStartOfWeek();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Agrupa los registros reales por día, conservando el más reciente de cada uno.
  const entriesByDay = new Map();
  (state.history || []).forEach(entry => {
    const entryDate = getEntryDate(entry);
    if (!entryDate) return;

    // Solo nos interesan los registros de la semana actual (Lun - Dom).
    const diffDays = Math.floor((entryDate.setHours(0, 0, 0, 0) - startOfWeek.getTime()) / 86400000);
    if (diffDays < 0 || diffDays > 6) return;

    const existing = entriesByDay.get(diffDays);
    if (!existing || Number(entry.id) >= Number(existing.id)) {
      entriesByDay.set(diffDays, entry);
    }
  });

  return WEEK_DAY_NAMES.map((dayName, idx) => {
    const dayDate = new Date(startOfWeek.getTime());
    dayDate.setDate(dayDate.getDate() + idx);
    return {
      day: dayName,
      date: dayDate,
      dayOfMonth: dayDate.getDate(),
      isToday: dayDate.getTime() === today.getTime(),
      isFuture: dayDate.getTime() > today.getTime(),
      entry: entriesByDay.get(idx) || null
    };
  });
}

// Application Bootstrapper
document.addEventListener('DOMContentLoaded', () => {
  initImageFallbacks();
  initNavigation();
  initMoodForm();
  initMediaGridEvents();
  renderWeeklyCalendar();
  renderHistory();
  renderInsights();
});

// Render Weekly Calendar Widget (Hero Showcase)
function renderWeeklyCalendar() {
  const container = document.getElementById('weekly-calendar-widget');
  const badgeEl = document.getElementById('hero-current-mood-badge');
  const songTitleEl = document.getElementById('hero-song-title');
  const songDescEl = document.getElementById('hero-song-desc');
  const songImgEl = document.getElementById('hero-song-img');
  const movieTitleEl = document.getElementById('hero-movie-title');
  const movieDescEl = document.getElementById('hero-movie-desc');
  const movieImgEl = document.getElementById('hero-movie-img');

  const currentMoodObj = MOOD_DATA[state.selectedMood] || MOOD_DATA.relax;
  const songs = getSongsForMood(state.selectedMood);
  const movies = getMoviesForMood(state.selectedMood);

  const topSong = songs.length ? songs[0] : { title: 'Meditación Zen & Música Relajante', artist: 'Mindful Soundscapes', match: '99%', mood: 'Relax' };
  const topMovie = movies.length ? movies[0] : { title: 'Echoes of Calm', genre: 'Cine Indie', duration: '1h 45m', mood: 'Relax' };

  // Update hero badge
  if (badgeEl) {
    badgeEl.textContent = `${currentMoodObj.emoji} Estado Actual: ${currentMoodObj.label} (${Math.round(state.intensity / 10)}/10)`;
  }

  // Update hero mini preview cards (con portada local + respaldo ante fallos)
  if (songTitleEl) songTitleEl.textContent = topSong.title;
  if (songDescEl) songDescEl.textContent = `${topSong.artist || topSong.genre} • ${topSong.match || '99%'} de afinidad`;
  if (songImgEl) {
    setCover(songImgEl, resolveCover(topSong, topSong.mood || currentMoodObj.label), topSong.title || 'Portada musical');
  }

  if (movieTitleEl) movieTitleEl.textContent = topMovie.title || topMovie.titulo;
  if (movieDescEl) movieDescEl.textContent = `${topMovie.genre || 'Cine'} • ${topMovie.duration || '2h'}`;
  if (movieImgEl) {
    setCover(movieImgEl, resolveCover(topMovie, topMovie.mood || currentMoodObj.label), topMovie.title || topMovie.titulo || 'Póster de película');
  }

  // Render weekly pills widget (dinámico: día actual real + registros guardados)
  if (container) {
    const week = buildCurrentWeek();

    container.innerHTML = week.map((day) => {
      const entry = day.entry;
      const classes = ['calendar-day-pill'];
      if (day.isToday) classes.push('today');
      if (entry) classes.push('has-entry');
      if (!entry) classes.push('empty-day');

      // Día sin registro: indicador neutral. Día con registro: emoji real.
      const moodColor = entry ? (MOOD_DATA[entry.moodKey]?.color || '#8ab8e8') : 'transparent';
      const emojiContent = entry
        ? entry.emoji
        : EMPTY_DAY_EMOJI;

      const tooltip = entry
        ? `
          <div class="calendar-tooltip">
            <div class="tooltip-header">
              <span class="tooltip-day-badge">${day.day} ${day.dayOfMonth}${day.isToday ? ' (Hoy)' : ''}</span>
              <strong>${entry.emoji} ${escapeHtml(entry.moodLabel)} (${entry.intensity}/100)</strong>
            </div>
            <div class="tooltip-body">
              ${entry.note ? `<p class="tooltip-note">💬 <em>"${escapeHtml(entry.note)}"</em></p>` : '<p class="tooltip-note">Sin nota adicional.</p>'}
            </div>
          </div>
        `
        : `
          <div class="calendar-tooltip">
            <div class="tooltip-header">
              <span class="tooltip-day-badge">${day.day} ${day.dayOfMonth}${day.isToday ? ' (Hoy)' : ''}</span>
              <strong>Sin registro</strong>
            </div>
            <div class="tooltip-body">
              <p class="tooltip-note">${day.isFuture ? 'Este día aún no ha llegado.' : 'Aún no registraste tu estado de ánimo este día.'}</p>
            </div>
          </div>
        `;

      return `
        <div class="${classes.join(' ')}" data-day-idx="${day.dayOfMonth}" data-day-name="${day.day}" tabindex="0" aria-label="${day.day} ${day.dayOfMonth}${day.isToday ? ' (hoy)' : ''}${entry ? ': ' + escapeHtml(entry.moodLabel) : ': sin registro'}">
          <span class="day-name">${day.day}</span>
          <span class="day-emoji-badge" style="background: ${moodColor}33; border: 1px solid ${entry ? moodColor : 'var(--border-glass)'};">${emojiContent}</span>
          ${tooltip}
        </div>
      `;
    }).join('');
  }
}

// Navigation Controller (SPA Views Switcher)
function switchScreen(screenId) {
  // Auth Guard: sin sesión no se puede navegar por el dashboard
  if (window.AnisamGuard && window.AnisamGuard.isLocked()) {
    return;
  }

  state.activeScreen = screenId;
  
  const screens = document.querySelectorAll('.screen');
  const navBtns = document.querySelectorAll('.nav-btn');

  screens.forEach(screen => {
    screen.classList.toggle('active-screen', screen.id === screenId);
  });

  navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === screenId);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (screenId === 'screen-user-panel') {
    renderInsights();
    renderHistory();
    renderHabits();
  }
  if (screenId === 'screen-favorites') renderFavorites();
}

// Expone el controlador de pantallas para el Auth Guard (appwrite.js)
window.switchScreen = switchScreen;

function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const btnGetStarted = document.getElementById('btn-get-started');
  const logoBtn = document.getElementById('brand-logo-btn');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.target));
  });

  if (btnGetStarted) {
    btnGetStarted.addEventListener('click', () => switchScreen('screen-mood-reg'));
  }

  if (logoBtn) {
    logoBtn.addEventListener('click', () => switchScreen('screen-welcome'));
  }

  renderRecommendations();
  renderFavorites();

  // Quick Filter Tabs in Recommendations Screen
  const filterBtns = document.querySelectorAll('.filter-tab-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter;
      renderRecommendations();
    });
  });
}

// Mood Registration Form Logic (Bidirectional Slider <-> Cards)
function initMoodForm() {
  const moodCards = document.querySelectorAll('.mood-card');
  const intensitySlider = document.getElementById('intensity-slider');
  const intensityVal = document.getElementById('intensity-val');
  const nlpTextarea = document.getElementById('nlp-textarea');
  const detectedTagsContainer = document.getElementById('detected-tags');

  // Helper to visually update active mood card and body attribute
  function updateMoodCardVisual(moodKey) {
    state.selectedMood = moodKey;
    moodCards.forEach(card => {
      card.classList.toggle('selected', card.dataset.mood === moodKey);
    });
    document.body.setAttribute('data-active-mood', moodKey);
    renderWeeklyCalendar();
  }

  // 1. Card Click -> Update Slider to Midpoint (Card to Slider)
  moodCards.forEach(card => {
    card.addEventListener('click', () => {
      const moodKey = card.dataset.mood;
      updateMoodCardVisual(moodKey);

      // Set slider to midpoint of range
      const midpoint = MOOD_MIDPOINTS[moodKey] !== undefined ? MOOD_MIDPOINTS[moodKey] : 70;
      state.intensity = midpoint;
      if (intensitySlider) intensitySlider.value = midpoint;
      if (intensityVal) intensityVal.textContent = `${midpoint}/100`;
      renderWeeklyCalendar();
    });
  });

  // 2. Slider Drag -> Auto Select Mood Card per Range (Slider to Card)
  if (intensitySlider) {
    intensitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.intensity = val;
      if (intensityVal) intensityVal.textContent = `${val}/100`;

      // Map range to mood and highlight card
      const targetMood = getMoodFromIntensity(val);
      updateMoodCardVisual(targetMood);
      renderWeeklyCalendar();
    });
  }

  // 3. Keyword Sentiment Analyzer
  if (nlpTextarea) {
    nlpTextarea.addEventListener('input', (e) => {
      const text = e.target.value.toLowerCase();
      state.nlpText = e.target.value;
      
      const detectedKeywords = [];
      Object.keys(KEYWORD_MAP).forEach(kw => {
        if (text.includes(kw)) {
          detectedKeywords.push(kw);
          const suggestedMood = KEYWORD_MAP[kw];
          if (suggestedMood && state.selectedMood !== suggestedMood) {
            updateMoodCardVisual(suggestedMood);
            const midpoint = MOOD_MIDPOINTS[suggestedMood] || 70;
            state.intensity = midpoint;
            if (intensitySlider) intensitySlider.value = midpoint;
            if (intensityVal) intensityVal.textContent = `${midpoint}/100`;
          }
        }
      });

      // Render Detected Tags
      if (detectedTagsContainer) {
        detectedTagsContainer.innerHTML = detectedKeywords.map(kw => `
          <span class="keyword-tag">✨ ${kw} &rarr; ${MOOD_DATA[KEYWORD_MAP[kw]]?.label}</span>
        `).join('');
      }
      renderWeeklyCalendar();
    });
  }

  // Acción principal -> Guardar la entrada y actualizar historial/estadísticas
  const btnSaveMood = document.getElementById('btn-save-mood');
  const saveFeedback = document.getElementById('save-feedback');

  function showSaveFeedback(message, type) {
    if (!saveFeedback) return;
    saveFeedback.textContent = message || '';
    saveFeedback.className = 'save-feedback' + (type ? ' save-feedback-' + type : '');
  }

  function setSaving(isSaving) {
    if (!btnSaveMood) return;
    btnSaveMood.disabled = isSaving;
    btnSaveMood.innerHTML = isSaving
      ? '<i class="ph ph-circle-notch"></i> Guardando…'
      : '<i class="ph ph-check-circle"></i> Guardar Estado de Ánimo';
  }

  if (btnSaveMood) {
    btnSaveMood.addEventListener('click', async () => {
      const currentMoodObj = MOOD_DATA[state.selectedMood] || MOOD_DATA.relax;
      const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        moodKey: state.selectedMood,
        moodLabel: currentMoodObj.label,
        emoji: currentMoodObj.emoji,
        intensity: state.intensity,
        note: state.nlpText || 'Registro sin notas adicionales'
      };

      // 1) Actualiza el estado local de inmediato (historial y estadísticas)
      state.history.unshift(newEntry);
      state.habits = currentMoodObj.habits.map(h => ({ ...h }));

      setSaving(true);
      showSaveFeedback('', '');

      // 2) Persiste: Appwrite si hay sesión; si no, localStorage
      let result = { saved: true, remote: false, error: null };
      try {
        if (window.AnisamBackend) {
          result = await window.AnisamBackend.onEntryAdded(newEntry);
        } else {
          localStorage.setItem('anisam_history', JSON.stringify(state.history));
        }
      } catch (err) {
        console.error('[ANISAM] Error al guardar el registro:', err);
        result = { saved: false, remote: false, error: err };
      }

      // 3) Refresca historial, estadísticas y calendario
      renderWeeklyCalendar();
      renderHistory();
      renderInsights();
      renderHabits();

      setSaving(false);

      if (!result.saved) {
        showSaveFeedback('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.', 'error');
        return;
      }

      if (window.AnisamBackend && window.AnisamBackend.getUser && window.AnisamBackend.getUser() && !result.remote) {
        showSaveFeedback('Guardado en este dispositivo. Se sincronizará con tu cuenta cuando haya conexión.', 'warn');
      } else {
        showSaveFeedback('¡Estado de ánimo guardado! ' + currentMoodObj.emoji + ' ' + currentMoodObj.label, 'ok');
      }

      // 4) Limpia el campo de nota para el siguiente registro
      state.nlpText = '';
      if (nlpTextarea) nlpTextarea.value = '';
      if (detectedTagsContainer) detectedTagsContainer.innerHTML = '';
    });
  }
}

// Data Query Helpers
function getSongsForMood(moodKey) {
  const currentMoodObj = MOOD_DATA[moodKey] || MOOD_DATA.relax;
  let targetMoodName = currentMoodObj.label;
  if (targetMoodName === 'Con Energía') targetMoodName = 'Energia';

  if (typeof songsCatalog !== 'undefined' && Array.isArray(songsCatalog)) {
    const matched = songsCatalog.filter(s => s.mood === targetMoodName);
    if (matched.length) return matched;
  }
  return [];
}

function getMoviesForMood(moodKey) {
  const currentMoodObj = MOOD_DATA[moodKey] || MOOD_DATA.relax;
  let targetMoodName = currentMoodObj.label;
  if (targetMoodName === 'Con Energía') targetMoodName = 'Energia';

  if (typeof moviesCatalog !== 'undefined' && Array.isArray(moviesCatalog)) {
    const matched = moviesCatalog.filter(m => m.mood === targetMoodName);
    if (matched.length) return matched;
  }
  return [];
}

// Render Recommendations (Screen 3)
function renderRecommendations() {
  const currentMood = MOOD_DATA[state.selectedMood] || MOOD_DATA.relax;
  
  // Header details update
  const activeMoodIcon = document.getElementById('active-mood-icon');
  const activeMoodTitle = document.getElementById('active-mood-title');
  const activeMoodDesc = document.getElementById('active-mood-desc');

  if (activeMoodIcon) activeMoodIcon.textContent = currentMood.emoji;
  if (activeMoodTitle) activeMoodTitle.textContent = `Modo Emocional: ${currentMood.label}`;
  if (activeMoodDesc) activeMoodDesc.textContent = `Intensidad: ${state.intensity}/100 • ${currentMood.description}`;

  // Container Elements
  const twoColLayout = document.getElementById('recs-two-col-layout');
  const musicSection = document.getElementById('music-section-container');
  const musicGrid = document.getElementById('music-grid-container');
  const cinemaSection = document.getElementById('cinema-section-container');
  const mediaGrid = document.getElementById('media-grid-container');

  // Filter Handling
  const showMusic = state.activeFilter === 'all' || state.activeFilter === 'music';
  const showMovies = state.activeFilter === 'all' || state.activeFilter === 'movies';
  const isAllFilter = state.activeFilter === 'all';

  // Toggle layout: two-column for "all", single wide for individual filters
  if (twoColLayout) {
    twoColLayout.classList.toggle('single-section', !isAllFilter);
  }

  // Show/hide sections
  if (musicSection) musicSection.style.display = showMusic ? 'flex' : 'none';
  if (cinemaSection) cinemaSection.style.display = showMovies ? 'flex' : 'none';

  // Render Music Cards
  const moodSongs = getSongsForMood(state.selectedMood);
  if (musicGrid && showMusic) {
    // In two-col mode: stacked column. In single filter: multi-column grid via CSS class
    musicGrid.innerHTML = moodSongs.map((s, idx) => {
      const titleText = s.title || 'Canción';
      const yearText = s.year ? ` (${s.year})` : '';
      const matchPct = s.match || `${Math.max(90, 99 - (idx % 5))}%`;
      const genreText = s.genre || 'Música Relajante';
      const artistText = s.artist || 'Artista no especificado';
      const albumText = s.album || 'Álbum / Sencillo';
      const vibeText = s.vibe || s.mood || 'Relajación y Concentración';
      const descText = s.description || 'Una pista ideal para relajarte, bajar el ritmo y concentrarte sin distracciones.';
      const coverUrl = resolveCover(s, s.mood || state.selectedMood);
      const isSaved = isFavoriteSaved('song', s);

      return `
        <div class="media-card">
          <div class="media-card-cover">
            <img ${coverImgAttrs(coverUrl, titleText)} />
            <span class="media-card-cover-badge">🎵 Relajación</span>
          </div>
          <div class="media-card-body">
            <div class="media-card-top-header">
              <h4 class="media-card-title">${escapeHtml(titleText)}${yearText}</h4>
              <span class="match-badge-inline">${matchPct} de afinidad</span>
            </div>

            <div class="media-meta-tags">
              <span class="genre-badge-inline">🎵 ${escapeHtml(genreText)}</span>
            </div>
            
            <div class="media-details-block">
              <p class="media-detail-line"><strong>👤 Artista / Banda:</strong> ${escapeHtml(artistText)}</p>
              <p class="media-detail-line"><strong>💿 Álbum:</strong> ${escapeHtml(albumText)}</p>
              <p class="media-detail-line"><strong>💡 Tema / Vibra:</strong> ${escapeHtml(vibeText)}</p>
            </div>

            <p class="media-synopsis">${escapeHtml(descText)}</p>

            <div class="media-card-footer" style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-glass);">
              <button class="ag-btn ${isSaved ? 'ag-btn-secondary' : 'ag-btn-primary'} ag-btn-sm btn-save-favorite" data-favorite-type="song" data-favorite-index="${idx}" aria-pressed="${isSaved}" style="width: 100%;">
                ${isSaved ? '✓ Guardado' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Movie Cards
  if (mediaGrid && showMovies) {
    const filteredMedia = getMoviesForMood(state.selectedMood).filter(m => m.type === 'movie');
    mediaGrid.innerHTML = filteredMedia.map((m, idx) => {
      const titleText = m.title || m.titulo || 'Película';
      const descText = m.description || m.synopsis || 'Sin descripción disponible';
      const platformText = m.platform || 'Streaming';
      const directorText = m.director || 'No especificado';
      const actorsText = m.actors || 'Elenco estelar';
      const themeText = m.theme || m.genre || 'Entretenimiento';
      const coverUrl = resolveCover(m, m.mood || state.selectedMood);
      const isSaved = isFavoriteSaved('movie', m);

      return `
        <div class="media-card">
          <div class="media-card-cover">
            <img ${coverImgAttrs(coverUrl, titleText)} />
            <span class="media-card-cover-badge">🎬 Película</span>
          </div>
          <div class="media-card-body">
            <div class="media-card-top-header">
              <h4 class="media-card-title">${escapeHtml(titleText)} (${m.year || 2023})</h4>
              <span class="match-badge-inline">${m.match || '96%'} de afinidad</span>
            </div>

            <div class="media-meta-tags">
              <span>🎬 Película</span>
              <span>•</span>
              <span>${m.duration || '2h'}</span>
              <span>•</span>
              <span class="platform-badge">📺 ${escapeHtml(platformText)}</span>
            </div>
            
            <div class="media-details-block">
              <p class="media-detail-line"><strong>🎬 Director:</strong> ${escapeHtml(directorText)}</p>
              <p class="media-detail-line"><strong>🎭 Actores:</strong> ${escapeHtml(actorsText)}</p>
              <p class="media-detail-line"><strong>💡 Tema:</strong> ${escapeHtml(themeText)}</p>
            </div>

            <p class="media-synopsis">${escapeHtml(descText)}</p>

            <div class="media-card-footer" style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-glass);">
              <button class="ag-btn ${isSaved ? 'ag-btn-secondary' : 'ag-btn-primary'} ag-btn-sm btn-save-favorite" data-favorite-type="movie" data-favorite-index="${idx}" aria-pressed="${isSaved}" style="width: 100%;">
                ${isSaved ? '✓ Guardado' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function getFavoriteId(type, item) {
  const title = item.title || item.titulo || '';
  const detail = type === 'song' ? item.artist || '' : item.year || '';
  return `${type}:${title}:${detail}`;
}

function isFavoriteSaved(type, item) {
  const id = getFavoriteId(type, item);
  return state.favorites.some(favorite => getFavoriteId(favorite.type, favorite.item) === id);
}

function saveFavorites() {
  try {
    localStorage.setItem('anisam_favorites', JSON.stringify(state.favorites));
    state.favoriteStorageError = null;
    return true;
  } catch (err) {
    console.error('[ANISAM] No se pudieron guardar los favoritos:', err);
    state.favoriteStorageError = 'No se pudieron guardar los cambios. Revisa el espacio disponible en tu navegador.';
    return false;
  }
}

function renderFavorites() {
  const grid = document.getElementById('favorites-grid');
  const feedback = document.getElementById('favorites-feedback');
  if (!grid || !feedback) return;

  feedback.textContent = state.favoriteStorageError || '';
  feedback.classList.toggle('has-error', Boolean(state.favoriteStorageError));

  if (state.favorites.length === 0) {
    grid.innerHTML = '<p class="favorites-empty">Aún no has guardado ningún favorito.</p>';
    return;
  }

  grid.innerHTML = state.favorites.map((favorite, index) => {
    const item = favorite.item;
    const isSong = favorite.type === 'song';
    const title = item.title || item.titulo || (isSong ? 'Canción' : 'Película');
    const coverUrl = resolveCover(item, item.mood || 'Relax');
    const description = item.description || item.synopsis || 'Sin descripción disponible.';
    const details = isSong
      ? `<p class="media-detail-line"><strong>👤 Artista:</strong> ${escapeHtml(item.artist || 'No especificado')}</p>
         <p class="media-detail-line"><strong>💿 Álbum:</strong> ${escapeHtml(item.album || 'No especificado')}</p>`
      : `<p class="media-detail-line"><strong>🎬 Director:</strong> ${escapeHtml(item.director || 'No especificado')}</p>
         <p class="media-detail-line"><strong>📅 Año:</strong> ${escapeHtml(item.year || 'No especificado')}</p>`;

    return `
      <article class="media-card">
        <div class="media-card-cover">
          <img ${coverImgAttrs(coverUrl, title)} />
          <span class="media-card-cover-badge">${isSong ? '🎵 Canción' : '🎬 Película'}</span>
        </div>
        <div class="media-card-body">
          <h4 class="media-card-title">${escapeHtml(title)}${item.year ? ` (${escapeHtml(item.year)})` : ''}</h4>
          <div class="media-details-block">${details}</div>
          <p class="media-synopsis">${escapeHtml(description)}</p>
          <div class="media-card-footer">
            <button class="ag-btn ag-btn-secondary ag-btn-sm btn-remove-favorite" data-favorite-index="${index}" style="width: 100%;">
              Quitar de Guardados
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Delegation Event Listeners for Music and Movie Card Actions
function initMediaGridEvents() {
  const musicGrid = document.getElementById('music-grid-container');
  const mediaGrid = document.getElementById('media-grid-container');
  const favoritesGrid = document.getElementById('favorites-grid');

  const handleGridClick = (e) => {
    const saveBtn = e.target.closest('.btn-save-favorite');
    if (saveBtn) {
      const type = saveBtn.dataset.favoriteType;
      const index = Number(saveBtn.dataset.favoriteIndex);
      const items = type === 'song'
        ? getSongsForMood(state.selectedMood)
        : getMoviesForMood(state.selectedMood).filter(item => item.type === 'movie');
      const item = items[index];
      if (!item || (type !== 'song' && type !== 'movie')) return;

      const id = getFavoriteId(type, item);
      const existingIndex = state.favorites.findIndex(favorite =>
        getFavoriteId(favorite.type, favorite.item) === id
      );
      if (existingIndex >= 0) return;

      const previousFavorites = state.favorites;
      state.favorites = [...state.favorites, {
        type,
        item: {
          ...item,
          poster: resolveCover(item, item.mood || state.selectedMood)
        }
      }];
      if (!saveFavorites()) state.favorites = previousFavorites;
      renderRecommendations();
      renderFavorites();
      return;
    }

    const removeBtn = e.target.closest('.btn-remove-favorite');
    if (removeBtn) {
      const index = Number(removeBtn.dataset.favoriteIndex);
      if (!Number.isInteger(index) || index < 0 || index >= state.favorites.length) return;

      const previousFavorites = state.favorites;
      state.favorites = state.favorites.filter((_, favoriteIndex) => favoriteIndex !== index);
      if (!saveFavorites()) state.favorites = previousFavorites;
      renderRecommendations();
      renderFavorites();
    }
  };

  if (musicGrid) musicGrid.addEventListener('click', handleGridClick);
  if (mediaGrid) mediaGrid.addEventListener('click', handleGridClick);
  if (favoritesGrid) favoritesGrid.addEventListener('click', handleGridClick);
}

// Utility Escapers
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ==========================================================================
// Imágenes y portadas: carga segura con respaldo elegante
// ==========================================================================

/**
 * Asigna una portada a un <img> y garantiza que, si falla la carga,
 * se muestre automáticamente la portada de respaldo (SVG local).
 */
function setCover(imgEl, url, alt) {
  if (!imgEl) return;
  const safeUrl = url || FALLBACK_COVER;
  const safeAlt = alt || 'Portada de contenido';

  imgEl.setAttribute('loading', 'lazy');
  imgEl.setAttribute('decoding', 'async');
  if (safeAlt) imgEl.alt = safeAlt;
  imgEl.dataset.fallback = FALLBACK_COVER;

  // Si la URL cambia respecto a la actual, reinicia el estado de error
  if (imgEl.getAttribute('src') !== safeUrl) {
    imgEl.classList.remove('img-loading', 'img-failed');
    imgEl.classList.add('img-loading');
    imgEl.removeAttribute('data-failed');
    imgEl.src = safeUrl;
  }
}

/**
 * Manejador global para <img>: si una imagen no carga (red externa caída,
 * archivo ausente, etc.) se reemplaza por la portada de respaldo. Si la de
 * respaldo también fallara, se oculta y se marca como fallida para que el
 * contenedor muestre su fondo decorativo.
 */
function handleImageError(img) {
  if (!img || img.dataset.failed === 'true') {
    // La imagen de respaldo tampoco cargó: se oculta limpiamente.
    if (img) {
      img.classList.add('img-failed');
      img.classList.remove('img-loading');
      img.style.visibility = 'hidden';
      img.setAttribute('aria-hidden', 'true');
    }
    return;
  }

  img.dataset.failed = 'true';
  const fallback = img.dataset.fallback || FALLBACK_COVER;

  if (img.getAttribute('src') !== fallback) {
    img.src = fallback;
  } else {
    // Ya era la de respaldo y falló: se oculta sin mostrar el icono roto.
    img.classList.add('img-failed');
    img.classList.remove('img-loading');
    img.style.visibility = 'hidden';
    img.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Activa el manejo de errores de imágenes de forma global (delegación por
 * eventos en fase de captura, ya que "error" no burbujea).
 */
function initImageFallbacks() {
  document.addEventListener(
    'error',
    function (event) {
      const target = event.target;
      if (target && target.tagName === 'IMG') {
        handleImageError(target);
      }
    },
    true // captura: imprescindible para el evento 'error' de las imágenes
  );

  // Marca como cargadas las que ya lo estén y quita el estado "loading"
  document.addEventListener(
    'load',
    function (event) {
      const target = event.target;
      if (target && target.tagName === 'IMG') {
        target.classList.remove('img-loading', 'img-failed');
      }
    },
    true
  );
}

// Audio Synthesizer Controls
function initAudioPlayer() {
  const playBtn = document.getElementById('play-toggle-btn');
  const canvas = document.getElementById('visualizer-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bars = 30;
    const barWidth = canvas.width / bars;

    for (let i = 0; i < bars; i++) {
      const height = state.isPlayingAudio 
        ? Math.random() * (canvas.height - 10) + 10 
        : 6;
      ctx.fillStyle = state.isPlayingAudio ? MOOD_DATA[state.selectedMood]?.color || '#8ab8e8' : '#71839a';
      ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 3, height);
    }
  }
  drawVisualizer();

  if (playBtn) {
    playBtn.addEventListener('click', toggleAudio);
  }
}

function toggleAudio() {
  const playBtn = document.getElementById('play-toggle-btn');
  if (state.isPlayingAudio) {
    stopAudioSynth();
    if (playBtn) playBtn.innerHTML = '▶';
  } else {
    startAudioSynth(440);
    if (playBtn) playBtn.innerHTML = '⏸';
  }
}

function startAudioSynth(frequency) {
  try {
    if (!state.audioCtx) {
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (state.oscillator) {
      state.oscillator.stop();
    }

    state.oscillator = state.audioCtx.createOscillator();
    state.gainNode = state.audioCtx.createGain();

    state.oscillator.type = 'sine';
    state.oscillator.frequency.setValueAtTime(frequency || 440, state.audioCtx.currentTime);

    state.gainNode.gain.setValueAtTime(0.1, state.audioCtx.currentTime);
    state.oscillator.connect(state.gainNode);
    state.gainNode.connect(state.audioCtx.destination);

    state.oscillator.start();
    state.isPlayingAudio = true;
  } catch (err) {
    console.log('Audio Context error', err);
  }
}

function stopAudioSynth() {
  if (state.oscillator) {
    state.oscillator.stop();
    state.oscillator = null;
  }
  state.isPlayingAudio = false;
}

function selectTrack(title, artist, cover, freq) {
  const titleEl = document.getElementById('player-track-title');
  const artistEl = document.getElementById('player-track-artist');
  const coverEl = document.getElementById('player-cover-img');
  const playBtn = document.getElementById('play-toggle-btn');

  if (titleEl) titleEl.textContent = title;
  if (artistEl) artistEl.textContent = artist;
  if (coverEl) coverEl.src = cover;
  
  startAudioSynth(freq);
  if (playBtn) playBtn.innerHTML = '⏸';
}

// User Panel: Habits Checklist
function renderHabits() {
  const habitListEl = document.getElementById('habit-list-container');
  const progressFill = document.getElementById('habits-progress-fill');
  if (!habitListEl) return;

  if (state.habits.length === 0) {
    const currentMoodObj = MOOD_DATA[state.selectedMood] || MOOD_DATA.relax;
    state.habits = currentMoodObj.habits.map(h => ({ ...h }));
  }

  const completedCount = state.habits.filter(h => h.done).length;
  const pct = Math.round((completedCount / state.habits.length) * 100);
  if (progressFill) progressFill.style.width = `${pct}%`;

  habitListEl.innerHTML = state.habits.map(h => `
    <div class="habit-item ${h.done ? 'completed' : ''}" data-habit-id="${h.id}">
      <div class="habit-checkbox">${h.done ? '✓' : ''}</div>
      <span>${escapeHtml(h.text)}</span>
    </div>
  `).join('');

  habitListEl.onclick = (e) => {
    const item = e.target.closest('.habit-item');
    if (!item) return;
    const id = item.dataset.habitId;
    state.habits = state.habits.map(h => h.id === id ? { ...h, done: !h.done } : h);
    renderHabits();
  };
}

// User Panel: Clear history (local + Appwrite)
function clearHistory() {
  const confirmed = window.confirm('¿Borrar todo tu historial de estados de ánimo? Esta acción no se puede deshacer.');
  if (!confirmed) return;

  state.history = [];

  if (window.AnisamBackend) {
    window.AnisamBackend.clearEntries();
  } else {
    localStorage.removeItem('anisam_history');
  }

  renderHistory();
  renderInsights();
  renderWeeklyCalendar();
}

// User Panel: Render History Timeline
function renderHistory() {
  const timelineEl = document.getElementById('timeline-list-container');
  if (!timelineEl) return;

  if (state.history.length === 0) {
    timelineEl.innerHTML = `<p style="color: var(--text-dim); text-align: center; padding: 2rem;">No hay registros emocionales aún. ¡Registra cómo te sientes hoy!</p>`;
    return;
  }

  timelineEl.innerHTML = state.history.map(item => `
    <div class="timeline-item">
      <div class="timeline-emoji">${item.emoji}</div>
      <div class="timeline-details">
        <h5>${escapeHtml(item.moodLabel)} (Intensidad: ${item.intensity}/100)</h5>
        <p>${escapeHtml(item.note)}</p>
        <span style="font-size: 0.7rem; color: var(--text-dim);">${escapeHtml(item.date)}</span>
      </div>
    </div>
  `).join('');
}

// User Panel: Insights Analytics Charts
function renderInsights() {
  const donutCanvas = document.getElementById('donutChartCanvas');
  const trendCanvas = document.getElementById('trendChartCanvas');
  const balanceVal = document.getElementById('balance-score-val');
  const balanceCaption = document.getElementById('balance-score-caption');
  const moodLegend = document.getElementById('mood-distribution-legend');
  const trendEmpty = document.getElementById('trend-chart-empty');
  const history = (state.history || []).filter(function (entry) {
    return !!entry && typeof entry === 'object';
  });
  const intensityEntries = history.filter(function (entry) {
    const intensity = Number(entry && entry.intensity);
    return Number.isFinite(intensity) && intensity >= 0 && intensity <= 100;
  });

  if (balanceVal) {
    if (intensityEntries.length) {
      const average = intensityEntries.reduce(function (total, entry) {
        return total + Number(entry.intensity);
      }, 0) / intensityEntries.length;
      balanceVal.textContent = `${Math.round(average * 10) / 10}/100`;
      if (balanceCaption) {
        balanceCaption.textContent = `Intensidad promedio de ${intensityEntries.length} ${intensityEntries.length === 1 ? 'registro' : 'registros'} (0–100).`;
      }
    } else {
      balanceVal.textContent = '—';
      if (balanceCaption) balanceCaption.textContent = 'Aún no hay registros para calcular el promedio.';
    }
  }

  if (donutCanvas && window.Chart) {
    if (window.donutChartInstance) window.donutChartInstance.destroy();

    const moodCounts = new Map();
    history.forEach(function (entry) {
      const category = getMoodCategory(entry);
      const current = moodCounts.get(category.key) || { label: category.label, count: 0 };
      current.count++;
      moodCounts.set(category.key, current);
    });

    const moods = Array.from(moodCounts.entries()).map(function (item) {
      return { key: item[0], label: item[1].label, count: item[1].count };
    });
    const knownOrder = Object.keys(MOOD_DATA);
    moods.sort(function (a, b) {
      const aIndex = knownOrder.indexOf(a.key);
      const bIndex = knownOrder.indexOf(b.key);
      if (aIndex !== -1 || bIndex !== -1) {
        return (aIndex === -1 ? knownOrder.length : aIndex) - (bIndex === -1 ? knownOrder.length : bIndex);
      }
      return a.label.localeCompare(b.label, 'es');
    });

    const moodColors = ['#a1c7ec', '#789fc8', '#83addb', '#91bdcf', '#9cafe0', '#718ba9'];
    const colors = moods.map(function (mood, index) {
      return MOOD_DATA[mood.key] ? MOOD_DATA[mood.key].color : moodColors[index % moodColors.length];
    });

    window.donutChartInstance = new Chart(donutCanvas, {
      type: 'doughnut',
      data: {
        labels: moods.map(function (mood) { return mood.label; }),
        datasets: [{
          data: moods.map(function (mood) { return mood.count; }),
          backgroundColor: colors,
          borderColor: '#132439',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                const count = Number(context.raw) || 0;
                const percentage = history.length ? (count / history.length) * 100 : 0;
                return `${context.label}: ${count} (${percentage.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)`;
              }
            }
          }
        }
      }
    });

    if (moodLegend) {
      moodLegend.replaceChildren();
      if (!moods.length) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'chart-empty';
        emptyMessage.textContent = 'Aún no hay registros emocionales.';
        moodLegend.appendChild(emptyMessage);
      } else {
        moods.forEach(function (mood, index) {
          const row = document.createElement('div');
          row.className = 'chart-legend-item';

          const label = document.createElement('span');
          label.className = 'chart-legend-label';
          const swatch = document.createElement('span');
          swatch.className = 'chart-legend-swatch';
          swatch.style.backgroundColor = colors[index];
          const name = document.createElement('span');
          name.textContent = mood.label;
          label.append(swatch, name);

          const count = document.createElement('span');
          count.className = 'chart-legend-count';
          count.textContent = String(mood.count);

          const percentage = document.createElement('span');
          percentage.className = 'chart-legend-percentage';
          percentage.textContent = `${((mood.count / history.length) * 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

          row.append(label, count, percentage);
          moodLegend.appendChild(row);
        });
      }
    }
  }

  if (trendCanvas && window.Chart) {
    if (window.trendChartInstance) window.trendChartInstance.destroy();

    const chronologicalEntries = intensityEntries.map(function (entry, index) {
      const date = getEntryDate(entry);
      return { entry: entry, index: index, date: date };
    }).sort(function (a, b) {
      const aTime = a.date ? a.date.getTime() : Number(a.entry.id) || a.index;
      const bTime = b.date ? b.date.getTime() : Number(b.entry.id) || b.index;
      return aTime - bTime;
    });
    const labels = chronologicalEntries.map(function (item) {
      if (!item.date) return item.entry.date || 'Registro';
      return item.date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    });
    const dataVals = chronologicalEntries.map(function (item) {
      return Number(item.entry.intensity);
    });
    const minValue = dataVals.length ? Math.min.apply(null, dataVals) : 0;
    const maxValue = dataVals.length ? Math.max.apply(null, dataVals) : 100;
    const padding = dataVals.length ? Math.max(5, (maxValue - minValue) * 0.1) : 0;
    const yMin = dataVals.length ? Math.max(0, minValue - padding) : 0;
    const yMax = dataVals.length ? Math.min(100, maxValue + padding) : 100;
    if (trendEmpty) trendEmpty.hidden = dataVals.length > 0;

    window.trendChartInstance = new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Intensidad',
          data: dataVals,
          borderColor: '#8ab8e8',
          backgroundColor: 'rgba(138, 184, 232, 0.12)',
          fill: true,
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#aabbd0' },
            grid: { color: 'rgba(166, 194, 224, 0.08)' }
          },
          y: {
            min: yMin,
            max: yMax,
            ticks: { color: '#aabbd0' },
            grid: { color: 'rgba(166, 194, 224, 0.08)' }
          }
        }
      }
    });
  }
}

function getMoodCategory(entry) {
  function normalize(value) {
    return String(value || '')
      .trim()
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');
  }

  const aliases = { 'con energia': 'energia' };
  function normalizeMoodName(value) {
    const normalized = normalize(value);
    return aliases[normalized] || normalized;
  }

  const normalizedKey = normalizeMoodName(entry.moodKey);
  const normalizedLabel = normalizeMoodName(entry.moodLabel);
  const knownKey = MOOD_DATA[normalizedKey] ? normalizedKey : null;
  const knownLabel = Object.keys(MOOD_DATA).find(function (moodKey) {
    return normalizeMoodName(MOOD_DATA[moodKey].label) === normalizedLabel;
  });
  const moodKey = knownLabel || knownKey;

  if (moodKey) return { key: moodKey, label: MOOD_DATA[moodKey].label };

  const categoryLabel = String(entry.moodLabel || entry.moodKey || 'Sin categoría').trim();
  return {
    key: 'custom:' + normalize(categoryLabel),
    label: categoryLabel || 'Sin categoría'
  };
}

// Modal Dialog Helpers
function openTrailerModal(title) {
  const modal = document.getElementById('trailer-modal');
  const modalTitle = document.getElementById('modal-media-title');
  if (modalTitle) modalTitle.textContent = `Tráiler: ${title}`;
  if (modal) modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('trailer-modal');
  if (modal) modal.classList.remove('active');
}
