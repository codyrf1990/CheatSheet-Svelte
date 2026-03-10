import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(page: Page, username?: string) {
	// Use a unique username each time so Firestore returns no data (fresh state guaranteed)
	const user = username ?? `pw-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
	await page.goto('/');
	await page.getByRole('textbox').fill(user);
	await page.getByRole('button', { name: 'Start' }).click();
	await expect(
		page.getByRole('heading', { name: 'Packages & Maintenance Cheat Sheet' })
	).toBeVisible({ timeout: 15000 });
}

type Toast = { type: string; message: string };

/** Read toast messages directly from the store — bypasses DOM timing issues. */
async function getToasts(page: Page): Promise<Toast[]> {
	return page.evaluate(async () => {
		const path = '/src/lib/stores/toast.svelte.ts';
		const mod = (await Function('p', 'return import(p)')(path)) as {
			toastStore: { all: { type: string; message: string }[] };
		};
		return mod.toastStore.all.map((t: { type: string; message: string }) => ({
			type: t.type,
			message: t.message
		}));
	});
}

/** Trigger our outer .checkbox-wrapper onclick on a disabled bit (found by tooltip text). */
async function clickDisabledBitWrapper(page: Page, bitName: string) {
	await page.evaluate((name) => {
		// Find the li containing this bit name, then click its checkbox wrapper
		const lis = [...document.querySelectorAll('li')];
		const li = lis.find((el) => el.textContent?.includes(name));
		const span = li?.querySelector('span.checkbox-wrapper');
		if (span) {
			span.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		}
	}, bitName);
	// Give Svelte reactivity a tick
	await page.waitForTimeout(200);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe('Build Mode', () => {
	test.beforeEach(async ({ page }) => {
		await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
		// Unique username means no Firestore data → guaranteed fresh state
		// Default skuTabMode is 'bdm' which enables validation (build behavior)
		await login(page);
	});

	// -------------------------------------------------------------------------
	// 1. Initial gated state
	// -------------------------------------------------------------------------
	test('all gated bits disabled before SC-Mill is selected', async ({ page }) => {
		// SC-Mill-Adv bits require SC-Mill — gated bits have disabled checkboxes
		// and are wrapped in a tooltip trigger (span.tooltip-trigger)
		for (const name of ['iMach2D', 'Machine Simulation', 'Edge Breaking']) {
			const li = page.locator('li', { hasText: name }).first();
			await expect(li.locator('input[type="checkbox"]')).toBeDisabled();
			// Gated bits are wrapped in a Tooltip (has tooltip-trigger wrapper)
			await expect(li.locator('.tooltip-trigger')).toBeVisible();
		}

		// Upgrades button is always visible (shows available add-ons regardless of selection)
		await expect(page.getByRole('button', { name: 'Upgrades' })).toBeVisible();
	});

	// -------------------------------------------------------------------------
	// 2. SC-Mill master toggle
	// -------------------------------------------------------------------------
	test('SC-Mill master toggle selects all 25M bits and HSS', async ({ page }) => {
		await page.getByRole('checkbox', { name: 'Toggle all SC-Mill bits' }).click();

		// All 25M sub-bits checked
		for (const name of [
			'Modeler',
			'Machinist',
			'SolidCAM Mill 2D',
			'SolidCAM Mill 2.5D',
			'SC Mill 3D',
			'C-axes (Wrap)',
			'4-axes Indexial',
			'5-axes Indexial'
		]) {
			const li = page.locator('li', { hasText: name }).first();
			await expect(li.locator('input[type="checkbox"]')).toBeChecked();
		}

		// HSS checked
		const hssLi = page.locator('li', { hasText: 'HSS' }).first();
		await expect(hssLi.locator('input[type="checkbox"]')).toBeChecked();

		// Upgrades button now visible
		await expect(page.getByRole('button', { name: 'Upgrades' })).toBeVisible();
	});

	// -------------------------------------------------------------------------
	// 3. Prerequisite gating: SC-Mill-Adv unlocks with SC-Mill
	// -------------------------------------------------------------------------
	test('SC-Mill-Adv bits unlock after SC-Mill selected, iMach3D stays gated', async ({ page }) => {
		await page.getByRole('checkbox', { name: 'Toggle all SC-Mill bits' }).click();

		// iMach2D, MachSim, EdgeBreak now enabled (no disabled attr)
		for (const name of ['iMach2D', 'Machine Simulation', 'Edge Breaking']) {
			const li = page.locator('li', { hasText: name }).first();
			await expect(li.locator('input[type="checkbox"]')).toBeEnabled();
		}

		// iMach3D still gated — requires iMach2D (disabled checkbox + tooltip trigger)
		const iMach3DLi = page.locator('li', { hasText: 'iMach3D' }).first();
		await expect(iMach3DLi.locator('input[type="checkbox"]')).toBeDisabled();
		await expect(iMach3DLi.locator('.tooltip-trigger')).toBeVisible();
	});

	// -------------------------------------------------------------------------
	// 4. Disabled bit click shows warning toast
	// -------------------------------------------------------------------------
	test('clicking disabled iMach3D wrapper shows warning toast', async ({ page }) => {
		await page.getByRole('checkbox', { name: 'Toggle all SC-Mill bits' }).click();

		// iMach3D is still gated — click its outer wrapper span
		await clickDisabledBitWrapper(page, 'iMach3D');

		const toasts = await getToasts(page);
		expect(toasts).toHaveLength(1);
		expect(toasts[0].type).toBe('warning');
		expect(toasts[0].message).toBe('Requires iMach2D (SC-Mill-Adv)');
	});

	// -------------------------------------------------------------------------
	// 5. iMach2D selection removes iMach3D gate
	// -------------------------------------------------------------------------
	test('selecting iMach2D unlocks iMach3D', async ({ page }) => {
		await page.getByRole('checkbox', { name: 'Toggle all SC-Mill bits' }).click();

		// Confirm iMach3D is gated (disabled + tooltip trigger)
		const iMach3DLi = page.locator('li', { hasText: 'iMach3D' }).first();
		await expect(iMach3DLi.locator('input[type="checkbox"]')).toBeDisabled();
		await expect(iMach3DLi.locator('.tooltip-trigger')).toBeVisible();

		// Select iMach2D
		const iMach2DLi = page.locator('li', { hasText: 'iMach2D' }).first();
		await iMach2DLi.locator('input[type="checkbox"]').click();

		// Gate should be gone — tooltip trigger no longer rendered, checkbox enabled
		await expect(iMach3DLi.locator('.tooltip-trigger')).not.toBeVisible();
		await expect(iMach3DLi.locator('input[type="checkbox"]')).toBeEnabled();
	});

	// -------------------------------------------------------------------------
	// 6. Name-click copies, checkbox-click toggles
	// -------------------------------------------------------------------------
	test('name button copies to clipboard without toggling', async ({ page }) => {
		await page.getByRole('checkbox', { name: 'Toggle all SC-Mill bits' }).click();

		const iMach2DLi = page.locator('li', { hasText: 'iMach2D' }).first();
		const checkbox = iMach2DLi.locator('input[type="checkbox"]');

		// Initially unchecked
		await expect(checkbox).not.toBeChecked();

		// Click the name button
		await iMach2DLi.getByRole('button', { name: 'iMach2D' }).click();

		// Checkbox stays unchecked
		await expect(checkbox).not.toBeChecked();

		// Copied! toast fires
		const toasts = await getToasts(page);
		const copied = toasts.find((t) => t.message === 'Copied!');
		expect(copied).toBeDefined();
		expect(copied!.type).toBe('success');
	});

	test('checkbox click toggles selection without copying', async ({ page }) => {
		await page.getByRole('checkbox', { name: 'Toggle all SC-Mill bits' }).click();

		const iMach2DLi = page.locator('li', { hasText: 'iMach2D' }).first();
		const checkbox = iMach2DLi.locator('input[type="checkbox"]');
		await expect(checkbox).not.toBeChecked();

		// Click checkbox
		await checkbox.click();
		await expect(checkbox).toBeChecked();

		// No Copied! toast — only check store is empty or has no success toasts
		const toasts = await getToasts(page);
		const copied = toasts.find((t) => t.message === 'Copied!');
		expect(copied).toBeUndefined();
	});

	// -------------------------------------------------------------------------
	// 7. Mill-Turn toast fires when both SC-Mill and SC-Turn selected
	// -------------------------------------------------------------------------
	test('Mill-Turn info toast fires when SC-Mill and SC-Turn both selected', async ({ page }) => {
		await page.getByRole('checkbox', { name: 'Toggle all SC-Mill bits' }).click();

		// No Mill-Turn toast yet
		let toasts = await getToasts(page);
		expect(toasts.find((t) => t.message.includes('Mill-Turn'))).toBeUndefined();

		// Select SC-Turn
		await page.getByRole('checkbox', { name: 'Toggle all SC-Turn bits' }).click();
		await page.waitForTimeout(150); // debounce

		toasts = await getToasts(page);
		const millTurn = toasts.find((t) => t.message.includes('Mill-Turn'));
		expect(millTurn).toBeDefined();
		expect(millTurn!.type).toBe('info');
	});

	// -------------------------------------------------------------------------
	// 8. MS mode disables prerequisite gating
	// -------------------------------------------------------------------------
	test('MS mode disables prerequisite gating', async ({ page }) => {
		// In BDM mode (default), iMach2D is gated (SC-Mill not selected)
		const iMach2DLi = page.locator('li', { hasText: 'iMach2D' }).first();
		await expect(iMach2DLi.locator('input[type="checkbox"]')).toBeDisabled();

		// Switch to MS via pill button
		await page.getByRole('button', { name: /MS/ }).first().click();

		// iMach2D now enabled despite SC-Mill not selected
		await expect(iMach2DLi.locator('input[type="checkbox"]')).toBeEnabled();

		// iMach3D also enabled in MS mode
		const iMach3DLi = page.locator('li', { hasText: 'iMach3D' }).first();
		await expect(iMach3DLi.locator('input[type="checkbox"]')).toBeEnabled();
	});

	// -------------------------------------------------------------------------
	// 9. New Sale panel SKU totals
	// -------------------------------------------------------------------------
	test('New Sale panel shows correct SKUs and total after SC-Mill selected', async ({ page }) => {
		await page.getByRole('checkbox', { name: 'Toggle all SC-Mill bits' }).click();

		await expect(page.getByRole('button', { name: 'SC-HSS' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'SC-25M' })).toBeVisible();
		await expect(page.getByText('$3,868').first()).toBeVisible(); // SC-Mill package price
	});

	test('SC-Turn adds SC-Turn SKU and updates total', async ({ page }) => {
		await page.getByRole('checkbox', { name: 'Toggle all SC-Mill bits' }).click();
		await page.getByRole('checkbox', { name: 'Toggle all SC-Turn bits' }).click();

		await expect(
			page.getByRole('complementary').getByRole('button', { name: 'SC-Turn', exact: true }).first()
		).toBeVisible();
		await expect(page.getByText('$6,168').first()).toBeVisible(); // $3,868 + $2,300
	});

	// -------------------------------------------------------------------------
	// 10. Upgrades modal
	// -------------------------------------------------------------------------
	test('Upgrades modal shows correct sections and descriptions', async ({ page }) => {
		await page.getByRole('checkbox', { name: 'Toggle all SC-Mill bits' }).click();
		await page.getByRole('button', { name: 'Upgrades' }).click();

		// Modal open
		await expect(page.getByRole('heading', { name: 'Upgrades — BDM' })).toBeVisible();

		// Correct section headings — packages show as groups when fully unselected
		const sections = page.locator('h4.group-title');
		await expect(sections.first()).toContainText('SC-Mill-Adv');

		// Package-level entries shown (whole groups unselected → single package item)
		const advRow = page.locator('.upgrade-item', { hasText: 'SC-Mill-Adv' }).first();
		await expect(advRow).toBeVisible();

		// SC-Turn upgrade available
		const turnRow = page.locator('.upgrade-item', { hasText: 'SC-Turn' }).first();
		await expect(turnRow).toBeVisible();

		// Close modal
		await page.getByRole('button', { name: 'Close' }).click();
		await expect(page.getByRole('heading', { name: 'Upgrades — BDM' })).not.toBeVisible();
	});
});
