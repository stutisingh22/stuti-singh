const PHOTOS = {
  atrium: "art/rome-atrium.png",
  basilica: "art/rome-basilica.png",
  stoa: "art/rome-stoa.png",
  peristyle: "art/rome-peristyle.png",
  pompeii: "art/rome-pompeii.png",
};
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const stops = [...document.querySelectorAll("main .stop")].map((el) => ({
  el,
  id: el.id,
  place: el.dataset.place,
  roman: el.querySelector(".roman")?.textContent.trim() || "",
  next: el.dataset.next || "",
  src: PHOTOS[[...el.classList].find((c) => c.startsWith("plate-"))?.slice(6)] || PHOTOS.atrium,
  x: Number(el.dataset.x) || 50,
  y: Number(el.dataset.y) || 50,
}));
const pins = [...document.querySelectorAll(".pins a")];
const guide = document.querySelector("#guide");
const guideLine = document.querySelector("#guide-line");

if (sessionStorage.getItem("guide") === "off") document.body.classList.add("guide-off");
document.querySelector("#guide-hide")?.addEventListener("click", () => {
  document.body.classList.add("guide-off");
  sessionStorage.setItem("guide", "off");
});

let progress = 0;
let velocity = 0;
let glideTo = null;
let look = 0;
let lookTarget = 0;
let nearest = -1;
let walkOn = false;
let dragging = false;
const keys = new Set();

function clampAim(value) {
  return Math.max(0, Math.min(stops.length - 1, value));
}

function showStop(index) {
  if (index === nearest) return;
  nearest = index;
  stops.forEach((stop, i) => stop.el.classList.toggle("is-here", i === index));
  pins.forEach((pin, i) => {
    if (i === index) pin.setAttribute("aria-current", "true");
    else pin.removeAttribute("aria-current");
  });
  const stop = stops[index];
  if (guideLine && stop) guideLine.textContent = `${stop.roman} ${stop.next}`;
  const pinsBox = document.querySelector(".pins");
  const current = pins[index];
  if (pinsBox && current) {
    pinsBox.scrollLeft = current.offsetLeft - pinsBox.clientWidth / 2 + current.clientWidth / 2;
  }
}

function enterResume() {
  walkOn = false;
  document.body.classList.remove("walk");
  document.body.classList.add("resume");
  const skip = document.querySelector("#skip-tour");
  if (skip) {
    skip.textContent = "Return to the walk";
    skip.setAttribute("href", "#porta");
  }
  location.hash = "resume";
}

function enterWalk(index) {
  if (reduce) {
    document.body.classList.add("resume");
    const el = stops[index]?.el;
    if (el) el.scrollIntoView();
    return;
  }
  const target = clampAim(index);
  if (!walkOn) {
    progress = target;
    velocity = 0;
    glideTo = null;
  } else {
    glideTo = target;
    velocity = 0;
  }
  walkOn = true;
  document.body.classList.remove("resume");
  document.body.classList.add("walk");
  const skip = document.querySelector("#skip-tour");
  if (skip) {
    skip.textContent = "Skip the tour";
    skip.setAttribute("href", "#resume");
  }
  showStop(Math.round(progress));
  if (location.hash === "#resume") history.replaceState(null, "", "#" + stops[Math.round(progress)].id);
}

document.querySelector("#skip-tour")?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (event.currentTarget.getAttribute("href") === "#resume") enterResume();
  else enterWalk(0);
});

addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");
  if (!link) return;
  const id = link.getAttribute("href").slice(1);
  if (id === "resume") {
    event.preventDefault();
    enterResume();
    return;
  }
  const index = stops.findIndex((stop) => stop.id === id);
  if (index < 0) return;
  if (reduce) return;
  event.preventDefault();
  enterWalk(index);
});

const principleLines = [...document.querySelectorAll(".principles li")].map((li) => li.textContent.trim());
let principleAt = 0;
document.querySelector("#hand")?.addEventListener("click", () => {
  principleAt = (principleAt + 1) % principleLines.length;
  const out = document.querySelector("#principle");
  if (out) out.textContent = principleLines[principleAt];
});
document.querySelector("#arches")?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-stage]");
  if (!button) return;
  const note = document.querySelector("#arch-note");
  if (note) note.textContent = button.dataset.stage;
});
document.querySelector("#temple")?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-copy]");
  if (!button) return;
  const note = document.querySelector("#temple-note");
  if (note) note.textContent = button.dataset.copy;
});
document.querySelector("#track")?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-why]");
  if (!button) return;
  const note = document.querySelector("#why-note");
  if (note) note.textContent = button.dataset.why;
});
const confidence = document.querySelector("#confidence");
function paintConfidence() {
  const value = Number(confidence.value);
  const out = document.querySelector("#conf-out");
  const note = document.querySelector("#conf-note");
  if (out) out.textContent = String(value);
  if (note) {
    note.textContent = value < 70
      ? "Below 70, this record is sent for review. The oculus stays open until a person decides."
      : "At 70 or above, the deterministic layer accepts it. A person can still reverse the write.";
  }
}
confidence?.addEventListener("input", paintConfidence);
document.querySelector("#toss")?.addEventListener("click", () => {
  const card = document.querySelector("#contact");
  if (card) card.hidden = false;
});
document.querySelector("#stalls")?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-stops]");
  if (!button) return;
  const on = button.classList.toggle("chip-on");
  document.querySelectorAll("#stalls button.chip-on").forEach((other) => {
    if (other !== button) other.classList.remove("chip-on");
  });
  const ids = on ? button.dataset.stops.split(" ") : [];
  pins.forEach((pin) => pin.classList.toggle("lit", ids.includes(pin.getAttribute("href").slice(1))));
});

