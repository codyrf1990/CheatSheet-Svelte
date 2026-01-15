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
		padding: 0.125rem 0.25rem;
		gap: 0.1875rem;
		border-radius: 999px;
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
		gap: 0.1875rem;
		flex: 1;
		min-width: 0;
	}

	.item-text {
		padding: 0.0625rem 0.25rem;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 999px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.675rem;
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
		width: 18px;
		height: 18px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.4);
		font-size: 1rem;
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
			padding: 0.1rem 0.2rem;
			gap: 0.125rem;
		}

		.item-text {
			font-size: 0.6rem;
			padding: 0.05rem 0.2rem;
		}

		.item-remove-btn {
			width: 16px;
			height: 16px;
			font-size: 0.875rem;
		}
	}

	@media (max-width: 640px) {
		.panel-item {
			padding: 0.075rem 0.15rem;
			gap: 0.1rem;
		}

		.item-text {
			font-size: 0.55rem;
			padding: 0.04rem 0.15rem;
		}

		.item-remove-btn {
			width: 14px;
			height: 14px;
			font-size: 0.75rem;
		}
	}

	@media (max-width: 500px) {
		.panel-item {
			padding: 0.05rem 0.1rem;
		}

		.item-text {
			font-size: 0.5rem;
			padding: 0.03rem 0.1rem;
		}

		.item-remove-btn {
			width: 12px;
			height: 12px;
			font-size: 0.65rem;
		}
	}
</style>
