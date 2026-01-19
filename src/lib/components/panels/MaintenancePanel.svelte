<script lang="ts">
	import type { Panel as PanelType } from '$types';
	import { panelsStore } from '$stores/panels.svelte';
	import { userPrefsStore } from '$stores/userPrefs.svelte';
	import { applyOrder } from '$lib/utils/order';
	import PanelItem from './PanelItem.svelte';

	interface Props {
		maintenancePanel: PanelType;
		solidworksPanel: PanelType;
		editMode?: boolean;
	}

	let { maintenancePanel, solidworksPanel, editMode = false }: Props = $props();

	// Use global remove mode from store
	let removeMode = $derived(panelsStore.removeMode);

	// Merge static items with custom items, then apply stored order
	let maintenanceItems = $derived(() => {
		const staticItems = maintenancePanel.items;
		const customItems = userPrefsStore.getCustomPanelItems(maintenancePanel.id);
		const allItems = [...staticItems, ...customItems.filter((c) => !staticItems.includes(c))];
		const storedOrder = panelsStore.getItemsOrder(maintenancePanel.id);
		return applyOrder(allItems, storedOrder);
	});

	let solidworksItems = $derived(() => {
		const staticItems = solidworksPanel.items;
		const customItems = userPrefsStore.getCustomPanelItems(solidworksPanel.id);
		const allItems = [...staticItems, ...customItems.filter((c) => !staticItems.includes(c))];
		const storedOrder = panelsStore.getItemsOrder(solidworksPanel.id);
		return applyOrder(allItems, storedOrder);
	});

	function handleItemToggle(panelId: string, item: string) {
		panelsStore.toggleItem(panelId, item);
	}

	function handleItemRemove(panelId: string, item: string, isCustom: boolean) {
		if (isCustom) {
			// Remove from global user prefs
			userPrefsStore.removeCustomPanelItem(panelId, item);
		} else {
			// Mark as removed in panel state (per-page)
			panelsStore.removeItem(panelId, item);
		}
	}

	function isCustomItem(panelId: string, item: string): boolean {
		return userPrefsStore.isCustomPanelItem(panelId, item);
	}

	// Drag and drop state for maintenance section
	let maintDraggedIndex = $state<number | null>(null);

	function handleMaintDragStart(e: DragEvent, index: number) {
		if (!editMode) return;
		maintDraggedIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
		}
	}

	function handleMaintDragOver(e: DragEvent) {
		if (!editMode) return;
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleMaintDrop(e: DragEvent, dropIndex: number) {
		if (!editMode || maintDraggedIndex === null) return;
		e.preventDefault();

		if (maintDraggedIndex !== dropIndex) {
			const newOrder = [...maintenanceItems()];
			const [removed] = newOrder.splice(maintDraggedIndex, 1);
			newOrder.splice(dropIndex, 0, removed);
			panelsStore.setItemsOrder(maintenancePanel.id, newOrder);
		}
		maintDraggedIndex = null;
	}

	// Drag and drop state for solidworks section
	let swDraggedIndex = $state<number | null>(null);

	function handleSwDragStart(e: DragEvent, index: number) {
		if (!editMode) return;
		swDraggedIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
		}
	}

	function handleSwDragOver(e: DragEvent) {
		if (!editMode) return;
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleSwDrop(e: DragEvent, dropIndex: number) {
		if (!editMode || swDraggedIndex === null) return;
		e.preventDefault();

		if (swDraggedIndex !== dropIndex) {
			const newOrder = [...solidworksItems()];
			const [removed] = newOrder.splice(swDraggedIndex, 1);
			newOrder.splice(dropIndex, 0, removed);
			panelsStore.setItemsOrder(solidworksPanel.id, newOrder);
		}
		swDraggedIndex = null;
	}
</script>

<section class="maintenance-panel tile">
	<div class="panel-body">
		<!-- Maintenance SKUs Section -->
		<div class="section">
			<div class="section-header">
				<span class="section-title">Maintenance SKUs</span>
			</div>
			<ul class="panel-items">
				{#each maintenanceItems() as item, index (item)}
					<PanelItem
						{item}
						checked={panelsStore.hasItem(maintenancePanel.id, item)}
						showCheckbox={true}
						{editMode}
						{removeMode}
						isCustom={isCustomItem(maintenancePanel.id, item)}
						draggable={editMode}
						onToggle={() => handleItemToggle(maintenancePanel.id, item)}
						onRemove={() =>
							handleItemRemove(maintenancePanel.id, item, isCustomItem(maintenancePanel.id, item))}
						ondragstart={(e) => handleMaintDragStart(e, index)}
						ondragover={handleMaintDragOver}
						ondrop={(e) => handleMaintDrop(e, index)}
					/>
				{/each}
			</ul>
		</div>

		<!-- SolidWorks SKUs Section -->
		<div class="section">
			<div class="section-header">
				<span class="section-title">SolidWorks SKUs</span>
			</div>
			<ul class="panel-items">
				{#each solidworksItems() as item, index (item)}
					<PanelItem
						{item}
						checked={panelsStore.hasItem(solidworksPanel.id, item)}
						showCheckbox={true}
						{editMode}
						{removeMode}
						isCustom={isCustomItem(solidworksPanel.id, item)}
						draggable={editMode}
						onToggle={() => handleItemToggle(solidworksPanel.id, item)}
						onRemove={() =>
							handleItemRemove(solidworksPanel.id, item, isCustomItem(solidworksPanel.id, item))}
						ondragstart={(e) => handleSwDragStart(e, index)}
						ondragover={handleSwDragOver}
						ondrop={(e) => handleSwDrop(e, index)}
					/>
				{/each}
			</ul>
		</div>
	</div>
</section>

<style>
	.maintenance-panel {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
	}

	.panel-body {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		padding: var(--space-1) var(--space-2);
	}

	.section {
		margin-bottom: var(--space-2);
	}

	.section:last-child {
		margin-bottom: 0;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0 0 var(--space-0-5) 0;
		padding: var(--space-0) var(--space-0-5);
		border-bottom: 1px solid rgba(212, 175, 55, 0.2);
	}

	.section-title {
		font-size: var(--text-xs);
		font-weight: var(--tile-title-weight);
		color: var(--color-solidcam-gold, #d4af37);
		text-transform: uppercase;
		letter-spacing: var(--tile-title-tracking);
	}

	.panel-items {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-0-5);
		padding: var(--space-px);
		list-style: none;
		margin: 0;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.section-title {
			font-size: var(--text-2xs);
		}
	}

	@media (max-width: 640px) {
		.section-title {
			font-size: var(--text-2xs);
		}

		.panel-items {
			gap: var(--space-0);
		}
	}
</style>
