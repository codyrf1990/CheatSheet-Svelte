import type { LicenseInfo } from '$lib/types';
import {
	mapFeatures,
	groupByPackage,
	getUniqueSkus,
	type MappingResult
} from '$lib/utils/featureMapper';

export const PACKAGE_BIT_SKUS = new Set([
	'25M-Maint',
	'EdgeBreak-Maint',
	'HSM-Maint',
	'HSS-Maint',
	'iMach2D-Maint',
	'iMach3D-Maint',
	'MachSim-Maint',
	'Multiaxis-Maint',
	'Sim4x-Maint',
	'Sim5x-Maint',
	'Turn-Maint'
]);

export interface LicenseSelections {
	mappingResult: MappingResult;
	bitsByPackage: Record<string, string[]>;
	skus: string[];
}

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
export function getPageNameForLicense(license: LicenseInfo): string {
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
 * Compute selected bits and SKUs for a license without mutating stores.
 */
export function getLicenseSelections(license: LicenseInfo): LicenseSelections {
	const mappingResult = mapFeatures(license.features);
	const bitsByPackage = groupByPackage(mappingResult.mappedFeatures);
	const uniqueSkus = getUniqueSkus(mappingResult.mappedSkus);

	// Profile dataset special handling
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
		// All Sim 5x levels get HSS bit, then:
		// | Sim 5x | Level       | Additional                      |
		// |--------|-------------|-------------------------------- |
		// | 0      | Any         | None                            |
		// | 1      | "3 Axis"    | (HSS only)                      |
		// | 1      | "3/4 Axis"  | Sim4x bit                       |
		// | 1      | Blank/Unknown | All 5-axis bits + Sim4x bit    |
		const hasSim5x = license.features.some((feature) => {
			// Normalize whitespace and compare case-insensitively
			const normalized = feature.replace(/\s+/g, ' ').trim().toLowerCase();
			return (
				normalized === 'sim 5x' ||
				normalized === 'sim5x' ||
				normalized === 'simultaneous 5x' ||
				normalized === 'simultanous 5x'
			);
		});
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
			// All Sim 5x levels require HSS bit
			if (!bitsByPackage['SC-Mill'].includes('HSS')) {
				bitsByPackage['SC-Mill'].push('HSS');
			}

			// Normalize level value for comparison
			const levelLower = sim5xLevel.toLowerCase();
			const is3Axis = levelLower === '3 axis' || levelLower === '1' || levelLower === '3axis';
			const is34Axis = levelLower === '3/4 axis' || levelLower === '3/4axis';
			const isBlank = sim5xLevel === '';
			const isUnknown = !is3Axis && !is34Axis && !isBlank;
			const isBlankOrUnknown = isBlank || isUnknown;

			if (is3Axis) {
				// Sim 5x = 1, Level "3 Axis" or "1": HSS only (no 5-axis bits)
				removeSim5xBits(true);
			} else if (is34Axis) {
				// Sim 5x = 1, Level "3/4 Axis": HSS + Sim4x
				removeSim5xBits();
				// Also add Sim4x bit
				if (!bitsByPackage['SC-Mill-5Axis']) {
					bitsByPackage['SC-Mill-5Axis'] = [];
				}
				if (!bitsByPackage['SC-Mill-5Axis'].includes('Sim4x')) {
					bitsByPackage['SC-Mill-5Axis'].push('Sim4x');
				}
			} else if (isBlankOrUnknown) {
				// Sim 5x = 1, Level blank/unknown: All 5-axis bits + HSS + Sim4x
				if (!bitsByPackage['SC-Mill-5Axis']) {
					bitsByPackage['SC-Mill-5Axis'] = [];
				}
				for (const bit of sim5xBits) {
					if (!bitsByPackage['SC-Mill-5Axis'].includes(bit)) {
						bitsByPackage['SC-Mill-5Axis'].push(bit);
					}
				}
				if (!bitsByPackage['SC-Mill-5Axis'].includes('Sim4x')) {
					bitsByPackage['SC-Mill-5Axis'].push('Sim4x');
				}
			}
		}
	}

	return {
		mappingResult,
		bitsByPackage,
		skus: uniqueSkus
	};
}
