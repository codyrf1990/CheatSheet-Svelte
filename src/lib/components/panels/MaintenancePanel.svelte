<script lang="ts">
	import type { Panel as PanelType } from '$types';
	import { panelsStore } from '$stores/panels.svelte';
	import { userPrefsStore } from '$stores/userPrefs.svelte';
	import PanelItem from './PanelItem.svelte';

	interface Props {
		maintenancePanel: PanelType;
		solidworksPanel: PanelType;
	}

	let { maintenancePanel, solidworksPanel }: Props = $props();

	// Use global remove mode from store
	let removeMode = $derived(panelsStore.removeMode);

	// Merge static items with custom items from global prefs
	let maintenanceItems = $derived(() => {
		const staticItems = maintenancePanel.items;
		const customItems = userPrefsStore.getCustomPanelItems(maintenancePanel.id);
		return [...staticItems, ...customItems.filter((c) => !staticItems.includes(c))];
	});

	let solidworksItems = $derived(() => {
		const staticItems = solidworksPanel.items;
		const customItems = userPrefsStore.getCustomPanelItems(solidworksPanel.id);
		return [...staticItems, ...customItems.filter((c) => !staticItems.includes(c))];
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
</script>

<section class="maintenance-panel">
	<div class="panel-body">
		<!-- Maintenance SKUs Section -->
		<div class="section">
			<div class="section-header">
				<span class="section-title">Maintenance SKUs</span>
			</div>
			<ul class="panel-items">
				{#each maintenanceItems() as item (item)}
					<PanelItem
						{item}
						checked={panelsStore.hasItem(maintenancePanel.id, item)}
						showCheckbox={true}
						{removeMode}
						isCustom={isCustomItem(maintenancePanel.id, item)}
						onToggle={() => handleItemToggle(maintenancePanel.id, item)}
						onRemove={() =>
							handleItemRemove(maintenancePanel.id, item, isCustomItem(maintenancePanel.id, item))}
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
				{#each solidworksItems() as item (item)}
					<PanelItem
						{item}
						checked={panelsStore.hasItem(solidworksPanel.id, item)}
						showCheckbox={true}
						{removeMode}
						isCustom={isCustomItem(solidworksPanel.id, item)}
						onToggle={() => handleItemToggle(solidworksPanel.id, item)}
						onRemove={() =>
							handleItemRemove(solidworksPanel.id, item, isCustomItem(solidworksPanel.id, item))}
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
		font-weight: 600;
		color: var(--color-solidcam-gold, #d4af37);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.panel-items {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-0-5);
		padding: var(--space-0);
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
