<script lang="ts">
	import { untrack } from 'svelte';
	import { Boxes, ChevronDown, ExternalLink, Receipt } from 'lucide-svelte';
	import { Header, CompanyPageBar } from '$components/layout';
	import { PackageTable } from '$components/packages';
	import SolidWorksLicenseView from '$components/packages/SolidWorksLicenseView.svelte';
	import { BDMPanel, MaintenancePanel, NewSalePanel } from '$components/panels';
	import { Calculator } from '$components/calculator';
	import {
		SalesTaxModal,
		CurrentProductsModal,
		CompaniesModal,
		WhatLeftModal,
		CollapseWrapper,
		Tooltip
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

	// Find the latest matching license for the current page
	let matchedLicense = $derived.by(() => {
		const company = currentCompany;
		const page = currentPage;
		if (!company || !page) return null;

		const licenses = company.licenses ?? [];
		if (licenses.length === 0) return null;

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

		return latest ?? null;
	});

	let maintenanceRange = $derived.by(() => {
		const latest = matchedLicense;
		if (!latest) return '';

		const start = latest.maintenanceStart?.trim() ?? '';
		const end = latest.maintenanceEnd?.trim() ?? '';

		if (!start && !end) return '';
		if (start && end) return `${start} - ${end}`;
		return start || end;
	});

	let profileUsers = $derived(matchedLicense?.profileUsers ?? matchedLicense?.actualUsers ?? null);
	let solidcamVersion = $derived(matchedLicense?.solidcamVersion ?? null);

	// SolidWorks view branch
	let swActive = $derived(currentCompany?.currentView === 'sw');
	let swLicenses = $derived(currentCompany?.solidworksLicenses ?? []);

	let effectiveSkuTabMode = $derived(userPrefsStore.skuTabMode);

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
		{ label: 'Cheat Sheet', href: 'https://cheatsheetv2.crf-tools.com/' },
		{ label: 'TOS Tracker', href: 'https://tos-renewal-tracker.vercel.app/' },
		{ label: 'Opp Tracker', href: 'https://opp-tracker.vercel.app/' },
		{ label: 'Machine Catalogue', href: 'https://codyrf1990.github.io/machine-catalog-standalone/' }
	];

	// React to page identity only — avoids deep subscription to every nested property
	let currentPageId = $derived(companiesStore.currentPage?.id);

	$effect(() => {
		const pageId = currentPageId; // reactive: re-runs when page changes
		if (!pageId) return;
		// Skip while the SolidWorks view is active so we don't clobber the
		// active SolidCAM page state when the user just toggled views.
		if (currentCompany?.currentView === 'sw') return;
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

				const newState: PageState = {
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

	// Keyboard navigation for dropdown menus (Operations, CF Tools)
	function handleMenuKeydown(e: KeyboardEvent, closeFn: () => void) {
		const menu = e.currentTarget as HTMLElement;
		const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
		if (items.length === 0) return;
		const current = items.indexOf(document.activeElement as HTMLElement);

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			items[(current + 1) % items.length]?.focus();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			items[(current - 1 + items.length) % items.length]?.focus();
		} else if (e.key === 'Home') {
			e.preventDefault();
			items[0]?.focus();
		} else if (e.key === 'End') {
			e.preventDefault();
			items[items.length - 1]?.focus();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			closeFn();
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
	<CompanyPageBar onViewAllCompanies={() => (showCompaniesModal = true)} />

	<!-- Main Content Area -->
	<div class="content-area">
		<!-- Package Table + SKU Panel (main column) -->
		<section class="main-content">
			{#if swActive && currentCompany}
				<SolidWorksLicenseView companyId={currentCompany.id} licenses={swLicenses} />
			{:else}
				<PackageTable
					{packages}
					{maintenanceRange}
					{profileUsers}
					{solidcamVersion}
					skuMode={effectiveSkuTabMode}
					onWhatLeft={() => (showWhatLeftModal = true)}
				/>

				<!-- SKU panel under table -->
				<div class="sku-under-wrapper tile">
					<div class="sku-collapse-bar tile-header">
						<span class="sku-panel-label" class:sku-panel-label-ms={effectiveSkuTabMode === 'ms'}>
							{effectiveSkuTabMode === 'bdm' ? 'New Sale SKUs' : 'Maintenance SKUs'}
						</span>
						<div class="mode-pill" role="group" aria-label="View mode">
							<Tooltip text="New Sale — new sale prices">
								<button
									class="mode-pill-btn"
									class:mode-pill-active-bdm={effectiveSkuTabMode === 'bdm'}
									onclick={() => userPrefsStore.setSkuTabMode('bdm')}
									aria-pressed={effectiveSkuTabMode === 'bdm'}>New Sale</button
								>
							</Tooltip>
							<Tooltip text="Maintenance — maintenance prices">
								<button
									class="mode-pill-btn"
									class:mode-pill-active-ms={effectiveSkuTabMode === 'ms'}
									onclick={() => userPrefsStore.setSkuTabMode('ms')}
									aria-pressed={effectiveSkuTabMode === 'ms'}>Maintenance</button
								>
							</Tooltip>
						</div>
						<button
							type="button"
							class="sku-collapse-btn"
							onclick={() => (skuPanelOpen = !skuPanelOpen)}
							aria-label={skuPanelOpen ? 'Collapse SKU panel' : 'Expand SKU panel'}
						>
							<span class="collapse-chevron" class:open={skuPanelOpen} aria-hidden="true">
								<ChevronDown size={14} strokeWidth={2.25} />
							</span>
						</button>
					</div>
					<CollapseWrapper open={skuPanelOpen}>
						{#if effectiveSkuTabMode === 'bdm'}
							<BDMPanel />
						{:else if panels.find((p) => p.id === 'maintenance-skus') && panels.find((p) => p.id === 'solidworks-maintenance')}
							<MaintenancePanel
								maintenancePanel={panels.find((p) => p.id === 'maintenance-skus')!}
								solidworksPanel={panels.find((p) => p.id === 'solidworks-maintenance')!}
								skuMode={effectiveSkuTabMode}
							/>
						{/if}
					</CollapseWrapper>
				</div>
			{/if}
		</section>

		<!-- Sidebar (Quoting + Calculator) -->
		<aside class="sidebar">
			<div class="quote-tile tile">
				<div class="quote-header tile-header">
					<span class="quote-mode-label" class:quote-label-ms={effectiveSkuTabMode === 'ms'}>
						{effectiveSkuTabMode === 'bdm' ? 'New Sale' : 'Maintenance Price'}
					</span>
					<div class="mode-pill" role="group" aria-label="View mode">
						<Tooltip text="New Sale — new sale prices">
							<button
								class="mode-pill-btn"
								class:mode-pill-active-bdm={effectiveSkuTabMode === 'bdm'}
								onclick={() => userPrefsStore.setSkuTabMode('bdm')}
								aria-pressed={effectiveSkuTabMode === 'bdm'}>New Sale</button
							>
						</Tooltip>
						<Tooltip text="Maintenance — maintenance prices">
							<button
								class="mode-pill-btn"
								class:mode-pill-active-ms={effectiveSkuTabMode === 'ms'}
								onclick={() => userPrefsStore.setSkuTabMode('ms')}
								aria-pressed={effectiveSkuTabMode === 'ms'}>Maintenance</button
							>
						</Tooltip>
					</div>
				</div>
				<NewSalePanel skuMode={effectiveSkuTabMode} />
			</div>
			<!-- Note: sidebar toggle is a compact duplicate of the primary one above the table.
			     Both exist because users may scroll past the primary toggle. -->
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
		tabindex="-1"
		onkeydown={(e) => handleMenuKeydown(e, closeOperations)}
	>
		<button class="dropdown-item" role="menuitem" onclick={handleSalesTax}>
			<span class="dropdown-icon" aria-hidden="true">
				<Receipt size={13} strokeWidth={2} />
			</span>
			Sales Tax Guide
		</button>
		<button class="dropdown-item" role="menuitem" onclick={handleCurrentProducts}>
			<span class="dropdown-icon" aria-hidden="true">
				<Boxes size={13} strokeWidth={2} />
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
		tabindex="-1"
		onkeydown={(e) => handleMenuKeydown(e, closeCFTools)}
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
					<ExternalLink size={13} strokeWidth={2} />
				</span>
				{link.label}
			</a>
		{/each}
	</div>
{/if}

<!-- Modals -->
<SalesTaxModal open={showSalesTaxModal} onClose={() => (showSalesTaxModal = false)} />
<CurrentProductsModal open={showProductsModal} onClose={() => (showProductsModal = false)} />
<CompaniesModal open={showCompaniesModal} onClose={() => (showCompaniesModal = false)} />
<WhatLeftModal
	open={showWhatLeftModal}
	onClose={() => (showWhatLeftModal = false)}
	skuMode={effectiveSkuTabMode}
/>

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
		position: sticky;
		top: var(--space-2);
		align-self: start;
	}

	/* Under-table SKU panel */
	.sku-under-wrapper {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Inner panels share the outer tile — strip their own tile styling.
	   backdrop-filter included: a nested blur re-blurs the wrapper surface
	   and shifts the card's apparent transparency. */
	.sku-under-wrapper :global(.bdm-panel),
	.sku-under-wrapper :global(.maintenance-panel) {
		background: transparent;
		border: none;
		box-shadow: none;
		border-radius: 0;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}

	.sku-collapse-bar {
		display: flex;
		align-items: center;
		gap: var(--space-0-5);
		padding: var(--space-0-5) var(--space-1);
	}

	.sku-panel-label {
		flex: 1;
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--color-solidcam-gold, #d4af37);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.sku-panel-label-ms {
		color: var(--accent-sky);
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transform: rotate(0deg);
		transition: transform 200ms var(--ease-out-expo);
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
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
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
		text-shadow: var(--text-engraved);
	}

	.quote-label-ms {
		color: var(--accent-sky);
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
		font-size: var(--text-xs);
		font-weight: 600;
		padding: var(--space-0-5) var(--space-1);
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		letter-spacing: 0.04em;
		transition:
			background 150ms var(--ease-out-quart),
			color 150ms var(--ease-out-quart),
			box-shadow 200ms var(--ease-out-expo);
	}

	.mode-pill-btn:hover {
		color: rgba(255, 255, 255, 0.7);
		background: rgba(255, 255, 255, 0.06);
	}

	/* BDM active — gold */
	.mode-pill-active-bdm {
		background: var(--gold-a20);
		color: var(--color-solidcam-gold, #d4af37);
		box-shadow:
			inset 0 0 0 1px var(--gold-a30),
			0 0 10px rgba(212, 175, 55, 0.18);
	}

	/* svelte-ignore css_unused_selector */
	.mode-pill-active-bdm:hover {
		background: rgba(212, 175, 55, 0.24);
	}

	/* MS active — blue */
	.mode-pill-active-ms {
		background: rgba(59, 130, 246, 0.18);
		color: var(--accent-sky);
		box-shadow:
			inset 0 0 0 1px rgba(59, 130, 246, 0.3),
			0 0 10px rgba(59, 130, 246, 0.18);
	}

	/* svelte-ignore css_unused_selector */
	.mode-pill-active-ms:hover {
		background: rgba(59, 130, 246, 0.25);
	}

	/* Compact mode pill for sidebar (secondary indicator) */
	.quote-header .mode-pill .mode-pill-btn {
		font-size: 0.55rem;
		padding: var(--space-0) var(--space-0-5);
	}

	/* Dropdown menus - positioned absolutely on page */
	.dropdown-menu {
		position: fixed;
		min-width: 160px;
		background: var(--menu-bg);
		border: var(--menu-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--menu-shadow);
		z-index: 1000;
		overflow: hidden;
		animation: menuFadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes menuFadeIn {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-xs);
		font-weight: 500;
		color: rgba(255, 255, 255, 0.82);
		background: transparent;
		border: none;
		border-left: 2px solid transparent;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			background 150ms var(--ease-out-quart),
			color 150ms var(--ease-out-quart),
			border-left-color 200ms var(--ease-out-expo);
	}

	.dropdown-item:hover {
		background: var(--gold-a10);
		color: var(--color-solidcam-gold);
		border-left-color: var(--color-solidcam-gold);
	}

	.dropdown-item:not(:last-child) {
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.dropdown-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		opacity: 0.7;
		transition: opacity 150ms var(--ease-out-quart);
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

	@media (max-width: 600px) {
		.page-layout {
			padding: 0.1rem;
		}

		.content-area {
			/* Keep two columns even at the narrowest viewport — never stack
			   the quote/SKU sidebar on top of the package table. */
			grid-template-columns: minmax(0, 1fr) minmax(100px, 180px);
			gap: var(--space-0);
		}

		.sidebar {
			gap: var(--space-0);
		}
	}

	@media (max-width: 480px) {
		.content-area {
			grid-template-columns: minmax(0, 1fr) minmax(88px, 150px);
		}
	}
</style>
