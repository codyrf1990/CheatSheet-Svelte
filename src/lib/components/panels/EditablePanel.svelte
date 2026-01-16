<script lang="ts">
	import type { Panel as PanelType } from '$types';
	import { panelsStore } from '$stores/panels.svelte';
	import { Button, Input, Modal } from '$components/ui';
	import Panel from './Panel.svelte';
	import PanelItem from './PanelItem.svelte';

	interface Props {
		panel: PanelType;
		showCheckboxes?: boolean;
	}

	let { panel, showCheckboxes = false }: Props = $props();

	// Local state
	let removeMode = $state(false);
	let addDialogOpen = $state(false);
	let addDialogValue = $state('');

	let addDialogTitle = $derived(() => `Add ${panel.title}`);
	let addDialogLabel = $derived(() => `${panel.title} item`);
	let addDialogValid = $derived(() => addDialogValue.trim().length > 0);

	// Always show panel's base items - store tracks checked/removed state separately
	let items = $derived(() => panel.items);

	// Drag and drop state
	let draggedIndex = $state<number | null>(null);

	function handleAddItem() {
		addDialogValue = '';
		addDialogOpen = true;
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

	function closeAddDialog() {
		addDialogOpen = false;
		addDialogValue = '';
	}

	function submitAddDialog() {
		const text = addDialogValue.trim();
		if (!text) return;
		panelsStore.addItem(panel.id, text);
		closeAddDialog();
	}

	function handleAddDialogKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && addDialogValid()) {
			e.preventDefault();
			submitAddDialog();
		}
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

{#snippet addDialogFooter()}
	<div class="dialog-actions">
		<Button variant="ghost" size="sm" onclick={closeAddDialog}>Cancel</Button>
		<Button variant="gold" size="sm" onclick={submitAddDialog} disabled={!addDialogValid()}>
			Add
		</Button>
	</div>
{/snippet}

<Modal
	open={addDialogOpen}
	onclose={closeAddDialog}
	title={addDialogTitle()}
	footer={addDialogFooter}
>
	<div class="dialog-form">
		<Input
			label={addDialogLabel()}
			placeholder={addDialogLabel()}
			bind:value={addDialogValue}
			onkeydown={handleAddDialogKeydown}
		/>
	</div>
</Modal>

<style>
	.panel-items {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.125rem;
		padding: 0.0625rem;
		list-style: none;
		margin: 0;
	}

	.dialog-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		width: 100%;
	}

	/* Single column at narrow viewports */
	@media (max-width: 640px) {
		.panel-items {
			grid-template-columns: 1fr;
			gap: 0.075rem;
		}
	}
</style>
