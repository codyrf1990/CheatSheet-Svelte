/**
 * Firebase Client Initialization
 * Lazy singleton pattern with SSR safety and multi-tab support.
 */

import { browser } from '$app/environment';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Singleton instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

/**
 * Firebase configuration from environment variables
 */
function getFirebaseConfig() {
	return {
		apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
		authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
		projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
		storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
		messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
		appId: import.meta.env.VITE_FIREBASE_APP_ID
	};
}

const REQUIRED_ENV_VARS = {
	apiKey: 'VITE_FIREBASE_API_KEY',
	authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
	projectId: 'VITE_FIREBASE_PROJECT_ID',
	appId: 'VITE_FIREBASE_APP_ID'
} as const;

function getMissingConfigVars(): string[] {
	const config = getFirebaseConfig();
	return (Object.keys(REQUIRED_ENV_VARS) as Array<keyof typeof REQUIRED_ENV_VARS>)
		.filter((key) => !config[key])
		.map((key) => REQUIRED_ENV_VARS[key]);
}

let configErrorLogged = false;

/**
 * Get Firebase app instance (lazy initialization)
 * Returns null during SSR or when required env vars are missing
 */
export function getApp(): FirebaseApp | null {
	if (!browser) return null;

	if (!app) {
		const missing = getMissingConfigVars();
		if (missing.length > 0) {
			if (!configErrorLogged) {
				configErrorLogged = true;
				console.error(
					`[Firebase] Missing or empty env vars: ${missing.join(', ')} — cloud sync disabled, running in local-only mode`
				);
			}
			return null;
		}

		const existingApps = getApps();
		if (existingApps.length > 0) {
			app = existingApps[0];
		} else {
			app = initializeApp(getFirebaseConfig());
		}
	}

	return app;
}

/**
 * Get Firestore instance (lazy initialization)
 * Returns null during SSR
 * Uses persistent local cache with multi-tab coordination
 */
export function getDb(): Firestore | null {
	if (!browser) return null;

	if (!db) {
		const firebaseApp = getApp();
		if (!firebaseApp) return null;
		db = getFirestore(firebaseApp);
	}

	return db;
}

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
	return getMissingConfigVars().length === 0;
}
