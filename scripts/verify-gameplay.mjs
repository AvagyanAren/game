import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173/?debug=1';
const OUT = process.env.ARTIFACT_DIR ?? '/opt/cursor/artifacts';

async function waitForGame(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__mayatnik?.snapshot(), null, { timeout: 20000 });
}

async function snapshot(page) {
  return page.evaluate(() => window.__mayatnik.snapshot());
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    await waitForGame(page);
    await page.waitForTimeout(3200);
    await page.screenshot({ path: `${OUT}/01-calm-idle-stacks.png` });
    let s = await snapshot(page);
    if (s.score !== 0 || s.gameOverVisible || s.hitsEnabled) {
      throw new Error(`Calm idle failed: ${JSON.stringify(s)}`);
    }

    await page.evaluate(() => window.__mayatnik.swing(1));
    await page.waitForTimeout(2200);
    s = await snapshot(page);
    await page.screenshot({ path: `${OUT}/02-mint-hit-score.png` });
    if (!s.hitsEnabled || s.score < 1) {
      throw new Error(`Mint hit / score failed: ${JSON.stringify(s)}`);
    }

    while (s.phase === 'playing') {
      await page.evaluate(() => window.__mayatnik.swing(1));
      await page.waitForTimeout(1800);
      s = await snapshot(page);
    }
    await page.screenshot({ path: `${OUT}/03-coral-game-over.png` });
    if (!s.gameOverVisible || s.phase !== 'gameover') {
      throw new Error(`Coral game over failed: ${JSON.stringify(s)}`);
    }

    await page.evaluate(() => window.__mayatnik.restart());
    await page.waitForTimeout(3200);
    s = await snapshot(page);
    await page.screenshot({ path: `${OUT}/04-restart-calm-stacks.png` });
    if (s.score !== 0 || s.gameOverVisible || s.hitsEnabled) {
      throw new Error(`Restart calm failed: ${JSON.stringify(s)}`);
    }

    console.log('VERIFY OK — screenshots in', OUT);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
