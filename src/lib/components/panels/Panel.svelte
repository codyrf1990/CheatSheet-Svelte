<script lang="ts">
	import type { Snippet } from 'svelte';

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

<section class="panel" data-panel={id} data-panel-editable={editable ? 'true' : 'false'}>
	<div class="panel-head">
		<button type="button" class="panel-title-btn" onclick={handleCollapseToggle}>
			<svg
				class="collapse-icon"
				class:rotated={collapsed}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M19 9l-7 7-7-7" />
			</svg>
			<h2 class="panel-title">{title}</h2>
		</button>
		{#if editable}
			<div class="panel-controls">
				<button
					type="button"
					class="panel-control-btn"
					onclick={handleAddClick}
					aria-label="Add item to {title}"
				>
					+
				</button>
				<button
					type="button"
					class="panel-control-btn"
					class:active={removeMode}
					onclick={handleRemoveToggle}
					aria-pressed={removeMode}
					aria-label="Toggle delete mode for {title}"
				>
					&minus;
				</button>
			</div>
		{/if}
	</div>
	{#if !collapsed}
		<div class="panel-body">
			{@render children()}
		</div>
	{/if}
</section>

<style>
	.panel {
		/* Smoked glass styling */
		background: linear-gradient(135deg, rgba(28, 28, 28, 0.94) 0%, rgba(12, 12, 12, 0.92) 100%);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.04);
		border-radius: 12px;
		box-shadow:
			0 25px 50px rgba(0, 0, 0, 0.4),
			0 10px 20px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.03);
		overflow: hidden;
	}

	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.3rem 0.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.panel-title-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0;
		background: transparent;
		border: none;
		cursor: pointer;
	}

	.collapse-icon {
		width: 16px;
		height: 16px;
		color: rgba(255, 255, 255, 0.5);
		transition: transform 200ms ease;
	}

	.collapse-icon.rotated {
		transform: rotate(-90deg);
	}

	.panel-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.panel-controls {
		display: flex;
		gap: 0.25rem;
	}

	.panel-control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		padding: 0;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.7);
		font-size: 1.1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.panel-control-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
	}

	.panel-control-btn.active {
		background: rgba(200, 16, 46, 0.2);
		border-color: rgba(200, 16, 46, 0.4);
		color: #ff6666;
	}

	.panel-body {
		padding: 0.25rem 0.375rem;
	}

	/* Double reduction for maintenance panels (-20% of -20%) */
	.panel[data-panel="maintenance-combined"] .panel-head,
	.panel[data-panel="maintenance-skus"] .panel-head,
	.panel[data-panel="solidworks-maintenance"] .panel-head {
		padding: 0.24rem 0.4rem;
		gap: 0.2rem;
	}

	.panel[data-panel="maintenance-combined"] .panel-title,
	.panel[data-panel="maintenance-skus"] .panel-title,
	.panel[data-panel="solidworks-maintenance"] .panel-title {
		font-size: 0.7rem;
	}

	.panel[data-panel="maintenance-combined"] .panel-body,
	.panel[data-panel="maintenance-skus"] .panel-body,
	.panel[data-panel="solidworks-maintenance"] .panel-body {
		padding: 0.2rem 0.3rem;
	}

	.panel[data-panel="maintenance-combined"] .panel-control-btn,
	.panel[data-panel="maintenance-skus"] .panel-control-btn,
	.panel[data-panel="solidworks-maintenance"] .panel-control-btn {
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
			font-size: 0.75rem;
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
			font-size: 0.65rem;
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
			font-size: 0.55rem;
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
