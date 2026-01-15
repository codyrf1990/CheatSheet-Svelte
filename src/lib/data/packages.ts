import type { Package } from '$types';

/**
 * SolidCAM package definitions
 * Migrated from /home/cody/CheatSheet/assets/js/data.js
 */
export const packages: Package[] = [
	{
		code: 'SC-Mill',
		maintenance: 'SC-Mill-Maint',
		description: 'Core milling bundle for indexed rotary work.',
		groups: [
			{
				label: '25M',
				masterId: 'sc-mill-25m',
				bits: [
					'Modeler',
					'Machinist',
					'SolidCAM Mill 2D',
					'Profile/Pocket 2.5D Rest Material',
					'SolidCAM Mill 2.5D',
					'Pocket Recognition',
					'Chamfer Recognition',
					'Hole+Drill Recognition',
					'SC Mill 3D',
					'C-axes (Wrap)',
					'4-axes Indexial',
					'5-axes Indexial',
					'Multi-Depth Drill'
				]
			}
		],
		looseBits: ['HSS']
	},
	{
		code: 'SC-Turn',
		maintenance: 'SC-Turn-Maint',
		description: 'Turning foundation with back spindle support.',
		looseBits: ['SolidCAM Turning', 'Backspindle']
	},
	{
		code: 'SC-Mill-Adv',
		maintenance: 'SC-Mill-Adv-Maint',
		description: 'Advanced milling add-on (iMachining 2D, Edge Breaking, Machine Simulation).',
		looseBits: ['iMach2D', 'Machine Simulation', 'Edge Breaking']
	},
	{
		code: 'SC-Mill-3D',
		maintenance: 'SC-Mill-3D-Maint',
		description: '3D iMachining and HSM (requires iMach2D).',
		looseBits: ['HSM', 'iMach3D']
	},
	{
		code: 'SC-Mill-5Axis',
		maintenance: 'SC-Mill-5Axis-Maint',
		description: 'Full simultaneous 4/5 axis toolkit.',
		groups: [
			{
				label: 'SIM5X',
				masterId: 'sc-mill-5axis-sim5x',
				bits: [
					'Sim5x',
					'Swarf machining',
					'5x Drill',
					'Contour 5x',
					'Convert5X',
					'Auto 3+2 Roughing',
					'Screw Machining (Rotary)'
				]
			}
		],
		looseBits: ['Sim4x', 'Multiaxis Roughing']
	}
];
