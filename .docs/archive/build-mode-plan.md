# Implementation Plan — Build Mode, SKU Panel, Quality Sweep

## Context

The tool was partially built by a previous agent. It works for license import but has no build-mode gating, no new-sale SKU panel, and several quality issues. This plan implements the remaining features from the source-of-truth-matrix and fixes the codebase to production quality.

**Source of Truth:** `.docs/source-of-truth-matrix.md` — final business-rules doc for build gating, prerequisites, and SKU reference.
**Plan Status:** Live running plan — updated as decisions are made.

---

## Scope

1. **Code quality fixes** — critical/high bugs found in audit (do first, clean foundation)
2. **Data layer** — prerequisites, SKU lookup, bit descriptions
3. **Build mode** — auto-detected per page, badge toggle as escape hatch
4. **Package-level toggles** — one-click select per package
5. **Prerequisite gating** — disabled states + tooltips in build mode
6. **SKU panel refactor** — new-sale vs maintenance toggle; package-level SKUs + prices
7. **"What's left to sell"** — button on import/existing pages, descriptions per item

---

## Phase 1 — Code Quality Fixes

**Status: COMPLETE** (commit `827fd47`)

All critical and high fixes applied. Build `pnpm check` and `pnpm lint` pass clean. `pnpm build` Vite compilation succeeds; Vercel adapter symlink fails due to Windows permissions (not a code issue).

Fix before building anything new. These are foundation issues.

### Critical

| File                                           | Issue                                                          | Fix                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/lib/stores/toast.svelte.ts`               | Module-level `document.addEventListener` runs during SSR       | Wrap in `if (browser)` guard (import `browser` from `$app/environment`) |
| `src/lib/stores/companies.svelte.ts`           | `alert()` on quota exceeded                                    | Replace with `toastStore.error()`                                       |
| `src/lib/stores/toast.svelte.ts`               | Visibility handler re-registers listener on every toast change | Move listener setup out of reactive path; use `untrack()`               |
| `src/lib/components/layout/LoginScreen.svelte` | Uncaught promise rejection leaves UI in loading state          | Wrap `syncStore.connect()` in proper try/catch/finally                  |

### High

| File                                           | Issue                                                                      | Fix                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------- |
| `src/lib/stores/sync.svelte.ts`                | `stopAutoSync()` not called before `resetSyncablePrefs()` on user switch   | Reorder: stop sync → reset prefs → start sync       |
| `src/routes/+page.svelte`                      | `panels.find(...)!` non-null assertion without guard                       | Add null check or assertion with fallback           |
| `src/lib/components/layout/LoginScreen.svelte` | `online`/`offline` listeners may leak on unmount                           | Return cleanup from `$effect`                       |
| `src/routes/+page.svelte`                      | Debounce race: `pendingSavePageId` can be overwritten before timeout fires | Capture page ID in closure at timeout creation time |

---

## Phase 2 — Data Layer

**Status: COMPLETE** (commit `42f98d3`)

### 2a. `src/lib/data/prerequisites.ts` (new file)

```typescript
// Which packages require SC-Mill to be present
export const REQUIRES_SC_MILL = new Set(['SC-Mill-Adv', 'SC-Mill-3D', 'SC-Mill-5Axis']);

// Which specific bits require iMach2D (HSM does NOT — only SC-Mill needed)
export const REQUIRES_IMACH2D = new Set(['iMach3D']);

// SC-Turn bits that are always locked together — cannot be split
export const SC_TURN_LOCKED = ['SolidCAM Turning', 'Backspindle'];

// Milling-specific additional modules — require SC-Mill (they are milling operations)
export const REQUIRES_SC_MILL_MODULES = new Set(['SC-EdgeTrim', 'SC-Multiblade', 'SC-Port']);

// Standalone additional modules — no base package required
export const STANDALONE_MODULE_SKUS = new Set([
	'SC-Probe',
	'SC-Probe1',
	'SC-Vericut',
	'iMachNX-Mod',
	'WC2-Mod',
	'SC-Wire',
	'SolidShop-Editor',
	'SC-4Op',
	'SC-4Op-Sim'
]);

