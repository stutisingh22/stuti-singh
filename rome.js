const stops = [
  {
    id: "porta",
    name: "Stuti Singh",
    line: "Data Analyst & AI/Automation Engineer",
    stamp: "Popolo gate",
    journal: "I turn fragmented, messy data into decisions people can trust: scraping, ETL, and language-model pipelines with a person in the loop. Based in Bengaluru. Open to data analyst, analytics engineering, and AI and automation roles.",
    stack: [],
    links: [{ href: "https://github.com/stutisingh22", label: "GitHub" }],
    hotspots: [
      { id: "notice", tip: "Who I am", x: 78, y: 52, title: "Who I am", body: "I turn fragmented, messy data into decisions people can trust — scraping, ETL, and LLM pipelines with a human in the loop. Based in Bengaluru." },
    ],
  },
  {
    id: "colosseum",
    name: "Colosseum",
    line: "Where the hardest contest was won",
    stamp: "The arena",
    journal: "Corporate Development Analyst in LH2’s Founder’s Office, December 2025 to July 2026. I designed and shipped a media-intelligence and CRM platform on my own: architecture, data infrastructure, and deployment. It mapped contacts across media organisations, scored influence, tracked syndication, unified outreach across team mailboxes, and raised an alert when a reply arrived. Syndication tracking held at 95–97%, against about 40% from general-purpose ChatGPT or Claude approaches. Hundreds of active contacts were coordinated across those mailboxes.",
    stack: ["Python", "PostgreSQL", "Scrapy", "Playwright", "OpenAI API", "Gmail API", "async workers"],
    links: [{ href: "https://github.com/stutisingh22/msn_straper_ext", label: "msn_straper_ext", note: "Syndication and traffic for one domain." }],
    hotspots: [
      { id: "duel", tip: "The contest", x: 32, y: 62, title: "The contest", body: "General-purpose ChatGPT/Claude approaches tracked syndication at ~40% accuracy. My pipeline hit 95–97%.", stat: "95–97% vs ~40%", duel: true },
      { id: "scroll", tip: "Shipped to production", x: 48, y: 36, title: "Built solo, shipped to prod", body: "An end-to-end media intelligence and CRM platform at LH2’s Founder’s Office: architecture, infrastructure, deployment." },
      { id: "messenger", tip: "Reply alerts", x: 74, y: 64, title: "Nothing slips", body: "Unified outreach across team mailboxes, with reply alerts for hundreds of active contacts.", stat: "Hundreds of contacts" },
    ],
  },
  {
    id: "aqueducts",
    name: "Aqueducts",
    line: "Bringing raw data into the city",
    stamp: "The water",
    journal: "The platform’s collection spanned hundreds of publications and sources, feeding PostgreSQL through Python ETL: ingestion, enrichment, deduplication, schema validation, and incremental sync. More than 10,000 records stayed under incremental sync. LLM classifiers with confidence scores turned articles, companies, and people into structured records. Manual research fell by about 70%.",
    stack: ["Scrapy", "BeautifulSoup", "Selenium", "Playwright", "PostgreSQL", "Pandas", "async Python"],
    links: [{ href: "https://github.com/stutisingh22/cloud_transfer", label: "cloud_transfer", note: "Drive, onward to S3 or SFTP." }],
    hotspots: [
      { id: "ingest", tip: "Ingest stage", x: 18, y: 48, title: "Pipelines that keep flowing", body: "Python ETL into PostgreSQL across hundreds of sources, with incremental sync.", stat: "10,000+ records" },
      { id: "clean", tip: "Clean stage", x: 34, y: 48, title: "Pipelines that keep flowing", body: "Python ETL into PostgreSQL across hundreds of sources, with incremental sync.", stat: "10,000+ records" },
      { id: "dedupe", tip: "Dedupe stage", x: 50, y: 48, title: "Pipelines that keep flowing", body: "Python ETL into PostgreSQL across hundreds of sources, with incremental sync.", stat: "10,000+ records" },
      { id: "validate", tip: "Validate stage", x: 66, y: 48, title: "Pipelines that keep flowing", body: "Python ETL into PostgreSQL across hundreds of sources, with incremental sync.", stat: "10,000+ records" },
      { id: "enrich", tip: "Enrich stage", x: 82, y: 48, title: "Pipelines that keep flowing", body: "Python ETL into PostgreSQL across hundreds of sources, with incremental sync.", stat: "10,000+ records" },
      { id: "water", tip: "Structured output", x: 88, y: 28, title: "Structured output", body: "LLM classifiers with confidence scores turned articles, companies, and people into queryable records." },
      { id: "worker", tip: "Less manual work", x: 16, y: 72, title: "Less manual work", body: "Automated collection and enrichment.", stat: "~70% less manual research" },
    ],
  },
  {
    id: "forum",
    name: "Roman Forum",
    line: "Where Rome kept records and made decisions",
    stamp: "The forum",
    journal: "Associate Consultant in the Chief of Staff Office at Wissen Technology, June 2024 to October 2025. I consolidated five or more years of raw historical data across major BFSI clients into one foundation: star-schema models, executive KPI frameworks, and Power BI dashboards governed across Dev, Staging, and Prod. Hiring-demand forecasts, recruitment experiments, and anomaly alerts sat on that foundation. Manual reporting errors fell by about 90%. The functions covered were HR, Sales, Finance, and Talent Acquisition.",
    stack: ["Python", "Pandas", "SQL", "Power BI", "DAX", "Star schema", "Power Automate", "Zoho Recruit"],
    links: [],
    hotspots: [
      { id: "hr", tip: "HR column", x: 28, y: 58, title: "The analytics backbone", body: "Consolidated 5+ years of BFSI client data into one foundation for an executive office.", stat: "5+ years", chart: [40, 70, 55] },
      { id: "sales", tip: "Sales column", x: 43, y: 58, title: "The analytics backbone", body: "Consolidated 5+ years of BFSI client data into one foundation for an executive office.", stat: "5+ years", chart: [30, 80, 60] },
      { id: "finance", tip: "Finance column", x: 58, y: 58, title: "The analytics backbone", body: "Consolidated 5+ years of BFSI client data into one foundation for an executive office.", stat: "5+ years", chart: [50, 45, 75] },
      { id: "ta", tip: "Talent column", x: 73, y: 58, title: "The analytics backbone", body: "Consolidated 5+ years of BFSI client data into one foundation for an executive office.", stat: "5+ years", chart: [65, 35, 50] },
      { id: "roof", tip: "Executive KPIs", x: 50, y: 22, title: "Dashboards, governed", body: "Star-schema models and Power BI dashboards across Dev, Staging, and Prod.", stat: "~90% fewer reporting errors" },
      { id: "bell", tip: "Anomaly alerts", x: 84, y: 40, title: "Automated alerts", body: "Anomaly detection that flags operational issues before anyone has to ask." },
    ],
  },
  {
    id: "pantheon",
    name: "Pantheon",
    line: "Sound engineering under the dome",
    stamp: "The dome",
    journal: "A research-driven CRM turns raw prospect data into account intelligence. It resolves parent and subsidiary relationships, normalises domains, and dedupes against accounts already on the book. Classification sits inside a deterministic layer: under the confidence threshold a record goes to a person. Overrides, decision metadata, and reversible actions mean the model cannot silently change the CRM. The service is FastAPI, with JWT and role checks, and shared async adapters for Gmail, Drive, Notion, and SignalHire.",
    stack: ["FastAPI", "SQLAlchemy", "PostgreSQL", "JWT", "RBAC", "Gmail", "Google Drive", "Notion"],
    links: [{ href: "https://github.com/stutisingh22/woodpecker-hubspot-bridge", label: "woodpecker-hubspot-bridge", note: "A bridge between two CRMs." }],
    hotspots: [
      { id: "oculus", tip: "Review queue", x: 50, y: 28, title: "Humans hold the final say", body: "Low-confidence AI decisions drop into a review queue instead of changing data.", fall: true },
      { id: "ring", tip: "Rules first", x: 50, y: 48, title: "Deterministic first", body: "Rules and thresholds wrap the AI classifier. Overrides are logged and every action is reversible." },
      { id: "doors", tip: "Shared adapters", x: 50, y: 70, title: "Integrations", body: "FastAPI with JWT + RBAC, plus Gmail, Drive, Notion, and SignalHire through shared async adapters." },
    ],
  },
  {
    id: "circus",
    name: "Circus Maximus",
    line: "Ranking contenders, fast",
    stamp: "The track",
    journal: "An automated pipeline scores leads against explicit criteria, including funding stage and founder background, and ranks them for outreach. A two-phase async batch handles about 10,000 websites, with robots.txt compliance, retries, and checkpointing, so an interrupted run resumes. A full run takes 15–25 minutes. Rules take the clear cases, and only ambiguous ones reach a model, which cut LLM cost by about 70%. Every tier carries an explanation. An unresolved signal stays unknown.",
    stack: ["Python asyncio", "batch pipelines", "caching", "rule engine", "LLM fallback"],
    links: [{ href: "https://github.com/stutisingh22/leadQautomation", label: "leadQautomation", note: "A score that refuses a guess." }],
    hotspots: [
      { id: "start", tip: "Start the race", x: 18, y: 34, title: "10,000 sites, one run", body: "Async two-phase batch with checkpointing, so interrupted runs resume where they stopped.", stat: "15–25 min per run", race: true },
      { id: "hot", tip: "Why this tier", x: 30, y: 62, title: "Why this tier?", body: "Hot. The written criteria matched. Unresolved signals are marked unknown, never guessed." },
      { id: "warm", tip: "Why this tier", x: 46, y: 62, title: "Why this tier?", body: "Warm. One criterion matched and another was partial. Unknown signals stay unknown." },
      { id: "cold", tip: "Why this tier", x: 62, y: 62, title: "Why this tier?", body: "Cold. The written criteria missed. No score was invented to pull it up." },
      { id: "unknown", tip: "Why this tier", x: 78, y: 62, title: "Why this tier?", body: "Unknown. A required signal never arrived, so the tier says so." },
      { id: "purse", tip: "Lower model cost", x: 86, y: 70, title: "Cheaper by design", body: "Rules score the clear cases; only ambiguous ones reach the LLM.", stat: "~70% lower LLM cost" },
    ],
  },
  {
    id: "vatican",
    name: "Vatican Archives",
    line: "Every record, catalogued and traceable",
    stamp: "The archive",
    journal: "A Python system inventories 1–2 TB of unstructured data across local files, Google Drive, Gmail, and Git into one schema, tracks lineage, and segments it to scope potentially licensable training data. Discovery, extraction, and classification checkpoint on their own, so a long run resumes. PII is flagged at ingestion, before anything leaves. The deliverable is auditable Excel: masters, category files, and rollups, with confidence, rationale, and evidence kept on each record.",
    stack: ["Python", "worker pools", "retry and backoff", "PII detection", "openpyxl"],
    links: [
      { href: "https://github.com/stutisingh22/inventory_segmentor", label: "inventory_segmentor", note: "A messy corpus, sorted." },
      { href: "https://github.com/stutisingh22/pii_redactor", label: "pii_redactor", note: "Face-aware masking, with a browser workspace." },
      { href: "https://github.com/stutisingh22/pii-removal", label: "pii-removal", note: "Identity lifted out of lab PDFs." },
      { href: "https://github.com/stutisingh22/output-redactor", label: "output-redactor", note: "Stable tokens across a folder." },
    ],
    hotspots: [
      { id: "shelves", tip: "One schema", x: 36, y: 40, title: "Terabytes, one schema", body: "Local files, Drive, Gmail, and Git inventoried into one schema to scope licensable AI training data.", stat: "1–2 TB" },
      { id: "sealed", tip: "PII held back", x: 22, y: 58, title: "PII held back", body: "Sensitive material is flagged during ingestion, before anything leaves." },
      { id: "ledger", tip: "Auditable output", x: 78, y: 62, title: "Auditable output", body: "Excel deliverables in which each record carries its confidence, rationale, and evidence." },
    ],
  },
  {
    id: "bocca",
    name: "Bocca della Verità",
    line: "Put your hand in. It only bites liars.",
    stamp: "The mouth",
    journal: "Five rules, drawn from the work rather than from a slogan. Unknown beats invented: a missing signal stays unknown. Deterministic first, and a model only after. Confidence, rationale, and evidence travel with the record. A person decides anything uncertain, and the action can be reversed. Long jobs are checkpointed, so they resume instead of starting over.",
    stack: [],
    links: [],
    principles: [
      "Unknown beats invented.",
      "Deterministic first, LLM second.",
      "Confidence is part of the output.",
      "Humans decide anything uncertain.",
      "Resume, don’t restart.",
    ],
    hotspots: [
      { id: "mouth", tip: "The mouth", x: 50, y: 62, title: "The mouth", body: "Unknown beats invented.", mouth: true },
    ],
  },
  {
    id: "capitoline",
    name: "Capitoline Hill",
    line: "Where strategy is studied",
    stamp: "The hill",
    journal: "Research Associate at IIM Bangalore since February 2026. The work is empirical research on entrepreneurial leadership and strategic decisions under competition: quantitative and econometric models of how firms trade research spending against marketing and advertising, and frameworks for market agility. It is in progress. Nothing on this hill is a published finding.",
    stack: ["Econometrics", "statistical modelling", "Python"],
    links: [],
    hotspots: [
      { id: "statue", tip: "Open book", x: 48, y: 42, title: "Research Associate, IIMB", body: "Empirical research on entrepreneurial leadership and strategic decisions under competition. Ongoing since Feb 2026." },
      { id: "scales", tip: "The trade-off", x: 68, y: 58, title: "R&D versus marketing", body: "Econometric models of how firms trade off R&D against marketing and ad spend. No findings are shown." },
    ],
  },
  {
    id: "steps",
    name: "Spanish Steps",
    line: "A climb, one step at a time",
    stamp: "The steps",
    journal: "The climb, oldest at the bottom. Mount Carmel College, Bengaluru: B.Sc. Economics and Statistics, 2021–2024. NSRCEL at IIM Bangalore, program intern, September 2023 to February 2024: 80 or more startup applications, factor and cluster analysis, 20 or more founder interviews, and a dataset of 700 or more alumni ventures across seven years. Wissen, then LH2, then the research post at IIM Bangalore.",
    stack: [],
    links: [],
    landings: [
      { title: "Mount Carmel", body: "B.Sc. Economics and Statistics, Bengaluru, 2021–2024." },
      { title: "NSRCEL", body: "Program intern at IIM Bangalore, Sep 2023–Feb 2024." },
      { title: "Wissen", body: "Associate consultant, Chief of Staff Office, Jun 2024–Oct 2025." },
      { title: "LH2 Holdings", body: "Corporate development analyst, Founder’s Office, Dec 2025–Jul 2026." },
      { title: "IIM Bangalore", body: "Research associate on market agility, since Feb 2026." },
    ],
    hotspots: [
      { id: "climb", tip: "The climb", x: 50, y: 55, title: "Mount Carmel", body: "B.Sc. Economics and Statistics, Bengaluru, 2021–2024.", climb: true },
      { id: "pots", tip: "Alumni ventures", x: 22, y: 34, title: "700+ ventures", body: "Built a 7-year dataset of alumni ventures; analysed 80+ applications with factor and cluster analysis.", stat: "700+ ventures" },
    ],
  },
  {
    id: "market",
    name: "Campo de' Fiori",
    line: "Browse the stalls",
    stamp: "The market",
    journal: "The stalls are the toolkit: analysis and statistics, data engineering, business intelligence, AI and automation, and collection. Click a chip on the stall and the map marks every stop where that tool was used. The public repositories are linked from the stops they belong to, not piled here.",
    stack: [],
    links: [],
    stalls: {
      Analysis: [["Python", ["forum", "steps", "capitoline"]], ["Pandas", ["aqueducts", "forum"]], ["SQL", ["forum", "pantheon"]], ["Factor analysis", ["steps"]], ["Forecasting", ["forum"]], ["A/B testing", ["forum"]]],
      Engineering: [["PostgreSQL", ["colosseum", "aqueducts", "pantheon"]], ["ETL", ["aqueducts", "vatican"]], ["Star schema", ["forum"]], ["Dedup", ["pantheon", "circus"]]],
      BI: [["Power BI", ["forum"]], ["DAX", ["forum"]], ["KPI frameworks", ["forum"]]],
      "AI & Automation": [["OpenAI API", ["colosseum", "aqueducts", "pantheon", "circus"]], ["Confidence scoring", ["aqueducts", "pantheon", "circus", "vatican"]], ["Human in the loop", ["pantheon", "bocca"]], ["FastAPI", ["pantheon"]]],
      Collection: [["Scrapy", ["colosseum", "aqueducts"]], ["Playwright", ["colosseum", "aqueducts"]], ["Gmail API", ["colosseum", "pantheon"]], ["Notion", ["pantheon"]]],
    },
    hotspots: [
      { id: "stall-analysis", tip: "Analysis stall", x: 14, y: 42, stall: "Analysis", title: "Analysis", body: "Open a chip to see where it was used." },
      { id: "stall-eng", tip: "Engineering stall", x: 32, y: 42, stall: "Engineering", title: "Data engineering", body: "Open a chip to see where it was used." },
      { id: "stall-bi", tip: "BI stall", x: 50, y: 42, stall: "BI", title: "Business intelligence", body: "Open a chip to see where it was used." },
      { id: "stall-ai", tip: "Automation stall", x: 68, y: 42, stall: "AI & Automation", title: "AI and automation", body: "Open a chip to see where it was used." },
      { id: "stall-collect", tip: "Collection stall", x: 86, y: 42, stall: "Collection", title: "Collection", body: "Open a chip to see where it was used." },
    ],
  },
  {
    id: "trevi",
    name: "Trevi Fountain",
    line: "Toss a coin and you’ll return",
    stamp: "The fountain",
    journal: "Open to data analyst, analytics engineering, and AI and automation roles. Based in Bengaluru. The coin is the introduction. The résumé, without the street, is one click away. Client names, internal records, and anything still private stay off this walk.",
    stack: [],
    links: [
      { href: "mailto:stutisingh22@icloud.com", label: "stutisingh22@icloud.com" },
      { href: "https://github.com/stutisingh22", label: "GitHub" },
    ],
    hotspots: [
      { id: "coin", tip: "Toss a coin", x: 50, y: 72, title: "Let’s work together", body: "Open to analyst, analytics engineering, and automation roles. Based in Bengaluru.", coin: true },
    ],
  },
];

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduce) document.body.classList.add("quiet");

