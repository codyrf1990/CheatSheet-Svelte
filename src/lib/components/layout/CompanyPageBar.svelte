<script lang="ts">
	import { companiesStore } from '$stores/companies.svelte';
	import { syncStore } from '$stores/sync.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { Button } from '$components/ui';
	import type { Company } from '$types';

	interface Props {
		editMode?: boolean;
		onToggleEdit?: () => void;
		onResetOrder?: () => void;
	}

	let { editMode = false, onToggleEdit, onResetOrder }: Props = $props();

	// Reactive state from stores
	let currentCompany = $derived(companiesStore.current);
	let currentPage = $derived(companiesStore.currentPage);
	let allCompanies = $derived(companiesStore.all);
	let recent = $derived(companiesStore.recent);
	let syncStatus = $derived(syncStore.status);

	// Local UI state
	let dropdownOpen = $state(false);
	let searchQuery = $state('');
	let editingPageId = $state<string | null>(null);
	let editingPageName = $state('');

	// Context menu state
	let contextMenu = $state<{ x: number; y: number; type: 'company' | 'page'; id?: string } | null>(null);

	// Filtered companies based on search
	let filteredCompanies = $derived(() => {
		if (!searchQuery.trim()) return [];
		return companiesStore.search(searchQuery);
	});

	// Status indicator
	let statusIndicator = $derived(() => {
		switch (syncStatus) {
			case 'connected': return { symbol: '●', color: 'var(--color-success, #22c55e)', title: 'Synced' };
			case 'syncing': return { symbol: '○', color: 'var(--color-solidcam-gold, #d4af37)', title: 'Syncing...' };
			case 'error': return { symbol: '⚠', color: 'var(--color-error, #ef4444)', title: 'Sync error' };
			default: return { symbol: '○', color: 'rgba(255,255,255,0.3)', title: 'Not synced' };
		}
	});

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
		if (dropdownOpen) {
			searchQuery = '';
		}
	}

	function closeDropdown() {
		dropdownOpen = false;
		searchQuery = '';
	}

	function handleCompanySelect(companyId: string) {
		companiesStore.switchTo(companyId);
		closeDropdown();
	}

	function handlePageSelect(pageId: string) {
		companiesStore.switchToPage(pageId);
	}

	function handleNewCompany() {
		const name = prompt('New company name:');
		if (name?.trim()) {
			companiesStore.create(name.trim());
			closeDropdown();
			toastStore.success('Company created');
		}
	}

	function handleNewPage() {
		const page = companiesStore.createPage();
		if (page) {
			toastStore.success('Page created');
		}
	}

	// Context menu handlers
	function handleCompanyContextMenu(e: MouseEvent) {
		e.preventDefault();
		contextMenu = { x: e.clientX, y: e.clientY, type: 'company' };
	}

	function handlePageContextMenu(e: MouseEvent, pageId: string) {
		e.preventDefault();
		contextMenu = { x: e.clientX, y: e.clientY, type: 'page', id: pageId };
	}

	function closeContextMenu() {
		contextMenu = null;
	}

	function handleRenameCompany() {
		const newName = prompt('Rename company:', currentCompany?.name);
		if (newName?.trim() && currentCompany) {
			companiesStore.rename(currentCompany.id, newName.trim());
			toastStore.success('Company renamed');
		}
		closeContextMenu();
	}

	function handleDuplicateCompany() {
		if (currentCompany) {
			const copy = companiesStore.duplicate(currentCompany.id);
			if (copy) {
				toastStore.success('Company duplicated');
			}
		}
		closeContextMenu();
	}

	function handleDeleteCompany() {
		if (currentCompany && allCompanies.length > 1) {
			if (confirm(`Delete "${currentCompany.name}"? This cannot be undone.`)) {
				companiesStore.delete(currentCompany.id);
				toastStore.success('Company deleted');
			}
		} else {
			toastStore.error('Cannot delete the last company');
		}
		closeContextMenu();
	}

	function handleRenamePage() {
		const pageId = contextMenu?.id;
		if (!pageId) return;
		const page = currentCompany?.pages.find(p => p.id === pageId);
		if (page) {
			const newName = prompt('Rename page:', page.name);
			if (newName?.trim()) {
				companiesStore.renamePage(page.id, newName.trim());
				toastStore.success('Page renamed');
			}
		}
		closeContextMenu();
	}

	function handleCopyPage() {
		const pageId = contextMenu?.id;
		if (!pageId) return;
		const page = companiesStore.copyPage(pageId);
		if (page) {
			toastStore.success('Page copied');
		}
		closeContextMenu();
	}

	function handleDeletePage() {
		const pageId = contextMenu?.id;
		if (!pageId || !currentCompany) return;
		if (currentCompany.pages.length <= 1) {
			toastStore.error('Cannot delete the last page');
			closeContextMenu();
			return;
		}
		if (confirm('Delete this page?')) {
			companiesStore.deletePage(pageId);
			toastStore.success('Page deleted');
		}
		closeContextMenu();
	}

	// Double-click to rename page
	function handlePageDoubleClick(pageId: string, pageName: string) {
		editingPageId = pageId;
		editingPageName = pageName;
	}

	function handlePageRenameSubmit() {
		if (editingPageId && editingPageName.trim()) {
			companiesStore.renamePage(editingPageId, editingPageName.trim());
		}
		editingPageId = null;
		editingPageName = '';
	}

	function handlePageRenameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handlePageRenameSubmit();
		} else if (e.key === 'Escape') {
			editingPageId = null;
			editingPageName = '';
		}
	}

	// Close dropdown/context when clicking outside
	function handleWindowClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.company-dropdown') && dropdownOpen) {
			closeDropdown();
		}
		if (!target.closest('.context-menu') && contextMenu) {
			closeContextMenu();
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="company-page-bar">
	<!-- Company Selector -->
	<div class="company-dropdown">
		<button
			type="button"
			class="company-trigger"
			onclick={toggleDropdown}
			oncontextmenu={handleCompanyContextMenu}
			aria-expanded={dropdownOpen}
		>
			<span class="company-name">{currentCompany?.name || 'No Company'}</span>
			<span
				class="status-dot"
				style="color: {statusIndicator().color}"
				title={statusIndicator().title}
			>{statusIndicator().symbol}</span>
			<svg class="chevron" class:open={dropdownOpen} viewBox="0 0 20 20" fill="currentColor">
				<path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
			</svg>
		</button>

		{#if dropdownOpen}
			<div class="dropdown-menu">
				<!-- Search -->
				<div class="dropdown-search">
					<input
						type="search"
						placeholder="Search companies..."
						bind:value={searchQuery}
						class="search-input"
					/>
				</div>

				<!-- Search Results -->
				{#if searchQuery.trim()}
					<div class="dropdown-section">
						<div class="section-title">Results ({filteredCompanies().length})</div>
						{#if filteredCompanies().length > 0}
							{#each filteredCompanies() as company (company.id)}
								<button
									type="button"
									class="company-item"
									class:active={company.id === currentCompany?.id}
									onclick={() => handleCompanySelect(company.id)}
								>
									{company.name}
								</button>
							{/each}
						{:else}
							<div class="no-results">No companies found</div>
						{/if}
					</div>
				{:else if recent.length > 0}
					<!-- Recent -->
					<div class="dropdown-section">
						<div class="section-title">Recent</div>
						{#each recent.slice(0, 8) as company (company.id)}
							<button
								type="button"
								class="company-item"
								class:active={company.id === currentCompany?.id}
								onclick={() => handleCompanySelect(company.id)}
							>
								{company.name}
							</button>
						{/each}
					</div>
				{/if}

				<!-- New Company -->
				<div class="dropdown-footer">
					<button type="button" class="new-company-btn" onclick={handleNewCompany}>
						<span class="btn-shine"></span>
						+ New Company
					</button>
					<span class="company-count">{allCompanies.length} total</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Page Tabs -->
	<div class="page-tabs">
		{#if currentCompany}
			{#each currentCompany.pages as page (page.id)}
				{#if editingPageId === page.id}
					<!-- svelte-ignore a11y_autofocus -->
					<input
						type="text"
						class="page-tab-input"
						bind:value={editingPageName}
						onblur={handlePageRenameSubmit}
						onkeydown={handlePageRenameKeydown}
						autofocus
					/>
				{:else}
					<button
						type="button"
						class="page-tab"
						class:active={page.id === currentCompany.currentPageId}
						onclick={() => handlePageSelect(page.id)}
						ondblclick={() => handlePageDoubleClick(page.id, page.name)}
						oncontextmenu={(e) => handlePageContextMenu(e, page.id)}
					>
						{page.name}
					</button>
				{/if}
			{/each}
		{/if}
		<button type="button" class="page-tab add-tab" onclick={handleNewPage} title="New page">
			+
		</button>
	</div>

	<!-- Edit Controls -->
	<div class="edit-controls">
		<Button variant={editMode ? 'primary' : 'ghost'} size="sm" onclick={onToggleEdit}>
			{editMode ? 'Done' : 'Edit Order'}
		</Button>
		{#if editMode}
			<Button variant="ghost" size="sm" onclick={onResetOrder}>Reset</Button>
		{/if}
	</div>
</div>

<!-- Context Menu -->
{#if contextMenu}
	<div class="context-menu" style="left: {contextMenu.x}px; top: {contextMenu.y}px;">
		{#if contextMenu.type === 'company'}
			<button type="button" onclick={handleRenameCompany}>Rename</button>
			<button type="button" onclick={handleDuplicateCompany}>Duplicate</button>
			<button type="button" class="danger" onclick={handleDeleteCompany}>Delete</button>
		{:else}
			<button type="button" onclick={handleRenamePage}>Rename</button>
			<button type="button" onclick={handleCopyPage}>Copy</button>
			<button type="button" class="danger" onclick={handleDeletePage}>Delete</button>
		{/if}
	</div>
{/if}

<style>
	.company-page-bar {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.4rem 0.875rem;
		background: linear-gradient(
			145deg,
			rgba(24, 24, 30, 0.85) 0%,
			rgba(18, 18, 24, 0.9) 100%
		);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		margin-bottom: 1rem;
		backdrop-filter: blur(8px);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.03);
		overflow: hidden;
	}

	/* Subtle animated border shimmer */
	.company-page-bar::before {
		content: '';
		position: absolute;
		inset: -1px;
		background: linear-gradient(90deg,
			transparent 0%,
			rgba(212, 175, 55, 0.15) 25%,
			rgba(200, 16, 46, 0.1) 50%,
			rgba(212, 175, 55, 0.15) 75%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: barBorderShimmer 20s linear infinite;
		border-radius: inherit;
		z-index: 0;
		opacity: 0.4;
		pointer-events: none;
	}

	@keyframes barBorderShimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	/* Company Dropdown */
	.company-dropdown {
		position: relative;
		z-index: 1;
	}

	.company-trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		color: #f5f5f5;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.company-trigger:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
		transform: translateY(-2px);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.company-name {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status-dot {
		font-size: 0.75rem;
		animation: statusPulse 2s ease-in-out infinite;
	}

	@keyframes statusPulse {
		0%, 100% { opacity: 0.8; }
		50% { opacity: 1; }
	}

	.chevron {
		width: 16px;
		height: 16px;
		opacity: 0.6;
		transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	/* Dropdown Menu */
	.dropdown-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		min-width: 280px;
		max-height: 400px;
		overflow-y: auto;
		background: linear-gradient(145deg, rgba(32, 32, 38, 0.98), rgba(24, 24, 30, 0.98));
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		box-shadow:
			0 20px 50px rgba(0, 0, 0, 0.5),
			0 8px 20px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(16px);
		z-index: 1000;
		animation: dropdownFadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes dropdownFadeIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-search {
		padding: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.search-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: #f5f5f5;
		font-size: 0.875rem;
		transition: all 200ms ease;
	}

	.search-input::placeholder {
		color: rgba(255, 255, 255, 0.35);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-solidcam-gold, #d4af37);
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
	}

	.dropdown-section {
		padding: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.section-title {
		padding: 0.25rem 0.5rem;
		font-size: 0.6875rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.company-item {
		display: block;
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: transparent;
		border: none;
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.875rem;
		text-align: left;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.company-item:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #f5f5f5;
		padding-left: 1rem;
	}

	.company-item.active {
		background: rgba(212, 175, 55, 0.15);
		color: var(--color-solidcam-gold, #d4af37);
	}

	.no-results {
		padding: 1rem;
		text-align: center;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.875rem;
	}

	.dropdown-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
	}

	.new-company-btn {
		position: relative;
		overflow: hidden;
		padding: 0.5rem 1rem;
		background: linear-gradient(145deg, #e8c547, #d4af37, #b8941f);
		border: none;
		border-radius: 8px;
		color: #1a1a1a;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow:
			0 2px 8px rgba(212, 175, 55, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.25);
	}

	.btn-shine {
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		transition: left 400ms ease;
	}

	.new-company-btn:hover {
		transform: translateY(-2px);
		box-shadow:
			0 4px 16px rgba(212, 175, 55, 0.4),
			0 0 30px rgba(212, 175, 55, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.new-company-btn:hover .btn-shine {
		left: 100%;
	}

	.company-count {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
	}

	/* Divider */
	.divider {
		width: 1px;
		height: 24px;
		background: linear-gradient(
			180deg,
			transparent 0%,
			rgba(255, 255, 255, 0.15) 50%,
			transparent 100%
		);
		z-index: 1;
	}

	/* Page Tabs */
	.page-tabs {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex: 1;
		overflow-x: auto;
		padding: 0;
		z-index: 1;
	}

	.page-tabs::-webkit-scrollbar {
		height: 4px;
	}

	.page-tabs::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
	}

	.page-tab {
		padding: 0.35rem 0.75rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
	}

	.page-tab:hover {
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.9);
		border-color: rgba(255, 255, 255, 0.08);
	}

	.page-tab.active {
		background: rgba(212, 175, 55, 0.15);
		border-color: rgba(212, 175, 55, 0.3);
		color: var(--color-solidcam-gold, #d4af37);
		box-shadow: 0 0 12px rgba(212, 175, 55, 0.1);
	}

	.page-tab.add-tab {
		color: rgba(255, 255, 255, 0.4);
		font-size: 1rem;
		padding: 0.4rem 0.625rem;
	}

	.page-tab.add-tab:hover {
		color: var(--color-solidcam-gold, #d4af37);
		background: rgba(212, 175, 55, 0.1);
	}

	.page-tab-input {
		padding: 0.375rem 0.625rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid var(--color-solidcam-gold, #d4af37);
		border-radius: 8px;
		color: #f5f5f5;
		font-size: 0.8125rem;
		width: 70px;
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
	}

	.page-tab-input:focus {
		outline: none;
	}

	/* Edit Controls */
	.edit-controls {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		z-index: 1;
		flex-shrink: 0;
	}

	/* Context Menu */
	.context-menu {
		position: fixed;
		min-width: 140px;
		background: linear-gradient(145deg, rgba(32, 32, 38, 0.98), rgba(24, 24, 30, 0.98));
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.5),
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(16px);
		z-index: 2000;
		overflow: hidden;
		animation: contextMenuFadeIn 150ms ease;
	}

	@keyframes contextMenuFadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.context-menu button {
		display: block;
		width: 100%;
		padding: 0.625rem 1rem;
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.8125rem;
		text-align: left;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.context-menu button:hover {
		background: rgba(255, 255, 255, 0.08);
		padding-left: 1.25rem;
	}

	.context-menu button:not(:last-child) {
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}

	.context-menu button.danger:hover {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	/* Focus states */
	.company-trigger:focus-visible,
	.page-tab:focus-visible,
	.company-item:focus-visible {
		outline: 2px solid var(--color-solidcam-gold, #d4af37);
		outline-offset: 2px;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.company-page-bar {
			flex-wrap: wrap;
		}

		.company-name {
			max-width: 120px;
		}

		.page-tabs {
			width: 100%;
			margin-top: 0.5rem;
		}

		.divider {
			display: none;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.company-page-bar::before,
		.status-dot,
		.dropdown-menu,
		.context-menu,
		.btn-shine {
			animation: none;
		}

		.company-trigger,
		.page-tab,
		.company-item,
		.new-company-btn {
			transition: none;
		}
	}
</style>
