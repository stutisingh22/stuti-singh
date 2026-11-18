import { writeFileSync } from "node:fs";

const stone = "#e4cba8";
const stone2 = "#c9a67a";
const shade = "#8d6848";
const terra = "#c45132";
const ink = "#2c241e";
const green = "#234038";
const green2 = "#3e6b56";
const gold = "#e2b15a";
const water = "#6ea4b4";
const water2 = "#d5eef2";
const cloth = "#9c3d45";

function svg(w, h, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

function archRow(x, y, n, span, h, fill = stone) {
  let d = "";
  const w = span / n;
  for (let i = 0; i < n; i++) {
    const a = x + i * w;
    d += `<path d="M${a} ${y + h} V${y + h * 0.42} Q${a + w / 2} ${y} ${a + w} ${y + h * 0.42} V${y + h} Z" fill="${fill}"/>`;
    d += `<path d="M${a + w * 0.18} ${y + h} V${y + h * 0.5} Q${a + w / 2} ${y + h * 0.22} ${a + w * 0.82} ${y + h * 0.5} V${y + h} Z" fill="${shade}" opacity="0.35"/>`;
  }
  return d;
}

const files = {};

files["shared/skyline.svg"] = svg(4800, 520, `
  <path d="M0 420 C400 360 700 300 1100 340 C1500 380 1700 250 2100 280 C2500 310 2700 200 3200 250 C3700 300 4000 220 4800 280 V520 H0 Z" fill="#c4b49a"/>
  <path d="M0 460 C500 420 900 450 1400 410 C1900 370 2300 430 2900 400 C3500 370 4100 430 4800 390 V520 H0 Z" fill="#a89078"/>
  <g fill="#1e3a32">
    <path d="M280 390 l26-90 26 90 Z"/><path d="M620 410 l18-70 18 70 Z"/>
    <path d="M1680 360 l30-110 30 110 Z"/><path d="M2480 340 l22-80 22 80 Z"/>
    <path d="M3300 370 l28-100 28 100 Z"/><path d="M4100 360 l20-75 20 75 Z"/>
  </g>
  <g fill="${stone}">
    <ellipse cx="980" cy="360" rx="70" ry="28"/>
    <path d="M910 360 V300 Q980 240 1050 300 V360"/>
    <ellipse cx="2920" cy="330" rx="90" ry="30"/>
    <path d="M2830 330 V250 Q2920 180 3010 250 V330"/>
  </g>
`);

files["shared/street.svg"] = svg(480, 220, `
  <path d="M0 40 H480 V220 H0 Z" fill="#b99874"/>
  <path d="M0 40 H480 V70 H0 Z" fill="#d8c09a"/>
  ${Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 6 }, (_, col) => {
      const x = col * 84 + (row % 2 ? 30 : 6);
      const y = 78 + row * 18;
      return `<rect x="${x}" y="${y}" width="64" height="12" rx="2" fill="${row % 2 ? "#c4a67c" : "#ddc6a0"}"/>`;
    }).join("")
  ).join("")}
`);

files["porta/landmark.svg"] = svg(960, 720, `
  <rect x="70" y="250" width="120" height="420" fill="${stone}"/>
  <rect x="770" y="250" width="120" height="420" fill="${stone}"/>
  <rect x="90" y="250" width="30" height="420" fill="${stone2}"/>
  <rect x="840" y="250" width="30" height="420" fill="${shade}" opacity="0.35"/>
  <path d="M70 360 H890 V250 Q480 20 70 250 Z" fill="${stone}"/>
  <path d="M190 670 V390 Q480 140 770 390 V670 Z" fill="${shade}" opacity="0.25"/>
  <path d="M230 670 V420 Q480 210 730 420 V670" fill="none" stroke="${stone2}" stroke-width="28"/>
  <rect x="560" y="470" width="150" height="110" rx="4" fill="#f3e6cf" stroke="${shade}" stroke-width="6"/>
  <rect x="578" y="492" width="114" height="8" fill="${shade}"/>
  <rect x="578" y="510" width="90" height="8" fill="${stone2}"/>
  <rect x="578" y="528" width="100" height="8" fill="${stone2}"/>
