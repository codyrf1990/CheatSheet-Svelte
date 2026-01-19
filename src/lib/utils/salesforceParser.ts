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
 * Normalize whitespace in text - converts non-breaking spaces and other Unicode
 * whitespace to regular spaces for consistent matching
 */
function normalizeWhitespace(text: string): string {
	return text.replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ');
}

/**
 * Extract a header field value from Salesforce text
 * Matches "Field Name\tvalue" patterns (tab-separated)
 */
function extractField(text: string, fieldName: string): string {
	// Normalize whitespace for consistent matching
	const normalizedText = normalizeWhitespace(text);
	// Make field name flexible - allow any whitespace between words
	const fieldParts = fieldName.trim().split(/\s+/);
	const flexibleField = fieldParts.map(escapeRegex).join('\\s+');
	// Match field name followed by tab or 2+ spaces and capture value until next tab, 2+ spaces, or newline
	// Use a more restrictive pattern to avoid capturing next field names when value is empty
	// The value capture group allows empty (using *) and stops at a field separator
	const separator = '(?:\\t|\\s{2,})';
	const regex = new RegExp(
		flexibleField + separator + '([^\\n\\t]*?)(?=\\t|\\s{2,}|\\n|$)',
		'i'
	);
	const match = normalizedText.match(regex);
	const value = match?.[1]?.trim() || '';

	// If the captured value looks like a field name (contains common Salesforce field patterns),
	// it means the actual value was empty and we spilled into the next field
	if (value && /^[A-Z][a-z].*(?:Checked|Type|No\.|Name|Date|Level|Version)/.test(value)) {
		return ''; // Treat as empty - we captured a field name, not a value
	}

	return value;
}

/**
 * Check if a checkbox field is checked
 * Returns true if "Field Name    Checked" (not "Not Checked")
 */
function extractChecked(text: string, fieldName: string): boolean {
	const normalizedText = normalizeWhitespace(text);
	// Make field name flexible - allow any whitespace between words
	const fieldParts = fieldName.trim().split(/\s+/);
	const flexibleField = fieldParts.map(escapeRegex).join('\\s+');
	const regex = new RegExp(flexibleField + '\\s+Checked(?!\\s*Not)', 'i');
	return regex.test(normalizedText);
}

/**
 * Validate that text appears to be from a Salesforce dongle or profile page
 */
