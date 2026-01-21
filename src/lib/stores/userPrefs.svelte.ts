/**
 * User Preferences Store (Svelte 5 Runes)
 * Global user preferences that persist across all companies/pages.
 * Used for custom SKUs added by the user.
 */

import { browser } from '$app/environment';

const STORAGE_KEY = 'solidcam-user-prefs';

interface UserPrefs {
	customPanelItems: Record<string, string[]>; // panelId -> custom items
	customPackageBits: Record<string, string[]>; // packageCode -> custom bits
	backgroundVideoPaused: boolean; // Whether background video is paused (per device)
	updatedAt: number; // Last syncable prefs update timestamp
	// Global bit ordering (applies to all companies/pages)
	packageBitOrders: Record<string, string[]>; // packageCode -> ordered bit names
	packageLooseBitOrders: Record<string, string[]>; // packageCode -> ordered loose bits
	packageGroupMembership: Record<string, Record<string, string>>; // packageCode -> (bit -> groupId)
}

// Default state
function createDefaultPrefs(): UserPrefs {
	return {
		customPanelItems: {},
		customPackageBits: {},
		backgroundVideoPaused: false, // Video plays by default
		updatedAt: Date.now(),
		packageBitOrders: {},
		packageLooseBitOrders: {},
		packageGroupMembership: {}
	};
}

// Load from localStorage
function loadPrefs(): UserPrefs {
	if (!browser) return createDefaultPrefs();

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			const updatedAt =
				typeof parsed.updatedAt === 'number' && Number.isFinite(parsed.updatedAt)
					? parsed.updatedAt
					: Date.now();
			return {
				customPanelItems: parsed.customPanelItems || {},
				customPackageBits: parsed.customPackageBits || {},
				backgroundVideoPaused: parsed.backgroundVideoPaused ?? false,
				updatedAt,
				packageBitOrders: parsed.packageBitOrders || {},
				packageLooseBitOrders: parsed.packageLooseBitOrders || {},
				packageGroupMembership: parsed.packageGroupMembership || {}
			};
		}
	} catch (e) {
		console.warn('Failed to load user preferences:', e);
	}

	return createDefaultPrefs();
}

// Reactive state
let prefs = $state<UserPrefs>(createDefaultPrefs());
let initialized = false;
let changeHandler: ((data: ReturnType<typeof exportData>) => void) | null = null;

/**
 * Initialize store (call from browser context)
 */
function init(): void {
	if (initialized || !browser) return;
	prefs = loadPrefs();
	initialized = true;
}

/**
 * Save to localStorage
 */
function save(): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
	} catch (e) {
		console.warn('Failed to save user preferences:', e);
	}
}

function emitChange(): void {
	if (!changeHandler) return;
	try {
		changeHandler(exportData());
	} catch (e) {
		console.error('[UserPrefsStore] Change handler failed:', e);
	}
}

function commitSyncable(): void {
	prefs.updatedAt = Date.now();
	prefs = { ...prefs };
	save();
	emitChange();
}

function commitLocalOnly(): void {
	prefs = { ...prefs };
	save();
}

/**
 * Get custom items for a panel
 */
function getCustomPanelItems(panelId: string): string[] {
	return prefs.customPanelItems[panelId] || [];
}

/**
 * Add a custom item to a panel
 */
function addCustomPanelItem(panelId: string, item: string): void {
	if (!prefs.customPanelItems[panelId]) {
		prefs.customPanelItems[panelId] = [];
	}

	if (!prefs.customPanelItems[panelId].includes(item)) {
		prefs.customPanelItems[panelId] = [...prefs.customPanelItems[panelId], item];
		commitSyncable();
	}
}

/**
 * Remove a custom item from a panel
 */
function removeCustomPanelItem(panelId: string, item: string): void {
	if (!prefs.customPanelItems[panelId]) return;

	prefs.customPanelItems[panelId] = prefs.customPanelItems[panelId].filter((i) => i !== item);
	commitSyncable();
}

/**
 * Get custom bits for a package
 */
function getCustomPackageBits(packageCode: string): string[] {
	return prefs.customPackageBits[packageCode] || [];
}

/**
 * Add a custom bit to a package
 */
function addCustomPackageBit(packageCode: string, bit: string): void {
	if (!prefs.customPackageBits[packageCode]) {
		prefs.customPackageBits[packageCode] = [];
	}

	if (!prefs.customPackageBits[packageCode].includes(bit)) {
		prefs.customPackageBits[packageCode] = [...prefs.customPackageBits[packageCode], bit];
		commitSyncable();
	}
}

/**
 * Remove a custom bit from a package
 */
function removeCustomPackageBit(packageCode: string, bit: string): void {
	if (!prefs.customPackageBits[packageCode]) return;

	prefs.customPackageBits[packageCode] = prefs.customPackageBits[packageCode].filter(
		(b) => b !== bit
	);
	commitSyncable();
}

/**
 * Check if an item is a custom item (not in default list)
 */
function isCustomPanelItem(panelId: string, item: string): boolean {
	return prefs.customPanelItems[panelId]?.includes(item) ?? false;
}

