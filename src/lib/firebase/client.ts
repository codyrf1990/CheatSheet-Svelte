/**
 * Firebase Client Initialization
 * Lazy singleton pattern with SSR safety and multi-tab support.
 */

import { browser } from '$app/environment';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
	initializeFirestore,
	getFirestore,
	persistentLocalCache,
	persistentMultipleTabManager,
	type Firestore
} from 'firebase/firestore';

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

/**
 * Get Firebase app instance (lazy initialization)
 * Returns null during SSR
 */
export function getApp(): FirebaseApp | null {
	if (!browser) return null;

	if (!app) {
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

		try {
			db = initializeFirestore(firebaseApp, {
				localCache: persistentLocalCache({
					tabManager: persistentMultipleTabManager()
				})
			});
		} catch {
			// Firestore may already be initialized with different settings
			// This can happen in dev with HMR - fall back to getting existing instance
			db = getFirestore(firebaseApp);
		}
	}

	return db;
}

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
	const config = getFirebaseConfig();
	return !!(config.apiKey && config.projectId);
}
