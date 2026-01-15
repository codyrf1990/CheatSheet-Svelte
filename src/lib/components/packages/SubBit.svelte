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
		gap: 0.1rem;
		padding: 0.1rem 0.15rem;
		border-radius: 2px;
		transition: background-color 150ms ease;
		min-width: 0;
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
		gap: 0.15rem;
		flex: 1;
		cursor: pointer;
		min-width: 0;
	}

	.bit-text {
		font-size: 0.6rem;
		color: rgba(255, 255, 255, 0.85);
		cursor: pointer;
		transition: color 150ms ease;
		word-break: break-word;
	}

	.bit-text:hover {
		color: var(--color-solidcam-gold, #d4af37);
	}

	.bit-remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 12px;
		height: 12px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 2px;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.6rem;
		cursor: pointer;
		transition: all 150ms ease;
		flex-shrink: 0;
	}

	.bit-remove-btn:hover {
		background: rgba(200, 16, 46, 0.2);
		color: #c8102e;
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.sub-bit {
			padding: 0.075rem 0.1rem;
			gap: 0.075rem;
		}

		.bit-label {
			gap: 0.1rem;
		}

		.bit-text {
			font-size: 0.5rem;
		}

		.bit-remove-btn {
			width: 10px;
			height: 10px;
			font-size: 0.5rem;
		}
	}

	@media (max-width: 640px) {
		.sub-bit {
			padding: 0.06rem 0.1rem;
		}

		.bit-label {
			gap: 0.1rem;
		}

		.bit-text {
			font-size: 0.6rem;
		}

		.bit-remove-btn {
			width: 10px;
			height: 10px;
			font-size: 0.45rem;
		}
	}
</style>
