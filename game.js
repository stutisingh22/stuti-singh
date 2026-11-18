/* Stuti Singh — the drive.
   The gameplay layer on top of world.js: you drive a car through the night city and find the
   11 stops of the career (every company, every system). Driving into a stop lights its neon;
   press E (or tap) to read it. The cards are the real page sections, moved into the game and
   back. "Read as a page" switches to the plain scrolling site. No build step. */
(function () {
  'use strict';
  var Wd = window.__world;
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  if (!Wd || !Wd.T) { html.classList.add('no-game'); return; }   // no WebGL: the page view is all there is

  var T = Wd.T, scene = Wd.scene, camera = Wd.camera, G = Wd.game, RW = Wd.RW;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- the 11 stops, in résumé order ---------- */
  var STOPS = [
    { k: 'arkandis',  name: 'Arkandis Labs',             sub: 'Founding Member & Engineer',      sec: 'arkandis',     mach: ['arkandis'],      at: [4, -42] },
    { k: 'redaction', name: 'Redaction tooling',         sub: 'Arkandis · 50M+ lines of code',   sec: 'redaction',    mach: ['redaction'],     at: [4, -26] },
    { k: 'lh2',       name: 'LH2 Holdings',              sub: 'Founder’s Office',                sec: 'lh2',          mach: ['lh2'],           at: [-4, -110] },
    { k: 'crm',       name: 'Contact intelligence CRM',  sub: 'LH2 · 95–97% accuracy',           sec: 'crm',          mach: ['crm'],           at: [-4, -146] },
    { k: 'research',  name: 'Research-Driven CRM',       sub: 'LH2 · human review',              sec: 'research-crm', mach: ['research'],      at: [4, -167] },
    { k: 'leads',     name: 'Lead qualification',        sub: 'LH2 · 10,000 sites',              sec: 'leads',        mach: ['leads'],         at: [-4, -189] },
    { k: 'inventory', name: 'Inventory Segmentor',       sub: 'LH2 · 1–2 TB',                    sec: 'inventory',    mach: ['inventory'],     at: [4, -211] },
    { k: 'wissen',    name: 'Wissen Technology',         sub: 'Data Analytics · 90% fewer errors', sec: 'wissen',     mach: ['wissen', 'etl'], at: [4, -262] },
    { k: 'analytics', name: 'KPI tower',                 sub: 'Wissen · KPIs & forecasts',       sec: 'tower',        mach: ['analytics'],     at: [-4, -300] },
    { k: 'iimb',      name: 'IIM Bangalore',             sub: 'Research · skills · education',   sec: 'more',         mach: ['iimb'],          at: [-72, -88] },
    { k: 'end',       name: 'Get in touch',              sub: 'The end of the avenue',           sec: 'contact',      mach: ['end'],           at: [2, -450] }
  ];
  var R_ZONE = 7.5, found = {}, nFound = 0;

  /* ---------- the car ---------- */
  var car = new T.Group(); scene.add(car);
  var chassis = new T.Group(); car.add(chassis);
  var paint = new T.MeshStandardMaterial({ color: 0xff6a33, roughness: .28, metalness: .65 });
  var glass = new T.MeshStandardMaterial({ color: 0x0e1320, roughness: .08, metalness: .9 });
  var dark = new T.MeshStandardMaterial({ color: 0x111216, roughness: .7, metalness: .3 });
  function box(w, h, d, m, x, y, z, parent) { var o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (parent || chassis).add(o); return o; }
  box(2.1, .55, 4.6, paint, 0, .72, 0);
  box(2.0, .28, 1.5, paint, 0, 1.06, -1.4);            // hood
  box(1.78, .58, 2.1, glass, 0, 1.3, .35);              // cabin
  box(1.9, .1, .5, dark, 0, 1.3, 2.15);                 // spoiler
  [-0.8, 0.8].forEach(function (x) { box(.1, .3, .1, dark, x, 1.12, 2.15); });
  var lightMat = new T.MeshBasicMaterial({ color: 0xfff2dc }), tailMat = new T.MeshBasicMaterial({ color: 0xff2a36 });
  [-0.66, 0.66].forEach(function (x) { box(.55, .14, .06, lightMat, x, .86, -2.31); box(.62, .14, .06, tailMat, x, .9, 2.31); });
  var wheels = [];
  [[-1.02, -1.45], [1.02, -1.45], [-1.02, 1.5], [1.02, 1.5]].forEach(function (p) {
    var wgeo = new T.CylinderGeometry(.44, .44, .36, 18); wgeo.rotateZ(Math.PI / 2);
    var w = new T.Mesh(wgeo, dark); w.position.set(p[0], .44, p[1]); car.add(w); wheels.push(w);
  });
  var glowTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.5, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c);
  })();
  var under = new T.Mesh(new T.PlaneGeometry(4.2, 7), new T.MeshBasicMaterial({ map: glowTex, color: 0xff7a45, transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false }));
  under.rotation.x = -Math.PI / 2; under.position.y = .05; car.add(under);
  var beamPool = new T.Mesh(new T.PlaneGeometry(9, 16), new T.MeshBasicMaterial({ map: glowTex, color: 0xffe2b8, transparent: true, opacity: .1, blending: T.AdditiveBlending, depthWrite: false }));
  beamPool.rotation.x = -Math.PI / 2; beamPool.position.set(0, .06, -11); car.add(beamPool);
  var headL = new T.SpotLight(0xffe8c8, 0, 45, .34, .6, 1.6); headL.position.set(0, 1.0, -2.2); car.add(headL);
  headL.target.position.set(0, 0, -14); car.add(headL.target);
  car.visible = false;

  /* ---------- waypoint: a beam of light over the next stop ---------- */
  var beam = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 180, 20, 1, true), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .18, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  beam.position.y = 90; scene.add(beam); beam.visible = false;
  var zoneRing = new T.Mesh(new T.RingGeometry(R_ZONE - .5, R_ZONE, 64), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  zoneRing.rotation.x = -Math.PI / 2; zoneRing.position.y = .07; scene.add(zoneRing); zoneRing.visible = false;

  /* ---------- driving state ---------- */
  var START = { x: 3, z: 80, h: 0 };
  var S = { x: START.x, z: START.z, h: START.h, v: 0, steerVis: 0, bump: 0, st: 0, tc: 0 };
  var keys = {}, joy = { x: 0, y: 0, on: false }, cardOpen = false, near = null;
  var camP = new T.Vector3(), camL = new T.Vector3(), tmpV = new T.Vector3(), lastFov = 0;
  function hitsSolid(x, z) {
    var sol = Wd.solids, r = 1.5;
    for (var i = 0; i < sol.length; i++) {
      var b = sol[i]; if (Math.abs(x - b[0]) > b[2] + r || Math.abs(z - b[1]) > b[3] + r) continue;
      return true;
    }
    return false;
  }
  function reset() { S.x = START.x; S.z = START.z; S.h = START.h; S.v = 0; camP.set(S.x, 7, S.z + 14); }

  function update(dt) {
    // input
    var up = keys.ArrowUp || keys.KeyW, down = keys.ArrowDown || keys.KeyS, left = keys.ArrowLeft || keys.KeyA, right = keys.ArrowRight || keys.KeyD;
    var thr = cardOpen ? 0 : clamp((up ? 1 : 0) - (down ? 1 : 0) + joy.y, -1, 1);
    var steerIn = cardOpen ? 0 : clamp((left ? 1 : 0) - (right ? 1 : 0) - joy.x, -1, 1);
    S.st = lerp(S.st, steerIn, 1 - Math.pow(.004, dt)); var steer = S.st;   // steering eases in
    var boost = !cardOpen && (keys.ShiftLeft || keys.ShiftRight || joy.y > .92);
    var brake = keys.Space && !cardOpen;
    // arcade physics
    var maxV = boost ? 48 : 30;
    if (thr > 0) S.v += thr * (S.v < 0 ? 42 : boost ? 30 : 19) * dt;
    else if (thr < 0) S.v += thr * (S.v > 0 ? 42 : 14) * dt;
    S.v -= S.v * (thr === 0 ? 1.0 : .3) * dt;
    if (brake) S.v -= S.v * 4 * dt;
    if (cardOpen) S.v -= S.v * 5 * dt;
    S.v = clamp(S.v, -14, maxV);
    if (Math.abs(S.v) < .05 && thr === 0) S.v = 0;
    var grip = clamp(Math.abs(S.v) / 7, 0, 1);
    S.h += steer * 1.9 * dt * grip * (S.v >= 0 ? 1 : -1) * (1 - Math.min(.4, Math.abs(S.v) / 110));
    var fx = -Math.sin(S.h), fz = -Math.cos(S.h);
    var nx = S.x + fx * S.v * dt, nz = S.z + fz * S.v * dt, hit = false;
    if (!hitsSolid(nx, S.z)) S.x = nx; else hit = true;
    if (!hitsSolid(S.x, nz)) S.z = nz; else hit = true;
    if (hit) { S.bump = Math.min(1, Math.abs(S.v) / 18 + .2); S.v *= -.25; }
    // traffic: a glancing bump that slides you aside, not a wall
    var tr = Wd.traffic; S.tc = Math.max(0, S.tc - dt);
    for (var i = 0; i < tr.length; i++) {
      if (!tr[i]) continue;
      var dx = S.x - tr[i][0], dz = S.z - tr[i][1];
      if (Math.abs(dx) < 1.9 && Math.abs(dz) < 4.2) {
        var side = dx === 0 ? 1 : Math.sign(dx); if (!hitsSolid(S.x + side * .35, S.z)) S.x += side * .35;
        if (S.tc <= 0) { S.v *= .6; S.bump = .45; S.tc = .6; }
      }
    }
    // keep inside the city
    var bx = clamp(S.x, -460, 460), bz = clamp(S.z, Wd.Z1 - 60, Wd.Z0 + 40);
    if (bx !== S.x || bz !== S.z) { S.x = bx; S.z = bz; S.v *= -.2; }

    // the car
    car.position.set(S.x, 0, S.z); car.rotation.y = S.h;
    S.steerVis = lerp(S.steerVis, steer * grip, 1 - Math.pow(.001, dt));
    chassis.rotation.z = S.steerVis * .05 * clamp(S.v / 20, -1, 1); chassis.rotation.x = clamp(-(thr * .02) + (brake ? .03 : 0), -.04, .04);
    wheels.forEach(function (w, i) { w.rotation.x -= S.v * dt / .44; if (i < 2) w.rotation.y = steer * .35; });
    tailMat.color.setHex(0xff2a36).multiplyScalar(thr < 0 || brake ? 1.6 : .75);   // brake lights flare
    headL.intensity = 1.1;

    // chase camera, pulled back and widened with speed
    var sp = Math.abs(S.v), back = 10.5 + sp * .1, high = 4.6 + sp * .035;
    tmpV.set(S.x - fx * back, high, S.z - fz * back);
    camP.lerp(tmpV, 1 - Math.pow(reduce ? .0001 : .006, dt));
    camL.set(S.x + fx * 9, 1.8, S.z + fz * 9);
    camera.position.copy(camP);
    if (S.bump > 0 && !reduce) { camera.position.x += (Math.random() - .5) * S.bump * .7; camera.position.y += (Math.random() - .5) * S.bump * .5; S.bump = Math.max(0, S.bump - dt * 2.5); }
    camera.lookAt(camL);
    camera.clearViewOffset();
    var fov = (Wd.isMobile() ? 64 : 56) + sp * .32;
    if (Math.abs(fov - lastFov) > .1) { camera.fov = fov; camera.updateProjectionMatrix(); lastFov = fov; }

    // stops
    near = null;
    STOPS.forEach(function (st) {
      if (Math.hypot(S.x - st.at[0], S.z - st.at[1]) < R_ZONE) {
        near = st;
        if (!found[st.k]) discover(st);
      }
    });
    var next = nextStop();
    if (next) {
      var hex = Wd.HEX[next.mach[0]] || '#ffffff', pulse = .14 + Math.sin(performance.now() / 300) * .05;
      beam.visible = zoneRing.visible = true;
      beam.position.set(next.at[0], 90, next.at[1]); beam.material.color.set(hex); beam.material.opacity = pulse;
      zoneRing.position.set(next.at[0], .07, next.at[1]); zoneRing.material.color.set(hex);
    } else beam.visible = zoneRing.visible = false;

    hud(sp, next);
  }
  G.update = update;

  function nextStop() { for (var i = 0; i < STOPS.length; i++) if (!found[STOPS[i].k]) return STOPS[i]; return null; }
  function discover(st) {
    found[st.k] = true; nFound++;
    st.mach.forEach(function (k) { Wd.react(k, false); });
    G.progress = nFound / STOPS.length;
    if (nFound === STOPS.length) {
      Object.keys(Wd.MACH).forEach(function (k) { Wd.react(k, true); });
      toast('<b>City fully lit.</b> You’ve driven through the whole career. Thanks for playing.', 6000);
    } else toast('<span class="mono">Found ' + nFound + ' / ' + STOPS.length + '</span><b>' + esc(st.name) + '</b><span>Press E to read</span>', 2600);
    renderList();
  }

  /* ---------- HUD ---------- */
  var ui = document.createElement('div');
  ui.innerHTML =
    '<div class="ghud" hidden>' +
      '<div class="ghud__id"><b>Stuti Singh</b><span class="mono">AI Engineer / Data Engineer</span></div>' +
      '<div class="ghud__goal"><span class="mono">Stops found</span><b id="g-count">0 / ' + STOPS.length + '</b><span id="g-next"></span></div>' +
      '<canvas id="g-map" width="360" height="400" aria-hidden="true"></canvas>' +
      '<div class="ghud__speed" aria-hidden="true"><b id="g-speed">0</b><span class="mono">km/h</span></div>' +
      '<p class="ghud__keys mono">WASD / arrows drive · Shift boost · Space brake · E read · R reset</p>' +
      '<div class="ghud__btns"><button type="button" class="gbtn" data-g="list">All stops</button><a class="gbtn" href="Stuti_Singh_AI_Data_Engineer.pdf" target="_blank" rel="noopener">Résumé</a><button type="button" class="gbtn" data-g="page">Read as a page</button></div>' +
    '</div>' +
    '<button class="gprompt" type="button" hidden><kbd>E</kbd><span></span></button>' +
    '<div class="gtoast" role="status" aria-live="polite"></div>' +
    '<div class="gjoy" aria-hidden="true"><i></i></div>' +
    '<section class="gcard" hidden data-tone="dark" role="dialog" aria-modal="false" aria-labelledby="g-card-t">' +
      '<header class="gcard__head"><p class="mono" id="g-card-k"></p><h2 id="g-card-t" class="visually-hidden"></h2><button type="button" class="gcard__x" data-g="close" aria-label="Close">×</button></header>' +
      '<div class="gcard__body"></div>' +
      '<footer class="gcard__foot mono"><span>Esc to close and keep driving</span><span id="g-card-next"></span></footer>' +
    '</section>' +
    '<section class="glist" hidden data-tone="dark" aria-label="All stops"><header><b>All 11 stops</b><button type="button" class="gcard__x" data-g="list-close" aria-label="Close">×</button></header><ol></ol><p class="mono">Click a stop to drive straight there.</p></section>' +
    '<div class="gstart" hidden data-tone="dark">' +
      '<div class="gstart__in">' +
        '<p class="mono gstart__k">A driving game · 11 stops</p>' +
        '<h1>Stuti Singh</h1>' +
        '<p class="gstart__role mono">AI Engineer / Data Engineer</p>' +
        '<p class="gstart__lede">Drive through the city of my career. Every company is a tower and every system I built is a billboard. Find all eleven and the whole city lights up.</p>' +
        '<div class="gstart__keys" aria-hidden="true"><span class="kc"><kbd>W</kbd><span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></span><span>or arrows to drive</span><span class="kc"><kbd>E</kbd></span><span>to read a stop</span></div>' +
        '<p class="gstart__touch mono">On a phone: drag anywhere to steer and accelerate.</p>' +
        '<div class="gstart__btns"><button type="button" class="try" data-g="play">Start driving <span aria-hidden="true">→</span></button><button type="button" class="gbtn gbtn--ghost" data-g="page">Read it as a page instead</button></div>' +
      '</div>' +
    '</div>' +
    '<button class="gplay" type="button" data-g="play" hidden>▶ Play the drive</button>';
  while (ui.firstChild) document.body.appendChild(ui.firstChild);
  var hudEl = $('.ghud'), countEl = $('#g-count'), nextEl = $('#g-next'), speedEl = $('#g-speed'), mapC = $('#g-map'), mapX = mapC.getContext('2d');
  var promptEl = $('.gprompt'), toastEl = $('.gtoast'), joyEl = $('.gjoy'), cardEl = $('.gcard'), cardBody = $('.gcard__body'), listEl = $('.glist'), startEl = $('.gstart'), playEl = $('.gplay');

  var lastHud = 0;
  function hud(sp, next) {
    var now = performance.now();
    if (now - lastHud > 90) {
      lastHud = now;
      speedEl.textContent = Math.round(sp * 3.6);
      countEl.textContent = nFound + ' / ' + STOPS.length;
      nextEl.textContent = next ? 'Next: ' + next.name + ' · follow the beam' : 'All stops found';
    }
    drawMap(next);
    var show = near && !cardOpen;
    promptEl.hidden = !show;
    if (show) promptEl.querySelector('span').textContent = (Wd.isMobile() ? 'Tap to read: ' : 'Read: ') + near.name;
  }
  function drawMap(next) {
    var c = mapX, w = mapC.width, h = mapC.height, s = 1.5, cx = w / 2, cy = h * .62;
    var X = function (x) { return cx + (x - S.x) * s; }, Y = function (z) { return cy + (z - S.z) * s; };
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(12,13,26,.78)'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.07)';
    Wd.solids.forEach(function (b) { var x = X(b[0] - b[2]), y = Y(b[1] - b[3]); if (x > w || y > h || x + b[2] * 2 * s < 0 || y + b[3] * 2 * s < 0) return; c.fillRect(x, y, b[2] * 2 * s, b[3] * 2 * s); });
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(X(-RW), Y(Wd.Z0), RW * 2 * s, (Wd.Z0 - Wd.Z1) * s);
    Wd.CROSS.forEach(function (z) { c.fillRect(0, Y(z + 7.5), w, 15 * s); });
    STOPS.forEach(function (st) {
      var x = X(st.at[0]), y = Y(st.at[1]), hex = Wd.HEX[st.mach[0]] || '#fff';
      c.beginPath(); c.arc(x, y, st === next ? 9 + Math.sin(performance.now() / 200) * 2 : 6, 0, 6.283);
      if (found[st.k]) { c.fillStyle = hex; c.fill(); } else { c.strokeStyle = hex; c.lineWidth = 2.5; c.stroke(); }
    });
    if (next) {   // an arrow at the edge when the next stop is off the map
      var tx = X(next.at[0]), ty = Y(next.at[1]);
      if (tx < 10 || tx > w - 10 || ty < 10 || ty > h - 10) {
        var a = Math.atan2(ty - cy, tx - cx), ex = clamp(cx + Math.cos(a) * w, 14, w - 14), ey = clamp(cy + Math.sin(a) * h, 14, h - 14);
        c.save(); c.translate(ex, ey); c.rotate(a); c.fillStyle = Wd.HEX[next.mach[0]] || '#fff';
        c.beginPath(); c.moveTo(10, 0); c.lineTo(-8, -8); c.lineTo(-8, 8); c.fill(); c.restore();
      }
    }
    c.save(); c.translate(cx, cy); c.rotate(-S.h); c.fillStyle = '#ff7a45';
    c.beginPath(); c.moveTo(0, -12); c.lineTo(8, 9); c.lineTo(0, 5); c.lineTo(-8, 9); c.fill(); c.restore();
  }
  var toastT = 0;
  function toast(htmlStr, ms) { toastEl.innerHTML = htmlStr; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, ms); }

  /* ---------- reading a stop: the real page section moves into the card, then back ---------- */
  var moved = null;
  function openCard(st) {
    closeCard(true);
    var sec = document.getElementById(st.sec); if (!sec) return;
    var src = sec.querySelector('.panel') || sec.querySelector('.wrap'); if (!src) return;
    var ph = document.createComment('game-card'); src.parentNode.insertBefore(ph, src);
    cardBody.appendChild(src); moved = { el: src, ph: ph };
    $('#g-card-k').textContent = 'Stop ' + (STOPS.indexOf(st) + 1) + ' of ' + STOPS.length + ' · ' + st.name;
    $('#g-card-t').textContent = st.name;
    var nx = nextStop(); $('#g-card-next').textContent = nx ? 'Next: ' + nx.name : 'All stops found';
    cardEl.hidden = false; cardBody.scrollTop = 0; cardOpen = true;
    if (!found[st.k]) discover(st);
    setTimeout(function () { var x = cardEl.querySelector('.gcard__x'); if (x) x.focus({ preventScroll: true }); }, 30);
  }
  function closeCard(silent) {
    if (moved) { moved.ph.parentNode.insertBefore(moved.el, moved.ph); moved.ph.remove(); moved = null; }
    cardEl.hidden = true; cardOpen = false;
  }
  function renderList() {
    $('ol', listEl).innerHTML = STOPS.map(function (st, i) {
      return '<li><button type="button" data-stop="' + i + '" class="' + (found[st.k] ? 'got' : '') + '"><i style="background:' + (Wd.HEX[st.mach[0]] || '#fff') + '"></i><b>' + esc(st.name) + '</b><span>' + esc(st.sub) + '</span></button></li>';
    }).join('');
  }
  renderList();
  function driveTo(st) {   // teleport just short of a stop, facing it, and open it
    S.x = st.at[0] === -72 ? -50 : st.at[0]; S.z = st.at[0] === -72 ? -88 : st.at[1] + 14; S.h = st.at[0] === -72 ? Math.PI / 2 : 0; S.v = 0;
    camP.set(S.x + Math.sin(S.h) * 12, 6, S.z + Math.cos(S.h) * 12);
    listEl.hidden = true; openCard(st);
  }

  /* ---------- modes ---------- */
  function store(v) { try { localStorage.setItem('stuti-mode', v); } catch (e) {} }
  function stored() { try { return localStorage.getItem('stuti-mode'); } catch (e) { return null; } }
  function play() {
    html.classList.add('game'); store('game');
    startEl.hidden = true; playEl.hidden = true; hudEl.hidden = false;
    car.visible = true; G.active = true; window.scrollTo(0, 0);
    if (!S.started) { reset(); S.started = true; toast('<b>Find all 11 stops.</b><span>Follow the beam of light. Drive into a stop to light it up.</span>', 4200); }
  }
  function page() {
    closeCard(); listEl.hidden = true;
    html.classList.remove('game'); store('page');
    startEl.hidden = true; hudEl.hidden = true; promptEl.hidden = true; playEl.hidden = false;
    car.visible = false; beam.visible = zoneRing.visible = false; G.active = false;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-g], [data-stop], .gprompt'); if (!b) return;
    if (b.classList.contains('gprompt')) { if (near) openCard(near); return; }
    if (b.dataset.stop != null) { driveTo(STOPS[+b.dataset.stop]); return; }
    var g = b.dataset.g;
    if (g === 'play') play(); else if (g === 'page') page(); else if (g === 'close') closeCard();
    else if (g === 'list') { listEl.hidden = !listEl.hidden; } else if (g === 'list-close') listEl.hidden = true;
  });
  // in-page links inside a card (e.g. "Get in touch") leave the game for the page
  cardBody.addEventListener('click', function (e) { var a = e.target.closest('a[href^="#"]'); if (a) { closeCard(); page(); } });

  /* ---------- input ---------- */
  var DRIVE = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'];
  window.addEventListener('keydown', function (e) {
    if (!G.active || document.querySelector('dialog[open]')) return;
    var typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '');
    if (typing) return;
    if (e.code === 'Escape') { if (cardOpen) closeCard(); else listEl.hidden = true; return; }
    if ((e.code === 'KeyE' || e.code === 'Enter') && near && !cardOpen) { e.preventDefault(); openCard(near); return; }
    if (cardOpen) { if (/Arrow|Space|Page/.test(e.code)) return; }   // let the card scroll
    if (e.code === 'KeyR') reset();
    if (DRIVE.indexOf(e.code) > -1) { keys[e.code] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', function () { keys = {}; });
  // touch: drag anywhere to steer (left/right) and drive (up/down)
  var origin = null;
  function uiTarget(t) { return t.closest && t.closest('.ghud, .gcard, .glist, .gstart, .gprompt, .gplay, a, button, dialog'); }
  window.addEventListener('touchstart', function (e) {
    if (!G.active || cardOpen || uiTarget(e.target)) return;
    var t = e.changedTouches[0]; origin = { x: t.clientX, y: t.clientY, id: t.identifier };
    joyEl.style.transform = 'translate(' + t.clientX + 'px,' + t.clientY + 'px)'; joyEl.classList.add('on'); joy.on = true;
  }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (!origin) return;
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i]; if (t.identifier !== origin.id) continue;
      var dx = t.clientX - origin.x, dy = t.clientY - origin.y;
      joy.x = clamp(dx / 70, -1, 1); joy.y = clamp(-dy / 70, -1, 1);
      joyEl.querySelector('i').style.transform = 'translate(' + clamp(dx, -46, 46) + 'px,' + clamp(dy, -46, 46) + 'px)';
    }
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  window.addEventListener('touchend', function (e) {
    if (!origin) return;
    for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === origin.id) {
      origin = null; joy.x = joy.y = 0; joy.on = false; joyEl.classList.remove('on'); joyEl.querySelector('i').style.transform = '';
    }
  });

  /* ---------- first screen ---------- */
  var q = new URLSearchParams(location.search);
  // recruiters land on the readable page; the game is opt-in (button, or ?mode=game)
  if (q.get('mode') !== 'game') { page(); }
  else { startEl.hidden = false; html.classList.add('game'); G.active = true; car.visible = true; reset(); camP.set(S.x + 18, 9, S.z + 22); }
  Wd.gameApi = { play: play, page: page, state: S, found: found, stops: STOPS, open: function (i) { openCard(STOPS[i]); } };
})();
