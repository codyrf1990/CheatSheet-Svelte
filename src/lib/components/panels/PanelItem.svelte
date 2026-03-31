<script lang="ts">
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
				<svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11" aria-hidden="true">
					<path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z"/>
				</svg>
			</span>
		{/if}
	</div>
	{#if removeMode && isCustom}
		<button type="button" class="item-remove-btn" onclick={handleRemove} aria-label="Remove {item}" use:tooltip={'Remove ' + item}>
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
		border-radius: var(--radius-2xs);
		transition: background-color 150ms ease;
	}

	.panel-item:hover {
		background: var(--chip-bg-hover);
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
		background: transparent;
		border: 1px solid var(--chip-border-color);
		border-radius: var(--radius-2xs);
		background: var(--chip-bg);
		box-shadow: var(--chip-shadow);
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-xs);
		color: var(--chip-text-color);
		line-height: 1.2;
		cursor: pointer;
		transition: all 150ms ease;
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
		width: 12px;
		height: 12px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-2xs);
		color: rgba(255, 255, 255, 0.4);
		font-size: var(--text-xs);
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
