<script lang="ts">
	import { PackagePlus, Sparkles } from 'lucide-svelte';
	import Modal from './Modal.svelte';
	import Tooltip from './Tooltip.svelte';
	import { packagesStore } from '$stores/packages.svelte';
	import { panelsStore } from '$stores/panels.svelte';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import { SKU_LOOKUP, MODULE_SKUS } from '$lib/data/skuData';
	import { PACKAGE_TOGGLE_BITS, REQUIRES_SC_MILL_MODULES } from '$lib/data/prerequisites';
	import { BIT_DESCRIPTIONS } from '$lib/data/bitDescriptions';
	import { packages as packageDefs } from '$data';

	interface Props {
		open: boolean;
		onClose: () => void;
		skuMode?: 'bdm' | 'ms';
	}

	let { open, onClose, skuMode = 'bdm' }: Props = $props();

	interface UpgradeItem {
		name: string;
		sku: string;
		price: number;
		maintSku: string;
		maintPrice: number;
		description: string;
	}

	interface UpgradeGroup {
		label: string;
		items: UpgradeItem[];
	}

	let upgradeGroups = $derived.by(() => {
		const groups: UpgradeGroup[] = [];
		const states = packagesStore.all;

		// Package bit groups
		const packageOrder: { code: string; label: string }[] = [
			{ code: 'SC-Mill', label: 'SC-Mill' },
			{ code: 'SC-Mill-Adv', label: 'SC-Mill-Adv' },
			{ code: 'SC-Mill-3D', label: 'SC-Mill-3D' },
			{ code: 'SC-Mill-5Axis', label: 'SC-Mill-5Axis' },
			{ code: 'SC-Turn', label: 'SC-Turn' }
		];

		for (const { code, label } of packageOrder) {
			const toggleDef = PACKAGE_TOGGLE_BITS[code];
			if (!toggleDef) continue;

			const state = states[code];
			const selectedBits = state?.selectedBits ?? [];
			const items: UpgradeItem[] = [];

			// SC-Turn: show as single combined entry
			if (code === 'SC-Turn') {
				const hasTurning = selectedBits.includes('SolidCAM Turning');
				if (!hasTurning) {
					const entry = SKU_LOOKUP['SC-Turn::SolidCAM Turning'];
					if (entry) {
						items.push({
							name: 'SC-Turn Module',
							sku: entry.sku,
							price: entry.price,
							maintSku: entry.maintSku,
							maintPrice: entry.maintPrice,
							description: BIT_DESCRIPTIONS['SC-Turn'] ?? ''
						});
					}
				}
				if (items.length > 0) groups.push({ label, items });
				continue;
			}

			// Determine if ALL toggleable groups/bits are unselected (bundle pricing applies)
			const allToggleGroups = toggleDef.groups ?? [];
			const allToggleBits = toggleDef.looseBits ?? [];
			const noneSelected =
				allToggleGroups.every((g) => !isGroupSelected(code, g, selectedBits)) &&
				allToggleBits.every((b) => !selectedBits.includes(b));

			if (noneSelected) {
				const pkgEntry = SKU_LOOKUP[`${code}::PACKAGE`];
				if (pkgEntry) {
					items.push({
						name: pkgEntry.label,
						sku: pkgEntry.sku,
						price: pkgEntry.price,
						maintSku: pkgEntry.maintSku,
						maintPrice: pkgEntry.maintPrice,
						description: ''
					});
					groups.push({ label, items });
					continue;
				}
				// No PACKAGE entry — fall through to individual items
			}

			// Check groups (e.g., 25M, SIM5X)
			if (toggleDef.groups) {
				for (const groupId of toggleDef.groups) {
					const key = `${code}::${groupId}`;
					const entry = SKU_LOOKUP[key];
					if (!entry) continue;

					const groupNotSelected = !isGroupSelected(code, groupId, selectedBits);
					if (groupNotSelected) {
						items.push({
							name: entry.label,
							sku: entry.sku,
							price: entry.price,
							maintSku: entry.maintSku,
							maintPrice: entry.maintPrice,
							description: BIT_DESCRIPTIONS[groupId] ?? BIT_DESCRIPTIONS[code] ?? ''
						});
					}
				}
			}

			// Check loose bits
			if (toggleDef.looseBits) {
				for (const bit of toggleDef.looseBits) {
					if (selectedBits.includes(bit)) continue;

					const key = `${code}::${bit}`;
					const entry = SKU_LOOKUP[key];
					if (!entry) continue;

					items.push({
						name: entry.label,
						sku: entry.sku,
						price: entry.price,
						maintSku: entry.maintSku,
						maintPrice: entry.maintPrice,
						description: BIT_DESCRIPTIONS[bit] ?? ''
					});
				}
			}

			// Use "Complete {code}" label when some bits are already selected (partial package)
			const groupLabel = noneSelected ? label : `Complete ${code}`;
			if (items.length > 0) groups.push({ label: groupLabel, items });
		}

		// Additional modules — check which are not currently selected
		const moduleItems: UpgradeItem[] = [];
		const selectedMaintSkus = panelsStore.getItems('maintenance-skus');

		for (const moduleSku of MODULE_SKUS) {
			// If the module's maint SKU is selected in the panel, it's already owned
			if (selectedMaintSkus.includes(moduleSku.maintSku)) continue;

			const prereqNote = REQUIRES_SC_MILL_MODULES.has(moduleSku.sku) ? ' Requires SC-Mill.' : '';
			const desc = BIT_DESCRIPTIONS[moduleSku.sku] ?? moduleSku.label + '.' + prereqNote;

			moduleItems.push({
				name: moduleSku.label,
				sku: moduleSku.sku,
				price: moduleSku.price,
				maintSku: moduleSku.maintSku,
				maintPrice: moduleSku.maintPrice,
				description: desc
			});
		}

		if (moduleItems.length > 0) {
			groups.push({ label: 'Additional Modules', items: moduleItems });
		}

		return groups;
	});

	/** Check if a group's bits are at least partially selected */
	function isGroupSelected(packageCode: string, groupId: string, selectedBits: string[]): boolean {
		const pkg = packageDefs.find((p) => p.code === packageCode);
		if (!pkg) return false;

		const group = pkg.groups?.find((g) => g.masterId === groupId);
		if (!group) return false;

		return group.bits.some((bit) => selectedBits.includes(bit));
	}

	async function handleCopySku(sku: string) {
		await copyToClipboard(sku, false);
	}

	function formatPrice(price: number): string {
		return '$' + price.toLocaleString('en-US');
	}

	let totalUpgrade = $derived(
		upgradeGroups.reduce(
			(sum, g) =>
				sum + g.items.reduce((s, i) => s + (skuMode === 'ms' ? i.maintPrice : i.price), 0),
			0
		)
	);
