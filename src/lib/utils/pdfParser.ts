/**
 * PDF Parser for SolidCAM License PDFs
 *
 * Extracts license information from two PDF formats:
 * - Standard License: Has "Customer" field, dongle number in header
 * - Profile License: Has "Profile Name" field, "Profile-XXXX" in header
 */

import type { LicenseInfo, LicenseType, DongleType } from '$lib/types';

// Lazy-load pdfjs-dist to avoid SSR issues (DOMMatrix not defined on server)
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
	if (pdfjsLib) return pdfjsLib;

	pdfjsLib = await import('pdfjs-dist');
	pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
		'pdfjs-dist/build/pdf.worker.min.mjs',
		import.meta.url
	).toString();

	return pdfjsLib;
}

export type PdfFormat = 'standard' | 'profile';

interface Sim5xParsed {
	enabled: boolean;
	level: '' | '3 Axis' | '3/4 Axis';
}

interface TextItemWithPosition {
	str: string;
	x: number;
	y: number;
	width: number;
}

/**
 * Extract text content from a PDF file
 */
export async function extractTextFromPdf(file: File): Promise<string> {
	const pdfjs = await getPdfJs();
	const arrayBuffer = await file.arrayBuffer();
	const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

	let fullText = '';

	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i);
		const textContent = await page.getTextContent();
		const pageText = textContent.items
			.map((item) => ('str' in item ? item.str : ''))
			.join(' ');
		fullText += pageText + '\n';
	}

	return fullText;
}

/**
 * Extract text with position information for layout analysis
 */
export async function extractTextWithPositions(file: File): Promise<TextItemWithPosition[]> {
	const pdfjs = await getPdfJs();
	const arrayBuffer = await file.arrayBuffer();
	const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

	const items: TextItemWithPosition[] = [];

	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i);
		const textContent = await page.getTextContent();

		for (const item of textContent.items) {
			if ('str' in item && item.str.trim()) {
				// Transform contains [scaleX, skewX, skewY, scaleY, translateX, translateY]
				const transform = item.transform;
				items.push({
					str: item.str,
					x: transform[4],
					y: transform[5],
					width: item.width
				});
			}
		}
	}

	return items;
}

interface ImagePosition {
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * PDF Operator codes (from pdf.js OPS)
 */
const OPS = {
	save: 10,
	restore: 11,
	transform: 12,
	paintImageMaskXObject: 83,
	paintImageXObject: 85
};

/**
 * Extract all image XObjects from PDF with their positions
 * This helps identify checkmark images
 */
export async function extractImagePositions(file: File): Promise<ImagePosition[]> {
	const pdfjs = await getPdfJs();
	const arrayBuffer = await file.arrayBuffer();
	const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

	const images: ImagePosition[] = [];

	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i);
		const ops = await page.getOperatorList();

		// Track current transform matrix [a, b, c, d, e, f]
		// e = translateX, f = translateY, a = scaleX, d = scaleY
		const transformStack: number[][] = [[1, 0, 0, 1, 0, 0]];
		let currentTransform = transformStack[0];

		for (let j = 0; j < ops.fnArray.length; j++) {
			const fn = ops.fnArray[j];
			const args = ops.argsArray[j];

			switch (fn) {
				case OPS.save:
					// Push current transform onto stack
					transformStack.push([...currentTransform]);
					break;

				case OPS.restore:
					// Pop transform from stack
					if (transformStack.length > 1) {
						transformStack.pop();
						currentTransform = transformStack[transformStack.length - 1];
					}
					break;

				case OPS.transform:
					if (args && args.length >= 6) {
						// Multiply matrices: new = current * args
						const [a1, b1, c1, d1, e1, f1] = currentTransform;
						const [a2, b2, c2, d2, e2, f2] = args;
						currentTransform = [
							a1 * a2 + c1 * b2,
							b1 * a2 + d1 * b2,
							a1 * c2 + c1 * d2,
							b1 * c2 + d1 * d2,
							a1 * e2 + c1 * f2 + e1,
							b1 * e2 + d1 * f2 + f1
						];
						transformStack[transformStack.length - 1] = currentTransform;
					}
					break;

				case OPS.paintImageXObject:
				case OPS.paintImageMaskXObject:
					// Image is being painted at current transform position
					const imgName = args?.[0] || `img_${j}`;
					images.push({
						name: String(imgName),
						x: currentTransform[4],
						y: currentTransform[5],
						width: Math.abs(currentTransform[0]),
						height: Math.abs(currentTransform[3])
					});
					break;
			}
		}
	}

	return images;
}

