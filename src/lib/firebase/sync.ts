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

	try {
		const data: Record<string, unknown> = {
			username,
			normalizedUsername,
			schemaVersion: SCHEMA_VERSION,
			updatedAt: serverTimestamp(),
			pageSystem: payload.pageSystem,
			pageSystemUpdatedAt: payload.pageSystemUpdatedAt,
			client: CLIENT_ID
		};

		if (payload.userPrefs) {
			data.userPrefs = payload.userPrefs;
		}
		if (typeof payload.userPrefsUpdatedAt === 'number') {
			data.userPrefsUpdatedAt = payload.userPrefsUpdatedAt;
		}

		await setDoc(docRef, data, { merge: true });
		return true;
	} catch (err) {
		console.error('[Sync] Failed to save user data:', err);
		throw err;
	}
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
	// Store latest data
	pendingData = payload;
	pendingUsername = username;

	// Clear existing timeout
	if (saveTimeout) {
		clearTimeout(saveTimeout);
	}

	// Set new timeout
	saveTimeout = setTimeout(async () => {
		if (!pendingUsername || !pendingData) return;

		const dataToSave = pendingData;
		const usernameToSave = pendingUsername;

		// Clear pending state
		pendingData = null;
		pendingUsername = null;
		saveTimeout = null;

		try {
			const success = await saveUserDataImmediate(usernameToSave, dataToSave);
			onComplete?.(success);
		} catch (err) {
			onComplete?.(false, err as Error);
		}
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
	pendingData = null;
	pendingUsername = null;
}

/**
 * Flush any pending save immediately
 */
export async function flushPendingSave(): Promise<boolean> {
	if (!pendingUsername || !pendingData) {
		return true; // Nothing to flush
	}

	// Clear timeout
	if (saveTimeout) {
		clearTimeout(saveTimeout);
		saveTimeout = null;
	}

	const dataToSave = pendingData;
	const usernameToSave = pendingUsername;

	// Clear pending state
	pendingData = null;
	pendingUsername = null;

	try {
		return await saveUserDataImmediate(usernameToSave, dataToSave);
	} catch {
		return false;
	}
}
