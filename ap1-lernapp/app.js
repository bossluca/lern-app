/* ═══════════════════════════════════════════════════════════
   AP1 Trainer – Premium Lern-App v2.0
   Quiz · Karteikarten · Spaced Repetition · Klausur-Simulator
   ═══════════════════════════════════════════════════════════ */

// ── Constants ──────────────────────────────────────────────
const STORAGE_KEY = 'ap1_trainer_data';
const STATS_KEY   = 'ap1_stats_v2';
const SR_KEY      = 'ap1_sr_data';
const EXAM_KEY    = 'ap1_exam_history';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '<path d="M4 13h6a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1zm0 8h6a1 1 0 001-1v-4a1 1 0 00-1-1H4a1 1 0 00-1 1v4a1 1 0 001 1zm10 0h6a1 1 0 001-1v-8a1 1 0 00-1-1h-6a1 1 0 00-1 1v8a1 1 0 001 1zM14 4v4a1 1 0 001 1h6a1 1 0 001-1V4a1 1 0 00-1-1h-6a1 1 0 00-1 1z"/>' },
  { id: 'learn',     label: 'Lernen',    icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>' },
  { id: 'flashcards',label: 'Karten',    icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M7 12h10v2H7zm0-4h10v2H7zm0 8h7v2H7z"/>' },
  { id: 'quiz',      label: 'Quiz',      icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>' },
  { id: 'exam',      label: 'Klausur',   icon: '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>' },
  { id: 'stats',     label: 'Stats',     icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>' },
];

// ── Helpers ────────────────────────────────────────────────
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v);
  }
  for (const c of children) {
    if (typeof c === 'string') el.appendChild(document.createTextNode(c));
    else if (c) el.appendChild(c);
  }
  return el;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function today() { return new Date().toISOString().split('T')[0]; }

function showToast(msg, type = 'info') {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = h('div', { className: `toast toast--${type}` }, msg);
  document.body.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 350);
  }, 2500);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function getAllQuestions(topicIndices) {
  const topics = store.getTopics();
  let qs = [];
  for (const i of topicIndices) {
    const t = topics[i];
    if (t && t.fragen) {
      for (const f of t.fragen) qs.push({ ...f, _topic: t.thema, _emoji: t.emoji || '📚' });
    }
  }
  return qs;
}

function getAllQuestionsWithIds(topicIndices) {
  const topics = store.getTopics();
  let qs = [];
  for (const i of topicIndices) {
    const t = topics[i];
    if (t && t.fragen) {
      t.fragen.forEach((f, fi) => {
        qs.push({ ...f, _topic: t.thema, _emoji: t.emoji || '📚', _id: `${i}_${fi}` });
      });
    }
  }
  return qs;
}

// ── Storage ────────────────────────────────────────────────
const store = {
  _data: null,
  load() { if (this._data) return this._data; const r = localStorage.getItem(STORAGE_KEY); this._data = r ? JSON.parse(r) : null; return this._data; },
  save(d) { this._data = d; localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); },
  getTopics() { return this.load() || []; },
  setTopics(t) { this.save(t); },
  reset() { localStorage.removeItem(STORAGE_KEY); this._data = null; }
};

// ── Stats Engine ───────────────────────────────────────────
const stats = {
  _d: null,
  _defaults() {
    return { streak: { current: 0, best: 0, lastDate: null }, daily: {}, exams: [], topicStats: {} };
  },
  load() {
    if (this._d) return this._d;
    const r = localStorage.getItem(STATS_KEY);
    this._d = r ? JSON.parse(r) : this._defaults();
    return this._d;
  },
  save() { localStorage.setItem(STATS_KEY, JSON.stringify(this._d)); },

  recordAnswer(topicName, isCorrect) {
    const d = this.load();
    const t = today();
    if (!d.daily[t]) d.daily[t] = { questions: 0, correct: 0, wrong: 0, timeMs: 0 };
    d.daily[t].questions++;
    if (isCorrect) d.daily[t].correct++; else d.daily[t].wrong++;
    if (!d.topicStats[topicName]) d.topicStats[topicName] = { correct: 0, wrong: 0 };
    if (isCorrect) d.topicStats[topicName].correct++; else d.topicStats[topicName].wrong++;
    this.updateStreak();
    this.save();
  },

  recordExam(examData) {
    const d = this.load();
    d.exams.push(examData);
    // Also update daily
    const t = today();
    if (!d.daily[t]) d.daily[t] = { questions: 0, correct: 0, wrong: 0, timeMs: 0 };
    d.daily[t].questions += examData.total;
    d.daily[t].correct += examData.score;
    d.daily[t].wrong += (examData.total - examData.score);
    this.updateStreak();
    this.save();
  },

  updateStreak() {
    const d = this.load();
    const t = today();
    if (d.streak.lastDate === t) return; // already updated today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yd = yesterday.toISOString().split('T')[0];
    if (d.streak.lastDate === yd) {
      d.streak.current++;
    } else if (d.streak.lastDate !== t) {
      d.streak.current = 1;
    }
    d.streak.lastDate = t;
    if (d.streak.current > d.streak.best) d.streak.best = d.streak.current;
  },

  getStreak() { return this.load().streak; },
  getToday() { return this.load().daily[today()] || { questions: 0, correct: 0, wrong: 0, timeMs: 0 }; },
  getTopicPct(name) {
    const d = this.load();
    const t = d.topicStats[name];
    if (!t || (t.correct + t.wrong) === 0) return 0;
    return Math.round(t.correct / (t.correct + t.wrong) * 100);
  },
  getExams() { return this.load().exams || []; },
  getDailyHistory(days = 14) {
    const d = this.load();
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i);
      const ds = date.toISOString().split('T')[0];
      result.push({ date: ds, ...(d.daily[ds] || { questions: 0, correct: 0, wrong: 0 }) });
    }
    return result;
  },
  reset() { localStorage.removeItem(STATS_KEY); this._d = null; }
};

// ── Spaced Repetition Engine ───────────────────────────────
const sr = {
  _data: null,
  load() { if (this._data) return this._data; const r = localStorage.getItem(SR_KEY); this._data = r ? JSON.parse(r) : {}; return this._data; },
  save() { localStorage.setItem(SR_KEY, JSON.stringify(this._data)); },

  getCard(id) {
    const d = this.load();
    if (!d[id]) {
      d[id] = { box: 0, ef: 2.5, interval: 0, nextReview: today(), lastReview: null, reviews: 0, streak: 0 };
      this.save();
    }
    return d[id];
  },

  review(id, quality) {
    // quality: 1=again, 3=hard, 4=good, 5=easy
    const d = this.load();
    const c = this.getCard(id);
    if (quality >= 3) {
      if (c.reviews === 0) c.interval = 1;
      else if (c.reviews === 1) c.interval = 6;
      else c.interval = Math.round(c.interval * c.ef);
      c.streak++;
      c.box = Math.min(5, c.box + 1);
    } else {
      c.interval = 1;
      c.streak = 0;
      c.box = Math.max(0, c.box - 1);
    }
    c.ef = Math.max(1.3, c.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    c.reviews++;
    c.lastReview = today();
    const next = new Date(); next.setDate(next.getDate() + c.interval);
    c.nextReview = next.toISOString().split('T')[0];
    d[id] = c;
    this._data = d;
    this.save();
    return c;
  },

  getDueQuestions() {
    const topics = store.getTopics();
    const t = today();
    const due = [];
    topics.forEach((tp, ti) => {
      (tp.fragen || []).forEach((f, fi) => {
        const id = `${ti}_${fi}`;
        const c = this.getCard(id);
        if (c.nextReview <= t) {
          due.push({ ...f, _topic: tp.thema, _emoji: tp.emoji || '📚', _srId: id, _sr: c });
        }
      });
    });
    due.sort((a, b) => {
      if (a._sr.box === 0 && b._sr.box !== 0) return 1;
      if (a._sr.box !== 0 && b._sr.box === 0) return -1;
      return a._sr.nextReview.localeCompare(b._sr.nextReview);
    });
    return due;
  },

  getWeakQuestions() {
    const topics = store.getTopics();
    const weak = [];
    topics.forEach((tp, ti) => {
      (tp.fragen || []).forEach((f, fi) => {
        const id = `${ti}_${fi}`;
        const c = this.getCard(id);
        if (c.box <= 2) {
          weak.push({ ...f, _topic: tp.thema, _emoji: tp.emoji || '📚', _srId: id, _sr: c });
        }
      });
    });
    // Return max 30 random weak questions
    return shuffle(weak).slice(0, 30);
  },

  getBoxDistribution() {
    const data = this.load();
    const boxes = [0,0,0,0,0,0];
    for (const c of Object.values(data)) boxes[c.box]++;
    return boxes;
  },

  getTotalCards() {
    return Object.keys(this.load()).length;
  },

  initAllCards() {
    const topics = store.getTopics();
    topics.forEach((tp, ti) => {
      (tp.fragen || []).forEach((_, fi) => { this.getCard(`${ti}_${fi}`); });
    });
  },

  reset() { localStorage.removeItem(SR_KEY); this._data = null; }
};

// ── Exam History ───────────────────────────────────────────
const examHistory = {
  load() { const r = localStorage.getItem(EXAM_KEY); return r ? JSON.parse(r) : []; },
  save(data) { localStorage.setItem(EXAM_KEY, JSON.stringify(data)); },
  add(exam) { const d = this.load(); d.push(exam); this.save(d); },
  getAll() { return this.load(); },
  reset() { localStorage.removeItem(EXAM_KEY); }
};

// ── Router ─────────────────────────────────────────────────
const router = {
  _params: {},
  go(route, params = {}) {
    window.location.hash = route;
    this._params = params;
    this.render(route, params);
  },
  render(route, params = {}) {
    const main = document.getElementById('main');
    updateNavActive(route);
    switch (route) {
      case 'dashboard':     renderDashboard(main); break;
      case 'learn':         renderLearn(main); break;
      case 'learn-go':      renderLearnSession(main); break;
      case 'learn-weak':    renderLearnSession(main, { sessionType: 'weak' }); break;
      case 'flashcards':    renderFlashcardsSelect(main); break;
      case 'flashcards-go': renderFlashcards(main, params); break;
      case 'quiz':          renderQuizSelect(main); break;
      case 'quiz-go':       renderQuiz(main, params); break;
      case 'exam':          renderExamSetup(main); break;
      case 'exam-go':       renderExamRun(main, params); break;
      case 'stats':         renderStats(main); break;
      default:              renderDashboard(main); break;
    }
  },
  init() {
    window.addEventListener('hashchange', () => {
      const h = window.location.hash.slice(1) || 'dashboard';
      this.render(h, this._params);
    });
    const h = window.location.hash.slice(1) || 'dashboard';
    this.render(h);
  }
};

// ── Navigation ─────────────────────────────────────────────
function buildNavigation() {
  const sidebar = document.getElementById('sidebar');
  const bottombar = document.getElementById('bottombar');

  // Sidebar
  const header = h('div', { className: 'sidebar__header' });
  header.appendChild(h('span', { className: 'sidebar__logo' }, '🎓'));
  header.appendChild(h('span', { className: 'sidebar__title' }, 'AP1 Trainer'));
  sidebar.appendChild(header);

  const nav = h('nav', { className: 'sidebar__nav' });
  NAV_ITEMS.forEach(item => {
    const btn = h('button', {
      className: 'nav-item',
      'data-route': item.id,
      onClick: () => router.go(item.id)
    });
    btn.appendChild(h('svg', { className: 'nav-icon', html: item.icon, viewBox: '0 0 24 24' }));
    btn.appendChild(h('span', {}, item.label));
    if (item.id === 'learn') {
      const badge = h('span', { className: 'nav-badge', id: 'learn-badge', style: 'display:none' });
      btn.appendChild(badge);
    }
    nav.appendChild(btn);
  });
  sidebar.appendChild(nav);

  // Sidebar footer - streak
  const footer = h('div', { className: 'sidebar__footer' });
  footer.appendChild(h('div', { className: 'streak-display', id: 'sidebar-streak' }));
  sidebar.appendChild(footer);

  // Bottom bar
  const inner = h('div', { className: 'bottombar__inner' });
  NAV_ITEMS.forEach(item => {
    const btn = h('button', {
      className: 'bottom-item',
      'data-route': item.id,
      onClick: () => router.go(item.id)
    });
    btn.appendChild(h('svg', { className: 'nav-icon', html: item.icon, viewBox: '0 0 24 24' }));
    btn.appendChild(h('span', {}, item.label));
    inner.appendChild(btn);
  });
  bottombar.appendChild(inner);
}

function updateNavActive(route) {
  const baseRoute = route.split('-')[0]; // 'quiz-go' → 'quiz'
  document.querySelectorAll('.nav-item, .bottom-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === baseRoute || el.dataset.route === route);
  });
  updateLearnBadge();
  updateStreakDisplay();
}

