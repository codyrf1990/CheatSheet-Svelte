/**
 * One-off: dump computed surface styles (background + backdrop-filter)
 * for the header, page bar, calculator, and cards.
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(2500);
await page.getByRole('textbox').fill('style-probe');
await page.getByRole('button', { name: 'Start' }).click();
await page
	.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
	.waitFor({ timeout: 15000 });
await page.waitForTimeout(1500);

const report = await page.evaluate(() => {
	const targets = {
		header: '.header',
		'page-bar': '.company-page-bar',
		calculator: '.calculator-panel',
		'quote-tile': '.quote-tile',
		'main-table': '.main-table',
		'sku-wrapper': '.sku-under-wrapper'
	};
	const out = {};
	for (const [name, sel] of Object.entries(targets)) {
		const el = document.querySelector(sel);
		if (!el) {
			out[name] = 'NOT FOUND';
			continue;
		}
		const s = getComputedStyle(el);
		out[name] = {
			bg: s.backgroundColor,
			bgImage: s.backgroundImage === 'none' ? 'none' : s.backgroundImage.slice(0, 60),
			backdrop: s.backdropFilter
		};
	}
	return out;
});

for (const [name, v] of Object.entries(report)) {
	console.log(name.padEnd(12), JSON.stringify(v));
}
await browser.close();
