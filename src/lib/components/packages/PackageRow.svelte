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

	let hasGroups = $derived(pkg.groups && pkg.groups.length > 0);
	let hasLooseBits = $derived(pkg.looseBits && pkg.looseBits.length > 0);

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
		<div class="bits-container" data-package-bits={pkg.code}>
			{#if hasGroups}
				<div class="groups-grid">
					{#each pkg.groups as group (group.masterId)}
						<MasterBit {group} packageCode={pkg.code} {editMode} />
					{/each}
				</div>
			{/if}
			{#if hasLooseBits}
				<div class="loose-bits-section" class:has-groups={hasGroups}>
					<ul class="loose-bits" data-sortable-group={pkg.code}>
						{#each pkg.looseBits as bit (bit)}
							<LooseBit {bit} packageCode={pkg.code} {editMode} />
						{/each}
					</ul>
				</div>
			{/if}
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
		padding: 0.3rem 0.4rem;
		vertical-align: top;
		overflow: hidden;
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
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-solidcam-gold, #d4af37);
		transition: color 150ms ease;
	}

	.package-code:hover {
		color: #e5c55a;
	}

	.package-description {
		display: block;
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.6);
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
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: color 150ms ease;
	}

	.maint-code:hover {
		color: var(--color-solidcam-gold, #d4af37);
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
		gap: 0.375rem;
		width: 100%;
	}

	/* Flex layout for groups - fills available width */
	.groups-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		width: 100%;
	}

	.groups-grid > :global(.master-bit) {
		flex: 1 1 200px;
		min-width: 150px;
	}

	/* Loose bits section below groups */
	.loose-bits-section {
		display: flex;
	}

	.loose-bits-section.has-groups {
		padding-top: 0.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.loose-bits {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
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
			font-size: 0.7rem;
		}

		.bits-cell {
			padding: 0.25rem 0.3rem;
		}

		.bits-container {
			gap: 0.25rem;
		}

		.groups-grid {
			gap: 0.2rem;
		}
	}

	/* Ultra-compact for split-screen */
	@media (max-width: 680px) {
		.maint-cell {
			padding: 0.2rem 0.15rem;
		}

		.maint-code {
			font-size: 0.6rem;
		}

		.bits-cell {
			padding: 0.2rem 0.2rem;
		}

		.bits-container {
			gap: 0.2rem;
		}

		.groups-grid {
			gap: 0.15rem;
		}
	}

	/* Extreme narrow */
	@media (max-width: 500px) {
		.maint-cell {
			padding: 0.15rem 0.1rem;
		}

		.maint-code {
			font-size: 0.5rem;
		}

		.bits-cell {
			padding: 0.15rem 0.125rem;
		}

		.bits-container {
			gap: 0.15rem;
		}

		.groups-grid {
			flex-direction: column;
			gap: 0.125rem;
		}

		.groups-grid > :global(.master-bit) {
			flex: 1 1 100%;
		}

		.loose-bits {
			gap: 0.15rem;
		}
	}
</style>
