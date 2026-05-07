/**
 * Core type definitions for the CheatSheet app
 * These maintain compatibility with the original vanilla JS app
 */

// Company and Page System
export interface Company {
	id: string;
	name: string;
	pages: Page[];
	currentPageId: string;
	isFavorite: boolean;
	createdAt: number;
	updatedAt: number;
	lastAccessed: number;
	/** Imported license data from PDFs (append-only, never overwrite) */
	licenses?: LicenseInfo[];
	/** Imported SolidWorks licenses, upserted by serialNumber */
	solidworksLicenses?: SolidWorksLicenseInfo[];
	/** Which workspace view is active for this company */
	currentView?: 'page' | 'sw';
	/** User-set label for the SW tab; empty/undefined = auto-compute from products */
	swTabLabelOverride?: string;
}

export interface Page {
	id: string;
	name: string;
	licenseKey?: string;
	state: PageState;
}

export interface PageState {
	panels: Record<string, PanelState>;
	packages: Record<string, PackageState>;
}

export interface PageSystemData {
	schemaVersion: number;
	currentCompanyId: string | null;
	companies: Company[];
	favoriteCompanyIds: string[];
	recentCompanyIds: string[];
	updatedAt: number;
}

// Panel System
export interface Panel {
	id: string;
	title: string;
	editable: boolean;
	items: string[];
}

export interface PanelState {
	items: string[];
	removedItems?: string[];
	itemsOrder?: string[];
}

// Package System
export interface Package {
	code: string;
	maintenance: string;
	description: string;
	groups?: PackageGroup[];
	looseBits?: string[];
}

export interface PackageGroup {
	label: string;
	masterId: string;
	bits: string[];
}

export interface PackageState {
	selectedBits: string[];
	customBits: string[];
	order: string[];
	looseBitsOrder?: string[];
	/** Maps bit name to masterId (or 'loose' for loose bits). Overrides static group membership. */
	groupMembership?: Record<string, string>;
	/** Schema version. Missing = pre-versioned legacy state; new states stamped with PACKAGE_STATE_VERSION. */
	version?: number;
}

/** Current PackageState schema version. Bump when introducing migrations. */
export const PACKAGE_STATE_VERSION = 1;

export interface UserPrefsData {
	customPanelItems: Record<string, string[]>;
	customPackageBits: Record<string, string[]>;
	packageBitOrders: Record<string, string[]>;
	packageLooseBitOrders: Record<string, string[]>;
	packageGroupMembership: Record<string, Record<string, string>>;
}

// Cloud Sync
export interface CloudUserData {
	username: string;
	normalizedUsername: string;
	schemaVersion: number;
	updatedAt: Date;
	pageSystem?: PageSystemData | null;
	pageSystemUpdatedAt?: number;
	userPrefs?: UserPrefsData | null;
	userPrefsUpdatedAt?: number;
	client: string;
}

export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';

// Extended sync session state (superset of SyncStatus with richer offline/reconnection states)
export type SyncSessionState =
	| 'disconnected'
	| 'connecting'
	| 'connected'
	| 'syncing'
	| 'reconnecting'
	| 'local_only'
	| 'degraded'
	| 'error';

// Boot phase for startup coordination
export type BootPhase = 'idle' | 'prefs' | 'companies' | 'sync' | 'ready' | 'error';

// Calculator
export interface CalculatorState {
	displayValue: string;
	firstOperand: number | null;
	waitingForSecondOperand: boolean;
	operator: string | null;
	error: boolean;
	justEvaluated: boolean;
}

// Toast Notifications
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
}

// License Import Types
export type LicenseType = 'dongle' | 'product-key';
export type DongleType = 'MINI-USB' | 'MINI-NETUSB' | 'Software' | string;

export interface LicenseInfo {
	// Identification
	customer: string; // From "Customer" or "Profile Name"
	dongleNo: string; // Dongle number or product key ID
	serialNo: string;
	productKey?: string; // UUID for software licenses

	// License details
	licenseType: LicenseType; // 'dongle' or 'product-key'
	dongleType: DongleType; // 'MINI-USB', 'Software', etc.
	displayType: string; // Human-readable: 'Hardware Dongle', 'Product Key (Network)', etc.
	isNetworkLicense: boolean; // Net Dongle checkbox
	isProfile: boolean; // True if Profile format (has Profile No.)
	profileNo?: string; // Profile identifier from Profile-XXXX pattern (e.g., "7479")
	profileUsers?: number; // Number of users on this profile (from "Profile Users" field)
	actualUsers?: number; // Number of users on the license itself (from "Actual Users" field)
	sim5xLevel?: string; // Sim 5x Level value: "3 Axis", "3/4 Axis", or blank

	// Maintenance
	maintenanceType: string; // 'SC', 'SC+SW', etc.
	maintenanceStart: string;
	maintenanceEnd: string;
	solidcamVersion: string;

	// Extracted features (raw from PDF)
	features: string[];
	// Features explicitly marked as Not Checked in Salesforce text
	notCheckedFeatures?: string[];

	// Import metadata
	importedAt: number; // Timestamp of import
	sourceFileName: string; // Original PDF filename
}

export interface ImportResult {
	success: boolean;
	companyId?: string;
	companyName: string;
	isNewCompany: boolean;
	featuresImported: number;
	featuresSkipped: number; // Features not in our packages
	skusImported: number; // Maintenance SKUs added to panel
	importedSkuList?: string[]; // List of SKU codes that were added
	errors?: string[];
	/** True for SolidWorks imports, lets the modal/results screen branch UI */
	isSolidWorks?: boolean;
}

// SolidWorks Licenses
export type SolidWorksProduct = 'Standard' | 'Parts & Assemblies' | 'Parts' | 'Pro' | 'Other';

export interface SolidWorksLicenseInfo {
	/** Primary key for upsert — same serial replaces in place */
	serialNumber: string;
	/** Account name from SF "Account" field — used as company name */
	account: string;
	/** SolidWorks Customer ID (numeric) */
	customerId: string;
	/** Normalized product category */
	product: SolidWorksProduct;
	/** Raw "Product" field text, e.g. "SOLIDWORKS OEM Standard" */
	productRaw: string;
	subscriptionStart: string;
	subscriptionEnd: string;
	subscriptionTermination: string;
	terminationOfSupport: boolean;
	originalOrderType: string;
	isNetworkLicense: boolean;
	users: number;
	isTermLicense: boolean;
	poNumber: string;
	importedAt: number;
	sourceFileName: string;
}
