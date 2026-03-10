/**
 * Shared clipboard utility
 * Centralizes navigator.clipboard.writeText with optional toast feedback.
 */

import { toastStore } from '$stores/toast.svelte';

/**
 * Copy text to the clipboard.
 *
 * @param text           The string to copy.
 * @param successMessage Toast message on success. Pass `false` to suppress the toast entirely (silent copy).
 * @param duration       Toast duration in ms (default 1500).
 * @returns `true` if the copy succeeded, `false` otherwise.
 */
export async function copyToClipboard(
	text: string,
	successMessage: string | false = 'Copied!',
	duration = 1500
): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		if (successMessage !== false) {
			toastStore.success(successMessage, duration);
		}
		return true;
	} catch {
		// Fallback for contexts where Clipboard API is unavailable
		try {
			const textarea = document.createElement('textarea');
			textarea.value = text;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			if (successMessage !== false) {
				toastStore.success(successMessage, duration);
			}
			return true;
		} catch {
			toastStore.error('Failed to copy');
			return false;
		}
	}
}
