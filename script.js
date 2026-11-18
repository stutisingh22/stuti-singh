/* Stuti Singh — page UI: chapter chrome, pinned station panels, demo sheets, and the four demos.
   The 3D refinery lives in world.js. Plain JS, no dependencies. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var html = document.documentElement;
  html.classList.add('js');

  /* ---------- chapter chrome + pinned panels ---------- */
  var chapters = $$('[data-station]'), stations = $$('.station, .exp'), H = window.innerHeight;
  var prog = $('#progress'), nav = $('.nav'), labelIdx = $('#ch-idx'), labelName = $('#ch-name');
  var navLinks = $$('.nav nav a[href^="#"]').map(function (a) { return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) }; });
  var owner = -1;

  function onScroll() {
    var y = window.scrollY, doc = html.scrollHeight - H, mid = y + H * .5;
    prog.style.transform = 'scaleY(' + clamp(y / doc, 0, 1) + ')';
    nav.classList.toggle('solid', y > 40);
    var k = 0;
    chapters.forEach(function (c, i) { if (c.getBoundingClientRect().top + y <= mid) k = i; });
    if (k !== owner) {
      owner = k; var c = chapters[k];
      html.setAttribute('data-tone', c.dataset.tone || 'light');
      labelIdx.textContent = ('0' + (k + 1)).slice(-2) + ' / ' + chapters.length;
      labelName.textContent = c.dataset.label || '';
    }
    // a station's panel shows while its section holds the middle of the screen
    var any = false, onStation = false;
    stations.forEach(function (s) {
      var r = s.getBoundingClientRect(), on = r.top < H * .45 && r.bottom > H * .55;
      s.classList.toggle('on', on); any = any || on;
      if (on && s.classList.contains('station')) onStation = true;
    });
    html.classList.toggle('scrim-on', any);
    html.classList.toggle('at-station', onStation);
    var act = null;
    navLinks.forEach(function (n) { if (n.el && n.el.getBoundingClientRect().top + y <= mid) act = n.a; });
    navLinks.forEach(function (n) { n.a.classList.toggle('active', n.a === act); });
  }
  var ticking = false;
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); } }, { passive: true });
  window.addEventListener('resize', function () { H = window.innerHeight; onScroll(); });

  /* ---------- reading stops ----------
     Scrolling down into a station parks the page on it (camera arrived, panel fully in) and
     holds it there: at least HOLD_MIN, and until the wheel/finger has been quiet for QUIET,
     so a fast flick or trackpad momentum can't blow past a slide. The pill at the bottom shows
     the wait, then flips to "Scroll to continue". Nav links and dialogs are never held. */
  var HOLD_MIN = 1400, HOLD_MAX = 3200, QUIET = 220;
  var holdEl = document.createElement('div');
  holdEl.className = 'hold'; holdEl.setAttribute('aria-hidden', 'true');
  holdEl.innerHTML = '<i></i><span class="mono">Scroll to continue</span><b>↓</b>';
  document.body.appendChild(holdEl);
  var holdLabel = holdEl.querySelector('span');
  var stops = [], hold = null, lastY = window.scrollY, lastInput = 0, jumping = 0;
  function measureStops() {
    var y = window.scrollY;
    // on phones the cards are taller than the screen and scroll in flow, so nothing is held
    if (window.innerWidth < 960) { stops = []; return; }
    stops = stations.filter(function (s) { return s.classList.contains('station'); })
      .map(function (s) { return Math.round(s.getBoundingClientRect().top + y + H * .25); });
  }
  function stopBetween(from, to) { // first stop passed when moving down from -> to
    for (var i = 0; i < stops.length; i++) if (stops[i] > from + 1 && stops[i] <= to) return stops[i];
    return null;
  }
  function busy() { return jumping > performance.now() || !!document.querySelector('dialog[open]'); }
  function startHold(at) {
    hold = { at: at, t0: performance.now() };
    window.scrollTo(0, at); lastY = at;
    html.classList.remove('holding', 'held'); void holdEl.offsetWidth; html.classList.add('holding');
    holdLabel.textContent = 'Reading';
    requestAnimationFrame(tickHold);
  }
  function tickHold(now) {
    if (!hold) return;
    var el = now - hold.t0;
    if ((el >= HOLD_MIN && now - lastInput >= QUIET) || el >= HOLD_MAX) {
      hold = null; html.classList.remove('holding'); html.classList.add('held');
      holdLabel.textContent = 'Scroll to continue';
      return;
    }
    requestAnimationFrame(tickHold);
  }
  window.addEventListener('wheel', function (e) {
    lastInput = performance.now();
    if (hold) { e.preventDefault(); return; }
    if (e.ctrlKey || busy()) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? H : 1);
    if (dy <= 0) return;
    var s = stopBetween(window.scrollY, window.scrollY + dy);
    if (s != null) { e.preventDefault(); startHold(s); }
  }, { passive: false });
  window.addEventListener('touchmove', function (e) {
    lastInput = performance.now();
    if (hold && e.cancelable) e.preventDefault();
  }, { passive: false });
  window.addEventListener('keydown', function (e) {
    if (!hold || /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) return;
    if ([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'End', 'Home'].indexOf(e.key) > -1) { lastInput = performance.now(); e.preventDefault(); }
  });
  // fallback for touch momentum, keys and the scrollbar: catch the crossing after the fact
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (hold) { if (Math.abs(y - hold.at) > 1) { lastInput = performance.now(); window.scrollTo(0, hold.at); } return; }
    if (!busy() && y > lastY && y - lastY < H * 1.5) {
      var s = stopBetween(lastY, y);
      if (s != null) return startHold(s);
    }
    lastY = y;
  }, { passive: true });
  // in-page links (including the 3D labels, added later) jump straight there, never held
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a[href^="#"]')) { jumping = performance.now() + 700; hold = null; html.classList.remove('holding'); }
  }, true);
  window.addEventListener('resize', measureStops);
  window.addEventListener('load', measureStops);
  measureStops();

  /* ---------- demo sheets ---------- */
  var piiOut = $('#pii-out'), piiLabel = $('#pii-progress'), piiEdited = false, sweep = 0;
  function sweepRedaction() {
    if (piiEdited) return;
    if (reduce) { sweep = 1; redact(); return; }
    var t0 = performance.now();
    (function step(now) {
      sweep = clamp((now - t0) / 1400, 0, 1); redact();
      piiLabel.textContent = sweep < 1 ? 'redacting ' + Math.round(sweep * 100) + '%' : 'redacted · now edit it';
      if (sweep < 1) requestAnimationFrame(step);
    })(t0);
  }
  $$('[data-open]').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = document.getElementById(b.dataset.open); if (!d) return;
      if (d.showModal) d.showModal(); else d.setAttribute('open', '');
      if (d.id === 'sheet-pii') { sweep = 0; redact(); setTimeout(sweepRedaction, 350); }
    });
  });
  $$('dialog.sheet').forEach(function (d) {
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) return d.close();
      var r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
  });

  /* ---------- magnetic buttons + copy ---------- */
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .25) + 'px,' + ((e.clientY - r.top - r.height / 2) * .35) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-copy'), orig = b.textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
        function () { b.textContent = 'Copied ✓'; }, function () { b.textContent = t; });
      setTimeout(function () { b.textContent = orig; }, 1800);
    });
  });

  /* =====================================================================
     DEMOS
     ===================================================================== */
  /* ---------- redaction with stable tokens ---------- */
  var piiIn = $('#pii-in'), piiEdited = false, sweep = 0;
  var PATTERNS = [
    ['EMAIL', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g],
    ['PHONE', /\+?\d[\d\s-]{8,}\d/g],
    ['PERSON', /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g]
  ];
  function redact() {
    var text = piiIn.value, hits = [];
    PATTERNS.forEach(function (p) { var m; p[1].lastIndex = 0; while ((m = p[1].exec(text))) hits.push({ s: m.index, e: m.index + m[0].length, type: p[0], v: m[0] }); });
    var people = {};
    hits.filter(function (h) { return h.type === 'PERSON'; }).forEach(function (h) { people[h.v.split(' ')[0]] = h.v; });
    Object.keys(people).forEach(function (first) {
      var re = new RegExp('\\b' + first + '\\b(?! [A-Z][a-z])', 'g'), m;
      while ((m = re.exec(text))) hits.push({ s: m.index, e: m.index + first.length, type: 'PERSON', v: people[first] });
    });
    hits.sort(function (a, b) { return a.s - b.s || b.e - a.e; });
    var out = '', i = 0, map = {}, n = { EMAIL: 0, PHONE: 0, PERSON: 0 }, cut = sweep * text.length;
    hits.forEach(function (h) {
      if (h.s < i) return;
      out += esc(text.slice(i, h.s));
      var key = h.type + ':' + h.v.toLowerCase().replace(/\s+/g, '');
      if (!map[key]) map[key] = '[' + h.type + '_' + (++n[h.type]) + ']';
      var on = h.s < cut;
      out += '<span class="tok ' + (on ? 'tok--' + h.type : 'tok--raw') + '">' + esc(on ? map[key] : text.slice(h.s, h.e)) + '</span>';
      i = h.e;
    });
    piiOut.innerHTML = out + esc(text.slice(i));
  }
  piiIn.addEventListener('input', function () { piiEdited = true; sweep = 1; piiLabel.textContent = 'live'; redact(); });
  redact();

  /* ---------- CRM confidence threshold ---------- */
  var RECS = [
    { id: 1, name: 'brightpath.io', act: 'Normalise www.BrightPath.IO/ → brightpath.io', c: .99 },
    { id: 2, name: 'Acme Foods Pvt Ltd', act: 'Merge with “Acme Foods” (same domain)', c: .97 },
    { id: 3, name: 'Orbit Media EU', act: 'Link as subsidiary of Orbit Media', c: .91 },
    { id: 4, name: 'Lumen Studio', act: 'Classify: Media / Publishing', c: .84 },
    { id: 5, name: 'Riverbend Health', act: 'Set HQ: Singapore', c: .77 },
    { id: 6, name: 'Halcyon Group', act: 'Link as parent of Halcyon Retail', c: .72 },
    { id: 7, name: 'Northstar Labs', act: 'Merge with “North Star Labs”', c: .66 },
    { id: 8, name: 'Cobalt & Co', act: 'Classify: Fintech', c: .58 }
  ];
  var crmState = {}, th = $('#crm-th'), thOut = $('#crm-th-out'), logEl = $('#crm-log');
  function log(msg) {
    var d = new Date(), t = [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (n) { return ('0' + n).slice(-2); }).join(':');
    var li = document.createElement('li'); li.textContent = t + '  ' + msg;
    logEl.insertBefore(li, logEl.firstChild);
    while (logEl.children.length > 12) logEl.removeChild(logEl.lastChild);
  }
  function recHTML(r, kind) {
    var btn = function (d, l) { return '<button data-do="' + d + '" data-id="' + r.id + '">' + l + '</button>'; };
    var extra = kind === 'auto' ? '<span class="badge">auto</span>' + btn('undo', 'Undo')
      : kind === 'approved' ? '<span class="badge">approved</span>' + btn('undo', 'Undo')
      : kind === 'rejected' ? '<span class="badge badge--rej">rejected</span>' + btn('undo', 'Undo')
      : btn('approve', 'Approve') + btn('reject', 'Reject');
    return '<li class="rec rec--' + kind + '"><div class="rec__top"><span class="rec__name">' + esc(r.name) + '</span><span class="rec__conf">' +
      Math.round(r.c * 100) + '%</span></div><div class="rec__act">' + esc(r.act) + '</div><div class="rec__btns">' + extra + '</div></li>';
  }
  function renderCRM() {
    var t = +th.value / 100, a = [], v = [];
    thOut.textContent = th.value + '%';
    RECS.forEach(function (r) {
      var s = crmState[r.id];
      if (s === 'approved') a.push(recHTML(r, 'approved'));
      else if (s === 'rejected') v.push(recHTML(r, 'rejected'));
      else if (s !== 'reverted' && r.c >= t) a.push(recHTML(r, 'auto'));
      else v.push(recHTML(r, 'pending'));
    });
    $('#crm-auto').innerHTML = a.join(''); $('#crm-review').innerHTML = v.join('');
    $('#crm-n-auto').textContent = a.length; $('#crm-n-rev').textContent = v.length;
  }
  th.addEventListener('input', renderCRM);
  $('.crm').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-do]'); if (!b) return;
    var id = +b.dataset.id, r = RECS.filter(function (x) { return x.id === id; })[0], d = b.dataset.do;
    if (d === 'approve') { crmState[id] = 'approved'; log('approved by reviewer · ' + r.name); }
    if (d === 'reject') { crmState[id] = 'rejected'; log('rejected by reviewer · ' + r.name + ' · CRM unchanged'); }
    if (d === 'undo') { crmState[id] = 'reverted'; log('reverted · ' + r.name + ' · back to review'); }
    renderCRM();
    var again = document.querySelector('.crm button[data-id="' + id + '"]'); if (again) again.focus();
  });
  log('policy: model proposes, never writes below threshold');
  renderCRM();

  /* ---------- lead scoring ---------- */
  var LEADS = [
    { name: 'Kestrel Robotics', tier: 'A', route: 'rules',
      sig: [['funding_stage', 'Series A', 'pos'], ['founder_background', 'ex-ISRO engineers', 'pos'], ['industry', 'Robotics (in ICP)', 'pos'], ['hiring', 'yes', 'pos']],
      why: 'Matches all four ICP criteria. A clear case, so the rules scored it with no LLM call.' },
    { name: 'Northwind Health', tier: 'B', route: 'LLM',
      sig: [['funding_stage', 'Series B', 'pos'], ['founder_background', 'mixed signals in bio', 'neg'], ['industry', 'Healthcare (in ICP)', 'pos'], ['hiring', 'yes', 'pos']],
      why: 'The founder bio was ambiguous, so the rules passed it to the LLM, which read it as a partial match.' },
    { name: 'Lumen Studio', tier: 'B', route: 'LLM',
      sig: [['funding_stage', 'Seed', 'pos'], ['founder_background', 'second-time founder', 'pos'], ['industry', 'design tooling (edge of ICP)', 'neg'], ['hiring', 'no', 'neg']],
      why: 'Strong founders, but the industry sits at the edge of the ICP. Only the ambiguous call went to the LLM.' },
    { name: 'Halcyon Retail', tier: 'C', route: 'rules',
      sig: [['funding_stage', 'Series C', 'pos'], ['founder_background', 'ex-consulting', 'neg'], ['industry', 'Retail (outside ICP)', 'neg'], ['hiring', 'no', 'neg']],
      why: 'Outside the target industry, so the rules ranked it low. No LLM call needed.' },
    { name: 'Meridian Press', tier: 'C', route: 'rules',
      sig: [['funding_stage', 'bootstrapped', 'neg'], ['founder_background', 'journalism', 'neg'], ['industry', 'Media (in ICP)', 'pos'], ['hiring', 'no', 'neg']],
      why: 'Fails the funding criterion. A clear case, decided by the rules.' },
    { name: 'Cobalt & Co', tier: 'R', route: 'review',
      sig: [['funding_stage', null], ['founder_background', null], ['industry', 'Fintech (in ICP)', 'pos'], ['hiring', 'yes', 'pos']],
      why: 'Two key signals couldn’t be found. They stay unknown, and the lead goes to a reviewer instead of getting a guessed score.' }
  ];
  var listEl = $('#lead-list'), whyEl = $('#lead-why'), counts = { rules: 0, LLM: 0, review: 0 };
  LEADS.forEach(function (l) { counts[l.route]++; });
  $('#lead-summary').textContent = counts.rules + ' rules · ' + counts.LLM + ' LLM · ' + counts.review + ' review';
  listEl.innerHTML = LEADS.map(function (l, i) {
    return '<button type="button" role="listitem" class="lead" aria-pressed="false" data-i="' + i + '"><span>' + esc(l.name) + '</span><span class="lead__route">' +
      (l.route === 'rules' ? 'rules' : l.route === 'LLM' ? 'rules → LLM' : 'rules → human') +
      '</span><span class="tier tier--' + l.tier + '">' + (l.tier === 'R' ? 'Review' : 'Tier ' + l.tier) + '</span></button>';
  }).join('');
  function showLead(i) {
    var l = LEADS[i];
    $$('.lead', listEl).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.i === i)); });
    whyEl.innerHTML = '<h4>' + esc(l.name) + '</h4><dl class="sig">' + l.sig.map(function (s) {
      return '<dt>' + s[0] + '</dt>' + (s[1] ? '<dd class="' + s[2] + '">' + esc(s[1]) + '</dd>' : '<dd class="unk">unknown</dd>');
    }).join('') + '</dl><p>' + esc(l.why) + '</p>';
  }
  listEl.addEventListener('click', function (e) { var b = e.target.closest('.lead'); if (b) showLead(+b.dataset.i); });
  showLead(0);

  /* ---------- checkpoint / resume simulation ---------- */
  var STAGES = ['Discovery', 'Extraction', 'Classification'], NC = 20, CK = 4;
  var cells = STAGES.map(function () { return new Array(NC).fill('todo'); });
  var ckStages = $('#ck-stages'), ckNote = $('#ck-note'), ckStatus = $('#ck-status');
  var runBtn = $('#ck-run'), crashBtn = $('#ck-crash'), resetBtn = $('#ck-reset');
  var timer = null, pos = 0, lastCk = 0, crashes = 0, redone = 0;
  ckStages.innerHTML = STAGES.map(function (s, i) {
    return '<div class="stage"><div class="stage__top"><span>' + s + '</span><span class="mono micro-r" id="ck-c' + i + '">0 / ' + NC + '</span></div><div class="stage__track" id="ck-t' + i + '">' +
      new Array(NC + 1).join('<span class="cell"></span>') + '</div></div>';
  }).join('');
  function at(g) { return [Math.floor(g / NC), g % NC]; }
  function set(g, v) { var p = at(g); cells[p[0]][p[1]] = v; }
  function paint() {
    STAGES.forEach(function (_, s) {
      var t = $('#ck-t' + s).children, done = 0;
      for (var i = 0; i < NC; i++) {
        var g = s * NC + i, st = cells[s][i];
        t[i].className = 'cell' + (st === 'done' ? ' cell--done' : st === 'run' ? ' cell--run' : st === 'lost' ? ' cell--lost' : '') +
          (st === 'done' && (g + 1) % CK === 0 && g < lastCk ? ' cell--ck' : '');
        if (st === 'done') done++;
      }
      $('#ck-c' + s).textContent = done + ' / ' + NC;
    });
  }
  function step() {
    if (pos > 0) set(pos - 1, 'done');
    if (pos % CK === 0) lastCk = pos;
    if (pos >= NC * STAGES.length) {
      clearInterval(timer); timer = null; lastCk = pos; paint();
      ckStatus.textContent = 'complete';
      ckNote.textContent = crashes ? 'Finished after ' + crashes + ' crash' + (crashes > 1 ? 'es' : '') + '. Batches redone: ' + redone + ' of ' + NC * STAGES.length + '.' : 'Finished. Try again, and crash it this time.';
      runBtn.disabled = true; crashBtn.disabled = true; return;
    }
    set(pos, 'run'); pos++; paint();
    ckStatus.textContent = 'running · ' + STAGES[at(pos - 1)[0]].toLowerCase();
  }
  runBtn.addEventListener('click', function () {
    for (var g = 0; g < NC * STAGES.length; g++) if (cells[at(g)[0]][at(g)[1]] === 'lost') set(g, 'todo');
    runBtn.disabled = true; crashBtn.disabled = false;
    ckNote.textContent = crashes ? 'Resumed from the checkpoint at batch ' + lastCk + '. Nothing before it is re-run.' : 'Running. Outlined dots are checkpoints, saved every ' + CK + ' batches.';
    timer = setInterval(step, 140);
  });
  crashBtn.addEventListener('click', function () {
    clearInterval(timer); timer = null; crashes++;
    var lost = 0; for (var g = lastCk; g < pos; g++) { set(g, 'lost'); lost++; }
    redone += lost;
    var where = STAGES[at(Math.max(pos - 1, 0))[0]];
    pos = lastCk; paint();
    ckStatus.textContent = 'crashed';
    ckNote.textContent = 'Crashed in ' + where.toLowerCase() + '. Resume redoes ' + lost + ' batch' + (lost === 1 ? '' : 'es') + '. Without checkpoints it would redo ' + (lastCk + lost) + '.';
    runBtn.textContent = 'Resume'; runBtn.disabled = false; crashBtn.disabled = true;
  });
  resetBtn.addEventListener('click', function () {
    clearInterval(timer); timer = null; pos = 0; lastCk = 0; crashes = 0; redone = 0;
    cells = STAGES.map(function () { return new Array(NC).fill('todo'); });
    runBtn.textContent = 'Run'; runBtn.disabled = false; crashBtn.disabled = true;
    ckStatus.textContent = 'idle'; ckNote.textContent = 'Start a run, then crash it partway through.'; paint();
  });
  paint();

  onScroll();
})();
