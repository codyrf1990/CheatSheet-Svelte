/**
 * Toast Notification Store (Svelte 5 Runes)
 * Adapted from TOS Parser Svelte
 */

import type { Toast, ToastType } from '$types';

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

function addToast(message: string, type: ToastType = 'info', duration: number = 3000): string {
	const id = crypto.randomUUID();
	const toast: Toast = { id, message, type, duration };

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
	success: (message: string, duration?: number) => addToast(message, 'success', duration),
	error: (message: string, duration?: number) => addToast(message, 'error', duration ?? 5000),
	warning: (message: string, duration?: number) => addToast(message, 'warning', duration ?? 4000),
	info: (message: string, duration?: number) => addToast(message, 'info', duration),
	remove,
	pause,
	resume,
	clearAll
};
