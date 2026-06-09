/**
 * One-off visual smoke: screenshots of login, main page (wide + narrow),
 * and a modal. Run with the dev server up: node scripts/visual-smoke.mjs
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const OUT = 'test-results/visual-smoke';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// 1. Login screen (showpiece)
await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(2500); // entrance animations settle
await page.screenshot({ path: `${OUT}/01-login.png` });

// 2. Main page after login
await page.getByRole('textbox').fill('visual-smoke-user');
await page.getByRole('button', { name: 'Start' }).click();
await page
	.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
	.waitFor({ timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/02-main-wide.png`, fullPage: false });

// 3. Row hover state
const firstRow = page.locator('tbody tr').first();
await firstRow.hover();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/03-row-hover.png` });

// 4. Narrow viewport — two-column rule
await page.setViewportSize({ width: 700, height: 900 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/04-main-narrow-700.png` });
await page.setViewportSize({ width: 500, height: 900 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/05-main-narrow-500.png` });

// 5. A modal (Operations -> Sales Tax Guide)
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(400);
await page.getByRole('button', { name: /Operations/i }).click();
await page.getByRole('menuitem', { name: /Sales Tax/i }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/06-modal-salestax.png` });

await browser.close();
console.log('Visual smoke screenshots written to', OUT);
