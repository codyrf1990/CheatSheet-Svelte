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
		gap: 0.125rem;
		padding: 0.125rem 0.25rem;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		transition: background-color 150ms ease;
	}

	.loose-bit:hover {
		background-color: rgba(255, 255, 255, 0.06);
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
		gap: 0.25rem;
		flex: 1;
		cursor: pointer;
	}

	.bit-text {
		font-size: 0.65rem;
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
		width: 14px;
		height: 14px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 3px;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.bit-remove-btn:hover {
		background: rgba(200, 16, 46, 0.2);
		color: #c8102e;
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.loose-bit {
			padding: 0.1rem 0.2rem;
			gap: 0.1rem;
		}

		.bit-label {
			gap: 0.2rem;
		}

		.bit-text {
			font-size: 0.6rem;
		}

		.bit-remove-btn {
			width: 12px;
			height: 12px;
			font-size: 0.65rem;
		}
	}

	@media (max-width: 640px) {
		.loose-bit {
			padding: 0.075rem 0.15rem;
		}

		.bit-label {
			gap: 0.15rem;
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

	@media (max-width: 500px) {
		.loose-bit {
			padding: 0.06rem 0.15rem;
		}

		.bit-text {
			font-size: 0.55rem;
		}

		.bit-remove-btn {
			width: 12px;
			height: 12px;
			font-size: 0.55rem;
		}
	}
</style>
