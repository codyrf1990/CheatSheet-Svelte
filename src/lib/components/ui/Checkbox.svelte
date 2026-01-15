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
					<path
						d="M4 8H12"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
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
		gap: 0.5rem;
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
	}

	.checkbox-input input {
		position: absolute;
		opacity: 0;
		width: 100%;
		height: 100%;
		cursor: inherit;
	}

	.checkbox-control {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		background: rgba(18, 18, 26, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		transition: all 150ms ease;
	}

	.checkbox-control svg {
		width: 12px;
		height: 12px;
		color: #1a1a1a;
	}

	/* Checked state */
	.checkbox-control.checked,
	.checkbox-control.indeterminate {
		background: #d4af37;
		border-color: #d4af37;
	}

	/* Hover state */
	.checkbox-wrapper:not(.disabled):hover .checkbox-control {
		border-color: rgba(255, 255, 255, 0.4);
	}

	.checkbox-wrapper:not(.disabled):hover .checkbox-control.checked,
	.checkbox-wrapper:not(.disabled):hover .checkbox-control.indeterminate {
		border-color: #e5c55a;
		background: #e5c55a;
	}

	/* Focus state */
	.checkbox-input input:focus-visible + .checkbox-control {
		outline: none;
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.25);
	}

	.checkbox-label {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.9);
	}
</style>
