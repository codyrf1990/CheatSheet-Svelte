export interface BDMItem {
	sku: string;
	label: string;
	price: number | null; // null = no fixed price
	priceNote?: string; // e.g. "$200/hr (2hr min)"
	maint?: number;
	notes?: string;
}

export interface BDMSection {
	id: string;
	title: string;
	items: BDMItem[];
	note?: string;
}

export const BDM_SECTIONS: BDMSection[] = [
	{
		id: 'license',
		title: 'License Options',
		items: [
			{ sku: 'Lic-PK', label: 'Standalone Product Key', price: 0, notes: 'Default' },
			{ sku: 'Lic-HD', label: 'Hardware Dongle', price: 150, notes: 'Physical' },
			{ sku: 'Lic-Net', label: 'Network License (per seat)', price: 600 },
			{ sku: 'Lic-Chg', label: 'License Convert/Replace', price: 200 },
			{ sku: 'Lic-NX', label: 'iMachining NX Network', price: 600, notes: 'Per seat' },
			{ sku: 'Lic-EDU', label: 'Education License', price: 0, notes: '1-yr term' }
		]
	},
	{
		id: 'packages',
		title: 'SolidCAM Packages',
		items: [
			{
				sku: 'SC-Mill',
				label: 'SolidCAM Milling',
				price: 3868,
				maint: 648,
				notes: '2.5D+AFRM, HSS, Multi-Depth Drill, 4th/5th Index'
			},
			{
				sku: 'SC-Turn',
				label: 'SolidCAM Turning',
				price: 2300,
				maint: 300,
				notes: '2-Axis Turning, Back Spindle'
			},
			{
				sku: 'SC-Mill-Adv',
				label: 'Advanced Milling',
				price: 3412,
				maint: 828,
				notes: 'iMach2D, Edge Breaking, Machine Sim'
			},
			{
				sku: 'SC-Mill-3D',
				label: '3D High Performance',
				price: 6820,
				maint: 1020,
				notes: 'iMach3D, HSM (requires iMach2D)'
			},
			{
				sku: 'SC-Mill-5Axis',
				label: '5 Axis Milling',
				price: 5520,
				maint: 720,
				notes: 'Sim4x, Sim5x, Multiaxis, Auto 3+2, SWARF, Contour'
			},
			{
				sku: 'SC-Swiss',
				label: 'Swiss',
				price: 2760,
				maint: 360,
				notes: 'Swiss machining for Swiss CNC machines'
			}
		]
	},
	{
		id: 'milling',
		title: 'Milling Modules',
		items: [
			{ sku: 'SC-25M', label: '2.5D Milling + AFRM', price: 3588, maint: 468 },
			{ sku: 'SC-HSS', label: 'High-Speed Surfacing (HSS)', price: 1380, maint: 180 },
			{ sku: 'SC-HSM', label: 'High-Speed Machining (HSM incl HSR)', price: 5060, maint: 660 },
			{ sku: 'SC-iMach2D', label: 'iMachining 2D', price: 3588, maint: 468 },
			{ sku: 'SC-iMach3D', label: 'iMachining 3D', price: 2760, maint: 360 },
			{ sku: 'SC-Sim4x', label: 'Simultaneous 4 Axis', price: 920, maint: 120 },
			{ sku: 'SC-Sim5x', label: 'Simultaneous 5 Axis', price: 3680, maint: 480 },
			{ sku: 'SC-Auto32', label: 'Auto 3+2 Roughing', price: 782, maint: 102 },
			{ sku: 'SC-EdgeBreak', label: 'Edge Breaking (Auto Deburr)', price: 1380, maint: 180 },
			{ sku: 'SC-EdgeTrim', label: 'Edge Trimming', price: 1380, maint: 180 },
			{ sku: 'SC-Multiaxis', label: 'Multiaxis Roughing', price: 920, maint: 120 },
			{ sku: 'SC-Port', label: 'Port Machining', price: 3588, maint: 468 },
			{ sku: 'SC-Multiblade', label: 'Multiblade', price: 8740, maint: 1140 },
			{ sku: 'SC-MachSim', label: 'Machine Simulation', price: 1380, maint: 180 }
		]
	},
	{
		id: 'turning',
		title: 'Turning Modules',
		items: [
			{
				sku: 'SC-Turn',
				label: '2-Axis Turning (incl Back Spindle)',
				price: 2300,
				maint: 300
			},
			{ sku: 'SC-MTS', label: 'Multi-Turret Sync', price: 3450, maint: 450 },
			{ sku: 'SC-Swiss', label: 'Swiss', price: 2760, maint: 360 }
		]
	},
	{
		id: 'addons',
		title: 'Add-On Modules',
		items: [
			{ sku: 'SC-Probe', label: 'Solid Probe (Home + Measure)', price: 3450, maint: 450 },
			{ sku: 'SC-Vericut', label: 'Vericut Integration', price: 1150, maint: 150 },
			{ sku: 'iMachNX-Mod', label: 'iMachining NX', price: 7268, maint: 948 }
		]
	},
	{
		id: 'wire',
		title: 'Wire EDM',
		items: [
			{ sku: 'SC-Wire', label: 'Wirecut 4 Axis', price: 3450, maint: 450 }
		]
	},
	{
		id: 'solidworks',
		title: 'SolidWorks Products',
		items: [
			{ sku: 'SW-P', label: 'SW Parts', price: 1398, maint: 432 },
			{ sku: 'SW-PA', label: 'SW Parts & Assemblies', price: 2797, maint: 863 },
			{ sku: 'SW-Std', label: 'SW Standard', price: 4195, maint: 1295 },
			{ sku: 'SW-Std-Net', label: 'SW Standard Networked', price: 6293, maint: 1875 },
			{ sku: 'SW-Pro', label: 'SW Professional', price: 5765, maint: 1495 },
			{ sku: 'SW-Pro-Net', label: 'SW Professional Networked', price: 7186, maint: 1943 },
			{ sku: 'SW-SNL', label: 'SW Network License Manager', price: 4000 }
		]
	},
	{
		id: 'bundles',
		title: 'SW + SolidCAM Bundles',
		items: [
			{
				sku: 'SW-SC-Mill',
				label: 'SolidCAM Milling + SW',
				price: null,
				notes: 'New seat bundle — edit SW ver in desc'
			},
			{
				sku: 'SW-SC-Turn',
				label: 'SolidCAM Turning + SW',
				price: null,
				notes: 'New seat bundle — edit SW ver in desc'
			}
		]
	},
	{
		id: 'training',
		title: 'Training & Services',
		note: '1 training credit per package (SC-Mill, SC-Mill-Adv, SC-Mill-3D, SC-Mill-5Axis, SC-MTS)',
		items: [
			{ sku: 'Train-2hr', label: '2-Hour Remote Training', price: 350, notes: 'Expires 12mo' },
			{ sku: 'Train-8hr', label: '8-Hour Remote Training', price: 1295, notes: 'Expires 12mo' },
			{
				sku: 'Train-Onsite',
				label: 'On-Site Training (per day)',
				price: 2500,
				notes: 'Travel extra'
			},
			{
				sku: 'Tech-Services',
				label: 'Custom Technical Services',
				price: null,
				priceNote: '$200/hr (2hr min)'
			}
		]
	},
	{
		id: 'solidshop',
		title: 'SolidShop Products',
		items: [
			{ sku: 'SolidShop-Editor', label: 'CIMCO Editor', price: 500, maint: 75 },
			{ sku: 'SolidShop-Sim', label: 'SolidShop G-code Simulator', price: null },
			{ sku: 'SC-4Op', label: 'SolidCAM for Operators', price: 2500, maint: 375 },
			{ sku: 'SC-4Op-Sim', label: 'SC for Operators (Sim Only)', price: 1000, maint: 150 }
		]
	}
];
