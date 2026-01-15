<script lang="ts">
	import type { Panel as PanelType } from '$types';
	import { panelsStore } from '$stores/panels.svelte';
	import Panel from './Panel.svelte';
	import PanelItem from './PanelItem.svelte';

	interface Props {
		maintenancePanel: PanelType;
		solidworksPanel: PanelType;
	}

	let { maintenancePanel, solidworksPanel }: Props = $props();

	// Local state
	let removeMode = $state(false);

	// Always show panel's base items
	let maintenanceItems = $derived(() => maintenancePanel.items);
	let solidworksItems = $derived(() => solidworksPanel.items);

	function handleAddMaintenance() {
		const value = prompt('Add a new Maintenance SKU:');
		if (!value) return;
		const text = value.trim();
		if (!text) return;
		panelsStore.addItem(maintenancePanel.id, text);
	}

	function handleAddSolidworks() {
		const value = prompt('Add a new SolidWorks SKU:');
		if (!value) return;
		const text = value.trim();
		if (!text) return;
		panelsStore.addItem(solidworksPanel.id, text);
	}

	function handleToggleRemove() {
		removeMode = !removeMode;
	}

	function handleItemToggle(panelId: string, item: string) {
		panelsStore.toggleItem(panelId, item);
	}

	function handleItemRemove(panelId: string, item: string) {
		panelsStore.removeItem(panelId, item);
	}
</script>

<section class="maintenance-panel">
	<div class="panel-body">
		<!-- Maintenance SKUs Section -->
		<div class="section">
			<div class="section-header">
				<span class="section-title">Maintenance SKUs</span>
				<div class="section-controls">
					<button
						type="button"
						class="control-btn"
						onclick={handleAddMaintenance}
						aria-label="Add maintenance item"
					>+</button>
					<button
						type="button"
						class="control-btn"
						class:active={removeMode}
						onclick={handleToggleRemove}
						aria-pressed={removeMode}
						aria-label="Toggle delete mode"
					>&minus;</button>
				</div>
			</div>
			<ul class="panel-items">
				{#each maintenanceItems() as item (item)}
					<PanelItem
						{item}
						checked={panelsStore.hasItem(maintenancePanel.id, item)}
						showCheckbox={true}
						{removeMode}
						onToggle={() => handleItemToggle(maintenancePanel.id, item)}
						onRemove={() => handleItemRemove(maintenancePanel.id, item)}
					/>
				{/each}
			</ul>
		</div>

		<!-- SolidWorks SKUs Section -->
		<div class="section">
			<div class="section-header">
				<span class="section-title">SolidWorks SKUs</span>
				<div class="section-controls">
					<button
						type="button"
						class="control-btn"
						onclick={handleAddSolidworks}
						aria-label="Add SolidWorks item"
					>+</button>
				</div>
			</div>
			<ul class="panel-items">
				{#each solidworksItems() as item (item)}
					<PanelItem
						{item}
						checked={panelsStore.hasItem(solidworksPanel.id, item)}
						showCheckbox={true}
						{removeMode}
						onToggle={() => handleItemToggle(solidworksPanel.id, item)}
						onRemove={() => handleItemRemove(solidworksPanel.id, item)}
					/>
				{/each}
			</ul>
		</div>
	</div>
</section>

<style>
	.maintenance-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: linear-gradient(135deg, rgba(28, 28, 28, 0.94) 0%, rgba(12, 12, 12, 0.92) 100%);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.04);
		border-radius: 12px;
		box-shadow:
			0 25px 50px rgba(0, 0, 0, 0.4),
			0 10px 20px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.03);
	}

	.panel-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 0.25rem 0.375rem;
	}

	.section {
		margin-bottom: 0.5rem;
	}

	.section:last-child {
		margin-bottom: 0;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0 0 0.2rem 0;
		padding: 0.1rem 0.2rem;
		border-bottom: 1px solid rgba(212, 175, 55, 0.2);
	}

	.section-title {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--color-solidcam-gold, #d4af37);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.section-controls {
		display: flex;
		gap: 0.15rem;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		padding: 0;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.control-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
	}

	.control-btn.active {
		background: rgba(200, 16, 46, 0.2);
		border-color: rgba(200, 16, 46, 0.4);
		color: #ff6666;
	}

	.panel-items {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.15rem;
		padding: 0.1rem;
		list-style: none;
		margin: 0;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.section-title {
			font-size: 0.6rem;
		}

		.control-btn {
			width: 16px;
			height: 16px;
			font-size: 0.7rem;
		}
	}

	@media (max-width: 640px) {
		.section-title {
			font-size: 0.55rem;
		}

		.control-btn {
			width: 14px;
			height: 14px;
			font-size: 0.6rem;
		}

		.panel-items {
			gap: 0.1rem;
		}
	}

	@media (max-width: 500px) {
		.maintenance-panel {
			flex: none;
		}

		.panel-body {
			flex: 0 0 auto;
			justify-content: flex-start;
		}

		.section-title {
			font-size: 0.55rem;
		}

		.control-btn {
			width: 14px;
			height: 14px;
			font-size: 0.55rem;
		}

		.panel-items {
			gap: 0.1rem;
		}
	}
</style>
