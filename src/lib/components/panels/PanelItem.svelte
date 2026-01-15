<script lang="ts">
	import { Checkbox } from '$components/ui';
	import { toastStore } from '$stores/toast.svelte';

	interface Props {
		item: string;
		checked?: boolean;
		showCheckbox?: boolean;
		removeMode?: boolean;
		draggable?: boolean;
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
	class:remove-mode={removeMode}
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
		<button type="button" class="item-text" onclick={handleCopy}>{item}</button>
	</div>
	{#if removeMode}
		<button type="button" class="item-remove-btn" onclick={handleRemove} aria-label="Remove {item}">
			&times;
		</button>
	{/if}
</li>

<style>
	.panel-item {
		display: flex;
		align-items: center;
		padding: 0.05rem 0.1rem;
		gap: 0.1rem;
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
		gap: 0.1rem;
		flex: 1;
		min-width: 0;
	}

	.item-text {
		padding: 0.1rem 0.2rem;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.6rem;
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
		font-size: 0.6rem;
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
			padding: 0.04rem 0.075rem;
			gap: 0.075rem;
		}

		.item-text {
			font-size: 0.45rem;
			padding: 0.03rem 0.1rem;
		}

		.item-remove-btn {
			width: 10px;
			height: 10px;
			font-size: 0.5rem;
		}
	}

	@media (max-width: 640px) {
		.panel-item {
			padding: 0.03rem 0.05rem;
			gap: 0.05rem;
		}

		.item-text {
			font-size: 0.4rem;
			padding: 0.02rem 0.075rem;
		}

		.item-remove-btn {
			width: 8px;
			height: 8px;
			font-size: 0.4rem;
		}
	}

	@media (max-width: 500px) {
		.panel-item {
			padding: 0.02rem 0.04rem;
		}

		.item-text {
			font-size: 0.35rem;
			padding: 0.015rem 0.05rem;
		}

		.item-remove-btn {
			width: 6px;
			height: 6px;
			font-size: 0.3rem;
		}
	}
</style>