// 25M group is all-or-nothing in build mode
export const SC_MILL_25M_MASTER_ID = 'sc-mill-25m';

// Package toggle definitions: what selecting each package toggle picks
export const PACKAGE_TOGGLE_BITS: Record<string, { groups?: string[]; looseBits?: string[] }> = {
	'SC-Mill': { groups: ['sc-mill-25m'], looseBits: ['HSS'] },
	'SC-Turn': { looseBits: ['SolidCAM Turning', 'Backspindle'] },
	'SC-Mill-Adv': { looseBits: ['iMach2D', 'Machine Simulation', 'Edge Breaking'] },
	'SC-Mill-3D': { looseBits: ['HSM', 'iMach3D'] },
	'SC-Mill-5Axis': { groups: ['sc-mill-5axis-sim5x'], looseBits: ['Sim4x', 'Multiaxis Roughing'] }
};
```

### 2b. `src/lib/data/skuData.ts` (new file)

Maps selected groups/bits → new-sale SKU code + list price + maint SKU.

```typescript
export interface SkuEntry {
	sku: string;
	label: string;
	price: number;
	maintSku: string;
	maintPrice: number;
}

// Keyed by packageCode::groupOrBit identifier
export const SKU_LOOKUP: Record<string, SkuEntry> = {
	'SC-Mill::sc-mill-25m': {
		sku: 'SC-25M',
		label: 'SC-Mill (25M + AFRM)',
		price: 3868,
		maintSku: '25M-Maint',
		maintPrice: 648
	},
	'SC-Mill::HSS': {
		sku: 'SC-HSS',
		label: 'High Speed Surfacing',
		price: 1380,
		maintSku: 'HSS-Maint',
		maintPrice: 180
	},
	'SC-Turn::SolidCAM Turning': {
		sku: 'SC-Turn',
		label: 'SC-Turn',
		price: 2300,
		maintSku: 'Turn-Maint',
		maintPrice: 300
	},
	'SC-Mill-Adv::PACKAGE': {
		sku: 'SC-Mill-Adv',
		label: 'SC-Mill-Adv (package)',
		price: 3412,
		maintSku: 'SC-Mill-Adv-Maint',
		maintPrice: 828
	},
	'SC-Mill-Adv::iMach2D': {
		sku: 'SC-iMach2D',
		label: 'iMachining 2D',
		price: 3588,
		maintSku: 'iMach2D-Maint',
		maintPrice: 468
	},
	'SC-Mill-Adv::Machine Simulation': {
		sku: 'SC-MachSim',
		label: 'Machine Simulation',
		price: 1380,
		maintSku: 'MachSim-Maint',
		maintPrice: 180
	},
	'SC-Mill-Adv::Edge Breaking': {
		sku: 'SC-EdgeBreak',
		label: 'Edge Breaking',
		price: 1380,
		maintSku: 'EdgeBreak-Maint',
		maintPrice: 180
	},
	'SC-Mill-3D::PACKAGE': {
		sku: 'SC-Mill-3D',
		label: 'SC-Mill-3D (package)',
		price: 6820,
		maintSku: 'SC-Mill-3D-Maint',
		maintPrice: 1020
	},
	'SC-Mill-3D::HSM': {
		sku: 'SC-HSM',
		label: 'High Speed Machining',
		price: 5060,
		maintSku: 'HSM-Maint',
		maintPrice: 660
	},
	'SC-Mill-3D::iMach3D': {
		sku: 'SC-iMach3D',
		label: 'iMachining 3D',
		price: 2760,
		maintSku: 'iMach3D-Maint',
		maintPrice: 360
	},
	'SC-Mill-5Axis::PACKAGE': {
		sku: 'SC-Mill-5Axis',
		label: 'SC-Mill-5Axis (package)',
		price: 5520,
		maintSku: 'SC-Mill-5Axis-Maint',
		maintPrice: 720
	},
	'SC-Mill-5Axis::Sim4x': {
		sku: 'SC-Sim4x',
		label: 'Simultaneous 4 Axis',
		price: 920,
		maintSku: 'Sim4x-Maint',
		maintPrice: 120
	},
	'SC-Mill-5Axis::sc-mill-5axis-sim5x': {
		sku: 'SC-Sim5x',
		label: 'Simultaneous 5 Axis',
		price: 3680,
		maintSku: 'Sim5x-Maint',
		maintPrice: 480
	},
	'SC-Mill-5Axis::Multiaxis Roughing': {
		sku: 'SC-Multiaxis',
		label: 'Multiaxis Roughing',
		price: 920,
		maintSku: 'Multiaxis-Maint',
		maintPrice: 120
	}
};

