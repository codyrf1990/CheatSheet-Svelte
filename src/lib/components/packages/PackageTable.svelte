<script lang="ts">
	import type { Package } from '$types';
	import { Tooltip } from '$components/ui';
	import PackageRow from './PackageRow.svelte';

	interface Props {
		packages: Package[];
		maintenanceRange?: string;
		profileUsers?: number | null;
		solidcamVersion?: string | null;
		skuMode?: 'bdm' | 'ms';
		onWhatLeft?: () => void;
	}

	let {
		packages,
		maintenanceRange = '',
		profileUsers = null,
		solidcamVersion = null,
		skuMode = 'bdm',
		onWhatLeft
	}: Props = $props();
</script>

<div class="package-table-container">
	<div class="main-table tile">
		<table aria-label="SolidCAM packages and included modules">
			<caption class="sr-only"
				>SolidCAM package options with maintenance SKUs and included modules</caption
			>
			<thead>
				<tr>
					<th scope="col" class="col-package">Package</th>
					<th scope="col" class="col-maint">Maintenance</th>
					<th scope="col" class="col-bits">
						<div class="bits-header">
							<div></div>
							<span class="bits-label">Included Modules</span>
							<div class="bits-header-actions">
								{#if onWhatLeft}
									<Tooltip text="See available upgrades and add-ons">
										<button
											class="upgrades-btn"
											class:upgrades-btn-ms={skuMode === 'ms'}
											onclick={onWhatLeft}
											aria-label="See available upgrades and add-ons"
										>
											Upgrades
										</button>
									</Tooltip>
								{/if}
								{#if maintenanceRange}
									<Tooltip text="Maintenance dates">
										<span class="maintenance-range">
											{maintenanceRange}
										</span>
									</Tooltip>
								{/if}
								{#if solidcamVersion}
									<Tooltip text="SolidCAM version">
										<span class="version-badge">
											v{solidcamVersion}
										</span>
									</Tooltip>
								{/if}
								{#if profileUsers != null}
									<Tooltip text="Profile users (seats)">
										<span class="profile-users-badge">
											{profileUsers}
											{profileUsers === 1 ? 'user' : 'users'}
										</span>
									</Tooltip>
								{/if}
							</div>
						</div>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each packages as pkg (pkg.code)}
					<PackageRow {pkg} />
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
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.bits-label {
		text-align: center;
	}

	.bits-header-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		flex-wrap: wrap;
	}

	.upgrades-btn {
		font-size: 0.6rem;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: 4px;
		cursor: pointer;
		user-select: none;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		line-height: 1.3;
		background: var(--gold-a10);
		color: var(--color-solidcam-gold, #d4af37);
		border: 1px solid var(--gold-a30);
		transition:
			background 150ms var(--ease-out-quart),
			border-color 150ms var(--ease-out-quart),
			box-shadow 250ms var(--ease-out-expo);
	}

	.upgrades-btn:hover {
		background: var(--gold-a20);
		border-color: var(--gold-a45);
		box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
	}

	.upgrades-btn-ms {
		background: rgba(59, 130, 246, 0.12);
		color: #60a5fa;
		border-color: rgba(59, 130, 246, 0.3);
	}

	.upgrades-btn-ms:hover {
		background: rgba(59, 130, 246, 0.22);
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 0 12px rgba(59, 130, 246, 0.22);
	}

	.maintenance-range {
		padding: 2px 7px;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.12);
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: none;
		letter-spacing: 0.02em;
		color: rgba(255, 255, 255, 0.7);
		white-space: nowrap;
	}

	.version-badge {
		padding: 2px 7px;
		border-radius: 4px;
		background: rgba(59, 130, 246, 0.12);
		border: 1px solid rgba(59, 130, 246, 0.3);
		font-size: 0.6rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: rgba(96, 165, 250, 0.9);
		white-space: nowrap;
	}

	.profile-users-badge {
		padding: 2px 7px;
		border-radius: 4px;
		background: rgba(139, 92, 246, 0.12);
		border: 1px solid rgba(139, 92, 246, 0.3);
		font-size: 0.6rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: rgba(167, 139, 250, 0.9);
		white-space: nowrap;
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
			font-size: var(--text-xs);
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
