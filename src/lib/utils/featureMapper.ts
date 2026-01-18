/**
 * Feature Mapper for SolidCAM License PDFs
 *
 * Maps PDF feature names to CheatSheet package bits and maintenance SKUs.
 * Handles case variations and alternate naming in PDFs.
 */

export interface FeatureMapping {
	bit: string;
	package: string;
}

/**
 * PDF feature name → Package bit mapping
 * Keys are PDF feature names (with variations), values specify target bit and package
 */
export const FEATURE_MAP: Record<string, FeatureMapping> = {
	// SC-Mill - 25M Group
	Modeler: { bit: 'Modeler', package: 'SC-Mill' },
	Machinist: { bit: 'Machinist', package: 'SC-Mill' },
	'SolidCAM Mill 2D': { bit: 'SolidCAM Mill 2D', package: 'SC-Mill' },
	'Profile/Pocket 2.5D Rest Material': {
		bit: 'Profile/Pocket 2.5D Rest Material',
		package: 'SC-Mill'
	},
	'SolidCAM Mill 2.5D': { bit: 'SolidCAM Mill 2.5D', package: 'SC-Mill' },
	'Pocket Recognition': { bit: 'Pocket Recognition', package: 'SC-Mill' },
	'Chamfer recognition': { bit: 'Chamfer Recognition', package: 'SC-Mill' },
	'Chamfer Recognition': { bit: 'Chamfer Recognition', package: 'SC-Mill' },
	'Hole+Drill Recognition': { bit: 'Hole+Drill Recognition', package: 'SC-Mill' },
	'Hole + Drill Recognition': { bit: 'Hole+Drill Recognition', package: 'SC-Mill' },
	'SolidCAM Mill 3D': { bit: 'SC Mill 3D', package: 'SC-Mill' },
	'SolidCAM Mill3D': { bit: 'SC Mill 3D', package: 'SC-Mill' },
	'C-axes (Wrap)': { bit: 'C-axes (Wrap)', package: 'SC-Mill' },
	'4-axes Indexial': { bit: '4-axes Indexial', package: 'SC-Mill' },
	'5-axes indexial': { bit: '5-axes Indexial', package: 'SC-Mill' },
	'5-axes Indexial': { bit: '5-axes Indexial', package: 'SC-Mill' },
	'4/5 axes indexial': { bit: '5-axes Indexial', package: 'SC-Mill' },
	'Multi-depth Drill': { bit: 'Multi-Depth Drill', package: 'SC-Mill' },
	'Multi-Depth Drill': { bit: 'Multi-Depth Drill', package: 'SC-Mill' },

	// SC-Mill - Loose
	HSS: { bit: 'HSS', package: 'SC-Mill' },

	// SC-Turn
	'SolidCAM Turning': { bit: 'SolidCAM Turning', package: 'SC-Turn' },
	BackSpindle: { bit: 'Backspindle', package: 'SC-Turn' },
	'Back Spindle': { bit: 'Backspindle', package: 'SC-Turn' },
	Backspindle: { bit: 'Backspindle', package: 'SC-Turn' },

	// SC-Mill-Adv
	iMachining: { bit: 'iMach2D', package: 'SC-Mill-Adv' },
	'Machine Simulation': { bit: 'Machine Simulation', package: 'SC-Mill-Adv' },
	'5x Edge Breaking': { bit: 'Edge Breaking', package: 'SC-Mill-Adv' },
	'Edge Breaking': { bit: 'Edge Breaking', package: 'SC-Mill-Adv' },

	// SC-Mill-3D
	HSM: { bit: 'HSM', package: 'SC-Mill-3D' },
	iMachining3D: { bit: 'iMach3D', package: 'SC-Mill-3D' },

	// SC-Mill-5Axis - SIM5X Group
	'Simultanous 5x': { bit: 'Sim5x', package: 'SC-Mill-5Axis' },
	'Simultaneous 5x': { bit: 'Sim5x', package: 'SC-Mill-5Axis' },
	'Sim 5x': { bit: 'Sim5x', package: 'SC-Mill-5Axis' },
	Sim5x: { bit: 'Sim5x', package: 'SC-Mill-5Axis' },
	'Swarf machining': { bit: 'Swarf machining', package: 'SC-Mill-5Axis' },
	'5x Drill': { bit: '5x Drill', package: 'SC-Mill-5Axis' },
	'Contour 5x': { bit: 'Contour 5x', package: 'SC-Mill-5Axis' },
	Convert5X: { bit: 'Convert5X', package: 'SC-Mill-5Axis' },
	Convert5x: { bit: 'Convert5X', package: 'SC-Mill-5Axis' },
	'Auto 3+2 Roughing': { bit: 'Auto 3+2 Roughing', package: 'SC-Mill-5Axis' },
	'Screw Machining (Rotary)': { bit: 'Screw Machining (Rotary)', package: 'SC-Mill-5Axis' },

	// SC-Mill-5Axis - Loose
	'Simultanous 4x': { bit: 'Sim4x', package: 'SC-Mill-5Axis' },
	'Simultaneous 4x': { bit: 'Sim4x', package: 'SC-Mill-5Axis' },
	Sim4x: { bit: 'Sim4x', package: 'SC-Mill-5Axis' },

	// Profile dataset variant - "Simultaneous 4-axes(C axes)" is C-axes (Wrap), not Sim4x
	'Simultaneous 4-axes(C axes)': { bit: 'C-axes (Wrap)', package: 'SC-Mill' },
	'Multi-Axis Roughing': { bit: 'Multiaxis Roughing', package: 'SC-Mill-5Axis' },
	'Multiaxis Roughing': { bit: 'Multiaxis Roughing', package: 'SC-Mill-5Axis' }
};

