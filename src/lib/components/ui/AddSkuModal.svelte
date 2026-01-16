<script lang="ts">
	import { userPrefsStore } from '$stores/userPrefs.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { packages } from '$lib/data/packages';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import Input from './Input.svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open = $bindable(), onclose }: Props = $props();

	// Form state
	let selectedTarget = $state('');
	let skuValue = $state('');

	// Derived validation
	let isValid = $derived(selectedTarget !== '' && skuValue.trim().length > 0);

	// Build target options from packages + panels
	let packageOptions = $derived(
		packages.map((pkg) => ({
			value: `pkg:${pkg.code}`,
			label: `${pkg.code} - ${pkg.description}`
		}))
	);

	function handleSubmit() {
		if (!isValid) return;

		const sku = skuValue.trim();
		const [type, id] = selectedTarget.split(':');

		if (type === 'pkg') {
			userPrefsStore.addCustomPackageBit(id, sku);
			toastStore.success(`Added "${sku}" to ${id}`, 2000);
		} else if (type === 'panel') {
			const panelName = id === 'maintenance-skus' ? 'Maintenance' : 'SolidWorks';
			userPrefsStore.addCustomPanelItem(id, sku);
			toastStore.success(`Added "${sku}" to ${panelName}`, 2000);
		}

		// Reset and close
		selectedTarget = '';
		skuValue = '';
		onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && isValid) {
			e.preventDefault();
			handleSubmit();
		}
	}

	function handleClose() {
		selectedTarget = '';
		skuValue = '';
		onclose();
	}
</script>

{#snippet footer()}
	<div class="dialog-actions">
		<Button variant="ghost" size="sm" onclick={handleClose}>Cancel</Button>
		<Button variant="gold" size="sm" onclick={handleSubmit} disabled={!isValid}>Add</Button>
	</div>
{/snippet}

<Modal {open} onclose={handleClose} title="Add SKU" {footer}>
	<div class="add-sku-form">
		<label class="form-field">
			<span class="form-label">Target</span>
			<select bind:value={selectedTarget} class="form-select">
				<option value="">Select target...</option>
				<optgroup label="Packages">
					{#each packageOptions as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</optgroup>
				<optgroup label="Panels">
					<option value="panel:maintenance-skus">Maintenance SKUs</option>
					<option value="panel:solidworks-maintenance">SolidWorks Maintenance</option>
				</optgroup>
			</select>
		</label>

		<Input
			label="SKU"
			placeholder="Enter SKU..."
			bind:value={skuValue}
			onkeydown={handleKeydown}
			disabled={!selectedTarget}
		/>
	</div>
</Modal>

<style>
	.add-sku-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.form-label {
		font-size: var(--text-sm);
		font-weight: 500;
		color: rgba(255, 255, 255, 0.7);
	}

	.form-select {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		color: #f5f5f5;
		background-color: rgba(18, 18, 26, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.form-select:focus {
		outline: none;
		border-color: var(--color-solidcam-gold, #d4af37);
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
	}

	.form-select option {
		background: #1a1a1a;
		color: #f5f5f5;
	}

	.form-select optgroup {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.5);
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		width: 100%;
	}
</style>