/**
 * Analyze PDF to find checkbox images and determine which are checked
 * Salesforce PDFs use different images for checked vs unchecked checkboxes
 * The LESS common checkbox image type is typically the "checked" one
 */
export async function findCheckmarkPositions(file: File): Promise<ImagePosition[]> {
	const images = await extractImagePositions(file);

	// Filter to checkbox-sized images (typically 15-20 width, 12-15 height)
	const checkboxImages = images.filter(
		(img) => img.width > 10 && img.width < 25 && img.height > 8 && img.height < 20
	);

	// Group by image name to identify checked vs unchecked
	const byName: Record<string, ImagePosition[]> = {};
	for (const img of checkboxImages) {
		if (!byName[img.name]) byName[img.name] = [];
		byName[img.name].push(img);
	}

	console.log('--- Checkbox image types ---');
	const imageTypes = Object.entries(byName).map(([name, imgs]) => ({
		name,
		count: imgs.length,
		images: imgs
	}));
	imageTypes.sort((a, b) => b.count - a.count);

	for (const t of imageTypes) {
		console.log(`  ${t.name}: ${t.count} instances`);
	}

	// Heuristic: If we have 2+ types, the MORE common one is likely checked
	// (because real licenses typically have most features enabled)
	if (imageTypes.length >= 2) {
		// The most common checkbox type is assumed to be the "checked" one
		const checkedType = imageTypes[0]; // Most common
		console.log(`--- Assuming "${checkedType.name}" (${checkedType.count} instances) is CHECKED ---`);
		return checkedType.images;
	}

	// Fallback: return all checkbox images
	console.log('--- Could not determine checked vs unchecked, returning all ---');
	return checkboxImages;
}

/**
 * Match checkmark images to feature labels based on position
 * A checkmark is associated with a feature if it's on the same line (similar Y)
 * and to the left of the feature text
 */
export function matchCheckmarksToFeatures(
	checkmarks: ImagePosition[],
	textItems: TextItemWithPosition[],
	knownFeatures: string[]
): string[] {
	const checkedFeatures: string[] = [];

	// Y tolerance for considering items on the same line (PDF coordinates can vary)
	const Y_TOLERANCE = 20;

	// For each checkmark, find feature text near it
	for (const cm of checkmarks) {
		for (const item of textItems) {
			// Check if text is on same line (Y within tolerance)
			const yMatch = Math.abs(cm.y - item.y) < Y_TOLERANCE;
			// Text should be near the checkbox (within range either direction)
			const xMatch = item.x > cm.x - 50 && item.x < cm.x + 200;

			if (yMatch && xMatch) {
				// Check if this text contains a known feature
				for (const feature of knownFeatures) {
					if (item.str.includes(feature) && !checkedFeatures.includes(feature)) {
						checkedFeatures.push(feature);
						console.log(`  MATCH: ${feature} (checkbox y=${cm.y.toFixed(0)}, text y=${item.y.toFixed(0)})`);
					}
				}
			}
		}
	}

	return checkedFeatures;
}

/**
 * Extract form field data from a PDF file (checkboxes, etc.)
 * Returns a map of field names to their values
 */
export async function extractFormFields(file: File): Promise<Map<string, string | boolean>> {
	const pdfjs = await getPdfJs();
	const arrayBuffer = await file.arrayBuffer();
	const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

	const fields = new Map<string, string | boolean>();

	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i);
		const annotations = await page.getAnnotations();

		for (const annot of annotations) {
			if (annot.fieldType === 'Btn' && annot.checkBox) {
				// Checkbox field - fieldValue is the export value when checked
				const isChecked = annot.fieldValue !== null && annot.fieldValue !== 'Off' && annot.fieldValue !== '';
				fields.set(annot.fieldName || annot.alternativeText || `checkbox_${fields.size}`, isChecked);

				// Debug
				if (isChecked) {
					console.log('Checked checkbox:', annot.fieldName, annot.alternativeText, annot.fieldValue);
				}
			} else if (annot.fieldType === 'Tx') {
				// Text field
				fields.set(annot.fieldName || `text_${fields.size}`, annot.fieldValue || '');
			}
		}
	}

	return fields;
}

/**
 * Get list of checked feature names from form fields
 */