const world = document.querySelector("#world");
const sky = document.querySelector("#sky");
const grade = document.querySelector("#grade");
const layerSky = document.querySelector("#layer-skyline");
const layerMarks = document.querySelector("#layer-marks");
const layerStreet = document.querySelector("#layer-street");
const layerWalker = document.querySelector("#layer-walker");
const layerProps = document.querySelector("#layer-props");
const walker = document.querySelector("#walker");
const label = document.querySelector("#label");
const labelName = document.querySelector("#label-name");
const labelLine = document.querySelector("#label-line");
const card = document.querySelector("#card");
const cardTitle = document.querySelector("#card-title");
const cardBody = document.querySelector("#card-body");
const cardStat = document.querySelector("#card-stat");
const cardExtra = document.querySelector("#card-extra");
const hint = document.querySelector("#hint");
const journal = document.querySelector("#journal");
const mapEl = document.querySelector("#map");
const passport = document.querySelector("#passport");

let x = 0;
let v = 0;
let glide = null;
let gateOpen = false;
let moved = false;
let mouthN = 0;
let landing = 0;
let at = -1;
let cardStop = 0;
let drag = null;
let soundOn = false;
let audioCtx = null;
let ambient = null;
let passportShown = false;
const keys = new Set();
const principleHold = stops.find((s) => s.id === "bocca").principles;

