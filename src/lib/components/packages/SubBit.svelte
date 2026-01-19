<script lang="ts">
	import { Checkbox } from '$components/ui';
	import { packagesStore } from '$stores/packages.svelte';
	import { toastStore } from '$stores/toast.svelte';

	interface Props {
		bit: string;
		packageCode: string;
		masterId: string;
		editMode?: boolean;
		draggable?: boolean;
		ondragstart?: (e: DragEvent) => void;
		ondragover?: (e: DragEvent) => void;
		ondrop?: (e: DragEvent) => void;
	}

	let {
		bit,
		packageCode,
		masterId,
		editMode = false,
		draggable = false,
		ondragstart,
		ondragover,
		ondrop
	}: Props = $props();

	let isSelected = $derived(packagesStore.isBitSelected(packageCode, bit));

	function handleToggle() {
		if (editMode) return;
		packagesStore.toggleBit(packageCode, bit);
	}

	async function handleCopy() {
		if (editMode) return;
		try {
			await navigator.clipboard.writeText(bit);
			toastStore.success('Copied!', 1500);
		} catch {
			toastStore.error('Failed to copy');
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleCopy();
		}
	}
</script>

<li
	class="sub-bit"
	class:edit-mode={editMode}
	data-sortable-item
	data-bit={bit}
	data-parent={masterId}
	draggable={draggable && editMode}
	{ondragstart}
	{ondragover}
	{ondrop}
>
	<label class="bit-label">
		<span class="checkbox-wrapper">
			<Checkbox checked={isSelected} onchange={handleToggle} />
		</span>
		<span
			class="bit-text"
			role="button"
			tabindex="0"
			onclick={handleCopy}
			onkeydown={handleKeydown}
			data-copyable-bit>{bit}</span
		>
	</label>
</li>

<style>
	.sub-bit {
		display: flex;
		align-items: center;
		gap: var(--space-0);
		padding: var(--space-0) var(--space-0-5);
		border-radius: var(--radius-2xs);
		border: 1px solid transparent;
		transition: background-color 150ms ease;
		min-width: 0;
	}

	.sub-bit:hover {
		background-color: var(--chip-bg-hover);
		border-color: var(--chip-border-color);
		box-shadow: var(--chip-shadow);
	}

	.sub-bit[draggable='true'] {
		cursor: grab;
		user-select: none;
	}

	.sub-bit[draggable='true']:active {
		cursor: grabbing;
	}

	.sub-bit[draggable='true'] .bit-label,
	.sub-bit[draggable='true'] .bit-label .bit-text {
		cursor: grab;
	}

	.sub-bit[draggable='true']:active .bit-label,
	.sub-bit[draggable='true']:active .bit-label .bit-text {
		cursor: grabbing;
	}

	.sub-bit.edit-mode {
		outline: 1px dashed rgba(212, 175, 55, 0.4);
		outline-offset: -1px;
	}

	.sub-bit.edit-mode .bit-label {
		pointer-events: none;
	}

	.checkbox-wrapper {
		display: flex;
		align-items: center;
	}

	.bit-label {
		display: flex;
		align-items: center;
		gap: var(--space-0-5);
		flex: 1;
		cursor: pointer;
		min-width: 0;
	}

	.bit-text {
		font-size: var(--text-2xs);
		color: var(--chip-text-color);
		line-height: 1.2;
		cursor: pointer;
		transition: color 150ms ease;
		word-break: break-word;
	}

	.bit-text:hover {
		color: var(--chip-text-hover);
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.sub-bit {
			padding: var(--space-px) var(--space-0);
			gap: var(--space-px);
		}

		.bit-label {
			gap: var(--space-0);
		}

		.bit-text {
			font-size: var(--text-2xs);
		}
	}

	@media (max-width: 640px) {
		.sub-bit {
			padding: var(--space-px) var(--space-0);
		}

		.bit-label {
			gap: var(--space-0);
		}

		.bit-text {
			font-size: var(--text-2xs);
		}
	}
</style>
