<script lang="ts">
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

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleCopy();
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
				<span
					class="bit-text"
					class:custom={isCustom}
					role="button"
					tabindex="0"
					onclick={handleCopy}
					onkeydown={handleKeydown}
					data-copyable-bit
					>{#if justCopied}<span class="copy-check">&#10003;</span>{:else}{#if isCustom}<span
								class="custom-indicator">+</span
							>{/if}{bit}{/if}</span
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
			<span
				class="bit-text"
				class:custom={isCustom}
				role="button"
				tabindex="0"
				onclick={handleCopy}
				onkeydown={handleKeydown}
				data-copyable-bit
				>{#if justCopied}<span class="copy-check">&#10003;</span>{:else}{#if isCustom}<span
							class="custom-indicator">+</span
						>{/if}{bit}{/if}</span
			>
		</div>
	{/if}
	{#if removeMode && isCustom}
		<button type="button" class="bit-remove-btn" onclick={handleRemove} aria-label="Remove {bit}" use:tooltip={'Remove ' + bit}>
			&times;
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
		transition: background-color 150ms ease;
	}

	.loose-bit:hover {
		background-color: var(--chip-bg-hover);
		border-color: var(--chip-border-color-strong);
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
		line-height: 1.2;
		cursor: pointer;
		transition: color 150ms ease;
	}

	.bit-text:hover {
		color: var(--chip-text-hover);
	}

	.bit-text.custom {
		color: var(--color-solidcam-gold, #d4af37);
	}

	.copy-check {
		color: var(--color-success, #22c55e);
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
		width: 14px;
		height: 14px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-2xs);
		color: rgba(255, 255, 255, 0.4);
		font-size: var(--text-sm);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.bit-remove-btn:hover {
		background: rgba(200, 16, 46, 0.2);
		color: var(--color-solidcam-red);
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
			font-size: var(--text-xs);
		}

		.bit-remove-btn {
			width: 12px;
			height: 12px;
			font-size: var(--text-xs);
		}
	}
</style>
