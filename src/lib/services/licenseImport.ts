/**
 * License Import Service
 *
 * Orchestrates the import of SolidCAM license PDFs:
 * 1. Parse PDFs and extract license info
 * 2. Map features to package bits and maintenance SKUs
 * 3. Create or find existing companies
 * 4. Apply selections to packages and panels
 * 5. Store license metadata
 */

import type { ParsedPDF, ImportResult, LicenseInfo } from '$lib/types';
import { parseLicensePdf } from '$lib/utils/pdfParser';
import {
	mapFeatures,
	groupByPackage,
	getUniqueSkus,
	type MappingResult
} from '$lib/utils/featureMapper';
import { companiesStore } from '$lib/stores/companies.svelte';
import { packagesStore } from '$lib/stores/packages.svelte';
import { panelsStore } from '$lib/stores/panels.svelte';

const MAINTENANCE_PANEL_ID = 'maintenance-skus';

/**
 * Parse a single PDF file
 */
export async function parsePdf(file: File): Promise<ParsedPDF> {
	try {
		const license = await parseLicensePdf(file);
		return {
			fileName: file.name,
			license,
			parseError: undefined
		};
	} catch (error) {
		return {
			fileName: file.name,
			license: null,
			parseError: error instanceof Error ? error.message : 'Unknown error parsing PDF'
		};
	}
}

/**
 * Parse multiple PDF files
 */
export async function parsePdfs(files: File[]): Promise<ParsedPDF[]> {
	const results: ParsedPDF[] = [];

	for (const file of files) {
		const result = await parsePdf(file);
		results.push(result);
	}

	return results;
}

/**
 * Get import preview for a parsed PDF
 * Shows what will happen without actually importing
 */
export function getImportPreview(parsed: ParsedPDF): {
	companyName: string;
	isNewCompany: boolean;
	existingCompanyId?: string;
	mappableFeatures: number;
	totalFeatures: number;
	mappedSkus: number;
	unmappedFeatures: string[];
} | null {
	if (!parsed.license) return null;

	const companyName = parsed.license.customer;
	const existingCompany = companiesStore.findByName(companyName);

	const mappingResult = mapFeatures(parsed.license.features);
	const uniqueSkus = getUniqueSkus(mappingResult.mappedSkus);

	return {
		companyName,
		isNewCompany: !existingCompany,
		existingCompanyId: existingCompany?.id,
		mappableFeatures: mappingResult.mappedFeatures.length,
		totalFeatures: parsed.license.features.length,
		mappedSkus: uniqueSkus.length,
		unmappedFeatures: mappingResult.unmappedFeatures
	};
}

/**
 * Import a single license into the system
 * Creates or updates company, selects bits, adds SKUs
 */
export function importLicense(
	license: LicenseInfo,
	overrideCompanyName?: string
): ImportResult {
	const companyName = overrideCompanyName || license.customer;
	const errors: string[] = [];

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

	// 2. Switch to the company to work with its page state
	companiesStore.switchTo(company.id);

	// 3. Map features to bits and SKUs
	const mappingResult = mapFeatures(license.features);
	const bitsByPackage = groupByPackage(mappingResult.mappedFeatures);
	const uniqueSkus = getUniqueSkus(mappingResult.mappedSkus);

	// 4. Select bits in each package (union with existing)
	let totalBitsImported = 0;
	for (const [packageCode, bits] of Object.entries(bitsByPackage)) {
		const added = packagesStore.selectBits(packageCode, bits);
		totalBitsImported += added;
	}

	// 5. Add maintenance SKUs to panel (union with existing)
	let skusImported = 0;
	for (const sku of uniqueSkus) {
		if (!panelsStore.hasItem(MAINTENANCE_PANEL_ID, sku)) {
			panelsStore.addItem(MAINTENANCE_PANEL_ID, sku);
			skusImported++;
		}
	}

	// 6. Handle network license SKU
	if (license.isNetworkLicense) {
		if (!panelsStore.hasItem(MAINTENANCE_PANEL_ID, 'Lic-Net-Maint')) {
			panelsStore.addItem(MAINTENANCE_PANEL_ID, 'Lic-Net-Maint');
			skusImported++;
		}
	}

	// 7. Store license metadata on company
	companiesStore.setLicenseData(company.id, license);

	// 8. Save page state (bits + panels get auto-saved through effects in +page.svelte)
	// The stores will trigger the save automatically

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

/**
 * Import multiple parsed PDFs
 */
export function importParsedPdfs(
	parsedPdfs: ParsedPDF[],
	companyNameOverrides?: Map<string, string>
): ImportResult[] {
	const results: ImportResult[] = [];

	for (const parsed of parsedPdfs) {
		if (!parsed.license) {
			results.push({
				success: false,
				companyName: parsed.fileName,
				isNewCompany: false,
				featuresImported: 0,
				featuresSkipped: 0,
				skusImported: 0,
				errors: [parsed.parseError || 'No license data extracted']
			});
			continue;
		}

		const overrideName = companyNameOverrides?.get(parsed.fileName);
		const result = importLicense(parsed.license, overrideName);
		results.push(result);
	}

	return results;
}

/**
 * Calculate summary statistics from import results
 */
export function calculateImportSummary(results: ImportResult[]): {
	totalPdfs: number;
	successCount: number;
	failureCount: number;
	newCompanies: number;
	updatedCompanies: number;
	totalFeaturesImported: number;
	totalFeaturesSkipped: number;
	totalSkusImported: number;
} {
	return {
		totalPdfs: results.length,
		successCount: results.filter((r) => r.success).length,
		failureCount: results.filter((r) => !r.success).length,
		newCompanies: results.filter((r) => r.success && r.isNewCompany).length,
		updatedCompanies: results.filter((r) => r.success && !r.isNewCompany).length,
		totalFeaturesImported: results.reduce((sum, r) => sum + r.featuresImported, 0),
		totalFeaturesSkipped: results.reduce((sum, r) => sum + r.featuresSkipped, 0),
		totalSkusImported: results.reduce((sum, r) => sum + r.skusImported, 0)
	};
}

/**
 * Check if a PDF needs a company name override
 * Returns true if:
 * - No customer name was extracted
 * - Customer name is generic (Unknown, empty)
 * - It's a Profile PDF (which may have profile name instead of customer)
 */
export function needsCompanyNameOverride(parsed: ParsedPDF): boolean {
	if (!parsed.license) return false;

	const customer = parsed.license.customer;

	// Need override if no valid customer name
	if (!customer || customer === 'Unknown' || customer.trim() === '') {
		return true;
	}

	// Also need override for Profile PDFs (in case customer extraction partially worked)
	return parsed.license.isProfile;
}

/**
 * Get suggested company name for a parsed PDF
 * Returns extracted customer name if valid, otherwise empty for user to fill in
 * Profile PDFs always return empty - user must enter the name manually
 */
export function getSuggestedCompanyName(parsed: ParsedPDF): string {
	// Profile PDFs: always require manual entry (extracted name may not be the company)
	if (parsed.license?.isProfile) {
		return '';
	}

	const customer = parsed.license?.customer;

	// If we have a valid customer name that's not "Unknown", suggest it
	if (customer && customer !== 'Unknown' && customer.trim() !== '') {
		return customer;
	}

	// Otherwise return empty so user knows they need to enter one
	return '';
}
