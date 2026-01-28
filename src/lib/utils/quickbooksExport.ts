/**
 * QuickBooks Export Utility
 * Generates formatted SKU data for Perplexity Comet automation
 */

import type { Company, Page, Package } from '$types';
import { panelsStore } from '$stores/panels.svelte';
import { packagesStore } from '$stores/packages.svelte';
import { packages } from '$data';

/**
 * Mapping from individual bits to their maintenance SKUs
 * Used when a package is not fully selected
 */
const BIT_TO_SKU: Record<string, string> = {
	// SC-Mill-Adv bits
	iMach2D: 'iMach2D-Maint',
	'Machine Simulation': 'MachSim-Maint',
	'Edge Breaking': 'EdgeBreak-Maint',

	// SC-Mill-3D bits
	HSM: 'HSM-Maint',
	iMach3D: 'iMach3D-Maint',

	// SC-Mill-5Axis bits (individual)
	Sim4x: 'Sim4x-Maint',
	Sim5x: 'Sim5x-Maint',
	'Multiaxis Roughing': 'Multiaxis-Maint'

	// Note: HSS is included in SC-Mill-Maint, no separate SKU
	// Note: SC-Turn bits (Turning, Backspindle) are included in SC-Turn-Maint
};

/**
 * Bits that are part of a "master group" - when ALL selected, use package SKU
 */
const MASTER_GROUP_BITS: Record<string, string[]> = {
	'SC-Mill': [
		'Modeler',
		'Machinist',
		'SolidCAM Mill 2D',
		'Profile/Pocket 2.5D Rest Material',
		'SolidCAM Mill 2.5D',
		'Pocket Recognition',
		'Chamfer Recognition',
		'Hole+Drill Recognition',
		'SC Mill 3D',
		'C-axes (Wrap)',
		'4-axes Indexial',
		'5-axes Indexial',
		'Multi-Depth Drill'
	],
	'SC-Mill-5Axis': [
		'Sim5x',
		'Swarf machining',
		'5x Drill',
		'Contour 5x',
		'Convert5X',
		'Auto 3+2 Roughing',
		'Screw Machining (Rotary)'
	]
};

/**
 * SKU ordering priority (lower = earlier in list)
 * SKUs not in this list go after the numbered ones, before VCD
 */
const SKU_ORDER: Record<string, number> = {
	// Package SKUs in order
	'SC-Mill-Maint': 10,
	'SC-Turn-Maint': 20,
	'SC-Mill-Adv-Maint': 30,
	'iMach2D-Maint': 31, // Individual from Adv
	'MachSim-Maint': 32,
	'EdgeBreak-Maint': 33,
	'SC-Mill-3D-Maint': 40,
	'HSM-Maint': 41, // Individual from 3D
	'iMach3D-Maint': 42,
	'SC-Mill-5Axis-Maint': 50,
	'Sim4x-Maint': 51, // Individual from 5Axis
	'Sim5x-Maint': 52,
	'Multiaxis-Maint': 53
	// HSS is included in SC-Mill-Maint, no separate ordering needed
};

interface ExportResult {
	text: string;
	skuCount: number;
	warnings: string[];
}

/**
 * Get all bits for a package (groups + loose)
 */
function getAllPackageBits(pkg: Package): string[] {
	const bits: string[] = [];
	if (pkg.groups) {
		for (const group of pkg.groups) {
			bits.push(...group.bits);
		}
	}
	if (pkg.looseBits) {
		bits.push(...pkg.looseBits);
	}
	return bits;
}

/**
 * Check if a package is fully selected
 */
function isPackageFullySelected(pkg: Package, selectedBits: string[]): boolean {
	const allBits = getAllPackageBits(pkg);
	return allBits.every((bit) => selectedBits.includes(bit));
}

/**
 * Get maintenance SKUs for selected bits in a package
 */
