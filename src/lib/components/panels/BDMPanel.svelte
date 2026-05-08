<script lang="ts">
	import { Check } from 'lucide-svelte';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import { panelsStore } from '$stores/panels.svelte';
	import { Checkbox, Tooltip } from '$components/ui';
	import { BDM_SECTIONS } from '$lib/data/bdmData';
	import { tooltip } from '$lib/utils/tooltipAction';

	const BDM_PANEL_ID = 'bdm-skus';

	let copiedSku = $state<string | null>(null);

	async function copySku(sku: string) {
		const ok = await copyToClipboard(sku, false);
		if (ok) {
			copiedSku = sku;
			setTimeout(() => (copiedSku = null), 1500);
		}
	}

	function formatPrice(price: number | null, priceNote?: string): string {
		if (priceNote) return priceNote;
		if (price === null) return '—';
		if (price === 0) return 'Free';
		return '$' + price.toLocaleString('en-US');
	}
</script>

<section class="bdm-panel">
	<div class="panel-body">
		{#each BDM_SECTIONS as section (section.id)}
			<div class="bdm-section">
				<div class="section-header">
					<span class="section-title">{section.title}</span>
				</div>
				<ul class="item-list">
					{#each section.items as item (item.sku + item.label)}
						<li class="bdm-item" class:selected={panelsStore.hasItem(BDM_PANEL_ID, item.sku)}>
							<span class="item-check">
								<Checkbox
									checked={panelsStore.hasItem(BDM_PANEL_ID, item.sku)}
									onchange={() => panelsStore.toggleItem(BDM_PANEL_ID, item.sku)}
								/>
							</span>
							<Tooltip text="Click to copy {item.sku}">
								<button type="button" class="sku-chip" onclick={() => copySku(item.sku)}>
									{#if copiedSku === item.sku}<span class="copy-check"><Check size={11} strokeWidth={3} /></span
										>{:else}{item.sku}{/if}
								</button>
							</Tooltip>
							<span class="item-label" use:tooltip={item.label}>{item.label}</span>
							<div class="item-pricing">
								<span class="item-price">{formatPrice(item.price, item.priceNote)}</span>
								{#if item.maint}
									<span class="item-maint">+{formatPrice(item.maint)}/yr</span>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
				{#if section.note}
					<p class="section-note">{section.note}</p>
				{/if}
			</div>
		{/each}
	</div>
</section>

<style>
	.bdm-panel {
		display: flex;
		flex-direction: column;
	}

	.panel-body {
		display: flex;
		flex-direction: column;
		padding: var(--space-1) var(--space-2);
	}

	.bdm-section {
		margin-bottom: var(--space-2);
	}

	.bdm-section:last-child {
		margin-bottom: 0;
	}

	.section-header {
		display: flex;
		align-items: center;
		padding: var(--space-0) var(--space-0-5);
		margin-bottom: var(--space-0-5);
		border-bottom: 1px solid rgba(212, 175, 55, 0.2);
	}

	.section-title {
		flex: 1;
		font-size: var(--text-xs);
		font-weight: var(--tile-title-weight);
		color: var(--color-solidcam-gold, #d4af37);
		text-transform: uppercase;
		letter-spacing: var(--tile-title-tracking);
	}

	.item-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-1);
		padding: var(--space-1);
		list-style: none;
		margin: 0;
	}

	.bdm-item {
		display: flex;
		align-items: center;
		gap: var(--space-0);
		padding: var(--space-px) var(--space-0);
		border-radius: var(--radius-2xs);
		transition: background 150ms var(--ease-out-quart);
	}

	.bdm-item:hover {
		background: var(--chip-bg-hover);
	}

	/* Selected state — soft gold tint on the chip + brighter label */
	.bdm-item.selected .sku-chip {
		background: var(--gold-a10);
		border-color: var(--gold-a30);
	}

	.bdm-item.selected .item-label {
		color: rgba(255, 255, 255, 0.85);
	}

	.bdm-item.selected:hover .sku-chip {
		background: var(--gold-a20);
		border-color: var(--gold-a45);
	}

	.item-check {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.sku-chip {
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-xs);
		color: var(--chip-text-color);
		background: var(--chip-bg);
		border: 1px solid var(--chip-border-color);
		box-shadow: var(--chip-shadow);
		border-radius: var(--radius-2xs);
		padding: var(--space-0) var(--space-0-5);
		cursor: pointer;
		transition:
			background 150ms var(--ease-out-quart),
			border-color 150ms var(--ease-out-quart),
			color 150ms var(--ease-out-quart);
		white-space: nowrap;
		flex-shrink: 0;
		line-height: 1.2;
	}

	.sku-chip:hover {
		color: var(--chip-text-hover);
	}

	.copy-check {
		display: inline-flex;
		align-items: center;
		color: var(--color-success, #22c55e);
		filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.35));
	}

	.item-label {
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.5);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
		flex: 1;
	}

	.item-pricing {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		flex-shrink: 0;
		gap: 1px;
	}

	.item-price {
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.65);
		white-space: nowrap;
	}

	.item-maint {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.55rem;
		color: rgba(255, 255, 255, 0.5);
		white-space: nowrap;
	}

	.section-note {
		font-size: 0.55rem;
		color: rgba(255, 255, 255, 0.35);
		font-style: italic;
		padding: var(--space-0-5) var(--space-0-5);
		margin: var(--space-0-5) 0 0;
		line-height: 1.4;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	@media (max-width: 768px) {
		.section-title {
			font-size: var(--text-xs);
		}
		.sku-chip {
			font-size: var(--text-xs);
		}
	}

	@media (max-width: 640px) {
		.item-list {
			grid-template-columns: 1fr;
		}
	}
</style>
