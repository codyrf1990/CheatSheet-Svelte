export const BIT_DESCRIPTIONS: Record<string, string> = {
	// SC-Mill
	HSS: 'High-speed surfacing for complex 3D shapes — essential for mould & die work.',
	// SC-Mill-Adv
	iMach2D:
		'iMachining 2D — adaptive roughing that cuts cycle times dramatically. Requires SC-Mill.',
	'Machine Simulation':
		'Simulates the full machine to catch collisions before they happen. Requires SC-Mill.',
	'Edge Breaking':
		'Automated chamfering on part edges directly from the CAD model. Requires SC-Mill.',
	// SC-Mill-3D
	HSM: 'High Speed Machining — rest material, steep/shallow, and finishing strategies. Requires SC-Mill.',
	iMach3D: 'iMachining 3D — adaptive 3D roughing on top of HSM. Requires SC-Mill and iMach2D.',
	// SC-Mill-5Axis
	Sim4x: 'Simultaneous 4-axis — rotary and 4th-axis contouring. Requires SC-Mill.',
	'Multiaxis Roughing':
		'Multiaxis roughing — 5-axis stock removal with tilted tool to avoid collisions. Requires SC-Mill.',
	// SC-Turn
	'SC-Turn':
		'Turning module — profile turning, grooving, threading, backspindle. Includes Mill-Turn when combined with SC-Mill.',
	// Package-level (when whole package is absent)
	'SC-Mill-Adv':
		'Advanced milling add-on — iMachining 2D, Machine Simulation, Edge Breaking. Requires SC-Mill.',
	'SC-Mill-3D':
		'3D iMachining package — High Speed Machining + iMachining 3D. Requires SC-Mill and iMach2D.',
	'SC-Mill-5Axis':
		'5-axis simultaneous machining — swarf, contour, convert 5-axis, and more. Requires SC-Mill.',
	// Additional modules — milling-specific (require SC-Mill)
	'SC-EdgeTrim':
		'Automated edge trimming — removes witness lines and sharp edges post-machining. Requires SC-Mill.',
	'SC-Multiblade': 'Dedicated multi-blade machining for impellers and blisks. Requires SC-Mill.',
	'SC-Port':
		'Port machining for engine heads and similar complex internal surfaces. Requires SC-Mill.',
	// Additional modules — standalone (no prerequisite)
	'SC-Probe': 'On-machine probing for setup, datum setting, and in-process measurement.',
	'SC-Probe1': 'On-machine probing for tool and datum homing — measurement features not included.',
	'SC-Vericut': 'Sends the NC program to Vericut for full machine simulation and verification.',
	'iMachNX-Mod': 'iMachining technology available directly inside NX.',
	'WC2-Mod': '2-axis wire EDM — contouring, taper cutting, and profiles.',
	'SC-Wire': '4-axis wire EDM — adds upper/lower independent contour cutting.',
	'SolidShop-Editor': 'CIMCO Editor for NC code editing, backplotting, and DNC communication.',
	'SC-4Op': 'Operator-facing interface for running and managing SolidCAM jobs on the shop floor.',
	'SC-4Op-Sim':
		'Simulation-only operator interface — run and visualize jobs without full NC output access.'
};
