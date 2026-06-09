<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'type'> {
		checked?: boolean;
		indeterminate?: boolean;
		label?: string;
	}

	let {
		checked = $bindable(false),
		indeterminate = false,
		label,
		disabled = false,
		id,
		class: className = '',
		...rest
	}: Props = $props();

	let inputRef: HTMLInputElement | null = $state(null);
	let inputId = $derived(id || crypto.randomUUID());

	// Sync indeterminate property to DOM (can't be set via attribute)
	$effect(() => {
		if (inputRef) {
			inputRef.indeterminate = indeterminate;
		}
	});

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		checked = target.checked;
	}
</script>

<label class="checkbox-wrapper {className}" class:disabled>
	<span class="checkbox-input">
		<input
			bind:this={inputRef}
			type="checkbox"
			id={inputId}
			{checked}
			{disabled}
			onchange={handleChange}
			{...rest}
		/>
		<span class="checkbox-control" class:checked class:indeterminate>
			{#if checked && !indeterminate}
				<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M3 8L6.5 11.5L13 4.5"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{:else if indeterminate}
				<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M4 8H12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				</svg>
			{/if}
		</span>
	</span>
	{#if label}
		<span class="checkbox-label">{label}</span>
	{/if}
</label>

<style>
	.checkbox-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		cursor: pointer;
		user-select: none;
	}

	.checkbox-wrapper.disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.checkbox-input {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
	}

	.checkbox-input input {
		position: absolute;
		opacity: 0;
		width: 100%;
		height: 100%;
		cursor: inherit;
	}

	.checkbox-control {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: rgba(18, 18, 26, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.4);
		border-radius: var(--radius-xs);
		transition: all 150ms ease;
		flex-shrink: 0;
		pointer-events: none;
	}

	.checkbox-control::after {
		content: '';
		position: absolute;
		inset: 50% auto auto 50%;
		width: 44px;
		height: 44px;
		transform: translate(-50%, -50%);
	}

	.checkbox-control svg {
		width: 10px;
		height: 10px;
		color: var(--color-on-gold);
	}

	/* Checked state — lit up so selections pop out of the sea of checkboxes */
	.checkbox-control.checked,
	.checkbox-control.indeterminate {
		background: var(--gradient-gold);
		border-color: var(--color-solidcam-gold);
		box-shadow:
			0 0 9px rgba(212, 175, 55, 0.5),
			0 0 3px rgba(212, 175, 55, 0.4);
		animation: checkPop 280ms var(--ease-spring);
	}

	@keyframes checkPop {
		0% {
			transform: scale(0.8);
		}
		55% {
			transform: scale(1.14);
		}
		100% {
			transform: scale(1);
		}
	}

	/* Hover state */
	.checkbox-wrapper:not(.disabled):hover .checkbox-control {
		border-color: rgba(255, 255, 255, 0.4);
	}

	.checkbox-wrapper:not(.disabled):hover .checkbox-control.checked,
	.checkbox-wrapper:not(.disabled):hover .checkbox-control.indeterminate {
		border-color: #e5c55a;
		filter: brightness(1.1);
	}

	/* Focus state */
	.checkbox-input input:focus-visible + .checkbox-control {
		outline: 2px solid var(--color-solidcam-gold);
		outline-offset: 2px;
		box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.2);
	}

	.checkbox-label {
		font-size: var(--text-lg);
		color: rgba(255, 255, 255, 0.9);
	}

	/* Narrow viewport — visible checkbox shrinks with the surrounding text.
	   The 44x44 ::after hit area stays full-size so touch targets are
	   preserved. */
	@media (max-width: 768px) {
		.checkbox-input {
			width: 18px;
			height: 18px;
		}

		.checkbox-control {
			width: 14px;
			height: 14px;
		}

		.checkbox-control svg {
			width: 8px;
			height: 8px;
		}
	}

	@media (max-width: 640px) {
		.checkbox-input {
			width: 14px;
			height: 14px;
		}

		.checkbox-control {
			width: 12px;
			height: 12px;
			border-radius: 2px;
		}

		.checkbox-control svg {
			width: 7px;
			height: 7px;
			stroke-width: 2.5;
		}
	}
</style>
