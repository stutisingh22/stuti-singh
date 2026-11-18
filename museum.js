/* Stuti Singh — the museum.
   The default experience: a small gallery building in three.js. The lobby carries the name
   and proof numbers; each gallery is one employer from the résumé; each project is a living
   sculpture on a plinth, under a spotlight, with a placard that holds the real page section
   (moved in, and back out when you leave). Guided tour: arrows, scroll, or Next glide you from
   exhibit to exhibit. Click a sculpture to walk to it, click the floor to wander, drag to look.
   "Read as a page" (?mode=page) and the night drive (?mode=game) stay one click away.
   Uses vendor/three.min.js (r128). No build step. */
(function () {
  'use strict';
  var T = window.THREE, canvas = document.getElementById('world'), html = document.documentElement;
  if (!T || !canvas) { html.classList.add('no-gl'); return; }
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { html.classList.add('no-gl'); return; }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.innerWidth < 960;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var hash = function (i, k) { var s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  html.classList.add('museum');
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  var BG = 0xe8e2d9;
  renderer.setClearColor(BG);
  var scene = new T.Scene();
  scene.background = new T.Color(BG);
  scene.fog = new T.Fog(BG, 34, 95);
  var camera = new T.PerspectiveCamera(mobile ? 64 : 50, 1, .1, 300);

  /* ---------- materials + helpers ---------- */
  var M = function (hex, o) { o = o || {}; return new T.MeshStandardMaterial({ color: hex, roughness: o.r == null ? .8 : o.r, metalness: o.m || 0, emissive: o.e || 0, emissiveIntensity: o.ei || 0, transparent: !!o.op, opacity: o.op || 1, side: o.side || T.FrontSide, depthWrite: o.dw == null ? true : o.dw, flatShading: !!o.flat }); };
  var WALL = M(0xefe9e0, { r: .95 }), FLOOR = M(0x8f8982, { r: .32, m: .12 }), CEIL = M(0xf6f2ec, { r: 1 }), BASE = M(0x2b2724, { r: .6 });
  var PLINTH = M(0xf7f4ef, { r: .7 }), DARK = M(0x24211f, { r: .45, m: .5 }), BRASS = M(0xc49a52, { r: .3, m: .85 });
  function add(geo, mat, x, y, z, parent, noShadow) {
    var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = !noShadow; m.receiveShadow = true; (parent || scene).add(m); return m;
  }
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var SERIF = '"Instrument Serif", Georgia, serif', SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
  var INK = '#2a2521', MUTED = '#776d63';
  var redraws = [];
  // a plane painted with canvas text, drawn in world units (1 unit = 1 m)
  function paint(w, h, draw, opts) {
    opts = opts || {};
    var ppu = opts.ppu || 160, c = cv(Math.min(2048, Math.round(w * ppu)), Math.min(2048, Math.round(h * ppu))), g = c.getContext('2d');
    var tex = new T.CanvasTexture(c); tex.anisotropy = 8;
    var run = function () { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.scale(c.width / w, c.height / h); draw(g, w, h); tex.needsUpdate = true; };
    run(); redraws.push(run);
    var mat = opts.basic ? new T.MeshBasicMaterial({ map: tex, transparent: true }) : new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: .95 });
    mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2;
    var mesh = new T.Mesh(new T.PlaneGeometry(w, h), mat); mesh.receiveShadow = true; return mesh;
  }
  function wrap(g, text, x, y, maxW, lh) {
    var words = String(text).split(' '), line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); line = words[i]; y += lh; } else line = test;
    }
    if (line) g.fillText(line, x, y);
    return y + lh;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { redraws.forEach(function (r) { r(); }); });
  var GLOW = (function () {
    var c = cv(128, 128), g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.45, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c);
  })();

  /* ---------- lights ---------- */
  var hemi = new T.HemisphereLight(0xfffaf2, 0x8c837a, .78); scene.add(hemi);
  var sun = new T.DirectionalLight(0xfff3e0, .5); sun.castShadow = !mobile;
  sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 80; sun.shadow.bias = -.0006;
  scene.add(sun); scene.add(sun.target);
  var spot = new T.SpotLight(0xfff0d8, 1.7, 26, .42, .6, 1.1); spot.castShadow = !mobile; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.0005;
  scene.add(spot); scene.add(spot.target);

  /* ---------- the building: rooms in a line, doorways between them ---------- */
  var H = 8.6, DOOR_W = 5.4, DOOR_H = 4.8;
  var ROOMS = [
    { key: 'lobby',    num: '',    name: 'Lobby',               hex: '#b49a78', len: 20, w: 26 },
    { key: 'arkandis', num: '01',  name: 'Arkandis Labs',       hex: '#ff7a45', len: 26, w: 24 },
    { key: 'lh2',      num: '02',  name: 'LH2 Holdings',        hex: '#24a89b', len: 50, w: 28 },
    { key: 'wissen',   num: '03',  name: 'Wissen Technology',   hex: '#6b7fff', len: 28, w: 24 },
    { key: 'research', num: '04',  name: 'Research & education', hex: '#c7922f', len: 28, w: 24 },
    { key: 'exit',     num: '',    name: 'Exit',                hex: '#b49a78', len: 16, w: 20 }
  ];
  var RI = {}; (function () { var z = 0; ROOMS.forEach(function (r, i) { r.i = i; r.z0 = z; r.z1 = z - r.len; z = r.z1; RI[r.key] = r; }); })();
  var floors = [];
  ROOMS.forEach(function (r) {
    var cz = (r.z0 + r.z1) / 2;
    var f = add(new T.PlaneGeometry(r.w, r.len), FLOOR, 0, 0, cz, null, true); f.rotation.x = -Math.PI / 2; floors.push(f);
    var c = add(new T.PlaneGeometry(r.w, r.len), CEIL, 0, H, cz, null, true); c.rotation.x = Math.PI / 2;
    [-1, 1].forEach(function (s) {
      add(new T.BoxGeometry(.3, H, r.len), WALL, s * (r.w / 2 + .15), H / 2, cz);
      add(new T.BoxGeometry(.06, .16, r.len), BASE, s * (r.w / 2 - .03), .08, cz, null, true);
      add(new T.BoxGeometry(.03, .06, r.len - 1), M(new T.Color(r.hex).getHex(), { r: .6 }), s * (r.w / 2 - .02), 5.6, cz, null, true);   // the gallery's colour line
    });
    // skylight: a bright slot in the ceiling with soft light falling from it
    add(new T.BoxGeometry(r.w * .3, .04, r.len * .72), new T.MeshBasicMaterial({ color: 0xfffdf7 }), 0, H - .02, cz, null, true);
    var shaft = new T.Mesh(new T.BoxGeometry(r.w * .3, H - .2, r.len * .72), new T.MeshBasicMaterial({ color: 0xfff6e4, transparent: true, opacity: .045, depthWrite: false, blending: T.AdditiveBlending }));
    shaft.position.set(0, H / 2, cz); scene.add(shaft);
  });
  function wallAcross(z, w, doorway, label, hex) {
    if (!doorway) { add(new T.BoxGeometry(w, H, .3), WALL, 0, H / 2, z); return; }
    var side = (w - DOOR_W) / 2;
    [-1, 1].forEach(function (s) { add(new T.BoxGeometry(side, H, .3), WALL, s * (DOOR_W / 2 + side / 2), H / 2, z); });
    add(new T.BoxGeometry(DOOR_W, H - DOOR_H, .3), WALL, 0, DOOR_H + (H - DOOR_H) / 2, z);
    [-1, 1].forEach(function (s) { add(new T.BoxGeometry(.12, DOOR_H, .42), DARK, s * (DOOR_W / 2 + .06), DOOR_H / 2, z); });
    add(new T.BoxGeometry(DOOR_W + .24, .12, .42), DARK, 0, DOOR_H + .06, z);
    if (label) {   // the next gallery's name over the door, facing the visitor walking towards it
      var p = paint(DOOR_W + 3, 1.3, function (g, W2, H2) {
        g.textAlign = 'center'; g.fillStyle = hex; g.font = '600 .2px ' + MONO; g.fillText(label[0].toUpperCase(), W2 / 2, .36);
        g.fillStyle = INK; g.font = '400 .62px ' + SERIF; g.fillText(label[1], W2 / 2, 1.05);
      });
      p.position.set(0, DOOR_H + .95, z + .16); scene.add(p);
    }
  }
  wallAcross(0, ROOMS[0].w, false);
  for (var di = 0; di < ROOMS.length - 1; di++) {
    var a = ROOMS[di], b = ROOMS[di + 1];
    wallAcross(a.z1, Math.max(a.w, b.w) + .6, true, [b.num ? 'Gallery ' + b.num : ' ', b.name], b.hex);
  }
  wallAcross(ROOMS[ROOMS.length - 1].z1, ROOMS[ROOMS.length - 1].w, false);
  var DOORS = ROOMS.slice(0, -1).map(function (r) { return r.z1; });

  /* ---------- wall text ---------- */
  function onLeftWall(r, u, mesh, y) { mesh.rotation.y = Math.PI / 2; mesh.position.set(-r.w / 2 + .02, y, r.z0 - u * r.len); scene.add(mesh); return mesh; }
  function onRightWall(r, u, mesh, y) { mesh.rotation.y = -Math.PI / 2; mesh.position.set(r.w / 2 - .02, y, r.z0 - u * r.len); scene.add(mesh); return mesh; }
  function galleryIntro(r, lines) {
    var p = paint(7.2, 4.2, function (g, W2) {
      g.fillStyle = r.hex; g.font = '600 .17px ' + MONO; g.fillText(('Gallery ' + r.num).toUpperCase(), 0, .3);
      g.fillStyle = INK; g.font = '400 .86px ' + SERIF; g.fillText(r.name, 0, 1.25);
      g.fillStyle = INK; g.font = '500 .2px ' + SANS; var y = wrap(g, lines[0], 0, 1.75, W2 - .2, .28);
      g.fillStyle = MUTED; g.font = '500 .16px ' + MONO; g.fillText(lines[1].toUpperCase(), 0, y + .05);
      g.fillStyle = INK; g.font = '400 .34px ' + SERIF; wrap(g, lines[2], 0, y + .72, W2 - .3, .42);
    });
    return onLeftWall(r, .2, p, 3.2);
  }
  galleryIntro(RI.arkandis, ['Founding Member & Engineer (Tech & Operations)', 'Jul 2026 – Present', 'Tech and operations for an AI training-data business, from day one.']);
  galleryIntro(RI.lh2, ['Corporate Development Analyst (Founder’s Office)', 'Dec 2025 – Jul 2026', 'Production systems, built from the founder’s office.']);
  galleryIntro(RI.wissen, ['Associate Consultant – Data Analytics (Chief of Staff Office)', 'Jun 2024 – Oct 2025', 'Five years of BFSI data, made into one reliable analytics layer.']);
  galleryIntro(RI.research, ['IIM Bangalore (IIMB) · Research Associate', 'Feb 2026 – Present', 'Entrepreneurial leadership and market-agility research, plus how I got here.']);
  // lobby: the name over the first doorway, proof on the walls
  (function lobby() {
    var r = RI.lobby;
    var name = paint(16, 3.1, function (g, W2) {
      g.textAlign = 'center'; g.fillStyle = INK; g.font = '400 2.05px ' + SERIF; g.fillText('Stuti Singh', W2 / 2, 1.95);
      g.fillStyle = '#c4562a'; g.font = '600 .26px ' + MONO; g.fillText('AI ENGINEER  /  DATA ENGINEER', W2 / 2, 2.62);
    });
    name.position.set(0, DOOR_H + 2.1, r.z1 + .17); scene.add(name);
    var proof = paint(10, 4.4, function (g) {
      g.fillStyle = MUTED; g.font = '600 .17px ' + MONO; g.fillText('IN NUMBERS', 0, .3);
      [['50M+', 'lines of code redacted across 15+ codebases'], ['10,000', 'websites qualified per run, in 15–25 minutes'], ['95–97%', 'syndication accuracy, vs ~40% for ChatGPT/Claude'], ['90%', 'fewer manual reporting errors after ETL']].forEach(function (p, i) {
        var y = .95 + i * .92; g.fillStyle = INK; g.font = '400 .72px ' + SERIF; g.fillText(p[0], 0, y + .3);
        g.fillStyle = MUTED; g.font = '500 .2px ' + SANS; g.fillText(p[1], 3.1, y + .18);
      });
    });
    onLeftWall(r, .45, proof, 3.3);
    var stack = paint(9, 3.2, function (g) {
      g.fillStyle = MUTED; g.font = '600 .17px ' + MONO; g.fillText('WHAT I BUILD', 0, .3);
      g.fillStyle = INK; g.font = '400 .5px ' + SERIF; wrap(g, 'Backend systems, data pipelines and LLM applications, from architecture to production.', 0, 1.0, 8.6, .62);
      g.fillStyle = '#c4562a'; g.font = '500 .2px ' + MONO; g.fillText('PYTHON · SQL · FASTAPI · POSTGRESQL · ASYNC · CLAUDE / OPENAI', 0, 2.95);
    });
    onRightWall(r, .45, stack, 3.4);
  })();
  (function exitWall() {
    var r = RI.exit;
    var p = paint(12, 2.8, function (g, W2) {
      g.textAlign = 'center'; g.fillStyle = INK; g.font = '400 .95px ' + SERIF; g.fillText('Thank you for visiting.', W2 / 2, 1.05);
      g.fillStyle = '#c4562a'; g.font = '600 .26px ' + MONO; g.fillText('STUTISINGH22@ICLOUD.COM', W2 / 2, 1.75);
      g.fillStyle = MUTED; g.font = '500 .2px ' + SANS; g.fillText('Open to AI engineering and data engineering roles · Bengaluru', W2 / 2, 2.3);
    });
    p.position.set(0, 4.6, r.z1 + .17); scene.add(p);
  })();

  /* ---------- exhibits ---------- */
  var EXH = [], hitList = [], tickers = [];
  function plinth(g, w, h, d) { add(new T.BoxGeometry(w, h, d), PLINTH, 0, h / 2, 0, g); add(new T.BoxGeometry(w + .04, .05, d + .04), BASE, 0, .025, 0, g, true); return h; }
  function label(g, title, metric, hex, y, z) {
    var p = paint(1.5, .62, function (c, W2) {
      c.fillStyle = '#fbf9f5'; c.fillRect(0, 0, W2, .62);
      c.fillStyle = hex; c.fillRect(0, 0, .04, .62);
      c.fillStyle = INK; c.font = '600 .085px ' + SANS; c.fillText(title, .12, .17);
      c.fillStyle = INK; c.font = '400 .22px ' + SERIF; c.fillText(metric, .12, .45);
    }, { ppu: 420 });
    p.position.set(0, y, z); p.rotation.x = -.35; g.add(p);
  }
  function exhibit(k, roomKey, side, u, title, metric, build) {
    var r = RI[roomKey], g = new T.Group(), x = side * (r.w / 2 - 4.6), z = r.z0 - u * r.len;
    g.position.set(x, 0, z); g.rotation.y = side > 0 ? -.35 : .35; scene.add(g);
    var tick = build(g, r.hex) || function () {};
    tickers.push(tick);
    // a pool of light on the floor and a faint cone from the ceiling
    var pool = new T.Mesh(new T.PlaneGeometry(6, 6), new T.MeshBasicMaterial({ map: GLOW, color: 0xfff1d8, transparent: true, opacity: .32, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(x, .01, z); scene.add(pool);
    var cone = new T.Mesh(new T.CylinderGeometry(.25, 2.3, H - 1, 32, 1, true), new T.MeshBasicMaterial({ color: 0xfff3dd, transparent: true, opacity: .05, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
    cone.position.set(x, (H - 1) / 2 + .5, z); scene.add(cone);
    var hb = new T.Mesh(new T.BoxGeometry(3.4, 5, 3.4), new T.MeshBasicMaterial({ visible: false })); hb.position.set(x, 2.5, z); hb.userData.k = k; scene.add(hb); hitList.push(hb);
    var e = { k: k, room: r, side: side, pos: new T.Vector3(x, 0, z), title: title, metric: metric, group: g };
    EXH.push(e); return e;
  }

  // 01 · Arkandis: the founding year, a monolith with supplier data orbiting into it
  exhibit('arkandis', 'arkandis', 1, .38, 'Arkandis Labs · founding year', '$400K+ in four months', function (g, hex) {
    var top = plinth(g, 2.4, .5, 1.6);
    add(new T.BoxGeometry(1.5, 4.0, .42), DARK, 0, top + 2, 0, g);
    var face = paint(1.4, 3.8, function (c) {
      c.fillStyle = '#d9b46a'; c.font = '400 .44px ' + SERIF; c.fillText('$400K+', .1, .8);
      c.font = '500 .085px ' + SANS; c.fillStyle = 'rgba(240,226,200,.85)'; wrap(c, 'revenue the company reported in its first four months', .1, 1.05, 1.2, .13);
      c.fillStyle = '#d9b46a'; c.font = '400 .3px ' + SERIF; c.fillText('Lead →', .1, 2.3); c.fillText('delivery', .1, 2.65);
      c.font = '500 .08px ' + SANS; c.fillStyle = 'rgba(240,226,200,.85)'; wrap(c, 'scraping, qualification, supplier intake, preparation, delivery', .1, 2.9, 1.2, .12);
    }, { basic: true });
    face.position.set(0, top + 2, .215); g.add(face);
    var n = 28, inst = new T.InstancedMesh(new T.BoxGeometry(.16, .16, .16), M(0xffffff, { r: .5 }), n), d = new T.Object3D(), col = new T.Color();
    for (var i = 0; i < n; i++) { col.set(i % 3 ? hex : '#f2e6d4'); inst.setColorAt(i, col); }
    inst.castShadow = true; g.add(inst);
    label(g, 'Arkandis Labs · Founding Member & Engineer', '$400K+ · first four months', hex, .32, .82);
    return function (t) {
      for (var i = 0; i < n; i++) {
        var ph = (t * .12 + i / n) % 1, ang = i * 2.4 + t * .5, rad = 1.9 * (1 - ph * .85);
        d.position.set(Math.cos(ang) * rad, top + .4 + ph * 3.2 + Math.sin(i) * .2, Math.sin(ang) * rad * .8);
        d.rotation.set(t + i, t * .7 + i, 0); d.scale.setScalar(1 - ph * .6); d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
    };
  });

  // 01 · Redaction: pages of code in a vitrine; black bars sweep across, the green light stays on
  exhibit('redaction', 'arkandis', -1, .72, 'Redaction tooling', '50M+ lines, still running', function (g, hex) {
    var top = plinth(g, 2.6, 1.0, 1.7);
    var glass = new T.Mesh(new T.BoxGeometry(2.4, 1.9, 1.5), new T.MeshStandardMaterial({ color: 0xe8f2f2, transparent: true, opacity: .16, roughness: .05, metalness: .2, depthWrite: false }));
    glass.position.set(0, top + .95, 0); g.add(glass);
    add(new T.BoxGeometry(2.42, .04, 1.52), DARK, 0, top + 1.9, 0, g, true);
    var CODE = ['def notify(owner):', '  email = "priya@acme.com"', '  phone = "+91 98000 12345"', '  log("Priya approved")', '  send(owner, cc=email)', 'class Client:', '  name = "Arjun Mehta"', '  key = load("acme.pem")'];
    var bars = [];
    for (var s = 0; s < 4; s++) {
      var page = paint(1.3, .95, (function (s) { return function (c) {
        c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, 1.3, .95);
        c.fillStyle = '#3a3530'; c.font = '500 .065px ' + MONO;
        for (var l = 0; l < 8; l++) c.fillText(CODE[(l + s * 2) % CODE.length], .07, .12 + l * .105);
      }; })(s), { ppu: 420 });
      var px = -.7 + s * .46, pz = -.4 + s * .26; page.position.set(px, top + .7, pz); page.rotation.y = .2; g.add(page);
      for (var l = 0; l < 4; l++) {
        var bar = new T.Mesh(new T.BoxGeometry(.55, .05, .01), M(0x111111, { r: .4 }));
        bar.position.set(px + .14, top + .7 + .3 - (l * 2 + 1) * .105 + .02, pz + .012); bar.rotation.y = .2; g.add(bar);
        bars.push({ m: bar, d: s * .9 + l * .35 });
      }
    }
    var ok = new T.Mesh(new T.SphereGeometry(.09, 16, 12), new T.MeshBasicMaterial({ color: 0x35d07f })); ok.position.set(1.05, top + 1.72, .62); g.add(ok);
    label(g, 'Redaction · 15+ codebases · 3–5 yrs Git history', '50M+ lines, still running', hex, .7, .9);
    return function (t) {
      var cyc = (t % 6) / 6;
      bars.forEach(function (b) { var u = clamp(cyc * 6 - b.d, 0, 1); b.m.scale.x = Math.max(.001, smooth(u)); b.m.position.x += 0; });
      ok.material.color.setHSL(.4, .7, .45 + Math.sin(t * 3) * .08);
    };
  });

  // 02 · LH2: data falling into a basin, the ETL that fed everything else
  exhibit('lh2', 'lh2', 1, .14, 'LH2 · data infrastructure', '10,000+ records synced', function (g, hex) {
    var top = plinth(g, 2.4, .6, 2.4);
    var basin = add(new T.TorusGeometry(.9, .09, 12, 40), M(new T.Color(hex).getHex(), { r: .35, m: .4 }), 0, top + .15, 0, g); basin.rotation.x = Math.PI / 2;
    add(new T.CylinderGeometry(.88, .88, .06, 40), M(0xdfe9e7, { r: .3 }), 0, top + .06, 0, g, true);
    var n = 90, inst = new T.InstancedMesh(new T.BoxGeometry(.11, .11, .11), M(0xffffff, { r: .5 }), n), d = new T.Object3D(), col = new T.Color();
    var RAW = ['#c9b79c', '#9fb3c8', '#d9a7a2', '#a8c3a0', '#e0c27a'];
    inst.castShadow = true; g.add(inst);
    label(g, 'LH2 · PostgreSQL ETL · scraping', '~70% less manual research', hex, .4, 1.3);
    return function (t) {
      for (var i = 0; i < n; i++) {
        var ph = (t * .22 + hash(i, 1)) % 1, a = hash(i, 2) * 6.28, r = .75 * Math.sqrt(hash(i, 3));
        d.position.set(Math.cos(a) * r * (1 - ph * .3), top + 4.2 - ph * 4.05, Math.sin(a) * r);
        d.rotation.set(t * 2 + i, t + i, 0); d.scale.setScalar(ph > .97 ? 0 : 1); d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
        col.set(ph > .8 ? hex : RAW[i % RAW.length]); inst.setColorAt(i, col);
      }
      inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true;
    };
  });

  // 02 · Contact intelligence: a constellation of media houses and their SPOCs; replies pulse home
  exhibit('crm', 'lh2', -1, .34, 'Contact intelligence CRM', '95–97% accuracy', function (g, hex) {
    var top = plinth(g, 1.8, 1.0, 1.8);
    add(new T.CylinderGeometry(.04, .04, 1.2, 8), DARK, 0, top + .6, 0, g);
    var star = new T.Group(); star.position.y = top + 2.3; g.add(star);
    var hubs = [], pts = [], hubMat = M(new T.Color(hex).getHex(), { r: .3, m: .3, e: new T.Color(hex).getHex(), ei: .25 }), satMat = M(0xf2ece2, { r: .5 });
    for (var i = 0; i < 8; i++) {
      var th = i * 2.399, y = 1 - (i + .5) / 4, rr = Math.sqrt(1 - y * y), p = new T.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr).multiplyScalar(1.05);
      add(new T.SphereGeometry(.13, 18, 14), hubMat, p.x, p.y, p.z, star); hubs.push(p);
      for (var j = 0; j < 3; j++) {
        var q = p.clone().add(new T.Vector3(hash(i, j) - .5, hash(j, i) - .5, hash(i + j, 7) - .5).normalize().multiplyScalar(.42));
        add(new T.SphereGeometry(.055, 12, 10), satMat, q.x, q.y, q.z, star); pts.push(p.x, p.y, p.z, q.x, q.y, q.z);
      }
      var nb = hubs[(i + 3) % Math.max(1, hubs.length)]; if (nb && nb !== p) pts.push(p.x, p.y, p.z, nb.x, nb.y, nb.z);
    }
    var lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    star.add(new T.LineSegments(lg, new T.LineBasicMaterial({ color: 0x8a817a, transparent: true, opacity: .55 })));
    var pulse = new T.Mesh(new T.SphereGeometry(.07, 12, 10), new T.MeshBasicMaterial({ color: 0xff7a45 })); star.add(pulse);
    label(g, 'Contact intelligence · shipped solo', '95–97% vs ~40%', hex, .7, .95);
    var seg = 0;
    return function (t) {
      star.rotation.y = t * .18;
      var ph = (t * .7) % 1; if (ph < .02) seg = Math.floor(hash(Math.floor(t * .7), 3) * (pts.length / 6));
      var o = seg * 6; pulse.position.set(lerp(pts[o + 3], pts[o], ph), lerp(pts[o + 4], pts[o + 1], ph), lerp(pts[o + 5], pts[o + 2], ph));
    };
  });

  // 02 · Research CRM: records loop through a gate; uncertain ones wait at the review desk first
  exhibit('research', 'lh2', 1, .53, 'Research-Driven CRM', 'the model never silently writes', function (g, hex) {
    var top = plinth(g, 2.8, .7, 2.2);
    var path = new T.CatmullRomCurve3([new T.Vector3(-1.1, 0, -.7), new T.Vector3(1.1, 0, -.7), new T.Vector3(1.25, 0, .55), new T.Vector3(-1.25, 0, .55)], true);
    var track = new T.Mesh(new T.TubeGeometry(path, 80, .03, 6, true), DARK); track.position.y = top + .02; g.add(track);
    [-.25, .25].forEach(function (z) { add(new T.BoxGeometry(.08, .7, .08), DARK, 0, top + .35, -.7 + z, g); });
    add(new T.BoxGeometry(.1, .08, .62), DARK, 0, top + .72, -.7, g);
    var desk = add(new T.BoxGeometry(.5, .32, .3), M(0xb48a62, { r: .6 }), 0, top + .16, 1.0, g);
    add(new T.CylinderGeometry(.09, .1, .34, 12), M(0xdc6e3d, { r: .7 }), 0, top + .5, 1.18, g); add(new T.SphereGeometry(.09, 12, 10), M(0xc79a73), 0, top + .76, 1.18, g);
    var n = 14, cubes = [], OKC = new T.Color(hex), REV = new T.Color('#f0a23a');
    for (var i = 0; i < n; i++) { var c = add(new T.BoxGeometry(.16, .16, .16), M(0xffffff, { r: .45 }), 0, 0, 0, g); cubes.push({ m: c, u: i / n, rev: i % 4 === 1 }); }
    label(g, 'Deterministic AI policy · FastAPI · JWT/RBAC', 'Uncertain → human review', hex, .38, 1.15);
    return function (t) {
      cubes.forEach(function (c) {
        var u = (c.u + t * .06) % 1, p = path.getPointAt(u), atDesk = c.rev && u > .62 && u < .82;
        c.m.position.set(p.x, top + .12 + (atDesk ? .18 : 0), p.z + (atDesk ? .25 : 0));
        c.m.material.color.copy(c.rev && u > .1 && u < .82 ? REV : OKC);
        c.m.material.emissive.copy(atDesk ? REV : new T.Color(0)); c.m.material.emissiveIntensity = atDesk ? .5 : 0;
      });
    };
  });

  // 02 · Lead qualification: 10,000 sites settle into tiers; the unknowns go to review, not made up
  exhibit('leads', 'lh2', -1, .71, 'Lead-Qualification Pipeline', '10,000 sites · 15–25 min', function (g, hex) {
    var top = plinth(g, 2.0, .55, 2.0);
    var tube = new T.Mesh(new T.CylinderGeometry(.85, .85, 2.7, 40, 1, true), new T.MeshStandardMaterial({ color: 0xeaf3f2, transparent: true, opacity: .14, roughness: .05, side: T.DoubleSide, depthWrite: false }));
    tube.position.y = top + 1.35; g.add(tube);
    add(new T.TorusGeometry(.85, .03, 8, 48), DARK, 0, top + 2.7, 0, g).rotation.x = Math.PI / 2;
    var N = mobile ? 400 : 900, pos = new Float32Array(N * 3), colr = new Float32Array(N * 3), meta = [];
    var TIERS = [[.1, .55, '#2b9e94', .16], [.6, 1.15, '#6fc3b8', .3], [1.2, 1.85, '#c9bfae', .39], [1.95, 2.4, '#f0a23a', .15]];
    var cc = new T.Color();
    for (var i = 0; i < N; i++) {
      var h = hash(i, 4), tier = h < .16 ? 0 : h < .46 ? 1 : h < .85 ? 2 : 3, a = hash(i, 5) * 6.28, r = .78 * Math.sqrt(hash(i, 6));
      meta.push([Math.cos(a) * r, Math.sin(a) * r, lerp(TIERS[tier][0], TIERS[tier][1], hash(i, 7)), hash(i, 8)]);
      cc.set(TIERS[tier][2]); colr[i * 3] = cc.r; colr[i * 3 + 1] = cc.g; colr[i * 3 + 2] = cc.b;
    }
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3)); pg.setAttribute('color', new T.BufferAttribute(colr, 3));
    var pts = new T.Points(pg, new T.PointsMaterial({ size: .06, vertexColors: true })); pts.position.y = top; g.add(pts);
    label(g, 'ICP scoring · 30 concurrent · ~70% lower LLM cost', 'A · B · C · review', hex, .35, 1.05);
    return function (t) {
      var cyc = (t % 10) / 10;
      for (var i = 0; i < N; i++) {
        var m = meta[i], u = smooth((cyc * 1.6 - m[3] * .6)); pos[i * 3] = m[0]; pos[i * 3 + 2] = m[1]; pos[i * 3 + 1] = lerp(2.65, m[2], u);
        if (cyc > .93) pos[i * 3 + 1] = lerp(m[2], 2.65, (cyc - .93) / .07);
      }
      pg.attributes.position.needsUpdate = true;
    };
  });

  // 02 · Inventory Segmentor: archive boxes classified one by one, checkpointed row by row
  exhibit('inventory', 'lh2', 1, .88, 'Inventory Segmentor', '1–2 TB, resumable', function (g, hex) {
    var top = plinth(g, 2.8, .3, 1.2);
    var frame = M(0x3a3430, { r: .6 });
    [-1.3, 1.3].forEach(function (x) { add(new T.BoxGeometry(.06, 2.7, 1.0), frame, x, top + 1.35, 0, g); });
    for (var s = 0; s <= 3; s++) add(new T.BoxGeometry(2.66, .05, 1.0), frame, 0, top + .02 + s * .88, 0, g);
    var CAT = ['#2b9e94', '#ff7a45', '#6b7fff', '#c7922f', '#d9688b', '#7cbf6a', '#8f7ae0'], boxes = [];
    for (var row = 0; row < 3; row++) for (var c = 0; c < 4; c++) {
      var b = add(new T.BoxGeometry(.5, .55, .7), M(0xd8cdbb, { r: .8 }), -.95 + c * .63, top + .32 + row * .88, 0, g);
      boxes.push({ m: b, cat: new T.Color(CAT[(row * 4 + c) % CAT.length]) });
    }
    var flag = add(new T.BoxGeometry(.04, .5, .04), DARK, 1.42, top + .5, .4, g);
    var cloth = add(new T.BoxGeometry(.3, .18, .02), M(new T.Color(hex).getHex(), { r: .6 }), 1.57, top + .66, .4, g);
    label(g, 'Files · Drive · Gmail · Git · PII flagged at intake', '1–2 TB, resumable', hex, .2, .65);
    var base = new T.Color(0xd8cdbb);
    return function (t) {
      var step = Math.floor(t * 1.6) % 16;
      boxes.forEach(function (b, i) { var on = i < step; b.m.material.color.copy(on ? b.cat : base); b.m.material.emissive.copy(i === step - 1 ? b.cat : new T.Color(0)); b.m.material.emissiveIntensity = .35; });
      var rowDone = Math.min(2, Math.floor(Math.min(step, 12) / 4)); flag.position.y = cloth.position.y - .16; cloth.position.y = top + .66 + rowDone * .88; flag.position.y = cloth.position.y - .16;
    };
  });

  // 03 · Wissen ETL: three messy streams merge into one clean block
  exhibit('wissen', 'wissen', 1, .36, 'Production ETL', '90% fewer reporting errors', function (g, hex) {
    var top = plinth(g, 2.6, .6, 2.0);
    var cube = add(new T.BoxGeometry(.8, .8, .8), M(0xf7f5f0, { r: .2, m: .1 }), .55, top + .4, 0, g);
    var face = paint(.78, .78, function (c) { c.fillStyle = INK; c.font = '400 .3px ' + SERIF; c.textAlign = 'center'; c.fillText('90%', .39, .48); }, { ppu: 400 });
    face.position.set(.55, top + .4, .405); g.add(face);
    var COLS = ['#c9b79c', '#d9a7a2', '#9fb3c8'], curves = [], flows = [];
    [[-1.2, 2.2, -.6], [-1.1, 1.6, .6], [-1.25, 2.8, .1]].forEach(function (s, i) {
      var cu = new T.CatmullRomCurve3([new T.Vector3(s[0], top + s[1], s[2]), new T.Vector3(-.5, top + s[1] * .6, s[2] * .6), new T.Vector3(.1, top + .5, s[2] * .2), new T.Vector3(.5, top + .42, 0)]);
      g.add(new T.Mesh(new T.TubeGeometry(cu, 40, .035, 8, false), M(0xcfc8bf, { r: .4, op: .9 })));
      curves.push(cu);
      for (var k = 0; k < 6; k++) { var f = add(new T.SphereGeometry(.06, 10, 8), M(new T.Color(COLS[i]).getHex(), { r: .5 }), 0, 0, 0, g); flows.push({ m: f, c: cu, o: k / 6 }); }
    });
    label(g, 'Wissen · Python · Pandas · SQL · Zoho Recruit', '90% fewer errors', hex, .4, 1.05);
    return function (t) { flows.forEach(function (f) { var u = (f.o + t * .12) % 1, p = f.c.getPointAt(u); f.m.position.copy(p); f.m.material.color.lerp(new T.Color(hex), u > .85 ? .2 : 0); }); };
  });

  // 03 · Analytics: a bar-chart sculpture with a forecast line riding above it
  exhibit('analytics', 'wissen', -1, .7, 'Analytics for leadership', 'KPIs · forecasts · A/B tests', function (g, hex) {
    var top = plinth(g, 2.6, .5, 1.4);
    var bars = [], H0 = [.6, .9, .8, 1.2, 1.1, 1.5, 1.4, 1.85];
    for (var i = 0; i < 8; i++) { var b = add(new T.BoxGeometry(.22, 1, .4), M(new T.Color(hex).lerp(new T.Color('#2b9e94'), i / 8).getHex(), { r: .4, m: .2 }), -1.05 + i * .3, top, 0, g); bars.push(b); }
    var fc = new T.CatmullRomCurve3(H0.map(function (h, i) { return new T.Vector3(-1.05 + i * .3, top + h + .45, 0); }).concat([new T.Vector3(1.4, top + 2.55, 0)]));
    g.add(new T.Mesh(new T.TubeGeometry(fc, 60, .025, 6, false), M(0xff7a45, { r: .5 })));
    var dot = add(new T.SphereGeometry(.07, 12, 10), new T.MeshBasicMaterial({ color: 0xff7a45 }), 0, 0, 0, g);
    label(g, 'Wissen · HR · Sales · Finance · TA · Power BI + RBAC', 'KPIs leadership decided on', hex, .3, .75);
    return function (t) {
      bars.forEach(function (b, i) { var h = H0[i] * (.85 + Math.sin(t * .8 + i) * .08); b.scale.y = h; b.position.y = top + h / 2; });
      dot.position.copy(fc.getPointAt((t * .1) % 1));
    };
  });

  // 04 · IIMB: a gold ribbon surface for market agility, slowly breathing
  exhibit('iimb', 'research', 1, .38, 'IIM Bangalore · research', 'market agility models', function (g, hex) {
    var top = plinth(g, 1.6, .9, 1.6);
    add(new T.CylinderGeometry(.03, .03, 1.1, 8), BRASS, 0, top + .55, 0, g);
    var geo = new T.PlaneGeometry(2.8, 1.5, 70, 30), base = geo.attributes.position.array.slice(0);
    var rib = new T.Mesh(geo, M(0xd2a256, { r: .28, m: .85, side: T.DoubleSide })); rib.position.y = top + 1.9; rib.castShadow = true; g.add(rib);
    label(g, 'Research Associate · econometric models', 'R&D vs marketing trade-offs', hex, .5, .85);
    return function (t) {
      var p = geo.attributes.position.array;
      for (var i = 0; i < p.length; i += 3) { var x = base[i], y = base[i + 1]; p[i + 2] = Math.sin(x * 2.1 + t * .9) * .28 * Math.cos(y * 1.8 - t * .4) + Math.sin(y * 3 + t) * .06; }
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); rib.rotation.y = Math.sin(t * .25) * .3;
    };
  });

  // 04 · Skills + education: a wall exhibit
  (function skillsWall() {
    var r = RI.research;
    var p = paint(9.5, 5.4, function (g) {
      g.fillStyle = r.hex; g.font = '600 .17px ' + MONO; g.fillText('TECHNICAL SKILLS', 0, .3);
      var rows = [['Programming & data', 'Python, SQL, TypeScript, Pandas, NumPy'], ['Backend & application', 'FastAPI, REST APIs, SQLAlchemy, JWT, RBAC, React, Vite'], ['Databases & architecture', 'PostgreSQL, SQLite, indexing, query optimisation, star schema'], ['Pipelines & automation', 'ETL, async Python, aiohttp, worker pools, checkpointing, retries'], ['AI & LLM systems', 'OpenAI, Anthropic (Claude), RAG, LLM classification, review gates'], ['Collection & integrations', 'Scrapy, BeautifulSoup, Selenium, Playwright, Gmail/Drive/Notion/HubSpot APIs'], ['Deployment & quality', 'Cloud, Linux, GitHub Actions, API & integration testing, PII redaction']];
      rows.forEach(function (row, i) {
        var y = .8 + i * .5; g.fillStyle = MUTED; g.font = '600 .13px ' + MONO; g.fillText(row[0].toUpperCase(), 0, y);
        g.fillStyle = INK; g.font = '500 .19px ' + SANS; g.fillText(row[1], 2.75, y);
      });
      g.fillStyle = r.hex; g.font = '600 .17px ' + MONO; g.fillText('EDUCATION · ADDITIONAL', 0, 4.55);
      g.fillStyle = INK; g.font = '400 .26px ' + SERIF; g.fillText('B.Sc. Economics & Statistics, Mount Carmel College (2021–24)  ·  NSRCEL, IIM Bangalore (2023–24)', 0, 5.0);
    });
    onLeftWall(r, .66, p, 3.6);
    var z = r.z0 - .66 * r.len, hb = new T.Mesh(new T.BoxGeometry(1, 5.5, 9.5), new T.MeshBasicMaterial({ visible: false }));
    hb.position.set(-r.w / 2 + .6, 3.6, z); hb.userData.k = 'skills'; scene.add(hb); hitList.push(hb);
    EXH.push({ k: 'skills', room: r, side: -1, pos: new T.Vector3(-r.w / 2 + .4, 0, z), wall: true, title: 'Skills, projects & education', metric: '' });
  })();

  // Exit · guestbook
  exhibit('contact', 'exit', 1, .45, 'Guestbook', 'stutisingh22@icloud.com', function (g, hex) {
    add(new T.BoxGeometry(2.2, 1.05, .9), M(0x6b5a4a, { r: .55 }), 0, .525, 0, g);
    [-1, 1].forEach(function (s) {
      var pg = paint(.62, .82, function (c) {
        c.fillStyle = '#fbf8f1'; c.fillRect(0, 0, .62, .82);
        c.fillStyle = INK; c.font = '400 .075px ' + SERIF;
        if (s < 0) { c.fillText('Guestbook', .06, .14); c.font = '400 .045px ' + SANS; c.fillStyle = MUTED; wrap(c, 'Leave a note: I read every email.', .06, .24, .5, .07); }
        else { c.font = '600 .042px ' + MONO; c.fillStyle = '#c4562a'; c.fillText('STUTISINGH22@ICLOUD.COM', .05, .14); c.font = '400 .045px ' + SANS; c.fillStyle = MUTED; wrap(c, 'github.com/stutisingh22 · Bengaluru · résumé in the rack', .05, .24, .52, .07); }
      }, { ppu: 700 });
      pg.position.set(s * .33, 1.07, 0); pg.rotation.x = -Math.PI / 2 + .12; pg.rotation.y = s * -.08; g.add(pg);
    });
    add(new T.CylinderGeometry(.015, .015, .4, 8), BRASS, .5, 1.08, .15, g).rotation.z = 1.3;
    return function () {};
  });

  // Lobby · a reception desk
  (function desk() {
    var r = RI.lobby, g = new T.Group(); g.position.set(-7.5, 0, r.z0 - 11); g.rotation.y = .55; scene.add(g);
    add(new T.BoxGeometry(4.2, 1.1, 1.0), M(0xf4efe7, { r: .6 }), 0, .55, 0, g); add(new T.BoxGeometry(4.3, .06, 1.1), BRASS, 0, 1.12, 0, g);
    var p = paint(3.6, .5, function (c, W2) { c.textAlign = 'center'; c.fillStyle = INK; c.font = '600 .14px ' + MONO; c.fillText('WELCOME · PLEASE WANDER', W2 / 2, .3); });
    p.position.set(0, .7, .51); g.add(p);
  })();

  /* ---------- tour stops ---------- */
  // each stop: where you stand, what you look at, and which page section the placard shows
  var STOPS = [
    { k: 'lobby',     title: 'Welcome',                         src: ['.ch--hero .hero'] },
    { k: 'arkandis',  title: 'Arkandis Labs',                   src: ['#arkandis .panel'] },
    { k: 'redaction', title: 'Redaction tooling',               src: ['#redaction .panel'] },
    { k: 'lh2',       title: 'LH2 Holdings',                    src: ['#lh2 .panel'] },
    { k: 'crm',       title: 'Contact intelligence CRM',        src: ['#crm .panel'] },
    { k: 'research',  title: 'Research-Driven CRM',             src: ['#research-crm .panel'] },
    { k: 'leads',     title: 'Lead qualification',              src: ['#leads .panel'] },
    { k: 'inventory', title: 'Inventory Segmentor',             src: ['#inventory .panel'] },
    { k: 'wissen',    title: 'Wissen Technology · ETL',         src: ['#wissen .panel'] },
    { k: 'analytics', title: 'Wissen · analytics',              src: ['#tower .panel'] },
    { k: 'iimb',      title: 'IIM Bangalore',                   src: ['#more .wrap > .role:nth-of-type(1)'] },
    { k: 'skills',    title: 'Skills, projects & education',    src: ['#more .wrap > .role:nth-of-type(2)', '#more .exp__foot'] },
    { k: 'contact',   title: 'Get in touch',                    src: ['#contact .contact'] }
  ];
  var byK = {}; EXH.forEach(function (e) { byK[e.k] = e; });
  STOPS.forEach(function (s) {
    if (s.k === 'lobby') { s.room = RI.lobby; s.cam = new T.Vector3(0, 1.7, -3.2); s.tgt = new T.Vector3(0, 4.3, RI.lobby.z1); return; }
    var e = byK[s.k]; s.room = e.room;
    if (e.wall) { s.cam = new T.Vector3(1.2, 1.75, e.pos.z + 1.5); s.tgt = new T.Vector3(e.pos.x, 3.4, e.pos.z); return; }
    if (s.k === 'contact') { s.cam = new T.Vector3(-1.5, 1.75, e.pos.z + 6); s.tgt = new T.Vector3(e.pos.x * .5, 1.6, e.room.z1); return; }
    s.cam = new T.Vector3(e.pos.x - e.side * 6.2, 1.72, e.pos.z + 2.6);
    s.tgt = new T.Vector3(e.pos.x, 1.95, e.pos.z);
  });
  var stopIndex = {}; STOPS.forEach(function (s, i) { stopIndex[s.k] = i; });

  /* ---------- UI ---------- */
  var ui = document.createElement('div');
  ui.innerHTML =
    '<header class="mtop">' +
      '<a class="mtop__id" href="./" aria-label="Stuti Singh, back to the portfolio"><b>Stuti Singh</b><span class="mono">AI Engineer / Data Engineer</span></a>' +
      '<nav class="mtop__nav" aria-label="Museum">' +
        '<button type="button" class="mbtn" data-m="plan">Floor plan</button>' +
        '<a class="mbtn" href="Stuti_Singh_AI_Data_Engineer.pdf" target="_blank" rel="noopener">Résumé (PDF)</a>' +
        '<a class="mbtn" href="?mode=page">Read as a page</a>' +
        '<a class="mbtn mbtn--hot" href="?mode=game">Night drive ▶</a>' +
      '</nav>' +
    '</header>' +
    '<section class="mcard" data-tone="dark" aria-live="polite">' +
      '<header class="mcard__head"><p class="mono" id="m-where"></p><button type="button" class="mcard__min" data-m="hide" aria-label="Hide the placard">–</button></header>' +
      '<div class="mcard__body"></div>' +
      '<footer class="mcard__foot"><button type="button" class="mbtn" data-m="prev">← <span id="m-prev"></span></button><span class="mono" id="m-count"></span><button type="button" class="mbtn mbtn--next" data-m="next"><span id="m-next"></span> →</button></footer>' +
    '</section>' +
    '<button type="button" class="mshow" data-m="show" hidden>Show placard</button>' +
    '<p class="mhint mono">← → or scroll to walk · click a sculpture to visit · drag to look around</p>' +
    '<section class="mplan" hidden data-tone="dark" aria-label="Floor plan"><header><b>Floor plan</b><button type="button" class="mcard__min" data-m="plan-close" aria-label="Close">×</button></header><div class="mplan__list"></div></section>' +
    '<div class="mtag" aria-hidden="true"></div>';
  while (ui.firstChild) document.body.appendChild(ui.firstChild);
  var cardEl = $('.mcard'), cardBody = $('.mcard__body'), planEl = $('.mplan'), tagEl = $('.mtag'), showEl = $('.mshow');

  function renderPlan() {
    var out = '';
    ROOMS.forEach(function (r) {
      var inRoom = STOPS.map(function (s, i) { return [s, i]; }).filter(function (p) { return p[0].room === r; });
      if (!inRoom.length) return;
      out += '<div class="mplan__room"><p class="mono" style="color:' + r.hex + '">' + (r.num ? 'Gallery ' + r.num : r.name) + '</p>' + (r.num ? '<b>' + esc(r.name) + '</b>' : '') + '<ul>' +
        inRoom.map(function (p) { return '<li><button type="button" data-stop="' + p[1] + '" class="' + (p[1] === cur ? 'here' : '') + (seen[p[1]] ? ' seen' : '') + '">' + esc(p[0].title) + '</button></li>'; }).join('') + '</ul></div>';
    });
    $('.mplan__list').innerHTML = out;
  }

  // placard: the real page sections move in, and go back when you leave
  var moved = [];
  function fillCard(i) {
    moved.forEach(function (m) { m.ph.parentNode.insertBefore(m.el, m.ph); m.ph.remove(); }); moved = [];
    STOPS[i].src.forEach(function (sel) {
      var el = document.querySelector(sel); if (!el) return;
      var ph = document.createComment('museum'); el.parentNode.insertBefore(ph, el); cardBody.appendChild(el); moved.push({ el: el, ph: ph });
    });
    var s = STOPS[i], r = s.room;
    $('#m-where').innerHTML = '<i style="background:' + r.hex + '"></i>' + esc(r.num ? 'Gallery ' + r.num + ' · ' + r.name : r.name);
    $('#m-count').textContent = (i + 1) + ' / ' + STOPS.length;
    $('#m-prev').textContent = i > 0 ? STOPS[i - 1].title : '';
    $('#m-next').textContent = i < STOPS.length - 1 ? (i === 0 ? 'Begin the tour' : STOPS[i + 1].title) : '';
    $('[data-m="prev"]').disabled = i === 0; $('[data-m="next"]').disabled = i === STOPS.length - 1;
    cardBody.scrollTop = 0;
    cardEl.classList.remove('swap'); void cardEl.offsetWidth; cardEl.classList.add('swap');
  }

  /* ---------- moving through the building ---------- */
  var cur = 0, seen = {}, travel = null, camP = STOPS[0].cam.clone(), camT = STOPS[0].tgt.clone();
  var yawOff = 0, pitchOff = 0, V = function (x, y, z) { return new T.Vector3(x, y, z); };
  function roomOf(z) { for (var i = 0; i < ROOMS.length; i++) if (z <= ROOMS[i].z0 && z >= ROOMS[i].z1) return ROOMS[i]; return ROOMS[ROOMS.length - 1]; }
  function route(from, to) {
    var pts = [from.clone()], ra = roomOf(from.z).i, rb = roomOf(to.z).i;
    if (ra === rb) { if (from.distanceTo(to) > 7) pts.push(V((from.x + to.x) * .25, 1.72, (from.z + to.z) / 2)); }
    else if (ra < rb) { for (var d = ra; d < rb; d++) { pts.push(V(0, 1.72, DOORS[d] + 1.6)); pts.push(V(0, 1.72, DOORS[d] - 1.6)); } }
    else { for (var d2 = ra - 1; d2 >= rb; d2--) { pts.push(V(0, 1.72, DOORS[d2] - 1.6)); pts.push(V(0, 1.72, DOORS[d2] + 1.6)); } }
    pts.push(to.clone());
    return pts.length > 2 ? new T.CatmullRomCurve3(pts, false, 'centripetal') : new T.LineCurve3(pts[0], pts[1]);
  }
  function startTravel(toPos, toTgt) {
    var curve = route(camP, toPos), len = curve.getLength();
    travel = { curve: curve, t0: performance.now(), dur: reduce ? 1 : clamp(len / 6.5, .9, 5.5) * 1000, from: camT.clone(), to: toTgt.clone(), len: len };
  }
  function goTo(i) {
    i = clamp(i, 0, STOPS.length - 1);
    if (i === cur && !travel && cur !== 0) return;
    cur = i; seen[i] = true;
    startTravel(STOPS[i].cam, STOPS[i].tgt);
    fillCard(i); renderPlan(); showCard(true);
    try { history.replaceState(null, '', i ? '#' + STOPS[i].k : location.pathname + location.search); } catch (e) {}
  }
  function wander(point) {   // click on the floor: walk there, keep looking the same way
    var dir = camT.clone().sub(camP).setY(0).normalize(), to = V(point.x, 1.72, point.z);
    startTravel(to, to.clone().add(dir.multiplyScalar(6)).setY(1.9));
  }

  /* ---------- input ---------- */
  function onUI(t) { return !!(t && t.closest && t.closest('.mtop, .mcard, .mplan, .mshow, dialog, a, button, input, textarea')); }
  var drag = null, moved2 = 0;
  window.addEventListener('pointerdown', function (e) { if (onUI(e.target) || e.button > 0) return; drag = { x: e.clientX, y: e.clientY, yaw: yawOff, pitch: pitchOff }; moved2 = 0; });
  window.addEventListener('pointermove', function (e) {
    if (drag) {
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved2 = Math.max(moved2, Math.abs(dx) + Math.abs(dy));
      yawOff = clamp(drag.yaw + dx * .004, -1.4, 1.4); pitchOff = clamp(drag.pitch + dy * .003, -.5, .5);
      html.classList.toggle('mdrag', moved2 > 6);
    } else if (e.pointerType !== 'touch') {
      var k = onUI(e.target) ? null : pick(e);
      html.classList.toggle('mpoke', !!k);
      if (k) { tagEl.textContent = (byK[k] ? byK[k].title : '') + ' · visit'; tagEl.style.transform = 'translate(' + (e.clientX + 14) + 'px,' + (e.clientY + 14) + 'px)'; tagEl.classList.add('on'); }
      else tagEl.classList.remove('on');
    }
  }, { passive: true });
  window.addEventListener('pointerup', function (e) {
    if (!drag) return; var wasDrag = moved2 > 6; drag = null; html.classList.remove('mdrag');
    if (wasDrag || onUI(e.target)) return;
    var k = pick(e);
    if (k && stopIndex[k] != null) { goTo(stopIndex[k]); return; }
    if (ray.ray.intersectPlane(groundPlane, gp)) { var r = roomOf(gp.z); if (Math.abs(gp.x) < r.w / 2 - 1.2 && gp.z < r.z0 - 1 && gp.z > r.z1 + 1) wander(gp); }
  });
  var ray = new T.Raycaster(), ndc = new T.Vector2(), groundPlane = new T.Plane(new T.Vector3(0, 1, 0), 0), gp = new T.Vector3();
  function pick(e) { ndc.set(e.clientX / SW * 2 - 1, -(e.clientY / SH) * 2 + 1); ray.setFromCamera(ndc, camera); var h = ray.intersectObjects(hitList, false)[0]; return h ? h.object.userData.k : null; }
  var wheelAcc = 0, wheelLock = 0;
  window.addEventListener('wheel', function (e) {
    if (e.target.closest && e.target.closest('.mcard__body, .mplan, dialog')) return;
    e.preventDefault();
    var now = performance.now(); wheelAcc += e.deltaY;
    if (now > wheelLock && Math.abs(wheelAcc) > 40) { goTo(cur + (wheelAcc > 0 ? 1 : -1)); wheelLock = now + 900; wheelAcc = 0; }
    if (now > wheelLock + 400) wheelAcc *= .5;
  }, { passive: false });
  window.addEventListener('keydown', function (e) {
    if (document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '')) return;
    var c = e.code;
    if (c === 'ArrowRight' || c === 'ArrowDown' || c === 'PageDown' || (c === 'Space' && !e.shiftKey)) { e.preventDefault(); goTo(cur + 1); }
    else if (c === 'ArrowLeft' || c === 'ArrowUp' || c === 'PageUp' || (c === 'Space' && e.shiftKey)) { e.preventDefault(); goTo(cur - 1); }
    else if (c === 'Home') goTo(0); else if (c === 'End') goTo(STOPS.length - 1);
    else if (c === 'Escape') planEl.hidden = true; else if (c === 'KeyM') planEl.hidden = !planEl.hidden;
  });
  // touch: swipe left/right on the scene to walk
  var tStart = null;
  window.addEventListener('touchstart', function (e) { if (onUI(e.target)) return; var t = e.changedTouches[0]; tStart = { x: t.clientX, y: t.clientY, at: performance.now() }; }, { passive: true });
  window.addEventListener('touchend', function (e) {
    if (!tStart) return; var t = e.changedTouches[0], dx = t.clientX - tStart.x, dy = t.clientY - tStart.y; var quick = performance.now() - tStart.at < 600; tStart = null;
    if (quick && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) { drag = null; yawOff = 0; goTo(cur + (dx < 0 ? 1 : -1)); }
  });
  function showCard(on) { cardEl.hidden = !on; showEl.hidden = on; html.classList.toggle('mcard-off', !on); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-m], [data-stop]'); if (!b) return;
    if (b.dataset.stop != null) { planEl.hidden = true; goTo(+b.dataset.stop); return; }
    var m = b.dataset.m;
    if (m === 'next') goTo(cur + 1); else if (m === 'prev') goTo(cur - 1);
    else if (m === 'plan') { renderPlan(); planEl.hidden = !planEl.hidden; } else if (m === 'plan-close') planEl.hidden = true;
    else if (m === 'hide') showCard(false); else if (m === 'show') showCard(true);
  });
  // links inside a placard that point at page sections (e.g. "Get in touch") stay in the museum
  cardBody.addEventListener('click', function (e) { var a = e.target.closest('a[href^="#"]'); if (!a) return; var k = a.getAttribute('href').slice(1); var map = { contact: 'contact', arkandis: 'arkandis', more: 'skills' }; if (map[k] != null) { e.preventDefault(); goTo(stopIndex[map[k]]); } });

  /* ---------- frame ---------- */
  var SW = 0, SH = 0;   // screen size (H is the ceiling height)
  function resize() {
    SW = window.innerWidth; SH = window.innerHeight; mobile = SW < 960;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2)); renderer.setSize(SW, SH, false);
    camera.aspect = SW / SH; camera.fov = mobile ? 64 : 50; camera.updateProjectionMatrix();
  }
  var last = performance.now(), vTmp = new T.Vector3(), vLook = new T.Vector3(), vAhead = new T.Vector3(), viewOff = 0;
  function frame(now) {
    var dt = clamp((now - last) / 1000, 0, .05); last = now;
    var t = reduce ? 0 : now / 1000;
    if (travel) {
      var u = clamp((now - travel.t0) / travel.dur, 0, 1), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      if (reduce) e = 1;
      camP.copy(travel.curve.getPointAt(e));
      if (!reduce) camP.y = 1.72 + Math.abs(Math.sin(e * travel.len * 1.15)) * .035 * Math.sin(u * Math.PI);   // a gentle step
      vAhead.copy(travel.curve.getTangentAt(Math.min(1, e + .02))).setY(0).normalize().multiplyScalar(6).add(camP); vAhead.y = 1.8;
      var wIn = smooth(u / .22), wOut = smooth((u - .5) / .5);
      vLook.copy(travel.from).lerp(vAhead, wIn).lerp(travel.to, wOut); camT.copy(vLook);
      yawOff *= .9; pitchOff *= .9;
      if (u >= 1) { travel = null; camT.copy(vLook); }
    }
    camera.position.copy(camP); camera.lookAt(camT);
    camera.rotateY(-yawOff); camera.rotateX(-pitchOff);
    // keep the subject clear of the placard
    var cardOn = !cardEl.hidden, want = cardOn ? (mobile ? .2 : .17) : 0; viewOff = lerp(viewOff, want, 1 - Math.pow(.002, dt));
    if (mobile) camera.setViewOffset(SW, SH, 0, SH * viewOff, SW, SH); else camera.setViewOffset(SW, SH, -SW * viewOff, 0, SW, SH);
    // light follows you: sun shadows around the camera, the spotlight on the current exhibit
    sun.position.set(camP.x - 12, 26, camP.z + 10); sun.target.position.set(camP.x, 0, camP.z - 8);
    var ex = byK[STOPS[cur].k];
    if (ex && !ex.wall) { vTmp.set(ex.pos.x - ex.side * 1.2, H - .6, ex.pos.z + 1.6); spot.position.lerp(vTmp, 1 - Math.pow(.01, dt)); spot.target.position.lerp(ex.pos.clone().setY(1.6), 1 - Math.pow(.01, dt)); spot.intensity = lerp(spot.intensity, 1.7, .05); }
    else spot.intensity = lerp(spot.intensity, 0, .08);
    tickers.forEach(function (f) { f(t); });
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', function () { clearTimeout(resize.t); resize.t = setTimeout(resize, 120); });
  resize();

  // start: deep links (#leads, etc.) open that exhibit, otherwise the lobby
  var start = location.hash && stopIndex[location.hash.slice(1)] != null ? stopIndex[location.hash.slice(1)] : 0;
  seen[0] = true; fillCard(0); renderPlan();
  if (start) { camP.copy(STOPS[start].cam); camT.copy(STOPS[start].tgt); cur = start; seen[start] = true; fillCard(start); renderPlan(); }
  requestAnimationFrame(frame);
  window.__museum = { goTo: goTo, stops: STOPS, state: function () { return { cur: cur, travelling: !!travel, cam: camP.toArray() }; } };
})();
