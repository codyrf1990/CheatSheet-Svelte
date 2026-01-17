/**
 * Companies Store (Svelte 5 Runes)
 * Main data store managing companies, pages, and page state.
 * Ported from original page-system.js (~683 lines)
 */

import type { Company, Page, PageState, PackageState } from '$types';

// localStorage keys (must match original for migration)
const CURRENT_COMPANY_KEY = 'solidcam-current-company-id';
const COMPANIES_STORAGE_KEY = 'solidcam-companies';
const FAVORITES_STORAGE_KEY = 'solidcam-favorites';
const RECENT_STORAGE_KEY = 'solidcam-recent';

// Legacy keys for migration
const OLD_PAGES_KEY = 'solidcam-pages-data';
const OLD_STATE_KEY = 'solidcam-cheatsheet-state';

export const DEFAULT_COMPANY_NAME = 'Untitled Company';
export const DEFAULT_PAGE_NAME = 'P1';

// Reactive state
let companies = $state<Company[]>([]);
let currentCompanyId = $state<string | null>(null);
let favoriteIds = $state<string[]>([]);
let recentIds = $state<string[]>([]);

// Change handler for external sync
let changeHandler: ((data: ReturnType<typeof exportData>) => void) | null = null;

/**
 * Generate unique ID with prefix
 */
