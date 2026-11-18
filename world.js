/* Stuti Singh — night city drive.
   A three.js city at dusk. Scrolling drives down one avenue ([data-station] sections in
   index.html map to KEYS below). Each company is a landmark tower, each system a roadside
   billboard with its real number. Neon is dark until you reach it, then flickers on, so the
   city lights up as you move through the career. Click buildings, the street, or the sky.
   Uses vendor/three.min.js (r128) + vendor/fx bloom (desktop). No build step. */
(function () {
  'use strict';
  var T = window.THREE, canvas = document.getElementById('world');
  if (!T || !canvas) { document.documentElement.classList.add('no-gl'); return; }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { document.documentElement.classList.add('no-gl'); return; }
  renderer.setClearColor(0x0b0d18);

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var hash = function (i, k) { var s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
  var mobile = window.innerWidth < 960;

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(32, 1, .5, 2600);
  scene.fog = new T.FogExp2(0x231c38, .0036);

  var composer = null, bloom = null;
  if (T.EffectComposer && T.UnrealBloomPass && !mobile) {
    try {
      composer = new T.EffectComposer(renderer);
      composer.addPass(new T.RenderPass(scene, camera));
      bloom = new T.UnrealBloomPass(new T.Vector2(512, 512), .5, .45, .62);
      composer.addPass(bloom);
    } catch (e) { composer = null; bloom = null; }
  }

  /* ---------- small helpers ---------- */
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function merge(list, withUv) {
    var pos = [], nor = [], uv = [];
    list.forEach(function (g) {
      g = g.index ? g.toNonIndexed() : g;
      Array.prototype.push.apply(pos, g.attributes.position.array);
      Array.prototype.push.apply(nor, g.attributes.normal.array);
      if (withUv) Array.prototype.push.apply(uv, g.attributes.uv.array);
    });
    var out = new T.BufferGeometry();
    out.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    if (withUv) out.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    return out;
  }
  function glowTex(stops) {
    var c = cv(128, 128), g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(function (s) { r.addColorStop(s[0], s[1]); });
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c);
  }
  var POOL = glowTex([[0, 'rgba(255,255,255,1)'], [.4, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
  var STREAK = (function () {
    var c = cv(64, 256), g = c.getContext('2d'), r = g.createLinearGradient(0, 0, 0, 256);
    r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(.25, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 256);
    var h = g.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = h; g.fillRect(0, 0, 64, 256);
    return new T.CanvasTexture(c);
  })();
  var additive = function (tex, hex, op) { return new T.MeshBasicMaterial({ map: tex, color: hex, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false }); };

  /* ---------- sky, moon, stars ---------- */
  var skyU = { top: { value: new T.Color('#1b1d3e') }, mid: { value: new T.Color('#4a2f5e') }, hor: { value: new T.Color('#e8835f') }, flash: { value: 0 } };
  var sky = new T.Mesh(new T.SphereGeometry(2000, 32, 16), new T.ShaderMaterial({
    uniforms: skyU, side: T.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform float flash; varying vec3 vP;' +
      'void main(){ float h = vP.y; vec3 c = h < 0.0 ? hor : (h < 0.16 ? mix(hor, mid, h / 0.16) : mix(mid, top, clamp((h - 0.16) / 0.5, 0.0, 1.0)));' +
      ' c += flash * vec3(0.55, 0.6, 0.8) * (0.4 + h); gl_FragColor = vec4(c, 1.0); }'
  }));
  sky.renderOrder = -2; scene.add(sky);
  var moon = new T.Sprite(new T.SpriteMaterial({ map: glowTex([[0, 'rgba(255,250,235,1)'], [.18, 'rgba(255,248,230,1)'], [.24, 'rgba(255,240,220,.35)'], [1, 'rgba(255,230,210,0)']]), fog: false, depthWrite: false, transparent: true }));
  moon.scale.set(220, 220, 1); scene.add(moon);
  var starGeo = new T.BufferGeometry(), sp = [];
  for (var st = 0; st < 700; st++) { var th = hash(st, 1) * 6.283, ph = .12 + hash(st, 2) * 1.3; sp.push(Math.cos(th) * Math.cos(ph) * 1800, Math.sin(ph) * 1800, Math.sin(th) * Math.cos(ph) * 1800); }
  starGeo.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
  var starMat = new T.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  var stars = new T.Points(starGeo, starMat); scene.add(stars);

  /* ---------- lights ---------- */
  var hemi = new T.HemisphereLight(0x5a5f9a, 0x120f18, .7); scene.add(hemi);
  var moonLight = new T.DirectionalLight(0xa9b8ff, .45); moonLight.position.set(-200, 300, -300); scene.add(moonLight);
  var head = new T.SpotLight(0xfff0d8, 0, 90, .42, .6, 1.2); scene.add(head); scene.add(head.target); // our headlights on the wet road

  /* ---------- ground, road, sidewalks ---------- */
  var Z0 = 110, Z1 = -540, RW = 7;                       // road from z=Z0 to Z1, half-width RW
  var CROSS = [28, -88, -236, -332];                      // cross streets
  var ground = new T.Mesh(new T.PlaneGeometry(4000, 4000), new T.MeshStandardMaterial({ color: 0x0d0e15, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.02; scene.add(ground);
  var roadMat = new T.MeshStandardMaterial({ color: 0x17181f, roughness: .28, metalness: .45 });
  var roadMesh = new T.Mesh(new T.PlaneGeometry(RW * 2, Z0 - Z1), roadMat); roadMesh.rotation.x = -Math.PI / 2; roadMesh.position.set(0, 0, (Z0 + Z1) / 2); scene.add(roadMesh);
  CROSS.forEach(function (z) { var r = new T.Mesh(new T.PlaneGeometry(900, 15), roadMat); r.rotation.x = -Math.PI / 2; r.position.set(0, .005, z); scene.add(r); });
  var walkMat = new T.MeshStandardMaterial({ color: 0x25262f, roughness: .8 });
  (function sidewalks() {
    var edges = [Z0];
    CROSS.forEach(function (z) { edges.push(z + 7.5, z - 7.5); });
    edges.push(Z1);
    for (var i = 0; i < edges.length; i += 2) {
      var a = edges[i], b = edges[i + 1], len = a - b;
      [-1, 1].forEach(function (s) { var w = new T.Mesh(new T.BoxGeometry(5, .3, len), walkMat); w.position.set(s * (RW + 2.5), .15, (a + b) / 2); scene.add(w); });
    }
  })();
  // lane markings: dashed whites, a double yellow down the middle, crosswalks
  (function markings() {
    var dash = [], solid = [];
    for (var z = Z0; z > Z1; z -= 6) {
      if (CROSS.some(function (c) { return Math.abs(z - c) < 9; })) continue;
      [-3.5, 3.5].forEach(function (x) { dash.push(new T.PlaneGeometry(.16, 2.6).rotateX(-Math.PI / 2).translate(x, .02, z)); });
    }
    [-.18, .18].forEach(function (x) { solid.push(new T.PlaneGeometry(.12, Z0 - Z1).rotateX(-Math.PI / 2).translate(x, .02, (Z0 + Z1) / 2)); });
    CROSS.forEach(function (c) { [c + 9.5, c - 9.5].forEach(function (zz) { for (var x = -6; x <= 6; x += 1.5) dash.push(new T.PlaneGeometry(.8, 3).rotateX(-Math.PI / 2).translate(x, .02, zz)); }); });
    scene.add(new T.Mesh(merge(dash), new T.MeshBasicMaterial({ color: 0x8d8b84 })));
    scene.add(new T.Mesh(merge(solid), new T.MeshBasicMaterial({ color: 0xc9a24a })));
  })();

  /* ---------- buildings: merged by window style, so the whole city is a few draw calls ---------- */
  var CW = 2.4, CH = 3.0;
  function windowTex(seed, litP, base, glass) {
    var c1 = cv(512, 512), g = c1.getContext('2d'), c2 = cv(512, 512), e = c2.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 512, 512); e.fillStyle = '#000'; e.fillRect(0, 0, 512, 512);
    for (var r = 0; r < 16; r++) {
      var rowLit = hash(seed * 31 + r, 7) < .25 ? 2.2 : 1;      // some whole floors are busy
      for (var c = 0; c < 16; c++) {
        var i = seed * 997 + r * 16 + c, x = c * 32 + 7, y = r * 32 + 8;
        g.fillStyle = glass; g.fillRect(x, y, 18, 17);
        if (hash(i, 1) < litP * rowLit) {
          var k = hash(i, 2); e.fillStyle = k < .62 ? '#ffcf8f' : k < .86 ? '#ffe6c4' : '#9fd0ff';
          e.globalAlpha = .35 + hash(i, 3) * .5; e.fillRect(x, y, 18, 17); e.globalAlpha = 1;
        }
      }
    }
    var t1 = new T.CanvasTexture(c1), t2 = new T.CanvasTexture(c2);
    [t1, t2].forEach(function (t) { t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; });
    return [t1, t2];
  }
  var STYLES = [windowTex(1, .2, '#1b1d27', '#262d3f'), windowTex(2, .14, '#202129', '#2c3446'), windowTex(3, .26, '#16182a', '#242b44')];
  var wallMats = STYLES.map(function (tx) { return new T.MeshStandardMaterial({ map: tx[0], emissiveMap: tx[1], emissive: 0xffffff, emissiveIntensity: .8, roughness: .55, metalness: .3 }); });
  var roofMat = new T.MeshStandardMaterial({ color: 0x101119, roughness: .9 });
  var bWalls = [[], [], []], bRoofs = [];
  // box with window UVs scaled to real size; walls and roof split so the roof stays plain
  function building(x, z, w, d, h, style, list) {
    var g = new T.BoxGeometry(w, h, d).toNonIndexed(), uv = g.attributes.uv.array, ox = hash(x * 3 + z, 4), oy = hash(x + z * 3, 5);
    for (var v = 0; v < 36; v++) {
      var f = Math.floor(v / 6), fw = f < 2 ? d : w;
      uv[v * 2] = uv[v * 2] * fw / (CW * 16) + ox; uv[v * 2 + 1] = uv[v * 2 + 1] * h / (CH * 16) + oy;
    }
    g.translate(x, h / 2, z);
    var pos = g.attributes.position.array, nor = g.attributes.normal.array, wall = new T.BufferGeometry(), roof = new T.BufferGeometry();
    var pick = function (arr, size, from, to) { return Array.prototype.slice.call(arr, from * size, to * size); };
    wall.setAttribute('position', new T.Float32BufferAttribute(pick(pos, 3, 0, 12).concat(pick(pos, 3, 24, 36)), 3));
    wall.setAttribute('normal', new T.Float32BufferAttribute(pick(nor, 3, 0, 12).concat(pick(nor, 3, 24, 36)), 3));
    wall.setAttribute('uv', new T.Float32BufferAttribute(pick(uv, 2, 0, 12).concat(pick(uv, 2, 24, 36)), 2));
    roof.setAttribute('position', new T.Float32BufferAttribute(pick(pos, 3, 12, 24), 3));
    roof.setAttribute('normal', new T.Float32BufferAttribute(pick(nor, 3, 12, 24), 3));
    (list || bWalls[style]).push(wall); bRoofs.push(roof);
    return wall;
  }
  var reserved = [], plazas = [];   // landmark footprints [x, z, r]; low-rise zones [side, zNear, zFar]
  function plazaCap(x, z) { for (var i = 0; i < plazas.length; i++) { var q = plazas[i]; if (x * q[0] > 0 && Math.abs(x) < 70 && z < q[1] && z > q[2]) return 9; } return 1e9; }
  function free(x, z, r) {
    if (CROSS.some(function (c) { return Math.abs(z - c) < 7.5 + r; })) return false;
    return !reserved.some(function (q) { return Math.abs(x - q[0]) < q[2] + r && Math.abs(z - q[1]) < q[2] + r; });
  }

  /* ---------- landmarks + billboards (the work) ---------- */
  var MACH = {}, signMats = [], fx = {}, lit = {}, sweeps = [], hitList = [], brandLights = [], signRedraw = [];
  function neonSign(text, hex, w) {
    var c = cv(1024, 200), g = c.getContext('2d'), tex = new T.CanvasTexture(c);
    var draw = function () {
      g.clearRect(0, 0, 1024, 200);
      g.font = '600 112px "JetBrains Mono", ui-monospace, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      var fit = Math.min(1, 940 / g.measureText(text).width); g.save(); g.translate(512, 104); g.scale(fit, 1);
      g.shadowColor = hex; g.shadowBlur = 36; g.fillStyle = hex; g.fillText(text, 0, 0); g.shadowBlur = 12; g.fillText(text, 0, 0);
      g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText(text, 0, 0); g.restore(); tex.needsUpdate = true;
    };
    draw(); signRedraw.push(draw);
    var m = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide, fog: false });
    return new T.Mesh(new T.PlaneGeometry(w, w * 200 / 1024), m);
  }
  function screenSign(tag, big, small, hex) {
    var c = cv(1024, 576), g = c.getContext('2d'), tex = new T.CanvasTexture(c); tex.anisotropy = 8;
    var draw = function () {
      var bg = g.createLinearGradient(0, 0, 0, 576); bg.addColorStop(0, '#141625'); bg.addColorStop(1, '#0b0c16');
      g.fillStyle = bg; g.fillRect(0, 0, 1024, 576);
      g.fillStyle = hex; g.fillRect(0, 0, 1024, 10); g.globalAlpha = .12; g.fillRect(0, 10, 1024, 566); g.globalAlpha = 1;
      g.fillStyle = hex; g.font = '600 34px "JetBrains Mono", ui-monospace, monospace'; g.textBaseline = 'alphabetic'; g.fillText(tag.toUpperCase(), 56, 88);
      g.fillStyle = '#f6f0e5'; g.font = '400 210px "Instrument Serif", Georgia, serif';
      var fit = Math.min(1, 912 / g.measureText(big).width); g.save(); g.translate(52, 330); g.scale(fit, fit); g.fillText(big, 0, 0); g.restore();
      g.fillStyle = 'rgba(246,240,229,.78)'; g.font = '400 40px Inter, system-ui, sans-serif'; g.fillText(small, 56, 440);
      g.fillStyle = 'rgba(255,255,255,.035)'; for (var y = 0; y < 576; y += 4) g.fillRect(0, y, 1024, 1);   // scanlines
      tex.needsUpdate = true;
    };
    draw(); signRedraw.push(draw);
    return new T.MeshBasicMaterial({ map: tex, fog: false });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { signRedraw.forEach(function (d) { d(); }); });

  function addMachine(k, def, hitAt, hitBox) {
    var hb = new T.Mesh(new T.BoxGeometry(hitBox[0], hitBox[1], hitBox[2]), new T.MeshBasicMaterial({ visible: false }));
    hb.position.set(hitAt[0], hitAt[1], hitAt[2]); hb.userData.k = k; scene.add(hb); hitList.push(hb);
    def.at = hitAt; def.box = hitBox; MACH[k] = def; fx[k] = 0; lit[k] = reduce ? 1 : 0;
  }
  // a landmark tower: tinted glass, neon edges, a rooftop name facing up the avenue, a light sweep
  function landmark(k, side, z, w, d, h, hex, name, def) {
    var x = side * (RW + 5 + w / 2); reserved.push([x, z, Math.max(w, d) / 2 + 3]); plazas.push([side, z + d / 2 + 60, z + d / 2]);
    var tex = windowTex(11 + Object.keys(MACH).length, .32, '#151726', '#2c3550');
    var mat = new T.MeshStandardMaterial({ map: tex[0], emissiveMap: tex[1], emissive: new T.Color(hex).lerp(new T.Color(0xffffff), .55), emissiveIntensity: .9, roughness: .3, metalness: .5 });
    var list = []; building(x, z, w, d, h, 0, list); scene.add(new T.Mesh(list[0], mat));
    var edgeMat = new T.MeshBasicMaterial({ color: hex, fog: false });
    var edges = [];
    [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) { edges.push(new T.BoxGeometry(.28, h, .28).translate(x + a * w / 2, h / 2, z + b * d / 2)); }); });
    [-1, 1].forEach(function (b) { edges.push(new T.BoxGeometry(w, .28, .28).translate(x, h, z + b * d / 2)); edges.push(new T.BoxGeometry(.28, .28, d).translate(x + b * w / 2, h, z)); });
    scene.add(new T.Mesh(merge(edges), edgeMat));
    var sign = neonSign(name, hex, Math.max(w * 1.5, 18)); sign.position.set(x, h + 3.2, z + d / 2 - 1); scene.add(sign);
    var sweep = new T.Mesh(new T.BoxGeometry(w + .5, .5, d + .5), new T.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    sweep.position.set(x, 0, z); scene.add(sweep); sweeps.push({ k: k, m: sweep, h: h });
    var pl = new T.PointLight(hex, 0, 70, 2); pl.position.set(x - side * (w / 2 + 4), 9, z + d / 2 + 4); scene.add(pl); brandLights.push([k, pl]);
    var pool = new T.Mesh(new T.PlaneGeometry(26, 26), additive(POOL, hex, 0)); pool.rotation.x = -Math.PI / 2; pool.position.set(side * (RW - 1), .04, z + d / 2 + 2); scene.add(pool);
    var streak = new T.Mesh(new T.PlaneGeometry(5, 34), additive(STREAK, hex, 0)); streak.rotation.x = -Math.PI / 2; streak.position.set(side * 3.2, .05, z + d / 2 + 14); scene.add(streak);
    signMats.push({ k: k, mats: [sign.material, edgeMat], glow: [pool.material, streak.material], body: mat });
    addMachine(k, def, [x, h / 2, z], [w + 1, h + 6, d + 1]);
    return { x: x, z: z, h: h, d: d };
  }
  // a roadside billboard showing one system and its number
  function billboard(k, side, z, hex, tagText, big, small, def) {
    var x = side * (RW + 4.5), y = 9.5, W2 = 13, H2 = W2 * 576 / 1024; reserved.push([x, z, 5]);
    var mat = screenSign(tagText, big, small, hex);
    var scr = new T.Mesh(new T.PlaneGeometry(W2, H2), mat), rot = side > 0 ? -.55 : .55;
    scr.position.set(x, y, z); scr.rotation.y = rot; scene.add(scr);
    var frameMat = new T.MeshStandardMaterial({ color: 0x15161d, roughness: .6, metalness: .5 });
    var frame = new T.Mesh(new T.BoxGeometry(W2 + .6, H2 + .6, .4), frameMat);
    frame.position.set(x - Math.sin(rot) * .25, y, z - Math.cos(rot) * .25); frame.rotation.y = rot; scene.add(frame);
    var post = new T.Mesh(new T.CylinderGeometry(.3, .4, y - H2 / 2, 10), frameMat); post.position.set(x, (y - H2 / 2) / 2, z - .4); scene.add(post);
    var pool = new T.Mesh(new T.PlaneGeometry(18, 18), additive(POOL, hex, 0)); pool.rotation.x = -Math.PI / 2; pool.position.set(side * (RW - 2), .04, z + 4); scene.add(pool);
    var streak = new T.Mesh(new T.PlaneGeometry(4, 26), additive(STREAK, hex, 0)); streak.rotation.x = -Math.PI / 2; streak.position.set(side * 3, .05, z + 12); scene.add(streak);
    signMats.push({ k: k, mats: [mat], glow: [pool.material, streak.material] });
    addMachine(k, def, [x, y, z], [W2, H2 + 2, 4]);
  }

  var A_HEX = '#ff7a45', L_HEX = '#5ee1d6', W_HEX = '#93a6ff';
  landmark('arkandis', 1, -52, 16, 16, 80, A_HEX, 'ARKANDIS LABS', { title: 'Arkandis Labs', sub: 'Founding Member & Engineer · Jul 2026 – Present', go: '#arkandis' });
  billboard('redaction', 1, -30, A_HEX, 'Arkandis · Redaction', '50M+ lines', 'of code redacted across 15+ codebases · still runs', { title: 'Redaction tooling', sub: 'Arkandis · 50M+ lines of code, still running', go: '#redaction' });
  landmark('lh2', -1, -124, 18, 16, 66, L_HEX, 'LH2 HOLDINGS', { title: 'LH2 Holdings', sub: 'Corporate Development Analyst · Dec 2025 – Jul 2026', go: '#lh2' });
  billboard('crm', -1, -150, L_HEX, 'LH2 · Contact intelligence', '95–97%', 'syndication accuracy, vs ~40% for ChatGPT/Claude', { title: 'Contact intelligence CRM', sub: 'LH2 · shipped solo, 95–97% syndication accuracy', go: '#crm' });
  billboard('research', 1, -170, L_HEX, 'LH2 · Research CRM', 'Human review', 'uncertain calls route to a person · reversible', { title: 'Research-Driven CRM', sub: 'LH2 · the model never silently writes', go: '#research-crm' });
  billboard('leads', -1, -192, L_HEX, 'LH2 · Lead qualification', '10,000 sites', 'scored in 15–25 minutes · nothing made up', { title: 'Lead qualification', sub: 'LH2 · 10,000 sites in 15–25 min, ~70% lower LLM cost', go: '#leads' });
  billboard('inventory', 1, -214, L_HEX, 'LH2 · Inventory Segmentor', '1–2 TB', 'mapped into licensable AI training corpora', { title: 'Inventory Segmentor', sub: 'LH2 · 1–2 TB across files, Drive, Gmail, Git', go: '#inventory' });
  billboard('etl', 1, -255, W_HEX, 'Wissen · Production ETL', '90%', 'fewer manual reporting errors', { title: 'Production ETL', sub: 'Wissen · 5+ years of BFSI data, 90% fewer errors', go: '#wissen' });
  landmark('wissen', 1, -278, 16, 16, 62, W_HEX, 'WISSEN', { title: 'Wissen Technology', sub: 'Associate Consultant – Data Analytics · Jun 2024 – Oct 2025', go: '#wissen' });
  // the KPI tower: its front face is a bar chart that fills in as you scroll
  var kpi = landmark('analytics', -1, -312, 16, 14, 74, W_HEX, 'KPI · FORECASTS', { title: 'KPI tower', sub: 'Wissen · KPI frameworks, forecasts and A/B tests', go: '#tower' });
  var KC = 8, KR = 26, BARS = [.38, .52, .46, .66, .6, .78, .72, .95];
  var kpiCells = new T.InstancedMesh(new T.BoxGeometry(1.4, 2.2, .3), new T.MeshBasicMaterial({ color: 0xffffff, fog: false }), KC * KR);
  var kpiRowCol = []; for (var kr = 0; kr < KR; kr++) kpiRowCol.push(new T.Color(W_HEX).lerp(new T.Color(L_HEX), kr / KR));
  scene.add(kpiCells);
  // the end of the avenue: her name on the skyline
  var endTower = []; building(-18, -478, 30, 22, 86, 0, endTower); scene.add(new T.Mesh(endTower[0], wallMats[2]));
  var endSign = neonSign('STUTI SINGH', '#ffd27a', 46); endSign.position.set(-18, 93, -468); scene.add(endSign);
  signMats.push({ k: 'end', mats: [endSign.material], glow: [] });
  addMachine('end', { title: 'Get in touch', sub: 'stutisingh22@icloud.com · open to AI & data engineering roles', go: '#contact' }, [-18, 60, -478], [32, 100, 24]);

  /* filler city */
  (function city() {
    var rows = mobile ? [[16, 12, 40], [38, 18, 80]] : [[16, 12, 40], [38, 18, 80], [64, 24, 130], [100, 30, 170]];
    rows.forEach(function (row, ri) {
      [-1, 1].forEach(function (s) {
        for (var z = Z0 + 40; z > Z1 - 120;) {
          var w = 9 + hash(z * s + ri, 1) * row[1], d = 9 + hash(z * s + ri, 2) * 10, x = s * (RW + 5 + row[0] - 16 + w / 2 + (ri ? hash(z, ri) * 6 : 0));
          var h = 10 + Math.pow(hash(z * s + ri * 7, 3), 1.6) * row[2] * (ri === 0 ? .55 : 1);
          h = Math.min(h, plazaCap(x, z));
          if (free(x, z, Math.max(w, d) / 2)) building(x, z, w, d, h, Math.floor(hash(z + s, ri + 9) * 3));
          z -= d + 1.5 + hash(z, 6) * 3;
        }
      });
    });
    // skyline beyond the end of the road
    for (var i = 0; i < (mobile ? 14 : 30); i++) { var bx = -260 + i * 18 + hash(i, 1) * 8, bz = -600 - hash(i, 2) * 160; building(bx, bz, 12 + hash(i, 3) * 14, 12 + hash(i, 4) * 10, 40 + Math.pow(hash(i, 5), 1.4) * 170, i % 3); }
    bWalls.forEach(function (list, i) { if (list.length) scene.add(new T.Mesh(merge(list, true), wallMats[i])); });
    scene.add(new T.Mesh(merge(bRoofs), roofMat));
  })();
  // storefronts glowing along the sidewalks
  (function shops() {
    var cols = [0xffc98a, 0x9fd8ff, 0xff9fb0, 0xbfffd8, 0xffe1a8], n = 0, MAXS = 140;
    var m = new T.InstancedMesh(new T.BoxGeometry(1, 2.4, .12), new T.MeshBasicMaterial({ color: 0xffffff }), MAXS), d = new T.Object3D(), c = new T.Color();
    for (var z = Z0; z > Z1 && n < MAXS; z -= 7 + hash(z, 3) * 5) [-1, 1].forEach(function (s) {
      if (n >= MAXS || !free(s * (RW + 5.2), z, 2) || hash(z * s, 5) < .35) return;
      d.position.set(s * (RW + 5.05), 1.5, z); d.rotation.y = Math.PI / 2; d.scale.set(3 + hash(z, s) * 3, 1, 1); d.updateMatrix(); m.setMatrixAt(n, d.matrix);
      c.setHex(cols[Math.floor(hash(z, s * 2) * cols.length)]).multiplyScalar(.55 + hash(z, 9) * .35); m.setColorAt(n, c); n++;
    });
    m.count = n; scene.add(m);
  })();

  /* ---------- street lamps with pools of light and wet-road streaks ---------- */
  var LAMPS = []; for (var lz = Z0 - 6; lz > Z1; lz -= 26) [-1, 1].forEach(function (s) { if (!CROSS.some(function (c) { return Math.abs(lz - c) < 8; })) LAMPS.push([s, lz]); });
  var NL = LAMPS.length, ld = new T.Object3D(), lc = new T.Color();
  var poleMesh = new T.InstancedMesh(merge([new T.CylinderGeometry(.14, .2, 8.5, 8).translate(0, 4.25, 0), new T.BoxGeometry(2.6, .16, .16).translate(-1.2, 8.4, 0)]), new T.MeshStandardMaterial({ color: 0x2a2b33, roughness: .5, metalness: .6 }), NL);
  var lampHead = new T.InstancedMesh(new T.BoxGeometry(1.1, .22, .5), new T.MeshBasicMaterial({ color: 0xffffff }), NL);
  var lampPool = new T.InstancedMesh(new T.PlaneGeometry(12, 12).rotateX(-Math.PI / 2), additive(POOL, 0xffffff, .5), NL);
  var lampStreak = new T.InstancedMesh(new T.PlaneGeometry(1.4, 16).rotateX(-Math.PI / 2), additive(STREAK, 0xffffff, .42), NL);
  LAMPS.forEach(function (L, i) {
    var x = L[0] * (RW + 1.2);
    ld.position.set(x, 0, L[1]); ld.rotation.set(0, L[0] > 0 ? 0 : Math.PI, 0); ld.updateMatrix(); poleMesh.setMatrixAt(i, ld.matrix);
    ld.rotation.set(0, 0, 0);
    ld.position.set(x - L[0] * 2.3, 8.3, L[1]); ld.updateMatrix(); lampHead.setMatrixAt(i, ld.matrix);
    ld.position.set(x - L[0] * 3, .03, L[1]); ld.updateMatrix(); lampPool.setMatrixAt(i, ld.matrix);
    ld.position.set(x - L[0] * 3.4, .045, L[1] + 8); ld.updateMatrix(); lampStreak.setMatrixAt(i, ld.matrix);
  });
  [poleMesh, lampHead, lampPool, lampStreak].forEach(function (m) { scene.add(m); });
  var LAMP_HEX = new T.Color(0xffc681), lampFlash = new Float32Array(NL);
  function paintLamps(level) {
    for (var i = 0; i < NL; i++) {
      var f = 1 + lampFlash[i] * 2.2, flick = lampFlash[i] > .05 && !reduce ? (Math.random() < .35 ? .2 : 1) : 1;
      lc.copy(LAMP_HEX).multiplyScalar(level * f * flick); lampHead.setColorAt(i, lc);
      lc.copy(LAMP_HEX).multiplyScalar(.75 * level * f * flick); lampPool.setColorAt(i, lc); lampStreak.setColorAt(i, lc);
    }
    lampHead.instanceColor.needsUpdate = lampPool.instanceColor.needsUpdate = lampStreak.instanceColor.needsUpdate = true;
  }
  paintLamps(1);

  /* ---------- traffic: head- and tail-lights that streak when you scroll fast ---------- */
  var NC = mobile ? 22 : 40, cars = [];
  var carBody = new T.InstancedMesh(merge([new T.BoxGeometry(1.9, .8, 4.3).translate(0, .75, 0), new T.BoxGeometry(1.65, .62, 2.2).translate(0, 1.45, -.2)]), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .25, metalness: .7 }), NC);
  var carLight = new T.InstancedMesh(new T.BoxGeometry(.42, .2, .1), new T.MeshBasicMaterial({ color: 0xffffff, fog: false }), NC * 2);
  var cd = new T.Object3D(), cc = new T.Color(), BODY = [0x1a1d26, 0x0f1015, 0x3a1418, 0x5d6370, 0x1d2b3a, 0x2a2a30];
  for (var ci = 0; ci < NC; ci++) {
    var lane = [-5.25, -1.75, 1.75, 5.25][ci % 4];
    cars.push({ x: lane, toward: lane < 0, off: hash(ci, 1) * (Z0 - Z1), v: 11 + hash(ci, 2) * 8 });
    cc.setHex(BODY[ci % BODY.length]); carBody.setColorAt(ci, cc);
    cc.setHex(lane < 0 ? 0xfff1d8 : 0xff2a36); carLight.setColorAt(ci * 2, cc); carLight.setColorAt(ci * 2 + 1, cc);
  }
  carBody.frustumCulled = carLight.frustumCulled = false; scene.add(carBody); scene.add(carLight);
  function updateCars(clock, rush) {
    var span = Z0 - Z1, len = .1 * (1 + rush * 30);
    for (var i = 0; i < NC; i++) {
      var c = cars[i], u = (c.off + clock * c.v) % span, z = c.toward ? Z1 + u : Z0 - u;
      cd.position.set(c.x, 0, z); cd.rotation.set(0, c.toward ? 0 : Math.PI, 0); cd.scale.set(1, 1, 1); cd.updateMatrix(); carBody.setMatrixAt(i, cd.matrix);
      // both kinds of light sit on the end that faces us (+z); fast scrolling stretches them into trails behind the car
      var trail = c.toward ? -1 : 1, lz = z + 2.17 + trail * (len - .1) / 2;
      for (var s = 0; s < 2; s++) {
        cd.position.set(c.x + (s ? .62 : -.62), .95, lz); cd.rotation.set(0, 0, 0); cd.scale.set(1, 1, len / .1); cd.updateMatrix();
        carLight.setMatrixAt(i * 2 + s, cd.matrix);
      }
    }
    carBody.instanceMatrix.needsUpdate = carLight.instanceMatrix.needsUpdate = true;
  }

  /* ---------- rain ---------- */
  var NR = reduce ? 0 : mobile ? 500 : 1300, rainPos = new Float32Array(Math.max(1, NR) * 6), rainSeed = [];
  for (var ri = 0; ri < NR; ri++) rainSeed.push([hash(ri, 1) * 80 - 40, hash(ri, 2) * 46, hash(ri, 3) * 90 - 70, 26 + hash(ri, 4) * 14]);
  var rainGeo = new T.BufferGeometry(); rainGeo.setAttribute('position', new T.BufferAttribute(rainPos, 3));
  var rainMat = new T.LineBasicMaterial({ color: 0xa9bbe6, transparent: true, opacity: .22, depthWrite: false });
  var rain = new T.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; if (NR) scene.add(rain);

  /* ---------- shockwave rings ---------- */
  var rings = [];
  for (var rq = 0; rq < 6; rq++) {
    var rm = new T.Mesh(new T.RingGeometry(.88, 1, 64), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    rm.rotation.x = -Math.PI / 2; rm.visible = false; scene.add(rm); rings.push({ m: rm, age: 9, max: 6 });
  }
  var ringNext = 0;
  function ring(x, z, size, hex) { var r = rings[ringNext++ % rings.length]; r.m.position.set(x, .08, z); r.m.material.color.set(hex); r.age = 0; r.max = size; r.m.visible = true; }

  /* ---------- reacting: arrivals light things up; clicks do more ---------- */
  var HEX = { arkandis: A_HEX, redaction: A_HEX, lh2: L_HEX, crm: L_HEX, research: L_HEX, leads: L_HEX, inventory: L_HEX, wissen: W_HEX, etl: W_HEX, analytics: W_HEX, end: '#ffd27a' };
  var flickT = {}, lightning = 0, kpiReplay = 0;
  function react(k, soft) {
    if (!MACH[k]) return;
    if (lit[k] < 1 && !reduce) flickT[k] = 0;            // first visit: the neon flickers on
    lit[k] = 1; fx[k] = Math.max(fx[k], soft ? .6 : 1);
    if (k === 'analytics' && !soft) kpiReplay = 1;
    var d = MACH[k];
    if (!reduce) ring(clamp(d.at[0], -RW + 1, RW - 1), d.at[2] + 6, soft ? 7 : 11, HEX[k] || '#ffffff');
  }

  /* ---------- labels ---------- */
  var tag = document.createElement('div'); tag.className = 'tag3d'; tag.setAttribute('role', 'status');
  tag.innerHTML = '<b></b><span></span><a href="#">Go to the slide <i aria-hidden="true">→</i></a>';
  document.body.appendChild(tag);
  var tagB = tag.querySelector('b'), tagS = tag.querySelector('span'), tagA = tag.querySelector('a');
  var tagK = null, tagPinned = 0, hoverK = null, v3 = new T.Vector3();
  function showTag(k, pinned) {
    var d = MACH[k]; tagK = k;
    tagB.textContent = d.title; tagS.textContent = pinned ? d.sub : 'Click to light it up'; tagA.setAttribute('href', d.go);
    tagA.firstChild.textContent = k === 'end' ? 'Get in touch ' : 'Go to the slide ';
    tag.classList.toggle('pinned', !!pinned); tag.classList.add('show');
    if (pinned) tagPinned = performance.now() + 4500;
  }
  function placeTag() {
    var d = MACH[tagK]; v3.set(d.at[0], d.at[1] + d.box[1] / 2 + 1, d.at[2]).project(camera);
    var x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H;
    if (v3.z > 1 || x < 0 || x > W || y > H) { tag.classList.remove('show'); return; }
    y = Math.max(y, 84 + tag.offsetHeight); x = clamp(x, 150, W - 150);
    tag.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px) translate(-50%, -100%)';
  }
  function hideTag() { tag.classList.remove('show', 'pinned'); tagK = null; tagPinned = 0; }

  var ray = new T.Raycaster(), ndc = new T.Vector2(), groundPlane = new T.Plane(new T.Vector3(0, 1, 0), 0), gp = new T.Vector3();
  function blocked(el) { return !!(el && el.closest && el.closest('a, button, input, textarea, label, dialog, .nav, .panel, .role, .hero > *, .contact > *, .tag3d, .hold')); }
  function pick(e) {
    ndc.set(e.clientX / W * 2 - 1, -(e.clientY / H) * 2 + 1); ray.setFromCamera(ndc, camera);
    var hit = ray.intersectObjects(hitList, false)[0];
    return hit ? hit.object.userData.k : null;
  }
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var k = blocked(e.target) ? null : pick(e);
    if (k !== hoverK) {
      hoverK = k; document.documentElement.classList.toggle('poke', !!k);
      if (k && (!tagPinned || tagK !== k)) showTag(k, false);
      else if (!k && !tagPinned) hideTag();
    }
  }, { passive: true });
  window.addEventListener('click', function (e) {
    if (blocked(e.target) || document.querySelector('dialog[open]')) return;
    var k = pick(e);
    if (k) { react(k, false); showTag(k, true); return; }
    var onGround = ray.ray.intersectPlane(groundPlane, gp) && gp.distanceTo(camera.position) < 260;
    if (onGround) {                                           // the street: nearby lamps flicker, a ripple
      if (!reduce) ring(gp.x, gp.z, 6, '#ffc681');
      LAMPS.forEach(function (L, i) { if (Math.hypot(L[0] * (RW + 1.2) - gp.x, L[1] - gp.z) < 40) lampFlash[i] = 1; });
    } else if (!reduce) lightning = 1;                         // the sky: a flash of lightning
  });
  tagA.addEventListener('click', function () { hideTag(); });

  /* ---------- camera stops along the avenue + the night deepening ---------- */
  // p: camera, t: look-at, off: shift the subject right of the text, sky: [top, mid, horizon], win: window lights
  var KEYS = {
    hero:      { p: [0, 74, 160],   t: [0, 8, -130],    off: .16, sky: ['#1b1d3e', '#4a2f5e', '#e8835f'], fog: .0030, win: .55, star: .2 },
    arkandis:  { p: [-5, 8, 52],    t: [20, 54, -52],   off: .2,  sky: ['#181a3a', '#43295a', '#d8705f'], fog: .0032, win: .65, star: .3 },
    redaction: { p: [-2, 6, 4],     t: [10, 9, -30],    off: .2,  sky: ['#16183a', '#3d2758', '#c8635f'], fog: .0034, win: .7,  star: .35 },
    lh2:       { p: [5, 8, -38],    t: [-24, 46, -124], off: .2,  sky: ['#131533', '#352555', '#a85a6a'], fog: .0034, win: .78, star: .45 },
    crm:       { p: [3, 6, -120],   t: [-11, 9, -150],  off: .2,  sky: ['#121430', '#322452', '#9a5468'], fog: .0036, win: .82, star: .5 },
    research:  { p: [-3, 6, -140],  t: [11, 9, -170],   off: .2,  sky: ['#11132e', '#2f2350', '#8c4f68'], fog: .0036, win: .85, star: .55 },
    leads:     { p: [3, 6, -162],   t: [-11, 9, -192],  off: .2,  sky: ['#10122c', '#2c214e', '#7e4a68'], fog: .0036, win: .88, star: .6 },
    inventory: { p: [-3, 6, -184],  t: [11, 9, -214],   off: .2,  sky: ['#0f112a', '#29204c', '#704568'], fog: .0036, win: .9,  star: .65 },
    wissen:    { p: [-5, 8, -200],  t: [20, 42, -272],  off: .2,  sky: ['#0d0f26', '#251e48', '#5f3f68'], fog: .0036, win: .95, star: .75 },
    analytics: { p: [5, 10, -226],  t: [-22, 46, -312], off: .2,  sky: ['#0c0e24', '#221d46', '#563c66'], fog: .0036, win: 1,   star: .8 },
    aerial:    { p: [130, 250, 40], t: [0, 0, -200],    off: 0,   sky: ['#090b1c', '#1d1a40', '#3c2c5e'], fog: .0014, win: 1,   star: 1 },
    night:     { p: [3, 10, -318],   t: [-14, 58, -478], off: .26, sky: ['#05060f', '#13122c', '#2a2346'], fog: .0024, win: 1,   star: 1 }
  };
  var ARRIVE = { arkandis: ['arkandis'], redaction: ['redaction'], lh2: ['lh2'], crm: ['crm'], research: ['research'], leads: ['leads'], inventory: ['inventory'], wissen: ['wissen', 'etl'], analytics: ['analytics'], night: ['end'] };
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-station]')).map(function (el) { return { el: el, name: el.dataset.station, key: KEYS[el.dataset.station] || KEYS.hero, top: 0 }; });
  var W = 0, H = 0, camPos = new T.Vector3(), camTgt = new T.Vector3(), first = true;
  var mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  function measure() { var y = window.scrollY; sections.forEach(function (s) { s.top = s.el.getBoundingClientRect().top + y; }); }
  function resize() {
    W = window.innerWidth; H = window.innerHeight; mobile = W < 960;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.fov = mobile ? 56 : 44; camera.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(W, H); }
    measure();
  }
  function state() {
    var mid = window.scrollY + H * .55, k = 0;
    for (var i = 0; i < sections.length; i++) if (sections[i].top <= mid) k = i;
    var B = sections[k], A = sections[Math.max(0, k - 1)];
    var t = k === 0 ? 1 : clamp((mid - B.top) / (H * .75), 0, 1);
    if (window.scrollY + H >= document.documentElement.scrollHeight - 4) t = 1;
    if (reduce) t = t < .5 ? 0 : 1;
    return { A: A.key, B: B.key, t: smooth(t), name: B.name };
  }
  var cA = new T.Color(), cB = new T.Color(), tmp = new T.Vector3(), tmp2 = new T.Vector3(), ahead = new T.Vector3();
  function mixHex(a, b, t, out) { cA.set(a); cB.set(b); return out.copy(cA).lerp(cB, t); }

  var last = performance.now(), lastScroll = window.scrollY, vel = 0, roll = 0, arrived = null, booted = false, carClock = 0;
  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var time = now / 1000, S0 = state(), A = S0.A, B = S0.B, t = S0.t;

    // scroll speed (screens per second): drives traffic, light trails, rain slant and a slight bank
    var dy = window.scrollY - lastScroll; lastScroll = window.scrollY;
    vel += ((dt > 0 ? dy / H / dt : 0) - vel) * .12;
    var rush = reduce ? 0 : Math.min(5, Math.abs(vel) * 2.5);
    Object.keys(fx).forEach(function (k) { fx[k] = Math.max(0, fx[k] - dt * .7); });
    if (!reduce) carClock += dt * (1 + rush * 1.5);
    if (t > .97 && S0.name !== arrived) {
      if (booted && ARRIVE[S0.name]) ARRIVE[S0.name].forEach(function (k) { react(k, true); });
      arrived = S0.name;
    }
    booted = true;

    // camera: glide between stops; mid-drive it looks down the road, then turns to the building
    tmp.set(lerp(A.p[0], B.p[0], t), lerp(A.p[1], B.p[1], t), lerp(A.p[2], B.p[2], t));
    tmp2.set(lerp(A.t[0], B.t[0], t), lerp(A.t[1], B.t[1], t), lerp(A.t[2], B.t[2], t));
    var drive = Math.sin(t * Math.PI) * (Math.abs(A.p[2] - B.p[2]) > 15 && A.p[1] < 20 && B.p[1] < 20 ? .7 : 0);
    ahead.set(tmp.x * .3, tmp.y + 2, tmp.z - 60); tmp2.lerp(ahead, drive);
    mouse.sx += (mouse.x - mouse.sx) * .05; mouse.sy += (mouse.y - mouse.sy) * .05;
    if (!reduce) { tmp.x += mouse.sx * 1.6; tmp.y += mouse.sy * .9; }
    var k = first || reduce ? 1 : 1 - Math.pow(.0016, dt);
    camPos.lerp(tmp, k); camTgt.lerp(tmp2, k); first = false;
    camera.position.copy(camPos); camera.lookAt(camTgt);
    if (!reduce) { roll += (clamp(vel, -3, 3) * -.01 - roll) * .06; camera.rotateZ(roll); }
    var off = lerp(A.off, B.off, t);
    if (mobile) camera.setViewOffset(W, H, 0, H * .14, W, H); else camera.setViewOffset(W, H, -W * off, 0, W, H);
    sky.position.copy(camera.position); stars.position.copy(camera.position);
    moon.position.set(camera.position.x - 260, camera.position.y + 300, camera.position.z - 1100);

    // sky, fog and lightning
    lightning = Math.max(0, lightning - dt * 2.2);
    var flash = lightning > .75 || (lightning > .35 && lightning < .5) ? lightning : 0;
    mixHex(A.sky[0], B.sky[0], t, skyU.top.value); mixHex(A.sky[1], B.sky[1], t, skyU.mid.value); mixHex(A.sky[2], B.sky[2], t, skyU.hor.value);
    skyU.flash.value = flash;
    scene.fog.color.copy(skyU.mid.value).lerp(skyU.hor.value, .35).multiplyScalar(.8 + flash);
    scene.fog.density = lerp(A.fog, B.fog, t);
    hemi.intensity = .6 + flash * 2.5; moonLight.intensity = .4 + flash * 2;
    var win = lerp(A.win, B.win, t);
    wallMats.forEach(function (m) { m.emissiveIntensity = win * .75; });
    starMat.opacity = lerp(A.star, B.star, t) * .9;
    rainMat.opacity = .2 + flash * .5;
    // our headlights reach down the wet road at street level
    var low = clamp(1 - (camPos.y - 8) / 20, 0, 1);
    head.intensity = 1.5 * low; head.position.set(camPos.x, camPos.y - 1.5, camPos.z); head.target.position.set(camTgt.x * .4, 0, camPos.z - 40);

    // neon: dark until visited, then it flickers on; clicks pulse it
    signMats.forEach(function (s) {
      var lv = lit[s.k] || 0;
      if (flickT[s.k] != null) {
        flickT[s.k] += dt; var ft = flickT[s.k];
        lv = ft > 1.1 ? 1 : (Math.sin(ft * 47) > .2 && Math.random() > .3 ? .9 : .12);
        if (ft > 1.1) delete flickT[s.k];
      }
      var f = fx[s.k] || 0, level = .16 + lv * .84 + f * .6;
      s.mats.forEach(function (m) { m.color.setScalar(level); });
      s.glow.forEach(function (m) { m.opacity = lv * .5 + f * .4; });
      if (s.body) s.body.emissiveIntensity = .45 + lv * .35 + f * .8;
    });
    brandLights.forEach(function (b) { b[1].intensity = (lit[b[0]] || 0) * 2.2 + (fx[b[0]] || 0) * 4; });
    sweeps.forEach(function (s) {
      var f = fx[s.k] || 0;
      if (f <= 0 || reduce) { s.m.material.opacity = 0; return; }
      var u = clamp(1 - f / (f > .6 ? 1 : .6), 0, 1); s.m.position.y = u * s.h; s.m.material.opacity = .85 * Math.sin(u * Math.PI);
    });

    // the KPI tower's bar chart fills in through its slide (and replays on click)
    var ksec = sections.filter(function (x) { return x.name === 'analytics'; })[0];
    var kp = ksec ? clamp((window.scrollY - ksec.top + H * .7) / (H * 1.2), 0, 1) : 1;
    kpiReplay = Math.max(0, kpiReplay - dt * .6); if (kpiReplay > 0) kp = Math.min(kp, 1 - kpiReplay);
    if (reduce) kp = kp > .3 ? 1 : 0;
    var n = 0, kb = .55 + .45 * (lit.analytics || 0) + (fx.analytics || 0) * .5;
    for (var col = 0; col < KC; col++) for (var row = 0; row < KR; row++) {
      var on = row / KR < BARS[col] * smooth(kp);
      cd.position.set(kpi.x + (col - (KC - 1) / 2) * 1.75, 3 + row * 2.6, kpi.z + kpi.d / 2 + .2); cd.rotation.set(0, 0, 0);
      cd.scale.setScalar(on ? 1 : 0); cd.updateMatrix(); kpiCells.setMatrixAt(n, cd.matrix);
      cc.copy(kpiRowCol[row]).multiplyScalar(kb); kpiCells.setColorAt(n, cc); n++;
    }
    kpiCells.instanceMatrix.needsUpdate = true; kpiCells.instanceColor.needsUpdate = true;

    // lamps, cars, rain, rings
    for (var li = 0; li < NL; li++) lampFlash[li] = Math.max(0, lampFlash[li] - dt * .8);
    paintLamps(.85 + win * .15);
    updateCars(carClock, rush);
    if (NR) {
      var rp = rainPos, slant = clamp(vel, -3, 3) * .6;
      for (var q = 0; q < NR; q++) {
        var r = rainSeed[q], y = ((r[1] - time * r[3]) % 46 + 46) % 46;
        var x = camPos.x + r[0], z = camPos.z + r[2];
        rp[q * 6] = x; rp[q * 6 + 1] = y; rp[q * 6 + 2] = z;
        rp[q * 6 + 3] = x + slant * .15; rp[q * 6 + 4] = y + 1.1; rp[q * 6 + 5] = z + slant * .4;
      }
      rainGeo.attributes.position.needsUpdate = true;
    }
    rings.forEach(function (r) {
      if (!r.m.visible) return; r.age += dt;
      var a = r.age / 1.5; if (a >= 1) { r.m.visible = false; return; }
      r.m.scale.setScalar(.5 + r.max * (1 - Math.pow(1 - a, 3))); r.m.material.opacity = .8 * (1 - a);
    });

    if (tagK) { placeTag(); if (tagPinned && performance.now() > tagPinned && hoverK !== tagK) hideTag(); }
    if (composer) composer.render(); else renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  window.addEventListener('mousemove', function (e) { mouse.x = e.clientX / W * 2 - 1; mouse.y = -(e.clientY / H * 2 - 1); }, { passive: true });
  var rT; window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(resize, 120); });
  resize();
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setInterval(measure, 2000);
  requestAnimationFrame(frame);
  window.__world = { scene: scene, camera: camera, react: react, lit: lit };
})();