// Additional modules (no package prerequisite) — shown when selected in panels
export const MODULE_SKUS: SkuEntry[] = [
	{
		sku: 'SC-EdgeTrim',
		label: 'Edge Trimming',
		price: 1380,
		maintSku: 'EdgeTrim-Maint',
		maintPrice: 180
	},
	{
		sku: 'SC-Multiblade',
		label: 'Multiblade',
		price: 8740,
		maintSku: 'Multiblade-Maint',
		maintPrice: 1140
	},
	{ sku: 'SC-Port', label: 'Port Machining', price: 3588, maintSku: 'Port-Maint', maintPrice: 468 },
	{
		sku: 'SC-Probe',
		label: 'Solid Probe (Home+Measure)',
		price: 3450,
		maintSku: 'Probe-Maint',
		maintPrice: 450
	},
	{
		sku: 'SC-Probe1',
		label: 'Solid Probe (Home Only)',
		price: 1150,
		maintSku: 'Probe-Maint',
		maintPrice: 150
	},
	{
		sku: 'SC-Vericut',
		label: 'Vericut Integration',
		price: 1150,
		maintSku: 'Vericut-Maint',
		maintPrice: 150
	},
	{
		sku: 'iMachNX-Mod',
		label: 'iMachining NX',
		price: 7268,
		maintSku: 'iMachNX-Maint',
		maintPrice: 948
	},
	{
		sku: 'WC2-Mod',
		label: 'Wire EDM — 2 Axis',
		price: 2668,
		maintSku: 'WC2-Maint',
		maintPrice: 348
	},
	{
		sku: 'SC-Wire',
		label: 'Wire EDM — 4 Axis',
		price: 3450,
		maintSku: 'Wire-Maint',
		maintPrice: 450
	},
	{
		sku: 'SolidShop-Editor',
		label: 'CIMCO Editor',
		price: 500,
		maintSku: 'SolidShop-Editor-Maint',
		maintPrice: 75
	},
	{
		sku: 'SC-4Op',
		label: 'SC for Operators',
		price: 2500,
		maintSku: 'SC-4Op-Maint',
		maintPrice: 375
	},
	{
		sku: 'SC-4Op-Sim',
		label: 'SC for Operators (Sim)',
		price: 1000,
		maintSku: 'SC-4Op-Sim-Maint',
		maintPrice: 150
	}
];
```

### 2c. `src/lib/data/bitDescriptions.ts` (new file)

Short descriptions for "What's Left to Sell" view. One sentence max. **Include prerequisite at the end of each description where applicable.**

```typescript
export const BIT_DESCRIPTIONS: Record<string, string> = {
	// SC-Mill
	HSS: 'High-speed surfacing for complex 3D shapes — essential for mould & die work.',
	// SC-Mill-Adv
	iMach2D:
		'iMachining 2D — adaptive roughing that cuts cycle times dramatically. Requires SC-Mill.',
	'Machine Simulation':
		'Simulates the full machine to catch collisions before they happen. Requires SC-Mill.',
	'Edge Breaking':
		'Automated chamfering on part edges directly from the CAD model. Requires SC-Mill.',
	// SC-Mill-3D
	HSM: 'High Speed Machining — rest material, steep/shallow, and finishing strategies. Requires SC-Mill.',
	iMach3D: 'iMachining 3D — adaptive 3D roughing on top of HSM. Requires SC-Mill and iMach2D.',
	// SC-Mill-5Axis
	Sim4x: 'Simultaneous 4-axis — rotary and 4th-axis contouring. Requires SC-Mill.',
	// SC-Turn
	'SC-Turn':
		'Turning module — profile turning, grooving, threading, backspindle. Includes Mill-Turn when combined with SC-Mill.',
	// Package-level (when whole package is absent)
	'SC-Mill-Adv':
		'Advanced milling add-on — iMachining 2D, Machine Simulation, Edge Breaking. Requires SC-Mill.',
	'SC-Mill-3D':
		'3D iMachining package — High Speed Machining + iMachining 3D. Requires SC-Mill and iMach2D.',
	'SC-Mill-5Axis':
		'5-axis simultaneous machining — swarf, contour, convert 5-axis, and more. Requires SC-Mill.',
	// Additional modules — milling-specific (require SC-Mill)
	'SC-EdgeTrim':
		'Automated edge trimming — removes witness lines and sharp edges post-machining. Requires SC-Mill.',
	'SC-Multiblade': 'Dedicated multi-blade machining for impellers and blisks. Requires SC-Mill.',
	'SC-Port':
		'Port machining for engine heads and similar complex internal surfaces. Requires SC-Mill.',
	// Additional modules — standalone (no prerequisite)
	'SC-Probe': 'On-machine probing for setup, datum setting, and in-process measurement.',
	'SC-Vericut': 'Sends the NC program to Vericut for full machine simulation and verification.',
	'iMachNX-Mod': 'iMachining technology available directly inside NX.',
	'WC2-Mod': '2-axis wire EDM — contouring, taper cutting, and profiles.',
	'SC-Wire': '4-axis wire EDM — adds upper/lower independent contour cutting.',
	'SolidShop-Editor': 'CIMCO Editor for NC code editing, backplotting, and DNC communication.',
	'SC-4Op': 'Operator-facing interface for running and managing SolidCAM jobs on the shop floor.'
};
```

### 2d. Update `src/lib/types/index.ts`

Add `mode` to `PageState`:

```typescript
export interface PageState {
	mode?: 'build' | 'import'; // undefined = legacy pages, treated as import
	panels: Record<string, PanelState>;
	packages: Record<string, PackageState>;
}
```

---

## Phase 3 — Build Mode

**Status: COMPLETE** (commit `bc5489f`)

### Auto-detection

- `companiesStore.create()` → sets new page `mode: 'build'` (default for all new pages)
- `licenseImport.ts` `importLicense()` → auto-switches page to `mode: 'import'` after successful import
- Legacy pages (no mode field) → treated as `'import'`

### Mode badge in `PackageTable.svelte`

- Small pill in the table header: `BUILD` (gold) or `IMPORT` (muted)
- **Always visible**, always clickable — serves as both indicator and manual toggle
- Smart auto-detect sets the initial mode; clicking overrides it
- Calls `companiesStore.savePageState()` with updated mode

### Build mode enforcement

- **Hard-block** invalid selections — disabled checkbox + clear toast explaining why
- Example toast: "iMach3D requires iMach2D — select iMach2D first"
- Import mode has no enforcement (import maps whatever is in the license)

### Store: expose current mode

`packages.svelte.ts` exposes:

```typescript
get buildMode(): boolean  // reads from companiesStore.currentPageState.mode === 'build'
```

---

## Phase 4 — Package-Level Toggles

**Status: COMPLETE** (commit `75d3c80`)

### In `PackageRow.svelte`

Add a package master toggle button to each row header. Behavior per package:

| Package       | Toggle selects                  | Can split after?                                         | Display                                                                                                                       |
| ------------- | ------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| SC-Mill       | 25M group (all bits) + HSS      | Yes — 25M and HSS can be toggled separately              | Master checkbox "2.5D Milling + AFRM" with 13 sub-items listed underneath (read-only bullets, matching pricing matrix naming) |
| SC-Turn       | SolidCAM Turning + Backspindle  | No — always together, cannot be split                    | Single combined entry "SC-Turn Module" — no separate checkboxes for Turning/Backspindle                                       |
| SC-Mill-Adv   | iMach2D + MachSim + EdgeBreak   | Yes — each bit individually still needs SC-Mill          | Individual toggles                                                                                                            |
| SC-Mill-3D    | HSM + iMach3D                   | Yes — HSM needs SC-Mill only; iMach3D also needs iMach2D | Individual toggles                                                                                                            |
| SC-Mill-5Axis | SIM5X group + Sim4x + Multiaxis | Yes                                                      | Group toggle + individual loose bits                                                                                          |

Toggle state: checked if all package bits selected, indeterminate if partial, unchecked if none.

**Mill Turn toast:** When both SC-Mill and SC-Turn are selected, fire a toast notification: "Note: Mill-Turn capability is automatically included with this combination." No extra bit, no extra charge, just context for the rep.

Uses `PACKAGE_TOGGLE_BITS` from `prerequisites.ts` to know what to select.

---

## Phase 5 — Prerequisite Gating (Build Mode Only)

**Status: COMPLETE** (commit `bf0119b`)

### `src/lib/services/buildValidation.ts` (new file)

```typescript
export function getDisabledBits(
	packageStates: Record<string, PackageState>,
	buildMode: boolean
): Map<string, string>; // bit → reason string