function generateId(prefix: string = 'page'): string {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create empty page state
 */
function createEmptyPageState(): PageState {
	return { panels: {}, packages: {} };
}

/**
 * Build a default company with one empty page
 */
function buildDefaultCompany(name: string = DEFAULT_COMPANY_NAME): Company {
	const pageId = generateId('page');
	return {
		id: generateId('comp'),
		name,
		pages: [
			{
				id: pageId,
				name: DEFAULT_PAGE_NAME,
				state: createEmptyPageState()
			}
		],
		currentPageId: pageId,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		lastAccessed: Date.now(),
		isFavorite: false
	};
}

/**
 * Deep copy an object (prevents mutation bugs)
 */
function deepCopy<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Migrate old package state format to new format
 * Old: { bits: [{text, checked}], groups: [{masterId, items: [{text, checked}]}] }
 * New: { selectedBits: string[], customBits: string[], order: string[], looseBitsOrder?: string[], groupMembership?: Record<string, string> }
 */
function migratePackageState(
	oldState: unknown
): Record<string, PackageState> {
	if (!oldState || typeof oldState !== 'object') return {};

	const result: Record<string, PackageState> = {};

	for (const [pkgCode, pkgState] of Object.entries(oldState as Record<string, unknown>)) {
		if (!pkgState || typeof pkgState !== 'object') continue;

		const state = pkgState as {
			// New format
			selectedBits?: string[];
			customBits?: string[];
			order?: string[];
			looseBitsOrder?: string[];
			groupMembership?: Record<string, string>;
			// Old format
			bits?: Array<{ text: string; checked: boolean } | string>;
			groups?: Array<{
				masterId: string;
				checked?: boolean;
				indeterminate?: boolean;
				items?: Array<{ text: string; checked: boolean } | string>;
			}>;
		};

		// Check if already in new format
		if (Array.isArray(state.selectedBits)) {
			result[pkgCode] = {
				selectedBits: state.selectedBits,
				customBits: state.customBits || [],
				order: state.order || [],
				looseBitsOrder: state.looseBitsOrder || [],
				groupMembership: state.groupMembership || {}
			};
			continue;
		}

		// Migrate from old format
		const selectedBits: string[] = [];

		// Process loose bits
		if (Array.isArray(state.bits)) {
			for (const bit of state.bits) {
				if (typeof bit === 'string') {
					// Plain string means selected
					selectedBits.push(bit);
				} else if (bit && typeof bit === 'object' && bit.checked && bit.text) {
					selectedBits.push(bit.text);
				}
			}
		}

		// Process groups (master bits with sub-bits)
		if (Array.isArray(state.groups)) {
			for (const group of state.groups) {
				if (!group || !Array.isArray(group.items)) continue;

				for (const item of group.items) {
					if (typeof item === 'string') {
						selectedBits.push(item);
					} else if (item && typeof item === 'object' && item.checked && item.text) {
						selectedBits.push(item.text);
					}
				}
			}
		}

		result[pkgCode] = {
			selectedBits,
			customBits: [],
			order: [],
			looseBitsOrder: [],
			groupMembership: {}
		};
	}

	return result;
}

/**
 * Get current company object
 */
function getCurrentCompany(): Company | null {
	return companies.find((c) => c.id === currentCompanyId) ?? null;
}

/**
 * Get current page from current company
 */
function getCurrentPage(): Page | null {
	const company = getCurrentCompany();
	if (!company) return null;
	return company.pages.find((p) => p.id === company.currentPageId) ?? null;
}

/**
 * Track recent company access
 */
function trackRecentAccess(companyId: string): void {
	// Remove if already in list
	recentIds = recentIds.filter((id) => id !== companyId);
	// Add to front
	recentIds = [companyId, ...recentIds];
	// Keep max 20
	if (recentIds.length > 20) {
		recentIds = recentIds.slice(0, 20);
	}
}

/**
 * Ensure data integrity - at least one company exists
 */
function ensureIntegrity(): void {
	if (!Array.isArray(companies)) {
		companies = [];
	}

	if (companies.length === 0) {
		companies = [buildDefaultCompany(DEFAULT_COMPANY_NAME)];
	}

	// Validate each company
	companies = companies.map((company) => {
		// Ensure pages array exists
		if (!Array.isArray(company.pages)) {
			company.pages = [];
		}

		// Ensure at least one page
		if (company.pages.length === 0) {
			const pageId = generateId('page');
			company.pages = [{ id: pageId, name: DEFAULT_PAGE_NAME, state: createEmptyPageState() }];
			company.currentPageId = pageId;
		}

		// Ensure timestamps
		company.createdAt = company.createdAt || Date.now();
		company.updatedAt = company.updatedAt || Date.now();
		company.lastAccessed = company.lastAccessed || Date.now();
		company.isFavorite = company.isFavorite ?? false;

		// Ensure currentPageId is valid
		if (!company.currentPageId || !company.pages.find((p) => p.id === company.currentPageId)) {
			company.currentPageId = company.pages[0].id;
		}

		// Validate pages
		company.pages = company.pages.map((page) => ({
			id: page.id || generateId('page'),
			name: page.name || DEFAULT_PAGE_NAME,
			state: page.state || createEmptyPageState()
		}));

		return company;
	});

	// Filter favorites/recent to known IDs
	const companyIds = new Set(companies.map((c) => c.id));
	favoriteIds = favoriteIds.filter((id) => companyIds.has(id));
	recentIds = recentIds.filter((id) => companyIds.has(id));

	// Ensure current company is valid
	if (!currentCompanyId || !companyIds.has(currentCompanyId)) {
		currentCompanyId = companies[0].id;
	}
}

/**
 * Emit change event for external sync
 */
function emitChange(): void {
	if (typeof changeHandler === 'function') {
		try {
			changeHandler(exportData());
		} catch (err) {
			console.error('[CompaniesStore] Change handler failed:', err);
		}
	}
}

// ============ Company Operations ============

function create(name: string = DEFAULT_COMPANY_NAME): Company {
	const company = buildDefaultCompany(name);
	companies = [...companies, company];
	currentCompanyId = company.id;
	trackRecentAccess(company.id);
	save();
	return company;
}

function rename(id: string, newName: string): boolean {
	const company = companies.find((c) => c.id === id);
	if (!company) return false;

	company.name = newName;
	company.updatedAt = Date.now();
	companies = [...companies]; // Trigger reactivity
	save();
	return true;
}

function remove(id: string): string | null {
	const index = companies.findIndex((c) => c.id === id);
	if (index === -1) return null;

	companies = companies.filter((c) => c.id !== id);

	// Remove from favorites and recent
	favoriteIds = favoriteIds.filter((fid) => fid !== id);
	recentIds = recentIds.filter((rid) => rid !== id);

	// If deleted current company, switch to another
	if (id === currentCompanyId) {
		if (companies.length > 0) {
			currentCompanyId = companies[0].id;
			trackRecentAccess(currentCompanyId);
		} else {
			// No companies left, create a new one
			const newCompany = create(DEFAULT_COMPANY_NAME);
			return newCompany.id;
		}
	}

	save();
	return currentCompanyId;
}

function duplicate(id: string): Company | null {
	const source = companies.find((c) => c.id === id);
	if (!source) return null;

	const copy = deepCopy(source);
	copy.id = generateId('comp');
	copy.name = `${source.name} (Copy)`;
	copy.createdAt = Date.now();
	copy.updatedAt = Date.now();
	copy.lastAccessed = Date.now();
	copy.isFavorite = false;

	// Regenerate page IDs
	copy.pages = copy.pages.map((page) => ({
		...page,
		id: generateId('page')
	}));
	copy.currentPageId = copy.pages[0].id;

	companies = [...companies, copy];
	save();
	return copy;
}

function switchTo(id: string): boolean {
	const company = companies.find((c) => c.id === id);
	if (!company) {
		console.error('[CompaniesStore] Company not found:', id);
		return false;
	}

	currentCompanyId = id;
	company.lastAccessed = Date.now();
	companies = [...companies]; // Trigger reactivity
	trackRecentAccess(id);
	save();
	return true;
}

function search(query: string): Company[] {
	if (!query || query.trim() === '') {
		return companies;
	}

	const lowerQuery = query.toLowerCase().trim();

	return companies.filter((company) => {
		const name = company.name.toLowerCase();

		// Exact match
		if (name.includes(lowerQuery)) return true;

		// Fuzzy match (allow missing characters)
		let queryIndex = 0;
		for (let i = 0; i < name.length && queryIndex < lowerQuery.length; i++) {
			if (name[i] === lowerQuery[queryIndex]) {
				queryIndex++;
			}
		}
		return queryIndex === lowerQuery.length;
	});
}

// ============ Page Operations ============

function createPage(name?: string): Page | null {
	const company = getCurrentCompany();
	if (!company) return null;

	const pageNum = company.pages.length + 1;
	const page: Page = {
		id: generateId('page'),
		name: name || `P${pageNum}`,
		state: createEmptyPageState()
	};

	company.pages = [...company.pages, page];
	company.updatedAt = Date.now();
	companies = [...companies]; // Trigger reactivity
	save();
	return page;
}

function renamePage(pageId: string, newName: string): boolean {
	const company = getCurrentCompany();
	if (!company) return false;

	const page = company.pages.find((p) => p.id === pageId);
	if (!page) return false;

	page.name = newName.substring(0, 8); // Max 8 chars
	company.updatedAt = Date.now();
	companies = [...companies];
	save();
	return true;
}

function deletePage(pageId: string): string | null {
	const company = getCurrentCompany();
	if (!company || company.pages.length <= 1) {
		console.warn('[CompaniesStore] Cannot delete last page');
		return company?.currentPageId ?? null;
	}

	const index = company.pages.findIndex((p) => p.id === pageId);
	if (index === -1) return company.currentPageId;

	company.pages = company.pages.filter((p) => p.id !== pageId);

	// Determine next page
	let nextPageId: string;
	if (index < company.pages.length) {
		nextPageId = company.pages[index].id;
	} else {
		nextPageId = company.pages[index - 1].id;
	}

	company.currentPageId = nextPageId;
	company.updatedAt = Date.now();
	companies = [...companies];
	save();
	return nextPageId;
}

function copyPage(pageId: string, newName?: string): Page | null {
	const company = getCurrentCompany();
	if (!company) return null;

	const sourcePage = company.pages.find((p) => p.id === pageId);
	if (!sourcePage) return null;

	const pageNum = company.pages.length + 1;
	const page: Page = {
		id: generateId('page'),
		name: newName || `P${pageNum}`,
		state: deepCopy(sourcePage.state)
	};

	company.pages = [...company.pages, page];
	company.updatedAt = Date.now();
	companies = [...companies];
	save();
	return page;
}

function switchToPage(pageId: string): boolean {
	const company = getCurrentCompany();
	if (!company) return false;

	const page = company.pages.find((p) => p.id === pageId);
	if (!page) {
		console.error('[CompaniesStore] Page not found:', pageId);
		return false;
	}

	company.currentPageId = pageId;
	companies = [...companies];
	save();
	return true;
}

function resetPages(): void {
	const company = getCurrentCompany();
	if (!company) return;

	const defaultPage: Page = {
		id: generateId('page'),
		name: DEFAULT_PAGE_NAME,
		state: createEmptyPageState()
	};

	company.pages = [defaultPage];
	company.currentPageId = defaultPage.id;
	company.updatedAt = Date.now();
	companies = [...companies];
	save();
}

// ============ State Operations ============

function savePageState(pageId: string, state: PageState): void {
	const company = getCurrentCompany();
	if (!company) return;

	const page = company.pages.find((p) => p.id === pageId);
	if (page) {
		// Store deep copy to prevent mutations
		page.state = deepCopy(state);
		company.updatedAt = Date.now();
		companies = [...companies];
		save();
	}
}

// ============ Favorites ============

function toggleFavorite(id: string): void {
	const index = favoriteIds.indexOf(id);
	if (index > -1) {
		favoriteIds = favoriteIds.filter((fid) => fid !== id);
	} else {
		// Limit to 10 favorites
		if (favoriteIds.length >= 10) {
			favoriteIds = favoriteIds.slice(1);
		}
		favoriteIds = [...favoriteIds, id];
	}
	save();
}

// ============ Persistence ============

function load(): void {
	if (typeof window === 'undefined') return;

	try {
		const currentId = localStorage.getItem(CURRENT_COMPANY_KEY);
		const companiesRaw = localStorage.getItem(COMPANIES_STORAGE_KEY);
		const favoritesRaw = localStorage.getItem(FAVORITES_STORAGE_KEY);
		const recentRaw = localStorage.getItem(RECENT_STORAGE_KEY);

		if (companiesRaw) {
			// Load new structure
			companies = JSON.parse(companiesRaw);
			currentCompanyId =
				currentId && companies.find((c) => c.id === currentId)
					? currentId
					: companies[0]?.id || null;

			if (favoritesRaw) {
				favoriteIds = JSON.parse(favoritesRaw);
			}
			if (recentRaw) {
				recentIds = JSON.parse(recentRaw);
			}

			// Migrate package state format in all pages (handles old format)
			for (const company of companies) {
				if (!Array.isArray(company.pages)) continue;
				for (const page of company.pages) {
					if (page.state?.packages) {
						const migratedPackages = migratePackageState(page.state.packages);
						if (JSON.stringify(migratedPackages) !== JSON.stringify(page.state.packages)) {
							page.state.packages = migratedPackages;
						}
					}
				}
			}
		} else {
			// MIGRATION: Check for old structure
			const oldPages = localStorage.getItem(OLD_PAGES_KEY);

			if (oldPages) {
				// Migrate old "working pages" to a company
				const oldData = JSON.parse(oldPages);
				const newCompany: Company = {
					id: generateId('comp'),
					name: DEFAULT_COMPANY_NAME,
					pages: oldData.pages || [],
					currentPageId: oldData.currentPageId || oldData.pages?.[0]?.id || null,
					createdAt: Date.now(),
					updatedAt: Date.now(),
					lastAccessed: Date.now(),
					isFavorite: false
				};
				companies = [newCompany];
				currentCompanyId = newCompany.id;
			} else {
				// Check for very old single-state structure
				const oldState = localStorage.getItem(OLD_STATE_KEY);
				if (oldState) {
					const pageId = generateId('page');
					const newCompany: Company = {
						id: generateId('comp'),
						name: DEFAULT_COMPANY_NAME,
						pages: [
							{
								id: pageId,
								name: DEFAULT_PAGE_NAME,
								state: JSON.parse(oldState)
							}
						],
						currentPageId: pageId,
						createdAt: Date.now(),
						updatedAt: Date.now(),
						lastAccessed: Date.now(),
						isFavorite: false
					};
					companies = [newCompany];
					currentCompanyId = newCompany.id;
				}
			}

			// Clean up old keys after migration
			localStorage.removeItem(OLD_PAGES_KEY);
		}

		ensureIntegrity();
		save();
	} catch (err) {
		console.error('[CompaniesStore] Failed to load:', err);
		// Fallback: Create empty company
		companies = [buildDefaultCompany(DEFAULT_COMPANY_NAME)];
		currentCompanyId = companies[0].id;
		save();
	}
}

function save(): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(CURRENT_COMPANY_KEY, currentCompanyId || '');
		localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companies));
		localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
		localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentIds));
		emitChange();
	} catch (err) {
		console.error('[CompaniesStore] Failed to save:', err);

		// Handle quota errors
		if (
			err instanceof Error &&
			(err.name === 'QuotaExceededError' || (err as { code?: number }).code === 22)
		) {
			alert(
				'WARNING: Storage quota exceeded!\n\n' +
					'Your changes could not be saved due to limited browser storage.\n\n' +
					'To fix this:\n' +
					'1. Delete some companies or pages\n' +
					'2. Export your data first\n' +
					'3. Clear browser cache for this site'
			);
		}
	}
}

