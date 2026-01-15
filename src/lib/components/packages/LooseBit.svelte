<script lang="ts">
	import { Checkbox } from '$components/ui';
	import { packagesStore } from '$stores/packages.svelte';
	import { toastStore } from '$stores/toast.svelte';

	interface Props {
		bit: string;
		packageCode: string;
		editMode?: boolean;
		draggable?: boolean;
		ondragstart?: (e: DragEvent) => void;
		ondragover?: (e: DragEvent) => void;
		ondrop?: (e: DragEvent) => void;
	}

	let {
		bit,
		packageCode,
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
	class="loose-bit"
	data-sortable-item
	data-bit={bit}
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
	.loose-bit {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		transition: background-color 150ms ease;
	}

	.loose-bit:hover {
		background-color: rgba(255, 255, 255, 0.05);
	}

	.loose-bit[draggable='true'] {
		cursor: grab;
	}

	.loose-bit[draggable='true']:active {
		cursor: grabbing;
	}

	.bit-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		cursor: pointer;
	}

	.bit-text {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.9);
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
		width: 20px;
		height: 20px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.4);
		font-size: 1rem;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.bit-remove-btn:hover {
		background: rgba(200, 16, 46, 0.2);
		color: #c8102e;
	}
</style>
