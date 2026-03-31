<script lang="ts">
	import { Checkbox, Tooltip } from '$components/ui';
	import { packagesStore } from '$stores/packages.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { copyToClipboard } from '$lib/utils/clipboard';

	interface Props {
		bit: string;
		packageCode: string;
		masterId: string;
		isCustom?: boolean;
		disabled?: boolean;
		disabledReason?: string;
	}

	let {
		bit,
		packageCode,
		masterId,
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
		const ok = await copyToClipboard(bit, false);
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
</script>

<li
	class="sub-bit"
	class:custom={isCustom}
	class:disabled-bit={disabled}
	data-bit={bit}
	data-parent={masterId}
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
</li>

<style>
	.sub-bit {
		display: flex;
		align-items: center;
		gap: var(--space-0);
		padding: var(--space-0) var(--space-1);
		border-radius: var(--radius-2xs);
		border: 1px solid transparent;
		transition: background-color 150ms ease;
		min-width: 0;
	}

	.sub-bit:hover {
		background-color: var(--chip-bg-hover);
		border-color: var(--chip-border-color);
		box-shadow: var(--chip-shadow);
	}

	.sub-bit.disabled-bit {
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
		gap: var(--space-0-5);
		flex: 1;
		min-width: 0;
	}

	.bit-text {
		font-size: var(--text-xs);
		color: var(--chip-text-color);
		line-height: 1.2;
		cursor: pointer;
		transition: color 150ms ease;
		word-break: break-word;
	}

	.bit-text:hover {
		color: var(--chip-text-hover);
	}

	.copy-check {
		color: var(--color-success, #22c55e);
	}

	.bit-text.custom {
		color: var(--color-solidcam-gold, #d4af37);
	}

	.custom-indicator {
		font-weight: 600;
		margin-right: 2px;
	}

	.sub-bit.custom {
		border-color: rgba(212, 175, 55, 0.3);
		background: rgba(212, 175, 55, 0.08);
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.sub-bit {
			padding: var(--space-px) var(--space-0);
			gap: var(--space-px);
		}

		.bit-row {
			gap: var(--space-0);
		}

		.bit-text {
			font-size: var(--text-xs);
		}
	}

	@media (max-width: 640px) {
		.sub-bit {
			padding: var(--space-px) var(--space-0);
		}

		.bit-row {
			gap: var(--space-0);
		}

		.bit-text {
			font-size: var(--text-xs);
		}
	}
</style>