</script>

<Modal {open} {onClose} title="Upgrades — {skuMode === 'ms' ? 'Maintenance' : 'New Sale'}" size="wide">
	{#if upgradeGroups.length === 0}
		<div class="empty-state">
			<Sparkles size={36} strokeWidth={1.5} class="empty-icon" />
			<p class="empty-title">Everything's selected.</p>
			<p class="empty-sub">All available packages and modules are already on this quote.</p>
		</div>
	{:else}
		<div class="upgrade-content">
			{#each upgradeGroups as group (group.label)}
				<section class="upgrade-group">
					<h4 class="group-title">
						<PackagePlus size={13} strokeWidth={2.25} />
						<span>{group.label}</span>
						<span class="group-count">{group.items.length}</span>
					</h4>
					<div class="item-list">
						{#each group.items as item (item.sku)}
							<div class="upgrade-item">
								<div class="item-header">
									<span class="item-name">{item.name}</span>
									<div class="item-meta">
										<Tooltip text="Click to copy {skuMode === 'ms' ? item.maintSku : item.sku}">
											<button
												type="button"
												class="item-sku"
												onclick={() => handleCopySku(skuMode === 'ms' ? item.maintSku : item.sku)}
												>{skuMode === 'ms' ? item.maintSku : item.sku}</button
											>
										</Tooltip>
										<span class="item-price"
											>{formatPrice(skuMode === 'ms' ? item.maintPrice : item.price)}</span
										>
									</div>
								</div>
								{#if item.description}
									<p class="item-desc">{item.description}</p>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/each}

			<div class="total-bar">
				<span class="total-label">Total Upgrades</span>
				<span class="total-price">{formatPrice(totalUpgrade)}</span>
			</div>
		</div>
	{/if}
</Modal>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
		padding: 2.25rem var(--space-2) 1.5rem;
	}

	.empty-state :global(.empty-icon) {
		color: var(--gold-a45);
		margin-bottom: 0.25rem;
	}

	.empty-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 580;
		color: rgba(255, 255, 255, 0.92);
		letter-spacing: -0.012em;
	}

	.empty-sub {
		margin: 0;
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.55);
		max-width: 36ch;
		line-height: 1.45;
	}

	.upgrade-content {
		max-height: 60vh;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.upgrade-group {
		margin-bottom: 1.25rem;
	}

	.upgrade-group:last-of-type {
		margin-bottom: 0.75rem;
	}

	.group-title {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-solidcam-gold);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin: 0 0 0.625rem 0;
		padding-bottom: 0.375rem;
		border-bottom: 1px solid var(--gold-a30);
	}

	.group-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 22px;
		height: 18px;
		padding: 0 0.4rem;
		margin-left: auto;
		font-family: 'JetBrains Mono Variable', 'JetBrains Mono', monospace;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0;
		text-transform: none;
		background: var(--gold-a10);
		border: 1px solid var(--gold-a30);
		border-radius: 9999px;
		color: var(--color-solidcam-gold);
	}

	.item-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.upgrade-item {
		padding: 0.65rem 0.8rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		transition:
			background 150ms var(--ease-out-quart),
			border-color 150ms var(--ease-out-quart);
	}

	.upgrade-item:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.14);
	}

	.item-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.item-name {
		font-size: 0.8125rem;
		font-weight: 580;
		letter-spacing: -0.005em;
		color: rgba(255, 255, 255, 0.95);
	}

	.item-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* SKU chip — gold, consistent with the rest of the app (was bright red) */
	.item-sku {
		background: var(--gold-a10);
		color: var(--color-solidcam-gold);
		padding: 0.18rem 0.45rem;
		border-radius: 4px;
		font-size: 0.6875rem;
		font-family: 'JetBrains Mono Variable', 'JetBrains Mono', monospace;
		border: 1px solid var(--gold-a30);
		cursor: pointer;
		transition:
			background 150ms var(--ease-out-quart),
			border-color 150ms var(--ease-out-quart);
	}

	.item-sku:hover {
		background: var(--gold-a20);
		border-color: var(--gold-a45);
	}

	.item-price {
		font-family: 'JetBrains Mono Variable', 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-size: 0.78rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.85);
		white-space: nowrap;
	}

	.item-desc {
		margin: 0.4rem 0 0 0;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.55);
		line-height: 1.45;
	}

	/* Total bar — same vamp vocabulary as NewSalePanel */
	.total-bar {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 0.85rem;
		margin-top: 0.65rem;
		background: linear-gradient(
			135deg,
			rgba(212, 175, 55, 0.14) 0%,
			rgba(212, 175, 55, 0.05) 100%
		);
		border: 1px solid var(--gold-a30);
		border-radius: var(--radius-sm);
		box-shadow:
			0 0 18px rgba(212, 175, 55, 0.14),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.total-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-solidcam-gold, #d4af37);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.total-price {
		font-family: 'JetBrains Mono Variable', 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-solidcam-gold, #d4af37);
		letter-spacing: -0.01em;
		text-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
	}

</style>
