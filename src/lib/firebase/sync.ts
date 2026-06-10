/**
 * Firebase Sync Operations
 * Load/save user data with debounced writes.
 */

import {
	collection,
	doc,
	getDoc,
	getDocs,
	setDoc,
	serverTimestamp,
	writeBatch
} from 'firebase/firestore';
import { getDb } from './client';
import type { CloudUserData, Company, PageSystemData, UserPrefsData } from '$types';

const COLLECTION = 'users';
const COMPANIES_SUBCOLLECTION = 'companies';
const SCHEMA_VERSION = 1;
// Layout v2: companies live in a subcollection (one doc each) so saves only
// upload changed companies. The legacy `pageSystem` field stays readable for
// V1 clients and old cached bundles; `pageSystemV2UpdatedAt` vs the legacy
// `pageSystemUpdatedAt` decides which layout is fresher at read time.
const LAYOUT_VERSION = 2;
const CLIENT_ID = 'solidcam-cheatsheet';
const DEBOUNCE_MS = 900;
// Firestore caps batches at 500 ops — stay well under
const BATCH_OP_LIMIT = 400;

/** The non-company half of PageSystemData, stored on the user meta doc. */
interface PageSystemMeta {
	schemaVersion: number;
	currentCompanyId: string | null;
	favoriteCompanyIds: string[];
	recentCompanyIds: string[];
	/** Display order of company docs (subcollection reads are unordered) */
	companyIds: string[];
}

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

// Snapshot of what the cloud currently holds (seeded on load, updated on each
// successful write). Lets us upload only the companies that actually changed —
// a prefs toggle no longer re-sends every company, and a no-op sync skips the
// network entirely. Serialized-string comparison is deliberate: timestamps
// can't detect deletions, JSON equality can. A false "dirty" (e.g. different
// key order after a cloud round-trip) just causes one redundant write.
let lastWrittenUser: string | null = null;
let lastWrittenCompanyJson = new Map<string, string>(); // company id → JSON
let lastWrittenMetaJson: string | null = null;
let lastWrittenPrefsJson: string | null = null;

// Set when subcollection writes are rejected (rules not deployed yet) — falls
// back to the legacy monolithic write for the rest of the session.
let v2WritesUnavailable = false;

// Firestore rejects documents over 1 MiB — warn while there's still headroom
const DOC_SIZE_WARN_BYTES = 800_000;
let docSizeWarned = false;

function resetDiffCache(username: string): void {
	lastWrittenUser = username;
	lastWrittenCompanyJson = new Map();
	lastWrittenMetaJson = null;
	lastWrittenPrefsJson = null;
}

