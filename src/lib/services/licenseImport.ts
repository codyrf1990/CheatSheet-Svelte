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
	getLicenseSelections,
	getPageNameForLicense,
	PACKAGE_BIT_SKUS
} from '$lib/utils/licenseSelections';
import { companiesStore, DEFAULT_PAGE_NAME } from '$lib/stores/companies.svelte';
import { packagesStore } from '$lib/stores/packages.svelte';
import { panelsStore } from '$lib/stores/panels.svelte';

const MAINTENANCE_PANEL_ID = 'maintenance-skus';

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
	const pageName = getPageNameForLicense(license);

	// Check if page exists in existing company
	let isNewPage = true;
	if (existingCompany) {
		const existingPage = existingCompany.pages.find(p => p.name === pageName);
		if (existingPage) {
			isNewPage = false;
		} else if (existingCompany.pages.length === 1 && existingCompany.pages[0].name === DEFAULT_PAGE_NAME) {
			// We'll rename the default page instead of creating a new one
			isNewPage = false;
		}
	}

	const selections = getLicenseSelections(license);
	const mappingResult = selections.mappingResult;
	const uniqueSkus = selections.skus;

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
	const pageName = getPageNameForLicense(license);

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
		// Rename the default page instead of creating a second one when only P1 exists
		if (company.pages.length === 1 && company.pages[0].name === DEFAULT_PAGE_NAME) {
			companiesStore.renamePage(company.pages[0].id, pageName);
			targetPage = { id: company.pages[0].id, name: pageName };
		} else {
			// Create a new page for this dongle
			const newPage = companiesStore.createPage(pageName);
			if (newPage) {
				targetPage = newPage;
			}
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

	// 6. Map features to bits and SKUs (includes profile-specific logic)
	const selections = getLicenseSelections(license);
	const mappingResult = selections.mappingResult;
	const bitsByPackage = selections.bitsByPackage;
	const uniqueSkus = selections.skus;
	const removedBitsByPackage = selections.removedBitsByPackage;
	const removedSkus = selections.removedSkus;

	// 7. Remove explicitly Not Checked bits
	for (const [packageCode, bits] of Object.entries(removedBitsByPackage)) {
		packagesStore.removeBits(packageCode, bits);
	}

	// 8. Select bits in each package (union with existing)
	let totalBitsImported = 0;
	for (const [packageCode, bits] of Object.entries(bitsByPackage)) {
		const added = packagesStore.selectBits(packageCode, bits);
		totalBitsImported += added;
	}

	// 9. Remove package-backed SKUs and explicitly Not Checked SKUs, then add remaining maintenance SKUs
	let skusImported = 0;
	for (const sku of PACKAGE_BIT_SKUS) {
		if (panelsStore.hasItem(MAINTENANCE_PANEL_ID, sku)) {
			panelsStore.removeItem(MAINTENANCE_PANEL_ID, sku);
		}
	}
	for (const sku of removedSkus) {
		if (panelsStore.hasItem(MAINTENANCE_PANEL_ID, sku)) {
			panelsStore.removeItem(MAINTENANCE_PANEL_ID, sku);
		}
	}
	const skusToAdd = uniqueSkus.filter((sku) => !PACKAGE_BIT_SKUS.has(sku));
	for (const sku of skusToAdd) {
		if (!panelsStore.hasItem(MAINTENANCE_PANEL_ID, sku)) {
			panelsStore.addItem(MAINTENANCE_PANEL_ID, sku);
			skusImported++;
		}
	}

	// 10. Handle network license SKU
	if (license.isNetworkLicense) {
		if (!panelsStore.hasItem(MAINTENANCE_PANEL_ID, 'Lic-Net-Maint')) {
			panelsStore.addItem(MAINTENANCE_PANEL_ID, 'Lic-Net-Maint');
			skusImported++;
		}
	}

	// 11. Store license metadata on company
	companiesStore.setLicenseData(company.id, license);

	// 12. Save page state
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
