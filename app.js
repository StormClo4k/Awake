/* Awakening — versão HTML/JS puro. O motor do jogo (XP, ranks, missões, conquistas) vem de domain.js (global `Domain`). */
(function () {
  'use strict';
  var D = window.Domain;
  var KEY = 'awakening-game-v1'; // mesma chave/formato da versão React Native/Expo
  var $app = document.getElementById('app');
  var $toast = document.getElementById('toast');
  var $modal = document.getElementById('modal');

  /* ------------------------------ utilidades ------------------------------ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var dm = function (iso) { var d = new Date(iso); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };
  var DIFF_COLOR = { E: '#8A94A6', D: '#5CC8A1', C: '#4DA3FF', B: '#A78BFA', A: '#F59E0B', S: '#EF4444' };
  var TYPE_LABEL = { daily: 'Diária', weekly: 'Semanal', special: 'Especial', emergency: 'Emergência', boss: 'Chefe' };
  var WEEKDAY = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  var MESSAGES = [
    'Você ultrapassou seu limite anterior.', 'O sistema reconhece sua evolução.',
    'Cada dia de esforço deixou uma marca. Esta é a prova.', 'Seu poder cresce. Continue.', 'Quem persiste, evolui.'
  ];
  function greeting(h) { return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
  function deadlineText(iso, now) {
    var ms = new Date(iso).getTime() - now.getTime();
    if (ms <= 0) return 'Prazo encerrado';
    var hours = Math.floor(ms / 3600000);
    if (hours < 1) return 'Restam ' + Math.max(1, Math.floor(ms / 60000)) + ' min';
    if (hours < 48) return 'Restam ' + hours + ' h';
    return 'Prazo: ' + dm(iso);
  }

  /* ------------------------------ estado ------------------------------ */
  var game = null;
  var now = new Date();
  var storageOk = true;
  var lastError = null;
  var journalDraft = null, journalMood = null;
  var SKEY = 'awakening-settings-v1', SNAPKEY = 'awakening-snapshots-v1';
  /** Ajustes do aparelho (tema, lembretes, backup). Ficam fora do progresso do jogo. */
  var S = { theme: 'classic', remindOn: false, remindTime: '20:00', backupEvery: 7, lastBackup: null, backupSnooze: null, lastRemind: null, focus: null, mode: 'dark', motion: 'auto' };
  var renderHooks = [];

  function loadSettings() { try { var raw = localStorage.getItem(SKEY); if (raw) Object.assign(S, JSON.parse(raw)); } catch (e) {} }
  function saveSettings() { try { localStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) {} }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      var g = (data && data.state && data.state.game) || null;
      game = g ? D.normalizeState(g) : null;
    } catch (e) { game = null; }
  }
  /** Guarda uma cópia do estado anterior (uma por dia, as 6 últimas) para poder voltar atrás. */
  function takeSnapshot(raw, label, force) {
    try {
      var list = JSON.parse(localStorage.getItem(SNAPKEY) || '[]'), today = D.dayKey(new Date());
      if (!force && list.some(function (x) { return x.day === today; })) return;
      list.push({ day: today, at: new Date().toISOString(), label: label || 'automático', raw: raw });
      while (list.length > 6) list.shift();
      localStorage.setItem(SNAPKEY, JSON.stringify(list));
    } catch (e) {}
  }
  function save() {
    try {
      var prev = localStorage.getItem(KEY);
      if (prev) takeSnapshot(prev);
      localStorage.setItem(KEY, JSON.stringify({ state: { game: game }, version: 1 }));
      storageOk = true;
    } catch (e) { storageOk = false; }
  }
  /** v0.5.3: perfis antigos recebem uma única vez as missões de Carisma (jogos novos já vêm com elas). */
  var CARISMA_PACK = [
    { name: 'Conversar com alguém', description: 'Puxe papo com um colega, amigo ou alguém novo. Escute de verdade.', type: 'daily', difficulty: 'D', xp: 30, attributes: ['carisma'] },
    { name: 'Fortalecer 3 conexões', description: 'Ligue, visite ou marque um encontro com três pessoas nesta semana.', type: 'weekly', difficulty: 'C', xp: 200, attributes: ['carisma', 'disciplina'], target: 3 }
  ];
  function addCarismaPack() {
    if (!game || game.carismaPack) return;
    var g = game, added = 0;
    CARISMA_PACK.forEach(function (input) {
      if (g.missions.some(function (m) { return m.name === input.name; })) return;
      try { g = D.addMission(g, input, now); added++; } catch (e) {}
    });
    game = Object.assign({}, g, { carismaPack: true });
    if (added) setTimeout(function () { showToast('<div class="t1">Novas missões de Carisma</div><div class="t2">Adicionamos ' + added + ' missões para você evoluir o Carisma.</div>'); }, 600);
  }
  function refresh() {
    if (!game) return;
    now = new Date();
    addCarismaPack();
    var g = D.maybeSpawnTrainingBoss(D.maybeSpawnBoss(D.maybeSpawnEmergency(D.expireMissions(game, now), now), now), now);
    var u = D.updateSeason(g, now), gu = D.updateGoals(u.state, now);
    game = gu.state; save();
    var rev = u.events.concat(gu.events);
    if (rev.length) handleEvents(rev);
  }
  /** Executa uma mudança no jogo. `run` devolve { state, events, error }. Retorna true se aplicou. */
  function apply(run, silent) {
    if (!game) return false;
    now = new Date();
    var r = run(game);
    lastError = r.error || null;
    if (r.error) {
      if (!silent) showToast('<div class="t1" style="color:var(--danger)">' + esc(r.error) + '</div>');
      return false;
    }
    game = r.state;
    var u = D.updateSeason(game, now), gu = D.updateGoals(u.state, now);
    game = gu.state;
    save();
    var evs = (r.events || []).concat(u.events, gu.events);
    if (evs.length) handleEvents(evs);
    render();
    return true;
  }
  function setGame(g) { game = g ? D.normalizeState(g) : null; if (game) save(); render(); }
  var act = {
    start: function (name) { game = Object.assign({}, D.createInitialState((name || '').trim() || 'Jogador'), { carismaPack: true }); save(); location.hash = '#/'; render(); },
    progress: function (id) { apply(function (g) { return D.addProgress(g, id, 1); }); },
    complete: function (id) { apply(function (g) { return D.completeMission(g, id); }); },
    remove: function (id) { apply(function (g) { return { state: D.removeMission(g, id), events: [] }; }); },
    create: function (input) { return apply(function (g) { return { state: D.addMission(g, input), events: [] }; }); },
    update: function (id, patch) { return apply(function (g) { return D.updateMission(g, id, patch); }, true); },
    undo: function (id) { if (apply(function (g) { return D.undoCompletion(g, id); })) showToast('<div class="t1">Conclusão desfeita</div>'); },
    rest: function () { apply(function (g) { return D.toggleRestDay(g); }); },
    journal: function (text, mood) {
      journalDraft = null; journalMood = null;
      if (apply(function (g) { return D.saveJournal(g, { text: text, mood: mood }); })) showToast('<div class="t1">Anotação salva</div>');
    },
    rename: function (name) {
      apply(function (g) { return { state: Object.assign({}, g, { player: Object.assign({}, g.player, { name: name.trim() || g.player.name }) }), events: [] }; });
    },
    reset: function () { game = null; try { localStorage.removeItem(KEY); } catch (e) {} location.hash = '#/'; render(); }
  };

  /* ------------------------------ componentes ------------------------------ */
  function panel(title, body, o) {
    o = o || {};
    return '<section class="panel' + (o.cls ? ' ' + o.cls : '') + '" style="--ac:' + (o.accent || 'var(--accent)') + '"><div class="panel-in">' +
      (title ? '<div class="panel-head"><i>◆</i><b>' + esc(title) + '</b><span></span></div>' : '') + body + '</div></section>';
  }
  function bar(ratio, color, h) {
    var r = Math.max(0, Math.min(1, ratio || 0));
    return '<div class="bar" style="--c:' + color + ';--h:' + (h || 8) + 'px"><i data-w="' + (r * 100).toFixed(1) + '" style="width:0"></i></div>';
  }
  function hexPts(c, r) {
    var out = [];
    for (var i = 0; i < 6; i++) { var a = Math.PI / 3 * i - Math.PI / 2; out.push((c + Math.cos(a) * r).toFixed(1) + ',' + (c + Math.sin(a) * r).toFixed(1)); }
    return out.join(' ');
  }
  function rankBadge(rank, size, locked) {
    var color = locked ? '#5B6B8C' : rank.color, c = size / 2;
    var fs = rank.emblem.length > 2 ? size * 0.25 : rank.emblem.length > 1 ? size * 0.3 : size * 0.38;
    return '<span class="hex" style="width:' + size + 'px;height:' + size + 'px;color:' + color + '"><svg width="' + size + '" height="' + size + '">' +
      (locked ? '' : '<polygon points="' + hexPts(c, c - 1) + '" fill="none" stroke="' + color + '" stroke-width="5" opacity=".22"/>') +
      '<polygon points="' + hexPts(c, c - 3) + '" fill="' + color + '22" stroke="' + color + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<polygon points="' + hexPts(c, c * 0.72) + '" fill="none" stroke="' + color + '" stroke-width="1" opacity=".6" stroke-linejoin="round"/></svg>' +
      '<b style="font-size:' + fs + 'px">' + esc(rank.emblem) + '</b></span>';
  }
  /** Personagem do rank `i`. O nível controla a intensidade da aura e o número de anéis do círculo mágico no chão. */
  function figure(i, level, color, w, o) {
    o = o || {};
    var rings = 1 + Math.floor(level / 25), p = Math.min(1, 0.25 + i * 0.05 + (level / 100) * 0.4), ringHtml = '';
    for (var k = 0; k < rings; k++) ringHtml += '<i style="width:' + (100 - k * 16) + '%;height:' + (100 - k * 18) + '%"></i>';
    return '<div class="fig' + (o.locked ? ' locked' : '') + (o.still ? ' static' : '') + '" style="--c:' + color + ';--w:' + w + 'px;--p:' + p.toFixed(2) + '">' +
      '<div class="aura"></div><div class="rings">' + ringHtml + '</div>' +
      '<img src="assets/forms/form-' + i + '.webp" data-n="' + i + '" alt="Personagem ' + esc(D.RANKS[i].name) + '" draggable="false"></div>';
  }
  function chip(label, on, data, color) {
    return '<button type="button" class="chip' + (on ? ' on' : '') + '" ' + (color ? 'style="--c:' + color + '" ' : '') + data + '>' + esc(label) + '</button>';
  }
  function attrRow(id, xp, detailed) {
    var def = D.ATTRIBUTES[id], p = D.attributeProgress(xp), ar = D.attributeRank(p.level);
    return '<div class="attr"><div class="top"><span style="color:' + def.color + '">' + def.glyph + '</span><span class="n">' + esc(detailed ? def.name : def.short) +
      '</span><span class="arank" style="color:' + ar.rank.color + ';border-color:' + ar.rank.color + '" title="Rank do atributo: ' + esc(ar.rank.name) + '">' + esc(ar.rank.id) + '</span><span class="lv" style="color:' + def.color + '">Nv. ' + p.level + '</span></div>' + bar(p.ratio, def.color, detailed ? 8 : 6) +
      (detailed ? '<div class="sub">' + (p.isMax ? 'Nível máximo' : p.xpIntoLevel + '/' + p.xpForNext + ' XP') + ' · ' + esc(def.description) +
        (ar.nextLevel ? ' · próximo rank no Nv. ' + ar.nextLevel : '') + '</div>' : '') + '</div>';
  }
  var DAYS3 = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var MOODS = ['😞', '😕', '😐', '🙂', '😄'];
  function todaysCompletion(id) {
    var t = D.dayKey(now), found = null;
    game.completions.forEach(function (c) { if (c.missionId === id && c.day === t) found = c; });
    return found;
  }
  function bossCard(m) {
    var cur = D.missionProgress(m, now), done = D.isMissionDone(m, now), expired = D.isMissionExpired(m, now), left = Math.max(0, m.target - cur);
    var color = done ? 'var(--success)' : expired ? 'var(--mute)' : 'var(--danger)';
    var tr = m.bossKind === 'training', nf = function (n) { return Number(n).toLocaleString('pt-BR'); };
    return panel(tr ? 'Chefe de treino' : 'Chefe semanal', '<div class="mission boss" data-mid="' + m.id + '"><div class="nm">☠ ' + esc(m.name.replace(/^Chefe: /, '')) + '</div><div class="ds">' + esc(m.description) + '</div>' +
      '<div style="margin-top:12px">' + bar(left / m.target, color, 12) + '<div class="xp-row"><span>' + (done ? 'DERROTADO' : expired ? 'ESCAPOU' : 'Vida: ' + nf(left) + ' / ' + nf(m.target)) +
      '</span><span class="xp">Recompensa +' + m.xp + ' XP</span></div></div>' +
      (!done && !expired && m.deadline ? '<div class="xp-row"><span>' + deadlineText(m.deadline, now) + '</span><span></span></div>' : '') + '</div>',
      { accent: color, cls: done || expired ? 'dimmed' : '' });
  }
  function missionCard(m) {
    if (m.type === 'boss') return bossCard(m);
    var done = D.isMissionDone(m, now), expired = D.isMissionExpired(m, now), cur = D.missionProgress(m, now), sched = D.isMissionScheduled(m, now);
    var accent = m.type === 'emergency' ? 'var(--danger)' : done ? 'var(--success)' : 'var(--accent)';
    var attrs = m.attributes.map(function (a) { return '<span class="tag">' + esc(D.ATTRIBUTES[a].glyph + ' ' + D.ATTRIBUTES[a].short) + '</span>'; }).join('');
    var locked = D.isMissionLocked(game, m, now), hasSubs = !!(m.subtasks && m.subtasks.length);
    var doneSubs = m.progress && m.progress.periodKey === D.periodKey(m.type, now) ? (m.progress.done || []) : [];
    var pre = m.requires ? game.missions.filter(function (x) { return x.id === m.requires; })[0] : null;
    var nexts = game.missions.filter(function (x) { return x.requires === m.id && x.status === 'active'; });
    var progress = m.target > 1 ? '<div style="margin-top:10px">' + bar(cur / m.target, accent === 'var(--accent)' ? 'var(--accent)' : accent, 6) +
      '<div class="xp-row"><span>' + cur + '/' + m.target + (hasSubs ? ' subtarefas' : ' etapas') + '</span></div></div>' : '';
    var subs = hasSubs ? '<div class="subs">' + m.subtasks.map(function (t) {
      var on = done || doneSubs.indexOf(t.id) >= 0, can = !done && !expired && sched && !locked;
      return '<button type="button" class="sub' + (on ? ' on' : '') + '" ' + (can ? 'data-act="subtask" data-id="' + m.id + '" data-sub="' + t.id + '"' : 'disabled') + '><i>' + (on ? '✓' : '') + '</i><span>' + esc(t.text) + '</span></button>';
    }).join('') + '</div>' : '';
    var chain = (pre ? '<div class="chain">⛓ Depende de “' + esc(pre.name) + '”</div>' : '') + (nexts.length ? '<div class="chain">→ Libera: ' + nexts.map(function (x) { return '“' + esc(x.name) + '”'; }).join(', ') + '</div>' : '');
    var comp = done ? todaysCompletion(m.id) : null;
    var days = m.days && m.days.length ? '<span>' + m.days.map(function (d) { return DAYS3[d]; }).join(' · ') + '</span>' : '';
    var action = done ? '<p class="status">✓ CONCLUÍDA</p>' + (comp ? '<button class="btn ghost small" style="margin-top:8px" data-act="undo" data-id="' + comp.id + '">↶ Desfazer</button>' : '')
      : expired ? '<p class="status" style="color:var(--danger)">✕ EXPIRADA</p>'
      : locked ? '<p class="status" style="color:var(--mute)">🔒 BLOQUEADA · conclua “' + esc(pre ? pre.name : '') + '” antes</p>'
      : !sched ? '<p class="status" style="color:var(--mute)">FOLGA HOJE</p>'
      : '<div class="actions">' + (hasSubs ? '' : m.target > 1 ? '<button class="btn" data-act="progress" data-id="' + m.id + '">+1 etapa</button>' : '<button class="btn" data-act="complete" data-id="' + m.id + '">Concluir missão</button>') +
        '<button class="btn ghost focus-btn" data-act="focus" data-id="' + m.id + '" title="Sessão de foco (F)" aria-label="Sessão de foco">◉ Focar</button></div>';
    return panel(null,
      '<button class="del" title="Remover missão" aria-label="Remover missão" data-act="remove" data-id="' + m.id + '" data-name="' + esc(m.name) + '">✕</button>' +
      '<a class="edit" href="#/edit/' + m.id + '" title="Editar missão" aria-label="Editar missão">✎</a>' +
      '<div class="mission" data-mid="' + m.id + '"><div class="top"><div style="flex:1;min-width:0"><div class="nm">' + esc(m.name) + '</div>' + (m.description ? '<div class="ds">' + esc(m.description) + '</div>' : '') +
      '</div><div class="diff" style="color:' + DIFF_COLOR[m.difficulty] + ';border-color:' + DIFF_COLOR[m.difficulty] + '">' + m.difficulty + '</div></div>' +
      '<div class="meta"><span class="xp">+' + m.xp + ' XP</span><span>' + TYPE_LABEL[m.type] + '</span>' + days +
      (m.durationMin ? '<span>' + m.durationMin + ' min</span>' : '') +
      (m.deadline && !done ? '<span style="color:' + (expired ? 'var(--danger)' : 'var(--gold)') + '">' + deadlineText(m.deadline, now) + '</span>' : '') + '</div>' +
      '<div style="margin-top:8px">' + attrs + '</div>' + chain + progress + subs + '<div style="margin-top:12px">' + action + '</div></div>',
      { accent: accent, cls: done || expired || !sched || locked ? 'dimmed' : '' });
  }

  /* ------------------------------ telas ------------------------------ */
  function viewOnboarding() {
    return '<div class="stack onb"><h1 class="logo">AWAKENING</h1><p class="tagline">Cada dia é uma nova missão.</p>' +
      figure(0, 1, '#8A94A6', 170) +
      panel('Sistema', '<p style="margin:0 0 14px;line-height:1.35">Você foi escolhido para evoluir. Sua vida real agora é o campo de batalha: cada hábito, estudo e treino concede XP e fortalece seus atributos.</p>' +
        '<p class="label">NOME DO JOGADOR</p><input id="onb-name" class="input" maxlength="24" placeholder="Como o sistema deve chamar você?" autocomplete="nickname" />' +
        '<div style="margin-top:16px"><button class="btn" data-act="start">Despertar</button></div>') +
      '<p class="foot">Rank E · Nível 1 · O caminho até o MONARCA começa aqui.</p></div>';
  }

  function daysSince(iso) { return iso ? (Date.now() - new Date(iso).getTime()) / 86400000 : Infinity; }
  function banners() {
    var out = '';
    if (!storageOk) out += panel(null, '<p class="error small" style="margin:0">Não foi possível salvar neste navegador (modo privado?). O progresso será perdido ao fechar.</p>', { accent: 'var(--danger)' });
    var snoozed = S.backupSnooze && new Date(S.backupSnooze).getTime() > Date.now();
    var since = daysSince(S.lastBackup || game.player.createdAt);
    if (S.backupEvery > 0 && !snoozed && game.completions.length > 0 && since >= S.backupEvery) {
      out += panel('Backup', '<p style="margin:0 0 12px;color:var(--dim)">' + (S.lastBackup ? 'Faz ' + Math.floor(since) + ' dias desde o último backup.' : 'Você ainda não fez backup do seu progresso.') +
        ' Se os dados do navegador forem apagados, tudo se perde.</p><div class="row2"><button class="btn" data-act="backup-now">Exportar agora</button><button class="btn ghost" data-act="backup-snooze">Lembrar amanhã</button></div>', { accent: 'var(--gold)' });
    }
    return out;
  }
  function seasonMini() {
    var p = D.seasonProgress(game, now);
    if (!p) return '';
    return panel('Temporada · ' + p.season.name,
      bar(p.xp / p.season.goalXp, 'var(--gold)', 8) + '<div class="xp-row"><span>' + Math.min(p.xp, p.season.goalXp) + ' / ' + p.season.goalXp + ' XP</span><span>' + p.activeDays + '/' + D.SEASON_DAYS_GOAL + ' dias · faltam ' + p.daysLeft + '</span></div>' +
      '<a class="small" style="color:var(--glow);display:inline-block;margin-top:8px" href="#/stats">Ver detalhes</a>', { accent: 'var(--gold)' });
  }
  function viewDashboard() {
    var rank = D.RANKS[game.rankIndex], lvl = D.levelProgress(game.totalXp), pending = D.pendingDaily(game, now);
    var frameIdx = game.player.frame != null ? game.player.frame : game.rankIndex, frameColor = D.RANKS[frameIdx].color;
    var title = D.currentTitle(game), today = D.dayKey(now), isRest = (game.restDays || []).indexOf(today) >= 0;
    var week = D.xpByDay(game, now, 7), weekTotal = week.reduce(function (s, d) { return s + d.xp; }, 0);
    var maxDay = Math.max.apply(null, [1].concat(week.map(function (d) { return d.xp; })));
    var weekly = game.missions.filter(function (m) { return m.type === 'weekly' && m.status === 'active'; });
    var weeklyDone = weekly.filter(function (m) { return D.isMissionDone(m, now); }).length;
    var next = D.nextAchievement(game, now);
    var bosses = game.missions.filter(function (m) { return m.type === 'boss' && m.progress.periodKey === D.weekKey(now); });
    var doneToday = game.completions.filter(function (c) { return c.day === today && c.kind !== 'boss'; });
    var entry = (game.journal || []).filter(function (j) { return j.day === today; })[0];
    var jt = journalDraft != null ? journalDraft : (entry ? entry.text : ''), jm = journalMood != null ? journalMood : (entry && entry.mood) || 0;
    var html = '<div class="hdr"><div style="min-width:0"><div class="greet">' + greeting(now.getHours()) + ',</div><h1 class="name">' + esc(game.player.name) + '.</h1>' +
      (title ? '<div class="ttl" style="color:' + title.color + '">' + esc(title.label) + '</div>' : '') + '</div>' +
      '<div class="hdr-r"><a class="coins" href="#/store" title="Suas moedas — abrir a loja">◆ ' + D.coinBalance(game) + '</a><a class="gear" href="#/settings" aria-label="Ajustes e backup" title="Ajustes e backup">⚙</a></div></div>';
    html += banners();

    html += panel('Status',
      '<div class="hero">' + figure(game.rankIndex, lvl.level, rank.color, 300) +
      '<div class="side left" style="color:' + rank.color + '">' + rankBadge(rank, 52) + '<div class="lab">' + esc(rank.title) + '</div></div>' +
      '<div class="side right"><div class="lv-l">NÍVEL</div><div class="lv-n" style="color:' + rank.color + '">' + lvl.level + '</div><div class="mute small">/ 100</div></div></div>' +
      '<p class="rank-name" style="color:' + rank.color + '">' + esc(rank.name) + '</p><p class="rank-sub">' + esc(rank.description) + '</p>' +
      '<div style="margin-top:16px">' + bar(lvl.ratio, 'var(--glow)', 10) + '<div class="xp-row"><span>' +
      (lvl.isMax ? 'NÍVEL MÁXIMO' : lvl.xpIntoLevel + ' / ' + lvl.xpForNext + ' XP') + '</span><span style="color:var(--success)">Hoje +' + D.xpToday(game, now) + ' XP</span></div></div>',
      { accent: frameColor });

    bosses.forEach(function (b) { html += bossCard(b); });
    html += (window.AW && AW.reviewBanner ? AW.reviewBanner() : '') + seasonMini() + (window.AW && AW.goalsMini ? AW.goalsMini() : '');
    html += panel('Atributos', '<div class="attr-grid">' + D.ATTRIBUTE_IDS.map(function (id) { return attrRow(id, game.attributeXp[id], false); }).join('') + '</div>');

    html += '<div class="stack"><div class="section"><b>MISSÕES DE HOJE</b><span class="dim small" style="font-weight:700">' + (isRest ? 'descanso' : pending.length + ' pendentes') + '</span></div>' +
      (isRest ? panel(null, '<p style="margin:0 0 12px;color:var(--glow);font-weight:600">Hoje é dia de descanso. Sua sequência está protegida e nada é cobrado. Se mudar de ideia, qualquer missão ainda vale XP.</p><button class="btn ghost" data-act="rest">Cancelar descanso</button>', { accent: 'var(--glow)' }) : '') +
      (pending.length === 0 && !isRest ? panel(null, '<p style="margin:0;color:var(--success);font-weight:600">Todas as missões diárias foram concluídas. Descanse, você mereceu.</p>', { accent: 'var(--success)' })
        : pending.slice(0, 3).map(missionCard).join('')) +
      '<a class="btn ghost" style="text-decoration:none" href="#/missions">' + (pending.length > 3 ? 'Ver todas as missões (+' + (pending.length - 3) + ')' : 'Ir para as missões') + '</a>' +
      (!isRest && doneToday.length === 0 ? '<button class="btn ghost small" data-act="rest" title="Protege a sequência sem cobrar missões (até 2 por semana)">Hoje é dia de descanso</button>' : '') + '</div>';

    if (doneToday.length) {
      html += panel('Concluídas hoje', '<div class="stack" style="gap:8px">' + doneToday.slice().reverse().map(function (c) {
        return '<div class="done-row"><span class="ok">✓</span><span style="flex:1;min-width:0">' + esc(c.missionName) + '</span><span class="xp">+' + c.xp + '</span>' +
          '<button class="mini" data-act="undo" data-id="' + c.id + '" title="Desfazer" aria-label="Desfazer ' + esc(c.missionName) + '">↶</button></div>';
      }).join('') + '</div>', { accent: 'var(--success)' });
    }

    html += panel('Diário de hoje', '<textarea id="journal-text" class="input" maxlength="280" placeholder="Como foi o dia? Uma frase basta.">' + esc(jt) + '</textarea>' +
      '<div class="row" style="margin-top:10px" role="group" aria-label="Como você se sentiu">' + MOODS.map(function (m, i) {
        return chip(m, jm === i + 1, 'data-act="mood" data-id="' + (i + 1) + '" aria-label="Humor ' + (i + 1) + ' de 5"');
      }).join('') + '</div><div style="margin-top:12px"><button class="btn" data-act="journal-save">' + (entry ? 'Atualizar anotação' : 'Salvar anotação') + '</button></div>');

    html += panel('Progresso semanal',
      '<div class="weekbars">' + week.map(function (d, i) {
        var dow = new Date(d.day + 'T12:00:00').getDay();
        return '<div class="col"><div class="t"><i style="height:' + Math.max(4, d.xp / maxDay * 100) + '%;background:' + (d.xp > 0 ? 'var(--accent)' : 'rgba(var(--tint),.25)') + '"></i></div><span' +
          (i === week.length - 1 ? ' style="color:var(--glow)"' : '') + '>' + WEEKDAY[dow] + '</span></div>';
      }).join('') + '</div><div class="xp-row"><span>' + weekTotal + ' XP em 7 dias</span>' + (weekly.length ? '<span>Semanais: ' + weeklyDone + '/' + weekly.length + '</span>' : '') + '</div>');

    if (next) {
      html += panel('Próxima conquista', '<div class="ach"><div style="font-size:28px;color:var(--gold)">' + next.def.icon + '</div><div style="flex:1"><b>' + esc(next.def.name) + '</b><div class="d">' +
        esc(next.def.description) + '</div><div style="margin:6px 0">' + bar(next.current / next.target, 'var(--gold)', 6) + '</div><div class="d">' + next.current + '/' + next.target + ' · +' + next.def.rewardXp + ' XP</div></div></div>', { accent: 'var(--gold)' });
    }
    return html;
  }

  var tab = 'daily';
  function viewMissions() {
    var rk = function (m) { return D.isMissionExpired(m, now) ? 2 : D.isMissionDone(m, now) ? 1 : !D.isMissionScheduled(m, now) || D.isMissionLocked(game, m, now) ? 1 : 0; };
    var types = ['daily', 'weekly', 'special', 'emergency', 'boss'];
    var list = game.missions.filter(function (m) { return m.type === tab; }).sort(function (a, b) { return rk(a) - rk(b); });
    var html = '<h1 class="screen-title">MISSÕES</h1><div class="row">' + types.map(function (t) {
      var n = game.missions.filter(function (m) { return m.type === t && rk(m) === 0; }).length;
      return chip(n > 0 ? TYPE_LABEL[t] + ' · ' + n : TYPE_LABEL[t], tab === t, 'data-act="tab" data-id="' + t + '"', t === 'emergency' || t === 'boss' ? 'var(--danger)' : null);
    }).join('') + '</div><a class="btn ghost" style="text-decoration:none" href="#/new">+ Nova missão</a>';
    var empty = tab === 'emergency' ? 'Nenhum alerta ativo. De vez em quando o sistema lança desafios inesperados com prazo de 24 horas.'
      : tab === 'boss' ? 'Todo começo de semana um chefe aparece, depois que você concluir suas primeiras missões. Cada missão concluída causa dano igual ao seu XP. Quem treina pela aba Treino também enfrenta um chefe de treino, ferido pelo volume levantado e pelos minutos treinados.'
      : 'Nenhuma missão nesta categoria. Crie a sua!';
    html += list.length === 0 ? panel(null, '<p class="dim" style="margin:0;line-height:1.4">' + empty + '</p>') : list.map(missionCard).join('');
    return html;
  }

  function describeEvent(e) {
    switch (e.type) {
      case 'levelUp': return 'Nível ' + e.from + ' → ' + e.to;
      case 'rankUp': return 'Rank ' + e.from + ' → ' + e.to;
      case 'achievement': var a = D.achievementById(e.achievementId); return 'Conquista: ' + (a ? a.name : e.achievementId);
      case 'attributeUp': return D.ATTRIBUTES[e.attribute].name + ' → Nv. ' + e.to;
    }
    return '';
  }
  function titlesPanel() {
    var titles = D.availableTitles(game), cur = game.player.title, fr = game.player.frame;
    return panel('Título e moldura', '<p class="label">TÍTULO</p><div class="row">' + chip('Nenhum', !cur, 'data-act="title" data-id=""') +
      titles.map(function (t) { return chip(t.label, cur === t.id, 'data-act="title" data-id="' + esc(t.id) + '"', t.color); }).join('') +
      '</div><p class="label" style="margin-top:16px">MOLDURA (COR DA JANELA)</p><div class="row">' + chip('Automática', fr == null, 'data-act="frame" data-id=""') +
      D.RANKS.slice(0, game.rankIndex + 1).map(function (r, i) { return chip(r.id, fr === i, 'data-act="frame" data-id="' + i + '"', r.color); }).join('') + '</div>');
  }
  function viewCharacter() {
    var rank = D.RANKS[game.rankIndex], lvl = D.levelProgress(game.totalXp), stats = D.deriveStats(game, now), up = D.nextRank(game, now);
    var frameColor = D.RANKS[game.player.frame != null ? game.player.frame : game.rankIndex].color, curTitle = D.currentTitle(game);
    var html = panel('Personagem',
      '<div style="display:flex;flex-direction:column;align-items:center;gap:4px">' + figure(game.rankIndex, lvl.level, rank.color, 290) +
      '<input id="char-name" class="name-input" maxlength="24" value="' + esc(game.player.name) + '" aria-label="Nome do personagem" />' +
      '<div style="font-family:var(--display);font-size:12px;letter-spacing:1.5px;color:' + rank.color + '">' + esc(rank.name) + ' · ' + esc(rank.title) + '</div>' +
      (curTitle ? '<div style="font-weight:700;letter-spacing:1px;color:' + curTitle.color + '">' + esc(curTitle.label) + '</div>' : '') +
      '<div class="dim" style="font-weight:600">Nível ' + lvl.level + ' · ' + game.totalXp + ' XP</div>' +
      '<div id="save-name" class="hidden" style="align-self:stretch;margin-top:10px"><button class="btn" data-act="rename">Salvar nome</button></div></div>', { accent: frameColor });

    html += titlesPanel();
    html += panel('Atributos', '<div class="stack" style="gap:18px">' + D.ATTRIBUTE_IDS.map(function (id) { return attrRow(id, game.attributeXp[id], true); }).join('') + '</div>');

    html += window.AW && AW.goalsPanel ? AW.goalsPanel() : '';
    var forms = D.RANKS.map(function (r, i) {
      var reached = i <= game.rankIndex, current = i === game.rankIndex;
      return '<div class="form' + (current ? ' cur' : '') + '" style="--c:' + r.color + '">' + figure(i, current ? lvl.level : r.requirements.minLevel, r.color, 88, { locked: !reached, still: true }) +
        rankBadge(r, 34, !reached) + '<div class="id" style="color:' + (reached ? r.color : 'var(--mute)') + '">' + r.id + '</div><div class="lv">' +
        (reached ? (current ? 'ATUAL' : 'Nv. ' + r.requirements.minLevel) : '🔒 Nv. ' + r.requirements.minLevel) + '</div></div>';
    }).join('');
    var next = '<p class="dim" style="color:var(--gold)">Você alcançou o ápice. O trono é seu.</p>';
    if (up) {
      next = '<div class="stack" style="margin-top:16px;gap:14px"><div class="label" style="color:' + up.rank.color + '">PRÓXIMO: ' + esc(up.rank.name.toUpperCase()) + ' · ' + esc(up.rank.title.toUpperCase()) + '</div>' +
        up.checks.map(function (c) {
          var label = c.label.indexOf('Conquista: ') === 0 ? 'Conquista: ' + ((D.achievementById(c.label.slice(11)) || {}).name || c.label.slice(11)) : c.label;
          return '<div class="check' + (c.met ? ' met' : '') + '"><div class="r"><span>' + (c.met ? '✓ ' : '') + esc(label) + '</span><span>' + Math.min(c.current, c.target) + '/' + c.target + '</span></div>' +
            bar(c.target === 0 ? 1 : c.current / c.target, c.met ? 'var(--success)' : up.rank.color, 5) + '</div>';
        }).join('') + '</div>';
    }
    html += panel('Hierarquia', '<div class="forms" id="forms">' + forms + '</div><p class="dim" style="margin:8px 0 0">' + esc(rank.description) + '</p>' + next, { accent: rank.color });

    html += panel('Conquistas · ' + stats.unlockedCount + '/' + D.ACHIEVEMENTS.length,
      '<div class="stack" style="gap:14px">' + D.ACHIEVEMENTS.map(function (a) {
        var got = !!game.unlocked[a.id], p = D.achievementProgress(a, stats), color = got ? D.RARITY_COLOR[a.rarity] : 'var(--mute)';
        return '<div class="ach" style="opacity:' + (got ? 1 : .75) + '"><div class="ic" style="color:' + color + ';border-color:' + color + '">' + (got ? a.icon : '🔒') + '</div><div style="flex:1"><b style="color:' +
          (got ? 'var(--text)' : 'var(--dim)') + '">' + esc(a.name) + '</b><div class="d">' + esc(a.description) + '</div><div class="m" style="color:' + color + '">' +
          D.RARITY_LABEL[a.rarity] + ' · +' + a.rewardXp + ' XP' + (!got ? '  ·  ' + p.current + '/' + p.target : '') + '</div></div></div>';
      }).join('') + '</div>', { accent: 'var(--gold)' });

    var history = game.history.slice().reverse().slice(0, 12);
    html += panel('Histórico de evolução', history.length === 0 ? '<p class="dim" style="margin:0">Sua história começa na primeira missão concluída.</p>' :
      '<div class="stack" style="gap:8px">' + history.map(function (e) { return '<div class="hist"><span class="dt">' + dm(e.at) + '</span><span>' + esc(describeEvent(e)) + '</span></div>'; }).join('') + '</div>');
    if ((game.seasonBadges || []).length) {
      html += panel('Insígnias de temporada', '<div class="row">' + game.seasonBadges.map(function (b) { return '<span class="tag" style="color:var(--gold);border-color:var(--gold)">★ ' + esc(b.name) + '</span>'; }).join('') + '</div>', { accent: 'var(--gold)' });
    }
    html += '<div class="stack"><button class="btn" data-act="share-card">Cartão do personagem</button><a class="btn ghost" style="text-decoration:none" href="#/settings">Ajustes e backup</a>' +
      '<button class="btn danger" data-act="reset">Reiniciar jornada</button></div>';
    if (!storageOk) html += '<p class="error small" style="text-align:center">Não foi possível salvar neste navegador (modo privado?). O progresso será perdido ao fechar.</p>';
    return html;
  }

  /* ------------------------------ nova missão / editar ------------------------------ */
  var form = null;
  var DURATIONS = [0, 15, 30, 60, 90];
  var DEADLINES = [{ l: 'Sem prazo', d: null }, { l: '7 dias', d: 7 }, { l: '30 dias', d: 30 }, { l: '90 dias', d: 90 }];
  var TEMPLATES = [
    { n: 'Treino', d: 'Treino completo do dia.', t: 'daily', f: 'C', xp: 60, a: ['forca', 'vitalidade'] },
    { n: 'Estudar 1 hora', d: 'Estudo focado, sem distrações.', t: 'daily', f: 'C', xp: 50, a: ['inteligencia', 'foco'], dur: 60 },
    { n: 'Leitura', d: 'Ler 20 páginas com atenção plena.', t: 'daily', f: 'D', xp: 30, a: ['foco', 'inteligencia'], dur: 30 },
    { n: 'Meditar 15 min', d: 'Respiração e silêncio.', t: 'daily', f: 'E', xp: 15, a: ['foco', 'vitalidade'], dur: 15 },
    { n: 'Beber 2 L de água', d: '', t: 'daily', f: 'E', xp: 10, a: ['vitalidade'] },
    { n: 'Dormir cedo', d: 'Na cama no horário combinado.', t: 'daily', f: 'D', xp: 25, a: ['vitalidade', 'disciplina'] },
    { n: 'Caminhada', d: '30 minutos ao ar livre.', t: 'daily', f: 'D', xp: 30, a: ['vitalidade', 'forca'], dur: 30 },
    { n: 'Conversar com alguém', d: 'Puxe papo com um colega, amigo ou alguém novo.', t: 'daily', f: 'D', xp: 30, a: ['carisma'] },
    { n: 'Ligar para alguém querido', d: 'Uma ligação para um amigo ou familiar.', t: 'daily', f: 'D', xp: 30, a: ['carisma', 'vitalidade'] },
    { n: 'Elogio sincero', d: 'Faça um elogio genuíno a alguém hoje.', t: 'daily', f: 'E', xp: 15, a: ['carisma'] },
    { n: 'Agradecer alguém', d: 'Diga obrigado com um motivo específico.', t: 'daily', f: 'E', xp: 15, a: ['carisma'] },
    { n: 'Falar em público', d: 'Apresente, opine em reunião ou grave um vídeo falando.', t: 'daily', f: 'B', xp: 100, a: ['carisma', 'foco'] },
    { n: 'Praticar escuta ativa', d: 'Numa conversa, só pergunte e escute, sem interromper.', t: 'daily', f: 'D', xp: 30, a: ['carisma', 'foco'] },
    { n: 'Networking da semana', d: 'Conecte-se com 3 pessoas da sua área ou de interesse.', t: 'weekly', f: 'C', xp: 200, a: ['carisma', 'inteligencia'], target: 3 },
    { n: 'Encontro social', d: 'Marque e vá a um encontro com amigos ou familiares.', t: 'weekly', f: 'D', xp: 120, a: ['carisma', 'vitalidade'] },
    { n: 'Treino seg · qua · sex', d: 'Treino nos dias fixos da semana.', t: 'daily', f: 'C', xp: 60, a: ['forca', 'disciplina'], days: [1, 3, 5] },
    { n: 'Organizar a semana', d: 'Planejar compromissos e prioridades.', t: 'weekly', f: 'D', xp: 100, a: ['disciplina', 'foco'] },
    { n: 'Treinar 3 vezes', d: 'Três treinos nesta semana.', t: 'weekly', f: 'C', xp: 200, a: ['forca', 'disciplina'], target: 3 }
  ];
  function newForm() {
    return { editId: null, name: '', description: '', type: 'daily', difficulty: 'C', xp: String(D.suggestedXp('daily', 'C')), xpEdited: false, attrs: [], target: 1, duration: 0, deadlineDays: null, days: [], subtasks: [], subDraft: '', requires: '', error: null };
  }
  function formFromMission(m) {
    return { editId: m.id, name: m.name, description: m.description || '', type: m.type, difficulty: m.difficulty, xp: String(m.xp), xpEdited: true, attrs: m.attributes.slice(),
      target: m.target, duration: m.durationMin || 0, deadlineDays: null, days: (m.days || []).slice(), subtasks: (m.subtasks || []).map(function (t) { return t.text; }), subDraft: '', requires: m.requires || '', error: null };
  }
  function applyTemplate(i) {
    var t = TEMPLATES[i]; if (!t) return;
    Object.assign(form, { name: t.n, description: t.d || '', type: t.t, difficulty: t.f, xp: String(t.xp), xpEdited: true, attrs: t.a.slice(), target: t.target || 1, duration: t.dur || 0, days: (t.days || []).slice(), deadlineDays: null, subtasks: [], subDraft: '', requires: '', error: null });
  }
  function suggest() { if (!form.xpEdited) form.xp = String(D.suggestedXp(form.type, form.difficulty)); }
  function viewNew() {
    var r = route(), editing = r.indexOf('#/edit/') === 0 ? game.missions.filter(function (x) { return x.id === r.slice(7); })[0] : null;
    if (r.indexOf('#/edit/') === 0 && !editing) { location.hash = '#/missions'; return ''; }
    if (editing && (!form || form.editId !== editing.id)) form = formFromMission(editing);
    else if (!editing && (!form || form.editId)) form = newForm();
    var f = form, isEdit = !!f.editId;
    var durs = DURATIONS.indexOf(f.duration) < 0 ? DURATIONS.concat(f.duration) : DURATIONS;
    return '<div class="between"><h1 class="screen-title">' + (isEdit ? 'EDITAR MISSÃO' : 'NOVA MISSÃO') + '</h1><a class="close" href="#/missions" aria-label="Fechar" style="text-decoration:none;color:var(--dim)">✕</a></div>' +
      (isEdit ? '' : panel('Modelos', '<div class="row">' + TEMPLATES.map(function (t, i) { return chip(t.n, false, 'data-act="f-tpl" data-id="' + i + '"'); }).join('') + '</div><p class="help">Toque em um modelo para preencher o formulário e ajuste o que quiser.</p>')) +
      panel('Detalhes', '<p class="label">NOME</p><input class="input" data-field="name" maxlength="60" placeholder="Ex.: Estudar JavaScript" value="' + esc(f.name) + '" />' +
        '<p class="label" style="margin-top:16px">DESCRIÇÃO (OPCIONAL)</p><textarea class="input" data-field="description" maxlength="160" placeholder="O que precisa ser feito?">' + esc(f.description) + '</textarea>') +
      panel('Tipo e dificuldade', '<div class="row">' + (isEdit ? chip(TYPE_LABEL[f.type], true, 'disabled') : ['daily', 'weekly', 'special'].map(function (t) { return chip(TYPE_LABEL[t], f.type === t, 'data-act="f-type" data-id="' + t + '"'); }).join('')) + '</div>' +
        (f.type === 'daily' ? '<p class="label" style="margin-top:16px">DIAS DA SEMANA</p><div class="row">' + DAYS3.map(function (d, i) { return chip(d, f.days.indexOf(i) >= 0, 'data-act="f-day" data-id="' + i + '"'); }).join('') + '</div><p class="help">Sem nenhum dia marcado, a missão vale todos os dias. Nos outros dias ela fica de folga.</p>' : '') +
        '<p class="label" style="margin-top:16px">DIFICULDADE</p><div class="row">' + ['E', 'D', 'C', 'B', 'A', 'S'].map(function (d) { return chip(d, f.difficulty === d, 'data-act="f-diff" data-id="' + d + '"', DIFF_COLOR[d]); }).join('') + '</div>' +
        (f.type === 'special' && !isEdit ? '<p class="label" style="margin-top:16px">PRAZO</p><div class="row">' + DEADLINES.map(function (d) { return chip(d.l, f.deadlineDays === d.d, 'data-act="f-deadline" data-id="' + d.d + '"'); }).join('') + '</div>' : '')) +
      panel('Recompensa', '<p class="label">XP (1 A ' + D.MAX_MISSION_XP + ')</p><input class="input" data-field="xp" inputmode="numeric" maxlength="4" value="' + esc(f.xp) + '" style="font-weight:700" />' +
        '<p class="help">Sugestão para o tipo e a dificuldade escolhidos: ' + D.suggestedXp(f.type, f.difficulty) + ' XP.</p>' +
        '<p class="label" style="margin-top:16px">ATRIBUTOS BENEFICIADOS</p><div class="row">' + D.ATTRIBUTE_IDS.map(function (id) {
          return chip(D.ATTRIBUTES[id].glyph + ' ' + D.ATTRIBUTES[id].name, f.attrs.indexOf(id) >= 0, 'data-act="f-attr" data-id="' + id + '"', D.ATTRIBUTES[id].color);
        }).join('') + '</div>') +
      panel('Subtarefas', '<div class="subs edit">' + f.subtasks.map(function (t, i) {
        return '<div class="sub-row"><span>' + esc(t) + '</span><button type="button" class="mini" data-act="f-sub-del" data-id="' + i + '" aria-label="Remover subtarefa ' + esc(t) + '">✕</button></div>';
      }).join('') + '</div>' + (f.subtasks.length < 12 ? '<div class="sub-add"><input class="input" data-field="subDraft" maxlength="60" placeholder="Ex.: Preparar a mochila" value="' + esc(f.subDraft) + '" /><button type="button" class="btn ghost small" data-act="f-sub-add" style="width:auto">+ Adicionar</button></div>' : '') +
        '<p class="help">Opcional. Com subtarefas, a missão vira uma lista: cada item marcado é uma etapa e o XP vem ao concluir todos (até 12).</p>') +
      panel('Depende de', '<div class="row">' + chip('Nenhuma', !f.requires, 'data-act="f-req" data-id=""') + game.missions.filter(function (x) {
        return x.status === 'active' && x.id !== f.editId && x.type !== 'boss' && x.type !== 'emergency' && !D.isMissionExpired(x, now);
      }).map(function (x) { return chip(x.name.length > 26 ? x.name.slice(0, 25) + '…' : x.name, f.requires === x.id, 'data-act="f-req" data-id="' + x.id + '"'); }).join('') + '</div>' +
        '<p class="help">Missão em cadeia: ela só aparece para cumprir depois que a escolhida for concluída (no mesmo período).</p>') +
      (f.subtasks.length ? '' : panel('Meta', '<p class="label">ETAPAS PARA CONCLUIR</p><div class="stepper"><button type="button" data-act="f-dec" aria-label="Menos">−</button><b>' + f.target + '</b><button type="button" data-act="f-inc" aria-label="Mais">+</button></div>' +
        '<p class="help">Ex.: “Treinar 4 vezes” = 4 etapas. O XP só é pago ao completar todas.' + (isEdit ? ' A meta só muda se não houver etapas feitas neste período.' : '') + '</p>' +
        '<p class="label" style="margin-top:16px">DURAÇÃO (MIN)</p><div class="row">' + durs.map(function (d) { return chip(d === 0 ? 'Nenhuma' : String(d), f.duration === d, 'data-act="f-dur" data-id="' + d + '"'); }).join('') + '</div>' +
        '<p class="help">Missões de Inteligência com duração somam nas horas de estudo.</p>')) +
      (f.error ? '<p class="error">' + esc(f.error) + '</p>' : '') +
      '<button class="btn" data-act="f-save">' + (isEdit ? 'Salvar alterações' : 'Criar missão') + '</button>';
  }
  function addSub() {
    var t = (form.subDraft || '').trim();
    if (!t) return;
    if (form.subtasks.length >= 12) { form.error = 'No máximo 12 subtarefas.'; return render(); }
    form.subtasks.push(t.slice(0, 60)); form.subDraft = ''; form.error = null; render();
    var el = $app.querySelector('[data-field=subDraft]'); if (el) el.focus();
  }
  function saveForm() {
    var f = form, xp = parseInt(f.xp, 10);
    var input = {
      name: f.name, description: f.description, type: f.type, difficulty: f.difficulty, xp: isFinite(xp) ? xp : undefined, attributes: f.attrs, target: f.subtasks.length || f.target,
      subtasks: f.subtasks.length ? f.subtasks : undefined, requires: f.requires || undefined,
      durationMin: f.duration || undefined, days: f.type === 'daily' ? f.days : undefined,
      deadline: f.type === 'special' && f.deadlineDays ? new Date(Date.now() + f.deadlineDays * 86400000).toISOString() : undefined
    };
    var problem = D.validateMissionInput(input);
    if (problem) { f.error = problem; return render(); }
    if (f.editId) {
      var patch = { name: input.name, description: input.description, difficulty: input.difficulty, xp: input.xp, attributes: input.attributes, target: input.target, durationMin: input.durationMin, days: input.days, subtasks: f.subtasks.slice(), requires: f.requires || null };
      if (!act.update(f.editId, patch)) { f.error = lastError; return render(); }
      showToast('<div class="t1">Missão atualizada</div>');
    } else act.create(input);
    form = null; location.hash = '#/missions';
  }

  /* ------------------------------ eventos (modal / aviso) ------------------------------ */
  var toastTimer = null;
  function showToast(html, undoId) {
    $toast.innerHTML = html + (undoId ? '<button class="toast-undo" data-act="undo" data-id="' + undoId + '">↶ Desfazer</button>' : '');
    $toast.classList.toggle('actionable', !!undoId);
    $toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { $toast.classList.remove('show', 'actionable'); }, undoId ? 6000 : 3000);
  }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function handleEvents(events) {
    var levelUp = events.find(function (e) { return e.type === 'levelUp'; });
    var rankUp = events.find(function (e) { return e.type === 'rankUp'; });
    var xpEv = events.find(function (e) { return e.type === 'xp'; });
    if (levelUp || rankUp) return showModal(events, levelUp, rankUp);
    var lines = [];
    events.forEach(function (e) {
      if (e.type === 'achievement') lines.push('✦ Conquista desbloqueada: ' + esc(e.name));
      else if (e.type === 'attributeUp') lines.push('▲ ' + esc(e.attribute.toUpperCase()) + ' Nv. ' + e.to);
      else if (e.type === 'boss') lines.push('☠ Chefe derrotado: ' + esc(e.name.replace('Chefe: ', '')) + ' (+' + e.amount + ' XP)');
      else if (e.type === 'bossHit' && e.left > 0) lines.push(e.kind === 'training' ? '⚔ Chefe de treino −' + e.damage.toLocaleString('pt-BR') + ' de vida (restam ' + e.left.toLocaleString('pt-BR') + ')' : '⚔ Chefe −' + e.damage + ' de vida (restam ' + e.left + ')');
      else if (e.type === 'workout') lines.push('💪 Treino: +' + e.xp + ' XP em ' + (e.attribute === 'forca' ? 'Força' : 'Vitalidade') + (e.prs ? ' (' + e.prs + (e.prs === 1 ? ' recorde' : ' recordes') + ')' : ''));
      else if (e.type === 'workoutCap') lines.push('Limite de ' + e.cap + ' treinos com XP por dia atingido.');
      else if (e.type === 'seasonTier') lines.push('★ Temporada ' + esc(e.name) + ': marco ' + e.tier + '/3 (+' + e.coins + ' moedas)');
      else if (e.type === 'seasonEnd') lines.push(e.success ? '★ Temporada concluída com sucesso!' : 'Temporada encerrada.');
      else if (e.type === 'unlock') lines.push('🔓 Missão liberada: ' + e.names.map(esc).join(', '));
      else if (e.type === 'goalDone') lines.push('🎯 Meta cumprida: ' + esc(D.ATTRIBUTES[e.attribute].name) + ' Nv. ' + e.level + ' (+' + e.coins + ' moedas)');
      else if (e.type === 'review' && e.coins) lines.push('✎ Revisão semanal salva (+' + e.coins + ' moedas)');
      else if (e.type === 'purchase') lines.push('◆ Resgatado: ' + esc(e.name) + ' (−' + e.cost + ' moedas)');
    });
    if (xpEv || lines.length) {
      vibrate(20);
      showToast((xpEv ? '<div class="t1">[!] Missão concluída · +' + xpEv.amount + ' XP</div>' : '') + lines.map(function (l) { return '<div class="t2">' + l + '</div>'; }).join(''), xpEv && xpEv.completionId);
    }
  }
  function showModal(events, levelUp, rankUp) {
    var gained = events.reduce(function (s, e) { return s + (e.type === 'xp' || e.type === 'boss' ? e.amount : e.type === 'workout' ? e.xp : e.type === 'achievement' ? e.rewardXp : 0); }, 0);
    var achs = events.filter(function (e) { return e.type === 'achievement'; });
    var idx = game.rankIndex, color = D.RANKS[idx].color, level = D.levelProgress(game.totalXp).level;
    var prev = rankUp ? D.RANKS.findIndex(function (r) { return r.id === rankUp.from; }) : idx;
    var msg = MESSAGES[((levelUp ? levelUp.to : 0) + (rankUp ? 1 : 0)) % MESSAGES.length];
    var html = '<div class="overlay" role="dialog" aria-modal="true"><div class="modal" style="--c:' + color + '"><div class="sys">[ NOTIFICAÇÃO DO SISTEMA ]</div><h2>' +
      (rankUp ? 'NOVO RANK DESBLOQUEADO' : 'NÍVEL AUMENTADO') + '</h2>' +
      (levelUp ? '<div class="lvls"><span class="o">Nv. ' + levelUp.from + '</span><span style="color:' + color + '">▶</span><span class="n">Nv. ' + levelUp.to + '</span></div>' : '') +
      '<div class="pair">' + (rankUp ? figure(prev, D.RANKS[prev].requirements.minLevel, D.RANKS[prev].color, 84, { locked: true, still: true }) + '<span class="arrow">▶</span>' : '') +
      figure(idx, level, color, rankUp ? 170 : 170) + '</div>' +
      (rankUp ? '<div style="font-family:var(--display);color:' + color + ';letter-spacing:2px">' + esc(D.rankById(rankUp.to).name) + ' · ' + esc(D.rankById(rankUp.to).title) + '</div>' : '') +
      '<div class="gain">+' + gained + ' XP conquistados</div>' +
      achs.map(function (a) { return '<div class="ach-l">✦ Conquista: ' + esc(a.name) + ' (+' + a.rewardXp + ' XP)</div>'; }).join('') +
      events.filter(function (e) { return e.type === 'goalDone'; }).map(function (e) { return '<div class="ach-l">🎯 Meta cumprida: ' + esc(D.ATTRIBUTES[e.attribute].name) + ' Nv. ' + e.level + ' (+' + e.coins + ' moedas)</div>'; }).join('') +
      '<p class="msg">“' + esc(msg) + '”</p><button class="btn" style="margin-top:8px" data-act="close-modal">Continuar</button></div></div>';
    $modal.innerHTML = html;
    var ov = $modal.firstChild, fx = '<div class="ring" style="--c:' + color + '"></div>';
    for (var i = 0; i < 14; i++) {
      var a = i / 14 * Math.PI * 2;
      fx += '<div class="spark" style="--c:' + color + ';--dx:' + Math.round(Math.cos(a) * 160) + 'px;--dy:' + Math.round(Math.sin(a) * 160) + 'px"></div>';
    }
    ov.insertAdjacentHTML('beforeend', fx);
    vibrate([60, 40, 90]);
    var btn = $modal.querySelector('[data-act=close-modal]'); if (btn) btn.focus();
  }
  function closeModal() { $modal.innerHTML = ''; }
  function openModal(inner, cls) {
    $modal.innerHTML = '<div class="overlay" role="dialog" aria-modal="true"><div class="modal ' + (cls || '') + '">' + inner + '</div></div>';
    var f = $modal.querySelector('[autofocus],input,textarea,button'); if (f) f.focus();
  }

  /* ------------------------------ render & rotas ------------------------------ */
  var TABS = [['#/', '◈', 'Painel'], ['#/missions', '⚔', 'Missões'], ['#/stats', '▦', 'Stats'], ['#/workout', '⚒', 'Treino'], ['#/store', '◆', 'Loja'], ['#/character', '♛', 'Perfil']];
  var views = {}, handlers = {};
  function route() { return (location.hash || '#/').replace(/\/$/, '') || '#'; }
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(rgb, k) { return rgb.map(function (v) { return Math.round(v + (255 - v) * k); }); }
  /** Tema: "classic" mantém o azul; "rank" pinta a interface com a cor do rank atual. */
  function isLight() { return S.mode === 'light' || (S.mode === 'auto' && !!window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches); }
  function applyTheme() {
    var el = document.documentElement, st = el.style, light = isLight();
    el.setAttribute('data-mode', light ? 'light' : 'dark'); el.setAttribute('data-motion', S.motion === 'reduced' ? 'reduced' : 'auto');
    var tc = document.querySelector('meta[name=theme-color]'); if (tc) tc.setAttribute('content', light ? '#EAF0FA' : '#03050B');
    if (S.theme === 'rank' && game) {
      var rgb = hexRgb(D.RANKS[game.rankIndex].color), gl = mix(rgb, 0.35);
      if (light) { rgb = rgb.map(function (v) { return Math.round(v * 0.7); }); gl = rgb.map(function (v) { return Math.round(v * 0.85); }); }
      st.setProperty('--accent', 'rgb(' + rgb.join(',') + ')'); st.setProperty('--glow', 'rgb(' + gl.join(',') + ')'); st.setProperty('--rgb', rgb.join(','));
    } else { st.removeProperty('--accent'); st.removeProperty('--glow'); st.removeProperty('--rgb'); }
  }
  function render() {
    var y = window.scrollY, r = route(), html, hideTabs = false;
    applyTheme();
    if (!game) html = viewOnboarding();
    else if (r === '#/missions') html = viewMissions();
    else if (r === '#/character') html = viewCharacter();
    else if (r === '#/new' || r.indexOf('#/edit/') === 0) { html = viewNew(); hideTabs = true; }
    else if (views[r]) html = views[r]();
    else html = viewDashboard();
    if (game && !hideTabs) {
      var cur = r === '#/settings' ? '#/character' : (TABS.filter(function (t) { return t[0] === r; })[0] || TABS[0])[0];
      html += '<nav class="tabs"><div class="tabs-in">' + TABS.map(function (t) {
        return '<a href="' + t[0] + '" class="' + (t[0] === cur ? 'on' : '') + '"><span class="g">' + t[1] + '</span>' + t[2] + '</a>';
      }).join('') + '</div></nav>';
    }
    $app.innerHTML = html;
    document.title = 'Awakening' + (game ? ' · ' + D.RANKS[game.rankIndex].id + ' · Nv. ' + D.levelProgress(game.totalXp).level : '');
    window.scrollTo(0, y);
    requestAnimationFrame(function () {
      $app.querySelectorAll('.bar > i[data-w]').forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
      var fm = document.getElementById('forms');
      if (fm && game) fm.scrollLeft = Math.max(0, game.rankIndex * 116 - 24);
    });
    renderHooks.forEach(function (fn) { try { fn(r); } catch (e) { console.error(e); } });
  }

  /* Plano B para imagens: se não achar em assets/forms/, tenta forms/ e depois a raiz (upload sem a estrutura de pastas). */
  document.addEventListener('error', function (ev) {
    var img = ev.target;
    if (!img || img.tagName !== 'IMG' || img.dataset.n === undefined) return;
    var tries = [('forms/form-' + img.dataset.n + '.webp'), ('form-' + img.dataset.n + '.webp')];
    var k = Number(img.dataset.try || 0);
    if (k < tries.length) { img.dataset.try = k + 1; img.src = tries[k]; }
  }, true);

  /* ------------------------------ eventos de interface ------------------------------ */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]'); if (!el || el.disabled || el.hasAttribute('disabled')) return;
    var a = el.getAttribute('data-act'), id = el.getAttribute('data-id');
    switch (a) {
      case 'start': return act.start(document.getElementById('onb-name').value);
      case 'complete': return act.complete(id);
      case 'progress': return act.progress(id);
      case 'undo': return act.undo(id);
      case 'rest': return act.rest();
      case 'mood': var jt = document.getElementById('journal-text'); if (jt) journalDraft = jt.value; journalMood = journalMood === Number(id) ? 0 : Number(id); return render();
      case 'journal-save': var jx = document.getElementById('journal-text'); return act.journal(jx ? jx.value : '', journalMood != null ? journalMood : ((game.journal || []).filter(function (j) { return j.day === D.dayKey(new Date()); })[0] || {}).mood);
      case 'title': return apply(function (g) { return { state: D.setTitle(g, id || null), events: [] }; });
      case 'frame': return apply(function (g) { return { state: D.setFrame(g, id === '' ? null : Number(id)), events: [] }; });
      case 'remove': if (confirm('Remover "' + el.getAttribute('data-name') + '"? O XP já conquistado é mantido.')) act.remove(id); return;
      case 'tab': tab = id; return render();
      case 'rename': return act.rename(document.getElementById('char-name').value);
      case 'reset': if (confirm('Todo o progresso será apagado deste navegador. Esta ação não pode ser desfeita. Faça um backup antes, se quiser guardar.')) act.reset(); return;
      case 'close-modal': return closeModal();
      case 'f-tpl': applyTemplate(Number(id)); return render();
      case 'f-type': form.type = id; suggest(); return render();
      case 'f-diff': form.difficulty = id; suggest(); return render();
      case 'f-day': var di = form.days.indexOf(Number(id)); if (di >= 0) form.days.splice(di, 1); else form.days.push(Number(id)); return render();
      case 'f-deadline': form.deadlineDays = id === 'null' ? null : Number(id); return render();
      case 'f-attr': var i = form.attrs.indexOf(id); if (i >= 0) form.attrs.splice(i, 1); else form.attrs.push(id); return render();
      case 'f-dec': form.target = Math.max(1, form.target - 1); return render();
      case 'f-inc': form.target = Math.min(100, form.target + 1); return render();
      case 'f-dur': form.duration = Number(id); return render();
      case 'subtask': return apply(function (g) { return D.toggleSubtask(g, id, el.getAttribute('data-sub')); });
      case 'f-sub-add': return addSub();
      case 'f-sub-del': form.subtasks.splice(Number(id), 1); return render();
      case 'f-req': form.requires = id || ''; return render();
      case 'f-save': return saveForm();
      default: if (handlers[a]) return handlers[a](el, ev);
    }
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.id === 'char-name') { var box = document.getElementById('save-name'); box.classList.toggle('hidden', !t.value.trim() || t.value.trim() === game.player.name); return; }
    if (t.id === 'journal-text') { journalDraft = t.value; return; }
    var field = t.getAttribute && t.getAttribute('data-field'); if (!field || !form) return;
    if (field === 'xp') { t.value = t.value.replace(/[^0-9]/g, ''); form.xp = t.value; form.xpEdited = true; } else form[field] = t.value;
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target.id === 'onb-name') act.start(ev.target.value);
    if (ev.key === 'Enter' && ev.target.id === 'char-name') ev.target.blur();
    if (ev.key === 'Enter' && ev.target.getAttribute && ev.target.getAttribute('data-field') === 'subDraft') { ev.preventDefault(); addSub(); }
    if (ev.key === 'Escape' && $modal.firstChild) closeModal();
  });
  window.addEventListener('hashchange', function () {
    var r = route();
    if (r === '#/new') { if (!form || form.editId) form = newForm(); }
    else if (r.indexOf('#/edit/') === 0) { /* viewNew monta o formulário */ }
    else form = null;
    render(); window.scrollTo(0, 0);
  });

  /* ------------------------------ início ------------------------------ */
  (function dots() {
    var seed = 42, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }, out = '';
    for (var i = 0; i < 14; i++) out += '<div class="dot" style="left:' + (rnd() * 100).toFixed(1) + '%;top:' + (rnd() * 100).toFixed(1) + '%;animation-delay:' + (rnd() * 4).toFixed(1) + 's;animation-duration:' + (3.5 + rnd() * 3.5).toFixed(1) + 's"></div>';
    document.getElementById('dots').innerHTML = out;
  })();

  /** Ponte para features.js (estatísticas, loja, backup, foco, PWA, atalhos...). */
  window.AW = {
    D: D, S: S, isLight: isLight, KEY: KEY, SKEY: SKEY, SNAPKEY: SNAPKEY, views: views, handlers: handlers, onRender: renderHooks,
    getGame: function () { return game; }, getNow: function () { return now; }, setGame: setGame, isStorageOk: function () { return storageOk; },
    apply: apply, act: act, render: render, route: route, save: save, load: load, saveSettings: saveSettings, takeSnapshot: takeSnapshot, applyTheme: applyTheme,
    showToast: showToast, openModal: openModal, closeModal: closeModal, handleEvents: handleEvents,
    esc: esc, panel: panel, bar: bar, chip: chip, figure: figure, rankBadge: rankBadge, missionCard: missionCard, attrRow: attrRow,
    pad: pad, dm: dm, DIFF_COLOR: DIFF_COLOR, TYPE_LABEL: TYPE_LABEL, DAYS3: DAYS3, MOODS: MOODS, lastError: function () { return lastError; }
  };

  function start() {
    loadSettings(); load(); refresh(); render();
    setInterval(function () {
      if (!game) return;
      var typing = document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
      refresh();
      if (!typing && !$modal.firstChild) render();
    }, 60000);
    // Se o progresso for alterado em outra aba, sincroniza.
    window.addEventListener('storage', function (e) { if (e.key === KEY) { load(); render(); } });
    try { matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { if (S.mode === 'auto') applyTheme(); }); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
