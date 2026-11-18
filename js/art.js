/* ==========================================================================
   art.js — placeholder illustrations. Every landmark is drawn in a
   900×520 box with the ground at y=520. Colours come from CSS variables
   that engine.js shifts from dawn to dusk, so everything re-lights itself.

   TO USE REAL ART: set `art: 'art/<id>/landmark.webp'` on the stop in
   data.js. engine.js then renders an <img> instead of the SVG below.
   The image must be a 900×520 (or 1800×1040) transparent cutout, ground
   at the bottom edge, so the hotspot percentages still line up.
   ========================================================================== */
window.Rome = window.Rome || {};
(function () {
  const S = 'var(--s)', HI = 'var(--s-hi)', LO = 'var(--s-lo)', INK = 'var(--ink)';

  const svg = (inner, cls = '') =>
    `<svg class="lm-svg ${cls}" viewBox="0 0 900 520" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${inner}</svg>`;

  // Arch opening path (for evenodd cut-outs)
  const archPath = (x, top, w, bottom) => {
    const r = w / 2;
    return `M${x},${bottom} L${x},${top + r} A${r},${r} 0 0 1 ${x + w},${top + r} L${x + w},${bottom} Z`;
  };
  // Column with capital and base
  const column = (cx, top, bottom, w, cls = '') =>
    `<g class="${cls}"><rect x="${cx - w / 2}" y="${top + 14}" width="${w}" height="${bottom - top - 24}" fill="${HI}"/>` +
    `<rect x="${cx - w / 2 + w * 0.62}" y="${top + 14}" width="${w * 0.38}" height="${bottom - top - 24}" fill="${S}"/>` +
    `<rect x="${cx - w / 2 - 6}" y="${top}" width="${w + 12}" height="14" fill="${S}"/>` +
    `<rect x="${cx - w / 2 - 5}" y="${bottom - 10}" width="${w + 10}" height="10" fill="${LO}"/></g>`;
  // Tiny person silhouette (feet at y)
  const person = (x, y, s = 1, fill = INK, extra = '') =>
    `<g transform="translate(${x},${y}) scale(${s})" fill="${fill}"><circle cx="0" cy="-58" r="8"/>` +
    `<path d="M-9,-48 h18 l4,28 h-6 l-2,20 h-5 l-1,-18 h-2 l-1,18 h-5 l-2,-20 h-6z"/>${extra}</g>`;
  const windows = (x0, y0, cols, rows, dx, dy, w, h) => {
    let o = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      o += `<rect x="${x0 + c * dx}" y="${y0 + r * dy}" width="${w}" height="${h}" fill="${LO}" opacity=".75"/>`;
    return o;
  };

  const L = {};

  L.popolo = () => {
    let o = '';
    // obelisk
    o += `<rect x="740" y="440" width="70" height="80" fill="${LO}"/><polygon points="758,440 792,440 786,110 764,110" fill="${S}"/><polygon points="764,110 786,110 775,86" fill="${HI}"/>`;
    // facade with central arch cut out
    o += `<path fill-rule="evenodd" fill="${S}" d="M230,190 H670 V520 H230 Z ${archPath(390, 262, 120, 520)}"/>`;
    o += `<rect x="222" y="150" width="456" height="42" fill="${HI}"/><polygon points="380,150 450,106 520,150" fill="${HI}"/>`;
    o += `<rect x="230" y="192" width="440" height="10" fill="${LO}"/>`;
    [290, 340, 560, 610].forEach(cx => (o += column(cx, 206, 520, 26)));
    // doors (hinged at arch edges)
    o += `<clipPath id="gateClip"><path d="${archPath(390, 262, 120, 520)}"/></clipPath>`;
    o += `<rect x="390" y="262" width="120" height="258" fill="#2a1f1a"/>`;
    o += `<g clip-path="url(#gateClip)"><g class="door door-l"><rect x="390" y="262" width="60" height="258" fill="var(--wood)"/>` +
      `<path d="M405,280 V520 M420,280 V520 M435,280 V520" stroke="rgba(0,0,0,.25)" stroke-width="2"/></g>` +
      `<g class="door door-r"><rect x="450" y="262" width="60" height="258" fill="var(--wood)"/>` +
      `<path d="M465,280 V520 M480,280 V520 M495,280 V520" stroke="rgba(0,0,0,.25)" stroke-width="2"/></g></g>`;
    // notice board
    o += `<rect x="158" y="380" width="6" height="140" fill="var(--wood)"/><rect x="208" y="380" width="6" height="140" fill="var(--wood)"/>` +
      `<rect x="146" y="376" width="80" height="92" fill="var(--wood)"/><rect x="154" y="384" width="64" height="76" fill="#f1e6cf"/>` +
      `<path d="M162,398 h48 M162,410 h40 M162,422 h46 M162,434 h32 M162,446 h42" stroke="${LO}" stroke-width="3"/>`;
    return svg(o);
  };

  L.colosseum = () => {
    let o = '';
    const tiers = [[400, 520, 60, 840], [290, 400, 60, 840], [180, 290, 60, 725]];
    o += `<polygon fill="${LO}" points="725,180 760,205 790,250 840,265 840,290 725,290"/>`;
    tiers.forEach(([t, b, x0, x1], i) => {
      let d = `M${x0},${t} H${x1} V${b} H${x0} Z`;
      for (let x = x0 + 18; x + 50 < x1; x += 78) d += ' ' + archPath(x, t + 18, 50, b - 6);
      o += `<path fill-rule="evenodd" fill="${i % 2 ? HI : S}" d="${d}"/>`;
      o += `<rect x="${x0}" y="${t}" width="${x1 - x0}" height="8" fill="${LO}"/>`;
    });
    // attic
    o += `<rect x="60" y="112" width="500" height="68" fill="${HI}"/><rect x="60" y="112" width="500" height="8" fill="${LO}"/>`;
    for (let x = 90; x < 540; x += 78) o += `<rect x="${x}" y="134" width="22" height="26" fill="${LO}"/>`;
    o += `<polygon fill="${HI}" points="560,112 600,140 640,150 690,178 560,180"/>`;
    // arch interiors
    o += `<rect x="60" y="514" width="780" height="6" fill="${LO}"/>`;
    // scroll pinned on pier
    o += `<rect x="453" y="308" width="30" height="40" rx="3" fill="#f1e6cf"/><path d="M458,318h20M458,326h16M458,334h20" stroke="${LO}" stroke-width="2"/>`;
    // gladiators
    o += person(205, 520, 1.1, INK, `<rect x="10" y="-44" width="16" height="22" rx="3"/><rect x="-28" y="-70" width="3" height="40" transform="rotate(-25)"/>`);
    o += person(255, 520, 1.1, INK, `<circle cx="-16" cy="-34" r="11"/><rect x="12" y="-72" width="3" height="40" transform="rotate(20)"/>`);
    // messenger with bag
    o += person(765, 520, 1.05, INK, `<rect x="6" y="-40" width="18" height="16" rx="3" fill="var(--wood)"/><rect x="9" y="-46" width="12" height="6" fill="#f1e6cf"/>`);
    return svg(o);
  };

  L.aqueducts = () => {
    let o = '';
    let d = 'M22,160 H820 V520 H22 Z';
    const arches = [];
    for (let i = 0; i < 5; i++) {
      const x = 22 + 28 + i * (126 + 28);
      d += ' ' + archPath(x, 210, 126, 520);
      arches.push(x);
    }
    o += `<path fill-rule="evenodd" fill="${S}" d="${d}"/>`;
    o += `<rect x="16" y="118" width="810" height="44" fill="${HI}"/><rect x="16" y="156" width="810" height="6" fill="${LO}"/>`;
    arches.forEach((x, i) => (o += `<path class="arch arch-${i}" d="${archPath(x, 210, 126, 520)}" fill="transparent" stroke="transparent" stroke-width="5"/>`));
    // spout, stream, basin
    o += `<rect x="818" y="128" width="22" height="16" fill="${LO}"/>`;
    o += `<rect class="stream" x="826" y="144" width="12" height="330" fill="var(--water)"/>`;
    o += `<rect x="790" y="466" width="106" height="54" fill="${LO}"/><rect class="shimmer" x="796" y="472" width="94" height="14" fill="var(--water)"/>`;
    // worker sitting on top
    o += `<g transform="translate(150,118)" fill="${INK}"><circle cx="0" cy="-34" r="8"/><path d="M-8,-26 h16 l2,24 h-20z"/><path d="M-6,-2 l-4,26 h6 l4,-24z M6,-2 l10,24 h6 l-8,-24z"/></g>`;
    return svg(o);
  };

  L.forum = () => {
    let o = '';
    // ruins left
    o += `<rect x="70" y="380" width="44" height="140" fill="${S}"/><rect x="64" y="372" width="56" height="12" fill="${LO}"/><polygon points="120,520 150,470 190,480 200,520" fill="${LO}"/>`;
    // podium & steps
    o += `<rect x="190" y="436" width="520" height="84" fill="${LO}"/>`;
    for (let i = 0; i < 4; i++) o += `<rect x="${170 - i * 8}" y="${496 + i * 6}" width="${560 + i * 16}" height="6" fill="${i % 2 ? S : HI}"/>`;
    // columns
    [260, 380, 500, 620].forEach((cx, i) => (o += column(cx, 150, 438, 48, `col col-${i}`)));
    // entablature
    o += `<rect x="212" y="104" width="476" height="46" fill="${HI}"/><rect x="212" y="138" width="476" height="12" fill="${S}"/>`;
    o += `<text x="450" y="133" text-anchor="middle" font-family="Cinzel, serif" font-size="22" letter-spacing="3" fill="${LO}">EXECVTIVE · KPIS</text>`;
    // bell on post
    o += `<rect x="797" y="330" width="8" height="190" fill="var(--wood)"/><rect x="770" y="326" width="58" height="8" fill="var(--wood)"/>`;
    o += `<g class="bell"><path d="M784,334 q17,-4 34,0 l6,40 h-46z" fill="var(--bronze)"/><circle cx="801" cy="380" r="5" fill="var(--bronze)"/></g>`;
    return svg(o);
  };

  L.pantheon = () => {
    let o = '';
    o += `<path d="M230,196 A285,150 0 0 1 800,196 Z" fill="${S}"/>`;
    o += `<path d="M262,150 A260,120 0 0 1 768,150" fill="none" stroke="${LO}" stroke-width="4"/><path d="M300,110 A220,90 0 0 1 730,110" fill="none" stroke="${LO}" stroke-width="4"/>`;
    o += `<ellipse cx="515" cy="50" rx="30" ry="8" fill="#2a1f1a"/>`;
    o += `<rect x="230" y="190" width="570" height="330" fill="${LO}"/><rect x="230" y="190" width="570" height="12" fill="${S}"/>`;
    // portico
    o += `<rect x="130" y="236" width="440" height="266" fill="#3a2a22"/>`;
    o += `<rect x="318" y="300" width="64" height="200" fill="var(--bronze)"/><rect x="348" y="300" width="4" height="200" fill="rgba(0,0,0,.3)"/>`;
    for (let i = 0; i < 8; i++) o += column(118 + 15 + i * 62, 236, 502, 30);
    o += `<rect x="96" y="198" width="508" height="40" fill="${HI}"/>`;
    o += `<text x="350" y="226" text-anchor="middle" font-family="Cinzel, serif" font-size="20" letter-spacing="4" fill="${LO}">M·AGRIPPA</text>`;
    o += `<polygon points="96,198 350,112 604,198" fill="${S}"/><polygon points="126,190 350,122 574,190" fill="${HI}"/>`;
    o += `<rect x="86" y="500" width="528" height="20" fill="${S}"/>`;
    return svg(o);
  };

  L.circus = () => {
    let o = '';
    // Palatine ruins behind
    o += `<rect x="600" y="150" width="260" height="120" fill="${LO}" opacity=".7"/>` + windows(620, 170, 5, 2, 48, 44, 26, 30);
    // stands
    o += `<polygon points="20,330 880,330 880,300 20,300" fill="${S}"/><polygon points="40,300 860,300 860,272 40,272" fill="${HI}"/><polygon points="60,272 840,272 840,248 60,248" fill="${S}"/>`;
    // track
    o += `<rect x="0" y="340" width="900" height="180" fill="var(--sand)"/>`;
    o += `<rect x="190" y="402" width="530" height="20" rx="10" fill="${S}"/>`;
    o += `<polygon points="440,402 460,402 454,300 446,300" fill="${HI}"/><polygon points="446,300 454,300 450,288" fill="${HI}"/>`;
    [196, 714].forEach(x => (o += `<polygon points="${x - 10},402 ${x + 10},402 ${x},370" fill="${LO}"/>`));
    // starting gates
    let d = 'M20,300 H160 V500 H20 Z';
    for (let i = 0; i < 3; i++) d += ' ' + archPath(30 + i * 44, 400, 34, 500);
    o += `<path fill-rule="evenodd" fill="${HI}" d="${d}"/><rect x="14" y="292" width="152" height="12" fill="${LO}"/>`;
    // chariot
    o += `<g fill="${INK}"><ellipse cx="614" cy="468" rx="30" ry="12"/><rect x="598" y="468" width="4" height="22"/><circle cx="660" cy="478" r="14" fill="none" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M560,478 l-20,-14 l-18,4 l-6,-10 l14,-6 l24,8 l14,-12 l6,4 l-10,14 l6,12z"/><rect x="640" y="452" width="22" height="18"/></g>`;
    // coin purse
    o += `<path d="M772,292 q12,-26 26,0 q10,20 -13,20 q-23,0 -13,-20z" fill="var(--wood)"/><circle cx="800" cy="306" r="6" fill="var(--accent)"/><circle cx="810" cy="302" r="5" fill="var(--accent)"/>`;
    return svg(o);
  };

  L.vatican = () => {
    let o = '';
    // St Peter's dome behind
    o += `<g opacity=".85"><rect x="560" y="170" width="250" height="100" fill="${LO}"/><path d="M570,170 A115,120 0 0 1 800,170 Z" fill="${S}"/>` +
      `<rect x="672" y="30" width="26" height="30" fill="${S}"/><polygon points="672,30 698,30 685,12" fill="${S}"/></g>`;
    // archive hall
    o += `<path fill-rule="evenodd" fill="${S}" d="M60,220 H700 V520 H60 Z ${archPath(120, 280, 400, 520)}"/>`;
    o += `<rect x="50" y="206" width="660" height="18" fill="${HI}"/>`;
    o += `<rect x="120" y="280" width="400" height="240" fill="#3a2a22" clip-path="url(#vatClip)"/><clipPath id="vatClip"><path d="${archPath(120, 280, 400, 520)}"/></clipPath>`;
    // shelves & books
    const books = ['#7b5a3c', '#5d6b4a', '#8a3b2e', '#44506a', '#a0763f', '#6a4b60'];
    let b = '';
    [322, 372, 422, 472].forEach((y, r) => {
      b += `<rect x="130" y="${y + 36}" width="380" height="6" fill="var(--wood)"/>`;
      for (let x = 136, k = 0; x < 500; x += 14, k++) {
        if (r === 2 && x > 394 && x < 500) continue;
        b += `<rect class="book" style="--i:${r * 30 + k}" x="${x}" y="${y + 36 - (26 + (k * 7) % 12)}" width="11" height="${26 + (k * 7) % 12}" fill="${books[(k + r) % books.length]}"/>`;
      }
    });
    o += `<g clip-path="url(#vatClip)">${b}</g>`;
    // sealed shelf
    o += `<rect x="398" y="416" width="108" height="42" fill="#8a2a22"/><circle cx="452" cy="437" r="11" fill="#c0392b"/><circle cx="452" cy="437" r="6" fill="#8a2a22"/>`;
    // ledger desk
    o += `<rect x="570" y="458" width="120" height="10" fill="var(--wood)"/><rect x="580" y="468" width="8" height="52" fill="var(--wood)"/><rect x="672" y="468" width="8" height="52" fill="var(--wood)"/>`;
    o += `<path d="M596,458 q30,-14 34,-4 q4,-10 34,4z" fill="#f1e6cf"/>`;
    return svg(o);
  };

  L.bocca = () => {
    let o = '';
    // campanile
    o += `<rect x="110" y="70" width="110" height="450" fill="${S}"/><polygon points="102,70 228,70 165,26" fill="${LO}"/>`;
    for (let y = 100; y < 360; y += 64) for (let i = 0; i < 3; i++) o += `<path d="${archPath(122 + i * 32, y, 22, y + 40)}" fill="${LO}"/>`;
    for (let y = 80; y < 500; y += 64) o += `<rect x="104" y="${y + 50}" width="122" height="6" fill="${HI}"/>`;
    // portico
    let d = 'M250,300 H880 V520 H250 Z';
    for (let i = 0; i < 4; i++) d += ' ' + archPath(270 + i * 80, 360, 60, 520);
    o += `<path fill-rule="evenodd" fill="${HI}" d="${d}"/><rect x="240" y="292" width="650" height="14" fill="${LO}"/>`;
    o += `<rect x="530" y="310" width="180" height="210" fill="${S}"/>`;
    // the mouth
    o += `<circle cx="620" cy="400" r="92" fill="var(--s-hi)" stroke="${LO}" stroke-width="6"/>`;
    o += `<g fill="${LO}"><ellipse cx="590" cy="370" rx="12" ry="9"/><ellipse cx="650" cy="370" rx="12" ry="9"/><path d="M614,380 l-8,30 h28 l-8,-30z"/></g>`;
    o += `<path d="M560,330 q60,-30 120,0 M548,420 q20,50 72,60 q52,-10 72,-60" fill="none" stroke="${LO}" stroke-width="4"/>`;
    o += `<g class="jaw"><ellipse cx="620" cy="440" rx="28" ry="16" fill="#2a1f1a"/></g>`;
    return svg(o);
  };

  L.capitoline = () => {
    let o = '';
    // Palazzo Senatorio
    o += `<rect x="410" y="40" width="80" height="130" fill="${S}"/><polygon points="404,40 496,40 450,12" fill="${LO}"/><rect x="434" y="70" width="32" height="40" fill="${LO}"/>`;
    o += `<rect x="240" y="160" width="420" height="270" fill="${HI}"/>` + windows(262, 190, 8, 3, 50, 70, 26, 40);
    o += `<rect x="232" y="152" width="436" height="12" fill="${LO}"/>`;
    // balustrade
    o += `<rect x="200" y="420" width="500" height="14" fill="${S}"/>`;
    // cordonata ramp
    o += `<polygon points="376,430 524,430 610,520 290,520" fill="${S}"/>`;
    for (let i = 1; i < 9; i++) { const y = 430 + i * 10, k = i / 9; o += `<line x1="${376 - 86 * k}" y1="${y}" x2="${524 + 86 * k}" y2="${y}" stroke="${LO}" stroke-width="2"/>`; }
    // statue with book
    o += `<rect x="126" y="380" width="68" height="140" fill="${S}"/><rect x="120" y="372" width="80" height="10" fill="${LO}"/>`;
    o += person(160, 372, 1.35, 'var(--bronze)', `<rect x="4" y="-44" width="20" height="14" fill="#f1e6cf"/>`);
    // scales on pedestal
    o += `<rect x="716" y="400" width="68" height="120" fill="${S}"/><rect x="710" y="394" width="80" height="8" fill="${LO}"/>`;
    o += `<g class="scales" fill="var(--bronze)"><rect x="748" y="340" width="4" height="54"/><g class="beam"><rect x="716" y="340" width="68" height="4"/>` +
      `<path d="M716,344 l-10,22 h20z M784,344 l-10,22 h20z"/></g></g>`;
    return svg(o);
  };

  L.spanish = () => {
    let o = '';
    // Trinità dei Monti
    o += `<rect x="340" y="80" width="220" height="160" fill="${HI}"/>`;
    o += `<rect x="330" y="30" width="54" height="210" fill="${S}"/><rect x="516" y="30" width="54" height="210" fill="${S}"/>`;
    o += `<path d="M330,30 q27,-26 54,0z M516,30 q27,-26 54,0z" fill="${LO}"/>`;
    o += `<polygon points="396,110 450,76 504,110" fill="${S}"/><path d="${archPath(426, 150, 48, 238)}" fill="${LO}"/>`;
    // flights of steps (bottom to top)
    const lv = [520, 462, 404, 346, 292, 238];
    for (let i = 0; i < 5; i++) {
      const y0 = lv[i], y1 = lv[i + 1], w0 = 700 - i * 90, w1 = 700 - (i + 1) * 90;
      o += `<polygon points="${450 - w0 / 2},${y0} ${450 + w0 / 2},${y0} ${450 + w1 / 2},${y1} ${450 - w1 / 2},${y1}" fill="${i % 2 ? S : HI}"/>`;
      for (let k = 1; k < 5; k++) { const y = y0 - (y0 - y1) * k / 5, w = w0 - (w0 - w1) * k / 5; o += `<line x1="${450 - w / 2}" y1="${y}" x2="${450 + w / 2}" y2="${y}" stroke="${LO}" stroke-width="1.5"/>`; }
      o += `<rect x="${450 - w1 / 2}" y="${y1 - 3}" width="${w1}" height="5" fill="${LO}"/>`;
    }
    // azaleas
    const pot = (x, y) => `<rect x="${x - 14}" y="${y}" width="28" height="22" fill="var(--wood)"/><circle cx="${x - 10}" cy="${y - 4}" r="12" fill="#d9689a"/><circle cx="${x + 8}" cy="${y - 8}" r="13" fill="#e889b0"/><circle cx="${x}" cy="${y - 16}" r="10" fill="#c9557f"/>`;
    o += pot(150, 480) + pot(750, 480) + pot(210, 422) + pot(690, 422);
    return svg(o);
  };

  L.campo = () => {
    let o = '';
    // Giordano Bruno
    o += `<rect x="92" y="380" width="56" height="140" fill="${S}"/><rect x="86" y="372" width="68" height="10" fill="${LO}"/>`;
    o += `<path d="M120,268 q-26,6 -24,40 l-6,64 h60 l-6,-64 q2,-34 -24,-40z" fill="var(--bronze)"/><circle cx="120" cy="282" r="12" fill="var(--bronze)"/>`;
    const awn = ['#b8862f', '#6d7d3f', '#3e5a86', '#7d3346', '#a4552e'];
    const produce = ['#e3b04b', '#8fa04a', '#c0392b', '#e07b39', '#6a4b60'];
    for (let i = 0; i < 5; i++) {
      const x = 230 + i * 130, w = 120;
      o += `<rect x="${x + 4}" y="368" width="5" height="152" fill="var(--wood)"/><rect x="${x + w - 9}" y="368" width="5" height="152" fill="var(--wood)"/>`;
      o += `<rect x="${x}" y="430" width="${w}" height="90" fill="${S}"/><rect x="${x}" y="430" width="${w}" height="8" fill="${HI}"/>`;
      let stripes = '';
      for (let k = 0; k < 6; k++) stripes += `<rect x="${x + k * 20}" y="352" width="10" height="34" fill="rgba(255,255,255,.35)"/>`;
      o += `<rect x="${x - 6}" y="352" width="${w + 12}" height="34" fill="${awn[i]}"/>${stripes}`;
      let sc = '';
      for (let k = 0; k < 6; k++) sc += `<circle cx="${x + 4 + k * 22}" cy="386" r="11" fill="${awn[i]}"/>`;
      o += sc;
      for (let k = 0; k < 7; k++) o += `<circle cx="${x + 14 + k * 15}" cy="${424 - (k % 2) * 6}" r="8" fill="${produce[(i + k) % 5]}"/>`;
    }
    return svg(o);
  };

  L.trevi = () => {
    let o = '';
    o += `<rect x="40" y="90" width="820" height="320" fill="${HI}"/>` + windows(70, 120, 5, 3, 52, 80, 28, 44) + windows(600, 120, 5, 3, 52, 80, 28, 44);
    o += `<rect x="32" y="80" width="836" height="14" fill="${LO}"/>`;
    o += `<rect x="330" y="40" width="240" height="370" fill="${S}"/><rect x="322" y="34" width="256" height="14" fill="${LO}"/>`;
    [352, 390, 510, 548].forEach(cx => (o += column(cx, 60, 400, 22)));
    o += `<path d="${archPath(410, 170, 80, 380)}" fill="${LO}"/>`;
    o += person(450, 376, 1.9, HI);
    // rocks
    o += `<polygon points="170,470 230,410 300,430 360,380 450,396 540,378 610,430 690,408 740,470" fill="${S}"/>`;
    o += `<polygon points="300,470 350,430 420,440 480,420 560,446 610,470" fill="${LO}"/>`;
    // basin
    o += `<rect x="0" y="456" width="900" height="64" fill="var(--water)"/>`;
    for (let i = 0; i < 6; i++) o += `<rect class="shimmer" style="animation-delay:${i * 0.4}s" x="${60 + i * 140}" y="${472 + (i % 2) * 18}" width="70" height="3" fill="rgba(255,255,255,.55)"/>`;
    o += `<rect x="0" y="452" width="900" height="8" fill="${S}"/>`;
    // coin + splash
    o += `<circle class="coin" cx="198" cy="448" r="9" fill="var(--accent)" stroke="#9c7420" stroke-width="2"/>`;
    o += `<g class="splash"><ellipse cx="520" cy="488" rx="10" ry="3" fill="none" stroke="#fff" stroke-width="2"/><ellipse cx="520" cy="488" rx="22" ry="6" fill="none" stroke="#fff" stroke-width="1.5"/></g>`;
    return svg(o);
  };

  // Animated pieces that must survive when a stop uses painted art.
  // Same 900×520 box as the landmark, drawn on top of the <img>.
  const OVERLAY = {
    trevi: () => svg(`<circle class="coin" cx="198" cy="448" r="9" fill="var(--accent)" stroke="#9c7420" stroke-width="2"/>` +
      `<g class="splash"><ellipse cx="520" cy="488" rx="10" ry="3" fill="none" stroke="#fff" stroke-width="2"/><ellipse cx="520" cy="488" rx="22" ry="6" fill="none" stroke="#fff" stroke-width="1.5"/></g>`, 'lm-overlay')
  };

  Rome.ART = {
    overlay: id => (OVERLAY[id] ? OVERLAY[id]() : ''),
    landmark: id => (L[id] ? L[id]() : svg(`<rect x="200" y="200" width="500" height="320" fill="${S}"/>`)),

    // Far skyline tile, 1800×300, repeats horizontally
    skylineTile() {
      const F = '#000'; // used as a mask; colour comes from --far
      let o = '';
      const pine = (x, h) => `<rect x="${x - 3}" y="${300 - h}" width="6" height="${h}" fill="${F}"/><ellipse cx="${x}" cy="${300 - h}" rx="${h * 0.55}" ry="${h * 0.16}" fill="${F}"/>`;
      const cypress = (x, h) => `<ellipse cx="${x}" cy="${300 - h / 2}" rx="${h * 0.09}" ry="${h / 2}" fill="${F}"/>`;
      const dome = (x, w, h) => `<rect x="${x - w / 2}" y="${300 - h}" width="${w}" height="${h}" fill="${F}"/><path d="M${x - w / 2},${300 - h} A${w / 2},${w / 2.2} 0 0 1 ${x + w / 2},${300 - h}Z" fill="${F}"/><rect x="${x - 4}" y="${300 - h - w / 2.2 - 16}" width="8" height="18" fill="${F}"/>`;
      const tower = (x, w, h) => `<rect x="${x - w / 2}" y="${300 - h}" width="${w}" height="${h}" fill="${F}"/><polygon points="${x - w / 2 - 4},${300 - h} ${x + w / 2 + 4},${300 - h} ${x},${300 - h - w}" fill="${F}"/>`;
      const block = (x, w, h) => `<rect x="${x}" y="${300 - h}" width="${w}" height="${h}" fill="${F}"/>`;
      o += block(0, 1800, 60) + block(40, 180, 110) + block(420, 240, 90) + block(900, 200, 120) + block(1320, 260, 100);
      o += dome(300, 120, 110) + dome(1100, 160, 130) + dome(1600, 100, 100);
      o += tower(700, 34, 180) + tower(1450, 30, 160);
      o += pine(120, 150) + pine(560, 170) + pine(980, 140) + pine(1250, 175) + pine(1720, 150);
      o += cypress(820, 170) + cypress(845, 140) + cypress(1540, 160);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 300" width="1800" height="300">${o}</svg>`;
    },

    // Foreground props (drawn in foreground-layer coordinates)
    lamp: () => `<svg class="fg-svg" viewBox="0 0 60 300" aria-hidden="true"><rect x="27" y="40" width="6" height="260" fill="var(--fg)"/><rect x="18" y="286" width="24" height="14" fill="var(--fg)"/>` +
      `<path d="M16,40 h28 l-6,-26 h-16z" fill="var(--fg)"/><circle class="lamp-glow" cx="30" cy="30" r="30" fill="url(#lampGlow)"/><rect class="lamp-light" x="22" y="18" width="16" height="18" fill="#ffd98a"/></svg>`,
    bush: () => `<svg class="fg-svg" viewBox="0 0 200 90" aria-hidden="true"><ellipse cx="60" cy="70" rx="60" ry="34" fill="var(--fg)"/><ellipse cx="130" cy="64" rx="70" ry="40" fill="var(--fg)"/></svg>`,
    bollard: () => `<svg class="fg-svg" viewBox="0 0 30 70" aria-hidden="true"><rect x="6" y="10" width="18" height="60" rx="6" fill="var(--fg)"/></svg>`,

    walker: () => `<svg class="walker-svg" viewBox="0 0 40 80" aria-hidden="true">
      <g class="leg leg-b"><rect x="17" y="50" width="6" height="28" rx="3" fill="#3d3440"/></g>
      <g class="arm arm-b"><rect x="18" y="30" width="5" height="20" rx="2.5" fill="#b07a5e"/></g>
      <path d="M11,28 q9,-6 18,0 l3,26 h-24z" fill="#2f5d62"/>
      <rect x="9" y="30" width="6" height="18" rx="2" fill="#8a5a3b" transform="rotate(-10 12 38)"/>
      <g class="leg leg-f"><rect x="17" y="50" width="6" height="28" rx="3" fill="#4a404e"/></g>
      <circle cx="20" cy="17" r="9" fill="#b07a5e"/>
      <path d="M11,17 q-1,-13 11,-12 q10,1 8,14 q-2,-8 -9,-8 q-7,0 -10,6z" fill="#231a1a"/>
      <path d="M11,15 q-5,14 2,22 q-3,-10 1,-18z" fill="#231a1a"/>
      <g class="arm arm-f"><rect x="18" y="30" width="5" height="20" rx="2.5" fill="#c48c6c"/></g>
    </svg>`,
    bird: () => `<svg class="bird-svg" viewBox="0 0 20 12" aria-hidden="true"><path d="M2,8 q4,-6 8,0 q4,-6 8,0 q-4,-2 -8,2 q-4,-4 -8,-2z" fill="#4a4550"/></svg>`
  };
})();
