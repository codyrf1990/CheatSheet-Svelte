<script lang="ts">
	import { packagesStore } from '$stores/packages.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { SKU_LOOKUP, MODULE_SKUS, type SkuEntry } from '$lib/data/skuData';
	import { PACKAGE_TOGGLE_BITS } from '$lib/data/prerequisites';
	import { panelsStore } from '$stores/panels.svelte';
	import { packages as packageDefs } from '$data';

	// Derive SKU entries from current package selections
	let skuEntries = $derived.by(() => {
		const entries: SkuEntry[] = [];
		const states = packagesStore.all;

		for (const [pkgCode, toggleDef] of Object.entries(PACKAGE_TOGGLE_BITS)) {
			const state = states[pkgCode];
			if (!state || state.selectedBits.length === 0) continue;

			// Collect all bits defined by the package toggle
			const allToggleBits: string[] = [...(toggleDef.looseBits ?? [])];

			// Check if all bits for the package are selected -> use package SKU
			const allSelected = allToggleBits.every((b) => state.selectedBits.includes(b));

			const packageSkuKey = `${pkgCode}::PACKAGE`;
			if (allSelected && allToggleBits.length > 1 && SKU_LOOKUP[packageSkuKey]) {
				entries.push(SKU_LOOKUP[packageSkuKey]);
			} else {
				// Show individual bit SKUs
				for (const bit of state.selectedBits) {
					const key = `${pkgCode}::${bit}`;
					if (SKU_LOOKUP[key]) {
						entries.push(SKU_LOOKUP[key]);
					}
				}
			}

			// Check group selections — only add group SKU when group bits are actually selected
			if (toggleDef.groups) {
				const pkgDef = packageDefs.find((p) => p.code === pkgCode);
				for (const groupId of toggleDef.groups) {
					const key = `${pkgCode}::${groupId}`;
					const groupEntry = SKU_LOOKUP[key];
					if (!groupEntry) continue;

					const group = pkgDef?.groups?.find((g) => g.masterId === groupId);
					const groupBitsSelected = group
						? group.bits.some((b) => state.selectedBits.includes(b))
						: false;

					if (groupBitsSelected && !entries.includes(groupEntry)) {
						entries.push(groupEntry);
					}
				}
			}
		}

		// Check panel items for additional module SKUs
		const maintPanelState = panelsStore.getState('maintenance-skus');
		if (maintPanelState) {
			for (const moduleSku of MODULE_SKUS) {
				if (maintPanelState.items.includes(moduleSku.maintSku)) {
					entries.push(moduleSku);
				}
			}
		}

		// Deduplicate by SKU code
		const seen = new Set<string>();
		return entries.filter((e) => {
			if (seen.has(e.sku)) return false;
			seen.add(e.sku);
			return true;
		});
	});

	let total = $derived(skuEntries.reduce((sum, e) => sum + e.price, 0));

	function formatPrice(price: number): string {
		return '$' + price.toLocaleString('en-US');
	}

	async function handleCopySku(sku: string) {
		try {
			await navigator.clipboard.writeText(sku);
			toastStore.success(`Copied ${sku}`, 1500);
		} catch {
			toastStore.error('Failed to copy');
		}
	}
</script>

<section class="new-sale-panel tile">
	<div class="panel-body">
		{#if skuEntries.length === 0}
			<div class="empty-state">No items selected</div>
		{:else}
			<ul class="sku-list">
				{#each skuEntries as entry (entry.sku)}
					<li class="sku-row">
						<button
							type="button"
							class="sku-code"
							onclick={() => handleCopySku(entry.sku)}
							title="Click to copy {entry.sku}"
						>
							{entry.sku}
						</button>
						<span class="sku-price">{formatPrice(entry.price)}</span>
					</li>
				{/each}
			</ul>
			<div class="total-row">
				<span class="total-label">Total</span>
				<span class="total-price">{formatPrice(total)}</span>
			</div>
		{/if}
	</div>
</section>

<style>
	.new-sale-panel {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
	}

	.panel-body {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		padding: var(--space-1) var(--space-2);
	}

	.empty-state {
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.4);
		text-align: center;
		padding: var(--space-2) 0;
	}

	.sku-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-0-5);
	}

	.sku-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-1);
		padding: var(--space-0) var(--space-0-5);
		border-radius: var(--radius-2xs);
		transition: background-color 150ms ease;
	}

	.sku-row:hover {
		background: var(--chip-bg-hover);
	}

	.sku-code {
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-xs);
		color: var(--chip-text-color);
		background: var(--chip-bg);
		border: 1px solid var(--chip-border-color);
		border-radius: var(--radius-2xs);
		padding: var(--space-0) var(--space-0-5);
		cursor: pointer;
		transition: all 150ms ease;
		white-space: nowrap;
		text-align: left;
	}

	.sku-code:hover {
		color: var(--chip-text-hover);
		border-color: var(--chip-border-color-strong);
	}

	.sku-price {
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.7);
		white-space: nowrap;
	}

	.total-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-1) var(--space-0-5);
		margin-top: var(--space-1);
		border-top: 1px solid rgba(212, 175, 55, 0.3);
	}

	.total-label {
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-solidcam-gold, #d4af37);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.total-price {
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--color-solidcam-gold, #d4af37);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.sku-code {
			font-size: var(--text-2xs);
		}

		.sku-price {
			font-size: var(--text-2xs);
		}
	}

	@media (max-width: 640px) {
		.sku-code {
			font-size: var(--text-2xs);
		}

		.sku-price {
			font-size: var(--text-2xs);
		}
	}
</style>
