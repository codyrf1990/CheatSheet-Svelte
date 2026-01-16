<script lang="ts">
	import { Checkbox } from '$components/ui';
	import { packagesStore } from '$stores/packages.svelte';
	import { userPrefsStore } from '$stores/userPrefs.svelte';
	import { toastStore } from '$stores/toast.svelte';

	interface Props {
		bit: string;
		packageCode: string;
		editMode?: boolean;
		removeMode?: boolean;
		isCustom?: boolean;
		draggable?: boolean;
		ondragstart?: (e: DragEvent) => void;
		ondragover?: (e: DragEvent) => void;
		ondrop?: (e: DragEvent) => void;
	}

	let {
		bit,
		packageCode,
		editMode = false,
		removeMode = false,
		isCustom = false,
		draggable = false,
		ondragstart,
		ondragover,
		ondrop
	}: Props = $props();

	let isSelected = $derived(packagesStore.isBitSelected(packageCode, bit));

	function handleToggle() {
		packagesStore.toggleBit(packageCode, bit);
	}

	async function handleCopy() {
		if (editMode) return;
		try {
			await navigator.clipboard.writeText(bit);
			toastStore.success('Copied!', 1500);
		} catch {
			toastStore.error('Failed to copy');
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleCopy();
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
	data-sortable-item
	data-bit={bit}
	draggable={draggable && editMode}
	{ondragstart}
	{ondragover}
	{ondrop}
>
	<label class="bit-label">
		<Checkbox checked={isSelected} onchange={handleToggle} />
		<span
			class="bit-text"
			class:custom={isCustom}
			role="button"
			tabindex="0"
			onclick={handleCopy}
			onkeydown={handleKeydown}
			data-copyable-bit
			>{#if isCustom}<span class="custom-indicator">+</span>{/if}{bit}</span
		>
	</label>
	{#if (editMode || removeMode) && isCustom}
		<button type="button" class="bit-remove-btn" onclick={handleRemove} aria-label="Remove {bit}">
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
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		transition: background-color 150ms ease;
	}

	.loose-bit:hover {
		background-color: rgba(255, 255, 255, 0.06);
	}

	.loose-bit[draggable='true'] {
		cursor: grab;
	}

	.loose-bit[draggable='true']:active {
		cursor: grabbing;
	}

	.bit-label {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		flex: 1;
		cursor: pointer;
	}

	.bit-text {
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.85);
		cursor: pointer;
		transition: color 150ms ease;
	}

	.bit-text:hover {
		color: var(--color-solidcam-gold, #d4af37);
	}

	.bit-text.custom {
		color: var(--color-solidcam-gold, #d4af37);
	}

	.custom-indicator {
		font-weight: 600;
		margin-right: 2px;
	}

	.loose-bit.custom {
		border-color: rgba(212, 175, 55, 0.3);
		background: rgba(212, 175, 55, 0.05);
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
		border-radius: 3px;
		color: rgba(255, 255, 255, 0.4);
		font-size: var(--text-sm);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.bit-remove-btn:hover {
		background: rgba(200, 16, 46, 0.2);
		color: #c8102e;
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.loose-bit {
			padding: var(--space-0) var(--space-0-5);
			gap: var(--space-0);
		}

		.bit-label {
			gap: var(--space-0-5);
		}

		.bit-text {
			font-size: var(--text-2xs);
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

		.bit-label {
			gap: var(--space-0-5);
		}

		.bit-text {
			font-size: var(--text-2xs);
		}

		.bit-remove-btn {
			width: 12px;
			height: 12px;
			font-size: var(--text-2xs);
		}
	}
</style>
