/**
 * Cloud Sync Store (Svelte 5 Runes)
 * Manages sync status, username, and Firebase integration.
 */

import { browser } from '$app/environment';
import type { SyncStatus } from '$types';
import { loadUserData, queueSave, cancelPendingSave, flushPendingSave } from '$firebase';
import { companiesStore } from './companies.svelte';

const SYNC_USERNAME_KEY = 'solidcam-sync-username';
const REMEMBER_ME_KEY = 'solidcam-remember-me';
const LAST_USERNAME_KEY = 'solidcam-last-username';

// Reactive state
let username = $state<string | null>(null);
let rememberMe = $state<boolean>(true);
let status = $state<SyncStatus>('disconnected');
let lastSyncTime = $state<number | null>(null);
let error = $state<string | null>(null);

// Auto-sync handler reference
let autoSyncEnabled = false;

/**
 * Validate username format
 * Rules: 2-50 chars, letters/numbers/spaces/-/_
 */
function validateUsername(name: string): boolean {
	if (!name || name.length < 2 || name.length > 50) {
		return false;
	}
	return /^[a-zA-Z0-9\s\-_]+$/.test(name);
}

/**
 * Normalize username for storage/comparison
 */
function normalizeUsername(name: string): string {
	return name.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Handle local data changes - queue save to cloud
 */
function handleDataChange(data: ReturnType<typeof companiesStore.exportData>): void {
	if (!autoSyncEnabled || !username) return;

	status = 'syncing';

	queueSave(username, data, (success, err) => {
		if (success) {
			lastSyncTime = Date.now();
			status = 'connected';
			error = null;
		} else {
			status = 'error';
			error = err?.message || 'Sync failed';
			console.error('[SyncStore] Auto-sync failed:', err);
		}
	});
}

/**
 * Start auto-sync - register change handler
 */
function startAutoSync(): void {
	if (autoSyncEnabled) return;
	autoSyncEnabled = true;
	companiesStore.setChangeHandler(handleDataChange);
}

/**
 * Stop auto-sync - unregister change handler
 */
function stopAutoSync(): void {
	autoSyncEnabled = false;
	companiesStore.setChangeHandler(null);
	cancelPendingSave();
}

/**
 * Connect to cloud sync with username
 */
async function connect(name: string, remember: boolean = true): Promise<boolean> {
	if (!browser) return false;

	// Validate username
	if (!validateUsername(name)) {
		error = 'Invalid tag. Use 2-50 characters: letters, numbers, spaces, - or _';
		return false;
	}

	const trimmedName = name.trim();
	error = null;
	status = 'connecting';
	rememberMe = remember;

	try {
		// Try to load existing cloud data
		const cloudData = await loadUserData(trimmedName);

		if (cloudData?.pageSystem) {
			// Cloud data exists - import it
			companiesStore.importData(cloudData.pageSystem);
			lastSyncTime = cloudData.updatedAt?.getTime() || Date.now();
		} else {
			// No cloud data - push local data
			const localData = companiesStore.exportData();
			queueSave(trimmedName, localData, (success) => {
				if (success) {
					lastSyncTime = Date.now();
				}
			});
		}

		// Set username and start auto-sync
		username = trimmedName;
		saveToLocalStorage();
		startAutoSync();
		status = 'connected';

		return true;
	} catch (err) {
		status = 'error';
		error = err instanceof Error ? err.message : 'Connection failed';
		console.error('[SyncStore] Connect failed:', err);
		return false;
	}
}

/**
 * Disconnect from cloud sync
 */
async function disconnect(): Promise<void> {
	// Flush any pending changes first
	if (username) {
		await flushPendingSave();
		// Save last username for pre-filling only if rememberMe is true
		if (browser && rememberMe) {
			localStorage.setItem(LAST_USERNAME_KEY, username);
		} else if (browser) {
			localStorage.removeItem(LAST_USERNAME_KEY);
		}
	}

	stopAutoSync();
	username = null;
	status = 'disconnected';
	lastSyncTime = null;
	error = null;
	saveToLocalStorage();
}

/**
 * Manual sync trigger
 */
async function sync(): Promise<boolean> {
	if (!username || status === 'disconnected') {
		return false;
	}

	status = 'syncing';

	try {
		const data = companiesStore.exportData();
		queueSave(username, data, (success, err) => {
			if (success) {
				lastSyncTime = Date.now();
				status = 'connected';
				error = null;
			} else {
				status = 'error';
				error = err?.message || 'Sync failed';
			}
		});
		return true;
	} catch (err) {
		status = 'error';
		error = err instanceof Error ? err.message : 'Sync failed';
		return false;
	}
}

/**
 * Load username from localStorage and auto-connect
 */
async function load(): Promise<void> {
	if (!browser) return;

	try {
		// Load remember me preference
		const storedRemember = localStorage.getItem(REMEMBER_ME_KEY);
		rememberMe = storedRemember !== 'false'; // Default to true

		const storedUsername = localStorage.getItem(SYNC_USERNAME_KEY);
		if (storedUsername) {
			// Auto-connect with stored username
			await connect(storedUsername, rememberMe);
		}
	} catch (err) {
		console.error('[SyncStore] Failed to load:', err);
	}
}

/**
 * Save username to localStorage
 */
function saveToLocalStorage(): void {
	if (!browser) return;

	try {
		// Save remember me preference
		localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));

		// Only save for auto-connect if rememberMe is true
		if (username && rememberMe) {
			localStorage.setItem(SYNC_USERNAME_KEY, username);
		} else {
			localStorage.removeItem(SYNC_USERNAME_KEY);
		}
	} catch (err) {
		console.error('[SyncStore] Failed to save:', err);
	}
}

export const syncStore = {
	// Getters
	get username() {
		return username;
	},
	get lastUsername() {
		return browser ? localStorage.getItem(LAST_USERNAME_KEY) : null;
	},
	get normalizedUsername() {
		return username ? normalizeUsername(username) : null;
	},
	get status() {
		return status;
	},
	get isLoggedIn() {
		return username !== null && status !== 'disconnected';
	},
	get isConnected() {
		return status === 'connected';
	},
	get isSyncing() {
		return status === 'syncing';
	},
	get lastSync() {
		return lastSyncTime;
	},
	get error() {
		return error;
	},
	get rememberMe() {
		return rememberMe;
	},

	// Operations
	connect,
	disconnect,
	sync,
	validateUsername,
	normalizeUsername,

	// Persistence
	load
};
