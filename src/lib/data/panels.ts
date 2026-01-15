import type { Panel } from '$types';

/**
 * Panel definitions for the sidebar
 * Migrated from /home/cody/CheatSheet/assets/js/data.js
 */
export const panels: Panel[] = [
	{
		id: 'maintenance-skus',
		title: 'Maintenance SKUs',
		editable: true,
		items: [
			'25M-Maint',
			'EdgeBreak-Maint',
			'EdgeTrim-Maint',
			'HSM-Maint',
			'HSS-Maint',
			'iMach2D-Maint',
			'iMach3D-Maint',
			'Lic-Net-Maint',
			'MachSim-Maint',
			'MTS-Maint',
			'Multiaxis-Maint',
			'Multiblade-Maint',
			'NPD-Maint',
			'Port-Maint',
			'Probe-Maint',
			'SC-Mill-3D-Maint',
			'SC-Mill-5Axis-Maint',
			'SC-Mill-Adv-Maint',
			'SC-Mill-Maint',
			'SC-Turn-Maint',
			'Sim4x-Maint',
			'Sim5x-Maint',
			'SolidShop-Editor-Maint',
			'SolidShop-Sim-Maint',
			'Swiss-Maint',
			'Turn-Maint',
			'Vericut-Maint'
		]
	},
	{
		id: 'solidworks-maintenance',
		title: 'SolidWorks Maintenance',
		editable: true,
		items: [
			'SW-Info-Maint',
			'SW-P-Maint',
			'SW-PA-Maint',
			'SW-Pro-Maint',
			'SW-Pro-Net-Maint',
			'SW-Recap',
			'SW-Std-Maint',
			'SW-Std-Net-Maint'
		]
	}
];
