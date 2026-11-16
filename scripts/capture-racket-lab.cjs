const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, devices } = require('playwright');

async function main() {
  await fs.mkdir('docs/screenshots', { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const [name, options] of [
      ['desktop', { viewport: { width: 1440, height: 1000 } }],
      ['mobile', devices['iPhone 13']],
    ]) {
      const page = await browser.newPage(options);
      try {
        const response = await page.goto('http://127.0.0.1:3147/dashboard');
        assert.equal(response.status(), 200);
        await page.getByRole('heading', { name: 'Racket Lab', exact: true }).waitFor();
        await page.getByRole('region', { name: 'Browser data and backups' }).waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `docs/screenshots/${name}.png`, animations: 'disabled' });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
