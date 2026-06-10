/**
 * One-off: end-to-end smoke for the V2 Firestore layout against the LIVE project.
 * 1. Through the real app (Playwright): log in as a fixed test user, make a
 *    selection, let the debounced save fire.
 * 2. Direct SDK read: confirm the user doc has layoutVersion 2 + meta, and the
 *    companies subcollection holds the data.
 * 3. Reload the app: confirm the selection survives a cloud round-trip.
 */
import { chromium } from '@playwright/test';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const USER = 'v2-layout-smoke';

// --- Parse .env for Firebase config
const env = Object.fromEntries(
	readFileSync('.env', 'utf8')
		.split(/\r?\n/)
		.filter((l) => l.includes('='))
		.map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const app = initializeApp({
	apiKey: env.VITE_FIREBASE_API_KEY,
	authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: env.VITE_FIREBASE_PROJECT_ID
});
const db = getFirestore(app);

// --- 1. Drive the real app
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(2500);
await page.getByRole('textbox').fill(USER);
await page.getByRole('button', { name: 'Start' }).click();
await page
	.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
	.waitFor({ timeout: 15000 });
await page.waitForTimeout(1000);

const toggle = page.getByRole('checkbox', { name: 'Toggle all SC-Mill bits' });
await toggle.click();
const expectChecked = await toggle.isChecked(); // cloud may already hold a prior run's state
console.log('toggled SC-Mill — expecting checked =', expectChecked);
await page.waitForTimeout(2500); // debounce (900ms) + write

// --- 2. Direct Firestore read
const metaSnap = await getDoc(doc(db, 'users', USER));
if (!metaSnap.exists()) {
	console.log('FAIL: user doc not found');
	process.exit(1);
}
const meta = metaSnap.data();
console.log('layoutVersion:', meta.layoutVersion, meta.layoutVersion === 2 ? 'OK' : 'FAIL');
console.log(
	'pageSystemMeta present:',
	meta.pageSystemMeta ? 'OK' : 'FAIL',
	'| companyIds:',
	meta.pageSystemMeta?.companyIds?.length
);
console.log(
	'legacy pageSystem field present:',
	meta.pageSystem ? 'yes (stale copy, fine)' : 'no (clean)'
);
console.log('pageSystemV2UpdatedAt:', meta.pageSystemV2UpdatedAt ? 'OK' : 'FAIL');

const colSnap = await getDocs(collection(db, 'users', USER, 'companies'));
console.log('subcollection company docs:', colSnap.size, colSnap.size > 0 ? 'OK' : 'FAIL');
const firstCompany = colSnap.docs[0]?.data();
const pkgState = firstCompany?.pages?.[0]?.state?.packages?.['SC-Mill'];
const cloudBits = pkgState?.selectedBits?.length ?? 0;
const cloudMatches = expectChecked ? cloudBits > 0 : cloudBits === 0;
console.log(
	'company doc reflects the toggle:',
	cloudMatches
		? `OK (${cloudBits} bits)`
		: `FAIL (${cloudBits} bits, expected ${expectChecked ? '>0' : '0'})`
);

// --- 3. Fresh session — logging in again reads the V2 layout back from the cloud
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(2500);
await page.getByRole('textbox').fill(USER);
await page.getByRole('button', { name: 'Start' }).click();
await page
	.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
	.waitFor({ timeout: 15000 });
await page.waitForTimeout(1500);
const checked = await page.getByRole('checkbox', { name: 'Toggle all SC-Mill bits' }).isChecked();
console.log(
	'selection survives fresh login (cloud round-trip):',
	checked === expectChecked ? 'OK' : 'FAIL'
);

await browser.close();
process.exit(0);