`);

files["porta/props.svg"] = svg(640, 420, `
  <g fill="${ink}">
    <ellipse cx="120" cy="250" rx="16" ry="8"/>
    <path d="M104 250 q16-28 32 0"/>
    <ellipse cx="210" cy="270" rx="14" ry="7"/>
    <path d="M196 270 q14-24 28 0"/>
    <ellipse cx="168" cy="230" rx="15" ry="7"/>
    <path d="M154 230 q14-26 28 0"/>
  </g>
  <rect x="470" y="120" width="14" height="250" fill="${shade}"/>
  <ellipse cx="477" cy="118" rx="28" ry="10" fill="${gold}"/>
`);

files["colosseum/landmark.svg"] = svg(960, 720, `
  <ellipse cx="480" cy="520" rx="340" ry="70" fill="${stone2}"/>
  <path d="M160 500 V340 Q480 80 800 340 V500" fill="${stone}"/>
  ${archRow(190, 300, 7, 580, 150)}
  ${archRow(210, 430, 6, 540, 120, stone2)}
  <rect x="300" y="250" width="26" height="220" fill="${shade}"/>
  <rect x="286" y="236" width="54" height="28" rx="3" fill="#f3e6cf"/>
  <g fill="${cloth}">
    <circle cx="250" cy="560" r="16"/>
    <path d="M238 574 l-16 70 h20 l8-40 10 40 h18 l-18-70 Z"/>
    <circle cx="310" cy="568" r="16" fill="${ink}"/>
    <path d="M298 582 l-8 64 h18 l6-34 12 34 h16 l-14-64 Z" fill="#3e5f86"/>
  </g>
  <g>
    <circle cx="700" cy="575" r="14" fill="${stone}"/>
    <path d="M690 588 l-6 58 h14 l6-30 8 30 h14 l-10-58 Z" fill="${green2}"/>
    <rect x="720" y="560" width="36" height="22" fill="#f3e6cf"/>
  </g>
`);

files["colosseum/props.svg"] = svg(520, 360, `
  <rect x="80" y="220" width="200" height="16" rx="4" fill="${shade}"/>
  <circle cx="110" cy="248" r="22" fill="${ink}"/>
  <circle cx="250" cy="248" r="22" fill="${ink}"/>
  <rect x="140" y="160" width="90" height="60" fill="${terra}"/>
  <rect x="40" y="80" width="12" height="200" fill="${shade}"/>
  <ellipse cx="46" cy="78" rx="22" ry="8" fill="${gold}"/>
`);

files["aqueducts/landmark.svg"] = svg(1100, 640, `
  <rect x="40" y="180" width="1020" height="36" fill="${stone}"/>
  <rect x="40" y="150" width="1020" height="28" fill="${water}"/>
  <path d="M40 164 H1060" stroke="${water2}" stroke-width="6" fill="none"/>
  ${archRow(60, 210, 5, 980, 340)}
  <path d="M980 178 C1040 220 1080 300 1040 420" fill="none" stroke="${water}" stroke-width="16"/>
  <g fill="${green}">
    <circle cx="180" cy="520" r="18"/>
    <path d="M168 536 l-10 70 h22 l8-36 10 36 h20 l-16-70 Z"/>
  </g>
`);

files["aqueducts/props.svg"] = svg(360, 480, `
  <path d="M180 460 L180 160 L120 200 L180 80 L240 200 L180 160" fill="${green}"/>
  <rect x="168" y="160" width="24" height="300" fill="${green}"/>
`);

files["forum/landmark.svg"] = svg(960, 720, `
  <path d="M120 250 H840 L800 210 H160 Z" fill="${terra}"/>
  <rect x="150" y="250" width="660" height="28" fill="${stone}"/>
  ${[0, 1, 2, 3].map((i) => {
    const x = 220 + i * 150;
    return `<rect x="${x}" y="278" width="46" height="300" fill="${stone}"/><rect x="${x - 10}" y="268" width="66" height="22" fill="${stone2}"/><rect x="${x - 8}" y="560" width="62" height="18" fill="${shade}"/>`;
  }).join("")}
  <rect x="140" y="578" width="680" height="28" fill="${stone2}"/>
  <rect x="720" y="300" width="10" height="180" fill="${ink}"/>
  <path d="M700 300 h50 l-25 40 Z" fill="${gold}"/>
