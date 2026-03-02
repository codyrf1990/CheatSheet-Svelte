import type { PackageState } from '$lib/types';

export function hasSCMill(packageStates: Record<string, PackageState>): boolean {
	const millState = packageStates['SC-Mill'];
	if (!millState) return false;
	return (millState.selectedBits?.length ?? 0) > 0;
}

export function hasIMach2D(packageStates: Record<string, PackageState>): boolean {
	const advState = packageStates['SC-Mill-Adv'];
	if (!advState) return false;
	return advState.selectedBits?.includes('iMach2D') ?? false;
}

export function getDisabledBits(
	packageStates: Record<string, PackageState>,
	buildMode: boolean
): Map<string, string> {
	const disabled = new Map<string, string>();
	if (!buildMode) return disabled;

	const scMill = hasSCMill(packageStates);
	const iMach2D = hasIMach2D(packageStates);

	// SC-Mill-Adv bits require SC-Mill
	if (!scMill) {
		for (const bit of ['iMach2D', 'Machine Simulation', 'Edge Breaking']) {
			disabled.set(bit, 'Requires SC-Mill');
		}
	}

	// SC-Mill-3D: HSM requires SC-Mill
	if (!scMill) {
		disabled.set('HSM', 'Requires SC-Mill');
	}

	// iMach3D requires SC-Mill + iMach2D
	if (!scMill || !iMach2D) {
		disabled.set('iMach3D', !scMill ? 'Requires SC-Mill' : 'Requires iMach2D (SC-Mill-Adv)');
	}

	// SC-Mill-5Axis bits require SC-Mill
	if (!scMill) {
		for (const bit of ['Sim4x', 'Multiaxis Roughing']) {
			disabled.set(bit, 'Requires SC-Mill');
		}
		// Also the SIM5X group
		disabled.set('sc-mill-5axis-sim5x', 'Requires SC-Mill');
	}

	// Milling-specific additional modules
	if (!scMill) {
		for (const bit of ['SC-EdgeTrim', 'SC-Multiblade', 'SC-Port']) {
			disabled.set(bit, 'Requires SC-Mill');
		}
	}

	return disabled;
}