export function hasSCMill(packageStates: Record<string, PackageState>): boolean;
export function hasIMach2D(packageStates: Record<string, PackageState>): boolean;
```

Rules:

- `!hasSCMill` → disable all SC-Mill-Adv, SC-Mill-3D, SC-Mill-5Axis bits. Reason: "Requires SC-Mill"
- `!hasSCMill` → disable milling-specific additional modules (EdgeTrim, Multiblade, Port). Reason: "Requires SC-Mill"
- `!hasIMach2D` → disable iMach3D. Reason: "Requires iMach2D (SC-Mill-Adv)"
- SC-Turn bits: if one is selected, the other cannot be deselected. Reason: "Always sold together"
- In import mode: `getDisabledBits` returns empty map (no enforcement)

### Component updates

`LooseBit.svelte`, `SubBit.svelte`, `MasterBit.svelte`:

- Accept `disabled?: boolean` and `disabledReason?: string` props
- When disabled: reduced opacity, `cursor: not-allowed`, checkbox disabled
- **Hover tooltip** that explains exactly why it's disabled (e.g., "Requires SC-Mill")
- **On click while disabled:** fire a toast with the reason so the rep knows what to do next

`PackageRow.svelte` computes disabled map and passes down per-bit.

### Bit name click behavior (global fix)

**Current issue**: Clicking a bit label toggles the checkbox AND copies — both fire because the name span is inside the HTML `<label>`. Reps accidentally add/remove bits when just trying to copy text.
**Fix**: In `SubBit.svelte` and `LooseBit.svelte`, separate the click-to-copy span from the checkbox label so they are independent elements. Click name = copy only. Click checkbox = toggle only. Apply same fix to `PanelItem.svelte`.

---

## Phase 6 — SKU Panel Refactor

**Status: COMPLETE** (commit `15e1db4`)

### New component: `src/lib/components/panels/NewSalePanel.svelte`

- Derives a list of `SkuEntry[]` from current `packagesStore` selection state
- Logic: iterate selected groups and loose bits, look up in `SKU_LOOKUP`
- Package vs individual: if all bits in a package are selected → show package SKU; if partial → show individual bit SKUs
- Each row: `[SKU code — copyable]  $X,XXX`
- Clicking SKU code copies to clipboard (toast: "Copied SC-25M")
- Total at bottom: sum of list prices
- Individual bit names from packages do NOT appear here — package-level SKUs only

### Updated `MaintenancePanel.svelte`

- Keep existing behavior intact
- NPD-Maint, SolidShop-Sim-Maint, SW-Recap are standard estimate codes — no special labeling

### Sidebar toggle

In the sidebar (`+page.svelte` or a new `SkuSidebar.svelte` wrapper):

- Toggle header: `[ New Sale | Maintenance ]`
- `New Sale` tab → renders `NewSalePanel` (standard sellable codes from pricing matrix)
- `Maintenance` tab → renders existing `MaintenancePanel` (`-Maint` codes from pricing matrix)
- **Remember last selected tab** across sessions (localStorage or userPrefs) — standard UX best practice
- NPD-Maint, SolidShop-Sim-Maint, SW-Recap are **valid estimate codes** (not internal-only) — no special labeling or hiding

---

## Phase 7 — "What's Left to Sell"

**Status: COMPLETE** (commit `4a6a160`)

### Trigger

Button shown when `mode === 'import'` OR when any bits are selected (i.e., not a blank new build). Lives in the package table header area, next to the mode badge.

Label: `What's Left to Sell`