function loadStamps() {
  try {
    return new Set(JSON.parse(localStorage.getItem("rome-stamps") || "[]"));
  } catch {
    return new Set();
  }
}
const stamps = loadStamps();
function saveStamps() {
  try {
    localStorage.setItem("rome-stamps", JSON.stringify([...stamps]));
  } catch { /* private mode */ }
}
try {
  if (localStorage.getItem("rome-hint") === "1") {
    moved = true;
    hint.classList.add("gone");
  }
} catch { /* ignore */ }

function words(s) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function stopX(i) {
  return (i + 0.42) * innerWidth;
}
function endX() {
  return stopX(stops.length - 1);
}
function nearestIndex(pos) {
  let best = 0;
  let dist = Infinity;
  stops.forEach((_, i) => {
    const d = Math.abs(pos - stopX(i));
    if (d < dist) {
      dist = d;
      best = i;
    }
  });
  return best;
}

function buildWorld() {
  stops.forEach((stop, i) => {
    const mark = document.createElement("div");
    mark.className = "mark";
    mark.id = "mark-" + stop.id;
    mark.innerHTML = `<img alt="" data-src="art/${stop.id}/landmark.webp" data-i="${i}">`;
    if (stop.id === "porta") {
      mark.insertAdjacentHTML("beforeend", `<div class="doors" id="doors"><button type="button" class="door l" aria-label="Open the gate"></button><button type="button" class="door r" aria-label="Open the gate"></button></div><div class="birds"><i></i><i></i><i></i></div>`);
    }
    if (stop.id === "aqueducts" || stop.id === "trevi") {
      mark.insertAdjacentHTML("beforeend", `<div class="water"></div>`);
    }
    if (stop.id === "trevi") {
      mark.insertAdjacentHTML("beforeend", `<i class="glow" style="left:8%;top:30%"></i><i class="glow" style="right:8%;top:34%"></i>`);
    }
    if (stop.id === "forum") {
      mark.insertAdjacentHTML("beforeend", `<i class="leaf" style="left:10%;top:20%"></i><i class="leaf" style="left:70%;top:10%"></i>`);
    }
    if (stop.id === "colosseum") {
      mark.insertAdjacentHTML("beforeend", `<div class="duel" aria-hidden="true"><i style="--v:40"></i><i style="--v:96"></i></div>`);
    }
    if (stop.id === "circus") {
      mark.insertAdjacentHTML("beforeend", `<div class="race" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`);
    }
    stop.hotspots.forEach((hot) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hot";
      b.dataset.tip = hot.tip;
      b.setAttribute("aria-label", hot.tip);
      b.style.left = hot.x + "%";
      b.style.top = hot.y + "%";
      b.tabIndex = -1;
      b.addEventListener("click", (event) => {
        event.stopPropagation();
        activate(stop, hot, b);
      });
      hot.button = b;
      mark.append(b);
    });
    layerMarks.append(mark);
    stop.el = mark;

    const prop = document.createElement("div");
    prop.className = "prop";
    prop.innerHTML = `<img alt="" data-src="art/${stop.id}/props.webp" data-i="${i}">`;
    layerProps.append(prop);
    stop.prop = prop;
  });
  const skyImg = layerSky.querySelector("img");
  skyImg.dataset.keep = "1";
}

