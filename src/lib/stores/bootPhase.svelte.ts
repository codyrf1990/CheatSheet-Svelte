/**
 * Boot Phase Coordinator (Svelte 5 Runes)
 * Centralizes the startup sequence so route components don't own initialization.
 */

import type { BootPhase } from '$types';
import { companiesStore } from './companies.svelte';
import { userPrefsStore } from './userPrefs.svelte';
import { syncStore } from './sync.svelte';

let phase = $state<BootPhase>('idle');
let bootError = $state<string | null>(null);

/**
 * Run the full boot sequence.
 * Phases: idle → prefs → companies → sync → ready
 * If sync takes >3s, app enters ready anyway (local-first).
 */
async function boot(): Promise<void> {
	if (phase !== 'idle') return; // Prevent double-boot

	try {
		phase = 'prefs';
		userPrefsStore.init();

		phase = 'companies';
		companiesStore.load();

		phase = 'sync';
		await Promise.race([
			syncStore.load(),
			new Promise<void>((resolve) => setTimeout(resolve, 3_000))
		]);

		phase = 'ready';
	} catch (err) {
		console.error('[BootPhase] Boot failed:', err);
		bootError = err instanceof Error ? err.message : 'Boot failed';
		phase = 'error';
	}
}

function retry(): void {
	phase = 'idle';
	bootError = null;
	boot();
}

export const bootPhaseStore = {
	get phase() {
		return phase;
	},
	get isReady() {
		return phase === 'ready';
	},
	get isError() {
		return phase === 'error';
	},
	get error() {
		return bootError;
	},
	boot,
	retry
};
