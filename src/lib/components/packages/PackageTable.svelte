<script lang="ts">
	import type { Package, PageState } from '$types';
	import PackageRow from './PackageRow.svelte';
	import { companiesStore } from '$stores/companies.svelte';
	import { packagesStore } from '$stores/packages.svelte';
	import { toastStore } from '$stores/toast.svelte';

	interface Props {
		packages: Package[];
		editMode?: boolean;
		maintenanceRange?: string;
		onwhatleft?: () => void;
	}

	let { packages, editMode = false, maintenanceRange = '', onwhatleft }: Props = $props();

	let currentMode = $derived(companiesStore.currentPageState?.mode ?? 'import');

	function toggleMode() {
		const page = companiesStore.currentPage;
		if (!page) return;
		const newMode = currentMode === 'build' ? 'import' : 'build';
		const newState: PageState = {
			...page.state,
			mode: newMode
		};
		companiesStore.savePageState(page.id, newState);
		toastStore.info(`Switched to ${newMode === 'build' ? 'Build' : 'Import'} mode`);
	}

	// Show "What's Left" when in import mode or when any bits are selected
	let showWhatLeft = $derived.by(() => {
		if (currentMode === 'import') return true;
		const states = packagesStore.all;
		return Object.values(states).some((s) => s.selectedBits.length > 0);
	});
</script>

<div class="package-table-container">
	<div class="main-table tile">
		<table aria-label="SolidCAM packages and included bits">
			<caption class="sr-only"
				>SolidCAM package options with maintenance SKUs and included software bits</caption
			>
			<thead>
				<tr>
					<th scope="col" class="col-package">Package</th>
					<th scope="col" class="col-maint">Maintenance</th>
					<th scope="col" class="col-bits">
						<div class="bits-header">
							<span>Included Bits</span>
							<div class="bits-header-actions">
								<button
									class="mode-badge {currentMode === 'build' ? 'mode-build' : 'mode-import'}"
									onclick={toggleMode}
									title="Click to toggle between Build and Import mode"
								>
									{currentMode === 'build' ? 'BUILD' : 'IMPORT'}
								</button>
								{#if showWhatLeft && onwhatleft}
									<button
										class="what-left-btn"
										onclick={onwhatleft}
										title="See what packages and modules are not yet selected"
									>
										What's Left
									</button>
								{/if}
								{#if maintenanceRange}
									<span class="maintenance-range" title="Maintenance dates">
										{maintenanceRange}
									</span>
								{/if}
							</div>
						</div>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each packages as pkg (pkg.code)}
					<PackageRow {pkg} {editMode} />
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.package-table-container {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.main-table {
		width: 100%;
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		table-layout: auto;
	}

	thead {
		position: relative;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.25) 100%),
			linear-gradient(135deg, #a10f22 0%, #560910 100%);
		border-bottom: 1px solid rgba(212, 175, 55, 0.35);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			inset 0 -1px 0 rgba(0, 0, 0, 0.55);
	}

	thead::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(110deg, rgba(255, 255, 255, 0.08), transparent 55%);
		opacity: 0.6;
		pointer-events: none;
	}

	thead::after {
		content: '';
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.18);
		pointer-events: none;
	}

	th {
		padding: var(--space-1) var(--space-2);
		text-align: left;
		font-size: var(--tile-title-size);
		font-weight: var(--tile-title-weight);
		text-transform: uppercase;
		letter-spacing: var(--tile-title-tracking);
		color: var(--tile-title-color);
		text-shadow: 0 1px 0 rgba(0, 0, 0, 0.45);
		position: relative;
		z-index: 1;
	}

	thead th + th {
		border-left: 1px solid rgba(255, 255, 255, 0.12);
	}

	.col-package {
		width: 22%;
		min-width: 185px;
	}

	.col-maint {
		width: 16%;
		min-width: 140px;
	}

	.col-bits {
		width: auto;
	}

	.bits-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.bits-header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.mode-badge {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 1px 8px;
		border-radius: 999px;
		cursor: pointer;
		user-select: none;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: all 150ms ease;
		line-height: 1.4;
	}

	.mode-build {
		background: rgba(113, 63, 18, 0.3);
		color: #facc15;
		border: 1px solid rgba(202, 138, 4, 0.4);
	}

	.mode-import {
		background: rgba(39, 39, 42, 1);
		color: rgba(161, 161, 170, 1);
		border: 1px solid rgba(82, 82, 91, 0.4);
	}

	.mode-badge:hover {
		filter: brightness(1.2);
	}

	.what-left-btn {
		font-size: 0.65rem;
		font-weight: 600;
		padding: 1px 8px;
		border-radius: 999px;
		cursor: pointer;
		user-select: none;
		letter-spacing: 0.03em;
		line-height: 1.4;
		background: rgba(74, 222, 128, 0.12);
		color: #4ade80;
		border: 1px solid rgba(74, 222, 128, 0.3);
		transition: all 150ms ease;
	}

	.what-left-btn:hover {
		background: rgba(74, 222, 128, 0.2);
		border-color: rgba(74, 222, 128, 0.5);
		filter: brightness(1.1);
	}

	.maintenance-range {
		padding: 2px 10px;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.18);
		border: 1px solid rgba(255, 255, 255, 0.15);
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: none;
		letter-spacing: 0.04em;
		color: rgba(255, 255, 255, 0.95);
	}

	/* Hide Package column on narrow screens */
	@media (max-width: 768px) {
		.col-package {
			display: none;
		}

		th {
			padding: var(--space-1) var(--space-0-5);
			font-size: var(--text-sm);
		}
	}

	/* Ultra-compact for split-screen */
	@media (max-width: 680px) {
		th {
			padding: var(--space-0-5) var(--space-0);
			font-size: var(--text-2xs);
			letter-spacing: 0.06em;
		}
	}

	/* Narrow viewport - keep text readable */
	@media (max-width: 640px) {
		th {
			padding: var(--space-1) var(--space-0);
			font-size: var(--text-xs);
			letter-spacing: 0.04em;
		}
	}

	/* Screen reader only */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
