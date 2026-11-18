import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.querySelector("#world");
if (reduce || !canvas) {
  document.body.classList.remove("play");
} else {
  boot().catch(() => document.body.classList.remove("play"));
}

async function boot() {
  const districts = [...document.querySelectorAll(".city-stops a")].map((link, index) => ({
    id: link.getAttribute("href").slice(1),
    name: link.dataset.place || link.textContent,
    label: link.textContent.trim(),
    z: -index * 18,
  }));
  if (!districts.length) throw new Error("no districts");

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x140e0a, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x140e0a, 10, 46);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 80);

  scene.add(new THREE.HemisphereLight(0xf0d7a8, 0x2a1a12, 0.55));
  const sun = new THREE.DirectionalLight(0xffe0b0, 1.15);
  sun.position.set(-8, 14, 10);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x3a2a1c, 0.35));

  const marble = new THREE.MeshStandardMaterial({ color: 0xe4d3b4, roughness: 0.62, metalness: 0.04 });
  const ochre = new THREE.MeshStandardMaterial({ color: 0xa56a3c, roughness: 0.84, metalness: 0.02 });
  const clay = new THREE.MeshStandardMaterial({ color: 0x7c3d32, roughness: 0.9 });
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 0.92 });
  const yard = new THREE.MeshStandardMaterial({ color: 0x1a140f, roughness: 1 });

  const endZ = districts.at(-1).z - 8;
  const yardMesh = new THREE.Mesh(new THREE.PlaneGeometry(28, 30 - endZ), yard);
  yardMesh.rotation.x = -Math.PI / 2;
  yardMesh.position.z = endZ / 2;
  scene.add(yardMesh);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 30 - endZ), pathMat);
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.02;
  road.position.z = endZ / 2;
  scene.add(road);

  const shaft = new THREE.CylinderGeometry(0.28, 0.34, 3.1, 10);
  const capital = new THREE.CylinderGeometry(0.46, 0.3, 0.28, 10);
  const columns = new THREE.InstancedMesh(shaft, marble, 80);
  const caps = new THREE.InstancedMesh(capital, marble, 80);
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let z = 14; z > endZ; z -= 6) {
    for (const x of [-4.7, 4.7]) {
      if (n >= 80) break;
      dummy.position.set(x, 1.55, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      columns.setMatrixAt(n, dummy.matrix);
      dummy.position.set(x, 3.2, z);
      dummy.updateMatrix();
      caps.setMatrixAt(n, dummy.matrix);
      n += 1;
    }
  }
  columns.count = n;
  caps.count = n;
  scene.add(columns, caps);

  const box = new THREE.BoxGeometry(1, 1, 1);
  for (let z = 10; z > endZ; z -= 9) {
    for (const side of [-1, 1]) {
      const h = 3.2 + ((Math.abs(z) / 9) % 3);
      const block = new THREE.Mesh(box, Math.abs(z) % 18 < 9 ? ochre : clay);
      block.scale.set(3.2, h, 4.4);
      block.position.set(side * 8.2, h / 2, z);
      scene.add(block);
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xffc56a, emissive: 0xffb45a, emissiveIntensity: 1.4, roughness: 1 }),
      );
      glow.position.set(side * 6.5, 1.6, z);
      glow.lookAt(0, 1.6, z);
      scene.add(glow);
    }
  }

  const plates = {
    gate: "art/rome-atrium.png",
    practice: "art/rome-peristyle.png",
    path: "art/rome-stoa.png",
    mask: "art/rome-pompeii.png",
    report: "art/rome-pompeii.png",
    redactor: "art/rome-atrium.png",
    nivio: "art/rome-peristyle.png",
    score: "art/rome-stoa.png",
    partnerships: "art/rome-peristyle.png",
    arkandis: "art/rome-basilica.png",
    archive: "art/rome-basilica.png",
  };
  const loader = new THREE.TextureLoader();
  const archGeo = new THREE.TorusGeometry(3.15, 0.22, 12, 32, Math.PI);
  districts.forEach((district) => {
    const arch = new THREE.Mesh(archGeo, marble);
    arch.position.set(0, 0.05, district.z);
    scene.add(arch);
    const tex = loader.load(plates[district.id] || plates.gate);
    tex.colorSpace = THREE.SRGBColorSpace;
    const painting = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 3.15),
      new THREE.MeshBasicMaterial({ map: tex }),
    );
    painting.position.set(0, 1.7, district.z - 0.35);
    scene.add(painting);
    const lamp = new THREE.PointLight(0xffb45a, 2.4, 10, 2);
    lamp.position.set(0, 3.2, district.z + 1.2);
    scene.add(lamp);
    const name = label(district.label);
    name.position.set(0, 4.55, district.z);
    scene.add(name);
    district.arch = arch;
  });

  const player = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffb45a, emissiveIntensity: 0.8, roughness: 0.3 }),
  );
  player.position.set(0, 0.35, 8);
  scene.add(player);
  const halo = new THREE.PointLight(0xffd59a, 0.9, 5, 2);
  player.add(halo);

  const keys = new Set();
  let x = 0;
  let z = 10;
  let aimX = 0;
  let aimZ = 10;
  let openId = "";
  let pending = -1;

  const hud = document.querySelector("#hud");
  const place = document.querySelector("#hud-place");
  const enterBtn = document.querySelector("#enter-gate");
  const leaveBtn = document.querySelector("#leave-gate");

  function nearest() {
    let best = districts[0];
    let dist = Infinity;
    for (const district of districts) {
      const ahead = z - district.z;
      if (ahead < -4) continue;
      if (ahead < dist) {
        dist = ahead;
        best = district;
      }
    }
    return { district: best, dist: Math.abs(z - best.z) };
  }

  function open(id) {
    if (openId === id) return;
    openId = id;
    document.body.classList.add("inside");
    for (const el of document.querySelectorAll(".is-open")) el.classList.remove("is-open");
    const room = document.getElementById(id);
    if (room) {
      room.classList.add("is-open");
      room.scrollTop = 0;
    }
    leaveBtn.hidden = false;
    enterBtn.hidden = true;
    window.dispatchEvent(new CustomEvent("city-enter", { detail: { id } }));
  }

  function close() {
    openId = "";
    document.body.classList.remove("inside");
    for (const el of document.querySelectorAll(".is-open")) el.classList.remove("is-open");
    leaveBtn.hidden = true;
  }

  function syncMap(index, t) {
    const route = document.querySelector("#route");
    const token = document.querySelector("#city-token");
    const caption = document.querySelector("#city-place");
    const links = [...document.querySelectorAll(".city-stops a")];
    if (route && token) {
      const point = route.getPointAtLength(Math.min(1, Math.max(0, t)) * route.getTotalLength());
      token.setAttribute("cx", String(point.x));
      token.setAttribute("cy", String(point.y));
    }
    links.forEach((link, i) => {
      if (i === index) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (caption) caption.textContent = districts[index].name;
    if (place) place.textContent = districts[index].name;
    const list = document.querySelector(".city-stops");
    const current = links[index];
    if (list && current && syncMap.at !== index) {
      syncMap.at = index;
      list.scrollLeft = current.offsetLeft - list.offsetLeft - list.clientWidth / 2 + current.clientWidth / 2;
    }
  }

  addEventListener("keydown", (event) => {
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    keys.add(event.key.toLowerCase());
    if (event.key === "Escape") close();
    if (event.key.toLowerCase() === "e" && !document.body.classList.contains("inside")) {
      const here = nearest();
      if (here.dist < 7) open(here.district.id);
    }
  });
  addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

  enterBtn.addEventListener("click", () => {
    const here = nearest();
    if (here.dist < 8) open(here.district.id);
  });
  leaveBtn.addEventListener("click", close);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (!document.body.classList.contains("play")) return;
      const index = districts.findIndex((district) => district.id === link.getAttribute("href").slice(1));
      if (index < 0) return;
      event.preventDefault();
      close();
      aimX = 0;
      aimZ = districts[index].z + 3.2;
      pending = index;
    });
  });

  document.querySelectorAll("#pad button").forEach((button) => {
    const hold = (on) => {
      const move = button.dataset.move;
      const key = { forward: "w", back: "s", left: "a", right: "d" }[move];
      if (on) keys.add(key);
      else keys.delete(key);
    };
    button.addEventListener("pointerdown", (event) => {
      button.setPointerCapture(event.pointerId);
      hold(true);
    });
    button.addEventListener("pointerup", () => hold(false));
    button.addEventListener("pointercancel", () => hold(false));
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  canvas.addEventListener("pointerdown", (event) => {
    if (document.body.classList.contains("inside")) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) {
      aimX = THREE.MathUtils.clamp(hit.x, -2.4, 2.4);
      aimZ = THREE.MathUtils.clamp(hit.z, endZ + 4, 12);
    }
  });

  function resize() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  resize();

  document.body.classList.add("play");
  requestAnimationFrame(resize);

  function frame() {
    const speed = 0.16;
    if (keys.has("w") || keys.has("arrowup")) aimZ -= speed;
    if (keys.has("s") || keys.has("arrowdown")) aimZ += speed;
    if (keys.has("a") || keys.has("arrowleft")) aimX -= speed * 0.7;
    if (keys.has("d") || keys.has("arrowright")) aimX += speed * 0.7;
    aimX = THREE.MathUtils.clamp(aimX, -2.4, 2.4);
    aimZ = THREE.MathUtils.clamp(aimZ, endZ + 4, 12);
    x += (aimX - x) * 0.12;
    z += (aimZ - z) * 0.12;
    if (pending >= 0 && Math.abs(z - (districts[pending].z + 3.2)) < 0.45 && Math.abs(x) < 0.6) {
      const id = districts[pending].id;
      pending = -1;
      open(id);
    }
    player.position.set(x, 0.35, z);

    const bob = document.body.classList.contains("inside") ? 0 : Math.sin(performance.now() / 280) * 0.04;
    camera.position.set(x * 0.4, 2.35, z + 7.2);
    camera.lookAt(x * 0.2, 1.35 + bob, z - 6);

    const here = nearest();
    const span = districts[0].z - districts.at(-1).z;
    const t = span > 0 ? (districts[0].z - z) / span : 0;
    const index = districts.indexOf(here.district);
    syncMap(index, t);
    const inside = document.body.classList.contains("inside");
    hud.classList.toggle("near", !inside && here.dist < 7);
    enterBtn.hidden = inside || here.dist >= 7;
    if (!inside) {
      const hint = document.querySelector("#hud-hint");
      if (hint) {
        hint.textContent = here.dist < 7
          ? `E enters ${here.district.name}.`
          : "Click the street to walk. W A S D moves. E enters a gate.";
      }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
}

function label(text) {
  const board = document.createElement("canvas");
  board.width = 512;
  board.height = 128;
  const ctx = board.getContext("2d");
  ctx.clearRect(0, 0, 512, 128);
  ctx.font = "600 54px Georgia, serif";
  ctx.fillStyle = "#f6ead2";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);
  const material = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(board),
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(5.4, 1.35, 1);
  return sprite;
}