function loadNear(index) {
  document.querySelectorAll("img[data-src]").forEach((img) => {
    if (img.dataset.keep) return;
    const n = Number(img.dataset.i);
    if (Math.abs(n - index) <= 2 && !img.getAttribute("src")) img.src = img.dataset.src;
  });
}

function layout() {
  const w = innerWidth;
  const worldWidth = (stops.length + 0.35) * w;
  layerStreet.style.width = worldWidth + "px";
  layerSky.querySelector("img").style.width = worldWidth * 0.55 + "px";
  stops.forEach((stop, i) => {
    const s = stopX(i);
    const cam = s - w * 0.36;
    stop.el.style.left = w * 0.18 + 0.6 * cam + "px";
    stop.el.style.width = Math.min(620, w * 0.64) + "px";
    stop.prop.style.left = w * 0.72 + 1.3 * cam + "px";
  });
  x = Math.min(endX(), Math.max(stopX(0), x || stopX(0)));
  paint();
}

function paint() {
  const cam = x - innerWidth * 0.36;
  const day = stops.length < 2 ? 0 : x / endX();
  layerSky.style.transform = `translate3d(${-cam * 0.2}px,0,0)`;
  layerMarks.style.transform = `translate3d(${-cam * 0.6}px,0,0)`;
  layerStreet.style.transform = `translate3d(${-cam}px,0,0)`;
  layerWalker.style.transform = `translate3d(${-cam}px,0,0)`;
  layerProps.style.transform = `translate3d(${-cam * 1.3}px,0,0)`;
  walker.style.left = x + "px";
  const dusk = Math.max(0, (day - 0.55) / 0.45) * 0.38;
  grade.style.setProperty("--dusk", dusk.toFixed(3));
  grade.style.setProperty("--lamp", (day > 0.72 ? (day - 0.72) / 0.28 : 0).toFixed(3));
  sky.style.background = day < 0.45
    ? "linear-gradient(#f6c7a4, #f4e2c8 62%, #e7c89a)"
    : day < 0.72
      ? "linear-gradient(#f0b56a, #f6d7a8 60%, #e8c28a)"
      : "linear-gradient(#2a3148, #6a4a55 55%, #c47a4a)";
  document.body.classList.toggle("dusk", day > 0.72);
  const i = nearestIndex(x);
  loadNear(i);
  const mark = stops[i].el.getBoundingClientRect();
  label.style.left = mark.left + mark.width * 0.5 + "px";
  label.style.top = Math.max(64, mark.top + 8) + "px";
  label.style.transform = "translateX(-50%)";
}

