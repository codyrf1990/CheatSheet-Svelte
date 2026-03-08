/**
 * Cloud Sync Store (Svelte 5 Runes)
 * Manages sync status, username, and Firebase integration.
 */

import { browser } from '$app/environment';
import type { SyncStatus, UserPrefsData, LicenseInfo } from '$types';
import {
	loadUserData,
	queueSave,
	cancelPendingSave,
	flushPendingSave,
	normalizeUsername
} from '$firebase';
import { companiesStore, DEFAULT_COMPANY_NAME, DEFAULT_PAGE_NAME } from './companies.svelte';
import { userPrefsStore } from './userPrefs.svelte';
import { syncSession } from './syncSession.svelte';

const SYNC_USERNAME_KEY = 'solidcam-sync-username';
const REMEMBER_ME_KEY = 'solidcam-remember-me';
const LAST_USERNAME_KEY = 'solidcam-last-username';
const LAST_CONNECTED_KEY = 'solidcam-last-connected-user';

// Reactive state
let username = $state<string | null>(null);
let rememberMe = $state<boolean>(false);
let status = $state<SyncStatus>('disconnected');
let lastSyncTime = $state<number | null>(null);
let error = $state<string | null>(null);

// Auto-sync handler reference
let autoSyncEnabled = false;
let lastConnectedUsername: string | null = null;

// Generation counter for concurrent connect() race guard
let connectGeneration = 0;

type LocalData = ReturnType<typeof companiesStore.exportData>;
type UserPrefsExport = ReturnType<typeof userPrefsStore.exportData>;

let cachedPageSystem: LocalData | null = null;
let cachedPageSystemUpdatedAt = 0;

function getLocalUpdatedAt(): number {
	const companies = companiesStore.all;
	let latest = 0;
	for (const company of companies) {
		if (company.updatedAt && company.updatedAt > latest) {
			latest = company.updatedAt;
		}
	}
	return latest;
}

function isDefaultUserPrefs(data: UserPrefsData): boolean {
	if (!data || typeof data !== 'object') return true;
	return (
		Object.keys(data.customPanelItems || {}).length === 0 &&
		Object.keys(data.customPackageBits || {}).length === 0 &&
		Object.keys(data.packageBitOrders || {}).length === 0 &&
		Object.keys(data.packageLooseBitOrders || {}).length === 0 &&
		Object.keys(data.packageGroupMembership || {}).length === 0
	);
}

function snapshotPageSystem(): void {
	cachedPageSystem = companiesStore.exportData();
	cachedPageSystemUpdatedAt = getLocalUpdatedAt();
}

function buildSyncPayload() {
	if (!cachedPageSystem) {
		snapshotPageSystem();
	}
	const prefs: UserPrefsExport = userPrefsStore.exportData();
	return {
		pageSystem: cachedPageSystem!,
		pageSystemUpdatedAt: cachedPageSystemUpdatedAt,
		userPrefs: prefs.userPrefs,
		userPrefsUpdatedAt: prefs.updatedAt
	};
}

function isDefaultLocalData(data: LocalData): boolean {
	if (!data || typeof data !== 'object') return true;

	if (Array.isArray(data.favoriteCompanyIds) && data.favoriteCompanyIds.length > 0) {
		return false;
	}
	if (Array.isArray(data.recentCompanyIds) && data.recentCompanyIds.length > 0) {
		return false;
	}

	if (!Array.isArray(data.companies) || data.companies.length === 0) {
		return true;
	}
	if (data.companies.length > 1) {
		return false;
	}

	const company = data.companies[0];
	if (!company || company.name !== DEFAULT_COMPANY_NAME || company.isFavorite) {
		return false;
	}
	if (!Array.isArray(company.pages) || company.pages.length === 0) {
		return true;
	}
	if (company.pages.length > 1) {
		return false;
	}

	const page = company.pages[0];
	if (!page || page.name !== DEFAULT_PAGE_NAME) {
		return false;
	}

	const panels = page.state?.panels ?? {};
	const packages = page.state?.packages ?? {};
	return Object.keys(panels).length === 0 && Object.keys(packages).length === 0;
}

/**
 * Deduplicate licenses from two arrays, keeping all unique entries.
 * Uses dongleNo + importedAt as composite key.
 */
