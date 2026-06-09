/**
 * One-off: hi-res element crops for visual surface comparison.
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const OUT = 'test-results/crops';
const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1440, height: 1600 },
	deviceScaleFactor: 2
});
await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(2500);
await page.getByRole('textbox').fill('crop-probe');
await page.getByRole('button', { name: 'Start' }).click();
await page
	.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
	.waitFor({ timeout: 15000 });
await page.waitForTimeout(1500);

const shots = {
	header: '.header',
	'page-bar': '.company-page-bar',
	sidebar: '.sidebar',
	'table-top': '.main-table'
};
for (const [name, sel] of Object.entries(shots)) {
	await page.locator(sel).first().screenshot({ path: `${OUT}/${name}.png` });
}
await browser.close();
console.log('crops written to', OUT);
