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
 * - Network Product Key (long key + network): "NPK 7452" (last 4 of key)
 * - Standalone Product Key (long key, no network): "SPK 7452" (last 4 of key)
 * - Profile only (no dongle, has profile number): "P5801", etc.
 */
function generatePageName(license: LicenseInfo): string {
	// Product Key: long product key number
	if (license.productKey && license.productKey.length > 4) {
		const last4 = license.productKey.slice(-4).toUpperCase();
		if (license.isNetworkLicense) {
			// Network Product Key
			return `NPK ${last4}`;
		}
		// Standalone Product Key
		return `SPK ${last4}`;
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

		// Profile Sim 5x Level logic (profiles only):
		// | Sim 5x | Level       | Result                          |
		// |--------|-------------|-------------------------------- |
		// | 0      | Any         | None                            |
		// | 1      | "3 Axis"    | HSS-Maint only                  |
		// | 1      | "3/4 Axis"  | HSS-Maint + Sim4x-Maint         |
		// | 1      | Blank       | All 5-axis bits + HSS           |
		// | 1      | Unknown     | Restricted (no 5-axis)          |
		const hasSim5x = license.features.some(
			(f) => f === 'Sim 5x' || f === 'Sim5x' || f === 'Simultaneous 5x' || f === 'Simultanous 5x'
		);
		const sim5xLevel = license.sim5xLevel?.trim() || '';
		const sim5xBits = [
			'Sim5x',
			'Swarf machining',
			'5x Drill',
			'Contour 5x',
			'Convert5X',
			'Auto 3+2 Roughing'
		];
		const removeSim5xBits = (removeSim4x = false): void => {
			const existingBits = bitsByPackage['SC-Mill-5Axis'];
			if (!existingBits) {
				return;
			}
			const removeSet = new Set(sim5xBits);
			if (removeSim4x) {
				removeSet.add('Sim4x');
			}
			bitsByPackage['SC-Mill-5Axis'] = existingBits.filter((bit) => !removeSet.has(bit));
		};

		if (hasSim5x) {
			// Normalize level value for comparison
			const levelLower = sim5xLevel.toLowerCase();
			const is3Axis = levelLower === '3 axis' || levelLower === '1' || levelLower === '3axis';
			const is34Axis = levelLower === '3/4 axis' || levelLower === '3/4axis';
			const isBlank = sim5xLevel === '';
			const isUnknown = !is3Axis && !is34Axis && !isBlank;

			if (is3Axis || isUnknown) {
				// Sim 5x = 1, Level "3 Axis" or "1": HSS-Maint only (no 5-axis bits added)
				removeSim5xBits(true);
				if (!uniqueSkus.includes('HSS-Maint')) {
					uniqueSkus.push('HSS-Maint');
				}
			} else if (is34Axis) {
				// Sim 5x = 1, Level "3/4 Axis": HSS-Maint + Sim4x-Maint + Sim4x bit
				removeSim5xBits();
				if (!uniqueSkus.includes('HSS-Maint')) {
					uniqueSkus.push('HSS-Maint');
				}
				if (!uniqueSkus.includes('Sim4x-Maint')) {
					uniqueSkus.push('Sim4x-Maint');
				}
				// Also add Sim4x bit
				if (!bitsByPackage['SC-Mill-5Axis']) {
					bitsByPackage['SC-Mill-5Axis'] = [];
				}
				if (!bitsByPackage['SC-Mill-5Axis'].includes('Sim4x')) {
					bitsByPackage['SC-Mill-5Axis'].push('Sim4x');
				}
			} else if (isBlank) {
				// Sim 5x = 1, Level blank: All 5-axis bits + HSS + Sim5x-Maint
				if (!bitsByPackage['SC-Mill-5Axis']) {
					bitsByPackage['SC-Mill-5Axis'] = [];
				}
				for (const bit of sim5xBits) {
					if (!bitsByPackage['SC-Mill-5Axis'].includes(bit)) {
						bitsByPackage['SC-Mill-5Axis'].push(bit);
					}
				}
				// Add Sim5x-Maint for full 5-axis package
				if (!uniqueSkus.includes('Sim5x-Maint')) {
					uniqueSkus.push('Sim5x-Maint');
				}
				if (!uniqueSkus.includes('HSS-Maint')) {
					uniqueSkus.push('HSS-Maint');
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
