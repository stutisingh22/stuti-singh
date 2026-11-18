/* ==========================================================================
   data.js — ALL copy and stop configuration lives here. Nothing else.
   Text budgets are enforced by `node scripts/check-copy.js`:
     labelLine  ≤ 10 words      hotspot.tip   ≤ 4 words
     card title ≤ 6 words       card body     ≤ 35 words
     journal    ≤ 120 words
   Voice: first person, plain words, the concrete thing + the result.
   Every claim here comes from the résumé. Don't add numbers that aren't in it.
   ========================================================================== */
window.Rome = window.Rome || {};

Rome.PERSON = {
  name: 'Stuti Singh',
  role: 'Data Analyst · AI & Automation Engineer',
  pitch: 'I build the pipelines that turn messy web, inbox and business data into tools teams actually use.',
  summary: 'I’m a data analyst who builds the systems behind the analysis: scrapers, ETL pipelines, dashboards, and LLM workflows with guardrails. At Wissen I turned five years of scattered BFSI data into one trusted analytics layer. At LH2 I built a media intelligence and CRM platform on my own, end to end. Now I research strategic decision-making at IIM Bangalore.',
  email: 'stutisingh22@icloud.com',
  github: 'https://github.com/stutisingh22',
  linkedin: '', // [VERIFY] add URL, or leave empty to hide
  resumePdf: 'assets/StutiSingh_Resume_DA.pdf',
  location: 'Bengaluru, India'
};

/* GitHub showcase. Leave REPOS empty and the site lists public repos live from
   GitHub (newest first, forks hidden). Add entries to hand-pick and describe
   your best work; `stop` links a repo into that stop's journal too. */
Rome.GITHUB = { user: 'stutisingh22', autoFetch: true, exclude: [] };
Rome.REPOS = [
  // { name: 'lead-qualifier', url: 'https://github.com/stutisingh22/lead-qualifier',
  //   blurb: 'Scores ~10,000 websites against an ICP in 15–25 minutes, with reasons for every tier.',
  //   stack: ['Python', 'asyncio', 'OpenAI API'], stop: 'circus', featured: true },
];

