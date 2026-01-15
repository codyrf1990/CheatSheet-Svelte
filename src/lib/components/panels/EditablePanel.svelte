<script lang="ts">
	import type { Panel as PanelType } from '$types';
	import { panelsStore } from '$stores/panels.svelte';
	import Panel from './Panel.svelte';
	import PanelItem from './PanelItem.svelte';

	interface Props {
		panel: PanelType;
		showCheckboxes?: boolean;
	}

	let { panel, showCheckboxes = false }: Props = $props();

	// Local state
	let removeMode = $state(false);

	// Get items from store, fallback to panel defaults if not initialized
	let items = $derived(() => {
		const storeItems = panelsStore.getItems(panel.id);
		return storeItems.length > 0 ? storeItems : panel.items;
	});

	// Drag and drop state
	let draggedIndex = $state<number | null>(null);

	function handleAddItem() {
		const value = prompt(`Add a new item to ${panel.title}:`);
		if (!value) return;
		const text = value.trim();
		if (!text) return;

		panelsStore.addItem(panel.id, text);
	}

	function handleToggleRemove() {
		removeMode = !removeMode;
	}

	function handleItemToggle(item: string) {
		panelsStore.toggleItem(panel.id, item);
	}

	function handleItemRemove(item: string) {
		panelsStore.removeItem(panel.id, item);
	}

	function handleDragStart(e: DragEvent, index: number) {
		draggedIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(e: DragEvent, dropIndex: number) {
		if (draggedIndex === null) return;
		e.preventDefault();

		if (draggedIndex !== dropIndex) {
			const currentItems = items();
			const newOrder = [...currentItems];
			const [removed] = newOrder.splice(draggedIndex, 1);
			newOrder.splice(dropIndex, 0, removed);
			panelsStore.reorderItems(panel.id, newOrder);
		}
		draggedIndex = null;
	}

	function handleDragEnd() {
		draggedIndex = null;
	}
</script>

<Panel
	id={panel.id}
	title={panel.title}
	editable={panel.editable}
	{removeMode}
	onAddItem={handleAddItem}
	onToggleRemove={handleToggleRemove}
>
	<ul class="panel-items" data-sortable-group={panel.id} ondragend={handleDragEnd}>
		{#each items() as item, index (item)}
			<PanelItem
				{item}
				checked={panelsStore.hasItem(panel.id, item)}
				showCheckbox={showCheckboxes}
				{removeMode}
				draggable={panel.editable && !removeMode}
				onToggle={() => handleItemToggle(item)}
				onRemove={() => handleItemRemove(item)}
				ondragstart={(e) => handleDragStart(e, index)}
				ondragover={handleDragOver}
				ondrop={(e) => handleDrop(e, index)}
			/>
		{/each}
	</ul>
</Panel>

<style>
	.panel-items {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.125rem;
		padding: 0.0625rem;
		list-style: none;
		margin: 0;
	}

	/* Single column at narrow viewports */
	@media (max-width: 640px) {
		.panel-items {
			grid-template-columns: 1fr;
			gap: 0.075rem;
		}
	}
</style>
