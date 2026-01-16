<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label?: string;
		error?: string;
		hint?: string;
		value?: string;
		showRequired?: boolean;
	}

	let {
		label,
		error,
		hint,
		class: className = '',
		id,
		value = $bindable(''),
		showRequired = false,
		...rest
	}: Props = $props();

	let inputId = $derived(id || crypto.randomUUID());
	let errorId = $derived(`${inputId}-error`);
	let hintId = $derived(`${inputId}-hint`);
	let isRequired = $derived(rest.required || showRequired);

	// Build aria-describedby combining hint and error
	let ariaDescribedBy = $derived.by(() => {
		const ids: string[] = [];
		if (hint) ids.push(hintId);
		if (error) ids.push(errorId);
		return ids.length > 0 ? ids.join(' ') : undefined;
	});
</script>

<div class="input-wrapper {className}" class:has-error={error}>
	{#if label}
		<label for={inputId} class="input-label">
			{label}
			{#if isRequired}
				<span class="required-indicator" aria-hidden="true">*</span>
				<span class="sr-only">(required)</span>
			{/if}
		</label>
	{/if}

	<input
		id={inputId}
		class="input-field"
		class:has-error={error}
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={ariaDescribedBy}
		{...rest}
	/>

	<div class="feedback-space">
		{#if hint}
			<span id={hintId} class="input-hint">{hint}</span>
		{/if}

		{#if error}
			<span id={errorId} class="input-error" role="alert">{error}</span>
		{/if}
	</div>
</div>

<style>
	.input-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.input-label {
		font-size: var(--text-lg);
		font-weight: 500;
		color: rgba(255, 255, 255, 0.7);
	}

	.input-field {
		width: 100%;
		padding: calc(var(--space-2) + var(--space-0)) calc(var(--space-3) + var(--space-0));
		font-size: var(--text-xl);
		color: #f5f5f5;
		background-color: rgba(18, 18, 26, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
		transition: all 150ms ease;
	}

	.input-field::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	/* Screen reader only */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
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

	.feedback-space {
		min-height: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.input-hint {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.5);
	}

	.input-error {
		font-size: var(--text-sm);
		color: #ef4444;
	}

	.required-indicator {
		color: #ef4444;
		font-weight: 600;
		margin-left: var(--space-1);
	}

	/* Enhanced error state with red left border */
	.has-error .input-field {
		border-color: #ef4444;
		border-left: 3px solid #ef4444;
		padding-left: calc(var(--space-3) + var(--space-0) - 2px);
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
