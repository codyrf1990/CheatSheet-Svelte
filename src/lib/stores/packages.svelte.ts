/**
 * Packages Store (Svelte 5 Runes)
 * Manages package bit selection state for the current page.
 * Note: Bit ordering is stored globally in userPrefsStore.
 */

import type { PackageState, PageState } from '$types';
import { userPrefsStore } from './userPrefs.svelte';

// Reactive state
let packageStates = $state<Record<string, PackageState>>({});

/**
 * Create default package state
 */
function createDefaultState(): PackageState {
	return {
		selectedBits: [],
		customBits: [],
		order: [],
		looseBitsOrder: []
	};
}

/**
 * Get state for a specific package (creates default if missing)
 * WARNING: Do NOT use inside $derived - use getStateReadOnly instead
 */
function getState(packageCode: string): PackageState {
	if (!packageStates[packageCode]) {
		packageStates[packageCode] = createDefaultState();
	}
	return packageStates[packageCode];
}

/**
 * Get state for a specific package (read-only, safe for $derived)
 * Returns existing state or default values without mutating store
 */
function getStateReadOnly(packageCode: string): PackageState {
	return packageStates[packageCode] ?? createDefaultState();
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
 * Saves to global userPrefsStore for persistence across all companies
 */
function setOrder(packageCode: string, order: string[]): void {
	userPrefsStore.setPackageBitOrder(packageCode, order);
}

/**
 * Set order for loose bits (for drag-drop reordering)
 * Saves to global userPrefsStore for persistence across all companies
 */
function setLooseBitsOrder(packageCode: string, order: string[]): void {
	userPrefsStore.setPackageLooseBitOrder(packageCode, order);
}

/**
 * Move a bit to a different group (or 'loose' for loose bits)
 * Saves to global userPrefsStore for persistence across all companies
 * @param packageCode - The package code
 * @param bit - The bit to move
 * @param targetGroup - The target group masterId (or 'loose' for loose bits)
 */
function moveBitToGroup(packageCode: string, bit: string, targetGroup: string): void {
	const membership = { ...userPrefsStore.getPackageGroupMembership(packageCode) };
	membership[bit] = targetGroup;
	userPrefsStore.setPackageGroupMembership(packageCode, membership);
}

/**
 * Get the group a bit belongs to (with overrides applied)
 * Reads from global userPrefsStore
 * @param packageCode - The package code
 * @param bit - The bit name
 * @param defaultGroup - The default group from static data
 */
function getBitGroup(packageCode: string, bit: string, defaultGroup: string): string {
	const membership = userPrefsStore.getPackageGroupMembership(packageCode);
	return membership[bit] ?? defaultGroup;
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
 * Note: Order/groupMembership are stored globally in userPrefsStore, not per-page
 */
function getPageState(): Record<string, PackageState> {
	const result: Record<string, PackageState> = {};
	for (const [code, state] of Object.entries(packageStates)) {
		// Only save selection state per-page; order is global
		result[code] = {
			selectedBits: [...state.selectedBits],
			customBits: [...state.customBits],
			order: [], // Deprecated - now in userPrefsStore
			looseBitsOrder: [] // Deprecated - now in userPrefsStore
		};
	}
	return result;
}

/**
 * Reset all package states
 */
function reset(): void {
	packageStates = {};
}

/**
 * Reset all order arrays and group membership to default
 * Clears global ordering in userPrefsStore
 */
function resetAllOrders(): void {
	userPrefsStore.resetAllPackageOrders();
}

/**
 * Get the global bit order for a package
 * Reads from userPrefsStore (global across all companies)
 */
function getOrder(packageCode: string): string[] {
	return userPrefsStore.getPackageBitOrder(packageCode);
}

/**
 * Get the global loose bits order for a package
 * Reads from userPrefsStore (global across all companies)
 */
function getLooseBitsOrder(packageCode: string): string[] {
	return userPrefsStore.getPackageLooseBitOrder(packageCode);
}

/**
 * Get the global group membership for a package
 * Reads from userPrefsStore (global across all companies)
 */
function getGroupMembership(packageCode: string): Record<string, string> {
	return userPrefsStore.getPackageGroupMembership(packageCode);
}

export const packagesStore = {
	// Getters
	get all() {
		return packageStates;
	},

	// State access
	getState,
	getStateReadOnly,
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

	// Ordering (global - stored in userPrefsStore)
	getOrder,
	setOrder,
	getLooseBitsOrder,
	setLooseBitsOrder,

	// Group membership (global - stored in userPrefsStore)
	getGroupMembership,
	moveBitToGroup,
	getBitGroup,

	// State sync
	loadFromPageState,
	getPageState,
	reset,
	resetAllOrders
};
