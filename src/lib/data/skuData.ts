export interface SkuEntry {
	sku: string;
	label: string;
	price: number;
	maintSku: string;
	maintPrice: number;
}

// Keyed by packageCode::groupOrBit identifier
export const SKU_LOOKUP: Record<string, SkuEntry> = {
	'SC-Mill::PACKAGE': {
		sku: 'SC-Mill',
		label: 'SolidCAM Milling (package)',
		price: 3868,
		maintSku: 'SC-Mill-Maint',
		maintPrice: 648
	},
	'SC-Mill::sc-mill-25m': {
		sku: 'SC-25M',
		label: '2.5D Milling + AFRM',
		price: 3588,
		maintSku: '25M-Maint',
		maintPrice: 468
	},
	'SC-Mill::HSS': {
		sku: 'SC-HSS',
		label: 'High Speed Surfacing',
		price: 1380,
		maintSku: 'HSS-Maint',
		maintPrice: 180
	},
	'SC-Turn::PACKAGE': {
		sku: 'SC-Turn',
		label: 'SolidCAM Turning (package)',
		price: 2300,
		maintSku: 'SC-Turn-Maint',
		maintPrice: 300
	},
	'SC-Turn::SolidCAM Turning': {
		sku: 'SC-Turn',
		label: 'SC-Turn',
		price: 2300,
		maintSku: 'Turn-Maint',
		maintPrice: 300
	},
	'SC-Mill-Adv::PACKAGE': {
		sku: 'SC-Mill-Adv',
		label: 'SC-Mill-Adv (package)',
		price: 3412,
		maintSku: 'SC-Mill-Adv-Maint',
		maintPrice: 828
	},
	'SC-Mill-Adv::iMach2D': {
		sku: 'SC-iMach2D',
		label: 'iMachining 2D',
		price: 3588,
		maintSku: 'iMach2D-Maint',
		maintPrice: 468
	},
	'SC-Mill-Adv::Machine Simulation': {
		sku: 'SC-MachSim',
		label: 'Machine Simulation',
		price: 1380,
		maintSku: 'MachSim-Maint',
		maintPrice: 180
	},
	'SC-Mill-Adv::Edge Breaking': {
		sku: 'SC-EdgeBreak',
		label: 'Edge Breaking',
		price: 1380,
		maintSku: 'EdgeBreak-Maint',
		maintPrice: 180
	},
	'SC-Mill-3D::PACKAGE': {
		sku: 'SC-Mill-3D',
		label: 'SC-Mill-3D (package)',
		price: 6820,
		maintSku: 'SC-Mill-3D-Maint',
		maintPrice: 1020
	},
	'SC-Mill-3D::HSM': {
		sku: 'SC-HSM',
		label: 'High Speed Machining',
		price: 5060,
		maintSku: 'HSM-Maint',
		maintPrice: 660
	},
	'SC-Mill-3D::iMach3D': {
		sku: 'SC-iMach3D',
		label: 'iMachining 3D',
		price: 2760,
		maintSku: 'iMach3D-Maint',
		maintPrice: 360
	},
	'SC-Mill-5Axis::PACKAGE': {
		sku: 'SC-Mill-5Axis',
		label: 'SC-Mill-5Axis (package)',
		price: 5520,
		maintSku: 'SC-Mill-5Axis-Maint',
		maintPrice: 720
	},
	'SC-Mill-5Axis::Sim4x': {
		sku: 'SC-Sim4x',
		label: 'Simultaneous 4 Axis',
		price: 920,
		maintSku: 'Sim4x-Maint',
		maintPrice: 120
	},
	'SC-Mill-5Axis::sc-mill-5axis-sim5x': {
		sku: 'SC-Sim5x',
		label: 'Simultaneous 5 Axis',
		price: 3680,
		maintSku: 'Sim5x-Maint',
		maintPrice: 480
	},
	'SC-Mill-5Axis::Multiaxis Roughing': {
		sku: 'SC-Multiaxis',
		label: 'Multiaxis Roughing',
		price: 920,
		maintSku: 'Multiaxis-Maint',
		maintPrice: 120
	}
};