export function getCheckedFeatures(fields: Map<string, string | boolean>, text: string): string[] {
	const checkedFeatures: string[] = [];

	// Known feature names that might appear as checkbox field names
	const featureNames = [
		'Modeler', 'Machinist', 'SolidCAM Mill 2D', 'Profile/Pocket 2.5D Rest Material',
		'SolidCAM Mill 2.5D', 'Pocket Recognition', 'Chamfer recognition', 'Chamfer Recognition',
		'Hole+Drill Recognition', 'Hole + Drill Recognition', 'SolidCAM Mill 3D', 'SolidCAM Mill3D',
		'C-axes (Wrap)', '4-axes Indexial', '5-axes indexial', '5-axes Indexial',
		'Multi-depth Drill', 'Multi-Depth Drill', 'HSS', 'SolidCAM Turning', 'BackSpindle',
		'Back Spindle', 'iMachining', 'Machine Simulation', '5x Edge Breaking', 'Edge Breaking',
		'HSM', 'iMachining3D', 'Simultanous 5x', 'Simultaneous 5x', 'Sim 5x', 'Sim5x',
		'Swarf machining', '5x Drill', 'Contour 5x', 'Convert5X', 'Convert5x',
		'Auto 3+2 Roughing', 'Screw Machining (Rotary)', 'Simultanous 4x', 'Simultaneous 4x',
		'Multi-Axis Roughing', 'Multiaxis Roughing', 'Swiss-Type', 'Multi Turret Sync',
		'MultiBlade 5x', 'Port 5x', '5x Edge Trimming', 'Probe - Full', 'Vericut',
		'Cimco', 'Editor Mode', 'Net Dongle', 'Non Posting Option'
	];

	for (const [fieldName, value] of fields) {
		if (value === true) {
			// Try to match field name to a feature
			const matchedFeature = featureNames.find(
				(f) => fieldName.toLowerCase().includes(f.toLowerCase()) ||
					   f.toLowerCase().includes(fieldName.toLowerCase())
			);
			if (matchedFeature) {
				checkedFeatures.push(matchedFeature);
			} else {
				// Use the field name directly if it looks like a feature
				if (fieldName.length > 2 && !fieldName.startsWith('checkbox_')) {
					checkedFeatures.push(fieldName);
				}
			}
		}
	}

	return checkedFeatures;
}

/**
 * Detect if PDF is Standard or Profile format
 */
export function detectPdfFormat(text: string): PdfFormat {
	if (text.includes('Profile Name') && text.includes('Profile Users')) {
		return 'profile';
	}
	return 'standard';
}

/**
 * Extract company name from PDF text
 */
export function extractCompanyName(text: string, format: PdfFormat): string | null {
	if (format === 'profile') {
		// Profile format: Look for "Profile Name" field
		// Stop at next field label (Profile Users, Dongle No., etc.)
		const match = text.match(/Profile Name\s+(.+?)(?=\s+(?:Profile Users|Dongle No\.|Profile No\.|CAD|$))/i);
		return match?.[1]?.trim() || null;
	} else {
		// Standard format: Look for "Customer" field
		// Customer field ends before "Product key" or end of line
		const match = text.match(/Customer\s+([^\n]+?)(?:\s+Product key|\s*$)/i);
		return match?.[1]?.trim() || null;
	}
}

/**
 * Extract dongle number from PDF text
 */
export function extractDongleNo(text: string): string {
	const match = text.match(/Dongle No\.\s*(\d+)/i);
	return match?.[1] || '';
}

/**
 * Extract serial number from PDF text
 */
export function extractSerialNo(text: string): string {
	const match = text.match(/Serial No\.\s*([A-F0-9]+)/i);
	return match?.[1] || '';
}

/**
 * Extract product key UUID from PDF text
 */
export function extractProductKey(text: string): string | undefined {
	// UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
	const match = text.match(/Product key\s+([a-f0-9-]{36})/i);
	return match?.[1] || undefined;
}

/**
 * Determine license type (dongle vs product-key)
 */
export function determineLicenseType(text: string): LicenseType {
	const productKey = extractProductKey(text);
	if (productKey) {
		return 'product-key';
	}
	return 'dongle';
}

/**
 * Extract dongle type from PDF text
 */
