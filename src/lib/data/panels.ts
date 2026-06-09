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
			'CAMAssist',
			'CAMAssist-GovCloud',
			'EdgeBreak-Maint',
			'EdgeTrim-Maint',
			'HSM-Maint',
			'HSS-Maint',
			'iMach2D-Maint',
			'iMach3D-Maint',
			'iMachNX-Maint',
			'Lic-Net-Maint',
			'MachSim-Maint',
			'MTS-Maint',
			'Multiaxis-Maint',
			'Multiblade-Maint',
			'NPD-Maint',
			'Port-Maint',
			'Probe-Maint',
			'SC-4Op-Maint',
			'SC-4Op-Sim-Maint',
			'Sim4x-Maint',
			'Sim5x-Maint',
			'SimTurn-Maint',
			'SolidShop-Editor-Maint',
			'SolidShop-Sim-Maint',
			'Swiss-Maint',
			'Turn-Maint',
			'Vericut-Maint',
			'Wire-Maint'
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
