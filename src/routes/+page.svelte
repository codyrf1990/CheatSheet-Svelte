<script lang="ts">
	import { onMount } from 'svelte';
	import { Header, CompanyPageBar } from '$components/layout';
	import { PackageTable } from '$components/packages';
	import { EditablePanel } from '$components/panels';
	import { Calculator } from '$components/calculator';
	import { toastStore } from '$stores/toast.svelte';
	import { syncStore } from '$stores/sync.svelte';
	import { companiesStore } from '$stores/companies.svelte';
	import { packages, panels } from '$data';

	// Derived sync state from store
	let syncStatus = $derived(syncStore.status);
	let syncUsername = $derived(syncStore.username);

	// Package edit mode state (lifted from PackageTable)
	let packageEditMode = $state(false);

	function togglePackageEditMode() {
		packageEditMode = !packageEditMode;
	}

	function handleResetOrder() {
		// TODO: Reset to default order
		packageEditMode = false;
	}

	// Operations dropdown state
	let showOperations = $state(false);
	let operationsPosition = $state({ top: 0, left: 0 });

	// CF Tools dropdown state
	let showCFTools = $state(false);
	let cfToolsPosition = $state({ top: 0, left: 0 });

	// CF Tools links array (matching Machine Research)
	const cfToolsLinks = [
		{ label: 'TOS Tracker', href: 'https://tos-renewal-tracker.vercel.app/' },
		{ label: 'Opp Tracker', href: 'https://opp-tracker.vercel.app/' },
		{ label: 'Packages & Maintenance', href: 'https://codyrf1990.github.io/CheatSheet/' },
		{ label: 'Machine Catalogue', href: 'https://codyrf1990.github.io/machine-catalog-standalone/' }
	];

	// Initialize stores on mount
	onMount(() => {
		companiesStore.load();
	});

	async function handleLogout() {
		await syncStore.disconnect();
		toastStore.info('Signed out successfully');
	}

	function handleOperationsClick(position: { top: number; left: number }) {
		operationsPosition = position;
		showOperations = !showOperations;
		showCFTools = false;
	}

	function closeOperations() {
		showOperations = false;
	}

	function handleCFToolsClick(position: { top: number; left: number }) {
		cfToolsPosition = position;
		showCFTools = !showCFTools;
		showOperations = false;
	}

	function closeCFTools() {
		showCFTools = false;
	}

	function handleSalesTax() {
		closeOperations();
		toastStore.info('Opening Sales Tax Guide...');
		// TODO: Open Sales Tax Modal
	}

	function handleCurrentProducts() {
		closeOperations();
		toastStore.info('Opening Current Products...');
		// TODO: Open Current Products Modal
	}

	// Close dropdowns when clicking outside
	function handleWindowClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.dropdown-menu') && !target.closest('.nav-gray')) {
			showOperations = false;
			showCFTools = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<main class="page-layout">
	<!-- Header -->
	<Header
		{syncUsername}
		{syncStatus}
		onLogout={handleLogout}
		onOperationsClick={handleOperationsClick}
		showOperationsDropdown={showOperations}
		onCFToolsClick={handleCFToolsClick}
		showCFToolsDropdown={showCFTools}
	/>

	<!-- Company & Pages Bar -->
	<CompanyPageBar
		editMode={packageEditMode}
		onToggleEdit={togglePackageEditMode}
		onResetOrder={handleResetOrder}
	/>

	<!-- Main Content Area -->
	<div class="content-area">
		<!-- Package Table (Main Content) -->
		<section class="main-content">
			<PackageTable {packages} editMode={packageEditMode} />
		</section>

		<!-- Sidebar (Panels + Calculator) -->
		<aside class="sidebar">
			{#each panels as panel (panel.id)}
				<EditablePanel {panel} showCheckboxes />
			{/each}
			<Calculator />
		</aside>
	</div>
</main>

<!-- Operations Dropdown Menu -->
{#if showOperations}
	<div
		class="dropdown-menu operations-menu"
		style="top: {operationsPosition.top}px; left: {operationsPosition.left}px;"
		role="menu"
	>
		<button class="dropdown-item" role="menuitem" onclick={handleSalesTax}>
			<span class="dropdown-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
				</svg>
			</span>
			Sales Tax Guide
		</button>
		<button class="dropdown-item" role="menuitem" onclick={handleCurrentProducts}>
			<span class="dropdown-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
				</svg>
			</span>
			Current Products
		</button>
	</div>
{/if}

<!-- CF Tools Dropdown Menu -->
{#if showCFTools}
	<div
		class="dropdown-menu cf-tools-menu"
		style="top: {cfToolsPosition.top}px; left: {cfToolsPosition.left}px;"
		role="menu"
	>
		{#each cfToolsLinks as link}
			<a
				href={link.href}
				class="dropdown-item"
				target="_blank"
				rel="noopener noreferrer"
				role="menuitem"
				onclick={closeCFTools}
			>
				<span class="dropdown-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
						<polyline points="15 3 21 3 21 9"/>
						<line x1="10" y1="14" x2="21" y2="3"/>
					</svg>
				</span>
				{link.label}
			</a>
		{/each}
	</div>
{/if}

<style>
	.page-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		padding: clamp(0.4rem, 1.5vw, 1rem);
		max-width: 1400px;
		margin: 0 auto;
	}

	.content-area {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(200px, 380px);
		gap: clamp(0.3rem, 0.8vw, 0.6rem);
		margin-top: clamp(0.3rem, 0.8vw, 0.4rem);
	}

	.main-content {
		min-width: 0;
		overflow-x: auto;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}

	/* Dropdown menus - positioned absolutely on page */
	.dropdown-menu {
		position: fixed;
		min-width: 200px;
		background: linear-gradient(145deg, rgba(32, 32, 38, 0.98), rgba(24, 24, 30, 0.98));
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		box-shadow:
			0 20px 50px rgba(0, 0, 0, 0.5),
			0 8px 20px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(16px);
		z-index: 1000;
		overflow: hidden;
		animation: menuFadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes menuFadeIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.8);
		background: transparent;
		border: none;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.dropdown-item:hover {
		background: rgba(212, 175, 55, 0.15);
		color: #d4af37;
		padding-left: 1.25rem;
	}

	.dropdown-item:not(:last-child) {
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.dropdown-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		opacity: 0.7;
	}

	.dropdown-icon svg {
		width: 16px;
		height: 16px;
	}

	.dropdown-item:hover .dropdown-icon {
		opacity: 1;
	}

	/* Keep two-column layout at all widths - just compress the sidebar */
	@media (max-width: 900px) {
		.content-area {
			grid-template-columns: minmax(0, 1fr) minmax(180px, 320px);
			gap: 0.3rem;
		}

		.sidebar {
			gap: 0.3rem;
		}
	}

	@media (max-width: 768px) {
		.content-area {
			grid-template-columns: minmax(0, 1fr) minmax(160px, 280px);
			gap: 0.25rem;
		}

		.sidebar {
			gap: 0.25rem;
		}
	}

	@media (max-width: 640px) {
		.page-layout {
			padding: 0.3rem;
		}

		.content-area {
			grid-template-columns: minmax(0, 1fr) minmax(140px, 220px);
			gap: 0.2rem;
			margin-top: 0.25rem;
		}

		.sidebar {
			gap: 0.2rem;
		}
	}

	@media (max-width: 500px) {
		.page-layout {
			padding: 0.2rem;
		}

		.content-area {
			grid-template-columns: minmax(0, 1fr) minmax(120px, 180px);
			gap: 0.15rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.dropdown-menu {
			animation: none;
		}
	}
</style>
