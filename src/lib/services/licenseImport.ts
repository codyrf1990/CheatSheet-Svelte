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
import { SKU_LOOKUP } from '$lib/data/skuData';
import { PACKAGE_TOGGLE_BITS } from '$lib/data/prerequisites';
import { packages as packageDefs } from '$lib/data';

const MAINTENANCE_PANEL_ID = 'maintenance-skus';

/** Check if a group has at least one selected bit */
function isGroupSelectedInBits(packageCode: string, groupId: string, bits: string[]): boolean {
	const pkg = packageDefs.find((p) => p.code === packageCode);
	if (!pkg) return false;
	const group = pkg.groups?.find((g) => g.masterId === groupId);
	if (!group) return false;
	return group.bits.some((bit) => bits.includes(bit));
}

/**
 * Check if a license needs manual company name input
 * Returns true if customer field is missing or generic
 */
export function needsCompanyNameInput(license: LicenseInfo): boolean {
	const customer = license.customer;
	return !customer || customer === 'Unknown' || customer.trim() === '';
}

export interface ParentLicenseMatch {
	license: LicenseInfo;
	companyId: string;
	companyName: string;
}

/**
 * Find an already-imported parent license (NPK/NWD) for a profile.
 *
 * Matches the profile's productKey or dongleNo against any non-profile license
 * stored on a company. When multiple candidates match (rare — happens if the
 * same key was imported into different companies), returns the most recently
 * imported one.
 *
 * Returns null when the input isn't a profile or no parent is found, so callers
 * can fall back to the existing manual-entry flow.
 */
export function findParentLicense(license: LicenseInfo): ParentLicenseMatch | null {
	if (!license.isProfile) return null;

	const targetKey = license.productKey?.trim() ?? '';
	const targetDongle = license.dongleNo?.trim() ?? '';
	if (!targetKey && !targetDongle) return null;

	const matches: ParentLicenseMatch[] = [];
	for (const company of companiesStore.all) {
		for (const candidate of company.licenses ?? []) {
			if (candidate.isProfile) continue;
			const candidateKey = candidate.productKey?.trim() ?? '';
			const candidateDongle = candidate.dongleNo?.trim() ?? '';
			const keyMatch = !!targetKey && targetKey === candidateKey;
			const dongleMatch = !!targetDongle && targetDongle === candidateDongle;
			if (keyMatch || dongleMatch) {
				matches.push({
					license: candidate,
					companyId: company.id,
					companyName: company.name
				});
			}
		}
	}

	if (matches.length === 0) return null;
	if (matches.length === 1) return matches[0];

	matches.sort((a, b) => {
		const tDelta = (b.license.importedAt ?? 0) - (a.license.importedAt ?? 0);
		if (tDelta !== 0) return tDelta;
		// Tie on importedAt → fall back to companyName for deterministic ordering
		return a.companyName.localeCompare(b.companyName);
	});
	return matches[0];
}

/** Field keys on LicenseInfo that can be inherited from a parent NPK */
export type InheritableField =
	| 'customer'
	| 'maintenanceStart'
	| 'maintenanceEnd'
	| 'solidcamVersion'
	| 'isNetworkLicense';

export interface ProfileEnrichment {
	license: LicenseInfo;
	parent: ParentLicenseMatch;
	inheritedFields: Set<InheritableField>;
}

/**
 * Enrich a parsed profile license with values inherited from its parent NPK
 * (if one exists in the system). Only fills fields the profile is missing —
 * never overwrites populated values.
 *
 * Returns null when no parent is found, signaling callers to use the original
 * license unchanged.
 */
export function enrichProfileFromParent(license: LicenseInfo): ProfileEnrichment | null {
	const parent = findParentLicense(license);
	if (!parent) return null;

	const inherited = new Set<InheritableField>();
	const enriched: LicenseInfo = { ...license };

	const customerEmpty =
		!enriched.customer || enriched.customer === 'Unknown' || !enriched.customer.trim();
	if (customerEmpty && parent.license.customer && parent.license.customer !== 'Unknown') {
		enriched.customer = parent.license.customer;
		inherited.add('customer');
	}
	if (!enriched.maintenanceStart?.trim() && parent.license.maintenanceStart?.trim()) {
		enriched.maintenanceStart = parent.license.maintenanceStart;
		inherited.add('maintenanceStart');
	}
	if (!enriched.maintenanceEnd?.trim() && parent.license.maintenanceEnd?.trim()) {
		enriched.maintenanceEnd = parent.license.maintenanceEnd;
		inherited.add('maintenanceEnd');
	}
	if (!enriched.solidcamVersion?.trim() && parent.license.solidcamVersion?.trim()) {
		enriched.solidcamVersion = parent.license.solidcamVersion;
		inherited.add('solidcamVersion');
	}
	if (!enriched.isNetworkLicense && parent.license.isNetworkLicense) {
		enriched.isNetworkLicense = true;
		inherited.add('isNetworkLicense');
	}

	if (inherited.size === 0) return null;
	return { license: enriched, parent, inheritedFields: inherited };
}

