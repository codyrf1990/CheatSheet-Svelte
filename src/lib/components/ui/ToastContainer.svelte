<script lang="ts">
	import { onMount } from 'svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { quintOut, quintIn } from 'svelte/easing';

	let prefersReducedMotion = $state(false);

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mediaQuery.matches;

		const handleChange = () => {
			prefersReducedMotion = mediaQuery.matches;
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	});
</script>

{#if toastStore.all.length > 0}
	<div class="toast-container" aria-live="polite" aria-atomic="false">
		{#each toastStore.all as t, index (t.id)}
			<!-- Pause auto-dismiss on hover/focus for accessibility (WCAG timing) -->
			<div
				class="toast toast-{t.type}"
				role={t.type === 'error' ? 'alert' : 'status'}
				animate:flip={{ duration: prefersReducedMotion ? 0 : 200 }}
				in:fly={{
					x: prefersReducedMotion ? 0 : 24,
					duration: prefersReducedMotion ? 0 : 280,
					easing: quintOut,
					delay: prefersReducedMotion ? 0 : index * 40
				}}
				out:fly={{
					x: prefersReducedMotion ? 0 : 12,
					duration: prefersReducedMotion ? 0 : 150,
					easing: quintIn
				}}
				onmouseenter={() => toastStore.pause(t.id)}
				onmouseleave={() => toastStore.resume(t.id)}
				onfocusin={() => toastStore.pause(t.id)}
				onfocusout={() => toastStore.resume(t.id)}
			>
				<span class="toast-icon">
					{#if t.type === 'success'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<polyline points="20 6 9 17 4 12" />
						</svg>
					{:else if t.type === 'error'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					{:else if t.type === 'warning'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<path
								d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
							/>
							<line x1="12" y1="9" x2="12" y2="13" />
							<line x1="12" y1="17" x2="12.01" y2="17" />
						</svg>
					{:else}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="16" x2="12" y2="12" />
							<line x1="12" y1="8" x2="12.01" y2="8" />
						</svg>
					{/if}
				</span>
				<span class="toast-message">{t.message}</span>
				<button class="toast-close" onclick={() => toastStore.remove(t.id)} aria-label="Dismiss">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>

				<!-- Progress bar -->
				<div class="toast-progress">
					<div
						class="toast-progress-fill toast-progress-{t.type}"
						style="animation-duration: {t.duration}ms"
					></div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 10000;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 400px;
	}

	.toast {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.875rem 1rem;
		background: linear-gradient(145deg, rgba(32, 32, 38, 0.98), rgba(24, 24, 30, 0.98));
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.35),
			0 2px 8px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
		backdrop-filter: blur(16px);
		overflow: hidden;
	}

	/* Icon styling */
	.toast-icon {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.toast-icon svg {
		width: 16px;
		height: 16px;
	}

	/* Type-specific icon colors */
	.toast-success .toast-icon {
		background: rgba(34, 197, 94, 0.12);
		color: #22c55e;
	}

	.toast-error .toast-icon {
		background: rgba(239, 68, 68, 0.12);
		color: #ef4444;
	}

	.toast-warning .toast-icon {
		background: rgba(249, 115, 22, 0.12);
		color: #f97316;
	}

	.toast-info .toast-icon {
		background: rgba(212, 175, 55, 0.12);
		color: #d4af37;
	}

	.toast-message {
		flex: 1;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.4;
	}

	.toast-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
		flex-shrink: 0;
	}

	.toast-close svg {
		width: 14px;
		height: 14px;
	}

	.toast-close:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
		transform: scale(1.1);
	}

	.toast-close:active {
		transform: scale(0.95);
	}

	/* Progress bar */
	.toast-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: rgba(255, 255, 255, 0.05);
		overflow: hidden;
	}

	.toast-progress-fill {
		height: 100%;
		width: 100%;
		transform-origin: left;
		animation: progressShrink linear forwards;
	}

	@keyframes progressShrink {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}

	.toast-progress-success {
		background: linear-gradient(90deg, rgba(34, 197, 94, 0.7), rgba(74, 222, 128, 0.7));
	}

	.toast-progress-error {
		background: linear-gradient(90deg, rgba(239, 68, 68, 0.7), rgba(248, 113, 113, 0.7));
	}

	.toast-progress-warning {
		background: linear-gradient(90deg, rgba(245, 158, 11, 0.7), rgba(251, 191, 36, 0.7));
	}

	.toast-progress-info {
		background: linear-gradient(90deg, rgba(212, 175, 55, 0.7), rgba(232, 197, 71, 0.7));
	}

	/* Mobile responsiveness */
	@media (max-width: 480px) {
		.toast-container {
			left: 1rem;
			right: 1rem;
			bottom: 1rem;
			max-width: none;
		}
	}

	/* Pause progress bar on hover/focus */
	.toast:hover .toast-progress-fill,
	.toast:focus-within .toast-progress-fill {
		animation-play-state: paused;
	}

	/* Pause progress bar when tab is hidden */
	:global(.toast-paused) .toast-progress-fill {
		animation-play-state: paused;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.toast-progress-fill {
			animation: none;
			transform: scaleX(1);
		}
	}
</style>
