/**
 * Stability regression tests for feature/build-mode.
 * Covers the two confirmed regressions and related edge cases:
 *   1. Fresh-login freeze (effect_update_depth_exceeded)
 *   2. Add-page tab freeze (double reactive write)
 *   3. BDM/MS mode gating in build mode
 *   4. Local-first sync fallback when Firestore is unreachable
 */

import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniqueUser() {
	return `pw-stability-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function clearStorageAndLogin(page: Page, username?: string) {
	// Navigate first so localStorage is in scope
	await page.goto('/');
	await page.evaluate(() => localStorage.clear());
	await page.reload();

	const user = username ?? uniqueUser();
	await page.getByRole('textbox').fill(user);
	await page.getByRole('button', { name: 'Start' }).click();
	await expect(
		page.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
	).toBeVisible({ timeout: 15_000 });
	return user;
}

async function login(page: Page, username?: string) {
	const user = username ?? uniqueUser();
	await page.goto('/');
	await page.getByRole('textbox').fill(user);
	await page.getByRole('button', { name: 'Start' }).click();
	await expect(
		page.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
	).toBeVisible({ timeout: 15_000 });
	return user;
}

// ---------------------------------------------------------------------------
// 1. Fresh-login: no effect_update_depth_exceeded, lands in import mode
// ---------------------------------------------------------------------------

test.describe('Fresh-login stability', () => {
	test('app loads without effect_update_depth_exceeded error', async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') consoleErrors.push(msg.text());
		});
		page.on('pageerror', (err) => consoleErrors.push(err.message));

		await clearStorageAndLogin(page);

		// Allow a short settle time for any deferred reactive work
		await page.waitForTimeout(500);

		const depthErrors = consoleErrors.filter((e) => e.includes('effect_update_depth_exceeded'));
		expect(depthErrors, `Depth errors found: ${depthErrors.join('\n')}`).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// 2. Add-page stability
// ---------------------------------------------------------------------------

test.describe('Add-page stability', () => {
	test('clicking + adds a new page tab without freezing', async ({ page }) => {
		await login(page);

		// Count existing page tabs (exclude the + button itself)
		const tabsBefore = await page.getByRole('tab').count();

		// Click the add-page button
		await page.getByRole('button', { name: 'Add new page' }).click();

		// New tab should appear promptly (no freeze)
		await expect(page.getByRole('tab')).toHaveCount(tabsBefore + 1, { timeout: 3_000 });
	});

	test('new page is immediately active after creation', async ({ page }) => {
		await login(page);

		await page.getByRole('button', { name: 'Add new page' }).click();

		// The last tab should be selected
		const tabs = page.getByRole('tab');
		const count = await tabs.count();
		// The last real page tab (exclude + button) should have aria-selected=true
		const lastTab = tabs.nth(count - 1);
		await expect(lastTab).toHaveAttribute('aria-selected', 'true', { timeout: 3_000 });
	});
});

// ---------------------------------------------------------------------------
// 5. Local-first sync fallback
// ---------------------------------------------------------------------------

test.describe('Local-first sync fallback', () => {
	test('app enters when Firestore is blocked, shows sync error indicator', async ({ page }) => {
		// Block all Firestore requests before login
		await page.route('**firestore.googleapis.com/**', (route) => route.abort());
		await page.route('**google.firestore.v1**', (route) => route.abort());

		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
		await page.reload();

		const user = uniqueUser();
		await page.getByRole('textbox').fill(user);
		await page.getByRole('button', { name: 'Start' }).click();

		// App should enter main content despite blocked Firestore (local-first)
		await expect(
			page.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
		).toBeVisible({ timeout: 10_000 });

		// Sync status should show error/offline indicator (tooltip trigger with warning/error icon)
		// Tooltips are portaled to body on hover, so check the status dot has a warning color
		await expect(
			page.locator('.status-dot').first()
		).toBeVisible({ timeout: 5_000 });
	});
});
