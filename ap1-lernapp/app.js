/* ═══════════════════════════════════════════════════════════
   AP1 Trainer – Lern-App für die IHK Abschlussprüfung Teil 1
   Fachinformatiker/in Systemintegration
   ═══════════════════════════════════════════════════════════ */

// ── Storage ────────────────────────────────────────────────
const STORAGE_KEY = 'ap1_trainer_data';
const STATS_KEY = 'ap1_trainer_stats';

const store = {
    _data: null,
    load() {
        if (this._data) return this._data;
        const raw = localStorage.getItem(STORAGE_KEY);
        this._data = raw ? JSON.parse(raw) : null;
        return this._data;
    },
    save(data) {
        this._data = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    getTopics() {
        return this.load() || [];
    },
    setTopics(topics) {
        this.save(topics);
    },
    reset() {
        localStorage.removeItem(STORAGE_KEY);
        this._data = null;
    }
};

const stats = {
    _d: null,
    load() {
        if (this._d) return this._d;
        const raw = localStorage.getItem(STATS_KEY);
        this._d = raw ? JSON.parse(raw) : { sessions: 0, totalCorrect: 0, totalWrong: 0, topicStats: {} };
        return this._d;
    },
    save() { localStorage.setItem(STATS_KEY, JSON.stringify(this._d)); },
    record(topicName, correct, wrong) {
        const d = this.load();
        d.sessions++;
        d.totalCorrect += correct;
        d.totalWrong += wrong;
        if (!d.topicStats[topicName]) d.topicStats[topicName] = { correct: 0, wrong: 0 };
        d.topicStats[topicName].correct += correct;
        d.topicStats[topicName].wrong += wrong;
        this.save();
    },
    get() { return this.load(); },
    getTopicPct(name) {
        const d = this.load();
        const t = d.topicStats[name];
        if (!t || (t.correct + t.wrong) === 0) return 0;
        return Math.round(t.correct / (t.correct + t.wrong) * 100);
    }
};

// ── Initial Data (from JSON) ───────────────────────────────
async function loadInitialData() {
    if (store.load()) return;           // already has data
    // Try loading from same dir, then parent
    for (const path of ['fragen.json', '../fragen.json']) {
        try {
            const resp = await fetch(path);
            if (resp.ok) {
                const data = await resp.json();
                store.setTopics(Array.isArray(data) ? data : [data]);
                return;
            }
        } catch (_) { /* ignore */ }
    }
    // fallback: embed a small starter set
    store.setTopics(FALLBACK_DATA);
}

// ── Router ─────────────────────────────────────────────────
const router = {
    go(route, params = {}) {
        window.location.hash = route;
        this._params = params;
        this.render(route, params);
    },
    _params: {},
    render(route, params = {}) {
        const main = document.getElementById('main');
        document.querySelectorAll('.navbar__btn').forEach(b => {
            b.classList.toggle('active', b.dataset.route === route);
        });
        switch (route) {
            case 'dashboard': renderDashboard(main); break;
            case 'flashcards': renderFlashcardsSelect(main); break;
            case 'flashcards-go': renderFlashcards(main, params); break;
            case 'quiz': renderQuizSelect(main); break;
            case 'quiz-go': renderQuiz(main, params); break;
            case 'manage': renderManage(main); break;
            default: renderDashboard(main); break;
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

// ── Helpers ────────────────────────────────────────────────
function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'className') el.className = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
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

// ── Dashboard ──────────────────────────────────────────────
function renderDashboard(root) {
    const topics = store.getTopics();
    const s = stats.get();
    const totalQ = topics.reduce((a, t) => a + (t.fragen?.length || 0), 0);
    const totalAnswered = s.totalCorrect + s.totalWrong;
    const pct = totalAnswered ? Math.round(s.totalCorrect / totalAnswered * 100) : 0;

    root.innerHTML = '';
    const screen = h('div', { className: 'screen' });

    // Stats row
    const sr = h('div', { className: 'stats-row' });
    sr.appendChild(statCard(topics.length, 'Themen'));
    sr.appendChild(statCard(totalQ, 'Fragen'));
    sr.appendChild(statCard(s.sessions, 'Sessions'));
    sr.appendChild(statCard(pct + '%', 'Richtig'));
    screen.appendChild(sr);

    screen.appendChild(h('h1', { className: 'section-title' }, 'Deine Themen'));
    screen.appendChild(h('p', { className: 'section-sub' }, 'Wähle ein Thema zum Lernen oder starte ein Quiz über alles.'));

    if (topics.length === 0) {
        const emp = h('div', { className: 'empty-state' });
        emp.appendChild(h('div', { className: 'empty-state__emoji' }, '📭'));
        emp.appendChild(h('p', { className: 'empty-state__text' }, 'Noch keine Themen vorhanden. Importiere Fragen unter "Verwalten".'));
        emp.appendChild(h('button', { className: 'btn btn-primary', onClick: () => router.go('manage') }, '➕ Fragen importieren'));
        screen.appendChild(emp);
    } else {
        const grid = h('div', { className: 'topic-grid' });
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

function statCard(value, label) {
    const c = h('div', { className: 'stat-card' });
    c.appendChild(h('div', { className: 'stat-card__value' }, String(value)));
    c.appendChild(h('div', { className: 'stat-card__label' }, label));
    return c;
}

// ── Topic Selection (shared for quiz + flashcards) ─────────
function renderTopicSelect(root, title, subtitle, onStart) {
    const topics = store.getTopics();
    root.innerHTML = '';
    const screen = h('div', { className: 'screen' });
    screen.appendChild(h('h1', { className: 'section-title' }, title));
    screen.appendChild(h('p', { className: 'section-sub' }, subtitle));

    if (topics.length === 0) {
        screen.appendChild(h('p', { className: 'empty-state__text' }, 'Keine Themen vorhanden – importiere zuerst Fragen.'));
        root.appendChild(screen);
        return;
    }

    const selected = new Set();
    const list = h('div', { className: 'topic-select-list' });

    topics.forEach((t, i) => {
        const cb = h('input', { type: 'checkbox', id: `ts_${i}` });
        const item = h('div', {
            className: 'topic-select-item', onClick: () => {
                cb.checked = !cb.checked;
                item.classList.toggle('selected', cb.checked);
                cb.checked ? selected.add(i) : selected.delete(i);
            }
        });
        item.appendChild(cb);
        item.appendChild(h('span', { className: 'topic-select-item__name' }, `${t.emoji || '📚'} ${t.thema}`));
        item.appendChild(h('span', { className: 'topic-select-item__count' }, `${t.fragen?.length || 0} Fragen`));
        list.appendChild(item);
    });
    screen.appendChild(list);

    // Select All
    const selectAll = h('button', {
        className: 'btn btn-secondary btn-sm', onClick: () => {
            const all = selected.size === topics.length;
            topics.forEach((_, i) => {
                const item = list.children[i];
                const cb = item.querySelector('input');
                if (all) { selected.delete(i); cb.checked = false; item.classList.remove('selected'); }
                else { selected.add(i); cb.checked = true; item.classList.add('selected'); }
            });
        }
    }, '☑ Alle auswählen / abwählen');

    const startBtn = h('button', {
        className: 'btn btn-primary btn-lg', onClick: () => {
            if (selected.size === 0) { alert('Wähle mindestens ein Thema aus.'); return; }
            onStart([...selected]);
        }
    }, '▶  Starten');

    const row = h('div', { style: 'display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;' });
    row.appendChild(selectAll);
    row.appendChild(startBtn);
    screen.appendChild(row);
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

    let idx = 0;
    let flipped = false;

    function render() {
        root.innerHTML = '';
        const screen = h('div', { className: 'screen' });
        const q = questions[idx];

        screen.appendChild(h('div', { className: 'flashcard-progress' }, `${idx + 1} / ${questions.length}  ·  ${q._topic}`));

        const container = h('div', { className: 'flashcard-container' });
        const card = h('div', { className: `flashcard${flipped ? ' flipped' : ''}`, onClick: () => { flipped = !flipped; card.classList.toggle('flipped'); } });

        const front = h('div', { className: 'flashcard__front' });
        front.appendChild(h('div', { className: 'flashcard__label' }, 'Frage'));
        front.appendChild(h('div', { className: 'flashcard__text' }, q.frage));
        front.appendChild(h('div', { className: 'flashcard__hint' }, '👆 Klicken zum Umdrehen'));

        const back = h('div', { className: 'flashcard__back' });
        back.appendChild(h('div', { className: 'flashcard__label' }, 'Antwort'));
        const answerText = q.typ === 'mc' ? q.optionen[q.antwort] : q.antwort;
        back.appendChild(h('div', { className: 'flashcard__text' }, answerText));

        card.appendChild(front);
        card.appendChild(back);
        container.appendChild(card);
        screen.appendChild(container);

        const controls = h('div', { className: 'flashcard-controls' });
        controls.appendChild(h('button', { className: 'btn btn-secondary', onClick: () => { if (idx > 0) { idx--; flipped = false; render(); } } }, '← Zurück'));
        controls.appendChild(h('button', { className: 'btn btn-secondary', onClick: () => { questions = shuffle(questions); idx = 0; flipped = false; render(); } }, '🔀 Mischen'));
        controls.appendChild(h('button', { className: 'btn btn-primary', onClick: () => { if (idx < questions.length - 1) { idx++; flipped = false; render(); } else { router.go('flashcards'); } } }, idx < questions.length - 1 ? 'Weiter →' : '✅ Fertig'));
        screen.appendChild(controls);

        const back2 = h('div', { style: 'text-align:center;margin-top:16px;' });
        back2.appendChild(h('button', { className: 'btn btn-secondary btn-sm', onClick: () => router.go('flashcards') }, '← Themenwahl'));
        screen.appendChild(back2);

        root.appendChild(screen);
    }
    render();
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

        // Header
        const hdr = h('div', { className: 'quiz-header' });
        hdr.appendChild(h('span', { className: 'quiz-header__progress' }, `Frage ${idx + 1} / ${questions.length}`));
        hdr.appendChild(h('span', { className: 'quiz-header__score' }, `✅ ${score} richtig`));
        screen.appendChild(hdr);

        // Progress bar
        const pb = h('div', { className: 'quiz-progress-bar' });
        pb.appendChild(h('div', { className: 'quiz-progress-bar__fill', style: `width:${(idx / questions.length) * 100}%` }));
        screen.appendChild(pb);

        // Question card
        const qc = h('div', { className: 'quiz-question' });
        qc.appendChild(h('div', { className: 'quiz-question__topic' }, `${q._emoji} ${q._topic}`));
        qc.appendChild(h('div', { className: 'quiz-question__text' }, q.frage));
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
                        showFeedback(feedbackEl, isCorrect, q.typ === 'mc' ? q.optionen[q.antwort] : q.antwort);
                        nextBtnWrap.style.display = 'block';
                    }
                }, opt);
                opts.appendChild(btn);
            });
            screen.appendChild(opts);
        } else {
            // Freitext
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
                    // Flexible match: contains the core answer
                    const isCorrect = userAns && (userAns === correct || correct.includes(userAns) || userAns.includes(correct));
                    inp.classList.add(isCorrect ? 'correct' : 'wrong');
                    inp.disabled = true;
                    if (isCorrect) score++;
                    showFeedback(feedbackEl, isCorrect, q.antwort);
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

        // Focus input for freitext
        const inp = screen.querySelector('.quiz-input');
        if (inp) setTimeout(() => inp.focus(), 100);
    }

    renderQ();
}

