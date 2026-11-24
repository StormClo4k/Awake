/* Awakening — emblema animado de cada rank (global `RankFx`).
   Cada rank tem uma identidade própria: cor (vem de Domain.RANKS) e efeito.
   E Brasa · D Broto · C Aço · B Órbita · A Chama · S Raio · SS Aurora · SSS Holograma · MONARCA Coroa de luz
   Todas as classes começam com "rx-" (estilos em styles.css). Respeita "animações reduzidas" porque o CSS global já zera animation. */
(function () {
  'use strict';

  var SECOND = ['#CBD5E1', '#A7F3D0', '#00D4FF', '#DDD6FE', '#FDE68A', '#FECACA', '#F9A8D4', '#F0ABFC', '#FFF1C2']; /* cor de apoio de cada rank */
  var NAMES = ['Brasa', 'Broto', 'Aço', 'Órbita', 'Chama', 'Raio', 'Aurora', 'Holograma', 'Coroa de luz'];
  var SPARKS = [1, 4, 4, 3, 9, 3, 0, 4, 10];
  var uid = 0;

  function hex(r, rot) {
    var o = [];
    for (var k = 0; k < 6; k++) { var a = (rot - 90 + 60 * k) * Math.PI / 180; o.push((50 + Math.cos(a) * r).toFixed(1) + ',' + (50 + Math.sin(a) * r).toFixed(1)); }
    return o.join(' ');
  }
  function star(x, y, s, d) {
    return '<polygon class="rx-fx rx-twk" style="animation-delay:' + d + 's" points="' + x + ',' + (y - s) + ' ' + (x + s * .25) + ',' + (y - s * .25) + ' ' + (x + s) + ',' + y + ' ' + (x + s * .25) + ',' + (y + s * .25) + ' ' + x + ',' + (y + s) + ' ' + (x - s * .25) + ',' + (y + s * .25) + ' ' + (x - s) + ',' + y + ' ' + (x - s * .25) + ',' + (y - s * .25) + '" fill="#fff"/>';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /** HTML do emblema do rank `i` (0 = E … 8 = MONARCA). `color` e `emblem` vêm de Domain.RANKS. */
  function badge(i, color, emblem, label) {
    i = Math.max(0, Math.min(8, i | 0));
    var c = color, c2 = SECOND[i], id = 'rx' + (++uid), clip = 'url(#' + id + 'c)';
    var back = '', front = '', haloDur = '2.8s', hexCls = '', hexFill = c + '22', k;

    if (i === 0) {
      back = '<circle class="rx-orbit" style="animation-duration:60s" cx="50" cy="50" r="44" fill="none" stroke="' + c + '" stroke-width="1" stroke-dasharray="2 8" opacity=".4"/>';
      haloDur = '4.5s'; hexCls = 'rx-flick';
    } else if (i === 1) {
      for (k = 0; k < 3; k++) back += '<circle class="rx-fx rx-rip" style="animation-delay:' + (k * 1.2) + 's" cx="50" cy="50" r="34" fill="none" stroke="' + c + '" stroke-width="1.5"/>';
    } else if (i === 2) {
      back = '<circle class="rx-orbit" cx="50" cy="50" r="45" fill="none" stroke="' + c + '" stroke-width="1.2" stroke-dasharray="3 7" opacity=".7"/>' +
        '<circle class="rx-orbit rx-rev" style="animation-duration:24s" cx="50" cy="50" r="41" fill="none" stroke="' + c2 + '" stroke-width="1" stroke-dasharray="14 10" opacity=".45"/>';
      front = '<polygon class="rx-sweep" points="30,0 44,0 34,100 20,100" fill="#fff" opacity=".28" clip-path="' + clip + '"/>';
    } else if (i === 3) {
      back = '<circle cx="50" cy="50" r="44" fill="none" stroke="' + c + '" stroke-width=".8" opacity=".35"/>' +
        '<g class="rx-orbit" style="animation-duration:6s"><circle cx="50" cy="6" r="3.2" fill="' + c2 + '"/></g>' +
        '<g class="rx-orbit rx-rev" style="animation-duration:9s"><circle cx="50" cy="6" r="2.4" fill="' + c + '"/></g>' +
        '<g class="rx-orbit" style="animation-duration:13s"><circle cx="50" cy="6" r="2" fill="' + c2 + '" opacity=".8"/></g>';
    } else if (i === 4) {
      haloDur = '1.1s'; hexCls = 'rx-flick'; hexFill = c + '30';
      back = '<circle class="rx-orbit" style="animation-duration:20s" cx="50" cy="50" r="44" fill="none" stroke="' + c + '" stroke-width="1" stroke-dasharray="1 5" opacity=".6"/>';
    } else if (i === 5) {
      haloDur = '1.3s'; hexFill = c + '30';
      var B = ['M50 14 L45 8 L52 5 L46 -2', 'M77 31 L83 28 L81 22 L89 19', 'M77 65 L84 66 L81 72 L90 76', 'M50 82 L55 90 L48 93 L53 101', 'M19 65 L12 66 L15 72 L6 76', 'M19 31 L13 28 L16 22 L8 19'];
      for (k = 0; k < 6; k++) back += '<path class="rx-bolt" style="animation-delay:' + (k * .37).toFixed(2) + 's" d="' + B[k] + '" fill="none" stroke="' + c2 + '" stroke-width="1.8" stroke-linejoin="round"/>';
    } else if (i === 6) {
      back = '<circle class="rx-orbit" style="animation-duration:8s" cx="50" cy="50" r="45" fill="none" stroke="url(#' + id + 'g)" stroke-width="2.2" stroke-dasharray="70 22"/>' +
        '<g class="rx-orbit rx-rev" style="animation-duration:22s"><polygon points="' + hex(37, 30) + '" fill="none" stroke="url(#' + id + 'g)" stroke-width="1.2" opacity=".7"/></g>';
      front = star(22, 24, 5, 0) + star(82, 30, 4, .7) + star(78, 76, 5, 1.3) + star(20, 70, 4, 1.9);
    } else if (i === 7) {
      hexCls = 'rx-flick';
      back = '<circle class="rx-orbit" style="animation-duration:10s" cx="50" cy="50" r="46" fill="none" stroke="' + c + '" stroke-width="1" stroke-dasharray="2 6"/>' +
        '<circle class="rx-orbit rx-rev" style="animation-duration:14s" cx="50" cy="50" r="42" fill="none" stroke="' + c2 + '" stroke-width="1" stroke-dasharray="18 10" opacity=".6"/>' +
        '<polygon class="rx-glitch" points="' + hex(34, 0) + '" fill="none" stroke="' + c2 + '" stroke-width="1.4" opacity=".7"/>' +
        '<polygon class="rx-glitch" style="animation-delay:.12s" points="' + hex(34, 0) + '" fill="none" stroke="#fff" stroke-width="1" opacity=".5"/>';
      front = '<rect class="rx-scan" x="14" y="16" width="72" height="5" fill="' + c + '" opacity=".4" clip-path="' + clip + '"/>';
    } else {
      var L = '';
      for (k = 0; k < 12; k++) {
        var a = k * 30 * Math.PI / 180, r2 = k % 2 ? 48 : 54;
        L += '<line x1="' + (50 + Math.cos(a) * 40).toFixed(1) + '" y1="' + (50 + Math.sin(a) * 40).toFixed(1) + '" x2="' + (50 + Math.cos(a) * r2).toFixed(1) + '" y2="' + (50 + Math.sin(a) * r2).toFixed(1) + '" stroke="' + c + '" stroke-width="' + (k % 2 ? 1.2 : 2) + '" stroke-linecap="round"/>';
      }
      back = '<g class="rx-orbit" style="animation-duration:30s" opacity=".6">' + L + '</g>' +
        '<circle class="rx-orbit rx-rev" style="animation-duration:18s" cx="50" cy="50" r="46" fill="none" stroke="' + c2 + '" stroke-width="1" stroke-dasharray="4 6" opacity=".6"/>' +
        '<polygon points="' + hex(39, 0) + '" fill="none" stroke="' + c + '" stroke-width="1" opacity=".5"/>';
      front = '<polygon class="rx-sweep" points="30,0 44,0 34,100 20,100" fill="#fff" opacity=".4" clip-path="' + clip + '"/>';
      hexFill = c + '38'; haloDur = '2.2s';
    }

    /* faíscas subindo (posições em % para o emblema poder encolher em telas pequenas) */
    var sparks = '';
    for (k = 0; k < SPARKS[i]; k++) {
      var sz = 4 + (k % 2), sx = 18 + ((k * 47) % 86), sy = 56 + ((k * 29) % 50);
      sparks += '<span class="rx-spark" style="left:' + (sx / 1.3).toFixed(1) + '%;top:' + (sy / 1.3).toFixed(1) + '%;width:' + sz + 'px;height:' + sz + 'px;background:' + (k % 2 ? c2 : c) +
        ';animation-duration:' + ((i === 4 ? 2.2 : 3.6) + (k % 3) * .6).toFixed(1) + 's;animation-delay:' + ((k * .55) % 3.4).toFixed(2) + 's;--dx:' + ((k % 3) - 1) * 8 + 'px"></span>';
    }

    var fs = i === 8 ? 34 : emblem.length > 2 ? 16 : emblem.length > 1 ? 21 : 28; /* a fonte Orbitron é larga: letras longas encolhem */
    var svg = '<svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label="' + esc(label || NAMES[i]) + '" style="position:relative;overflow:visible;display:block">' +
      '<defs><clipPath id="' + id + 'c"><polygon points="' + hex(34, 0) + '"/></clipPath>' +
      '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EC4899"/><stop offset=".5" stop-color="#A855F7"/><stop offset="1" stop-color="#22D3EE"/></linearGradient></defs>' +
      '<circle class="rx-fx rx-burst" cx="50" cy="50" r="34" fill="none" stroke="' + c2 + '" stroke-width="2"/><circle class="rx-fx rx-burst rx-b2" cx="50" cy="50" r="34" fill="none" stroke="' + c + '" stroke-width="2"/>' +
      back +
      '<polygon class="rx-halo" style="animation-duration:' + haloDur + '" points="' + hex(36, 0) + '" fill="none" stroke="' + c + '" stroke-width="6" opacity=".3" stroke-linejoin="round"/>' +
      '<polygon class="' + hexCls + '" points="' + hex(34, 0) + '" fill="' + hexFill + '" stroke="' + c + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<polygon points="' + hex(24, 0) + '" fill="none" stroke="' + c + '" stroke-width="1" opacity=".6"/>' + front +
      '<text class="rx-fx ' + (i === 0 || i === 7 ? 'rx-flick' : 'rx-beat') + '" x="50" y="' + (50 + fs * .35).toFixed(1) + '" text-anchor="middle" font-size="' + fs + '" font-weight="500" fill="' + c + '" style="font-family:var(--display)">' + esc(emblem) + '</text></svg>';

    return '<div class="rx-badge">' + sparks + svg + '</div>';
  }

  window.RankFx = { badge: badge, name: function (i) { return NAMES[i] || ''; } };
})();
