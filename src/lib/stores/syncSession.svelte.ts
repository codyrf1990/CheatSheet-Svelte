/**
 * Sync Session Model (Svelte 5 Runes)
 * Expanded sync states with online/offline detection and reconnection logic.
 * The existing sync.svelte.ts delegates status management here.
 */

import { browser } from '$app/environment';
import type { SyncSessionState, SyncStatus } from '$types';

// ── Reactive state ──────────────────────────────────────────────────────────

let sessionState = $state<SyncSessionState>('disconnected');
let retryCount = $state(0);
let isOnline = $state(browser ? navigator.onLine : true);

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

let reconnectCallback: (() => Promise<boolean>) | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

// ── Online/offline detection ────────────────────────────────────────────────

// HMR-safe: install listeners once per browser session. Without this guard,
// every hot reload would stack a fresh pair of online/offline listeners.
if (browser && !window.__syncSessionListenersInstalled) {
	window.addEventListener('online', handleOnline);
	window.addEventListener('offline', handleOffline);
	window.__syncSessionListenersInstalled = true;
}

function handleOnline(): void {
	isOnline = true;
	if (sessionState === 'local_only' || sessionState === 'disconnected') {
		return; // Don't auto-reconnect if user explicitly disconnected or never connected
	}
	if (sessionState === 'error' || sessionState === 'degraded') {
		attemptReconnect();
	}
}

function handleOffline(): void {
	isOnline = false;
	if (sessionState === 'connected' || sessionState === 'syncing') {
		sessionState = 'local_only';
	}
}

// ── Reconnection logic ─────────────────────────────────────────────────────

function attemptReconnect(): void {
	if (!reconnectCallback || !isOnline) return;
	if (retryCount >= MAX_RETRIES) {
		sessionState = 'local_only';
		return;
	}

	sessionState = 'reconnecting';
	const delay = RETRY_DELAYS[retryCount] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];

	reconnectTimer = setTimeout(async () => {
		if (!reconnectCallback || !isOnline) return;

		try {
			const success = await reconnectCallback();
			if (success) {
				sessionState = 'connected';
				retryCount = 0;
			} else {
				retryCount++;
				attemptReconnect();
			}
		} catch {
			retryCount++;
			attemptReconnect();
		}
	}, delay);
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Map expanded session state to legacy SyncStatus for backward compatibility.
 */
function toLegacyStatus(): SyncStatus {
	switch (sessionState) {
		case 'reconnecting':
		case 'degraded':
			return 'connecting';
		case 'local_only':
			return 'error';
		default:
			return sessionState as SyncStatus;
	}
}

/**
 * Transition to a new state. Call this from sync.svelte.ts instead of
 * setting status directly.
 */
function transition(newState: SyncSessionState): void {
	const oldState = sessionState;
	sessionState = newState;

	// Reset retry count on successful connection
	if (newState === 'connected') {
		retryCount = 0;
	}

	// If transitioning to error while online, start reconnection
	if (newState === 'error' && isOnline && oldState !== 'disconnected') {
		attemptReconnect();
	}
}

/**
 * Register a callback for reconnection attempts.
 * The callback should return true on success, false on failure.
 */
function setReconnectHandler(handler: (() => Promise<boolean>) | null): void {
	reconnectCallback = handler;
	if (!handler && reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
}

/**
 * Cancel any pending reconnection attempts.
 */
function cancelReconnect(): void {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
	retryCount = 0;
}

export const syncSession = {
	get state() {
		return sessionState;
	},
	get legacyStatus() {
		return toLegacyStatus();
	},
	get isOnline() {
		return isOnline;
	},
	get retryCount() {
		return retryCount;
	},
	get isOperational() {
		return (
			sessionState === 'connected' || sessionState === 'syncing' || sessionState === 'degraded'
		);
	},
	transition,
	setReconnectHandler,
	cancelReconnect
};