/**
 * PDF dongle bits → Maintenance SKU panel items
 * These are standalone SKUs that appear in the Maintenance SKUs panel
 */
export const SKU_MAP: Record<string, string> = {
	// Turning modules
	'Swiss-Type': 'Swiss-Maint',
	'Multi Turret Sync': 'MTS-Maint',
	'Sim. Turning': 'MTS-Maint', // Included in MTS

	// 5-Axis standalone modules
	'MultiBlade 5x': 'Multiblade-Maint',
	'Port 5x': 'Port-Maint',
	'5x Edge Trimming': 'EdgeTrim-Maint',

	// Add-ons
	'Probe - Full': 'Probe-Maint',
	Vericut: 'Vericut-Maint',
	Cimco: 'SolidShop-Editor-Maint',
	'Cimco Add-On': 'SolidShop-Editor-Maint',
	'Editor Mode': 'SolidShop-Sim-Maint',

	// Network license (checkbox field)
	'Net Dongle': 'Lic-Net-Maint',

	// Non-posting dongle (checkbox field)
	'Non Posting Option': 'NPD-Maint',
	'NO G-code': 'NPD-Maint'
};

/**
 * PDF features to ignore - no corresponding bit or SKU in CheatSheet
 * These are silently skipped during import
 */
export const IGNORED_FEATURES: Set<string> = new Set([
	// Milling/General
	'SolidCAM 2.7D(CONSTANT Z)',
	'Stl Support',
	'STL Support',
	'HSM Basic',
	'HSM Rough',
	'No drill recognition',
	'Reduced HolesR',

	// Turning
	'SolidCAM TurnMILL',
	'SolidCAM TurnMill Level',
	'SolidCAM Turn-Mill Options',
	'BS_XYZCB',

	// 5-Axis (processed via special logic)
	'Sim 5x Level',
	'Sim5xLevel',
	'No HSS',

	// Wire EDM
	'SolidCAM WireEDM 2 axes',
	'SolidCAM WireEDM 2/4 axes',

	// Integrations (not tracked)
	'WinTool',
	'TDM',
	'Zoller integration',
	'DNCTOOL For Windows',
	'DNCTOOL For Dos',

	// Other
	'GPX',
	'Probe - Home define',
	'Prismatic HSM',
	'SolidCAM Mill 3D(No Milling)',
	'Xpress plus',
	'G-Code Simulation',
	'Eureka',
	'Profile',
	'Mill 2D - Express',
	'Xpress (2D)',
	'HSS - Express',
	'Xpress (HSS)'
]);

export interface MappedFeature {
	pdfFeature: string;
	bit: string;
	package: string;
}

export interface MappedSku {
	pdfFeature: string;
	sku: string;
}

export interface MappingResult {
	mappedFeatures: MappedFeature[];
	mappedSkus: MappedSku[];
	unmappedFeatures: string[];
	ignoredFeatures: string[];
}

/**
 * Map a list of PDF features to CheatSheet bits and SKUs
 */
export function mapFeatures(pdfFeatures: string[]): MappingResult {
	const mappedFeatures: MappedFeature[] = [];
	const mappedSkus: MappedSku[] = [];
	const unmappedFeatures: string[] = [];
	const ignoredFeatures: string[] = [];

	for (const feature of pdfFeatures) {
		// Check if explicitly ignored
		if (IGNORED_FEATURES.has(feature)) {
			ignoredFeatures.push(feature);
			continue;
		}

		// Check package bit mapping
		const featureMapping = FEATURE_MAP[feature];
		if (featureMapping) {
			mappedFeatures.push({
				pdfFeature: feature,
				bit: featureMapping.bit,
				package: featureMapping.package
			});
			continue;
		}

		// Check SKU mapping
		const skuMapping = SKU_MAP[feature];
		if (skuMapping) {
			mappedSkus.push({
				pdfFeature: feature,
				sku: skuMapping
			});
			continue;
		}

		// Feature not mapped
		unmappedFeatures.push(feature);
	}

	return {
		mappedFeatures,
		mappedSkus,
		unmappedFeatures,
		ignoredFeatures
	};
}

/**
 * Group mapped features by package for batch selection
 */
export function groupByPackage(mappedFeatures: MappedFeature[]): Record<string, string[]> {
	const grouped: Record<string, string[]> = {};

	for (const { bit, package: pkg } of mappedFeatures) {
		if (!grouped[pkg]) {
			grouped[pkg] = [];
		}
		// Avoid duplicates
		if (!grouped[pkg].includes(bit)) {
			grouped[pkg].push(bit);
		}
	}

	return grouped;
}

/**
 * Get unique SKUs from mapped SKUs (deduped)
 */
export function getUniqueSkus(mappedSkus: MappedSku[]): string[] {
	return [...new Set(mappedSkus.map((s) => s.sku))];
}

/**
 * Calculate import statistics
 */
export function calculateImportStats(result: MappingResult): {
	totalFeatures: number;
	mappedCount: number;
	skuCount: number;
	unmappedCount: number;
	ignoredCount: number;
} {
	return {
		totalFeatures: result.mappedFeatures.length + result.mappedSkus.length + result.unmappedFeatures.length + result.ignoredFeatures.length,
		mappedCount: result.mappedFeatures.length,
		skuCount: result.mappedSkus.length,
		unmappedCount: result.unmappedFeatures.length,
		ignoredCount: result.ignoredFeatures.length
	};
}