function updateState() {
  try { updateStateBody(); }
  catch (error) { document.title = "ERR " + error.message; }
}
function updateStateBody() {
  const i = nearestIndex(x);
  const dist = Math.abs(x - stopX(i));
  const parked = dist < 36 && Math.abs(v) < 50 && glide === null;
  const near = dist < innerWidth * 0.2;
  document.body.classList.toggle("at-stop", parked);
  label.hidden = !near;
  if (labelName.textContent !== stops[i].name) {
    labelName.textContent = stops[i].name;
    labelLine.textContent = stops[i].line;
  }
  stops.forEach((stop, n) => {
    const on = parked && n === i;
    stop.el.classList.toggle("here", on);
    stop.hotspots.forEach((hot) => {
      hot.button.tabIndex = on ? 0 : -1;
    });
  });
  if (parked && at !== i) {
    at = i;
    award(i);
    if (i === 0) document.querySelector("#mark-porta")?.classList.toggle("scatter", false);
  }
  if (!parked) at = -1;
  if (parked && i === 0 && Math.abs(v) > 40) document.querySelector("#mark-porta")?.classList.add("scatter");
  const dots = document.querySelector("#stamp-dots");
  dots.innerHTML = stops.map((s) => `<i class="${stamps.has(s.id) ? "on" : ""}"></i>`).join("");
  const count = document.querySelector("#stamp-count");
  count.textContent = stamps.size + "/12";
  count.setAttribute("aria-label", stamps.size + " of 12 stamps");
  document.querySelectorAll("#map-pins button").forEach((btn, n) => {
    btn.classList.toggle("visited", stamps.has(stops[n].id));
    btn.setAttribute("aria-current", n === i ? "true" : "false");
  });
  walker.classList.toggle("walk", Math.abs(v) > 30 && !reduce);
  if (v < -30) walker.classList.add("left");
  if (v > 30) walker.classList.remove("left");
}

