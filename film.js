/* Stuti Singh — the film. A single full-screen WebGL canvas behind the stage (desktop only).
   Each scene is a "shot": a painting framed by a moving camera, or a ground (night, sky blue,
   parchment). Between shots, a shader transition: a halftone screen spreading on a cloud-shaped
   front, a dithered crossfade, or a displaced seam. Grain, paper and vignette sit over everything.
   site.js owns the timeline (window.__stage); this file only draws it. Raw WebGL1, no libraries. */
(function () {
  'use strict';
  var S = window.__stage; if (!S) return;
  var canvas = document.createElement('canvas'); canvas.className = 'film'; canvas.setAttribute('aria-hidden', 'true');
  var gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) return;
  document.body.insertBefore(canvas, document.body.firstChild);

  var VS = 'attribute vec2 p; varying vec2 vUv; void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.0,1.0); }';
  var FS = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform sampler2D uA, uB;',
    'uniform vec2 uRes, uMouse;',
    'uniform float uT, uTime, uAspA, uAspB, uDot;',
    'uniform int uMode, uLookA, uLookB;',
    'uniform vec4 uCamA, uCamB;',
    // noise, fbm and an ordered-dither matrix
    'float h21(vec2 p){ p = fract(p*vec2(233.34, 851.73)); p += dot(p, p+23.45); return fract(p.x*p.y); }',
    'float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
    '  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }',
    'float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*vn(p); p=p*2.07+11.3; a*=0.5; } return v/0.9375; }',
    'float b2(vec2 a){ a=floor(a); return fract(a.x*0.5 + a.y*a.y*0.75); }',
    'float b4(vec2 a){ return b2(0.5*a)*0.25 + b2(a); }',
    // frame a painting with a camera: centre (top-left uv), zoom, rotation; cover-fit to the screen
    'vec2 frameIn(vec2 uv, vec4 cam, float asp, float scr){',
    '  vec2 p = uv-0.5; p.x *= scr;',
    '  float c=cos(cam.w), s=sin(cam.w); p = vec2(c*p.x - s*p.y, s*p.x + c*p.y);',
    '  p /= cam.z; p += uMouse*vec2(0.012,0.008);',
    '  vec2 size = scr > asp ? vec2(scr, scr/asp) : vec2(asp, 1.0);',
    '  return vec2(cam.x + p.x/size.x, 1.0 - (cam.y - p.y/size.y)); }',
    'vec2 frame(vec2 uv, vec4 cam, float asp){ return frameIn(uv, cam, asp, uRes.x/uRes.y); }',
    'float lum(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }',
    // a halftone screen of the picture: dots sized by brightness
    'float screenDot(vec2 frag, float L, float cell){ vec2 g = floor(frag/cell); vec2 cc=(g+0.5)*cell; float d=length(frag-cc)/(cell*0.72); return 1.0-smoothstep(L*1.45-0.16, L*1.45+0.05, d); }',
    // the looks: 0 painting, 1 night, 2 blue print of a chart, 3 parchment (with a sepia print), 4 sky with the fresco on the left
    'vec3 look(sampler2D t, vec2 uv, int lk, vec4 cam, float asp){',
    '  vec3 night = vec3(0.043,0.039,0.035);',
    '  if (lk == 1) return night;',
    '  if (lk == 5) { vec3 paper=vec3(0.949,0.929,0.878); return paper*(0.985 + fbm(uv*vec2(uRes.x/uRes.y,1.0)*9.0)*0.03); }',
    '  vec2 q = lk == 4 ? frameIn(vec2(uv.x/0.5, uv.y), cam, asp, (uRes.x*0.5)/uRes.y) : frame(uv, cam, asp);',
    '  vec3 img = texture2D(t, clamp(q, 0.001, 0.999)).rgb;',
    '  if (lk == 0) { img = pow(img, vec3(1.04)); return img; }',
    '  if (lk == 2) { vec3 deep=vec3(0.04,0.19,0.37), lite=vec3(0.42,0.6,0.82);',
    '    float d = screenDot(gl_FragCoord.xy, lum(img), uDot); return mix(deep, mix(deep, lite, 0.55), d*0.75 + lum(img)*0.12); }',
    '  if (lk == 3) { vec3 paper=vec3(0.949,0.929,0.878); float f = fbm(uv*vec2(uRes.x/uRes.y,1.0)*9.0);',
    '    paper *= 0.985 + f*0.03;',
    '    float m = smoothstep(0.42, 0.62, uv.x);',
    '    float d = screenDot(gl_FragCoord.xy, 1.0-lum(img), uDot*0.9);',
    '    vec3 ink = vec3(0.36,0.27,0.15); return mix(paper, ink, d*m*0.22); }',
    '  vec3 top=vec3(0.11,0.45,0.72), bot=vec3(0.05,0.23,0.41); vec3 sky = mix(bot, top, smoothstep(0.0,1.0,uv.y*0.8+0.2));',
    '  float edge = 0.47 + (fbm(uv*4.0+uTime*0.03)-0.5)*0.08;',
    '  float m = 1.0 - smoothstep(edge-0.06, edge+0.02, uv.x);',
    '  float d = screenDot(gl_FragCoord.xy, lum(img)*0.9+0.1, uDot);',
    '  float soft = smoothstep(edge-0.06, edge-0.18, uv.x);',
    '  vec3 fresco = mix(img*d, img, soft);',
    '  return mix(sky, fresco, m); }',
    'void main(){',
    '  vec2 uv = vUv;',
    '  vec3 A = look(uA, uv, uLookA, uCamA, uAspA);',
    '  vec3 col = A;',
    '  if (uT > 0.0005) {',
    '    float t = uT;',
    '    if (uMode == 0) {',   // a halftone screen spreads across on a cloud-shaped front
    '      vec3 B = look(uB, uv, uLookB, uCamB, uAspB);',
    '      float front = fbm(uv*2.6 + vec2(uTime*0.03, 0.0));',
    '      float cov = clamp(t*1.7 - 0.35 + (front-0.5)*0.6, 0.0, 1.0);',
    '      vec2 g = floor(gl_FragCoord.xy/uDot); vec2 cc=(g+0.5)*uDot; float d=length(gl_FragCoord.xy-cc)/(uDot*0.72);',
    '      float m = 1.0 - smoothstep(cov*1.6-0.2, cov*1.6+0.05, d);',
    '      col = mix(A, B, m);',
    '    } else if (uMode == 1) {',   // a dithered crossfade, posterised in the middle
    '      vec3 B = look(uB, uv, uLookB, uCamB, uAspB);',
    '      float th = b4(gl_FragCoord.xy*0.5);',
    '      float n = fbm(uv*3.0)*0.25;',
    '      float m = step(th, t*1.25 - 0.12 + n - 0.12);',
    '      col = mix(A, B, m);',
    '      float lv = mix(28.0, 4.0, sin(t*3.14159));',
    '      vec3 post = floor(col*lv + b4(gl_FragCoord.xy))/lv;',
    '      col = mix(col, post, sin(t*3.14159)*0.85);',
    '    } else {',   // a seam travels across; both pictures slide along it
    '      float seam = 1.08 - t*1.2 + (fbm(vec2(uv.y*3.0, uTime*0.05))-0.5)*0.18;',
    '      float k = smoothstep(seam-0.015, seam+0.015, uv.x);',
    '      float pull = (1.0 - abs(uv.x - seam)*4.0); pull = clamp(pull, 0.0, 1.0)*0.04*sin(t*3.14159);',
    '      vec3 A2 = look(uA, uv + vec2(pull,0.0), uLookA, uCamA, uAspA);',
    '      vec3 B = look(uB, uv - vec2(pull,0.0), uLookB, uCamB, uAspB);',
    '      col = mix(A2, B, k);',
    '      col += vec3(1.0,0.86,0.6) * (1.0 - smoothstep(0.0, 0.012, abs(uv.x - seam))) * 0.35 * sin(t*3.14159);',
    '    }',
    '  }',
    // grain and a soft vignette over every shot
    '  float gr = h21(gl_FragCoord.xy + fract(uTime*7.0)*137.0) - 0.5;',
    '  col += gr*0.055;',
    '  vec2 v = uv-0.5; col *= 1.0 - dot(v,v)*0.38;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; }
  var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { canvas.remove(); return; }
  var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['uA', 'uB', 'uRes', 'uMouse', 'uT', 'uTime', 'uAspA', 'uAspB', 'uDot', 'uMode', 'uLookA', 'uLookB', 'uCamA', 'uCamB'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  gl.uniform1i(U.uA, 0); gl.uniform1i(U.uB, 1);

  /* ---------- textures ---------- */
  var blank = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, blank); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([11, 10, 9]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  var TEX = {};
  function load(name) {
    if (TEX[name]) return TEX[name];
    var rec = { tex: blank, asp: 1, ready: false }; TEX[name] = rec;
    var img = new Image(); img.decoding = 'async';
    img.onload = function () {
      var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      rec.tex = t; rec.asp = img.naturalWidth / img.naturalHeight; rec.ready = true;
    };
    img.src = 'sky/' + name + '.jpg';
    return rec;
  }

  /* ---------- the shots: one per scene, in the order of the page ----------
     look: 0 painting, 1 night, 2 blue print, 3 parchment, 4 sky + fresco.
     cam: [x, y, zoom, rotation] at the start and end of the scene (x, y = where the camera looks, 0..1 of the image). */
  function shotFor(el) {
    var c = el.classList, id = el.id;
    if (c.contains('hero')) return { img: 'astronomer', look: 0, cam: [[0.6, 0.42, 1.0, 0], [0.4, 0.5, 1.55, -0.02]], into: 0 };
    if (c.contains('night')) return { look: 1, into: 0 };
    if (c.contains('chart')) return { img: 'boreale', look: 0, cam: [[0.66, 0.42, 1.9, 0.08], [0.6, 0.5, 1.05, -0.04]], into: 2 };
    if (id === 'crm') return { img: 'arateum', look: 2, cam: [[0.4, 0.45, 1.3, 0], [0.6, 0.55, 1.5, 0.03]], into: 2 };
    if (id === 'policy') return { img: 'copernicani', look: 2, cam: [[0.5, 0.5, 1.6, 0], [0.5, 0.5, 1.2, 0.05]], into: 2 };
    if (id === 'inventory') return { img: 'boreale', look: 2, cam: [[0.3, 0.6, 1.4, 0], [0.45, 0.45, 1.7, -0.03]], into: 2 };
    if (c.contains('case--paper')) return { look: 5, into: 1 };
    if (c.contains('record')) return { img: 'copernicani', look: 3, cam: [[0.35, 0.5, 1.15, 0], [0.42, 0.5, 1.3, 0.02]], into: 1 };
    if (c.contains('instruments')) return { look: 1, into: 1 };
    if (c.contains('signal')) return { img: 'plato', look: 4, cam: [[0.5, 0.5, 1.0, 0], [0.5, 0.46, 1.1, 0]], into: 0 };
    return { look: 1, into: 0 };   // black case scenes
  }
  var shots = S.scenes.map(function (s) { var sh = shotFor(s.el); if (sh.img) sh.rec = load(sh.img); return sh; });

  /* ---------- drawing ---------- */
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  function size() { W = innerWidth; H = innerHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); gl.viewport(0, 0, canvas.width, canvas.height); }
  addEventListener('resize', size); size();
  var mouse = [0, 0], ms = [0, 0];
  addEventListener('pointermove', function (e) { mouse[0] = e.clientX / W - 0.5; mouse[1] = 0.5 - e.clientY / H; }, { passive: true });
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function cam(shot, p) {
    if (!shot.cam) return [0.5, 0.5, 1, 0];
    var a = shot.cam[0], b = shot.cam[1], e = ease(Math.max(0, Math.min(1, p)));
    return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e, a[3] + (b[3] - a[3]) * e];
  }
  function bind(unit, shot) { gl.activeTexture(unit ? gl.TEXTURE1 : gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shot.rec ? shot.rec.tex : blank); }
  function draw(now) {
    var y = window.scrollY, sc = S.scenes, i = 0;
    for (var k = 0; k < sc.length; k++) if (y >= sc[k].start) i = k;
    // the transition is centred on the boundary between scenes, like the text crossfade
    var T = S.T(), cur = sc[i], local = y - cur.start, A = shots[i], B = A, t = 0, pA = Math.max(0, Math.min(1, local / cur.dur)), pB = 0;
    if (i > 0 && local < T * .5) { A = shots[i - 1]; B = shots[i]; t = .5 + local / T; pA = 1; pB = 0; }
    else if (i < sc.length - 1 && local > cur.dur - T * .5) { B = shots[i + 1]; t = (local - (cur.dur - T * .5)) / T; pB = 0; }
    t = Math.max(0, Math.min(1, t));
    ms[0] += (mouse[0] - ms[0]) * 0.05; ms[1] += (mouse[1] - ms[1]) * 0.05;
    bind(0, A); bind(1, B);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uMouse, ms[0], ms[1]);
    gl.uniform1f(U.uTime, now / 1000);
    gl.uniform1f(U.uT, ease(t));
    gl.uniform1i(U.uMode, B.into);
    gl.uniform1f(U.uDot, 7.0 * dpr);
    gl.uniform1i(U.uLookA, A.rec && !A.rec.ready ? 1 : A.look); gl.uniform1i(U.uLookB, B.rec && !B.rec.ready ? 1 : B.look);
    gl.uniform1f(U.uAspA, A.rec ? A.rec.asp : 1); gl.uniform1f(U.uAspB, B.rec ? B.rec.asp : 1);
    var cA = cam(A, pA), cB = cam(B, pB);
    gl.uniform4f(U.uCamA, cA[0], cA[1], cA[2], cA[3]); gl.uniform4f(U.uCamB, cB[0], cB[1], cB[2], cB[3]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(draw);
  }
  document.documentElement.classList.add('gl');
  requestAnimationFrame(draw);
})();