export function extractDongleType(text: string): DongleType {
	// Check for specific dongle types
	if (text.includes('MINI-NETUSB')) return 'MINI-NETUSB';
	if (text.includes('MINI-USB')) return 'MINI-USB';
	if (text.includes('Software')) return 'Software';

	// Check Dongle Type field directly
	const match = text.match(/Dongle Type\s+([^\n]+)/i);
	return match?.[1]?.trim() || 'Unknown';
}

/**
 * Check if network license (Net Dongle checkbox)
 */
export function isNetworkLicense(text: string, fileName?: string): boolean {
	// Check for checkmark indicator
	if (/Net Dongle\s*[✓✔☑]/i.test(text)) {
		return true;
	}

	// Check filename hints (NWD = Network Dongle, NET = Network)
	if (fileName) {
		const upperName = fileName.toUpperCase();
		if (upperName.includes('NWD') || upperName.includes('NETWORK') || upperName.includes('NET DONGLE')) {
			return true;
		}
	}

	// Check for MINI-NETUSB dongle type in text
	if (text.includes('MINI-NETUSB')) {
		return true;
	}

	return false;
}

/**
 * Extract maintenance type
 */
export function extractMaintenanceType(text: string): string {
	const match = text.match(/Maintenance Type\s+([^\n]+)/i);
	return match?.[1]?.trim() || '';
}

/**
 * Extract maintenance start date
 */
