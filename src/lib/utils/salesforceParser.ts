/**
 * Salesforce Text Parser for SolidCAM License Import
 *
 * Parses text copied from Salesforce dongle pages (Ctrl+A, Ctrl+C).
 * Looks for "Feature Checked" / "Feature Not Checked" patterns.
 */

import type { LicenseInfo, LicenseType, DongleType } from '$lib/types';
import { FEATURE_MAP, SKU_MAP } from './featureMapper';

export interface ParseResult {
	license: LicenseInfo | null;
	parseError?: string;
}

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * All known feature names from FEATURE_MAP and SKU_MAP
 * Used for pattern matching in Salesforce text
 */
const ALL_KNOWN_FEATURES: string[] = [
	// From FEATURE_MAP (package bits)
	...Object.keys(FEATURE_MAP),
	// From SKU_MAP (maintenance SKUs)
	...Object.keys(SKU_MAP)
];

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract a header field value from Salesforce text
 * Matches "Field Name\tvalue" patterns (tab-separated)
 */
function extractField(text: string, fieldName: string): string {
	// Match field name followed by whitespace and value (until tab, 2+ spaces, newline, or end)
	// Salesforce copy/paste uses tabs between fields: "Dongle No.\t77518\tMaintenance Type\tSC"
	const regex = new RegExp(fieldName + '\\s+([^\\n\\t]+?)(?=\\t|\\s{2,}|\\n|$)', 'i');
	const match = text.match(regex);
	return match?.[1]?.trim() || '';
}

/**
 * Check if a checkbox field is checked
 * Returns true if "Field Name    Checked" (not "Not Checked")
 */
function extractChecked(text: string, fieldName: string): boolean {
	const regex = new RegExp(fieldName + '\\s+Checked(?!\\s*Not)', 'i');
	return regex.test(text);
}

/**
 * Validate that text appears to be from a Salesforce dongle page
 */
export function validateSalesforceText(text: string): ValidationResult {
	if (!text || text.trim().length === 0) {
		return { valid: false, error: 'No text provided' };
	}

	// Must contain Dongle No. field
	if (!text.includes('Dongle No.')) {
		return { valid: false, error: 'Not a valid Salesforce dongle page - missing Dongle No.' };
	}

	// Must have SolidCAM section or feature names
	const hasFeatures = ALL_KNOWN_FEATURES.some((f) => text.includes(f));
	if (!hasFeatures && !text.includes('SolidCAM')) {
		return { valid: false, error: 'No SolidCAM features found in text' };
	}

	// Must have at least one Checked/Not Checked pattern
	if (!text.includes('Checked')) {
		return { valid: false, error: 'No checkbox states found - text may be incomplete' };
	}

	return { valid: true };
}

/**
 * Parse header information from Salesforce text
 */
export function parseHeaderInfo(text: string): Partial<LicenseInfo> {
	const dongleNo = extractField(text, 'Dongle No\\.');
	const serialNo = extractField(text, 'Serial No\\.');
	const customer = extractField(text, 'Customer');
	const dongleTypeRaw = extractField(text, 'Dongle Type');
	const maintenanceType = extractField(text, 'Maintenance Type');
	// Try both "Maintenance Start Date" (full) and "Maintenance Start" (short)
	const maintenanceStart =
		extractField(text, 'Maintenance Start Date') || extractField(text, 'Maintenance Start');
	const maintenanceEnd =
		extractField(text, 'Maintenance End Date') || extractField(text, 'Maintenance End');
	const solidcamVersion = extractField(text, 'SolidCAM Version');

	// Determine license type and dongle type
	const isNetwork = extractChecked(text, 'Net Dongle');
	let dongleType: DongleType = dongleTypeRaw || 'Unknown';

	// Normalize dongle type
	if (dongleTypeRaw.includes('MINI-NETUSB') || dongleTypeRaw.includes('NETUSB')) {
		dongleType = 'MINI-NETUSB';
	} else if (dongleTypeRaw.includes('MINI-USB') || dongleTypeRaw.includes('USB')) {
		dongleType = 'MINI-USB';
	} else if (dongleTypeRaw.toLowerCase().includes('software')) {
		dongleType = 'Software';
	}

	// Determine license type
	const licenseType: LicenseType = dongleType === 'Software' ? 'product-key' : 'dongle';

	// Generate display type
	let displayType = '';
	if (dongleType === 'Software') {
		displayType = isNetwork ? 'Software (Network)' : 'Software';
	} else if (dongleType === 'MINI-NETUSB' || isNetwork) {
		displayType = 'Hardware Dongle (Network)';
	} else {
		displayType = 'Hardware Dongle';
	}

	return {
		customer: customer || 'Unknown',
		dongleNo,
		serialNo,
		licenseType,
		dongleType,
		displayType,
		isNetworkLicense: isNetwork,
		isProfile: false, // Salesforce text isn't Profile format
		maintenanceType,
		maintenanceStart,
		maintenanceEnd,
		solidcamVersion
	};
}