function award(i) {
  const id = stops[i].id;
  const fresh = !stamps.has(id);
  if (fresh) {
    stamps.add(id);
    saveStamps();
  }
  if (id === "trevi" && stamps.size === 12 && !passportShown) {
    passportShown = true;
    showPassport();
  }
}

function showPassport() {
  document.querySelector("#passport-list").textContent = stops.map((s) => s.stamp).join(" · ");
  passport.hidden = false;
}

function activate(stop, hot) {
  cardStop = stops.indexOf(stop);
  if (hot.duel) return runDuel(stop, hot);
  if (hot.race) return runRace(stop, hot);
  if (hot.fall) return dropRecord(stop, hot);
  if (hot.mouth) return bite(stop, hot);
  if (hot.climb) return climb(stop, hot);
  if (hot.coin) return toss(stop, hot);
  if (hot.stall) return openStall(stop, hot);
  openCard(hot);
}

function openCard(hot) {
  cardTitle.textContent = hot.title;
  cardBody.textContent = hot.body;
  cardStat.hidden = !hot.stat;
  cardStat.textContent = hot.stat || "";
  cardExtra.innerHTML = "";
  if (hot.chart) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 120 36");
    svg.setAttribute("class", "chart");
    svg.setAttribute("aria-label", "Sample chart, not a client figure");
    hot.chart.forEach((h, n) => {
      const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("x", 8 + n * 38);
      r.setAttribute("y", 36 - h * 0.32);
      r.setAttribute("width", 24);
      r.setAttribute("height", h * 0.32);
      r.setAttribute("fill", "#c45132");
      svg.append(r);
    });
    cardExtra.append(svg);
  }
  if (hot.links) renderLinks(hot.links);
  card.hidden = false;
  const btn = hot.button;
  if (!btn) return;
  requestAnimationFrame(() => {
    if (innerWidth <= 700) return;
    const r = btn.getBoundingClientRect();
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    let left = r.right + 10;
    if (left + w > innerWidth - 8) left = Math.max(8, r.left - w - 10);
    let top = Math.min(Math.max(60, r.top), innerHeight - h - 56);
    card.style.left = left + "px";
    card.style.top = top + "px";
  });
}

function renderLinks(links) {
  const row = document.createElement("p");
  links.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.label;
    row.append(a, " ");
  });
  cardExtra.append(row);
}

function closeCard() {
  card.hidden = true;
}

function runDuel(stop, hot) {
  stop.el.classList.add("dueling");
  const wait = reduce ? 0 : 2000;
  setTimeout(() => openCard(hot), wait);
}

function runRace(stop, hot) {
  stop.el.classList.add("racing");
  const wait = reduce ? 0 : 5000;
  setTimeout(() => openCard(hot), wait);
}

function dropRecord(stop, hot) {
  const bit = document.createElement("i");
  bit.className = "record";
  bit.style.left = "46%";
  bit.style.top = "20%";
  stop.el.append(bit);
  setTimeout(() => {
    bit.remove();
    openCard(hot);
  }, reduce ? 0 : 800);
}

function bite(stop, hot) {
  const line = principleHold[mouthN % principleHold.length];
  mouthN += 1;
  if (mouthN >= principleHold.length) stop.el.classList.add("chomp");
  openCard({ ...hot, body: line, button: hot.button });
}

function climb(stop, hot) {
  const step = stop.landings[landing % stop.landings.length];
  landing += 1;
  if (!reduce) stop.el.style.translate = `0 ${-(landing % 5) * 18}px`;
  openCard({ ...hot, title: step.title, body: step.body, button: hot.button });
}

function toss(stop, hot) {
  const coin = document.createElement("i");
  coin.className = "coin";
  coin.textContent = "●";
  const from = walker.getBoundingClientRect();
  const to = hot.button.getBoundingClientRect();
  coin.style.left = from.left + "px";
  coin.style.top = from.top + "px";
  document.body.append(coin);
  const dx = to.left - from.left;
  const dy = to.top - from.top;
  coin.animate(
    [
      { transform: "translate(0,0)" },
      { transform: `translate(${dx * 0.5}px, ${dy - 70}px)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px)` },
    ],
    { duration: reduce ? 0 : 700, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" }
  ).finished.then(() => {
    coin.remove();
    openCard({ ...hot, links: stop.links, button: hot.button });
  });
}

function openStall(stop, hot) {
  openCard(hot);
  const chips = document.createElement("div");
  chips.className = "chips";
  stop.stalls[hot.stall].forEach(([name, ids]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = name;
    b.addEventListener("click", () => {
      chips.querySelectorAll("button").forEach((el) => el.classList.remove("chip-on"));
      b.classList.add("chip-on");
      const names = ids.map((id) => stops.find((s) => s.id === id).name);
      cardBody.textContent = "Used at: " + names.join(", ");
      document.querySelectorAll("#map-pins button").forEach((pin) => {
        pin.classList.toggle("lit", ids.includes(pin.dataset.id));
      });
    });
    chips.append(b);
  });
  cardExtra.prepend(chips);
}

function openJournal(index) {
  closeCard();
  journal.hidden = false;
  requestAnimationFrame(() => journal.classList.add("open"));
  [...document.querySelectorAll("#journal-tabs button")].forEach((btn, n) => {
    btn.setAttribute("aria-selected", n === index ? "true" : "false");
  });
  const stop = stops[index];
  const body = document.querySelector("#journal-body");
  body.innerHTML = "";
  const h = document.createElement("h3");
  h.textContent = stop.name;
  const p = document.createElement("p");
  p.textContent = stop.journal;
  body.append(h, p);
  if (stop.stack.length) {
    const ul = document.createElement("ul");
    ul.className = "stack";
    stop.stack.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.append(li);
    });
    body.append(ul);
  }
  stop.links.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.note ? `${link.label} — ${link.note}` : link.label;
    const line = document.createElement("p");
    line.append(a);
    body.append(line);
  });
}