function buildPageSystemMeta(pageSystem: PageSystemData): PageSystemMeta {
	return {
		schemaVersion: pageSystem.schemaVersion ?? SCHEMA_VERSION,
		currentCompanyId: pageSystem.currentCompanyId ?? null,
		favoriteCompanyIds: pageSystem.favoriteCompanyIds ?? [],
		recentCompanyIds: pageSystem.recentCompanyIds ?? [],
		companyIds: (pageSystem.companies ?? []).map((c) => c.id)
	};
}

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

		// Default to the legacy monolithic field
		let pageSystem: PageSystemData | null = data.pageSystem || null;
		let pageSystemUpdatedAt =
			typeof data.pageSystemUpdatedAt === 'number' ? data.pageSystemUpdatedAt : 0;

		// V2 layout: assemble from the companies subcollection — but only when it's
		// at least as fresh as the legacy field. An old cached client may have
		// written the legacy field after this user migrated; the newer side wins
		// and the next save re-migrates.
		const v2UpdatedAt =
			typeof data.pageSystemV2UpdatedAt === 'number' ? data.pageSystemV2UpdatedAt : 0;
		const meta = data.pageSystemMeta as PageSystemMeta | undefined;
		if ((data.layoutVersion ?? 0) >= LAYOUT_VERSION && meta && v2UpdatedAt >= pageSystemUpdatedAt) {
			try {
				const colSnap = await getDocs(
					collection(db, COLLECTION, normalizedUsername, COMPANIES_SUBCOLLECTION)
				);
				const byId = new Map(colSnap.docs.map((d) => [d.id, d.data() as Company]));
				const ordered: Company[] = [];
				for (const id of meta.companyIds ?? []) {
					const company = byId.get(id);
					if (company) {
						ordered.push(company);
						byId.delete(id);
					}
				}
				// Companies missing from the order list (shouldn't happen) go last
				ordered.push(...byId.values());

				pageSystem = {
					schemaVersion: meta.schemaVersion ?? SCHEMA_VERSION,
					currentCompanyId: meta.currentCompanyId ?? null,
					companies: ordered,
					favoriteCompanyIds: meta.favoriteCompanyIds ?? [],
					recentCompanyIds: meta.recentCompanyIds ?? [],
					updatedAt: v2UpdatedAt
				};
				pageSystemUpdatedAt = v2UpdatedAt;

				// Seed the diff cache with what the cloud holds so the next save
				// only uploads companies that actually changed
				resetDiffCache(normalizedUsername);
				for (const company of ordered) {
					lastWrittenCompanyJson.set(company.id, JSON.stringify(company));
				}
				lastWrittenMetaJson = JSON.stringify(buildPageSystemMeta(pageSystem));
				lastWrittenPrefsJson = data.userPrefs ? JSON.stringify(data.userPrefs) : null;
			} catch (err) {
				// Subcollection unreadable — fall back to the legacy field
				console.warn('[Sync] V2 layout read failed, using legacy pageSystem:', err);
			}
		}

		return {
			username: data.username || username,
			normalizedUsername: data.normalizedUsername || normalizedUsername,
			schemaVersion: data.schemaVersion || SCHEMA_VERSION,
			updatedAt: data.updatedAt?.toDate() || new Date(),
			pageSystem,
			pageSystemUpdatedAt,
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

	if (lastWrittenUser !== normalizedUsername) {
		resetDiffCache(normalizedUsername);
	}

	// Diff each piece against what the cloud already holds
	const companies = payload.pageSystem.companies ?? [];
	const companyJson = new Map(companies.map((c) => [c.id, JSON.stringify(c)] as const));
	const dirtyCompanyIds = [...companyJson.keys()].filter(
		(id) => companyJson.get(id) !== lastWrittenCompanyJson.get(id)
	);
	const deletedCompanyIds = [...lastWrittenCompanyJson.keys()].filter((id) => !companyJson.has(id));

	const metaJson = JSON.stringify(buildPageSystemMeta(payload.pageSystem));
	const metaChanged = metaJson !== lastWrittenMetaJson;

	const prefsJson = payload.userPrefs ? JSON.stringify(payload.userPrefs) : null;
	const prefsChanged = prefsJson !== null && prefsJson !== lastWrittenPrefsJson;

	const pageSystemChanged =
		dirtyCompanyIds.length > 0 || deletedCompanyIds.length > 0 || metaChanged;

	// Nothing actually changed since the last successful upload — skip the write
	if (!pageSystemChanged && !prefsChanged) {
		return true;
	}

	// Firestore rejects docs over 1 MiB — in V2 the limit applies per company
	for (const id of dirtyCompanyIds) {
		const size = companyJson.get(id)!.length;
		if (size > DOC_SIZE_WARN_BYTES && !docSizeWarned) {
			docSizeWarned = true;
			console.warn(
				`[Sync] One company's data is ${Math.round(size / 1024)} KB — approaching Firestore's 1 MB document limit. Consider deleting old pages on it.`
			);
		}
	}

	const metaDoc: Record<string, unknown> = {
		username,
		normalizedUsername,
		schemaVersion: SCHEMA_VERSION,
		updatedAt: serverTimestamp(),
		client: CLIENT_ID
	};
	if (prefsChanged) {
		metaDoc.userPrefs = payload.userPrefs;
		if (typeof payload.userPrefsUpdatedAt === 'number') {
			metaDoc.userPrefsUpdatedAt = payload.userPrefsUpdatedAt;
		}
	}

	// ── V2 write: meta doc + only the changed/deleted company docs ──
	if (!v2WritesUnavailable) {
		try {
			const companyRef = (id: string) =>
				doc(db, COLLECTION, normalizedUsername, COMPANIES_SUBCOLLECTION, id);

			// Company ops first, meta last — the freshness stamp must only land
			// after the company docs it describes
			const batches = [writeBatch(db)];
			let opCount = 0;
			const addOp = (op: (b: ReturnType<typeof writeBatch>) => void) => {
				if (opCount >= BATCH_OP_LIMIT) {
					batches.push(writeBatch(db));
					opCount = 0;
				}
				op(batches[batches.length - 1]);
				opCount++;
			};

			const companyById = new Map(companies.map((c) => [c.id, c]));
			for (const id of dirtyCompanyIds) {
				addOp((b) => b.set(companyRef(id), companyById.get(id)!));
			}
			for (const id of deletedCompanyIds) {
				addOp((b) => b.delete(companyRef(id)));
			}
			addOp((b) =>
				b.set(
					docRef,
					{
						...metaDoc,
						layoutVersion: LAYOUT_VERSION,
						pageSystemMeta: buildPageSystemMeta(payload.pageSystem),
						pageSystemV2UpdatedAt: payload.pageSystemUpdatedAt
					},
					{ merge: true }
				)
			);

			for (const batch of batches) {
				await batch.commit();
			}

			// Record what landed so the next write can diff against it
			lastWrittenCompanyJson = companyJson as Map<string, string>;
			lastWrittenMetaJson = metaJson;
			if (prefsChanged) lastWrittenPrefsJson = prefsJson;
			return true;
		} catch (err) {
			const code = (err as { code?: string })?.code;
			if (code === 'permission-denied') {
				// Rules for the subcollection aren't deployed — use the legacy
				// monolithic write for the rest of the session
				console.warn('[Sync] V2 layout write denied, falling back to legacy pageSystem field');
				v2WritesUnavailable = true;
			} else {
				console.error('[Sync] Failed to save user data:', err);
				throw err;
			}
		}
	}

	// ── Legacy fallback: whole pageSystem in one field on the user doc ──
	try {
		const data: Record<string, unknown> = { ...metaDoc };
		if (pageSystemChanged) {
			data.pageSystem = payload.pageSystem;
			data.pageSystemUpdatedAt = payload.pageSystemUpdatedAt;
		}

		await setDoc(docRef, data, { merge: true });

		lastWrittenCompanyJson = companyJson as Map<string, string>;
		lastWrittenMetaJson = metaJson;
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
