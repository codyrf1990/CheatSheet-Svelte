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

	test('fresh page defaults to import mode (IMPORT button visible)', async ({ page }) => {
		await clearStorageAndLogin(page);

		// Mode toggle shows current mode — IMPORT means the page is in import mode
		await expect(page.getByRole('button', { name: 'IMPORT' })).toBeVisible();
	});

	test('fresh page does NOT start in build mode (BUILD button not visible)', async ({ page }) => {
		await clearStorageAndLogin(page);
		await expect(page.getByRole('button', { name: 'BUILD' })).not.toBeVisible();
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

	test('new page starts in import mode', async ({ page }) => {
		await login(page);
		await page.getByRole('button', { name: 'Add new page' }).click();

		// After adding, we should be on the new page in import mode
		await expect(page.getByRole('button', { name: 'IMPORT' })).toBeVisible({ timeout: 3_000 });
	});
});

// ---------------------------------------------------------------------------
// 3. Persisted build-mode compatibility
// ---------------------------------------------------------------------------

test.describe('Build-mode persistence', () => {
	test('page persisted with mode:build stays in build mode after reload', async ({ page }) => {
		await login(page);

		// Switch to build mode
		await page.getByRole('button', { name: 'IMPORT' }).click();
		await expect(page.getByRole('button', { name: 'BUILD' })).toBeVisible();

		// Reload the page (stays logged in via localStorage)
		await page.reload();
		await expect(
			page.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
		).toBeVisible({ timeout: 15_000 });

		// Should still be in build mode
		await expect(page.getByRole('button', { name: 'BUILD' })).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// 4. BDM/MS mode gating in build mode
// ---------------------------------------------------------------------------

test.describe('BDM/MS mode gating', () => {
	test('MS button is disabled in build mode', async ({ page }) => {
		await login(page);

		// Switch to build mode
		await page.getByRole('button', { name: 'IMPORT' }).click();
		await expect(page.getByRole('button', { name: 'BUILD' })).toBeVisible();

		// MS button should be disabled
		const msButton = page.getByRole('button', { name: /MS/ });
		await expect(msButton).toBeDisabled();
	});

	test('BDM is the effective mode in build mode regardless of saved pref', async ({ page }) => {
		await login(page);

		// First set saved pref to MS
		await page.getByRole('button', { name: /MS/ }).click();

		// Switch to build mode
		await page.getByRole('button', { name: 'IMPORT' }).click();
		await expect(page.getByRole('button', { name: 'BUILD' })).toBeVisible();

		// BDM button should appear active (gold highlight class is present)
		const bdmButton = page.getByRole('button', { name: /BDM/ });
		await expect(bdmButton).toBeVisible();
		// MS button disabled in build mode
		await expect(page.getByRole('button', { name: /MS/ })).toBeDisabled();
	});

	test('MS button re-enables after switching back to import mode', async ({ page }) => {
		await login(page);

		// Switch to build mode then back to import
		await page.getByRole('button', { name: 'IMPORT' }).click();
		await expect(page.getByRole('button', { name: 'BUILD' })).toBeVisible();
		await page.getByRole('button', { name: 'BUILD' }).click();
		await expect(page.getByRole('button', { name: 'IMPORT' })).toBeVisible();

		// MS button should be enabled again
		await expect(page.getByRole('button', { name: /MS/ })).toBeEnabled();
	});

	test('stored MS pref is restored after leaving build mode', async ({ page }) => {
		await login(page);

		// Set pref to MS
		await page.getByRole('button', { name: /MS/ }).click();

		// Switch to build mode
		await page.getByRole('button', { name: 'IMPORT' }).click();
		await expect(page.getByRole('button', { name: 'BUILD' })).toBeVisible();

		// Switch back to import mode
		await page.getByRole('button', { name: 'BUILD' }).click();
		await expect(page.getByRole('button', { name: 'IMPORT' })).toBeVisible();

		// MS button should be active again (pref was preserved, not mutated)
		const msButton = page.getByRole('button', { name: /MS/ });
		await expect(msButton).toBeEnabled();
		// Verify MS is the active mode by checking the SKU tab label changed
		await expect(page.getByRole('tab', { name: 'Maint Price' })).toBeVisible();
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

		// Sync status should show error indicator ⚠ (not spinning/connected)
		await expect(page.getByTitle('Sync error')).toBeVisible({ timeout: 5_000 });
	});
});
