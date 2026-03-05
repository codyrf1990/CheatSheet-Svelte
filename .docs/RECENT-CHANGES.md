# Recent Changes — Build Mode Feature Branch

> Branch: `feature/build-mode` | Last reviewed: 2026-03-04

---

## What Was Built (5 commits)

### 1. New Sale Panel overhaul (`2a21271`)
- Sub-entries now show under full-package rows (e.g. SC-Mill shows its individual SKU breakdown)
- Bundle savings badge added inline ("Save $2,936")
- SC-Mill-5Axis double-counting bug fixed ($9,200 → $5,520)
- `skuData.ts`: added `SC-Mill::PACKAGE` entry; fixed SC-25M pricing
- SC-Turn label renamed: "SC-Turn Module" → "Turning + Backspindle"

### 2. CompanyPageBar kebab menu (`2a21271`)
- Replaced 3-button cluster (+ SKU / - SKU / Edit Order) with a single ⋮ kebab menu
- Kebab turns into a green ✓ Done button while edit mode is active

### 3. Production hardening (`2c5cc0a`)
- **Critical Svelte 5 fix**: All `$derived(() => {...})` → `$derived.by(() => {...})` (was causing silent bugs)
- Video asset: 40 MB → ~430 KB WebM + MP4 fallback
- Favicon: 586 KB → 5.7 KB
- HSTS header added

### 4. Five bug fixes (`c01b7f2`)
- SC-Turn toggle now respects `disabledBits`
- ImportLicenseModal resets state on close (not just on open) — fixed stuck spinner on re-open
- Disabled LooseBits excluded from drag in edit mode
- License import: features with both a bit AND a maint SKU now correctly remove both
- Toast `visibilitychange` listener guarded against stacking on HMR re-execution

### 5. Build mode gating (`1bb052f` + `f4311ea`)
- `disabled`/`disabledReason` now propagates from `PackageRow` → `MasterBit` → `SubBit`
- Package-level checkbox (`isPackageDisabled`) respects `disabledBits`
- SC-Turn package-level checkbox also gated
- Toast warning fires with same reason string at all levels

---

## Unstaged Changes (not yet committed)

These files have local changes that haven't been committed:

| File | What changed |
|------|-------------|
| `userPrefs.svelte.ts` | Added `repName` + `skuTabMode` ('bdm'/'ms') prefs |
| `types/index.ts` | Added `licenseKey?` to `Page`; `importedSkuList?` to `ImportResult` |
| `stores/companies.svelte.ts` | `setPageLicenseKey()` — saves license key on a page |
| `stores/panels.svelte.ts` | `loadFromPageState` now resets `removeMode = false` |
| `services/licenseImport.ts` | Step 10 added: package-level maint SKUs on full selection; stores license key on page |
| `utils/quickbooksExport.ts` | Adds `Rep: <name>` line when repName is set |
| `routes/+page.svelte` | BDM/MS mode toggle button; build mode forces BDM tab |
| `components/ui/WhatLeftModal.svelte` | Unknown — not yet reviewed |
| `components/ui/ImportLicenseModal.svelte` | Unknown — not yet reviewed |
| `calculator/Calculator.svelte` | Unknown — not yet reviewed |
| `components/layout/CompanyPageBar.svelte` | Unknown — not yet reviewed |
| `components/panels/EditablePanel.svelte` | Unknown — not yet reviewed |

---

## Known / Likely Bugs

### High Priority
| # | Area | Issue |
|---|------|-------|
| H1 | `NewSalePanel` — CASE B | Group SKU logic (CASE C) runs after CASE B. If only some bits in a group are selected it may show individual bit SKUs AND a group SKU for the same bits (duplicate line items) |
| H2 | `licenseImport` step 10 | Package maint SKU logic for SC-Mill/SC-Mill-Adv/SC-Mill-3D/SC-Mill-5Axis requires ALL groups to be selected. If import misses one group bit, the package maint SKU is silently skipped — no fallback to individual bit maint SKUs |
| H3 | `skuTabMode` BDM/MS toggle | The "Maintenance" tab label in BDM mode and the first tab label in MS mode may be confusing — "Maintenance" tab exists in both modes but the first tab changes label. Tab switching state (`skuTab`) is local `$state` not persisted — may reset unexpectedly |

### Medium Priority
| # | Area | Issue |
|---|------|-------|
| M1 | `WhatLeftModal` / `ImportLicenseModal` | Unstaged changes not reviewed — unknown state |
| M2 | `CompanyPageBar` unstaged | Kebab menu may have interactions with the new BDM/MS changes — not reviewed |
| M3 | `licenseImport` `setPageLicenseKey` | Called before `loadFromPageState` runs in step 5 — page object mutation may be overwritten when state is restored from companies store |
| M4 | `panels.svelte.ts` `removeMode` reset | `removeMode = false` added to `loadFromPageState` but `removeMode` variable not shown exported — if it's purely internal this is fine, but worth verifying |
| M5 | `quickbooksExport` rep name | `repName` is stored in `userPrefs` (device-local) but QB export is page-scoped — rep name will show on all exports regardless of page/company |

### Low Priority
| # | Area | Issue |
|---|------|-------|
| L1 | `build mode → BDM forced` | The `$effect` that forces `skuTabMode = 'bdm'` when build mode is on will fire every time buildMode becomes truthy, even mid-session. If a user switched to MS mode and then build mode re-triggers, it silently switches them back |
| L2 | `Page.licenseKey` persistence | `ensureIntegrity` now maps `licenseKey` through — but the Firebase sync schema may not include it, so it could be lost on sync |

---

## What to Address First

1. **Commit unstaged work** or stash it — review `WhatLeftModal`, `ImportLicenseModal`, `Calculator`, `CompanyPageBar`, `EditablePanel` diffs before committing
2. **H1** — Check NewSalePanel for duplicate line items in partial selections
3. **H2** — Verify license import step 10 has a fallback when package isn't fully selected
4. **M3** — Verify `setPageLicenseKey` timing vs `loadFromPageState`
5. **L2** — Check Firebase sync schema includes `licenseKey`