function unionLicenses(a: LicenseInfo[] | undefined, b: LicenseInfo[] | undefined): LicenseInfo[] {
	const all = [...(a || []), ...(b || [])];
	const seen = new Set<string>();
	return all.filter((lic) => {
		const key = `${lic.dongleNo}::${lic.importedAt}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

/**
 * Merge local and cloud company data per-company instead of full overwrite.
 * - Per-company: newer updatedAt wins for pages/state
 * - Licenses: always unioned (never dropped)
 * - Companies only on one side: kept
 * - Favorites: unioned
 */
function mergeCompanyData(local: LocalData, cloud: LocalData): LocalData {
	const localMap = new Map(local.companies.map((c) => [c.id, c]));
	const cloudMap = new Map(cloud.companies.map((c) => [c.id, c]));
	const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);

	const merged = [];
	for (const id of allIds) {
		const lc = localMap.get(id);
		const cc = cloudMap.get(id);

		if (lc && !cc) {
			merged.push(lc);
		} else if (cc && !lc) {
			merged.push(cc);
		} else if (lc && cc) {
			// Newer updatedAt wins for pages/state, licenses always unioned
			const winner = (lc.updatedAt ?? 0) >= (cc.updatedAt ?? 0) ? { ...lc } : { ...cc };
			winner.licenses = unionLicenses(lc.licenses, cc.licenses);
			merged.push(winner);
		}
	}

	// Union favorites (both sides), prefer local for UX state
	const favSet = new Set([
		...(local.favoriteCompanyIds || []),
		...(cloud.favoriteCompanyIds || [])
	]);
	const existingIds = new Set(merged.map((c) => c.id));

	return {
		schemaVersion: local.schemaVersion ?? 1,
		currentCompanyId: local.currentCompanyId,
		companies: merged,
		favoriteCompanyIds: [...favSet].filter((id) => existingIds.has(id)),
		recentCompanyIds: local.recentCompanyIds || [],
		updatedAt: Date.now()
	};
}

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
 * Handle local data changes - queue save to cloud
 */
function queueCombinedSave(): void {
	if (!autoSyncEnabled || !username) return;

	status = 'syncing';
	syncSession.transition('syncing');

	const payload = buildSyncPayload();
	queueSave(username, payload, (success, err) => {
		if (success) {
			lastSyncTime = Date.now();
			status = 'connected';
			syncSession.transition('connected');
			error = null;
		} else if (err) {
			status = 'error';
			syncSession.transition('error');
			error = err.message || 'Sync failed';
			console.error('[SyncStore] Auto-sync failed:', err);
		} else {
			// Clean cancel (user switched accounts) — not an error
			status = 'connected';
			syncSession.transition('connected');
		}
	});
}

function handlePageSystemChange(): void {
	if (!autoSyncEnabled || !username) return;
	snapshotPageSystem();
	queueCombinedSave();
}

function handleUserPrefsChange(): void {
	if (!autoSyncEnabled || !username) return;
	queueCombinedSave();
}

/**
 * Start auto-sync - register change handler
 */
function startAutoSync(): void {
	if (autoSyncEnabled) return;
	autoSyncEnabled = true;
	companiesStore.setChangeHandler(handlePageSystemChange);
	userPrefsStore.setChangeHandler(handleUserPrefsChange);
}

/**
 * Stop auto-sync - unregister change handler
 */
function stopAutoSync(): void {
	autoSyncEnabled = false;
	companiesStore.setChangeHandler(null);
	userPrefsStore.setChangeHandler(null);
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

	const myGeneration = ++connectGeneration;
	const trimmedName = name.trim();
	const normalizedName = normalizeUsername(trimmedName);
	error = null;
	status = 'connecting';
	syncSession.transition('connecting');
	rememberMe = remember;

	// Check if switching to a different user - reset syncable prefs to prevent cross-user pollution
	const isSwitchingUsers =
		lastConnectedUsername !== null && lastConnectedUsername !== normalizedName;
	if (isSwitchingUsers) {
		console.info('[SyncStore] Switching users, resetting local prefs to avoid cross-user data.');
		stopAutoSync();
		userPrefsStore.resetSyncablePrefs();
	}

	try {
		// Try to load existing cloud data
		const cloudData = await loadUserData(trimmedName);

		// Bail if a newer connect() call has superseded this one
		if (myGeneration !== connectGeneration) return false;

		const localData = companiesStore.exportData();
		const localPrefsExport = userPrefsStore.exportData();
		const localPrefs = localPrefsExport.userPrefs;
		const localIsDefault = isDefaultLocalData(localData);
		const localPrefsIsDefault = isDefaultUserPrefs(localPrefs);
		const localUpdatedAt = getLocalUpdatedAt();
		const cloudUpdatedAt = cloudData?.updatedAt?.getTime() || 0;
		const cloudPageUpdatedAt =
			typeof cloudData?.pageSystemUpdatedAt === 'number'
				? cloudData.pageSystemUpdatedAt
				: cloudUpdatedAt;
		const localPrefsUpdatedAt = localPrefsExport.updatedAt;
		const cloudPrefsUpdatedAt = cloudData?.userPrefsUpdatedAt || 0;

		let shouldUpload = false;

		if (cloudData?.pageSystem) {
			if (isSwitchingUsers || localIsDefault) {
				// Switching users or local is empty → take cloud as-is
				companiesStore.importData(cloudData.pageSystem);
				lastSyncTime = cloudUpdatedAt || Date.now();
			} else {
				// Same user, both sides have data → merge per-company
				const merged = mergeCompanyData(localData, cloudData.pageSystem as LocalData);
				companiesStore.importData(merged);
				shouldUpload = true; // Push merged result so both browsers converge
				console.info('[SyncStore] Merged local + cloud data per-company.');
			}
		} else {
			// No cloud data for this user
			if (!isSwitchingUsers && !localIsDefault) {
				// Same user, has local data, no cloud yet → upload to establish cloud record
				shouldUpload = true;
			} else if (isSwitchingUsers) {
				// Switching to a user with no cloud data → clear local state so the previous
				// user's companies don't bleed into this account
				companiesStore.deleteAll();
			}
		}

		if (cloudData?.userPrefs) {
			if (!isSwitchingUsers && !localPrefsIsDefault && localPrefsUpdatedAt > cloudPrefsUpdatedAt) {
				shouldUpload = true;
			} else {
				userPrefsStore.importData(cloudData.userPrefs, cloudPrefsUpdatedAt);
			}
		} else if (!isSwitchingUsers && !localPrefsIsDefault) {
			shouldUpload = true;
		}

		if (shouldUpload) {
			snapshotPageSystem();
			const payload = buildSyncPayload();
			queueSave(trimmedName, payload, (success) => {
				if (success) {
					lastSyncTime = Date.now();
				}
			});
		}

		// Refresh cached pageSystem snapshot after any imports/decisions
		snapshotPageSystem();

		// Final stale check before committing state
		if (myGeneration !== connectGeneration) return false;

		// Set username and start auto-sync
		username = trimmedName;
		lastConnectedUsername = normalizedName;
		saveToLocalStorage();
		startAutoSync();
		status = 'connected';
		syncSession.transition('connected');

		// Register reconnection handler so syncSession can auto-recover on network restore
		syncSession.setReconnectHandler(async () => {
			if (!username) return false;
			try {
				await loadUserData(username);
				status = 'connected';
				syncSession.transition('connected');
				startAutoSync();
				return true;
			} catch {
				return false;
			}
		});

		return true;
	} catch (err) {
		// Cloud unavailable — establish local-only session so the app always enters
		console.warn('[SyncStore] Cloud read failed, entering local-only mode:', err);
		error = err instanceof Error ? err.message : 'Cloud sync unavailable';
		status = 'error';
		syncSession.transition('local_only');
		// Set username so user enters the app; do NOT start auto-sync writes
		username = trimmedName;
		lastConnectedUsername = normalizedName;
		saveToLocalStorage();
		return true;
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
	syncSession.setReconnectHandler(null);
	syncSession.cancelReconnect();
	username = null;
	status = 'disconnected';
	syncSession.transition('disconnected');
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
		snapshotPageSystem();
		const payload = buildSyncPayload();
		queueSave(username, payload, (success, err) => {
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
		rememberMe = storedRemember === 'true'; // Default to false

		// Restore last connected user for cross-user detection
		const storedLastConnected = localStorage.getItem(LAST_CONNECTED_KEY);
		if (storedLastConnected) {
			lastConnectedUsername = storedLastConnected;
		}

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

		// Always persist last connected user for cross-user detection
		if (lastConnectedUsername) {
			localStorage.setItem(LAST_CONNECTED_KEY, lastConnectedUsername);
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
	/** Extended sync session state (richer than status) */
	get sessionState() {
		return syncSession.state;
	},
	get isOnline() {
		return syncSession.isOnline;
	},

	// Operations
	connect,
	disconnect,
	sync,
	validateUsername,
	normalizeUsername,
	async flushPending(): Promise<boolean> {
		if (!username) return true;
		return flushPendingSave();
	},

	// Persistence
	load
};