function closeJournal() {
  journal.classList.remove("open");
  setTimeout(() => { journal.hidden = true; }, reduce ? 0 : 350);
}

function buildJournal() {
  const tabs = document.querySelector("#journal-tabs");
  stops.forEach((stop, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = stop.name;
    b.setAttribute("role", "tab");
    b.addEventListener("click", () => openJournal(i));
    tabs.append(b);
  });
}

function buildMap() {
  const route = document.querySelector("#map-route");
  const pins = document.querySelector("#map-pins");
  const len = route.getTotalLength();
  stops.forEach((stop, i) => {
    const p = route.getPointAtLength((i / (stops.length - 1)) * len);
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.id = stop.id;
    b.setAttribute("aria-label", stop.name);
    b.style.left = (p.x / 280) * 100 + "%";
    b.style.top = (p.y / 160) * 100 + "%";
    b.addEventListener("click", () => {
      go(i);
      mapEl.hidden = true;
    });
    pins.append(b);
  });
  pins.style.position = "absolute";
  pins.style.inset = "2.2rem 0.6rem 0.6rem";
  pins.style.height = "auto";
}

function buildResume() {
  const root = document.querySelector("#resume");
  const intro = document.createElement("h2");
  intro.textContent = "Stuti Singh";
  const role = document.createElement("p");
  role.textContent = "Data analyst and AI automation engineer, Bengaluru.";
  root.append(intro, role);
  stops.forEach((stop) => {
    const section = document.createElement("section");
    const img = document.createElement("img");
    img.src = `art/${stop.id}/landmark.webp`;
    img.alt = stop.name;
    const h = document.createElement("h3");
    h.textContent = stop.name;
    const roman = document.createElement("p");
    roman.textContent = stop.line;
    const p = document.createElement("p");
    p.textContent = stop.journal;
    section.append(img, h, roman, p);
    root.append(section);
  });
  const mail = document.createElement("p");
  const a = document.createElement("a");
  a.href = "mailto:stutisingh22@icloud.com";
  a.textContent = "stutisingh22@icloud.com";
  mail.append(a);
  root.append(mail);
}

function showResume(on) {
  document.body.classList.toggle("resume", on);
  document.body.classList.toggle("play", !on);
  if (on) closeJournal();
  document.querySelector("#resume-btn").textContent = on ? "Back to the walk" : "Résumé";
  if (on) location.hash = "resume";
  else if (location.hash === "#resume") history.replaceState(null, "", location.pathname);
}

function go(i) {
  const dest = stopX(Math.max(0, Math.min(stops.length - 1, i)));
  if (i > 0) openGate();
  if (reduce) {
    world.style.opacity = "0";
    setTimeout(() => {
      x = dest;
      v = 0;
      glide = null;
      paint();
      updateState();
      world.style.opacity = "1";
    }, 160);
    return;
  }
  glide = dest;
  v = 0;
}

function openGate() {
  if (gateOpen) return;
  gateOpen = true;
  document.querySelector("#mark-porta")?.classList.add("open");
}

function clampX(value) {
  const max = gateOpen ? endX() : stopX(0);
  return Math.max(stopX(0), Math.min(max, value));
}

function noteMove() {
  if (moved) return;
  moved = true;
  hint.classList.add("gone");
  try { localStorage.setItem("rome-hint", "1"); } catch { /* ignore */ }
}

document.querySelector("#doors")?.addEventListener("click", () => openGate());

document.querySelector("#card-close").addEventListener("click", closeCard);
document.querySelector("#card-more").addEventListener("click", () => openJournal(cardStop));
document.querySelector("#journal-close").addEventListener("click", closeJournal);
document.querySelector("#journal-btn").addEventListener("click", () => openJournal(Math.max(0, at)));
document.querySelector("#map-btn").addEventListener("click", () => { mapEl.hidden = !mapEl.hidden; });
document.querySelector("#map-close").addEventListener("click", () => { mapEl.hidden = true; });
document.querySelector("#resume-btn").addEventListener("click", () => showResume(!document.body.classList.contains("resume")));
document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  showResume(true);
});
document.querySelector("#walk-again").addEventListener("click", () => {
  passport.hidden = true;
  passportShown = true;
  gateOpen = false;
  document.querySelector("#mark-porta")?.classList.remove("open");
  x = stopX(0);
  v = 0;
  glide = null;
  showResume(false);
});
document.querySelector("#go-left").addEventListener("pointerdown", () => keys.add("arrowleft"));
document.querySelector("#go-right").addEventListener("pointerdown", () => {
  openGate();
  keys.add("arrowright");
});
addEventListener("pointerup", () => {
  keys.delete("arrowleft");
  keys.delete("arrowright");
});

