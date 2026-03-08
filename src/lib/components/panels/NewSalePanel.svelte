<script lang="ts">
	import { packagesStore } from '$stores/packages.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { SKU_LOOKUP, MODULE_SKUS, type SkuEntry } from '$lib/data/skuData';
	import { BDM_SECTIONS, type BDMItem } from '$lib/data/bdmData';
	import { PACKAGE_TOGGLE_BITS } from '$lib/data/prerequisites';
	import { panelsStore } from '$stores/panels.svelte';
	import { packages as packageDefs } from '$data';
	interface Props {
		skuMode?: 'bdm' | 'ms';
	}
	let { skuMode = 'bdm' }: Props = $props();

	// Flat BDM SKU lookup keyed by sku code
	const bdmSkuLookup: Record<string, BDMItem> = {};
	for (const section of BDM_SECTIONS) {
		for (const item of section.items) {
			bdmSkuLookup[item.sku] = item;
		}
	}

	interface SaleLine {
		entry: SkuEntry;
		subEntries?: SkuEntry[];
	}

	// Derive sale lines from current package selections
	let saleLines = $derived.by(() => {
		const lines: SaleLine[] = [];
		const states = packagesStore.all;

		for (const [pkgCode, toggleDef] of Object.entries(PACKAGE_TOGGLE_BITS)) {
			const state = states[pkgCode];
			if (!state || state.selectedBits.length === 0) continue;

			const pkgDef = packageDefs.find((p) => p.code === pkgCode);
			const allToggleBits: string[] = [...(toggleDef.looseBits ?? [])];
			const allSelected = allToggleBits.every((b) => state.selectedBits.includes(b));

			// Packages with groups (SC-Mill, SC-Mill-5Axis) are only "full" when groups are also selected
			const groupsFullyRepresented =
				!toggleDef.groups ||
				toggleDef.groups.every((groupId) => {
					const group = pkgDef?.groups?.find((g) => g.masterId === groupId);
					return group ? group.bits.some((b) => state.selectedBits.includes(b)) : false;
				});

			const packageSku = SKU_LOOKUP[`${pkgCode}::PACKAGE`];

			// CASE A: Full package — show package SKU with sub-entries breakdown
			if (packageSku && allSelected && groupsFullyRepresented) {
				const groupSKUs: SkuEntry[] = (toggleDef.groups ?? [])
					.map((groupId) => SKU_LOOKUP[`${pkgCode}::${groupId}`])
					.filter(Boolean) as SkuEntry[];
				const looseBitSKUs: SkuEntry[] = allToggleBits
					.map((bit) => SKU_LOOKUP[`${pkgCode}::${bit}`])
					.filter(Boolean) as SkuEntry[];

				lines.push({ entry: packageSku, subEntries: [...groupSKUs, ...looseBitSKUs] });
				continue; // Skip group check — prevents SC-Mill-5Axis double-counting
			}

			// CASE B: Partial selection — show individual bit SKUs
			for (const bit of state.selectedBits) {
				const key = `${pkgCode}::${bit}`;
				if (SKU_LOOKUP[key]) lines.push({ entry: SKU_LOOKUP[key] });
			}

			// CASE C: Group SKU (only when CASE A not used)
			for (const groupId of toggleDef.groups ?? []) {
				const key = `${pkgCode}::${groupId}`;
				const groupEntry = SKU_LOOKUP[key];
				if (!groupEntry) continue;
				const group = pkgDef?.groups?.find((g) => g.masterId === groupId);
				const groupBitsSelected = group
					? group.bits.some((b) => state.selectedBits.includes(b))
					: false;
				if (groupBitsSelected && !lines.some((l) => l.entry === groupEntry)) {
					lines.push({ entry: groupEntry });
				}
			}
		}

		// Mode-specific standalone additions
		if (skuMode === 'ms') {
			// MS mode: maint panel checkboxes → maintenance module lines
			const maintItems = panelsStore.getItems('maintenance-skus');
			for (const moduleSku of MODULE_SKUS) {
				if (maintItems.includes(moduleSku.maintSku)) {
					lines.push({ entry: moduleSku });
				}
			}
		} else {
			// BDM mode: BDM panel checkboxes → BDM sale lines
			const bdmSelected = panelsStore.getItems('bdm-skus');
			for (const sku of bdmSelected) {
				const bdmItem = bdmSkuLookup[sku];
				if (bdmItem && bdmItem.price !== null) {
					lines.push({
						entry: {
							sku: bdmItem.sku,
							label: bdmItem.label,
							price: bdmItem.price,
							maintSku: bdmItem.sku,
							maintPrice: bdmItem.maint ?? 0
						}
					});
				}
			}
		}

		// Deduplicate by SKU code
		const seen = new Set<string>();
		return lines.filter((l) => {
			if (seen.has(l.entry.sku)) return false;
			seen.add(l.entry.sku);
			return true;
		});
	});

	let total = $derived(saleLines.reduce((sum, l) => sum + l.entry.price, 0));

	// MS mode: same structure as sale lines but using maintPrice/maintSku fields
	let maintTotal = $derived(saleLines.reduce((sum, l) => sum + l.entry.maintPrice, 0));

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
		{#if skuMode === 'ms'}
			<!-- MS mode: same items as BDM but show maintSku + maintPrice -->
			{#if saleLines.length === 0}
				<div class="empty-state">Select bits from the table to see pricing.</div>
			{:else}
				<ul class="sku-list">
					{#each saleLines as line (line.entry.sku)}
						{@const savings = line.subEntries
							? line.subEntries.reduce((s, e) => s + e.maintPrice, 0) - line.entry.maintPrice
							: 0}
						<li class="sku-row" class:has-sub={line.subEntries?.length}>
							<div class="sku-main-row">
								<button
									type="button"
									class="sku-code"
									class:is-package={line.subEntries?.length}
									onclick={() => handleCopySku(line.entry.maintSku)}
									title="Click to copy {line.entry.maintSku}"
								>
									{line.entry.maintSku}
								</button>
								<div class="sku-price-group">
									{#if savings > 0}
										<span class="sku-savings">Save {formatPrice(savings)}</span>
									{/if}
									<span class="sku-price">{formatPrice(line.entry.maintPrice)}</span>
								</div>
							</div>
							{#if line.subEntries?.length}
								<ul class="sku-sub-list" aria-label="Included in {line.entry.maintSku}">
									{#each line.subEntries as sub (sub.sku)}
										<li class="sku-sub-row">
											<button
												type="button"
												class="sku-code sku-code--sub"
												onclick={() => handleCopySku(sub.maintSku)}
												title="Click to copy {sub.maintSku}"
											>
												{sub.maintSku}
											</button>
											<span class="sku-price sku-price--sub">{formatPrice(sub.maintPrice)}</span>
										</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
				<div class="total-row">
					<span class="total-label">Maint Total</span>
					<span class="total-price">{formatPrice(maintTotal)}</span>
				</div>
			{/if}
		{:else}
			<!-- BDM mode: show new sale pricing -->
			{#if saleLines.length === 0}
				<div class="empty-state">Select bits from the table to see pricing.</div>
			{:else}
				<ul class="sku-list">
					{#each saleLines as line (line.entry.sku)}
						{@const savings = line.subEntries
							? line.subEntries.reduce((s, e) => s + e.price, 0) - line.entry.price
							: 0}
						<li class="sku-row" class:has-sub={line.subEntries?.length}>
							<div class="sku-main-row">
								<button
									type="button"
									class="sku-code"
									class:is-package={line.subEntries?.length}
									onclick={() => handleCopySku(line.entry.sku)}
									title="Click to copy {line.entry.sku}"
								>
									{line.entry.sku}
								</button>
								<div class="sku-price-group">
									{#if savings > 0}
										<span class="sku-savings">Save {formatPrice(savings)}</span>
									{/if}
									<span class="sku-price">{formatPrice(line.entry.price)}</span>
								</div>
							</div>
							{#if line.subEntries?.length}
								<ul class="sku-sub-list" aria-label="Included in {line.entry.sku}">
									{#each line.subEntries as sub (sub.sku)}
										<li class="sku-sub-row">
											<button
												type="button"
												class="sku-code sku-code--sub"
												onclick={() => handleCopySku(sub.sku)}
												title="Click to copy {sub.sku} (reference price)"
											>
												{sub.sku}
											</button>
											<span class="sku-price sku-price--sub">{formatPrice(sub.price)}</span>
										</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
				<div class="total-row">
					<span class="total-label">Total</span>
					<span class="total-price">{formatPrice(total)}</span>
				</div>
			{/if}
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
		border-radius: var(--radius-2xs);
		transition: background-color 150ms ease;
	}

	.sku-row:hover {
		background: var(--chip-bg-hover);
	}

	.sku-row.has-sub {
		padding: 0;
	}

	.sku-row.has-sub:hover {
		background: transparent;
	}

	.sku-main-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-1);
		padding: var(--space-0) var(--space-0-5);
		border-radius: var(--radius-2xs);
		transition: background-color 150ms ease;
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

	.sku-code.is-package {
		border-left: 2px solid rgba(212, 175, 55, 0.5);
	}

	.sku-price-group {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.sku-price {
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.7);
		white-space: nowrap;
	}

	.sku-savings {
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-2xs);
		color: #4ade80;
		opacity: 0.85;
		white-space: nowrap;
	}

	.sku-sub-list {
		list-style: none;
		margin: 0 0 var(--space-0-5) var(--space-2);
		padding: 0 0 0 var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-0-5);
		border-left: 1px solid rgba(255, 255, 255, 0.06);
	}

	.sku-sub-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-1);
		padding: var(--space-0) var(--space-0-5);
		border-radius: var(--radius-2xs);
		transition: background-color 150ms ease;
	}

	.sku-sub-row:hover {
		background: var(--chip-bg-hover);
	}

	.sku-code--sub {
		font-size: var(--text-2xs);
		opacity: 0.6;
		border-color: rgba(255, 255, 255, 0.06);
		background: transparent;
	}

	.sku-code--sub:hover {
		opacity: 1;
		color: var(--chip-text-hover);
		border-color: var(--chip-border-color-strong);
	}

	.sku-price--sub {
		font-size: var(--text-2xs);
		color: rgba(255, 255, 255, 0.35);
		font-style: italic;
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
