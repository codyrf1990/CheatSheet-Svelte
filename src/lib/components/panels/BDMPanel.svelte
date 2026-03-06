<script lang="ts">
	import { browser } from '$app/environment';
	import { toastStore } from '$stores/toast.svelte';
	import { panelsStore } from '$stores/panels.svelte';
	import { Checkbox } from '$components/ui';
	import { BDM_SECTIONS } from '$lib/data/bdmData';

	const BDM_PANEL_ID = 'bdm-skus';
	const STORAGE_KEY = 'solidcam-bdm-sections';

	const defaults: Record<string, boolean> = {
		license: false,
		packages: false,
		milling: false,
		turning: false,
		addons: false,
		wire: false,
		solidworks: false,
		bundles: false,
		training: false,
		solidshop: false
	};

	function loadExpanded(): Record<string, boolean> {
		if (!browser) return { ...defaults };
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) return { ...defaults, ...JSON.parse(stored) };
		} catch {}
		return { ...defaults };
	}

	let expanded = $state<Record<string, boolean>>(loadExpanded());

	function toggle(id: string) {
		expanded[id] = !expanded[id];
		if (browser) {
			try { localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded)); } catch {}
		}
	}

	async function copySku(sku: string) {
		try {
			await navigator.clipboard.writeText(sku);
			toastStore.success(`Copied ${sku}`, 1500);
		} catch {
			toastStore.error('Failed to copy');
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
				<button
					type="button"
					class="section-header"
					onclick={() => toggle(section.id)}
					aria-expanded={expanded[section.id]}
				>
					<span class="section-title">{section.title}</span>
					<span class="section-count">{section.items.length}</span>
					<svg
						class="chevron"
						class:open={expanded[section.id]}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if expanded[section.id]}
					<ul class="item-list">
						{#each section.items as item (item.sku + item.label)}
							<li class="bdm-item">
								<span class="item-check">
									<Checkbox
										checked={panelsStore.hasItem(BDM_PANEL_ID, item.sku)}
										onchange={() => panelsStore.toggleItem(BDM_PANEL_ID, item.sku)}
									/>
								</span>
								<button
									type="button"
									class="sku-chip"
									onclick={() => copySku(item.sku)}
									title="Click to copy {item.sku}"
								>
									{item.sku}
								</button>
								<span class="item-label">{item.label}</span>
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
		gap: var(--space-0-5);
		width: 100%;
		padding: var(--space-0) var(--space-0-5);
		margin-bottom: var(--space-0-5);
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(212, 175, 55, 0.2);
		cursor: pointer;
		text-align: left;
	}

	.section-title {
		flex: 1;
		font-size: var(--text-xs);
		font-weight: var(--tile-title-weight);
		color: var(--color-solidcam-gold, #d4af37);
		text-transform: uppercase;
		letter-spacing: var(--tile-title-tracking);
	}

	.section-count {
		font-size: var(--text-2xs);
		color: rgba(255, 255, 255, 0.25);
		font-family: 'JetBrains Mono', monospace;
	}

	.chevron {
		width: 10px;
		height: 10px;
		color: rgba(255, 255, 255, 0.3);
		flex-shrink: 0;
		transform: rotate(-90deg);
		transition: transform 200ms ease;
	}

	.chevron.open {
		transform: rotate(0deg);
	}

	.item-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.bdm-item {
		display: flex;
		align-items: center;
		gap: var(--space-0);
		padding: var(--space-px) var(--space-0);
		border-radius: var(--radius-2xs);
		transition: background 150ms ease;
	}

	.bdm-item:hover {
		background: var(--chip-bg-hover);
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
		transition: all 150ms ease;
		white-space: nowrap;
		flex-shrink: 0;
		line-height: 1.2;
	}

	.sku-chip:hover {
		color: var(--chip-text-hover);
	}

	.item-label {
		font-size: var(--text-2xs);
		color: rgba(255, 255, 255, 0.4);
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
		font-size: var(--text-2xs);
		color: rgba(255, 255, 255, 0.65);
		white-space: nowrap;
	}

	.item-maint {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.55rem;
		color: rgba(255, 255, 255, 0.28);
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
			font-size: var(--text-2xs);
		}
		.sku-chip {
			font-size: var(--text-2xs);
		}
	}
</style>