`);

files["forum/props.svg"] = svg(420, 460, `
  <rect x="200" y="150" width="22" height="280" fill="${green}"/>
  <path d="M211 150 L140 230 L211 90 L282 230 Z" fill="${green}"/>
  <ellipse cx="80" cy="300" rx="18" ry="8" fill="${green2}" opacity="0.7"/>
  <ellipse cx="130" cy="250" rx="14" ry="6" fill="${green2}" opacity="0.55"/>
`);

files["pantheon/landmark.svg"] = svg(960, 720, `
  <path d="M210 430 Q480 120 750 430 Z" fill="${stone}"/>
  <circle cx="480" cy="300" r="36" fill="${water2}"/>
  <ellipse cx="480" cy="430" rx="250" ry="36" fill="${shade}" opacity="0.25"/>
  <rect x="250" y="430" width="460" height="40" fill="${stone2}"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${280 + i * 68}" y="470" width="36" height="160" fill="${stone}"/>`).join("")}
  <rect x="250" y="630" width="460" height="30" fill="${stone2}"/>
  <rect x="430" y="500" width="100" height="130" fill="${shade}" opacity="0.45"/>
`);

files["pantheon/props.svg"] = svg(300, 420, `
  <rect x="140" y="80" width="12" height="280" fill="${shade}"/>
  <ellipse cx="146" cy="78" rx="24" ry="8" fill="${gold}"/>
`);

files["circus/landmark.svg"] = svg(1100, 640, `
  <ellipse cx="550" cy="420" rx="460" ry="150" fill="#c4a67c"/>
  <ellipse cx="550" cy="420" rx="300" ry="90" fill="${green}"/>
  <rect x="80" y="250" width="940" height="40" fill="${stone}"/>
  <rect x="80" y="250" width="28" height="260" fill="${stone2}"/>
  <rect x="992" y="250" width="28" height="260" fill="${stone2}"/>
  <rect x="860" y="470" width="54" height="36" rx="6" fill="${gold}"/>
`);

files["circus/props.svg"] = svg(480, 280, `
  <path d="M40 80 H200 L180 120 H60 Z" fill="${terra}"/>
  <rect x="70" y="120" width="10" height="120" fill="${shade}"/>
  <rect x="160" y="120" width="10" height="120" fill="${shade}"/>
`);

files["vatican/landmark.svg"] = svg(960, 720, `
  <rect x="120" y="160" width="520" height="460" fill="#6e5344"/>
  ${[0, 1, 2, 3].map((row) => [0, 1, 2, 3, 4, 5, 6].map((col) => {
    const colors = ["#8d3b32", "#315c4c", "#c4a06a", "#3d4f73", "#a36b3c", "#6d3a4a", "#d8c09a"];
    return `<rect x="${150 + col * 68}" y="${190 + row * 100}" width="48" height="70" fill="${colors[(row + col) % colors.length]}"/>`;
  }).join("")).join("")}
  <rect x="150" y="290" width="48" height="70" fill="${cloth}"/>
  <rect x="680" y="430" width="200" height="18" fill="${shade}"/>
  <rect x="700" y="360" width="120" height="70" fill="#f3e6cf"/>
  <rect x="716" y="378" width="88" height="6" fill="${shade}"/>
  <rect x="716" y="392" width="60" height="6" fill="${stone2}"/>
`);

files["vatican/props.svg"] = svg(280, 360, `
  <rect x="120" y="40" width="12" height="260" fill="${shade}"/>
  <ellipse cx="126" cy="38" rx="22" ry="8" fill="${gold}"/>
`);

files["bocca/landmark.svg"] = svg(860, 760, `
  <circle cx="430" cy="400" r="280" fill="${stone}"/>
  <circle cx="430" cy="400" r="248" fill="${stone2}"/>
  <path d="M250 250 Q430 150 610 250" fill="none" stroke="${shade}" stroke-width="22"/>
  <ellipse cx="320" cy="340" rx="42" ry="28" fill="${ink}"/>
  <ellipse cx="540" cy="340" rx="42" ry="28" fill="${ink}"/>
  <path d="M350 470 Q430 430 510 470" fill="none" stroke="${shade}" stroke-width="12"/>
  <ellipse cx="430" cy="540" rx="78" ry="52" fill="${ink}"/>
`);

files["bocca/props.svg"] = svg(240, 360, `
  <rect x="100" y="60" width="12" height="250" fill="${shade}"/>
  <ellipse cx="106" cy="58" rx="20" ry="7" fill="${gold}"/>