function updateLearnBadge() {
  const badge = document.getElementById('learn-badge');
  if (!badge) return;
  const due = sr.getDueQuestions().length;
  if (due > 0) {
    badge.textContent = due;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

function updateStreakDisplay() {
  const el = document.getElementById('sidebar-streak');
  if (!el) return;
  const s = stats.getStreak();
  el.innerHTML = '';
  el.appendChild(h('span', { className: 'streak-fire' }, s.current > 0 ? '🔥' : '❄️'));
  el.appendChild(h('span', {}, 'Streak: '));
  el.appendChild(h('span', { className: 'streak-count' }, `${s.current} Tage`));
}

// ── Initial Data ───────────────────────────────────────────
async function loadInitialData() {
  if (store.load()) return;
  for (const path of ['fragen.json', '../fragen.json']) {
    try {
      const resp = await fetch(path);
      if (resp.ok) { const data = await resp.json(); store.setTopics(Array.isArray(data) ? data : [data]); return; }
    } catch (_) {}
  }
  store.setTopics(FALLBACK_DATA);
}

// ── Dashboard ──────────────────────────────────────────────
function renderDashboard(root) {
  const topics = store.getTopics();
  const s = stats.getStreak();
  const td = stats.getToday();
  const totalQ = topics.reduce((a, t) => a + (t.fragen?.length || 0), 0);
  const dueCount = sr.getDueQuestions().length;
  const todayPct = td.questions > 0 ? Math.round(td.correct / td.questions * 100) : 0;

  root.innerHTML = '';
  const screen = h('div', { className: 'screen' });

  // Header
  const hdr = h('div', { className: 'section-header' });
  hdr.appendChild(h('h1', { className: 'section-header__title' }, '👋 Willkommen zurück!'));
  hdr.appendChild(h('p', { className: 'section-header__sub' }, 'Dein Lernfortschritt auf einen Blick.'));
  screen.appendChild(hdr);

  // Stats row
  const sg = h('div', { className: 'stats-grid stagger' });
  sg.appendChild(makeStatCard('🔥', s.current, 'Tage Streak'));
  sg.appendChild(makeStatCard('📚', totalQ, 'Fragen'));
  sg.appendChild(makeStatCard('🧠', dueCount, 'Fällig heute'));
  sg.appendChild(makeStatCard('📝', td.questions, 'Heute gelernt'));
  sg.appendChild(makeStatCard('✅', todayPct + '%', 'Richtig heute'));
  sg.appendChild(makeStatCard('🏆', s.best, 'Bester Streak'));
  screen.appendChild(sg);

  // Quick actions
  if (dueCount > 0) {
    const qa = h('div', {
      className: 'glass-card glass-card--interactive',
      style: 'margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;',
      onClick: () => router.go('learn')
    });
    qa.appendChild(h('div', {},
      h('div', { className: 'heading-md' }, `🧠 ${dueCount} Karten warten auf dich`),
      h('p', { style: 'color:var(--text2);font-size:0.85rem;margin-top:4px;' }, 'Starte jetzt deine tägliche Wiederholung.')
    ));
    qa.appendChild(h('button', { className: 'btn btn-primary' }, '▶ Lernen starten'));
    screen.appendChild(qa);
  }

  // Topics
  screen.appendChild(h('h2', { className: 'heading-md', style: 'margin-bottom:16px;' }, 'Deine Themen'));

  if (topics.length === 0) {
    const emp = h('div', { className: 'empty-state' });
    emp.appendChild(h('div', { className: 'empty-state__emoji' }, '📭'));
    emp.appendChild(h('p', { className: 'empty-state__text' }, 'Noch keine Themen vorhanden. Importiere Fragen unter "Stats → Verwalten".'));
    emp.appendChild(h('button', { className: 'btn btn-primary', onClick: () => router.go('stats') }, '➕ Fragen importieren'));
    screen.appendChild(emp);
  } else {
    const grid = h('div', { className: 'topic-grid stagger' });
    topics.forEach((t, i) => {
      const pct = stats.getTopicPct(t.thema);
      const card = h('div', { className: 'topic-card', onClick: () => router.go('quiz-go', { indices: [i] }) });
      card.appendChild(h('span', { className: 'topic-card__emoji' }, t.emoji || '📚'));
      card.appendChild(h('div', { className: 'topic-card__name' }, t.thema));
      card.appendChild(h('div', { className: 'topic-card__count' }, `${t.fragen?.length || 0} Fragen`));
      const bar = h('div', { className: 'progress-bar' });
      bar.appendChild(h('div', { className: 'progress-bar__fill', style: `width:${pct}%` }));
      card.appendChild(bar);
      card.appendChild(h('div', { className: 'progress-text' }, `${pct}% richtig`));
      grid.appendChild(card);
    });
    screen.appendChild(grid);
  }

  root.appendChild(screen);
}

function makeStatCard(icon, value, label) {
  const c = h('div', { className: 'stat-card' });
  c.appendChild(h('span', { className: 'stat-card__icon' }, icon));
  c.appendChild(h('div', { className: 'stat-card__value' }, String(value)));
  c.appendChild(h('div', { className: 'stat-card__label' }, label));
  return c;
}

// ── Learn (Spaced Repetition) ──────────────────────────────
function renderLearn(root) {
  sr.initAllCards();
  const due = sr.getDueQuestions();
  const boxes = sr.getBoxDistribution();
  const total = sr.getTotalCards();

  root.innerHTML = '';
  const screen = h('div', { className: 'screen' });

  const hdr = h('div', { className: 'section-header' });
  hdr.appendChild(h('h1', { className: 'section-header__title' }, '🧠 Intelligentes Lernen'));
  hdr.appendChild(h('p', { className: 'section-header__sub' }, 'Spaced Repetition – lerne effizienter mit dem SM-2 Algorithmus.'));
  screen.appendChild(hdr);

  // Due count
  const overview = h('div', { className: 'glass-card', style: 'text-align:center;margin-bottom:24px;' });
  overview.appendChild(h('div', { className: 'heading-xl text-gradient', style: 'margin-bottom:8px;' }, String(due.length)));
  overview.appendChild(h('p', { style: 'color:var(--text2);margin-bottom:20px;' }, due.length === 1 ? 'Karte fällig' : 'Karten fällig'));

  const statsRow = h('div', { style: 'display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:20px;' });
  statsRow.appendChild(h('div', { className: 'learn-stat' }, h('span', {}, '📦 Gesamt: '), h('span', { className: 'learn-stat__value' }, String(total))));
  const newCards = boxes[0];
  statsRow.appendChild(h('div', { className: 'learn-stat' }, h('span', {}, '🆕 Neu: '), h('span', { className: 'learn-stat__value' }, String(newCards))));
  const mastered = boxes[4] + boxes[5];
  statsRow.appendChild(h('div', { className: 'learn-stat' }, h('span', {}, '✅ Gelernt: '), h('span', { className: 'learn-stat__value' }, String(mastered))));
  overview.appendChild(statsRow);

  if (due.length > 0) {
    overview.appendChild(h('button', {
      className: 'btn btn-primary btn-xl',
      onClick: () => router.go('learn-go')
    }, '▶  Lernen starten'));
  } else {
    overview.appendChild(h('div', { style: 'font-size:2rem;margin-bottom:8px;' }, '🎉'));
    overview.appendChild(h('p', { style: 'color:var(--green);font-weight:600;' }, 'Alle Karten für heute gelernt!'));
    overview.appendChild(h('p', { style: 'color:var(--text3);font-size:0.85rem;margin-top:4px;' }, 'Komm morgen wieder für die nächste Session.'));
  }
  
  const weakCount = sr.getWeakQuestions().length;
  if (weakCount > 0) {
    overview.appendChild(h('button', {
      className: 'btn btn-secondary',
      style: 'margin-top:20px;',
      onClick: () => router.go('learn-weak')
    }, '🎯 Schwachstellen trainieren'));
  }
  
  screen.appendChild(overview);

  // Box distribution
  if (total > 0) {
    const boxWidget = h('div', { className: 'stats-widget' });
    boxWidget.appendChild(h('div', { className: 'stats-widget__title' }, '📦 Lernbox-Verteilung'));
    const boxLabels = ['Neu', 'Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5'];
    const maxVal = Math.max(...boxes, 1);
    const barContainer = h('div', { className: 'box-bar' });
    boxes.forEach((count, i) => {
      const pct = (count / maxVal) * 100;
      const col = h('div', { className: 'box-bar__col', style: `height:${Math.max(pct, 5)}%` });
      col.appendChild(h('div', { className: 'box-bar__count' }, String(count)));
      col.appendChild(h('div', { className: 'box-bar__label' }, boxLabels[i]));
      barContainer.appendChild(col);
    });
    boxWidget.appendChild(barContainer);
    boxWidget.appendChild(h('div', { style: 'height:28px;' })); // spacer for labels
    screen.appendChild(boxWidget);
  }

  root.appendChild(screen);
}

function renderLearnSession(root, params = {}) {
  const isWeak = params.sessionType === 'weak';
  const due = isWeak ? sr.getWeakQuestions() : sr.getDueQuestions();
  if (due.length === 0) { router.go('learn'); return; }

  let idx = 0;
  let revealed = false;
  let reviewed = 0;
  let startTime = Date.now();

  function renderCard() {
    root.innerHTML = '';
    const screen = h('div', { className: 'screen' });
    const q = due[idx];

    // Progress
    screen.appendChild(h('div', { className: 'flashcard-progress' },
      isWeak ? `🎯 Schwachstellen: ${idx + 1} / ${due.length}  ·  ${q._emoji} ${q._topic}` 
             : `${idx + 1} / ${due.length}  ·  ${q._emoji} ${q._topic}  ·  Box ${q._sr.box}`
    ));

    // Card
    const cardWrap = h('div', { className: 'learn-card' });
    const card = h('div', { className: 'glass-card', style: 'text-align:center;padding:36px;min-height:200px;display:flex;flex-direction:column;justify-content:center;' });
    card.appendChild(h('div', { style: 'font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;font-weight:600;' }, 'FRAGE'));
    card.appendChild(h('div', { className: 'heading-md', style: 'line-height:1.7;' }, q.frage));

    if (q.bild) {
      card.appendChild(h('img', { src: q.bild, style: 'max-width:100%; max-height:200px; border-radius:8px; margin:16px auto 0;' }));
    }

    if (revealed) {
      card.appendChild(h('div', { style: 'width:60px;height:1px;background:var(--glass-border2);margin:20px auto;' }));
      card.appendChild(h('div', { style: 'font-size:0.72rem;color:var(--teal);text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;font-weight:600;' }, 'ANTWORT'));
      const ansText = q.typ === 'mc' ? q.optionen[q.antwort] : q.antwort;
      card.appendChild(h('div', { style: 'font-size:1.05rem;color:var(--text);line-height:1.6;' }, ansText));
      if (q.erklaerung) {
         card.appendChild(h('div', { style: 'margin-top:16px; font-size:0.85rem; color:var(--text2); background:var(--bg3); padding:12px; border-radius:6px; border-left:3px solid var(--accent); white-space:pre-wrap; text-align:left;' }, q.erklaerung));
      }
    }
    cardWrap.appendChild(card);
    screen.appendChild(cardWrap);

    if (!revealed) {
      const revealBtn = h('div', { className: 'learn-answer-reveal' });
      revealBtn.appendChild(h('button', {
        className: 'btn btn-primary btn-lg btn-full',
        style: 'max-width:400px;margin:0 auto;',
        onClick: () => { revealed = true; renderCard(); }
      }, '👆 Antwort zeigen'));
      screen.appendChild(revealBtn);
    } else {
      // Rating buttons
      screen.appendChild(h('p', { style: 'text-align:center;color:var(--text3);font-size:0.82rem;margin-top:16px;margin-bottom:8px;' }, 'Wie gut konntest du dich erinnern?'));
      const ratings = h('div', { className: 'learn-ratings' });
      const rateOptions = [
        { label: 'Nochmal', sub: '<1 Min', cls: 'rating-btn--again', q: 1 },
        { label: 'Schwer', sub: '~1 Tag', cls: 'rating-btn--hard', q: 3 },
        { label: 'Gut', sub: getIntervalText(q._sr, 4), cls: 'rating-btn--good', q: 4 },
        { label: 'Leicht', sub: getIntervalText(q._sr, 5), cls: 'rating-btn--easy', q: 5 },
      ];
      rateOptions.forEach(opt => {
        const btn = h('button', {
          className: `rating-btn ${opt.cls}`,
          onClick: () => {
            sr.review(q._srId, opt.q);
            stats.recordAnswer(q._topic, opt.q >= 3);
            reviewed++;
            idx++;
            revealed = false;
            if (idx >= due.length) renderLearnDone(root, reviewed, Date.now() - startTime);
            else renderCard();
          }
        });
        btn.appendChild(h('span', {}, opt.label));
        btn.appendChild(h('span', { className: 'rating-label' }, opt.sub));
        ratings.appendChild(btn);
      });
      screen.appendChild(ratings);
    }

    // Back button
    screen.appendChild(h('div', { style: 'text-align:center;margin-top:20px;' },
      h('button', { className: 'btn btn-ghost btn-sm', onClick: () => router.go('learn') }, '← Zurück zur Übersicht')
    ));

    root.appendChild(screen);
  }

  renderCard();
}

function getIntervalText(card, quality) {
  let interval = card.interval;
  let ef = card.ef;
  if (quality >= 3) {
    if (card.reviews === 0) interval = 1;
    else if (card.reviews === 1) interval = 6;
    else interval = Math.round(interval * ef);
  }
  if (quality === 5) interval = Math.round(interval * 1.3);
  if (interval === 0 || interval === 1) return '~1 Tag';
  if (interval < 30) return `~${interval} Tage`;
  if (interval < 365) return `~${Math.round(interval/30)} Mon.`;
  return `~${Math.round(interval/365)} Jahr`;
}

function renderLearnDone(root, count, timeMs) {
  root.innerHTML = '';
  const screen = h('div', { className: 'screen' });
  const done = h('div', { className: 'score-screen' });
  done.appendChild(h('div', { className: 'score-screen__emoji' }, '🎉'));
  done.appendChild(h('div', { className: 'score-screen__title' }, 'Session abgeschlossen!'));
  done.appendChild(h('div', { className: 'score-screen__value' }, String(count)));
  done.appendChild(h('div', { className: 'score-screen__pct' }, `Karten wiederholt in ${Math.round(timeMs / 60000)} Min.`));

  const actions = h('div', { className: 'score-screen__actions' });
  actions.appendChild(h('button', { className: 'btn btn-primary btn-lg', onClick: () => router.go('learn') }, '← Übersicht'));
  actions.appendChild(h('button', { className: 'btn btn-secondary btn-lg', onClick: () => router.go('dashboard') }, '🏠 Dashboard'));
  done.appendChild(actions);
  screen.appendChild(done);
  root.appendChild(screen);
}

// ── Flashcards ─────────────────────────────────────────────
function renderFlashcardsSelect(root) {
  renderTopicSelect(root, '🃏 Karteikarten', 'Wähle Themen, deren Karten du durchgehen möchtest.', (indices) => {
    router.go('flashcards-go', { indices });
  });
}

function renderFlashcards(root, params) {
  const indices = params.indices || [];
  let questions = shuffle(getAllQuestions(indices));
  if (questions.length === 0) { router.go('flashcards'); return; }

  let idx = 0, flipped = false;

  function render() {
    root.innerHTML = '';
    const screen = h('div', { className: 'screen' });
    const q = questions[idx];

    screen.appendChild(h('div', { className: 'flashcard-progress' }, `${idx + 1} / ${questions.length}  ·  ${q._emoji} ${q._topic}`));

    const container = h('div', { className: 'flashcard-container' });
    const card = h('div', { className: `flashcard${flipped ? ' flipped' : ''}`, onClick: () => { flipped = !flipped; card.classList.toggle('flipped'); } });

    const front = h('div', { className: 'flashcard__front' });
    front.appendChild(h('div', { className: 'flashcard__label' }, 'Frage'));
    front.appendChild(h('div', { className: 'flashcard__text' }, q.frage));
    if (q.bild) {
      front.appendChild(h('img', { src: q.bild, style: 'max-width:100%; max-height:120px; border-radius:8px; margin:12px 0;' }));
    }
    front.appendChild(h('div', { className: 'flashcard__hint' }, '👆 Klicken zum Umdrehen'));

    const back = h('div', { className: 'flashcard__back' });
    back.appendChild(h('div', { className: 'flashcard__label' }, 'Antwort'));
    const answerText = q.typ === 'mc' ? q.optionen[q.antwort] : q.antwort;
    back.appendChild(h('div', { className: 'flashcard__text' }, answerText));
    if (q.erklaerung) {
      back.appendChild(h('div', { style: 'margin-top:16px; font-size:0.85rem; color:var(--text2);' }, q.erklaerung));
    }

    card.appendChild(front);
    card.appendChild(back);
    container.appendChild(card);
    screen.appendChild(container);

    const controls = h('div', { className: 'flashcard-controls' });
    controls.appendChild(h('button', { className: 'btn btn-secondary', onClick: () => { if (idx > 0) { idx--; flipped = false; render(); } } }, '← Zurück'));
    controls.appendChild(h('button', { className: 'btn btn-secondary', onClick: () => { questions = shuffle(questions); idx = 0; flipped = false; render(); } }, '🔀 Mischen'));
    controls.appendChild(h('button', { className: 'btn btn-primary', onClick: () => { if (idx < questions.length - 1) { idx++; flipped = false; render(); } else { router.go('flashcards'); } } }, idx < questions.length - 1 ? 'Weiter →' : '✅ Fertig'));
    screen.appendChild(controls);

    screen.appendChild(h('div', { style: 'text-align:center;margin-top:16px;' },
      h('button', { className: 'btn btn-ghost btn-sm', onClick: () => router.go('flashcards') }, '← Themenwahl')
    ));

    root.appendChild(screen);
  }
  render();
}

// ── Topic Select (shared) ──────────────────────────────────
function renderTopicSelect(root, title, subtitle, onStart) {
  const topics = store.getTopics();
  root.innerHTML = '';
  const screen = h('div', { className: 'screen' });
  const hdr = h('div', { className: 'section-header' });
  hdr.appendChild(h('h1', { className: 'section-header__title' }, title));
  hdr.appendChild(h('p', { className: 'section-header__sub' }, subtitle));
  screen.appendChild(hdr);

  if (topics.length === 0) {
    screen.appendChild(h('p', { className: 'empty-state__text' }, 'Keine Themen vorhanden – importiere zuerst Fragen.'));
    root.appendChild(screen);
    return;
  }

  const selected = new Set();
  const list = h('div', { className: 'topic-select-list' });

  topics.forEach((t, i) => {
    const cb = h('input', { type: 'checkbox', id: `ts_${i}` });
    const item = h('div', { className: 'topic-select-item', onClick: () => {
      cb.checked = !cb.checked;
      item.classList.toggle('selected', cb.checked);
      cb.checked ? selected.add(i) : selected.delete(i);
    }});
    item.appendChild(cb);
    item.appendChild(h('span', { className: 'topic-select-item__name' }, `${t.emoji || '📚'} ${t.thema}`));
    item.appendChild(h('span', { className: 'topic-select-item__count' }, `${t.fragen?.length || 0} Fragen`));
    list.appendChild(item);
  });
  screen.appendChild(list);

  const row = h('div', { style: 'display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;' });
  row.appendChild(h('button', {
    className: 'btn btn-secondary btn-sm', onClick: () => {
      const all = selected.size === topics.length;
      topics.forEach((_, i) => {
        const item = list.children[i];
        const cb = item.querySelector('input');
        if (all) { selected.delete(i); cb.checked = false; item.classList.remove('selected'); }
        else { selected.add(i); cb.checked = true; item.classList.add('selected'); }
      });
    }
  }, '☑ Alle'));
  row.appendChild(h('button', {
    className: 'btn btn-primary btn-lg', onClick: () => {
      if (selected.size === 0) { showToast('Wähle mindestens ein Thema aus.', 'warning'); return; }
      onStart([...selected]);
    }
  }, '▶  Starten'));
  screen.appendChild(row);
  root.appendChild(screen);
}

// ── Quiz ───────────────────────────────────────────────────
function renderQuizSelect(root) {
  renderTopicSelect(root, '❓ Quiz starten', 'Wähle Themen für dein Quiz. Die Fragen werden gemischt.', (indices) => {
    router.go('quiz-go', { indices });
  });
}

function renderQuiz(root, params) {
  const indices = params.indices || [];
  const questions = shuffle(getAllQuestions(indices));
  if (questions.length === 0) { router.go('quiz'); return; }

  let idx = 0, score = 0, answered = false;
  const topicNames = [...new Set(questions.map(q => q._topic))];

  function renderQ() {
    root.innerHTML = '';
    const screen = h('div', { className: 'screen' });
    const q = questions[idx];
    answered = false;

    const hdr = h('div', { className: 'quiz-header' });
    hdr.appendChild(h('span', { className: 'quiz-header__progress' }, `Frage ${idx + 1} / ${questions.length}`));
    hdr.appendChild(h('span', { className: 'quiz-header__score' }, `✅ ${score} richtig`));
    screen.appendChild(hdr);

    const pb = h('div', { className: 'quiz-progress-bar' });
    pb.appendChild(h('div', { className: 'quiz-progress-bar__fill', style: `width:${(idx / questions.length) * 100}%` }));
    screen.appendChild(pb);

    const qc = h('div', { className: 'quiz-question' });
    qc.appendChild(h('div', { className: 'quiz-question__topic' }, `${q._emoji} ${q._topic}`));
    qc.appendChild(h('div', { className: 'quiz-question__text' }, q.frage));
    if (q.bild) {
      qc.appendChild(h('img', { src: q.bild, style: 'max-width:100%; max-height:200px; border-radius:8px; margin-top:16px;' }));
    }
    screen.appendChild(qc);

    const feedbackEl = h('div', { id: 'quiz-feedback' });
    const nextBtnWrap = h('div', { id: 'quiz-next', style: 'display:none;' });

    if (q.typ === 'mc') {
      const opts = h('div', { className: 'quiz-options' });
      q.optionen.forEach((opt, oi) => {
        const btn = h('button', {
          className: 'quiz-option', onClick: () => {
            if (answered) return;
            answered = true;
            const isCorrect = oi === q.antwort;
            btn.classList.add(isCorrect ? 'correct' : 'wrong');
            if (!isCorrect) opts.children[q.antwort].classList.add('correct');
            [...opts.children].forEach(b => b.classList.add('disabled'));
            if (isCorrect) score++;
            stats.recordAnswer(q._topic, isCorrect);
            showFeedback(feedbackEl, isCorrect, q.optionen[q.antwort], q.erklaerung);
            nextBtnWrap.style.display = 'block';
          }
        }, opt);
        opts.appendChild(btn);
      });
      screen.appendChild(opts);
    } else {
      const wrap = h('div', { className: 'quiz-input-wrap' });
      const inp = h('input', { className: 'quiz-input', type: 'text', placeholder: 'Deine Antwort...' });
      wrap.appendChild(inp);
      screen.appendChild(wrap);

      const checkBtn = h('button', {
        className: 'btn btn-primary btn-full', onClick: () => {
          if (answered) return;
          answered = true;
          const userAns = inp.value.trim().toLowerCase();
          const correct = q.antwort.trim().toLowerCase();
          const isCorrect = userAns && (userAns === correct || correct.includes(userAns) || userAns.includes(correct));
          inp.classList.add(isCorrect ? 'correct' : 'wrong');
          inp.disabled = true;
          if (isCorrect) score++;
          stats.recordAnswer(q._topic, isCorrect);
          showFeedback(feedbackEl, isCorrect, q.antwort, q.erklaerung);
          nextBtnWrap.style.display = 'block';
          checkBtn.style.display = 'none';
        }
      }, 'Antwort prüfen →');
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkBtn.click(); });
      screen.appendChild(checkBtn);
    }

    screen.appendChild(feedbackEl);

    const nextBtn = h('button', {
      className: 'btn btn-primary btn-full btn-lg', onClick: () => {
        idx++;
        if (idx >= questions.length) renderScore(root, score, questions.length, topicNames);
        else renderQ();
      }
    }, idx < questions.length - 1 ? 'Nächste Frage →' : 'Ergebnis anzeigen →');
    nextBtnWrap.appendChild(nextBtn);
    screen.appendChild(nextBtnWrap);

    root.appendChild(screen);
    const finp = screen.querySelector('.quiz-input');
    if (finp) setTimeout(() => finp.focus(), 100);
  }
  renderQ();
}