// Additional modules (no package prerequisite) — shown when selected in panels
export const MODULE_SKUS: SkuEntry[] = [
	{
		sku: 'SC-EdgeTrim',
		label: 'Edge Trimming',
		price: 1380,
		maintSku: 'EdgeTrim-Maint',
		maintPrice: 180
	},
	{
		sku: 'SC-Multiblade',
		label: 'Multiblade',
		price: 8740,
		maintSku: 'Multiblade-Maint',
		maintPrice: 1140
	},
	{
		sku: 'SC-Port',
		label: 'Port Machining',
		price: 3588,
		maintSku: 'Port-Maint',
		maintPrice: 468
	},
	{
		sku: 'SC-Probe',
		label: 'Solid Probe (Home+Measure)',
		price: 3450,
		maintSku: 'Probe-Maint',
		maintPrice: 450
	},
	{
		sku: 'SC-Vericut',
		label: 'Vericut Integration',
		price: 1150,
		maintSku: 'Vericut-Maint',
		maintPrice: 150
	},
	{
		sku: 'iMachNX-Mod',
		label: 'iMachining NX',
		price: 7268,
		maintSku: 'iMachNX-Maint',
		maintPrice: 948
	},
	{
		sku: 'SC-Wire',
		label: 'Wire EDM — 4 Axis',
		price: 3450,
		maintSku: 'Wire-Maint',
		maintPrice: 450
	},
	{
		sku: 'SolidShop-Editor',
		label: 'CIMCO Editor',
		price: 500,
		maintSku: 'SolidShop-Editor-Maint',
		maintPrice: 75
	},
	{
		sku: 'SC-4Op',
		label: 'SC for Operators',
		price: 2500,
		maintSku: 'SC-4Op-Maint',
		maintPrice: 375
	},
	{
		sku: 'SC-4Op-Sim',
		label: 'SC for Operators (Sim)',
		price: 1000,
		maintSku: 'SC-4Op-Sim-Maint',
		maintPrice: 150
	},
	{
		sku: 'SC-Swiss',
		label: 'Swiss Machining',
		price: 2760,
		maintSku: 'Swiss-Maint',
		maintPrice: 360
	},
	{
		sku: 'SC-MTS',
		label: 'Multi-Turret Sync',
		price: 3450,
		maintSku: 'MTS-Maint',
		maintPrice: 450
	}
];

// Reverse lookup: maintenance SKU → BDM sale SKU
// Used to display BDM codes in the maintenance panel when in BDM mode
export const MAINT_TO_BDM: Record<string, string> = {
	// Packages
	'SC-Mill-Maint': 'SC-Mill',
	'SC-Mill-Adv-Maint': 'SC-Mill-Adv',
	'SC-Mill-3D-Maint': 'SC-Mill-3D',
	'SC-Mill-5Axis-Maint': 'SC-Mill-5Axis',
	'SC-Turn-Maint': 'SC-Turn',
	'Turn-Maint': 'SC-Turn',
	// Milling bits
	'25M-Maint': 'SC-25M',
	'HSS-Maint': 'SC-HSS',
	'HSM-Maint': 'SC-HSM',
	'iMach2D-Maint': 'SC-iMach2D',
	'iMach3D-Maint': 'SC-iMach3D',
	'Sim4x-Maint': 'SC-Sim4x',
	'Sim5x-Maint': 'SC-Sim5x',
	'Multiaxis-Maint': 'SC-Multiaxis',
	'EdgeBreak-Maint': 'SC-EdgeBreak',
	'MachSim-Maint': 'SC-MachSim',
	// Modules
	'EdgeTrim-Maint': 'SC-EdgeTrim',
	'Multiblade-Maint': 'SC-Multiblade',
	'Port-Maint': 'SC-Port',
	'Probe-Maint': 'SC-Probe',
	'Vericut-Maint': 'SC-Vericut',
	'iMachNX-Maint': 'iMachNX-Mod',
	'Wire-Maint': 'SC-Wire',
	'SolidShop-Editor-Maint': 'SolidShop-Editor',
	'SolidShop-Sim-Maint': 'SolidShop-Sim',
	'SC-4Op-Maint': 'SC-4Op',
	'SC-4Op-Sim-Maint': 'SC-4Op-Sim',
	'Swiss-Maint': 'SC-Swiss',
	'MTS-Maint': 'SC-MTS',
	// Network license
	'Lic-Net-Maint': 'Lic-Net',
	// SolidWorks
	'SW-P-Maint': 'SW-P',
	'SW-PA-Maint': 'SW-PA',
	'SW-Std-Maint': 'SW-Std',
	'SW-Std-Net-Maint': 'SW-Std-Net',
	'SW-Pro-Maint': 'SW-Pro',
	'SW-Pro-Net-Maint': 'SW-Pro-Net'
};
