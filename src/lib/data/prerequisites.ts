// SC-Turn bits that are always locked together — cannot be split
export const SC_TURN_LOCKED = ['SolidCAM Turning', 'Backspindle'];

// Milling-specific additional modules — require SC-Mill (they are milling operations)
export const REQUIRES_SC_MILL_MODULES = new Set(['SC-EdgeTrim', 'SC-Multiblade', 'SC-Port']);

// Package toggle definitions: what selecting each package toggle picks
export const PACKAGE_TOGGLE_BITS: Record<string, { groups?: string[]; looseBits?: string[] }> = {
	'SC-Mill': { groups: ['sc-mill-25m'], looseBits: ['HSS'] },
	'SC-Turn': { looseBits: ['SolidCAM Turning', 'Backspindle'] },
	'SC-Mill-Adv': { looseBits: ['iMach2D', 'Machine Simulation', 'Edge Breaking'] },
	'SC-Mill-3D': { looseBits: ['HSM', 'iMach3D'] },
	'SC-Mill-5Axis': { groups: ['sc-mill-5axis-sim5x'], looseBits: ['Sim4x', 'Multiaxis Roughing'] }
};
