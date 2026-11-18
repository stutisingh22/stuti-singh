/* Stuti Singh — the data refinery.
   A small three.js world: data pours into a hopper, is cleaned and deduplicated, scored at a
   rules gate, routed through an LLM booth and a human review desk when uncertain, redacted
   under a press, checkpointed, and stacked into a tower. Scrolling flies the camera from
   station to station ([data-station] sections in index.html); the light runs from morning
   to night. Uses vendor/three.min.js (r128). No build step. */
(function () {
  'use strict';
  var T = window.THREE, canvas = document.getElementById('world');
  if (!T || !canvas) { document.documentElement.classList.add('no-gl'); return; }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { document.documentElement.classList.add('no-gl'); return; }
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var hash = function (i, k) { var s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(30, 1, .5, 700);
  scene.fog = new T.Fog(0xf2e6d2, 110, 330);
  scene.background = new T.Color(0xf2e6d2);

  /* ---------- palette ---------- */
  var C = {
    ground: 0xe6dac5, deck: 0xf3ebdd, grid: 0xc9b99d, belt: 0x37312b, rail: 0x221e1a, ink: 0x2a241f,
    cream: 0xf6f0e5, teal: 0x2b9e94, amber: 0xf0a23a, accent: 0xff6a33, lilac: 0xb7a3f0, green: 0x3ddc84,
    terracotta: 0xdc6e3d, wall: 0xf5efe5, tree: [0x86a98d, 0x9dbb9c, 0x6f957e], trunk: 0x8a6a4d
  };
  var RAW = [0xc9b79c, 0x9fb3c8, 0xd9a7a2, 0xa8c3a0, 0xe0c27a, 0xb8a9c9, 0xd8cfc0];
  var M = function (hex, o) { o = o || {}; return new T.MeshStandardMaterial({ color: hex, roughness: o.r == null ? .85 : o.r, metalness: 0, flatShading: !!o.flat,
    emissive: o.em || 0, emissiveIntensity: o.ei || 0, transparent: !!o.op, opacity: o.op || 1, side: o.side || T.FrontSide }); };
  function add(geo, mat, x, y, z, opt) {
    var m = new T.Mesh(geo, mat); m.position.set(x, y, z);
    m.castShadow = !(opt && opt.noShadow); m.receiveShadow = true; scene.add(m); return m;
  }
  var nightMats = []; // emissive materials that glow at night: [material, max intensity]

  /* ---------- lights ---------- */
  var hemi = new T.HemisphereLight(0xfff6e8, 0xd9c7a8, .75); scene.add(hemi);
  var sun = new T.DirectionalLight(0xfff1d6, 1.0);
  sun.position.set(-40, 80, 50); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  var sc = sun.shadow.camera; sc.left = -110; sc.right = 110; sc.top = 60; sc.bottom = -60; sc.near = 10; sc.far = 260;
  sun.shadow.bias = -0.0006;
  scene.add(sun); scene.add(sun.target); sun.target.position.set(8, 0, 0);
  var towerLight = new T.PointLight(0xffb36b, 0, 60, 2); towerLight.position.set(72, 20, 6); scene.add(towerLight);
  var deskLight = new T.PointLight(0xffc27a, 0, 14, 2); deskLight.position.set(12, 4.4, 13); scene.add(deskLight);

  /* ---------- ground, deck, grid ---------- */
  add(new T.PlaneGeometry(1400, 1400), M(C.ground), 0, -2.02, 0, { noShadow: true }).rotation.x = -Math.PI / 2;
  add(new T.BoxGeometry(176, 2, 50), M(C.deck), 10, -1, 0, { noShadow: true });
  (function grid() {
    var pts = [], x, z;
    for (x = -78; x <= 98; x += 4) pts.push(x, .02, -25, x, .02, 25);
    for (z = -24; z <= 24; z += 4) pts.push(-78, .02, z, 98, .02, z);
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    scene.add(new T.LineSegments(g, new T.LineBasicMaterial({ color: C.grid, transparent: true, opacity: .35 })));
  })();

  /* ---------- the main belt ---------- */
  var X0 = -52, X1 = 64, BELT_Y = 1.2;
  var stripe = document.createElement('canvas'); stripe.width = 64; stripe.height = 8;
  (function () { var c = stripe.getContext('2d'); c.fillStyle = '#37312b'; c.fillRect(0, 0, 64, 8); c.fillStyle = '#4a433b'; c.fillRect(0, 0, 10, 8); })();
  var beltTex = new T.CanvasTexture(stripe); beltTex.wrapS = T.RepeatWrapping; beltTex.repeat.set((X1 - X0 + 6) / 1.6, 1);
  var beltMat = new T.MeshStandardMaterial({ map: beltTex, roughness: .9 });
  add(new T.BoxGeometry(X1 - X0 + 6, .3, 2.4), beltMat, (X0 + X1) / 2, BELT_Y - .15, 0);
  [-1.3, 1.3].forEach(function (z) { add(new T.BoxGeometry(X1 - X0 + 6, .5, .18), M(C.rail), (X0 + X1) / 2, BELT_Y, z); });
  for (var lx = X0; lx <= X1; lx += 6) [-1, 1].forEach(function (s) { add(new T.BoxGeometry(.3, 1.1, .3), M(C.rail), lx, .5, s * 1.1); });

  /* uncertain branch: rules gate → LLM booth → review desk → back to the line */
  var BR0 = -4, BR1 = 19;
  var branch = new T.CatmullRomCurve3([
    new T.Vector3(BR0, BELT_Y, 0), new T.Vector3(0, BELT_Y, 4.5), new T.Vector3(4.5, BELT_Y, 9),
    new T.Vector3(10.5, BELT_Y, 11), new T.Vector3(15.5, BELT_Y, 6.5), new T.Vector3(BR1, BELT_Y, 0)
  ]);
  (function () {
    var n = 46, prev = branch.getPointAt(0);
    for (var i = 1; i <= n; i++) {
      var p = branch.getPointAt(i / n), d = p.clone().sub(prev), len = d.length();
      var seg = add(new T.BoxGeometry(len + .05, .3, 1.8), M(C.belt), (p.x + prev.x) / 2, BELT_Y - .15, (p.z + prev.z) / 2);
      seg.rotation.y = -Math.atan2(d.z, d.x);
      if (i % 5 === 0) add(new T.BoxGeometry(.3, 1.1, .3), M(C.rail), p.x, .5, p.z);
      prev = p;
    }
  })();

  /* ---------- signs ---------- */
  var signs = [];
  function sign(text, x, y, z, ry, w) {
    var cv = document.createElement('canvas'); cv.width = 1024; cv.height = 192;
    var tex = new T.CanvasTexture(cv); tex.anisotropy = 4;
    var mat = new T.MeshBasicMaterial({ map: tex, transparent: true });
    var mesh = new T.Mesh(new T.PlaneGeometry(w || 7, (w || 7) * 192 / 1024), mat);
    mesh.position.set(x, y, z); mesh.rotation.y = ry || 0; scene.add(mesh);
    [-1, 1].forEach(function (s) { add(new T.BoxGeometry(.12, y, .12), M(C.rail), x + s * (w || 7) * .38 * Math.cos(ry || 0), y / 2, z - s * (w || 7) * .38 * Math.sin(ry || 0)); });
    var draw = function () {
      var c = cv.getContext('2d'); c.clearRect(0, 0, 1024, 192);
      c.fillStyle = '#1f1b17'; c.beginPath(); if (c.roundRect) c.roundRect(4, 4, 1016, 184, 36); else c.rect(4, 4, 1016, 184); c.fill();
      c.fillStyle = '#ff6a33'; c.beginPath(); c.arc(78, 96, 16, 0, 6.283); c.fill();
      c.fillStyle = '#f6f0e5'; c.font = '600 76px "JetBrains Mono", ui-monospace, monospace'; c.textBaseline = 'middle'; c.fillText(text, 124, 100);
      tex.needsUpdate = true;
    };
    draw(); signs.push(draw); return mesh;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { signs.forEach(function (d) { d(); }); });

  /* ---------- 01 intake: hopper + dish ---------- */
  var HX = -55;
  var hop = add(new T.CylinderGeometry(5, 1.3, 5, 28, 1, true), M(C.terracotta, { side: T.DoubleSide, r: .7 }), HX, 8.6, 0);
  add(new T.TorusGeometry(5, .22, 8, 40), M(C.ink), HX, 11.1, 0).rotation.x = Math.PI / 2;
  add(new T.CylinderGeometry(1.3, 1.3, 4.6, 20), M(C.terracotta, { r: .7 }), HX, 3.8, 0);
  [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(function (p) { add(new T.BoxGeometry(.4, 9, .4), M(C.rail), HX + p[0], 4.5, p[1]); });
  var dish = new T.Group(); dish.position.set(-63, 0, -11); scene.add(dish);
  var pole = new T.Mesh(new T.CylinderGeometry(.35, .5, 11, 12), M(C.ink)); pole.position.y = 5.5; pole.castShadow = true; dish.add(pole);
  var bowl = new T.Mesh(new T.SphereGeometry(4.2, 28, 12, 0, Math.PI * 2, 0, Math.PI / 3.4), M(C.cream, { side: T.DoubleSide, r: .6 }));
  bowl.position.y = 13.4; bowl.rotation.x = Math.PI * .78; bowl.castShadow = true; dish.add(bowl);
  var beacon = new T.Mesh(new T.SphereGeometry(.35, 12, 8), M(C.accent, { em: C.accent, ei: 1 })); beacon.position.y = 11.4; dish.add(beacon);
  sign('INTAKE', HX + 3, 14.5, 5, 0, 7);

  /* ---------- 02 sorter building ---------- */
  var SX0 = -34.5, SX1 = -25.5;
  add(new T.BoxGeometry(SX1 - SX0, 7, 8), M(C.wall), (SX0 + SX1) / 2, 3.5, 0);
  for (var r = 0; r < 3; r++) {
    var roof = add(new T.BoxGeometry(3.2, .3, 8.2), M(C.terracotta, { r: .7 }), SX0 + 1.5 + r * 3, 8, 0); roof.rotation.z = .5;
  }
  [SX0 - .02, SX1 + .02].forEach(function (x) { add(new T.BoxGeometry(.1, 2.6, 3), M(0x15120f), x, 1.9, 0, { noShadow: true }); });
  for (var wx = 0; wx < 3; wx++) {
    var wm = M(0x3b352e, { em: 0xffc46b, ei: 0 }); nightMats.push([wm, 1.4]);
    add(new T.BoxGeometry(1.6, 1.2, .1), wm, SX0 + 1.8 + wx * 2.7, 5, 4.02, { noShadow: true });
  }
  add(new T.CylinderGeometry(.7, .9, 6, 14), M(C.ink), SX1 - 1.5, 10, -2.5);
  var puffs = [];
  for (var pi = 0; pi < 9; pi++) { var pm = M(0xffffff, { op: .8 }); var pf = add(new T.SphereGeometry(.8, 12, 10), pm, SX1 - 1.5, 13, -2.5, { noShadow: true }); puffs.push(pf); }
  sign('ETL · DEDUPE', (SX0 + SX1) / 2, 10.5, 4.6, 0, 8);

  /* ---------- 03 rules gate (scanner arch) ---------- */
  var GX = -8;
  [-1.9, 1.9].forEach(function (z) { add(new T.BoxGeometry(.6, 5.4, .6), M(C.ink), GX, 2.7, z); });
  add(new T.BoxGeometry(.9, .7, 4.6), M(C.ink), GX, 5.6, 0);
  var scanMat = new T.MeshBasicMaterial({ color: C.teal, transparent: true, opacity: .85 });
  var scanBar = new T.Mesh(new T.BoxGeometry(.12, .16, 3.4), scanMat); scanBar.position.set(GX, 3, 0); scene.add(scanBar);
  var scanGlow = new T.Mesh(new T.PlaneGeometry(3.4, 4), new T.MeshBasicMaterial({ color: C.teal, transparent: true, opacity: .08, side: T.DoubleSide }));
  scanGlow.position.set(GX, 3.2, 0); scanGlow.rotation.y = Math.PI / 2; scene.add(scanGlow);
  sign('RULES', GX, 9, -3, 0, 5);

  /* ---------- 04 LLM booth + human review desk ---------- */
  var dome = add(new T.SphereGeometry(3.4, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), M(C.lilac, { op: .42, r: .2, em: C.lilac, ei: .25 }), 4.5, 0, 9, { noShadow: true });
  add(new T.CylinderGeometry(3.6, 3.8, .3, 36), M(C.ink), 4.5, .15, 9);
  var brainMat = M(0x8f72f0, { em: 0x8f72f0, ei: .9, flat: true, r: .3 });
  var brain = add(new T.IcosahedronGeometry(.9, 0), brainMat, 4.5, 3.4, 9);
  sign('LLM', 4.5, 8.2, 12.6, 0, 4);
  // desk + reviewer
  add(new T.BoxGeometry(3.6, .2, 1.6), M(0xb48a62), 11, 2.3, 13.4);
  [[-1.6, -.6], [1.6, -.6], [-1.6, .6], [1.6, .6]].forEach(function (p) { add(new T.BoxGeometry(.15, 2.2, .15), M(C.rail), 11 + p[0], 1.1, 13.4 + p[1]); });
  add(new T.CylinderGeometry(.55, .62, 1.9, 16), M(C.terracotta, { r: .7 }), 11, 2.9, 14.9);
  add(new T.SphereGeometry(.5, 18, 14), M(0xc79a73), 11, 4.2, 14.9);
  add(new T.SphereGeometry(.52, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2), M(C.ink), 11, 4.3, 14.95);
  add(new T.BoxGeometry(1.2, 2.2, .2), M(C.rail), 11, 1.8, 16);
  var lampMat = M(0xffe2b0, { em: 0xffc27a, ei: .4 }); nightMats.push([lampMat, 2]);
  add(new T.CylinderGeometry(.06, .06, 1.8, 6), M(C.rail), 12.4, 3.3, 13.8);
  add(new T.ConeGeometry(.45, .55, 16, 1, true), lampMat, 12.4, 4.3, 13.8);
  sign('REVIEW', 11, 7.6, 17.2, 0, 5);

  /* ---------- 05 redaction press ---------- */
  var PX = 26;
  [-2.4, 2.4].forEach(function (z) { add(new T.BoxGeometry(.9, 8, .9), M(C.ink), PX, 4, z); });
  add(new T.BoxGeometry(1.8, 1.2, 5.8), M(C.ink), PX, 8.4, 0);
  var piston = add(new T.BoxGeometry(2.6, 1.3, 2.8), M(C.accent, { r: .6 }), PX, 5.6, 0);
  add(new T.BoxGeometry(.25, 3, .25), M(0x8c847a, { r: .4 }), PX, 7, 0);
  var okMat = M(C.green, { em: C.green, ei: 1 });
  var okLight = add(new T.SphereGeometry(.45, 16, 12), okMat, PX, 9.4, 0);
  sign('REDACT · STILL RUNS', PX, 12.6, 3.2, 0, 9);

  /* ---------- 06 checkpoints + racks ---------- */
  var flags = [];
  for (var fx = 38; fx <= 60; fx += 4) {
    add(new T.CylinderGeometry(.07, .07, 4.4, 6), M(C.rail), fx, 2.2, -1.9);
    var sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(1.5, -.45); sh.lineTo(0, -.9);
    var fl = add(new T.ShapeGeometry(sh), M(C.accent, { side: T.DoubleSide }), fx, 4.3, -1.9); flags.push(fl);
  }
  for (var rx = 0; rx < 4; rx++) for (var ry = 0; ry < 3; ry++) {
    add(new T.BoxGeometry(5, .2, 2.4), M(C.wall), 41 + rx * 6, 1 + ry * 2.4, -8);
  }
  [38.3, 44.3, 50.3, 56.3, 62.3].forEach(function (x) { [-9.1, -6.9].forEach(function (z) { add(new T.BoxGeometry(.2, 7.6, .2), M(C.rail), x, 3.8, z); }); });
  sign('CHECKPOINT · RESUME', 50, 10.5, -8, 0, 9);

  /* ---------- 07 the tower ---------- */
  var TX = 72, TL = 18, TF = 4;
  add(new T.BoxGeometry(3.2, 6, 3.2), M(C.wall), X1 + 2.5, 3, 0);
  add(new T.BoxGeometry(.1, 2.4, 2.2), M(0x15120f), X1 + .88, 1.9, 0, { noShadow: true });
  add(new T.BoxGeometry(TF * 1.1 + 1.2, .5, TF * 1.1 + 1.2), M(C.ink), TX, .25, 0);
  var towerGeo = new T.BoxGeometry(1, 1, 1), towerMat = M(0xffffff, { r: .55, em: 0xffb36b, ei: 0 });
  nightMats.push([towerMat, .22]);
  var tower = new T.InstancedMesh(towerGeo, towerMat, TL * TF * TF); tower.castShadow = true; tower.receiveShadow = true; scene.add(tower);
  (function () {
    var d = new T.Object3D(), col = new T.Color(), i = 0;
    for (var l = 0; l < TL; l++) for (var a = 0; a < TF; a++) for (var b = 0; b < TF; b++) {
      d.position.set(TX + (a - (TF - 1) / 2) * 1.1, .5 + .5 + l * 1.1, (b - (TF - 1) / 2) * 1.1); d.updateMatrix();
      tower.setMatrixAt(i, d.matrix);
      var h = hash(i, 3); col.setHex(h < .62 ? C.teal : h < .9 ? C.cream : C.ink); tower.setColorAt(i, col); i++;
    }
    tower.count = 0;
  })();
  var towerTop = add(new T.SphereGeometry(.5, 16, 12), M(C.accent, { em: C.accent, ei: 1 }), TX, 1.5, 0, { noShadow: true });

  /* ---------- trees + clouds + stars ---------- */
  for (var ti = 0; ti < 70; ti++) {
    var side = ti % 2 ? 1 : -1, tx = -90 + hash(ti, 1) * 200, tz = side * (28 + hash(ti, 2) * 26);
    var th = 3 + hash(ti, 3) * 4;
    add(new T.CylinderGeometry(.25, .35, 1.4, 6), M(C.trunk), tx, -1.3, tz);
    add(new T.ConeGeometry(1.2 + hash(ti, 4) * 1.2, th, 7), M(C.tree[ti % 3], { flat: true }), tx, -.6 + th / 2, tz);
  }
  var clouds = [];
  for (var ci = 0; ci < 9; ci++) {
    var g = new T.Group(), cm = M(0xffffff, { r: 1, em: 0xffffff, ei: .15, flat: true });
    for (var k = 0; k < 5; k++) { var s = new T.Mesh(new T.IcosahedronGeometry(2 + hash(ci * 7 + k, 1) * 2.2, 1), cm); s.position.set(k * 2.6 - 5, hash(ci, k) * 1.5, hash(k, ci) * 2); g.add(s); }
    g.position.set(-120 + ci * 30, 32 + hash(ci, 9) * 16, -60 + hash(ci, 8) * 70); g.userData = { v: .6 + hash(ci, 5) }; scene.add(g); clouds.push([g, cm]);
  }
  var starGeo = new T.BufferGeometry(), sp = [];
  for (var st = 0; st < 500; st++) { var th2 = hash(st, 1) * 6.283, ph = hash(st, 2) * 1.2; sp.push(Math.cos(th2) * Math.cos(ph) * 400, 30 + Math.sin(ph) * 300, Math.sin(th2) * Math.cos(ph) * 400); }
  starGeo.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
  var starMat = new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false });
  scene.add(new T.Points(starGeo, starMat));

  /* ---------- the data: instanced blocks on the line ---------- */
  function merge(list) {
    var pos = [], nor = [];
    list.forEach(function (g) { g = g.index ? g.toNonIndexed() : g; Array.prototype.push.apply(pos, g.attributes.position.array); Array.prototype.push.apply(nor, g.attributes.normal.array); });
    var out = new T.BufferGeometry(); out.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); return out;
  }
  var S = .8, E = .08, h2 = S / 2 - E / 2, edges = [];
  [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) {
    edges.push(new T.BoxGeometry(S, E, E).translate(0, a * h2, b * h2));
    edges.push(new T.BoxGeometry(E, S, E).translate(a * h2, 0, b * h2));
    edges.push(new T.BoxGeometry(E, E, S).translate(a * h2, b * h2, 0));
  }); });
  var mobile = window.innerWidth < 960;
  var N = mobile ? 130 : 220, K = mobile ? 30 : 56;
  var mk = function (geo, mat, n) { var m = new T.InstancedMesh(geo, mat, n); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); return m; };
  var raw = [
    mk(new T.BoxGeometry(1.05, .06, .78), M(0xffffff, { r: .9 }), N + K),   // scraped pages
    mk(new T.BoxGeometry(.85, .5, .12), M(0xffffff, { r: .9 }), N + K),     // emails
    mk(new T.CylinderGeometry(.32, .32, .5, 12), M(0xffffff, { r: .6 }), N + K) // drives
  ];
  var cube = mk(new T.BoxGeometry(S, S, S), M(0xffffff, { r: .55 }), N);
  var hollow = mk(merge(edges), M(C.ink, { r: .6 }), N);
  var band = mk(new T.BoxGeometry(S + .06, .2, S + .06), M(C.accent, { r: .5 }), N);
  var items = [], col = new T.Color(), dmy = new T.Object3D(), ZERO = new T.Matrix4().makeScale(0, 0, 0);
  for (var it = 0; it < N + K; it++) {
    var r1 = hash(it, 21);
    items.push({ off: hash(it, 20) * (X1 - X0), shape: it % 3, cls: r1 < .74 ? 0 : r1 < .9 ? 1 : 2, dup: hash(it, 22) < .14,
      jz: (hash(it, 23) - .5) * 1.3, ry: hash(it, 24) * 6.28, spin: (hash(it, 25) - .5) * 3, rain: it >= N });
    col.setHex(RAW[it % RAW.length]); raw.forEach(function (m) { m.setColorAt(it, col); });
  }
  for (var ii = 0; ii < N; ii++) { col.setHex(C.cream); cube.setColorAt(ii, col); }
  var SPEED = 3.2, LEN = X1 - X0;

  function hide(mesh, i) { mesh.setMatrixAt(i, ZERO); }
  function place(mesh, i, x, y, z, rx, ry, rz, s, sy) {
    dmy.position.set(x, y, z); dmy.rotation.set(rx || 0, ry || 0, rz || 0); dmy.scale.set(s || 1, (sy || 1) * (s || 1), s || 1); dmy.updateMatrix(); mesh.setMatrixAt(i, dmy.matrix);
  }
  var pressDown = 0;
  function updateItems(time) {
    var t = reduce ? 30 : time;
    for (var i = 0; i < N + K; i++) {
      var o = items[i];
      raw.forEach(function (m) { hide(m, i); });
      if (o.rain) { // raining into the hopper
        var fall = (t * 6 + o.off * 3) % 18, y = 29 - fall;
        if (y > 10.6) {
          var rr = 3.6 * (y - 10) / 18 + .6;
          place(raw[o.shape], i, HX + Math.cos(o.ry) * rr, y, Math.sin(o.ry) * rr, t * o.spin, o.ry + t, t * o.spin * .7);
        }
        continue;
      }
      var u = (o.off + t * SPEED) % LEN, x = X0 + u, z = o.jz, yb = BELT_Y + S / 2;
      hide(cube, i); hide(hollow, i); hide(band, i);
      if (x < SX0) { // raw, tumbling a little
        place(raw[o.shape], i, x, BELT_Y + (o.shape === 0 ? .1 : o.shape === 1 ? .3 : .3), z, 0, o.ry + x * .05, 0);
        continue;
      }
      if (x < SX1 + .3 || o.dup) continue;       // inside the sorter; duplicates never come out
      if (x > X1 + .6) continue;                   // into the tower
      var px = x, pz = 0, state = 'clean';
      if (x >= GX) state = o.cls === 0 ? 'ok' : o.cls === 1 ? 'rev' : 'unk';
      if (o.cls === 1 && x >= BR0 && x <= BR1) {   // uncertain: take the branch
        var pt = branch.getPointAt((x - BR0) / (BR1 - BR0)); px = pt.x; pz = pt.z;
        if (x > 11.5) state = 'ok';                 // signed off at the desk
      } else if (o.cls === 1 && x > BR1) state = 'ok';
      var redacted = x > PX + .4 && state !== 'unk';
      var squash = Math.abs(x - PX) < 1.4 ? 1 - .35 * pressDown : 1;
      if (state === 'unk') { place(hollow, i, px, yb, pz, 0, 0, 0, 1); continue; }
      col.setHex(redacted ? C.ink : state === 'ok' ? C.teal : state === 'rev' ? C.amber : C.cream);
      cube.setColorAt(i, col);
      place(cube, i, px, BELT_Y + S / 2 * squash, pz, 0, 0, 0, 1, squash);
      if (redacted) place(band, i, px, yb + .05, pz, 0, 0, 0, 1);
    }
    raw.forEach(function (m) { m.instanceMatrix.needsUpdate = true; });
    cube.instanceMatrix.needsUpdate = true; cube.instanceColor.needsUpdate = true;
    hollow.instanceMatrix.needsUpdate = true; band.instanceMatrix.needsUpdate = true;
  }

  /* ---------- camera stations + time of day ---------- */
  var KEYS = {
    hero:       { p: [2, 46, 128],   t: [10, -9, -6],   off: .16, sky: '#f2e6d2', sun: '#fff1d6', si: 1.0,  hi: .78, night: 0,   sp: [-40, 80, 50] },
    intake:     { p: [-32, 17, 40],  t: [-56, 6, 0],   off: .2,  sky: '#eef0ea', sun: '#ffffff', si: 1.05, hi: .8,  night: 0,   sp: [-20, 90, 40] },
    sort:       { p: [-12, 14, 34],  t: [-31, 3, 0], off: .2,  sky: '#edf0ec', sun: '#ffffff', si: 1.05, hi: .8,  night: 0,   sp: [0, 95, 40] },
    score:      { p: [8, 12, 32],    t: [-6, 2.5, 3],  off: .2,  sky: '#eef0ea', sun: '#fffaf0', si: 1.0,  hi: .8,  night: 0,   sp: [10, 95, 40] },
    llm:        { p: [26, 16, 44],   t: [8, 2.5, 9],  off: .2,  sky: '#f1ece2', sun: '#fff4e0', si: 1.0,  hi: .78, night: 0,   sp: [20, 90, 45] },
    redact:     { p: [42, 12, 30],   t: [26, 4, 0],    off: .2,  sky: '#f4e8d6', sun: '#ffecc8', si: .95,  hi: .75, night: 0,   sp: [40, 80, 50] },
    checkpoint: { p: [66, 15, 32],   t: [50, 2.5, -3], off: .2,  sky: '#f6dfc2', sun: '#ffd9a0', si: .9,   hi: .7,  night: 0,   sp: [60, 55, 50] },
    tower:      { p: [100, 18, 44],  t: [72, 10, 0],    off: .2,  sky: '#f4c99a', sun: '#ffbf7a', si: .85,  hi: .62, night: .1,  sp: [110, 30, 40] },
    aerial:     { p: [14, 80, 84],   t: [10, 0, -2],   off: 0,   sky: '#4c4161', sun: '#ff9a62', si: .45,  hi: .42, night: .55, sp: [120, 18, 30] },
    night:      { p: [98, 7, 40],    t: [72, 12, 0],   off: .26,   sky: '#121420', sun: '#8fa3ff', si: .16,  hi: .22, night: 1,   sp: [40, 70, 60] }
  };
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-station]')).map(function (el) { return { el: el, key: KEYS[el.dataset.station] || KEYS.hero, top: 0 }; });
  var W = 0, H = 0, camPos = new T.Vector3(), camTgt = new T.Vector3(), first = true;
  var mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  function measure() { var y = window.scrollY; sections.forEach(function (s) { s.top = s.el.getBoundingClientRect().top + y; }); }
  function resize() {
    W = window.innerWidth; H = window.innerHeight; mobile = W < 960;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.fov = mobile ? 52 : 30; camera.updateProjectionMatrix();
    measure();
  }
  function state() {
    var mid = window.scrollY + H * .55, k = 0;
    for (var i = 0; i < sections.length; i++) if (sections[i].top <= mid) k = i;
    var B = sections[k], A = sections[Math.max(0, k - 1)];
    var t = k === 0 ? 1 : clamp((mid - B.top) / (H * .75), 0, 1);
    if (window.scrollY + H >= document.documentElement.scrollHeight - 4) t = 1;
    if (reduce) t = t < .5 ? 0 : 1;
    return { A: A.key, B: B.key, t: smooth(t) };
  }
  var cA = new T.Color(), cB = new T.Color(), tmp = new T.Vector3(), tmp2 = new T.Vector3();
  function mixHex(a, b, t, out) { cA.set(a); cB.set(b); return out.copy(cA).lerp(cB, t); }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var time = now / 1000, S0 = state(), A = S0.A, B = S0.B, t = S0.t;

    // camera: interpolate stations, lift in the middle of long moves, then ease toward it
    tmp.set(lerp(A.p[0], B.p[0], t), lerp(A.p[1], B.p[1], t), lerp(A.p[2], B.p[2], t));
    tmp.y += Math.sin(t * Math.PI) * Math.min(18, Math.abs(A.p[0] - B.p[0]) * .25);
    tmp2.set(lerp(A.t[0], B.t[0], t), lerp(A.t[1], B.t[1], t), lerp(A.t[2], B.t[2], t));
    mouse.sx += (mouse.x - mouse.sx) * .05; mouse.sy += (mouse.y - mouse.sy) * .05;
    if (!reduce) { tmp.x += mouse.sx * 2.2; tmp.y += mouse.sy * 1.2; }
    var k = first || reduce ? 1 : 1 - Math.pow(.0016, dt);
    camPos.lerp(tmp, k); camTgt.lerp(tmp2, k); first = false;
    camera.position.copy(camPos); camera.lookAt(camTgt);
    var off = lerp(A.off, B.off, t);
    if (mobile) camera.setViewOffset(W, H, 0, H * .14, W, H); else camera.setViewOffset(W, H, -W * off, 0, W, H);

    // light + sky
    mixHex(A.sky, B.sky, t, scene.background); scene.fog.color.copy(scene.background);
    mixHex(A.sun, B.sun, t, sun.color); sun.intensity = lerp(A.si, B.si, t);
    hemi.intensity = lerp(A.hi, B.hi, t);
    sun.position.set(lerp(A.sp[0], B.sp[0], t), lerp(A.sp[1], B.sp[1], t), lerp(A.sp[2], B.sp[2], t));
    var night = lerp(A.night, B.night, t);
    nightMats.forEach(function (m) { m[0].emissiveIntensity = m[1] * night + (m[0] === lampMat ? .4 : 0); });
    starMat.opacity = smooth((night - .4) / .6);
    towerLight.intensity = night * 2.2; deskLight.intensity = .4 + night * 1.6;
    clouds.forEach(function (c) { c[1].emissiveIntensity = .15 - night * .12; });

    // machinery
    var tt = reduce ? 0 : time;
    beltTex.offset.x = -(tt * SPEED / 1.6) % 1;
    var cyc = (tt % 1.6) / 1.6; pressDown = cyc < .12 ? cyc / .12 : cyc < .3 ? 1 : 1 - (cyc - .3) / .7;
    piston.position.y = 5.6 - pressDown * 2.6;
    okMat.emissiveIntensity = cyc > .3 && cyc < .9 ? 1.4 : .35;
    scanBar.position.y = 1.4 + (Math.sin(tt * 2.4) * .5 + .5) * 3.6;
    brain.rotation.set(tt * .6, tt * .9, 0); brain.position.y = 3.2 + Math.sin(tt * 1.4) * .25;
    brainMat.emissiveIntensity = .7 + Math.sin(tt * 3) * .25;
    dish.rotation.y = Math.sin(tt * .35) * .9; beacon.material.emissiveIntensity = (tt % 1.2) < .3 ? 1.6 : .2;
    flags.forEach(function (f, i) { f.rotation.y = Math.sin(tt * 2 + i) * .25; });
    puffs.forEach(function (p, i) { var c = ((tt * .35 + i / puffs.length) % 1); p.position.y = 13 + c * 7; p.position.x = SX1 - 1.5 + c * 2.5; p.scale.setScalar(.6 + c * 1.6); p.material.opacity = .75 * (1 - c); });
    clouds.forEach(function (c) { c[0].position.x += c[0].userData.v * dt * (reduce ? 0 : 1); if (c[0].position.x > 160) c[0].position.x = -160; });
    // the tower rises as the story nears its end
    var tsec = sections.filter(function (x) { return x.el.dataset.station === 'tower'; })[0];
    var towerT = tsec ? clamp((window.scrollY - tsec.top + H * .6) / (H * 1.3), 0, 1) : 1;
    var levels = Math.round(lerp(3, TL, smooth(towerT)));
    tower.count = levels * TF * TF; towerTop.position.y = .5 + levels * 1.1 + .9;
    towerTop.material.emissiveIntensity = .6 + night * 2;
    updateItems(time);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  window.addEventListener('mousemove', function (e) { mouse.x = e.clientX / W * 2 - 1; mouse.y = -(e.clientY / H * 2 - 1); }, { passive: true });
  var rT; window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(resize, 120); });
  resize();
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setInterval(measure, 2000);
  requestAnimationFrame(frame);
  window.__world = { scene: scene, camera: camera };
})();
