/**
 * Packages Store (Svelte 5 Runes)
 * Manages package bit selection state for the current page.
 */

import type { PackageState, PageState } from '$types';

// Reactive state
let packageStates = $state<Record<string, PackageState>>({});

/**
 * Create default package state
 */
function createDefaultState(): PackageState {
	return {
		selectedBits: [],
		customBits: [],
		order: []
	};
}

/**
 * Get state for a specific package (creates default if missing)
 */
function getState(packageCode: string): PackageState {
	if (!packageStates[packageCode]) {
		packageStates[packageCode] = createDefaultState();
	}
	return packageStates[packageCode];
}

/**
 * Check if a bit is selected
 */
function isBitSelected(packageCode: string, bit: string): boolean {
	const state = packageStates[packageCode];
	return state?.selectedBits.includes(bit) ?? false;
}

/**
 * Toggle a single bit on/off
 */
function toggleBit(packageCode: string, bit: string): void {
	const state = getState(packageCode);

	if (state.selectedBits.includes(bit)) {
		state.selectedBits = state.selectedBits.filter((b) => b !== bit);
	} else {
		state.selectedBits = [...state.selectedBits, bit];
	}

	// Trigger reactivity
	packageStates = { ...packageStates };
}

/**
 * Toggle a master bit - controls all sub-bits in its group
 * If all sub-bits selected, deselect all. Otherwise, select all.
 */
function toggleMasterBit(packageCode: string, masterId: string, subBits: string[]): void {
	const state = getState(packageCode);

	// Check how many sub-bits are currently selected
	const selectedCount = subBits.filter((bit) => state.selectedBits.includes(bit)).length;
	const allSelected = selectedCount === subBits.length;

	if (allSelected) {
		// Deselect all sub-bits
		state.selectedBits = state.selectedBits.filter((bit) => !subBits.includes(bit));
	} else {
		// Select all sub-bits (add ones not already selected)
		const newBits = subBits.filter((bit) => !state.selectedBits.includes(bit));
		state.selectedBits = [...state.selectedBits, ...newBits];
	}

	packageStates = { ...packageStates };
}

/**
 * Get master bit state (checked/indeterminate) for a group
 */
function getMasterBitState(
	packageCode: string,
	subBits: string[]
): { checked: boolean; indeterminate: boolean } {
	const state = packageStates[packageCode];
	if (!state || subBits.length === 0) {
		return { checked: false, indeterminate: false };
	}

	const selectedCount = subBits.filter((bit) => state.selectedBits.includes(bit)).length;

	if (selectedCount === 0) {
		return { checked: false, indeterminate: false };
	} else if (selectedCount === subBits.length) {
		return { checked: true, indeterminate: false };
	} else {
		return { checked: false, indeterminate: true };
	}
}

/**
 * Select all bits for a package
 */
function selectAll(packageCode: string, allBits: string[]): void {
	const state = getState(packageCode);
	state.selectedBits = [...allBits];
	packageStates = { ...packageStates };
}

/**
 * Clear all selections for a package
 */
function clearAll(packageCode: string): void {
	const state = getState(packageCode);
	state.selectedBits = [];
	packageStates = { ...packageStates };
}

/**
 * Add a custom bit
 */
function addCustomBit(packageCode: string, bit: string): void {
	const state = getState(packageCode);
	if (!state.customBits.includes(bit)) {
		state.customBits = [...state.customBits, bit];
		packageStates = { ...packageStates };
	}
}

/**
 * Remove a custom bit
 */
function removeCustomBit(packageCode: string, bit: string): void {
	const state = getState(packageCode);
	state.customBits = state.customBits.filter((b) => b !== bit);
	// Also remove from selected if present
	state.selectedBits = state.selectedBits.filter((b) => b !== bit);
	packageStates = { ...packageStates };
}

/**
 * Set order for bits (for drag-drop reordering)
 */
function setOrder(packageCode: string, order: string[]): void {
	const state = getState(packageCode);
	state.order = [...order];
	packageStates = { ...packageStates };
}

/**
 * Load state from page state (from companies store)
 */
function loadFromPageState(pageState: PageState): void {
	if (pageState?.packages) {
		// Deep copy to prevent mutations
		packageStates = JSON.parse(JSON.stringify(pageState.packages));
	} else {
		packageStates = {};
	}
}

/**
 * Get current state for saving to page state
 */
function getPageState(): Record<string, PackageState> {
	return JSON.parse(JSON.stringify(packageStates));
}

/**
 * Reset all package states
 */
function reset(): void {
	packageStates = {};
}

export const packagesStore = {
	// Getters
	get all() {
		return packageStates;
	},

	// State access
	getState,
	isBitSelected,
	getMasterBitState,

	// Selection operations
	toggleBit,
	toggleMasterBit,
	selectAll,
	clearAll,

	// Custom bits
	addCustomBit,
	removeCustomBit,

	// Ordering
	setOrder,

	// State sync
	loadFromPageState,
	getPageState,
	reset
};
