/**
 * License Import Service
 *
 * Orchestrates the import of SolidCAM license data from Salesforce text:
 * 1. Map features to package bits and maintenance SKUs
 * 2. Create or find existing companies
 * 3. Create or find existing pages (by dongle number)
 * 4. Apply selections to packages and panels
 * 5. Store license metadata
 */

import type { ImportResult, LicenseInfo } from '$lib/types';
import {
	mapFeatures,
	groupByPackage,
	getUniqueSkus
} from '$lib/utils/featureMapper';
import { companiesStore } from '$lib/stores/companies.svelte';
import { packagesStore } from '$lib/stores/packages.svelte';
import { panelsStore } from '$lib/stores/panels.svelte';

const MAINTENANCE_PANEL_ID = 'maintenance-skus';

/**
 * Generate a meaningful page name from license info
 *
 * Naming conventions:
 * - Hardware Dongle (5-digit, no network): "77518"
 * - Network Dongle (5-digit + network): "NWD 77518"
 * - Network Product Key (long key): "NPK 7452" (last 4 of key)
 * - Profile only (no dongle, has profile number): "P1", "P2", etc.
 */
function generatePageName(license: LicenseInfo): string {
	// Network Product Key: long product key number
	if (license.productKey && license.productKey.length > 4) {
		const last4 = license.productKey.slice(-4).toUpperCase();
		return `NPK ${last4}`;
	}

	// Hardware or Network Dongle: 5-digit dongle number
	if (license.dongleNo && license.dongleNo.trim()) {
		const dongle = license.dongleNo.trim();
		if (license.isNetworkLicense) {
			// Network Dongle
			return `NWD ${dongle}`;
		}
		// Hardware Dongle (standalone)
		return dongle;
	}

	// Profile only: use profile number
	if (license.profileNo) {
		return `P${license.profileNo}`;
	}

	// Fallback
	return 'P1';
}

/**
 * Check if a license needs manual company name input
 * Returns true if customer field is missing or generic
 */
export function needsCompanyNameInput(license: LicenseInfo): boolean {
	const customer = license.customer;
	return !customer || customer === 'Unknown' || customer.trim() === '';
}

/**
 * Get preview of what will be imported
 */
export function getImportPreview(license: LicenseInfo): {
	companyName: string;
	isNewCompany: boolean;
	existingCompanyId?: string;
	pageName: string;
	isNewPage: boolean;
	mappableFeatures: number;
	totalFeatures: number;
	mappedSkus: number;
	unmappedFeatures: string[];
} {
	const companyName = license.customer;
	const existingCompany = companiesStore.findByName(companyName);
	const pageName = generatePageName(license);

	// Check if page exists in existing company
	let isNewPage = true;
	if (existingCompany) {
		const existingPage = existingCompany.pages.find(p => p.name === pageName);
		isNewPage = !existingPage;
	}

	const mappingResult = mapFeatures(license.features);
	const uniqueSkus = getUniqueSkus(mappingResult.mappedSkus);

	return {
		companyName,
		isNewCompany: !existingCompany,
		existingCompanyId: existingCompany?.id,
		pageName,
		isNewPage,
		mappableFeatures: mappingResult.mappedFeatures.length,
		totalFeatures: license.features.length,
		mappedSkus: uniqueSkus.length,
		unmappedFeatures: mappingResult.unmappedFeatures
	};
}

/**
 * Import a single license into the system
 * Creates or updates company and page, selects bits, adds SKUs
 */
