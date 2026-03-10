/**
 * Deep copy utility to prevent mutation bugs.
 * Uses JSON round-trip (safe for plain data objects, which is all we store).
 * Note: structuredClone cannot be used here because Svelte 5 reactive
 * state objects contain non-cloneable proxies.
 */
export function deepCopy<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}
