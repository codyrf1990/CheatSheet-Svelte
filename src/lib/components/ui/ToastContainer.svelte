<script lang="ts">
	import { toastStore } from '$stores/toast.svelte';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { quintOut, quintIn } from 'svelte/easing';
	import { AlertTriangle, Check, Info, X } from 'lucide-svelte';
	import { tooltip } from '$lib/utils/tooltipAction';
</script>

{#if toastStore.all.length > 0}
	<div class="toast-container" aria-live="polite" aria-atomic="false">
		{#each toastStore.all as t, index (t.id)}
			<!-- Pause auto-dismiss on hover/focus for accessibility (WCAG timing) -->
			<div
				class="toast toast-{t.type}"
				role={t.type === 'error' ? 'alert' : 'status'}
				animate:flip={{ duration: 200 }}
				in:fly={{
					x: 24,
					duration: 250,
					easing: quintOut,
					delay: index * 40
				}}
				out:fly={{
					x: 12,
					duration: 150,
					easing: quintIn
				}}
				onmouseenter={() => toastStore.pause(t.id)}
				onmouseleave={() => toastStore.resume(t.id)}
				onfocusin={() => toastStore.pause(t.id)}
				onfocusout={() => toastStore.resume(t.id)}
			>
				<span class="toast-icon">
					{#if t.type === 'success'}
						<Check size={12} strokeWidth={2.75} />
					{:else if t.type === 'error'}
						<X size={12} strokeWidth={2.75} />
					{:else if t.type === 'warning'}
						<AlertTriangle size={12} strokeWidth={2.5} />
					{:else}
						<Info size={12} strokeWidth={2.5} />
					{/if}
				</span>
				<span class="toast-message">{t.message}</span>
				<button class="toast-close" onclick={() => toastStore.remove(t.id)} aria-label="Dismiss" use:tooltip={'Dismiss'}>
					<X size={11} strokeWidth={2} />
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
		bottom: 1rem;
		right: 1rem;
		z-index: 10000;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		max-width: 260px;
	}

	.toast {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.45rem 0.625rem;
		background: linear-gradient(145deg, rgba(32, 32, 38, 0.98), rgba(24, 24, 30, 0.98));
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
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
		width: 20px;
		height: 20px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.toast-icon :global(svg) {
		flex-shrink: 0;
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
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.3;
	}

	.toast-close {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition:
			background 200ms var(--ease-out-quart),
			color 200ms var(--ease-out-quart),
			transform 200ms var(--ease-out-quart);
		flex-shrink: 0;
	}

	/* Expand touch target to 44x44 */
	.toast-close::after {
		content: '';
		position: absolute;
		inset: 50% auto auto 50%;
		width: 44px;
		height: 44px;
		transform: translate(-50%, -50%);
	}

	.toast-close:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
		transform: rotate(90deg);
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
		background: linear-gradient(90deg, rgba(34, 197, 94, 0.85), rgba(74, 222, 128, 0.85));
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
</style>
