/**
 * Persistence Utility
 * Centralized localStorage I/O with consistent error handling.
 * Stores can gradually migrate raw localStorage calls to use this.
 */

import { browser } from '$app/environment';

/**
 * Safely read and parse a JSON value from localStorage.
 * Returns fallback on missing key, parse failure, or non-browser context.
 */
function get<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw !== null ? JSON.parse(raw) : fallback;
	} catch {
		return fallback;
	}
}

/**
 * Safely write a JSON value to localStorage.
 * Returns true on success, false on failure (quota exceeded, etc.).
 */
function set(key: string, value: unknown): boolean {
	if (!browser) return false;
	try {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}

/**
 * Safely read a raw string from localStorage (no JSON parsing).
 */
function getString(key: string): string | null {
	if (!browser) return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

/**
 * Safely write a raw string to localStorage (no JSON serialization).
 */
function setString(key: string, value: string): boolean {
	if (!browser) return false;
	try {
		localStorage.setItem(key, value);
		return true;
	} catch {
		return false;
	}
}

/**
 * Safely remove a key from localStorage.
 */
function remove(key: string): void {
	if (!browser) return;
	try {
		localStorage.removeItem(key);
	} catch {
		// Ignore
	}
}

export const persistence = {
	get,
	set,
	getString,
	setString,
	remove
};