/**
 * Check if a bit is a custom bit (not in default list)
 */
function isCustomPackageBit(packageCode: string, bit: string): boolean {
	return prefs.customPackageBits[packageCode]?.includes(bit) ?? false;
}

/**
 * Check if background video is paused
 */
function isBackgroundVideoPaused(): boolean {
	return prefs.backgroundVideoPaused;
}

/**
 * Set background video paused state
 */
function setBackgroundVideoPaused(paused: boolean): void {
	prefs.backgroundVideoPaused = paused;
	commitLocalOnly();
}

/**
 * Toggle background video paused state
 */
function toggleBackgroundVideoPaused(): void {
	setBackgroundVideoPaused(!prefs.backgroundVideoPaused);
}

// ============ Global Package Bit Ordering ============

/**
 * Get ordered bits for a package (global order)
 */
function getPackageBitOrder(packageCode: string): string[] {
	return prefs.packageBitOrders[packageCode] || [];
}

/**
 * Set ordered bits for a package (global)
 */
function setPackageBitOrder(packageCode: string, order: string[]): void {
	prefs.packageBitOrders[packageCode] = [...order];
	commitSyncable();
}

/**
 * Get ordered loose bits for a package (global order)
 */
function getPackageLooseBitOrder(packageCode: string): string[] {
	return prefs.packageLooseBitOrders[packageCode] || [];
}

/**
 * Set ordered loose bits for a package (global)
 */
function setPackageLooseBitOrder(packageCode: string, order: string[]): void {
	prefs.packageLooseBitOrders[packageCode] = [...order];
	commitSyncable();
}

/**
 * Get group membership for a package (bit -> groupId mapping)
 */
function getPackageGroupMembership(packageCode: string): Record<string, string> {
	return prefs.packageGroupMembership[packageCode] || {};
}

/**
 * Set group membership for a package (global)
 */
function setPackageGroupMembership(packageCode: string, membership: Record<string, string>): void {
	prefs.packageGroupMembership[packageCode] = { ...membership };
	commitSyncable();
}

/**
 * Reset all ordering for a package to defaults
 */
function resetPackageOrder(packageCode: string): void {
	delete prefs.packageBitOrders[packageCode];
	delete prefs.packageLooseBitOrders[packageCode];
	delete prefs.packageGroupMembership[packageCode];
	commitSyncable();
}

/**
 * Reset all package ordering globally
 */
function resetAllPackageOrders(): void {
	prefs.packageBitOrders = {};
	prefs.packageLooseBitOrders = {};
	prefs.packageGroupMembership = {};
	commitSyncable();
}

function exportData() {
	return {
		userPrefs: {
			customPanelItems: prefs.customPanelItems,
			customPackageBits: prefs.customPackageBits,
			packageBitOrders: prefs.packageBitOrders,
			packageLooseBitOrders: prefs.packageLooseBitOrders,
			packageGroupMembership: prefs.packageGroupMembership
		},
		updatedAt: prefs.updatedAt
	};
}

function importData(data: unknown, updatedAt?: number): boolean {
	if (!data || typeof data !== 'object') {
		console.warn('[UserPrefsStore] Import skipped: invalid data');
		return false;
	}

	const payload = data as {
		customPanelItems?: Record<string, string[]>;
		customPackageBits?: Record<string, string[]>;
		packageBitOrders?: Record<string, string[]>;
		packageLooseBitOrders?: Record<string, string[]>;
		packageGroupMembership?: Record<string, Record<string, string>>;
	};

	prefs.customPanelItems = payload.customPanelItems || {};
	prefs.customPackageBits = payload.customPackageBits || {};
	prefs.packageBitOrders = payload.packageBitOrders || {};
	prefs.packageLooseBitOrders = payload.packageLooseBitOrders || {};
	prefs.packageGroupMembership = payload.packageGroupMembership || {};
	prefs.updatedAt =
		typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : Date.now();
	prefs = { ...prefs };
	save();
	return true;
}

function setChangeHandler(handler: ((data: ReturnType<typeof exportData>) => void) | null): void {
	changeHandler = handler;
}

export const userPrefsStore = {
	// Getters
	get all() {
		return prefs;
	},
	get updatedAt() {
		return prefs.updatedAt;
	},

	// Initialization
	init,

	// Panel items
	getCustomPanelItems,
	addCustomPanelItem,
	removeCustomPanelItem,
	isCustomPanelItem,

	// Package bits
	getCustomPackageBits,
	addCustomPackageBit,
	removeCustomPackageBit,
	isCustomPackageBit,

	// Background video
	isBackgroundVideoPaused,
	setBackgroundVideoPaused,
	toggleBackgroundVideoPaused,

	// Global package ordering
	getPackageBitOrder,
	setPackageBitOrder,
	getPackageLooseBitOrder,
	setPackageLooseBitOrder,
	getPackageGroupMembership,
	setPackageGroupMembership,
	resetPackageOrder,
	resetAllPackageOrders,

	// Sync helpers
	exportData,
	importData,
	setChangeHandler
};
