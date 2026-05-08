<script lang="ts">
	import { companiesStore } from '$stores/companies.svelte';

	import { syncStore } from '$stores/sync.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { Button, Input, Modal, ImportLicenseModal, Tooltip } from '$components/ui';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import { getPageNameForLicense } from '$lib/utils/licenseSelections';

	interface Props {
		onViewAllCompanies?: () => void;
	}

	let { onViewAllCompanies }: Props = $props();

	function onViewAll() {
		closeDropdown();
		onViewAllCompanies?.();
	}

	// Reactive state from stores
	let currentCompany = $derived(companiesStore.current);
	let allCompanies = $derived(companiesStore.all);
	let recent = $derived(companiesStore.recent);
	let syncStatus = $derived(syncStore.status);

	// Local UI state
	let showImportModal = $state(false);
	let dropdownOpen = $state(false);
	let dropdownPosition = $state({ top: 0, left: 0 });
	let searchQuery = $state('');
	let editingPageId = $state<string | null>(null);
	let editingPageName = $state('');
	let dropdownTriggerRef = $state<HTMLButtonElement | null>(null);
	let searchInputRef = $state<HTMLInputElement | null>(null);
	let dialogType = $state<
		| 'new-company'
		| 'rename-company'
		| 'rename-page'
		| 'rename-sw'
		| 'delete-company'
		| 'delete-page'
		| 'delete-sw'
		| null
	>(null);
	let dialogTargetId = $state<string | null>(null);
	let dialogTargetLabel = $state('');
	let dialogInput = $state('');

	// Context menu state
	let contextMenu = $state<{
		x: number;
		y: number;
		type: 'company' | 'page' | 'sw';
		id?: string;
	} | null>(null);

	// Page referenced by the current context menu (for licenseKey access)
	let contextMenuPage = $derived.by(() => {
		if (!contextMenu || contextMenu.type !== 'page' || !contextMenu.id) return null;
		return currentCompany?.pages.find((p) => p.id === contextMenu!.id) ?? null;
	});

	// License matching the context menu page (for type-aware copy labels)
	let contextMenuLicense = $derived.by(() => {
		const page = contextMenuPage;
		if (!page) return null;
		const licenses = currentCompany?.licenses ?? [];
		if (licenses.length === 0) return null;
		// Find the latest license matching this page name
		const matching = licenses.filter((l) => getPageNameForLicense(l) === page.name);
		if (matching.length === 0 && licenses.length === 1) return licenses[0];
		if (matching.length <= 1) return matching[0] ?? null;
		return matching.reduce((acc, l) => (l.importedAt > acc.importedAt ? l : acc));
	});

	// Filtered companies based on search
	let filteredCompanies = $derived.by(() => {
		if (!searchQuery.trim()) return [];
		return companiesStore.search(searchQuery);
	});

	// SolidWorks tab state
	let hasSW = $derived((currentCompany?.solidworksLicenses?.length ?? 0) > 0);
	let swActive = $derived(currentCompany?.currentView === 'sw');
	let swTabLabel = $derived.by(() => {
		const company = currentCompany;
		if (!company) return 'SW';
		if (company.swTabLabelOverride && company.swTabLabelOverride.trim().length > 0) {
			return company.swTabLabelOverride;
		}
		const licenses = company.solidworksLicenses ?? [];
		if (licenses.length === 0) return 'SW';
		const totalSeats = licenses.reduce((sum, lic) => sum + (lic.users ?? 0), 0);
		if (totalSeats <= 0) return 'SW';
		return `SW ${totalSeats} Seat${totalSeats === 1 ? '' : 's'}`;
	});

	// Status indicator with SVG icon key and differentiated states
	let syncError = $derived(syncStore.error);
	let statusIndicator = $derived.by(() => {
		switch (syncStatus) {
			case 'connected':
				return { icon: 'check', color: 'var(--color-success, #22c55e)', title: 'Synced' };
			case 'syncing':
				return {
					icon: 'spinner',
					color: 'var(--color-solidcam-gold, #d4af37)',
					title: 'Syncing...'
				};
			case 'error':
				// Differentiate local-only (offline) from actual sync errors
				if (syncError?.includes('offline')) {
					return {
						icon: 'device',
						color: 'rgba(255,255,255,0.5)',
						title: 'Local only — not synced to cloud'
					};
				}
				return { icon: 'warning', color: 'var(--color-error, #ef4444)', title: 'Sync error' };
			default:
				return { icon: 'disconnected', color: 'rgba(255,255,255,0.3)', title: 'Not connected' };
		}
	});

	let isConfirmDialog = $derived(
		dialogType === 'delete-company' ||
			dialogType === 'delete-page' ||
			dialogType === 'delete-sw'
	);
	let dialogTitle = $derived.by(() => {
		switch (dialogType) {
			case 'new-company':
				return 'New Company';
			case 'rename-company':
				return 'Rename Company';
			case 'rename-page':
				return 'Rename Page';
			case 'rename-sw':
				return 'Rename SolidWorks Tab';
			case 'delete-company':
				return 'Delete Company';
			case 'delete-page':
				return 'Delete Page';
			case 'delete-sw':
				return 'Remove SolidWorks Licenses';
			default:
				return '';
		}
	});
	let dialogActionLabel = $derived.by(() => {
		switch (dialogType) {
			case 'new-company':
				return 'Create';
			case 'rename-company':
			case 'rename-page':
			case 'rename-sw':
				return 'Save';
			case 'delete-company':
			case 'delete-page':
				return 'Delete';
			case 'delete-sw':
				return 'Remove All';
			default:
				return '';
		}
	});
	let dialogInputLabel = $derived.by(() => {
		switch (dialogType) {
			case 'new-company':
			case 'rename-company':
				return 'Company name';
			case 'rename-page':
				return 'Page name';
			case 'rename-sw':
				return 'SW tab label (leave blank to auto-compute)';
			default:
				return '';
		}
	});
	let dialogMessage = $derived.by(() => {
		if (dialogType === 'delete-company') {
			return `Delete "${dialogTargetLabel}"? This cannot be undone.`;
		}
		if (dialogType === 'delete-page') {
			return `Delete "${dialogTargetLabel}"? This cannot be undone.`;
		}
		if (dialogType === 'delete-sw') {
			return `Remove all SolidWorks licenses on this company? This cannot be undone.`;
		}
		return '';
	});
	let dialogInputValid = $derived(
		dialogType === 'rename-sw' ? true : dialogInput.trim().length > 0
	);

	function toggleDropdown(e: MouseEvent) {
		e.stopPropagation();
		dropdownOpen = !dropdownOpen;
		if (dropdownOpen) {
			searchQuery = '';
			// Calculate position from trigger button
			const button = e.currentTarget as HTMLElement;
			const rect = button.getBoundingClientRect();
			dropdownPosition = {
				top: rect.bottom + 8,
				left: rect.left
			};
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
		companiesStore.setCurrentView('page');
		companiesStore.switchToPage(pageId);
	}

	function handleSWSelect() {
		companiesStore.setCurrentView('sw');
	}

	function handleSWContextMenu(e: MouseEvent) {
		e.preventDefault();
		contextMenu = { x: e.clientX, y: e.clientY, type: 'sw' };
	}

	function handleSWRename() {
		if (!currentCompany) return;
		dialogType = 'rename-sw';
		dialogTargetId = currentCompany.id;
		dialogTargetLabel = swTabLabel;
		dialogInput = currentCompany.swTabLabelOverride ?? swTabLabel;
		closeContextMenu();
	}

	function handleSWResetLabel() {
		if (!currentCompany) return;
		companiesStore.clearSolidWorksTabLabel(currentCompany.id);
		toastStore.success('SW tab label reset');
		closeContextMenu();
	}

	function handleSWDeleteAll() {
		if (!currentCompany) return;
		dialogType = 'delete-sw';
		dialogTargetId = currentCompany.id;
		dialogTargetLabel = swTabLabel;
		closeContextMenu();
	}

	function handleNewCompany() {
		dialogType = 'new-company';
		dialogTargetId = null;
		dialogTargetLabel = '';
		dialogInput = '';
		closeDropdown();
		closeContextMenu();
	}

	function handleNewPage() {
		const page = companiesStore.createPage(undefined, true);
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
		if (!currentCompany) return;
		dialogType = 'rename-company';
		dialogTargetId = currentCompany.id;
		dialogTargetLabel = currentCompany.name;
		dialogInput = currentCompany.name;
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

	function handleImportLicense() {
		showImportModal = true;
		closeContextMenu();
	}

	function handleClearAllCompanies() {
		if (confirm('DEV: Delete ALL companies? This cannot be undone.')) {
			companiesStore.deleteAll();
		}
		closeContextMenu();
	}

	function handleDeleteCompany() {
		if (!currentCompany) return;
		if (allCompanies.length <= 1) {
			toastStore.error('Cannot delete the last company');
			closeContextMenu();
			return;
		}
		dialogType = 'delete-company';
		dialogTargetId = currentCompany.id;
		dialogTargetLabel = currentCompany.name;
		closeContextMenu();
	}

	function handleRenamePage() {
		const pageId = contextMenu?.id;
		if (!pageId) return;
		const page = currentCompany?.pages.find((p) => p.id === pageId);
		if (page) {
			dialogType = 'rename-page';
			dialogTargetId = page.id;
			dialogTargetLabel = page.name;
			dialogInput = page.name;
		}
		closeContextMenu();
	}

	function handleDuplicatePage() {
		const pageId = contextMenu?.id;
		if (!pageId) return;
		const page = companiesStore.copyPage(pageId);
		if (page) {
			toastStore.success('Page duplicated');
		}
		closeContextMenu();
	}

	async function handleCopyPageName() {
		const page = contextMenuPage;
		if (!page) return;
		await copyToClipboard(page.name, 'Copied');
		closeContextMenu();
	}

	async function handleCopyLicenseKey() {
		const page = contextMenuPage;
		if (!page?.licenseKey) return;
		await copyToClipboard(page.licenseKey, 'Copied');
		closeContextMenu();
	}

	async function handleCopyProfileName() {
		const license = contextMenuLicense;
		if (!license?.profileNo) return;
		await copyToClipboard(`Profile-${license.profileNo}`, 'Copied');
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
		const page = currentCompany.pages.find((p) => p.id === pageId);
		dialogType = 'delete-page';
		dialogTargetId = pageId;
		dialogTargetLabel = page?.name || 'this page';
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

	function closeDialog() {
		dialogType = null;
		dialogTargetId = null;
		dialogTargetLabel = '';
		dialogInput = '';
	}

	function handleDialogSubmit() {
		if (!dialogType) return;

		if (dialogType === 'new-company') {
			const name = dialogInput.trim();
			if (!name) return;
			companiesStore.create(name);
			toastStore.success('Company created');
			closeDialog();
			return;
		}

		if (dialogType === 'rename-company') {
			const name = dialogInput.trim();
			if (!dialogTargetId || !name) return;
			companiesStore.rename(dialogTargetId, name);
			toastStore.success('Company renamed');
			closeDialog();
			return;
		}

		if (dialogType === 'rename-page') {
			const name = dialogInput.trim();
			if (!dialogTargetId || !name) return;
			companiesStore.renamePage(dialogTargetId, name);
			toastStore.success('Page renamed');
			closeDialog();
			return;
		}

		if (dialogType === 'rename-sw') {
			if (!dialogTargetId) return;
			companiesStore.setSolidWorksTabLabel(dialogTargetId, dialogInput);
			toastStore.success(
				dialogInput.trim().length === 0 ? 'SW tab label reset' : 'SW tab renamed'
			);
			closeDialog();
			return;
		}

		if (dialogType === 'delete-company') {
			if (!dialogTargetId) return;
			companiesStore.delete(dialogTargetId);
			toastStore.success('Company deleted');
			closeDialog();
			return;
		}

		if (dialogType === 'delete-page') {
			if (!dialogTargetId) return;
			companiesStore.deletePage(dialogTargetId);
			toastStore.success('Page deleted');
			closeDialog();
			return;
		}

		if (dialogType === 'delete-sw') {
			if (!dialogTargetId) return;
			companiesStore.clearSolidWorksLicenses(dialogTargetId);
			toastStore.success('SolidWorks licenses removed');
			closeDialog();
			return;
		}

	}

	function handleDialogInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && dialogInputValid) {
			e.preventDefault();
			handleDialogSubmit();
		}
	}

	// Auto-focus search input when dropdown opens
	$effect(() => {
		if (dropdownOpen && searchInputRef) {
			searchInputRef.focus();
		}
	});

	// Company dropdown keyboard navigation
	function handleDropdownKeydown(e: KeyboardEvent) {
		if (!dropdownOpen) return;
		const items = Array.from(
			document.querySelectorAll<HTMLElement>('.dropdown-menu [role="option"]')
		);
		if (items.length === 0) return;

		const current = items.indexOf(document.activeElement as HTMLElement);

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (document.activeElement === searchInputRef) {
				items[0]?.focus();
			} else {
				items[Math.min(current + 1, items.length - 1)]?.focus();
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (current <= 0) {
				searchInputRef?.focus();
			} else {
				items[current - 1]?.focus();
			}
		} else if (e.key === 'Home') {
			e.preventDefault();
			items[0]?.focus();
		} else if (e.key === 'End') {
			e.preventDefault();
			items[items.length - 1]?.focus();
		}
	}

	// Close dropdown/context when clicking outside
	function handleWindowClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.company-dropdown') && !target.closest('.dropdown-menu') && dropdownOpen) {
			closeDropdown();
		}
		if (!target.closest('.context-menu') && contextMenu) {
			closeContextMenu();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;

		if (dropdownOpen) {
			closeDropdown();
			dropdownTriggerRef?.focus();
		}
		if (contextMenu) {
			closeContextMenu();
		}
	}

	// Page tab arrow-key navigation (roving tabindex)
	function handlePageTabKeydown(e: KeyboardEvent) {
		const target = e.currentTarget as HTMLElement;
		const tablist = target.closest('[role="tablist"]');
		if (!tablist) return;
		const tabs = Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]'));
		const idx = tabs.indexOf(target);
		if (idx === -1) return;

		let next: number | null = null;
		if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
		else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
		else if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = tabs.length - 1;
		if (next === null) return;

		e.preventDefault();
		tabs[next].focus();
		tabs[next].click(); // select-follows-focus
		tabs[next].scrollIntoView({ block: 'nearest', inline: 'nearest' });
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<div class="company-page-bar">
	<!-- Company Selector -->
	<div class="company-dropdown">
		<button
			type="button"
			class="company-trigger"
			bind:this={dropdownTriggerRef}
			onclick={toggleDropdown}
			oncontextmenu={handleCompanyContextMenu}
			aria-expanded={dropdownOpen}
			aria-haspopup="listbox"
			aria-label="Select company, currently {currentCompany?.name || 'none'}"
		>
			<Tooltip text={currentCompany?.name || 'No Company'} position="bottom">
				<span class="company-name">{currentCompany?.name || 'No Company'}</span>
			</Tooltip>
			<Tooltip text={statusIndicator.title} position="bottom">
				<span
					class="status-dot"
					style="color: {statusIndicator.color}"
					role="status"
					aria-live="polite"
				>
					<svg viewBox="0 0 16 16" fill="none" width="12" height="12" aria-hidden="true">
						{#if statusIndicator.icon === 'check'}
							<circle cx="8" cy="8" r="6" fill="currentColor" opacity="0.2" />
							<path
								d="M5 8l2 2 4-4"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						{:else if statusIndicator.icon === 'spinner'}
							<circle
								cx="8"
								cy="8"
								r="6"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-dasharray="20 10"
								stroke-linecap="round"
							>
								<animateTransform
									attributeName="transform"
									type="rotate"
									from="0 8 8"
									to="360 8 8"
									dur="1s"
									repeatCount="indefinite"
								/>
							</circle>
						{:else if statusIndicator.icon === 'warning'}
							<path
								d="M8 3L2 13h12L8 3z"
								stroke="currentColor"
								stroke-width="1.2"
								stroke-linejoin="round"
							/>
							<line
								x1="8"
								y1="7"
								x2="8"
								y2="10"
								stroke="currentColor"
								stroke-width="1.2"
								stroke-linecap="round"
							/>
							<circle cx="8" cy="12" r="0.5" fill="currentColor" />
						{:else if statusIndicator.icon === 'device'}
							<rect
								x="3"
								y="4"
								width="10"
								height="7"
								rx="1"
								stroke="currentColor"
								stroke-width="1.2"
							/>
							<line
								x1="6"
								y1="13"
								x2="10"
								y2="13"
								stroke="currentColor"
								stroke-width="1.2"
								stroke-linecap="round"
							/>
						{:else}
							<circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.2" fill="none" />
						{/if}
					</svg>
				</span>
			</Tooltip>
			<svg class="chevron" class:open={dropdownOpen} viewBox="0 0 20 20" fill="currentColor">
				<path
					d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
				/>
			</svg>
		</button>
	</div>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Page Tabs -->
	<div class="page-tabs" role="tablist" aria-label="Company pages">
		{#if currentCompany && hasSW}
			<div class="page-tab-group">
				<Tooltip
					text="SolidWorks licenses on this company — right-click for options"
					position="bottom"
				>
					<button
						type="button"
						role="tab"
						class="page-tab sw-tab"
						class:active={swActive}
						aria-selected={swActive}
						tabindex={swActive ? 0 : -1}
						onclick={handleSWSelect}
						oncontextmenu={handleSWContextMenu}
						onkeydown={handlePageTabKeydown}
					>
						{swTabLabel}
					</button>
				</Tooltip>
				<button
					type="button"
					class="page-tab-menu-btn"
					tabindex={0}
					aria-label="Options for {swTabLabel}"
					onclick={(e) => {
						e.stopPropagation();
						handleSWContextMenu(e);
					}}>⋮</button
				>
			</div>
		{/if}
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
						aria-label="Page name"
						autofocus
					/>
				{:else}
					<div class="page-tab-group">
						<Tooltip text="{page.name} — double-click to rename" position="bottom">
							<button
								type="button"
								role="tab"
								class="page-tab"
								class:active={!swActive && page.id === currentCompany.currentPageId}
								aria-selected={!swActive && page.id === currentCompany.currentPageId}
								tabindex={!swActive && page.id === currentCompany.currentPageId ? 0 : -1}
								onclick={() => handlePageSelect(page.id)}
								ondblclick={() => handlePageDoubleClick(page.id, page.name)}
								oncontextmenu={(e) => handlePageContextMenu(e, page.id)}
								onkeydown={handlePageTabKeydown}
							>
								{page.name}
							</button>
						</Tooltip>
						<button
							type="button"
							class="page-tab-menu-btn"
							tabindex={0}
							aria-label="Options for {page.name}"
							onclick={(e) => {
								e.stopPropagation();
								handlePageContextMenu(e, page.id);
							}}>⋮</button
						>
					</div>
				{/if}
			{/each}
		{/if}
		<Tooltip text="Add a new page — each page is a separate license or quote" position="bottom">
			<button
				type="button"
				class="page-tab add-tab"
				onclick={handleNewPage}
				aria-label="Add new page"
			>
				+
			</button>
		</Tooltip>
	</div>



	<!-- Quick Actions -->
	{#if currentCompany}
		<div class="quick-actions">
			<Tooltip text="Import License" position="bottom">
				<button
					type="button"
					class="quick-action-btn"
					onclick={() => (showImportModal = true)}
					aria-label="Import License"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						width="14"
						height="14"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					Import
				</button>
			</Tooltip>
		</div>
	{/if}
</div>

<!-- Company Dropdown Menu (outside company-page-bar to escape backdrop-filter clipping) -->
{#if dropdownOpen}
	<div
		class="dropdown-menu"
		role="listbox"
		tabindex="-1"
		aria-label="Companies"
		style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
		onkeydown={handleDropdownKeydown}
	>
		<!-- Search (fixed) -->
		<div class="dropdown-header">
			<input
				type="search"
				placeholder="Search companies..."
				bind:value={searchQuery}
				bind:this={searchInputRef}
				class="search-input"
				aria-label="Search companies"
			/>
		</div>

		<!-- Scrollable List -->
		<div class="dropdown-list">
			{#if searchQuery.trim()}
				<div class="dropdown-section">
					<div class="section-title">Results ({filteredCompanies.length})</div>
					{#if filteredCompanies.length > 0}
						{#each filteredCompanies as company (company.id)}
							<button
								type="button"
								role="option"
								class="company-item"
								class:active={company.id === currentCompany?.id}
								aria-selected={company.id === currentCompany?.id}
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
				<div class="dropdown-section">
					<div class="section-title">Recent</div>
					{#each recent.slice(0, 8) as company (company.id)}
						<button
							type="button"
							role="option"
							class="company-item"
							class:active={company.id === currentCompany?.id}
							aria-selected={company.id === currentCompany?.id}
							onclick={() => handleCompanySelect(company.id)}
						>
							{company.name}
						</button>
					{/each}
				</div>
			{:else}
				<div class="no-results">No recent companies</div>
			{/if}
		</div>

		<!-- Footer (fixed) -->
		<div class="dropdown-footer">
			<button
				type="button"
				class="footer-btn footer-btn--new"
				onclick={handleNewCompany}
				aria-label="Create new company">+</button
			>
			<button type="button" class="footer-btn footer-btn--view" onclick={onViewAll}>
				View All ({allCompanies.length})
			</button>
		</div>
	</div>
{/if}

<!-- Context Menu -->
{#if contextMenu}
	<div
		class="context-menu"
		role="menu"
		aria-label={contextMenu.type === 'company' ? 'Company actions' : 'Page actions'}
		style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
	>
		{#if contextMenu.type === 'company'}
			<button type="button" role="menuitem" onclick={handleRenameCompany}>Rename</button>
			<button type="button" role="menuitem" onclick={handleDuplicateCompany}>Duplicate</button>
			<button type="button" role="menuitem" onclick={handleImportLicense}>Import License</button>
			<button type="button" role="menuitem" class="danger" onclick={handleDeleteCompany}
				>Delete</button
			>
			{#if import.meta.env.DEV}
				<hr class="menu-divider" />
				<button type="button" role="menuitem" class="danger" onclick={handleClearAllCompanies}
					>DEV: Clear All</button
				>
			{/if}
		{:else if contextMenu.type === 'sw'}
			<button type="button" role="menuitem" onclick={handleSWRename}>Rename</button>
			{#if currentCompany?.swTabLabelOverride}
				<button type="button" role="menuitem" onclick={handleSWResetLabel}>Reset to auto</button>
			{/if}
			<button type="button" role="menuitem" class="danger" onclick={handleSWDeleteAll}
				>Remove all SolidWorks licenses</button
			>
		{:else}
			<button type="button" role="menuitem" onclick={handleRenamePage}>Rename</button>
			<button type="button" role="menuitem" onclick={handleDuplicatePage}>Duplicate</button>
			{#if !contextMenuLicense}
				<button type="button" role="menuitem" onclick={handleCopyPageName}>Copy Page Name</button>
			{/if}
			{#if contextMenuLicense?.isProfile}
				{#if contextMenuPage?.licenseKey}
					<button type="button" role="menuitem" onclick={handleCopyLicenseKey}
						>Copy License Number</button
					>
				{/if}
				<button type="button" role="menuitem" onclick={handleCopyProfileName}
					>Copy Profile Name</button
				>
			{:else if contextMenuPage?.licenseKey}
				{#if contextMenuLicense?.licenseType === 'dongle'}
					<button type="button" role="menuitem" onclick={handleCopyLicenseKey}
						>Copy Dongle Number</button
					>
				{:else}
					<button type="button" role="menuitem" onclick={handleCopyLicenseKey}
						>Copy Key</button
					>
				{/if}
			{/if}
			<button type="button" role="menuitem" class="danger" onclick={handleDeletePage}>Delete</button
			>
		{/if}
	</div>
{/if}

{#snippet dialogFooter()}
	<div class="dialog-actions">
		<Button variant="ghost" size="sm" onclick={closeDialog}>Cancel</Button>
		{#if isConfirmDialog}
			<Button variant="danger" size="sm" onclick={handleDialogSubmit}>
				{dialogActionLabel}
			</Button>
		{:else}
			<Button variant="gold" size="sm" onclick={handleDialogSubmit} disabled={!dialogInputValid}>
				{dialogActionLabel}
			</Button>
		{/if}
	</div>
{/snippet}

<Modal open={dialogType !== null} onClose={closeDialog} title={dialogTitle} footer={dialogFooter}>
	{#if isConfirmDialog}
		<p class="dialog-message">{dialogMessage}</p>
	{:else}
		<div class="dialog-form">
			<Input
				label={dialogInputLabel}
				placeholder={dialogInputLabel}
				bind:value={dialogInput}
				onkeydown={handleDialogInputKeydown}
			/>
		</div>
	{/if}
</Modal>

<ImportLicenseModal bind:open={showImportModal} onClose={() => (showImportModal = false)} />

<style>
	.company-page-bar {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0.3rem 0.625rem;
		background: linear-gradient(145deg, rgba(24, 24, 30, 0.85) 0%, rgba(18, 18, 24, 0.9) 100%);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		backdrop-filter: blur(8px);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.03);
	}

	/* Subtle animated border shimmer */
	.company-page-bar::before {
		content: '';
		position: absolute;
		inset: -1px;
		background: linear-gradient(
			90deg,
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
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Company Dropdown */
	.company-dropdown {
		position: relative;
		z-index: 1;
	}

	.company-trigger {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.35rem 0.625rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		color: var(--color-text-primary);
		font-size: var(--text-base);
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
		font-weight: 600;
	}

	.status-dot {
		display: flex;
		align-items: center;
		flex-shrink: 0;
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
		position: fixed;
		display: flex;
		flex-direction: column;
		min-width: 220px;
		max-height: 320px;
		background: linear-gradient(145deg, rgba(32, 32, 38, 0.98), rgba(24, 24, 30, 0.98));
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		box-shadow:
			0 12px 32px rgba(0, 0, 0, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(16px);
		z-index: 1000;
		animation: dropdownFadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1);
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

	.dropdown-header {
		flex-shrink: 0;
		padding: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.dropdown-list {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	.dropdown-list::-webkit-scrollbar {
		width: 5px;
	}

	.dropdown-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.dropdown-list::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.15);
		border-radius: 3px;
	}

	.dropdown-list::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.search-input {
		width: 100%;
		padding: 0.4rem 0.6rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		color: var(--color-text-primary);
		font-size: var(--text-sm);
		transition: all 200ms ease;
	}

	.search-input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-solidcam-gold, #d4af37);
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
	}

	.dropdown-section {
		padding: 0.35rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.section-title {
		padding: 0.15rem 0.4rem;
		font-size: var(--text-xs);
		font-weight: 600;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.company-item {
		display: block;
		width: 100%;
		padding: 0.4rem 0.5rem;
		background: transparent;
		border: none;
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.8);
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.company-item:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--color-text-primary);
		padding-left: 0.75rem;
	}

	.company-item.active {
		background: rgba(212, 175, 55, 0.15);
		color: var(--color-solidcam-gold, #d4af37);
	}

	.no-results {
		padding: var(--space-4) var(--space-2);
		text-align: center;
		color: rgba(255, 255, 255, 0.4);
		font-size: var(--text-sm);
		font-style: italic;
	}

	.dropdown-footer {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.35rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.footer-btn {
		padding: 0.3rem 0.5rem;
		border: none;
		border-radius: 5px;
		font-size: var(--text-xs);
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.footer-btn--new {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		background: linear-gradient(145deg, #e8c547, #d4af37);
		color: #1a1a1a;
		font-weight: 700;
	}

	.footer-btn--new:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
	}

	.footer-btn--view {
		flex: 1;
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.7);
	}

	.footer-btn--view:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text-primary);
	}

	/* Divider */
	.divider {
		width: 1px;
		height: 20px;
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
		gap: var(--space-1);
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
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.6);
		font-size: var(--text-sm);
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
		background: rgba(212, 175, 55, 0.25);
		border-color: rgba(212, 175, 55, 0.3);
		border-bottom: 2px solid var(--color-solidcam-gold, #d4af37);
		color: var(--color-solidcam-gold, #d4af37);
		box-shadow: 0 0 12px rgba(212, 175, 55, 0.1);
	}

	.page-tab.sw-tab {
		color: rgba(248, 113, 113, 0.85);
		border-left: 2px solid rgba(220, 38, 38, 0.5);
		padding-left: 0.45rem;
	}

	.page-tab.sw-tab:hover {
		background: rgba(220, 38, 38, 0.08);
		color: rgba(252, 165, 165, 0.95);
		border-color: rgba(220, 38, 38, 0.2);
		border-left-color: rgba(220, 38, 38, 0.7);
	}

	.page-tab.sw-tab.active {
		background: rgba(220, 38, 38, 0.18);
		border-color: rgba(220, 38, 38, 0.35);
		border-bottom: 2px solid rgba(220, 38, 38, 0.85);
		border-left: 2px solid rgba(220, 38, 38, 0.85);
		color: rgba(252, 165, 165, 1);
		box-shadow: 0 0 12px rgba(220, 38, 38, 0.12);
	}

	.page-tab-group {
		display: flex;
		align-items: center;
		position: relative;
	}

	.page-tab-menu-btn {
		position: relative;
		opacity: 0;
		padding: 0.1rem 0.15rem;
		margin-left: -0.15rem;
		font-size: 0.7em;
		line-height: 1;
		color: rgba(255, 255, 255, 0.4);
		background: none;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: opacity 150ms ease;
	}

	/* Expand touch target to 44x44 on touch devices only */
	@media (hover: none) {
		.page-tab-menu-btn::after {
			content: '';
			position: absolute;
			inset: 50% auto auto 50%;
			width: 44px;
			height: 44px;
			transform: translate(-50%, -50%);
		}
	}

	.page-tab-group:hover .page-tab-menu-btn,
	.page-tab-group:focus-within .page-tab-menu-btn {
		opacity: 0.6;
	}

	.page-tab-menu-btn:hover,
	.page-tab-menu-btn:focus-visible {
		opacity: 1 !important;
		color: var(--color-solidcam-gold, #d4af37);
	}

	.page-tab-menu-btn:focus-visible {
		outline: 2px solid var(--color-solidcam-gold, #d4af37);
		outline-offset: 1px;
		border-radius: 4px;
	}

	@media (hover: none) {
		.page-tab-menu-btn {
			opacity: 0.5;
		}
	}

	.page-tab.add-tab {
		color: rgba(255, 255, 255, 0.4);
		font-size: var(--text-lg);
		padding: 0.25rem 0.5rem;
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
		color: var(--color-text-primary);
		font-size: var(--text-base);
		width: 70px;
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
	}

	.page-tab-input:focus {
		outline: none;
	}

	.quick-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.quick-action-btn {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		height: 26px;
		padding: 0 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.7rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.quick-action-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
		color: var(--color-solidcam-gold, #d4af37);
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
		animation: contextMenuFadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1);
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
		font-size: var(--text-base);
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
		color: var(--color-error);
	}

	.context-menu .menu-divider {
		margin: 0.25rem 0;
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.dialog-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.dialog-message {
		margin: 0;
		font-size: var(--text-base);
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.4;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		width: 100%;
	}

	/* Focus states */
	.company-trigger:focus-visible,
	.page-tab:focus-visible,
	.company-item:focus-visible {
		outline: 2px solid var(--color-solidcam-gold, #d4af37);
		outline-offset: 2px;
	}

	/* Responsive - compact but don't wrap */
	@media (max-width: 900px) {
		.company-page-bar {
			gap: 0.35rem;
			padding: 0.25rem 0.5rem;
		}

		.company-trigger {
			padding: 0.25rem 0.5rem;
			font-size: 0.75rem;
		}

		.company-name {
			max-width: 140px;
		}

		.page-tab {
			padding: 0.2rem 0.4rem;
			font-size: 0.7rem;
		}
	}

	@media (max-width: 768px) {
		.company-page-bar {
			gap: 0.25rem;
			padding: 0.2rem 0.35rem;
		}

		.company-trigger {
			padding: 0.2rem 0.35rem;
			font-size: 0.65rem;
			gap: 0.25rem;
		}

		.company-name {
			max-width: 100px;
		}

		.chevron {
			width: 14px;
			height: 14px;
		}

		.page-tab {
			padding: 0.15rem 0.3rem;
			font-size: 0.6rem;
			border-radius: 6px;
		}

		.divider {
			height: 14px;
		}
	}

	@media (max-width: 640px) {
		.company-page-bar {
			gap: 0.15rem;
			padding: 0.1rem 0.15rem;
			border-radius: 8px;
		}

		.company-trigger {
			padding: 0.15rem 0.25rem;
			font-size: 0.6875rem;
			border-radius: 6px;
			min-height: 24px;
		}

		.company-name {
			max-width: 70px;
		}

		.chevron {
			width: 16px;
			height: 16px;
		}

		.status-dot svg {
			width: 10px;
			height: 10px;
		}

		.page-tab {
			padding: 0.1rem 0.2rem;
			font-size: 0.6875rem;
			border-radius: 4px;
		}

		.page-tab.add-tab {
			font-size: 0.625rem;
			padding: 0.1rem 0.3rem;
		}

		.divider {
			height: 12px;
		}
	}
</style>
