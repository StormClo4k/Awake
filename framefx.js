/* Awakening — molduras animadas de alta qualidade (global `FrameFx`).
   Desenhadas em <canvas> por cima da foto, estendendo-se para fora dela (como as molduras de perfil da Steam):
   · inferno / arcano  → fogo de partículas (additive blending, turbulência, faíscas)
   · tempestade        → raios que saltam da borda + borda elétrica crepitante
   · ferro / runico    → ferro negro escovado com rebites; luz que percorre a borda (e brasas/rachaduras no rúnico)
   Um único laço requestAnimationFrame cuida de todos os canvases visíveis. Respeita "animações reduzidas". */
(function () {
  'use strict';

  var DPR = Math.min(2, window.devicePixelRatio || 1), TAU = Math.PI * 2;
  /* ix = margem lateral (fração da largura da moldura); it / ib = margem de cima / de baixo (fração da altura) */
  var CFG = {
    inferno: { kind: 'fire', ramp: 'inferno', ix: .14, it: .30, ib: .08, spark: '#ffe9a8' },
    arcano: { kind: 'fire', ramp: 'arcano', ix: .14, it: .32, ib: .08, spark: '#ffc4ef' },
    tempestade: { kind: 'bolt', ix: .13, it: .17, ib: .10 },
    ferro: { kind: 'iron', ix: .11, it: .09, ib: .08, band: .065, light: [125, 249, 255] },
    runico: { kind: 'iron', ix: .11, it: .15, ib: .08, band: .065, light: [255, 150, 60], cracks: true, embers: true }
  };
  var RAMPS = {
    inferno: [[0, [255, 236, 170]], [.09, [255, 176, 54]], [.28, [255, 108, 22]], [.52, [226, 48, 20]], [.82, [110, 22, 12]], [1, [34, 8, 4]]],
    arcano: [[0, [255, 244, 176]], [.16, [255, 179, 71]], [.36, [255, 95, 168]], [.62, [170, 64, 255]], [.86, [64, 22, 120]], [1, [22, 6, 44]]]
  };
  var RN = 22, SPR = {};

  function rampColor(ramp, t) {
    for (var i = 1; i < ramp.length; i++) if (t <= ramp[i][0]) {
      var a = ramp[i - 1], b = ramp[i], k = (t - a[0]) / (b[0] - a[0] || 1);
      return [a[1][0] + (b[1][0] - a[1][0]) * k, a[1][1] + (b[1][1] - a[1][1]) * k, a[1][2] + (b[1][2] - a[1][2]) * k];
    }
    return ramp[ramp.length - 1][1];
  }
  function sprites(name) {
    if (SPR[name]) return SPR[name];
    var out = [];
    for (var i = 0; i < RN; i++) {
      var c = rampColor(RAMPS[name], i / (RN - 1)), cv = document.createElement('canvas'); cv.width = cv.height = 64;
      var x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32), s = Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]);
      g.addColorStop(0, 'rgba(' + s + ',1)'); g.addColorStop(.2, 'rgba(' + s + ',.85)'); g.addColorStop(.5, 'rgba(' + s + ',.3)'); g.addColorStop(1, 'rgba(' + s + ',0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64); out.push(cv);
    }
    return (SPR[name] = out);
  }
  function glowSprite(rgb) {
    var key = 'g' + rgb.join(); if (SPR[key]) return SPR[key];
    var cv = document.createElement('canvas'); cv.width = cv.height = 64; var x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32), s = rgb.join(',');
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(' + s + ',.9)'); g.addColorStop(.55, 'rgba(' + s + ',.22)'); g.addColorStop(1, 'rgba(' + s + ',0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (SPR[key] = cv);
  }

  /* ---------- geometria ---------- */
  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  /** n pontos igualmente espaçados no contorno de um retângulo arredondado, com a normal para fora. */
  function ring(x, y, w, h, r, n) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    var sw = w - 2 * r, sh = h - 2 * r, arc = Math.PI * r / 2, L = 2 * sw + 2 * sh + 4 * arc, out = [], i, d, a, p;
    for (i = 0; i < n; i++) {
      d = i / n * L;
      if (d < sw) p = { x: x + r + d, y: y, nx: 0, ny: -1 };
      else if ((d -= sw) < arc) { a = -Math.PI / 2 + d / arc * Math.PI / 2; p = { x: x + w - r + Math.cos(a) * r, y: y + r + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a) }; }
      else if ((d -= arc) < sh) p = { x: x + w, y: y + r + d, nx: 1, ny: 0 };
      else if ((d -= sh) < arc) { a = d / arc * Math.PI / 2; p = { x: x + w - r + Math.cos(a) * r, y: y + h - r + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a) }; }
      else if ((d -= arc) < sw) p = { x: x + w - r - d, y: y + h, nx: 0, ny: 1 };
      else if ((d -= sw) < arc) { a = Math.PI / 2 + d / arc * Math.PI / 2; p = { x: x + r + Math.cos(a) * r, y: y + h - r + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a) }; }
      else if ((d -= arc) < sh) p = { x: x, y: y + h - r - d, nx: -1, ny: 0 };
      else { d -= sh; a = Math.PI + d / arc * Math.PI / 2; p = { x: x + r + Math.cos(a) * r, y: y + r + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a) }; }
      out.push(p);
    }
    return out;
  }
  function layout(cv, cfg) {
    var par = cv.parentElement, cs = getComputedStyle(par), inn = par.querySelector('.sp-in'), ics = inn ? getComputedStyle(inn) : null;
    var cw = cv.clientWidth, ch = cv.clientHeight, W = cw / (1 + 2 * cfg.ix), H = ch / (1 + cfg.it + cfg.ib), s = W / 108;
    var pad = parseFloat(cs.paddingLeft) || 0, r = parseFloat(cs.borderTopLeftRadius) || 12, ir = ics ? parseFloat(ics.borderTopLeftRadius) || 0 : Math.max(0, r - pad);
    return { cw: cw, ch: ch, W: W, H: H, s: Math.max(.45, s), x0: cfg.ix * W, y0: cfg.it * H, pad: pad, r: r, ir: ir, key: cw + 'x' + ch + ':' + pad + ':' + r };
  }
  function clipOutsidePhoto(c, g) { /* tudo, menos a foto: a foto nunca é coberta */
    c.beginPath(); c.rect(0, 0, g.cw, g.ch); rr(c, g.x0 + g.pad, g.y0 + g.pad, g.W - 2 * g.pad, g.H - 2 * g.pad, g.ir); c.clip('evenodd');
  }

  /* ---------- fogo ---------- */
  function fireInit(st, g, cfg) {
    st.ring = ring(g.x0 + g.pad / 2, g.y0 + g.pad / 2, g.W - g.pad, g.H - g.pad, g.r - g.pad / 2, 160); st.cum = []; var t = 0;
    st.ring.forEach(function (p) { t += .2 + .8 * Math.pow(Math.max(0, -p.ny), .8) + .12 * Math.abs(p.nx); st.cum.push(t); }); st.wsum = t;
    if (!st.parts) { st.parts = []; for (var i = 0; i < 70; i++) fireStep(st, g, cfg, .016); }
  }
  function pickRing(st) { var r = Math.random() * st.wsum, lo = 0, hi = st.cum.length - 1; while (lo < hi) { var m = (lo + hi) >> 1; if (st.cum[m] < r) lo = m + 1; else hi = m; } return st.ring[lo]; }
  function fireStep(st, g, cfg, dt) {
    var s = g.s, parts = st.parts, i, p, big;
    st.acc = (st.acc || 0) + 640 * s * dt;
    while (st.acc >= 1 && parts.length < 1100) {
      st.acc--; p = pickRing(st); big = Math.random() < .13;
      parts.push({ x: p.x + p.nx * 1.2 * s, y: p.y + p.ny * 1.2 * s, vx: p.nx * (6 + Math.random() * 20) * s + (Math.random() - .5) * 10 * s, vy: -(big ? 46 + Math.random() * 50 : 70 + Math.random() * 120) * s + p.ny * 6 * s,
        age: 0, life: big ? .8 + Math.random() * .7 : .42 + Math.random() * .7, sz: (big ? 6 + Math.random() * 4.5 : 2.4 + Math.random() * 3.4) * s, seed: Math.random() * 100, spark: false });
    }
    st.sacc = (st.sacc || 0) + 18 * s * dt;
    while (st.sacc >= 1) { st.sacc--; p = pickRing(st); parts.push({ x: p.x, y: p.y, vx: (Math.random() - .5) * 44 * s + p.nx * 30 * s, vy: -(70 + Math.random() * 120) * s, age: 0, life: .5 + Math.random() * .9, sz: (.9 + Math.random() * 1.2) * s, seed: Math.random() * 100, spark: true }); }
    for (i = parts.length - 1; i >= 0; i--) {
      p = parts[i]; p.age += dt; if (p.age >= p.life) { parts.splice(i, 1); continue; }
      var t = p.age / p.life, sw = Math.sin(p.seed + p.age * 7.5 + p.y * .06) + .6 * Math.sin(p.seed * 1.7 + p.age * 13 + p.x * .09);
      p.vx += sw * 70 * s * dt * (.3 + t); p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .985;
      if (p.spark) p.vy += 24 * s * dt; else p.vy *= (1 - .25 * dt);
    }
  }
  function fireDraw(c, st, g, cfg, time) {
    var spr = sprites(cfg.ramp), parts = st.parts, i, p, t, a, w, len, sp, ang, cs, sn, cc = RAMPS[cfg.ramp], flick = .8 + .2 * Math.sin(time * 9) * Math.sin(time * 5.3 + 1), core = rampColor(cc, .1).map(Math.round), mid = rampColor(cc, .3).map(Math.round);
    c.save(); clipOutsidePhoto(c, g); c.globalCompositeOperation = 'lighter';
    /* halo e brasa na base da moldura */
    c.beginPath(); rr(c, g.x0 + g.pad / 2, g.y0 + g.pad / 2, g.W - g.pad, g.H - g.pad, g.r - g.pad / 2);
    c.lineWidth = 14 * g.s; c.strokeStyle = 'rgba(' + mid + ',' + (.1 * flick) + ')'; c.stroke();
    c.lineWidth = g.pad + 4 * g.s; c.strokeStyle = 'rgba(' + mid + ',' + (.4 * flick) + ')'; c.stroke();
    c.lineWidth = g.pad * .5 + 1; c.strokeStyle = 'rgba(' + core + ',' + (.42 * flick) + ')'; c.stroke();
    for (i = 0; i < parts.length; i++) {
      p = parts[i]; t = p.age / p.life;
      if (p.spark) { a = (1 - t) * (.6 + .4 * Math.sin(p.seed + p.age * 40)); c.globalAlpha = Math.max(0, a); c.fillStyle = cfg.spark; c.beginPath(); c.arc(p.x, p.y, p.sz, 0, TAU); c.fill(); continue; }
      a = Math.min(1, t * 7) * Math.pow(1 - t, 1.05) * .66 * Math.min(1, Math.max(0, p.y / (g.y0 * .85))) * Math.min(1, Math.max(0, p.x / (g.x0 * .7)), Math.max(0, (g.cw - p.x) / (g.x0 * .7))); sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      w = p.sz * (1 - t * .6); len = w * (2.3 + Math.min(3, sp / (55 * g.s)));
      ang = Math.atan2(p.vy, p.vx) + Math.PI / 2; cs = Math.cos(ang) * DPR; sn = Math.sin(ang) * DPR;
      c.globalAlpha = a; c.setTransform(cs, sn, -sn, cs, p.x * DPR, p.y * DPR);
      c.drawImage(spr[Math.min(RN - 1, (t * (RN - 1)) | 0)], -w, -len, w * 2, len * 2);
    }
    c.setTransform(DPR, 0, 0, DPR, 0, 0); c.restore();
  }

  /* ---------- raios ---------- */
  function jag(x0, y0, x1, y1, disp, depth) {
    var pts = [[x0, y0], [x1, y1]];
    for (var d = 0; d < depth; d++) {
      var nx = [pts[0]];
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1, o = (Math.random() - .5) * disp;
        nx.push([(a[0] + b[0]) / 2 - dy / len * o, (a[1] + b[1]) / 2 + dx / len * o], b);
      }
      pts = nx; disp *= .55;
    }
    return pts;
  }
  function boltInit(st, g) {
    st.outer = ring(g.x0 + g.pad / 2, g.y0 + g.pad / 2, g.W - g.pad, g.H - g.pad, g.r - g.pad / 2, 140); st.bolts = st.bolts || []; st.edge = null; st.edgeT = 0; st.next = 0; st.flash = 0;
  }
  function boltStep(st, g, time, dt) {
    var s = g.s, n = st.outer.length, i;
    st.flash = Math.max(0, st.flash - dt * 6);
    if (time >= st.next) {
      var k = Math.random() < .4 ? 2 : 1; st.next = time + .07 + Math.random() * .24;
      while (k--) {
        var a = (Math.random() * n) | 0, p0 = st.outer[a], pts, bulge = (9 + Math.random() * 14) * s;
        if (Math.random() < .5) { /* arco contornando a moldura */
          var span = 10 + ((Math.random() * 26) | 0), p1 = st.outer[(a + span) % n], line = jag(p0.x, p0.y, p1.x, p1.y, 14 * s, 5), nxm = (p0.nx + p1.nx) / 2, nym = (p0.ny + p1.ny) / 2, ln = Math.sqrt(nxm * nxm + nym * nym) || 1;
          pts = line.map(function (q, j) { var u = j / (line.length - 1), b = Math.sin(Math.PI * u) * bulge; return [q[0] + nxm / ln * b, q[1] + nym / ln * b]; });
        } else { /* salto para fora */
          var L = (20 + Math.random() * 30) * s, tx = -p0.ny * (Math.random() - .5) * L * .9, ty = p0.nx * (Math.random() - .5) * L * .9;
          pts = jag(p0.x, p0.y, p0.x + p0.nx * L + tx, p0.y + p0.ny * L + ty, 16 * s, 5);
        }
        var br = null;
        if (Math.random() < .4) { var m = pts[(pts.length / 2) | 0], tip = pts[pts.length - 1]; br = jag(m[0], m[1], m[0] + (tip[1] - m[1]) * .6 + (Math.random() - .5) * 8 * s, m[1] - (tip[0] - m[0]) * .6 + (Math.random() - .5) * 8 * s, 8 * s, 3); }
        st.bolts.push({ pts: pts, br: br, age: 0, life: .12 + Math.random() * .2, w: (1 + Math.random() * .9) * s }); st.flash = Math.min(1, st.flash + .55);
      }
    }
    for (i = st.bolts.length - 1; i >= 0; i--) { st.bolts[i].age += dt; if (st.bolts[i].age > st.bolts[i].life) st.bolts.splice(i, 1); }
    st.edgeT -= dt;
    if (st.edgeT <= 0 || !st.edge) { /* borda elétrica: refeita ~20 vezes por segundo */
      st.edgeT = .05; var pr = ring(g.x0 + g.pad / 2, g.y0 + g.pad / 2, g.W - g.pad, g.H - g.pad, g.r - g.pad / 2, Math.max(40, Math.round((g.W + g.H) * 2 / (5 * s))));
      st.edge = pr.map(function (q) { var j = (Math.random() - .5) * 3.2 * s + (Math.random() < .06 ? (Math.random() - .3) * 8 * s : 0); return [q.x + q.nx * j, q.y + q.ny * j]; });
    }
  }
  function poly(c, pts, close) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); if (close) c.closePath(); }
  function boltDraw(c, st, g, time) {
    var s = g.s, i, b, a;
    c.save(); clipOutsidePhoto(c, g); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
    /* brilho ambiente da borda */
    c.beginPath(); rr(c, g.x0 + g.pad / 2, g.y0 + g.pad / 2, g.W - g.pad, g.H - g.pad, g.r - g.pad / 2);
    c.lineWidth = g.pad + 5 * s; c.strokeStyle = 'rgba(40,150,255,' + (.16 + .14 * st.flash) + ')'; c.stroke(); c.lineWidth = g.pad * .7 + 1; c.strokeStyle = 'rgba(110,220,255,' + (.28 + .2 * st.flash) + ')'; c.stroke();
    /* borda crepitante */
    poly(c, st.edge, true); c.lineWidth = 4 * s; c.strokeStyle = 'rgba(60,170,255,.22)'; c.stroke(); c.lineWidth = 1.6 * s; c.strokeStyle = 'rgba(130,240,255,.85)'; c.stroke(); c.lineWidth = .7 * s; c.strokeStyle = 'rgba(255,255,255,.95)'; c.stroke();
    /* raios */
    for (i = 0; i < st.bolts.length; i++) {
      b = st.bolts[i]; a = (1 - b.age / b.life) * (Math.random() < .22 ? .45 : 1);
      [b.pts, b.br].forEach(function (pts, k) {
        if (!pts) return; var w = b.w * (k ? .6 : 1); poly(c, pts, false);
        c.lineWidth = w * 7; c.strokeStyle = 'rgba(40,140,255,' + .16 * a + ')'; c.stroke();
        c.lineWidth = w * 3; c.strokeStyle = 'rgba(110,225,255,' + .55 * a + ')'; c.stroke();
        c.lineWidth = w * 1.1; c.strokeStyle = 'rgba(255,255,255,' + a + ')'; c.stroke();
      });
    }
    c.restore();
  }

  /* ---------- ferro negro ---------- */
  function ironInit(st, g, cfg) {
    var e = cfg.band * g.W, T = e + g.pad; st.e = e; st.T = T;
    st.mid = ring(g.x0 - e + T / 2, g.y0 - e + T / 2, g.W + 2 * e - T, g.H + 2 * e - T, g.r + e - T / 2, 220);
    /* camada estática (metal, textura, rebites) desenhada uma vez por tamanho */
    var cv = document.createElement('canvas'); cv.width = g.cw * DPR; cv.height = g.ch * DPR; var c = cv.getContext('2d'); c.scale(DPR, DPR);
    var ox = g.x0 - e, oy = g.y0 - e, ow = g.W + 2 * e, oh = g.H + 2 * e, ix = g.x0 + g.pad, iy = g.y0 + g.pad, iw = g.W - 2 * g.pad, ih = g.H - 2 * g.pad, s = g.s;
    function band() { c.beginPath(); rr(c, ox, oy, ow, oh, g.r + e); rr(c, ix, iy, iw, ih, g.ir); }
    c.save(); band(); var gr = c.createLinearGradient(ox, oy, ox + ow, oy + oh);
    gr.addColorStop(0, '#5b6070'); gr.addColorStop(.12, '#14151b'); gr.addColorStop(.3, '#06060a'); gr.addColorStop(.46, '#4a4f60'); gr.addColorStop(.6, '#0a0a0f'); gr.addColorStop(.8, '#3a3e4c'); gr.addColorStop(1, '#050507');
    c.fillStyle = gr; c.fill('evenodd'); c.clip('evenodd');
    for (var i = 0; i < 420; i++) { c.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.16)'; c.fillRect(ox + Math.random() * ow, oy + Math.random() * oh, (6 + Math.random() * 26) * s, .6); }
    /* sulco central */
    c.beginPath(); rr(c, ox + T / 2, oy + T / 2, ow - T, oh - T, Math.max(0, g.r + e - T / 2)); c.lineWidth = 1.4; c.strokeStyle = 'rgba(0,0,0,.9)'; c.stroke(); c.translate(.8, .8); c.lineWidth = .9; c.strokeStyle = 'rgba(255,255,255,.22)'; c.stroke(); c.translate(-.7, -.7);
    c.restore();
    /* chanfro externo (luz de cima à esquerda) e interno (rebaixado) */
    var bg = c.createLinearGradient(ox, oy, ox + ow, oy + oh); bg.addColorStop(0, 'rgba(255,255,255,.5)'); bg.addColorStop(.5, 'rgba(255,255,255,.05)'); bg.addColorStop(1, 'rgba(0,0,0,.8)');
    c.beginPath(); rr(c, ox + .5, oy + .5, ow - 1, oh - 1, g.r + e); c.lineWidth = 1.2; c.strokeStyle = bg; c.stroke();
    var ig = c.createLinearGradient(ix, iy, ix + iw, iy + ih); ig.addColorStop(0, 'rgba(0,0,0,.9)'); ig.addColorStop(1, 'rgba(255,255,255,.35)');
    c.beginPath(); rr(c, ix - .5, iy - .5, iw + 1, ih + 1, g.ir); c.lineWidth = 1.6; c.strokeStyle = ig; c.stroke();
    /* rebites: 4 cantos + 4 meios de lado */
    var n = st.mid.length, iw2 = g.W - 2 * g.r, ih2 = g.H - 2 * g.r, arcL = Math.PI * (g.r + e - T / 2) / 2, tot = 2 * (iw2 + ih2) + 4 * arcL;
    var seq = [iw2 / 2, iw2 + arcL / 2, iw2 + arcL + ih2 / 2, iw2 + arcL + ih2 + arcL / 2, iw2 + 2 * arcL + ih2 + iw2 / 2, 2 * iw2 + 2 * arcL + ih2 + arcL / 2, 2 * iw2 + 3 * arcL + ih2 + ih2 / 2, 2 * iw2 + 3 * arcL + 2 * ih2 + arcL / 2];
    /* o anel começa em (x+r, y): o meio do lado de cima fica em iw2/2 */
    seq.forEach(function (d) { var p = st.mid[Math.round((d % tot) / tot * n) % n], rad = Math.max(1.8, T * .27), rg = c.createRadialGradient(p.x - rad * .3, p.y - rad * .3, 0, p.x, p.y, rad);
      rg.addColorStop(0, '#8a8f9e'); rg.addColorStop(.55, '#2a2d36'); rg.addColorStop(1, '#0a0a0d'); c.beginPath(); c.arc(p.x, p.y, rad, 0, TAU); c.fillStyle = rg; c.fill(); c.lineWidth = .8; c.strokeStyle = 'rgba(0,0,0,.85)'; c.stroke();
      c.beginPath(); c.arc(p.x - rad * .3, p.y - rad * .35, rad * .22, 0, TAU); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill(); });
    st.layer = cv;
    if (cfg.cracks) { /* rachaduras incandescentes cruzando a faixa */
      st.cr = []; for (var k = 0; k < 9; k++) { var p = st.mid[((k + Math.random() * .6) / 9 * n) | 0], pts = [[p.x - p.nx * T * .55, p.y - p.ny * T * .55]], len = T * (.9 + Math.random() * .5), tx = -p.ny, ty = p.nx, q;
        for (var j = 1; j <= 4; j++) { q = [p.x - p.nx * T * .55 + p.nx * len * j / 4 + tx * (Math.random() - .5) * T * .5, p.y - p.ny * T * .55 + p.ny * len * j / 4 + ty * (Math.random() - .5) * T * .5]; pts.push(q); }
        st.cr.push({ pts: pts, ph: Math.random() * 6 }); }
    }
    if (!st.parts) st.parts = [];
  }
  function ironDraw(c, st, g, cfg, time, dt) {
    var L = cfg.light, T = st.T, n = st.mid.length, s = g.s, i, k, p, a, glow = glowSprite(L), ls = L.join(',');
    c.drawImage(st.layer, 0, 0, g.cw, g.ch);
    c.save(); clipOutsidePhoto(c, g); c.globalCompositeOperation = 'lighter';
    /* luzes percorrendo a faixa (uma rápida, outra lenta em sentido oposto) */
    [[1 / 6.5, 1, 1], [-1 / 11, .5, .6]].forEach(function (cm) {
      var u = ((time * cm[0]) % 1 + 1) % 1, head = (u * n) | 0, tail = (n * .26) | 0;
      for (k = 0; k < tail; k += 2) { var idx = ((head - Math.sign(cm[0]) * k) % n + n) % n; p = st.mid[idx]; a = Math.pow(1 - k / tail, 2) * cm[1];
        c.globalAlpha = a * .9; var rr2 = T * (.75 - .3 * k / tail); c.drawImage(glow, p.x - rr2, p.y - rr2, rr2 * 2, rr2 * 2); }
      p = st.mid[head]; c.globalAlpha = cm[1]; var h2 = T * 1.5 * cm[2]; c.drawImage(glow, p.x - h2, p.y - h2, h2 * 2, h2 * 2);
    });
    /* fio de luz que respira na borda interna */
    var br = .38 + .27 * Math.sin(time * 2.2);
    c.globalAlpha = 1; c.beginPath(); rr(c, g.x0 + g.pad - .5, g.y0 + g.pad - .5, g.W - 2 * g.pad + 1, g.H - 2 * g.pad + 1, g.ir); c.lineWidth = 1.3 * Math.max(.8, s); c.strokeStyle = 'rgba(' + ls + ',' + br + ')'; c.stroke();
    c.lineWidth = 4 * s; c.strokeStyle = 'rgba(' + ls + ',' + br * .16 + ')'; c.stroke();
    if (cfg.cracks && st.cr) st.cr.forEach(function (cr) { var v = .45 + .55 * Math.pow(.5 + .5 * Math.sin(time * 1.6 + cr.ph), 1.5); poly(c, cr.pts, false); c.lineCap = 'round'; c.lineJoin = 'round';
      c.lineWidth = 4.5 * s; c.strokeStyle = 'rgba(' + ls + ',' + .2 * v + ')'; c.stroke(); c.lineWidth = 1.4 * s; c.strokeStyle = 'rgba(255,220,150,' + .9 * v + ')'; c.stroke(); });
    if (cfg.embers) {
      st.eacc = (st.eacc || 0) + 7 * s * dt; while (st.eacc >= 1) { st.eacc--; p = st.mid[(Math.random() * n) | 0]; st.parts.push({ x: p.x, y: p.y, vx: p.nx * 14 * s + (Math.random() - .5) * 10 * s, vy: -(24 + Math.random() * 50) * s, age: 0, life: .8 + Math.random() * 1.2, sz: (.9 + Math.random() * 1.2) * s, seed: Math.random() * 50 }); }
      for (i = st.parts.length - 1; i >= 0; i--) { p = st.parts[i]; p.age += dt; if (p.age > p.life) { st.parts.splice(i, 1); continue; }
        p.x += (p.vx + Math.sin(p.seed + p.age * 6) * 10 * s) * dt; p.y += p.vy * dt; var t = p.age / p.life; c.globalAlpha = (1 - t) * (.6 + .4 * Math.sin(p.seed + p.age * 30)); c.fillStyle = t < .5 ? '#ffd9a0' : '#ff8a30'; c.beginPath(); c.arc(p.x, p.y, p.sz * (1 - t * .5), 0, TAU); c.fill(); }
    }
    c.restore();
  }

  /* ---------- laço principal ---------- */
  var states = new WeakMap(), raf = 0, last = 0, idle = 0;
  function reduced() { return document.documentElement.getAttribute('data-motion') === 'reduced' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.getAttribute('data-motion') !== 'full'); }
  function frame(cv, now, dt, still) {
    var cfg = CFG[cv.getAttribute('data-fx')]; if (!cfg || !cv.clientWidth) return;
    var st = states.get(cv); if (!st) { st = {}; states.set(cv, st); }
    var g = layout(cv, cfg);
    if (st.key !== g.key) {
      st.key = g.key; cv.width = Math.round(g.cw * DPR); cv.height = Math.round(g.ch * DPR); st.ctx = cv.getContext('2d'); st.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      st.parts = null; st.bolts = null; st.drawn = false;
      if (cfg.kind === 'fire') fireInit(st, g, cfg); else if (cfg.kind === 'bolt') boltInit(st, g); else ironInit(st, g, cfg);
    }
    if (still && st.drawn) return;
    var c = st.ctx, time = now / 1000; c.clearRect(0, 0, g.cw, g.ch);
    if (cfg.kind === 'fire') { fireStep(st, g, cfg, dt); fireDraw(c, st, g, cfg, time); }
    else if (cfg.kind === 'bolt') { boltStep(st, g, time, dt); boltDraw(c, st, g, time); }
    else ironDraw(c, st, g, cfg, time, dt);
    st.drawn = true;
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (document.hidden) { last = now; return; }
    var dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    var list = document.querySelectorAll('canvas.fx-cv'), still = reduced(), vh = window.innerHeight, shown = 0;
    if (!list.length) { if (++idle > 120) { cancelAnimationFrame(raf); raf = 0; idle = 0; } return; }
    idle = 0;
    for (var i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect(); if (r.bottom < -40 || r.top > vh + 40) continue;
      try { frame(list[i], now, dt, still); shown++; } catch (e) { console.error(e); }
    }
  }
  function ensure() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }

  function html(id) {
    var c = CFG[id]; if (!c) return '';
    return '<canvas class="fx-cv" data-fx="' + id + '" aria-hidden="true" style="left:-' + (c.ix * 100) + '%;top:-' + (c.it * 100) + '%;width:' + ((1 + 2 * c.ix) * 100) + '%;height:' + ((1 + c.it + c.ib) * 100) + '%"></canvas>';
  }
  function has(id) { return !!CFG[id]; }

  window.FrameFx = { html: html, has: has, ensure: ensure };
  if (window.AW && AW.onRender) AW.onRender.push(ensure);
  ensure();
})();