if (!reduce && location.hash !== "#resume") enterWalk(Math.max(0, stops.findIndex((s) => "#" + s.id === location.hash)));

const front = document.querySelector("#vista-front");
const back = document.querySelector("#vista-back");
const route = document.querySelector("#route");
const token = document.querySelector("#token");
stops.forEach((stop) => {
  const img = new Image();
  img.src = stop.src;
});

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

addEventListener("keydown", (event) => {
  if (!walkOn) return;
  const tag = event.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
  keys.add(event.key.toLowerCase());
  if (event.key === "Escape") enterResume();
});
addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

addEventListener("wheel", (event) => {
  if (!walkOn) return;
  event.preventDefault();
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
  glideTo = null;
  velocity = Math.max(-1.4, Math.min(1.4, velocity + event.deltaY * unit * 0.0032));
}, { passive: false });

const vistas = document.querySelector("#vistas");
let drag = null;
vistas?.addEventListener("pointerdown", (event) => {
  if (!walkOn || event.button !== 0) return;
  drag = { x: event.clientX, progress, t: performance.now() };
  dragging = true;
  glideTo = null;
  velocity = 0;
  vistas.setPointerCapture(event.pointerId);
});
vistas?.addEventListener("pointermove", (event) => {
  lookTarget = (event.clientX / innerWidth - 0.5) * -10;
  if (!drag) return;
  const next = clampAim(drag.progress + (drag.x - event.clientX) / innerWidth * 2.6);
  const t = performance.now();
  const step = Math.max(0.016, (t - drag.t) / 1000);
  velocity = Math.max(-2.2, Math.min(2.2, (next - progress) / step));
  progress = next;
  drag.t = t;
});
function endDrag() {
  drag = null;
  dragging = false;
}
vistas?.addEventListener("pointerup", endDrag);
vistas?.addEventListener("pointercancel", endDrag);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.032, (now - last) / 1000);
  last = now;
  if (walkOn) {
    if (glideTo !== null && !dragging) {
      const gap = glideTo - progress;
      const step = Math.min(Math.abs(gap), dt * 2.6);
      progress += Math.sign(gap) * step;
      if (Math.abs(gap) < 0.003) {
        progress = glideTo;
        glideTo = null;
      }
    } else if (!dragging) {
      let push = 0;
      if (keys.has("arrowright") || keys.has("arrowup") || keys.has("w") || keys.has("d")) push += 1;
      if (keys.has("arrowleft") || keys.has("arrowdown") || keys.has("s") || keys.has("a")) push -= 1;
      if (push) velocity = Math.max(-1.15, Math.min(1.15, velocity + push * dt * 2.2));
      else velocity *= Math.exp(-dt * 0.75);
      if (Math.abs(velocity) < 0.02) velocity = 0;
      progress = clampAim(progress + velocity * dt);
    }
    look += (lookTarget - look) * (1 - Math.exp(-dt * 5));
    const i = Math.min(stops.length - 1, Math.floor(progress));
    const f = progress - i;
    const here = stops[i];
    const nxt = stops[Math.min(stops.length - 1, i + 1)];
    const same = here.src === nxt.src;
    const fade = same ? 0 : smoothstep((f - 0.58) / 0.42);
    const glide = same ? f : Math.min(f, 0.58) / 0.58;
    const x = here.x + (nxt.x - here.x) * glide * (same ? 1 : 0.28) + look;
    const y = here.y + (nxt.y - here.y) * glide * (same ? 1 : 0.2);
    front.style.backgroundImage = `url("${here.src}")`;
    front.style.backgroundPosition = `${x}% ${y}%`;
    front.style.opacity = "1";
    if (!same && nxt) {
      back.style.backgroundImage = `url("${nxt.src}")`;
      back.style.backgroundPosition = `${nxt.x + look * 0.4}% ${nxt.y}%`;
      back.style.opacity = String(fade);
    } else {
      back.style.opacity = "0";
    }
    if (route && token) {
      const length = route.getTotalLength();
      const point = route.getPointAtLength((progress / (stops.length - 1)) * length);
      token.setAttribute("cx", String(point.x));
      token.setAttribute("cy", String(point.y));
    }
    const shown = !same && fade > 0.5 ? Math.min(stops.length - 1, i + 1) : i;
    showStop(shown);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
