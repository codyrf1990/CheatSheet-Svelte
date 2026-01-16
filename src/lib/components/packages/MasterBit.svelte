<script lang="ts">
	import type { PackageGroup } from '$types';
	import { Checkbox } from '$components/ui';
	import { packagesStore } from '$stores/packages.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { applyOrder } from '$lib/utils/order';
	import SubBit from './SubBit.svelte';

	interface Props {
		group: PackageGroup;
		packageCode: string;
		editMode?: boolean;
	}

	let { group, packageCode, editMode = false }: Props = $props();

	// Local state for expand/collapse
	let expanded = $state(true);

	// Compute effective bits considering groupMembership overrides
	let effectiveBits = $derived(() => {
		const state = packagesStore.getStateReadOnly(packageCode);
		const membership = state.groupMembership || {};

		// Start with static bits that haven't been moved elsewhere
		const bits = group.bits.filter((bit) => {
			const assignedGroup = membership[bit];
			return !assignedGroup || assignedGroup === group.masterId;
		});

		// Add bits that have been moved to this group from elsewhere
		for (const [bit, assignedGroup] of Object.entries(membership)) {
			if (assignedGroup === group.masterId && !group.bits.includes(bit)) {
				bits.push(bit);
			}
		}

		return bits;
	});

	// Apply stored order to effective bits
	let orderedBits = $derived(() => {
		const storedOrder = packagesStore.getStateReadOnly(packageCode).order;
		return applyOrder(effectiveBits(), storedOrder);
	});

	// Derived state from store - use effective bits for checkbox state
	let masterState = $derived(packagesStore.getMasterBitState(packageCode, effectiveBits()));

	function handleMasterToggle() {
		if (editMode) return;
		packagesStore.toggleMasterBit(packageCode, group.masterId, effectiveBits());
	}

	function handleExpandToggle() {
		expanded = !expanded;
	}

	async function handleLabelCopy() {
		if (editMode) return;
		try {
			await navigator.clipboard.writeText(group.label);
			toastStore.success('Copied!', 1500);
		} catch {
			toastStore.error('Failed to copy');
		}
	}

	function handleLabelKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleLabelCopy();
		}
	}

	// Drag and drop state for reordering
	let draggedIndex = $state<number | null>(null);
	let draggedBit = $state<string | null>(null);

	function handleDragStart(e: DragEvent, index: number, bit: string) {
		if (!editMode) return;
		e.stopPropagation();
		draggedIndex = index;
		draggedBit = bit;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			// Include bit name and source group for cross-group moves
			e.dataTransfer.setData(
				'application/json',
				JSON.stringify({ bit, sourceGroup: group.masterId })
			);
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
				if (data.bit && data.sourceGroup && data.sourceGroup !== group.masterId) {
					// Cross-group move: from loose or another group to this group
					packagesStore.moveBitToGroup(packageCode, data.bit, group.masterId);
					draggedIndex = null;
					draggedBit = null;
					return;
				}
			} catch {
				// Not valid JSON, continue with normal drop
			}
		}

		// Normal reorder within this group
		if (draggedIndex !== null && draggedIndex !== dropIndex) {
			const newOrder = [...orderedBits()];
			const [removed] = newOrder.splice(draggedIndex, 1);
			newOrder.splice(dropIndex, 0, removed);
			packagesStore.setOrder(packageCode, newOrder);
		}
		draggedIndex = null;
		draggedBit = null;
	}

	// Handle drop on the sub-bits container itself
	function handleContainerDrop(e: DragEvent) {
		if (!editMode) return;
		e.preventDefault();

		const jsonData = e.dataTransfer?.getData('application/json');
		if (jsonData) {
			try {
				const data = JSON.parse(jsonData);
				if (data.bit && data.sourceGroup && data.sourceGroup !== group.masterId) {
					// Cross-group move to this group
					packagesStore.moveBitToGroup(packageCode, data.bit, group.masterId);
				}
			} catch {
				// Ignore
			}
		}
		draggedIndex = null;
		draggedBit = null;
	}
