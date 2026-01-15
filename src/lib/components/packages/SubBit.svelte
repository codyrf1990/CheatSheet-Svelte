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

	function handleRemove() {
		packagesStore.removeCustomBit(packageCode, bit);
	}
</script>

<li
	class="sub-bit"
	data-sortable-item
	data-bit={bit}
	data-parent={masterId}
	draggable={draggable && editMode}
	{ondragstart}
	{ondragover}
	{ondrop}
>
	<label class="bit-label">
		<Checkbox checked={isSelected} onchange={handleToggle} />
		<span
			class="bit-text"
			role="button"
			tabindex="0"
			onclick={handleCopy}
			onkeydown={handleKeydown}
			data-copyable-bit
		>{bit}</span>
	</label>
	{#if editMode}
		<button type="button" class="bit-remove-btn" onclick={handleRemove} aria-label="Remove {bit}">
			&times;
		</button>
	{/if}
</li>

<style>
	.sub-bit {
		display: flex;
		align-items: center;
		gap: 0.1875rem;
		padding: 0.1875rem 0.375rem;
		padding-left: 1.25rem;
		border-radius: 4px;
		transition: background-color 150ms ease;
	}

	.sub-bit:hover {
		background-color: rgba(255, 255, 255, 0.05);
	}

	.sub-bit[draggable='true'] {
		cursor: grab;
	}

	.sub-bit[draggable='true']:active {
		cursor: grabbing;
	}

	.bit-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex: 1;
		cursor: pointer;
	}

	.bit-text {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.85);
		cursor: pointer;
		transition: color 150ms ease;
	}

	.bit-text:hover {
		color: var(--color-solidcam-gold, #d4af37);
	}

	.bit-remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.bit-remove-btn:hover {
		background: rgba(200, 16, 46, 0.2);
		color: #c8102e;
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.sub-bit {
			padding: 0.125rem 0.25rem;
			padding-left: 0.875rem;
			gap: 0.125rem;
		}

		.bit-label {
			gap: 0.25rem;
		}

		.bit-text {
			font-size: 0.65rem;
		}

		.bit-remove-btn {
			width: 14px;
			height: 14px;
			font-size: 0.75rem;
		}
	}

	@media (max-width: 640px) {
		.sub-bit {
			padding: 0.1rem 0.2rem;
			padding-left: 0.625rem;
		}

		.bit-label {
			gap: 0.2rem;
		}

		.bit-text {
			font-size: 0.55rem;
		}

		.bit-remove-btn {
			width: 12px;
			height: 12px;
			font-size: 0.65rem;
		}
	}

	@media (max-width: 500px) {
		.sub-bit {
			padding: 0.075rem 0.15rem;
			padding-left: 0.5rem;
		}

		.bit-text {
			font-size: 0.5rem;
		}

		.bit-remove-btn {
			width: 10px;
			height: 10px;
			font-size: 0.55rem;
		}
	}
</style>