Rome.STOPS = [
  {
    id: 'popolo', name: 'Porta del Popolo', stamp: 'PP',
    labelTitle: 'Stuti Singh',
    labelLine: 'I build data pipelines that teams actually use',
    map: { x: 47, y: 10 },
    stack: [],
    hotspots: [
      { id: 'gate', x: 50, y: 66.36, tip: 'Enter the city', widget: 'gate' },
      { id: 'notice', x: 25.86, y: 75.36, tip: 'Read the notice',
        title: 'Hi, I’m Stuti',
        body: 'A data analyst who builds. I scrape, clean, and model messy data, then ship the pipeline, dashboard, or LLM workflow that puts it to work.' }
    ],
    journal: {
      title: 'Start here',
      body: 'Twelve stops, one for each piece of work worth showing: enterprise analytics for BFSI clients, a media intelligence platform I built alone, scrapers covering hundreds of sites, and the rules I follow when AI touches real data. Walk with the arrows and click the gold markers for the short version. The journal has the long one. In a hurry? The résumé view puts everything on one page, and Projects shows my code.'
    }
  },
  {
    id: 'colosseum', name: 'Colosseum', stamp: 'CO',
    labelLine: 'Outscored off-the-shelf LLMs: 95–97% against ~40%',
    map: { x: 67, y: 67 },
    stack: ['Python', 'PostgreSQL', 'Scrapy', 'Playwright', 'OpenAI API', 'LLM pipelines', 'Gmail API', 'Async Python', 'Confidence scoring'],
    hotspots: [
      { id: 'gladiators', x: 29.55, y: 77.82, tip: 'Watch the contest', widget: 'duel',
        title: 'The syndication test',
        body: 'The task: find everywhere a publication’s stories get republished. General-purpose ChatGPT and Claude approaches got about 40% right. My purpose-built pipeline gets 95–97%.' },
      { id: 'scroll', x: 51.64, y: 60.64, tip: 'Read the scroll',
        title: 'Built alone, end to end',
        body: 'At LH2’s Founder’s Office I built a media intelligence and CRM platform by myself, from the database schema to production deployment.' },
      { id: 'messenger', x: 78.64, y: 78.64, tip: 'Ask the messenger',
        title: 'One inbox view for everyone',
        body: 'Outreach from several team mailboxes lands in one system, with personalised drafts and reply alerts, so no response slips through.',
        stat: { value: 'Hundreds', label: 'of active contacts, none missed' } }
    ],
    journal: {
      title: 'Media intelligence & CRM · LH2 Holdings',
      body: 'Corporate Development Analyst, Founder’s Office · Dec 2025 – Jul 2026. The team needed to know who matters at which media house before an acquisition or partnership. I built the platform that answers that, alone and end to end: scrapers across hundreds of publications, a PostgreSQL store, contact mapping, influence scoring, and syndication tracking at 95–97% accuracy where general-purpose ChatGPT and Claude approaches managed about 40%. Outreach runs from the same system, with drafts shaped by each contact’s interests and alerts the moment someone replies.',
      links: [], repos: []
    }
  },
  {
    id: 'aqueducts', name: 'The Aqueducts', stamp: 'AQ',
    labelLine: 'Hundreds of sources in, clean records out',
    map: { x: 93, y: 93 },
    stack: ['Scrapy', 'BeautifulSoup', 'Selenium', 'Playwright', 'PostgreSQL', 'Pandas', 'ETL pipelines', 'Deduplication', 'Schema validation', 'Data enrichment', 'Async Python', 'LLM pipelines'],
    hotspots: [
      { id: 'arches', x: 50, y: 59.82, tip: 'Follow the water', widget: 'pipeline',
        title: 'The pipeline, stage by stage',
        body: 'Scrapy, Selenium, and Playwright pull from hundreds of sources. Python ETL cleans, dedupes, and validates everything into PostgreSQL, syncing only what changed.',
        stat: { value: '10,000+', label: 'records kept current' } },
      { id: 'water', x: 85.18, y: 79.45, tip: 'See the output',
        title: 'LLM labels you can check',
        body: 'Classifiers tag articles, companies, and people. Every label carries a confidence score, so weak calls are easy to spot.' },
      { id: 'worker', x: 23, y: 22.18, tip: 'Meet the worker',
        title: 'Research on autopilot',
        body: 'Collection, enrichment, and upkeep run on their own. Researchers spend their time deciding instead of copy-pasting.',
        stat: { value: '~70%', label: 'less manual research' } }
    ],
    journal: {
      title: 'Data infrastructure · the plumbing under LH2',
      body: 'Scrapers built with Scrapy, BeautifulSoup, Selenium, and Playwright cover hundreds of publications. Async Python workers run collection, enrichment, and CRM sync in parallel. Every record passes through ingestion, deduplication, schema validation, and enrichment before it reaches PostgreSQL, and syncs are incremental, so 10,000+ records stay current without full reloads. LLM classifiers with confidence scores turn raw articles, company pages, and profiles into structured, queryable data. The result: about 70% less manual research.',
      links: [],
      repos: [
        { name: 'cloud_transfer', url: 'https://github.com/stutisingh22/cloud_transfer', description: 'Drive, onward to S3 or SFTP.' },
        { name: 'msn_straper_ext', url: 'https://github.com/stutisingh22/msn_straper_ext', description: 'Syndication and traffic for one domain.' }
      ]
    }
  },
  {
    id: 'forum', name: 'Roman Forum', stamp: 'RF',
    labelLine: 'Five years of BFSI data, finally in one place',
    map: { x: 60, y: 60 },
    stack: ['Python', 'Pandas', 'SQL', 'Power BI', 'DAX', 'Star schema', 'Data modelling', 'KPI frameworks', 'Dashboard design', 'Forecasting', 'A/B testing', 'Power Automate', 'Zoho Recruit', 'Deduplication'],
    hotspots: [
      { id: 'col-hr', x: 32.74, y: 54.91, tip: 'HR', widget: 'forum:HR',
        title: 'Five years, one source of truth',
        body: 'Five-plus years of raw records from several major BFSI clients, validated, deduplicated, and standardised into one layer leadership could trust.',
        stat: { value: '5+ years', label: 'of client data consolidated' } },
      { id: 'col-sales', x: 43.62, y: 54.91, tip: 'Sales', widget: 'forum:Sales',
        title: 'Numbers everyone agrees on',
        body: 'Star-schema models and a semantic layer, so every function reads from the same definitions instead of its own spreadsheet.' },
      { id: 'col-finance', x: 54.58, y: 54.91, tip: 'Finance', widget: 'forum:Finance',
        title: 'Reports that don’t break',
        body: 'Automated Python and SQL pipelines replaced hand-assembled reports.',
        stat: { value: '~90%', label: 'fewer reporting errors' } },
      { id: 'col-ta', x: 65.46, y: 54.91, tip: 'Talent Acquisition', widget: 'forum:TA',
        title: 'Hiring, predicted',
        body: 'Forecasting models for hiring demand, and A/B tests that compared sourcing strategies, all fed by Zoho Recruit pipelines.' },
      { id: 'roof', x: 50, y: 28.73, tip: 'Executive KPIs',
        title: 'Executive dashboards, governed properly',
        body: 'KPI frameworks in Power BI, promoted through Dev, Staging, and Production, with role-based access and GDPR-aware data governance.' },
      { id: 'bell', x: 81.91, y: 58.18, tip: 'Ring the bell',
        title: 'Problems flagged, not found',
        body: 'Anomaly detection in Python and Power Automate alerts leadership the moment an operational metric drifts.' }
    ],
    journal: {
      title: 'Enterprise analytics · Wissen Technology',
      body: 'Associate Consultant, Data Analytics, Chief of Staff Office · Jun 2024 – Oct 2025. I owned analytics for HR, Sales, Finance, and Talent Acquisition. The first job was making five-plus years of messy historical data from several major BFSI clients trustworthy, through validation, deduplication, and one standard schema. On that foundation I built star-schema models and a semantic layer, executive KPI dashboards in Power BI across Dev, Staging, and Production, hiring-demand forecasts, recruitment A/B tests, and automated anomaly alerts. Manual reporting errors fell by about 90%.',
      links: [], repos: []
    }
  },
  {
    id: 'pantheon', name: 'Pantheon', stamp: 'PA',
    labelLine: 'A CRM where AI can’t quietly break things',
    map: { x: 47, y: 42 },
    stack: ['FastAPI', 'SQLAlchemy', 'PostgreSQL', 'Confidence scoring', 'Human-in-the-loop', 'Deduplication', 'Gmail API', 'Google Workspace APIs', 'Notion API', 'Async Python', 'LLM pipelines'],
    hotspots: [
      { id: 'oculus', x: 55.89, y: 16.45, tip: 'Look through the oculus', widget: 'review',
        title: 'Unsure? A human decides',
        body: 'Below the confidence threshold, the AI writes nothing. The record goes to a reviewer, who approves, edits, or rejects it.' },
      { id: 'ring', x: 79.45, y: 66.36, tip: 'Inspect the base',
        title: 'Rules first, AI second',
        body: 'Deterministic checks wrap the classifier. Every decision is logged with its reason, and any change can be undone.' },
      { id: 'doors', x: 41, y: 72.09, tip: 'Open the doors',
        title: 'Plugs into everything',
        body: 'FastAPI with JWT and role-based access. Gmail, Drive, Notion, and SignalHire connect through one shared async adapter layer.' }
    ],
    journal: {
      title: 'Project · Research-driven CRM',
      body: 'Prospect lists are messy: duplicate accounts, subsidiaries logged as separate companies, three spellings of one domain. This CRM cleans that up. It resolves parent and subsidiary links, normalises domains, and dedupes against existing accounts, with bulk imports from text, CSV, and XLSX. The AI classifier never gets the last word: confidence thresholds send uncertain records to human review, overrides are logged, and every action is reversible, so the CRM can’t be silently corrupted. One schema runs on SQLite locally and PostgreSQL in production.',
      links: [],
      repos: [
        { name: 'woodpecker-hubspot-bridge', url: 'https://github.com/stutisingh22/woodpecker-hubspot-bridge', description: 'A bridge between two CRMs.' }
      ]
    }
  },
  {
    id: 'circus', name: 'Circus Maximus', stamp: 'CM',
    labelLine: '10,000 websites scored in under half an hour',
    map: { x: 55, y: 76 },
    stack: ['Python', 'Async Python', 'ETL pipelines', 'LLM pipelines', 'Confidence scoring'],
    hotspots: [
      { id: 'start', x: 16.45, y: 68, tip: 'Start the race', widget: 'race',
        title: '10,000 sites per run',
        body: 'A two-phase async batch with retries, robots.txt compliance, and checkpoints. If a run dies halfway, it picks up where it stopped.',
        stat: { value: '15–25 min', label: 'per full run' } },
      { id: 'chariot', x: 66.36, y: 80.27, tip: 'Why this tier?',
        title: 'Every score shows its work',
        body: 'Each lead gets a tier and the reasons behind it. If a signal can’t be found, it’s marked unknown instead of guessed.' },
      { id: 'purse', x: 80.27, y: 54.91, tip: 'Count the coins',
        title: 'Paying for AI only when needed',
        body: 'Rules score the clear-cut leads. Only the ambiguous ones go to the LLM.',
        stat: { value: '~70%', label: 'lower LLM cost' } }
    ],
    journal: {
      title: 'Project · Lead qualification pipeline',
      body: 'Sales teams lose hours on leads that were never a fit. This pipeline scores leads against explicit ICP criteria such as funding stage and founder background, then ranks who to contact first. It crawls about 10,000 websites in a two-phase async batch with concurrency, retries, robots.txt compliance, and checkpointing, finishing in 15–25 minutes and resuming cleanly after failures. Rules handle the obvious cases so only ambiguous leads reach the LLM, which cuts LLM cost by about 70%. Cached sources make re-scoring instant, and every tier comes with its reasons.',
      links: [],
      repos: [
        { name: 'leadQautomation', url: 'https://github.com/stutisingh22/leadQautomation', description: 'A score that refuses a guess.' }
      ]
    }
  },
  {
    id: 'vatican', name: 'Vatican Archives', stamp: 'VA',
    labelLine: 'Finding licensable data inside terabytes of clutter',
    map: { x: 12, y: 36 },
    stack: ['Python', 'PII detection', 'Confidence scoring', 'Google Workspace APIs', 'Gmail API', 'Data modelling'],
    hotspots: [
      { id: 'shelves', x: 29.55, y: 63.09, tip: 'Browse the shelves', widget: 'shelves',
        title: 'Four sources, one catalogue',
        body: 'Local drives, Google Drive, Gmail, and Git repositories inventoried into one schema, with lineage back to every source.',
        stat: { value: '1–2 TB', label: 'catalogued' } },
      { id: 'sealed', x: 50, y: 75.36, tip: 'The sealed shelf',
        title: 'Sensitive data stays put',
        body: 'PII is detected during ingestion and flagged before anything is shared outside the organisation.' },
      { id: 'ledger', x: 65.55, y: 77.82, tip: 'Open the ledger',
        title: 'Every row is defensible',
        body: 'Excel deliverables where each record keeps its confidence score, rationale, and evidence, ready for anyone to audit.' }
    ],
    journal: {
      title: 'Project · Inventory Segmentor',
      body: 'Organisations often hold data that could be licensed for AI training without knowing what they have. This Python system finds out. It inventories 1–2 TB of unstructured files across local drives, Google Drive, Gmail, and Git into one schema, tracks where every item came from, and segments it into candidate datasets. Discovery, extraction, and classification checkpoint separately, so multi-hour runs resume without redoing work. PII is flagged on the way in, and the Excel outputs keep confidence, rationale, and evidence for every record.',
      links: [],
      repos: [
        { name: 'inventory_segmentor', url: 'https://github.com/stutisingh22/inventory_segmentor', description: 'A messy corpus, sorted.' },
        { name: 'pii_redactor', url: 'https://github.com/stutisingh22/pii_redactor', description: 'Face-aware masking, with a browser workspace.' },
        { name: 'pii-removal', url: 'https://github.com/stutisingh22/pii-removal', description: 'Identity lifted out of lab PDFs.' },
        { name: 'output-redactor', url: 'https://github.com/stutisingh22/output-redactor', description: 'Stable tokens across a folder.' }
      ]
    }
  },
  {
    id: 'bocca', name: 'Bocca della Verità', stamp: 'BV',
    labelLine: 'Five rules I don’t break',
    map: { x: 51, y: 73 },
    stack: ['Confidence scoring', 'Human-in-the-loop'],
    hotspots: [
      { id: 'mouth', x: 65.55, y: 72.09, tip: 'Put your hand in', widget: 'bocca',
        title: 'How I work', body: 'Click again for the next rule.' }
    ],
    principles: [
      ['Unknown beats made up', 'If a signal can’t be found, it’s marked unknown. Nothing is invented to fill the gap.'],
      ['Rules first, models second', 'Cheap, predictable rules handle the clear cases. LLMs only see the hard ones.'],
      ['Show the confidence', 'Every output carries its score, its reasoning, and its evidence.'],
      ['A human signs off', 'Uncertain AI decisions go to a person, and every change can be undone.'],
      ['Never start over', 'Long jobs checkpoint as they go, so a crash costs minutes, not hours.']
    ],
    journal: {
      title: 'How I work',
      body: 'Five rules show up in everything on this walk. Unknown beats made up: missing signals are marked unknown, never invented. Rules first, models second: deterministic logic handles the clear cases, which is cheaper and easier to audit, and LLMs get the ambiguous ones. Show the confidence: scores, reasoning, and evidence travel with every record. A human signs off on anything uncertain, and every AI action is reversible. Never start over: long jobs checkpoint, so failures cost minutes.'
    }
  },
  {
    id: 'capitoline', name: 'Capitoline Hill', stamp: 'CH',
    labelLine: 'Researching how founders decide under pressure',
    map: { x: 55, y: 57 },
    stack: ['Econometrics', 'Statistical analysis', 'Python'],
    hotspots: [
      { id: 'statue', x: 23.82, y: 59.82, tip: 'Read the book',
        title: 'Research Associate, IIM Bangalore',
        body: 'Since February 2026 I’ve studied how entrepreneurial leaders make strategic calls when competition is closing in.' },
      { id: 'scales', x: 77, y: 66.36, tip: 'Weigh the scales', widget: 'scales',
        title: 'R&D or marketing?',
        body: 'I build econometric models of how firms split investment between R&D and marketing, and how competition shifts that balance.' }
    ],
    journal: {
      title: 'Research · IIM Bangalore',
      body: 'Research Associate, Entrepreneurial Leadership & Market Agility · Feb 2026 – present. The question: when competition heats up, how do leaders decide where money and attention go? I turn that into measurable variables and build quantitative and econometric models, especially of the trade-off between R&D and marketing or advertising spend, along with frameworks for judging market agility and resource allocation. The work is ongoing, so this stop describes the questions rather than findings.'
    }
  },
  {
    id: 'spanish', name: 'Spanish Steps', stamp: 'SS',
    labelLine: 'How I got here, one step at a time',
    map: { x: 61, y: 22 },
    stack: ['Factor & cluster analysis', 'Statistical analysis'],
    hotspots: [
      { id: 'mcc', x: 32, y: 86, tip: '2021–2024',
        title: 'Mount Carmel College',
        body: 'B.Sc. in Economics and Statistics, dual major, Bengaluru.' },
      { id: 'nsrcel', x: 59.82, y: 77, tip: '2023–2024',
        title: 'NSRCEL, IIM Bangalore',
        body: 'Program intern for Launchpad and Campus Founders. Scored startups, interviewed founders, and built a seven-year venture dataset.' },
      { id: 'wissen', x: 40.18, y: 68, tip: '2024–2025',
        title: 'Wissen Technology',
        body: 'Associate Consultant in the Chief of Staff Office, owning analytics for four business functions.' },
      { id: 'lh2', x: 59.82, y: 59, tip: '2025–2026',
        title: 'LH2 Holdings',
        body: 'Corporate Development Analyst in the Founder’s Office. Built the media intelligence platform solo.' },
      { id: 'iimb', x: 50, y: 50, tip: '2026 – now',
        title: 'IIM Bangalore, again',
        body: 'Back as a Research Associate, studying strategy and market agility.' },
      { id: 'pots', x: 77, y: 81.09, tip: 'The flower pots',
        title: '700 ventures, seven years',
        body: 'At NSRCEL I built a dataset of 700+ alumni ventures across seven years and scored 80+ applications with factor and cluster analysis.',
        stat: { value: '700+', label: 'ventures tracked' } }
    ],
    journal: {
      title: 'Roots · NSRCEL & Mount Carmel',
      body: 'NSRCEL, IIM Bangalore — Program Intern, Launchpad & Campus Founders Program · Sep 2023 – Feb 2024. I scored 80+ startup applications with factor and cluster analysis, ran 20+ founder interviews that became venture case studies, and built a master dataset of 700+ alumni ventures covering sectors, survival rates, and program performance across seven years. Mount Carmel College, Bengaluru — B.Sc. in Economics and Statistics, dual major, 2021–2024.'
    }
  },
  {
    id: 'campo', name: 'Campo de’ Fiori', stamp: 'CF',
    labelLine: 'Pick a skill, see where I used it',
    map: { x: 40, y: 49 },
    stack: [],
    hotspots: [
      { id: 'stall-0', x: 35.44, y: 69.64, tip: 'Analysis', widget: 'stall:0', title: 'Analysis & statistics', body: 'Tap a skill to see where it shows up on this walk.' },
      { id: 'stall-1', x: 47.3, y: 69.64, tip: 'Data engineering', widget: 'stall:1', title: 'Data engineering', body: 'Tap a skill to see where it shows up on this walk.' },
      { id: 'stall-2', x: 59.08, y: 69.64, tip: 'BI & dashboards', widget: 'stall:2', title: 'BI & visualisation', body: 'Tap a skill to see where it shows up on this walk.' },
      { id: 'stall-3', x: 70.95, y: 69.64, tip: 'AI & automation', widget: 'stall:3', title: 'AI & automation', body: 'Tap a skill to see where it shows up on this walk.' },
      { id: 'stall-4', x: 82.73, y: 69.64, tip: 'Data collection', widget: 'stall:4', title: 'Data collection', body: 'Tap a skill to see where it shows up on this walk.' }
    ],
    journal: {
      title: 'Skills',
      body: 'Analysis: Python, Pandas, NumPy, SQL, statistical analysis, factor and cluster analysis, forecasting, A/B testing, econometrics. Data engineering: PostgreSQL, SQLAlchemy, ETL pipelines, data modelling, star schema, schema validation, deduplication, enrichment. BI: Power BI, DAX, dashboard design, KPI frameworks, Power Automate. AI and automation: LLM pipelines, OpenAI API, confidence scoring, human-in-the-loop, FastAPI, async Python, PII detection. Collection: Scrapy, BeautifulSoup, Selenium, Playwright, and Gmail, Google Workspace, Notion, HubSpot, and Zoho APIs, plus Zapier.'
    }
  },
  {
    id: 'trevi', name: 'Trevi Fountain', stamp: 'TF',
    labelLine: 'Toss a coin, and let’s talk',
    map: { x: 58, y: 36 },
    stack: [],
    hotspots: [
      { id: 'coin', x: 27.09, y: 81.09, tip: 'Toss a coin', widget: 'coin',
        title: 'Let’s build something',
        body: 'Hiring for data analytics, analytics engineering, or AI automation? I’m based in Bengaluru, and email is the fastest way to reach me.' } // [VERIFY] roles
    ],
    journal: {
      title: 'Get in touch',
      body: 'I’m open to data analyst, analytics engineering, and AI automation roles. Email is the fastest way to reach me. My code is on GitHub, and the full résumé is a one-page PDF.'
    }
  }
];

