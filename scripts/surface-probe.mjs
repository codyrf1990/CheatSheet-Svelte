/**
 * One-off: pixel-sample the rendered surfaces of the page bar, calculator,
 * quote tile, sku wrapper, and table to compare opacity/brightness.
 * Uses 1x1 screenshot clips so PNG row filtering can't distort values.
 * Run with the dev server up: node scripts/surface-probe.mjs
 */
import { chromium } from '@playwright/test';
import { inflateSync } from 'node:zlib';

const BASE = 'http://localhost:5173';

function onePixel(buf) {
	let pos = 8;
	const idat = [];
	while (pos < buf.length) {
		const len = buf.readUInt32BE(pos);
		const type = buf.toString('ascii', pos + 4, pos + 8);
		if (type === 'IDAT') idat.push(buf.subarray(pos + 8, pos + 8 + len));
		pos += 12 + len;
	}
	const raw = inflateSync(Buffer.concat(idat));
	// 1x1 RGBA image: [filter, r, g, b, a] — neighbors are 0, so any filter is identity
	return [raw[1], raw[2], raw[3]];
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(2500);
await page.getByRole('textbox').fill('surface-probe');
await page.getByRole('button', { name: 'Start' }).click();
await page
	.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
	.waitFor({ timeout: 15000 });
await page.waitForTimeout(2000);

// Freeze animated layers so samples are stable
await page.evaluate(() => {
	document.querySelector('video')?.pause();
	for (const el of document.querySelectorAll('*')) {
		const s = getComputedStyle(el);
		if (s.animationName !== 'none') el.style.animationPlayState = 'paused';
	}
});
await page.waitForTimeout(300);

const targets = {
	'page-bar': '.company-page-bar',
	calculator: '.calculator-panel',
	'quote-tile': '.quote-tile',
	'main-table': '.main-table'
};

async function probe(name, sel) {
	const loc = page.locator(sel).first();
	const box = await loc.boundingBox();
	if (!box) {
		console.log(`${name}: NOT FOUND`);
		return;
	}
	// Sample a column just inside the left border (padding zone) at several heights,
	// plus one just inside the right border at mid-height.
	const pts = [
		[box.x + 3, box.y + box.height * 0.25],
		[box.x + 3, box.y + box.height * 0.5],
		[box.x + 3, box.y + box.height * 0.75],
		[box.x + box.width - 3, box.y + box.height * 0.5]
	];
	const rgbs = [];
	const vp = page.viewportSize();
	for (const [x, y] of pts) {
		if (y < 0 || y > vp.height - 2 || x < 0 || x > vp.width - 2) {
			rgbs.push(['-', '-', '-']);
			continue;
		}
		const shot = await page.screenshot({
			clip: { x: Math.round(x), y: Math.round(y), width: 1, height: 1 }
		});
		rgbs.push(onePixel(shot));
	}
	console.log(
		`${name.padEnd(12)}`,
		rgbs.map((c) => c.join(',').padEnd(11)).join(' '),
		` y=${Math.round(box.y)} h=${Math.round(box.height)}`
	);
}

for (const [name, sel] of Object.entries(targets)) await probe(name, sel);

await browser.close();
