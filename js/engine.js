/* ==========================================================================
   engine.js — the walk. Owns: world DOM, input, physics, camera, parallax,
   stop zones, time-of-day lighting, ambient birds, footstep sound.
   It knows nothing about cards or copy; it emits events that ui.js uses.

   DO NOT replace this with CSS scroll-snap, page sections, or background
   swaps. The whole site depends on this being one continuous world.
   ========================================================================== */
window.Rome = window.Rome || {};
(function () {
  const params = new URLSearchParams(location.search);
  const E = (Rome.engine = {});

  // ---- constants -----------------------------------------------------------
  const SPEED = { sky: 0.04, far: 0.14, lm: 0.55, street: 1, fg: 1.45 };
  const SPACING = 2200;          // street px between stops — room to walk between them
  const START = 900;             // street x of stop 0
  const MAX_V = 520;             // a stroll, not a run
  const FAST_V = 2200;           // fast-travel speed
  const ACCEL_TAU = 0.32;        // eases up, like starting to walk
  const COAST_TAU = 0.85;        // keeps gliding after you let go of the scroll
  const CAM_TAU = 0.28;          // the view follows a little behind, like a steadicam
  const WHEEL_GAIN = 1.2;        // trackpad scroll becomes a drift, not a jump
  const GROUND_FRAC = 0.78;      // building feet low: the street is only what's under you
  const LM_FRAC = 0.74;          // the facade fills the view, the way it does when you stand in front of it
  const SNAP_RADIUS = 820;       // magnetic pull range
  const SNAP_MAX_V = 300;        // only snap when slow enough
  const SNAP_K = 30, SNAP_C = 2 * Math.sqrt(30);
  const APPROACH_R = 720;        // label + hotspots appear
  const WALKER_FRAC = 0.42;      // walker's screen x as fraction of width

  const A = Rome.ASSETS || { sky: {}, props: {}, walker: {}, landmarks: {} };
  const stops = Rome.STOPS.map((s, i) => ({ ...s, index: i, x: START + i * SPACING }));
  const MIN_X = stops[0].x - 250;
  const MAX_X = stops[stops.length - 1].x + 500;
  const WORLD_W = MAX_X + 1200;
  E.stops = stops;

  // ---- motion preference (override with ?motion=full / ?motion=reduced) --
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  E.reduced = params.get('motion') === 'reduced' || (params.get('motion') !== 'full' && mq.matches);
  document.documentElement.classList.toggle('reduced', E.reduced);
  document.documentElement.classList.toggle('lite', params.get('fx') === 'lite'); // ?fx=lite drops haze/rays/grain on slow machines

  // ---- events ----------------------------------------------------------------
  const handlers = {};
  E.on = (evt, fn) => (handlers[evt] = handlers[evt] || []).push(fn);
  const emit = (evt, ...a) => (handlers[evt] || []).forEach(fn => fn(...a));

  // ---- state -------------------------------------------------------------------
  const st = {
    x: stops[0].x, v: 0, cam: 0, vw: innerWidth, vh: innerHeight,
    keys: { l: false, r: false }, hold: 0, dragging: false, wheelT: -1e9,
    auto: null, autoResolve: null, mode: null, zone: 0, facing: 1,
    gateOpen: false, gateOpening: false, paused: false, p: 0, lastP: -1,
    groundY: 0, scale: 1, moving: false
  };
  E.state = () => ({ x: st.x, v: st.v, cam: st.cam, mode: st.mode, zone: st.zone, gateOpen: st.gateOpen, p: st.p, reduced: E.reduced });

  // ---- DOM -------------------------------------------------------------------
  const world = document.getElementById('world');
  world.innerHTML = `
    <div class="layer sky" data-layer="sky">
      ${['dawn', 'day', 'golden', 'dusk'].map(k => A.sky && A.sky[k] ? `<div class="sky-plate" data-t="${k}" style="background-image:url('${A.sky[k]}')"></div>` : '').join('')}
      <div class="stars"></div><div class="sun"><div class="rays"></div></div>
      <div class="clouds" data-speed="${SPEED.sky}"><i></i><i></i><i></i><i></i><i></i></div>
    </div>
    <div class="layer far" data-layer="far" data-speed="${SPEED.far}"></div>
    <div class="haze" aria-hidden="true"></div>
    <div class="layer lm" data-layer="lm" data-speed="${SPEED.lm}"></div>
    <div class="layer street" data-layer="street" data-speed="${SPEED.street}">
      <div class="ground"></div>
      <div class="walker ${A.walker && (A.walker.sheet || A.walker.image) ? 'img' : ''}" aria-hidden="true">${
        A.walker && A.walker.sheet ? `<div class="walker-sheet" style="background-image:url('${A.walker.sheet}');background-size:${(A.walker.frames || 8) * 100}% 100%"></div>`
        : A.walker && A.walker.image ? `<img class="walker-img" src="${A.walker.image}" alt="" draggable="false">`
        : Rome.ART.walker()}</div>
    </div>
    <div class="layer fg" data-layer="fg" data-speed="${SPEED.fg}"></div>
    <div class="vignette" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div>
    <svg width="0" height="0" style="position:absolute"><defs>
      <radialGradient id="lampGlow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
    </defs></svg>`;
  const L = {
    clouds: world.querySelector('.clouds'), far: world.querySelector('.far'),
    lm: world.querySelector('.lm'), street: world.querySelector('.street'),
    fg: world.querySelector('.fg'), sun: world.querySelector('.sun'),
    stars: world.querySelector('.stars'), walker: world.querySelector('.walker'),
    haze: world.querySelector('.haze'), plates: [...world.querySelectorAll('.sky-plate')],
    sheet: world.querySelector('.walker-sheet')
  };
  // skyline is a MASK so its colour can follow --far (CSS vars don't reach data-URI SVGs)
  const skyUrl = `url("data:image/svg+xml,${encodeURIComponent(Rome.ART.skylineTile())}")`;
  if (A.skyline) { L.far.classList.add('img'); L.far.style.backgroundImage = `url('${A.skyline}')`; }
  else L.far.style.webkitMaskImage = L.far.style.maskImage = skyUrl;
  if (A.street) { const g = world.querySelector('.ground'); g.classList.add('img'); g.style.backgroundImage = `url('${A.street}')`; }

  // landmarks
  stops.forEach(s => {
    const el = document.createElement('div');
    el.className = 'landmark';
    el.dataset.stop = s.id;
    const art = (A.landmarks && A.landmarks[s.id]) || s.art;
    const openArt = A.landmarks && A.landmarks[s.id + '-open'];
    el.innerHTML = (art
      ? `<img class="lm-img" src="${art}" alt="" draggable="false">` +
        (openArt ? `<img class="lm-img open-img" src="${openArt}" alt="" draggable="false">` : '') +
        Rome.ART.overlay(s.id)                      // animated bits (coin, splash) drawn over painted art
      : Rome.ART.landmark(s.id)) + '<i class="lm-shadow" aria-hidden="true"></i>';
    if (art) el.classList.add('has-art');
    L.lm.appendChild(el);
    s.el = el;
  });

  // birds
  const birds = [];
  stops.filter(s => s.birds).forEach(s => {
    for (let k = 0; k < 4; k++) {
      const b = document.createElement('div');
      b.className = 'bird';
      b.style.setProperty('--dx', `${(k - 1.5) * 40 + 60}px`);
      b.style.setProperty('--delay', `${k * 60}ms`);
      b.innerHTML = Rome.ART.bird();
      L.street.appendChild(b);
      birds.push({ el: b, x: s.x + 320 + k * 34 });
    }
  });

  // foreground props (placed so they never sit in front of a stop point)
  const fgProps = [];
  for (let sx = 400; sx < WORLD_W * SPEED.fg; sx += 520) {
    const streetX = sx / SPEED.fg;
    const nearStop = stops.some(s => Math.abs(s.x - streetX) < 380);
    if (nearStop) continue;
    const cycle = ['lamp', A.props && A.props.pine ? 'pine' : 'bush', 'lamp', A.props && A.props.cypress ? 'cypress' : 'bollard'];
    const kind = cycle[Math.floor(sx / 520) % 4];
    const el = document.createElement('div');
    const img = A.props && A.props[kind];
    el.className = `prop prop-${kind}${img ? ' img' : ''}`;
    el.innerHTML = img ? `<img src="${img}" alt="" draggable="false">` : Rome.ART[kind]();
    L.fg.appendChild(el);
    fgProps.push({ el, x: sx });
  }

  // focusing a hotspot must never scroll the world container
  world.addEventListener('scroll', () => { world.scrollLeft = 0; world.scrollTop = 0; });

  // ---- layout -----------------------------------------------------------------
  function layout() {
    st.vw = innerWidth; st.vh = innerHeight;
    const mobile = st.vw < 700;
    st.groundY = Math.round(st.vh * (mobile ? 0.72 : GROUND_FRAC));
    st.scale = Math.max(0.36, Math.min(1.08, (st.vh * (mobile ? 0.5 : LM_FRAC)) / 520, (st.vw * 0.92) / 900));
    const w = 900 * st.scale, h = 520 * st.scale;
    stops.forEach(s => {
      // landmark centre lands at screen centre when the walker is parked at the stop
      const lc = st.vw * 0.5 + SPEED.lm * (s.x - st.vw * WALKER_FRAC);
      Object.assign(s.el.style, { width: `${w}px`, height: `${h}px`, left: `${lc - w / 2}px`, top: `${st.groundY - h}px` });
    });
    const farH = Math.round(300 * Math.min(1, st.vh / 900));
    Object.assign(L.far.style, { top: `${st.groundY - farH + 2}px`, height: `${farH}px`, width: `${WORLD_W * SPEED.far + st.vw * 2}px`, webkitMaskSize: `${farH * 6}px ${farH}px`, maskSize: `${farH * 6}px ${farH}px` });
    Object.assign(L.street.style, { width: `${WORLD_W}px` });
    L.street.querySelector('.ground').style.top = `${st.groundY}px`;
    const wh = Math.max(44, Math.min(84, 520 * st.scale * 0.16)); // walker scales with the landmarks
    Object.assign(L.walker.style, { height: `${wh}px`, width: `${wh / 2}px`, top: `${st.groundY + 18 - wh}px` });
    if (L.walker.classList.contains('img')) L.walker.style.width = `${wh * (A.walker.aspect || 0.5)}px`;
    const skyH = A.skyline ? Math.round(Math.min(380, st.vh * 0.36)) : 0;
    if (skyH) Object.assign(L.far.style, { top: `${st.groundY - skyH + 4}px`, height: `${skyH}px`, backgroundSize: `auto ${skyH}px` });
    const gh = st.vh - st.groundY;
    if (A.street) world.querySelector('.ground').style.backgroundSize = `auto ${Math.max(120, gh)}px`;
    Object.assign(L.haze.style, { top: `${st.groundY - st.vh * 0.34}px`, height: `${st.vh * 0.34 + 6}px` });
    birds.forEach(b => (b.el.style.cssText += `;left:${b.x}px;top:${st.groundY + 10}px`));
    fgProps.forEach(p => {
      const c = p.el.classList;
      const hgt = c.contains('prop-lamp') ? Math.min(c.contains('img') ? 460 : 300, st.vh * (c.contains('img') ? 0.5 : 0.42))
        : c.contains('prop-pine') ? st.vh * 0.62 : c.contains('prop-cypress') ? st.vh * 0.5
        : c.contains('prop-bush') ? (c.contains('img') ? st.vh * 0.14 : 70) : 54;
      Object.assign(p.el.style, { left: `${p.x}px`, height: `${hgt}px`, top: `${st.vh - hgt}px` });
    });
    L.fg.style.width = `${WORLD_W * SPEED.fg + st.vw}px`;
    st.cam = st.x - st.vw * WALKER_FRAC;
    render(0, true);
    emit('layout');
  }
  addEventListener('resize', layout);

  // ---- time of day ------------------------------------------------------------
  const PAL = [
    [0.00, { gB: 0.94, gS: 0.9, gW: 0.12, rays: 0.35, haze: 0.55, skyTop: '#6f7fa8', skyBot: '#f1bfa0', sHi: '#efdcc4', s: '#dcbf9c', sLo: '#a88666', far: '#9b8ea6', ground: '#8e7358', fg: '#3b3140', water: '#7fa6b8', sand: '#d9b98c', lamp: 0.35, stars: 0.25, sun: '#ffd7a8' }],
    [0.45, { gB: 1.02, gS: 1.02, gW: 0.0, rays: 0.12, haze: 0.4, skyTop: '#5f9bd0', skyBot: '#f4ddb4', sHi: '#f6e6c8', s: '#e3c79a', sLo: '#b48d5c', far: '#a9b5c0', ground: '#9c7d57', fg: '#34392f', water: '#5aa3c4', sand: '#e6c88f', lamp: 0, stars: 0, sun: '#fff1c8' }],
    [0.80, { gB: 1.0, gS: 1.1, gW: 0.18, rays: 0.6, haze: 0.5, skyTop: '#5a79b3', skyBot: '#f6b877', sHi: '#f5d7ac', s: '#e0b17c', sLo: '#a8724a', far: '#9c8a95', ground: '#8b6a4a', fg: '#322a2c', water: '#6e9fb8', sand: '#e3b67c', lamp: 0.3, stars: 0, sun: '#ffc27a' }],
    [1.00, { gB: 0.72, gS: 0.85, gW: 0.2, rays: 0.2, haze: 0.45, skyTop: '#1d2244', skyBot: '#d7704e', sHi: '#e6b58c', s: '#b88463', sLo: '#6e4a3c', far: '#4b3e57', ground: '#4a3832', fg: '#1c1820', water: '#3e5f80', sand: '#a9805e', lamp: 1, stars: 0.9, sun: '#ff8a5c' }]
  ];
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => typeof a === 'number' ? a + (b - a) * t : 'rgb(' + hex(a).map((c, i) => Math.round(c + (hex(b)[i] - c) * t)).join(',') + ')';
  const root = document.documentElement.style;
  const VARS = { skyTop: '--sky-top', skyBot: '--sky-bot', sHi: '--s-hi', s: '--s', sLo: '--s-lo', far: '--far', ground: '--ground', fg: '--fg', water: '--water', sand: '--sand', lamp: '--lamp', stars: '--stars', sun: '--sun', gB: '--g-b', gS: '--g-s', gW: '--g-w', rays: '--rays', haze: '--haze' };
  function light(p) {
    let i = 0;
    while (i < PAL.length - 2 && p > PAL[i + 1][0]) i++;
    const [p0, a] = PAL[i], [p1, b] = PAL[i + 1];
    const t = Math.max(0, Math.min(1, (p - p0) / (p1 - p0)));
    for (const k in VARS) root.setProperty(VARS[k], mix(a[k], b[k], t));
    // sun path: rises left, arcs, sets right
    const sx = 8 + p * 84, sy = 58 - Math.sin(Math.PI * Math.min(1, p * 1.15)) * 40 + (p > 0.85 ? (p - 0.85) * 160 : 0);
    L.sun.style.transform = `translate(${sx}vw, ${sy}vh)`;
    // painted sky plates crossfade in order: dawn → day → golden → dusk
    if (L.plates.length) {
      const idx = { dawn: 0, day: 1, golden: 2, dusk: 3 };
      L.plates.forEach(pl => {
        const k = idx[pl.dataset.t];
        const o = k === i ? 1 : k === i + 1 ? t : 0;          // only two plates ever render
        pl.style.opacity = o; pl.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      });
    }
  }

  // ---- input ---------------------------------------------------------------
  const inputDir = () => (st.keys.r ? 1 : 0) - (st.keys.l ? 1 : 0) + st.hold;
  function wantsForward() { if (!st.gateOpen) E.openGate(); }
  function interrupt() { if (st.auto !== null) { st.auto = null; st.autoResolve = null; } emit('input'); }

  addEventListener('keydown', e => {
    if (st.paused || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const right = k === 'ArrowRight' || k === 'd' || k === 'D';
    const left = k === 'ArrowLeft' || k === 'a' || k === 'A';
    if (!right && !left) return;
    e.preventDefault();
    interrupt();
    if (right && !st.gateOpen && !st.gateOpening && !E.reduced) {
      wantsForward();
      // a tap of → should carry you through the gate, not stop on the threshold
      setTimeout(() => { if (st.gateOpen && !st.keys.r && !st.keys.l && !st.hold && Math.abs(st.v) < 30) st.v = MAX_V; }, 800);
    } else if (right) wantsForward();
    if (E.reduced) { if (!e.repeat && st.gateOpen) E.step(right ? 1 : -1); return; }
    if (right) st.keys.r = true; else st.keys.l = true;
  });
  addEventListener('keyup', e => {
    const k = e.key;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') st.keys.r = false;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') st.keys.l = false;
  });
  addEventListener('blur', () => { st.keys.l = st.keys.r = false; st.hold = 0; });

  let wheelAcc = 0, wheelLock = 0;
  world.addEventListener('wheel', e => {
    if (st.paused) return;
    e.preventDefault();
    let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) d *= 16;
    if (d > 0) wantsForward();
    if (!st.gateOpen) return;
    interrupt();
    if (E.reduced) {
      wheelAcc += d;
      const now = performance.now();
      if (Math.abs(wheelAcc) > 60 && now > wheelLock) { E.step(Math.sign(wheelAcc)); wheelAcc = 0; wheelLock = now + 700; }
      return;
    }
    st.v = Math.max(-MAX_V * 1.15, Math.min(MAX_V * 1.15, st.v + d * WHEEL_GAIN));
    st.wheelT = performance.now();
  }, { passive: false });

  let drag = null;
  world.addEventListener('pointerdown', e => {
    if (st.paused || e.button > 0 || e.target.closest('.hotspot')) return;
    if (!st.gateOpen && e.target.closest('.landmark[data-stop="popolo"]')) return;
    drag = { x0: e.clientX, x: e.clientX, t: performance.now(), moved: 0 };
    world.setPointerCapture(e.pointerId);
  });
  world.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, now = performance.now();
    drag.moved += Math.abs(dx);
    if (drag.moved > 6) {
      if (!st.dragging) { st.dragging = true; interrupt(); }
      if (dx < 0) wantsForward();
      if (st.gateOpen && !E.reduced) {
        const dt = Math.max(1, now - drag.t) / 1000;
        st.x = clampX(st.x - dx * 1.25);
        st.v = (-dx * 1.25) / dt * 0.6 + st.v * 0.4;
      }
    }
    drag.x = e.clientX; drag.t = now;
  });
  const endDrag = e => {
    if (!drag) return;
    const total = e.clientX - drag.x0;
    if (st.dragging && E.reduced && Math.abs(total) > 50) E.step(total < 0 ? 1 : -1);
    if (!st.dragging) emit('tap-world', e);
    st.v = Math.max(-MAX_V * 1.6, Math.min(MAX_V * 1.6, st.v));
    st.dragging = false; drag = null;
  };
  world.addEventListener('pointerup', endDrag);
  world.addEventListener('pointercancel', endDrag);

  // ---- public controls -------------------------------------------------------
  E.setHold = dir => {
    if (dir) { interrupt(); if (dir > 0) wantsForward(); if (E.reduced && st.gateOpen) { E.step(dir); return; } }
    st.hold = dir;
  };
  E.setPaused = b => { st.paused = b; if (b) { st.keys.l = st.keys.r = false; st.hold = 0; } };
  E.openGate = () => {
    if (st.gateOpen || st.gateOpening) return;
    st.gateOpening = true;
    stops[0].el.classList.add('gate-open');
    emit('gate');
    const done = () => { st.gateOpen = true; st.gateOpening = false; emit('gate-open'); };
    if (E.reduced) done(); else setTimeout(done, 750);
  };
  E.goTo = (i, opts = {}) => new Promise(resolve => {
    i = Math.max(0, Math.min(stops.length - 1, i));
    if (!st.gateOpen) { stops[0].el.classList.add('gate-open'); st.gateOpen = true; emit('gate-open'); }
    if (opts.instant || E.reduced) {
      const jump = () => { st.x = stops[i].x; st.v = 0; st.cam = st.x - st.vw * WALKER_FRAC; render(0, true); resolve(); };
      if (E.reduced && !opts.instant) fade(jump); else jump();
      return;
    }
    if (Math.abs(stops[i].x - st.x) < 2) { resolve(); return; }
    st.auto = i; st.autoResolve = resolve;
  });
  E.step = dir => {
    const i = Math.max(0, Math.min(stops.length - 1, st.zone + dir));
    if (i !== st.zone || Math.abs(stops[i].x - st.x) > 2) E.goTo(i);
  };
  function fade(fn) {
    world.classList.add('fading');
    setTimeout(() => { fn(); world.classList.remove('fading'); }, 180);
  }
  const clampX = x => Math.max(st.gateOpen ? MIN_X : stops[0].x, Math.min(MAX_X, x));

  // ---- loop --------------------------------------------------------------------
  let last = performance.now(), fpsAcc = 0, fpsN = 0, fps = 60;
  const ease = (tau, dt) => 1 - Math.exp(-dt / tau);

  function physics(dt, now) {
    if (!st.gateOpen) { st.x = stops[0].x; st.v = 0; return; }
    const dir = Math.sign(inputDir());
    if (st.auto !== null) {
      const dx = stops[st.auto].x - st.x;
      const desired = Math.max(-FAST_V, Math.min(FAST_V, dx * 2.6));
      st.v += (desired - st.v) * ease(0.18, dt);
      if (Math.abs(dx) < 2 && Math.abs(st.v) < 60) {
        st.x = stops[st.auto].x; st.v = 0;
        const r = st.autoResolve; st.auto = null; st.autoResolve = null; r && r();
        return;
      }
    } else if (dir) {
      st.v += (dir * MAX_V - st.v) * ease(ACCEL_TAU, dt);
    } else if (!st.dragging) {
      const wheeling = now - st.wheelT < 160;
      const near = nearest();
      if (!wheeling && Math.abs(st.v) < SNAP_MAX_V && Math.abs(near.d) < SNAP_RADIUS) {
        const a = SNAP_K * near.d - SNAP_C * st.v;
        st.v = Math.max(-420, Math.min(420, st.v + a * dt)); // gentle glide, never a jump
        if (Math.abs(near.d) < 1.5 && Math.abs(st.v) < 8) { st.x = near.s.x; st.v = 0; }
      } else {
        st.v *= Math.exp(-dt / COAST_TAU);
        if (Math.abs(st.v) < 4) st.v = 0;
      }
    }
    if (!st.dragging) {
      const nx = clampX(st.x + st.v * dt);
      if (nx !== st.x + st.v * dt) st.v = 0;
      st.x = nx;
    }
  }

  function nearest() {
    let best = stops[0], bd = Infinity;
    for (const s of stops) { const d = s.x - st.x; if (Math.abs(d) < Math.abs(bd)) { bd = d; best = s; } }
    return { s: best, d: bd };
  }

  function render(dt, force) {
    const target = st.x - st.vw * WALKER_FRAC;
    st.cam = force || E.reduced ? target : st.cam + (target - st.cam) * ease(CAM_TAU, dt);
    const c = st.cam;
    L.clouds.style.transform = `translate3d(${-c * SPEED.sky}px,0,0)`;
    L.far.style.transform = `translate3d(${-c * SPEED.far}px,0,0)`;
    L.lm.style.transform = `translate3d(${-c * SPEED.lm}px,0,0)`;
    L.street.style.transform = `translate3d(${-c}px,0,0)`;
    L.fg.style.transform = `translate3d(${-c * SPEED.fg}px,0,0)`;
    L.walker.style.transform = `translate3d(${st.x - (parseFloat(L.walker.style.width) || 30) / 2}px,0,0) scaleX(${st.facing * (A.walker && A.walker.facesLeft ? -1 : 1)})`;
    // Ahead of you the next building is smaller and higher, so walking toward it reads as distance, not a flat stage.
    stops.forEach(s => {
      const d = (s.x - st.x) / SPACING;
      const ad = Math.abs(d);
      const sc = ad < 0.05 ? 1 : Math.max(0.36, 1 - (ad - 0.05) * 0.58);
      const lift = Math.max(0, d) * st.vh * 0.05;
      s.el.style.transformOrigin = '50% 100%';
      s.el.style.transform = sc === 1 && lift === 0 ? '' : `translateY(${-lift.toFixed(1)}px) scale(${sc.toFixed(3)})`;
      s.el.style.zIndex = String(30 - Math.round(ad * 6));
    });

    // time of day
    st.p = Math.max(0, Math.min(1, (st.x - stops[0].x) / (stops[stops.length - 1].x - stops[0].x)));
    if (force || Math.abs(st.p - st.lastP) > 0.002) { light(st.p); st.lastP = st.p; }
  }

  function zones() {
    const { s, d } = nearest();
    const ad = Math.abs(d);
    const mode = ad < 3 && Math.abs(st.v) < 12 && st.auto === null ? 'at' : ad < APPROACH_R ? 'approach' : 'walking';
    if (mode !== st.mode || s.index !== st.zone) {
      const prevZone = st.zone;
      st.mode = mode; st.zone = s.index;
      emit('mode', mode, s, prevZone);
    }
    emit('frame', { stop: s, dist: d, mode });
  }

  function ambient(dt) {
    const moving = Math.abs(st.v) > 30;
    if (st.v > 20) st.facing = 1; else if (st.v < -20) st.facing = -1;
    L.walker.classList.toggle('walking', moving);
    if (L.sheet) {
      const n = A.walker.frames || 8;
      st.stride = (st.stride || 0) + Math.abs(st.v) * dt;
      const f = moving ? Math.floor(st.stride / 26) % n : 0;
      L.sheet.style.backgroundPosition = `${(f / (n - 1)) * 100}% 0`;
    }
    L.walker.style.setProperty('--gait', `${Math.max(0.32, Math.min(0.7, 260 / Math.max(1, Math.abs(st.v))))}s`);
    if (moving !== st.moving) { st.moving = moving; if (moving) emit('move-start'); }
    for (const b of birds) {
      const d = Math.abs(b.x - st.x);
      if (d < 170) b.el.classList.add('fly');
      else if (d > 1400) b.el.classList.remove('fly');
    }
    Rome.sound && Rome.sound.tick(dt, st.v, st.x, stops[stops.length - 1].x);
  }

  const dbg = params.get('debug') ? document.createElement('pre') : null;
  if (dbg) { dbg.className = 'debug'; document.body.appendChild(dbg); }

  function tick(now) {
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    // fixed sub-steps: walking speed stays the same on slow machines
    if (!E.reduced) { const n = Math.ceil(dt / (1 / 60)); for (let k = 0; k < n; k++) physics(dt / n, now); }
    render(dt, false);
    zones();
    ambient(dt);
    if (dbg) {
      fpsAcc += dt; fpsN++;
      if (fpsAcc > 0.5) { fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
      dbg.textContent = `x ${st.x.toFixed(0)}  v ${st.v.toFixed(0)}\nmode ${st.mode}  stop ${stops[st.zone].id}\np ${st.p.toFixed(2)}  fps ${fps}  ${E.reduced ? 'REDUCED' : 'full motion'}`;
    }
    requestAnimationFrame(tick);
  }

  E.start = () => { layout(); requestAnimationFrame(t => { last = t; tick(t); }); };
  E.landmarkEl = i => stops[i].el;
  E.screenXOfStop = i => stops[i].x - st.cam;
  E.metrics = () => ({ groundY: st.groundY, scale: st.scale, vw: st.vw, vh: st.vh });

  // test hook
  window.__rome = {
    state: E.state,
    goTo: (i, instant = true) => E.goTo(i, { instant }),
    layers: () => Object.fromEntries(['far', 'lm', 'street', 'fg'].map(k => [k, new DOMMatrix(getComputedStyle(L[k]).transform).m41]))
  };
})();