addEventListener("keydown", (event) => {
  if (event.target.closest("input, textarea")) return;
  if (event.key === "Escape") {
    closeCard();
    closeJournal();
    mapEl.hidden = true;
    passport.hidden = true;
    return;
  }
  const k = event.key.toLowerCase();
  if (k === "arrowright" || k === "d" || k === "arrowleft" || k === "a") {
    if (document.body.classList.contains("resume")) return;
    event.preventDefault();
    if (reduce) {
      if (event.repeat) return;
      const i = nearestIndex(x);
      go(i + (k === "arrowleft" || k === "a" ? -1 : 1));
      return;
    }
    if (k === "arrowright" || k === "d") openGate();
    keys.add(k === "d" ? "arrowright" : k === "a" ? "arrowleft" : k);
    noteMove();
  }
});
addEventListener("keyup", (event) => {
  const k = event.key.toLowerCase();
  keys.delete(k === "d" ? "arrowright" : k === "a" ? "arrowleft" : k);
});

addEventListener("wheel", (event) => {
  if (document.body.classList.contains("resume") || event.target.closest("#journal, #card, #resume, #map")) return;
  event.preventDefault();
  if (reduce) {
    if (Math.abs(event.deltaY) < 8) return;
    go(nearestIndex(x) + (event.deltaY > 0 ? 1 : -1));
    return;
  }
  if (event.deltaY > 0) openGate();
  const max = innerWidth * 0.7;
  v = Math.max(-max, Math.min(max, v + event.deltaY * 1.1));
  noteMove();
}, { passive: false });

world.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button, a")) return;
  closeCard();
  if (document.body.classList.contains("resume")) return;
  drag = { x: event.clientX, origin: x, t: performance.now() };
  glide = null;
});
world.addEventListener("pointermove", (event) => {
  if (!drag || reduce) return;
  const next = clampX(drag.origin + (drag.x - event.clientX) * 1.2);
  const dt = Math.max(16, performance.now() - drag.t);
  v = ((next - x) / dt) * 1000;
  x = next;
  drag.t = performance.now();
  if (next > stopX(0) + 8) openGate();
  noteMove();
});
addEventListener("pointerup", (event) => {
  if (!drag) return;
  if (reduce && Math.abs(event.clientX - drag.x) > 36) {
    go(nearestIndex(x) + (event.clientX < drag.x ? 1 : -1));
  }
  drag = null;
});

document.querySelector("#mute").addEventListener("click", () => {
  soundOn = !soundOn;
  const btn = document.querySelector("#mute");
  btn.setAttribute("aria-pressed", String(soundOn));
  btn.setAttribute("aria-label", soundOn ? "Sound on" : "Sound off");
  btn.textContent = soundOn ? "🔊" : "🔇";
  if (soundOn) {
    audioCtx = audioCtx || new AudioContext();
    audioCtx.resume();
    if (!ambient) {
      ambient = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      ambient.frequency.value = 110;
      gain.gain.value = 0.012;
      ambient.connect(gain);
      gain.connect(audioCtx.destination);
      ambient.start();
    }
  } else if (ambient) {
    ambient.stop();
    ambient = null;
  }
});

function blip() {
  if (!soundOn || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = nearestIndex(x) === stops.length - 1 ? 420 : 160;
  gain.gain.value = 0.03;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  osc.stop(audioCtx.currentTime + 0.09);
}

let lastStep = 0;
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.034, (now - last) / 1000);
  last = now;
  if (!document.body.classList.contains("resume") && !reduce) {
    const max = innerWidth * 0.55;
    let dir = 0;
    if (keys.has("arrowright")) dir += 1;
    if (keys.has("arrowleft")) dir -= 1;
    if (glide !== null && dir === 0 && !drag) {
      const gap = glide - x;
      const step = Math.min(Math.abs(gap), dt * innerWidth * 1.6);
      x += Math.sign(gap) * step;
      if (Math.abs(gap) < 3) {
        x = glide;
        glide = null;
        v = 0;
      }
    } else if (!drag) {
      if (dir) glide = null;
      if (dir) {
        const target = dir * max;
        const delta = Math.min(max / 0.3 * dt, Math.abs(target - v));
        v += Math.sign(target - v) * delta;
      } else {
        v *= Math.exp(-dt * 2.1);
        if (Math.abs(v) < 12) v = 0;
        const i = nearestIndex(x);
        if (Math.abs(x - stopX(i)) < innerWidth * 0.14 && Math.abs(v) < innerWidth * 0.2) {
          x += (stopX(i) - x) * (1 - Math.exp(-dt * 7));
        }
      }
      x = clampX(x + v * dt);
    }
    if (Math.abs(v) > 40 && now - lastStep > 280) {
      lastStep = now;
      blip();
    }
  }
  paint();
  updateState();
  requestAnimationFrame(frame);
}

buildWorld();
buildJournal();
buildMap();
buildResume();
x = stopX(0);
layout();
addEventListener("resize", layout);
if (location.hash === "#resume") showResume(true);
requestAnimationFrame(frame);

document.querySelector("#doors") && document.querySelectorAll("#doors button").forEach((btn) => {
  btn.addEventListener("click", () => openGate());
});