**Focus:** BDM upgrade opportunities — what can be added to an existing customer's setup. Not a new-seat flow.

### Modal: `src/lib/components/ui/WhatLeftModal.svelte`

- Derives list of unselected packages, bits, AND additional modules
- **Grouped by base package** (SC-Mill bits together, SC-Mill-Adv bits together, SC-Turn together, then additional modules)
- SC-Turn shown as **one combined entry** ("SC-Turn Module") — not separate Turning + Backspindle lines
- Each entry shows:
  - Package or bit name
  - SKU code (from `SKU_LOOKUP` / `MODULE_SKUS`)
  - List price
  - One-sentence description from `BIT_DESCRIPTIONS` — **includes prerequisite text** (e.g., "iMachining 3D: Adaptive 3D roughing. Requires SC-Mill and iMach2D.")
- Milling-specific additional modules (EdgeTrim, Multiblade, Port) shown with prerequisite note; standalone modules shown without
- Read-only — no checkboxes, no interaction
- **v1: no search/filter** — keep it simple, add later if list gets unwieldy

---

## Files Changed

| File                                                        | Change                                      |
| ----------------------------------------------------------- | ------------------------------------------- |
| `src/lib/data/prerequisites.ts`                             | **NEW**                                     |
| `src/lib/data/skuData.ts`                                   | **NEW**                                     |
| `src/lib/data/bitDescriptions.ts`                           | **NEW**                                     |
| `src/lib/services/buildValidation.ts`                       | **NEW**                                     |
| `src/lib/components/panels/NewSalePanel.svelte`             | **NEW**                                     |
| `src/lib/components/ui/WhatLeftModal.svelte`                | **NEW**                                     |
| `src/lib/types/index.ts`                                    | Add `mode` to PageState                     |
| `src/lib/stores/toast.svelte.ts`                            | SSR fix, listener fix                       |
| `src/lib/stores/companies.svelte.ts`                        | Remove `alert()`, set mode on create        |
| `src/lib/stores/sync.svelte.ts`                             | Fix user-switch race condition              |
| `src/lib/components/layout/LoginScreen.svelte`              | Async error handling, listener cleanup      |
| `src/routes/+page.svelte`                                   | Mode wiring, debounce fix, null check       |
| `src/lib/components/packages/PackageTable.svelte`           | Mode badge, What's Left button              |
| `src/lib/components/packages/PackageRow.svelte`             | Package toggle, disabled map                |
| `src/lib/components/packages/SubBit.svelte`                 | Separate copy from checkbox, disabled state |
| `src/lib/components/packages/LooseBit.svelte`               | Separate copy from checkbox, disabled state |
| `src/lib/components/packages/MasterBit.svelte`              | Disabled state when prereq missing          |
| `src/lib/components/ui/PanelItem.svelte`                    | Separate copy from checkbox (global fix)    |
| `src/lib/components/panels/MaintenancePanel.svelte`         | Wire sidebar toggle                         |
| `src/lib/components/layout/Sidebar.svelte` / `+page.svelte` | Add New Sale / Maintenance toggle           |

