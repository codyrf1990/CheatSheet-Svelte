<script lang="ts">
	import { Check, X } from 'lucide-svelte';
	import { Checkbox, Tooltip } from '$components/ui';
	import { packagesStore } from '$stores/packages.svelte';
	import { userPrefsStore } from '$stores/userPrefs.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { tooltip } from '$lib/utils/tooltipAction';
	import { copyToClipboard } from '$lib/utils/clipboard';

	interface Props {
		bit: string;
		packageCode: string;
		removeMode?: boolean;
		isCustom?: boolean;
		disabled?: boolean;
		disabledReason?: string;
	}

	let {
		bit,
		packageCode,
		removeMode = false,
		isCustom = false,
		disabled = false,
		disabledReason = ''
	}: Props = $props();

	let isSelected = $derived(packagesStore.isBitSelected(packageCode, bit));
	let justCopied = $state(false);

	function handleToggle() {
		if (disabled) {
			toastStore.warning(disabledReason);
			return;
		}
		packagesStore.toggleBit(packageCode, bit);
	}

	async function handleCopy() {
		const ok = await copyToClipboard(bit);
		if (ok) {
			justCopied = true;
			setTimeout(() => (justCopied = false), 1500);
		}
	}

	function handleWrapperKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleToggle();
		}
	}

	function handleRemove() {
		// Remove custom bits from global user prefs
		userPrefsStore.removeCustomPackageBit(packageCode, bit);
	}
</script>

<li
	class="loose-bit"
	class:custom={isCustom}
	class:selected={isSelected}
	class:remove-mode={removeMode && isCustom}
	class:disabled-bit={disabled}
	data-bit={bit}
>
	{#if disabled && disabledReason}
		<Tooltip text={disabledReason}>
			<div class="bit-row">
				<span
					class="checkbox-wrapper"
					{...disabled ? { role: 'button', tabindex: 0 } : {}}
					onclick={disabled ? handleToggle : undefined}
					onkeydown={disabled ? handleWrapperKeydown : undefined}
				>
					<Checkbox checked={isSelected} onchange={handleToggle} {disabled} />
				</span>
				<button
					type="button"
					class="bit-text"
					class:custom={isCustom}
					onclick={handleCopy}
					data-copyable-bit
					aria-label="Copy {bit}"
					>{#if justCopied}<span class="copy-check"><Check size={11} strokeWidth={3} /></span
						>{:else}{#if isCustom}<span class="custom-indicator">+</span>{/if}{bit}{/if}</button
				>
			</div>
		</Tooltip>
	{:else}
		<div class="bit-row">
			<span
				class="checkbox-wrapper"
				{...disabled ? { role: 'button', tabindex: 0 } : {}}
				onclick={disabled ? handleToggle : undefined}
				onkeydown={disabled ? handleWrapperKeydown : undefined}
			>
				<Checkbox checked={isSelected} onchange={handleToggle} {disabled} />
			</span>
			<button
				type="button"
				class="bit-text"
				class:custom={isCustom}
				onclick={handleCopy}
				data-copyable-bit
				aria-label="Copy {bit}"
				>{#if justCopied}<span class="copy-check">&#10003;</span>{:else}{#if isCustom}<span
							class="custom-indicator">+</span
						>{/if}{bit}{/if}</button
			>
		</div>
	{/if}
	{#if removeMode && isCustom}
		<button
			type="button"
			class="bit-remove-btn"
			onclick={handleRemove}
			aria-label="Remove {bit}"
			use:tooltip={'Remove ' + bit}
		>
			<X size={11} strokeWidth={2.5} />
		</button>
	{/if}
</li>

<style>
	.loose-bit {
		display: flex;
		align-items: center;
		gap: var(--space-0);
		padding: var(--space-0) var(--space-1);
		border-radius: var(--radius-2xs);
		background: var(--chip-bg);
		border: 1px solid var(--chip-border-color);
		box-shadow: var(--chip-shadow);
		transition:
			background-color 150ms var(--ease-out-quart),
			border-color 150ms var(--ease-out-quart);
	}

	.loose-bit:hover {
		background-color: var(--chip-bg-hover);
		border-color: var(--chip-border-color-strong);
	}

	/* Selected state — soft gold tint so checked bits read at a glance */
	.loose-bit.selected {
		background-color: var(--gold-a10);
		border-color: var(--gold-a30);
	}

	.loose-bit.selected:hover {
		background-color: var(--gold-a20);
		border-color: var(--gold-a45);
	}

	.loose-bit.selected .bit-text {
		color: rgba(255, 255, 255, 0.95);
	}

	.loose-bit.disabled-bit {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.checkbox-wrapper {
		display: flex;
		align-items: center;
	}

	.bit-row {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		flex: 1;
		cursor: pointer;
	}

	.bit-text {
		font-size: var(--text-xs);
		color: var(--chip-text-color);
		line-height: 1.25;
		cursor: pointer;
		transition: color 150ms ease;
		/* button reset */
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font-family: inherit;
		text-align: left;
	}

	.bit-text:hover {
		color: var(--chip-text-hover);
	}

	.bit-text.custom {
		color: var(--color-solidcam-gold, #d4af37);
	}

	.copy-check {
		display: inline-flex;
		align-items: center;
		color: var(--color-success, #22c55e);
		filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.35));
	}

	.custom-indicator {
		font-weight: 600;
		margin-right: 2px;
	}

	.loose-bit.custom {
		border-color: rgba(212, 175, 55, 0.3);
		background: rgba(212, 175, 55, 0.08);
	}

	.bit-remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-2xs);
		color: rgba(255, 255, 255, 0.4);
		cursor: pointer;
		transition:
			background 150ms var(--ease-out-quart),
			color 150ms var(--ease-out-quart);
	}

	.bit-remove-btn:hover {
		background: var(--red-a20);
		color: #fca5a5;
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.loose-bit {
			padding: var(--space-0) var(--space-0-5);
			gap: var(--space-0);
		}

		.bit-row {
			gap: var(--space-0-5);
		}

		.bit-text {
			font-size: var(--text-xs);
			line-height: 1.25;
		}

		.bit-remove-btn {
			width: 12px;
			height: 12px;
			font-size: var(--text-xs);
		}
	}

	@media (max-width: 640px) {
		.loose-bit {
			padding: var(--space-px) var(--space-0);
		}

		.bit-row {
			gap: var(--space-0-5);
		}

		.bit-text {
			font-size: var(--text-2xs);
			line-height: 1.25;
		}

		.bit-remove-btn {
			width: 12px;
			height: 12px;
			font-size: var(--text-xs);
		}
	}
</style>
