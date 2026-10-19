/**
 * ANISAM (Moodly) - Core Application Logic
 * Navigation SPA, Sentiment NLP Analyzer, Audio Synthesizer & Dynamic Recommendations Engine
 */

// Global Application State
const state = {
  activeScreen: 'screen-welcome',
  selectedMood: 'feliz',
  intensity: 70,
  nlpText: '',
  activeFilter: 'all',
  habits: [],
  history: JSON.parse(localStorage.getItem('anisam_history') || '[]'),
  playingTrack: null,
  audioCtx: null,
  oscillator: null,
  gainNode: null,
  isPlayingAudio: false
};

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
const MOOD_COVERS = {
  Feliz: 'assets/happy_series_poster.png',
  Triste: 'assets/movie_poster_echoes.png',
  Energia: 'assets/energetic_synth_art.png',
  Relax: 'assets/chill_lofi_art.png',
  Entretenido: 'assets/happy_series_poster.png'
};

// Emotional Dataset Configuration & Daily Habits
const MOOD_DATA = {
  feliz: {
    label: 'Feliz',
    emoji: '😊',
    color: '#f59e0b',
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
    color: '#3b82f6',
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
    color: '#ec4899',
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
    color: '#10b981',
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
    color: '#8b5cf6',
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

// Sample Weekly History Logs (Lun - Dom)
const DEFAULT_WEEKLY_LOGS = [
  { day: 'Lun', moodKey: 'relax', moodLabel: 'Relax', emoji: '🧘', intensity: 8, song: 'Weightless', movie: 'Mi vecino Totoro', note: 'Meditación y tranquilidad' },
  { day: 'Mar', moodKey: 'feliz', moodLabel: 'Feliz', emoji: '😊', intensity: 9, song: 'Walking on Sunshine', movie: 'Amigos (Intouchables)', note: 'Gran reunión con amigos' },
  { day: 'Mié', moodKey: 'entretenido', moodLabel: 'Entretenido', emoji: '🎬', intensity: 7, song: 'Blinding Lights', movie: 'La La Land', note: 'Tarde de música y cine' },
  { day: 'Jue', moodKey: 'energia', moodLabel: 'Con Energía', emoji: '⚡', intensity: 8, song: 'Eye of the Tiger', movie: 'Top Gun: Maverick', note: 'Entrenamiento intenso' },
  { day: 'Vie', moodKey: 'triste', moodLabel: 'Triste', emoji: '😔', intensity: 6, song: 'Fix You', movie: 'Manchester junto al mar', note: 'Reflexión y calma' },
  { day: 'Sáb', moodKey: 'relax', moodLabel: 'Relax', emoji: '🧘', intensity: 8, song: 'Gymnopédie No. 1', movie: 'El viaje de Chihiro', note: 'Paseo al atardecer' },
  { day: 'Dom', moodKey: 'feliz', moodLabel: 'Feliz', emoji: '😊', intensity: 7, song: 'Good Vibrations', movie: 'Soul', note: 'Registro actual de hoy', isToday: true }
];

// Application Bootstrapper
document.addEventListener('DOMContentLoaded', () => {
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

  const topSong = songs.length ? songs[0] : { title: 'Zen Meditation & Lofi', artist: 'Mindful Soundscapes', match: '99%', mood: 'Relax' };
  const topMovie = movies.length ? movies[0] : { title: 'Echoes of Calm', genre: 'Cine Indie', duration: '1h 45m', mood: 'Relax' };

  // Sync today's entry (Dom) with current selected mood state
  const todayIndex = 6;
  if (DEFAULT_WEEKLY_LOGS[todayIndex]) {
    DEFAULT_WEEKLY_LOGS[todayIndex].moodKey = state.selectedMood;
    DEFAULT_WEEKLY_LOGS[todayIndex].moodLabel = currentMoodObj.label;
    DEFAULT_WEEKLY_LOGS[todayIndex].emoji = currentMoodObj.emoji;
    DEFAULT_WEEKLY_LOGS[todayIndex].intensity = Math.round(state.intensity / 10);
    DEFAULT_WEEKLY_LOGS[todayIndex].song = topSong.title;
    DEFAULT_WEEKLY_LOGS[todayIndex].movie = topMovie.title || topMovie.titulo;
    DEFAULT_WEEKLY_LOGS[todayIndex].note = state.nlpText || 'Registro actual de hoy';
  }

  // Update hero badge
  if (badgeEl) {
    badgeEl.textContent = `${currentMoodObj.emoji} Estado Actual: ${currentMoodObj.label} (${Math.round(state.intensity / 10)}/10)`;
  }

  // Update hero mini preview cards
  if (songTitleEl) songTitleEl.textContent = topSong.title;
  if (songDescEl) songDescEl.textContent = `${topSong.artist || topSong.genre} • ${topSong.match || '99% Match'}`;
  if (songImgEl && MOOD_COVERS[topSong.mood || currentMoodObj.label]) {
    songImgEl.src = MOOD_COVERS[topSong.mood || currentMoodObj.label];
  }

  if (movieTitleEl) movieTitleEl.textContent = topMovie.title || topMovie.titulo;
  if (movieDescEl) movieDescEl.textContent = `${topMovie.genre || 'Cine'} • ${topMovie.duration || '2h'}`;
  if (movieImgEl && MOOD_COVERS[topMovie.mood || currentMoodObj.label]) {
    movieImgEl.src = MOOD_COVERS[topMovie.mood || currentMoodObj.label];
  }

  // Render weekly pills widget
  if (container) {
    container.innerHTML = DEFAULT_WEEKLY_LOGS.map((item, idx) => {
      const moodColor = MOOD_DATA[item.moodKey]?.color || '#6366f1';
      const isToday = item.isToday;

      return `
        <div class="calendar-day-pill ${isToday ? 'today' : ''}" data-day-idx="${idx}" tabindex="0">
          <span class="day-name">${item.day}</span>
          <span class="day-emoji-badge" style="background: ${moodColor}33; border: 1px solid ${moodColor};">${item.emoji}</span>
          
          <div class="calendar-tooltip">
            <div class="tooltip-header">
              <span class="tooltip-day-badge">${item.day}${isToday ? ' (Hoy)' : ''}</span>
              <strong>${item.emoji} ${item.moodLabel} (${item.intensity}/10)</strong>
            </div>
            <div class="tooltip-body">
              <p>🎵 <strong>Música:</strong> ${escapeHtml(item.song)}</p>
              <p>🎬 <strong>Película:</strong> ${escapeHtml(item.movie)}</p>
              ${item.note ? `<p class="tooltip-note">💬 <em>"${escapeHtml(item.note)}"</em></p>` : ''}
            </div>
          </div>
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
  const btnGetRecs = document.getElementById('btn-get-recommendations');

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

  // Submit Action -> Move to Recommendations Screen & Log History
  if (btnGetRecs) {
    btnGetRecs.addEventListener('click', () => {
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

      state.history.unshift(newEntry);

      // Persistencia: Appwrite si está disponible; si no, localStorage
      if (window.AnisamBackend) {
        window.AnisamBackend.onEntryAdded(newEntry);
      } else {
        localStorage.setItem('anisam_history', JSON.stringify(state.history));
      }

      // Setup Today's Habits
      state.habits = currentMoodObj.habits.map(h => ({ ...h }));

      // Render Recommendations & Switch View
      renderWeeklyCalendar();
      renderRecommendations();
      switchScreen('screen-recommendations');
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
  if (activeMoodDesc) activeMoodDesc.textContent = `Intensidad: ${state.intensity}/10 • ${currentMood.description}`;

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
      const genreText = s.genre || 'Música';
      const artistText = s.artist || 'Artista no especificado';
      const albumText = s.album || 'Álbum / Sencillo';
      const vibeText = s.vibe || s.mood || 'Vibra Emocional';
      const descText = s.description || 'Una pista seleccionada especialmente para tu estado de ánimo actual.';

      return `
        <div class="media-card">
          <div class="media-card-body">
            <div class="media-card-top-header">
              <h4 class="media-card-title">${escapeHtml(titleText)}${yearText}</h4>
              <span class="match-badge-inline">${matchPct} Match</span>
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
              <button class="ag-btn ag-btn-primary ag-btn-sm btn-save-favorite" style="width: 100%;">
                💾 Guardar
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
    mediaGrid.innerHTML = filteredMedia.map(m => {
      const titleText = m.title || m.titulo || 'Película';
      const descText = m.description || m.synopsis || 'Sin descripción disponible';
      const platformText = m.platform || 'Streaming';
      const directorText = m.director || 'No especificado';
      const actorsText = m.actors || 'Elenco estelar';
      const themeText = m.theme || m.genre || 'Entretenimiento';

      return `
        <div class="media-card">
          <div class="media-card-body">
            <div class="media-card-top-header">
              <h4 class="media-card-title">${escapeHtml(titleText)} (${m.year || 2023})</h4>
              <span class="match-badge-inline">${m.match || '96%'} Match</span>
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
              <button class="ag-btn ag-btn-primary ag-btn-sm btn-save-favorite" style="width: 100%;">
                💾 Guardar
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}


// Delegation Event Listeners for Music and Movie Card Actions
function initMediaGridEvents() {
  const musicGrid = document.getElementById('music-grid-container');
  const mediaGrid = document.getElementById('media-grid-container');

  const handleGridClick = (e) => {
    const saveBtn = e.target.closest('.btn-save-favorite');
    if (saveBtn) {
      alert('¡Guardado en tus favoritos de ANISAM!');
    }
  };

  if (musicGrid) musicGrid.addEventListener('click', handleGridClick);
  if (mediaGrid) mediaGrid.addEventListener('click', handleGridClick);
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
      ctx.fillStyle = state.isPlayingAudio ? MOOD_DATA[state.selectedMood]?.color || '#6366f1' : '#4b5563';
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
        <h5>${escapeHtml(item.moodLabel)} (Intensidad: ${item.intensity}/10)</h5>
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

  if (balanceVal) {
    const score = Math.min(100, Math.max(60, 75 + (state.history.length * 2)));
    balanceVal.textContent = `${score}/100`;
  }

  if (donutCanvas && window.Chart) {
    if (window.donutChartInstance) window.donutChartInstance.destroy();

    const moodCounts = { Feliz: 0, Triste: 0, Energia: 0, Relax: 0, Entretenido: 0 };
    state.history.forEach(h => {
      const key = h.moodLabel || 'Relax';
      if (moodCounts[key] !== undefined) moodCounts[key]++;
      else moodCounts.Relax++;
    });

    window.donutChartInstance = new Chart(donutCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Feliz', 'Triste', 'Con Energía', 'Relax', 'Entretenido'],
        datasets: [{
          data: [moodCounts.Feliz || 1, moodCounts.Triste || 1, moodCounts.Energia || 1, moodCounts.Relax || 3, moodCounts.Entretenido || 2],
          backgroundColor: ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  if (trendCanvas && window.Chart) {
    if (window.trendChartInstance) window.trendChartInstance.destroy();

    const last5 = state.history.slice(0, 5).reverse();
    const labels = last5.map(h => h.date.split(',')[0]);
    const dataVals = last5.map(h => parseInt(h.intensity) || 7);

    window.trendChartInstance = new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
        datasets: [{
          label: 'Intensidad',
          data: dataVals.length ? dataVals : [6, 8, 5, 9, 7],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { min: 1, max: 10 } }
      }
    });
  }
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
