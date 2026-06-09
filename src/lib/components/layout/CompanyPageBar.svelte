<script lang="ts">
	import {
		AlertTriangle,
		Check,
		ChevronDown,
		Copy,
		Download,
		Loader2,
		MonitorOff,
		MoreVertical,
		Pencil,
		Plus,
		RotateCcw,
		Search,
		Trash2
	} from 'lucide-svelte';
	import { companiesStore } from '$stores/companies.svelte';

	import { syncStore } from '$stores/sync.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { Button, Input, Modal, ImportLicenseModal, Tooltip } from '$components/ui';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import { getPageNameForLicense } from '$lib/utils/licenseSelections';
	import { menuKeyNav } from '$lib/utils/menuKeyNav';

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
		dialogType === 'delete-company' || dialogType === 'delete-page' || dialogType === 'delete-sw'
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

	// Delay single-click open so a double-click (copy) can pre-empt it.
	let companyClickTimer: ReturnType<typeof setTimeout> | null = null;

	function toggleDropdown(e: MouseEvent) {
		e.stopPropagation();
		const button = e.currentTarget as HTMLElement;
		const rect = button.getBoundingClientRect();

		if (companyClickTimer) {
			clearTimeout(companyClickTimer);
			companyClickTimer = null;
		}

		companyClickTimer = setTimeout(() => {
			companyClickTimer = null;
			dropdownOpen = !dropdownOpen;
			if (dropdownOpen) {
				searchQuery = '';
				dropdownPosition = {
					top: rect.bottom + 8,
					left: rect.left
				};
			}
		}, 140);
	}

	async function handleCompanyDoubleClick(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		if (companyClickTimer) {
			clearTimeout(companyClickTimer);
			companyClickTimer = null;
		}
		if (dropdownOpen) closeDropdown();
		const name = currentCompany?.name;
		if (!name) return;
		await copyToClipboard(name, 'Company name copied');
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

	// Build a labelled license string for a given page, e.g.:
	//   "Hardware Dongle:\n77518"
	//   "Network Product Key:\n0000-0000-0000"
	//   "Profile:\nProfile-1234"
	// Returns null if no license/key can be resolved.
	function buildPageLicenseCopyText(pageId: string): string | null {
		const company = currentCompany;
		if (!company) return null;
		const page = company.pages.find((p) => p.id === pageId);
		if (!page) return null;

		const licenses = company.licenses ?? [];
		let license = null as (typeof licenses)[number] | null;
		if (licenses.length > 0) {
			const matching = licenses.filter((l) => getPageNameForLicense(l) === page.name);
			if (matching.length === 1) {
				license = matching[0];
			} else if (matching.length > 1) {
				license = matching.reduce((acc, l) => (l.importedAt > acc.importedAt ? l : acc));
			} else if (licenses.length === 1) {
				license = licenses[0];
			}
		}

		// Profile: just the identifier (matches right-click "Copy Profile Name").
		if (license?.isProfile && license.profileNo) {
			return `Profile-${license.profileNo}`;
		}

		const number = license?.productKey || license?.dongleNo || page.licenseKey;
		if (!number) return null;

		let label = 'License';
		if (license) {
			if (license.licenseType === 'product-key') {
				label = license.isNetworkLicense ? 'Network Product Key' : 'Standalone Product Key';
			} else {
				label = license.isNetworkLicense ? 'Network Dongle' : 'Hardware Dongle';
			}
		}
		// Only network licenses (NPK / NWD) get the user-count suffix.
		const suffix = license?.isNetworkLicense ? formatUsersSuffix(license.actualUsers) : '';
		return `${label}:\n${number}${suffix}`;
	}

	function formatUsersSuffix(count: number | undefined): string {
		if (count === undefined || count <= 0) return '';
		return ` ~ ${count} ${count === 1 ? 'User' : 'Users'}`;
	}

	// Debounce single-click on tabs so a double-click (copy) doesn't also switch the page.
	let tabClickTimer: ReturnType<typeof setTimeout> | null = null;

	function clearTabClickTimer() {
		if (tabClickTimer) {
			clearTimeout(tabClickTimer);
			tabClickTimer = null;
		}
	}

	function handlePageTabClick(pageId: string) {
		clearTabClickTimer();
		tabClickTimer = setTimeout(() => {
			tabClickTimer = null;
			handlePageSelect(pageId);
		}, 180);
	}

	function handleSWTabClick() {
		clearTabClickTimer();
		tabClickTimer = setTimeout(() => {
			tabClickTimer = null;
			handleSWSelect();
		}, 180);
	}

	// Double-click page tab: copy license info (rename remains via right-click / ⋮ menu).
	async function handlePageDoubleClick(e: MouseEvent, pageId: string) {
		e.stopPropagation();
		e.preventDefault();
		clearTabClickTimer();
		const text = buildPageLicenseCopyText(pageId);
		if (!text) {
			toastStore.error('No license to copy');
			return;
		}
		await copyToClipboard(text, 'License copied');
	}

	// Double-click SW tab: copy all SolidWorks licenses on the company.
	async function handleSWDoubleClick(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		clearTabClickTimer();
		const licenses = currentCompany?.solidworksLicenses ?? [];
		if (licenses.length === 0) {
			toastStore.error('No SolidWorks license to copy');
			return;
		}
		// Group serial numbers by product type so same-type licenses stack
		// under one label instead of repeating it.
		const order: string[] = [];
		const byProduct = new Map<string, string[]>();
		for (const lic of licenses) {
			if (!byProduct.has(lic.product)) {
				byProduct.set(lic.product, []);
				order.push(lic.product);
			}
			byProduct.get(lic.product)!.push(lic.serialNumber);
		}
		const text = order
			.map((product) => `SolidWorks ${product}:\n${byProduct.get(product)!.join('\n')}`)
			.join('\n\n');
		await copyToClipboard(text, 'SolidWorks license copied');
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
			toastStore.success(dialogInput.trim().length === 0 ? 'SW tab label reset' : 'SW tab renamed');
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

	// License-type tag for page tabs: "HWD 77518" → [HWD] 77518 etc.
	// Profiles are P + 4+ digits; short P-names (P1, P2…) are plain pages.
	function pageTag(name: string): { key: string; rest: string } | null {
		const m = name.match(/^(HWD|HW|NWD|NPK|SPK)\s+(.*)$/);
		if (m) return { key: m[1], rest: m[2] };
		const p = name.match(/^P(\d{4,}.*)$/);
		if (p) return { key: 'P', rest: p[1] };
		return null;
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
			ondblclick={handleCompanyDoubleClick}
			oncontextmenu={handleCompanyContextMenu}
			aria-expanded={dropdownOpen}
			aria-haspopup="listbox"
			aria-label="Select company, currently {currentCompany?.name || 'none'}"
		>
			<Tooltip
				text={currentCompany?.name
					? `${currentCompany.name} — double-click to copy name`
					: 'No Company'}
				position="bottom"
			>
				<span class="company-name">{currentCompany?.name || 'No Company'}</span>
			</Tooltip>
			<Tooltip text={statusIndicator.title} position="bottom">
				<span
					class="status-dot"
					style="color: {statusIndicator.color}"
					role="status"
					aria-live="polite"
				>
					{#if statusIndicator.icon === 'check'}
						<Check size={12} strokeWidth={2.5} />
					{:else if statusIndicator.icon === 'spinner'}
						<Loader2 class="status-spinner" size={12} strokeWidth={2.5} />
					{:else if statusIndicator.icon === 'warning'}
						<AlertTriangle size={12} strokeWidth={2} />
					{:else if statusIndicator.icon === 'device'}
						<MonitorOff size={12} strokeWidth={2} />
					{/if}
				</span>
			</Tooltip>
			<span class="chevron" class:open={dropdownOpen} aria-hidden="true">
				<ChevronDown size={14} strokeWidth={2.25} />
			</span>
		</button>
	</div>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Page Tabs -->
	<div class="page-tabs" role="tablist" aria-label="Company pages" translate="no">
		{#if currentCompany && hasSW}
			<div class="page-tab-group">
				<Tooltip
					text="SolidWorks licenses — double-click to copy, right-click for options"
					position="bottom"
				>
					<button
						type="button"
						role="tab"
						class="page-tab sw-tab"
						class:active={swActive}
						aria-selected={swActive}
						tabindex={swActive ? 0 : -1}
						onclick={handleSWTabClick}
						ondblclick={handleSWDoubleClick}
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
					}}><MoreVertical size={12} strokeWidth={2.5} /></button
				>
			</div>
		{/if}
		{#if currentCompany}
			{#each currentCompany.pages as page (page.id)}
				{@const tag = pageTag(page.name)}
				<div class="page-tab-group">
					<Tooltip text="{page.name} — double-click to copy license" position="bottom">
						<button
							type="button"
							role="tab"
							class="page-tab"
							class:active={!swActive && page.id === currentCompany.currentPageId}
							aria-selected={!swActive && page.id === currentCompany.currentPageId}
							tabindex={!swActive && page.id === currentCompany.currentPageId ? 0 : -1}
							onclick={() => handlePageTabClick(page.id)}
							ondblclick={(e) => handlePageDoubleClick(e, page.id)}
							oncontextmenu={(e) => handlePageContextMenu(e, page.id)}
							onkeydown={handlePageTabKeydown}
						>
							{#if tag}
								<span class="tab-type tab-type--{tag.key.toLowerCase()}" aria-hidden="true"
									>{tag.key}</span
								>{tag.rest}
							{:else}
								{page.name}
							{/if}
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
						}}><MoreVertical size={12} strokeWidth={2.5} /></button
					>
				</div>
			{/each}
		{/if}
		<Tooltip text="Add a new page — each page is a separate license or quote" position="bottom">
			<button
				type="button"
				class="page-tab add-tab"
				onclick={handleNewPage}
				aria-label="Add new page"
			>
				<Plus size={14} strokeWidth={2.25} />
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
					<Download size={13} strokeWidth={2} />
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
			<div class="search-wrap">
				<Search class="search-icon" size={13} strokeWidth={2} />
				<input
					type="search"
					placeholder="Search companies..."
					bind:value={searchQuery}
					bind:this={searchInputRef}
					class="search-input"
					aria-label="Search companies"
				/>
			</div>
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
				aria-label="Create new company"
			>
				<Plus size={14} strokeWidth={2.5} />
			</button>
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
		use:menuKeyNav={{ onClose: closeContextMenu }}
	>
		{#if contextMenu.type === 'company'}
			<button type="button" role="menuitem" onclick={handleRenameCompany}>
				<Pencil size={13} strokeWidth={2} /> Rename
			</button>
			<button type="button" role="menuitem" onclick={handleDuplicateCompany}>
				<Copy size={13} strokeWidth={2} /> Duplicate
			</button>
			<button type="button" role="menuitem" onclick={handleImportLicense}>
				<Download size={13} strokeWidth={2} /> Import License
			</button>
			<button type="button" role="menuitem" class="danger" onclick={handleDeleteCompany}>
				<Trash2 size={13} strokeWidth={2} /> Delete
			</button>
			{#if import.meta.env.DEV}
				<hr class="menu-divider" />
				<button type="button" role="menuitem" class="danger" onclick={handleClearAllCompanies}>
					<Trash2 size={13} strokeWidth={2} /> DEV: Clear All
				</button>
			{/if}
		{:else if contextMenu.type === 'sw'}
			<button type="button" role="menuitem" onclick={handleSWRename}>
				<Pencil size={13} strokeWidth={2} /> Rename
			</button>
			{#if currentCompany?.swTabLabelOverride}
				<button type="button" role="menuitem" onclick={handleSWResetLabel}>
					<RotateCcw size={13} strokeWidth={2} /> Reset to auto
				</button>
			{/if}
			<button type="button" role="menuitem" class="danger" onclick={handleSWDeleteAll}>
				<Trash2 size={13} strokeWidth={2} /> Remove all SolidWorks licenses
			</button>
		{:else}
			<button type="button" role="menuitem" onclick={handleRenamePage}>
				<Pencil size={13} strokeWidth={2} /> Rename
			</button>
			<button type="button" role="menuitem" onclick={handleDuplicatePage}>
				<Copy size={13} strokeWidth={2} /> Duplicate
			</button>
			{#if !contextMenuLicense}
				<button type="button" role="menuitem" onclick={handleCopyPageName}>
					<Copy size={13} strokeWidth={2} /> Copy Page Name
				</button>
			{/if}
			{#if contextMenuLicense?.isProfile}
				{#if contextMenuPage?.licenseKey}
					<button type="button" role="menuitem" onclick={handleCopyLicenseKey}>
						<Copy size={13} strokeWidth={2} /> Copy License Number
					</button>
				{/if}
				<button type="button" role="menuitem" onclick={handleCopyProfileName}>
					<Copy size={13} strokeWidth={2} /> Copy Profile Name
				</button>
			{:else if contextMenuPage?.licenseKey}
				{#if contextMenuLicense?.licenseType === 'dongle'}
					<button type="button" role="menuitem" onclick={handleCopyLicenseKey}>
						<Copy size={13} strokeWidth={2} /> Copy Dongle Number
					</button>
				{:else}
					<button type="button" role="menuitem" onclick={handleCopyLicenseKey}>
						<Copy size={13} strokeWidth={2} /> Copy Key
					</button>
				{/if}
			{/if}
			<button type="button" role="menuitem" class="danger" onclick={handleDeletePage}>
				<Trash2 size={13} strokeWidth={2} /> Delete
			</button>
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
		/* Same surface as the tiles below — one material across the page */
		background: var(--tile-bg);
		border: var(--tile-border);
		border-radius: var(--tile-radius);
		backdrop-filter: blur(var(--glass-blur));
		-webkit-backdrop-filter: blur(var(--glass-blur));
		box-shadow: var(--tile-shadow);
	}

	/* Company Dropdown */
	.company-dropdown {
		position: relative;
		z-index: 1;
	}

	.company-trigger {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.625rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		color: var(--color-text-primary);
		font-size: var(--text-base);
		font-weight: 500;
		cursor: pointer;
		transition:
			background 200ms var(--ease-out-quart),
			border-color 200ms var(--ease-out-quart),
			box-shadow 280ms var(--ease-out-expo),
			transform 200ms var(--ease-out-quart);
	}

	.company-trigger:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.16);
		transform: translateY(-2px);
		box-shadow:
			0 6px 20px rgba(0, 0, 0, 0.3),
			0 0 22px rgba(212, 175, 55, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.company-name {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 540;
		letter-spacing: -0.01em;
	}

	.status-dot {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.status-dot :global(.status-spinner) {
		animation: status-spin 0.85s linear infinite;
	}

	@keyframes status-spin {
		to {
			transform: rotate(360deg);
		}
	}

	.chevron {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		opacity: 0.55;
		transition: transform 250ms var(--ease-out-expo);
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
		background: var(--menu-bg);
		border: var(--menu-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--menu-shadow);
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

	.search-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-wrap :global(.search-icon) {
		position: absolute;
		left: 0.55rem;
		top: 50%;
		transform: translateY(-50%);
		color: rgba(255, 255, 255, 0.4);
		pointer-events: none;
		transition: color 200ms var(--ease-out-quart);
	}

	.search-wrap:focus-within :global(.search-icon) {
		color: var(--color-solidcam-gold);
	}

	.search-input {
		width: 100%;
		padding: 0.4rem 0.6rem 0.4rem 1.85rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		color: var(--color-text-primary);
		font-size: var(--text-sm);
		transition:
			border-color 200ms var(--ease-out-quart),
			background 200ms var(--ease-out-quart),
			box-shadow 250ms var(--ease-out-expo);
	}

	.search-input::placeholder {
		color: rgba(255, 255, 255, 0.45);
	}

	.search-input:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.06);
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
		padding: 0.4rem 0.5rem 0.4rem 0.6rem;
		background: transparent;
		border: none;
		border-left: 2px solid transparent;
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.78);
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
		transition:
			background 150ms var(--ease-out-quart),
			color 150ms var(--ease-out-quart),
			border-left-color 200ms var(--ease-out-expo);
	}

	.company-item:hover {
		background: rgba(255, 255, 255, 0.06);
		color: var(--color-text-primary);
		border-left-color: var(--gold-a45);
	}

	.company-item.active {
		background: var(--gold-a20);
		color: var(--color-solidcam-gold, #d4af37);
		border-left-color: var(--color-solidcam-gold);
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 26px;
		background: var(--gradient-gold);
		color: var(--color-on-gold);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
		transition:
			transform 180ms var(--ease-out-quart),
			box-shadow 250ms var(--ease-out-expo);
	}

	.footer-btn--new:hover {
		transform: translateY(-1px);
		box-shadow:
			0 4px 12px rgba(212, 175, 55, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
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
		/* Horizontal scroll only — overflow-x:auto alone would force a
		   vertical scrollbar too whenever content runs 1px tall */
		overflow-x: auto;
		overflow-y: hidden;
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

	/* License-type stamps — each license kind wears its color on the tab */
	.tab-type {
		display: inline-block;
		padding: 0 4px;
		margin-right: 4px;
		font-size: 0.55rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		line-height: 1.5;
		border-radius: 3px;
		border: 1px solid;
		vertical-align: 1px;
	}

	.tab-type--hwd,
	.tab-type--hw {
		color: var(--color-solidcam-gold);
		background: var(--gold-a10);
		border-color: var(--gold-a30);
	}

	.tab-type--nwd {
		color: var(--accent-sky);
		background: rgba(96, 165, 250, 0.1);
		border-color: rgba(96, 165, 250, 0.3);
	}

	.tab-type--npk {
		color: var(--accent-violet);
		background: rgba(192, 132, 252, 0.1);
		border-color: rgba(192, 132, 252, 0.3);
	}

	.tab-type--spk {
		color: #4ade80;
		background: rgba(74, 222, 128, 0.1);
		border-color: rgba(74, 222, 128, 0.3);
	}

	.tab-type--p {
		color: var(--accent-amber);
		background: rgba(251, 146, 60, 0.1);
		border-color: rgba(251, 146, 60, 0.32);
	}

	.page-tab {
		position: relative;
		padding: 0.28rem 0.55rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.6);
		font-size: var(--text-sm);
		font-weight: 500;
		letter-spacing: -0.005em;
		cursor: pointer;
		transition:
			background 180ms var(--ease-out-quart),
			color 180ms var(--ease-out-quart),
			border-color 180ms var(--ease-out-quart),
			box-shadow 250ms var(--ease-out-expo);
		white-space: nowrap;
	}

	.page-tab:hover {
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.92);
		border-color: rgba(255, 255, 255, 0.08);
	}

	.page-tab.active {
		background: var(--gold-a20);
		border-color: var(--gold-a30);
		color: var(--color-solidcam-gold, #d4af37);
		box-shadow:
			0 0 14px rgba(212, 175, 55, 0.18),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	/* Active tab gets a soft underline rail anchoring it to the content below */
	.page-tab.active::after {
		content: '';
		position: absolute;
		left: 12%;
		right: 12%;
		bottom: -3px;
		height: 2px;
		border-radius: 2px;
		background: linear-gradient(90deg, transparent, var(--color-solidcam-gold), transparent);
		box-shadow: 0 0 8px rgba(212, 175, 55, 0.45);
	}

	.page-tab.sw-tab {
		color: rgba(248, 113, 113, 0.85);
		border-left: 2px solid rgba(220, 38, 38, 0.45);
		padding-left: 0.5rem;
	}

	.page-tab.sw-tab:hover {
		background: rgba(220, 38, 38, 0.08);
		color: rgba(252, 165, 165, 0.95);
		border-color: rgba(220, 38, 38, 0.2);
		border-left-color: rgba(220, 38, 38, 0.7);
	}

	.page-tab.sw-tab.active {
		background: rgba(220, 38, 38, 0.16);
		border-color: rgba(220, 38, 38, 0.32);
		border-left: 2px solid rgba(220, 38, 38, 0.85);
		color: rgba(252, 165, 165, 1);
		box-shadow:
			0 0 14px rgba(220, 38, 38, 0.18),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	.page-tab.sw-tab.active::after {
		background: linear-gradient(90deg, transparent, rgba(220, 38, 38, 1), transparent);
		box-shadow: 0 0 8px rgba(220, 38, 38, 0.5);
	}

	.page-tab-group {
		display: flex;
		align-items: center;
		position: relative;
	}

	.page-tab-menu-btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		padding: 0.1rem 0.15rem;
		margin-left: -0.15rem;
		line-height: 1;
		color: rgba(255, 255, 255, 0.45);
		background: none;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: opacity 150ms var(--ease-out-quart);
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.4);
		padding: 0.28rem 0.45rem;
	}

	.page-tab.add-tab:hover {
		color: var(--color-solidcam-gold, #d4af37);
		background: var(--gold-a10);
		border-color: var(--gold-a20);
	}

	.quick-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.quick-action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		height: 26px;
		padding: 0 0.55rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.62);
		font-size: 0.7rem;
		font-weight: 540;
		letter-spacing: 0.01em;
		cursor: pointer;
		transition:
			background 180ms var(--ease-out-quart),
			border-color 180ms var(--ease-out-quart),
			color 180ms var(--ease-out-quart),
			box-shadow 250ms var(--ease-out-expo);
	}

	.quick-action-btn:hover {
		background: var(--gold-a10);
		border-color: var(--gold-a30);
		color: var(--color-solidcam-gold, #d4af37);
		box-shadow: 0 0 14px rgba(212, 175, 55, 0.18);
	}

	/* Context Menu */
	.context-menu {
		position: fixed;
		min-width: 140px;
		background: var(--menu-bg);
		border: var(--menu-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--menu-shadow);
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
		display: flex;
		align-items: center;
		gap: 0.55rem;
		width: 100%;
		padding: 0.55rem 0.85rem;
		background: transparent;
		border: none;
		border-left: 2px solid transparent;
		color: rgba(255, 255, 255, 0.82);
		font-size: var(--text-base);
		text-align: left;
		cursor: pointer;
		transition:
			background 150ms var(--ease-out-quart),
			color 150ms var(--ease-out-quart),
			border-left-color 200ms var(--ease-out-expo);
	}

	.context-menu button :global(svg) {
		flex-shrink: 0;
		opacity: 0.7;
		transition: opacity 150ms var(--ease-out-quart);
	}

	.context-menu button:hover {
		background: rgba(255, 255, 255, 0.06);
		border-left-color: var(--gold-a45);
	}

	.context-menu button:hover :global(svg) {
		opacity: 1;
	}

	.context-menu button:not(:last-child) {
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}

	.context-menu button.danger:hover {
		background: rgba(239, 68, 68, 0.12);
		color: var(--color-error);
		border-left-color: var(--color-error);
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

		.status-dot :global(svg) {
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