function exportData() {
	return {
		schemaVersion: 1,
		currentCompanyId,
		companies: deepCopy(companies),
		favoriteCompanyIds: [...favoriteIds],
		recentCompanyIds: [...recentIds],
		updatedAt: Date.now()
	};
}

function importData(data: unknown): boolean {
	if (!data || typeof data !== 'object') {
		console.warn('[CompaniesStore] Import skipped: invalid data');
		return false;
	}

	const payload = data as {
		companies?: Company[];
		currentCompanyId?: string;
		favoriteCompanyIds?: string[];
		recentCompanyIds?: string[];
	};

	if (!Array.isArray(payload.companies) || payload.companies.length === 0) {
		console.warn('[CompaniesStore] Import skipped: missing companies');
		return false;
	}

	// Deep copy and migrate package state format in all pages
	const importedCompanies = deepCopy(payload.companies);
	for (const company of importedCompanies) {
		if (!Array.isArray(company.pages)) continue;
		for (const page of company.pages) {
			if (page.state?.packages) {
				// Migrate old package format to new format
				page.state.packages = migratePackageState(page.state.packages);
			}
		}
	}

	companies = importedCompanies;
	currentCompanyId = payload.currentCompanyId || null;
	favoriteIds = Array.isArray(payload.favoriteCompanyIds) ? [...payload.favoriteCompanyIds] : [];
	recentIds = Array.isArray(payload.recentCompanyIds) ? [...payload.recentCompanyIds] : [];

	ensureIntegrity();
	save();
	return true;
}

function setChangeHandler(handler: ((data: ReturnType<typeof exportData>) => void) | null): void {
	changeHandler = handler;
}

// ============ Export Store ============

export const companiesStore = {
	// Getters (reactive)
	get all() {
		return companies;
	},
	get current() {
		return getCurrentCompany();
	},
	get currentPage() {
		return getCurrentPage();
	},
	get currentPageState(): PageState {
		const page = getCurrentPage();
		return page?.state ? deepCopy(page.state) : createEmptyPageState();
	},
	get favorites() {
		return favoriteIds
			.map((id) => companies.find((c) => c.id === id))
			.filter((c): c is Company => c !== undefined);
	},
	get recent() {
		return recentIds
			.slice(0, 10)
			.map((id) => companies.find((c) => c.id === id))
			.filter((c): c is Company => c !== undefined);
	},

	// Company operations
	create,
	rename,
	delete: remove,
	duplicate,
	switchTo,
	search,

	// Page operations
	createPage,
	renamePage,
	deletePage,
	copyPage,
	switchToPage,
	resetPages,

	// State operations
	savePageState,

	// Favorites
	toggleFavorite,

	// Persistence
	load,
	save,
	exportData,
	importData,
	setChangeHandler
};
