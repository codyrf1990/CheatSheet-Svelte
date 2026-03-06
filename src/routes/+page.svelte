<script lang="ts">
	import { untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { Header, CompanyPageBar } from '$components/layout';
	import { PackageTable } from '$components/packages';
	import { BDMPanel, MaintenancePanel, NewSalePanel } from '$components/panels';
	import { Calculator } from '$components/calculator';
	import {
		SalesTaxModal,
		CurrentProductsModal,
		CompaniesModal,
		WhatLeftModal
	} from '$components/ui';
	import type { PageState } from '$types';
	import { toastStore } from '$stores/toast.svelte';
	import { syncStore } from '$stores/sync.svelte';
	import { companiesStore } from '$stores/companies.svelte';
	import { packagesStore } from '$stores/packages.svelte';
	import { panelsStore } from '$stores/panels.svelte';
	import { packages, panels } from '$data';
	import { getPageNameForLicense } from '$lib/utils/licenseSelections';
	import { userPrefsStore } from '$stores/userPrefs.svelte';

	// Derived sync state from store
	let syncStatus = $derived(syncStore.status);
	let syncUsername = $derived(syncStore.username);
	let currentCompany = $derived(companiesStore.current);
	let currentPage = $derived(companiesStore.currentPage);

	let maintenanceRange = $derived.by(() => {
		const company = currentCompany;
		const page = currentPage;
		if (!company || !page) return '';

		const licenses = company.licenses ?? [];
		if (licenses.length === 0) return '';

		const pageName = page.name;
		const matching = licenses.filter((license) => getPageNameForLicense(license) === pageName);

		let latest = matching[0];
		if (matching.length > 1) {
			latest = matching.reduce((acc, license) =>
				license.importedAt > acc.importedAt ? license : acc
			);
		} else if (!latest && licenses.length === 1) {
			latest = licenses[0];
		}

		if (!latest) return '';

		const start = latest.maintenanceStart?.trim() ?? '';
		const end = latest.maintenanceEnd?.trim() ?? '';

		if (!start && !end) return '';
		if (start && end) return `${start} - ${end}`;
		return start || end;
	});

	// Build mode derived — lightweight, no deep copy
	let buildMode = $derived(packagesStore.buildMode);
	// In build mode, BDM is always the effective pricing mode; stored pref is not mutated
	let effectiveSkuTabMode = $derived(buildMode ? 'bdm' : userPrefsStore.skuTabMode);

	// Package edit mode state (lifted from PackageTable)
	let packageEditMode = $state(false);

	function togglePackageEditMode() {
		packageEditMode = !packageEditMode;
	}

	function handleResetOrder() {
		packagesStore.resetAllOrders();
		panelsStore.resetAllOrders();
		packageEditMode = false;
	}

	// Collapsible SKU panel state (under table)
	let skuPanelOpen = $state(true);

	// Operations dropdown state
	let showOperations = $state(false);
	let operationsPosition = $state({ top: 0, left: 0 });

	// CF Tools dropdown state
	let showCFTools = $state(false);
	let cfToolsPosition = $state({ top: 0, left: 0 });

	// Modal states
	let showSalesTaxModal = $state(false);
	let showProductsModal = $state(false);
	let showCompaniesModal = $state(false);
	let showWhatLeftModal = $state(false);

	// CF Tools links array (matching Machine Research)
	const cfToolsLinks = [
		{ label: 'Cheat Sheet', href: 'https://cheatsheet.crf-tools.com/' },
		{ label: 'TOS Tracker', href: 'https://tos-renewal-tracker.vercel.app/' },
		{ label: 'Opp Tracker', href: 'https://opp-tracker.vercel.app/' },
		{ label: 'Machine Catalogue', href: 'https://codyrf1990.github.io/machine-catalog-standalone/' }
	];

	// React to page identity only — avoids deep subscription to every nested property
	let currentPageId = $derived(companiesStore.currentPage?.id);

	$effect(() => {
		const pageId = currentPageId; // reactive: re-runs when page changes
		if (!pageId) return;
		untrack(() => {
			const snapshot = companiesStore.getPageStateSnapshot();
			packagesStore.loadFromPageState(snapshot);
			panelsStore.loadFromPageState(snapshot);
		});
	});

	// Save changes back - debounced to batch rapid changes
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		// These reads ARE tracked - effect runs when packages/panels change
		// void marks intentional read for dependency tracking
		void packagesStore.all;
		void panelsStore.all;

		// Capture the page ID NOW in the closure, not when timeout fires
		const capturedPageId = companiesStore.currentPage?.id;
		if (!capturedPageId) return;

		// Clear any pending save
		if (saveTimeout) clearTimeout(saveTimeout);

		// Debounce: wait 150ms after last change before saving
		saveTimeout = setTimeout(() => {
			untrack(() => {
				// Only save if we're still on the same page
				const nowCurrentPage = companiesStore.currentPage;
				if (!nowCurrentPage || nowCurrentPage.id !== capturedPageId) {
					return;
				}

				const currentMode = companiesStore.currentPageMode;
				const newState: PageState = {
					mode: currentMode,
					packages: packagesStore.getPageState(),
					panels: panelsStore.getPageState()
				};
				const previousState = companiesStore.getPageStateSnapshot();
				if (JSON.stringify(previousState) !== JSON.stringify(newState)) {
					companiesStore.savePageState(capturedPageId, newState);
				}
			});
		}, 150);

		// Cleanup on effect re-run or unmount
		return () => {
			if (saveTimeout) clearTimeout(saveTimeout);
		};
	});

	// Mill Turn toast — lives here (single instance) not in PackageRow (which renders 5 times)
	let hasMillBits = $derived((packagesStore.all['SC-Mill']?.selectedBits?.length ?? 0) > 0);
	let hasTurnBits = $derived((packagesStore.all['SC-Turn']?.selectedBits?.length ?? 0) > 0);
	let millTurnCombo = $derived(hasMillBits && hasTurnBits);
	let prevMillTurnCombo = false;
	$effect(() => {
		const current = millTurnCombo;
		untrack(() => {
			if (current && !prevMillTurnCombo) {
				toastStore.info(
					'Mill-Turn capability is automatically included with this combination.',
					5000
				);
			}
			prevMillTurnCombo = current;
		});
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
		showSalesTaxModal = true;
	}

	function handleCurrentProducts() {
		closeOperations();
		showProductsModal = true;
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
		onViewAllCompanies={() => (showCompaniesModal = true)}
	/>

	<!-- Main Content Area -->
	<div class="content-area">
		<!-- Package Table + SKU Panel (main column) -->
		<section class="main-content">
			<PackageTable
				{packages}
				editMode={packageEditMode}
				{maintenanceRange}
				onwhatleft={() => (showWhatLeftModal = true)}
			/>

			<!-- SKU panel under table -->
			<div class="sku-under-wrapper tile">
				<div class="sku-collapse-bar tile-header">
					<div class="mode-pill" role="group" aria-label="View mode">
						<button
							class="mode-pill-btn"
							class:mode-pill-active-bdm={effectiveSkuTabMode === 'bdm'}
							onclick={() => userPrefsStore.setSkuTabMode('bdm')}
							aria-pressed={effectiveSkuTabMode === 'bdm'}
							title="BDM mode — new sale prices"
						>BDM</button>
						<button
							class="mode-pill-btn"
							class:mode-pill-active-ms={effectiveSkuTabMode === 'ms'}
							onclick={() => userPrefsStore.setSkuTabMode('ms')}
							disabled={buildMode}
							aria-disabled={buildMode}
							aria-pressed={effectiveSkuTabMode === 'ms'}
							title={buildMode ? 'MS unavailable in Build Mode' : 'MS mode — maintenance prices'}
						>MS</button>
					</div>
					<span class="sku-panel-label">
						{effectiveSkuTabMode === 'bdm' ? 'BDM SKUs' : 'Maint SKUs'}
					</span>
					<button
						type="button"
						class="sku-collapse-btn"
						onclick={() => (skuPanelOpen = !skuPanelOpen)}
						aria-label={skuPanelOpen ? 'Collapse SKU panel' : 'Expand SKU panel'}
					>
						<svg
							class="collapse-chevron"
							class:open={skuPanelOpen}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path d="M19 9l-7 7-7-7" />
						</svg>
					</button>
				</div>
				{#if skuPanelOpen}
					{#if effectiveSkuTabMode === 'bdm'}
						<BDMPanel />
					{:else if panels.find((p) => p.id === 'maintenance-skus') && panels.find((p) => p.id === 'solidworks-maintenance')}
						<MaintenancePanel
							maintenancePanel={panels.find((p) => p.id === 'maintenance-skus')!}
							solidworksPanel={panels.find((p) => p.id === 'solidworks-maintenance')!}
							editMode={packageEditMode}
							skuMode={effectiveSkuTabMode}
						/>
					{/if}
				{/if}
			</div>
		</section>

		<!-- Sidebar (Quoting + Calculator) -->
		<aside class="sidebar">
			<div class="quote-tile tile">
				<div class="quote-header tile-header">
					<span class="quote-mode-label" class:quote-label-ms={effectiveSkuTabMode === 'ms'}>
						{effectiveSkuTabMode === 'bdm' ? 'New Sale' : 'Maint Price'}
					</span>
					<div class="mode-pill" role="group" aria-label="View mode">
						<button
							class="mode-pill-btn"
							class:mode-pill-active-bdm={effectiveSkuTabMode === 'bdm'}
							onclick={() => userPrefsStore.setSkuTabMode('bdm')}
							aria-pressed={effectiveSkuTabMode === 'bdm'}
							title="BDM mode — new sale prices"
						>BDM</button>
						<button
							class="mode-pill-btn"
							class:mode-pill-active-ms={effectiveSkuTabMode === 'ms'}
							onclick={() => userPrefsStore.setSkuTabMode('ms')}
							disabled={buildMode}
							aria-disabled={buildMode}
							aria-pressed={effectiveSkuTabMode === 'ms'}
							title={buildMode ? 'MS unavailable in Build Mode' : 'MS mode — maintenance prices'}
						>MS</button>
					</div>
				</div>
				<NewSalePanel skuMode={effectiveSkuTabMode} />
			</div>
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
					<path
						d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
					/>
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
		{#each cfToolsLinks as link (link.href)}
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
						<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
						<polyline points="15 3 21 3 21 9" />
						<line x1="10" y1="14" x2="21" y2="3" />
					</svg>
				</span>
				{link.label}
			</a>
		{/each}
	</div>
{/if}

<!-- Modals -->
<SalesTaxModal open={showSalesTaxModal} onclose={() => (showSalesTaxModal = false)} />
<CurrentProductsModal open={showProductsModal} onclose={() => (showProductsModal = false)} />
<CompaniesModal open={showCompaniesModal} onclose={() => (showCompaniesModal = false)} />
<WhatLeftModal open={showWhatLeftModal} onclose={() => (showWhatLeftModal = false)} skuMode={effectiveSkuTabMode} />

<style>
	.page-layout {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-section);
		min-height: 100vh;
		padding: clamp(0.25rem, 1vw, 0.75rem);
		max-width: 1050px;
		margin: 0 auto;
	}

	.content-area {
		flex: 1;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(180px, 320px);
		gap: clamp(var(--space-0-5), 0.6vw, var(--space-2));
		min-height: 0;
	}

	.main-content {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
		min-height: 0;
	}

	/* Under-table SKU panel */
	.sku-under-wrapper {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Inner panels share the outer tile — strip their own tile styling */
	.sku-under-wrapper :global(.bdm-panel),
	.sku-under-wrapper :global(.maintenance-panel) {
		background: transparent;
		border: none;
		box-shadow: none;
		border-radius: 0;
	}

	.sku-collapse-bar {
		display: flex;
		align-items: center;
		gap: var(--space-0-5);
		padding: var(--space-0-5) var(--space-1);
	}

	.sku-panel-label {
		flex: 1;
		font-size: var(--text-2xs);
		font-weight: 700;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.sku-collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: transparent;
		border: none;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.3);
		flex-shrink: 0;
		transition: color 150ms ease;
	}

	.sku-collapse-btn:hover {
		color: rgba(255, 255, 255, 0.6);
	}

	.collapse-chevron {
		width: 12px;
		height: 12px;
		transform: rotate(0deg);
		transition: transform 200ms ease;
	}

	.collapse-chevron.open {
		transform: rotate(180deg);
	}

	/* Sidebar quote tile */
	.quote-tile {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* NewSalePanel shares the outer tile */
	.quote-tile :global(.new-sale-panel) {
		background: transparent;
		border: none;
		box-shadow: none;
		border-radius: 0;
	}

	.quote-header {
		display: flex;
		align-items: center;
		gap: var(--space-0-5);
		padding: var(--space-0-5) var(--space-1);
	}

	.quote-mode-label {
		flex: 1;
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--color-solidcam-gold, #d4af37);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.quote-label-ms {
		color: #60a5fa;
	}

	/* Mode pill — BDM | MS segmented control */
	.mode-pill {
		display: flex;
		flex-shrink: 0;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-xs);
		overflow: hidden;
	}

	.mode-pill-btn {
		font-size: var(--text-2xs);
		font-weight: 700;
		padding: var(--space-0-5) var(--space-1);
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.35);
		cursor: pointer;
		transition: all 150ms ease;
		letter-spacing: 0.04em;
	}

	.mode-pill-btn:hover {
		color: rgba(255, 255, 255, 0.65);
		background: rgba(255, 255, 255, 0.06);
	}

	/* BDM active — gold */
	.mode-pill-active-bdm {
		background: rgba(212, 175, 55, 0.18);
		color: var(--color-solidcam-gold, #d4af37);
		box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.3);
	}

	/* svelte-ignore css_unused_selector */
	.mode-pill-active-bdm:hover {
		background: rgba(212, 175, 55, 0.24);
	}

	/* MS active — blue */
	.mode-pill-active-ms {
		background: rgba(59, 130, 246, 0.18);
		color: #60a5fa;
		box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
	}

	/* svelte-ignore css_unused_selector */
	.mode-pill-active-ms:hover {
		background: rgba(59, 130, 246, 0.25);
	}

	/* Dropdown menus - positioned absolutely on page */
	.dropdown-menu {
		position: fixed;
		min-width: 160px;
		background: linear-gradient(145deg, rgba(32, 32, 38, 0.98), rgba(24, 24, 30, 0.98));
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		box-shadow:
			0 12px 32px rgba(0, 0, 0, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.2),
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
		gap: 0.5rem;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-xs);
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
		padding-left: 0.9rem;
	}

	.dropdown-item:not(:last-child) {
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.dropdown-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		opacity: 0.7;
	}

	.dropdown-icon svg {
		width: 12px;
		height: 12px;
	}

	.dropdown-item:hover .dropdown-icon {
		opacity: 1;
	}

	/* Keep two-column layout at all widths - compress progressively */
	@media (max-width: 900px) {
		.content-area {
			grid-template-columns: minmax(0, 1fr) minmax(160px, 280px);
			gap: var(--space-0-5);
		}

		.sidebar {
			gap: var(--space-0-5);
		}
	}

	@media (max-width: 768px) {
		.page-layout {
			padding: 0.2rem;
		}

		.content-area {
			grid-template-columns: minmax(0, 1fr) minmax(140px, 240px);
			gap: var(--space-0);
		}

		.sidebar {
			gap: var(--space-0);
		}
	}

	@media (max-width: 640px) {
		.page-layout {
			padding: 0.15rem;
		}

		.content-area {
			grid-template-columns: minmax(0, 1fr) minmax(120px, 200px);
			gap: var(--space-0);
		}

		.sidebar {
			gap: var(--space-0);
		}
	}

	@media (max-width: 500px) {
		.page-layout {
			padding: 0.1rem;
		}

		.content-area {
			grid-template-columns: minmax(0, 1fr) minmax(100px, 160px);
			gap: var(--space-px);
			align-items: start;
		}

		.sidebar {
			align-self: start;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.dropdown-menu {
			animation: none;
		}
	}
</style>