/**
 * Parse checked features from Salesforce text
 * Returns array of feature names that have "Checked" status (not "Not Checked")
 */
export function parseCheckedFeatures(text: string): string[] {
	const features: string[] = [];

	for (const feature of ALL_KNOWN_FEATURES) {
		// Build regex: Feature name followed by whitespace and "Checked"
		// Use negative lookahead to exclude "Not Checked"
		const regex = new RegExp(escapeRegex(feature) + '\\s+Checked(?!\\s*Not)', 'i');

		if (regex.test(text)) {
			// Avoid duplicates (some features have multiple spellings in ALL_KNOWN_FEATURES)
			if (!features.includes(feature)) {
				features.push(feature);
			}
		}
	}

	return features;
}

/**
 * Parse Salesforce dongle page text into LicenseInfo
 */
export function parseSalesforceText(text: string): ParseResult {
	// Validate input
	const validation = validateSalesforceText(text);
	if (!validation.valid) {
		return {
			license: null,
			parseError: validation.error
		};
	}

	// Parse header info
	const headerInfo = parseHeaderInfo(text);

	// Parse features
	const features = parseCheckedFeatures(text);

	// Build complete LicenseInfo
	const license: LicenseInfo = {
		customer: headerInfo.customer || 'Unknown',
		dongleNo: headerInfo.dongleNo || '',
		serialNo: headerInfo.serialNo || '',
		productKey: undefined,
		licenseType: headerInfo.licenseType || 'dongle',
		dongleType: headerInfo.dongleType || 'Unknown',
		displayType: headerInfo.displayType || 'Unknown',
		isNetworkLicense: headerInfo.isNetworkLicense || false,
		isProfile: false,
		maintenanceType: headerInfo.maintenanceType || '',
		maintenanceStart: headerInfo.maintenanceStart || '',
		maintenanceEnd: headerInfo.maintenanceEnd || '',
		solidcamVersion: headerInfo.solidcamVersion || '',
		features,
		importedAt: Date.now(),
		sourceFileName: 'salesforce-paste'
	};

	return { license };
}

/**
 * Get a preview of what will be imported from Salesforce text
 */
export function getParsePreview(text: string): {
	customer: string;
	dongleNo: string;
	displayType: string;
	isNetwork: boolean;
	maintenanceStart: string;
	maintenanceEnd: string;
	featureCount: number;
	features: string[];
} | null {
	const result = parseSalesforceText(text);
	if (!result.license) return null;

	return {
		customer: result.license.customer,
		dongleNo: result.license.dongleNo,
		displayType: result.license.displayType,
		isNetwork: result.license.isNetworkLicense,
		maintenanceStart: result.license.maintenanceStart,
		maintenanceEnd: result.license.maintenanceEnd,
		featureCount: result.license.features.length,
		features: result.license.features
	};
}