function showFeedback(el, isCorrect, correctAnswer, erklaerung) {
  if (navigator.vibrate) navigator.vibrate(isCorrect ? [100] : [50, 50, 50]);
  el.innerHTML = '';
  const fb = h('div', { className: `quiz-feedback ${isCorrect ? 'correct' : 'wrong'}` });
  fb.textContent = isCorrect ? '✅ Richtig!' : `❌ Falsch! Richtige Antwort: ${correctAnswer}`;
  if (erklaerung) {
    fb.appendChild(h('div', { style: 'margin-top:12px; font-size:0.85rem; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.2); white-space:pre-wrap; font-weight:normal;' }, erklaerung));
  }
  el.appendChild(fb);
}

function renderScore(root, score, total, topicNames) {
  root.innerHTML = '';
  const pct = Math.round(score / total * 100);
  const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 60 ? '😊' : pct >= 40 ? '📖' : '📚';
  const msg = pct === 100 ? 'Perfekt – alle richtig! 🎉' : pct >= 80 ? 'Sehr gut gemacht!' : pct >= 60 ? 'Gut, weiter so!' : pct >= 40 ? 'Übung macht den Meister!' : 'Weiter üben – du schaffst das! 💪';

  const screen = h('div', { className: 'screen' });
  const sc = h('div', { className: 'score-screen' });
  sc.appendChild(h('div', { className: 'score-screen__emoji' }, emoji));
  sc.appendChild(h('div', { className: 'score-screen__title' }, 'Quiz beendet!'));
  sc.appendChild(h('div', { className: 'score-screen__value' }, `${score} / ${total}`));
  sc.appendChild(h('div', { className: 'score-screen__pct' }, `${pct}% richtig  ·  ${msg}`));

  const actions = h('div', { className: 'score-screen__actions' });
  actions.appendChild(h('button', { className: 'btn btn-primary btn-lg', onClick: () => router.go('quiz') }, '🔁 Nochmal'));
  actions.appendChild(h('button', { className: 'btn btn-secondary btn-lg', onClick: () => router.go('dashboard') }, '← Dashboard'));
  sc.appendChild(actions);
  screen.appendChild(sc);
  root.appendChild(screen);
}

