/* Awakening — visual da loja de aparência (global `Cosmetics`).
   Catálogo, preços e regras ficam em domain.js (Domain.COSMETICS). Aqui ficam só o desenho:
   selos em SVG, miniaturas dos cartões da loja e a prévia do painel. Os estilos estão em styles.css (fr-*, sl-*, skin-*, cz-*). */
(function () {
  'use strict';

  var FLAME = 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z';
  var SKIN_ACCENT = { monarca: '#b57bff' }; /* estilo que troca a cor da janela */

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hex(r) { var o = []; for (var k = 0; k < 6; k++) { var a = (-90 + 60 * k) * Math.PI / 180; o.push((22 + Math.cos(a) * r).toFixed(1) + ',' + (22 + Math.sin(a) * r).toFixed(1)); } return o.join(' '); }
  function star(r1, r2) { var o = []; for (var k = 0; k < 10; k++) { var a = (-90 + 36 * k) * Math.PI / 180, r = k % 2 ? r2 : r1; o.push((22 + Math.cos(a) * r).toFixed(1) + ',' + (22 + Math.sin(a) * r).toFixed(1)); } return o.join(' '); }
  function svg(inner) { return '<svg viewBox="0 0 44 44" aria-hidden="true">' + inner + '</svg>'; }

  /** Selo (emblema pequeno no canto da foto). `streak` só é usado no selo da sequência. */
  function seal(id, streak) {
    if (!id) return '';
    var g = '';
    switch (id) {
      case 'veterano':
        g = svg('<path d="M22 3 L38 9 V22 C38 31 31 38 22 41 C13 38 6 31 6 22 V9 Z" fill="#0b1428" stroke="#cbd5e1" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M14 17 L22 23 L30 17 M14 24 L22 30 L30 24" fill="none" stroke="#cbd5e1" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'); break;
      case 'raio':
        g = svg('<polygon points="' + hex(19) + '" fill="#06202e" stroke="#00d4ff" stroke-width="2" stroke-linejoin="round"/><path class="bolt" d="M25 8 L14 24 H21 L19 36 L31 19 H24 Z" fill="#00d4ff"/>'); break;
      case 'estrela':
        g = svg('<circle cx="22" cy="22" r="19" fill="#2b1d00" stroke="#ffd166" stroke-width="2"/><polygon class="glint" points="' + star(12.5, 5.2) + '" fill="#ffd166" stroke="#b8860b" stroke-width=".8" stroke-linejoin="round"/>'); break;
      case 'chama':
        g = svg('<circle cx="22" cy="22" r="19" fill="#2a0e00" stroke="#ff7a1a" stroke-width="2"/><g transform="translate(8.5 8.5) scale(1.12)"><path class="fl" d="' + FLAME + '" fill="#ff7a1a" stroke="#ffd166" stroke-width="1.2" stroke-linejoin="round"/></g>'); break;
      case 'sequencia':
        g = svg('<circle cx="22" cy="22" r="19" fill="#2a0e00" stroke="#ff7a1a" stroke-width="2"/><g transform="translate(11 5) scale(.92)"><path class="fl" d="' + FLAME + '" fill="#ff7a1a" stroke="#ffd166" stroke-width="1.3" stroke-linejoin="round"/></g>' +
          '<text x="22" y="37" text-anchor="middle" font-size="' + (String(streak || 0).length > 2 ? 10 : 13) + '" font-weight="900" fill="#ffd166" style="font-family:var(--display)">' + esc(streak || 0) + '</text>'); break;
      case 'coroa':
        g = svg('<circle cx="22" cy="22" r="19" fill="#2b1d00" stroke="#ffd166" stroke-width="2"/><path d="M11 30 L9 15 L17 21 L22 11 L27 21 L35 15 L33 30 Z" fill="#ffd166" stroke="#b8860b" stroke-width="1.2" stroke-linejoin="round"/>' +
          '<rect x="11" y="31" width="22" height="3.2" rx="1" fill="#b8860b"/><circle class="glint" cx="22" cy="11" r="2" fill="#fff"/>'); break;
      case 'olho':
        g = svg('<polygon points="22,2 41,22 22,42 3,22" fill="#12072a" stroke="#a855f7" stroke-width="2" stroke-linejoin="round"/>' +
          '<g class="eye"><path d="M8 22 Q22 11 36 22 Q22 33 8 22 Z" fill="#1c0d3a" stroke="#c084fc" stroke-width="1.4"/><circle cx="22" cy="22" r="5.2" fill="#a855f7"/><circle cx="22" cy="22" r="2.2" fill="#07030f"/><circle cx="23.6" cy="20.4" r="1" fill="#fff"/></g>'); break;
      default: return '';
    }
    return '<div class="sp-seal sl-' + id + '" title="Selo">' + g + '</div>';
  }

  function isFx(id) { return !!(id && window.FrameFx && FrameFx.has(id)); }
  function frameCls(id) { return id ? ' fr-' + id + (isFx(id) ? ' fr-fx' : '') : ''; }
  /** Canvas da moldura animada (vazio nas molduras simples de CSS). */
  function frameFx(id) { return isFx(id) ? FrameFx.html(id) : ''; }
  function skinCls(id) { return id ? ' skin-' + id : ''; }
  function skinAccent(id) { return SKIN_ACCENT[id] || null; }
  /** Camada animada do estilo (fica atrás do conteúdo do painel). */
  function skinFx(id) { return id ? '<div class="sk-fx" aria-hidden="true"><i></i><i></i><i></i></div>' : ''; }

  function silhouette() { return '<svg class="cz-sil" viewBox="0 0 60 80" aria-hidden="true"><circle cx="30" cy="29" r="13"/><path d="M5 80 C5 58 17 49 30 49 C43 49 55 58 55 80 Z"/></svg>'; }
  function photo(av) { return av ? '<img src="' + av + '" alt="" draggable="false">' : silhouette(); }

  /** Foto com moldura e selo (usada nas miniaturas e na prévia). */
  function photoBlock(look, o) {
    return '<div class="sp-r"><div class="sp-fr' + frameCls(look.frame) + '">' + frameFx(look.frame) + '<div class="sp-in">' + photo(o.avatar) + '</div></div>' + seal(look.seal, o.streak) +
      (o.nv ? '<div class="sp-nv">NV ' + o.nv + '</div>' : '') + '</div>';
  }

  /** Miniatura de um cartão da loja. `cat`: frame | seal | skin; `id` vazio = padrão. */
  function thumb(cat, id, o) {
    var c = o.color, look = { frame: null, seal: null, skin: null };
    if (cat === 'frame') { look.frame = id || null; return '<div class="cz-th cz-th-frame sp" style="--c:' + c + '">' + photoBlock(look, o) + '</div>'; }
    if (cat === 'seal') {
      look.seal = id || null;
      return '<div class="cz-th cz-th-seal sp" style="--c:' + c + '"><div class="sp-r"><div class="sp-fr"><div class="sp-in">' + photo(o.avatar) + '</div></div>' + seal(id, o.streak) + '</div></div>';
    }
    return '<div class="cz-th cz-th-skin"><section class="panel' + skinCls(id) + '" style="--ac:' + (skinAccent(id) || c) + '"><div class="panel-in">' + skinFx(id) +
      '<div class="cz-mini"><b style="color:' + (skinAccent(id) || c) + '">STATUS</b><i></i><i style="width:62%"></i><div class="cz-mini-bar"><u></u></div></div></div></section></div>';
  }

  /** Prévia compacta do painel com a aparência escolhida. */
  function preview(look, o) {
    var D = window.Domain, nm = function (id) { var c = id && D.cosmeticById(id); return c ? c.name : 'Padrão'; };
    var ac = skinAccent(look.skin) || o.color;
    return '<section class="panel cz-pv-panel' + skinCls(look.skin) + '" style="--ac:' + ac + '"><div class="panel-in">' + skinFx(look.skin) +
      '<div class="sp cz-pv" style="--c:' + o.color + '">' + photoBlock(look, o) +
      '<div class="cz-pv-i"><div class="sp-k">' + (o.trying ? 'PRÉVIA' : 'SUA APARÊNCIA') + '</div><div class="sp-n">' + esc(o.name) + '</div>' +
      '<dl><dt>Moldura</dt><dd>' + esc(nm(look.frame)) + '</dd><dt>Selo</dt><dd>' + esc(nm(look.seal)) + '</dd><dt>Painel</dt><dd>' + esc(nm(look.skin)) + '</dd></dl></div></div></div></section>';
  }

  window.Cosmetics = { seal: seal, frameCls: frameCls, frameFx: frameFx, skinCls: skinCls, skinAccent: skinAccent, skinFx: skinFx, thumb: thumb, preview: preview, photoBlock: photoBlock };
})();
