#!/usr/bin/env node
/* Enforces the text budgets in js/data.js. Run: node scripts/check-copy.js
   Exit code 1 = at least one budget broken. Run this after ANY copy change. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { window: {} }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'), ctx);
const R = ctx.window.Rome;
const words = s => (s || '').trim().split(/\s+/).filter(Boolean).length;
const fails = [];
const check = (where, text, max) => { const n = words(text); if (n > max) fails.push(`${where}: ${n} words (max ${max}) → "${text}"`); };
const ids = new Set();
R.STOPS.forEach(s => {
  if (ids.has(s.id)) fails.push(`duplicate stop id ${s.id}`); ids.add(s.id);
  check(`${s.id}.labelLine`, s.labelLine, 10);
  check(`${s.id}.journal.body`, s.journal && s.journal.body, 120);
  if (!s.hotspots || !s.hotspots.length) fails.push(`${s.id}: needs at least 1 hotspot`);
  (s.hotspots || []).forEach(h => {
    check(`${s.id}.${h.id}.tip`, h.tip, 4);
    if (h.widget === 'gate') return;
    check(`${s.id}.${h.id}.title`, h.title, 6);
    check(`${s.id}.${h.id}.body`, h.body, 35);
    if (h.x < 3 || h.x > 97 || h.y < 3 || h.y > 97) fails.push(`${s.id}.${h.id}: x/y must be 3–97 (% of the 900×520 box)`);
  });
});
const chips = new Set(R.SKILLS.flatMap(c => c.chips));
new Set(R.STOPS.flatMap(s => s.stack)).forEach(t => { if (!chips.has(t)) fails.push(`stack item "${t}" is not a chip in Rome.SKILLS (spelling must match exactly)`); });
if (fails.length) { console.error('✗ Copy budget check failed:\n  ' + fails.join('\n  ')); process.exit(1); }
console.log(`✓ Copy budgets OK — ${R.STOPS.length} stops, ${R.STOPS.reduce((n, s) => n + s.hotspots.length, 0)} hotspots.`);
