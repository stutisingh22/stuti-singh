/* Stuti Singh — the astronomer. Interactions, no dependencies:
   halftone dissolves tied to scroll, constellations that draw themselves, the chapter rail,
   and three toys that run the real logic (stable-token redaction, the review threshold,
   the 10,000-site pipeline). Everything readable works without any of this. */
(function () {
  'use strict';
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hash = function (i, k) { var s = Math.sin(i * 12.9898 + (k || 0) * 78.233) * 43758.5453; return s - Math.floor(s); };
  html.classList.add('js');
  requestAnimationFrame(function () { requestAnimationFrame(function () { html.classList.add('ready'); }); });

  /* ---------- painted backgrounds for the blue scenes ---------- */
  $$('[data-bg]').forEach(function (el) { el.style.backgroundImage = 'url(sky/' + el.dataset.bg + '.jpg)'; });

  /* =====================================================================
     THE STAGE (desktop): one pinned screen, the scroll scrubs a timeline of scenes.
     Text arrives out of a blur, paintings dissolve through halftone between scenes,
     a progress line runs along the hairline. Phones and reduced motion get the flow below.
     ===================================================================== */
  var STAGE = !reduce && innerWidth >= 960;
  var heroImg = $('.hero__art img'), chartArt = $('.chart__art'), chartImg = chartArt && $('img', chartArt);
  var railLinks = $$('.rail a'), w2 = $('.w2'), ticking = false;
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  function sectionProgress(el) {
    if (STAGE) return el._p || 0;
    var r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
  }
  function setR(img, r) { if (img) img.style.setProperty('--r', r.toFixed(2) + 'px'); }

  if (STAGE) {
    html.classList.add('stage');
    var spacer = document.createElement('div'); spacer.className = 'stage-spacer'; spacer.setAttribute('aria-hidden', 'true'); document.body.appendChild(spacer);
    var prog = document.createElement('i'); prog.className = 'fl fl--prog'; $('.frame').appendChild(prog);
    var DUR = function (el) {   // how long each scene holds, in screens
      if (el.classList.contains('hero')) return 1.3;
      if (el.classList.contains('night')) return 2.4;
      if (el.classList.contains('chart')) return 1.6;
      if (el.classList.contains('case--paper')) return 1.7;
      if (el.classList.contains('case')) return 2.1;
      if (el.classList.contains('signal')) return 1.5;
      return 1.4;
    };
    var foot = $('.foot'), sig = $('.signal'); if (foot && sig) sig.appendChild(foot);
    var scenes = $$('main > section').map(function (el, i) {
      // in reading order: the label first, then the headline, then the rest
      var reveals = el.classList.contains('hero') ? [] : $$('.reveal, .tagpill', el);
      reveals.forEach(function (r, k) { r._at = Math.min(.36, .02 + k * .04); });
      return { el: el, i: i, reveals: reveals, base: DUR(el), imgs: $$('[data-dissolve] img, .case__bg', el) };
    });
    var H = 0, T = 0, total = 0;
    var layout = function () {
      H = innerHeight; T = H * .32; var y = 0;
      scenes.forEach(function (s) {
        s.el.style.setProperty('--scrub', '0px');
        s.over = Math.max(0, s.el.scrollHeight - H);
        s.dur = Math.max(s.base * H, s.over * 1.15 + 1.2 * H);
        s.start = y; y += s.dur;
      });
      total = y; spacer.style.height = (total + H * .2) + 'px';
      frame();
    };
    var frame = function () {
      ticking = false;
      var y = scrollY, cur = null;
      scenes.forEach(function (s, idx) {
        var local = y - s.start;
        var inP = idx === 0 ? 1 : clamp(local / T, 0, 1);
        var outP = idx === scenes.length - 1 ? 0 : clamp((local - (s.dur - T)) / T, 0, 1);
        var vis = smooth(inP) * (1 - smooth(outP));
        var p = clamp((local - T * .5) / (s.dur - T), 0, 1);
        s.el._p = p; s.el._vis = vis;
        var st = s.el.style;
        st.setProperty('--vis', vis.toFixed(3)); st.setProperty('--in', smooth(inP).toFixed(3)); st.setProperty('--out', smooth(outP).toFixed(3));
        st.visibility = vis > .002 ? 'visible' : 'hidden';
        s.el.classList.toggle('live', vis > .55);
        if (s.over) st.setProperty('--scrub', (-s.over * smooth(clamp((p - .08) / .8, 0, 1))).toFixed(1) + 'px');
        // text arrives line by line, and leaves as one
        s.reveals.forEach(function (r) { r.classList.toggle('on', p >= r._at && outP < .5); });
        // paintings: grow out of halftone dots on the way in, dissolve back on the way out
        s.imgs.forEach(function (img) {
          var max = img.classList.contains('case__bg') ? 2.6 : img.closest('.record') ? 3.4 : 6;
          setR(img, idx === 0 ? lerp(max, 1.1, smooth(outP)) : lerp(.35, max, vis));
        });
        if (vis > .5) cur = s;
      });
      // the hero's own slow push-in
      var h0 = scenes[0]; heroImg.style.setProperty('--s', (1.04 + h0.el._p * .06).toFixed(3));
      if (chartArt) chartArt.style.setProperty('--rot', lerp(-9, 3, chartArt.parentNode._p || 0).toFixed(2) + 'deg');
      if (w2) w2.style.setProperty('--py', lerp(60, -40, w2.closest('section')._p || 0).toFixed(1) + 'px');
      // the hairline carries this scene's progress; the rail names the chapter
      prog.style.transform = 'scaleX(' + (cur ? cur.el._p : 0).toFixed(4) + ')';
      var ch = cur ? cur.el.dataset.chapter : null;
      railLinks.forEach(function (a) { a.classList.toggle('on', a.dataset.ch === ch); });
    };
    var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    addEventListener('scroll', req, { passive: true });
    addEventListener('resize', function () { clearTimeout(layout._t); layout._t = setTimeout(layout, 150); });
    addEventListener('load', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    layout();
    // links inside the page go to the scene that holds their target
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return;
      var id = a.getAttribute('href').slice(1), target = id ? document.getElementById(id) : null;
      var s = scenes.filter(function (x) { return x.el === target || (target && x.el.contains(target)); })[0];
      if (!id) s = scenes[0];
      if (!s) return;
      e.preventDefault(); scrollTo({ top: s.start + (s === scenes[0] ? 0 : T * 1.2), behavior: 'smooth' });
    });
  } else {
    /* ---------- the flow (phones, reduced motion): reveals and gentle scroll effects ---------- */
    var reveals = $$('.reveal');
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px', threshold: .05 });
      reveals.forEach(function (el) { io.observe(el); });
    } else reveals.forEach(function (el) { el.classList.add('in'); });
    setTimeout(function () { reveals.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }); }, 2500);
    var dissolveImgs = $$('.record__art img, .signal__art img'), chapters = $$('[data-chapter]');
    var onScroll = function () {
      ticking = false;
      var H = innerHeight, y = scrollY;
      if (!reduce) {
        var out = clamp(y / (H * .9), 0, 1);
        setR(heroImg, lerp(6, 1.1, out * out)); heroImg.style.setProperty('--s', (1.04 + out * .08).toFixed(3));
        if (chartArt) { var p = sectionProgress(chartArt.parentNode); setR(chartImg, lerp(.5, 6, clamp(p * 2.2, 0, 1))); chartArt.style.setProperty('--rot', lerp(-9, 3, p).toFixed(2) + 'deg'); }
        dissolveImgs.forEach(function (img) { var q = sectionProgress(img.closest('section')); setR(img, lerp(.6, img.closest('.record') ? 3.4 : 6, clamp(q * 2.4, 0, 1))); });
      }
      var cur = null; chapters.forEach(function (s) { if (s.getBoundingClientRect().top < H * .45) cur = s.dataset.chapter; });
      railLinks.forEach(function (a) { a.classList.toggle('on', a.dataset.ch === cur); });
    };
    var req2 = function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
    addEventListener('scroll', req2, { passive: true }); addEventListener('resize', req2); onScroll();
  }

  /* ---------- a canvas that only animates while it is on screen ---------- */
  function liveCanvas(canvas, draw) {
    var ctx = canvas.getContext('2d'), on = false, W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2), raf = 0;
    function size() { var r = canvas.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    var host = canvas.closest('section');
    function loop(t) { if (!on) return; if (!STAGE || (host && host._vis > .01)) draw(ctx, W, H, t / 1000); raf = requestAnimationFrame(loop); }
    size(); addEventListener('resize', function () { size(); if (!on) draw(ctx, W, H, 0); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { on = es[0].isIntersecting && !reduce; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(loop); else draw(ctx, W, H, 0); }).observe(canvas);
    draw(ctx, W, H, 0);
    return { size: size };
  }

  /* ---------- ch.1: scattered stars, joined into constellations as you scroll ---------- */
  var starCanvas = $('.stars');
  if (starCanvas) {
    var STARS = [], N = 230;
    for (var i = 0; i < N; i++) STARS.push({ x: hash(i, 1), y: hash(i, 2), m: Math.pow(hash(i, 3), 3), tw: hash(i, 4) * 6.28 });
    // a few constellations: chains of nearby bright stars
    var CONS = [];
    var bright = STARS.map(function (s, i) { return [s, i]; }).filter(function (p) { return p[0].m > .25; }).map(function (p) { return p[0]; });
    for (var c = 0; c < 6 && bright.length; c++) {
      var chain = [bright.splice(Math.floor(hash(c, 9) * bright.length), 1)[0]];
      for (var k = 0; k < 5 && bright.length; k++) {
        var last = chain[chain.length - 1], best = -1, bd = 1e9;
        bright.forEach(function (s, j) { var d = Math.hypot((s.x - last.x) * 1.6, s.y - last.y); if (d < bd) { bd = d; best = j; } });
        if (bd > .28) break; chain.push(bright.splice(best, 1)[0]);
      }
      if (chain.length > 2) CONS.push(chain);
    }
    liveCanvas(starCanvas, function (g, W, H, t) {
      g.clearRect(0, 0, W, H);
      var p = clamp(sectionProgress(starCanvas.parentNode) * 1.8 - .25, 0, 1);
      STARS.forEach(function (s) {
        var a = .25 + s.m * .75 + Math.sin(t * 1.3 + s.tw) * .18 * s.m, r = .5 + s.m * 1.9;
        g.fillStyle = 'rgba(255,250,234,' + clamp(a, 0, 1) + ')'; g.beginPath(); g.arc(s.x * W, s.y * H, r, 0, 6.283); g.fill();
        if (s.m > .55) { g.fillStyle = 'rgba(255,230,170,.12)'; g.beginPath(); g.arc(s.x * W, s.y * H, r * 5, 0, 6.283); g.fill(); }
      });
      g.strokeStyle = 'rgba(217,180,92,.55)'; g.lineWidth = 1;
      CONS.forEach(function (ch, ci) {
        var segs = (ch.length - 1) * clamp(p * 1.4 - ci * .08, 0, 1);
        g.beginPath(); g.moveTo(ch[0].x * W, ch[0].y * H);
        for (var j = 1; j <= Math.floor(segs); j++) g.lineTo(ch[j].x * W, ch[j].y * H);
        var f = segs - Math.floor(segs), a0 = ch[Math.floor(segs)], a1 = ch[Math.floor(segs) + 1];
        if (a1 && f > 0) g.lineTo(lerp(a0.x, a1.x, f) * W, lerp(a0.y, a1.y, f) * H);
        g.stroke();
      });
    });
  }

  /* ---------- toy 1: redaction with stable tokens (same logic as output-redactor's idea) ---------- */
  var redIn = $('#red-in'), redOut = $('#red-out'), redVerify = $('#red-verify');
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function redact(text) {
    var hits = [], maps = { PERSON: {}, EMAIL: {}, PHONE: {} }, counts = { PERSON: 0, EMAIL: 0, PHONE: 0 };
    var P = [['EMAIL', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g], ['PHONE', /\+?\d[\d\s-]{8,}\d/g], ['PERSON', /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g]];
    P.forEach(function (p) { var m; p[1].lastIndex = 0; while ((m = p[1].exec(text))) hits.push({ s: m.index, e: m.index + m[0].length, type: p[0], key: m[0] }); });
    // first names on their own refer to the same person
    var firsts = {}; hits.filter(function (h) { return h.type === 'PERSON'; }).forEach(function (h) { firsts[h.key.split(' ')[0]] = h.key; });
    Object.keys(firsts).forEach(function (f) { var re = new RegExp('\\b' + f + '\\b(?! [A-Z][a-z])', 'g'), m; while ((m = re.exec(text))) hits.push({ s: m.index, e: m.index + f.length, type: 'PERSON', key: firsts[f] }); });
    hits.sort(function (a, b) { return a.s - b.s || b.e - a.e; });
    var out = '', at = 0, real = [];
    hits.forEach(function (h) {
      if (h.s < at) return;
      var k = h.type === 'EMAIL' ? h.key.toLowerCase() : h.key;
      if (!maps[h.type][k]) maps[h.type][k] = '<' + (h.type === 'PERSON' ? 'CLIENT_PERSON' : h.type) + '_' + String(++counts[h.type]).padStart(3, '0') + '>';
      out += esc(text.slice(at, h.s)) + '<span class="tok">' + esc(maps[h.type][k]) + '</span>'; at = h.e; real.push(text.slice(h.s, h.e));
    });
    out += esc(text.slice(at));
    var plain = out.replace(/<[^>]+>/g, '');
    var survived = real.filter(function (v) { return v.length > 2 && plain.indexOf(esc(v)) > -1; });
    return { html: out, counts: counts, ok: !survived.length };
  }
  function runRedact() {
    if (!redIn) return;
    var r = redact(redIn.value);
    redOut.innerHTML = r.html;
    var n = r.counts.PERSON + r.counts.EMAIL + r.counts.PHONE;
    redVerify.className = 'red-verify' + (r.ok ? '' : ' bad');
    redVerify.textContent = (r.ok ? '✓ verify passed: ' : '✗ verify failed: ') + r.counts.PERSON + ' people, ' + r.counts.EMAIL + ' emails, ' + r.counts.PHONE + ' phones → ' + n + ' stable tokens. No real value survives.';
  }
  if (redIn) { redIn.addEventListener('input', runRedact); runRedact(); }

  /* ---------- toy 2: the review threshold ---------- */
  var polIn = $('#pol-in'), polGrid = $('#pol-grid');
  if (polIn) {
    var RECS = [];
    for (var ri = 0; ri < 48; ri++) RECS.push({ conf: +(0.32 + Math.pow(hash(ri, 11), .7) * .66).toFixed(2), flagged: hash(ri, 12) < .06 });
    polGrid.innerHTML = RECS.map(function (r) { return '<i title="confidence ' + r.conf.toFixed(2) + (r.flagged ? ', model flagged' : '') + '"></i>'; }).join('');
    var dots = $$('i', polGrid);
    var polRun = function () {
      var t = +polIn.value, rev = 0;
      $('#pol-t').textContent = t.toFixed(2);
      polIn.style.setProperty('--p', ((t - .3) / .65 * 100).toFixed(1) + '%');
      RECS.forEach(function (r, i) { var needs = r.flagged || r.conf < t; if (needs) rev++; dots[i].classList.toggle('rev', needs); });
      $('#pol-auto').textContent = RECS.length - rev; $('#pol-rev').textContent = rev;
    };
    polIn.addEventListener('input', polRun); $('#pol-reset').addEventListener('click', function () { polIn.value = .65; polRun(); }); polRun();
  }

  /* ---------- toy 3: 10,000 sites through the pipeline ---------- */
  var pipeCanvas = $('#pipe');
  if (pipeCanvas) {
    var PN = innerWidth < 700 ? 4000 : 10000, SHOWN = 10000, P = [], t0 = 0;
    var STAGES = ['fetch', 'extract', 'rules', 'LLM', 'enrich'];
    var TIERS = [['A', '#3fb8a5', .14], ['B', '#7fd1c4', .24], ['C', '#c9bfae', .3], ['Review', '#e7a43a', .14], ['Reject', '#8a8173', .18]];
    var cum = [], acc = 0; TIERS.forEach(function (tt) { acc += tt[2]; cum.push(acc); });
    for (var pi = 0; pi < PN; pi++) { var h = hash(pi, 21), tier = 0; while (h > cum[tier]) tier++; P.push({ d: hash(pi, 22) * .55, lane: hash(pi, 23), tier: tier, llm: hash(pi, 24) < .3 }); }
    var pipeDraw = function (g, W, H, t) {
      if (!t0) t0 = t;
      var el = reduce ? 99 : t - t0, gx = [.12, .3, .48, .64, .8].map(function (f) { return f * W; }), top = 34, bot = H - 64;
      g.clearRect(0, 0, W, H);
      g.font = '500 10px "Geist Mono", monospace'; g.textAlign = 'center';
      STAGES.forEach(function (s, i) {
        g.strokeStyle = s === 'LLM' ? 'rgba(217,180,92,.6)' : 'rgba(255,250,234,.14)'; g.setLineDash([3, 5]); g.beginPath(); g.moveTo(gx[i], top); g.lineTo(gx[i], bot); g.stroke(); g.setLineDash([]);
        g.fillStyle = s === 'LLM' ? '#d9b45c' : 'rgba(255,250,234,.55)'; g.fillText(s.toUpperCase(), gx[i], 20);
      });
      var binW = W / TIERS.length, done = 0, rules = 0, llm = 0, fill = TIERS.map(function () { return 0; }), base = H - 26;
      g.globalAlpha = .9;
      for (var i = 0; i < PN; i++) {
        var p = P[i], u = el * .2 - p.d, y;
        if (u <= 0) continue;
        if (u < 1) {   // in flight through the stages
          var x = lerp(0, W * .94, u); y = top + p.lane * (bot - top - 70) + 20;
          var inLLM = p.llm && x > gx[2] && x < gx[4];
          // the LLM gate: most sites pass on rules; a few detour through the gold lane
          if (inLLM) y = lerp(y, top + 16, Math.sin(clamp((x - gx[2]) / (gx[4] - gx[2]), 0, 1) * Math.PI) * .85);
          g.fillStyle = inLLM ? 'rgba(217,180,92,.9)' : 'rgba(255,250,234,.34)';
          g.fillRect(x, y, 1.3, 1.3);
        } else { fill[p.tier]++; done++; if (p.llm) llm++; else rules++; }
      }
      g.globalAlpha = 1;
      // the tiers fill as bars, with live counts
      TIERS.forEach(function (tt, i) {
        var hgt = fill[i] / PN * (H * .9), x0 = binW * i + 10, w = binW - 20;
        var grad = g.createLinearGradient(0, base - hgt, 0, base); grad.addColorStop(0, tt[1]); grad.addColorStop(1, 'rgba(255,255,255,.04)');
        g.fillStyle = grad; g.fillRect(x0, base - hgt, w, hgt);
        g.fillStyle = 'rgba(255,250,234,.55)'; g.fillText(tt[0].toUpperCase(), x0 + w / 2, H - 8);
        if (fill[i]) { g.fillStyle = tt[1]; g.fillText(Math.round(fill[i] * SHOWN / PN).toLocaleString(), x0 + w / 2, base - hgt - 6); }
      });
      g.globalAlpha = 1;
      var scale = SHOWN / PN;
      $('#pipe-done').textContent = Math.round(done * scale).toLocaleString();
      $('#pipe-rules').textContent = Math.round(rules * scale).toLocaleString();
      $('#pipe-llm').textContent = Math.round(llm * scale).toLocaleString();
    };
    liveCanvas(pipeCanvas, pipeDraw);
    var pipeHost = pipeCanvas.closest('section'), pipeWas = 0;
    if (STAGE) addEventListener('scroll', function () { var v = pipeHost._vis || 0; if (v > .6 && pipeWas <= .6) t0 = 0; pipeWas = v; }, { passive: true });
    $('#pipe-run').addEventListener('click', function () { t0 = 0; });
  }

  /* ---------- ch.5: the contact options are stars; lines join them ---------- */
  var constel = $('.constel');
  if (constel) {
    var mouse = { x: -1, y: -1 };
    constel.parentNode.addEventListener('pointermove', function (e) { var r = constel.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    constel.parentNode.addEventListener('pointerleave', function () { mouse.x = -1; });
    var BG = []; for (var bi = 0; bi < 90; bi++) BG.push({ x: hash(bi, 31), y: hash(bi, 32), m: Math.pow(hash(bi, 33), 2.5), tw: hash(bi, 34) * 6.28 });
    liveCanvas(constel, function (g, W, H, t) {
      g.clearRect(0, 0, W, H);
      BG.forEach(function (s) { g.fillStyle = 'rgba(255,250,234,' + (.3 + s.m * .6 + Math.sin(t + s.tw) * .15) + ')'; g.beginPath(); g.arc(s.x * W, s.y * H, .6 + s.m * 1.6, 0, 6.283); g.fill(); });
      var box = constel.getBoundingClientRect();
      var pts = $$('[data-star]').map(function (n) { var r = n.getBoundingClientRect(); return [r.left - box.left + 20, r.top - box.top + r.height / 2]; });
      g.strokeStyle = 'rgba(255,240,200,.55)'; g.lineWidth = 1; g.setLineDash([2, 5]);
      g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); if (pts.length > 2) g.lineTo(pts[0][0], pts[0][1]); g.stroke();
      if (mouse.x >= 0) { g.setLineDash([]); g.strokeStyle = 'rgba(255,240,200,.35)'; pts.forEach(function (p) { if (Math.hypot(p[0] - mouse.x, p[1] - mouse.y) < 360) { g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(mouse.x, mouse.y); g.stroke(); } }); g.fillStyle = '#fff'; g.beginPath(); g.arc(mouse.x, mouse.y, 2.2, 0, 6.283); g.fill(); }
      g.setLineDash([]);
    });
  }

  /* ---------- zoom + copy ---------- */
  var zoom = $('.zoom'), zimg = zoom && $('img', zoom);
  $$('img[data-zoom]').forEach(function (img) { img.addEventListener('click', function () { zimg.src = img.currentSrc || img.src; zimg.alt = img.alt; zoom.hidden = false; $('button', zoom).focus(); }); });
  if (zoom) { zoom.addEventListener('click', function () { zoom.hidden = true; }); addEventListener('keydown', function (e) { if (e.key === 'Escape') zoom.hidden = true; }); }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-copy'), label = b.lastChild, orig = label.textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { label.textContent = 'Copied ✓'; }, function () { label.textContent = t; });
      setTimeout(function () { label.textContent = orig; }, 1800);
    });
  });
})();
