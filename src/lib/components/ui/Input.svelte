<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label?: string;
		error?: string;
		value?: string;
		showRequired?: boolean;
	}

	let { label, error, class: className = '', id, value = $bindable(''), showRequired = false, ...rest }: Props = $props();

	let inputId = $derived(id || crypto.randomUUID());
	let isRequired = $derived(rest.required || showRequired);
</script>

<div class="input-wrapper {className}" class:has-error={error}>
	{#if label}
		<label for={inputId} class="input-label">
			{label}
			{#if isRequired}
				<span class="required-indicator">*</span>
			{/if}
		</label>
	{/if}

	<input id={inputId} class="input-field" class:has-error={error} bind:value {...rest} />

	{#if error}
		<span class="input-error" role="alert">{error}</span>
	{/if}
</div>

<style>
	.input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.7);
	}

	.input-field {
		width: 100%;
		padding: 0.625rem 0.875rem;
		font-size: 1rem;
		color: #f5f5f5;
		background-color: rgba(18, 18, 26, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
		transition: all 150ms ease;
	}

	.input-field::placeholder {
		color: rgba(255, 255, 255, 0.35);
	}

	.input-field:focus {
		outline: none;
		border-color: #d4af37;
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
		transform: scale(1.01);
	}

	.input-field.has-error {
		border-color: #ef4444;
	}

	.input-error {
		font-size: 0.75rem;
		color: #ef4444;
	}

	.required-indicator {
		color: #ef4444;
		font-weight: 600;
		margin-left: 0.25rem;
	}

	/* Enhanced error state with red left border */
	.has-error .input-field {
		border-color: #ef4444;
		border-left: 3px solid #ef4444;
		padding-left: calc(0.875rem - 2px);
	}

	.has-error .input-field:focus {
		border-color: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
	}

	/* Disabled state */
	.input-field:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: rgba(18, 18, 26, 0.5);
	}
</style>
