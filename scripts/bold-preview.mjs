/**
 * Bold-pass preview: main page with selections so the quote panel has lines,
 * plus a hover state. Run with the dev server up.
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const OUT = 'test-results/bold-preview';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(1500);
await page.getByRole('textbox').fill('bold-preview-user');
await page.getByRole('button', { name: 'Start' }).click();
await page
	.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
	.waitFor({ timeout: 15000 });
await page.waitForTimeout(2000);

// Tick a few modules so the quote panel shows money (the real inputs are
// visually hidden — click the custom checkbox controls)
for (let i = 0; i < 4; i++) {
	// Re-query each round — checking a box can re-render/collapse the list
	const visible = page.locator('tbody .checkbox-control:visible');
	if ((await visible.count()) <= i) break;
	await visible.nth(i).click({ force: true });
	await page.waitForTimeout(300);
}
await page.waitForTimeout(1200);

await page.screenshot({ path: `${OUT}/01-main-relit.png` });

// Header close-up
await page.screenshot({
	path: `${OUT}/02-header.png`,
	clip: { x: 0, y: 0, width: 1440, height: 130 }
});

// Quote panel close-up (right sidebar)
await page.screenshot({
	path: `${OUT}/03-quote-panel.png`,
	clip: { x: 1080, y: 80, width: 360, height: 500 }
});

await browser.close();
console.log('Bold preview screenshots written to', OUT);
