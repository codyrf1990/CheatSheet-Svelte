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
}

export interface Page {
	id: string;
	name: string;
	state: PageState;
}

export interface PageState {
	panels: Record<string, PanelState>;
	packages: Record<string, PackageState>;
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
}

// Cloud Sync
export interface CloudUserData {
	username: string;
	normalizedUsername: string;
	schemaVersion: number;
	updatedAt: Date;
	pageSystem: {
		companies: Company[];
		currentCompanyId: string | null;
	};
	client: string;
}

export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';

// Header Links
export interface HeaderLink {
	label: string;
	url: string;
	icon?: string;
}

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
