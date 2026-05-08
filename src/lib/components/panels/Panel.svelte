<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronDown, Minus, Plus } from 'lucide-svelte';
	import { CollapseWrapper } from '$components/ui';
	import { tooltip } from '$lib/utils/tooltipAction';

	interface Props {
		id: string;
		title: string;
		editable?: boolean;
		children: Snippet;
		removeMode?: boolean;
		onAddItem?: () => void;
		onToggleRemove?: () => void;
	}

	let {
		id,
		title,
		editable = false,
		children,
		removeMode = false,
		onAddItem,
		onToggleRemove
	}: Props = $props();

	// Local collapsed state
	let collapsed = $state(false);

	function handleCollapseToggle() {
		collapsed = !collapsed;
	}

	function handleAddClick() {
		onAddItem?.();
	}

	function handleRemoveToggle() {
		onToggleRemove?.();
	}
</script>

<section class="panel tile" data-panel={id} data-panel-editable={editable ? 'true' : 'false'}>
	<div class="panel-head">
		<button type="button" class="panel-title-btn" onclick={handleCollapseToggle}>
			<span class="collapse-icon" class:rotated={collapsed} aria-hidden="true">
				<ChevronDown size={14} strokeWidth={2.25} />
			</span>
			<h2 class="panel-title">{title}</h2>
		</button>
		{#if editable}
			<div class="panel-controls">
				<button
					type="button"
					class="panel-control-btn"
					onclick={handleAddClick}
					aria-label="Add item to {title}"
					use:tooltip={'Add item'}
				>
					<Plus size={14} strokeWidth={2.25} />
				</button>
				<button
					type="button"
					class="panel-control-btn"
					class:active={removeMode}
					onclick={handleRemoveToggle}
					aria-pressed={removeMode}
					aria-label="Toggle delete mode for {title}"
					use:tooltip={removeMode ? 'Done removing' : 'Remove items'}
				>
					<Minus size={14} strokeWidth={2.25} />
				</button>
			</div>
		{/if}
	</div>
	<CollapseWrapper open={!collapsed}>
		<div class="panel-body">
			{@render children()}
		</div>
	</CollapseWrapper>
</section>

<style>
	.panel {
		overflow: hidden;
	}

	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.3rem 0.5rem;
		background: var(--tile-header-bg);
		border-bottom: var(--tile-header-border);
	}

	.panel-title-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0;
		min-height: 44px;
		background: transparent;
		border: none;
		cursor: pointer;
	}

	.collapse-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.5);
		transition: transform 200ms var(--ease-out-expo);
	}

	.collapse-icon.rotated {
		transform: rotate(-90deg);
	}

	.panel-title {
		margin: 0;
		font-size: var(--tile-title-size);
		font-weight: var(--tile-title-weight);
		letter-spacing: var(--tile-title-tracking);
		text-transform: uppercase;
		color: var(--tile-title-color);
	}

	.panel-controls {
		display: flex;
		gap: 0.25rem;
	}

	.panel-control-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		padding: 0;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.72);
		cursor: pointer;
		transition:
			background 150ms var(--ease-out-quart),
			border-color 150ms var(--ease-out-quart),
			color 150ms var(--ease-out-quart);
	}

	/* Expand touch target to 44x44 */
	.panel-control-btn::after {
		content: '';
		position: absolute;
		inset: 50% auto auto 50%;
		width: 44px;
		height: 44px;
		transform: translate(-50%, -50%);
	}

	.panel-control-btn:hover {
		background: var(--gold-a10);
		border-color: var(--gold-a30);
		color: var(--color-solidcam-gold);
	}

	.panel-control-btn.active {
		background: var(--red-a20);
		border-color: var(--red-a30);
		color: #fca5a5;
	}

	.panel-control-btn.active:hover {
		background: rgba(200, 16, 46, 0.28);
		border-color: rgba(200, 16, 46, 0.45);
		color: #fecaca;
	}

	.panel-body {
		padding: 0.25rem 0.375rem;
	}

	/* Double reduction for maintenance panels (-20% of -20%) */
	.panel[data-panel='maintenance-combined'] .panel-head,
	.panel[data-panel='maintenance-skus'] .panel-head,
	.panel[data-panel='solidworks-maintenance'] .panel-head {
		padding: 0.24rem 0.4rem;
		gap: 0.2rem;
	}

	.panel[data-panel='maintenance-combined'] .panel-title,
	.panel[data-panel='maintenance-skus'] .panel-title,
	.panel[data-panel='solidworks-maintenance'] .panel-title {
		font-size: 0.7rem;
	}

	.panel[data-panel='maintenance-combined'] .panel-body,
	.panel[data-panel='maintenance-skus'] .panel-body,
	.panel[data-panel='solidworks-maintenance'] .panel-body {
		padding: 0.2rem 0.3rem;
	}

	.panel[data-panel='maintenance-combined'] .panel-control-btn,
	.panel[data-panel='maintenance-skus'] .panel-control-btn,
	.panel[data-panel='solidworks-maintenance'] .panel-control-btn {
		width: 22px;
		height: 22px;
		font-size: 0.9rem;
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.panel-head {
			padding: 0.2rem 0.35rem;
		}

		.panel-title {
			font-size: var(--text-xs);
		}

		.panel-body {
			padding: 0.15rem 0.25rem;
		}

		.panel-control-btn {
			width: 22px;
			height: 22px;
			font-size: 0.9rem;
		}

		.collapse-icon {
			width: 14px;
			height: 14px;
		}
	}

	@media (max-width: 640px) {
		.panel-head {
			padding: 0.15rem 0.25rem;
		}

		.panel-title {
			font-size: var(--text-xs);
		}

		.panel-body {
			padding: 0.1rem 0.15rem;
		}

		.panel-control-btn {
			width: 18px;
			height: 18px;
			font-size: 0.75rem;
			border-radius: 4px;
		}

		.collapse-icon {
			width: 12px;
			height: 12px;
		}

		.panel-title-btn {
			gap: 0.2rem;
		}

		.panel-controls {
			gap: 0.15rem;
		}
	}

	@media (max-width: 500px) {
		.panel-head {
			padding: 0.1rem 0.2rem;
		}

		.panel-title {
			font-size: var(--text-xs);
		}

		.panel-body {
			padding: 0.075rem 0.1rem;
		}

		.panel-control-btn {
			width: 16px;
			height: 16px;
			font-size: 0.65rem;
		}

		.collapse-icon {
			width: 10px;
			height: 10px;
		}
	}
</style>
