import { describe, it, expect } from 'vitest';
import { parseSalesforceText, validateSalesforceText } from '$lib/utils/salesforceParser';

/**
 * Fixture builder — emits tab-separated "Field\tvalue" lines like a real
 * Salesforce dongle page copied with Ctrl+A / Ctrl+C.
 */
function donglePage(opts: {
	dongleNo: string;
	netDongle?: boolean;
	customer?: string;
	extraLines?: string[];
}): string {
	return [
		'SolidCAM Dongle Page',
		`Dongle No.\t${opts.dongleNo}`,
		'Serial No.\t900123',
		`Customer\t${opts.customer ?? 'Acme Machining'}`,
		'Dongle Type\tMINI-USB',
		`Net Dongle\t${opts.netDongle ? 'Checked' : 'Not Checked'}`,
		'Maintenance Type\tSC',
		'Maintenance Start Date\t1/1/2025',
		'Maintenance End Date\t12/31/2025',
		'SolidCAM Version\t2024',
		'SolidCAM Mill 2D\tChecked',
		'Pocket Recognition\tChecked',
		'SolidCAM Turning\tNot Checked',
		...(opts.extraLines ?? [])
	].join('\n');
}

function profilePage(opts: {
	profileNo: string;
	sim5xChecked?: boolean;
	sim5xLevel?: string;
	noHss?: boolean;
	extraLines?: string[];
}): string {
	return [
		'SolidCAM Profile Page',
		`Profile Name\tProfile-${opts.profileNo}`,
		'Profile No.\t1',
		'Profile Users\t3',
		'Customer\tAcme Machining',
		'Net Dongle\tChecked',
		`No HSS\t${opts.noHss ? 'Checked' : 'Not Checked'}`,
		...(opts.sim5xLevel !== undefined ? [`Sim 5x Level\t${opts.sim5xLevel}`] : []),
		'SolidCAM Mill 2D\tChecked',
		`Sim 5x\t${opts.sim5xChecked ? 'Checked' : 'Not Checked'}`,
		...(opts.extraLines ?? [])
	].join('\n');
}

describe('license type classification', () => {
	it('5-digit dongle without network = Hardware Dongle', () => {
		const { license } = parseSalesforceText(donglePage({ dongleNo: '77518' }));
		expect(license?.displayType).toBe('Hardware Dongle');
		expect(license?.dongleNo).toBe('77518');
		expect(license?.isNetworkLicense).toBe(false);
	});

	it('5-digit dongle with network = Network Dongle', () => {
		const { license } = parseSalesforceText(donglePage({ dongleNo: '77518', netDongle: true }));
		expect(license?.displayType).toBe('Network Dongle');
		expect(license?.isNetworkLicense).toBe(true);
	});

	it('long key with network = Network Product Key', () => {
		const { license } = parseSalesforceText(
			donglePage({ dongleNo: '711394118544787452', netDongle: true })
		);
		expect(license?.displayType).toBe('Network Product Key');
		expect(license?.productKey).toBe('711394118544787452');
		expect(license?.dongleNo).toBe(''); // long keys are not stored as dongle numbers
	});

	it('long key without network = Standalone Product Key', () => {
		const { license } = parseSalesforceText(donglePage({ dongleNo: '711394118544787452' }));
		expect(license?.displayType).toBe('Standalone Product Key');
	});

	it('Profile Name marks the license as a profile and extracts the identifier', () => {
		const { license } = parseSalesforceText(profilePage({ profileNo: '5801' }));
		expect(license?.isProfile).toBe(true);
		expect(license?.profileNo).toBe('5801');
		expect(license?.profileUsers).toBe(3);
	});
});

describe('feature extraction', () => {
	it('collects Checked features and Not Checked features separately', () => {
		const { license } = parseSalesforceText(donglePage({ dongleNo: '77518' }));
		expect(license?.features).toContain('SolidCAM Mill 2D');
		expect(license?.features).toContain('Pocket Recognition');
		expect(license?.features).not.toContain('SolidCAM Turning');
		expect(license?.notCheckedFeatures).toContain('SolidCAM Turning');
	});

	it('a feature listed as both Checked and Not Checked is left unselected with a warning', () => {
		const text = donglePage({
			dongleNo: '77518',
			extraLines: ['SolidCAM Turning\tChecked'] // conflicts with the Not Checked line
		});
		const { license, parseWarnings } = parseSalesforceText(text);
		expect(license?.features).not.toContain('SolidCAM Turning');
		expect(parseWarnings?.some((w) => w.includes('SolidCAM Turning'))).toBe(true);
	});

	it('clean pages produce no warnings', () => {
		const { parseWarnings } = parseSalesforceText(donglePage({ dongleNo: '77518' }));
		expect(parseWarnings).toBeUndefined();
	});
});

describe('Sim 5x Level handling', () => {
	it('accepts hyphenated Salesforce variants like "3/4-Axis"', () => {
		const { license } = parseSalesforceText(
			profilePage({ profileNo: '5801', sim5xChecked: true, sim5xLevel: '3/4-Axis' })
		);
		expect(license?.sim5xLevel).toBe('3/4-Axis');
	});

	it('rejects an unrecognized level, treats it as blank, and warns', () => {
		const { license, parseWarnings } = parseSalesforceText(
			profilePage({ profileNo: '5801', sim5xChecked: true, sim5xLevel: '3 Axes' })
		);
		expect(license?.sim5xLevel).toBeUndefined();
		expect(parseWarnings?.some((w) => w.includes('3 Axes'))).toBe(true);
	});

	it('blank level parses without a warning', () => {
		const { parseWarnings } = parseSalesforceText(
			profilePage({ profileNo: '5801', sim5xChecked: true })
		);
		expect(parseWarnings).toBeUndefined();
	});
});

describe('profile flags', () => {
	it('No HSS checkbox is captured on profiles', () => {
		const { license } = parseSalesforceText(profilePage({ profileNo: '5801', noHss: true }));
		expect(license?.noHss).toBe(true);
	});

	it('No HSS unchecked leaves the flag unset', () => {
		const { license } = parseSalesforceText(profilePage({ profileNo: '5801' }));
		expect(license?.noHss).toBeUndefined();
	});
});

describe('validation', () => {
	it('rejects empty text', () => {
		expect(validateSalesforceText('').valid).toBe(false);
	});

	it('rejects text that is not a Salesforce page', () => {
		const result = validateSalesforceText('Hello world, nothing to see here.');
		expect(result.valid).toBe(false);
	});

	it('rejects a profile copied with the Information section collapsed', () => {
		const text = 'Profile-5801\nShow Section - InformationInformation\nSim 5x\tChecked';
		const result = validateSalesforceText(text);
		expect(result.valid).toBe(false);
		expect(result.error).toContain('collapsed');
	});
});