/**
 * Get preview of what will be imported.
 *
 * `pinnedCompanyId` lets profile imports target the parent NPK's company
 * directly, even if that company was renamed since the parent was imported.
 */
export function getImportPreview(
	license: LicenseInfo,
	pinnedCompanyId?: string
): {
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
	const pinnedCompany = pinnedCompanyId
		? (companiesStore.all.find((c) => c.id === pinnedCompanyId) ?? null)
		: null;
	const existingCompany = pinnedCompany ?? companiesStore.findByName(companyName);
	const pageName = getPageNameForLicense(license);

	// Check if page exists in existing company
	let isNewPage = true;
	if (existingCompany) {
		const existingPage = existingCompany.pages.find((p) => p.name === pageName);
		if (existingPage) {
			isNewPage = false;
		} else if (
			existingCompany.pages.length === 1 &&
			existingCompany.pages[0].name === DEFAULT_PAGE_NAME
		) {
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
 * Creates or updates company and page, selects bits, adds SKUs.
 *
 * `pinnedCompanyId` forces the import into a specific company (used for
 * profile imports — points at the parent NPK's company so renames don't
 * cause a duplicate company to be created).
 */
export function importLicense(
	license: LicenseInfo,
	overrideCompanyName?: string,
	pinnedCompanyId?: string
): ImportResult {
	const companyName = overrideCompanyName || license.customer;
	const errors: string[] = [];
	const pageName = getPageNameForLicense(license);

	// 1. Find or create company. Prefer the pinned id (profile parent) so the
	// profile lands in the correct company even if it has been renamed.
	let company =
		(pinnedCompanyId
			? (companiesStore.all.find((c) => c.id === pinnedCompanyId) ?? null)
			: null) ?? companiesStore.findByName(companyName);
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
	let targetPage: { id: string; name: string } | undefined = company.pages.find(
		(p) => p.name === pageName
	);

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

	// 4. Switch to the target page and store full license key
	if (targetPage) {
		companiesStore.switchToPage(targetPage.id);
		const fullKey = license.productKey?.trim() || license.dongleNo?.trim() || '';
		if (fullKey) {
			companiesStore.setPageLicenseKey(targetPage.id, fullKey);
		}
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
	const importedSkuList: string[] = [];
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
			importedSkuList.push(sku);
		}
	}

	// 10. Package-level maint SKUs — add when package is fully selected
	const PACKAGE_CODES = [
		'SC-Mill',
		'SC-Mill-Adv',
		'SC-Mill-3D',
		'SC-Mill-5Axis',
		'SC-Turn'
	] as const;
	for (const code of PACKAGE_CODES) {
		const pkgEntry = SKU_LOOKUP[`${code}::PACKAGE`];
		if (!pkgEntry?.maintSku) continue;

		const selectedBitsForPkg = bitsByPackage[code] ?? [];
		if (selectedBitsForPkg.length === 0) continue;

		const toggleDef = PACKAGE_TOGGLE_BITS[code];
		if (!toggleDef) continue;

		let isFullySelected: boolean;
		if (code === 'SC-Turn') {
			// SC-Turn: qualifying bit is SolidCAM Turning (Backspindle is optional hardware)
			isFullySelected = selectedBitsForPkg.includes('SolidCAM Turning');
		} else {
			const allGroupsSelected = (toggleDef.groups ?? []).every((g) =>
				isGroupSelectedInBits(code, g, selectedBitsForPkg)
			);
			const allLooseSelected = (toggleDef.looseBits ?? []).every((b) =>
				selectedBitsForPkg.includes(b)
			);
			isFullySelected = allGroupsSelected && allLooseSelected;
		}

		if (isFullySelected && !panelsStore.hasItem(MAINTENANCE_PANEL_ID, pkgEntry.maintSku)) {
			panelsStore.addItem(MAINTENANCE_PANEL_ID, pkgEntry.maintSku);
			skusImported++;
			importedSkuList.push(pkgEntry.maintSku);
		}
	}

	// 11. Handle network license SKU
	if (license.isNetworkLicense) {
		if (!panelsStore.hasItem(MAINTENANCE_PANEL_ID, 'Lic-Net-Maint')) {
			panelsStore.addItem(MAINTENANCE_PANEL_ID, 'Lic-Net-Maint');
			skusImported++;
			importedSkuList.push('Lic-Net-Maint');
		}
	}

	// 12. Store license metadata on company
	companiesStore.setLicenseData(company.id, license);

	// 13. Save page state
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
		importedSkuList: importedSkuList.length > 0 ? importedSkuList : undefined,
		errors: errors.length > 0 ? errors : undefined
	};
}
