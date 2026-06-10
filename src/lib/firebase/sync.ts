/**
 * Firebase Sync Operations
 * Load/save user data with debounced writes.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from './client';
import type { CloudUserData, PageSystemData, UserPrefsData } from '$types';

const COLLECTION = 'users';
const SCHEMA_VERSION = 1;
const CLIENT_ID = 'solidcam-cheatsheet';
const DEBOUNCE_MS = 900;

export interface SyncPayload {
	pageSystem: PageSystemData;
	pageSystemUpdatedAt: number;
	userPrefs?: UserPrefsData;
	userPrefsUpdatedAt?: number;
}

// Debounce state
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingData: SyncPayload | null = null;
let pendingUsername: string | null = null;
let pendingCallbacks: Array<(success: boolean, error?: Error) => void> = [];

// Serializes all writes so a flush can never interleave with an in-flight debounced write
let writeChain: Promise<unknown> = Promise.resolve();

// Snapshot of what the last SUCCESSFUL write uploaded, per user. Lets us skip
// re-uploading parts of the payload that haven't changed — a prefs toggle no
// longer re-sends every company, and a no-op sync skips the network entirely.
// Serialized-string comparison is deliberate: timestamps can't detect deletions
// (removing a company can leave the max updatedAt unchanged), JSON equality can.
let lastWrittenUser: string | null = null;
let lastWrittenPageSystemJson: string | null = null;
let lastWrittenPrefsJson: string | null = null;

// Firestore rejects documents over 1 MiB — warn while there's still headroom
const DOC_SIZE_WARN_BYTES = 800_000;
let docSizeWarned = false;

/**
 * Normalize username for document ID
 */
