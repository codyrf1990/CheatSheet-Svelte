/**
 * Panels Store (Svelte 5 Runes)
 * Manages panel item state for the current page.
 */

import type { PanelState, PageState } from '$types';

// Reactive state
let panelStates = $state<Record<string, PanelState>>({});

/**
 * Create default panel state
 */
function createDefaultState(): PanelState {
	return {
		items: [],
		removedItems: []
	};
}

/**
 * Get state for a specific panel (creates default if missing, normalizes old data)
 */
function getState(panelId: string): PanelState {
	if (!panelStates[panelId]) {
		panelStates[panelId] = createDefaultState();
	}
	// Normalize old data that may be missing arrays
	const state = panelStates[panelId];
	if (!Array.isArray(state.items)) {
		state.items = [];
	}
	if (!Array.isArray(state.removedItems)) {
		state.removedItems = [];
	}
	return state;
}

/**
 * Get items for a panel
 */
function getItems(panelId: string): string[] {
	return panelStates[panelId]?.items ?? [];
}

/**
 * Check if a panel has an item
 */
function hasItem(panelId: string, item: string): boolean {
	return panelStates[panelId]?.items?.includes(item) ?? false;
}

/**
 * Add an item to a panel
 */
function addItem(panelId: string, item: string): void {
	const state = getState(panelId);

	if (!state.items.includes(item)) {
		state.items = [...state.items, item];

		// Remove from removedItems if it was there
		if (state.removedItems?.includes(item)) {
			state.removedItems = state.removedItems.filter((i) => i !== item);
		}

		panelStates = { ...panelStates };
	}
}

/**
 * Remove an item from a panel
 */
function removeItem(panelId: string, item: string): void {
	const state = getState(panelId);

	if (state.items.includes(item)) {
		state.items = state.items.filter((i) => i !== item);

		// Track in removedItems for editable panels
		if (!state.removedItems) {
			state.removedItems = [];
		}
		if (!state.removedItems.includes(item)) {
			state.removedItems = [...state.removedItems, item];
		}

		panelStates = { ...panelStates };
	}
}

/**
 * Toggle an item in a panel (add if missing, remove if present)
 */
function toggleItem(panelId: string, item: string): void {
	if (hasItem(panelId, item)) {
		removeItem(panelId, item);
	} else {
		addItem(panelId, item);
	}
}

/**
 * Reorder items in a panel (e.g., from drag-drop)
 */
function reorderItems(panelId: string, newOrder: string[]): void {
	const state = getState(panelId);
	state.items = [...newOrder];
	panelStates = { ...panelStates };
}

/**
 * Clear all items from a panel
 */
function clearItems(panelId: string): void {
	const state = getState(panelId);
	// Track all removed items
	if (!state.removedItems) {
		state.removedItems = [];
	}
	state.removedItems = [...new Set([...state.removedItems, ...state.items])];
	state.items = [];
	panelStates = { ...panelStates };
}

/**
 * Restore removed items to a panel
 */
function restoreItems(panelId: string): void {
	const state = getState(panelId);
	if (state.removedItems && state.removedItems.length > 0) {
		state.items = [...new Set([...state.items, ...state.removedItems])];
		state.removedItems = [];
		panelStates = { ...panelStates };
	}
}

/**
 * Load state from page state (from companies store)
 */
function loadFromPageState(pageState: PageState): void {
	if (pageState?.panels) {
		// Deep copy to prevent mutations
		panelStates = JSON.parse(JSON.stringify(pageState.panels));
	} else {
		panelStates = {};
	}
}

/**
 * Get current state for saving to page state
 */
function getPageState(): Record<string, PanelState> {
	return JSON.parse(JSON.stringify(panelStates));
}

/**
 * Reset all panel states
 */
function reset(): void {
	panelStates = {};
}

export const panelsStore = {
	// Getters
	get all() {
		return panelStates;
	},

	// State access
	getState,
	getItems,
	hasItem,

	// Item operations
	addItem,
	removeItem,
	toggleItem,
	reorderItems,
	clearItems,
	restoreItems,

	// State sync
	loadFromPageState,
	getPageState,
	reset
};
