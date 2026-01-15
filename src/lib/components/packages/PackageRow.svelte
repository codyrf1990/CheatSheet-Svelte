<script lang="ts">
	import type { Package } from '$types';
	import { toastStore } from '$stores/toast.svelte';
	import MasterBit from './MasterBit.svelte';
	import LooseBit from './LooseBit.svelte';

	interface Props {
		pkg: Package;
		editMode?: boolean;
	}

	let { pkg, editMode = false }: Props = $props();

	// SC-Mill uses split layout for better visual organization
	let layoutClass = $derived(
		pkg.code === 'SC-Mill' ? 'bits-layout bits-layout--split' : 'bits-layout'
	);

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

</script>

<tr class="package-row" data-package={pkg.code}>
	<td class="pkg-cell">
		<button type="button" class="code-btn package-code" onclick={handleCodeCopy}>
			{pkg.code}
		</button>
		<span class="package-description">{pkg.description}</span>
	</td>
	<td class="maint-cell">
		<button type="button" class="code-btn maint-code" onclick={handleMaintCopy}>
			{pkg.maintenance}
		</button>
	</td>
	<td class="bits-cell">
		<div class="package-bits-wrapper">
			<div class={layoutClass} data-package-bits={pkg.code}>
				{#if pkg.groups && pkg.groups.length > 0}
					<div class="group-column">
						{#each pkg.groups as group (group.masterId)}
							<MasterBit {group} packageCode={pkg.code} {editMode} />
						{/each}
					</div>
				{/if}
				{#if pkg.looseBits && pkg.looseBits.length > 0}
					<ul class="loose-bits" data-sortable-group={pkg.code}>
						{#each pkg.looseBits as bit (bit)}
							<LooseBit {bit} packageCode={pkg.code} {editMode} />
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</td>
</tr>

<style>
	.package-row {
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.package-row:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.pkg-cell {
		padding: 0.48rem 0.75rem;
		vertical-align: top;
		min-width: 160px;
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
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-solidcam-gold, #d4af37);
		transition: color 150ms ease;
	}

	.package-code:hover {
		color: #e5c55a;
	}

	.package-description {
		display: block;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
		margin-top: 0.25rem;
		line-height: 1.4;
	}

	.maint-cell {
		padding: 0.48rem 0.75rem;
		vertical-align: top;
		min-width: 120px;
	}

	.maint-code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: color 150ms ease;
	}

	.maint-code:hover {
		color: var(--color-solidcam-gold, #d4af37);
	}

	.bits-cell {
		padding: 0.48rem 0.75rem;
		vertical-align: top;
	}

	.package-bits-wrapper {
		display: flex;
	}

	.bits-layout {
		display: flex;
		gap: 0.75rem;
		flex: 1;
	}

	.bits-layout--split {
		flex-direction: row;
	}

	.group-column {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 180px;
	}

	.loose-bits {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	/* Hide Package column on narrow screens */
	@media (max-width: 768px) {
		.pkg-cell {
			display: none;
		}

		.maint-cell {
			min-width: 4.5rem;
			padding: 0.5rem 0.25rem;
		}

		.maint-code {
			font-size: 0.75rem;
		}

		.bits-cell {
			padding: 0.5rem;
		}

		.group-column {
			min-width: 150px;
		}
	}

	/* Ultra-compact for split-screen */
	@media (max-width: 680px) {
		.maint-cell {
			min-width: 3.5rem;
		}

		.maint-code {
			font-size: 0.6875rem;
		}

		.group-column {
			min-width: 120px;
		}

		.bits-layout {
			gap: 0.5rem;
		}
	}
</style>
