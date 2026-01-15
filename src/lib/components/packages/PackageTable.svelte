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
		<table>
			<thead>
				<tr>
					<th class="col-package">Package</th>
					<th class="col-maint">Maintenance</th>
					<th class="col-bits">Included Bits</th>
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
	}

	.main-table {
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
	}

	thead {
		background: linear-gradient(135deg, #c8102e 0%, #8b0000 100%);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	th {
		padding: 0.56rem 0.6rem;
		text-align: left;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.95);
	}

	.col-package {
		width: 200px;
	}

	.col-maint {
		width: 160px;
	}

	.col-bits {
		width: auto; /* Takes remaining space */
	}

	/* Hide Package column on narrow screens */
	@media (max-width: 768px) {
		.col-package {
			display: none;
		}

		.col-maint {
			width: 4.5rem;
			min-width: 4.5rem;
			padding: 0.5rem 0.25rem;
		}

		th {
			padding: 0.45rem 0.4rem;
			font-size: 0.75rem;
		}
	}

	/* Ultra-compact for split-screen */
	@media (max-width: 680px) {
		.col-maint {
			width: 3.5rem;
			min-width: 3.5rem;
		}

		th {
			padding: 0.3rem 0.2rem;
			font-size: 0.7rem;
			letter-spacing: 0.08em;
		}
	}
</style>
