/* ==========================================================================
   ui.js — everything the visitor reads or clicks. Listens to engine events.
   Rules this file enforces:
     • Only ONE card open at a time; it closes the moment the walker moves.
     • Cards sit beside their hotspot (desktop) or as a ≤40vh bottom sheet
       (mobile). Never a full-width panel.
     • Long text lives only in the journal drawer and the résumé view.
   ========================================================================== */
window.Rome = window.Rome || {};
(function () {
  const E = Rome.engine, P = Rome.PERSON;
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, attrs = {}, html = '') => { const el = document.createElement(tag); for (const k in attrs) el.setAttribute(k, attrs[k]); el.innerHTML = html; return el; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isMobile = () => innerWidth < 700;
  const stopById = id => E.stops.find(s => s.id === id);

  // ---- storage (per-visitor convenience only) ------------------------------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('rome-walk:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('rome-walk:' + k, JSON.stringify(v)); } catch { /* private mode */ } }
  };
  const stamps = new Set(store.get('stamps', []));

  // ---- chrome ----------------------------------------------------------------
  $('#btn-github').href = P.github;
  const label = $('#label'), hint = $('#hint'), toastEl = $('#toast');
  const dots = $('#stamp-dots'), count = $('#stamp-count');
  dots.innerHTML = E.stops.map(s => `<i data-stop="${s.id}" title="${esc(s.name)}"></i>`).join('');
  function renderStamps() {
    dots.querySelectorAll('i').forEach(i => i.classList.toggle('on', stamps.has(i.dataset.stop)));
    count.textContent = `${stamps.size}/${E.stops.length}`;
    $('#btn-passport').setAttribute('aria-label', `Passport: ${stamps.size} of ${E.stops.length} stamps`);
    renderMapPins();
  }
  function award(stop) {
    if (stamps.has(stop.id)) return;
    stamps.add(stop.id); store.set('stamps', [...stamps]);
    renderStamps();
    const dot = dots.querySelector(`[data-stop="${stop.id}"]`);
    dot && (dot.classList.remove('pop'), void dot.offsetWidth, dot.classList.add('pop'));
  }
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  // hint
  const HINTS = {
    start: '',
    walk: isMobile() ? 'Drag to look · tap the arrows to walk' : 'Scroll to walk through · drag to look around',
  };
  hint.textContent = HINTS.start;
  let walkedFor = 0;
  E.on('gate-open', () => { hint.textContent = HINTS.walk; });
  E.on('frame', ({ mode }) => {
    if (E.state().gateOpen && Math.abs(E.state().v) > 30) walkedFor += 1 / 60;
    if (walkedFor > 5 && !hint.classList.contains('gone')) hint.classList.add('gone');
  });

  // ---- hold buttons --------------------------------------------------------
  [['#hold-l', -1], ['#hold-r', 1]].forEach(([sel, dir]) => {
    const b = $(sel);
    b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); E.setHold(dir); });
    const up = () => E.setHold(0);
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); E.step(dir); } });
  });

  // ---- hotspots ------------------------------------------------------------
  E.stops.forEach(stop => {
      const cast = stop.hotspots.filter(hs => hs.widget !== 'gate').reduce((a, b) => (b.y > a.y ? b : a));
      stop.hotspots.forEach(hs => {
      const reader = hs === cast;
      const b = h('button', { class: 'hotspot' + (reader ? ' reader' : ''), 'data-hs': hs.id, tabindex: '-1', style: `left:${hs.x}%;top:${hs.y}%`, 'aria-label': `${hs.tip} — ${stop.name}` },
        `<span class="ring" aria-hidden="true"></span><span class="tip" aria-hidden="true">${esc(hs.tip)}</span>`);
      b.addEventListener('click', e => { e.stopPropagation(); activate(stop, hs, b); });
      stop.el.appendChild(b);
      hs.btn = b;
    });
  });

  async function activate(stop, hs, btn) {
    if (hs.widget === 'gate') { E.openGate(); return; }
    if (card && card.hs === hs && card.again) { card.again(); return; }
    if (E.isOffscreen && E.isOffscreen(hs)) { closeCard(); const a = E.angles(hs); await E.lookAt(a.yaw, a.pitch); }
    const s = E.state();
    if (s.zone !== stop.index || s.mode !== 'at') { closeCard(); await E.goTo(stop.index); }
    if (hs.widget === 'coin') { await tossCoin(stop); }
    openCard(stop, hs, btn);
  }

  // stop state → landmark classes, label, stamps
  let current = null;
  E.on('mode', (mode, stop) => {
    if (current && current !== stop) setLm(current, null);
    current = stop;
    setLm(stop, mode);
    if (mode === 'at' && (stop.index > 0 || E.state().gateOpen)) award(stop);
    if (mode === 'at' && stop.index > 0) hint.classList.add('gone');
    if (mode !== 'at' && card && !card.pending) closeCard(true);
    if (guide) guide.hidden = true;
    renderMapPins();
  });
  E.on('gate-open', () => award(E.stops[0]));
  function setLm(stop, mode) {
    stop.el.classList.toggle('lm-approach', mode === 'approach');
    stop.el.classList.toggle('lm-at', mode === 'at');
    stop.hotspots.forEach(hs => hs.btn.tabIndex = mode ? 0 : -1);
  }

  // The sentence is the thread. It sits on the picture and changes as the next street arrives.
  const titleA = label.querySelector('strong.a'), titleB = label.querySelector('strong.b');
  const lineA = label.querySelector('span.a'), lineB = label.querySelector('span.b');
  const said = k => {
    const n = E.nodes[k];
    if (!n) return { title: '', line: '' };
    const s = n.stop || E.stops[n.stopIndex + 1];
    return s ? { title: s.labelTitle || s.name, line: s.labelLine } : { title: '', line: '' };
  };
  E.on('frame', ({ blend, toward, approach, mode }) => {
    const passing = !!(E.state && E.state().walking);
    document.documentElement.classList.toggle('passing', passing);
    const s = E.state();
    const from = s.k, to = toward == null ? from : toward;
    // The next sentence arrives while the street is still rushing up, not with the cut.
    const u = Math.max(blend || 0, approach || 0);
    const swap = u > 0.45 ? 1 : 0;
    const A = said(from), B = said(to);
    titleA.textContent = A.title; titleB.textContent = B.title;
    lineA.textContent = A.line; lineB.textContent = B.line;
    titleA.style.opacity = lineA.style.opacity = String(1 - swap);
    titleB.style.opacity = lineB.style.opacity = String(swap);
    label.style.opacity = mode === 'at' || s.gateOpen ? '1' : label.style.opacity;
    label.style.visibility = 'visible';
    placeGuide();
  });
  function placeGuide() {
    if (!guide || guide.hidden) return;
    const a = document.querySelector('.sv-arrow[aria-label^="Walk on"]');
    if (!a) return;
    const r = a.getBoundingClientRect();
    guide.style.left = Math.max(8, r.left - 56) + 'px';
    guide.style.top = Math.max(72, r.top - 28) + 'px';
    guide.style.bottom = 'auto';
  }

  // ---- cards ---------------------------------------------------------------
  let card = null;
  const cardRoot = $('#card-root');

  function openCard(stop, hs, btn) {
    closeCard(true);
    const stat = hs.stat ? `<p class="stat"><strong>${esc(hs.stat.value)}</strong> <span>${esc(hs.stat.label)}</span></p>` : '';
    const el = h('div', { class: 'card', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'card-title', 'data-ui-text': '' },
      `<button class="card-close" aria-label="Close">×</button>
       <h3 id="card-title" tabindex="-1">${esc(hs.title)}</h3>
       <p class="card-body">${esc(hs.body)}</p>
       <div class="widget"></div>${stat}
       <button class="card-more">Read more in the journal</button>`);
    cardRoot.appendChild(el);
    card = { el, stop, hs, btn, cleanup: null, again: null };
    btn.classList.add('active');
    const widgetName = (hs.widget || '').split(':')[0];
    if (Rome.widgets[widgetName]) {
      const res = Rome.widgets[widgetName]($('.widget', el), { stop, hs, arg: (hs.widget || '').split(':')[1], card: el, close: closeCard }) || {};
      card.cleanup = res.cleanup; card.again = res.again;
    } else $('.widget', el).remove();
    $('.card-close', el).onclick = () => closeCard();
    $('.card-more', el).onclick = () => { closeCard(); openJournal(stop.id); };
    placeCard();
    requestAnimationFrame(() => el.classList.add('in'));
    $('#card-title', el).focus({ preventScroll: true });
  }
  function placeCard() {
    if (!card) return;
    const el = card.el;
    el.classList.toggle('sheet', isMobile());
    if (isMobile()) { el.style.left = el.style.top = ''; return; }
    const r = card.btn.getBoundingClientRect(), w = el.offsetWidth, ht = el.offsetHeight;
    let left = r.right + 14;
    if (left + w > innerWidth - 12) left = r.left - 14 - w;
    left = Math.max(12, left);
    const top = Math.max(68, Math.min(innerHeight - 64 - ht, r.top + r.height / 2 - ht / 2));
    el.style.left = `${left}px`; el.style.top = `${top}px`;
  }
  function closeCard(silent) {
    if (!card) return;
    const c = card; card = null;
    c.cleanup && c.cleanup();
    c.btn.classList.remove('active');
    c.el.classList.remove('in'); c.el.classList.add('closing');
    setTimeout(() => c.el.remove(), 160);
    if (!silent) summon(c.stop);
    if (!silent && document.activeElement && c.el.contains(document.activeElement)) c.btn.focus({ preventScroll: true });
  }
  const guide = $('#guide');
  function summon() {
    if (guide) guide.hidden = true;
  }
  guide.addEventListener('click', () => { guide.hidden = true; E.step(1); });
  E.on('input', () => closeCard());
  E.on('move-start', () => { if (card && !card.pending) closeCard(); });
  E.on('tap-world', () => closeCard());
  E.on('layout', placeCard);
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#resume').hidden) return closeResume();
    if (!$('#passport').hidden) return closePassport();
    if ($('#journal').classList.contains('open')) return closeJournal();
    if (!$('#minimap').hidden) return toggleMap(false);
    closeCard();
  });

  // ---- widgets (small, self-contained, ≤ 300px wide) -----------------------
  const RM = E.reduced;
  const W = (Rome.widgets = {});

  W.duel = root => {
    root.innerHTML = `<div class="duel">
      <div class="duel-row"><span>General-purpose LLM</span><div class="bar"><i class="b1"></i></div><b class="n1">0%</b></div>
      <div class="duel-row win"><span>My pipeline</span><div class="bar"><i class="b2"></i></div><b class="n2">0%</b></div>
      <button class="mini">Run again</button></div>`;
    let raf;
    const run = () => {
      cancelAnimationFrame(raf);
      const t0 = performance.now(), D = RM ? 1 : 1600;
      const f = t => {
        const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
        $('.b1', root).style.width = `${40 * e}%`; $('.b2', root).style.width = `${96 * e}%`;
        $('.n1', root).textContent = `${Math.round(40 * e)}%`;
        $('.n2', root).textContent = k < 1 ? `${Math.round(96 * e)}%` : '95–97%';
        if (k < 1) raf = requestAnimationFrame(f);
      };
      raf = requestAnimationFrame(f);
    };
    $('.mini', root).onclick = run; run();
    return { cleanup: () => cancelAnimationFrame(raf) };
  };

  W.pipeline = (root, { stop }) => {
    const stages = ['Ingest', 'Clean', 'Dedupe', 'Validate', 'Enrich'];
    root.innerHTML = `<ol class="stages">${stages.map(s => `<li>${s}</li>`).join('')}</ol>`;
    const lis = root.querySelectorAll('li'), arches = stop.el.querySelectorAll('.arch');
    let i = 0, timer;
    const stepFn = () => {
      lis.forEach((l, k) => l.classList.toggle('lit', k === i % 5));
      arches.forEach((a, k) => a.classList.toggle('lit', k === i % 5));
      i++; if (i < 10) timer = setTimeout(stepFn, 520);
      else { lis.forEach(l => l.classList.add('done')); arches.forEach(a => a.classList.remove('lit')); }
    };
    if (RM) lis.forEach(l => l.classList.add('done')); else stepFn();
    return { cleanup: () => { clearTimeout(timer); arches.forEach(a => a.classList.remove('lit')); } };
  };

  W.forum = (root, { stop, arg }) => {
    const idx = ['HR', 'Sales', 'Finance', 'TA'].indexOf(arg);
    let seed = idx * 97 + 13; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const pts = Array.from({ length: 12 }, (_, i) => 40 - i * 1.6 - rnd() * 14);
    const path = pts.map((y, i) => `${i ? 'L' : 'M'}${i * 23},${Math.max(4, y)}`).join(' ');
    root.innerHTML = `<figure class="spark"><svg viewBox="0 0 256 50" aria-hidden="true"><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"/></svg><figcaption>Illustrative trend, synthetic data</figcaption></figure>`;
    const col = stop.el.querySelector(`.col-${idx}`);
    col && col.classList.add('raised');
    return { cleanup: () => col && col.classList.remove('raised') };
  };

  W.review = root => {
    const recs = [0.94, 0.62, 0.88, 0.41, 0.97], TH = 0.75;
    root.innerHTML = `<div class="review"><div class="oc">AI classifier · threshold ${TH}</div><div class="lane"></div>
      <div class="trays"><div class="tray ok">Saved <b>0</b></div><div class="tray rv">Needs review <b>0</b></div></div></div>`;
    const lane = $('.lane', root); let ok = 0, rv = 0; const timers = [];
    recs.forEach((c, i) => timers.push(setTimeout(() => {
      const d = h('span', { class: 'rec' }, c.toFixed(2)); lane.appendChild(d);
      const go = c >= TH ? 'ok' : 'rv';
      timers.push(setTimeout(() => d.classList.add('to-' + go), 40));
      timers.push(setTimeout(() => { d.remove(); go === 'ok' ? ok++ : rv++; $('.tray.ok b', root).textContent = ok; $('.tray.rv b', root).textContent = rv; $('.tray.' + go, root).classList.add('bump'); setTimeout(() => $('.tray.' + go, root)?.classList.remove('bump'), 250); }, RM ? 0 : 900));
    }, RM ? 0 : i * 650)));
    return { cleanup: () => timers.forEach(clearTimeout) };
  };

  W.race = root => {
    const leads = [
      ['Lead A', 'Hot', 'Series A, ex-operator founder, meets 5 of 5 criteria.'],
      ['Lead B', 'Warm', 'Seed stage, meets 3 of 5 criteria.'],
      ['Lead C', 'Cold', 'Enterprise, outside the target size.'],
      ['Lead D', 'Unknown', 'Funding stage not found, so marked unknown.'],
      ['Lead E', 'Hot', 'Series B, hiring data roles, meets 4 of 5.'],
      ['Lead F', 'Warm', 'Right sector, founder background unclear.']
    ];
    root.innerHTML = `<div class="race"><div class="rows">${leads.map((l, i) => `<button class="row" data-i="${i}" disabled><span class="nm">${l[0]}</span><span class="trk"><i></i></span><span class="tier"></span></button>`).join('')}</div>
      <p class="why">Sample leads. Click one to see why.</p></div>`;
    const rows = root.querySelectorAll('.row'), timers = [];
    rows.forEach((r, i) => {
      const dur = RM ? 0 : 900 + ((i * 373) % 900);
      r.style.setProperty('--dur', `${dur}ms`);
      timers.push(setTimeout(() => r.classList.add('go'), 30));
      timers.push(setTimeout(() => { r.classList.add('done', 't-' + leads[i][1].toLowerCase()); $('.tier', r).textContent = leads[i][1]; r.disabled = false; }, dur + 60));
      r.onclick = () => { rows.forEach(x => x.classList.remove('sel')); r.classList.add('sel'); $('.why', root).textContent = `${leads[i][0]}: ${leads[i][2]}`; };
    });
    return { cleanup: () => timers.forEach(clearTimeout) };
  };

  W.shelves = (root, { stop }) => {
    root.innerHTML = `<ul class="sources">${['Local files', 'Google Drive', 'Gmail', 'Git'].map(s => `<li>${s}</li>`).join('')}</ul>`;
    stop.el.classList.remove('filling'); void stop.el.offsetWidth; stop.el.classList.add('filling');
    const lis = root.querySelectorAll('li'), timers = [];
    lis.forEach((l, i) => timers.push(setTimeout(() => l.classList.add('lit'), RM ? 0 : 300 + i * 350)));
    return { cleanup: () => timers.forEach(clearTimeout) };
  };

  W.scales = (root, { stop }) => {
    root.innerHTML = `<label class="split">Budget split <input type="range" min="0" max="100" value="50" aria-label="R&D versus marketing split"><span class="ends"><span>R&amp;D</span><span>Marketing</span></span></label><p class="note">Conceptual only. No findings shown.</p>`;
    const beam = stop.el.querySelector('.beam'), inp = $('input', root);
    const set = () => beam && (beam.style.transform = `rotate(${(inp.value - 50) * 0.25}deg)`);
    inp.oninput = set; set();
    return { cleanup: () => beam && (beam.style.transform = '') };
  };

  W.bocca = (root, { stop }) => {
    let i = 0;
    const jaw = stop.el;
    const show = () => {
      const [t, d] = stop.principles[i];
      root.innerHTML = `<div class="principle"><span class="of">${i + 1} of ${stop.principles.length}</span><strong>${esc(t)}</strong><p>${esc(d)}</p>${i < stop.principles.length - 1 ? '<button class="mini">Next principle</button>' : '<p class="done">That’s all five. No bites today.</p>'}</div>`;
      const b = $('.mini', root); b && (b.onclick = next);
      if (i === stop.principles.length - 1) { jaw.classList.remove('chomp'); void jaw.offsetWidth; jaw.classList.add('chomp'); }
    };
    const next = () => { if (i < stop.principles.length - 1) { i++; show(); } };
    const body = root.parentElement.querySelector('.card-body'); body && body.remove();
    show();
    return { again: next };
  };

  W.stall = (root, { arg, close }) => {
    const cat = Rome.SKILLS[+arg];
    root.innerHTML = `<div class="chips">${cat.chips.map(c => `<button class="chip">${esc(c)}</button>`).join('')}</div><p class="used" aria-live="polite"></p>`;
    root.querySelectorAll('.chip').forEach(b => b.onclick = () => {
      root.querySelectorAll('.chip').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
      const where = E.stops.filter(s => s.stack.includes(b.textContent));
      const used = $('.used', root);
      if (!where.length) { used.textContent = 'On my résumé, not on this walk yet.'; highlightPins([]); return; }
      used.innerHTML = `Used at: ${where.map(s => esc(s.name)).join(', ')}. <button class="link">Show on map</button>`;
      $('.link', used).onclick = () => { close(); highlightPins(where.map(s => s.id)); toggleMap(true); };
    });
  };

  W.coin = root => {
    const links = [
      ['Email', `mailto:${P.email}`], ['GitHub', P.github],
      P.linkedin ? ['LinkedIn', P.linkedin] : null, ['Download résumé', P.resumePdf]
    ].filter(Boolean);
    root.innerHTML = `<ul class="contact">${links.map(([t, u]) => `<li><a href="${u}" ${u.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} ${t.startsWith('Download') ? 'download' : ''}>${t}</a></li>`).join('')}</ul>`;
  };

  function tossCoin(stop) {
    return new Promise(res => {
      stop.el.classList.remove('tossing'); void stop.el.offsetWidth; stop.el.classList.add('tossing');
      setTimeout(() => {
        res();
        store.set('coin', true);
        setTimeout(() => {
          if (stamps.size === E.stops.length) openPassport(true);
          else toast(`You have ${stamps.size} of ${E.stops.length} stamps. Walk back any time.`);
        }, 2600);
      }, RM ? 0 : 1100);
    });
  }

  // ---- journal -------------------------------------------------------------
  const J = $('#journal');
  $('#journal-tabs').innerHTML = E.stops.map(s => `<button role="tab" data-stop="${s.id}">${esc(s.name)}</button>`).join('');
  $('#journal-tabs').onclick = e => { const b = e.target.closest('[data-stop]'); b && showJournal(b.dataset.stop); };
  function showJournal(id) {
    const s = stopById(id), j = s.journal;
    J.querySelectorAll('[role=tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.stop === id));
    J.querySelector(`[data-stop="${id}"]`).scrollIntoView({ block: 'nearest', inline: 'center' });
    const repos = (j.repos || []).map(r => `<li><a href="${r.url}" target="_blank" rel="noopener">${esc(r.name)}</a>${r.description ? ` <span>${esc(r.description)}</span>` : ''}</li>`).join('');
    $('#journal-body').innerHTML = `
      <p class="j-place">${esc(s.name)}</p><h2>${esc(j.title)}</h2><p>${esc(j.body)}</p>
      ${s.stack.length ? `<h3>Built with</h3><ul class="stack">${s.stack.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      ${repos ? `<h3>Side streets on GitHub</h3><ul class="repos">${repos}</ul>` : ''}
      <button class="mini go">Walk to ${esc(s.name)}</button>`;
    $('.go', J).onclick = () => { closeJournal(); E.goTo(s.index); };
  }
  function openJournal(id) {
    showJournal(id || E.stops[E.state().zone].id);
    J.classList.add('open'); J.setAttribute('aria-hidden', 'false'); E.setPaused(true);
    $('#journal-close').focus();
  }
  function closeJournal() { J.classList.remove('open'); J.setAttribute('aria-hidden', 'true'); E.setPaused(false); }
  $('#journal-close').onclick = closeJournal;
  $('#btn-journal').onclick = () => (J.classList.contains('open') ? closeJournal() : (closeCard(), openJournal()));

  // ---- minimap -------------------------------------------------------------
  const map = $('#minimap');
  const route = E.stops.map(s => `${s.map.x * 3},${s.map.y * 2.2}`).join(' ');
  $('#map-svg').innerHTML = `<path class="tiber" d="M60,0 C20,50 60,90 30,130 C0,170 70,190 110,220"/><polyline class="route" points="${route}"/>`;
  $('#map-pins').innerHTML = E.stops.map((s, i) => `<button class="pin" data-stop="${s.id}" style="left:${s.map.x}%;top:${s.map.y}%" aria-label="Travel to ${esc(s.name)}"><span>${i + 1}</span><em>${esc(s.name)}</em></button>`).join('');
  $('#map-pins').onclick = e => { const b = e.target.closest('.pin'); if (!b) return; toggleMap(false); closeCard(); E.goTo(stopById(b.dataset.stop).index); };
  let hl = [];
  function highlightPins(ids) { hl = ids; renderMapPins(); }
  function renderMapPins() {
    const z = E.stops[E.state().zone].id;
    const you = $('#map-you'), m = E.state().map;
    if (you && m) { you.style.left = m.x + '%'; you.style.top = m.y + '%'; }
    map.querySelectorAll('.pin').forEach(p => {
      p.classList.toggle('visited', stamps.has(p.dataset.stop));
      p.classList.toggle('here', p.dataset.stop === z);
      p.classList.toggle('hl', hl.includes(p.dataset.stop));
    });
  }
  function toggleMap(show) {
    map.hidden = show === undefined ? !map.hidden : !show;
    $('#btn-map').setAttribute('aria-expanded', !map.hidden);
    if (map.hidden) hl = [];
    renderMapPins();
  }
  $('#btn-map').onclick = () => toggleMap();
  $('#map-close').onclick = () => toggleMap(false);

  // ---- passport ------------------------------------------------------------
  const PP = $('#passport');
  function openPassport(complete) {
    const all = stamps.size === E.stops.length;
    $('#passport-grid').innerHTML = E.stops.map(s => `<li class="${stamps.has(s.id) ? 'on' : ''}"><span class="seal">${s.stamp}</span><small>${esc(s.name)}</small></li>`).join('');
    $('#passport-title').textContent = all ? 'Passport complete' : 'Your passport';
    $('#passport-note').textContent = all ? 'You walked all of Rome. Thanks for the visit.' : `${stamps.size} of ${E.stops.length} stamps. Every landmark you stop at adds one.`;
    PP.hidden = false; E.setPaused(true); $('#passport-close').focus();
    PP.classList.toggle('complete', !!complete && all);
  }
  function closePassport() { PP.hidden = true; E.setPaused(false); }
  $('#btn-passport').onclick = () => openPassport(false);
  $('#passport-close').onclick = closePassport;
  $('#passport-again').onclick = () => { closePassport(); E.goTo(0); };
  $('#passport-resume').onclick = () => { closePassport(); openResume(); };
  PP.onclick = e => { if (e.target === PP) closePassport(); };

  // ---- résumé view (no game) -----------------------------------------------
  const RV = $('#resume');
  function buildResume() {
    const R = Rome.RESUME;
    const roles = R.roles.map(r => { const s = stopById(r.stop); return `<article><header><h3>${esc(r.org)}</h3><p>${esc(r.title)}</p><time>${esc(r.dates)}</time></header><p>${esc(s.journal.body)}</p></article>`; }).join('');
    const projects = R.projects.map(id => { const s = stopById(id); return `<article><h3>${esc(s.journal.title.replace('Project · ', ''))}</h3><p>${esc(s.journal.body)}</p></article>`; }).join('');
    const skills = Rome.SKILLS.map(c => `<div><h4>${esc(c.name)}</h4><p>${c.chips.map(esc).join(', ')}</p></div>`).join('');
    const pr = stopById('bocca').principles.map(([t, d]) => `<li><strong>${esc(t)}.</strong> ${esc(d)}</li>`).join('');
    $('#resume-body').innerHTML = `
      <header class="r-head"><h1>${esc(P.name)}</h1><p>${esc(P.role)} · ${esc(P.location)}</p>
        <p class="r-links"><a href="mailto:${P.email}">${P.email}</a> · <a href="${P.github}" target="_blank" rel="noopener">GitHub</a>${P.linkedin ? ` · <a href="${P.linkedin}" target="_blank" rel="noopener">LinkedIn</a>` : ''} · <a href="${P.resumePdf}" download>PDF</a></p></header>
      <section><h2>Experience</h2>${roles}</section>
      <section><h2>Projects</h2>${projects}</section>
      <section><h2>How I work</h2><ul class="r-principles">${pr}</ul></section>
      <section><h2>Skills</h2><div class="r-skills">${skills}</div></section>
      <section><h2>Education</h2><p>${esc(R.education)}</p></section>`;
  }
  function openResume() { buildResume(); RV.hidden = false; E.setPaused(true); document.body.classList.add('resume-open'); $('#resume-back').focus(); history.replaceState(null, '', '#resume'); }
  function closeResume() { RV.hidden = true; E.setPaused(false); document.body.classList.remove('resume-open'); history.replaceState(null, '', location.pathname + location.search); }
  $('#btn-resume').onclick = openResume;
  $('#resume-back').onclick = closeResume;
  $('#resume-print').onclick = () => print();
  $('#brand').onclick = e => { e.preventDefault(); closeCard(); E.goTo(0); };

  // ---- sound (off by default, WebAudio, no files) --------------------------
  Rome.sound = {
    on: false, ctx: null, acc: 0, fountain: null,
    enable() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        this.ctx = new AC();
        const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noise = buf;
        const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.6;
        const g = this.ctx.createGain(); g.gain.value = 0;
        src.connect(bp).connect(g).connect(this.ctx.destination); src.start();
        this.fountain = g;
      }
      this.ctx.resume();
    },
    step() {
      const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
      const g = c.createGain(); const t = c.currentTime;
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      s.connect(f).connect(g).connect(c.destination); s.start(t, Math.random()); s.stop(t + 0.08);
    },
    tick(dt, v, x, treviX) {
      if (!this.on || !this.ctx) return;
      const sp = Math.abs(v);
      if (sp > 40) { this.acc += dt; const every = Math.max(0.3, Math.min(0.6, 180 / sp)); if (this.acc > every) { this.acc = 0; this.step(); } }
      this.fountain.gain.value = Math.max(0, 1 - Math.abs(x - treviX) / 1600) * 0.05;
    }
  };
  $('#btn-sound').onclick = e => {
    const s = Rome.sound; s.on = !s.on; if (s.on) s.enable(); else if (s.fountain) s.fountain.gain.value = 0;
    e.currentTarget.setAttribute('aria-pressed', s.on);
    e.currentTarget.textContent = s.on ? 'Sound on' : 'Sound off';
  };

  // ---- view editor: ?edit=1 --------------------------------------------------
  // Look around, drag markers onto objects, and set where the walk arrows sit.
  // Copy the snippet into js/data.js (hotspot yaw/pitch, and Rome.VIEWS).
  if (E.editing) {
    document.body.classList.add('editing');
    const views = {};
    const panel = h('div', { class: 'edit-panel' }, `<strong>View editor</strong> · drag markers · look, then set arrows
      <div class="edit-row"><button class="mini" data-set="arriveYaw">Face here on arrival</button><button class="mini" data-set="nextYaw">Forward arrow here</button><button class="mini" data-set="backYaw">Back arrow here</button></div>
      <pre></pre><button class="mini copy">Copy snippet</button>`);
    document.body.appendChild(panel);
    const render = () => {
      const st = E.state(), n = E.nodes[st.k], v = { arriveYaw: n.arriveYaw, nextYaw: n.nextYaw, backYaw: n.backYaw, ...views[n.id] };
      let out = `// Rome.VIEWS in js/data.js\n'${n.id}': { arriveYaw: ${v.arriveYaw}, nextYaw: ${v.nextYaw}, backYaw: ${v.backYaw} },`;
      if (n.stop) out += `\n\n// hotspots for ${n.stop.id} (add yaw/pitch to each)\n` + n.stop.hotspots.map(hs => { const a = E.angles(hs, n); return `{ id: '${hs.id}', yaw: ${Math.round(a.yaw * 10) / 10}, pitch: ${Math.round(a.pitch * 10) / 10} }`; }).join(',\n');
      $('pre', panel).textContent = out;
    };
    panel.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
      const st = E.state(), n = E.nodes[st.k], yaw = Math.round((((st.lon + 180) % 360 + 360) % 360 - 180) * 10) / 10;
      views[n.id] = { ...views[n.id], [b.dataset.set]: yaw }; n[b.dataset.set] = yaw; render();
    });
    $('.copy', panel).onclick = () => navigator.clipboard && navigator.clipboard.writeText($('pre', panel).textContent).then(() => toast('Copied. Paste it into js/data.js.'));
    E.on('mode', render);
    E.stops.forEach(stop => stop.hotspots.forEach(hs => {
      const b = hs.btn;
      b.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation(); b.setPointerCapture(e.pointerId);
        const move = ev => { const d = E.screenDir(ev.clientX, ev.clientY); hs.yaw = d.yaw; hs.pitch = d.pitch; render(); };
        const up = () => { b.removeEventListener('pointermove', move); b.removeEventListener('pointerup', up); };
        b.addEventListener('pointermove', move); b.addEventListener('pointerup', up);
      });
      b.addEventListener('click', e => e.stopImmediatePropagation(), true);
    }));
  }

  // ---- boot --------------------------------------------------------------------
  renderStamps();
  if (location.hash === '#resume') openResume();
  Rome.ui = { openCard, closeCard, openJournal, openResume, toggleMap, openPassport };
})();