Rome.SKILLS = [
  { name: 'Analysis & statistics', chips: ['Python', 'Pandas', 'NumPy', 'SQL', 'Statistical analysis', 'Factor & cluster analysis', 'Forecasting', 'A/B testing', 'Econometrics'] },
  { name: 'Data engineering', chips: ['PostgreSQL', 'SQLAlchemy', 'ETL pipelines', 'Data modelling', 'Star schema', 'Schema validation', 'Deduplication', 'Data enrichment'] },
  { name: 'BI & visualisation', chips: ['Power BI', 'DAX', 'Dashboard design', 'KPI frameworks', 'Power Automate'] },
  { name: 'AI & automation', chips: ['LLM pipelines', 'OpenAI API', 'Confidence scoring', 'Human-in-the-loop', 'FastAPI', 'Async Python', 'PII detection'] },
  { name: 'Data collection', chips: ['Scrapy', 'BeautifulSoup', 'Selenium', 'Playwright', 'Gmail API', 'Google Workspace APIs', 'Notion API', 'HubSpot API', 'Zapier', 'Zoho Recruit'] }
];

/* Plain résumé view (no game). Keep in sync with the PDF. */
Rome.RESUME = {
  roles: [
    { org: 'IIM Bangalore', title: 'Research Associate — Entrepreneurial Leadership & Market Agility', dates: 'Feb 2026 – present', stop: 'capitoline' },
    { org: 'LH2 Holdings', title: 'Corporate Development Analyst — Founder’s Office', dates: 'Dec 2025 – Jul 2026', stop: 'colosseum' },
    { org: 'Wissen Technology', title: 'Associate Consultant — Data Analytics, Chief of Staff Office', dates: 'Jun 2024 – Oct 2025', stop: 'forum' },
    { org: 'NSRCEL, IIM Bangalore', title: 'Program Intern — Launchpad & Campus Founders Program', dates: 'Sep 2023 – Feb 2024', stop: 'spanish',
      body: 'I scored 80+ startup applications with factor and cluster analysis, ran 20+ founder interviews that became venture case studies, and built a master dataset of 700+ alumni ventures covering sectors, survival rates, and program performance across seven years.' }
  ],
  projects: ['pantheon', 'circus', 'vatican'],
  education: 'Mount Carmel College, Bengaluru — B.Sc. Economics & Statistics (dual major), 2021–2024'
};

