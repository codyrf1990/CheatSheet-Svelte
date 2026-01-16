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

	// Local state
	let removeMode = $state(false);

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

	function handleToggleRemove() {
		removeMode = !removeMode;
	}

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
				<div class="section-controls">
					<button
						type="button"
						class="control-btn"
						class:active={removeMode}
						onclick={handleToggleRemove}
						aria-pressed={removeMode}
						aria-label="Toggle delete mode">&minus;</button
					>
				</div>
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

	.section-controls {
		display: flex;
		gap: var(--space-0-5);
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		position: relative;
		overflow: visible;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.control-btn::before {
		content: '';
		position: absolute;
		inset: -2px;
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

		.control-btn {
			font-size: 0.7rem;
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
