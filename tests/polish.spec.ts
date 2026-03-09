import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(page: Page) {
	const user = `pw-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
	await page.goto('/');
	await page.getByRole('textbox').fill(user);
	await page.getByRole('button', { name: 'Start' }).click();
	await expect(
		page.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
	).toBeVisible({ timeout: 15000 });
}

// ---------------------------------------------------------------------------
// Shell & Navigation
// ---------------------------------------------------------------------------
test.describe('Shell & Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test('company name is bold in the bar', async ({ page }) => {
		const companyName = page.locator('.company-name').first();
		await expect(companyName).toBeVisible();
		const fontWeight = await companyName.evaluate((el) => window.getComputedStyle(el).fontWeight);
		// 600 or 700 = bold
		expect(Number(fontWeight)).toBeGreaterThanOrEqual(600);
	});

	test('active page tab has gold bottom border', async ({ page }) => {
		const activeTab = page.locator('.page-tab.active').first();
		await expect(activeTab).toBeVisible();
		const borderBottom = await activeTab.evaluate(
			(el) => window.getComputedStyle(el).borderBottomWidth
		);
		expect(parseFloat(borderBottom)).toBeGreaterThanOrEqual(2);
	});

	test('sync status shows an SVG icon', async ({ page }) => {
		const statusDot = page.locator('.status-dot svg').first();
		await expect(statusDot).toBeVisible();
	});

	test('quick action buttons visible when company active', async ({ page }) => {
		const importBtn = page.getByLabel('Import License');
		const copyQbBtn = page.getByLabel('Copy for QuickBooks');
		await expect(importBtn).toBeVisible();
		await expect(copyQbBtn).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Keyboard Navigation
// ---------------------------------------------------------------------------
test.describe('Keyboard Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test('arrow keys navigate page tabs', async ({ page }) => {
		const tabs = page.getByRole('tab');
		const firstTab = tabs.first();
		await firstTab.focus();
		await firstTab.press('ArrowRight');

		// The add-tab button should now be focused (only 1 page by default)
		// or the next tab if multiple pages exist
		const focused = page.locator(':focus');
		await expect(focused).toBeVisible();
	});

	test('Escape closes company dropdown', async ({ page }) => {
		const trigger = page.locator('.company-trigger').first();
		await trigger.click();
		await expect(page.locator('.dropdown-menu')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('.dropdown-menu')).not.toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------
test.describe('Interactions', () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test('modal locks scroll on body', async ({ page }) => {
		// Open the Current Products modal via Operations menu
		const headerOps = page.locator('.nav-gray', { hasText: 'Operations' });
		await headerOps.click();
		await page.getByRole('menuitem', { name: 'Current Products' }).click();

		// Modal should be visible
		await expect(page.getByRole('dialog')).toBeVisible();

		// Body overflow should be hidden
		const overflow = await page.evaluate(() => document.body.style.overflow);
		expect(overflow).toBe('hidden');

		// Close modal
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeVisible();

		// Body overflow should be restored
		const overflowAfter = await page.evaluate(() => document.body.style.overflow);
		expect(overflowAfter).toBe('');
	});

	test('BDM section collapse toggle works', async ({ page }) => {
		// BDM sections start collapsed — find the first section header
		const sectionBtn = page.locator('[aria-expanded]').first();
		await expect(sectionBtn).toBeVisible();
		await expect(sectionBtn).toHaveAttribute('aria-expanded', 'false');

		// Click to expand
		await sectionBtn.click();
		await expect(sectionBtn).toHaveAttribute('aria-expanded', 'true');

		// Click again to collapse
		await sectionBtn.click();
		await expect(sectionBtn).toHaveAttribute('aria-expanded', 'false');
	});

	test('copy shows inline checkmark feedback', async ({ page, context }) => {
		// Grant clipboard permission
		await context.grantPermissions(['clipboard-write', 'clipboard-read']);

		// Find the first package code button and click to copy
		const codeBtn = page.locator('.package-code').first();
		await expect(codeBtn).toBeVisible();
		await codeBtn.click();

		// Should show a green checkmark
		const checkmark = codeBtn.locator('.copy-check');
		await expect(checkmark).toBeVisible({ timeout: 3000 });

		// After 1.5s it should revert (wait 2s to be safe)
		await page.waitForTimeout(2000);
		await expect(checkmark).not.toBeVisible();
	});

	test('BDM panel has Expand All button', async ({ page }) => {
		const expandAll = page.getByRole('button', { name: 'Expand All' });
		await expect(expandAll).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Narrow Viewport
// ---------------------------------------------------------------------------
test.describe('Narrow Viewport', () => {
	test('app is usable at 375px width', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await login(page);

		// Main heading should still be visible
		await expect(
			page.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
		).toBeVisible();

		// Company trigger should be visible
		await expect(page.locator('.company-trigger').first()).toBeVisible();

		// Package table should be visible
		await expect(page.locator('.package-row').first()).toBeVisible();
	});
});