function showFeedback(el, isCorrect, correctAnswer) {
    el.innerHTML = '';
    const fb = h('div', { className: `quiz-feedback ${isCorrect ? 'correct' : 'wrong'}` });
    if (isCorrect) {
        fb.textContent = '✅ Richtig!';
    } else {
        fb.textContent = `❌ Falsch! Richtige Antwort: ${correctAnswer}`;
    }
    el.appendChild(fb);
}

function renderScore(root, score, total, topicNames) {
    root.innerHTML = '';
    const pct = Math.round(score / total * 100);
    const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 60 ? '😊' : pct >= 40 ? '📖' : '📚';
    const msg = pct === 100 ? 'Perfekt – alle richtig! 🎉' : pct >= 80 ? 'Sehr gut gemacht!' : pct >= 60 ? 'Gut, weiter so!' : pct >= 40 ? 'Übung macht den Meister!' : 'Weiter üben – du schaffst das! 💪';

    // Record stats
    for (const tn of topicNames) {
        stats.record(tn, Math.round(score / topicNames.length), Math.round((total - score) / topicNames.length));
    }

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

// ── Manage ─────────────────────────────────────────────────
function renderManage(root) {
    const topics = store.getTopics();
    root.innerHTML = '';
    const screen = h('div', { className: 'screen' });
    screen.appendChild(h('h1', { className: 'section-title' }, '⚙️ Fragen verwalten'));
    screen.appendChild(h('p', { className: 'section-sub' }, 'Themen und Fragen hinzufügen, importieren oder löschen.'));

    // Tabs
    const tabs = h('div', { className: 'tabs' });
    const tab1 = h('button', { className: 'tab active', onClick: () => switchTab(0) }, '📋 Übersicht');
    const tab2 = h('button', { className: 'tab', onClick: () => switchTab(1) }, '➕ Hinzufügen');
    const tab3 = h('button', { className: 'tab', onClick: () => switchTab(2) }, '📥 JSON Import');
    const tab4 = h('button', { className: 'tab', onClick: () => switchTab(3) }, '📤 Export');
    tabs.append(tab1, tab2, tab3, tab4);
    screen.appendChild(tabs);

    const content = h('div', { id: 'manage-content' });
    screen.appendChild(content);
    root.appendChild(screen);

    const allTabs = [tab1, tab2, tab3, tab4];
    function switchTab(i) {
        allTabs.forEach((t, j) => t.classList.toggle('active', i === j));
        if (i === 0) renderManageOverview(content);
        else if (i === 1) renderManageAdd(content);
        else if (i === 2) renderManageImport(content);
        else renderManageExport(content);
    }
    switchTab(0);
}

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
        header.appendChild(h('h3', { style: 'font-size:1rem;font-weight:600;' }, `${t.emoji || '📚'} ${t.thema} (${t.fragen?.length || 0})`));
        header.appendChild(h('button', {
            className: 'btn btn-danger btn-sm', onClick: () => {
                if (confirm(`Thema "${t.thema}" mit allen Fragen löschen?`)) {
                    topics.splice(ti, 1);
                    store.setTopics(topics);
                    renderManage(document.getElementById('main'));
                }
            }
        }, '🗑️ Thema löschen'));
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

    // Thema auswählen oder neu
    const g1 = h('div', { className: 'form-group' });
    g1.appendChild(h('label', { className: 'form-label' }, 'Thema'));
    const sel = h('select', { className: 'form-select', id: 'add-topic-sel' });
    topics.forEach((t, i) => {
        const opt = h('option', { value: i }, `${t.emoji || '📚'} ${t.thema}`);
        sel.appendChild(opt);
    });
    sel.appendChild(h('option', { value: '__new__' }, '➕ Neues Thema erstellen...'));
    g1.appendChild(sel);
    form.appendChild(g1);

    // Neues-Thema-Felder (zunächst versteckt)
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

    sel.addEventListener('change', () => {
        newTopicWrap.style.display = sel.value === '__new__' ? 'block' : 'none';
    });

    // Fragetyp
    const g2 = h('div', { className: 'form-group' });
    g2.appendChild(h('label', { className: 'form-label' }, 'Fragetyp'));
    const typSel = h('select', { className: 'form-select', id: 'add-type' });
    typSel.appendChild(h('option', { value: 'mc' }, 'Multiple Choice'));
    typSel.appendChild(h('option', { value: 'freitext' }, 'Freitext'));
    g2.appendChild(typSel);
    form.appendChild(g2);

    // Frage
    const g3 = h('div', { className: 'form-group' });
    g3.appendChild(h('label', { className: 'form-label' }, 'Frage'));
    const frageInp = h('textarea', { className: 'form-textarea', placeholder: 'Deine Frage hier...' });
    g3.appendChild(frageInp);
    form.appendChild(g3);

    // MC Optionen
    const mcWrap = h('div', { id: 'mc-options-wrap' });
    for (let i = 0; i < 4; i++) {
        const gm = h('div', { className: 'form-group' });
        gm.appendChild(h('label', { className: 'form-label' }, `Option ${i + 1} ${i === 0 ? '(= richtige Antwort)' : ''}`));
        gm.appendChild(h('input', { className: 'form-input mc-opt', placeholder: `Option ${i + 1}` }));
        mcWrap.appendChild(gm);
    }
    form.appendChild(mcWrap);

    // Freitext Antwort
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

    // Save
    form.appendChild(h('button', {
        className: 'btn btn-primary btn-full', style: 'margin-top:12px;', onClick: () => {
            const isNew = sel.value === '__new__';
            let topicIdx;
            if (isNew) {
                const name = newNameInp.value.trim();
                if (!name) { alert('Bitte Themenname eingeben.'); return; }
                topics.push({ thema: name, emoji: newEmojiInp.value.trim() || '📚', fragen: [] });
                topicIdx = topics.length - 1;
            } else {
                topicIdx = parseInt(sel.value);
            }

            const frage = frageInp.value.trim();
            if (!frage) { alert('Bitte Frage eingeben.'); return; }

            const typ = typSel.value;
            let q;
            if (typ === 'mc') {
                const opts = [...document.querySelectorAll('.mc-opt')].map(i => i.value.trim());
                if (opts.some(o => !o)) { alert('Bitte alle 4 Optionen ausfüllen.'); return; }
                // Option 1 ist die richtige → mischen und merken
                const correctText = opts[0];
                const shuffled = shuffle(opts);
                q = { typ: 'mc', frage, optionen: shuffled, antwort: shuffled.indexOf(correctText) };
            } else {
                const ans = document.getElementById('ft-answer').value.trim();
                if (!ans) { alert('Bitte Antwort eingeben.'); return; }
                q = { typ: 'freitext', frage, antwort: ans };
            }

            topics[topicIdx].fragen.push(q);
            store.setTopics(topics);
            alert('✅ Frage hinzugefügt!');
            frageInp.value = '';
            document.querySelectorAll('.mc-opt').forEach(i => i.value = '');
            const ftA = document.getElementById('ft-answer');
            if (ftA) ftA.value = '';
        }
    }, '💾 Frage speichern'));

    el.appendChild(form);
}

