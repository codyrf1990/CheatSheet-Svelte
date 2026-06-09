/**
 * Runtime validation for data loaded from localStorage.
 * Persisted data can be corrupted or come from an older app version, so every
 * field carries a .catch() fallback — one bad field never discards the rest.
 */

import { z } from 'zod';

const stringArrayRecord = z.record(z.string(), z.array(z.string())).catch({});

export const UserPrefsSchema = z.object({
	customPanelItems: stringArrayRecord,
	customPackageBits: stringArrayRecord,
	backgroundVideoPaused: z.boolean().catch(false),
	repName: z.string().catch(''),
	skuTabMode: z.enum(['bdm', 'ms']).catch('bdm'),
	updatedAt: z
		.number()
		.finite()
		.catch(() => Date.now()),
	packageBitOrders: stringArrayRecord,
	packageLooseBitOrders: stringArrayRecord,
	packageGroupMembership: z.record(z.string(), z.record(z.string(), z.string())).catch({})
});

/**
 * Structural essentials only, and loose: licenses, SolidWorks data and package
 * states are richer than this and have their own migration path
 * (migratePackageState) — stripping unknown fields here would destroy them.
 */
const PageSchema = z.looseObject({
	id: z.string(),
	name: z.string()
});

export const CompanySchema = z.looseObject({
	id: z.string(),
	name: z.string(),
	pages: z.array(PageSchema),
	currentPageId: z.string().catch(''),
	createdAt: z.number().catch(() => Date.now()),
	updatedAt: z.number().catch(() => Date.now()),
	lastAccessed: z.number().catch(() => Date.now()),
	isFavorite: z.boolean().catch(false)
});

export const StringArraySchema = z.array(z.string()).catch([]);
