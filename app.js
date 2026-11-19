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
  var TYPE_LABEL = { daily: 'Diária', weekly: 'Semanal', special: 'Especial', emergency: 'Emergência' };
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

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      game = (data && data.state && data.state.game) || null;
    } catch (e) { game = null; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ state: { game: game }, version: 1 })); storageOk = true; }
    catch (e) { storageOk = false; }
  }
  function refresh() {
    if (!game) return;
    now = new Date();
    game = D.maybeSpawnEmergency(D.expireMissions(game, now), now);
    save();
  }
  function apply(run) {
    if (!game) return;
    var r = run(game);
    game = r.state; save();
    if (r.events && r.events.length) handleEvents(r.events);
    render();
  }
  var act = {
    start: function (name) { game = D.createInitialState((name || '').trim() || 'Jogador'); save(); location.hash = '#/'; },
    progress: function (id) { apply(function (g) { return D.addProgress(g, id, 1); }); },
    complete: function (id) { apply(function (g) { return D.completeMission(g, id); }); },
    remove: function (id) { apply(function (g) { return { state: D.removeMission(g, id), events: [] }; }); },
    create: function (input) { apply(function (g) { return { state: D.addMission(g, input), events: [] }; }); },
    rename: function (name) {
      apply(function (g) { return { state: Object.assign({}, g, { player: Object.assign({}, g.player, { name: name.trim() || g.player.name }) }), events: [] }; });
    },
    reset: function () { game = null; try { localStorage.removeItem(KEY); } catch (e) {} location.hash = '#/'; }
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
    var def = D.ATTRIBUTES[id], p = D.attributeProgress(xp);
    return '<div class="attr"><div class="top"><span style="color:' + def.color + '">' + def.glyph + '</span><span class="n">' + esc(detailed ? def.name : def.short) +
      '</span><span class="lv" style="color:' + def.color + '">Nv. ' + p.level + '</span></div>' + bar(p.ratio, def.color, detailed ? 8 : 6) +
      (detailed ? '<div class="sub">' + (p.isMax ? 'Nível máximo' : p.xpIntoLevel + '/' + p.xpForNext + ' XP') + ' · ' + esc(def.description) + '</div>' : '') + '</div>';
  }
  function missionCard(m) {
    var done = D.isMissionDone(m, now), expired = D.isMissionExpired(m, now), cur = D.missionProgress(m, now);
    var accent = m.type === 'emergency' ? 'var(--danger)' : done ? 'var(--success)' : 'var(--accent)';
    var attrs = m.attributes.map(function (a) { return '<span class="tag">' + esc(D.ATTRIBUTES[a].glyph + ' ' + D.ATTRIBUTES[a].short) + '</span>'; }).join('');
    var progress = m.target > 1 ? '<div style="margin-top:10px">' + bar(cur / m.target, accent === 'var(--accent)' ? 'var(--accent)' : accent, 6) +
      '<div class="xp-row"><span>' + cur + '/' + m.target + ' etapas</span></div></div>' : '';
    var action = done ? '<p class="status">✓ CONCLUÍDA</p>' : expired ? '<p class="status" style="color:var(--danger)">✕ EXPIRADA</p>' :
      m.target > 1 ? '<button class="btn" data-act="progress" data-id="' + m.id + '">+1 etapa</button>' : '<button class="btn" data-act="complete" data-id="' + m.id + '">Concluir missão</button>';
    return panel(null,
      '<button class="del" title="Remover missão" aria-label="Remover missão" data-act="remove" data-id="' + m.id + '" data-name="' + esc(m.name) + '">✕</button>' +
      '<div class="mission"><div class="top"><div style="flex:1;min-width:0"><div class="nm">' + esc(m.name) + '</div>' + (m.description ? '<div class="ds">' + esc(m.description) + '</div>' : '') +
      '</div><div class="diff" style="color:' + DIFF_COLOR[m.difficulty] + ';border-color:' + DIFF_COLOR[m.difficulty] + '">' + m.difficulty + '</div></div>' +
      '<div class="meta"><span class="xp">+' + m.xp + ' XP</span><span>' + TYPE_LABEL[m.type] + '</span>' +
      (m.deadline && !done ? '<span style="color:' + (expired ? 'var(--danger)' : 'var(--gold)') + '">' + deadlineText(m.deadline, now) + '</span>' : '') + '</div>' +
      '<div style="margin-top:8px">' + attrs + '</div>' + progress + '<div style="margin-top:12px">' + action + '</div></div>',
      { accent: accent, cls: done || expired ? 'dimmed' : '' });
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

  function viewDashboard() {
    var rank = D.RANKS[game.rankIndex], lvl = D.levelProgress(game.totalXp), pending = D.pendingDaily(game, now);
    var week = D.xpByDay(game, now, 7), weekTotal = week.reduce(function (s, d) { return s + d.xp; }, 0);
    var maxDay = Math.max.apply(null, [1].concat(week.map(function (d) { return d.xp; })));
    var weekly = game.missions.filter(function (m) { return m.type === 'weekly' && m.status === 'active'; });
    var weeklyDone = weekly.filter(function (m) { return D.isMissionDone(m, now); }).length;
    var next = D.nextAchievement(game, now);
    var html = '<div><div class="greet">' + greeting(now.getHours()) + ',</div><h1 class="name">' + esc(game.player.name) + '.</h1></div>';

    html += panel('Status',
      '<div class="hero">' + figure(game.rankIndex, lvl.level, rank.color, 300) +
      '<div class="side left" style="color:' + rank.color + '">' + rankBadge(rank, 52) + '<div class="lab">' + esc(rank.title) + '</div></div>' +
      '<div class="side right"><div class="lv-l">NÍVEL</div><div class="lv-n" style="color:' + rank.color + '">' + lvl.level + '</div><div class="mute small">/ 100</div></div></div>' +
      '<p class="rank-name" style="color:' + rank.color + '">' + esc(rank.name) + '</p><p class="rank-sub">' + esc(rank.description) + '</p>' +
      '<div style="margin-top:16px">' + bar(lvl.ratio, 'var(--glow)', 10) + '<div class="xp-row"><span>' +
      (lvl.isMax ? 'NÍVEL MÁXIMO' : lvl.xpIntoLevel + ' / ' + lvl.xpForNext + ' XP') + '</span><span style="color:var(--success)">Hoje +' + D.xpToday(game, now) + ' XP</span></div></div>',
      { accent: rank.color });

    html += panel('Atributos', '<div class="attr-grid">' + D.ATTRIBUTE_IDS.map(function (id) { return attrRow(id, game.attributeXp[id], false); }).join('') + '</div>');

    html += '<div class="stack"><div class="section"><b>MISSÕES DE HOJE</b><span class="dim small" style="font-weight:700">' + pending.length + ' pendentes</span></div>' +
      (pending.length === 0 ? panel(null, '<p style="margin:0;color:var(--success);font-weight:600">Todas as missões diárias foram concluídas. Descanse, você mereceu.</p>', { accent: 'var(--success)' })
        : pending.slice(0, 3).map(missionCard).join('')) +
      '<a class="btn ghost" style="text-decoration:none" href="#/missions">' + (pending.length > 3 ? 'Ver todas as missões (+' + (pending.length - 3) + ')' : 'Ir para as missões') + '</a></div>';

    html += panel('Progresso semanal',
      '<div class="weekbars">' + week.map(function (d, i) {
        var dow = new Date(d.day + 'T12:00:00').getDay();
        return '<div class="col"><div class="t"><i style="height:' + Math.max(4, d.xp / maxDay * 100) + '%;background:' + (d.xp > 0 ? 'var(--accent)' : 'rgba(120,150,210,.2)') + '"></i></div><span' +
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
    var rk = function (m) { return D.isMissionExpired(m, now) ? 2 : D.isMissionDone(m, now) ? 1 : 0; };
    var types = ['daily', 'weekly', 'special', 'emergency'];
    var list = game.missions.filter(function (m) { return m.type === tab; }).sort(function (a, b) { return rk(a) - rk(b); });
    var html = '<h1 class="screen-title">MISSÕES</h1><div class="row">' + types.map(function (t) {
      var n = game.missions.filter(function (m) { return m.type === t && rk(m) === 0; }).length;
      return chip(n > 0 ? TYPE_LABEL[t] + ' · ' + n : TYPE_LABEL[t], tab === t, 'data-act="tab" data-id="' + t + '"', t === 'emergency' ? 'var(--danger)' : null);
    }).join('') + '</div><a class="btn ghost" style="text-decoration:none" href="#/new">+ Nova missão</a>';
    html += list.length === 0
      ? panel(null, '<p class="dim" style="margin:0;line-height:1.4">' + (tab === 'emergency' ? 'Nenhum alerta ativo. De vez em quando o sistema lança desafios inesperados com prazo de 24 horas.' : 'Nenhuma missão nesta categoria. Crie a sua!') + '</p>')
      : list.map(missionCard).join('');
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
  function viewCharacter() {
    var rank = D.RANKS[game.rankIndex], lvl = D.levelProgress(game.totalXp), stats = D.deriveStats(game, now), up = D.nextRank(game, now);
    var html = panel('Personagem',
      '<div style="display:flex;flex-direction:column;align-items:center;gap:4px">' + figure(game.rankIndex, lvl.level, rank.color, 290) +
      '<input id="char-name" class="name-input" maxlength="24" value="' + esc(game.player.name) + '" aria-label="Nome do personagem" />' +
      '<div style="font-family:var(--display);font-size:12px;letter-spacing:1.5px;color:' + rank.color + '">' + esc(rank.name) + ' · ' + esc(rank.title) + '</div>' +
      '<div class="dim" style="font-weight:600">Nível ' + lvl.level + ' · ' + game.totalXp + ' XP</div>' +
      '<div id="save-name" class="hidden" style="align-self:stretch;margin-top:10px"><button class="btn" data-act="rename">Salvar nome</button></div></div>', { accent: rank.color });

    html += panel('Atributos', '<div class="stack" style="gap:18px">' + D.ATTRIBUTE_IDS.map(function (id) { return attrRow(id, game.attributeXp[id], true); }).join('') + '</div>');

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
    html += '<button class="btn danger" data-act="reset">Reiniciar jornada</button>';
    if (!storageOk) html += '<p class="error small" style="text-align:center">Não foi possível salvar neste navegador (modo privado?). O progresso será perdido ao fechar.</p>';
    return html;
  }

  /* ------------------------------ nova missão ------------------------------ */
  var form = null;
  var DURATIONS = [0, 15, 30, 60, 90];
  var DEADLINES = [{ l: 'Sem prazo', d: null }, { l: '7 dias', d: 7 }, { l: '30 dias', d: 30 }, { l: '90 dias', d: 90 }];
  function newForm() {
    return { name: '', description: '', type: 'daily', difficulty: 'C', xp: String(D.suggestedXp('daily', 'C')), xpEdited: false, attrs: [], target: 1, duration: 0, deadlineDays: null, error: null };
  }
  function suggest() { if (!form.xpEdited) form.xp = String(D.suggestedXp(form.type, form.difficulty)); }
  function viewNew() {
    if (!form) form = newForm();
    var f = form;
    return '<div class="between"><h1 class="screen-title">NOVA MISSÃO</h1><a class="close" href="#/missions" aria-label="Fechar" style="text-decoration:none;color:var(--dim)">✕</a></div>' +
      panel('Detalhes', '<p class="label">NOME</p><input class="input" data-field="name" maxlength="60" placeholder="Ex.: Estudar JavaScript" value="' + esc(f.name) + '" />' +
        '<p class="label" style="margin-top:16px">DESCRIÇÃO (OPCIONAL)</p><textarea class="input" data-field="description" maxlength="160" placeholder="O que precisa ser feito?">' + esc(f.description) + '</textarea>') +
      panel('Tipo e dificuldade', '<div class="row">' + ['daily', 'weekly', 'special'].map(function (t) { return chip(TYPE_LABEL[t], f.type === t, 'data-act="f-type" data-id="' + t + '"'); }).join('') + '</div>' +
        '<p class="label" style="margin-top:16px">DIFICULDADE</p><div class="row">' + ['E', 'D', 'C', 'B', 'A', 'S'].map(function (d) { return chip(d, f.difficulty === d, 'data-act="f-diff" data-id="' + d + '"', DIFF_COLOR[d]); }).join('') + '</div>' +
        (f.type === 'special' ? '<p class="label" style="margin-top:16px">PRAZO</p><div class="row">' + DEADLINES.map(function (d) { return chip(d.l, f.deadlineDays === d.d, 'data-act="f-deadline" data-id="' + d.d + '"'); }).join('') + '</div>' : '')) +
      panel('Recompensa', '<p class="label">XP (1 A ' + D.MAX_MISSION_XP + ')</p><input class="input" data-field="xp" inputmode="numeric" maxlength="4" value="' + esc(f.xp) + '" style="font-weight:700" />' +
        '<p class="help">Sugestão para o tipo e a dificuldade escolhidos: ' + D.suggestedXp(f.type, f.difficulty) + ' XP.</p>' +
        '<p class="label" style="margin-top:16px">ATRIBUTOS BENEFICIADOS</p><div class="row">' + D.ATTRIBUTE_IDS.map(function (id) {
          return chip(D.ATTRIBUTES[id].glyph + ' ' + D.ATTRIBUTES[id].name, f.attrs.indexOf(id) >= 0, 'data-act="f-attr" data-id="' + id + '"', D.ATTRIBUTES[id].color);
        }).join('') + '</div>') +
      panel('Meta', '<p class="label">ETAPAS PARA CONCLUIR</p><div class="stepper"><button type="button" data-act="f-dec" aria-label="Menos">−</button><b>' + f.target + '</b><button type="button" data-act="f-inc" aria-label="Mais">+</button></div>' +
        '<p class="help">Ex.: “Treinar 4 vezes” = 4 etapas. O XP só é pago ao completar todas.</p>' +
        '<p class="label" style="margin-top:16px">DURAÇÃO (MIN)</p><div class="row">' + DURATIONS.map(function (d) { return chip(d === 0 ? 'Nenhuma' : String(d), f.duration === d, 'data-act="f-dur" data-id="' + d + '"'); }).join('') + '</div>' +
        '<p class="help">Missões de Inteligência com duração somam nas horas de estudo.</p>') +
      (f.error ? '<p class="error">' + esc(f.error) + '</p>' : '') +
      '<button class="btn" data-act="f-save">Criar missão</button>';
  }
  function saveForm() {
    var f = form, xp = parseInt(f.xp, 10);
    var input = {
      name: f.name, description: f.description, type: f.type, difficulty: f.difficulty, xp: isFinite(xp) ? xp : undefined, attributes: f.attrs, target: f.target,
      durationMin: f.duration || undefined,
      deadline: f.type === 'special' && f.deadlineDays ? new Date(Date.now() + f.deadlineDays * 86400000).toISOString() : undefined
    };
    var problem = D.validateMissionInput(input);
    if (problem) { f.error = problem; return render(); }
    form = null; act.create(input); location.hash = '#/missions';
  }

  /* ------------------------------ eventos (modal / aviso) ------------------------------ */
  var toastTimer = null;
  function showToast(html) {
    $toast.innerHTML = html; $toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { $toast.classList.remove('show'); }, 3000);
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
    });
    if (xpEv || lines.length) {
      vibrate(20);
      showToast((xpEv ? '<div class="t1">[!] Missão concluída · +' + xpEv.amount + ' XP</div>' : '') + lines.map(function (l) { return '<div class="t2">' + l + '</div>'; }).join(''));
    }
  }
  function showModal(events, levelUp, rankUp) {
    var gained = events.reduce(function (s, e) { return s + (e.type === 'xp' ? e.amount : e.type === 'achievement' ? e.rewardXp : 0); }, 0);
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

  /* ------------------------------ render & rotas ------------------------------ */
  var TABS = [['#/', '◈', 'Painel'], ['#/missions', '⚔', 'Missões'], ['#/character', '♛', 'Personagem']];
  function route() { return (location.hash || '#/').replace(/\/$/, '') || '#'; }
  function render() {
    var y = window.scrollY, r = route(), html;
    if (!game) html = viewOnboarding();
    else if (r === '#/missions') html = viewMissions();
    else if (r === '#/character') html = viewCharacter();
    else if (r === '#/new') html = viewNew();
    else html = viewDashboard();
    if (game && r !== '#/new') {
      var cur = r === '#/missions' ? '#/missions' : r === '#/character' ? '#/character' : '#/';
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
    var el = ev.target.closest('[data-act]'); if (!el) return;
    var a = el.getAttribute('data-act'), id = el.getAttribute('data-id');
    switch (a) {
      case 'start': return act.start(document.getElementById('onb-name').value);
      case 'complete': return act.complete(id);
      case 'progress': return act.progress(id);
      case 'remove': if (confirm('Remover "' + el.getAttribute('data-name') + '"? O XP já conquistado é mantido.')) act.remove(id); return;
      case 'tab': tab = id; return render();
      case 'rename': return act.rename(document.getElementById('char-name').value);
      case 'reset': if (confirm('Todo o progresso será apagado deste navegador. Esta ação não pode ser desfeita.')) act.reset(); return;
      case 'close-modal': return closeModal();
      case 'f-type': form.type = id; suggest(); return render();
      case 'f-diff': form.difficulty = id; suggest(); return render();
      case 'f-deadline': form.deadlineDays = id === 'null' ? null : Number(id); return render();
      case 'f-attr': var i = form.attrs.indexOf(id); if (i >= 0) form.attrs.splice(i, 1); else form.attrs.push(id); return render();
      case 'f-dec': form.target = Math.max(1, form.target - 1); return render();
      case 'f-inc': form.target = Math.min(100, form.target + 1); return render();
      case 'f-dur': form.duration = Number(id); return render();
      case 'f-save': return saveForm();
    }
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.id === 'char-name') { var box = document.getElementById('save-name'); box.classList.toggle('hidden', !t.value.trim() || t.value.trim() === game.player.name); return; }
    var field = t.getAttribute && t.getAttribute('data-field'); if (!field || !form) return;
    if (field === 'xp') { t.value = t.value.replace(/[^0-9]/g, ''); form.xp = t.value; form.xpEdited = true; } else form[field] = t.value;
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target.id === 'onb-name') act.start(ev.target.value);
    if (ev.key === 'Enter' && ev.target.id === 'char-name') ev.target.blur();
    if (ev.key === 'Escape' && $modal.firstChild) closeModal();
  });
  window.addEventListener('hashchange', function () { if (route() === '#/new' && !form) form = newForm(); if (route() !== '#/new') form = null; render(); window.scrollTo(0, 0); });

  /* ------------------------------ início ------------------------------ */
  (function dots() {
    var seed = 42, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }, out = '';
    for (var i = 0; i < 14; i++) out += '<div class="dot" style="left:' + (rnd() * 100).toFixed(1) + '%;top:' + (rnd() * 100).toFixed(1) + '%;animation-delay:' + (rnd() * 4).toFixed(1) + 's;animation-duration:' + (3.5 + rnd() * 3.5).toFixed(1) + 's"></div>';
    document.getElementById('dots').innerHTML = out;
  })();
  load(); refresh(); render();
  setInterval(function () {
    if (!game) return;
    var typing = document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    refresh();
    if (!typing && !$modal.firstChild) render();
  }, 60000);
  // Se o progresso for alterado em outra aba, sincroniza.
  window.addEventListener('storage', function (e) { if (e.key === KEY) { load(); render(); } });
})();
