<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { X } from 'lucide-svelte';
	import { tooltip } from '$lib/utils/tooltipAction';

	interface Props {
		open: boolean;
		onClose: () => void;
		title: string;
		children: Snippet;
		footer?: Snippet;
		size?: 'default' | 'wide' | 'full';
	}

	let { open = $bindable(), onClose, title, children, footer, size = 'default' }: Props = $props();

	// Unique per instance — a static id would collide when multiple modals exist
	const uid = $props.id();
	const titleId = `modal-title-${uid}`;

	let modalRef: HTMLElement | null = $state(null);
	let previouslyFocusedElement: HTMLElement | null = null;

	// Focusable elements selector
	const FOCUSABLE_SELECTOR =
		'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

	// Store previously focused element, lock scroll, and focus first body element when modal opens
	$effect(() => {
		let cancelled = false;

		if (open) {
			previouslyFocusedElement = document.activeElement as HTMLElement;
			document.body.style.overflow = 'hidden';

			// Focus first focusable element inside .modal-body (not the close button)
			tick().then(() => {
				if (cancelled) return;
				if (modalRef) {
					const body = modalRef.querySelector<HTMLElement>('.modal-body');
					const target = body?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
					if (target) {
						target.focus();
					} else {
						// Fallback: focus first focusable anywhere in modal
						const fallback = modalRef.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
						if (fallback.length > 0) {
							fallback[0].focus();
						} else {
							// Nothing focusable at all — focus the container so keyboard
							// users aren't stranded behind the overlay
							console.warn('[Modal] No focusable element found; focusing modal container');
							modalRef.focus();
						}
					}
				}
			});
		} else {
			document.body.style.overflow = '';
			// Return focus when modal closes
			if (previouslyFocusedElement) {
				previouslyFocusedElement.focus();
				previouslyFocusedElement = null;
			}
		}

		// Cleanup: restore scroll and cancel pending focus
		return () => {
			cancelled = true;
			if (open) document.body.style.overflow = '';
		};
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
			return;
		}

		// Focus trap: Tab key handling
		if (e.key === 'Tab' && modalRef) {
			const focusableElements = modalRef.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			// Shift + Tab on first element -> go to last
			if (e.shiftKey && document.activeElement === firstElement) {
				e.preventDefault();
				lastElement.focus();
			}
			// Tab on last element -> go to first
			else if (!e.shiftKey && document.activeElement === lastElement) {
				e.preventDefault();
				firstElement.focus();
			}
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" transition:fade={{ duration: 200 }} onclick={handleBackdropClick}>
		<div
			class="modal"
			class:wide={size === 'wide'}
			class:full={size === 'full'}
			bind:this={modalRef}
			transition:scale={{ start: 0.92, duration: 320, easing: backOut }}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			tabindex="-1"
		>
			<div class="modal-header">
				<h2 id={titleId} class="modal-title">{title}</h2>
				<button class="close-btn" onclick={onClose} aria-label="Close modal" use:tooltip={'Close'}>
					<X size={18} strokeWidth={2.25} />
				</button>
			</div>

			<div class="modal-body">
				{@render children()}
			</div>

			{#if footer}
				<div class="modal-footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		background: radial-gradient(
			ellipse at center,
			rgba(0, 0, 0, 0.65) 0%,
			rgba(0, 0, 0, 0.85) 100%
		);
		/* Desaturate the app behind so the modal owns the stage */
		backdrop-filter: blur(10px) saturate(0.55);
		-webkit-backdrop-filter: blur(10px) saturate(0.55);
	}

	.modal {
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;

		background: var(--modal-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: var(--modal-border);
		border-radius: var(--modal-radius);
		box-shadow: var(--modal-shadow), var(--elev-3);
	}

	.modal-body {
		flex: 1 1 auto;
		overflow-y: auto;
		min-height: 0;
	}

	.modal.wide {
		max-width: min(70vw, 720px);
		max-height: min(85vh, 900px);
	}

	@media (max-width: 768px) {
		.modal.wide {
			max-width: 96vw;
			max-height: 92vh;
		}
	}

	.modal.full {
		max-width: 95vw;
		width: 95vw;
		max-height: 90vh;
	}

	.modal.full .modal-body {
		padding: var(--space-4) calc(var(--space-4) + var(--space-2));
	}

	.modal-header {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: calc(var(--space-4) + var(--space-1)) calc(var(--space-4) + var(--space-2));
		background: var(--tile-header-bg);
		border-bottom: var(--tile-header-border);
		flex-shrink: 0;
	}

	/* Gold hairline accent under the header */
	.modal-header::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -1px;
		height: 1px;
		background: linear-gradient(90deg, var(--gold-a30), var(--gold-a05) 40%, transparent 70%);
		pointer-events: none;
	}

	.modal-title {
		font-size: var(--modal-title-size);
		font-weight: var(--modal-title-weight);
		letter-spacing: var(--modal-title-tracking);
		color: var(--tile-title-color);
		margin: 0;
	}

	.close-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: 1px solid transparent;
		background: var(--chip-bg);
		color: rgba(255, 255, 255, 0.55);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			background 150ms var(--ease-out-quart),
			border-color 150ms var(--ease-out-quart),
			color 150ms var(--ease-out-quart),
			transform 150ms var(--ease-out-quart);
	}

	.close-btn::after {
		content: '';
		position: absolute;
		inset: 50% auto auto 50%;
		width: 44px;
		height: 44px;
		transform: translate(-50%, -50%);
	}

	.close-btn:hover {
		background: var(--red-a20);
		border-color: var(--red-a30);
		color: #fca5a5;
		transform: rotate(90deg);
	}

	.modal-body {
		padding: calc(var(--space-4) + var(--space-2));
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding: var(--space-4) calc(var(--space-4) + var(--space-2));
		background: var(--tile-header-bg);
		border-top: var(--tile-header-border);
		flex-shrink: 0;
	}
</style>
