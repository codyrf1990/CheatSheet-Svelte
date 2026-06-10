/**
 * One-off: exercise the revamped user card — open menu, toggle video,
 * keyboard nav, sign out — and capture crops.
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const OUT = 'test-results/user-card';
const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1440, height: 900 },
	deviceScaleFactor: 2
});
await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(2500);
await page.getByRole('textbox').fill('cody-fraser');
await page.getByRole('button', { name: 'Start' }).click();
await page
	.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
	.waitFor({ timeout: 15000 });
await page.waitForTimeout(1500);

const trigger = page.getByRole('button', { name: 'User menu' });

// 1. Initials check
const initials = await page.locator('.user-trigger .avatar-initials').textContent();
console.log('initials for "cody-fraser":', initials, initials === 'CF' ? 'OK' : 'FAIL');

// 2. Header crop at rest
await page.locator('.header').screenshot({ path: `${OUT}/header-rest.png` });

// 3. Open menu
await trigger.click();
await page.waitForTimeout(300);
const menuVisible = await page.locator('.user-dropdown').isVisible();
console.log('menu opens:', menuVisible ? 'OK' : 'FAIL');
const statusText = await page.locator('.menu-status').textContent();
console.log('status label:', statusText);
await page.screenshot({
	path: `${OUT}/menu-open.png`,
	clip: { x: 1040, y: 0, width: 400, height: 300 }
});

// 4. Toggle video — menu must stay open, video must pause
await page.getByRole('menuitemcheckbox').click();
await page.waitForTimeout(300);
const stillOpen = await page.locator('.user-dropdown').isVisible();
const paused = await page.evaluate(() => document.querySelector('video')?.paused);
const checked = await page.getByRole('menuitemcheckbox').getAttribute('aria-checked');
console.log('menu stays open after toggle:', stillOpen ? 'OK' : 'FAIL');
console.log('video paused:', paused ? 'OK' : 'FAIL', '| aria-checked:', checked);
await page.screenshot({
	path: `${OUT}/menu-toggled.png`,
	clip: { x: 1040, y: 0, width: 400, height: 300 }
});

// 5. Keyboard: Escape closes and restores focus to trigger
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const closedByEsc = !(await page.locator('.user-dropdown').isVisible());
const focusedLabel = await page.evaluate(() =>
	document.activeElement?.getAttribute('aria-label')
);
console.log('Escape closes:', closedByEsc ? 'OK' : 'FAIL', '| focus on:', focusedLabel);

// 6. Arrow-key nav from the trigger
await trigger.click();
await page.waitForTimeout(200);
await page.keyboard.press('ArrowDown'); // focus is on trigger -> should focus first item
const focus1 = await page.evaluate(() => document.activeElement?.textContent?.trim());
await page.keyboard.press('ArrowDown'); // now inside menu -> second item
const focus2 = await page.evaluate(() => document.activeElement?.textContent?.trim());
console.log('arrow nav:', JSON.stringify(focus1), '->', JSON.stringify(focus2));

// 7. Outside click closes
await page.mouse.click(400, 400);
await page.waitForTimeout(200);
console.log(
	'outside click closes:',
	!(await page.locator('.user-dropdown').isVisible()) ? 'OK' : 'FAIL'
);

// 8. Sign out works
await trigger.click();
await page.waitForTimeout(200);
await page.getByRole('menuitem', { name: /Sign out/i }).click();
await page.waitForTimeout(1000);
const backAtLogin = await page.getByRole('button', { name: 'Start' }).isVisible();
console.log('sign out returns to login:', backAtLogin ? 'OK' : 'FAIL');

await browser.close();
console.log('crops written to', OUT);
