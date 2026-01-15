<script lang="ts">
	import type { PackageGroup } from '$types';
	import { Checkbox } from '$components/ui';
	import { packagesStore } from '$stores/packages.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import SubBit from './SubBit.svelte';

	interface Props {
		group: PackageGroup;
		packageCode: string;
		editMode?: boolean;
	}

	let { group, packageCode, editMode = false }: Props = $props();

	// Local state for expand/collapse
	let expanded = $state(true);

	// Derived state from store
	let masterState = $derived(packagesStore.getMasterBitState(packageCode, group.bits));

	function handleMasterToggle() {
		packagesStore.toggleMasterBit(packageCode, group.masterId, group.bits);
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

	function handleDragStart(e: DragEvent, index: number) {
		if (!editMode) return;
		draggedIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
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
		if (!editMode || draggedIndex === null) return;
		e.preventDefault();

		if (draggedIndex !== dropIndex) {
			const newOrder = [...group.bits];
			const [removed] = newOrder.splice(draggedIndex, 1);
			newOrder.splice(dropIndex, 0, removed);
			packagesStore.setOrder(packageCode, newOrder);
		}
		draggedIndex = null;
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
			aria-label={expanded ? 'Collapse group' : 'Expand group'}
		>
			<svg
				class="expand-icon"
				class:rotated={!expanded}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M19 9l-7 7-7-7" />
			</svg>
		</button>
	</div>
	{#if expanded}
		<ul class="sub-bits" data-sortable-group={group.masterId}>
			{#each group.bits as bit, index (bit)}
				<SubBit
					{bit}
					{packageCode}
					masterId={group.masterId}
					{editMode}
					draggable={editMode}
					ondragstart={(e) => handleDragStart(e, index)}
					ondragover={handleDragOver}
					ondrop={(e) => handleDrop(e, index)}
				/>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.master-bit {
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.25);
		overflow: hidden;
	}

	.master-header {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.375rem;
		background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.master-label {
		flex: 1;
		font-size: 0.7rem;
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

	.sub-bits {
		list-style: none;
		margin: 0;
		padding: 0.1rem 0;
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.master-header {
			padding: 0.2rem 0.3rem;
			gap: 0.2rem;
		}

		.master-label {
			font-size: 0.65rem;
		}

		.expand-toggle {
			width: 14px;
			height: 14px;
		}

		.expand-icon {
			width: 10px;
			height: 10px;
		}
	}

	@media (max-width: 640px) {
		.master-header {
			padding: 0.15rem 0.2rem;
			gap: 0.15rem;
		}

		.master-label {
			font-size: 0.55rem;
		}

		.expand-toggle {
			width: 12px;
			height: 12px;
		}

		.expand-icon {
			width: 8px;
			height: 8px;
		}

		.sub-bits {
			padding: 0.05rem 0;
		}
	}

	@media (max-width: 500px) {
		.master-header {
			padding: 0.1rem 0.15rem;
			gap: 0.1rem;
		}

		.master-label {
			font-size: 0.45rem;
		}

		.expand-toggle {
			width: 10px;
			height: 10px;
		}

		.expand-icon {
			width: 6px;
			height: 6px;
		}
	}
</style>