</script>

<div class="master-bit" data-master={group.masterId} data-master-label={group.label}>
	<div class="master-header">
		<Checkbox
			checked={masterState.checked}
			indeterminate={masterState.indeterminate}
			onchange={handleMasterToggle}
		/>
		<span
			class="master-label"
			role="button"
			tabindex="0"
			onclick={handleLabelCopy}
			onkeydown={handleLabelKeydown}
			data-copyable-bit
		>
			{group.label}
		</span>
		<button
			type="button"
			class="expand-toggle"
			onclick={handleExpandToggle}
			aria-expanded={expanded}
			aria-controls="subbits-{group.masterId}"
			aria-label="{expanded ? 'Collapse' : 'Expand'} {group.label}"
		>
			<svg
				class="expand-icon"
				class:rotated={!expanded}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<path d="M19 9l-7 7-7-7" />
			</svg>
		</button>
	</div>
	{#if expanded}
		<ul
			id="subbits-{group.masterId}"
			class="sub-bits"
			class:edit-mode={editMode}
			data-sortable-group={group.masterId}
			role="group"
			aria-label="{group.label} options"
			ondragover={handleDragOver}
			ondrop={handleContainerDrop}
		>
			{#each orderedBits() as bit, index (bit)}
				<SubBit
					{bit}
					{packageCode}
					masterId={group.masterId}
					{editMode}
					draggable={editMode}
					ondragstart={(e) => handleDragStart(e, index, bit)}
					ondragover={handleDragOver}
					ondrop={(e) => handleDrop(e, index)}
				/>
			{/each}
			{#if editMode && orderedBits().length === 0}
				<li class="drop-hint">Drop items here</li>
			{/if}
		</ul>
	{/if}
</div>

<style>
	.master-bit {
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.25);
		overflow: hidden;
		width: 100%;
		min-width: 0;
	}

	.master-header {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) calc(var(--space-1) + var(--space-0));
		background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.master-label {
		flex: 1;
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-solidcam-gold, #d4af37);
		cursor: pointer;
		transition: color 150ms ease;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.master-label:hover {
		color: #e5c55a;
	}

	.expand-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 3px;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition: all 150ms ease;
		flex-shrink: 0;
	}

	.expand-toggle:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
	}

	.expand-icon {
		width: 12px;
		height: 12px;
		transition: transform 200ms ease;
	}

	.expand-icon.rotated {
		transform: rotate(-90deg);
	}

	/* 2-column grid for sub-bits - balanced readability */
	.sub-bits {
		list-style: none;
		margin: 0;
		padding: var(--space-0-5);
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-0-5);
		min-height: 24px;
	}

	.sub-bits.edit-mode {
		outline: 1px dashed rgba(212, 175, 55, 0.2);
		outline-offset: -2px;
	}

	.drop-hint {
		grid-column: span 2;
		font-size: var(--text-2xs);
		color: rgba(255, 255, 255, 0.4);
		font-style: italic;
		text-align: center;
		padding: var(--space-0-5);
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.master-header {
			padding: var(--space-0-5) var(--space-1);
			gap: var(--space-0-5);
		}

		.master-label {
			font-size: var(--text-2xs);
		}

		.expand-toggle {
			width: 12px;
			height: 12px;
		}

		.expand-icon {
			width: 9px;
			height: 9px;
		}

		.sub-bits {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: var(--space-0);
			padding: var(--space-px);
		}
	}

	@media (max-width: 640px) {
		.master-header {
			padding: var(--space-0) var(--space-0-5);
			gap: var(--space-0);
		}

		.master-label {
			font-size: var(--text-2xs);
		}

		.expand-toggle {
			width: 10px;
			height: 10px;
		}

		.expand-icon {
			width: 7px;
			height: 7px;
		}

		.sub-bits {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: var(--space-px);
			padding: var(--space-px);
		}
	}
</style>
