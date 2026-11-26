/* Awakening — recursos extras: estatísticas, loja, temporada, amigos, backup, foco, cartão, importação de hábitos, PWA, lembretes e atalhos.
   Depende de app.js (que expõe window.AW) e de domain.js (window.Domain). */
(function () {
  'use strict';
  var AW = window.AW;
  if (!AW) return;
  var D = AW.D, S = AW.S, esc = AW.esc, panel = AW.panel, bar = AW.bar, chip = AW.chip, pad = AW.pad;
  var G = function () { return AW.getGame(); };
  var N = function () { return AW.getNow(); };
  var $ = function (id) { return document.getElementById(id); };
  var val = function (id) { var el = $(id); return el ? el.value : ''; };
  var fmt = function (n) { return Number(n).toLocaleString('pt-BR'); };
  var pl = function (n, one, many) { return n + ' ' + (n === 1 ? one : many); };

  /* ------------------------------ utilidades ------------------------------ */
  function toast(msg, bad) { AW.showToast('<div class="t1"' + (bad ? ' style="color:var(--danger)"' : '') + '>' + esc(msg) + '</div>'); }
  function download(name, blob) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function copyText(text) {
    var fallback = function () {
      var t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} t.remove(); return ok;
    };
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    return Promise.resolve(fallback());
  }
  function b64url(bytes) {
    var bin = ''; for (var i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromB64url(str) {
    var b = str.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
    var bin = atob(b), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
  }
  function streamBytes(bytes, Ctor, kind) {
    return new Response(new Blob([bytes]).stream().pipeThrough(new Ctor(kind))).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  /** Código de backup: JSON comprimido (gzip) em base64url. */
  function encodeCode(obj) {
    var bytes = new TextEncoder().encode(JSON.stringify(obj));
    if (typeof CompressionStream === 'undefined') return Promise.resolve('AWK0.' + b64url(bytes));
    return streamBytes(bytes, CompressionStream, 'gzip').then(function (z) { return 'AWK1.' + b64url(z); });
  }
  function decodeCode(code) {
    code = String(code || '').trim().replace(/\s+/g, '');
    var tag = code.slice(0, 5), raw;
    try { raw = fromB64url(code.slice(5)); } catch (e) { return Promise.reject(new Error('Código inválido.')); }
    var parse = function (bytes) { return JSON.parse(new TextDecoder().decode(bytes)); };
    if (tag === 'AWK0.') return Promise.resolve().then(function () { return parse(raw); });
    if (tag === 'AWK1.') {
      if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('Este navegador não consegue ler esse código. Use o arquivo de backup.'));
      return streamBytes(raw, DecompressionStream, 'gzip').then(parse);
    }
    return Promise.reject(new Error('Código inválido. Ele deve começar com AWK.'));
  }

  /* ------------------------------ estatísticas ------------------------------ */
  var statsRange = 30, seasonPlan = 'normal', seasonName = '';
  var WD = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  function tile(label, value, sub) { return '<div class="tile"><b>' + esc(value) + '</b><span>' + esc(label) + '</span>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>'; }

  function xpChart(g, now) {
    var data = D.xpByDay(g, now, statsRange), max = Math.max.apply(null, [1].concat(data.map(function (d) { return d.xp; })));
    var total = data.reduce(function (s, d) { return s + d.xp; }, 0), best = data.reduce(function (a, d) { return d.xp > a.xp ? d : a; }, { xp: 0, day: '' });
    var rest = {}; (g.restDays || []).forEach(function (d) { rest[d] = 1; });
    var bars = data.map(function (d) {
      return '<div class="b' + (rest[d.day] ? ' rest' : '') + '" title="' + AW.dm(d.day + 'T12:00:00') + ' · ' + d.xp + ' XP' + (rest[d.day] ? ' · descanso' : '') + '"><i style="height:' + (d.xp > 0 ? Math.max(3, d.xp / max * 100) : 0) + '%"></i></div>';
    }).join('');
    return panel('XP por dia',
      '<div class="row" style="margin-bottom:12px">' + [7, 30, 90].map(function (r) { return chip(r + ' dias', statsRange === r, 'data-act="stats-range" data-id="' + r + '"'); }).join('') + '</div>' +
      '<div class="bars' + (statsRange > 30 ? ' dense' : '') + '">' + bars + '</div>' +
      '<div class="xp-row"><span>' + AW.dm(data[0].day + 'T12:00:00') + '</span><span>hoje</span></div>' +
      '<div class="kv"><span>Total</span><b>' + fmt(total) + ' XP</b></div><div class="kv"><span>Média por dia</span><b>' + fmt(Math.round(total / data.length)) + ' XP</b></div>' +
      (best.xp > 0 ? '<div class="kv"><span>Melhor dia</span><b>' + AW.dm(best.day + 'T12:00:00') + ' · ' + fmt(best.xp) + ' XP</b></div>' : ''));
  }

  function heatmap(g, now) {
    var WEEKS = 20, totals = {}, rest = {};
    g.completions.forEach(function (c) { totals[c.day] = (totals[c.day] || 0) + c.xp; });
    (g.restDays || []).forEach(function (d) { rest[d] = 1; });
    var monday = new Date(now.getFullYear(), now.getMonth(), now.getDate()); monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7 - (WEEKS - 1) * 7);
    var todayKey = D.dayKey(now), max = 1, cells = [];
    Object.keys(totals).forEach(function (k) { if (totals[k] > max) max = totals[k]; });
    for (var i = 0; i < WEEKS * 7; i++) {
      var d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i), k = D.dayKey(d), xp = totals[k] || 0, cls;
      if (k > todayKey) cls = 'fut'; else if (xp > 0) cls = 'l' + Math.min(4, 1 + Math.floor(xp / max * 3.999)); else cls = rest[k] ? 'rest' : 'l0';
      cells.push('<i class="' + cls + '" title="' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' · ' + xp + ' XP' + (rest[k] ? ' · descanso' : '') + '"></i>');
    }
    return panel('Calendário de atividade',
      '<div class="heat-wrap"><div class="heat-days"><span>Seg</span><span></span><span>Qua</span><span></span><span>Sex</span><span></span><span>Dom</span></div><div class="heat">' + cells.join('') + '</div></div>' +
      '<div class="legend"><span>menos</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>mais</span><i class="rest" style="margin-left:10px"></i><span>descanso</span></div>');
  }

  function weekdayPanel(g, now) {
    var sums = [0, 0, 0, 0, 0, 0, 0], counts = [0, 0, 0, 0, 0, 0, 0], data = D.xpByDay(g, now, 90);
    data.forEach(function (d) { var w = new Date(d.day + 'T12:00:00').getDay(); sums[w] += d.xp; counts[w]++; });
    var avg = sums.map(function (s, i) { return counts[i] ? s / counts[i] : 0; }), max = Math.max.apply(null, [1].concat(avg));
    var order = [1, 2, 3, 4, 5, 6, 0], best = order.reduce(function (a, i) { return avg[i] > avg[a] ? i : a; }, 1);
    return panel('Média por dia da semana (90 dias)',
      '<div class="weekbars">' + order.map(function (i) {
        return '<div class="col"><div class="t"><i style="height:' + Math.max(4, avg[i] / max * 100) + '%;background:' + (i === best && avg[i] > 0 ? 'var(--glow)' : 'var(--accent)') + '"></i></div><span>' + WD[i] + '</span></div>';
      }).join('') + '</div>' + (avg[best] > 0 ? '<div class="xp-row"><span>Seu dia mais forte</span><span style="color:var(--glow)">' + AW.DAYS3[best] + ' · ' + Math.round(avg[best]) + ' XP em média</span></div>' : ''));
  }

  function seasonPanel(g, now) {
    var p = D.seasonProgress(g, now);
    if (p) {
      var s = p.season;
      return panel('Temporada · ' + s.name,
        '<div class="xp-row" style="margin:0 0 6px"><span>Meta de XP (' + D.SEASON_PLANS[s.plan].label + ')</span><span>' + fmt(Math.min(p.xp, s.goalXp)) + ' / ' + fmt(s.goalXp) + '</span></div>' + bar(p.xp / s.goalXp, 'var(--gold)', 10) +
        '<div class="tiers">' + p.tiers.map(function (t, i) { return '<span class="' + (t.claimed ? 'ok' : '') + '">' + (t.claimed ? '✓' : '○') + ' ' + fmt(t.xp) + ' XP → +' + t.coins + ' moedas</span>'; }).join('') + '</div>' +
        '<div class="xp-row" style="margin:12px 0 6px"><span>Dias ativos</span><span>' + p.activeDays + ' / ' + D.SEASON_DAYS_GOAL + '</span></div>' + bar(p.activeDays / D.SEASON_DAYS_GOAL, 'var(--success)', 8) +
        '<p class="help">Faltam ' + p.daysLeft + ' dias. Ao fechar com a meta de XP e ' + D.SEASON_DAYS_GOAL + ' dias ativos, você ganha uma insígnia para usar como título.</p>', { accent: 'var(--gold)' });
    }
    var hist = (g.seasonHistory || []).slice().reverse().slice(0, 5);
    return panel('Temporada',
      '<p style="margin:0 0 12px;color:var(--dim)">Um desafio de 30 dias com meta de XP em três marcos. Cada marco paga moedas, e fechar a meta rende uma insígnia.</p>' +
      '<p class="label">NOME (OPCIONAL)</p><input id="season-name" class="input" maxlength="32" placeholder="Ex.: Novembro de ferro" value="' + esc(seasonName) + '" />' +
      '<p class="label" style="margin-top:14px">INTENSIDADE</p><div class="row">' + Object.keys(D.SEASON_PLANS).map(function (k) { return chip(D.SEASON_PLANS[k].label + ' · ' + fmt(D.SEASON_PLANS[k].goalXp) + ' XP', seasonPlan === k, 'data-act="season-plan" data-id="' + k + '"'); }).join('') + '</div>' +
      '<div style="margin-top:14px"><button class="btn" data-act="season-start">Iniciar temporada de 30 dias</button></div>' +
      (hist.length ? '<p class="label" style="margin-top:16px">ANTERIORES</p>' + hist.map(function (h) { return '<div class="hist"><span class="dt">' + (h.success ? '★' : '✕') + '</span><span>' + esc(h.name) + ' · ' + fmt(h.xp) + ' XP · ' + h.activeDays + ' dias</span></div>'; }).join('') : ''), { accent: 'var(--gold)' });
  }

  function myCard() {
    var g = G(), now = N(), st = D.deriveStats(g, now), wk = D.xpByDay(g, now, 7).reduce(function (s, d) { return s + d.xp; }, 0);
    return { n: g.player.name, r: g.rankIndex, l: st.level, x: g.totalXp, w: wk, s: st.currentStreak, t: now.toISOString(), p: g.player.createdAt };
  }
  function friendCode() { return 'AWF1.' + b64url(new TextEncoder().encode(JSON.stringify(myCard()))); }
  function parseFriend(code) {
    code = String(code || '').trim().replace(/\s+/g, '');
    if (code.indexOf('AWF1.') !== 0) throw new Error('Código de amigo inválido. Ele deve começar com AWF1.');
    var o; try { o = JSON.parse(new TextDecoder().decode(fromB64url(code.slice(5)))); } catch (e) { throw new Error('Código de amigo corrompido.'); }
    var num = function (v) { return typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0; };
    if (!o || typeof o.n !== 'string' || !(o.r >= 0 && o.r < D.RANKS.length)) throw new Error('Código de amigo inválido.');
    return { pid: String(o.p || o.n).slice(0, 40), name: o.n.slice(0, 24), rankIndex: Math.floor(o.r), level: num(o.l), totalXp: num(o.x), weekXp: num(o.w), streak: num(o.s), at: String(o.t || '') };
  }
  function friendsPanel(g, now) {
    var me = myCard(), rows = [{ me: true, name: me.n, rankIndex: me.r, level: me.l, weekXp: me.w, streak: me.s }].concat((g.friends || []).map(function (f) { return Object.assign({ me: false }, f); }));
    rows.sort(function (a, b) { return b.weekXp - a.weekXp; });
    return panel('Amigos (por código)',
      '<p style="margin:0 0 12px;color:var(--dim)">Sem servidor: cada um copia o próprio código e cola no app do outro. O placar mostra o XP dos últimos 7 dias no momento em que o código foi gerado, então peça um código novo de vez em quando.</p>' +
      '<div class="stack" style="gap:8px">' + rows.map(function (r, i) {
        var rk = D.RANKS[r.rankIndex];
        return '<div class="friend' + (r.me ? ' me' : '') + '"><span class="pos">' + (i + 1) + '</span>' + AW.rankBadge(rk, 30) + '<span class="fn"><b>' + esc(r.name) + (r.me ? ' (você)' : '') + '</b><small>Nv. ' + r.level + ' · ' + pl(r.streak, 'dia seguido', 'dias seguidos') + (!r.me && r.at ? ' · ' + AW.dm(r.at) : '') + '</small></span><span class="xp">' + fmt(r.weekXp) + '</span>' +
          (r.me ? '' : '<button class="mini" data-act="friend-del" data-id="' + esc(r.pid) + '" aria-label="Remover amigo ' + esc(r.name) + '">✕</button>') + '</div>';
      }).join('') + '</div>' +
      '<div class="row2" style="margin-top:14px"><button class="btn" data-act="friend-copy">Copiar meu código</button></div>' +
      '<p class="label" style="margin-top:14px">CÓDIGO DE UM AMIGO</p><textarea id="friend-code" class="input" placeholder="Cole aqui o código AWF1..."></textarea>' +
      '<div style="margin-top:10px"><button class="btn ghost" data-act="friend-add">Adicionar ou atualizar amigo</button></div>');
  }

  function journalPanel(g) {
    var list = (g.journal || []).filter(function (j) { return j.text; }).slice().reverse().slice(0, 8);
    if (!list.length) return '';
    return panel('Diário', '<div class="stack" style="gap:10px">' + list.map(function (j) {
      return '<div class="jr"><span class="dt">' + AW.dm(j.day + 'T12:00:00') + '</span><span>' + (j.mood ? AW.MOODS[j.mood - 1] + ' ' : '') + esc(j.text) + '</span></div>';
    }).join('') + '</div>');
  }

  AW.views['#/stats'] = function () {
    var g = G(), now = N(), st = D.deriveStats(g, now);
    return '<h1 class="screen-title">ESTATÍSTICAS</h1>' +
      '<div class="tiles">' + [tile('Nível', st.level), tile('XP total', fmt(st.totalXp)), tile('Dias ativos', st.activeDays), tile('Sequência', st.currentStreak, 'recorde ' + st.bestStreak),
        tile('Missões', fmt(st.missionsCompleted)), tile('Treinos', fmt(st.trainings)), tile('Horas de estudo', st.studyHours), tile('Moedas', fmt(D.coinBalance(g))),
        tile('Chefes', st.bossesDefeated), tile('Sessões de foco', st.focusSessions)].join('') + '</div>' +
      xpChart(g, now) + heatmap(g, now) +
      panel('XP por atributo', '<div class="attr-grid">' + D.ATTRIBUTE_IDS.map(function (id) { return AW.attrRow(id, g.attributeXp[id], false); }).join('') + '</div>') +
      weekdayPanel(g, now) + seasonPanel(g, now) + friendsPanel(g, now) + journalPanel(g);
  };

  AW.handlers['stats-range'] = function (el) { statsRange = Number(el.getAttribute('data-id')); AW.render(); };
  AW.handlers['season-plan'] = function (el) { seasonName = val('season-name') || seasonName; seasonPlan = el.getAttribute('data-id'); AW.render(); };
  AW.handlers['season-start'] = function () {
    var name = val('season-name'); seasonName = '';
    AW.apply(function (g) { return D.startSeason(g, { name: name, plan: seasonPlan }); });
  };
  AW.handlers['friend-copy'] = function () { copyText(friendCode()).then(function (ok) { toast(ok ? 'Código copiado. Envie para seu amigo.' : 'Não foi possível copiar.', !ok); }); };
  AW.handlers['friend-add'] = function () {
    try {
      var f = parseFriend(val('friend-code')), mine = G().player.createdAt;
      if (f.pid === mine) throw new Error('Esse é o seu próprio código.');
      AW.apply(function (g) {
        var list = (g.friends || []).filter(function (x) { return x.pid !== f.pid; }).concat([f]).slice(-30);
        return { state: Object.assign({}, g, { friends: list }), events: [] };
      });
      toast('Amigo salvo: ' + f.name);
    } catch (e) { toast(e.message, true); }
  };
  AW.handlers['friend-del'] = function (el) {
    var id = el.getAttribute('data-id');
    if (confirm('Remover este amigo do placar?')) AW.apply(function (g) { return { state: Object.assign({}, g, { friends: (g.friends || []).filter(function (x) { return x.pid !== id; }) }), events: [] }; });
  };

  /* ------------------------------ loja ------------------------------ */
  var REWARD_SUGGESTIONS = [['Um episódio da série', 30], ['Sobremesa favorita', 40], ['Café especial', 35], ['Noite de jogo sem culpa', 80], ['Comprar um livro', 120], ['Um dia de folga completo', 150], ['Jantar fora', 200]];
  var rewardDraft = { name: '', cost: '' };

  function storeRewards() {
    var g = G(), bal = D.coinBalance(g), rewards = g.rewards || [], buys = (g.purchases || []).slice().reverse().slice(0, 10);
    return '<div class="between"><h1 class="screen-title">LOJA</h1><span class="coins big">◆ ' + fmt(bal) + '</span></div>' +
      '<p class="dim" style="margin:-4px 0 0">Cada missão concluída rende 1 moeda a cada 10 XP. Gaste em recompensas que você mesmo define.</p>' +
      (rewards.length === 0 ? panel(null, '<p class="dim" style="margin:0">Nenhuma recompensa ainda. Crie a sua abaixo ou use uma sugestão.</p>') :
        rewards.map(function (r) {
          var can = bal >= r.cost;
          return panel(null, '<button class="del" aria-label="Remover recompensa" title="Remover" data-act="reward-del" data-id="' + r.id + '">✕</button><div class="reward"><div style="flex:1;min-width:0"><div class="nm">' + esc(r.name) + '</div><div class="xp">◆ ' + fmt(r.cost) + ' moedas</div>' +
            (can ? '' : '<div class="help" style="margin:2px 0 0">Faltam ' + fmt(r.cost - bal) + ' moedas</div>') + '</div><button class="btn inline" style="width:auto" data-act="reward-buy" data-id="' + r.id + '"' + (can ? '' : ' disabled') + '>Resgatar</button></div>', { accent: can ? 'var(--gold)' : 'var(--accent)' });
        }).join('')) +
      panel('Nova recompensa', '<p class="label">NOME</p><input id="reward-name" class="input" maxlength="60" placeholder="Ex.: Pizza no sábado" value="' + esc(rewardDraft.name) + '" />' +
        '<p class="label" style="margin-top:14px">CUSTO (MOEDAS)</p><input id="reward-cost" class="input" inputmode="numeric" maxlength="5" placeholder="Ex.: 100" value="' + esc(rewardDraft.cost) + '" />' +
        '<p class="label" style="margin-top:14px">SUGESTÕES</p><div class="row">' + REWARD_SUGGESTIONS.map(function (s, i) { return chip(s[0] + ' · ' + s[1], false, 'data-act="reward-sug" data-id="' + i + '"'); }).join('') + '</div>' +
        '<div style="margin-top:14px"><button class="btn" data-act="reward-add">Adicionar à loja</button></div>') +
      (buys.length ? panel('Resgatados', '<div class="stack" style="gap:8px">' + buys.map(function (p) { return '<div class="hist"><span class="dt">' + AW.dm(p.at) + '</span><span style="flex:1">' + esc(p.name) + '</span><span class="mute">−' + fmt(p.cost) + '</span></div>'; }).join('') + '</div>') : '');
  }

  /* ---- aparência: molduras, selos e estilos do painel ---- */
  var storeTab = 'rewards', tryLook = {};
  var CAT_TABS = [['rewards', 'Recompensas'], ['frame', 'Molduras'], ['seal', 'Selos'], ['skin', 'Painel']];
  var CAT_INTRO = {
    frame: 'Molduras da foto do jogador. Aparecem no Painel e no Perfil.',
    seal: 'Selos ficam presos ao canto da foto, como um distintivo.',
    skin: 'Estilos da janela de Status do Painel (e do cartão do Perfil).'
  };
  function storeTabs() {
    return '<div class="cz-tabs" role="tablist" aria-label="Seções da loja">' + CAT_TABS.map(function (t) { return chip(t[1], storeTab === t[0], 'data-act="store-tab" data-id="' + t[0] + '"'); }).join('') + '</div>';
  }
  function cosmeticsView() {
    var g = G(), bal = D.coinBalance(g), cat = storeTab, look = D.equippedLook(g), now = AW.getNow();
    var av = AW.avatarGet(), streak = D.deriveStats(g, now).currentStreak, nv = D.levelProgress(g.totalXp).level;
    var color = D.RANKS[g.player.frame != null ? g.player.frame : g.rankIndex].color, shown = {}, trying = false;
    ['frame', 'seal', 'skin'].forEach(function (k) {
      shown[k] = look[k];
      if (Object.prototype.hasOwnProperty.call(tryLook, k) && (tryLook[k] || null) !== (look[k] || null)) { shown[k] = tryLook[k] || null; trying = true; }
    });
    var o = { avatar: av, color: color, nv: nv, streak: streak };
    var items = [{ id: '', name: 'Padrão', cost: 0, desc: 'O visual original do seu rank.' }].concat(D.COSMETICS.filter(function (c) { return c.cat === cat; }));
    var cards = items.map(function (it) {
      var owned = !it.id || D.ownsCosmetic(g, it.id), equipped = (look[cat] || '') === (it.id || '');
      var needRank = it.minRank != null && g.rankIndex < it.minRank, isTry = trying && (shown[cat] || '') === (it.id || '');
      var btn;
      if (equipped) btn = '<button class="btn ghost" disabled>Equipado ✓</button>';
      else if (owned) btn = '<button class="btn" data-act="cos-equip" data-cat="' + cat + '" data-id="' + it.id + '">Equipar</button>';
      else if (needRank) btn = '<button class="btn ghost" disabled>Requer Rank ' + D.RANKS[it.minRank].id + '</button>';
      else if (bal >= it.cost) btn = '<button class="btn" data-act="cos-buy" data-cat="' + cat + '" data-id="' + it.id + '">◆ ' + fmt(it.cost) + ' · Comprar</button>';
      else btn = '<button class="btn ghost" disabled>Faltam ◆ ' + fmt(it.cost - bal) + '</button>';
      return '<div class="cz-card' + (isTry ? ' try' : '') + (equipped ? ' on' : '') + '">' +
        (equipped ? '<span class="cz-tag">EM USO</span>' : '') + (!owned && needRank ? '<span class="cz-lock">RANK ' + D.RANKS[it.minRank].id + '</span>' : '') +
        '<button type="button" class="cz-view" data-act="cos-try" data-cat="' + cat + '" data-id="' + it.id + '" aria-label="Ver prévia: ' + esc(it.name) + '">' + Cosmetics.thumb(cat, it.id, o) + '</button>' +
        '<div class="cz-nm">' + esc(it.name) + '</div><div class="cz-ds">' + esc(it.desc) + '</div>' + btn + '</div>';
    }).join('');
    return '<div class="cz-sticky">' + Cosmetics.preview(shown, { avatar: av, color: color, nv: nv, streak: streak, name: g.player.name, trying: trying }) + '</div>' +
      '<p class="dim" style="margin:0">' + CAT_INTRO[cat] + ' Toque numa miniatura para ver a prévia antes de comprar.</p><div class="cz-grid">' + cards + '</div>';
  }
  AW.views['#/store'] = function () {
    if (storeTab === 'rewards') return storeRewards().replace('</p>', '</p>' + storeTabs());
    var g = G();
    return '<div class="between"><h1 class="screen-title">LOJA</h1><span class="coins big">◆ ' + fmt(D.coinBalance(g)) + '</span></div>' + storeTabs() + cosmeticsView();
  };
  AW.handlers['store-tab'] = function (el) { storeTab = el.getAttribute('data-id'); tryLook = {}; AW.render(); };
  AW.handlers['cos-try'] = function (el) {
    var cat = el.getAttribute('data-cat'), id = el.getAttribute('data-id') || null;
    if (Object.prototype.hasOwnProperty.call(tryLook, cat) && tryLook[cat] === id) delete tryLook[cat]; else tryLook[cat] = id;
    AW.render();
  };
  AW.handlers['cos-equip'] = function (el) {
    var cat = el.getAttribute('data-cat'), id = el.getAttribute('data-id') || null;
    delete tryLook[cat];
    AW.apply(function (g) { return { state: D.equipCosmetic(g, cat, id), events: [] }; }); AW.render();
  };
  AW.handlers['cos-buy'] = function (el) {
    var cat = el.getAttribute('data-cat'), id = el.getAttribute('data-id'), c = D.cosmeticById(id);
    if (AW.apply(function (g) { var r = D.buyCosmetic(g, id); return r.error ? r : { state: D.equipCosmetic(r.state, cat, id), events: [] }; })) {
      delete tryLook[cat]; AW.render(); toast((c ? c.name : 'Item') + ' comprado e equipado');
    }
  };
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.id === 'reward-name') rewardDraft.name = t.value;
    if (t.id === 'reward-cost') { t.value = t.value.replace(/[^0-9]/g, ''); rewardDraft.cost = t.value; }
  });
  AW.handlers['reward-buy'] = function (el) { AW.apply(function (g) { return D.buyReward(g, el.getAttribute('data-id')); }); };
  AW.handlers['reward-del'] = function (el) {
    var id = el.getAttribute('data-id');
    if (confirm('Remover esta recompensa da loja?')) AW.apply(function (g) { return D.removeReward(g, id); });
  };
  AW.handlers['reward-sug'] = function (el) { var s = REWARD_SUGGESTIONS[Number(el.getAttribute('data-id'))]; rewardDraft = { name: s[0], cost: String(s[1]) }; AW.render(); };
  AW.handlers['reward-add'] = function () {
    var name = val('reward-name'), cost = val('reward-cost');
    if (AW.apply(function (g) { return D.addReward(g, { name: name, cost: cost }); })) { rewardDraft = { name: '', cost: '' }; AW.render(); toast('Recompensa adicionada'); }
  };

  /* ------------------------------ backup, importação e restauração ------------------------------ */
  var pendingImport = null, pendingHabits = null;

  function buildBackup() {
    return { app: 'awakening', format: 2, exportedAt: new Date().toISOString(), game: G(), workout: AW.workout ? AW.workout.export() : undefined, settings: { theme: S.theme, mode: S.mode, motion: S.motion, remindOn: S.remindOn, remindTime: S.remindTime, backupEvery: S.backupEvery } };
  }
  function markBackup() { S.lastBackup = new Date().toISOString(); S.backupSnooze = null; AW.saveSettings(); }
  function exportFile() {
    if (!G()) return;
    download('awakening-backup-' + D.dayKey(new Date()) + '.json', new Blob([JSON.stringify(buildBackup(), null, 2)], { type: 'application/json' }));
    markBackup(); toast('Backup exportado. Guarde o arquivo em um lugar seguro.'); AW.render();
  }
  function extractGame(obj) {
    var g = obj && obj.game ? obj.game : obj && obj.state && obj.state.game ? obj.state.game : obj;
    if (!g || typeof g !== 'object' || typeof g.totalXp !== 'number' || !Array.isArray(g.completions) || !Array.isArray(g.missions) || !g.attributeXp || !g.player) {
      throw new Error('Esse arquivo não parece um backup do Awakening.');
    }
    return D.normalizeState(g);
  }
  function checkImported(g) {
    var v = D.verifyState(g, new Date());
    if (!v.ok) throw new Error('O progresso parece corrompido ou alterado: ' + v.problems.slice(0, 2).join(' '));
  }
  function summary(g) { var lv = D.levelProgress(g.totalXp).level; return esc(g.player.name) + ' · ' + esc(D.RANKS[g.rankIndex].name) + ' · Nv. ' + lv + ' · ' + fmt(g.totalXp) + ' XP · ' + g.completions.length + ' missões'; }
  var pendingWorkout = null;
  function confirmImport(g, settings) {
    pendingImport = { g: g, settings: settings, workout: pendingWorkout }; pendingWorkout = null;
    var cur = G();
    AW.openModal('<div class="sys">[ IMPORTAR PROGRESSO ]</div><h2>SUBSTITUIR PROGRESSO?</h2><p class="msg" style="font-style:normal;color:var(--text)">Vai entrar:<br><b>' + summary(g) + '</b></p>' +
      (cur ? '<p class="msg">Atual:<br>' + summary(cur) + '<br>Uma cópia do progresso atual fica guardada em “Cópias automáticas”.</p>' : '') +
      '<button class="btn" data-act="import-confirm">Importar</button><button class="btn ghost" data-act="close-modal">Cancelar</button>', 'sm');
  }
  AW.handlers['import-confirm'] = function () {
    if (!pendingImport) return;
    var p = pendingImport; pendingImport = null;
    try { if (G()) AW.takeSnapshot(localStorage.getItem(AW.KEY), 'antes de importar', true); } catch (e) {}
    if (p.settings) { ['theme', 'mode', 'motion', 'remindOn', 'remindTime', 'backupEvery'].forEach(function (k) { if (p.settings[k] != null) S[k] = p.settings[k]; }); }
    if (p.workout && AW.workout) AW.workout.import(p.workout);
    AW.saveSettings(); AW.setGame(p.g); AW.closeModal(); toast('Progresso importado');
  };
  function importFromText(text) {
    var obj; try { obj = JSON.parse(text); } catch (e) { return toast('Arquivo inválido: não é um JSON.', true); }
    try { var g = extractGame(obj); checkImported(g); pendingWorkout = obj.workout || null; confirmImport(g, obj.settings); } catch (e) { toast(e.message, true); }
  }
  AW.handlers['backup-now'] = exportFile;
  AW.handlers['backup-snooze'] = function () { S.backupSnooze = new Date(Date.now() + 86400000).toISOString(); AW.saveSettings(); AW.render(); };
  AW.handlers['backup-every'] = function (el) { S.backupEvery = Number(el.getAttribute('data-id')); AW.saveSettings(); AW.render(); };
  AW.handlers['import-file-pick'] = function () { var f = $('import-file'); if (f) f.click(); };
  AW.handlers['code-copy'] = function () {
    encodeCode(buildBackup()).then(function (code) { return copyText(code).then(function (ok) { toast(ok ? 'Código copiado (' + fmt(code.length) + ' caracteres)' : 'Não foi possível copiar.', !ok); }); });
  };
  AW.handlers['link-copy'] = function () {
    encodeCode(buildBackup()).then(function (code) {
      if (code.length > 30000) return toast('Seu progresso é grande demais para um link. Use o arquivo ou o código.', true);
      return copyText(location.href.split('#')[0] + '#/import=' + code).then(function (ok) { toast(ok ? 'Link copiado. Abra em outro aparelho para restaurar.' : 'Não foi possível copiar.', !ok); });
    });
  };
  AW.handlers['code-import'] = function () {
    decodeCode(val('import-code')).then(function (obj) { var g = extractGame(obj); checkImported(g); pendingWorkout = obj.workout || null; confirmImport(g, obj.settings); }).catch(function (e) { toast(e.message, true); });
  };
  AW.handlers['snap-restore'] = function (el) {
    try {
      var list = JSON.parse(localStorage.getItem(AW.SNAPKEY) || '[]'), s = list[Number(el.getAttribute('data-id'))];
      var g = extractGame(JSON.parse(s.raw)); confirmImport(g, null);
    } catch (e) { toast('Não foi possível ler essa cópia.', true); }
  };
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.id === 'import-file' && t.files && t.files[0]) {
      var r = new FileReader(); r.onload = function () { importFromText(String(r.result)); }; r.readAsText(t.files[0]); t.value = '';
    }
    if (t.id === 'habits-file' && t.files && t.files[0]) {
      var f = t.files[0], r2 = new FileReader(); r2.onload = function () { previewHabits(String(r2.result), /\.ics$/i.test(f.name)); }; r2.readAsText(f); t.value = '';
    }
    if (t.id === 'remind-time') { S.remindTime = t.value || '20:00'; AW.saveSettings(); }
  });
  function checkHashImport() {
    var h = location.hash;
    if (h.indexOf('#/import=') !== 0) return;
    var code = h.slice(9);
    history.replaceState(null, '', location.pathname + location.search + '#/');
    AW.render();
    decodeCode(code).then(function (obj) { var g = extractGame(obj); checkImported(g); pendingWorkout = obj.workout || null; confirmImport(g, obj.settings); }).catch(function (e) { toast(e.message, true); });
  }

  /* ------------------------------ importar hábitos (CSV e .ics) ------------------------------ */
  function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
  function parseCSV(text, sep) {
    var rows = [], row = [], cur = '', q = false, i, c;
    var endRow = function () { row.push(cur); cur = ''; if (row.some(function (x) { return x.trim() !== ''; })) rows.push(row); row = []; };
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === sep) { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; endRow(); }
      else cur += c;
    }
    endRow(); return rows;
  }
  var DAY_IDX = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
  var ATTR_ALIAS = { for: 'forca', forca: 'forca', int: 'inteligencia', inteligencia: 'inteligencia', dis: 'disciplina', disciplina: 'disciplina', vit: 'vitalidade', vitalidade: 'vitalidade', foc: 'foco', foco: 'foco', car: 'carisma', carisma: 'carisma' };
  function parseDays(v) {
    var out = [];
    norm(v).split(/[|;,\s]+/).forEach(function (tok) {
      if (!tok || tok === 'todos' || tok === 'diario' || tok === 'todo') return;
      var parts = tok.split('-').filter(function (p) { return p && p !== 'feira'; });
      var idx = parts.map(function (p) { return /^[0-6]$/.test(p) ? Number(p) : DAY_IDX[p.slice(0, 3)]; });
      if (idx.some(function (x) { return x === undefined; })) return;
      if (parts.length === 2 && tok.indexOf('feira') < 0) { for (var d = idx[0], n = 0; n < 7; n++, d = (d + 1) % 7) { out.push(d); if (d === idx[1]) break; } }
      else out = out.concat(idx);
    });
    return out.filter(function (d, i) { return out.indexOf(d) === i; });
  }
  function parseAttrs(v) {
    var out = []; norm(v).split(/[|;,\s/]+/).forEach(function (t) { var a = ATTR_ALIAS[t]; if (a && out.indexOf(a) < 0) out.push(a); }); return out;
  }
  function guessAttrs(name) {
    var n = norm(name), a = [];
    if (/treino|academia|corrida|muscula|exerc|caminhada|esporte|nata|pedal/.test(n)) a.push('forca', 'vitalidade');
    if (/estud|curso|aula|program|ler |leitura|livro|ingles|idioma/.test(n)) a.push('inteligencia', 'foco');
    if (/dorm|agua|aliment|dieta|medit|sono|saude|skincare/.test(n)) a.push('vitalidade');
    if (/reuniao|amig|familia|socia|network|mensagem|conversa|ligar|ligacao|telefon|elogi|agradec|obrigad|apresenta|palestra|falar em publico|encontro|festa|convers|contato|conectar|networking|escuta|encontrar/.test(n)) a.push('carisma');
    if (!a.length) a.push('disciplina');
    return a.filter(function (x, i) { return a.indexOf(x) === i; }).slice(0, 2);
  }
  var TYPE_ALIAS = { diaria: 'daily', diario: 'daily', daily: 'daily', semanal: 'weekly', weekly: 'weekly', especial: 'special', special: 'special', unica: 'special' };
  function buildHabit(o, label, errors, out) {
    var name = String(o.name || '').trim();
    if (!name) return;
    var type = TYPE_ALIAS[norm(o.type)] || 'daily', diff = String(o.difficulty || 'C').trim().toUpperCase();
    if (['E', 'D', 'C', 'B', 'A', 'S'].indexOf(diff) < 0) diff = 'C';
    var attrs = parseAttrs(o.attrs); if (!attrs.length) attrs = guessAttrs(name);
    var xp = parseInt(o.xp, 10), target = parseInt(o.target, 10), dur = parseInt(o.duration, 10);
    var input = { name: name.slice(0, 60), description: String(o.desc || '').trim().slice(0, 160), type: type, difficulty: diff, xp: isFinite(xp) ? xp : D.suggestedXp(type, diff), attributes: attrs,
      target: isFinite(target) && target > 0 ? target : 1, durationMin: isFinite(dur) && dur > 0 ? dur : undefined, days: type === 'daily' ? parseDays(o.days || '') : undefined };
    if (o.deadline) input.deadline = o.deadline;
    var problem = D.validateMissionInput(input);
    if (problem) errors.push(label + ': ' + problem); else out.push(input);
  }
  function parseHabitsCSV(text, errors) {
    var first = text.split(/\r?\n/).filter(function (l) { return l.trim(); })[0] || '';
    var counts = { ';': (first.match(/;/g) || []).length, ',': (first.match(/,/g) || []).length, '\t': (first.match(/\t/g) || []).length };
    var sep = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
    var out = [], rows;
    if (!counts[sep]) { text.split(/\r?\n/).forEach(function (l, i) { buildHabit({ name: l.replace(/^[-*•\s]+/, '') }, 'linha ' + (i + 1), errors, out); }); return out; }
    rows = parseCSV(text, sep);
    var head = rows[0].map(norm), map = {}, KEYS = { name: ['nome', 'name', 'habito', 'titulo', 'missao'], type: ['tipo', 'type'], difficulty: ['dificuldade', 'difficulty', 'rank'], xp: ['xp'], attrs: ['atributos', 'atributo', 'attributes'], target: ['meta', 'etapas', 'target'], duration: ['duracao', 'minutos', 'duration'], days: ['dias', 'days'], desc: ['descricao', 'description'] };
    var hasHeader = head.some(function (h) { return KEYS.name.indexOf(h) >= 0; });
    if (hasHeader) { Object.keys(KEYS).forEach(function (k) { var i = head.findIndex(function (h) { return KEYS[k].indexOf(h) >= 0; }); if (i >= 0) map[k] = i; }); rows = rows.slice(1); }
    else { ['name', 'type', 'difficulty', 'xp', 'attrs', 'target', 'duration', 'days', 'desc'].forEach(function (k, i) { map[k] = i; }); }
    rows.forEach(function (r, i) {
      var o = {}; Object.keys(map).forEach(function (k) { o[k] = r[map[k]]; });
      buildHabit(o, 'linha ' + (i + (hasHeader ? 2 : 1)), errors, out);
    });
    return out;
  }
  function icsDate(v) {
    var m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(v || ''); if (!m) return null;
    return m[7] ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0))) : new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  }
  function parseHabitsICS(text, errors) {
    var lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/), events = [], cur = null, out = [], seen = {};
    lines.forEach(function (l) {
      if (l === 'BEGIN:VEVENT') cur = {}; else if (l === 'END:VEVENT') { if (cur) events.push(cur); cur = null; }
      else if (cur) { var i = l.indexOf(':'); if (i > 0) cur[l.slice(0, i).split(';')[0].toUpperCase()] = l.slice(i + 1); }
    });
    var un = function (s) { return String(s || '').replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1'); };
    var BY = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
    events.slice(0, 200).forEach(function (e, i) {
      var name = un(e.SUMMARY).trim(); if (!name) return;
      var rule = e.RRULE || '', key = name + '|' + rule; if (seen[key]) return; seen[key] = 1;
      var s = icsDate(e.DTSTART), t = icsDate(e.DTEND), dur = s && t && String(e.DTSTART).indexOf('T') > 0 ? Math.round((t - s) / 60000) : 0;
      var o = { name: name, desc: un(e.DESCRIPTION).trim(), duration: dur > 0 && dur <= 600 ? dur : '' };
      var freq = (/FREQ=(\w+)/.exec(rule) || [])[1], byday = (/BYDAY=([^;]+)/.exec(rule) || [])[1];
      if (freq === 'DAILY') o.type = 'daily';
      else if (freq === 'WEEKLY' && byday) { o.type = 'daily'; o.days = byday.split(',').map(function (d) { return BY[d.replace(/[^A-Z]/g, '')]; }).filter(function (x) { return x !== undefined; }).join('|'); }
      else if (freq === 'WEEKLY') o.type = 'weekly';
      else if (!freq) { if (s && s > new Date()) { o.type = 'special'; o.deadline = s.toISOString(); } else return; }
      else o.type = 'weekly';
      buildHabit(o, 'evento ' + (i + 1), errors, out);
    });
    return out.slice(0, 60);
  }
  function previewHabits(text, isIcs) {
    if (!text.trim()) return toast('Cole ou escolha algo para importar.', true);
    var errors = [], items = isIcs || /BEGIN:VCALENDAR/.test(text) ? parseHabitsICS(text, errors) : parseHabitsCSV(text, errors);
    items = items.slice(0, 60);
    if (!items.length) return toast(errors[0] || 'Não encontrei hábitos para importar.', true);
    pendingHabits = items;
    AW.openModal('<div class="sys">[ IMPORTAR HÁBITOS ]</div><h2>' + items.length + ' MISSÕES ENCONTRADAS</h2><div class="stack" style="width:100%;text-align:left;gap:6px;max-height:40vh;overflow:auto">' +
      items.slice(0, 12).map(function (m) { return '<div class="hist"><span class="dt" style="width:auto">' + esc(AW.TYPE_LABEL[m.type]) + '</span><span>' + esc(m.name) + ' · ' + m.xp + ' XP' + (m.days && m.days.length ? ' · ' + m.days.map(function (d) { return AW.DAYS3[d]; }).join('/') : '') + '</span></div>'; }).join('') +
      (items.length > 12 ? '<div class="mute small">e mais ' + (items.length - 12) + '...</div>' : '') + '</div>' +
      (errors.length ? '<p class="error small" style="margin:0">' + errors.length + ' linha(s) ignorada(s): ' + esc(errors.slice(0, 2).join(' ')) + '</p>' : '') +
      '<button class="btn" data-act="habits-confirm">Importar</button><button class="btn ghost" data-act="close-modal">Cancelar</button>', 'sm');
  }
  AW.handlers['habits-preview'] = function () { previewHabits(val('habits-text'), false); };
  AW.handlers['habits-confirm'] = function () {
    if (!pendingHabits) return;
    var items = pendingHabits; pendingHabits = null; AW.closeModal();
    AW.apply(function (g) {
      var st = g; items.forEach(function (it) { try { st = D.addMission(st, it); } catch (e) {} });
      return { state: st, events: [] };
    });
    toast(items.length + ' missões importadas');
  };
  AW.handlers['habits-template'] = function () {
    var csv = 'nome;tipo;dificuldade;xp;atributos;meta;duracao;dias;descricao\n' +
      'Treino;diaria;C;60;forca|vitalidade;1;60;seg|qua|sex;Treino completo\n' +
      'Estudar inglês;diaria;C;50;inteligencia|foco;1;45;;Uma aula por dia\n' +
      'Revisão da semana;semanal;D;100;disciplina;1;;;Planejar a próxima semana\n';
    download('awakening-habitos-modelo.csv', new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  };

  /* ------------------------------ configurações ------------------------------ */
  var deferredInstall = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; if (AW.route() === '#/settings') AW.render(); });
  window.addEventListener('appinstalled', function () { deferredInstall = null; toast('App instalado'); });
  var isStandalone = function () { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; };
  var notifOk = function () { return 'Notification' in window; };

  function settingsView() {
    var g = G(), snaps = []; try { snaps = JSON.parse(localStorage.getItem(AW.SNAPKEY) || '[]'); } catch (e) {}
    var perm = notifOk() ? Notification.permission : 'unsupported';
    var permText = perm === 'granted' ? 'Notificações liberadas.' : perm === 'denied' ? 'Notificações bloqueadas no navegador. Libere nas configurações do site.' : perm === 'unsupported' ? 'Este navegador não suporta notificações.' : 'O navegador vai pedir permissão ao ativar.';
    var lastB = S.lastBackup ? 'Último backup: ' + AW.dm(S.lastBackup) + '/' + new Date(S.lastBackup).getFullYear() : 'Você ainda não exportou nenhum backup.';
    return '<div class="between"><h1 class="screen-title">AJUSTES</h1><a class="close" href="#/character" aria-label="Fechar" style="text-decoration:none">✕</a></div>' +
      panel('Aparência', '<p class="label">TEMA DE COR</p><div class="row">' + chip('Clássico (azul)', S.theme !== 'rank', 'data-act="theme" data-id="classic"') + chip('Cor do meu rank', S.theme === 'rank', 'data-act="theme" data-id="rank"', D.RANKS[g.rankIndex].color) + '</div>' +
        '<p class="help">No tema do rank, a interface muda de cor a cada vez que você sobe de rank.</p>' +
        '<p class="label" style="margin-top:16px">MODO</p><div class="row">' + [['dark', 'Escuro'], ['light', 'Claro'], ['auto', 'Seguir o sistema']].map(function (o) { return chip(o[1], (S.mode || 'dark') === o[0], 'data-act="mode" data-id="' + o[0] + '"'); }).join('') + '</div>' +
        '<p class="label" style="margin-top:16px">ANIMAÇÕES</p><div class="row">' + chip('Normais', S.motion !== 'reduced', 'data-act="motion" data-id="auto"') + chip('Reduzidas', S.motion === 'reduced', 'data-act="motion" data-id="reduced"') + '</div>' +
        '<p class="help">“Reduzidas” desliga o brilho pulsante, as partículas e as transições. Com o sistema configurado para reduzir movimento, isso já vem ativo por padrão.</p>') +
      panel('Lembrete diário', '<div class="row" style="justify-content:space-between"><span style="font-weight:600">Avisar se houver missões pendentes</span>' + chip(S.remindOn ? 'Ligado' : 'Desligado', S.remindOn, 'data-act="remind-toggle"') + '</div>' +
        '<p class="label" style="margin-top:14px">HORÁRIO</p><input id="remind-time" type="time" class="input" style="max-width:160px" value="' + esc(S.remindTime) + '" />' +
        '<p class="help">' + permText + ' O aviso só chega com o app aberto ou instalado e recém-usado, porque um site sem servidor não consegue acordar o celular. Em dias de descanso ou sem pendências, nada é enviado.</p>' +
        (S.remindOn && perm === 'granted' ? '<div style="margin-top:10px"><button class="btn ghost small" data-act="remind-test">Enviar aviso de teste</button></div>' : '')) +
      panel('Backup', '<p style="margin:0 0 12px;color:var(--dim)">Seu progresso fica neste navegador. Faça backups para não perder nada e para levar para outro aparelho.</p><p class="help" style="margin:0 0 12px">' + lastB + '</p>' +
        '<div class="stack" style="gap:10px"><button class="btn" data-act="backup-now">Exportar arquivo de backup</button><button class="btn ghost" data-act="import-file-pick">Importar arquivo de backup</button>' +
        '<input id="import-file" type="file" accept=".json,application/json" class="hidden" />' +
        '<div class="row2"><button class="btn ghost" data-act="code-copy">Copiar código</button><button class="btn ghost" data-act="link-copy">Copiar link</button></div></div>' +
        '<p class="label" style="margin-top:16px">COLAR UM CÓDIGO</p><textarea id="import-code" class="input" placeholder="Cole aqui um código AWK..."></textarea><div style="margin-top:10px"><button class="btn ghost" data-act="code-import">Importar código</button></div>' +
        '<p class="label" style="margin-top:16px">LEMBRAR DE FAZER BACKUP</p><div class="row">' + [[0, 'Nunca'], [3, '3 dias'], [7, '7 dias'], [14, '14 dias'], [30, '30 dias']].map(function (o) { return chip(o[1], S.backupEvery === o[0], 'data-act="backup-every" data-id="' + o[0] + '"'); }).join('') + '</div>') +
      panel('Cópias automáticas', '<p style="margin:0 0 10px;color:var(--dim)">O app guarda uma cópia do dia anterior a cada dia de uso (até 6). Elas ficam no mesmo navegador, então não substituem o backup em arquivo.</p>' +
        (snaps.length ? '<div class="stack" style="gap:8px">' + snaps.map(function (s, i) {
          var gg = null; try { gg = JSON.parse(s.raw).state.game; } catch (e) {}
          return '<div class="done-row"><span style="flex:1;min-width:0">' + AW.dm(s.at) + ' · ' + esc(s.label) + (gg ? ' · Nv. ' + D.levelProgress(gg.totalXp).level + ' · ' + gg.completions.length + ' missões' : '') + '</span><button class="btn ghost inline small" style="width:auto" data-act="snap-restore" data-id="' + i + '">Restaurar</button></div>';
        }).reverse().join('') + '</div>' : '<p class="help" style="margin:0">Ainda não há cópias.</p>')) +
      panel('Importar hábitos', '<p style="margin:0 0 10px;color:var(--dim)">Traga hábitos de uma planilha (CSV) ou de um calendário (.ics). Também vale colar uma lista com um hábito por linha.</p>' +
        '<textarea id="habits-text" class="input" placeholder="Um hábito por linha, ou cole o conteúdo de um CSV"></textarea>' +
        '<div class="stack" style="gap:10px;margin-top:10px"><button class="btn" data-act="habits-preview">Ver o que será importado</button><button class="btn ghost" data-act="habits-file-pick">Escolher arquivo .csv ou .ics</button>' +
        '<input id="habits-file" type="file" accept=".csv,.ics,.txt,text/csv,text/calendar,text/plain" class="hidden" /><button class="btn ghost small" data-act="habits-template">Baixar modelo de planilha (CSV)</button></div>' +
        '<p class="help">Colunas do CSV: nome, tipo (diaria, semanal, especial), dificuldade (E a S), xp, atributos (separados por |), meta, duracao, dias (seg|qua|sex) e descricao. Só o nome é obrigatório.</p>') +
      panel('Aplicativo', (isStandalone() ? '<p style="margin:0;color:var(--success);font-weight:600">✓ Você está usando o app instalado.</p>' :
        deferredInstall ? '<button class="btn" data-act="install">Instalar na tela inicial</button>' :
        '<p style="margin:0;color:var(--dim)">Para instalar: no Chrome ou Edge use o ícone de instalar na barra de endereço. No iPhone, abra no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.</p>') +
        '<p class="help">Depois de aberto uma vez, o app funciona sem internet.</p><div style="margin-top:12px"><button class="btn ghost small" data-act="shortcuts">Ver atalhos de teclado</button></div>');
  }
  AW.views['#/settings'] = settingsView;
  AW.handlers['habits-file-pick'] = function () { var f = $('habits-file'); if (f) f.click(); };
  AW.handlers.mode = function (el) { S.mode = el.getAttribute('data-id'); AW.saveSettings(); AW.render(); };
  AW.handlers.motion = function (el) { S.motion = el.getAttribute('data-id'); AW.saveSettings(); AW.render(); };
  AW.handlers.theme = function (el) { S.theme = el.getAttribute('data-id'); AW.saveSettings(); AW.render(); };
  AW.handlers.install = function () {
    if (!deferredInstall) return;
    deferredInstall.prompt(); deferredInstall.userChoice.then(function () { deferredInstall = null; AW.render(); });
  };
  AW.handlers['remind-toggle'] = function () {
    if (S.remindOn) { S.remindOn = false; AW.saveSettings(); return AW.render(); }
    if (!notifOk()) return toast('Este navegador não suporta notificações.', true);
    var go = function (p) {
      if (p === 'granted') { S.remindOn = true; AW.saveSettings(); toast('Lembrete ligado'); } else toast('Sem permissão do navegador, o lembrete não pode ser ligado.', true);
      AW.render();
    };
    if (Notification.permission === 'default') { var r = Notification.requestPermission(); if (r && r.then) r.then(go); else Notification.requestPermission(go); } else go(Notification.permission);
  };
  AW.handlers['remind-test'] = function () { sendNotification('Awakening', 'Assim chegam os seus lembretes diários.', 'awakening-test'); };

  /* ------------------------------ notificações ------------------------------ */
  function sendNotification(title, body, tag) {
    if (!notifOk() || Notification.permission !== 'granted') return;
    var opts = { body: body, icon: 'assets/icon-192.png', badge: 'assets/icon-192.png', tag: tag || 'awakening-daily', data: { url: './' } };
    var direct = function () { try { new Notification(title, opts); } catch (e) {} };
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then(function (reg) { if (reg && reg.showNotification) reg.showNotification(title, opts); else direct(); }, direct);
    } else direct();
  }
  function checkReminder() {
    var g = G();
    if (!g || !S.remindOn || !notifOk() || Notification.permission !== 'granted') return;
    var now = new Date(), today = D.dayKey(now);
    if (S.lastRemind === today || pad(now.getHours()) + ':' + pad(now.getMinutes()) < S.remindTime) return;
    S.lastRemind = today; AW.saveSettings();
    var pend = D.pendingDaily(g, now).length;
    if ((g.restDays || []).indexOf(today) >= 0 || pend === 0) return;
    sendNotification('Suas missões de hoje estão te esperando', pend + (pend === 1 ? ' pendente' : ' pendentes') + '. Se hoje for dia de descanso, tudo bem também.');
  }

  /* ------------------------------ sessão de foco ------------------------------ */
  var focusPick = 25, audioCtx = null, wakeLock = null, focusTick = null, finishedShown = false;
  function beep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35, 0.7].forEach(function (d) {
        var o = audioCtx.createOscillator(), gn = audioCtx.createGain(); o.frequency.value = 880; o.connect(gn); gn.connect(audioCtx.destination);
        var t = audioCtx.currentTime + d; gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.25, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); o.start(t); o.stop(t + 0.3);
      });
    } catch (e) {}
  }
  function lockScreen() { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; }, function () {}); } catch (e) {} }
  function unlockScreen() { try { if (wakeLock) wakeLock.release(); } catch (e) {} wakeLock = null; }
  function mmss(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
  function findMission(id) { return (G().missions || []).filter(function (m) { return m.id === id; })[0]; }

  function openFocusSetup(id) {
    var m = findMission(id); if (!m) return;
    if (!focusPick) focusPick = m.durationMin || 25;
    var presets = [15, 25, 45, 60]; if (m.durationMin && presets.indexOf(m.durationMin) < 0) presets.push(m.durationMin);
    presets.sort(function (a, b) { return a - b; });
    AW.openModal('<div class="sys">[ SESSÃO DE FOCO ]</div><h2>' + esc(m.name) + '</h2><p class="msg" style="font-style:normal">Celular de lado, uma coisa só. Ao terminar, a missão pode ser concluída com as horas registradas.</p>' +
      '<div class="row" style="justify-content:center">' + presets.map(function (p) { return chip(p + ' min', focusPick === p, 'data-act="focus-min" data-id="' + p + '" data-mid="' + id + '"'); }).join('') + '</div>' +
      '<button class="btn" data-act="focus-start" data-id="' + id + '">Iniciar ' + focusPick + ' min</button><button class="btn ghost" data-act="close-modal">Cancelar</button>', 'sm');
  }
  AW.handlers.focus = function (el) {
    var m = findMission(el.getAttribute('data-id')); if (!m) return;
    if (S.focus) return showFocus();
    focusPick = m.durationMin || 25; openFocusSetup(m.id);
  };
  AW.handlers['focus-min'] = function (el) { focusPick = Number(el.getAttribute('data-id')); openFocusSetup(el.getAttribute('data-mid')); };
  AW.handlers['focus-start'] = function (el) {
    var m = findMission(el.getAttribute('data-id')); if (!m) return;
    S.focus = { missionId: m.id, name: m.name, minutes: focusPick, endsAt: Date.now() + focusPick * 60000, finished: false }; AW.saveSettings();
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.resume) audioCtx.resume(); } catch (e) {}
    lockScreen(); finishedShown = false; showFocus(); startTicker();
  };
  function showFocus() {
    var f = S.focus; if (!f) return;
    if (f.finished || Date.now() >= f.endsAt) return showFinished();
    AW.openModal('<div class="sys">[ FOCO ]</div><h2>' + esc(f.name) + '</h2><div class="timer" id="focus-time">' + mmss(f.endsAt - Date.now()) + '</div>' +
      '<div class="bar" style="--c:var(--glow);--h:10px;width:100%"><i id="focus-bar" style="width:' + Math.min(100, (1 - (f.endsAt - Date.now()) / (f.minutes * 60000)) * 100).toFixed(1) + '%"></i></div>' +
      '<p class="msg">Você pode minimizar: o relógio continua rodando.</p><button class="btn ghost" data-act="close-modal">Minimizar</button><button class="btn danger" data-act="focus-cancel">Cancelar sessão</button>', 'sm');
    updatePill();
  }
  function showFinished() {
    var f = S.focus; if (!f) return;
    f.finished = true; AW.saveSettings(); unlockScreen();
    AW.openModal('<div class="sys">[ SESSÃO CONCLUÍDA ]</div><h2>' + f.minutes + ' MINUTOS DE FOCO</h2><p class="msg" style="font-style:normal;color:var(--text)">' + esc(f.name) + '</p>' +
      '<button class="btn" data-act="focus-claim">Concluir missão</button><button class="btn ghost" data-act="focus-dismiss">Ainda não terminei a missão</button>', 'sm');
    updatePill();
  }
  function updatePill() {
    var pill = $('focus-pill'), f = S.focus;
    if (!f) { if (pill) pill.remove(); document.title = document.title.replace(/^◉ [\d:]+ · /, ''); return; }
    if (!pill) { pill = document.createElement('button'); pill.id = 'focus-pill'; pill.className = 'focus-pill'; pill.setAttribute('data-act', 'focus-open'); pill.setAttribute('aria-label', 'Abrir sessão de foco'); document.body.appendChild(pill); }
    pill.textContent = f.finished ? '◉ Concluir' : '◉ ' + mmss(f.endsAt - Date.now());
  }
  function startTicker() {
    if (focusTick) return;
    focusTick = setInterval(function () {
      var f = S.focus;
      if (!f) { clearInterval(focusTick); focusTick = null; return updatePill(); }
      var left = f.endsAt - Date.now();
      if (!f.finished && left <= 0) {
        f.finished = true; AW.saveSettings(); beep(); sendNotification('Sessão de foco concluída', f.name + ' — hora de concluir a missão.', 'awakening-focus');
        if (!finishedShown) { finishedShown = true; showFinished(); }
        return;
      }
      if (f.finished) return;
      var t = $('focus-time'), b = $('focus-bar');
      if (t) t.textContent = mmss(left);
      if (b) b.style.width = Math.min(100, (1 - left / (f.minutes * 60000)) * 100).toFixed(1) + '%';
      document.title = '◉ ' + mmss(left) + ' · ' + document.title.replace(/^◉ [\d:]+ · /, '');
      updatePill();
    }, 500);
  }
  AW.handlers['focus-open'] = function () { showFocus(); };
  AW.handlers['focus-cancel'] = function () {
    if (!confirm('Cancelar a sessão de foco? O tempo não será registrado.')) return;
    S.focus = null; AW.saveSettings(); unlockScreen(); AW.closeModal(); updatePill(); toast('Sessão cancelada');
  };
  AW.handlers['focus-dismiss'] = function () { S.focus = null; AW.saveSettings(); AW.closeModal(); updatePill(); };
  AW.handlers['focus-claim'] = function () {
    var f = S.focus; if (!f) return;
    var m = findMission(f.missionId); S.focus = null; AW.saveSettings(); AW.closeModal(); updatePill();
    if (!m) return toast('A missão não existe mais.', true);
    var before = G(), opts = { focus: true, focusMin: f.minutes };
    AW.apply(function (g) { return m.target > 1 ? D.addProgress(g, m.id, 1, new Date(), opts) : D.completeMission(g, m.id, new Date(), opts); });
    if (G() === before) toast('Essa missão já foi concluída ou não está disponível hoje.', true);
  };

  /* ------------------------------ cartão do personagem ------------------------------ */
  var lastCard = null;
  /** Foto do jogador (a mesma do Painel), guardada só neste navegador. */
  function loadImg() {
    return new Promise(function (resolve) {
      var u = ''; try { u = localStorage.getItem('awakening-avatar-v1') || ''; } catch (e) {}
      if (!u) return resolve(null);
      var img = new Image(); img.onload = function () { resolve(img); }; img.onerror = function () { resolve(null); }; img.src = u;
    });
  }
  function buildCard() {
    var g = G(), now = N(), st = D.deriveStats(g, now), rank = D.RANKS[g.rankIndex], lvl = D.levelProgress(g.totalXp).level, title = D.currentTitle(g);
    var fc = D.RANKS[g.player.frame != null ? g.player.frame : g.rankIndex].color;
    var fontsReady = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('900 64px Orbitron'), document.fonts.load('700 30px Rajdhani')]).catch(function () {}) : Promise.resolve();
    return Promise.all([loadImg(), fontsReady]).then(function (r) {
      var img = r[0], W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d'), center = function (t, y) { x.textAlign = 'center'; x.fillText(t, W / 2, y); };
      var bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0a1d3d'); bg.addColorStop(0.45, '#07101f'); bg.addColorStop(1, '#03050b'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(61,169,255,.07)'; x.lineWidth = 1; for (var i = 0; i <= W; i += 54) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); } for (var j = 0; j <= H; j += 54) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
      var glow = x.createRadialGradient(W / 2, 560, 40, W / 2, 560, 560); glow.addColorStop(0, rank.color + '66'); glow.addColorStop(1, rank.color + '00'); x.fillStyle = glow; x.fillRect(0, 0, W, H);
      if (img) {
        var pw = 690, ph = 800, px = (W - pw) / 2, py = 150, k = Math.max(pw / img.naturalWidth, ph / img.naturalHeight), sw = pw / k, sh = ph / k;
        x.save(); x.beginPath(); if (x.roundRect) x.roundRect(px, py, pw, ph, 56); else x.rect(px, py, pw, ph); x.clip();
        x.drawImage(img, (img.naturalWidth - sw) / 2, Math.max(0, (img.naturalHeight - sh) * 0.3), sw, sh, px, py, pw, ph); x.restore();
        x.strokeStyle = fc; x.lineWidth = 6; x.beginPath(); if (x.roundRect) x.roundRect(px, py, pw, ph, 56); else x.rect(px, py, pw, ph); x.stroke();
      }
      x.strokeStyle = fc; x.lineWidth = 4; x.beginPath(); x.moveTo(60, 24); x.lineTo(W - 24, 24); x.lineTo(W - 24, H - 60); x.lineTo(W - 60, H - 24); x.lineTo(24, H - 24); x.lineTo(24, 60); x.closePath(); x.stroke();
      x.fillStyle = '#00d4ff'; x.font = '900 40px Orbitron, sans-serif'; try { x.letterSpacing = '14px'; } catch (e) {} center('AWAKENING', 100); try { x.letterSpacing = '0px'; } catch (e) {}
      x.fillStyle = '#e8f0ff'; x.font = '900 76px Orbitron, sans-serif'; center(g.player.name.toUpperCase(), 1010);
      x.fillStyle = title ? title.color : '#8ea0c4'; x.font = '700 34px Rajdhani, sans-serif'; center((title ? title.label : rank.title).toUpperCase(), 1056);
      x.fillStyle = rank.color; x.font = '700 42px Orbitron, sans-serif'; center(rank.name.toUpperCase() + '  ·  NÍVEL ' + lvl, 1118);
      D.ATTRIBUTE_IDS.forEach(function (id, n) {
        var def = D.ATTRIBUTES[id], p = D.attributeProgress(g.attributeXp[id]), col = n % 2, row = Math.floor(n / 2), bx = col ? 570 : 90, by = 1172 + row * 50;
        x.textAlign = 'left'; x.fillStyle = def.color; x.font = '700 28px Rajdhani, sans-serif'; x.fillText(def.short, bx, by + 14);
        x.textAlign = 'right'; x.fillText('Nv. ' + p.level, bx + 420, by + 14);
        x.fillStyle = 'rgba(120,150,210,.18)'; x.fillRect(bx + 70, by, 270, 12); x.fillStyle = def.color; x.fillRect(bx + 70, by, 270 * Math.max(0.02, p.ratio), 12);
      });
      x.fillStyle = '#8ea0c4'; x.font = '600 28px Rajdhani, sans-serif'; center(pl(st.activeDays, 'dia ativo', 'dias ativos') + '  ·  sequência ' + st.currentStreak + '  ·  ' + pl(st.missionsCompleted, 'missão', 'missões') + '  ·  ' + fmt(g.totalXp) + ' XP', 1318);
      return c;
    });
  }
  AW.handlers['share-card'] = function () {
    buildCard().then(function (c) {
      lastCard = c;
      var canShare = false; try { canShare = !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] })); } catch (e) {}
      AW.openModal('<img class="card-prev" src="' + c.toDataURL('image/png') + '" alt="Cartão do personagem" /><div class="stack" style="width:100%"><button class="btn" data-act="card-download">Baixar imagem</button>' +
        (canShare ? '<button class="btn ghost" data-act="card-share">Compartilhar</button>' : '') + '<button class="btn ghost" data-act="close-modal">Fechar</button></div>', 'card');
    }).catch(function () { toast('Não foi possível gerar o cartão.', true); });
  };
  function cardBlob(cb) { if (lastCard) lastCard.toBlob(cb, 'image/png'); }
  AW.handlers['card-download'] = function () { cardBlob(function (b) { if (b) download('awakening-' + G().player.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png', b); }); };
  AW.handlers['card-share'] = function () {
    cardBlob(function (b) { if (!b) return; navigator.share({ files: [new File([b], 'awakening.png', { type: 'image/png' })], title: 'Awakening' }).catch(function () {}); });
  };

  /* ------------------------------ atalhos de teclado ------------------------------ */
  var selIndex = -1;
  var SHORTCUTS = [['N', 'Nova missão'], ['1 – 5', 'Painel, Missões, Stats, Loja, Perfil'], ['J / K', 'Selecionar missão abaixo / acima'], ['Enter', 'Concluir a missão selecionada (+1 etapa)'], ['F', 'Sessão de foco na missão selecionada'],
    ['U', 'Desfazer a última conclusão de hoje'], ['R', 'Marcar ou desmarcar descanso de hoje'], ['?', 'Mostrar esta lista'], ['Esc', 'Fechar janelas']];
  function cards() { return Array.prototype.slice.call(document.querySelectorAll('#app .mission[data-mid]:not(.boss)')); }
  function applySelection() {
    document.querySelectorAll('.panel.sel').forEach(function (p) { p.classList.remove('sel'); });
    var list = cards(); if (selIndex < 0 || selIndex >= list.length) return;
    var p = list[selIndex].closest('.panel'); if (p) p.classList.add('sel');
  }
  AW.onRender.push(function () { applySelection(); });
  AW.handlers.shortcuts = function () {
    AW.openModal('<div class="sys">[ ATALHOS ]</div><h2>TECLADO</h2><div class="stack" style="width:100%;text-align:left;gap:8px">' + SHORTCUTS.map(function (s) { return '<div class="kv" style="margin:0"><kbd>' + esc(s[0]) + '</kbd><span style="text-align:right">' + esc(s[1]) + '</span></div>'; }).join('') + '</div><button class="btn" data-act="close-modal">Fechar</button>', 'sm');
  };
  document.addEventListener('keydown', function (ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.defaultPrevented) return;
    var t = ev.target, tag = t && t.tagName;
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || (t && t.isContentEditable)) return;
    if (document.getElementById('modal').firstChild || !G()) return;
    var k = ev.key, list;
    if (k === 'n' || k === 'N') { location.hash = '#/new'; ev.preventDefault(); }
    else if (k >= '1' && k <= '6') { location.hash = ['#/', '#/missions', '#/stats', '#/workout', '#/store', '#/character'][Number(k) - 1]; ev.preventDefault(); }
    else if (k === '?') { AW.handlers.shortcuts(); ev.preventDefault(); }
    else if (k === 'j' || k === 'k') {
      list = cards(); if (!list.length) return;
      selIndex = k === 'j' ? Math.min(list.length - 1, selIndex + 1) : Math.max(0, selIndex < 0 ? 0 : selIndex - 1);
      applySelection(); var p = list[selIndex].closest('.panel'); if (p && p.scrollIntoView) p.scrollIntoView({ block: 'center', behavior: 'smooth' }); ev.preventDefault();
    }
    else if (k === 'Enter' && selIndex >= 0) {
      list = cards(); var btn = list[selIndex] && list[selIndex].querySelector('[data-act=complete],[data-act=progress]'); if (btn) { btn.click(); ev.preventDefault(); }
    }
    else if ((k === 'f' || k === 'F') && selIndex >= 0) {
      list = cards(); var fb = list[selIndex] && list[selIndex].querySelector('[data-act=focus]'); if (fb) { fb.click(); ev.preventDefault(); }
    }
    else if (k === 'u' || k === 'U') {
      var g = G(), today = D.dayKey(new Date()), last = g.completions.filter(function (c) { return c.day === today && c.kind !== 'boss'; }).pop();
      if (last) AW.act.undo(last.id); else toast('Nada para desfazer hoje.', true);
      ev.preventDefault();
    }
    else if (k === 'r' || k === 'R') { AW.act.rest(); ev.preventDefault(); }
  });
  window.addEventListener('hashchange', function () { selIndex = -1; });

  /* ------------------------------ PWA e inicialização ------------------------------ */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  document.addEventListener('DOMContentLoaded', function () {
    checkHashImport();
    if (S.focus) { startTicker(); if (G()) { if (S.focus.finished || Date.now() >= S.focus.endsAt) { finishedShown = true; showFinished(); } else { updatePill(); lockScreen(); } } else S.focus = null; }
    checkReminder(); setInterval(checkReminder, 30000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { checkReminder(); if (S.focus && !S.focus.finished) lockScreen(); } });
  });
  window.addEventListener('hashchange', function () { if (location.hash.indexOf('#/import=') === 0) checkHashImport(); });

  /* ------------------------------ metas por atributo ------------------------------ */
  var goalDraft = { attr: null, level: 0, days: 0 };
  function goalLine(g, goal, full) {
    var def = D.ATTRIBUTES[goal.attribute], p = D.goalProgress(g, goal, N());
    var status = goal.doneAt ? 'Cumprida em ' + AW.dm(goal.doneAt) : p.status === 'late' ? 'Prazo vencido · faltam ' + fmt(p.remainingXp) + ' XP'
      : fmt(p.remainingXp) + ' XP restantes' + (p.daysLeft !== null ? ' · ' + pl(Math.max(0, p.daysLeft), 'dia', 'dias') + (p.perDay ? ' · ~' + fmt(p.perDay) + ' XP/dia' : '') : '');
    return '<div class="goal' + (goal.doneAt ? ' done' : p.status === 'late' ? ' late' : '') + '"><div class="gh"><span style="color:' + def.color + '">' + def.glyph + '</span><span>' + esc(def.name) + ' · Nv. ' + p.level + ' → ' + goal.targetLevel + '</span>' +
      (full ? '<button class="mini gx" data-act="goal-del" data-id="' + goal.id + '" aria-label="Remover meta de ' + esc(def.name) + '">✕</button>' : '') + '</div>' +
      bar(goal.doneAt ? 1 : p.ratio, goal.doneAt ? 'var(--success)' : def.color, 6) + '<div class="gs">' + status + '</div></div>';
  }
  AW.goalsMini = function () {
    var g = G(), act = (g.goals || []).filter(function (x) { return !x.doneAt; });
    if (!act.length) return '';
    return panel('Metas', act.slice(0, 2).map(function (x) { return goalLine(g, x, false); }).join('') +
      '<a class="small" style="color:var(--glow);display:inline-block;margin-top:10px" href="#/character">' + (act.length > 2 ? 'Ver as ' + act.length + ' metas' : 'Gerenciar metas') + '</a>', { accent: 'var(--glow)' });
  };
  AW.goalsPanel = function () {
    var g = G(), goals = g.goals || [], act = goals.filter(function (x) { return !x.doneAt; }), done = goals.filter(function (x) { return x.doneAt; });
    var cur = goalDraft.attr ? D.attributeProgress(g.attributeXp[goalDraft.attr]).level : 0;
    if (goalDraft.attr && goalDraft.level <= cur) goalDraft.level = cur + 1;
    var body = act.length ? act.map(function (x) { return goalLine(g, x, true); }).join('') : '<p class="dim" style="margin:0">Nenhuma meta ativa. Escolha um atributo e o nível que quer alcançar.</p>';
    body += '<p class="label" style="margin-top:18px">NOVA META</p><div class="row">' + D.ATTRIBUTE_IDS.map(function (id) {
      return chip(D.ATTRIBUTES[id].glyph + ' ' + D.ATTRIBUTES[id].short, goalDraft.attr === id, 'data-act="goal-attr" data-id="' + id + '"', D.ATTRIBUTES[id].color);
    }).join('') + '</div>';
    if (goalDraft.attr) {
      body += '<p class="label" style="margin-top:14px">NÍVEL ALVO (ATUAL: ' + cur + ')</p><div class="stepper"><button type="button" data-act="goal-lv" data-id="-1" aria-label="Menos">−</button><b>' + goalDraft.level + '</b><button type="button" data-act="goal-lv" data-id="1" aria-label="Mais">+</button></div>' +
        '<p class="label" style="margin-top:14px">PRAZO</p><div class="row">' + [[0, 'Sem prazo'], [30, '30 dias'], [60, '60 dias'], [90, '90 dias']].map(function (o) { return chip(o[1], goalDraft.days === o[0], 'data-act="goal-days" data-id="' + o[0] + '"'); }).join('') + '</div>' +
        '<p class="help">Ao atingir o nível você ganha ' + Math.min(500, goalDraft.level * 10) + ' moedas. O XP necessário aparece no progresso da meta.</p>' +
        '<div style="margin-top:12px"><button class="btn" data-act="goal-add">Criar meta</button></div>';
    }
    if (done.length) body += '<p class="help" style="margin-top:14px">✓ ' + pl(done.length, 'meta cumprida', 'metas cumpridas') + '</p>';
    return panel('Metas por atributo', body, { accent: 'var(--glow)' });
  };
  AW.handlers['goal-attr'] = function (el) { goalDraft.attr = el.getAttribute('data-id'); goalDraft.level = 0; AW.render(); };
  AW.handlers['goal-lv'] = function (el) { goalDraft.level = Math.min(D.MAX_ATTRIBUTE_LEVEL || 50, Math.max(1, goalDraft.level + Number(el.getAttribute('data-id')))); AW.render(); };
  AW.handlers['goal-days'] = function (el) { goalDraft.days = Number(el.getAttribute('data-id')); AW.render(); };
  AW.handlers['goal-add'] = function () {
    var d = goalDraft;
    if (AW.apply(function (g) { return D.addGoal(g, { attribute: d.attr, targetLevel: d.level, days: d.days }); })) { goalDraft = { attr: null, level: 0, days: 0 }; AW.render(); toast('Meta criada'); }
  };
  AW.handlers['goal-del'] = function (el) { AW.apply(function (g) { return D.removeGoal(g, el.getAttribute('data-id')); }); };

  /* ------------------------------ revisão semanal ------------------------------ */
  var reviewWeek = null, reviewDraft = null;
  function weeksAvailable() {
    var out = [], thisWeek = D.weekKey(N()), start = D.parseDay(thisWeek);
    for (var i = 1; i <= 4; i++) out.push(D.dayKey(D.addDays(start, -7 * i)));
    return out;
  }
  function weekLabel(k) { var s = D.parseDay(k), e = D.addDays(s, 6); return AW.dm(s.toISOString()) + ' – ' + AW.dm(e.toISOString()); }
  AW.reviewBanner = function () {
    var due = D.reviewDue(G(), N());
    if (!due) return '';
    return panel('Revisão semanal', '<p style="margin:0 0 12px;color:var(--dim)">Sua semana de ' + weekLabel(due) + ' terminou. Dois minutos de revisão rendem 15 moedas.</p><a class="btn" style="text-decoration:none" href="#/review">Revisar a semana</a>', { accent: 'var(--gold)' });
  };
  function reviewView() {
    var g = G(), weeks = weeksAvailable(), due = D.reviewDue(g, N());
    if (!reviewWeek || weeks.indexOf(reviewWeek) < 0) { reviewWeek = due || weeks[0]; reviewDraft = null; }
    var done = (g.reviews || []).filter(function (r) { return r.weekKey === reviewWeek; })[0];
    if (!reviewDraft) reviewDraft = { wins: done ? done.wins : '', blocks: done ? done.blocks : '', adjust: done ? done.adjust : '' };
    var w = D.weekSummary(g, reviewWeek, N());
    var delta = w.prevXp > 0 ? Math.round((w.xp - w.prevXp) / w.prevXp * 100) : null;
    var maxA = Math.max.apply(null, [1].concat(D.ATTRIBUTE_IDS.map(function (id) { return w.attrXp[id]; })));
    var html = '<div class="between"><h1 class="screen-title">REVISÃO</h1><a class="close" href="#/" aria-label="Fechar" style="text-decoration:none">✕</a></div>' +
      '<div class="row">' + weeks.map(function (k) { var has = (g.reviews || []).some(function (r) { return r.weekKey === k; }); return chip((has ? '✓ ' : '') + weekLabel(k), reviewWeek === k, 'data-act="review-week" data-id="' + k + '"'); }).join('') + '</div>';
    html += panel('Resumo · ' + weekLabel(reviewWeek),
      '<div class="review-cmp"><div class="tile"><b>' + fmt(w.xp) + '</b><span>XP na semana' + (delta !== null ? ' (' + (delta >= 0 ? '+' : '') + delta + '% vs. anterior)' : '') + '</span></div>' +
      '<div class="tile"><b>' + w.activeDays + '/7</b><span>dias ativos' + (w.restDays ? ' · ' + pl(w.restDays, 'descanso', 'descansos') : '') + '</span></div>' +
      '<div class="tile"><b>' + w.missions + '</b><span>missões concluídas</span></div>' +
      (w.mood !== null ? '<div class="tile"><b>' + AW.MOODS[Math.max(0, Math.min(4, Math.round(w.mood) - 1))] + '</b><span>humor médio</span></div>' : '') + '</div>' +
      '<p class="label" style="margin-top:16px">XP POR ATRIBUTO</p><div class="stack" style="gap:8px">' + D.ATTRIBUTE_IDS.filter(function (id) { return w.attrXp[id] > 0; }).map(function (id) {
        var def = D.ATTRIBUTES[id]; return '<div><div class="xp-row"><span style="color:' + def.color + '">' + def.glyph + ' ' + esc(def.name) + '</span><span>+' + fmt(w.attrXp[id]) + '</span></div>' + bar(w.attrXp[id] / maxA, def.color, 5) + '</div>';
      }).join('') + (w.xp === 0 ? '<p class="dim" style="margin:0">Semana sem XP.</p>' : '') + '</div>' +
      '<p class="help" style="margin-top:14px">' + [
        w.bestDay ? 'Melhor dia: ' + AW.dm(D.parseDay(w.bestDay.day).toISOString()) + ' (' + fmt(w.bestDay.xp) + ' XP)' : '',
        w.boss ? 'Chefe ' + (w.boss.status === 'defeated' ? 'derrotado' : 'escapou') + ': ' + esc(w.boss.name.replace('Chefe: ', '')) : '',
        w.levelUps ? pl(w.levelUps, 'subida de nível', 'subidas de nível') : '',
        w.rankUps.length ? 'Novo rank: ' + w.rankUps.join(', ') : '',
        w.achievements.length ? pl(w.achievements.length, 'conquista', 'conquistas') : ''
      ].filter(Boolean).join(' · ') + '</p>');
    html += panel(done ? 'Sua revisão (editar)' : 'Sua revisão', '<p class="label">O QUE DEU CERTO</p><textarea id="rv-wins" class="input" maxlength="280" placeholder="Uma vitória da semana">' + esc(reviewDraft.wins) + '</textarea>' +
      '<p class="label" style="margin-top:14px">O QUE ATRAPALHOU</p><textarea id="rv-blocks" class="input" maxlength="280" placeholder="Obstáculos, distrações, imprevistos">' + esc(reviewDraft.blocks) + '</textarea>' +
      '<p class="label" style="margin-top:14px">O QUE AJUSTAR</p><textarea id="rv-adjust" class="input" maxlength="280" placeholder="Uma mudança para a próxima semana">' + esc(reviewDraft.adjust) + '</textarea>' +
      '<div style="margin-top:14px"><button class="btn" data-act="review-save">' + (done ? 'Atualizar revisão' : 'Salvar revisão (+15 moedas)') + '</button></div>', { accent: 'var(--gold)' });
    var past = (g.reviews || []).filter(function (r) { return r.weekKey !== reviewWeek; }).slice().reverse();
    if (past.length) html += panel('Revisões anteriores', past.map(function (r) {
      return '<div style="margin-bottom:12px"><div class="label">' + weekLabel(r.weekKey) + '</div>' + [['✓', r.wins], ['✕', r.blocks], ['→', r.adjust]].filter(function (x) { return x[1]; }).map(function (x) { return '<p class="rev-text">' + x[0] + ' ' + esc(x[1]) + '</p>'; }).join('') + '</div>';
    }).join(''));
    return html;
  }
  AW.views['#/review'] = reviewView;
  document.addEventListener('input', function (ev) {
    var id = ev.target && ev.target.id;
    if (reviewDraft && (id === 'rv-wins' || id === 'rv-blocks' || id === 'rv-adjust')) reviewDraft[id.slice(3)] = ev.target.value;
  });
  AW.handlers['review-week'] = function (el) { reviewWeek = el.getAttribute('data-id'); reviewDraft = null; AW.render(); };
  AW.handlers['review-save'] = function () {
    var wk = reviewWeek, d = { weekKey: wk, wins: val('rv-wins'), blocks: val('rv-blocks'), adjust: val('rv-adjust') };
    if (AW.apply(function (g) { return D.saveReview(g, d); })) { reviewDraft = null; toast('Revisão salva'); }
  };
})();
