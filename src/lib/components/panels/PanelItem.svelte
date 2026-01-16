<script lang="ts">
	import { Checkbox } from '$components/ui';
	import { toastStore } from '$stores/toast.svelte';

	interface Props {
		item: string;
		checked?: boolean;
		showCheckbox?: boolean;
		removeMode?: boolean;
		draggable?: boolean;
		isCustom?: boolean;
		onToggle?: () => void;
		onRemove?: () => void;
		ondragstart?: (e: DragEvent) => void;
		ondragover?: (e: DragEvent) => void;
		ondrop?: (e: DragEvent) => void;
	}

	let {
		item,
		checked = false,
		showCheckbox = false,
		removeMode = false,
		draggable = false,
		isCustom = false,
		onToggle,
		onRemove,
		ondragstart,
		ondragover,
		ondrop
	}: Props = $props();

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(item);
			toastStore.success('Copied!', 1500);
		} catch {
			toastStore.error('Failed to copy');
		}
	}

	function handleCheckboxChange() {
		onToggle?.();
	}

	function handleRemove() {
		onRemove?.();
	}
</script>

<li
	class="panel-item"
	class:remove-mode={removeMode && isCustom}
	class:custom={isCustom}
	data-sortable-item
	draggable={draggable && !removeMode}
	{ondragstart}
	{ondragover}
	{ondrop}
>
	<div class="panel-item-main">
		{#if showCheckbox}
			<Checkbox {checked} onchange={handleCheckboxChange} />
		{/if}
		<button type="button" class="item-text" class:custom={isCustom} onclick={handleCopy}>
			{#if isCustom}<span class="custom-indicator">+</span>{/if}{item}
		</button>
	</div>
	{#if removeMode && isCustom}
		<button type="button" class="item-remove-btn" onclick={handleRemove} aria-label="Remove {item}">
			&times;
		</button>
	{/if}
</li>

<style>
	.panel-item {
		display: flex;
		align-items: center;
		padding: var(--space-px) var(--space-0);
		gap: var(--space-0);
		border-radius: 3px;
		transition: background-color 150ms ease;
	}

	.panel-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.panel-item[draggable='true'] {
		cursor: grab;
	}

	.panel-item[draggable='true']:active {
		cursor: grabbing;
	}

	.panel-item.remove-mode {
		background: rgba(200, 16, 46, 0.05);
	}

	.panel-item-main {
		display: flex;
		align-items: center;
		gap: var(--space-0);
		flex: 1;
		min-width: 0;
	}

	.item-text {
		padding: var(--space-0) var(--space-0-5);
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.9);
		cursor: pointer;
		transition: all 150ms ease;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: left;
	}

	.item-text:hover {
		color: var(--color-solidcam-gold, #d4af37);
	}

	.item-text.custom {
		border-color: rgba(212, 175, 55, 0.3);
		background: rgba(212, 175, 55, 0.05);
	}

	.custom-indicator {
		color: var(--color-solidcam-gold, #d4af37);
		font-weight: 600;
		margin-right: 2px;
	}

	.item-remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 12px;
		height: 12px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 2px;
		color: rgba(255, 255, 255, 0.4);
		font-size: var(--text-2xs);
		cursor: pointer;
		transition: all 150ms ease;
		flex-shrink: 0;
	}

	.item-remove-btn:hover {
		background: rgba(200, 16, 46, 0.3);
		color: #ff4444;
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.panel-item {
			padding: var(--space-px);
			gap: var(--space-px);
		}

		.item-text {
			font-size: var(--text-2xs);
			padding: var(--space-px) var(--space-0);
		}

		.item-remove-btn {
			width: 12px;
			height: 12px;
			font-size: var(--text-2xs);
		}
	}

	@media (max-width: 640px) {
		.panel-item {
			padding: var(--space-px);
			gap: var(--space-px);
		}

		.item-text {
			font-size: var(--text-2xs);
			padding: var(--space-px) var(--space-0);
		}

		.item-remove-btn {
			width: 10px;
			height: 10px;
			font-size: var(--text-2xs);
		}
	}

	@media (max-width: 500px) {
		.panel-item {
			padding: var(--space-px);
		}

		.item-text {
			font-size: var(--text-2xs);
			padding: var(--space-px) var(--space-0);
		}

		.item-remove-btn {
			width: 12px;
			height: 12px;
			font-size: var(--text-2xs);
		}
	}
</style>
