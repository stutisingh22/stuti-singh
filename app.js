const sample = `Rohit works at Acme Corp. Contact Rohit at rohit@acme.example.
The lab sent a note from Dr. Mehta, phone +91 98450 11223.
See https://arkandis.example/inventory before Friday.`;

const source = document.querySelector("#source");
const output = document.querySelector("#output");
const chips = document.querySelector("#chips");
const pinForm = document.querySelector("#pin-form");
const pinInput = document.querySelector("#pin-input");
let pins = ["Rohit", "Acme Corp", "Dr. Mehta"];

function tokenFactory() {
  const seen = new Map();
  const counts = { EMAIL: 0, PHONE: 0, URL: 0, PERSON: 0, ORG: 0 };
  return (kind, value) => {
    const key = kind + "\0" + value.toLowerCase();
    if (!seen.has(key)) {
      counts[kind] += 1;
      const n = String(counts[kind]).padStart(3, "0");
      seen.set(key, `<${kind}_${n}>`);
    }
    return seen.get(key);
  };
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function redact(text) {
  const tok = tokenFactory();
  const marks = [];
  const take = (kind, re) => {
    for (const match of text.matchAll(re)) {
      marks.push({ start: match.index, end: match.index + match[0].length, kind, value: match[0] });
    }
  };
  take("URL", /https?:\/\/[^\s]+/gi);
  take("EMAIL", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  take("PHONE", /(?:\+?\d[\d\s()-]{7,}\d)/g);
  const sortedPins = [...pins].filter(Boolean).sort((a, b) => b.length - a.length);
  for (const pin of sortedPins) {
    const kind = /\b(corp|inc|labs|media|ltd)\b/i.test(pin) ? "ORG" : "PERSON";
    const re = new RegExp(pin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    take(kind, re);
  }
  marks.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept = [];
  let cursor = 0;
  for (const mark of marks) {
    if (mark.start < cursor) continue;
    kept.push(mark);
    cursor = mark.end;
  }
  let html = "";
  cursor = 0;
  for (const mark of kept) {
    html += escapeHtml(text.slice(cursor, mark.start));
    html += `<mark>${escapeHtml(tok(mark.kind, mark.value))}</mark>`;
    cursor = mark.end;
  }
  html += escapeHtml(text.slice(cursor));
  return html || " ";
}

function renderPins() {
  chips.innerHTML = "";
  for (const pin of pins) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${pin} ×`;
    button.setAttribute("aria-label", `Unpin ${pin}`);
    button.addEventListener("click", () => {
      pins = pins.filter((item) => item !== pin);
      renderPins();
      paint();
    });
    li.append(button);
    chips.append(li);
  }
}

function paint() {
  output.innerHTML = redact(source.value);
}

source.value = sample;
source.addEventListener("input", paint);
document.querySelector("#load-sample").addEventListener("click", () => {
  source.value = sample;
  pins = ["Rohit", "Acme Corp", "Dr. Mehta"];
  renderPins();
  paint();
});
pinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = pinInput.value.trim();
  if (value && !pins.some((pin) => pin.toLowerCase() === value.toLowerCase())) {
    pins.push(value);
    renderPins();
    paint();
  }
  pinInput.value = "";
});
renderPins();
paint();

const redactedLayer = document.querySelector("#face-redacted");
const range = document.querySelector("#mask-range");
const divider = document.querySelector("#mask-divider");
const setRange = () => {
  const value = Number(range.value);
  redactedLayer.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
  divider.style.left = `${value}%`;
};
range.value = "58";
range.addEventListener("input", setRange);
setRange();

const stripBtn = document.querySelector("#mode-strip");
const blurBtn = document.querySelector("#mode-blur");
function setMode(blur) {
  redactedLayer.classList.toggle("is-blur", blur);
  stripBtn.setAttribute("aria-pressed", String(!blur));
  blurBtn.setAttribute("aria-pressed", String(blur));
}
stripBtn.addEventListener("click", () => setMode(false));
blurBtn.addEventListener("click", () => setMode(true));

const slip = document.querySelector("#slip");
const redactBtn = document.querySelector("#redact-report");
redactBtn.addEventListener("click", () => {
  const on = redactBtn.getAttribute("aria-pressed") !== "true";
  redactBtn.setAttribute("aria-pressed", String(on));
  slip.classList.toggle("is-redacted", on);
  slip.querySelectorAll("[data-redact]").forEach((node) => {
    node.setAttribute("aria-hidden", String(on));
  });
  document.querySelector("#switch-label").textContent = on ? "Identity removed" : "Remove identity";
});

const listings = [
  {
    title: "Spacious 3BHK on the 27th Main",
    area: "HSR Layout",
    category: "full-house",
    price: 42000,
    beds: "3 beds",
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Private Room in a Thoughtfully Shared Home",
    area: "HSR Layout",
    category: "room-rental",
    price: 14000,
    beds: "1 room",
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Designer 2BHK — Fully Furnished",
    area: "HSR Layout",
    category: "full-house",
    price: 32000,
    beds: "2 beds",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "A Flat on 100 Feet Road",
    area: "Indiranagar",
    category: "full-house",
    price: 68000,
    beds: "3 beds",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
  },
];

const homes = document.querySelector("#homes");
function renderHomes(filter) {
  homes.innerHTML = "";
  const shown = listings.filter((item) => filter === "all" || item.category === filter);
  shown.forEach((item, index) => {
    const article = document.createElement("article");
    article.className = index === 0 && filter === "all" ? "home lead" : "home";
    const rupees = new Intl.NumberFormat("en-IN").format(item.price);
    article.innerHTML = `
      <img alt="" />
      <div class="home-body">
        <h3></h3>
        <p></p>
        <p class="price"></p>
      </div>`;
    const image = article.querySelector("img");
    image.src = item.image;
    image.alt = item.title;
    article.querySelector("h3").textContent = item.title;
    article.querySelector("p").textContent = `${item.area} · ${item.beds}`;
    article.querySelector(".price").textContent = `₹${rupees} / month`;
    homes.append(article);
  });
}
const filters = [
  ["#filter-all", "all"],
  ["#filter-house", "full-house"],
  ["#filter-room", "room-rental"],
];
for (const [id, value] of filters) {
  document.querySelector(id).addEventListener("click", (event) => {
    for (const [other] of filters) {
      document.querySelector(other).setAttribute("aria-pressed", String(other === id));
    }
    renderHomes(value);
    event.currentTarget.blur();
  });
}
renderHomes("all");

const sites = [
  {
    name: "Harbor Ledger",
    verdict: "Clears both hard gates. Worth a call.",
    gates: [
      ["Daily", "pass", "News desk, updated this morning"],
      ["Traffic", "pass", "About 1.2M monthly visits, mostly US"],
      ["Ownership", "pass", "Independent"],
      ["Ad network", "soft", "Not a top-tier network"],
    ],
  },
  {
    name: "Recipe attic",
    verdict: "Static how-to pages. The daily-content gate fails.",
    gates: [
      ["Daily", "fail", "Evergreen, not a news cadence"],
      ["Traffic", "pass", "Enough visits, if it were a newsroom"],
      ["Ownership", "pass", "Independent"],
      ["Ad network", "soft", "Unknown, left unknown"],
    ],
  },
  {
    name: "Metro Sports",
    verdict: "Daily, but the traffic file is missing, so this stays in review.",
    gates: [
      ["Daily", "pass", "Game reports every day"],
      ["Traffic", "fail", "No number on file — not invented"],
      ["Ownership", "soft", "Might sit inside a larger group"],
      ["Ad network", "soft", "Mediavine listed in ads.txt"],
    ],
  },
];

const picks = document.querySelector("#site-picks");
const verdict = document.querySelector("#verdict");
function showSite(index) {
  [...picks.children].forEach((button, i) => {
    button.setAttribute("aria-pressed", String(i === index));
  });
  const site = sites[index];
  verdict.innerHTML = "";
  const title = document.createElement("h3");
  title.textContent = site.verdict;
  const list = document.createElement("ul");
  list.className = "gates";
  for (const [label, state, detail] of site.gates) {
    const li = document.createElement("li");
    const strong = document.createElement("span");
    strong.className = state === "fail" ? "gate-fail" : state === "pass" ? "gate-pass" : "gate-soft";
    strong.textContent = state === "fail" ? "Stop" : state === "pass" ? "Clears" : "Note";
    const rest = document.createElement("span");
    rest.textContent = `${label}. ${detail}`;
    li.append(strong, rest);
    list.append(li);
  }
  verdict.append(title, list);
}
sites.forEach((site, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = site.name;
  button.addEventListener("click", () => showSite(index));
  picks.append(button);
});
showSite(0);

const accounts = [
  {
    name: "Northline",
    kind: "Independent publisher",
    stage: "Write",
    next: "Send the Tuesday note",
    research: "Local news, US-heavy, syndicates to two apps",
  },
  {
    name: "Glasshouse",
    kind: "Media house",
    stage: "Qualify",
    next: "Confirm who actually owns the domain",
    research: "Three brands, one ads.txt owner",
  },
  {
    name: "Field Report",
    kind: "Independent publisher",
    stage: "Reply",
    next: "They asked for a rate card",
    research: "Politics vertical, reply landed yesterday",
  },
];
const accountList = document.querySelector("#accounts");
const drawer = document.querySelector("#drawer");
function openAccount(index) {
  [...accountList.querySelectorAll("button")].forEach((button, i) => {
    button.setAttribute("aria-pressed", String(i === index));
  });
  const account = accounts[index];
  drawer.innerHTML = "";
  const title = document.createElement("h3");
  title.textContent = account.name;
  const kind = document.createElement("p");
  kind.className = "kind";
  kind.textContent = account.kind;
  const dl = document.createElement("dl");
  for (const [term, detail] of [
    ["Stage", account.stage],
    ["Next", account.next],
    ["Research", account.research],
  ]) {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = detail;
    dl.append(dt, dd);
  }
  drawer.append(title, kind, dl);
}
accounts.forEach((account, index) => {
  const li = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.innerHTML = `<span></span><span></span>`;
  button.children[0].textContent = account.name;
  button.children[1].textContent = account.stage;
  button.addEventListener("click", () => openAccount(index));
  li.append(button);
  accountList.append(li);
});
openAccount(0);

const rail = document.querySelector("#rail-fill");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const held = { mask: false, report: false, nivio: false, score: false, desk: false };
let scoreAt = 0;
let deskAt = 0;
let filmWrites = 0;

function chapterProgress(el) {
  const top = el.getBoundingClientRect().top;
  const start = innerHeight * 0.92;
  const end = innerHeight * 0.42;
  return Math.min(1, Math.max(0, (start - top) / Math.max(start - end, 1)));
}

range.addEventListener("pointerdown", () => { held.mask = true; });
redactBtn.addEventListener("pointerdown", () => { held.report = true; });
homes.addEventListener("pointerdown", () => { held.nivio = true; });
picks.addEventListener("pointerdown", () => { held.score = true; });
accountList.addEventListener("pointerdown", () => { held.desk = true; });

function paintMap() {
  const links = [...document.querySelectorAll(".city-stops a")];
  const route = document.getElementById("route");
  const token = document.getElementById("city-token");
  const place = document.getElementById("city-place");
  const list = document.querySelector(".city-stops");
  if (!links.length || !route || !token || !place || !list) return;
  const tops = links.map((link) => {
    const el = document.querySelector(link.getAttribute("href"));
    return el ? el.getBoundingClientRect().top + scrollY : 0;
  });
  const y = scrollY + innerHeight * 0.42;
  let index = 0;
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] <= y) index = i;
  }
  let along = index;
  if (tops[index + 1] != null) {
    const span = Math.max(tops[index + 1] - tops[index], 1);
    along = index + Math.min(1, Math.max(0, (y - tops[index]) / span));
  }
  const point = route.getPointAtLength((along / (tops.length - 1)) * route.getTotalLength());
  token.setAttribute("cx", String(point.x));
  token.setAttribute("cy", String(point.y));
  links.forEach((link, i) => {
    if (i === index) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
  place.textContent = links[index].dataset.place || links[index].textContent;
  if (paintMap.index !== index) {
    paintMap.index = index;
    const current = links[index];
    list.scrollLeft = current.offsetLeft - list.offsetLeft - list.clientWidth / 2 + current.clientWidth / 2;
  }
}

function arrive(id) {
  if (id === "mask" && !held.mask) {
    let value = 6;
    const step = () => {
      value = Math.min(94, value + 3);
      range.value = String(value);
      range.dispatchEvent(new Event("input"));
      if (value < 94 && !held.mask) requestAnimationFrame(step);
    };
    step();
  }
  if (id === "report" && !held.report && redactBtn.getAttribute("aria-pressed") !== "true") {
    redactBtn.click();
  }
  if (id === "nivio" && !held.nivio) {
    const room = homes.scrollWidth - homes.clientWidth;
    if (room > 0) homes.scrollLeft = room * 0.4;
  }
  if (id === "score" && !held.score) showSite(0);
  if (id === "partnerships" && !held.desk) openAccount(0);
  if (id === "redactor") document.querySelector("#redactor").style.setProperty("--p", "1");
}

addEventListener("city-enter", (event) => arrive(event.detail.id));

function paintScenes() {
  if (document.body.classList.contains("walk")) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  rail.style.transform = `scaleY(${max > 0 ? scrollY / max : 0})`;

  const rooms = [...document.querySelectorAll(".hero, .deck .slide")];
  let front = rooms[0];
  for (const room of rooms) {
    if (room.getBoundingClientRect().top < innerHeight * 0.55) front = room;
  }
  for (const link of document.querySelectorAll('.nav-links a[href^="#"]')) {
    const on = front && link.getAttribute("href") === `#${front.id}`;
    if (on) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  }

  paintMap();
  if (reduceMotion) return;
  rooms.forEach((room, index) => {
    const next = rooms[index + 1];
    let cover = 0;
    if (next) {
      const nextTop = next.getBoundingClientRect().top;
      cover = Math.min(1, Math.max(0, (innerHeight - nextTop) / innerHeight));
    }
    const ownTop = room.getBoundingClientRect().top;
    const rise = Math.min(1, Math.max(0, 1 - ownTop / innerHeight));
    room.style.setProperty("--cover", cover.toFixed(3));
    room.style.setProperty("--rise", rise.toFixed(3));
  });

  const maskChapter = document.querySelector("#mask");
  const reportChapter = document.querySelector("#report");
  const nivioChapter = document.querySelector("#nivio");
  const scoreChapter = document.querySelector("#score");
  const deskChapter = document.querySelector("#partnerships");
  const redactChapter = document.querySelector("#redactor");

  redactChapter.style.setProperty("--p", chapterProgress(redactChapter).toFixed(3));

  if (!held.mask) {
    const p = chapterProgress(maskChapter);
    range.value = String(Math.round(6 + p * 88));
    range.dispatchEvent(new Event("input"));
  }
  if (!held.report) {
    const want = chapterProgress(reportChapter) > 0.45;
    const on = redactBtn.getAttribute("aria-pressed") === "true";
    if (want !== on) redactBtn.click();
  }
  if (!held.nivio) {
    const p = chapterProgress(nivioChapter);
    const room = homes.scrollWidth - homes.clientWidth;
    if (room > 0) {
      filmWrites += 1;
      homes.scrollLeft = p * room;
      requestAnimationFrame(() => {
        filmWrites = Math.max(0, filmWrites - 1);
      });
    }
  }
  if (!held.score) {
    const next = Math.min(sites.length - 1, Math.floor(chapterProgress(scoreChapter) * sites.length));
    if (next !== scoreAt) {
      scoreAt = next;
      showSite(next);
    }
  }
  if (!held.desk) {
    const next = Math.min(accounts.length - 1, Math.floor(chapterProgress(deskChapter) * accounts.length));
    if (next !== deskAt) {
      deskAt = next;
      openAccount(next);
    }
  }
}

let frame = false;
addEventListener("scroll", () => {
  if (frame) return;
  frame = true;
  requestAnimationFrame(() => {
    paintScenes();
    frame = false;
  });
}, { passive: true });
homes.addEventListener("scroll", () => {
  if (filmWrites === 0) held.nivio = true;
}, { passive: true });
paintScenes();
