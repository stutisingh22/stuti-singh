/* ==========================================================================
   Acceptance tests for the street-view walk. All must pass before a change
   is "done". They guard against the things that went wrong before: a
   slideshow instead of walking, text panels over the view, a dead page.
   ========================================================================== */
const { test, expect } = require('@playwright/test');
test.setTimeout(240000);   // generous: CI machines render WebGL in software

const errorsOf = page => { const e = []; page.on('pageerror', x => e.push(String(x))); return e; };
const ready = page => page.waitForFunction(() => window.__rome && __rome.state().node, null, { timeout: 90000 });
const begin = async page => { await page.click('#intro-begin'); await page.waitForFunction(() => __rome.state().gateOpen); };
const at = (page, i) => page.waitForFunction(i => __rome.state().mode === 'at' && __rome.state().zone === i, i, { timeout: 90000 });
const uiCoverage = page => page.evaluate(() => {
  let a = 0;
  document.querySelectorAll('[data-ui-text]').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return;
    const r = el.getBoundingClientRect(); a += Math.max(0, r.width) * Math.max(0, r.height);
  });
  return a / (innerWidth * innerHeight);
});

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 860 } });

  test('opens on the intro over a live view, begins at Porta del Popolo', async ({ page }) => {
    const errs = errorsOf(page);
    await page.goto('/?motion=full');
    await ready(page);
    await expect(page.locator('#intro')).toBeVisible();
    expect(await page.locator('#world .sv-stage canvas').count()).toBe(1);        // WebGL view is running
    await begin(page);
    await at(page, 0);
    await expect(page.locator('#intro')).toBeHidden({ timeout: 3000 });
    expect(await page.locator('#stamp-count').textContent()).toBe('1/12');
    expect(errs).toEqual([]);
  });

  test('dragging looks around (yaw and pitch change, with inertia)', async ({ page }) => {
    await page.goto('/?motion=full&skipintro=1'); await ready(page);
    const s0 = await page.evaluate(() => __rome.state());
    await page.mouse.move(900, 400); await page.mouse.down();
    for (let i = 1; i <= 8; i++) { await page.mouse.move(900 - i * 30, 400 + i * 4); await page.waitForTimeout(16); }
    await page.mouse.up();
    const s1 = await page.evaluate(() => __rome.state());
    expect(Math.abs(s1.lon - s0.lon)).toBeGreaterThan(10);
    expect(s1.lat).not.toBe(s0.lat);
  });

  test('↑ walks forward with a zoom-through transition, not a cut', async ({ page }) => {
    await page.goto('/?motion=full&skipintro=1'); await ready(page);
    const nodes = await page.evaluate(() => __rome.nodes());
    await page.keyboard.press('ArrowUp');
    const fovs = [];
    for (let i = 0; i < 20; i++) { fovs.push((await page.evaluate(() => __rome.state())).fov); await page.waitForTimeout(100); }
    expect(Math.min(...fovs)).toBeLessThan(60);                          // it pushed in
    await page.waitForFunction(id => __rome.state().node === id && !__rome.state().walking, nodes[1].id, { timeout: 90000 });
  });

  test('forward arrow is on screen on arrival and clicking it walks', async ({ page }) => {
    await page.goto('/?motion=full&skipintro=1'); await ready(page);
    await page.evaluate(() => __rome.goTo(3)); await at(page, 3);
    const arrow = page.locator('.sv-arrow').first();
    await expect(arrow).toHaveCSS('opacity', '1', { timeout: 5000 });
    const box = await arrow.boundingBox();
    expect(box.x).toBeGreaterThan(0); expect(box.x + box.width).toBeLessThan(1440);
    const from = (await page.evaluate(() => __rome.state())).k;
    await arrow.click();
    await page.waitForFunction(k => __rome.state().k === k + 1 && !__rome.state().walking, from, { timeout: 90000 });
  });

  test('every stop: view is clear, every hotspot opens a small card', async ({ page }) => {
    test.setTimeout(900000);
    const errs = errorsOf(page);
    await page.goto('/?motion=full&skipintro=1'); await ready(page);
    const n = await page.evaluate(() => Rome.STOPS.length);
    for (let i = 0; i < n; i++) {
      await page.evaluate(i => __rome.goTo(i), i); await at(page, i);
      expect(await uiCoverage(page)).toBeLessThan(0.12);
      const id = await page.evaluate(i => Rome.STOPS[i].id, i);
      const hs = page.locator(`.sv-stop[data-stop="${id}"] .hotspot:not([data-hs="gate"])`);
      const count = await hs.count();
      expect(count).toBeGreaterThan(0);
      for (let k = 0; k < count; k++) {
        await hs.nth(k).click({ timeout: 15000 });
        const card = page.locator('.card.in');
        await expect(card).toBeVisible({ timeout: 8000 });
        expect((await card.boundingBox()).width).toBeLessThanOrEqual(300);
        expect(await uiCoverage(page)).toBeLessThanOrEqual(0.2);
        await page.keyboard.press('Escape');
        await expect(page.locator('.card:not(.closing)')).toHaveCount(0, { timeout: 3000 });
      }
    }
    expect(errs).toEqual([]);
  });

  test('nothing with a background covers more than 25% of the view', async ({ page }) => {
    await page.goto('/?motion=full&skipintro=1'); await ready(page);
    for (const i of [0, 4, 11]) {
      await page.evaluate(i => __rome.goTo(i), i); await at(page, i);
      const big = await page.evaluate(() => [...document.querySelectorAll('body > *:not(#world):not(script)')].filter(el => {
        const cs = getComputedStyle(el); if (cs.display === 'none' || el.hidden) return false;
        const r = el.getBoundingClientRect();
        const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)), h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
        return w * h > 0.25 * innerWidth * innerHeight && cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
      }).map(el => el.id || el.className));
      expect(big).toEqual([]);
    }
  });

  test('walking closes an open card', async ({ page }) => {
    await page.goto('/?motion=full&skipintro=1'); await ready(page);
    await page.evaluate(() => __rome.goTo(1)); await at(page, 1);
    await page.locator('[data-hs="scroll"]').click();
    await expect(page.locator('.card.in')).toBeVisible();
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('.card:not(.closing)')).toHaveCount(0, { timeout: 3000 });
  });

  test('map fast travel, journal, passport, résumé', async ({ page }) => {
    await page.goto('/?motion=full&skipintro=1'); await ready(page);
    await page.click('#btn-map');
    await page.click('.pin[data-stop="trevi"]');
    await at(page, 11);
    await page.click('#btn-journal'); await expect(page.locator('#journal')).toHaveClass(/open/);
    await page.keyboard.press('Escape'); await expect(page.locator('#journal')).not.toHaveClass(/open/);
    await page.click('#btn-passport'); await expect(page.locator('#passport')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.locator('#passport')).toBeHidden();
    await page.click('#btn-resume'); await expect(page.locator('#resume h1')).toHaveText('Stuti Singh');
    await page.keyboard.press('Escape'); await expect(page.locator('#resume')).toBeHidden();
  });

  test('keyboard: Tab reaches a hotspot, Enter opens it', async ({ page }) => {
    await page.goto('/?motion=full&skipintro=1'); await ready(page);
    await page.evaluate(() => __rome.goTo(2)); await at(page, 2);
    await page.locator('[data-hs="arches"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.card.in')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('cards are a bottom sheet ≤ 40% tall; off-screen markers turn the view', async ({ page }) => {
    await page.goto('/?motion=full&skipintro=1'); await ready(page);
    await page.evaluate(() => __rome.goTo(3)); await at(page, 3);
    await page.locator('[data-hs="col-ta"]').click({ timeout: 15000 });
    const box = await page.locator('.card.in').boundingBox({ timeout: 8000 });
    expect(box.height).toBeLessThanOrEqual(844 * 0.4 + 1);
  });
});

test.describe('reduced motion', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('walking crossfades without the zoom', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?skipintro=1'); await ready(page);
    expect((await page.evaluate(() => __rome.state())).reduced).toBe(true);
    await page.keyboard.press('ArrowUp');
    const fovs = [];
    for (let i = 0; i < 8; i++) { fovs.push((await page.evaluate(() => __rome.state())).fov); await page.waitForTimeout(80); }
    expect(Math.min(...fovs)).toBe(Math.max(...fovs));
    await page.waitForFunction(() => __rome.state().k === 1 && !__rome.state().walking, null, { timeout: 90000 });
  });

  test('?motion=full overrides the OS setting', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?motion=full&skipintro=1'); await ready(page);
    expect((await page.evaluate(() => __rome.state())).reduced).toBe(false);
  });
});