function renderManageImport(el) {
    el.innerHTML = '';

    const area = h('div', { className: 'import-area' });
    area.appendChild(h('div', { className: 'import-area__icon' }, '📥'));
    area.appendChild(h('div', { className: 'import-area__text' }, 'Klicke hier um eine JSON-Datei auszuwählen'));
    const fileInp = h('input', {
        type: 'file', accept: '.json', style: 'display:none;', onChange: (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    let data = JSON.parse(ev.target.result);
                    if (!Array.isArray(data)) data = [data];
                    const topics = store.getTopics();
                    let added = 0;
                    for (const item of data) {
                        if (!item.thema || !item.fragen) continue;
                        const existing = topics.find(t => t.thema === item.thema);
                        if (existing) {
                            existing.fragen.push(...item.fragen);
                            added += item.fragen.length;
                        } else {
                            topics.push(item);
                            added += item.fragen.length;
                        }
                    }
                    store.setTopics(topics);
                    alert(`✅ ${added} Fragen aus ${data.length} Themen importiert!`);
                    renderManage(document.getElementById('main'));
                } catch (err) {
                    alert('❌ Fehler beim Import: ' + err.message);
                }
            };
            reader.readAsText(file);
        }
    });
    area.appendChild(fileInp);
    area.addEventListener('click', () => fileInp.click());
    el.appendChild(area);

    el.appendChild(h('p', { style: 'color:var(--text3);font-size:0.82rem;margin-top:12px;' },
        'Format: JSON-Array mit Objekten { thema, emoji, fragen: [{ typ, frage, antwort, optionen }] }'));

    // Textarea import
    el.appendChild(h('div', { style: 'margin-top:24px;' },
        h('label', { className: 'form-label' }, 'Oder JSON-Text direkt einfügen:')
    ));
    const ta = h('textarea', { className: 'form-textarea', style: 'min-height:150px;', placeholder: 'JSON hier einfügen...' });
    el.appendChild(ta);
    el.appendChild(h('button', {
        className: 'btn btn-primary', style: 'margin-top:10px;', onClick: () => {
            try {
                let data = JSON.parse(ta.value);
                if (!Array.isArray(data)) data = [data];
                const topics = store.getTopics();
                let added = 0;
                for (const item of data) {
                    if (!item.thema || !item.fragen) continue;
                    const existing = topics.find(t => t.thema === item.thema);
                    if (existing) {
                        existing.fragen.push(...item.fragen);
                        added += item.fragen.length;
                    } else {
                        topics.push(item);
                        added += item.fragen.length;
                    }
                }
                store.setTopics(topics);
                alert(`✅ ${added} Fragen importiert!`);
                ta.value = '';
                renderManage(document.getElementById('main'));
            } catch (err) {
                alert('❌ JSON-Fehler: ' + err.message);
            }
        }
    }, '📥 Importieren'));

    // Danger zone
    el.appendChild(h('div', { style: 'margin-top:40px;border-top:1px solid var(--bg4);padding-top:20px;' },
        h('button', {
            className: 'btn btn-danger', onClick: () => {
                if (confirm('Alle Fragen und Statistiken unwiderruflich löschen?')) {
                    store.reset();
                    localStorage.removeItem(STATS_KEY);
                    stats._d = null;
                    alert('Alles gelöscht. Die App wird neu geladen.');
                    location.reload();
                }
            }
        }, '🗑️ Alle Daten löschen')
    ));
}

function renderManageExport(el) {
    el.innerHTML = '';
    const topics = store.getTopics();
    const json = JSON.stringify(topics, null, 2);
    const total = topics.reduce((a, t) => a + (t.fragen?.length || 0), 0);

    el.appendChild(h('p', { style: 'margin-bottom:12px;color:var(--text2);font-size:0.9rem;' },
        `${topics.length} Themen · ${total} Fragen`));

    const ta = h('textarea', { className: 'form-textarea', style: 'min-height:250px;font-family:monospace;font-size:0.8rem;', readonly: true, value: json });
    ta.value = json;
    el.appendChild(ta);

    const row = h('div', { style: 'display:flex;gap:10px;margin-top:12px;' });
    row.appendChild(h('button', {
        className: 'btn btn-primary', onClick: () => {
            navigator.clipboard.writeText(json).then(() => alert('✅ In die Zwischenablage kopiert!'));
        }
    }, '📋 Kopieren'));
    row.appendChild(h('button', {
        className: 'btn btn-secondary', onClick: () => {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'ap1_fragen_export.json'; a.click();
            URL.revokeObjectURL(url);
        }
    }, '💾 Als Datei speichern'));
    el.appendChild(row);
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
    router.init();
})();