export function validateSalesforceText(text: string): ValidationResult {
	if (!text || text.trim().length === 0) {
		return { valid: false, error: 'No text provided' };
	}

	// Must contain Dongle No. field OR Profile Name/No. (for profile-only pages)
	const hasDongleNo = text.includes('Dongle No.');
	// Check for explicit fields OR "Profile-XXXX" pattern (when Information section is collapsed)
	const hasProfileInfo =
		text.includes('Profile Name') || text.includes('Profile No.') || /Profile-\d+/.test(text);

	if (!hasDongleNo && !hasProfileInfo) {
		return {
			valid: false,
			error: 'Not a valid Salesforce page - missing Dongle No. or Profile info'
		};
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
 * Check if a dongle number is actually a product key (long number, not 5-digit dongle)
 * Hardware dongles are 5 digits, product keys are much longer
 */
function isProductKey(dongleNo: string): boolean {
	if (!dongleNo) return false;
	// Hardware dongles are exactly 5 digits
	// Product keys are longer numbers (e.g., 711394118544787452)
	const digitsOnly = dongleNo.replace(/\D/g, '');
	return digitsOnly.length > 5;
}

/**
 * Parse header information from Salesforce text
 */
export function parseHeaderInfo(text: string): Partial<LicenseInfo> {
	const dongleNo = extractField(text, 'Dongle No.');
	const serialNo = extractField(text, 'Serial No.');
	const customer = extractField(text, 'Customer');
	const dongleTypeRaw = extractField(text, 'Dongle Type');
	const maintenanceType = extractField(text, 'Maintenance Type');
	// Try both "Maintenance Start Date" (full) and "Maintenance Start" (short)
	const maintenanceStart =
		extractField(text, 'Maintenance Start Date') || extractField(text, 'Maintenance Start');
	const maintenanceEnd =
		extractField(text, 'Maintenance End Date') || extractField(text, 'Maintenance End');
	const solidcamVersion = extractField(text, 'SolidCAM Version');

	// Extract profile info (for Profile pages)
	let profileNo = extractField(text, 'Profile No.');
	let profileName = extractField(text, 'Profile Name');

	// If no explicit Profile Name field, look for "Profile-XXXX" pattern at start of text
	// This handles cases where Information section is collapsed
	if (!profileName) {
		const profileMatch = text.match(/Profile-(\d+)/);
		if (profileMatch) {
			profileName = profileMatch[0]; // e.g., "Profile-5801"
			if (!profileNo) {
				profileNo = profileMatch[1]; // e.g., "5801"
			}
		}
	}

	// If we have Profile Name like "Profile-5801" but no profileNo, extract it
	if (profileName && !profileNo) {
		const numMatch = profileName.match(/Profile-(\d+)/i);
		if (numMatch) {
			profileNo = numMatch[1];
		}
	}

	const isProfile = !!(profileNo || profileName);

	// Extract Sim 5x Level for profile datasets
	// Valid values: "3 Axis", "3/4 Axis", "1", or blank
	// Any other value indicates parse error - default to blank
	const sim5xLevelRaw =
		extractField(text, 'Sim 5x Level') || extractField(text, 'Sim5xLevel') || '';
	const validSim5xLevels = ['', '3 axis', '3/4 axis', '1', '3axis', '3/4axis'];
	const sim5xLevel = validSim5xLevels.includes(sim5xLevelRaw.toLowerCase())
		? sim5xLevelRaw
		: ''; // Invalid value = treat as blank

	// Determine if this is a network license
	const isNetwork = extractChecked(text, 'Net Dongle');

	// Determine if the "Dongle No." is actually a product key (long number)
	const isKey = isProductKey(dongleNo);

	// Determine dongle type from raw field or infer from data
	let dongleType: DongleType = dongleTypeRaw || 'Unknown';

	// Normalize dongle type from explicit field
	if (dongleTypeRaw.includes('MINI-NETUSB') || dongleTypeRaw.includes('NETUSB')) {
		dongleType = 'MINI-NETUSB';
	} else if (dongleTypeRaw.includes('MINI-USB') || dongleTypeRaw.includes('USB')) {
		dongleType = 'MINI-USB';
	} else if (dongleTypeRaw.toLowerCase().includes('software')) {
		dongleType = 'Software';
	} else if (isKey) {
		// Long number = product key (software license)
		dongleType = 'Software';
	}

	// Determine license type
	const licenseType: LicenseType = isKey || dongleType === 'Software' ? 'product-key' : 'dongle';

	// Generate display type based on actual license characteristics:
	// - Hardware Dongle: 5-digit dongle, no network
	// - Network Dongle (NWD): 5-digit dongle + network
	// - Network Product Key (NPK): Long key + network
	// - Standalone Product Key (SPK): Long key, no network
	// - Profile: Has profile number (can be NPK or NWD underneath, never SPK or hardware)
	let displayType = '';
	if (isProfile) {
		// Profile datasets are always network-based (NPK or NWD, never SPK or hardware)
		if (isKey) {
			displayType = 'Profile (NPK)';
		} else if (isNetwork) {
			displayType = 'Profile (NWD)';
		} else {
			// Can't determine underlying type, but it's still a network license
			displayType = 'Profile (Network)';
		}
	} else if (isKey && isNetwork) {
		// Long number + network = Network Product Key
		displayType = 'Network Product Key';
	} else if (isKey && !isNetwork) {
		// Long number + no network = Standalone Product Key
		displayType = 'Standalone Product Key';
	} else if (isNetwork) {
		// 5-digit dongle + network = Network Dongle
		displayType = 'Network Dongle';
	} else {
		// 5-digit dongle, no network = Hardware Dongle
		displayType = 'Hardware Dongle';
	}

	return {
		customer: customer || 'Unknown',
		dongleNo: isKey ? '' : dongleNo, // Don't store product key in dongleNo
		serialNo,
		productKey: isKey ? dongleNo : undefined, // Store long number as productKey
		licenseType,
		dongleType,
		displayType,
		isNetworkLicense: isNetwork, // Only true if Net Dongle is checked (product keys are NOT always network)
		isProfile,
		profileNo,
		sim5xLevel: sim5xLevel || undefined, // "3 Axis", "3/4 Axis", or undefined if blank
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

	// Normalize whitespace in text (non-breaking spaces, multiple spaces, etc.)
	const normalizedText = normalizeWhitespace(text);

	for (const feature of ALL_KNOWN_FEATURES) {
		// Build regex: Feature name followed by whitespace and "Checked"
		// Use negative lookahead to exclude "Not Checked"
		// Split feature name on spaces and join with \s+ to match any whitespace between words
		// This handles cases like "Sim 5x" matching "Sim  5x" or "Sim\t5x"
		const featureParts = feature.trim().split(/\s+/);
		const flexiblePattern = featureParts.map(escapeRegex).join('\\s+');
		const regex = new RegExp(flexiblePattern + '\\s+Checked(?!\\s*Not)', 'i');

		if (regex.test(normalizedText)) {
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
		productKey: headerInfo.productKey,
		licenseType: headerInfo.licenseType || 'dongle',
		dongleType: headerInfo.dongleType || 'Unknown',
		displayType: headerInfo.displayType || 'Unknown',
		isNetworkLicense: headerInfo.isNetworkLicense || false,
		isProfile: headerInfo.isProfile || false,
		profileNo: headerInfo.profileNo,
		sim5xLevel: headerInfo.sim5xLevel,
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
