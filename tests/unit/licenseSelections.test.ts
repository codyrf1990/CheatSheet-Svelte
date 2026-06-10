import { describe, it, expect } from 'vitest';
import { getLicenseSelections, getPageNameForLicense } from '$lib/utils/licenseSelections';
import type { LicenseInfo } from '$lib/types';

/** Minimal LicenseInfo with overrides — only the fields the selection logic reads. */
function license(overrides: Partial<LicenseInfo>): LicenseInfo {
	return {
		customer: 'Acme Machining',
		dongleNo: '',
		serialNo: '900123',
		licenseType: 'dongle',
		dongleType: 'MINI-USB',
		displayType: 'Hardware Dongle',
		isNetworkLicense: false,
		isProfile: false,
		maintenanceType: 'SC',
		maintenanceStart: '1/1/2025',
		maintenanceEnd: '12/31/2025',
		solidcamVersion: '2024',
		features: [],
		importedAt: 0,
		sourceFileName: 'test',
		...overrides
	};
}

describe('getPageNameForLicense', () => {
	it('names each license scenario per the convention', () => {
		expect(getPageNameForLicense(license({ dongleNo: '77518' }))).toBe('HWD 77518');
		expect(getPageNameForLicense(license({ dongleNo: '77518', isNetworkLicense: true }))).toBe(
			'NWD 77518'
		);
		expect(
			getPageNameForLicense(
				license({ productKey: '711394118544787452', isNetworkLicense: true })
			)
		).toBe('NPK 7452');
		expect(getPageNameForLicense(license({ productKey: '711394118544787452' }))).toBe('SPK 7452');
		expect(getPageNameForLicense(license({ isProfile: true, profileNo: '5801' }))).toBe('P5801');
	});

	it('appends No-Gcode and Editor suffixes from features', () => {
		expect(
			getPageNameForLicense(license({ dongleNo: '67854', features: ['NO G-code'] }))
		).toBe('HWD 67854 No-Gcode');
		expect(
			getPageNameForLicense(
				license({ productKey: '12345678795B', features: ['Editor Mode'] })
			)
		).toBe('SPK 795B Editor');
	});
});

describe('profile auto-selections', () => {
	it('always adds Modeler and Machinist to SC-Mill on profiles', () => {
		const sel = getLicenseSelections(license({ isProfile: true, profileNo: '5801' }));
		expect(sel.bitsByPackage['SC-Mill']).toContain('Modeler');
		expect(sel.bitsByPackage['SC-Mill']).toContain('Machinist');
	});

	it('does not add Modeler/Machinist on non-profile licenses', () => {
		const sel = getLicenseSelections(license({ dongleNo: '77518' }));
		expect(sel.bitsByPackage['SC-Mill'] ?? []).not.toContain('Modeler');
	});

	it('maps "Simultaneous 4-axes(C axes)" to the C-axes (Wrap) bit in SC-Mill', () => {
		const sel = getLicenseSelections(
			license({ isProfile: true, profileNo: '5801', features: ['Simultaneous 4-axes(C axes)'] })
		);
		expect(sel.bitsByPackage['SC-Mill']).toContain('C-axes (Wrap)');
	});
});

describe('profile Sim 5x level logic', () => {
	const sim5xProfile = (extra: Partial<LicenseInfo>) =>
		license({ isProfile: true, profileNo: '5801', features: ['Sim 5x'], ...extra });

	it('level "3 Axis": HSS only — no 5-axis bits, both sim maint SKUs removed', () => {
		const sel = getLicenseSelections(sim5xProfile({ sim5xLevel: '3 Axis' }));
		expect(sel.bitsByPackage['SC-Mill']).toContain('HSS');
		expect(sel.bitsByPackage['SC-Mill-5Axis'] ?? []).toEqual([]);
		expect(sel.removedSkus).toContain('Sim5x-Maint');
		expect(sel.removedSkus).toContain('Sim4x-Maint');
	});

	it('level "3/4 Axis": HSS + Sim4x bit, Sim5x-Maint removed', () => {
		const sel = getLicenseSelections(sim5xProfile({ sim5xLevel: '3/4 Axis' }));
		expect(sel.bitsByPackage['SC-Mill']).toContain('HSS');
		expect(sel.bitsByPackage['SC-Mill-5Axis']).toContain('Sim4x');
		expect(sel.bitsByPackage['SC-Mill-5Axis']).not.toContain('Sim5x');
		expect(sel.removedSkus).toContain('Sim5x-Maint');
	});

	it('hyphenated "3/4-Axis" behaves like "3/4 Axis" (Salesforce quirk)', () => {
		const sel = getLicenseSelections(sim5xProfile({ sim5xLevel: '3/4-Axis' }));
		expect(sel.bitsByPackage['SC-Mill-5Axis']).toContain('Sim4x');
		expect(sel.bitsByPackage['SC-Mill-5Axis']).not.toContain('Sim5x');
	});

	it('blank level: all 5-axis bits + HSS, no sim maint SKUs removed', () => {
		const sel = getLicenseSelections(sim5xProfile({}));
		expect(sel.bitsByPackage['SC-Mill']).toContain('HSS');
		for (const bit of ['Sim5x', 'Swarf machining', '5x Drill', 'Contour 5x', 'Sim4x']) {
			expect(sel.bitsByPackage['SC-Mill-5Axis']).toContain(bit);
		}
		expect(sel.removedSkus).not.toContain('Sim5x-Maint');
	});

	it('No HSS flag removes HSS and blocks the Sim 5x logic from re-adding it', () => {
		const sel = getLicenseSelections(sim5xProfile({ noHss: true }));
		expect(sel.bitsByPackage['SC-Mill']).not.toContain('HSS');
		expect(sel.removedBitsByPackage['SC-Mill']).toContain('HSS');
	});

	it('Sim 5x unchecked: no 5-axis additions at all', () => {
		const sel = getLicenseSelections(license({ isProfile: true, profileNo: '5801' }));
		expect(sel.bitsByPackage['SC-Mill-5Axis']).toBeUndefined();
	});
});

describe('Not Checked feature removal', () => {
	it('explicitly Not Checked features land in removedBitsByPackage and removedSkus', () => {
		const sel = getLicenseSelections(
			license({
				dongleNo: '77518',
				features: ['SolidCAM Mill 2D'],
				notCheckedFeatures: ['SolidCAM Turning', 'Sim. Turning']
			})
		);
		expect(sel.removedBitsByPackage['SC-Turn']).toContain('SolidCAM Turning');
		expect(sel.removedSkus).toContain('SimTurn-Maint');
	});

	it('a checked feature is never removed even if a sibling name maps to the same bit', () => {
		const sel = getLicenseSelections(
			license({
				dongleNo: '77518',
				features: ['Chamfer Recognition'],
				notCheckedFeatures: ['Chamfer recognition'] // alternate spelling, same bit
			})
		);
		expect(sel.bitsByPackage['SC-Mill']).toContain('Chamfer Recognition');
		expect(sel.removedBitsByPackage['SC-Mill'] ?? []).not.toContain('Chamfer Recognition');
	});
});