export function importLicense(
	license: LicenseInfo,
	overrideCompanyName?: string
): ImportResult {
	const companyName = overrideCompanyName || license.customer;
	const errors: string[] = [];
	const pageName = generatePageName(license);

	// 1. Find or create company
	let company = companiesStore.findByName(companyName);
	const isNewCompany = !company;

	if (!company) {
		company = companiesStore.create(companyName);
		if (!company) {
			return {
				success: false,
				companyName,
				isNewCompany: true,
				featuresImported: 0,
				featuresSkipped: 0,
				skusImported: 0,
				errors: ['Failed to create company']
			};
		}
	}

	// 2. Switch to the company
	companiesStore.switchTo(company.id);

	// 3. Find or create page by dongle number
	let targetPage: { id: string; name: string } | undefined = company.pages.find(p => p.name === pageName);

	if (!targetPage) {
		// Create a new page for this dongle
		const newPage = companiesStore.createPage(pageName);
		if (newPage) {
			targetPage = newPage;
		}
	}

	// 4. Switch to the target page
	if (targetPage) {
		companiesStore.switchToPage(targetPage.id);
	}

	// 5. Load the page's state into stores
	const pageState = companiesStore.currentPageState;
	packagesStore.loadFromPageState(pageState);
	panelsStore.loadFromPageState(pageState);

	// 6. Map features to bits and SKUs
	const mappingResult = mapFeatures(license.features);
	const bitsByPackage = groupByPackage(mappingResult.mappedFeatures);
	const uniqueSkus = getUniqueSkus(mappingResult.mappedSkus);

	// 6a. Profile dataset special handling
	if (license.isProfile) {
		// Profile datasets don't include Modeler/Machinist but they should always be selected
		if (!bitsByPackage['SC-Mill']) {
			bitsByPackage['SC-Mill'] = [];
		}
		if (!bitsByPackage['SC-Mill'].includes('Modeler')) {
			bitsByPackage['SC-Mill'].push('Modeler');
		}
		if (!bitsByPackage['SC-Mill'].includes('Machinist')) {
			bitsByPackage['SC-Mill'].push('Machinist');
		}

		// Profile Sim 5x Level logic:
		// Sim 5x checked + Sim 5x Level blank + HSS = "everything" (all SIM5X group bits)
		const hasSim5x = license.features.some(
			(f) => f === 'Sim 5x' || f === 'Sim5x' || f === 'Simultaneous 5x' || f === 'Simultanous 5x'
		);
		const hasHSS = license.features.includes('HSS');
		// Sim 5x Level blank means no specific level feature was checked
		const hasSimLevel = license.features.some((f) => f.includes('Sim 5x Level') || f.includes('Sim5xLevel'));

		if (hasSim5x && hasHSS && !hasSimLevel) {
			// Add all SIM5X group bits
			if (!bitsByPackage['SC-Mill-5Axis']) {
				bitsByPackage['SC-Mill-5Axis'] = [];
			}
			const sim5xBits = [
				'Sim5x',
				'Swarf machining',
				'5x Drill',
				'Contour 5x',
				'Convert5X',
				'Auto 3+2 Roughing'
			];
			for (const bit of sim5xBits) {
				if (!bitsByPackage['SC-Mill-5Axis'].includes(bit)) {
					bitsByPackage['SC-Mill-5Axis'].push(bit);
				}
			}
		}
	}

	// 7. Select bits in each package (union with existing)
	let totalBitsImported = 0;
	for (const [packageCode, bits] of Object.entries(bitsByPackage)) {
		const added = packagesStore.selectBits(packageCode, bits);
		totalBitsImported += added;
	}

	// 8. Add maintenance SKUs to panel (union with existing)
	let skusImported = 0;
	for (const sku of uniqueSkus) {
		if (!panelsStore.hasItem(MAINTENANCE_PANEL_ID, sku)) {
			panelsStore.addItem(MAINTENANCE_PANEL_ID, sku);
			skusImported++;
		}
	}

	// 9. Handle network license SKU
	if (license.isNetworkLicense) {
		if (!panelsStore.hasItem(MAINTENANCE_PANEL_ID, 'Lic-Net-Maint')) {
			panelsStore.addItem(MAINTENANCE_PANEL_ID, 'Lic-Net-Maint');
			skusImported++;
		}
	}

	// 10. Store license metadata on company
	companiesStore.setLicenseData(company.id, license);

	// 11. Save page state
	const currentPage = companiesStore.currentPage;
	if (currentPage) {
		const newState = {
			packages: packagesStore.getPageState(),
			panels: panelsStore.getPageState()
		};
		companiesStore.savePageState(currentPage.id, newState);
	}

	return {
		success: true,
		companyId: company.id,
		companyName: company.name,
		isNewCompany,
		featuresImported: totalBitsImported,
		featuresSkipped: mappingResult.unmappedFeatures.length + mappingResult.ignoredFeatures.length,
		skusImported,
		errors: errors.length > 0 ? errors : undefined
	};
}