export function extractMaintenanceStart(text: string): string {
	const match = text.match(/Maintenance Start Date\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
	return match?.[1] || '';
}

/**
 * Extract maintenance end date
 */
export function extractMaintenanceEnd(text: string): string {
	const match = text.match(/Maintenance End Date\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
	return match?.[1] || '';
}

/**
 * Extract SolidCAM version
 */
export function extractSolidcamVersion(text: string): string {
	const match = text.match(/SolidCAM Version\s+(\d{4})/i);
	return match?.[1] || '';
}

/**
 * Extract checked features from PDF text
 * Features are indicated by checkmark characters (✓, ✔, ☑)
 */
export function extractFeatures(text: string): string[] {
	const features: string[] = [];

	// Split into lines and look for checkmarks
	const lines = text.split(/\n|\s{2,}/);

	for (const line of lines) {
		// Check for checkmark indicators
		if (/[✓✔☑]/.test(line)) {
			// Extract the feature name (remove checkmark and trim)
			const cleaned = line.replace(/[✓✔☑]/g, '').trim();

			// Skip UI elements and empty strings
			if (
				cleaned &&
				!cleaned.includes('Close Window') &&
				!cleaned.includes('Print') &&
				cleaned.length > 1
			) {
				features.push(cleaned);
			}
		}
	}

	return features;
}

/**
 * Check if the PDF text contains feature names (even if we can't detect checkbox states)
 * Used to warn user when features are present but can't be auto-detected
 */
export function hasFeatureNames(text: string): boolean {
	const knownFeatures = [
		'Modeler', 'Machinist', 'SolidCAM Mill', 'HSS', 'HSM', 'iMachining',
		'SolidCAM Turning', 'Machine Simulation', 'Simultanous 5x', 'Simultaneous 5x'
	];
	return knownFeatures.some((f) => text.includes(f));
}

/**
 * Extract ALL feature names mentioned in PDF (for manual selection fallback)
 * Returns features that appear to be in the SolidCAM features section
 */
export function extractAllMentionedFeatures(text: string): string[] {
	const allFeatures: string[] = [];

	// Known feature names to look for
	const featurePatterns = [
		'Modeler', 'Machinist', 'SolidCAM Mill 2D', 'Profile/Pocket 2.5D Rest Material',
		'SolidCAM Mill 2.5D', 'Pocket Recognition', 'Chamfer recognition',
		'Hole+Drill Recognition', 'Hole \\+ Drill Recognition', 'SolidCAM Mill 3D',
		'C-axes \\(Wrap\\)', '4-axes Indexial', '5-axes indexial',
		'Multi-depth Drill', 'HSS', 'SolidCAM Turning', 'BackSpindle',
		'iMachining', 'iMachining3D', 'Machine Simulation', '5x Edge Breaking',
		'HSM', 'Simultanous 5x', 'Simultaneous 5x', 'Swarf machining', '5x Drill',
		'Contour 5x', 'Convert5X', 'Auto 3\\+2 Roughing', 'Screw Machining \\(Rotary\\)',
		'Simultanous 4x', 'Simultaneous 4x', 'Multi-Axis Roughing',
		'Swiss-Type', 'Multi Turret Sync', 'MultiBlade 5x', 'Port 5x',
		'5x Edge Trimming', 'Probe - Full', 'Vericut', 'Cimco', 'Editor Mode'
	];

	for (const pattern of featurePatterns) {
		const regex = new RegExp(pattern, 'i');
		if (regex.test(text)) {
			// Use the pattern without regex escapes as the feature name
			const featureName = pattern.replace(/\\/g, '');
			if (!allFeatures.includes(featureName)) {
				allFeatures.push(featureName);
			}
		}
	}

	return allFeatures;
}

/**
 * Parse Sim 5x Level from Profile PDFs
 * Profile PDFs have a compound field: Sim 5x checkbox + Sim 5x Level dropdown
 */
export function parseSim5xFromProfile(text: string): Sim5xParsed {
	// Check if Sim 5x checkbox is checked
	const sim5xLine = text.match(/Sim 5x\s*[✓✔☑]/i);
	const enabled = !!sim5xLine;

	// Extract level value
	const levelMatch = text.match(/Sim 5x Level\s+([^\n]*)/i);
	const levelRaw = levelMatch?.[1]?.trim() || '';

	// Normalize level value
	let level: Sim5xParsed['level'] = '';
	if (levelRaw.includes('3/4') || levelRaw.includes('3/4 Axis')) {
		level = '3/4 Axis';
	} else if (levelRaw.includes('3 Axis')) {
		level = '3 Axis';
	}

	return { enabled, level };
}

/**
 * Get bits to enable based on Sim 5x Level (Profile PDFs only)
 */
export function getSim5xBits(parsed: Sim5xParsed): string[] {
	if (!parsed.enabled) return [];

	switch (parsed.level) {
		case '3 Axis':
			return ['HSS']; // HSS only
		case '3/4 Axis':
			return ['Sim4x']; // Sim4x only
		case '':
		default:
			// Full SIM5X group
			return [
				'Sim5x',
				'Swarf machining',
				'5x Drill',
				'Contour 5x',
				'Convert5X',
				'Auto 3+2 Roughing',
				'Screw Machining (Rotary)'
			];
	}
}

/**
 * Get human-readable license type description
 */
export function getLicenseTypeDisplay(
	dongleType: DongleType,
	isNetwork: boolean,
	isProfile: boolean,
	hasProductKey: boolean
): string {
	if (isProfile) {
		return isNetwork ? 'Profile (Network)' : 'Profile';
	}

	if (hasProductKey) {
		return isNetwork ? 'Product Key (Network)' : 'Product Key';
	}

	// Hardware dongle
	if (dongleType === 'MINI-NETUSB' || isNetwork) {
		return 'Hardware Dongle (Network)';
	}
	if (dongleType === 'MINI-USB') {
		return 'Hardware Dongle';
	}
	if (dongleType === 'Software') {
		return isNetwork ? 'Software (Network)' : 'Software';
	}

	return isNetwork ? `${dongleType} (Network)` : dongleType;
}

// Comprehensive list of all known features
const ALL_KNOWN_FEATURES = [
	'Modeler',
	'Machinist',
	'SolidCAM Mill 2D',
	'Profile/Pocket 2.5D Rest Material',
	'SolidCAM Mill 2.5D',
	'Pocket Recognition',
	'Chamfer recognition',
	'Chamfer Recognition',
	'Hole+Drill Recognition',
	'Hole + Drill Recognition',
	'SolidCAM Mill 3D',
	'SolidCAM Mill3D',
	'C-axes (Wrap)',
	'4-axes Indexial',
	'5-axes indexial',
	'5-axes Indexial',
	'Multi-depth Drill',
	'Multi-Depth Drill',
	'HSS',
	'SolidCAM Turning',
	'BackSpindle',
	'Back Spindle',
	'iMachining',
	'iMachining3D',
	'Machine Simulation',
	'5x Edge Breaking',
	'Edge Breaking',
	'HSM',
	'Sim5x',
	'Sim 5x',
	'Simultanous 5x',
	'Simultaneous 5x',
	'Swarf machining',
	'5x Drill',
	'Contour 5x',
	'Convert5X',
	'Convert5x',
	'Auto 3+2 Roughing',
	'Screw Machining (Rotary)',
	'Simultanous 4x',
	'Simultaneous 4x',
	'Sim4x',
	'Sim 4x',
	'Multi-Axis Roughing',
	'Multiaxis Roughing',
	'Swiss-Type',
	'Multi Turret Sync',
	'MultiBlade 5x',
	'Port 5x',
	'5x Edge Trimming',
	'Probe - Full',
	'Probe',
	'Vericut',
	'Cimco',
	'Editor Mode',
	'Net Dongle',
	'Non Posting Option'
];

/**
 * Parse a PDF file and extract all license information
 */
export async function parseLicensePdf(file: File): Promise<LicenseInfo> {
	const text = await extractTextFromPdf(file);
	const formFields = await extractFormFields(file);

	// Get text with positions for layout analysis
	const textItems = await extractTextWithPositions(file);

	// Debug: Log extracted text to console
	console.log('=== PDF Text Extraction Debug ===');
	console.log('File:', file.name);
	console.log('Text length:', text.length);
	console.log('Text items with positions:', textItems.length);
	console.log('Form fields found:', formFields.size);

	// Find checkmark images
	console.log('--- Looking for checkmark images ---');
	const checkmarks = await findCheckmarkPositions(file);
	console.log(`Found ${checkmarks.length} potential checkmark images`);

	// Try to match checkmarks to features by position
	const imageBasedFeatures = matchCheckmarksToFeatures(checkmarks, textItems, ALL_KNOWN_FEATURES);
	console.log('--- Image-based feature detection ---');
	console.log(`Matched ${imageBasedFeatures.length} features:`, imageBasedFeatures);

	console.log('--- Form fields ---');
	for (const [key, value] of formFields) {
		if (value === true || (typeof value === 'string' && value.length > 0)) {
			console.log(`  ${key}: ${value}`);
		}
	}
	console.log('--- End of preview ---');

	const format = detectPdfFormat(text);

	const customer = extractCompanyName(text, format) || 'Unknown';
	const dongleNo = extractDongleNo(text);
	const serialNo = extractSerialNo(text);
	const productKey = extractProductKey(text);
	const licenseType = determineLicenseType(text);
	const dongleType = extractDongleType(text);

	// Check for network license - from form field, text, or filename hints
	const isNetwork = formFields.get('Net Dongle') === true || isNetworkLicense(text, file.name);

	const maintenanceType = extractMaintenanceType(text);
	const maintenanceStart = extractMaintenanceStart(text);
	const maintenanceEnd = extractMaintenanceEnd(text);
	const solidcamVersion = extractSolidcamVersion(text);

	// Feature detection priority:
	// 1. Image-based detection (checkmark images next to feature text)
	// 2. Form fields (AcroForm checkboxes)
	// 3. Text extraction (checkmark unicode characters)
	let features: string[] = [];

	if (imageBasedFeatures.length > 0) {
		features = imageBasedFeatures;
		console.log('Using IMAGE-BASED feature detection');
	} else {
		features = getCheckedFeatures(formFields, text);
		if (features.length > 0) {
			console.log('Using FORM FIELD feature detection');
		} else {
			features = extractFeatures(text);
			console.log('Using TEXT-BASED feature detection');
		}
	}

	// Debug: Log extracted data
	console.log('--- Parsed Data ---');
	console.log('Format:', format);
	console.log('Customer:', customer);
	console.log('Dongle No:', dongleNo);
	console.log('Dongle Type:', dongleType);
	console.log('Is Network:', isNetwork);
	console.log('Display Type:', getLicenseTypeDisplay(dongleType, isNetwork, format === 'profile', !!productKey));
	console.log('Features found:', features.length, features);
	console.log('=== End Debug ===');

	// Handle Profile-specific Sim 5x Level logic
	if (format === 'profile') {
		const sim5x = parseSim5xFromProfile(text);
		const sim5xBits = getSim5xBits(sim5x);

		// Add Sim 5x bits to features if not already present
		for (const bit of sim5xBits) {
			if (!features.includes(bit)) {
				features.push(bit);
			}
		}
	}

	const displayType = getLicenseTypeDisplay(dongleType, isNetwork, format === 'profile', !!productKey);

	return {
		customer,
		dongleNo,
		serialNo,
		productKey,
		licenseType,
		dongleType,
		displayType,
		isNetworkLicense: isNetwork,
		isProfile: format === 'profile',
		maintenanceType,
		maintenanceStart,
		maintenanceEnd,
		solidcamVersion,
		features,
		importedAt: Date.now(),
		sourceFileName: file.name
	};
}
