/**
 * SolidWorks Salesforce Text Parser
 *
 * Parses text copied from a Salesforce SolidWorks license page (Ctrl+A, Ctrl+C).
 * Format is distinct from SolidCAM dongle/profile pages: Serial Number, Account,
 * Product, Subscription dates, Users, PO Number — no feature checkboxes.
 */

import type { SolidWorksLicenseInfo, SolidWorksProduct } from '$lib/types';
import { extractField, extractChecked, normalizeWhitespace } from './salesforceParser';

export interface SolidWorksParseResult {
	license: SolidWorksLicenseInfo | null;
	parseError?: string;
}

/**
 * Detect whether the pasted text is a SolidWorks license page (vs. a SolidCAM
 * dongle/profile page or unrelated text). The presence of `Dongle No.` or
 * `Profile Name` rules SW out so SolidCAM imports don't false-match.
 */
export function isSolidWorksText(text: string): boolean {
	if (!text) return false;
	const normalized = normalizeWhitespace(text);
	if (normalized.includes('Dongle No.') || normalized.includes('Profile Name')) {
		return false;
	}
	const hasSolidWorksWord = /SOLIDWORKS|SolidWorks/i.test(normalized);
	const hasSerial = /Serial Number\s+/.test(normalized);
	const hasAccount = /\bAccount\s+/.test(normalized);
	const hasProduct = /\bProduct\s+/.test(normalized);
	return hasSolidWorksWord && hasSerial && hasAccount && hasProduct;
}

/**
 * Map a SolidWorks license to its corresponding -Maint SKU on the
 * `solidworks-maintenance` panel. Returns `null` when the product is Other
 * and no SKU mapping exists.
 *
 * Lives here (not in the import service) so node-only tooling can import it
 * without dragging in Svelte stores.
 */
export function solidworksMaintSku(license: SolidWorksLicenseInfo): string | null {
	switch (license.product) {
		case 'Parts':
			return 'SW-P-Maint';
		case 'Parts & Assemblies':
			return 'SW-PA-Maint';
		case 'Standard':
			return license.isNetworkLicense ? 'SW-Std-Net-Maint' : 'SW-Std-Maint';
		case 'Pro':
			return license.isNetworkLicense ? 'SW-Pro-Net-Maint' : 'SW-Pro-Maint';
		default:
			return null;
	}
}

/**
 * Map raw "Product" field text to a normalized SolidWorksProduct category.
 * Order matters — "Parts and Assemblies" must be checked before "Parts".
 */
export function productFromRaw(raw: string): SolidWorksProduct {
	const lower = raw.toLowerCase();
	if (lower.includes('parts and assemblies') || lower.includes('parts & assemblies')) {
		return 'Parts & Assemblies';
	}
	if (/\bpro(fessional)?\b/.test(lower)) return 'Pro';
	if (/\bstandard\b/.test(lower)) return 'Standard';
	if (/\bparts\b/.test(lower)) return 'Parts';
	return 'Other';
}

/**
 * Parse a SolidWorks license page into a SolidWorksLicenseInfo.
 */
export function parseSolidWorksText(text: string): SolidWorksParseResult {
	if (!text || text.trim().length === 0) {
		return { license: null, parseError: 'No text provided' };
	}
	if (!isSolidWorksText(text)) {
		return { license: null, parseError: 'Not a SolidWorks license page' };
	}

	const serialNumber = extractField(text, 'Serial Number');
	const account = extractField(text, 'Account');
	const customerId = extractField(text, 'SolidWorks Customer ID');
	const productRaw = extractField(text, 'Product');
	const subscriptionStart = extractField(text, 'Subscription start date');
	const subscriptionEnd = extractField(text, 'Subscription end date');
	const subscriptionTermination = extractField(text, 'Subscription Termination Date');
	const originalOrderType = extractField(text, 'Original Order Type');
	const usersRaw = extractField(text, 'Users');
	const poNumber = extractField(text, 'PO Number');

	const usersParsed = parseInt(usersRaw, 10);
	const users = Number.isFinite(usersParsed) && usersParsed >= 0 ? usersParsed : 1;

	if (!serialNumber) {
		return { license: null, parseError: 'Missing Serial Number' };
	}
	if (!productRaw) {
		return { license: null, parseError: 'Missing Product' };
	}

	const license: SolidWorksLicenseInfo = {
		serialNumber,
		account: account || 'Unknown',
		customerId,
		product: productFromRaw(productRaw),
		productRaw,
		subscriptionStart,
		subscriptionEnd,
		subscriptionTermination,
		terminationOfSupport: extractChecked(text, 'Termination Of Support'),
		originalOrderType,
		isNetworkLicense: extractChecked(text, 'Network License'),
		users,
		isTermLicense: extractChecked(text, 'Term License'),
		poNumber,
		importedAt: Date.now(),
		sourceFileName: 'salesforce-paste'
	};

	return { license };
}