export function normalizeUsername(name: string): string {
	return name.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Load user data from Firestore
 */
export async function loadUserData(username: string): Promise<CloudUserData | null> {
	const db = getDb();
	if (!db) {
		console.error('[Sync] Firestore not available');
		return null;
	}

	const normalizedUsername = normalizeUsername(username);
	const docRef = doc(db, COLLECTION, normalizedUsername);

	try {
		const snapshot = await getDoc(docRef);

		if (!snapshot.exists()) {
			return null;
		}

		const data = snapshot.data();
		return {
			username: data.username || username,
			normalizedUsername: data.normalizedUsername || normalizedUsername,
			schemaVersion: data.schemaVersion || SCHEMA_VERSION,
			updatedAt: data.updatedAt?.toDate() || new Date(),
			pageSystem: data.pageSystem || null,
			pageSystemUpdatedAt:
				typeof data.pageSystemUpdatedAt === 'number' ? data.pageSystemUpdatedAt : 0,
			userPrefs: data.userPrefs || null,
			userPrefsUpdatedAt: typeof data.userPrefsUpdatedAt === 'number' ? data.userPrefsUpdatedAt : 0,
			client: data.client || CLIENT_ID
		} as CloudUserData;
	} catch (err) {
		console.error('[Sync] Failed to load user data:', err);
		throw err;
	}
}

/**
 * Save user data to Firestore (immediate, no debounce)
 */
export async function saveUserDataImmediate(
	username: string,
	payload: SyncPayload
): Promise<boolean> {
	const db = getDb();
	if (!db) {
		console.error('[Sync] Firestore not available');
		return false;
	}

	const normalizedUsername = normalizeUsername(username);
	const docRef = doc(db, COLLECTION, normalizedUsername);

	const pageSystemJson = JSON.stringify(payload.pageSystem);
	const prefsJson = payload.userPrefs ? JSON.stringify(payload.userPrefs) : null;
	const sameUser = lastWrittenUser === normalizedUsername;
	const pageSystemChanged = !sameUser || pageSystemJson !== lastWrittenPageSystemJson;
	const prefsChanged = prefsJson !== null && (!sameUser || prefsJson !== lastWrittenPrefsJson);

	// Nothing actually changed since the last successful upload — skip the write
	if (!pageSystemChanged && !prefsChanged) {
		return true;
	}

	if (pageSystemJson.length > DOC_SIZE_WARN_BYTES && !docSizeWarned) {
		docSizeWarned = true;
		console.warn(
			`[Sync] Page data is ${Math.round(pageSystemJson.length / 1024)} KB — approaching Firestore's 1 MB document limit. Consider deleting old companies/pages.`
		);
	}

	try {
		const data: Record<string, unknown> = {
			username,
			normalizedUsername,
			schemaVersion: SCHEMA_VERSION,
			updatedAt: serverTimestamp(),
			client: CLIENT_ID
		};

		if (pageSystemChanged) {
			data.pageSystem = payload.pageSystem;
			data.pageSystemUpdatedAt = payload.pageSystemUpdatedAt;
		}
		if (prefsChanged) {
			data.userPrefs = payload.userPrefs;
			if (typeof payload.userPrefsUpdatedAt === 'number') {
				data.userPrefsUpdatedAt = payload.userPrefsUpdatedAt;
			}
		}

		await setDoc(docRef, data, { merge: true });

		// Record what landed so the next write can diff against it
		lastWrittenUser = normalizedUsername;
		if (pageSystemChanged) lastWrittenPageSystemJson = pageSystemJson;
		if (prefsChanged) lastWrittenPrefsJson = prefsJson;
		return true;
	} catch (err) {
		console.error('[Sync] Failed to save user data:', err);
		throw err;
	}
}

/**
 * Dispatch the pending save onto the write chain.
 * Clears pending state synchronously (no double-fire) and notifies every queued callback.
 */
function dispatchPending(): Promise<boolean> {
	if (!pendingUsername || !pendingData) {
		return Promise.resolve(true);
	}

	if (saveTimeout) {
		clearTimeout(saveTimeout);
		saveTimeout = null;
	}

	const dataToSave = pendingData;
	const usernameToSave = pendingUsername;
	const callbacks = pendingCallbacks;

	pendingData = null;
	pendingUsername = null;
	pendingCallbacks = [];

	const result = writeChain.then(async () => {
		try {
			const success = await saveUserDataImmediate(usernameToSave, dataToSave);
			for (const cb of callbacks) cb(success);
			return success;
		} catch (err) {
			for (const cb of callbacks) cb(false, err as Error);
			return false;
		}
	});
	writeChain = result;
	return result;
}

/**
 * Queue a save operation (debounced)
 * Multiple calls within DEBOUNCE_MS will be merged into one write.
 */
export function queueSave(
	username: string,
	payload: SyncPayload,
	onComplete?: (success: boolean, error?: Error) => void
): void {
	// A pending save for a different user must not be dropped — write it out first
	if (pendingUsername !== null && pendingUsername !== username) {
		void dispatchPending();
	}

	// Each payload is a full snapshot, so last-write-wins — but userPrefs is optional,
	// so carry it forward if the newer snapshot omits what an earlier one included
	if (pendingData?.userPrefs && !payload.userPrefs) {
		payload = {
			...payload,
			userPrefs: pendingData.userPrefs,
			userPrefsUpdatedAt: pendingData.userPrefsUpdatedAt
		};
	}

	pendingData = payload;
	pendingUsername = username;
	if (onComplete) {
		pendingCallbacks.push(onComplete);
	}

	if (saveTimeout) {
		clearTimeout(saveTimeout);
	}
	saveTimeout = setTimeout(() => {
		saveTimeout = null;
		void dispatchPending();
	}, DEBOUNCE_MS);
}

/**
 * Cancel any pending save operation
 */
export function cancelPendingSave(): void {
	if (saveTimeout) {
		clearTimeout(saveTimeout);
		saveTimeout = null;
	}
	// Fire callbacks as a clean cancel (no error) so callers can reset status
	const callbacks = pendingCallbacks;
	pendingCallbacks = [];
	pendingData = null;
	pendingUsername = null;
	for (const cb of callbacks) cb(false);
}

/**
 * Flush any pending save immediately
 */
export async function flushPendingSave(): Promise<boolean> {
	if (!pendingUsername || !pendingData) {
		// Nothing new to write, but wait out any in-flight write so callers
		// (e.g. disconnect) know the last save actually landed
		await writeChain;
		return true;
	}
	return dispatchPending();
}
