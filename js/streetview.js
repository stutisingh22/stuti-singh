/* ==========================================================================
   streetview.js — the walk, Street-View style.
   You stand inside a panorama (360° equirectangular, or a wide flat image),
   drag to look around, and click the arrows on the ground to walk. Walking
   is a dreamy push-in: turn, drift forward, soft blur and bloom, then the
   next view resolves around you.

   Emits the same events ui.js has always used: mode, frame, input,
   move-start, tap-world, gate, gate-open.
   DO NOT replace this with a slideshow or a side-scroller.
   ========================================================================== */
window.Rome = window.Rome || {};
(function () {
  const params = new URLSearchParams(location.search);
  const E = (Rome.engine = {});
  const A = Rome.ASSETS || {};
  const PANOS = A.panos || {};
  const VIEWS = Rome.VIEWS || {};
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;

  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  E.reduced = params.get('motion') === 'reduced' || (params.get('motion') !== 'full' && mq.matches);
  document.documentElement.classList.toggle('reduced', E.reduced);
  document.documentElement.classList.toggle('lite', params.get('fx') === 'lite');
  E.editing = !!params.get('edit');

  const handlers = {};
  E.on = (evt, fn) => (handlers[evt] = handlers[evt] || []).push(fn);
  const emit = (evt, ...a) => (handlers[evt] || []).forEach(fn => fn(...a));

  // ---- route: stops + street nodes between them ------------------------------
  const stops = Rome.STOPS.map((s, i) => ({ ...s, index: i }));
  E.stops = stops;
  const nodes = [];
  stops.forEach((s, i) => {
    nodes.push({ id: s.id, name: s.name, stop: s, stopIndex: i, map: s.map });
    const st = Rome.SHOW_STREETS !== false && Rome.STREETS && Rome.STREETS[s.id];
    if (st && i < stops.length - 1) {
      const nx = stops[i + 1].map;
      nodes.push({ id: st.id, name: st.name, street: true, stopIndex: i, map: { x: (s.map.x + nx.x) / 2, y: (s.map.y + nx.y) / 2 } });
    }
  });
  nodes.forEach((n, k) => {
    const cfg = PANOS[n.id] || {}, v = VIEWS[n.id] || {};
    n.k = k; n.p = k / (nodes.length - 1);
    n.cfg = cfg;
    n.flat = cfg.type === 'flat';
    n.hfov = cfg.hfov || 110;
    const flatEdge = n.hfov / 2 - 14;
    n.arriveYaw = v.arriveYaw ?? 0;
    n.nextYaw = v.nextYaw ?? (n.flat ? flatEdge : n.stop ? 34 : 0);
    n.backYaw = v.backYaw ?? (n.flat ? -flatEdge : n.stop ? -150 : 180);
    if (n.stop) n.stop.node = n;
  });
  E.nodes = nodes;

  // ---- state ---------------------------------------------------------------------
  const st = {
    k: 0, lon: 0, lat: -2, fov: 72, baseFov: 72, vLon: 0, vLat: 0,
    paused: false, trans: null, gateOpen: false, mode: null, lastInput: performance.now(),
    keys: { l: false, r: false }, cardOpen: false
  };
  const node = () => nodes[st.k];
  E.state = () => {
    const n = node();
    return { node: n.id, k: st.k, zone: n.stopIndex, mode: st.trans ? 'walking' : n.stop ? 'at' : 'walking',
      lon: st.lon, lat: st.lat, fov: st.fov, gateOpen: st.gateOpen, reduced: E.reduced, walking: !!st.trans, map: n.map, p: n.p };
  };

  // ---- DOM ---------------------------------------------------------------------------
  const world = document.getElementById('world');
  world.innerHTML = `
    <div class="sv-stage"></div>
    <div class="sv-grade" aria-hidden="true"></div>
    <div class="sv-leak a" aria-hidden="true"></div><div class="sv-leak b" aria-hidden="true"></div>
    <canvas class="sv-motes" aria-hidden="true"></canvas>
    <div class="vignette" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div>
    <div class="sv-hotspots"></div>
    <div class="sv-arrows"></div>
    <div class="sv-title" aria-hidden="true"><strong></strong><span></span></div>
    <div class="sv-caption" aria-live="polite"></div>`;
  const stage = world.querySelector('.sv-stage');
  const hsRoot = world.querySelector('.sv-hotspots');
  const arrowsRoot = world.querySelector('.sv-arrows');
  const titleEl = world.querySelector('.sv-title');
  const captionEl = world.querySelector('.sv-caption');
  const gradeEl = world.querySelector('.sv-grade');

  // one overlay per stop holds its hotspots (ui.js appends the buttons)
  stops.forEach(s => {
    const el = document.createElement('div');
    el.className = 'sv-stop landmark';
    el.dataset.stop = s.id;
    if (s.id === 'trevi') el.innerHTML = '<i class="sv-coin"></i><i class="sv-splash"></i>';
    hsRoot.appendChild(el);
    s.el = el;
  });

  // ---- three.js ------------------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  stage.appendChild(renderer.domElement);
  const canvas = renderer.domElement;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(72, 1, 1, 1100);

  // yaw 0 = centre of the image. SphereGeometry puts u=0.5 at -X; rotate it to -Z.
  const BASE_ROT = -Math.PI / 2;
  const dir = (yaw, pitch = 0) => new THREE.Vector3(Math.cos(pitch * D2R) * Math.sin(yaw * D2R), Math.sin(pitch * D2R), -Math.cos(pitch * D2R) * Math.cos(yaw * D2R));

  function geometryFor(n, tex) {
    if (!n.flat) { const g = new THREE.SphereGeometry(500, 72, 48); g.scale(-1, 1, 1); return g; }
    const img = tex.image, aspect = img ? img.width / img.height : 16 / 9;
    const phiLen = n.hfov * D2R, thetaLen = Math.min(Math.PI * 0.95, phiLen / aspect);
    n.vfov = thetaLen * R2D;
    const g = new THREE.SphereGeometry(500, 72, 48, Math.PI - phiLen / 2, phiLen, Math.PI / 2 - thetaLen / 2, thetaLen);
    g.scale(-1, 1, 1); return g;
  }
  function makeMesh(n, tex) {
    const m = new THREE.Mesh(geometryFor(n, tex), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 1, depthWrite: false }));
    m.rotation.y = BASE_ROT;
    return m;
  }

  // textures: real image if provided, otherwise a dreamy painted placeholder
  const texCache = {};
  const loader = new THREE.TextureLoader();
  function texture(n) {
    if (texCache[n.id]) return texCache[n.id];
    texCache[n.id] = new Promise(res => {
      const done = t => { t.encoding = THREE.sRGBEncoding; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); res(t); };
      if (n.cfg.src) loader.load(n.cfg.src, done, undefined, () => { console.warn('Could not load', n.cfg.src, '— using placeholder'); n.flat = false; done(placeholder(n)); });
      else done(placeholder(n));
    });
    return texCache[n.id];
  }

  // ---- placeholder panorama (clearly a sketch; replace with generated art) -------
  const SKY = [[0, ['#8d9cc8', '#f4c7b0', '#f9e2cf']], [0.45, ['#7fb0de', '#f3e2c4', '#fbf0dc']], [0.8, ['#6f86c0', '#f5b97e', '#fde0b5']], [1, ['#232850', '#c96a55', '#f0a57c']]];
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lerpC = (a, b, t) => 'rgb(' + hx(a).map((c, i) => Math.round(c + (hx(b)[i] - c) * t)).join(',') + ')';
  const skyAt = p => { let i = 0; while (i < SKY.length - 2 && p > SKY[i + 1][0]) i++; const t = (p - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]); return SKY[i][1].map((c, j) => lerpC(c, SKY[i + 1][1][j], Math.max(0, Math.min(1, t)))); };
  function placeholder(n) {
    // Deliberately cheap (no canvas filters) so it is instant on any machine.
    const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); const [top, mid, low] = skyAt(n.p);
    let gr = g.createLinearGradient(0, 0, 0, H * 0.52); gr.addColorStop(0, top); gr.addColorStop(0.7, mid); gr.addColorStop(1, low);
    g.fillStyle = gr; g.fillRect(0, 0, W, H * 0.52);
    const sx = W / 2 + (n.p - 0.5) * 260, sy = H * (0.3 + Math.abs(n.p - 0.45) * 0.22);
    gr = g.createRadialGradient(sx, sy, 0, sx, sy, 150); gr.addColorStop(0, 'rgba(255,246,224,.95)'); gr.addColorStop(0.18, 'rgba(255,226,182,.45)'); gr.addColorStop(1, 'rgba(255,220,180,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    let seed = n.k * 131 + 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 14; i++) {             // soft clouds from radial gradients
      const x = rnd() * W, y = 40 + rnd() * 120, r = 50 + rnd() * 90;
      gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.save(); g.translate(x, y); g.scale(1, 0.22); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
    }
    [[0.49, 0.28, '#8f86a3'], [0.52, 0.45, '#7a6a66']].forEach(([base, alpha, col], layer) => {
      g.globalAlpha = alpha; g.fillStyle = col;
      for (let x = -20; x < W + 20; x += 18 + rnd() * 36) {
        const h = 12 + rnd() * (layer ? 40 : 28), w = 20 + rnd() * 40, y = H * base;
        g.fillRect(x, y - h, w, h + 20);
        if (rnd() > 0.82) { g.beginPath(); g.ellipse(x + w / 2, y - h, w / 2, w / 2.4, 0, Math.PI, 0); g.fill(); }
        if (rnd() > 0.88) { g.fillRect(x + w / 2 - 1.5, y - h - 34, 3, 34); g.beginPath(); g.ellipse(x + w / 2, y - h - 34, 28, 7, 0, 0, 7); g.fill(); }
      }
    });
    g.globalAlpha = 1;
    if (n.stop) {                              // a soft marker where the landmark will stand
      g.fillStyle = 'rgba(236,216,188,.9)';
      g.fillRect(W / 2 - 46, H * 0.36, 92, H * 0.16);
      g.beginPath(); g.moveTo(W / 2 - 54, H * 0.36); g.lineTo(W / 2, H * 0.31); g.lineTo(W / 2 + 54, H * 0.36); g.fill();
      g.fillStyle = 'rgba(180,150,120,.6)';
      for (let i = 0; i < 6; i++) g.fillRect(W / 2 - 40 + i * 15, H * 0.385, 5, H * 0.13);
    }
    gr = g.createLinearGradient(0, H * 0.52, 0, H); gr.addColorStop(0, low); gr.addColorStop(0.08, '#b89a7d'); gr.addColorStop(1, '#5e4a3e');
    g.fillStyle = gr; g.fillRect(0, H * 0.52, W, H * 0.48);
    g.globalAlpha = 0.14; g.strokeStyle = '#3d2f28';
    for (let y = H * 0.535, st2 = 2; y < H; y += st2, st2 *= 1.14) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.globalAlpha = 1;
    gr = g.createLinearGradient(0, H * 0.44, 0, H * 0.58); gr.addColorStop(0, 'rgba(255,240,225,0)'); gr.addColorStop(0.5, 'rgba(255,238,222,.4)'); gr.addColorStop(1, 'rgba(255,240,225,0)');
    g.fillStyle = gr; g.fillRect(0, H * 0.44, W, H * 0.14);
    g.fillStyle = 'rgba(40,30,30,.4)'; g.font = '600 12px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText(`${n.name} · placeholder · add art/raw/${n.id}.jpg`, W / 2, H * 0.86);
    const t = new THREE.CanvasTexture(c); t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t;
  }

  // ---- scene switching -----------------------------------------------------------------
  let cur = null, nxt = null;
  async function show(k, yaw) {
    const n = nodes[k];
    const tex = await texture(n);
    if (cur) { scene.remove(cur); cur.geometry.dispose(); cur.material.dispose(); }
    cur = makeMesh(n, tex); scene.add(cur);
    st.k = k; st.lon = yaw ?? n.arriveYaw; st.lat = -2; st.vLon = st.vLat = 0; st.lastInput = performance.now();
    arrive(n);
    preloadAround(k);
  }
  function preloadAround(k) { [k - 1, k + 1, k + 2].forEach(i => nodes[i] && texture(nodes[i])); }

  function arrive(n) {
    buildArrows(n);
    stops.forEach(s => (s.el.style.display = s === n.stop ? '' : 'none'));
    const [, mid] = skyAt(n.p);
    gradeEl.style.background = mid;
    if (n.stop) {
      titleEl.querySelector('strong').textContent = n.stop.labelTitle || n.name;
      titleEl.querySelector('span').textContent = n.stop.labelLine;
      titleEl.classList.remove('show'); void titleEl.offsetWidth; titleEl.classList.add('show');
      document.body.classList.add('titling');
      clearTimeout(arrive.t); arrive.t = setTimeout(() => document.body.classList.remove('titling'), 3200);
      captionEl.textContent = '';
    } else {
      captionEl.textContent = n.name;
    }
  }

  // ---- walk arrows (on the ground, like Street View) -----------------------------------
  function buildArrows(n) {
    arrowsRoot.innerHTML = '';
    const links = [];
    if (n.k < nodes.length - 1) links.push({ dir: 1, yaw: n.nextYaw, label: nextStopName(n.k, 1) });
    if (n.k > 0) links.push({ dir: -1, yaw: n.backYaw, label: nextStopName(n.k, -1) });
    n.links = links.map(l => {
      const b = document.createElement('button');
      b.className = 'sv-arrow'; b.style.opacity = 0; b.setAttribute('aria-label', `Walk ${l.dir > 0 ? 'on' : 'back'} towards ${l.label}`);
      b.innerHTML = `<span class="chev" aria-hidden="true"></span><em>${l.dir > 0 ? 'Towards' : 'Back to'} ${l.label}</em>`;
      b.addEventListener('click', e => { e.stopPropagation(); E.step(l.dir); });
      arrowsRoot.appendChild(b);
      return { ...l, el: b };
    });
  }
  function nextStopName(k, d) {
    for (let i = k + d; i >= 0 && i < nodes.length; i += d) if (nodes[i].stop) return nodes[i].stop.name;
    return nodes[k + d].name;
  }

  // ---- walking (the dreamy transition) ----------------------------------------------------
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const angDiff = (a, b) => ((b - a + 540) % 360) - 180;

  function walkTo(k, linkYaw, arriveYaw, opts) {
    return new Promise(async resolve => {
      if (st.trans || k === st.k || !nodes[k]) return resolve();
      const n = nodes[k];
      emit('input');
      st.trans = { phase: 'turn', t0: performance.now(), from: st.lon, to: st.lon + angDiff(st.lon, linkYaw), resolve, k, arriveYaw, n, scrub: !!(opts && opts.scrub), tp: 0 };
      emitMode();
      clampView(nodes[st.k]);
      const tex = await texture(n);
      if (!st.trans) return;
      nxt = makeMesh(n, tex);
      nxt.material.opacity = 0;
      nxt.rotation.y = BASE_ROT + (arriveYaw - linkYaw) * D2R;   // keeps the view continuous
      scene.add(nxt);
      st.trans.ready = true;
    });
  }

  function endWalk(now) {
    const T = st.trans; if (!T) return;
    clearTimeout(settleTimer);
    if (cur) { scene.remove(cur); cur.geometry.dispose(); cur.material.dispose(); }
    cur = nxt; nxt = null;
    if (cur) { cur.material.opacity = 1; cur.rotation.y = BASE_ROT; }
    st.k = T.k; st.lon = T.arriveYaw; if (!E.reduced) st.fov = st.baseFov; st.vLon = st.vLat = 0;
    canvas.style.filter = ''; world.style.setProperty('--walk-glow', 0);
    st.trans = null;
    arrive(T.n); preloadAround(T.k); st.lastInput = now;
    emitMode();
    T.resolve();
  }
  function dropWalk() {
    const T = st.trans; if (!T) return;
    clearTimeout(settleTimer);
    if (nxt) { scene.remove(nxt); nxt.geometry.dispose(); nxt.material.dispose(); nxt = null; }
    if (cur) { cur.material.opacity = 1; cur.rotation.y = BASE_ROT; }
    st.fov = st.baseFov; st.vLon = st.vLat = 0;
    canvas.style.filter = ''; world.style.setProperty('--walk-glow', 0);
    st.trans = null;
    emitMode();
    T.resolve();
  }
  // Scroll owns the blend: the next street fades in as the wheel moves, then settles.
  function scrubStep(now) {
    const T = st.trans;
    if (!T.ready || !nxt) return;
    if (T.fov0 == null) T.fov0 = st.fov;
    if (T.coast != null) {
      T.tp += (T.coast - T.tp) * 0.18;
      if (Math.abs(T.coast - T.tp) < 0.04) T.tp = T.coast;
    }
    const t = Math.max(0, Math.min(1, T.tp || 0));
    st.lon = T.from + (T.to - T.from) * Math.min(1, t / 0.4);
    st.lat += (-2 - st.lat) * 0.12;
    nxt.material.opacity = t;
    if (cur) cur.material.opacity = 1 - t * 0.999;
    if (!E.reduced) {
      const depth = Math.sin(Math.PI * t);
      st.fov = T.fov0 - T.fov0 * 0.34 * depth;
      canvas.style.filter = `brightness(${(1 + depth * 0.05).toFixed(3)})`;
      world.style.setProperty('--walk-glow', (depth * 0.2).toFixed(3));
    }
    if (t >= 1) endWalk(now);
    else if (t <= 0 && T.coast === 0) dropWalk();
  }

  function stepTransition(now) {
    const T = st.trans; if (!T) return;
    if (T.scrub) { scrubStep(now); return; }
    const TURN = E.reduced ? 1 : Math.min(450, Math.abs(T.to - T.from) * 4 + 1), PUSH = E.reduced ? 450 : 2200;
    // progress is time-based but never jumps more than 1/12 per frame, so even a
    // slow machine shows the whole walk instead of cutting straight to the next view
    const dtp = Math.min(now - (T.last || now), 1e9); T.last = now;
    if (T.phase === 'turn') {
      T.tt = Math.min(1, (T.tt || 0) + Math.min(dtp / TURN, 1 / 6));
      const t = T.tt;
      st.lon = T.from + (T.to - T.from) * ease(t);
      st.lat += (-2 - st.lat) * 0.2;
      if (t >= 1 && T.ready) { T.phase = 'push'; T.t0 = now; T.fov0 = st.fov; T.tp = 0; }
      return;
    }
    T.tp = Math.min(1, T.tp + Math.min(dtp / PUSH, 1 / 12));
    const t = T.tp;
    // Walk the street you're on. The next picture arrives only once you're close.
    const blend = E.reduced ? t : Math.max(0, Math.min(1, (t - 0.62) / 0.22));
    T.blend = blend; T.approach = t;
    if (nxt) nxt.material.opacity = blend;
    if (cur) cur.material.opacity = 1 - blend * 0.999;
    if (!E.reduced) {
      st.fov = t < 0.62
        ? T.fov0 * (1 - 0.5 * ease(t / 0.62))
        : T.fov0 * 0.5 + (st.baseFov - T.fov0 * 0.5) * ease(Math.min(1, (t - 0.62) / 0.38));
      const glow = Math.sin(Math.PI * t);
      canvas.style.filter = `blur(${(Math.sin(Math.PI * blend) * 1.1).toFixed(2)}px) brightness(${(1 + glow * 0.05).toFixed(3)})`;
      world.style.setProperty('--walk-glow', (glow * 0.18).toFixed(3));
    }
    if (t >= 1) endWalk(now);
  }

  // ---- public controls -------------------------------------------------------------------
  E.step = (d, opts) => {
    const n = node(), k = st.k + d;
    if (!nodes[k] || st.trans) return Promise.resolve();
    if (!st.gateOpen) E.openGate();
    const linkYaw = d > 0 ? n.nextYaw : n.backYaw;
    const arriveYaw = d > 0 ? nodes[k].arriveYaw : nodes[k].nextYaw + 180;
    return walkTo(k, linkYaw, arriveYaw, opts);
  };
  E.goTo = (i, opts = {}) => {
    const n = stops[Math.max(0, Math.min(stops.length - 1, i))].node;
    if (!st.gateOpen) { st.gateOpen = true; emit('gate-open'); }
    if (opts.instant) return show(n.k).then(() => emitMode());
    if (n.k === st.k) return Promise.resolve();
    return walkTo(n.k, st.lon, n.arriveYaw);
  };
  E.openGate = () => {
    if (st.gateOpen) { E.step(1); return; }
    st.gateOpen = true; stops[0].el.classList.add('gate-open');
    emit('gate'); emit('gate-open');
  };
  E.setHold = d => { if (d) E.step(d); };
  E.setPaused = b => { st.paused = b; st.keys.l = st.keys.r = false; };
  E.lookAt = (yaw, pitch = 0) => new Promise(res => {
    const from = st.lon, to = st.lon + angDiff(st.lon, yaw), fromLat = st.lat, t0 = performance.now(), D = E.reduced ? 1 : 500;
    (function f(now) { const t = Math.min(1, (now - t0) / D), e = ease(t); st.lon = from + (to - from) * e; st.lat = fromLat + (pitch * 0.6 - fromLat) * e; if (t < 1) requestAnimationFrame(f); else res(); })(t0);
  });
  E.angles = (hs, n = node()) => {
    if (hs.yaw != null) return { yaw: hs.yaw, pitch: hs.pitch || 0 };
    if (n.flat) return { yaw: (hs.x / 100 - 0.5) * n.hfov, pitch: (0.5 - hs.y / 100) * (n.vfov || n.hfov * 0.5625) };
    return { yaw: (hs.x - 50) * 1.1, pitch: (52 - hs.y) * 0.55 };
  };
  E.isOffscreen = hs => hs.btn && hs.btn.classList.contains('edge');
  E.metrics = () => ({ vw: innerWidth, vh: innerHeight });
  E.screenDir = (x, y) => {                                   // screen point → yaw/pitch (for the editor)
    const v = new THREE.Vector3((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1, 0.5).unproject(camera).normalize();
    return { yaw: Math.round(Math.atan2(v.x, -v.z) * R2D * 10) / 10, pitch: Math.round(Math.asin(v.y) * R2D * 10) / 10 };
  };

  // ---- input: look around ---------------------------------------------------------------------
  let drag = null;
  canvas.style.touchAction = 'none';
  world.addEventListener('pointerdown', e => {
    if (st.paused || e.button > 0 || e.target.closest('.hotspot, .sv-arrow')) return;
    drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), moved: 0 };
    world.setPointerCapture(e.pointerId);
  });
  world.addEventListener('pointermove', e => {
    if (!drag || st.trans) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now();
    drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved > 6 && !drag.started) { drag.started = true; emit('move-start'); }
    const k = 0.12 * (st.fov / 72) * (innerWidth < 700 ? 1.4 : 1);
    st.lon -= dx * k; st.lat += dy * k;
    const dt = Math.max(8, now - drag.t);
    st.vLon = (-dx * k) / dt * 1000; st.vLat = (dy * k) / dt * 1000;
    drag.x = e.clientX; drag.y = e.clientY; drag.t = now; st.lastInput = now;
  });
  const endDrag = () => { if (!drag) return; if (drag.moved <= 6) emit('tap-world'); if (performance.now() - drag.t > 80) st.vLon = st.vLat = 0; drag = null; };
  world.addEventListener('pointerup', endDrag);
  world.addEventListener('pointercancel', endDrag);
  let settleTimer = 0;
  const armSettle = () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const T = st.trans;
      if (!T || !T.scrub) return;
      T.coast = (T.tp || 0) > 0.16 ? 1 : 0;
    }, 160);
  };
  world.addEventListener('wheel', e => {
    if (st.paused) return;
    e.preventDefault();
    st.lastInput = performance.now();
    let dy = e.deltaY || 0;
    if (e.deltaMode === 1) dy *= 32;
    else if (e.deltaMode === 2) dy *= innerHeight;
    if (!dy) return;
    const T = st.trans;
    if (T && !T.scrub) return;
    if (T && T.scrub) {
      T.coast = null;
      T.tp = Math.max(0, Math.min(1, (T.tp || 0) + dy / 560));
      armSettle();
      return;
    }
    const dir = dy > 0 ? 1 : -1;
    if (!nodes[st.k + dir]) return;
    if (!st.gateOpen) E.openGate();
    if (st.trans) return;
    E.step(dir, { scrub: true });
    if (st.trans && st.trans.scrub) {
      st.trans.tp = Math.min(1, Math.abs(dy) / 560);
      armSettle();
    }
  }, { passive: false });
  addEventListener('keydown', e => {
    if (st.paused || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); if (!e.repeat) walkNearest(); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); if (!e.repeat) E.step(-1); }
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); st.keys.l = true; emit('move-start'); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); st.keys.r = true; emit('move-start'); }
    else return;
    st.lastInput = performance.now();
  });
  // any mouse movement pauses the idle drift, so markers hold still while you reach for them
  addEventListener('pointermove', () => { st.lastInput = performance.now(); }, { passive: true });
  addEventListener('keyup', e => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) st.keys.l = false;
    if (['ArrowRight', 'd', 'D'].includes(e.key)) st.keys.r = false;
  });
  function walkNearest() {                                 // ↑ walks along the arrow you're facing
    const n = node(); if (!n.links || !n.links.length) return;
    const best = n.links.reduce((a, b) => Math.abs(angDiff(st.lon, a.yaw)) < Math.abs(angDiff(st.lon, b.yaw)) ? a : b);
    E.step(Math.abs(angDiff(st.lon, best.yaw)) < 100 ? best.dir : 1);
  }

  // ---- per-frame ---------------------------------------------------------------------------------
  const tmp = new THREE.Vector3();
  function project(yaw, pitch) {
    tmp.copy(dir(yaw, pitch)).multiplyScalar(100).project(camera);
    return { x: (tmp.x + 1) / 2 * innerWidth, y: (1 - tmp.y) / 2 * innerHeight, behind: tmp.z > 1 };
  }
  function clampView(n) {
    st.lat = Math.max(-70, Math.min(70, st.lat));
    if (!n.flat || (st.trans && !E.reduced)) return;
    // a flat image only covers part of the sphere: zoom in far enough that its edges never show
    const vImg = n.vfov || 50, hImg = n.hfov;
    const fovCap = Math.min(vImg * 0.98, 2 * Math.atan(Math.tan(hImg * D2R / 2) / camera.aspect) * R2D * 0.98);
    if (st.fov > fovCap) { st.fov = fovCap; camera.fov = st.fov; camera.updateProjectionMatrix(); }
    const vf = st.fov, hf = 2 * Math.atan(Math.tan(vf * D2R / 2) * camera.aspect) * R2D;
    const yr = Math.max(0, (n.hfov - hf) / 2), pr = Math.max(0, ((n.vfov || 60) - vf) / 2);
    st.lon = Math.max(-yr, Math.min(yr, st.lon)); st.lat = Math.max(-pr, Math.min(pr, st.lat));
  }

  function place(now) {
    const n = node();
    // walk arrows sit on the ground ahead of you
    (n.links || []).forEach(l => {
      const p = project(l.yaw, -24), rel = angDiff(st.lon, l.yaw);
      const vis = !p.behind && !st.trans && p.x > -40 && p.x < innerWidth + 40;
      l.el.style.opacity = vis ? 1 : 0; l.el.style.pointerEvents = vis ? 'auto' : 'none';
      l.el.style.transform = `translate(${p.x}px, ${Math.min(p.y, innerHeight - 150)}px)`;
      l.el.querySelector('.chev').style.transform = `rotateX(58deg) rotateZ(${rel.toFixed(1)}deg)`;
    });
    // hotspots: pinned to their direction; off-screen ones wait at the edge
    if (n.stop) n.stop.hotspots.forEach(hs => {
      if (!hs.btn) return;
      const a = E.angles(hs, n), p = project(a.yaw, a.pitch), m = 36;
      let x = p.x, y = p.y, edge = false;
      if (p.behind || x < m || x > innerWidth - m || y < 80 || y > innerHeight - 80) {
        edge = true;
        const rel = angDiff(st.lon, a.yaw);
        x = rel < 0 ? m : innerWidth - m;
        y = Math.max(110, Math.min(innerHeight - 110, p.behind ? innerHeight / 2 : y));
      }
      hs.btn.classList.toggle('edge', edge && !E.editing);
      hs.btn.classList.toggle('edge-l', edge && !E.editing && x < innerWidth / 2);
      hs.btn.classList.toggle('edge-r', edge && !E.editing && x >= innerWidth / 2);
      hs.btn.style.left = `${x}px`; hs.btn.style.top = `${y}px`;
    });
  }

  function emitMode() {
    const s = E.state(), n = node();
    const key = s.mode + n.k;
    if (key !== st.modeKey) { st.modeKey = key; emit('mode', s.mode, stops[n.stopIndex], null); }
  }

  let last = performance.now(), fpsAcc = 0, fpsN = 0, fps = 60;
  const dbg = params.get('debug') ? Object.assign(document.createElement('pre'), { className: 'debug' }) : null;
  dbg && document.body.appendChild(dbg);

  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const n = node();
    if (!st.trans && !st.paused) {
      const turn = (st.keys.r ? 1 : 0) - (st.keys.l ? 1 : 0);
      if (turn) { st.lon += turn * 70 * dt; st.vLon = 0; }
      if (!drag) {                                          // gentle inertia after a flick
        st.lon += st.vLon * dt; st.lat += st.vLat * dt;
        const f = Math.exp(-dt / 0.35); st.vLon *= f; st.vLat *= f;
      }
      // idle: the view drifts slowly, like standing still and breathing it in
      const cardOpen = !!document.querySelector('.card.in');
      if (!E.reduced && !E.editing && !cardOpen && now - st.lastInput > 7000) { st.lon += 1.4 * dt; st.lat += (-2 - st.lat) * dt * 0.3; }
    }
    stepTransition(now);
    clampView(n);
    camera.fov = st.fov; camera.updateProjectionMatrix();
    camera.lookAt(dir(st.lon, st.lat));
    renderer.render(scene, camera);
    place(now);
    // How far the next picture has arrived. The crowd and the sentence follow this,
    // so the walk stays one film instead of a cut between slides.
    let blend = 0, approach = 0, toward = st.k;
    const T = st.trans;
    if (T && T.ready) {
      toward = T.k;
      if (T.scrub) blend = approach = Math.max(0, Math.min(1, T.tp || 0));
      else if (T.phase === 'push') { blend = T.blend || 0; approach = T.approach || 0; }
    }
    emit('frame', { stop: stops[n.stopIndex], dist: st.trans || !n.stop ? 9999 : 0, mode: E.state().mode, blend, approach, toward });
    if (dbg) {
      fpsAcc += dt; fpsN++; if (fpsAcc > 0.5) { fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
      dbg.textContent = `node ${n.id} (${n.k + 1}/${nodes.length})  ${n.cfg.src ? n.flat ? 'flat image' : '360 pano' : 'PLACEHOLDER'}\nyaw ${st.lon.toFixed(1)}  pitch ${st.lat.toFixed(1)}  fov ${st.fov.toFixed(0)}\nfps ${fps}  ${E.reduced ? 'REDUCED' : 'full motion'}`;
    }
    requestAnimationFrame(tick);
  }

  function resize() {
    const w = innerWidth, h = innerHeight;
    st.portrait = h > w;
    st.baseFov = st.portrait ? 92 : 72;
    if (!st.trans) st.fov = st.baseFov;
    renderer.setSize(w, h, false); canvas.style.width = '100%'; canvas.style.height = '100%';
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (nodes[st.k]) clampView(nodes[st.k]);
    motes.resize();
    emit('layout');
  }

  // ---- floating dust motes (dreamy, cheap) ----------------------------------------------------
  const motes = (() => {
    const c = world.querySelector('.sv-motes'), g = c.getContext('2d'); let ps = [];
    const resize = () => { c.width = innerWidth; c.height = innerHeight; ps = Array.from({ length: Math.round(innerWidth / 36) }, () => spawn(true)); };
    const spawn = any => ({ x: Math.random() * innerWidth, y: any ? Math.random() * innerHeight : innerHeight + 10, r: 0.8 + Math.random() * 2.2, s: 6 + Math.random() * 16, a: 0.15 + Math.random() * 0.45, w: Math.random() * 6.28 });
    const draw = dt => {
      if (E.reduced || document.documentElement.classList.contains('lite')) { g.clearRect(0, 0, c.width, c.height); return; }
      g.clearRect(0, 0, c.width, c.height);
      for (const p of ps) {
        p.y -= p.s * dt; p.w += dt * 0.6; p.x += Math.sin(p.w) * 0.25 - st.vLon * dt * 0.8;
        if (p.y < -10) Object.assign(p, spawn(false));
        if (p.x < -10) p.x += innerWidth + 20; if (p.x > innerWidth + 10) p.x -= innerWidth + 20;
        g.beginPath(); g.fillStyle = `rgba(255,240,215,${p.a})`; g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
      }
    };
    return { resize, draw };
  })();
  (function moteLoop(prev) { requestAnimationFrame(now => { motes.draw(Math.min(0.1, (now - prev) / 1000)); moteLoop(now); }); })(performance.now());

  addEventListener('resize', resize);
  E.start = async () => {
    resize();
    await show(0);
    stops[0].el.style.display = '';
    requestAnimationFrame(t => { last = t; tick(t); emitMode(); });
  };
  E.landmarkEl = i => stops[i].el;

  window.__rome = {
    state: E.state,
    goTo: (i, instant = true) => E.goTo(i, { instant }),
    step: d => E.step(d),
    look: (yaw, pitch = 0) => { st.lon = yaw; st.lat = pitch; },
    nodes: () => nodes.map(n => ({ id: n.id, stop: !!n.stop, src: n.cfg.src || '' }))
  };
})();
