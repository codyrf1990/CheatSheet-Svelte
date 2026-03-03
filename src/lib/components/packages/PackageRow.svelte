<script lang="ts">
	import type { Package } from '$types';
	import { Checkbox } from '$components/ui';
	import { packagesStore } from '$stores/packages.svelte';
	import { panelsStore } from '$stores/panels.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { userPrefsStore } from '$stores/userPrefs.svelte';
	import { applyOrder } from '$lib/utils/order';
	import { PACKAGE_TOGGLE_BITS, SC_TURN_LOCKED } from '$lib/data/prerequisites';
	import { getDisabledBits } from '$lib/services/buildValidation';
	import MasterBit from './MasterBit.svelte';
	import LooseBit from './LooseBit.svelte';

	// Compute disabled bits map from build validation
	let disabledBits = $derived(getDisabledBits(packagesStore.all, packagesStore.buildMode));

	interface Props {
		pkg: Package;
		editMode?: boolean;
	}

	let { pkg, editMode = false }: Props = $props();

	// Package master toggle state
	let packageToggleDef = $derived(PACKAGE_TOGGLE_BITS[pkg.code]);

	// Package is disabled if any of its group masterIds or loose bits are gated
	let isPackageDisabled = $derived.by(() => {
		if (!packageToggleDef) return false;
		if (packageToggleDef.groups?.some((g) => disabledBits.has(g))) return true;
		if (packageToggleDef.looseBits?.some((b) => disabledBits.has(b))) return true;
		return false;
	});

	let packageDisabledReason = $derived.by(() => {
		if (!packageToggleDef) return '';
		for (const g of packageToggleDef.groups ?? []) {
			if (disabledBits.has(g)) return disabledBits.get(g) ?? '';
		}
		for (const b of packageToggleDef.looseBits ?? []) {
			if (disabledBits.has(b)) return disabledBits.get(b) ?? '';
		}
		return '';
	});

	let packageToggleState = $derived.by(() => {
		if (!packageToggleDef) return { checked: false, indeterminate: false };
		const allBits: string[] = [];
		// Collect group bits
		if (packageToggleDef.groups && pkg.groups) {
			for (const groupId of packageToggleDef.groups) {
				const group = pkg.groups.find((g) => g.masterId === groupId);
				if (group) allBits.push(...group.bits);
			}
		}
		// Collect loose bits
		if (packageToggleDef.looseBits) allBits.push(...packageToggleDef.looseBits);

		const state = packagesStore.getStateReadOnly(pkg.code);
		const selectedCount = allBits.filter((b) => state.selectedBits.includes(b)).length;
		if (selectedCount === 0) return { checked: false, indeterminate: false };
		if (selectedCount === allBits.length) return { checked: true, indeterminate: false };
		return { checked: false, indeterminate: true };
	});

	function handlePackageToggle() {
		if (editMode || !packageToggleDef) return;
		if (isPackageDisabled) {
			toastStore.warning(packageDisabledReason);
			return;
		}
		const allBits: string[] = [];
		if (packageToggleDef.groups && pkg.groups) {
			for (const groupId of packageToggleDef.groups) {
				const group = pkg.groups.find((g) => g.masterId === groupId);
				if (group) allBits.push(...group.bits);
			}
		}
		if (packageToggleDef.looseBits) allBits.push(...packageToggleDef.looseBits);

		const state = packagesStore.getStateReadOnly(pkg.code);
		const allSelected = allBits.every((b) => state.selectedBits.includes(b));
		if (allSelected) {
			packagesStore.removeBits(pkg.code, allBits);
		} else {
			packagesStore.selectBits(pkg.code, allBits);
		}
	}

	// SC-Turn: combined display check
	let isSCTurn = $derived(pkg.code === 'SC-Turn');

	let scTurnSelected = $derived.by(() => {
		if (!isSCTurn) return false;
		const state = packagesStore.getStateReadOnly(pkg.code);
		return SC_TURN_LOCKED.every((b) => state.selectedBits.includes(b));
	});

	function handleSCTurnToggle() {
		if (editMode) return;
		const disabledBit = SC_TURN_LOCKED.find((b) => disabledBits.has(b));
		if (disabledBit) {
			toastStore.warning(disabledBits.get(disabledBit) ?? '');
			return;
		}
		if (scTurnSelected) {
			packagesStore.removeBits(pkg.code, SC_TURN_LOCKED);
		} else {
			packagesStore.selectBits(pkg.code, SC_TURN_LOCKED);
		}
	}

	// Use global remove mode from store
	let removeMode = $derived(panelsStore.removeMode);

	let hasGroups = $derived(pkg.groups && pkg.groups.length > 0);

	// Merge static loose bits with custom bits and moved bits, then apply stored order (global)
	let allLooseBits = $derived.by(() => {
		const staticBits = pkg.looseBits || [];
		const customBits = userPrefsStore.getCustomPackageBits(pkg.code);
		const membership = packagesStore.getGroupMembership(pkg.code);

		// Include bits that have been moved to 'loose' from groups
		const movedToLoose: string[] = [];
		for (const [bit, group] of Object.entries(membership)) {
			if (group === 'loose' && !staticBits.includes(bit) && !customBits.includes(bit)) {
				movedToLoose.push(bit);
			}
		}

		const allBits = [
			...staticBits,
			...customBits.filter((c) => !staticBits.includes(c)),
			...movedToLoose
		];
		return applyOrder(allBits, packagesStore.getLooseBitsOrder(pkg.code));
	});

	let hasLooseBits = $derived(allLooseBits.length > 0);

	function isCustomBit(bit: string): boolean {
		return userPrefsStore.isCustomPackageBit(pkg.code, bit);
	}

	async function handleCodeCopy() {
		try {
			await navigator.clipboard.writeText(pkg.code);
			toastStore.success('Copied!', 1500);
		} catch {
			toastStore.error('Failed to copy');
		}
	}

	async function handleMaintCopy() {
		try {
			await navigator.clipboard.writeText(pkg.maintenance);
			toastStore.success('Copied!', 1500);
		} catch {
			toastStore.error('Failed to copy');
		}
	}

	// Drag and drop state for reordering loose bits
	let draggedIndex = $state<number | null>(null);

	function handleDragStart(e: DragEvent, index: number, bit: string) {
		if (!editMode) return;
		e.stopPropagation();
		draggedIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			// Include bit name and source group in drag data for cross-group moves
			e.dataTransfer.setData('application/json', JSON.stringify({ bit, sourceGroup: 'loose' }));
		}
	}

	function handleDragOver(e: DragEvent) {
		if (!editMode) return;
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(e: DragEvent, dropIndex: number) {
		if (!editMode) return;
		e.preventDefault();

		// Try to get cross-group drag data
		const jsonData = e.dataTransfer?.getData('application/json');
		if (jsonData) {
			try {
				const data = JSON.parse(jsonData);
				if (data.bit && data.sourceGroup && data.sourceGroup !== 'loose') {
					// Cross-group move: from a MasterBit group to loose bits
					packagesStore.moveBitToGroup(pkg.code, data.bit, 'loose');
					// Add to end of loose bits order
					const currentOrder = [...allLooseBits];
					if (!currentOrder.includes(data.bit)) {
						currentOrder.push(data.bit);
						packagesStore.setLooseBitsOrder(pkg.code, currentOrder);
					}
					draggedIndex = null;
					return;
				}
			} catch {
				// Not valid JSON, continue with normal drop
			}
		}

		// Normal reorder within loose bits
		if (draggedIndex !== null && draggedIndex !== dropIndex) {
			const newOrder = [...allLooseBits];
			const [removed] = newOrder.splice(draggedIndex, 1);
			newOrder.splice(dropIndex, 0, removed);
			packagesStore.setLooseBitsOrder(pkg.code, newOrder);
		}
		draggedIndex = null;
	}

	// Handle drop on the loose bits container itself (not just on items)
	function handleLooseBitsContainerDrop(e: DragEvent) {
		if (!editMode) return;
		e.preventDefault();

		const jsonData = e.dataTransfer?.getData('application/json');
		if (jsonData) {
			try {
				const data = JSON.parse(jsonData);
				if (data.bit && data.sourceGroup && data.sourceGroup !== 'loose') {
					// Cross-group move: from a MasterBit group to loose bits
					packagesStore.moveBitToGroup(pkg.code, data.bit, 'loose');
					const currentOrder = [...allLooseBits];
					if (!currentOrder.includes(data.bit)) {
						currentOrder.push(data.bit);
						packagesStore.setLooseBitsOrder(pkg.code, currentOrder);
					}
				}
			} catch {
				// Ignore
			}
		}
		draggedIndex = null;
	}
</script>

<tr class="package-row" data-package={pkg.code}>
	<td class="pkg-cell">
		<div class="pkg-header">
			{#if packageToggleDef}
				<span class="pkg-toggle">
					<Checkbox
						checked={packageToggleState.checked}
						indeterminate={packageToggleState.indeterminate}
						onchange={handlePackageToggle}
						disabled={isPackageDisabled}
						aria-label="Toggle all {pkg.code} bits"
					/>
				</span>
			{/if}
			<div>
				<button type="button" class="code-btn package-code" onclick={handleCodeCopy}>
					{pkg.code}
				</button>
				<span class="package-description">{pkg.description}</span>
			</div>
		</div>
	</td>
	<td class="maint-cell">
		<button type="button" class="code-btn maint-code" onclick={handleMaintCopy}>
			{pkg.maintenance}
		</button>
	</td>
	<td class="bits-cell">
		<div class="bits-container" data-package-bits={pkg.code}>
			{#if isSCTurn}
				<!-- SC-Turn: combined display — both bits toggle as one unit -->
				<div class="loose-bits-section">
					<ul class="loose-bits">
						<li class="loose-bit">
							<div class="bit-label">
								<span class="checkbox-wrapper">
									<Checkbox checked={scTurnSelected} onchange={handleSCTurnToggle} disabled={!!SC_TURN_LOCKED.find((b) => disabledBits.has(b))} />
								</span>
								<span
									class="bit-text"
									role="button"
									tabindex="0"
									onclick={handleCodeCopy}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											handleCodeCopy();
										}
									}}
									data-copyable-bit>Turning + Backspindle</span
								>
							</div>
						</li>
					</ul>
				</div>
			{:else}
				{#if hasGroups}
					<div class="groups-grid">
						{#each pkg.groups as group (group.masterId)}
							<MasterBit
								{group}
								packageCode={pkg.code}
								{editMode}
								disabled={disabledBits.has(group.masterId)}
								disabledReason={disabledBits.get(group.masterId) ?? ''}
							/>
						{/each}
					</div>
				{/if}
				{#if hasLooseBits || editMode}
					<div
						class="loose-bits-section"
						class:has-groups={hasGroups}
						class:edit-mode={editMode}
						role="group"
						aria-label="Loose bits drop zone"
						ondragover={handleDragOver}
						ondrop={handleLooseBitsContainerDrop}
					>
						<ul class="loose-bits" data-sortable-group={pkg.code}>
							{#each allLooseBits as bit, index (bit)}
								<LooseBit
									{bit}
									packageCode={pkg.code}
									{editMode}
									{removeMode}
									isCustom={isCustomBit(bit)}
									disabled={disabledBits.has(bit)}
									disabledReason={disabledBits.get(bit) ?? ''}
									draggable={editMode && !disabledBits.has(bit)}
									ondragstart={(e) => handleDragStart(e, index, bit)}
									ondragover={handleDragOver}
									ondrop={(e) => handleDrop(e, index)}
								/>
							{/each}
						</ul>
						{#if editMode && allLooseBits.length === 0}
							<span class="drop-hint">Drop items here</span>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</td>
</tr>

<style>
	.package-row {
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.package-row:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.pkg-cell {
		padding: 0.3rem 0.4rem;
		vertical-align: top;
		overflow: hidden;
	}

	.pkg-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-0-5);
	}

	.pkg-toggle {
		display: flex;
		align-items: center;
		padding-top: 1px;
		flex-shrink: 0;
	}

	.checkbox-wrapper {
		display: flex;
		align-items: center;
	}

	.bit-label {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		flex: 1;
		cursor: pointer;
	}

	.bit-text {
		font-size: var(--text-xs);
		color: var(--chip-text-color);
		line-height: 1.2;
		cursor: pointer;
		transition: color 150ms ease;
	}

	.bit-text:hover {
		color: var(--chip-text-hover);
	}

	.code-btn {
		display: block;
		padding: 0;
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
	}

	.package-code {
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--color-solidcam-gold, #d4af37);
		letter-spacing: 0.02em;
		line-height: 1.2;
		transition: color 150ms ease;
	}

	.package-code:hover {
		color: #e5c55a;
	}

	.package-description {
		display: block;
		font-size: var(--text-xs);
		color: var(--chip-text-muted);
		margin-top: 0.15rem;
		line-height: 1.3;
	}

	.maint-cell {
		padding: 0.3rem 0.4rem;
		vertical-align: top;
		overflow: hidden;
	}

	.maint-code {
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-sm);
		color: var(--chip-text-muted);
		line-height: 1.2;
		cursor: pointer;
		transition: color 150ms ease;
	}

	.maint-code:hover {
		color: var(--chip-text-hover);
	}

	.bits-cell {
		padding: 0.3rem 0.4rem;
		vertical-align: top;
		width: 100%;
	}

	/* Main bits container - stacks groups grid above loose bits */
	.bits-container {
		display: flex;
		flex-direction: column;
		gap: calc(var(--space-1) + var(--space-0));
		width: 100%;
	}

	/* Flex layout for groups - fills available width */
	.groups-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		width: 100%;
	}

	.groups-grid > :global(.master-bit) {
		flex: 1 1 200px;
		min-width: 150px;
	}

	/* Loose bits section below groups */
	.loose-bits-section {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		min-height: 24px;
	}

	.loose-bits-section.has-groups {
		padding-top: var(--space-1);
		border-top: 1px solid var(--chip-border-color);
	}

	.loose-bits-section.edit-mode {
		outline: 1px dashed rgba(212, 175, 55, 0.3);
		outline-offset: 2px;
		border-radius: var(--radius-xs);
		padding: var(--space-0-5);
	}

	.drop-hint {
		font-size: var(--text-2xs);
		color: rgba(255, 255, 255, 0.4);
		font-style: italic;
	}

	.loose-bits {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	/* Hide Package column on narrow screens */
	@media (max-width: 768px) {
		.pkg-cell {
			display: none;
		}

		.maint-cell {
			padding: 0.25rem 0.2rem;
		}

		.maint-code {
			font-size: var(--text-xs);
		}

		.bits-cell {
			padding: 0.25rem 0.3rem;
		}

		.bits-container {
			gap: var(--space-1);
		}

		.groups-grid {
			gap: var(--space-0-5);
		}
	}

	/* Ultra-compact for split-screen */
	@media (max-width: 680px) {
		.maint-cell {
			padding: 0.2rem 0.15rem;
		}

		.maint-code {
			font-size: var(--text-2xs);
		}

		.bits-cell {
			padding: 0.2rem 0.2rem;
		}

		.bits-container {
			gap: var(--space-0-5);
		}

		.groups-grid {
			gap: var(--space-0-5);
		}
	}

	/* Narrow viewport - keep 2-column layout, readable text */
	@media (max-width: 640px) {
		.maint-cell {
			padding: 0.15rem 0.1rem;
		}

		.maint-code {
			font-size: var(--text-xs);
		}

		.bits-cell {
			padding: 0.15rem 0.125rem;
		}

		.bits-container {
			gap: var(--space-0);
		}

		.groups-grid {
			gap: var(--space-0);
		}

		.groups-grid > :global(.master-bit) {
			flex: 1 1 120px;
			min-width: 100px;
		}

		.loose-bits {
			gap: var(--space-0);
		}
	}
</style>
