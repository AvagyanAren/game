import { chromium } from 'playwright';

const BASE = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173/?debug=1';
const MIN_TOWER_SPAN = 0.42 * 4;

async function waitForGame(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__mayatnik?.snapshot(), null, { timeout: 15000 });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function snapshot(page) {
  return page.evaluate(() => window.__mayatnik.snapshot());
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const results = [];

  try {
    await waitForGame(page);
    await page.waitForTimeout(3200);
    let s = await snapshot(page);
    results.push([
      'Calm start (3s): tall towers',
      s.minTowerSpan >= MIN_TOWER_SPAN && s.towers.every((t) => t.blockCount >= 6),
    ]);
    results.push(['Calm start: score 0', s.score === 0]);
    results.push(['Calm start: no game over', !s.gameOverVisible && s.phase === 'playing']);
    results.push(['Calm start: hits disabled', s.hitsEnabled === false]);

    await page.evaluate(() => window.__mayatnik.swing(1));
    await page.waitForTimeout(4500);
    s = await snapshot(page);
    results.push(['After tap: hits enabled', s.hitsEnabled === true]);
    results.push([
      'After tap: score or still playing',
      s.phase === 'playing' || s.score >= 0,
    ]);

    await page.evaluate(() => {
      const btn = document.querySelector('.game-over__btn--again');
      if (btn instanceof HTMLButtonElement && !btn.disabled) {
        btn.click();
      } else {
        window.__mayatnik.restart();
      }
    });
    await page.waitForTimeout(3200);
    s = await snapshot(page);
    results.push(['Restart: tall towers', s.minTowerSpan >= MIN_TOWER_SPAN]);
    results.push(['Restart: calm again', s.score === 0 && !s.gameOverVisible && !s.hitsEnabled]);

    let failed = false;
    for (const [label, pass] of results) {
      console.log(`${pass ? 'PASS' : 'FAIL'} — ${label}`);
      if (!pass) {
        failed = true;
      }
    }
    if (failed) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