---

## Post-Implementation

After implementation is complete:

1. Update `.docs/session-context-2026-03-01.md` — stale file paths (`.docs/docs/` → now `.docs/`) and polish phases listed as open are all done. Replace "Next Build Work" with what this delivered.

---

## Decisions Log (2026-03-02)

Decisions confirmed during plan review:

| #   | Decision                                                                                              | Source                                                    |
| --- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | SC-Turn always displayed as one combined entry — no split Turning/Backspindle                         | Agent research + owner confirmation                       |
| 2   | Mill Turn: toast notification when SC-Mill + SC-Turn both selected                                    | Agent research + owner confirmation                       |
| 3   | "What's Left to Sell" descriptions include prerequisite text at end of sentence                       | Agent research + owner confirmation                       |
| 4   | Milling-specific additional modules (EdgeTrim, Multiblade, Port) require SC-Mill; rest are standalone | Agent research + pricing matrix sections (see note below) |
| 5   | 25M: master checkbox with sub-items as read-only bullets, naming matches pricing matrix               | Owner confirmation                                        |
| 6   | Separate click-to-copy from checkbox toggle — clicking name copies, clicking box toggles              | Owner confirmation (explicit "do this yes")               |
| 7   | Disabled bits: hover tooltip + toast on click explaining why disabled                                 | Agent research                                            |
| 8   | "What's Left to Sell" grouped by base package                                                         | Owner confirmation                                        |
| 9   | Mode badge: auto-detect + always visible + always clickable (both indicator and toggle)               | Owner confirmation                                        |
| 10  | Default page mode = build for new pages; import auto-switches after successful import                 | Owner confirmation                                        |
| 11  | Build mode hard-blocks invalid selections with clear toast reason                                     | Owner confirmation                                        |
| 12  | NPD-Maint, SolidShop-Sim-Maint, SW-Recap are valid estimate codes (not internal-only)                 | Owner confirmation                                        |
| 13  | Remember last selected sidebar tab across sessions                                                    | Owner confirmation                                        |
| 14  | "What's Left to Sell" v1: no search/filter, keep simple                                               | Owner confirmation                                        |
| 15  | Quality gate: no ship until `pnpm check`, `pnpm lint`, `pnpm build` pass clean                        | Owner confirmation                                        |

