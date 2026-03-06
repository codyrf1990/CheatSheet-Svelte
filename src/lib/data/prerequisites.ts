// Which packages require SC-Mill to be present
export const REQUIRES_SC_MILL = new Set(['SC-Mill-Adv', 'SC-Mill-3D', 'SC-Mill-5Axis']);

// Which specific bits require iMach2D (HSM does NOT — only SC-Mill needed)
export const REQUIRES_IMACH2D = new Set(['iMach3D']);

// SC-Turn bits that are always locked together — cannot be split
export const SC_TURN_LOCKED = ['SolidCAM Turning', 'Backspindle'];

// Milling-specific additional modules — require SC-Mill (they are milling operations)
export const REQUIRES_SC_MILL_MODULES = new Set(['SC-EdgeTrim', 'SC-Multiblade', 'SC-Port']);

// Standalone additional modules — no base package required
export const STANDALONE_MODULE_SKUS = new Set([
	'SC-Probe',
	'SC-Vericut',
	'iMachNX-Mod',
	'SC-Wire',
	'SolidShop-Editor',
	'SC-4Op',
	'SC-4Op-Sim',
	'SC-Swiss',
	'SC-MTS'
]);

// 25M group is all-or-nothing in build mode
export const SC_MILL_25M_MASTER_ID = 'sc-mill-25m';

// Package toggle definitions: what selecting each package toggle picks
export const PACKAGE_TOGGLE_BITS: Record<string, { groups?: string[]; looseBits?: string[] }> = {
	'SC-Mill': { groups: ['sc-mill-25m'], looseBits: ['HSS'] },
	'SC-Turn': { looseBits: ['SolidCAM Turning', 'Backspindle'] },
	'SC-Mill-Adv': { looseBits: ['iMach2D', 'Machine Simulation', 'Edge Breaking'] },
	'SC-Mill-3D': { looseBits: ['HSM', 'iMach3D'] },
	'SC-Mill-5Axis': { groups: ['sc-mill-5axis-sim5x'], looseBits: ['Sim4x', 'Multiaxis Roughing'] }
};
