<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	interface Props {
		open: boolean;
		onclose: () => void;
		title: string;
		children: Snippet;
		footer?: Snippet;
		size?: 'default' | 'wide' | 'full';
	}

	let { open = $bindable(), onclose, title, children, footer, size = 'default' }: Props = $props();

	let modalRef: HTMLElement | null = $state(null);
	let previouslyFocusedElement: HTMLElement | null = null;

	// Focusable elements selector
	const FOCUSABLE_SELECTOR =
		'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

	// Store previously focused element and focus first element when modal opens
	$effect(() => {
		let cancelled = false;

		if (open) {
			previouslyFocusedElement = document.activeElement as HTMLElement;

			// Focus first focusable element after the modal renders
			// Using tick() ensures DOM is updated before focusing
			tick().then(() => {
				if (cancelled) return;
				if (modalRef) {
					const focusableElements = modalRef.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
					if (focusableElements.length > 0) {
						focusableElements[0].focus();
					}
				}
			});
		} else {
			// Return focus when modal closes
			if (previouslyFocusedElement) {
				previouslyFocusedElement.focus();
				previouslyFocusedElement = null;
			}
		}

		// Cleanup: cancel pending focus if effect re-runs or component unmounts
		return () => {
			cancelled = true;
		};
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
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
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="modal-overlay"
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<div
			class="modal"
			class:wide={size === 'wide'}
			class:full={size === 'full'}
			bind:this={modalRef}
			transition:fly={{ y: 24, duration: 300 }}
		>
			<div class="modal-header">
				<h2 id="modal-title" class="modal-title">{title}</h2>
				<button class="close-btn" onclick={onclose} aria-label="Close modal">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
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
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
	}

	.modal {
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;

		/* Smoked glass */
		background: linear-gradient(135deg, rgba(28, 28, 28, 0.98) 0%, rgba(12, 12, 12, 0.96) 100%);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 18px;
		box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
	}

	.modal.wide {
		max-width: 70vw;
		height: 80vh;
		overflow: hidden;
	}

	.modal.full {
		max-width: 95vw;
		width: 95vw;
		height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal.full .modal-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-4) calc(var(--space-4) + var(--space-2));
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: calc(var(--space-4) + var(--space-1)) calc(var(--space-4) + var(--space-2));
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #f5f5f5;
		margin: 0;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: transparent;
		color: rgba(255, 255, 255, 0.5);
		border-radius: 8px;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
	}

	.modal-body {
		padding: calc(var(--space-4) + var(--space-2));
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding: var(--space-4) calc(var(--space-4) + var(--space-2));
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	/* Scrollbar styling */
	.modal::-webkit-scrollbar {
		width: 8px;
	}

	.modal::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
	}

	.modal::-webkit-scrollbar-thumb {
		background: rgba(212, 175, 55, 0.3);
		border-radius: 4px;
	}

	.modal::-webkit-scrollbar-thumb:hover {
		background: rgba(212, 175, 55, 0.5);
	}
</style>