/* ==========================================================================
   STREET VIEW ROUTE
   The walk moves through panoramas like Street View. Between each pair of
   stops there is one "street" node so it feels like walking the city.
   Set Rome.SHOW_STREETS = false to walk stop-to-stop only (fewer images).
   ========================================================================== */
Rome.SHOW_STREETS = true;
Rome.STREETS = {                 // key = the stop it leaves from
  popolo:     { id: 'via-del-corso',      name: 'Via del Corso' },
  colosseum:  { id: 'via-appia',          name: 'Via Appia Antica' },
  aqueducts:  { id: 'fori-imperiali',     name: 'Via dei Fori Imperiali' },
  forum:      { id: 'via-del-seminario',  name: 'Via del Seminario' },
  pantheon:   { id: 'via-dei-cerchi',     name: 'Via dei Cerchi' },
  circus:     { id: 'ponte-sant-angelo',  name: 'Ponte Sant’Angelo' },
  vatican:    { id: 'lungotevere',        name: 'Lungotevere' },
  bocca:      { id: 'teatro-marcello',    name: 'Via del Teatro di Marcello' },
  capitoline: { id: 'via-condotti',       name: 'Via dei Condotti' },
  spanish:    { id: 'via-giubbonari',     name: 'Via dei Giubbonari' },
  campo:      { id: 'via-delle-muratte',  name: 'Via delle Muratte' }
};

/* Per-view camera settings (degrees). yaw 0 = centre of the image.
   arriveYaw: where you face on arrival · nextYaw / backYaw: where the walk arrows sit.
   Use index.html?edit=1 to set these by looking around and clicking. */
(function () {
  // Arrow sits a little ahead on the road. The default pins it to the edge of the photo, on top of the markers.
  var road = { arriveYaw: 0, nextYaw: 12, backYaw: -12 };
  var ids = ['popolo','via-del-corso','colosseum','via-appia','aqueducts','fori-imperiali','forum','via-del-seminario','pantheon','via-dei-cerchi','circus','ponte-sant-angelo','vatican','lungotevere','bocca','teatro-marcello','capitoline','via-condotti','spanish','via-giubbonari','campo','via-delle-muratte','trevi'];
  Rome.VIEWS = {};
  ids.forEach(function (id) { Rome.VIEWS[id] = road; });
})();