function getSkusForPackage(pkg: Package, selectedBits: string[]): string[] {
	const skus: string[] = [];
	const packageBits = getAllPackageBits(pkg);
	const selected = packageBits.filter((bit) => selectedBits.includes(bit));

	if (selected.length === 0) return [];

	// Fully selected → use package maintenance SKU
	if (isPackageFullySelected(pkg, selectedBits)) {
		skus.push(pkg.maintenance);
		return skus;
	}

	// SC-Mill: ANY bits selected → SC-Mill-Maint (HSS is included in package)
	if (pkg.code === 'SC-Mill' && selected.length > 0) {
		skus.push(pkg.maintenance);
		return skus;
	}

	// SC-Mill-5Axis: check if SIM5X group is fully selected
	if (pkg.code === 'SC-Mill-5Axis') {
		const masterBits = MASTER_GROUP_BITS['SC-Mill-5Axis'];
		const masterSelected = masterBits.every((bit) => selectedBits.includes(bit));
		if (masterSelected) {
			skus.push(pkg.maintenance);
			if (selectedBits.includes('Sim4x')) skus.push('Sim4x-Maint');
			if (selectedBits.includes('Multiaxis Roughing')) skus.push('Multiaxis-Maint');
			return skus;
		}
	}

	// Partial selection → individual SKUs
	for (const bit of selected) {
		const sku = BIT_TO_SKU[bit];
		if (sku && !skus.includes(sku)) {
			skus.push(sku);
		}
	}

	// If no individual SKUs mapped but bits are selected, use package SKU
	if (skus.length === 0 && selected.length > 0) {
		skus.push(pkg.maintenance);
	}

	return skus;
}

/**
 * Sort SKUs according to the defined order
 */
function sortSkus(skus: string[]): string[] {
	return skus.sort((a, b) => {
		const orderA = SKU_ORDER[a] ?? 100;
		const orderB = SKU_ORDER[b] ?? 100;
		if (orderA !== orderB) return orderA - orderB;
		// Same priority = alphabetical
		return a.localeCompare(b);
	});
}

/**
 * Generate QuickBooks export text for the current page
 */
export function generateQBExportText(company: Company, page: Page): ExportResult {
	const skus: string[] = [];

	// 1. Get SKUs from package selections
	for (const pkg of packages) {
		const state = packagesStore.getStateReadOnly(pkg.code);
		const selectedBits = state.selectedBits || [];
		const packageSkus = getSkusForPackage(pkg, selectedBits);
		skus.push(...packageSkus);
	}

	// 2. Get selected maintenance SKUs from panels (additional items)
	const maintenanceItems = panelsStore.getItems('maintenance-skus');
	const solidworksItems = panelsStore.getItems('solidworks-maintenance');

	for (const item of [...maintenanceItems, ...solidworksItems]) {
		if (!skus.includes(item)) {
			skus.push(item);
		}
	}

	// 3. Sort SKUs in the correct order
	const sortedSkus = sortSkus(skus.filter((sku) => sku !== 'VCD'));

	// 4. Build line items
	const lineItems: string[] = [];
	let itemNumber = 1;

	// First: blank line with "Annual Maintenance Details:" in description
	lineItems.push(`${itemNumber}. [BLANK] Description: "Annual Maintenance Details:"`);
	itemNumber++;

	// Second: Lic-Info
	lineItems.push(`${itemNumber}. Lic-Info (qty: 1)`);
	itemNumber++;

	// Middle: sorted SKUs
	for (const sku of sortedSkus) {
		lineItems.push(`${itemNumber}. ${sku} (qty: 1)`);
		itemNumber++;
	}

	// Second to last: VCD
	lineItems.push(`${itemNumber}. VCD (qty: 1)`);
	itemNumber++;

	// Last: blank line with "new modules" description
	lineItems.push(
		`${itemNumber}. [BLANK] Description: "This quote reflects our new product structure, delivering added value and expanded functionality. As part of your maintenance renewal, you'll now have access to the following new modules:"`
	);

	// Build the output text
	let text = 'QUICKBOOKS ESTIMATE\n';
	text += `Customer: ${company.name}\n`;
	text += `Page: ${page.name}\n`;
	text += '\n';
	text += 'LINE ITEMS:\n';
	text += lineItems.join('\n');

	return {
		text,
		skuCount: lineItems.length,
		warnings: []
	};
}

/**
 * Copy QuickBooks export to clipboard
 */
export async function copyQBExportToClipboard(company: Company, page: Page): Promise<ExportResult> {
	const result = generateQBExportText(company, page);

	try {
		await navigator.clipboard.writeText(result.text);
	} catch {
		const textarea = document.createElement('textarea');
		textarea.value = result.text;
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
	}

	return result;
}
