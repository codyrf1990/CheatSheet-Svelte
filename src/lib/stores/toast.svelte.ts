/**
 * Toast Notification Store (Svelte 5 Runes)
 * Adapted from TOS Parser Svelte
 */

import { browser } from '$app/environment';
import type { Toast, ToastType } from '$types';

const MAX_TOASTS = 3;

// Track remaining time for paused toasts
interface TimerState {
	timer: ReturnType<typeof setTimeout>;
	startTime: number;
	remaining: number;
}

// Reactive state
let toasts = $state<Toast[]>([]);

// Track timers for pause/resume (WCAG accessibility)
const timers = new Map<string, TimerState>();

function addToast(message: string, type: ToastType = 'info', duration: number = 4000): string {
	const id = crypto.randomUUID();
	const toast: Toast = { id, message, type, duration };

	// Remove oldest toast if at limit (prefer dropping non-error toasts first)
	if (toasts.length >= MAX_TOASTS) {
		const nonError = toasts.find((t) => t.type !== 'error');
		const oldest = nonError ?? toasts[0];
		remove(oldest.id);
	}

	toasts = [...toasts, toast];

	// Auto-remove after duration
	if (duration > 0) {
		const timer = setTimeout(() => {
			remove(id);
		}, duration);
		timers.set(id, {
			timer,
			startTime: Date.now(),
			remaining: duration
		});
	}

	return id;
}

function remove(id: string): void {
	// Clear timer if exists
	const state = timers.get(id);
	if (state) {
		clearTimeout(state.timer);
		timers.delete(id);
	}
	toasts = toasts.filter((t) => t.id !== id);
}

// Pause auto-dismiss (e.g., on hover) - WCAG accessibility
function pause(id: string): void {
	const state = timers.get(id);
	if (state) {
		clearTimeout(state.timer);
		const elapsed = Date.now() - state.startTime;
		state.remaining = Math.max(0, state.remaining - elapsed);
	}
}

// Resume auto-dismiss (e.g., on mouse leave)
function resume(id: string): void {
	const state = timers.get(id);
	if (state && state.remaining > 0) {
		state.startTime = Date.now();
		state.timer = setTimeout(() => {
			remove(id);
		}, state.remaining);
	}
}

function clearAll(): void {
	// Clear all timers
	timers.forEach((state) => clearTimeout(state.timer));
	timers.clear();
	toasts = [];
}

export const toastStore = {
	get all() {
		return toasts;
	},
	success: (message: string, duration?: number) => addToast(message, 'success', duration ?? 4000),
	error: (message: string, duration?: number) => addToast(message, 'error', duration ?? 6000),
	warning: (message: string, duration?: number) => addToast(message, 'warning', duration ?? 5000),
	info: (message: string, duration?: number) => addToast(message, 'info', duration ?? 4000),
	remove,
	pause,
	resume,
	clearAll
};

// Pause all toasts when tab is hidden (2026 best practice)
// Uses browser guard for SSR safety; one-time setup outside reactive path.
// Window flag prevents listener stacking during HMR re-execution in dev.
const TOAST_LISTENER_FLAG = '__scToastVisibilityListener__';
if (browser && !(window as unknown as Record<string, unknown>)[TOAST_LISTENER_FLAG]) {
	(window as unknown as Record<string, unknown>)[TOAST_LISTENER_FLAG] = true;
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			document.documentElement.classList.add('toast-paused');
			// Read toasts snapshot directly — not inside a reactive context
			for (const t of toasts) pause(t.id);
		} else {
			document.documentElement.classList.remove('toast-paused');
			for (const t of toasts) resume(t.id);
		}
	});
}