// ── Exam Simulator ─────────────────────────────────────────
function renderExamSetup(root) {
  const topics = store.getTopics();
  root.innerHTML = '';
  const screen = h('div', { className: 'screen' });

  const hdr = h('div', { className: 'section-header' });
  hdr.appendChild(h('h1', { className: 'section-header__title' }, '📝 Klausur-Simulator'));
  hdr.appendChild(h('p', { className: 'section-header__sub' }, 'Simuliere eine echte Prüfungssituation – ohne Feedback, mit Timer.'));
  screen.appendChild(hdr);

  if (topics.length === 0) {
    screen.appendChild(h('div', { className: 'empty-state' },
      h('div', { className: 'empty-state__emoji' }, '📭'),
      h('p', { className: 'empty-state__text' }, 'Keine Themen vorhanden.')
    ));
    root.appendChild(screen);
    return;
  }

  // Topic selection
  screen.appendChild(h('h3', { className: 'heading-md', style: 'margin-bottom:12px;' }, 'Themen auswählen'));
  const selected = new Set();
  const list = h('div', { className: 'topic-select-list' });
  topics.forEach((t, i) => {
    const cb = h('input', { type: 'checkbox', id: `ex_${i}` });
    const item = h('div', { className: 'topic-select-item', onClick: () => {
      cb.checked = !cb.checked;
      item.classList.toggle('selected', cb.checked);
      cb.checked ? selected.add(i) : selected.delete(i);
    }});
    item.appendChild(cb);
    item.appendChild(h('span', { className: 'topic-select-item__name' }, `${t.emoji || '📚'} ${t.thema}`));
    item.appendChild(h('span', { className: 'topic-select-item__count' }, `${t.fragen?.length || 0}`));
    list.appendChild(item);
  });
  screen.appendChild(list);
  screen.appendChild(h('button', {
    className: 'btn btn-ghost btn-sm', style: 'margin:8px 0 20px;', onClick: () => {
      const all = selected.size === topics.length;
      topics.forEach((_, i) => { const item = list.children[i]; const cb = item.querySelector('input');
        if (all) { selected.delete(i); cb.checked = false; item.classList.remove('selected'); }
        else { selected.add(i); cb.checked = true; item.classList.add('selected'); }
      });
    }
  }, '☑ Alle auswählen'));

  // Question count
  screen.appendChild(h('h3', { className: 'heading-md', style: 'margin-bottom:8px;' }, 'Fragenanzahl'));
  let qCount = 25;
  const qOptions = h('div', { className: 'setup-options' });
  [10, 25, 50, 0].forEach(n => {
    const opt = h('button', {
      className: `setup-option${n === 25 ? ' selected' : ''}`,
      onClick: () => {
        qCount = n;
        qOptions.querySelectorAll('.setup-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      }
    });
    opt.appendChild(h('span', { className: 'setup-option__value' }, n === 0 ? '∞' : String(n)));
    opt.appendChild(h('span', {}, n === 0 ? 'Alle' : 'Fragen'));
    qOptions.appendChild(opt);
  });
  screen.appendChild(qOptions);

  // Time limit
  screen.appendChild(h('h3', { className: 'heading-md', style: 'margin-bottom:8px;' }, 'Zeitlimit'));
  let timeLimit = 60;
  const tOptions = h('div', { className: 'setup-options' });
  [30, 60, 90, 0].forEach(m => {
    const opt = h('button', {
      className: `setup-option${m === 60 ? ' selected' : ''}`,
      onClick: () => {
        timeLimit = m;
        tOptions.querySelectorAll('.setup-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      }
    });
    opt.appendChild(h('span', { className: 'setup-option__value' }, m === 0 ? '∞' : String(m)));
    opt.appendChild(h('span', {}, m === 0 ? 'Kein Limit' : 'Minuten'));
    tOptions.appendChild(opt);
  });
  screen.appendChild(tOptions);

  // Hardcore Modus
  screen.appendChild(h('h3', { className: 'heading-md', style: 'margin-bottom:8px; margin-top:20px;' }, '🔥 Modus'));
  let isHardcore = false;
  const hcWrap = h('div', { className: 'glass-card', style: 'padding:16px; margin-bottom:20px; display:flex; align-items:center; gap:12px; cursor:pointer;' });
  const hcCb = h('input', { type: 'checkbox', style: 'width:24px;height:24px; accent-color:var(--red); cursor:pointer;' });
  hcWrap.addEventListener('click', (e) => { 
    if(e.target !== hcCb) hcCb.checked = !hcCb.checked;
    isHardcore = hcCb.checked;
    hcWrap.style.borderColor = isHardcore ? 'var(--red)' : '';
  });
  hcCb.addEventListener('click', (e) => e.stopPropagation());
  hcCb.addEventListener('change', () => {
    isHardcore = hcCb.checked;
    hcWrap.style.borderColor = isHardcore ? 'var(--red)' : '';
  });
  hcWrap.appendChild(hcCb);
  hcWrap.appendChild(h('div', {}, 
    h('div', { style: 'font-weight:700; color:var(--red);' }, 'Hardcore-Prüfung'),
    h('div', { style: 'font-size:0.8rem; color:var(--text2);' }, 'Kein Zurück, kein Markieren, kein Überspringen.')
  ));
  screen.appendChild(hcWrap);

  // Start button
  screen.appendChild(h('button', {
    className: 'btn btn-primary btn-xl btn-full',
    style: 'margin-top:8px;',
    onClick: () => {
      if (selected.size === 0) { showToast('Wähle mindestens ein Thema.', 'warning'); return; }
      const allQ = shuffle(getAllQuestionsWithIds([...selected]));
      const examQ = qCount === 0 ? allQ : allQ.slice(0, qCount);
      if (examQ.length === 0) { showToast('Keine Fragen verfügbar.', 'error'); return; }
      router.go('exam-go', { questions: examQ, timeLimit: timeLimit * 60, indices: [...selected], hardcore: isHardcore });
    }
  }, '🚀 Klausur starten'));

  // Exam history
  const history = examHistory.getAll();
  if (history.length > 0) {
    screen.appendChild(h('h3', { className: 'heading-md', style: 'margin-top:32px;margin-bottom:12px;' }, '📊 Letzte Klausuren'));
    const histList = h('div', { className: 'result-topics' });
    history.slice(-5).reverse().forEach(ex => {
      const pct = Math.round(ex.score / ex.total * 100);
      const item = h('div', { className: 'result-topic' });
      item.appendChild(h('span', {}, ex.date));
      item.appendChild(h('span', { className: 'result-topic__name' }, `${ex.score}/${ex.total}`));
      item.appendChild(h('span', { className: 'result-topic__score', style: `color:${pct >= 50 ? 'var(--green)' : 'var(--red)'}` }, `${pct}%`));
      const bar = h('div', { className: 'result-topic__bar' });
      bar.appendChild(h('div', { className: 'result-topic__bar-fill', style: `width:${pct}%;background:${pct >= 50 ? 'var(--green)' : 'var(--red)'}` }));
      item.appendChild(bar);
      histList.appendChild(item);
    });
    screen.appendChild(histList);
  }

  root.appendChild(screen);
}

function renderExamRun(root, params) {
  const questions = params.questions || [];
  const timeLimitSec = params.timeLimit || 0; // 0 = unlimited
  const isHardcore = params.hardcore || false;
  if (questions.length === 0) { router.go('exam'); return; }

  const answers = new Array(questions.length).fill(null);
  const flags = new Array(questions.length).fill(false);
  const freitextAnswers = new Array(questions.length).fill('');
  let currentIdx = 0;
  let timeLeft = timeLimitSec;
  let timerInterval = null;
  let startTime = Date.now();

  function startTimer() {
    if (timeLimitSec <= 0) return;
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimer();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        finishExam();
      }
    }, 1000);
  }

  function updateTimer() {
    const timerEl = document.getElementById('exam-timer-display');
    if (!timerEl) return;
    if (timeLimitSec <= 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      timerEl.textContent = formatTime(elapsed);
      timerEl.parentElement.className = 'exam-timer';
    } else {
      timerEl.textContent = formatTime(timeLeft);
      timerEl.parentElement.className = `exam-timer${timeLeft <= 300 ? (timeLeft <= 60 ? ' danger' : ' warning') : ''}`;
    }
  }

  function renderQuestion() {
    root.innerHTML = '';
    const screen = h('div', { className: 'screen' });
    const q = questions[currentIdx];

    // Header
    const header = h('div', { className: 'exam-header' });
    const timer = h('div', { className: 'exam-timer' });
    timer.appendChild(h('span', {}, '⏱ '));
    timer.appendChild(h('span', { id: 'exam-timer-display' },
      timeLimitSec > 0 ? formatTime(timeLeft) : formatTime(Math.floor((Date.now() - startTime) / 1000))
    ));
    header.appendChild(timer);

    const info = h('div', { className: 'exam-info' });
    info.appendChild(h('span', {}, `Frage ${currentIdx + 1} / ${questions.length}`));
    const answered = answers.filter(a => a !== null).length + freitextAnswers.filter(a => a.trim()).length;
    info.appendChild(h('span', {}, `${answered} beantwortet`));
    header.appendChild(info);
    screen.appendChild(header);

    // Question
    const qc = h('div', { className: 'quiz-question', style: 'margin-bottom:16px;' });
    qc.appendChild(h('div', { className: 'quiz-question__topic' }, `${q._emoji} ${q._topic}`));
    qc.appendChild(h('div', { className: 'quiz-question__text' }, q.frage));
    if (q.bild) {
      qc.appendChild(h('img', { src: q.bild, style: 'max-width:100%; max-height:200px; border-radius:8px; margin-top:16px;' }));
    }
    screen.appendChild(qc);

    // Options / Input
    if (q.typ === 'mc') {
      const opts = h('div', { className: 'quiz-options' });
      q.optionen.forEach((opt, oi) => {
        const btn = h('button', {
          className: `exam-option${answers[currentIdx] === oi ? ' selected' : ''}`,
          onClick: () => {
            answers[currentIdx] = oi;
            opts.querySelectorAll('.exam-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            if (isHardcore) renderQuestion(); // force re-render to update the 'Weiter' button state
          }
        }, opt);
        opts.appendChild(btn);
      });
      screen.appendChild(opts);
    } else {
      const wrap = h('div', { className: 'quiz-input-wrap' });
      const inp = h('input', {
        className: 'quiz-input', type: 'text',
        placeholder: 'Deine Antwort...',
        value: freitextAnswers[currentIdx] || ''
      });
      inp.addEventListener('input', (e) => { 
        freitextAnswers[currentIdx] = e.target.value; 
        if (isHardcore) {
          // just update the button visually if possible, or re-render
          const nextBtn = document.getElementById('hc-weiter-btn');
          if (nextBtn) {
             const isAns = e.target.value.trim() !== '';
             nextBtn.style.opacity = isAns ? '1' : '0.5';
          }
        }
      });
      wrap.appendChild(inp);
      screen.appendChild(wrap);
    }

    // Actions
    const actions = h('div', { style: 'display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;' });
    const isThisAnswered = q.typ === 'mc' ? answers[currentIdx] !== null : freitextAnswers[currentIdx].trim() !== '';

    // Flag button
    if (!isHardcore) {
      const flagBtn = h('button', {
        className: `exam-flag-btn${flags[currentIdx] ? ' flagged' : ''}`,
        onClick: () => { flags[currentIdx] = !flags[currentIdx]; flagBtn.classList.toggle('flagged'); updateNavigator(); }
      }, flags[currentIdx] ? '🚩 Markiert' : '🏳️ Markieren');
      actions.appendChild(flagBtn);
    }

    // Navigation
    if (!isHardcore && currentIdx > 0) {
      actions.appendChild(h('button', { className: 'btn btn-secondary', onClick: () => { currentIdx--; renderQuestion(); } }, '← Zurück'));
    }
    if (currentIdx < questions.length - 1) {
      const weiterBtn = h('button', { 
        id: isHardcore ? 'hc-weiter-btn' : '',
        className: 'btn btn-primary', 
        style: isHardcore && !isThisAnswered ? 'opacity:0.5;' : '',
        onClick: () => { 
          if (isHardcore && !isThisAnswered) { showToast('Im Hardcore-Modus musst du antworten.', 'warning'); return; }
          currentIdx++; renderQuestion(); 
        } 
      }, 'Weiter →');
      actions.appendChild(weiterBtn);
    }
    actions.appendChild(h('button', {
      className: 'btn btn-danger',
      style: 'margin-left:auto;',
      onClick: () => {
        const unanswered = questions.filter((q, i) =>
          q.typ === 'mc' ? answers[i] === null : !freitextAnswers[i].trim()
        ).length;
        if (unanswered > 0 && !confirm(`${unanswered} Fragen unbeantwortet. Trotzdem abgeben?`)) return;
        finishExam();
      }
    }, '📤 Abgeben'));
    screen.appendChild(actions);

    // Navigator
    const nav = h('div', { className: 'exam-navigator', id: 'exam-nav' });
    questions.forEach((q, i) => {
      const isAnswered = q.typ === 'mc' ? answers[i] !== null : freitextAnswers[i].trim() !== '';
      let cls = 'exam-nav-btn';
      if (i === currentIdx) cls += ' current';
      else if (flags[i]) cls += ' flagged';
      else if (isAnswered) cls += ' answered';
      const nbtn = h('button', { className: cls, onClick: () => { 
        if (isHardcore) return; // Disallow jumping in Hardcore
        currentIdx = i; renderQuestion(); 
      } }, String(i + 1));
      if (isHardcore) nbtn.style.cursor = 'default';
      nav.appendChild(nbtn);
    });
    screen.appendChild(nav);

    root.appendChild(screen);

    // Focus input
    const finp = screen.querySelector('.quiz-input');
    if (finp) setTimeout(() => finp.focus(), 100);
  }

  function updateNavigator() {
    const nav = document.getElementById('exam-nav');
    if (!nav) return;
    nav.querySelectorAll('.exam-nav-btn').forEach((btn, i) => {
      const q = questions[i];
      const isAnswered = q.typ === 'mc' ? answers[i] !== null : freitextAnswers[i].trim() !== '';
      btn.className = 'exam-nav-btn';
      if (i === currentIdx) btn.classList.add('current');
      else if (flags[i]) btn.classList.add('flagged');
      else if (isAnswered) btn.classList.add('answered');
    });
  }

  function finishExam() {
    if (timerInterval) clearInterval(timerInterval);
    const durationSec = Math.floor((Date.now() - startTime) / 1000);
    let score = 0;
    const topicResults = {};

    questions.forEach((q, i) => {
      if (!topicResults[q._topic]) topicResults[q._topic] = { correct: 0, total: 0, emoji: q._emoji };
      topicResults[q._topic].total++;

      let isCorrect = false;
      if (q.typ === 'mc') {
        isCorrect = answers[i] === q.antwort;
      } else {
        const userAns = (freitextAnswers[i] || '').trim().toLowerCase();
        const correct = q.antwort.trim().toLowerCase();
        isCorrect = userAns && (userAns === correct || correct.includes(userAns) || userAns.includes(correct));
      }
      if (isCorrect) {
        score++;
        topicResults[q._topic].correct++;
      }
    });

    const examData = {
      date: today(),
      score, total: questions.length,
      durationSec,
      pct: Math.round(score / questions.length * 100),
      topics: topicResults
    };
    examHistory.add(examData);
    stats.recordExam(examData);

    renderExamResults(root, examData, questions, answers, freitextAnswers);
  }

  startTimer();
  renderQuestion();
}

function renderExamResults(root, examData, questions, answers, freitextAnswers) {
  root.innerHTML = '';
  const screen = h('div', { className: 'screen' });
  const pct = examData.pct;
  const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 60 ? '😊' : pct >= 40 ? '📖' : '📚';
  const passed = pct >= 50;

  // Score
  const sc = h('div', { className: 'score-screen', style: 'padding-bottom:20px;' });
  sc.appendChild(h('div', { className: 'score-screen__emoji' }, emoji));
  sc.appendChild(h('div', { className: 'score-screen__title' }, passed ? 'Bestanden!' : 'Nicht bestanden'));
  sc.appendChild(h('div', { className: 'score-screen__value' }, `${examData.score} / ${examData.total}`));
  sc.appendChild(h('div', { className: 'score-screen__pct' }, `${pct}% richtig  ·  ${formatTime(examData.durationSec)}`));
  screen.appendChild(sc);

  // Topic breakdown
  screen.appendChild(h('h3', { className: 'heading-md', style: 'margin-bottom:12px;' }, '📊 Ergebnis nach Themen'));
  const topicList = h('div', { className: 'result-topics' });
  for (const [name, data] of Object.entries(examData.topics)) {
    const tPct = Math.round(data.correct / data.total * 100);
    const item = h('div', { className: 'result-topic' });
    item.appendChild(h('span', { style: 'font-size:1.1rem;' }, data.emoji));
    item.appendChild(h('span', { className: 'result-topic__name' }, name));
    item.appendChild(h('span', { className: 'result-topic__score', style: `color:${tPct >= 50 ? 'var(--green)' : 'var(--red)'}` }, `${data.correct}/${data.total}`));
    const bar = h('div', { className: 'result-topic__bar' });
    bar.appendChild(h('div', { className: 'result-topic__bar-fill', style: `width:${tPct}%;background:${tPct >= 50 ? 'var(--green)' : 'var(--red)'}` }));
    item.appendChild(bar);
    topicList.appendChild(item);
  }
  screen.appendChild(topicList);

  // Wrong answers
  if (questions) {
    const wrongs = [];
    questions.forEach((q, i) => {
      let isCorrect;
      if (q.typ === 'mc') isCorrect = answers[i] === q.antwort;
      else {
        const u = (freitextAnswers[i] || '').trim().toLowerCase();
        const c = q.antwort.trim().toLowerCase();
        isCorrect = u && (u === c || c.includes(u) || u.includes(c));
      }
      if (!isCorrect) wrongs.push({ q, userAnswer: q.typ === 'mc' ? (answers[i] !== null ? q.optionen[answers[i]] : 'Nicht beantwortet') : (freitextAnswers[i] || 'Nicht beantwortet') });
    });

    if (wrongs.length > 0) {
      screen.appendChild(h('h3', { className: 'heading-md', style: 'margin-top:24px;margin-bottom:12px;' }, `❌ Falsche Antworten (${wrongs.length})`));
      const wrongList = h('div', { className: 'question-list' });
      wrongs.forEach(w => {
        const item = h('div', { className: 'question-item', style: 'flex-direction:column;gap:8px;' });
        item.appendChild(h('div', { style: 'font-weight:600;font-size:0.9rem;' }, w.q.frage));
        item.appendChild(h('div', { style: 'color:var(--red);font-size:0.82rem;' }, `Deine Antwort: ${w.userAnswer}`));
        const correctAns = w.q.typ === 'mc' ? w.q.optionen[w.q.antwort] : w.q.antwort;
        item.appendChild(h('div', { style: 'color:var(--green);font-size:0.82rem;' }, `Richtig: ${correctAns}`));
        wrongList.appendChild(item);
      });
      screen.appendChild(wrongList);
    }
  }

  // Actions
  const actions = h('div', { className: 'score-screen__actions', style: 'margin-top:24px;' });
  actions.appendChild(h('button', { className: 'btn btn-primary btn-lg', onClick: () => router.go('exam') }, '🔁 Neue Klausur'));
  actions.appendChild(h('button', { className: 'btn btn-secondary btn-lg', onClick: () => router.go('dashboard') }, '🏠 Dashboard'));
  screen.appendChild(actions);

  root.appendChild(screen);
}

// ── Stats ──────────────────────────────────────────────────
function renderStats(root) {
  root.innerHTML = '';
  const screen = h('div', { className: 'screen' });

  const hdr = h('div', { className: 'section-header' });
  hdr.appendChild(h('h1', { className: 'section-header__title' }, '📊 Statistik & Verwaltung'));
  
  const subWrap = h('div', { style: 'display:flex; justify-content:space-between; align-items:center;' });
  subWrap.appendChild(h('p', { className: 'section-header__sub' }, 'Dein Lernfortschritt und Fragenverwaltung.'));
  if (navigator.share) {
    subWrap.appendChild(h('button', {
      className: 'btn btn-ghost btn-sm',
      onClick: () => {
        const s = stats.getStreak();
        navigator.share({
          title: 'AP1 Trainer Fortschritt',
          text: `🔥 Mein AP1-Lern-Streak: ${s.current} Tage! Bester Streak: ${s.best} Tage. Geht es noch besser?`,
          url: window.location.href
        }).catch(console.error);
      }
    }, '📤 Share'));
  }
  hdr.appendChild(subWrap);
  screen.appendChild(hdr);

  // Tabs
  const tabs = h('div', { className: 'tabs' });
  const tab1 = h('button', { className: 'tab active', onClick: () => switchTab(0) }, '📈 Übersicht');
  const tab2 = h('button', { className: 'tab', onClick: () => switchTab(1) }, '📋 Fragen');
  const tab3 = h('button', { className: 'tab', onClick: () => switchTab(2) }, '➕ Hinzufügen');
  const tab4 = h('button', { className: 'tab', onClick: () => switchTab(3) }, '📥 Import/Export');
  tabs.append(tab1, tab2, tab3, tab4);
  screen.appendChild(tabs);

  const content = h('div', { id: 'stats-content' });
  screen.appendChild(content);
  root.appendChild(screen);

  const allTabs = [tab1, tab2, tab3, tab4];
  function switchTab(i) {
    allTabs.forEach((t, j) => t.classList.toggle('active', i === j));
    if (i === 0) renderStatsOverview(content);
    else if (i === 1) renderManageOverview(content);
    else if (i === 2) renderManageAdd(content);
    else renderManageImportExport(content);
  }
  switchTab(0);
}

function renderStatsOverview(el) {
  el.innerHTML = '';
  const s = stats.getStreak();
  const td = stats.getToday();
  const topics = store.getTopics();

  // Streak & Today
  const row = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;' });

  const streakCard = h('div', { className: 'stats-widget', style: 'text-align:center;' });
  streakCard.appendChild(h('div', { style: 'font-size:2.5rem;' }, s.current > 0 ? '🔥' : '❄️'));
  streakCard.appendChild(h('div', { className: 'heading-xl text-gradient' }, String(s.current)));
  streakCard.appendChild(h('div', { style: 'color:var(--text3);font-size:0.82rem;' }, `Tage Streak · Best: ${s.best}`));
  row.appendChild(streakCard);

  const todayCard = h('div', { className: 'stats-widget', style: 'text-align:center;' });
  todayCard.appendChild(h('div', { style: 'font-size:2.5rem;' }, '📝'));
  todayCard.appendChild(h('div', { className: 'heading-xl text-gradient' }, String(td.questions)));
  const todayPct = td.questions > 0 ? Math.round(td.correct / td.questions * 100) : 0;
  todayCard.appendChild(h('div', { style: 'color:var(--text3);font-size:0.82rem;' }, `Heute · ${todayPct}% richtig`));
  row.appendChild(todayCard);
  el.appendChild(row);

  // Daily activity (last 14 days)
  const dailyWidget = h('div', { className: 'stats-widget' });
  dailyWidget.appendChild(h('div', { className: 'stats-widget__title' }, '📅 Aktivität (14 Tage)'));
  const daily = stats.getDailyHistory(14);
  const maxQ = Math.max(...daily.map(d => d.questions), 1);
  const chartRow = h('div', { style: 'display:flex;align-items:flex-end;gap:4px;height:80px;' });
  daily.forEach(d => {
    const pct = (d.questions / maxQ) * 100;
    const bar = h('div', {
      style: `flex:1;height:${Math.max(pct, 3)}%;background:var(--gradient);border-radius:3px 3px 0 0;position:relative;min-height:2px;`,
      title: `${d.date}: ${d.questions} Fragen`
    });
    chartRow.appendChild(bar);
  });
  dailyWidget.appendChild(chartRow);
  // Date labels
  const dateLabels = h('div', { style: 'display:flex;justify-content:space-between;margin-top:4px;' });
  dateLabels.appendChild(h('span', { style: 'font-size:0.65rem;color:var(--text4);' }, daily[0].date.slice(5)));
  dateLabels.appendChild(h('span', { style: 'font-size:0.65rem;color:var(--text4);' }, 'Heute'));
  dailyWidget.appendChild(dateLabels);
  el.appendChild(dailyWidget);

  // Topic mastery
  if (topics.length > 0) {
    const topicWidget = h('div', { className: 'stats-widget' });
    topicWidget.appendChild(h('div', { className: 'stats-widget__title' }, '🎯 Themen-Meisterschaft'));
    const topicList = h('div', { className: 'result-topics' });
    topics.forEach(t => {
      const pct = stats.getTopicPct(t.thema);
      const item = h('div', { className: 'result-topic' });
      item.appendChild(h('span', { style: 'font-size:1.1rem;' }, t.emoji || '📚'));
      item.appendChild(h('span', { className: 'result-topic__name' }, t.thema));
      item.appendChild(h('span', { className: 'result-topic__score', style: `color:${pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)'}` }, `${pct}%`));
      const bar = h('div', { className: 'result-topic__bar' });
      const color = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)';
      bar.appendChild(h('div', { className: 'result-topic__bar-fill', style: `width:${pct}%;background:${color}` }));
      item.appendChild(bar);
      topicList.appendChild(item);
    });
    topicWidget.appendChild(topicList);
    el.appendChild(topicWidget);
  }

  // Box distribution
  const boxes = sr.getBoxDistribution();
  if (sr.getTotalCards() > 0) {
    const boxWidget = h('div', { className: 'stats-widget' });
    boxWidget.appendChild(h('div', { className: 'stats-widget__title' }, '📦 Lernbox-Verteilung'));
    const boxLabels = ['Neu', 'Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5'];
    const maxVal = Math.max(...boxes, 1);
    const barContainer = h('div', { className: 'box-bar' });
    boxes.forEach((count, i) => {
      const pct = (count / maxVal) * 100;
      const col = h('div', { className: 'box-bar__col', style: `height:${Math.max(pct, 5)}%` });
      col.appendChild(h('div', { className: 'box-bar__count' }, String(count)));
      col.appendChild(h('div', { className: 'box-bar__label' }, boxLabels[i]));
      barContainer.appendChild(col);
    });
    boxWidget.appendChild(barContainer);
    boxWidget.appendChild(h('div', { style: 'height:28px;' }));
    el.appendChild(boxWidget);
  }

  // Exam history
  const exams = examHistory.getAll();
  if (exams.length > 0) {
    const examWidget = h('div', { className: 'stats-widget' });
    examWidget.appendChild(h('div', { className: 'stats-widget__title' }, '📝 Klausur-Verlauf'));
    const maxScore = 100;
    const chartRow2 = h('div', { style: 'display:flex;align-items:flex-end;gap:6px;height:100px;' });
    exams.slice(-10).forEach(ex => {
      const pct = ex.pct;
      const bar = h('div', {
        style: `flex:1;height:${pct}%;background:${pct >= 50 ? 'var(--green)' : 'var(--red)'};border-radius:4px 4px 0 0;position:relative;min-height:4px;cursor:default;`,
        title: `${ex.date}: ${ex.pct}% (${ex.score}/${ex.total})`
      });
      bar.appendChild(h('div', { style: 'position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:0.7rem;font-weight:600;color:var(--text2);white-space:nowrap;' }, `${pct}%`));
      chartRow2.appendChild(bar);
    });
    examWidget.appendChild(chartRow2);
    el.appendChild(examWidget);
  }
}

// ── Manage (within Stats) ──────────────────────────────────
function renderManageOverview(el) {
  const topics = store.getTopics();
  el.innerHTML = '';

  if (topics.length === 0) {
    el.appendChild(h('div', { className: 'empty-state' },
      h('div', { className: 'empty-state__emoji' }, '📭'),
      h('p', { className: 'empty-state__text' }, 'Keine Themen vorhanden.')
    ));
    return;
  }

  topics.forEach((t, ti) => {
    const section = h('div', { style: 'margin-bottom:24px;' });
    const header = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;' });
    header.appendChild(h('h3', { className: 'heading-md' }, `${t.emoji || '📚'} ${t.thema} (${t.fragen?.length || 0})`));
    header.appendChild(h('button', {
      className: 'btn btn-danger btn-sm', onClick: () => {
        if (confirm(`Thema "${t.thema}" mit allen Fragen löschen?`)) {
          topics.splice(ti, 1);
          store.setTopics(topics);
          renderStats(document.getElementById('main'));
        }
      }
    }, '🗑️ Löschen'));
    section.appendChild(header);

    const list = h('div', { className: 'question-list' });
    (t.fragen || []).forEach((f, fi) => {
      const item = h('div', { className: 'question-item' });
      item.appendChild(h('span', { className: 'question-item__type' }, f.typ === 'mc' ? 'MC' : 'TEXT'));
      item.appendChild(h('span', { className: 'question-item__text' }, f.frage));
      item.appendChild(h('button', {
        className: 'question-item__del', title: 'Löschen', onClick: () => {
          t.fragen.splice(fi, 1);
          store.setTopics(topics);
          renderManageOverview(el);
        }
      }, '✕'));
      list.appendChild(item);
    });
    section.appendChild(list);
    el.appendChild(section);
  });
}

function renderManageAdd(el) {
  const topics = store.getTopics();
  el.innerHTML = '';
  const form = h('div');

  const g1 = h('div', { className: 'form-group' });
  g1.appendChild(h('label', { className: 'form-label' }, 'Thema'));
  const sel = h('select', { className: 'form-select', id: 'add-topic-sel' });
  topics.forEach((t, i) => { sel.appendChild(h('option', { value: i }, `${t.emoji || '📚'} ${t.thema}`)); });
  sel.appendChild(h('option', { value: '__new__' }, '➕ Neues Thema erstellen...'));
  g1.appendChild(sel);
  form.appendChild(g1);

  const newTopicWrap = h('div', { id: 'new-topic-wrap', style: 'display:none;' });
  const g1a = h('div', { className: 'form-group' });
  g1a.appendChild(h('label', { className: 'form-label' }, 'Neuer Themenname'));
  const newNameInp = h('input', { className: 'form-input', placeholder: 'z.B. Netzwerktechnik' });
  g1a.appendChild(newNameInp);
  newTopicWrap.appendChild(g1a);
  const g1b = h('div', { className: 'form-group' });
  g1b.appendChild(h('label', { className: 'form-label' }, 'Emoji (optional)'));
  const newEmojiInp = h('input', { className: 'form-input', placeholder: '🌐', style: 'width:80px;' });
  g1b.appendChild(newEmojiInp);
  newTopicWrap.appendChild(g1b);
  form.appendChild(newTopicWrap);
  sel.addEventListener('change', () => { newTopicWrap.style.display = sel.value === '__new__' ? 'block' : 'none'; });

  const g2 = h('div', { className: 'form-group' });
  g2.appendChild(h('label', { className: 'form-label' }, 'Fragetyp'));
  const typSel = h('select', { className: 'form-select', id: 'add-type' });
  typSel.appendChild(h('option', { value: 'mc' }, 'Multiple Choice'));
  typSel.appendChild(h('option', { value: 'freitext' }, 'Freitext'));
  g2.appendChild(typSel);
  form.appendChild(g2);

  const g3 = h('div', { className: 'form-group' });
  g3.appendChild(h('label', { className: 'form-label' }, 'Frage'));
  const frageInp = h('textarea', { className: 'form-textarea', placeholder: 'Deine Frage hier...' });
  g3.appendChild(frageInp);
  form.appendChild(g3);

  const mcWrap = h('div', { id: 'mc-options-wrap' });
  for (let i = 0; i < 4; i++) {
    const gm = h('div', { className: 'form-group' });
    gm.appendChild(h('label', { className: 'form-label' }, `Option ${i + 1} ${i === 0 ? '(= richtige Antwort)' : ''}`));
    gm.appendChild(h('input', { className: 'form-input mc-opt', placeholder: `Option ${i + 1}` }));
    mcWrap.appendChild(gm);
  }
  form.appendChild(mcWrap);

  const ftWrap = h('div', { id: 'ft-answer-wrap', style: 'display:none;' });
  const g4 = h('div', { className: 'form-group' });
  g4.appendChild(h('label', { className: 'form-label' }, 'Antwort'));
  const ftInp = h('input', { className: 'form-input', id: 'ft-answer', placeholder: 'Die richtige Antwort' });
  g4.appendChild(ftInp);
  ftWrap.appendChild(g4);
  form.appendChild(ftWrap);

  typSel.addEventListener('change', () => {
    mcWrap.style.display = typSel.value === 'mc' ? 'block' : 'none';
    ftWrap.style.display = typSel.value === 'freitext' ? 'block' : 'none';
  });

  form.appendChild(h('button', {
    className: 'btn btn-primary btn-full', style: 'margin-top:12px;', onClick: () => {
      const isNew = sel.value === '__new__';
      let topicIdx;
      if (isNew) {
        const name = newNameInp.value.trim();
        if (!name) { showToast('Bitte Themenname eingeben.', 'warning'); return; }
        topics.push({ thema: name, emoji: newEmojiInp.value.trim() || '📚', fragen: [] });
        topicIdx = topics.length - 1;
      } else {
        topicIdx = parseInt(sel.value);
      }
      const frage = frageInp.value.trim();
      if (!frage) { showToast('Bitte Frage eingeben.', 'warning'); return; }
      const typ = typSel.value;
      let q;
      if (typ === 'mc') {
        const opts = [...document.querySelectorAll('.mc-opt')].map(i => i.value.trim());
        if (opts.some(o => !o)) { showToast('Bitte alle 4 Optionen ausfüllen.', 'warning'); return; }
        const correctText = opts[0];
        const shuffled = shuffle(opts);
        q = { typ: 'mc', frage, optionen: shuffled, antwort: shuffled.indexOf(correctText) };
      } else {
        const ans = document.getElementById('ft-answer').value.trim();
        if (!ans) { showToast('Bitte Antwort eingeben.', 'warning'); return; }
        q = { typ: 'freitext', frage, antwort: ans };
      }
      topics[topicIdx].fragen.push(q);
      store.setTopics(topics);
      showToast('✅ Frage hinzugefügt!', 'success');
      frageInp.value = '';
      document.querySelectorAll('.mc-opt').forEach(i => i.value = '');
      const ftA = document.getElementById('ft-answer');
      if (ftA) ftA.value = '';
    }
  }, '💾 Frage speichern'));

  el.appendChild(form);
}

function renderManageImportExport(el) {
  el.innerHTML = '';

  // Import
  el.appendChild(h('h3', { className: 'heading-md', style: 'margin-bottom:12px;' }, '📥 Importieren'));

  const area = h('div', { className: 'import-area' });
  area.appendChild(h('div', { className: 'import-area__icon' }, '📂'));
  area.appendChild(h('div', { className: 'import-area__text' }, 'JSON-Datei auswählen'));
  const fileInp = h('input', {
    type: 'file', accept: '.json', style: 'display:none;', onChange: (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          let data = JSON.parse(ev.target.result);
          if (!Array.isArray(data)) data = [data];
          
          // JSON-Schema Validation
          const isValid = data.every(item => item.thema && Array.isArray(item.fragen));
          if (!isValid) throw new Error("Format ungültig (Erwartet: Array mit 'thema' und 'fragen' Array)");

          const topics = store.getTopics();
          let added = 0;
          for (const item of data) {
            if (!item.thema || !item.fragen) continue;
            const existing = topics.find(t => t.thema === item.thema);
            if (existing) { existing.fragen.push(...item.fragen); added += item.fragen.length; }
            else { topics.push(item); added += item.fragen.length; }
          }
          store.setTopics(topics);
          showToast(`✅ ${added} Fragen importiert!`, 'success');
          renderStats(document.getElementById('main'));
        } catch (err) { showToast('❌ Fehler: ' + err.message, 'error'); }
      };
      reader.readAsText(file);
    }
  });
  area.appendChild(fileInp);
  area.addEventListener('click', () => fileInp.click());
  el.appendChild(area);

  const ta = h('textarea', { className: 'form-textarea', style: 'min-height:120px;margin-top:12px;', placeholder: 'JSON hier einfügen...' });
  el.appendChild(ta);
  el.appendChild(h('button', {
    className: 'btn btn-primary', style: 'margin-top:8px;', onClick: () => {
      try {
        let data = JSON.parse(ta.value);
        if (!Array.isArray(data)) data = [data];

        // JSON-Schema Validation
        const isValid = data.every(item => item.thema && Array.isArray(item.fragen));
        if (!isValid) throw new Error("Format ungültig (Erwartet: Array mit 'thema' und 'fragen' Array)");

        const topics = store.getTopics();
        let added = 0;
        for (const item of data) {
          if (!item.thema || !item.fragen) continue;
          const existing = topics.find(t => t.thema === item.thema);
          if (existing) { existing.fragen.push(...item.fragen); added += item.fragen.length; }
          else { topics.push(item); added += item.fragen.length; }
        }
        store.setTopics(topics);
        showToast(`✅ ${added} Fragen importiert!`, 'success');
        ta.value = '';
        renderStats(document.getElementById('main'));
      } catch (err) { showToast('❌ JSON-Fehler: ' + err.message, 'error'); }
    }
  }, '📥 Importieren'));

  // Export
  el.appendChild(h('h3', { className: 'heading-md', style: 'margin-top:28px;margin-bottom:12px;' }, '📤 Exportieren'));
  const topics = store.getTopics();
  const json = JSON.stringify(topics, null, 2);
  const total = topics.reduce((a, t) => a + (t.fragen?.length || 0), 0);
  el.appendChild(h('p', { style: 'color:var(--text2);font-size:0.85rem;margin-bottom:8px;' }, `${topics.length} Themen · ${total} Fragen`));
  const expTa = h('textarea', { className: 'form-textarea', style: 'min-height:150px;font-family:monospace;font-size:0.78rem;', readonly: true });
  expTa.value = json;
  el.appendChild(expTa);
  const expRow = h('div', { style: 'display:flex;gap:10px;margin-top:8px;' });
  expRow.appendChild(h('button', {
    className: 'btn btn-secondary', onClick: () => {
      navigator.clipboard.writeText(json).then(() => showToast('📋 Kopiert!', 'success'));
    }
  }, '📋 Kopieren'));
  expRow.appendChild(h('button', {
    className: 'btn btn-secondary', onClick: () => {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'ap1_fragen_export.json'; a.click();
      URL.revokeObjectURL(url);
    }
  }, '💾 Herunterladen'));
  el.appendChild(expRow);

  // Danger zone
  el.appendChild(h('div', { style: 'margin-top:40px;border-top:1px solid var(--bg4);padding-top:20px;' },
    h('h3', { className: 'heading-md', style: 'color:var(--red);margin-bottom:12px;' }, '⚠️ Gefahrenzone'),
    h('button', {
      className: 'btn btn-danger', onClick: () => {
        if (confirm('Alle Fragen, Statistiken und Lernfortschritt unwiderruflich löschen?')) {
          store.reset(); stats.reset(); sr.reset(); examHistory.reset();
          showToast('Alles gelöscht.', 'info');
          setTimeout(() => location.reload(), 500);
        }
      }
    }, '🗑️ Alle Daten löschen')
  ));
}

// ── Fallback Data ──────────────────────────────────────────
const FALLBACK_DATA = [
  {
    thema: "Projektmanagement", emoji: "📊",
    fragen: [
      { typ: "mc", frage: "Welches Modell ist dokumentgetrieben?", optionen: ["Scrum", "Wasserfallmodell", "Kanban", "V-Modell"], antwort: 1 },
      { typ: "freitext", frage: "Wer erstellt das Lastenheft?", antwort: "Der Auftraggeber" }
    ]
  }
];

// ── Init ───────────────────────────────────────────────────
(async function () {
  await loadInitialData();
  sr.initAllCards();
  buildNavigation();
  router.init();

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
      console.log('SW registered');
    } catch (e) {
      console.log('SW registration failed:', e);
    }
  }

})();
