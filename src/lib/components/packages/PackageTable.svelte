<script lang="ts">
	import type { Package } from '$types';
	import PackageRow from './PackageRow.svelte';

	interface Props {
		packages: Package[];
		editMode?: boolean;
	}

	let { packages, editMode = false }: Props = $props();
</script>

<div class="package-table-container">
	<div class="main-table">
		<table aria-label="SolidCAM packages and included bits">
			<caption class="sr-only">SolidCAM package options with maintenance SKUs and included software bits</caption>
			<thead>
				<tr>
					<th scope="col" class="col-package">Package</th>
					<th scope="col" class="col-maint">Maintenance</th>
					<th scope="col" class="col-bits">Included Bits</th>
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
		/* Smoked glass styling */
		background: linear-gradient(135deg, rgba(28, 28, 28, 0.94) 0%, rgba(12, 12, 12, 0.92) 100%);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.04);
		border-radius: 12px;
		box-shadow:
			0 25px 50px rgba(0, 0, 0, 0.4),
			0 10px 20px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.03);
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		table-layout: auto;
	}

	thead {
		background: linear-gradient(135deg, #c8102e 0%, #8b0000 100%);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	th {
		padding: 0.4rem 0.5rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.95);
	}

	.col-package {
		width: auto;
	}

	.col-maint {
		width: auto;
	}

	.col-bits {
		width: auto;
	}

	/* Hide Package column on narrow screens */
	@media (max-width: 768px) {
		.col-package {
			display: none;
		}

		th {
			padding: 0.45rem 0.4rem;
			font-size: 0.75rem;
		}
	}

	/* Ultra-compact for split-screen */
	@media (max-width: 680px) {
		th {
			padding: 0.3rem 0.15rem;
			font-size: 0.65rem;
			letter-spacing: 0.06em;
		}
	}

	/* Narrow viewport - keep text readable */
	@media (max-width: 640px) {
		th {
			padding: 0.25rem 0.15rem;
			font-size: 0.7rem;
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