**Note on Decision #4 (Additional Module prerequisites):** The pricing matrix workbook groups Edge Trimming, Multiblade, and Port under "MILLING MODULES" — they're milling operations that need a milling seat. Wire EDM, CIMCO, iMachNX, SC-4Op are in separate sections (WIRE EDM, SOLIDSHOP, ADD-ON) and are genuinely standalone. Probe and Vericut are ADD-ON MODULES — kept standalone for now but could be gated behind "any SolidCAM seat" in a future pass.

---

## Verification

### Quality gate (must pass before shipping)

```bash
pnpm check    # No type errors
pnpm lint     # No lint errors
pnpm build    # Clean build
```

**Manual checks:**

- [ ] Create new company → package table shows BUILD badge, SC-Mill-Adv bits are greyed out until SC-Mill is selected
- [ ] Import a license → page auto-switches to IMPORT badge, all bits freely selectable
- [ ] Click mode badge → toggles between BUILD/IMPORT and saves correctly
- [ ] Mode badge visible on all pages (new and legacy)
- [ ] SC-Mill package toggle → selects 25M + HSS together; 25M sub-items shown as read-only bullets
- [ ] SC-Turn toggle → selects both bits as one unit; cannot split
- [ ] SC-Mill + SC-Turn both selected → Mill Turn toast fires
- [ ] iMach3D greyed out until iMach2D is selected (in build mode), tooltip says "Requires iMach2D"
- [ ] EdgeTrim/Multiblade/Port greyed out until SC-Mill is selected (in build mode)
- [ ] Clicking disabled bit in build mode → toast explains the reason
- [ ] Sidebar toggle: New Sale shows selected SKUs + prices; Maintenance shows existing panel
- [ ] Sidebar remembers last selected tab across page loads
- [ ] Clicking a bit name → copies to clipboard, does NOT toggle checkbox
- [ ] Clicking checkbox → toggles, does NOT copy
- [ ] "What's Left to Sell" button appears on import/populated pages
- [ ] "What's Left to Sell" modal groups items by base package, shows prerequisites in descriptions
- [ ] SC-Turn appears as single combined entry in "What's Left to Sell"
- [ ] No `alert()` in production — quota error shows toast
- [ ] SSR: no `document` errors during `pnpm build`
