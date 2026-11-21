/* Awakening — aba Treino: perfil corporal, treinos prontos, registro durante/depois, progresso e medidas.
   Os dados ficam em outra chave do localStorage (awakening-workout-v1) e entram no backup. */
(function () {
  'use strict';
  var AW = window.AW, T = window.Treinos;
  if (!AW || !T) return;
  var D = AW.D, esc = AW.esc, panel = AW.panel, bar = AW.bar, chip = AW.chip;
  var KEY = 'awakening-workout-v1';
  var $ = function (id) { return document.getElementById(id); };
  var val = function (id) { var el = $(id); return el ? el.value : ''; };
  var num = function (id) { var v = String(val(id)).replace(',', '.').trim(); return v === '' ? null : Number(v); };
  var fmt = function (n, d) { return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: d == null ? 1 : d }); };
  var pl = function (n, one, many) { return n + ' ' + (n === 1 ? one : many); };
  var uid = function () { return 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  var today = function () { return D.dayKey(new Date()); };
  function toast(msg, bad) { AW.showToast('<div class="t1"' + (bad ? ' style="color:var(--danger)"' : '') + '>' + esc(msg) + '</div>'); }

  /* ------------------------------ dados ------------------------------ */
  function blank() { return { v: 1, profile: null, body: [], logs: [], active: null, custom: [], plan: null, deload: null }; }
  function load() {
    try { var r = JSON.parse(localStorage.getItem(KEY)); if (r && r.v === 1) { r.body = r.body || []; r.logs = r.logs || []; r.custom = r.custom || []; r.plan = r.plan || null; r.deload = r.deload || null; return r; } } catch (e) {}
    return blank();
  }
  var W = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(W)); return true; } catch (e) { toast('Não consegui salvar os dados de treino (armazenamento cheio ou bloqueado).', true); return false; } }
  window.addEventListener('storage', function (e) { if (e.key === KEY) { W = load(); if (isRoute()) AW.render(); } });
  function isRoute() { return (location.hash || '#/').replace(/\/$/, '') === '#/workout'; }

  AW.workout = {
    export: function () { return JSON.parse(JSON.stringify(W)); },
    import: function (obj) {
      if (!obj || obj.v !== 1 || !Array.isArray(obj.logs)) return false;
      W = { v: 1, profile: obj.profile || null, body: obj.body || [], logs: obj.logs, active: null, custom: obj.custom || [], plan: obj.plan || null, deload: obj.deload || null }; save(); return true;
    }
  };

  /* ------------------------------ estado da interface ------------------------------ */
  var ui = { builder: null, planDay: null, cmp: [], rm: null, bar: 20, plate: null, imc: null, tab: 'inicio', group: 'peito-triceps', place: null, level: null, exSel: null, doneId: null, confirm: null, pf: null, bodyOpen: false, histOpen: null, wipe: false };
  var wl = null; // wake lock
  function lockOn() { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { wl = l; }, function () {}); } catch (e) {} }
  function lockOff() { try { if (wl) wl.release(); } catch (e) {} wl = null; }

  /* ------------------------------ cálculos ------------------------------ */
  function weightNow() {
    var w = W.body.filter(function (b) { return b.kg; }).sort(function (a, b) { return a.d < b.d ? -1 : 1; });
    return w.length ? w[w.length - 1].kg : (W.profile ? W.profile.kg : null);
  }
  function bmi(kg, cm) { return kg && cm ? kg / Math.pow(cm / 100, 2) : null; }
  function bmiCat(v) { return v < 18.5 ? 'abaixo do peso' : v < 25 ? 'peso normal' : v < 30 ? 'sobrepeso' : 'obesidade'; }
  function e1rm(kg, reps) { return kg > 0 && reps > 0 ? kg * (1 + reps / 30) : 0; }
  function kcal(met, kg, mins) { return Math.round(met * (kg || 70) * (mins / 60)); }
  function fmtClock(ms) { var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); s = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function weekStart(d) { return D.parseDay(D.weekKey(d)); }
  function logsIn(fromKey, toKey) { return W.logs.filter(function (l) { return l.day >= fromKey && (!toKey || l.day <= toKey); }); }
  function lastSet(exId) {
    for (var i = W.logs.length - 1; i >= 0; i--) {
      var ex = (W.logs[i].ex || []).filter(function (e) { return e.id === exId; })[0];
      if (ex && ex.sets.length) { var s = ex.sets[ex.sets.length - 1]; return { kg: s.kg, reps: s.reps, day: W.logs[i].day }; }
    }
    return null;
  }
  function bestBefore(exId, excludeId) {
    var kg = 0, rm = 0, had = false;
    W.logs.forEach(function (l) {
      if (l.id === excludeId) return;
      (l.ex || []).forEach(function (e) { if (e.id !== exId) return; had = true; e.sets.forEach(function (s) { kg = Math.max(kg, s.kg || 0); rm = Math.max(rm, e1rm(s.kg, s.reps)); }); });
    });
    return { kg: kg, rm: rm, had: had };
  }
  function planFor(p) {
    var d = Math.max(2, Math.min(6, p.days || 3)), by = {
      2: ['corpo', 'corpo'], 3: ['peito-triceps', 'costas-biceps', 'pernas'], 4: ['peito-triceps', 'costas-biceps', 'pernas', 'ombros'],
      5: ['peito-triceps', 'costas-biceps', 'pernas', 'ombros', 'cardio'], 6: ['peito-triceps', 'costas-biceps', 'pernas', 'ombros', 'bracos', 'cardio']
    }, list = by[d].slice();
    if (p.goal === 'emagrecer' && d >= 3) list[list.length - 1] = 'cardio';
    if (p.goal === 'condicionamento' && d >= 3) list[1] = 'cardio';
    return list;
  }
  function suggestion(p) {
    var plan = planFor(p), done = logsIn(D.weekKey(new Date())).length;
    var g = plan[done % plan.length];
    return g === 'cardio' ? T.cardio(T.cardioList(p.place)[(done + 1) % T.cardioList(p.place).length].id, p.level) : T.build(g, p.place, p.level, p.goal === 'forca' ? 'forca' : p.goal === 'emagrecer' ? 'resist' : 'hiper');
  }
  function customWorkout(c) {
    var exs = c.exs.map(function (e) { return { id: e.id, name: e.name, cue: e.cue || '', timed: !!e.timed, iso: !!e.iso, sets: e.sets, reps: e.timed ? null : e.reps, secs: e.timed ? e.secs : null, rest: e.rest }; });
    var sec = 5 * 60; exs.forEach(function (e) { sec += e.sets * ((e.timed ? e.secs : 40) + e.rest); });
    return { key: 'custom.' + c.id, name: c.name, group: 'custom', place: c.place, level: W.profile ? W.profile.level : 0, style: 'custom', kind: 'strength', exs: exs, met: 5, mins: Math.max(10, Math.round(sec / 60 / 5) * 5) };
  }
  function find(key) {
    var s = String(key).split('.');
    if (s[0] === 'custom') { var c = W.custom.filter(function (x) { return x.id === s[1]; })[0]; return c ? customWorkout(c) : null; }
    if (s[0] === 'cardio') return T.cardio(s[1], Number(s[2]));
    return T.build(s[0], s[1], Number(s[2]), s[3]);
  }

  /* ------------------------------ gráficos ------------------------------ */
  function lineChart(pts, unit, h) {
    if (pts.length < 2) return '<p class="help">Registre pelo menos duas vezes para ver o gráfico.</p>';
    var W0 = 320, H = h || 130, pad = 28, xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if (y1 === y0) { y1 += 1; y0 -= 1; }
    var px = function (x) { return pad + (x1 === x0 ? 0 : (x - x0) / (x1 - x0)) * (W0 - pad - 8); }, py = function (y) { return H - 20 - (y - y0) / (y1 - y0) * (H - 34); };
    var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + px(p.x).toFixed(1) + ' ' + py(p.y).toFixed(1); }).join(' ');
    var last = pts[pts.length - 1];
    return '<svg class="wk-chart" viewBox="0 0 ' + W0 + ' ' + H + '" role="img" aria-label="Gráfico de evolução"><path d="' + path + '" fill="none" style="stroke:var(--accent)" stroke-width="2.2" stroke-linejoin="round"/>' +
      pts.map(function (p) { return '<circle cx="' + px(p.x).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="3" style="fill:var(--accent)"/>'; }).join('') +
      '<text x="2" y="' + (py(y1) + 4) + '" class="wk-ax">' + fmt(y1) + '</text><text x="2" y="' + (py(y0) + 4) + '" class="wk-ax">' + fmt(y0) + '</text>' +
      '<text x="' + pad + '" y="' + (H - 4) + '" class="wk-ax">' + esc(pts[0].l) + '</text><text x="' + (W0 - 8) + '" y="' + (H - 4) + '" text-anchor="end" class="wk-ax">' + esc(last.l) + '</text>' +
      '<text x="' + Math.min(W0 - 8, px(last.x)) + '" y="' + (py(last.y) - 8) + '" text-anchor="end" class="wk-ax wk-last">' + fmt(last.y) + (unit || '') + '</text></svg>';
  }
  function dmk(k) { var p = k.split('-'); return p[2] + '/' + p[1]; }
  function dayNum(k) { return Math.round(D.parseDay(k).getTime() / 86400000); }

  /* ------------------------------ perfil ------------------------------ */
  function pfDraft() {
    if (!ui.pf) { var p = W.profile || {}; ui.pf = { sex: p.sex || '', goal: p.goal || 'hiper', level: p.level != null ? p.level : 0, place: p.place || 'gym', days: p.days || 3 }; }
    return ui.pf;
  }
  function profileForm(edit) {
    var d = pfDraft(), p = W.profile || {};
    var goals = [['hiper', 'Ganhar massa'], ['emagrecer', 'Emagrecer'], ['forca', 'Ficar mais forte'], ['condicionamento', 'Condicionamento']];
    return panel(edit ? 'Seu perfil' : 'Vamos começar', (edit ? '' : '<p style="margin:0 0 14px;color:var(--dim)">Conte um pouco sobre você. Isso monta seus treinos, calcula gasto calórico e guarda sua evolução. Os dados ficam só neste navegador.</p>') +
      '<div class="wk-grid"><div><p class="label">PESO (KG)</p><input id="pf-kg" class="input" type="number" inputmode="decimal" step="0.1" min="25" max="300" value="' + (p.kg || (weightNow() || '')) + '" placeholder="70"></div>' +
      '<div><p class="label">ALTURA (CM)</p><input id="pf-cm" class="input" type="number" inputmode="numeric" min="100" max="250" value="' + (p.cm || '') + '" placeholder="175"></div>' +
      '<div><p class="label">IDADE (OPCIONAL)</p><input id="pf-age" class="input" type="number" inputmode="numeric" min="10" max="100" value="' + (p.age || '') + '" placeholder="25"></div>' +
      '<div><p class="label">META DE PESO (OPCIONAL)</p><input id="pf-goalkg" class="input" type="number" inputmode="decimal" step="0.1" value="' + (p.goalKg || '') + '" placeholder="—"></div></div>' +
      '<p class="label" style="margin-top:14px">SEXO (PARA ESTIMAR O GASTO BASAL)</p><div class="row">' + [['m', 'Masculino'], ['f', 'Feminino'], ['', 'Prefiro não informar']].map(function (o) { return chip(o[1], d.sex === o[0], 'data-act="pf-set" data-k="sex" data-id="' + o[0] + '"'); }).join('') + '</div>' +
      '<p class="label" style="margin-top:14px">OBJETIVO</p><div class="row">' + goals.map(function (o) { return chip(o[1], d.goal === o[0], 'data-act="pf-set" data-k="goal" data-id="' + o[0] + '"'); }).join('') + '</div>' +
      '<p class="label" style="margin-top:14px">SEU NÍVEL</p><div class="row">' + T.LEVELS.map(function (n, i) { return chip(n, d.level === i, 'data-act="pf-set" data-k="level" data-id="' + i + '"'); }).join('') + '</div>' +
      '<p class="label" style="margin-top:14px">ONDE VOCÊ TREINA</p><div class="row">' + [['gym', 'Academia'], ['home', 'Em casa']].map(function (o) { return chip(o[1], d.place === o[0], 'data-act="pf-set" data-k="place" data-id="' + o[0] + '"'); }).join('') + '</div>' +
      '<p class="label" style="margin-top:14px">DIAS DE TREINO POR SEMANA</p><div class="row">' + [2, 3, 4, 5, 6].map(function (n) { return chip(String(n), d.days === n, 'data-act="pf-set" data-k="days" data-id="' + n + '"'); }).join('') + '</div>' +
      '<p class="help">Em dúvida sobre seu nível? Se treina há menos de 6 meses, escolha Iniciante. Se tem dor, lesão ou condição de saúde, converse com um profissional antes de treinar. O app não substitui orientação médica ou de um educador físico.</p>' +
      '<div style="margin-top:14px"><button class="btn" data-act="pf-save">' + (edit ? 'Salvar perfil' : 'Começar a treinar') + '</button>' + (edit ? '<button class="btn ghost" data-act="pf-cancel" style="margin-top:8px">Cancelar</button>' : '') + '</div>');
  }
  AW.handlers['pf-set'] = function (el) {
    var k = el.getAttribute('data-k'), v = el.getAttribute('data-id'); pfDraft()[k] = (k === 'level' || k === 'days') ? Number(v) : v;
    // preserva o que foi digitado
    ['kg', 'cm', 'age', 'goalkg'].forEach(function (f) { var x = $('pf-' + f); if (x) ui.pf['v_' + f] = x.value; });
    AW.render();
    ['kg', 'cm', 'age', 'goalkg'].forEach(function (f) { var x = $('pf-' + f); if (x && ui.pf['v_' + f] != null) x.value = ui.pf['v_' + f]; });
  };
  AW.handlers['pf-cancel'] = function () { ui.pf = null; ui.bodyOpen = false; AW.render(); };
  AW.handlers['pf-save'] = function () {
    var d = pfDraft(), kg = num('pf-kg'), cm = num('pf-cm'), age = num('pf-age'), gk = num('pf-goalkg');
    if (!kg || kg < 25 || kg > 300) return toast('Informe um peso entre 25 e 300 kg.', true);
    if (!cm || cm < 100 || cm > 250) return toast('Informe uma altura entre 100 e 250 cm.', true);
    if (age != null && (age < 10 || age > 100)) return toast('Idade inválida.', true);
    W.profile = { kg: kg, cm: cm, age: age || null, goalKg: gk || null, sex: d.sex, goal: d.goal, level: d.level, place: d.place, days: d.days, since: (W.profile && W.profile.since) || today() };
    setBody({ d: today(), kg: kg });
    ui.pf = null; ui.bodyOpen = false; ui.place = null; ui.level = null; save(); toast('Perfil salvo'); AW.render();
  };
  function setBody(entry) { // um registro por dia; campos novos substituem os antigos
    var cur = W.body.filter(function (b) { return b.d === entry.d; })[0];
    if (cur) { Object.keys(entry).forEach(function (k) { if (entry[k] != null) cur[k] = entry[k]; }); } else W.body.push(entry);
    W.body.sort(function (a, b) { return a.d < b.d ? -1 : 1; });
  }

  /* ------------------------------ sessão ------------------------------ */
  function repRange(r) { var m = String(r).match(/\d+/g) || ['10']; return [Number(m[0]), Number(m[m.length - 1])]; }
  function r05(x) { return Math.round(x * 2) / 2; }
  function progression(def) {
    if (def.timed || !def.reps) return null;
    var h = W.logs.filter(function (l) { return (l.ex || []).some(function (e) { return e.id === def.id; }); }).slice(-2).map(function (l) { return l.ex.filter(function (e) { return e.id === def.id; })[0]; });
    if (!h.length) return null;
    var rr = repRange(def.reps), last = h[h.length - 1], kg = Math.max.apply(null, last.sets.map(function (s) { return s.kg || 0; }));
    if (!(kg > 0)) return null;
    var top = last.sets.length >= Math.min(def.sets, 2) && last.sets.every(function (s) { return s.reps >= rr[1] && (s.kg || 0) >= kg * 0.97; });
    if (top) { var inc = def.iso ? (kg < 20 ? 1 : 2) : (kg < 40 ? 2.5 : 5); return { kg: r05(kg + inc), dir: 'up', why: 'Você fez todas as séries com ' + rr[1] + ' ou mais repetições a ' + fmt(kg) + ' kg. Hora de subir a carga.' }; }
    if (h.length === 2 && h.every(function (s) { return s.sets.some(function (x) { return x.reps < rr[0]; }); })) return { kg: r05(kg * 0.9), dir: 'down', why: 'Nas duas últimas vezes você ficou abaixo de ' + rr[0] + ' repetições. Reduzir ~10% ajuda a recuperar a técnica.' };
    return { kg: kg, dir: 'keep', why: 'Mantenha ' + fmt(kg) + ' kg até chegar a ' + rr[1] + ' repetições em todas as séries.' };
  }
  function startWorkout(w, opts) {
    w = JSON.parse(JSON.stringify(w));
    var dl = W.deload === D.weekKey(new Date());
    if (dl) w.exs.forEach(function (e) { e.sets = Math.max(2, e.sets - 1); });
    var A = { key: w.key, w: w, startedAt: Date.now(), stage: 'pre', pre: { energy: null, sleep: null }, post: { rpe: null, mood: null }, restEnd: 0, restTotal: 0, warm: false, ex: [] };
    A.ex = w.exs.map(function (e) {
      var ls = lastSet(e.id), target = e.timed ? e.secs : T.parseLow(e.reps), sets = [];
      var pg = progression(e); if (pg && dl) { pg = { kg: r05(pg.kg * 0.85), dir: 'down', why: 'Semana leve: carga reduzida em ~15% e uma série a menos por exercício.' }; }
      for (var i = 0; i < e.sets; i++) sets.push({ kg: pg ? pg.kg : (ls && !e.timed ? ls.kg : null), reps: e.timed ? e.secs : (ls && ls.reps ? Math.min(ls.reps, 99) : target), done: false });
      return { id: e.id, sets: sets, last: ls, prog: pg };
    });
    W.active = A; save(); lockOn(); ui.doneId = null; AW.render(); window.scrollTo(0, 0);
  }
  AW.handlers['wk-start'] = function (el) { var w = find(el.getAttribute('data-id')); if (w) startWorkout(w); };
  AW.handlers['wk-pre'] = function (el) { var A = W.active; if (!A) return; A.pre[el.getAttribute('data-k')] = Number(el.getAttribute('data-id')); save(); AW.render(); };
  AW.handlers['wk-go'] = function () { var A = W.active; if (!A) return; A.stage = 'run'; A.startedAt = Date.now(); save(); AW.render(); };
  AW.handlers['wk-warm'] = function () { var A = W.active; if (!A) return; A.warm = !A.warm; save(); AW.render(); };
  AW.handlers['wk-set'] = function (el) {
    var A = W.active; if (!A) return; var p = el.getAttribute('data-id').split(':'), i = +p[0], j = +p[1], s = A.ex[i].sets[j], ex = A.w.exs[i];
    s.done = !s.done;
    if (s.done) {
      if (!s.reps) s.reps = ex.timed ? ex.secs : T.parseLow(ex.reps);
      var more = A.ex.some(function (x, xi) { return x.sets.some(function (q) { return !q.done; }); });
      if (more && ex.rest) { A.restEnd = Date.now() + ex.rest * 1000; A.restTotal = ex.rest; } else { A.restEnd = 0; A.restTotal = 0; }
    }
    save(); AW.render();
  };
  AW.handlers['wk-addset'] = function (el) {
    var A = W.active; if (!A) return; var i = +el.getAttribute('data-id'), L = A.ex[i].sets, prev = L[L.length - 1] || { kg: null, reps: 10 };
    L.push({ kg: prev.kg, reps: prev.reps, done: false }); save(); AW.render();
  };
  AW.handlers['wk-delset'] = function (el) { var A = W.active; if (!A) return; var L = A.ex[+el.getAttribute('data-id')].sets; if (L.length > 1) L.pop(); save(); AW.render(); };
  AW.handlers['wk-rest-skip'] = function () { var A = W.active; if (!A) return; A.restEnd = 0; A.restTotal = 0; save(); AW.render(); };
  AW.handlers['wk-rest-add'] = function () { var A = W.active; if (!A || !A.restEnd) return; A.restEnd += 15000; A.restTotal += 15; save(); };
  AW.handlers['wk-cancel'] = function () {
    if (ui.confirm !== 'cancel') { ui.confirm = 'cancel'; AW.render(); return; }
    ui.confirm = null; W.active = null; gpsOff(); lockOff(); save(); AW.render();
  };
  AW.handlers['wk-finish'] = function () {
    var A = W.active; if (!A) return;
    if (A.w.kind !== 'cardio' && A.ex.every(function (e) { return e.sets.every(function (s) { return !s.done; }); })) return toast('Marque pelo menos uma série como feita.', true);
    A.stage = 'post'; A.mins = Math.max(1, Math.round((Date.now() - A.startedAt) / 60000)); A.restEnd = 0; A.restTotal = 0; save(); AW.render(); window.scrollTo(0, 0);
  };
  AW.handlers['wk-post'] = function (el) { var A = W.active; if (!A) return; A.post[el.getAttribute('data-k')] = Number(el.getAttribute('data-id')); keepPostFields(); save(); AW.render(); restorePostFields(); };
  var postVals = {};
  function keepPostFields() { ['wk-mins', 'wk-dist', 'wk-hr', 'wk-bw', 'wk-note'].forEach(function (id) { if ($(id)) postVals[id] = val(id); }); }
  function restorePostFields() { Object.keys(postVals).forEach(function (id) { if ($(id)) $(id).value = postVals[id]; }); }
  AW.handlers['wk-back'] = function () { var A = W.active; if (!A) return; keepPostFields(); A.stage = 'run'; save(); AW.render(); };
  AW.handlers['wk-save'] = function () {
    var A = W.active; if (!A) return; var w = A.w, mins = num('wk-mins');
    if (!mins || mins < 1 || mins > 600) return toast('Informe a duração em minutos (1 a 600).', true);
    var bw = num('wk-bw'); if (bw != null && (bw < 25 || bw > 300)) return toast('Peso inválido.', true);
    var dist = num('wk-dist'), hr = num('wk-hr'); if (hr != null && (hr < 30 || hr > 230)) return toast('Frequência cardíaca inválida.', true);
    var ex = [], volume = 0, reps = 0, prs = [], logId = uid();
    A.ex.forEach(function (e, i) {
      var def = w.exs[i], sets = e.sets.filter(function (s) { return s.done; }).map(function (s) { return { kg: Number(s.kg) || 0, reps: Number(s.reps) || 0 }; });
      if (!sets.length) return;
      var b = bestBefore(def.id, logId), mk = 0, mr = 0;
      sets.forEach(function (s) { volume += s.kg * s.reps; reps += s.reps; mk = Math.max(mk, s.kg); mr = Math.max(mr, e1rm(s.kg, s.reps)); });
      if (!def.timed && b.had) { if (mk > b.kg && mk > 0) prs.push({ name: def.name, t: 'carga', v: mk }); else if (mr > b.rm * 1.005 && b.rm > 0) prs.push({ name: def.name, t: '1RM estimado', v: Math.round(mr * 10) / 10 }); }
      ex.push({ id: def.id, name: def.name, timed: !!def.timed, sets: sets });
    });
    var kg = bw || weightNow();
    var log = { id: logId, at: new Date().toISOString(), day: today(), key: w.key, name: w.name, group: w.group, place: w.place, level: w.level, style: w.style, kind: w.kind,
      mins: Math.round(mins), kcal: kcal(w.met, kg, mins), rpe: A.post.rpe, mood: A.post.mood, pre: A.pre, ex: ex, volume: Math.round(volume), reps: reps, dist: dist || null, hr: hr || null, bw: bw || null, note: val('wk-note').trim().slice(0, 400), prs: prs };
    W.logs.push(log);
    if (bw) setBody({ d: log.day, kg: bw });
    W.active = null; ui.doneId = logId; postVals = {}; gpsOff(); lockOff(); save();
    /* v0.5.4: o treino vira XP, conclui a missão de treino e fere o chefe */
    var lifts = {};
    ex.forEach(function (e) { var k = D.liftKey && D.liftKey(e.name); if (!k) return; var mk = 0; e.sets.forEach(function (s) { mk = Math.max(mk, s.kg || 0); }); if (mk > (lifts[k] || 0)) lifts[k] = mk; });
    var wtype = w.kind === 'cardio' ? 'cardio' : w.group === 'mobilidade' ? 'mobility' : 'strength';
    try { AW.apply(function (g) { return D.completeWorkout(g, { id: logId, name: w.name, type: wtype, mins: log.mins, volume: log.volume, prs: prs.length, lifts: lifts }, new Date()); }, true); } catch (err) {}
    AW.render(); window.scrollTo(0, 0);
  };

  /* tique: relógio e descanso sem redesenhar a tela */
  var beeped = false;
  function beep() {
    try { var C = window.AudioContext || window.webkitAudioContext, c = new C(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.value = 0.15; o.start(); o.stop(c.currentTime + 0.25); setTimeout(function () { c.close(); }, 600); } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
  }
  setInterval(function () {
    var A = W.active; if (!A || !isRoute()) return;
    var c = $('wk-clock'); if (c) c.textContent = fmtClock(Date.now() - A.startedAt);
    var gd = $('wk-gps-d'); if (gd && A.gps) {
      gd.textContent = fmt(A.gps.m / 1000, 2) + ' km';
      var gp = $('wk-gps-p'); if (gp) gp.textContent = A.gps.m >= 100 ? fmtClock((Date.now() - A.startedAt) / (A.gps.m / 1000)) + ' /km' : '—';
    }
    var r = $('wk-rest'); if (!r) return;
    var left = A.restEnd - Date.now();
    if (A.restEnd && left > 0) {
      r.classList.remove('done'); $('wk-rest-t').textContent = fmtClock(left); $('wk-rest-b').style.width = Math.max(0, Math.min(100, left / (A.restTotal * 1000) * 100)) + '%'; beeped = false;
    } else if (A.restEnd) {
      $('wk-rest-t').textContent = 'Pronto!'; r.classList.add('done'); $('wk-rest-b').style.width = '0%';
      if (!beeped) { beeped = true; beep(); }
    }
  }, 400);

  /* ------------------------------ GPS ------------------------------ */
  var gpsWatch = null;
  function hav(a, b, c, d) { var R = 6371000, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r, h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) * Math.sin(y / 2); return 2 * R * Math.asin(Math.sqrt(h)); }
  function onPos(p) {
    var A = W.active; if (!A || !A.gps || !A.gps.on) return; var c = p.coords; if (c.accuracy > 40) return;
    var t = p.timestamp || Date.now(), L = A.gps.last;
    if (!L) { A.gps.last = { lat: c.latitude, lon: c.longitude, t: t }; return; }
    var d = hav(L.lat, L.lon, c.latitude, c.longitude), dt = Math.max(0.5, (t - L.t) / 1000);
    if (d < 3) return;
    if (d / dt < 12) A.gps.m += d; // ignora saltos impossíveis (>43 km/h)
    A.gps.last = { lat: c.latitude, lon: c.longitude, t: t }; save();
  }
  function gpsOn() {
    var A = W.active; if (!A) return;
    if (!navigator.geolocation) return toast('Este navegador não oferece GPS.', true);
    if (gpsWatch != null) navigator.geolocation.clearWatch(gpsWatch);
    A.gps = A.gps || { m: 0, last: null }; A.gps.on = true; A.gps.last = null;
    gpsWatch = navigator.geolocation.watchPosition(onPos, function (err) { if (err && err.code === 1) { toast('Não consegui usar a localização: permissão negada.', true); gpsOff(); AW.render(); } /* sinal fraco ou timeout: continua tentando */ }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 30000 });
    save(); AW.render();
  }
  function gpsOff() { try { if (gpsWatch != null) navigator.geolocation.clearWatch(gpsWatch); } catch (e) {} gpsWatch = null; if (W.active && W.active.gps) { W.active.gps.on = false; W.active.gps.last = null; save(); } }
  AW.handlers['gps-on'] = gpsOn;
  AW.handlers['gps-off'] = function () { gpsOff(); AW.render(); };
  function gpsPanel(A) {
    var g = A.gps || { m: 0 }, live = gpsWatch != null;
    return panel('GPS · distância e ritmo', '<div class="wk-tiles"><div class="tile"><b id="wk-gps-d">' + fmt(g.m / 1000, 2) + ' km</b><span>distância</span></div><div class="tile"><b id="wk-gps-p">—</b><span>ritmo médio</span></div></div>' +
      '<div style="margin-top:10px">' + (live ? '<button class="btn ghost" data-act="gps-off">Pausar GPS</button>' : '<button class="btn" data-act="gps-on">' + (g.m > 0 ? 'Retomar GPS' : 'Ativar GPS') + '</button>') + '</div>' +
      '<p class="help">Use ao ar livre e mantenha esta tela aberta: navegadores costumam pausar o GPS com a tela bloqueada. A distância é uma estimativa e você pode corrigi-la ao salvar.</p>');
  }

  function exCard(A, i) {
    var def = A.w.exs[i], st = A.ex[i], doneN = st.sets.filter(function (s) { return s.done; }).length;
    var scheme = def.timed ? def.sets + ' × ' + def.secs + ' s' : def.sets + ' × ' + def.reps;
    var last = st.last ? 'Última vez: ' + (st.last.kg ? fmt(st.last.kg) + ' kg × ' : '') + st.last.reps + (def.timed ? ' s' : ' reps') : 'Primeira vez neste exercício';
    return '<div class="wk-ex' + (doneN === st.sets.length ? ' all' : '') + '"><div class="wk-exh"><div><b>' + esc(def.name) + '</b><div class="wk-sub">' + scheme + ' · descanso ' + def.rest + ' s</div></div><span class="wk-cnt">' + doneN + '/' + st.sets.length + '</span></div>' +
      '<div class="wk-cue">' + esc(def.cue) + '</div><div class="wk-sub">' + esc(last) + '</div>' +
      (st.prog ? '<div class="wk-prog ' + st.prog.dir + '">' + (st.prog.dir === 'up' ? '↑ ' : st.prog.dir === 'down' ? '↓ ' : '＝ ') + 'Sugestão: ' + fmt(st.prog.kg) + ' kg. ' + esc(st.prog.why) + '</div>' : '') +
      st.sets.map(function (s, j) {
        return '<div class="wk-set' + (s.done ? ' done' : '') + '"><span class="wk-n">' + (j + 1) + '</span>' +
          (def.timed ? '' : '<input class="input" type="number" inputmode="decimal" step="0.5" min="0" data-wk="kg" data-i="' + i + '" data-j="' + j + '" value="' + (s.kg == null ? '' : s.kg) + '" placeholder="kg" aria-label="Carga em kg, série ' + (j + 1) + '"><span class="wk-u">kg</span>') +
          '<input class="input" type="number" inputmode="numeric" min="0" data-wk="reps" data-i="' + i + '" data-j="' + j + '" value="' + (s.reps == null ? '' : s.reps) + '" aria-label="' + (def.timed ? 'Segundos' : 'Repetições') + ', série ' + (j + 1) + '"><span class="wk-u">' + (def.timed ? 's' : 'reps') + '</span>' +
          '<button type="button" class="wk-ok' + (s.done ? ' on' : '') + '" data-act="wk-set" data-id="' + i + ':' + j + '" aria-label="Marcar série ' + (j + 1) + '" aria-pressed="' + (s.done ? 'true' : 'false') + '">✓</button></div>';
      }).join('') +
      '<div class="wk-tools"><button type="button" class="mini" data-act="wk-addset" data-id="' + i + '">+ série</button>' + (st.sets.length > 1 ? '<button type="button" class="mini" data-act="wk-delset" data-id="' + i + '">− série</button>' : '') + '</div></div>';
  }
  function scale(key, labels, cur) {
    return '<div class="row">' + labels.map(function (l, i) { return chip(l, cur === i + 1, 'data-act="' + key.act + '" data-k="' + key.k + '" data-id="' + (i + 1) + '"'); }).join('') + '</div>';
  }
  var ENERGY = ['Péssima', 'Baixa', 'Normal', 'Boa', 'Ótima'];
  function sessionView() {
    var A = W.active, w = A.w, html = '<div class="between"><h1 class="screen-title">TREINO</h1><span class="wk-clock" id="wk-clock">' + fmtClock(Date.now() - A.startedAt) + '</span></div>';
    html += '<p class="wk-name">' + esc(w.name) + ' <span>· ' + T.LEVELS[w.level] + ' · ' + T.PLACES[w.place] + '</span></p>';
    if (A.stage === 'pre') {
      html += panel('Antes de começar', '<p class="label">COMO ESTÁ SUA ENERGIA HOJE?</p>' + scale({ act: 'wk-pre', k: 'energy' }, ENERGY, A.pre.energy) +
        '<p class="label" style="margin-top:14px">HORAS DE SONO NA NOITE PASSADA</p><div class="row">' + [4, 5, 6, 7, 8, 9].map(function (h) { return chip(h === 9 ? '9+' : String(h), A.pre.sleep === h, 'data-act="wk-pre" data-k="sleep" data-id="' + h + '"'); }).join('') + '</div>' +
        '<p class="help">Opcional, mas ajuda a entender como sono e energia afetam seu desempenho.</p>' +
        '<div style="margin-top:14px"><button class="btn" data-act="wk-go">Começar treino</button></div>');
      html += panel('Resumo do treino', summaryList(w));
      html += '<button class="btn ghost" data-act="wk-cancel">' + (ui.confirm === 'cancel' ? 'Confirmar: descartar treino' : 'Descartar') + '</button>';
      return html;
    }
    if (A.stage === 'post') return html + postForm(A);
    var warm = '<button type="button" class="wk-warm' + (A.warm ? ' on' : '') + '" data-act="wk-warm"><i>' + (A.warm ? '✓' : '') + '</i><span>' + esc(T.WARMUP) + '</span></button>';
    if (w.kind === 'cardio' && w.dist) html += gpsPanel(A);
    if (w.kind === 'cardio') {
      var pct = Math.min(1, (Date.now() - A.startedAt) / (w.mins * 60000));
      html += warm + panel(w.tag + ' · meta de ' + w.mins + ' min', '<p style="margin:0 0 12px">' + esc(w.how) + '</p>' + bar(pct, 'var(--accent)', 8) + '<p class="help">O cronômetro roda sozinho. Ao terminar, toque em Finalizar para registrar distância, frequência cardíaca e como se sentiu.</p>');
    } else {
      html += warm + A.w.exs.map(function (e, i) { return exCard(A, i); }).join('') + '<p class="help">' + esc(T.LEVEL_TIPS[w.level]) + ' ' + esc(T.COOLDOWN) + '</p>';
    }
    html += '<div class="wk-fin"><button class="btn" data-act="wk-finish">Finalizar treino</button><button class="btn ghost" data-act="wk-cancel" style="margin-top:8px">' + (ui.confirm === 'cancel' ? 'Confirmar: descartar treino' : 'Descartar') + '</button></div>';
    if (A.restTotal) html += '<div id="wk-rest" class="wk-rest"><div class="wk-rb"><i id="wk-rest-b"></i></div><div class="wk-rr"><span>Descanso</span><b id="wk-rest-t">' + fmtClock(A.restEnd - Date.now()) + '</b><button type="button" class="mini" data-act="wk-rest-add">+15 s</button><button type="button" class="mini" data-act="wk-rest-skip">Pular</button></div></div>';
    return html;
  }
  function summaryList(w) {
    if (w.kind === 'cardio') return '<p style="margin:0">' + esc(w.how) + '</p><p class="help">' + w.mins + ' min · ' + esc(w.tag) + '</p>';
    return '<div class="wk-list">' + w.exs.map(function (e) { return '<div><b>' + esc(e.name) + '</b><span>' + (e.timed ? e.sets + ' × ' + e.secs + ' s' : e.sets + ' × ' + e.reps) + '</span></div>'; }).join('') + '</div><p class="help">~' + w.mins + ' min</p>';
  }
  function postForm(A) {
    var w = A.w, bwTip = weightNow();
    return panel('Como foi?', '<p class="label">ESFORÇO PERCEBIDO (1 = LEVE, 10 = MÁXIMO)</p><div class="row">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return chip(String(n), A.post.rpe === n, 'data-act="wk-post" data-k="rpe" data-id="' + n + '"'); }).join('') + '</div>' +
      '<p class="label" style="margin-top:14px">COMO VOCÊ SE SENTE AGORA?</p>' + scale({ act: 'wk-post', k: 'mood' }, ENERGY, A.post.mood) +
      '<div class="wk-grid" style="margin-top:14px"><div><p class="label">DURAÇÃO (MIN)</p><input id="wk-mins" class="input" type="number" inputmode="numeric" min="1" max="600" value="' + (postVals['wk-mins'] != null ? postVals['wk-mins'] : A.mins) + '"></div>' +
      '<div><p class="label">PESO HOJE (KG)</p><input id="wk-bw" class="input" type="number" inputmode="decimal" step="0.1" placeholder="' + (bwTip ? fmt(bwTip) : 'opcional') + '"></div>' +
      (w.kind === 'cardio' || w.kind === 'mobility' ? '' : '') +
      (w.dist ? '<div><p class="label">DISTÂNCIA (KM)</p><input id="wk-dist" class="input" type="number" inputmode="decimal" step="0.01" placeholder="opcional" value="' + (postVals['wk-dist'] != null ? postVals['wk-dist'] : (A.gps && A.gps.m > 50 ? (A.gps.m / 1000).toFixed(2) : '')) + '"></div>' : '') +
      '<div><p class="label">FC MÉDIA (BPM)</p><input id="wk-hr" class="input" type="number" inputmode="numeric" placeholder="opcional"></div></div>' +
      '<p class="label" style="margin-top:14px">ANOTAÇÕES</p><textarea id="wk-note" class="input" maxlength="400" placeholder="Dores, cargas que subiram, sensações…"></textarea>' +
      '<div style="margin-top:14px"><button class="btn" data-act="wk-save">Salvar treino</button><button class="btn ghost" data-act="wk-back" style="margin-top:8px">Voltar ao treino</button></div>');
  }
  document.addEventListener('input', function (ev) {
    var t = ev.target, A = W.active; if (!t || !t.getAttribute || !A) return;
    var k = t.getAttribute('data-wk'); if (!k) return;
    var s = A.ex[+t.getAttribute('data-i')].sets[+t.getAttribute('data-j')]; if (!s) return;
    var v = String(t.value).replace(',', '.'); s[k] = v === '' ? null : Math.max(0, Number(v)); if (isNaN(s[k])) s[k] = null; save();
  });

  /* ------------------------------ telas ------------------------------ */
  function doneView() {
    var l = W.logs.filter(function (x) { return x.id === ui.doneId; })[0];
    if (!l) { ui.doneId = null; return null; }
    var prev = W.logs.filter(function (x) { return x.key === l.key && x.id !== l.id && x.at < l.at; }).pop(), dv = prev && prev.volume ? Math.round((l.volume - prev.volume) / prev.volume * 100) : null;
    var html = '<div class="between"><h1 class="screen-title">TREINO</h1></div>' + panel('Treino concluído', '<p class="wk-name" style="margin:0 0 12px">' + esc(l.name) + '</p><div class="wk-tiles">' +
      tile(l.mins, 'minutos') + (l.kcal ? tile('~' + l.kcal, 'kcal estimadas') : '') + (l.volume ? tile(fmt(l.volume, 0), 'kg de volume') : tile(l.reps || '—', 'repetições')) + (l.rpe ? tile(l.rpe + '/10', 'esforço') : '') + '</div>' +
      (dv !== null ? '<p class="help">Volume ' + (dv >= 0 ? '+' : '') + dv + '% em relação à última vez deste treino.</p>' : '') +
      (l.prs && l.prs.length ? '<p class="label" style="margin-top:14px">NOVOS RECORDES</p>' + l.prs.map(function (p) { return '<div class="wk-pr">★ ' + esc(p.name) + ' · ' + esc(p.t) + ': ' + fmt(p.v) + (p.t === 'carga' ? ' kg' : ' kg') + '</div>'; }).join('') : '') +
      '<p class="help">Beba água e faça uma refeição com proteína nas próximas horas.</p>', { accent: 'var(--success)' });
    var gm = null; try { gm = AW.getGame(); } catch (e) {}
    var wc = gm && gm.completions.filter(function (c) { return c.workoutId === l.id; })[0];
    if (wc) {
      var an = wc.attributes[0] === 'forca' ? 'Força' : 'Vitalidade', tb = gm.missions.filter(function (m) { return m.type === 'boss' && m.bossKind === 'training' && m.progress.periodKey === D.weekKey(new Date()); })[0];
      html += panel('Recompensa', '<p class=\"wk-name\" style=\"margin:0 0 4px;color:var(--success)\">+' + wc.xp + ' XP em ' + an + '</p>' +
        '<p class=\"help\" style=\"margin:0 0 8px\">Base ' + wc.base + ' XP' + (wc.wtype === 'strength' ? ' (volume levantado)' : ' (minutos treinados)') + (wc.prXp ? ' · recordes +' + wc.prXp + ' XP' : '') + '</p>' +
        (wc.linkedNames && wc.linkedNames.length ? '<p style=\"margin:0 0 8px\">✓ Missão concluída: ' + esc(wc.linkedNames.join(', ')) + '</p>' : '') +
        (tb ? '<p style=\"margin:0\">☠ Chefe de treino: −' + fmt(wc.tDmg, 0) + ' de vida' + (tb.status === 'completed' ? ' (derrotado!)' : ' (restam ' + fmt(Math.max(0, tb.target - tb.progress.current), 0) + ')') + '</p>' : ''), { accent: 'var(--gold)' });
    } else if (gm && l.mins < 5) html += panel('Sem XP', '<p class=\"help\" style=\"margin:0\">Treinos com menos de 5 minutos não rendem XP.</p>');
    else if (gm && gm.completions.filter(function (c) { return c.kind === 'workout' && c.day === l.day; }).length >= 3) html += panel('Sem XP', '<p class=\"help\" style=\"margin:0\">Você já recebeu XP por 3 treinos hoje. Este foi salvo no histórico, mas não rende XP.</p>');
    var ms = null; try { ms = AW.getGame().missions.filter(function (m) { return m.status === 'active' && /trein|academia|exerc|muscula|corrida|cardio/i.test(m.name) && D.isMissionScheduled(m, new Date()) && !D.isMissionDone(m, new Date()) && !D.isMissionLocked(AW.getGame(), m, new Date()); })[0]; } catch (e) {}
    if (ms) html += panel('Missão do dia', '<p style="margin:0 0 10px">Você tem a missão “' + esc(ms.name) + '” pendente. Quer concluí-la agora?</p><button class="btn" data-act="complete" data-id="' + ms.id + '">Concluir missão</button>', { accent: 'var(--gold)' });
    return html + '<button class="btn ghost" data-act="wk-ok">Voltar</button>';
  }
  function tile(b, s) { return '<div class="tile"><b>' + esc(String(b)) + '</b><span>' + esc(s) + '</span></div>'; }
  AW.handlers['wk-ok'] = function () { ui.doneId = null; ui.tab = 'progresso'; AW.render(); };
  AW.handlers['wk-tab'] = function (el) { ui.tab = el.getAttribute('data-id'); ui.confirm = null; AW.render(); };

  function weekDots(p) {
    var ws = weekStart(new Date()), out = '';
    for (var i = 0; i < 7; i++) {
      var k = D.dayKey(D.addDays(ws, i)), n = W.logs.filter(function (l) { return l.day === k; }).length, isT = k === today();
      out += '<div class="wk-dot' + (n ? ' on' : '') + (isT ? ' today' : '') + '"><span>' + ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i] + '</span><i>' + (n ? '✓' : '') + '</i></div>';
    }
    return out;
  }
  function homeTab() {
    var p = W.profile, kg = weightNow(), b = bmi(kg, p.cm), html = '';
    var done = logsIn(D.weekKey(new Date())).length, pk = todaysPick(p), s = pk.w || suggestion(p);
    html += deloadBanner() + panel('Esta semana', '<div class="wk-dots">' + weekDots(p) + '</div><div class="xp-row"><span>' + pl(done, 'treino', 'treinos') + ' de ' + p.days + '</span><span>' + (done >= p.days ? 'Meta cumprida ✓' : 'faltam ' + (p.days - done)) + '</span></div>' + bar(Math.min(1, done / p.days), 'var(--accent)', 6));
    html += (pk.rest ? panel('Hoje é dia de descanso', '<p style="margin:0">Seu plano marca descanso hoje. Dormir bem e se alimentar direito também é parte do treino.</p>', { accent: 'var(--success)' }) : '') + panel(pk.rest ? 'Se quiser treinar hoje' : pk.fromPlan ? 'Treino de hoje (seu plano)' : 'Sugestão de hoje', '<p class="wk-name" style="margin:0 0 4px">' + esc(s.name) + '</p><p class="wk-sub" style="margin:0 0 12px">' + T.LEVELS[s.level] + ' · ' + T.PLACES[s.place] + ' · ~' + s.mins + ' min</p>' + summaryList(s) +
      '<div style="margin-top:12px"><button class="btn" data-act="wk-start" data-id="' + s.key + '">Iniciar treino</button><button class="btn ghost" data-act="wk-tab" data-id="treinos" style="margin-top:8px">Escolher outro treino</button></div>', { accent: 'var(--gold)' });
    html += recoveryPanel() + panel('Seu corpo', '<div class="wk-tiles">' + tile(fmt(kg) + ' kg', 'peso') + tile(p.cm + ' cm', 'altura') + (b ? tile(fmt(b), 'IMC · ' + bmiCat(b)) : '') + '</div>' +
      '<button class="btn small" data-act="wk-tab" data-id="imc" style="margin-top:10px;width:auto">Verificar meu IMC</button> <button class="btn ghost small" data-act="wk-tab" data-id="corpo" style="margin-top:10px;width:auto">Registrar medidas</button>');
    var rec = W.logs.slice(-3).reverse();
    if (rec.length) html += panel('Últimos treinos', rec.map(logLine).join(''));
    return html;
  }
  function logLine(l) {
    return '<div class="wk-log"><div><b>' + esc(l.name) + '</b><div class="wk-sub">' + dmk(l.day) + ' · ' + l.mins + ' min' + (l.kcal ? ' · ~' + l.kcal + ' kcal' : '') + (l.rpe ? ' · esforço ' + l.rpe + '/10' : '') + (l.prs && l.prs.length ? ' · ★ ' + l.prs.length : '') + '</div></div></div>';
  }

  function libraryTab() {
    var p = W.profile, place = ui.place || p.place, level = ui.level != null ? ui.level : p.level, g = ui.group, html = '';
    html += '<div class="wk-filters"><p class="label">LOCAL</p><div class="row">' + [['gym', 'Academia'], ['home', 'Casa']].map(function (o) { return chip(o[1], place === o[0], 'data-act="wk-f" data-k="place" data-id="' + o[0] + '"'); }).join('') + '</div>' +
      '<p class="label" style="margin-top:12px">NÍVEL</p><div class="row">' + T.LEVELS.map(function (n, i) { return chip(n, level === i, 'data-act="wk-f" data-k="level" data-id="' + i + '"'); }).join('') + '</div>' +
      '<p class="label" style="margin-top:12px">GRUPO</p><div class="row">' + T.GROUPS.map(function (x) { return chip(x.glyph + ' ' + x.name, g === x.id, 'data-act="wk-f" data-k="group" data-id="' + x.id + '"'); }).join('') + '</div></div>';
    var list;
    if (g === 'cardio') list = T.cardioList(place).map(function (c) { return T.cardio(c.id, level); });
    else if (g === 'mobilidade') list = [T.build(g, place, level, 'hiper')];
    else list = ['hiper', 'forca', 'resist'].map(function (s) { return T.build(g, place, level, s); });
    html += myWorkoutsPanel() + '<p class="help" style="margin:14px 0 8px">' + esc(T.LEVEL_TIPS[level]) + '</p>';
    html += list.map(function (w) {
      var desc = w.kind === 'strength' ? T.STYLES[w.style].desc : w.kind === 'cardio' ? w.tag : 'Sequência leve para soltar a musculatura e recuperar.';
      return panel(w.name, '<p class="wk-sub" style="margin:0 0 8px">' + esc(desc) + ' · ~' + w.mins + ' min</p><details><summary>Ver ' + (w.kind === 'cardio' ? 'como fazer' : 'exercícios') + '</summary>' + (w.kind === 'cardio' ? '<p style="margin:8px 0">' + esc(w.how) + '</p>' : '<div class="wk-list">' + w.exs.map(function (e) { return '<div><b>' + esc(e.name) + '</b><span>' + (e.timed ? e.sets + ' × ' + e.secs + ' s' : e.sets + ' × ' + e.reps) + '</span><small>' + esc(e.cue) + '</small></div>'; }).join('') + '</div>') + '</details>' +
        '<div style="margin-top:10px"><button class="btn" data-act="wk-start" data-id="' + w.key + '">Iniciar</button>' + (w.kind === 'strength' ? '<button class="btn ghost" data-act="bld-from" data-id="' + w.key + '" style="margin-top:8px">Personalizar</button>' : '') + '</div>');
    }).join('');
    return html;
  }
  AW.handlers['wk-f'] = function (el) { var k = el.getAttribute('data-k'), v = el.getAttribute('data-id'); if (k === 'level') ui.level = Number(v); else ui[k] = v; AW.render(); };

  function progressTab() {
    var L = W.logs, html = '';
    if (!L.length) return panel('Seu progresso', '<p style="margin:0;color:var(--dim)">Ainda não há treinos registrados. Faça o primeiro na aba Início ou Treinos e a evolução aparece aqui.</p>');
    var totMin = L.reduce(function (a, l) { return a + l.mins; }, 0), totVol = L.reduce(function (a, l) { return a + (l.volume || 0); }, 0), totK = L.reduce(function (a, l) { return a + (l.kcal || 0); }, 0);
    html += panel('Resumo geral', '<div class="wk-tiles">' + tile(L.length, 'treinos') + tile(fmt(totMin / 60) + ' h', 'tempo treinado') + tile(fmt(totVol / 1000, 1) + ' t', 'volume levantado') + tile('~' + fmt(totK, 0), 'kcal estimadas') + '</div>');
    // treinos por semana (8 semanas)
    var ws = weekStart(new Date()), cols = [], max = 1;
    for (var i = 7; i >= 0; i--) { var s = D.addDays(ws, -7 * i), a = D.dayKey(s), b = D.dayKey(D.addDays(s, 6)), n = logsIn(a, b).length; max = Math.max(max, n); cols.push({ l: dmk(a), n: n }); }
    html += panel('Treinos por semana', '<div class="wk-bars">' + cols.map(function (c) { return '<div><i style="height:' + (c.n / max * 100) + '%"></i><b>' + c.n + '</b><span>' + c.l + '</span></div>'; }).join('') + '</div>');
    // grupos nos últimos 30 dias
    var since = D.dayKey(D.addDays(new Date(), -29)), by = {}; logsIn(since).forEach(function (l) { by[l.group] = (by[l.group] || 0) + 1; });
    var gm = Math.max.apply(null, [1].concat(Object.keys(by).map(function (k) { return by[k]; })));
    html += panel('Grupos treinados (30 dias)', Object.keys(by).length ? '<div class="stack" style="gap:8px">' + T.GROUPS.concat([{ id: 'custom', name: 'Meus treinos', glyph: '★' }]).filter(function (x) { return by[x.id]; }).map(function (x) { return '<div><div class="xp-row"><span>' + x.glyph + ' ' + esc(x.name) + '</span><span>' + by[x.id] + '</span></div>' + bar(by[x.id] / gm, 'var(--accent)', 5) + '</div>'; }).join('') + '</div>' : '<p class="dim" style="margin:0">Nenhum treino nos últimos 30 dias.</p>');
    // evolução por exercício
    var agg = {}; L.forEach(function (l) { (l.ex || []).forEach(function (e) { if (e.timed) return; var a = agg[e.id] || (agg[e.id] = { id: e.id, name: e.name, n: 0, kg: 0, rm: 0 }); a.n++; e.sets.forEach(function (s) { a.kg = Math.max(a.kg, s.kg || 0); a.rm = Math.max(a.rm, e1rm(s.kg, s.reps)); }); }); });
    var top = Object.keys(agg).map(function (k) { return agg[k]; }).sort(function (x, y) { return y.n - x.n; }).slice(0, 10);
    if (top.length) {
      if (!ui.exSel || !agg[ui.exSel]) ui.exSel = top[0].id;
      var sel = agg[ui.exSel], pts = [];
      L.forEach(function (l) { (l.ex || []).forEach(function (e) { if (e.id !== ui.exSel) return; var best = 0, br = 0; e.sets.forEach(function (s) { best = Math.max(best, s.kg ? e1rm(s.kg, s.reps) : s.reps); br = Math.max(br, s.reps); }); pts.push({ x: dayNum(l.day), y: Math.round(best * 10) / 10, l: dmk(l.day) }); }); });
      var weighted = sel.kg > 0;
      html += panel('Evolução por exercício', '<div class="row">' + top.map(function (a) { return chip(a.name.length > 24 ? a.name.slice(0, 23) + '…' : a.name, ui.exSel === a.id, 'data-act="wk-ex" data-id="' + a.id + '"'); }).join('') + '</div>' +
        '<p class="help" style="margin:10px 0 4px">' + (weighted ? 'Melhor série de cada treino (1RM estimado, em kg)' : 'Maior número de repetições por treino') + '</p>' + lineChart(pts, weighted ? ' kg' : '') +
        '<div class="wk-tiles" style="margin-top:8px">' + (weighted ? tile(fmt(sel.kg) + ' kg', 'maior carga') + tile(fmt(sel.rm) + ' kg', '1RM estimado') : '') + tile(sel.n, 'treinos com ele') + '</div>');
    }
    // histórico
    html += panel('Histórico', L.slice().reverse().slice(0, 30).map(function (l) {
      var open = ui.histOpen === l.id;
      return '<div class="wk-log"><button type="button" class="wk-logb" data-act="wk-hist" data-id="' + l.id + '"><div><b>' + esc(l.name) + '</b><div class="wk-sub">' + dmk(l.day) + ' · ' + l.mins + ' min' + (l.kcal ? ' · ~' + l.kcal + ' kcal' : '') + (l.rpe ? ' · esforço ' + l.rpe + '/10' : '') + '</div></div><span>' + (open ? '▾' : '▸') + '</span></button>' +
        (open ? '<div class="wk-det">' + (l.ex || []).map(function (e) { return '<div><b>' + esc(e.name) + '</b>: ' + e.sets.map(function (s) { return (s.kg ? fmt(s.kg) + '×' : '') + s.reps + (e.timed ? 's' : ''); }).join(' · ') + '</div>'; }).join('') +
          (l.dist ? '<div>Distância: ' + fmt(l.dist, 2) + ' km</div>' : '') + (l.hr ? '<div>FC média: ' + l.hr + ' bpm</div>' : '') + (l.pre && (l.pre.energy || l.pre.sleep) ? '<div>Antes: energia ' + (l.pre.energy ? ENERGY[l.pre.energy - 1].toLowerCase() : '—') + (l.pre.sleep ? ', sono ' + l.pre.sleep + ' h' : '') + '</div>' : '') + (l.mood ? '<div>Depois: ' + ENERGY[l.mood - 1].toLowerCase() + '</div>' : '') + (l.note ? '<div class="rev-text">' + esc(l.note) + '</div>' : '') +
          '<button type="button" class="btn ghost small" data-act="wk-dellog" data-id="' + l.id + '" style="width:auto;margin-top:8px">' + (ui.confirm === l.id ? 'Confirmar exclusão' : 'Excluir treino') + '</button></div>' : '') + '</div>';
    }).join('') + '<button class="btn ghost small" data-act="wk-csv" style="width:auto;margin-top:10px">Exportar CSV</button>');
    return html;
  }
  AW.handlers['wk-ex'] = function (el) { ui.exSel = el.getAttribute('data-id'); AW.render(); };
  AW.handlers['wk-hist'] = function (el) { var id = el.getAttribute('data-id'); ui.histOpen = ui.histOpen === id ? null : id; ui.confirm = null; AW.render(); };
  AW.handlers['wk-dellog'] = function (el) {
    var id = el.getAttribute('data-id');
    if (ui.confirm !== id) { ui.confirm = id; AW.render(); return; }
    W.logs = W.logs.filter(function (l) { return l.id !== id; }); ui.confirm = null; ui.histOpen = null; save(); AW.render();
  };
  AW.handlers['wk-csv'] = function () {
    var rows = [['data', 'treino', 'grupo', 'local', 'nivel', 'exercicio', 'serie', 'kg', 'repeticoes_ou_segundos', 'duracao_min', 'kcal_estimadas', 'esforco', 'distancia_km', 'fc_media']];
    W.logs.forEach(function (l) {
      if (!l.ex || !l.ex.length) rows.push([l.day, l.name, l.group, l.place, T.LEVELS[l.level], '', '', '', '', l.mins, l.kcal, l.rpe || '', l.dist || '', l.hr || '']);
      (l.ex || []).forEach(function (e) { e.sets.forEach(function (s, i) { rows.push([l.day, l.name, l.group, l.place, T.LEVELS[l.level], e.name, i + 1, s.kg, s.reps, l.mins, l.kcal, l.rpe || '', l.dist || '', l.hr || '']); }); });
    });
    var csv = rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",;\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
    var url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
    a.href = url; a.download = 'awakening-treinos-' + today() + '.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  };

  /* ------------------------------ verificador de IMC ------------------------------ */
  var IMC_BANDS = [
    [16, 'Magreza grave', '#c9303a'], [17, 'Magreza moderada', '#e0703a'], [18.5, 'Magreza leve', '#e0a83a'], [25, 'Peso normal', '#2fb57a'],
    [30, 'Sobrepeso', '#e0a83a'], [35, 'Obesidade grau I', '#e0703a'], [40, 'Obesidade grau II', '#d4453a'], [99, 'Obesidade grau III', '#b02a3a']
  ];
  function imcBand(v) { for (var i = 0; i < IMC_BANDS.length; i++) if (v < IMC_BANDS[i][0]) return IMC_BANDS[i]; return IMC_BANDS[IMC_BANDS.length - 1]; }
  function imcAdvice(v, band) {
    if (v >= 18.5 && v < 25) return 'Seu peso está dentro da faixa considerada saudável para a sua altura. O foco agora é manter e ganhar condicionamento.';
    if (v < 18.5) return 'Seu peso está abaixo da faixa considerada saudável. Se não for o seu normal, vale conversar com um médico ou nutricionista; treino de força com boa alimentação ajuda a ganhar massa com segurança.';
    if (v < 30) return 'Seu peso está um pouco acima da faixa considerada saudável. Treinos regulares, mais movimento no dia a dia e ajustes na alimentação costumam resolver. Lembre que o IMC não distingue músculo de gordura.';
    return 'Seu peso está bem acima da faixa considerada saudável, o que aumenta o risco de problemas de saúde. Vale uma avaliação com médico ou nutricionista, e começar com treinos leves e constantes é um bom caminho.';
  }
  function imcResult(kg, cm, age) {
    var v = bmi(kg, cm), band = imcBand(v), m = Math.pow(cm / 100, 2), lo = 18.5 * m, hi = 24.9 * m;
    var pos = Math.max(0, Math.min(100, (v - 15) / (40 - 15) * 100));
    var seg = [[15, 18.5, '#e0a83a', 'Abaixo'], [18.5, 25, '#2fb57a', 'Normal'], [25, 30, '#e0a83a', 'Sobrepeso'], [30, 40, '#d4453a', 'Obesidade']];
    var html = '<div class="imc-big"><b style="color:' + band[2] + '">' + fmt(v) + '</b><span style="color:' + band[2] + '">' + band[1] + '</span></div>' +
      '<div class="imc-scale" role="img" aria-label="IMC ' + fmt(v) + ', ' + band[1] + '">' + seg.map(function (s) { return '<i style="flex:' + (s[1] - s[0]) + ';background:' + s[2] + '"></i>'; }).join('') + '<u style="left:' + pos.toFixed(1) + '%"></u></div>' +
      '<div class="imc-lab"><span>15</span><span style="left:14%">18,5</span><span style="left:40%">25</span><span style="left:60%">30</span><span style="left:100%">40+</span></div>';
    if (age && age < 18) return html + '<p class="help">Para menores de 18 anos o IMC é avaliado por curvas de crescimento (percentis) por idade e sexo, e não pela tabela de adultos. Peça a avaliação a um pediatra ou médico.</p>';
    html += '<p style="margin:12px 0 0">' + esc(imcAdvice(v, band)) + '</p>';
    html += '<div class="wk-tiles" style="margin-top:12px">' + tile(fmt(lo) + ' – ' + fmt(hi) + ' kg', 'faixa normal para ' + cm + ' cm') +
      (kg > hi ? tile('−' + fmt(kg - hi) + ' kg', 'para entrar na faixa') : kg < lo ? tile('+' + fmt(lo - kg) + ' kg', 'para entrar na faixa') : tile('✓', 'dentro da faixa')) + '</div>';
    return html + '<p class="help">Tabela da OMS para adultos. O IMC é uma triagem: não mede gordura nem músculo, e pode enganar em quem treina muito, idosos e gestantes. Para uma avaliação completa, use também a cintura (risco aumentado acima de 94 cm em homens e 80 cm em mulheres) e converse com um profissional.</p>';
  }
  function imcTab() {
    var p = W.profile, c = ui.imc || { kg: weightNow() || p.kg, cm: p.cm, own: true };
    var html = panel('Seu IMC', imcResult(c.kg, c.cm, p.age) + (c.own ? '<p class="help">Calculado com seu peso atual (' + fmt(c.kg) + ' kg) e sua altura (' + c.cm + ' cm).</p>' : ''), { accent: 'var(--gold)' });
    html += panel('Simular outro valor', '<p class="help" style="margin:0 0 10px">Teste um peso ou uma altura sem mudar o seu perfil.</p><div class="wk-grid"><div><p class="label">PESO (KG)</p><input id="imc-kg" class="input" type="number" inputmode="decimal" step="0.1" value="' + c.kg + '"></div>' +
      '<div><p class="label">ALTURA (CM)</p><input id="imc-cm" class="input" type="number" inputmode="numeric" value="' + c.cm + '"></div></div>' +
      '<div style="margin-top:12px"><button class="btn" data-act="imc-calc">Calcular</button>' + (ui.imc ? '<button class="btn ghost" data-act="imc-reset" style="margin-top:8px">Voltar aos meus dados</button>' : '') + '</div>');
    html += panel('Faixas da OMS', '<div class="wk-list">' + [['Abaixo de 18,5', 'Magreza'], ['18,5 a 24,9', 'Peso normal'], ['25 a 29,9', 'Sobrepeso'], ['30 a 34,9', 'Obesidade grau I'], ['35 a 39,9', 'Obesidade grau II'], ['40 ou mais', 'Obesidade grau III']].map(function (r) { return '<div><b>' + r[0] + '</b><span>' + r[1] + '</span></div>'; }).join('') + '</div>');
    return html;
  }
  AW.handlers['imc-calc'] = function () {
    var kg = num('imc-kg'), cm = num('imc-cm');
    if (!kg || kg < 20 || kg > 400) return toast('Informe um peso entre 20 e 400 kg.', true);
    if (!cm || cm < 80 || cm > 250) return toast('Informe uma altura entre 80 e 250 cm.', true);
    ui.imc = { kg: kg, cm: cm }; AW.render();
  };
  AW.handlers['imc-reset'] = function () { ui.imc = null; AW.render(); };

  var MEAS = [['waist', 'Cintura (cm)'], ['hip', 'Quadril (cm)'], ['chest', 'Peito (cm)'], ['arm', 'Braço (cm)'], ['thigh', 'Coxa (cm)'], ['fat', '% de gordura']];
  function bodyTab() {
    var p = W.profile, kg = weightNow(), b = bmi(kg, p.cm), html = '';
    if (ui.bodyOpen) return profileForm(true);
    var first = W.body.filter(function (x) { return x.kg; })[0], diff = first && kg ? kg - first.kg : 0;
    var tiles = tile(fmt(kg) + ' kg', 'peso atual') + (first && W.body.length > 1 ? tile((diff > 0 ? '+' : '') + fmt(diff) + ' kg', 'desde ' + dmk(first.d)) : '') + (b ? tile(fmt(b), 'IMC · ' + bmiCat(b)) : '');
    var info = [];
    if (b) { var lo = 18.5 * Math.pow(p.cm / 100, 2), hi = 24.9 * Math.pow(p.cm / 100, 2); info.push('Faixa de peso com IMC normal para ' + p.cm + ' cm: ' + fmt(lo) + ' a ' + fmt(hi) + ' kg. O IMC é só uma referência e não separa gordura de músculo.'); }
    if (p.age && p.sex && kg) { var tmb = 10 * kg + 6.25 * p.cm - 5 * p.age + (p.sex === 'm' ? 5 : -161); info.push('Gasto basal estimado: ~' + fmt(tmb, 0) + ' kcal/dia (fórmula de Mifflin-St Jeor).'); }
    if (kg) info.push('Meta de água: ~' + fmt(kg * 35 / 1000, 1) + ' L por dia (35 ml por kg).');
    if (p.goalKg && kg) info.push('Meta de peso: ' + fmt(p.goalKg) + ' kg (faltam ' + fmt(Math.abs(kg - p.goalKg)) + ' kg).');
    html += panel('Peso e IMC', '<div class="wk-tiles">' + tiles + '</div>' + lineChart(W.body.filter(function (x) { return x.kg; }).slice(-40).map(function (x) { return { x: dayNum(x.d), y: x.kg, l: dmk(x.d) }; }), ' kg') + info.map(function (t) { return '<p class="help">' + esc(t) + '</p>'; }).join('') +
      '<button class="btn ghost small" data-act="wk-profile" style="width:auto;margin-top:6px">Editar perfil</button>');
    html += panel('Nova medição', '<div class="wk-grid"><div><p class="label">PESO (KG)</p><input id="bd-kg" class="input" type="number" inputmode="decimal" step="0.1" placeholder="' + fmt(kg) + '"></div>' +
      MEAS.map(function (m) { return '<div><p class="label">' + m[1].toUpperCase() + '</p><input id="bd-' + m[0] + '" class="input" type="number" inputmode="decimal" step="0.1" placeholder="opcional"></div>'; }).join('') + '</div>' +
      '<div style="margin-top:12px"><button class="btn" data-act="wk-body-save">Salvar medição de hoje</button></div>');
    var last = W.body.slice().reverse().slice(0, 12);
    if (last.length) html += panel('Registros', last.map(function (x) {
      return '<div class="wk-log"><div><b>' + dmk(x.d) + (x.kg ? ' · ' + fmt(x.kg) + ' kg' : '') + '</b><div class="wk-sub">' + MEAS.filter(function (m) { return x[m[0]]; }).map(function (m) { return m[1].replace(/ \(.*\)/, '') + ' ' + fmt(x[m[0]]) + (m[0] === 'fat' ? '%' : ''); }).join(' · ') + '</div></div>' +
        (W.body.length > 1 ? '<button type="button" class="mini" data-act="wk-body-del" data-id="' + x.d + '" aria-label="Excluir registro de ' + dmk(x.d) + '">✕</button>' : '') + '</div>';
    }).join(''));
    html += photosPanel();
    html += '<button class="btn ghost small" data-act="wk-wipe" style="width:auto;margin-top:6px">' + (ui.wipe ? 'Confirmar: apagar TODOS os dados de treino' : 'Apagar dados de treino') + '</button>';
    return html;
  }
  AW.handlers['wk-profile'] = function () { ui.pf = null; ui.bodyOpen = true; AW.render(); };
  AW.handlers['wk-body-save'] = function () {
    var e = { d: today() }, any = false, kg = num('bd-kg');
    if (kg != null) { if (kg < 25 || kg > 300) return toast('Peso inválido.', true); e.kg = kg; any = true; }
    for (var i = 0; i < MEAS.length; i++) { var v = num('bd-' + MEAS[i][0]); if (v != null) { if (!(v > 0) || v > 300) return toast('Medida inválida: ' + MEAS[i][1], true); e[MEAS[i][0]] = v; any = true; } }
    if (!any) return toast('Preencha pelo menos um campo.', true);
    setBody(e); if (e.kg && W.profile) W.profile.kg = e.kg; save(); toast('Medição salva'); AW.render();
  };
  AW.handlers['wk-body-del'] = function (el) { var d = el.getAttribute('data-id'); W.body = W.body.filter(function (x) { return x.d !== d; }); save(); AW.render(); };
  AW.handlers['wk-wipe'] = function () {
    if (!ui.wipe) { ui.wipe = true; AW.render(); return; }
    ui.wipe = false; photosClear(); W = blank(); ui.pf = null; ui.tab = 'inicio'; lockOff(); save(); AW.render();
  };


  /* ------------------------------ recuperação e semana leve ------------------------------ */
  var REL = { 'peito-triceps': ['ombros', 'bracos'], 'costas-biceps': ['bracos'], ombros: ['peito-triceps'], bracos: ['peito-triceps', 'costas-biceps', 'ombros'], pernas: ['gluteos'], gluteos: ['pernas'] };
  function dayNum2(k) { return Math.round(D.parseDay(k).getTime() / 86400000); }
  function daysSince(g) {
    var set = [g, 'corpo'].concat(REL[g] || []), best = null;
    W.logs.forEach(function (l) { if (set.indexOf(l.group) >= 0) { var d = dayNum2(today()) - dayNum2(l.day); if (best === null || d < best) best = d; } });
    return best;
  }
  function recoveryPanel() {
    if (!W.logs.length) return '';
    var gs = ['peito-triceps', 'costas-biceps', 'pernas', 'gluteos', 'ombros', 'bracos', 'core'], rows = gs.map(function (g) {
      var d = daysSince(g), def = T.GROUPS.filter(function (x) { return x.id === g; })[0];
      var st = d === null || d > 9 ? ['sem treino recente', 'mute'] : d === 0 ? ['treinado hoje · descanse', 'warn'] : d === 1 ? ['ontem · ainda recuperando', 'warn'] : ['pronto (há ' + d + ' dias)', 'ok'];
      return '<div class="rec ' + st[1] + '"><b>' + def.glyph + ' ' + esc(def.name) + '</b><span>' + st[0] + '</span></div>';
    }).join('');
    return panel('Recuperação', '<div class="rec-grid">' + rows + '</div><p class="help">Dê cerca de 48 h de descanso ao mesmo músculo antes de treiná-lo pesado de novo. Músculos de grupos relacionados (ex.: peito e ombros) também contam.</p>');
  }
  function weekCount(off) { var s = D.addDays(weekStart(new Date()), -7 * off); return logsIn(D.dayKey(s), D.dayKey(D.addDays(s, 6))).length; }
  function deloadAdvice() {
    var cur = D.weekKey(new Date());
    if (W.deload === cur) return { on: true };
    if (W.deload && W.deload >= D.dayKey(D.addDays(weekStart(new Date()), -14))) return null;
    var st = 0; for (var i = 1; i <= 10; i++) { if (weekCount(i) >= 2) st++; else break; }
    if (st >= 5) return { why: 'Você treinou ' + st + ' semanas seguidas.' };
    var r = W.logs.slice(-4).filter(function (l) { return l.rpe; });
    if (r.length === 4 && r.reduce(function (a, l) { return a + l.rpe; }, 0) / 4 >= 9) return { why: 'Seus últimos treinos ficaram em esforço 9 a 10.' };
    return null;
  }
  function deloadBanner() {
    var a = deloadAdvice(); if (!a) return '';
    if (a.on) return panel('Semana leve ativa', '<p style="margin:0 0 10px">Nesta semana seus treinos têm uma série a menos por exercício e cargas ~15% menores. Use para recuperar e voltar mais forte.</p><button class="btn ghost" data-act="deload-off">Encerrar semana leve</button>', { accent: 'var(--success)' });
    return panel('Hora de uma semana leve?', '<p style="margin:0 0 10px">' + esc(a.why) + ' Uma semana com menos volume e carga ajuda a recuperar articulações e sistema nervoso e costuma melhorar o desempenho depois.</p><button class="btn" data-act="deload-on">Ativar semana leve</button>', { accent: 'var(--gold)' });
  }
  AW.handlers['deload-on'] = function () { W.deload = D.weekKey(new Date()); save(); AW.render(); };
  AW.handlers['deload-off'] = function () { W.deload = D.dayKey(new Date()); save(); AW.render(); };

  /* ------------------------------ plano semanal ------------------------------ */
  var WD = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  function styleFor(p) { return p.goal === 'forca' ? 'forca' : p.goal === 'emagrecer' ? 'resist' : 'hiper'; }
  var cardioN = 0;
  function keyFor(g, p) {
    if (g === 'cardio') { var l = T.cardioList(p.place); return T.cardio(l[cardioN++ % l.length].id, p.level).key; }
    if (g === 'mobilidade') return T.build(g, p.place, p.level, 'hiper').key;
    return T.build(g, p.place, p.level, styleFor(p)).key;
  }
  function genPlan(p) {
    var idx = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] }[p.days || 3], gs = planFor(p), days = ['', '', '', '', '', '', '']; cardioN = 0;
    idx.forEach(function (d, i) { days[d] = keyFor(gs[i % gs.length], p); });
    return { days: days };
  }
  function todayIdx() { return (new Date().getDay() + 6) % 7; }
  function todaysPick(p) {
    if (!W.plan) return { w: null, fromPlan: false, rest: false };
    var k = W.plan.days[todayIdx()];
    if (!k) return { w: null, fromPlan: true, rest: true };
    var w = find(k); return w ? { w: w, fromPlan: true, rest: false } : { w: null, fromPlan: false, rest: false };
  }
  AW.handlers['plan-auto'] = function () { W.plan = genPlan(W.profile); ui.planDay = null; save(); AW.render(); };
  AW.handlers['plan-blank'] = function () { W.plan = { days: ['', '', '', '', '', '', ''] }; ui.planDay = 0; save(); AW.render(); };
  AW.handlers['plan-del'] = function () { if (ui.confirm !== 'plan') { ui.confirm = 'plan'; AW.render(); return; } ui.confirm = null; W.plan = null; ui.planDay = null; save(); AW.render(); };
  AW.handlers['plan-edit'] = function (el) { var d = Number(el.getAttribute('data-id')); ui.planDay = ui.planDay === d ? null : d; AW.render(); };
  AW.handlers['plan-set'] = function (el) { W.plan.days[ui.planDay] = el.getAttribute('data-id'); ui.planDay = null; save(); AW.render(); };
  function planTab() {
    var p = W.profile, html = '';
    if (!W.plan) return panel('Plano semanal', '<p style="margin:0 0 12px;color:var(--dim)">Monte sua semana de treinos: o app distribui os grupos musculares nos dias certos para ' + p.days + ' treinos por semana, respeitando o descanso entre músculos parecidos. Depois você troca o que quiser.</p><button class="btn" data-act="plan-auto">Gerar plano automático</button><button class="btn ghost" data-act="plan-blank" style="margin-top:8px">Montar do zero</button>');
    var ws = weekStart(new Date()), ti = todayIdx();
    html += panel('Sua semana', W.plan.days.map(function (k, i) {
      var w = k ? find(k) : null, dk = D.dayKey(D.addDays(ws, i)), done = W.logs.some(function (l) { return l.day === dk; });
      return '<div class="plan-row' + (i === ti ? ' today' : '') + (done ? ' done' : '') + '"><div class="plan-d"><b>' + WD[i].slice(0, 3) + '</b><span>' + dmk(dk) + '</span></div><div class="plan-w"><div class="plan-n">' + (done ? '✓ ' : '') + (w ? esc(w.name) : 'Descanso') + '</div>' + (w ? '<div class="wk-sub">' + T.LEVELS[w.level] + ' · ~' + w.mins + ' min</div>' : '') + '</div>' +
        '<div class="plan-b">' + (w ? '<button type="button" class="mini" data-act="wk-start" data-id="' + esc(k) + '">Iniciar</button>' : '') + '<button type="button" class="mini" data-act="plan-edit" data-id="' + i + '">' + (ui.planDay === i ? 'Fechar' : 'Trocar') + '</button></div></div>';
    }).join('') + '<p class="help">Treinos cumpridos aparecem com ✓. Se mudar nível, local ou objetivo no perfil, gere o plano de novo.</p>');
    if (ui.planDay !== null) {
      var i = ui.planDay, opts = '<button type="button" class="plan-o" data-act="plan-set" data-id="">😴 Descanso</button>';
      T.GROUPS.forEach(function (g) {
        if (g.id === 'cardio') return;
        var w = g.id === 'mobilidade' ? T.build(g.id, p.place, p.level, 'hiper') : T.build(g.id, p.place, p.level, styleFor(p));
        opts += '<button type="button" class="plan-o" data-act="plan-set" data-id="' + w.key + '">' + g.glyph + ' ' + esc(g.name) + '</button>';
      });
      opts += T.cardioList(p.place).map(function (c) { var w = T.cardio(c.id, p.level); return '<button type="button" class="plan-o" data-act="plan-set" data-id="' + w.key + '">♥ ' + esc(w.name) + '</button>'; }).join('');
      opts += W.custom.map(function (c) { return '<button type="button" class="plan-o" data-act="plan-set" data-id="custom.' + c.id + '">★ ' + esc(c.name) + '</button>'; }).join('');
      html += panel('Treino de ' + WD[i].toLowerCase(), '<div class="plan-opts">' + opts + '</div>', { accent: 'var(--gold)' });
    }
    html += '<button class="btn ghost small" data-act="plan-auto" style="width:auto">Gerar de novo</button> <button class="btn ghost small" data-act="plan-del" style="width:auto">' + (ui.confirm === 'plan' ? 'Confirmar: apagar plano' : 'Apagar plano') + '</button>';
    return html;
  }

  /* ------------------------------ criar o próprio treino ------------------------------ */
  function newBuilder(c) { return c ? { id: c.id, name: c.name, place: c.place, exs: JSON.parse(JSON.stringify(c.exs)), q: '', g: 'all' } : { id: null, name: '', place: W.profile.place, exs: [], q: '', g: 'all' }; }
  AW.handlers['bld-new'] = function () { ui.builder = newBuilder(null); AW.render(); window.scrollTo(0, 0); };
  AW.handlers['bld-edit'] = function (el) { var c = W.custom.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0]; if (c) { ui.builder = newBuilder(c); AW.render(); window.scrollTo(0, 0); } };
  AW.handlers['bld-from'] = function (el) {
    var w = find(el.getAttribute('data-id')); if (!w) return;
    ui.builder = { id: null, name: 'Meu ' + w.name.split(' · ')[0].toLowerCase(), place: w.place, q: '', g: 'all', exs: w.exs.map(function (e) { return { id: e.id, name: e.name, cue: e.cue, timed: !!e.timed, iso: !!e.iso, sets: e.sets, reps: e.reps || '10', secs: e.secs || 40, rest: e.rest }; }) };
    AW.render(); window.scrollTo(0, 0);
  };
  AW.handlers['bld-cancel'] = function () { ui.builder = null; AW.render(); };
  AW.handlers['bld-place'] = function (el) { ui.builder.place = el.getAttribute('data-id'); AW.render(); };
  AW.handlers['bld-g'] = function (el) { ui.builder.g = el.getAttribute('data-id'); AW.render(); };
  AW.handlers['bld-add'] = function (el) {
    var b = ui.builder, id = el.getAttribute('data-id'), x = T.exercises().filter(function (e) { return e.id === id; })[0];
    if (!x || b.exs.some(function (e) { return e.id === id; })) return;
    if (b.exs.length >= 15) return toast('No máximo 15 exercícios por treino.', true);
    b.exs.push({ id: x.id, name: x.name, cue: x.cue, timed: x.timed, iso: x.iso, sets: 3, reps: x.iso ? '12-15' : '8-12', secs: 40, rest: x.timed ? 45 : x.iso ? 60 : 90 });
    AW.render();
  };
  AW.handlers['bld-del'] = function (el) { ui.builder.exs.splice(Number(el.getAttribute('data-id')), 1); AW.render(); };
  AW.handlers['bld-mv'] = function (el) {
    var p = el.getAttribute('data-id').split(':'), i = +p[0], j = i + Number(p[1]), L = ui.builder.exs; if (j < 0 || j >= L.length) return;
    var t = L[i]; L[i] = L[j]; L[j] = t; AW.render();
  };
  AW.handlers['bld-sets'] = function (el) { var p = el.getAttribute('data-id').split(':'), e = ui.builder.exs[+p[0]]; e.sets = Math.max(1, Math.min(10, e.sets + Number(p[1]))); AW.render(); };
  AW.handlers['bld-save'] = function () {
    var b = ui.builder, name = (b.name || '').trim();
    if (!name) return toast('Dê um nome ao treino.', true);
    if (name.length > 40) return toast('O nome pode ter no máximo 40 caracteres.', true);
    if (!b.exs.length) return toast('Adicione pelo menos um exercício.', true);
    for (var i = 0; i < b.exs.length; i++) {
      var e = b.exs[i]; e.rest = Math.round(Number(e.rest));
      if (!(e.rest >= 0 && e.rest <= 600)) return toast('Descanso inválido em “' + e.name + '” (0 a 600 s).', true);
      if (e.timed) { e.secs = Math.round(Number(e.secs)); if (!(e.secs >= 5 && e.secs <= 600)) return toast('Segundos inválidos em “' + e.name + '” (5 a 600).', true); }
      else { e.reps = String(e.reps).trim(); if (!/^\d{1,3}(-\d{1,3})?$/.test(e.reps)) return toast('Repetições inválidas em “' + e.name + '”. Use, por exemplo, 10 ou 8-12.', true); }
    }
    var c = { id: b.id || uid(), name: name, place: b.place, exs: b.exs };
    var at = -1; W.custom.forEach(function (x, i) { if (x.id === c.id) at = i; });
    if (at >= 0) W.custom[at] = c; else W.custom.push(c);
    ui.builder = null; ui.tab = 'treinos'; save(); toast('Treino salvo'); AW.render(); window.scrollTo(0, 0);
  };
  AW.handlers['bld-delw'] = function (el) {
    var id = el.getAttribute('data-id'); if (ui.confirm !== 'c' + id) { ui.confirm = 'c' + id; AW.render(); return; }
    W.custom = W.custom.filter(function (c) { return c.id !== id; }); if (W.plan) W.plan.days = W.plan.days.map(function (k) { return k === 'custom.' + id ? '' : k; });
    ui.confirm = null; save(); AW.render();
  };
  document.addEventListener('input', function (ev) {
    var t = ev.target, b = ui.builder; if (!t || !b) return;
    if (t.id === 'bld-name') { b.name = t.value; return; }
    if (t.id === 'bld-q') { b.q = t.value; AW.render(); var q = $('bld-q'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } return; }
    var k = t.getAttribute && t.getAttribute('data-bld'); if (k) { var e = b.exs[+t.getAttribute('data-i')]; if (e) e[k] = t.value; }
  });
  function builderView() {
    var b = ui.builder, html = '<div class="between"><h1 class="screen-title">MEU TREINO</h1><button type="button" class="close" data-act="bld-cancel" aria-label="Fechar">✕</button></div>';
    html += panel('Dados', '<p class="label">NOME</p><input id="bld-name" class="input" maxlength="40" value="' + esc(b.name) + '" placeholder="Ex.: Peito pesado de segunda">' +
      '<p class="label" style="margin-top:12px">LOCAL</p><div class="row">' + [['gym', 'Academia'], ['home', 'Casa']].map(function (o) { return chip(o[1], b.place === o[0], 'data-act="bld-place" data-id="' + o[0] + '"'); }).join('') + '</div>');
    html += panel('Exercícios do treino (' + b.exs.length + ')', b.exs.length ? b.exs.map(function (e, i) {
      return '<div class="bld-ex"><div class="bld-h"><b>' + (i + 1) + '. ' + esc(e.name) + '</b><span><button type="button" class="mini" data-act="bld-mv" data-id="' + i + ':-1" aria-label="Subir">↑</button><button type="button" class="mini" data-act="bld-mv" data-id="' + i + ':1" aria-label="Descer">↓</button><button type="button" class="mini" data-act="bld-del" data-id="' + i + '" aria-label="Remover ' + esc(e.name) + '">✕</button></span></div>' +
        '<div class="bld-c"><div><span class="label">SÉRIES</span><div class="bld-st"><button type="button" class="mini" data-act="bld-sets" data-id="' + i + ':-1">−</button><b>' + e.sets + '</b><button type="button" class="mini" data-act="bld-sets" data-id="' + i + ':1">+</button></div></div>' +
        '<div><span class="label">' + (e.timed ? 'SEGUNDOS' : 'REPS') + '</span><input class="input" data-bld="' + (e.timed ? 'secs' : 'reps') + '" data-i="' + i + '" value="' + esc(e.timed ? e.secs : e.reps) + '" inputmode="' + (e.timed ? 'numeric' : 'text') + '" aria-label="' + (e.timed ? 'Segundos' : 'Repetições') + ' de ' + esc(e.name) + '"></div>' +
        '<div><span class="label">DESCANSO (S)</span><input class="input" data-bld="rest" data-i="' + i + '" value="' + esc(e.rest) + '" inputmode="numeric" aria-label="Descanso de ' + esc(e.name) + '"></div></div></div>';
    }).join('') : '<p class="dim" style="margin:0">Nenhum exercício ainda. Escolha abaixo.</p>');
    var all = T.exercises().filter(function (e) { return e.places.indexOf(b.place) >= 0; }), q = (b.q || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    var list = all.filter(function (e) { return (b.g === 'all' || e.groups.indexOf(b.g) >= 0) && (!q || e.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(q) >= 0); });
    html += panel('Adicionar exercícios', '<div class="row">' + chip('Todos', b.g === 'all', 'data-act="bld-g" data-id="all"') + T.GROUPS.filter(function (g) { return g.id !== 'cardio'; }).map(function (g) { return chip(g.name, b.g === g.id, 'data-act="bld-g" data-id="' + g.id + '"'); }).join('') + '</div>' +
      '<input id="bld-q" class="input" style="margin-top:10px" placeholder="Buscar exercício" value="' + esc(b.q) + '" aria-label="Buscar exercício">' +
      '<div class="wk-list bld-res">' + list.slice(0, 40).map(function (e) {
        var has = b.exs.some(function (x) { return x.id === e.id; });
        return '<div><b>' + esc(e.name) + '</b><button type="button" class="mini" data-act="bld-add" data-id="' + e.id + '"' + (has ? ' disabled' : '') + '>' + (has ? '✓ adicionado' : '+ adicionar') + '</button><small>' + esc(e.cue) + '</small></div>';
      }).join('') + (list.length > 40 ? '<p class="help">Mostrando 40 de ' + list.length + '. Refine a busca.</p>' : '') + (list.length ? '' : '<p class="help">Nada encontrado.</p>') + '</div>');
    return html + '<div class="wk-fin"><button class="btn" data-act="bld-save">Salvar treino</button><button class="btn ghost" data-act="bld-cancel" style="margin-top:8px">Cancelar</button></div>';
  }
  function myWorkoutsPanel() {
    var l = W.custom, body = l.length ? l.map(function (c) {
      var w = customWorkout(c);
      return '<div class="wk-log"><div><b>' + esc(c.name) + '</b><div class="wk-sub">' + pl(c.exs.length, 'exercício', 'exercícios') + ' · ' + T.PLACES[c.place] + ' · ~' + w.mins + ' min</div></div><div class="plan-b"><button type="button" class="mini" data-act="wk-start" data-id="custom.' + c.id + '">Iniciar</button><button type="button" class="mini" data-act="bld-edit" data-id="' + c.id + '">Editar</button><button type="button" class="mini" data-act="bld-delw" data-id="' + c.id + '">' + (ui.confirm === 'c' + c.id ? 'Confirmar' : 'Excluir') + '</button></div></div>';
    }).join('') : '<p class="dim" style="margin:0 0 4px">Você ainda não criou nenhum treino.</p>';
    return panel('Meus treinos', body + '<div style="margin-top:10px"><button class="btn" data-act="bld-new">+ Criar treino</button></div><p class="help">Também dá para tocar em “Personalizar” em qualquer treino pronto abaixo para editar uma cópia.</p>', { accent: 'var(--gold)' });
  }

  /* ------------------------------ fotos de progresso (IndexedDB) ------------------------------ */
  var photos = [], photoState = 'idle', idb = null;
  function dbOpen(cb) {
    if (idb) return cb(null, idb);
    try { var r = indexedDB.open('awakening-workout-db', 1); r.onupgradeneeded = function () { r.result.createObjectStore('photos', { keyPath: 'id' }); }; r.onsuccess = function () { idb = r.result; cb(null, idb); }; r.onerror = function () { cb(r.error || new Error('idb')); }; } catch (e) { cb(e); }
  }
  function redrawBody() { if (isRoute() && !W.active && ui.tab === 'corpo') AW.render(); }
  function photosLoad() {
    photoState = 'loading';
    dbOpen(function (err, db) {
      if (err) { photoState = 'err'; return redrawBody(); }
      var q = db.transaction('photos').objectStore('photos').getAll();
      q.onsuccess = function () { var have = {}; q.result.forEach(function (p) { have[p.id] = 1; }); photos.forEach(function (p) { if (!have[p.id]) q.result.push(p); }); photos = q.result.sort(function (a, b) { return a.at < b.at ? -1 : 1; }); photoState = 'ok'; redrawBody(); };
      q.onerror = function () { photoState = 'err'; redrawBody(); };
    });
  }
  function photosClear() { dbOpen(function (e, db) { if (!e) try { db.transaction('photos', 'readwrite').objectStore('photos').clear(); } catch (x) {} }); photos = []; ui.cmp = []; }
  function addPhoto(file) {
    if (!/^image\//.test(file.type)) return toast('Escolha um arquivo de imagem.', true);
    if (photos.length >= 60) return toast('Limite de 60 fotos. Exclua alguma antes.', true);
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var s = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        var rec = { id: uid(), day: today(), at: new Date().toISOString(), url: c.toDataURL('image/jpeg', 0.75) };
        dbOpen(function (e, db) {
          if (e) return toast('Seu navegador não permite guardar fotos aqui.', true);
          var tx = db.transaction('photos', 'readwrite'); tx.objectStore('photos').put(rec);
          tx.oncomplete = function () { photos.push(rec); AW.render(); toast('Foto salva'); };
          tx.onerror = function () { toast('Não consegui salvar a foto.', true); };
        });
      };
      img.onerror = function () { toast('Não consegui abrir essa imagem.', true); };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  document.addEventListener('change', function (ev) { var t = ev.target; if (t && t.id === 'ph-file' && t.files && t.files[0]) { addPhoto(t.files[0]); t.value = ''; } });
  function weightAt(day) { var r = null; W.body.forEach(function (b) { if (b.kg && b.d <= day) r = b.kg; }); return r; }
  AW.handlers['ph-sel'] = function (el) {
    var id = el.getAttribute('data-id'), i = ui.cmp.indexOf(id);
    if (i >= 0) ui.cmp.splice(i, 1); else { ui.cmp.push(id); if (ui.cmp.length > 2) ui.cmp.shift(); }
    ui.confirm = null; AW.render();
  };
  AW.handlers['ph-del'] = function (el) {
    var id = el.getAttribute('data-id'); if (ui.confirm !== 'p' + id) { ui.confirm = 'p' + id; AW.render(); return; }
    ui.confirm = null; photos = photos.filter(function (p) { return p.id !== id; }); ui.cmp = ui.cmp.filter(function (x) { return x !== id; });
    dbOpen(function (e, db) { if (!e) try { db.transaction('photos', 'readwrite').objectStore('photos').delete(id); } catch (x) {} }); AW.render();
  };
  function photosPanel() {
    if (photoState === 'idle') photosLoad();
    var body = '';
    if (photoState === 'err') return panel('Fotos de progresso', '<p class="dim" style="margin:0">Seu navegador não permite guardar fotos neste modo (talvez navegação privada).</p>');
    body += '<label class="btn ghost small" for="ph-file" style="width:auto;display:inline-block;cursor:pointer">+ Adicionar foto</label><input id="ph-file" type="file" accept="image/*" hidden>';
    if (photoState === 'loading') body += '<p class="help">Carregando…</p>';
    if (photoState === 'ok' && !photos.length) body += '<p class="help">Tire fotos de frente, de lado e de costas sempre com a mesma luz e distância. Toque em duas fotos para compará-las.</p>';
    if (photos.length) {
      body += '<div class="ph-grid">' + photos.slice().reverse().map(function (p) { var s = ui.cmp.indexOf(p.id); return '<button type="button" class="' + (s >= 0 ? 'sel' : '') + '" data-act="ph-sel" data-id="' + p.id + '" aria-label="Foto de ' + dmk(p.day) + '"><img src="' + p.url + '" alt="Foto de progresso de ' + dmk(p.day) + '"><span>' + dmk(p.day) + '</span></button>'; }).join('') + '</div>';
      var sel = ui.cmp.map(function (id) { return photos.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean).sort(function (a, b) { return a.at < b.at ? -1 : 1; });
      if (sel.length) body += '<div class="ph-cmp">' + sel.map(function (p, i) { var kg = weightAt(p.day); return '<div><img src="' + p.url + '" alt="Foto de ' + dmk(p.day) + '"><b>' + (sel.length === 2 ? (i ? 'Depois' : 'Antes') + ' · ' : '') + dmk(p.day) + '</b><span>' + (kg ? fmt(kg) + ' kg' : '') + '</span><button type="button" class="mini" data-act="ph-del" data-id="' + p.id + '">' + (ui.confirm === 'p' + p.id ? 'Confirmar exclusão' : 'Excluir') + '</button></div>'; }).join('') + '</div>';
      body += '<p class="help">As fotos ficam só neste navegador e não entram no backup. Se limpar os dados do site, elas se perdem.</p>';
    }
    return panel('Fotos de progresso', body);
  }

  /* ------------------------------ ferramentas ------------------------------ */
  function plateCalc(target, bar) {
    var side = (target - bar) / 2; if (side < 0) return { err: 'A carga é menor que a barra (' + fmt(bar) + ' kg).' };
    var out = [], rem = Math.round(side * 100) / 100;
    [25, 20, 15, 10, 5, 2.5, 1.25].forEach(function (p) { var n = Math.floor(rem / p + 1e-9); if (n > 0) { out.push([p, n]); rem = Math.round((rem - n * p) * 100) / 100; } });
    return { out: out, left: rem, got: Math.round((target - 2 * rem) * 100) / 100 };
  }
  AW.handlers['rm-calc'] = function () {
    var kg = num('rm-kg'), r = num('rm-reps');
    if (!kg || kg <= 0 || kg > 1000) return toast('Informe uma carga válida (kg).', true);
    if (!r || r < 1 || r > 30 || r !== Math.round(r)) return toast('Repetições: um número inteiro de 1 a 30.', true);
    ui.rm = { kg: kg, reps: r }; AW.render();
  };
  AW.handlers['pl-calc'] = function () {
    var kg = num('pl-kg'); if (!kg || kg <= 0 || kg > 1000) return toast('Informe a carga total (kg).', true);
    ui.plate = { kg: kg }; AW.render();
  };
  AW.handlers['pl-bar'] = function (el) { var k = num('pl-kg'); ui.bar = Number(el.getAttribute('data-id')); if (ui.plate && k) ui.plate.kg = k; AW.render(); };
  function toolsTab() {
    var html = '', r = ui.rm;
    var res = '';
    if (r) {
      var ep = r.kg * (1 + r.reps / 30), br = r.reps < 37 ? r.kg * 36 / (37 - r.reps) : ep, rm = r.reps === 1 ? r.kg : (ep + br) / 2;
      var pcts = [[100, 1], [95, 2], [90, 4], [85, 6], [80, 8], [75, 10], [70, 12], [65, 15], [60, 20]];
      res = '<div class="wk-tiles" style="margin-top:12px">' + tile(fmt(rm) + ' kg', '1RM estimado') + '</div><p class="label" style="margin-top:12px">CARGAS PELA PORCENTAGEM</p><div class="wk-list">' + pcts.map(function (x) { return '<div><b>' + x[0] + '%</b><span>' + fmt(r05(rm * x[0] / 100)) + ' kg</span><small>cerca de ' + x[1] + ' ' + (x[1] === 1 ? 'repetição' : 'repetições') + '</small></div>'; }).join('') + '</div>' +
        '<p class="help">Estimativa pela média das fórmulas de Epley e Brzycki. Quanto menos repetições você usar (até ~10), mais precisa. Não teste 1RM real sem parceiro de segurança.</p>';
    }
    html += panel('Calculadora de 1RM', '<p class="help" style="margin:0 0 10px">Informe uma série que você fez perto da falha e veja sua carga máxima estimada.</p><div class="wk-grid"><div><p class="label">CARGA (KG)</p><input id="rm-kg" class="input" type="number" inputmode="decimal" step="0.5" value="' + (r ? r.kg : '') + '"></div><div><p class="label">REPETIÇÕES</p><input id="rm-reps" class="input" type="number" inputmode="numeric" value="' + (r ? r.reps : '') + '"></div></div><div style="margin-top:12px"><button class="btn" data-act="rm-calc">Calcular</button></div>' + res);
    var pc = ui.plate, pr = '';
    if (pc) {
      var c = plateCalc(pc.kg, ui.bar);
      if (c.err) pr = '<p style="color:var(--danger);margin:12px 0 0">' + esc(c.err) + '</p>';
      else pr = '<p class="label" style="margin-top:12px">EM CADA LADO DA BARRA</p>' + (c.out.length ? '<div class="discs">' + c.out.map(function (o) { var s = ''; for (var i = 0; i < o[1]; i++) s += '<i class="disc d' + String(o[0]).replace('.', '_') + '">' + o[0] + '</i>'; return s; }).join('') + '</div><p style="margin:8px 0 0;font-weight:700">' + c.out.map(function (o) { return o[1] + ' × ' + fmt(o[0]) + ' kg'; }).join(' + ') + '</p>' : '<p style="margin:8px 0 0">Só a barra.</p>') +
        (c.left > 0 ? '<p class="help">Com anilhas de 1,25 a 25 kg o mais próximo é <b>' + fmt(c.got) + ' kg</b> (faltam ' + fmt(c.left * 2) + ' kg para ' + fmt(pc.kg) + ' kg).</p>' : '<p class="help">Total exato: ' + fmt(pc.kg) + ' kg (barra de ' + fmt(ui.bar) + ' kg + anilhas).</p>');
    }
    html += panel('Anilhas na barra', '<p class="help" style="margin:0 0 10px">Digite a carga total e veja quais anilhas colocar em cada lado.</p><p class="label">PESO DA BARRA</p><div class="row">' + [20, 15, 10, 5].map(function (b) { return chip(b + ' kg', ui.bar === b, 'data-act="pl-bar" data-id="' + b + '"'); }).join('') + '</div><p class="label" style="margin-top:12px">CARGA TOTAL (KG)</p><input id="pl-kg" class="input" type="number" inputmode="decimal" step="0.5" value="' + (pc ? pc.kg : '') + '"><div style="margin-top:12px"><button class="btn" data-act="pl-calc">Calcular anilhas</button></div>' + pr);
    return html;
  }

  /* view principal */
  AW.views['#/workout'] = function () {
    if (W.active) return sessionView();
    if (ui.doneId) { var d = doneView(); if (d) return d; }
    var html = '<div class="between"><h1 class="screen-title">TREINO</h1></div>';
    if (!W.profile) return html + profileForm(false);
    if (ui.builder) return builderView();
    if (ui.bodyOpen) return html + profileForm(true);
    var tabs = [['inicio', 'Início'], ['plano', 'Plano'], ['treinos', 'Treinos'], ['progresso', 'Progresso'], ['imc', 'IMC'], ['corpo', 'Corpo'], ['ferr', 'Ferramentas']];
    html += '<div class="row" style="margin-bottom:14px">' + tabs.map(function (t) { return chip(t[1], ui.tab === t[0], 'data-act="wk-tab" data-id="' + t[0] + '"'); }).join('') + '</div>';
    return html + (ui.tab === 'treinos' ? libraryTab() : ui.tab === 'progresso' ? progressTab() : ui.tab === 'corpo' ? bodyTab() : ui.tab === 'imc' ? imcTab() : ui.tab === 'plano' ? planTab() : ui.tab === 'ferr' ? toolsTab() : homeTab());
  };
})();