`);

files["capitoline/landmark.svg"] = svg(960, 720, `
  <path d="M80 620 L480 260 L880 620 Z" fill="#c4a67c"/>
  <path d="M200 620 L480 360 L760 620 Z" fill="${stone}"/>
  <rect x="455" y="300" width="50" height="150" fill="${ink}"/>
  <circle cx="480" cy="280" r="26" fill="${stone}"/>
  <rect x="430" y="340" width="40" height="50" fill="#f3e6cf"/>
  <g stroke="${shade}" fill="none" stroke-width="8">
    <path d="M620 430 V520"/>
    <path d="M590 460 H650"/>
    <circle cx="590" cy="490" r="22"/>
    <circle cx="650" cy="490" r="22"/>
  </g>
`);

files["capitoline/props.svg"] = svg(300, 460, `
  <rect x="140" y="140" width="20" height="280" fill="${green}"/>
  <path d="M150 140 L90 220 L150 70 L210 220 Z" fill="${green}"/>
`);

files["steps/landmark.svg"] = svg(860, 860, `
  ${Array.from({ length: 8 }, (_, i) => {
    const y = 140 + i * 78;
    const inset = i * 28;
    return `<rect x="${80 + inset}" y="${y}" width="${700 - inset * 2}" height="58" fill="${i % 2 ? stone : stone2}"/>`;
  }).join("")}
  <g fill="${terra}">
    <rect x="150" y="200" width="36" height="28"/><circle cx="168" cy="190" r="18" fill="${green2}"/>
    <rect x="640" y="360" width="36" height="28"/><circle cx="658" cy="350" r="18" fill="${green2}"/>
    <rect x="250" y="520" width="36" height="28"/><circle cx="268" cy="510" r="18" fill="${green2}"/>
  </g>
`);

files["steps/props.svg"] = svg(300, 240, `
  <rect x="40" y="140" width="180" height="14" fill="${shade}"/>
  <circle cx="70" cy="160" r="18" fill="${ink}"/>
  <circle cx="190" cy="160" r="18" fill="${ink}"/>
`);

files["market/landmark.svg"] = svg(1100, 640, `
  ${["#c45132", "#e2b15a", "#234038", "#3d4f73", "#9c3d45"].map((color, i) => {
    const x = 70 + i * 200;
    return `<path d="M${x} 280 Q${x + 80} 120 ${x + 160} 280 Z" fill="${color}"/>
      <rect x="${x + 30}" y="280" width="16" height="220" fill="${shade}"/>
      <rect x="${x + 114}" y="280" width="16" height="220" fill="${shade}"/>
      <rect x="${x + 20}" y="400" width="120" height="16" fill="${stone}"/>`;
  }).join("")}
`);

files["market/props.svg"] = svg(420, 280, `
  <rect x="40" y="120" width="80" height="70" fill="#c4a06a"/>
  <rect x="140" y="140" width="90" height="60" fill="#8d6848"/>
  <rect x="250" y="110" width="70" height="80" fill="${terra}"/>
`);

files["trevi/landmark.svg"] = svg(1000, 720, `
  <rect x="180" y="120" width="640" height="360" fill="${stone}"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${230 + i * 140}" y="180" width="70" height="180" fill="${stone2}"/>`).join("")}
  <path d="M120 500 H880 Q860 640 500 660 Q140 640 120 500 Z" fill="${water}"/>
  <path d="M160 530 Q500 580 840 530" fill="none" stroke="${water2}" stroke-width="10"/>
  <path d="M200 560 Q500 610 800 560" fill="none" stroke="${water2}" stroke-width="6" opacity="0.7"/>
  <rect x="470" y="430" width="60" height="80" fill="${shade}"/>
`);

files["trevi/props.svg"] = svg(640, 420, `
  <rect x="80" y="80" width="14" height="260" fill="${shade}"/>
  <ellipse cx="87" cy="76" rx="28" ry="10" fill="${gold}"/>
  <rect x="520" y="100" width="14" height="240" fill="${shade}"/>
  <ellipse cx="527" cy="96" rx="28" ry="10" fill="${gold}"/>
`);

for (const [name, body] of Object.entries(files)) {
  writeFileSync(new URL("./" + name, import.meta.url), body);
}
console.log(Object.keys(files).length);
