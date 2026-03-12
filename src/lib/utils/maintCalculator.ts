/**
 * Calculate maintenance total from a saved PageState.
 * Replicates the sale-line logic in NewSalePanel but works on
 * serialised page snapshots so we can sum across all pages.
 */

import type { PageState } from '$types';
import { SKU_LOOKUP, MODULE_SKUS, type SkuEntry } from '$lib/data/skuData';
import { PACKAGE_TOGGLE_BITS } from '$lib/data/prerequisites';
import { packages as packageDefs } from '$data';

/**
 * Given a saved PageState, return the maintenance-price total
 * (same number NewSalePanel shows as "Maint Total").
 */
export function calculateMaintTotal(pageState: PageState): number {
	const lines: SkuEntry[] = [];
	const seen = new Set<string>();

	const pkgStates = pageState.packages ?? {};

	// --- Package / bit selections ---
	for (const [pkgCode, toggleDef] of Object.entries(PACKAGE_TOGGLE_BITS)) {
		const state = pkgStates[pkgCode];
		if (!state || state.selectedBits.length === 0) continue;

		const pkgDef = packageDefs.find((p) => p.code === pkgCode);
		const allToggleBits: string[] = [...(toggleDef.looseBits ?? [])];
		const allSelected = allToggleBits.every((b) => state.selectedBits.includes(b));

		const groupsFullyRepresented =
			!toggleDef.groups ||
			toggleDef.groups.every((groupId) => {
				const group = pkgDef?.groups?.find((g) => g.masterId === groupId);
				return group ? group.bits.some((b) => state.selectedBits.includes(b)) : false;
			});

		const packageSku = SKU_LOOKUP[`${pkgCode}::PACKAGE`];

		// Full package
		if (packageSku && allSelected && groupsFullyRepresented) {
			if (!seen.has(packageSku.sku)) {
				seen.add(packageSku.sku);
				lines.push(packageSku);
			}
			continue;
		}

		// Partial — individual bits
		for (const bit of state.selectedBits) {
			const entry = SKU_LOOKUP[`${pkgCode}::${bit}`];
			if (entry && !seen.has(entry.sku)) {
				seen.add(entry.sku);
				lines.push(entry);
			}
		}

		// Group SKUs
		for (const groupId of toggleDef.groups ?? []) {
			const entry = SKU_LOOKUP[`${pkgCode}::${groupId}`];
			if (!entry || seen.has(entry.sku)) continue;
			const group = pkgDef?.groups?.find((g) => g.masterId === groupId);
			const groupBitsSelected = group
				? group.bits.some((b) => state.selectedBits.includes(b))
				: false;
			if (groupBitsSelected) {
				seen.add(entry.sku);
				lines.push(entry);
			}
		}
	}

	// --- Maintenance panel checkboxes ---
	const maintItems = pageState.panels?.['maintenance-skus']?.items ?? [];
	for (const moduleSku of MODULE_SKUS) {
		if (maintItems.includes(moduleSku.maintSku) && !seen.has(moduleSku.sku)) {
			seen.add(moduleSku.sku);
			lines.push(moduleSku);
		}
	}

	return lines.reduce((sum, e) => sum + e.maintPrice, 0);
}
