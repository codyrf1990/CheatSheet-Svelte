<script lang="ts">
	import { Info, X } from 'lucide-svelte';
	import { Checkbox } from '$components/ui';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import { tooltip } from '$lib/utils/tooltipAction';

	interface Props {
		item: string;
		checked?: boolean;
		showCheckbox?: boolean;
		removeMode?: boolean;
		draggable?: boolean;
		isCustom?: boolean;
		note?: string;
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
		note = '',
		onToggle,
		onRemove,
		ondragstart,
		ondragover,
		ondrop
	}: Props = $props();

	async function handleCopy() {
		await copyToClipboard(item);
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
	class:selected={showCheckbox && checked}
	class:remove-mode={removeMode && isCustom}
	class:custom={isCustom}
	draggable={draggable && !removeMode}
	{ondragstart}
	{ondragover}
	{ondrop}
>
	<div class="panel-item-main">
		{#if showCheckbox}
			<span class="checkbox-wrapper">
				<Checkbox {checked} onchange={handleCheckboxChange} />
			</span>
		{/if}
		<button type="button" class="item-text" class:custom={isCustom} onclick={handleCopy} use:tooltip={note || item}>
			{#if isCustom}<span class="custom-indicator">+</span>{/if}{item}
		</button>
		{#if note}
			<span class="item-note" use:tooltip={note}>
				<Info size={11} strokeWidth={2.25} />
			</span>
		{/if}
	</div>
	{#if removeMode && isCustom}
		<button type="button" class="item-remove-btn" onclick={handleRemove} aria-label="Remove {item}" use:tooltip={'Remove ' + item}>
			<X size={11} strokeWidth={2.5} />
		</button>
	{/if}
</li>

<style>
	.panel-item {
		display: flex;
		align-items: center;
		padding: var(--space-px) var(--space-0);
		gap: var(--space-0);
		border-radius: var(--radius-2xs);
		transition: background-color 150ms var(--ease-out-quart);
	}

	.panel-item:hover {
		background: var(--chip-bg-hover);
	}

	/* Selected state — soft gold tint on the chip's text-button */
	.panel-item.selected .item-text {
		background: var(--gold-a10);
		border-color: var(--gold-a30);
		color: rgba(255, 255, 255, 0.95);
	}

	.panel-item.selected:hover .item-text {
		background: var(--gold-a20);
		border-color: var(--gold-a45);
	}

	.panel-item[draggable='true'] {
		cursor: grab;
		user-select: none;
	}

	.panel-item[draggable='true']:active {
		cursor: grabbing;
		opacity: 0.5;
	}

	.checkbox-wrapper {
		display: flex;
		align-items: center;
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
		background: var(--chip-bg);
		border: 1px solid var(--chip-border-color);
		border-radius: var(--radius-2xs);
		box-shadow: var(--chip-shadow);
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-xs);
		color: var(--chip-text-color);
		line-height: 1.2;
		cursor: pointer;
		transition:
			background 150ms var(--ease-out-quart),
			border-color 150ms var(--ease-out-quart),
			color 150ms var(--ease-out-quart);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: left;
	}

	.item-text:hover {
		color: var(--chip-text-hover);
	}

	.item-text.custom {
		border-color: rgba(212, 175, 55, 0.3);
		background: rgba(212, 175, 55, 0.08);
	}

	.custom-indicator {
		color: var(--color-solidcam-gold, #d4af37);
		font-weight: 600;
		margin-right: 2px;
	}

	.item-note {
		display: flex;
		align-items: center;
		color: rgba(96, 165, 250, 0.6);
		cursor: help;
		flex-shrink: 0;
		transition: color 150ms ease;
	}

	.item-note:hover {
		color: rgba(96, 165, 250, 1);
	}

	.item-remove-btn {
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
		flex-shrink: 0;
	}

	.item-remove-btn:hover {
		background: var(--red-a20);
		color: #fca5a5;
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.panel-item {
			padding: var(--space-px);
			gap: var(--space-px);
		}

		.item-text {
			font-size: var(--text-xs);
			padding: var(--space-px) var(--space-0);
		}

		.item-remove-btn {
			width: 12px;
			height: 12px;
			font-size: var(--text-xs);
		}
	}

	@media (max-width: 640px) {
		.panel-item {
			padding: var(--space-px);
			gap: var(--space-px);
		}

		.item-text {
			font-size: var(--text-xs);
			padding: var(--space-px) var(--space-0);
		}

		.item-remove-btn {
			width: 10px;
			height: 10px;
			font-size: var(--text-xs);
		}
	}

	@media (max-width: 500px) {
		.panel-item {
			padding: var(--space-px);
		}

		.item-text {
			font-size: var(--text-xs);
			padding: var(--space-px) var(--space-0);
		}

		.item-remove-btn {
			width: 12px;
			height: 12px;
			font-size: var(--text-xs);
		}
	}
</style>
