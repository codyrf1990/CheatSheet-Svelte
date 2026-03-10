# Full Codebase Polish Master Plan

Audit baseline date: March 10, 2026 (verified March 9, 2026)
Target branch: `feature/build-mode`
Scope: production-grade polish only, no new features, no new dependencies, no architecture rewrite

## Status Legend

- `Verified`: confirmed by code audit agents against the actual codebase
- `Corrected`: original plan claim was inaccurate, now fixed
- `Decision`: needs explicit keep/remove/approve before implementation

---

## Current Baseline

| Check               | Status           | Notes                                                                                        |
| ------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `pnpm check`        | Verified pass    | `svelte-check found 0 errors and 0 warnings`                                                 |
| `pnpm test`         | Corrected        | **43 tests** passing (27 polish + 12 build-mode + 4 stability)                               |
| `pnpm lint`         | Corrected        | Runs **ESLint + Prettier** (not just Prettier); `eslint . && prettier --check .`             |
| `pnpm build`        | Verified partial | App build succeeds, then Windows Vercel adapter symlink `EPERM` fails                        |
| Svelte 5 runes-only | Verified clean   | No `$:`, no `export let`, no `on:event`, no `<slot />`                                       |
| `any` usage         | Verified clean   | No explicit `any` in production code (one legitimate `unknown` cast in toast store)          |
| `console.log`       | Verified clean   | None found in `src/`                                                                         |
| `console.warn`      | Verified open    | **7 instances** across 3 store files (see Phase 2 details)                                   |
| `FIXME` / `HACK`    | Verified clean   | None found                                                                                   |
| `TODO`              | Verified open    | One in `firestore.rules` line 14: `// TODO: add Firebase Auth and restrict to company email` |
| Props interfaces    | Verified clean   | 100% use `interface Props {}` + `$props()` pattern                                           |
| Store patterns      | Verified clean   | All 7 stores follow getter/method pattern                                                    |
| Naming conventions  | Verified clean   | camelCase vars, PascalCase components, UPPER_SNAKE_CASE constants                            |

---

## Already Landed

- `+error.svelte` exists
- Boot failure UI exists in `+layout.svelte`
- Modal scroll lock and focus return implemented (Modal.svelte lines 24-61)
- `CollapseWrapper` exists and in use (Panel, MasterBit, BDMPanel)
- `BDMPanel` has Expand All / Collapse All
- Inline copy feedback exists (checkmark toast)
- Sync status uses SVG iconography
- Skip link implemented (`+layout.svelte` line 58, target `#main-content`)
- Focus trap in modals (Tab wrap-around, Escape closes, scroll locked)
- Roving tabindex on page tabs (Arrow keys, Home/End, select-follows-focus)
- ARIA coverage at ~95% (role="dialog", aria-modal, aria-expanded, aria-selected, aria-pressed, aria-live, etc.)
- 43 Playwright tests passing

---

## Guardrails

1. Do not add new features or change product behavior.
2. Do not add dependencies.
3. Do not refactor architecture.
4. Prefer deletion over abstraction unless the duplication is real and repeated 3+ times.
5. If a cleanup item changes workflow or interaction model, stop and treat it as a decision item first.

---

## Phase 1: Dead Code and Cleanup

### Verified Dead Code

| Priority | Item                              | File                                         | Line(s)                          | Notes                                                                                                                                                        |
| -------- | --------------------------------- | -------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1       | Decision: `Tooltip.svelte`        | `src/lib/components/ui/Tooltip.svelte`       | whole file                       | Complete component (52 lines), NOT exported from `ui/index.ts`, never imported. 31 native `title=` attrs remain across 17 files.                             |
| P1       | Decision: `persistence.svelte.ts` | `src/lib/stores/persistence.svelte.ts`       | whole file                       | 85-line utility with `get()`, `set()`, `getString()`, `remove()`. **Never imported anywhere.** All stores use raw `localStorage` instead (20+ direct calls). |
| P1       | Decision: `MenuPrimitive.svelte`  | `src/lib/components/ui/MenuPrimitive.svelte` | exported in `ui/index.ts` line 9 | Full component with arrow key nav, viewport clamping, click-outside. Exported but **zero imports** found.                                                    |
| P2       | Remove unused `masterId` param    | `src/lib/stores/packages.svelte.ts`          | line 72                          | `toggleMasterBit(packageCode, masterId, subBits)` — `masterId` never referenced in function body. Call site: `MasterBit.svelte` line 67.                     |
| P2       | Remove unused `HeaderLink` type   | `src/lib/types/index.ts`                     | lines 117-121                    | Defined, never referenced anywhere.                                                                                                                          |
| P2       | Remove unused `ParsedPDF` type    | `src/lib/types/index.ts`                     | lines 191-195                    | Defined, never referenced anywhere.                                                                                                                          |

### Verified Duplication (Consolidation Candidates)

Only do these if the implementation stays small and behavior-neutral:

**Clipboard copy — 13 sites confirmed:**

| File                           | Line | Method                                    |
| ------------------------------ | ---- | ----------------------------------------- |
| `utils/quickbooksExport.ts`    | 240  | `navigator.clipboard.writeText()`         |
| `utils/quickbooksExport.ts`    | 248  | `document.execCommand('copy')` (fallback) |
| `packages/LooseBit.svelte`     | 50   | `navigator.clipboard.writeText()`         |
| `calculator/Calculator.svelte` | 387  | `navigator.clipboard.writeText()`         |
| `calculator/Calculator.svelte` | 399  | `navigator.clipboard.writeText()`         |
| `packages/SubBit.svelte`       | 49   | `navigator.clipboard.writeText()`         |
| `layout/CompanyPageBar.svelte` | 354  | `navigator.clipboard.writeText()`         |
| `layout/CompanyPageBar.svelte` | 366  | `navigator.clipboard.writeText()`         |
| `ui/WhatLeftModal.svelte`      | 184  | `navigator.clipboard.writeText()`         |
| `panels/PanelItem.svelte`      | 38   | `navigator.clipboard.writeText()`         |
| `packages/PackageRow.svelte`   | 151  | `navigator.clipboard.writeText()`         |
| `packages/PackageRow.svelte`   | 161  | `navigator.clipboard.writeText()`         |
| `panels/BDMPanel.svelte`       | 77   | `navigator.clipboard.writeText()`         |
| `panels/NewSalePanel.svelte`   | 132  | `navigator.clipboard.writeText()`         |
| `packages/MasterBit.svelte`    | 77   | `navigator.clipboard.writeText()`         |

**Raw localStorage — 20+ calls outside persistence module:**

| File                         | Approximate Lines | Operations                                               |
| ---------------------------- | ----------------- | -------------------------------------------------------- |
| `stores/companies.svelte.ts` | 602-720           | `getItem` x5, `setItem` x4, `removeItem` x1              |
| `stores/sync.svelte.ts`      | 397-505           | `setItem` x5, `getItem` x4, `removeItem` x2              |
| `panels/BDMPanel.svelte`     | 27-66             | `getItem` x1, `setItem` x3 (4 repeated try-catch blocks) |

**deepCopy — 10+ instances:**

| File                         | Line                              | Pattern                                  |
| ---------------------------- | --------------------------------- | ---------------------------------------- |
| `stores/companies.svelte.ts` | 73                                | `deepCopy<T>()` function definition      |
| `stores/companies.svelte.ts` | 330, 510, 573, 726, 752, 795, 800 | `deepCopy()` usage (7 call sites)        |
| `stores/packages.svelte.ts`  | 236                               | Inline `JSON.parse(JSON.stringify(...))` |
| `stores/panels.svelte.ts`    | 172, 182                          | Inline `JSON.parse(JSON.stringify(...))` |

---

## Phase 2: Code Quality and Consistency

### Verified Clean

- Svelte 5 runes-only syntax — zero violations
- Props interfaces — 100% use `interface Props {}` pattern
- Stores — all 7 follow getter/method pattern
- TypeScript strict mode holding — no `any` types
- Naming conventions — camelCase/PascalCase/UPPER_SNAKE_CASE consistent

### Verified Open: console.warn (7 instances)

| File                         | Line | Message                                          | Should Be                                        |
| ---------------------------- | ---- | ------------------------------------------------ | ------------------------------------------------ |
| `stores/companies.svelte.ts` | 475  | `'Cannot delete last page'`                      | OK as warn (validation guard)                    |
| `stores/companies.svelte.ts` | 735  | `'Import skipped: invalid data'`                 | OK as warn (non-fatal)                           |
| `stores/companies.svelte.ts` | 747  | `'Import skipped: missing companies'`            | OK as warn (non-fatal)                           |
| `stores/userPrefs.svelte.ts` | 64   | `'Failed to load user preferences:'`             | **Should be console.error** (data loss risk)     |
| `stores/userPrefs.svelte.ts` | 92   | `'Failed to save user preferences:'`             | **Should be console.error** (data loss risk)     |
| `stores/userPrefs.svelte.ts` | 324  | `'Import skipped: invalid data'`                 | OK as warn (non-fatal)                           |
| `stores/sync.svelte.ts`      | 376  | `'Cloud read failed, entering local-only mode:'` | **Should be console.error** (connection failure) |

### Verified Open: Error Handling Patterns

**42 try/catch blocks total across src/.** Breakdown:

| Pattern                                  | Count | Assessment                                                                         |
| ---------------------------------------- | ----- | ---------------------------------------------------------------------------------- |
| `console.error` + toast (user feedback)  | ~12   | Clean                                                                              |
| `console.error` + state transition       | ~6    | Clean                                                                              |
| `console.error` + rethrow                | ~4    | Clean                                                                              |
| Error passed to callback                 | ~2    | Clean (Firebase sync)                                                              |
| Silent catch with comment (non-critical) | 12    | All intentional — localStorage fallbacks, JSON.parse drag data, persistence module |
| `console.warn` (should be error)         | 3     | Fix these (see above)                                                              |
| Toast only (clipboard failures)          | ~8    | Clean — user sees feedback                                                         |

**12 silent catches (all intentional, all have explanatory comments):**

| File                           | Line           | Context                                        |
| ------------------------------ | -------------- | ---------------------------------------------- |
| `panels/BDMPanel.svelte`       | 29, 42, 56, 66 | localStorage unavailable — non-critical        |
| `packages/MasterBit.svelte`    | 131, 159       | JSON.parse drag data — fallback to normal drop |
| `packages/PackageRow.svelte`   | 212, 245       | JSON.parse drag data — fallback to normal drop |
| `stores/persistence.svelte.ts` | 18, 32, 45     | localStorage operations — comment-only catch   |
| `stores/syncSession.svelte.ts` | 70             | reconnectCallback failure — auto-retry logic   |

### Corrected: Sync Reconnect Handling

Original plan said "reconnect path currently just returns `false` without context." **This is inaccurate.**

Actual behavior (`syncSession.svelte.ts` lines 48-75):

1. On failure: increments `retryCount`, recursively calls `attemptReconnect()` with backoff delays
2. After `MAX_RETRIES` (3): transitions state to `'local_only'` and stops
3. On exception: catches silently, increments retry, tries again
4. The reconnect callback in `sync.svelte.ts` line 360 returns `false` on error, which triggers the retry logic above

**No fix needed** — the behavior is correct, just poorly described in the original plan.

### Carry Forward

| Priority | Item                             | Notes                        |
| -------- | -------------------------------- | ---------------------------- |
| P3       | Standardize callback prop naming | 3 patterns mixed (see below) |
| P3       | Consolidate deep-copy behavior   | Low risk if done surgically  |

**Callback prop naming — full inventory:**

| Pattern                 | Examples                                                       | Count       |
| ----------------------- | -------------------------------------------------------------- | ----------- |
| `on` + all lowercase    | `onclose`, `onwhatleft`                                        | 7 instances |
| `on` + DOM event name   | `ondragstart`, `ondragover`, `ondrop`                          | 9 instances |
| `on` + CamelCase action | `onAddItem`, `onToggleRemove`, `onLogout`, `onOperationsClick` | 9 instances |

---

## Phase 3: UI Polish and Motion

### Verified Already Good

| Element         | Implementation                                                    | Timing                          |
| --------------- | ----------------------------------------------------------------- | ------------------------------- |
| Buttons         | hover `translateY(-2px)` + `brightness(1.05)`, active, focus ring | 150ms ease                      |
| Modals          | backdrop `transition:fade`, content `transition:fly` y:24         | 200ms, 300ms                    |
| CollapseWrapper | `grid-template-rows: 0fr→1fr` transition                          | 200ms cubic-bezier(0.4,0,0.2,1) |
| Toasts          | `in:fly` x:24 staggered, `out:fly` x:12, `animate:flip`           | 280ms/150ms/200ms               |
| Checkboxes      | `transition: all` on control element                              | 150ms ease                      |
| Inputs          | `transition: all`, focus `scale(1.01)` + gold border              | 150ms ease                      |
| Focus rings     | Global gold 2px outline + offset, enhanced on buttons/inputs      | —                               |
| Disabled states | `opacity: 0.5`, `cursor: not-allowed` consistently                | —                               |
| Nav links       | hover transform + opacity                                         | 200ms cubic-bezier              |
| Settings panel  | `panelSlideIn` animation                                          | 150ms ease                      |
| Dropdown menus  | `dropdownFadeIn` / `contextMenuFadeIn`                            | 150ms cubic-bezier              |

### Verified Open

| Priority | Item                                                 | Details                                                                                                                                                                           |
| -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | `prefers-reduced-motion` is dead code                | `ToastContainer.svelte` line 7: `let prefersReducedMotion = false;` — hardcoded, never reads media query. **30+ animated elements across codebase, ZERO respect reduced-motion.** |
| P1       | Add global `@media (prefers-reduced-motion: reduce)` | No such rule exists anywhere in `app.css` or components                                                                                                                           |
| P1       | Wire reduced-motion in `ToastContainer.svelte`       | Should be `$state(window.matchMedia('(prefers-reduced-motion: reduce)').matches)`                                                                                                 |
| P1       | Add reduced-motion fallback to `Modal.svelte`        | `fade` 200ms + `fly` 300ms always run                                                                                                                                             |
| P2       | Add reduced-motion to `CollapseWrapper.svelte`       | Grid transition always runs (used in Panel, MasterBit, BDMPanel)                                                                                                                  |
| P2       | Add reduced-motion to `Button.svelte`                | Hover lift/brightness always runs                                                                                                                                                 |
| P2       | Review `LoginScreen.svelte` decorative motion        | 800ms entrance transitions (lines 385, 452, 667), infinite ambient glows (20-25s), infinite particles (7-12.5s), plus `+layout.svelte` background video                           |
| P2       | Animate under-table SKU panel                        | `+page.svelte` lines 317-328: uses bare `{#if}` — mounts/unmounts instantly with no transition                                                                                    |
| P2       | Add CSS transition to chevron rotations              | Chevrons in Panel.svelte and +page.svelte rotate via CSS class `.open`/`.rotated` but have **no `transition: transform` property** — they snap instantly                          |
| P2       | Add transition to mode pill buttons                  | `.mode-pill-btn` active state changes color/background instantly with no transition                                                                                               |

### Full Animation Catalog

**Svelte transition: directives:**

| File                    | Element        | Directive         | Duration       |
| ----------------------- | -------------- | ----------------- | -------------- |
| `Modal.svelte`          | .modal-overlay | `transition:fade` | 200ms          |
| `Modal.svelte`          | .modal         | `transition:fly`  | 300ms (y:24)   |
| `ToastContainer.svelte` | .toast         | `animate:flip`    | 0/200ms        |
| `ToastContainer.svelte` | .toast         | `in:fly`          | 0/280ms (x:24) |
| `ToastContainer.svelte` | .toast         | `out:fly`         | 0/150ms (x:12) |

**CSS @keyframes animations:**

| File                        | Keyframe            | Duration         | Purpose                 |
| --------------------------- | ------------------- | ---------------- | ----------------------- |
| `app.css`                   | `fadeIn`            | 250ms            | Utility class           |
| `app.css`                   | `pulse-gold`        | 2s infinite      | Gold pulse utility      |
| `app.css`                   | `shimmer`           | 1.5s infinite    | Skeleton loading        |
| `ToastContainer.svelte`     | `progressShrink`    | dynamic          | Progress bar countdown  |
| `LoginScreen.svelte`        | `ambientFloat`      | 18-25s infinite  | Background glow         |
| `LoginScreen.svelte`        | `particleRise`      | 7-12.5s infinite | Rising particles        |
| `LoginScreen.svelte`        | `slideDown`         | 0.3s             | Offline banner          |
| `LoginScreen.svelte`        | `glow-breathe`      | 3s infinite      | Logo glow pulse         |
| `LoginScreen.svelte`        | `iconFloat`         | 3s infinite      | Decorative icon bob     |
| `LoginScreen.svelte`        | `shake`             | 0.3s             | Input error shake       |
| `LoginScreen.svelte`        | `successPop`        | 0.4s             | Success icon pop        |
| `LoginScreen.svelte`        | `spin`              | 0.8s infinite    | Loading spinner         |
| `Header.svelte`             | `borderShimmer`     | 25s infinite     | Nav border shimmer      |
| `CompanyPageBar.svelte`     | `dropdownFadeIn`    | 150ms            | Dropdown entrance       |
| `CompanyPageBar.svelte`     | `contextMenuFadeIn` | 150ms            | Context menu entrance   |
| `CompanyPageBar.svelte`     | `barBorderShimmer`  | 20s infinite     | Bar border shimmer      |
| `Logo.svelte`               | `glow-breathe`      | 3s infinite      | Logo glow               |
| `UserAvatar.svelte`         | `containerPulse`    | 2s infinite      | Avatar pulse            |
| `UserAvatar.svelte`         | `avatarRingSpin`    | 3-8s infinite    | Avatar ring spin        |
| `UserAvatar.svelte`         | `avatarBreathe`     | 4s infinite      | Avatar breathe          |
| `UserAvatar.svelte`         | `panelSlideIn`      | 150ms            | Settings panel entrance |
| `UserAvatar.svelte`         | `spin`              | 1s infinite      | Spinner                 |
| `MenuPrimitive.svelte`      | `menuFadeIn`        | 150ms            | Menu entrance           |
| `+page.svelte`              | `menuFadeIn`        | 150ms            | Menu entrance           |
| `Skeleton.svelte`           | `shimmer`           | 1.5s infinite    | Loading skeleton        |
| `ImportLicenseModal.svelte` | `spin`              | 1s infinite      | Spinner                 |

### Missing Animations (interactive elements with no transition)

| Element                                | File                                                             | Issue                                                             |
| -------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| SKU panel toggle                       | `+page.svelte` lines 317-328                                     | Bare `{#if}` — instant mount/unmount                              |
| Chevron rotation (SKU collapse)        | `+page.svelte`                                                   | `.open` class toggles rotation with no `transition: transform`    |
| Chevron rotation (panel collapse icon) | `Panel.svelte`                                                   | `.rotated` class, verify transition exists                        |
| Mode pill active state                 | `+page.svelte`                                                   | Color/background change with no transition                        |
| Menu item entrance                     | `Header.svelte`, `CompanyPageBar.svelte`                         | Container fades in, but individual items have no stagger          |
| Import modal state transitions         | `ImportLicenseModal.svelte`                                      | State indicator changes (idle→loading→success→error) not animated |
| List items mount                       | `PackageTable`, `MasterBit`, `LooseBit`, `BDMPanel`, `PanelItem` | `{#each}` blocks render with no entry/exit animation              |

### Timing Scale Reference (from app.css)

```
--duration-fast: 100ms
--duration-normal: 150ms
--duration-smooth: 200ms
--ease-fast: 150ms ease
--ease-smooth: 250ms ease
--ease-bounce: 350ms ease (defined but unused)
```

| Duration | Where Used                                                                    | Status                             |
| -------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| 150ms    | Buttons, checkboxes, inputs, close buttons, dropdown entrance, settings panel | Standard                           |
| 200ms    | Collapse, icon rotation, nav animation, modal backdrop, toast close, flip     | Standard                           |
| 250ms    | Dropdown arrows                                                               | Acceptable                         |
| 280ms    | Toast `in:fly` entrance                                                       | **Non-standard — should be 250ms** |
| 300ms    | Modal `fly` entrance                                                          | Acceptable                         |
| 800ms    | LoginScreen entrance transitions (3 elements with stagger)                    | **Review — may be too slow**       |

---

## Phase 4: Visual Consistency

### Typography

**Font size scale (app.css):**

```
--text-2xs: 0.625rem (10px)     --text-xs: 0.6875rem (11px)
--text-sm: 0.75rem (12px)       --text-base: 0.8125rem (13px)
--text-lg: 0.875rem (14px)      --text-xl: 1rem (16px)
```

**`--text-2xs` (10px) usage — 39 instances across 14 files:**

| File                      | Lines                             | Context               |
| ------------------------- | --------------------------------- | --------------------- |
| `+page.svelte`            | 580                               | Shell text            |
| `Calculator.svelte`       | 714                               | Calculator label      |
| `CompanyPageBar.svelte`   | 1178, 1230, 1460                  | Bar text, tab labels  |
| `CompaniesModal.svelte`   | 421                               | Modal text            |
| `MasterBit.svelte`        | 337, 352, 379                     | Bit labels            |
| `PackageTable.svelte`     | 223                               | Table text            |
| `LooseBit.svelte`         | 252, 272, 278                     | Bit labels            |
| `PackageRow.svelte`       | 542, 597                          | Row text              |
| `SubBit.svelte`           | 220, 234                          | Bit labels            |
| `PanelItem.svelte`        | 190, 209, 216, 227, 234, 244, 251 | Panel labels (7 uses) |
| `Panel.svelte`            | 239, 273                          | Panel text            |
| `MaintenancePanel.svelte` | 233, 239                          | Panel text            |
| `NewSalePanel.svelte`     | 347, 378, 391, 423, 427, 433, 437 | Panel text (7 uses)   |
| `BDMPanel.svelte`         | 183, 230, 301, 320, 344, 347      | BDM labels (6 uses)   |

**Hardcoded font sizes NOT using `--text-*` variables:**

| File                    | Line   | Value                         | Should Be                        |
| ----------------------- | ------ | ----------------------------- | -------------------------------- |
| `+layout.svelte`        | 193    | `1.25rem` (.boot-brand)       | Add `--text-2xl` or use variable |
| `+layout.svelte`        | 219    | `1.25rem` (.boot-error-title) | Same                             |
| `+layout.svelte`        | 226    | `0.875rem` (.boot-error-text) | `var(--text-lg)`                 |
| `LoginScreen.svelte`    | 522    | `1.75rem` (.login-title)      | Add to scale                     |
| `LoginScreen.svelte`    | 533    | `0.95rem` (.login-subtitle)   | Not in scale                     |
| `Modal.svelte`          | 80/207 | `1rem` (.modal-title)         | `var(--text-xl)`                 |
| `ToastContainer.svelte` | 149    | `0.75rem` (.toast-message)    | `var(--text-sm)`                 |
| `Tooltip.svelte`        | 31     | `0.75rem`                     | `var(--text-sm)`                 |
| `Checkbox.svelte`       | 146    | `0.875rem` (.checkbox-label)  | `var(--text-lg)`                 |

**Line height inconsistencies:**

| File                    | Value | Should Be   |
| ----------------------- | ----- | ----------- |
| Global (app.css)        | `1.5` | Standard    |
| `ToastContainer.svelte` | `1.3` | Standardize |
| `Tooltip.svelte`        | `1.4` | Standardize |

### Native `title=` Tooltips — 31 Instances Across 17 Files

| File                          | Lines                        | Elements                                   |
| ----------------------------- | ---------------------------- | ------------------------------------------ |
| `+page.svelte`                | 288, 295, 345, 352           | BDM/MS mode buttons                        |
| `WhatLeftModal.svelte`        | 204, 224                     | Modal elements                             |
| `SalesTaxModal.svelte`        | 31                           | Modal element                              |
| `CompaniesModal.svelte`       | 176                          | Modal element                              |
| `ImportLicenseModal.svelte`   | 167                          | Modal element                              |
| `AddSkuModal.svelte`          | 73                           | Modal element                              |
| `CurrentProductsModal.svelte` | 244                          | Modal element                              |
| `CompanyPageBar.svelte`       | 592, 705, 745, 765, 802, 971 | Status, rename, import, copy, context menu |
| `Calculator.svelte`           | 419                          | Discount value copy                        |
| `SubBit.svelte`               | 80                           | Bit element                                |
| `MasterBit.svelte`            | 172                          | Bit element                                |
| `LooseBit.svelte`             | 87                           | Bit element                                |
| `PackageTable.svelte`         | 42, 48                       | Table elements                             |
| `EditablePanel.svelte`        | 107, 147                     | Panel elements                             |
| `NewSalePanel.svelte`         | 159, 178, 212, 231           | Panel elements                             |
| `BDMPanel.svelte`             | 140                          | Panel element                              |
| `LoginScreen.svelte`          | 166                          | "Remember me" checkbox                     |

### Hard-coded Colors in Components

Brand colors repeated in component `<style>` blocks instead of using CSS variables:

| Color         | Hex       | Appears In                                                                                             |
| ------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| SolidCAM Red  | `#c8102e` | `Button.svelte`, `+error.svelte`, `app.html` meta, plus `rgba(200,16,46,...)` in many files            |
| SolidCAM Gold | `#d4af37` | `Button.svelte`, `Checkbox.svelte`, `+error.svelte`, `LoginScreen.svelte`, plus `rgba(212,175,55,...)` |
| Surface Dark  | `#1a1a1a` | `Checkbox.svelte`, `+error.svelte`                                                                     |
| Gold variant  | `#e5c55a` | `Checkbox.svelte`                                                                                      |
| Dark red      | `#8b0000` | `Button.svelte`                                                                                        |
| Gold variant  | `#b8941f` | `Button.svelte`, `+error.svelte`                                                                       |

Many `rgba()` overlay values in `Header.svelte`, `CompanyPageBar.svelte`, `Calculator.svelte`, `LoginScreen.svelte`, `+page.svelte` (white/black overlays for hover/active states).

### Border Radius Inconsistency

**Defined scale (app.css):**

```
--radius-2xs: 3px    --radius-xs: 4px    --radius-sm: 6px
--radius-md: 10px    --radius-lg: 14px   --radius-xl: 18px
```

**Values used but NOT in scale:**

| Value  | Count         | Files                                                                                             |
| ------ | ------------- | ------------------------------------------------------------------------------------------------- |
| `8px`  | ~14 instances | `+layout.svelte`, `Header.svelte`, `CompaniesModal.svelte`, `CurrentProductsModal.svelte`, others |
| `5px`  | 1 instance    | `CompanyPageBar.svelte` line 1229                                                                 |
| `12px` | ~3 instances  | Various                                                                                           |
| `16px` | 1 instance    | `+layout.svelte` line 172                                                                         |
| `20px` | 1 instance    | `SmokedGlassCard.svelte` line 27 (Tailwind `rounded-[20px]`)                                      |

### Hardcoded Spacing (raw px in component styles)

| File                        | Line     | Value                                                  | Context                              |
| --------------------------- | -------- | ------------------------------------------------------ | ------------------------------------ |
| `PackageTable.svelte`       | 147      | `gap: 4px`                                             | Should use `var(--space-1)`          |
| `PackageTable.svelte`       | 158      | `gap: 5px`                                             | Not in scale                         |
| `PackageTable.svelte`       | 165, 195 | `padding: 2px 7px`                                     | Not in scale                         |
| `PackageTable.svelte`       | 243      | `margin: -1px`                                         | Alignment hack                       |
| `Tooltip.svelte`            | 30       | `padding: 4px 10px`                                    | Fully hardcoded                      |
| `ImportLicenseModal.svelte` | 386, 513 | `padding: 2px 6px`                                     | Not in scale                         |
| `ImportLicenseModal.svelte` | 512      | `margin-left: 8px`                                     | Not in scale                         |
| `LooseBit.svelte`           | 211      | `margin-right: 2px`                                    | Alignment                            |
| `SubBit.svelte`             | 200      | `margin-right: 2px`                                    | Alignment                            |
| `PackageRow.svelte`         | 400      | `padding-top: 1px`                                     | Alignment                            |
| `BDMPanel.svelte`           | 254, 315 | `gap: 1px`                                             | Micro spacing                        |
| `LoginScreen.svelte`        | 647      | `gap: 6px`                                             | Hardcoded                            |
| `Panel.svelte`              | 95       | `padding: 0.3rem 0.5rem`                               | Not using vars                       |
| `Panel.svelte`              | 183      | `padding: 0.24rem 0.4rem`                              | Oddly specific                       |
| `CompanyPageBar.svelte`     | various  | `0.3rem 0.625rem`, `0.35rem 0.625rem`, `0.4rem 0.6rem` | Inconsistent between similar buttons |
| `WhatLeftModal.svelte`      | 317      | `padding: 0.125rem 0.375rem`                           | Not in scale                         |

### Breakpoints — 8+ Unique Values

| Breakpoint    | Files Using It                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `480px`       | LoginScreen, ToastContainer                                                                     |
| `500px`       | Panel, PanelItem                                                                                |
| `600px`       | +page.svelte                                                                                    |
| `640px`       | LooseBit, MasterBit, PackageRow, SubBit, CompanyPageBar, +page.svelte, and more (~10 files)     |
| `680px`       | Header, PackageRow, PackageTable                                                                |
| `768px`       | Calculator, Panel, MaintenancePanel, Header, CompanyPageBar, +page.svelte, and more (~10 files) |
| `900px`       | Header, CompanyPageBar, +page.svelte                                                            |
| `hover: none` | CompanyPageBar (2 instances)                                                                    |

**Files using 3+ different breakpoints:**

- `+page.svelte`: 900px, 768px, 640px, 600px (4 breakpoints)
- `Header.svelte`: 900px, 768px, 680px (3 breakpoints)
- `CompanyPageBar.svelte`: 900px, 768px, 640px, hover:none (4 breakpoints)
- `PackageRow.svelte`: 768px, 680px, 640px (3 breakpoints)

### Responsive Compression — Extreme at Narrow Widths

**Header.svelte font size at breakpoints:**

| Breakpoint | Font Size                        | Equivalent px | Reduction |
| ---------- | -------------------------------- | ------------- | --------- |
| Base       | `clamp(0.85rem, 1.5vw, 1.25rem)` | 13.6-20px     | —         |
| 900px      | `0.65rem`                        | 10.4px        | -39%      |
| 768px      | `0.6rem`                         | 9.6px         | -44%      |
| 680px      | `0.55rem`                        | **8.8px**     | **-55%**  |

**CompanyPageBar.svelte font size at breakpoints:**

| Breakpoint      | Font Size | Equivalent px | Reduction |
| --------------- | --------- | ------------- | --------- |
| Base            | `0.9rem`  | 14.4px        | —         |
| 900px           | `0.75rem` | 12px          | -17%      |
| 768px           | `0.65rem` | 10.4px        | -28%      |
| 640px           | `0.55rem` | **8.8px**     | **-39%**  |
| 640px (add-tab) | `0.5rem`  | **8px**       | **-44%**  |

### Touch Targets Below 44px

| Element                      | File                    | Line(s)              | Actual Size              | Target                             |
| ---------------------------- | ----------------------- | -------------------- | ------------------------ | ---------------------------------- |
| Checkbox control             | `Checkbox.svelte`       | 105-106              | **20x20px**              | 44x44px                            |
| Quick action buttons         | `CompanyPageBar.svelte` | 1409-1410, 1442-1443 | **26x26px**              | 44x44px                            |
| Maintenance collapse buttons | `Panel.svelte`          | 202-203              | **22x22px**              | 44x44px                            |
| Modal close button           | `Modal.svelte`          | 218-219              | **32x32px**              | 44x44px                            |
| Header nav links             | `Header.svelte`         | various              | Padding `0.15rem 0.4rem` | Expand hit area                    |
| Checkmark/indicator SVGs     | Various                 | various              | **10-14px**              | Visual only (OK if parent is 44px) |

### Overflow Risk

`PackageTable.svelte` line 74: `.main-table` uses `overflow: hidden` but columns have `min-width` (185px, 140px) that may exceed mobile viewport. No horizontal scroll container — content clipped.

### Arbitrary Tailwind Values (only 3)

| Value                                    | File                     | Line  |
| ---------------------------------------- | ------------------------ | ----- |
| `rounded-[20px]`                         | `SmokedGlassCard.svelte` | 27    |
| `shadow-[0_0_40px_rgba(0,0,0,0.3)]`      | `SmokedGlassCard.svelte` | 22-23 |
| `shadow-[0_0_60px_rgba(200,16,46,0.08)]` | `SmokedGlassCard.svelte` | 22-23 |

---

## Phase 5: Final Audit and Verification

### Verified Already Passing

- `pnpm check` — zero errors, zero warnings
- `pnpm test` — 43 tests passing (27 polish + 12 build-mode + 4 stability)
- No `console.log` in src/
- No `FIXME` or `HACK`
- No legacy Svelte syntax
- Skip link works (`+layout.svelte` line 58, targets `#main-content`)
- Modal focus trap works (Tab wrap-around, Escape closes, scroll locked)
- Roving tabindex on page tabs works (Arrow keys, Home/End, select-follows-focus)
- ARIA coverage ~95% across codebase

### Verified Open

| Priority | Item                                                  | Notes                                                                                                                                      |
| -------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| P1       | Get `pnpm lint` green                                 | Runs `eslint . && prettier --check .` (ESLint + Prettier, not just Prettier)                                                               |
| P1       | Reconfirm `pnpm build` in CI/Linux                    | Windows EPERM is environment-specific                                                                                                      |
| P2       | Page tab menu button (⋮) requires right-click         | `CompanyPageBar.svelte` line 712: `tabindex={-1}` — cannot Tab to it directly. Context menu via `oncontextmenu` (line 703) is mouse-first. |
| P2       | UserAvatar settings panel missing `aria-modal="true"` | `UserAvatar.svelte` line 117: has `role="dialog"` but no `aria-modal`                                                                      |
| P2       | Resolve `TODO` in `firestore.rules` line 14           | `// TODO: add Firebase Auth and restrict to company email when/if needed`                                                                  |

### Test Coverage Gaps

**Current 43 tests cover:**

- Shell & navigation (company name, tabs, sync icon, quick actions)
- Keyboard navigation (arrow keys on tabs, Escape closes dropdown)
- Interactions (modal scroll lock, BDM collapse, copy feedback)
- Narrow viewport (375px width)
- Build mode (gating, toggles, warnings, SKUs, totals)
- Stability (boot, add-page, sync fallback)

**Not tested (recommended for this polish pass):**

- Skip link functionality
- Roving tabindex (explicit Arrow/Home/End verification)
- ARIA attribute validation
- Context menu keyboard accessibility
- Reduced-motion behavior (once implemented)
- Tooltip behavior (once migrated)
- Focus restoration after modal close
- Tab order verification

---

## Decisions Made

| Item                    | Decision                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Tooltip.svelte`        | **Keep and migrate** — roll out across 31 native `title=` attributes                                                    |
| `persistence.svelte.ts` | **Keep and migrate** — move 20+ raw localStorage calls to use it                                                        |
| `MenuPrimitive.svelte`  | **Keep and adopt** — migrate existing dropdown/context menus                                                            |
| Callback prop naming    | **Normalize to camelCase** — `onclose`→`onClose`, `onwhatleft`→`onWhatLeft`. Keep DOM events lowercase.                 |
| Responsive strategy     | **Fix readability + touch targets only** — set minimum font sizes, expand small controls. Don't reorganize breakpoints. |
| `--text-2xs` (10px)     | **Raise to 11px** — replace all 39 `--text-2xs` usages with `--text-xs`                                                 |

---

## Recommended Execution Order

### Wave 1: Safe cleanup and green gates

1. Format the repo so `pnpm lint` passes.
2. Remove `HeaderLink`, `ParsedPDF` types and unused `masterId` parameter.
3. Make keep/remove decisions on `Tooltip.svelte`, `persistence.svelte.ts`, `MenuPrimitive.svelte`.
4. Reclassify 3 `console.warn` as `console.error` (userPrefs load/save, sync cloud read).

### Wave 2: Motion accessibility

1. Add `@media (prefers-reduced-motion: reduce)` global rule in `app.css`.
2. Wire `prefersReducedMotion` in `ToastContainer.svelte` to actual media query.
3. Add reduced-motion fallbacks to `Modal.svelte`, `CollapseWrapper.svelte`, `Button.svelte`.
4. Review `LoginScreen.svelte` decorative motion and `+layout.svelte` background video.
5. Add CSS `transition: transform` to chevron rotations and mode pill buttons.
6. Normalize toast entry from 280ms to 250ms.
7. Wrap SKU panel in `CollapseWrapper` or add transition.

### Wave 3: Typography and responsive density

1. Convert hardcoded font sizes to `--text-*` variables.
2. Reduce reliance on `--text-2xs` (10px) where readability suffers.
3. Stop aggressive shrink below comfortable sizes (minimum ~11px).
4. Expand smallest controls toward 44px touch targets.

### Wave 4: Tooltip and interaction consistency

1. Replace 31 native `title=` tooltips with custom tooltip (if keeping `Tooltip.svelte`).
2. Fix page tab menu button keyboard reachability.
3. Add `aria-modal="true"` to UserAvatar settings panel.
4. Add Playwright tests for new behavior.

### Wave 5: Optional consistency pass

Only if earlier waves stay small and safe:

- Hard-coded color → CSS variable migration
- Spacing token cleanup (raw px → `--space-*`)
- Border-radius cleanup (add `8px` to scale or convert)
- Breakpoint normalization (consolidate to 3-4 values)
- Clipboard helper consolidation (13 sites → shared utility)
- localStorage consolidation (20+ calls → persistence module)
- deepCopy cleanup (10+ instances → shared utility)
- Subtle list entry animations
- Line-height standardization

---

## Combined Backlog Checklist

### Wave 1

- [ ] Get `pnpm lint` green
- [ ] Remove unused `HeaderLink` type
- [ ] Remove unused `ParsedPDF` type
- [ ] Remove unused `masterId` parameter in `toggleMasterBit()`
- [ ] Decide keep/remove `Tooltip.svelte`
- [ ] Decide keep/remove `persistence.svelte.ts`
- [ ] Decide keep/remove `MenuPrimitive.svelte`
- [ ] Reclassify 3 `console.warn` → `console.error`

### Wave 2

- [ ] Add `@media (prefers-reduced-motion: reduce)` to `app.css`
- [ ] Wire `prefersReducedMotion` in `ToastContainer.svelte`
- [ ] Add reduced-motion fallback to `Modal.svelte`
- [ ] Add reduced-motion fallback to `CollapseWrapper.svelte`
- [ ] Add reduced-motion fallback to `Button.svelte`
- [ ] Review `LoginScreen.svelte` + background video motion
- [ ] Add `transition: transform` to chevron rotations
- [ ] Add transition to mode pill button state changes
- [ ] Normalize toast entry timing 280ms → 250ms
- [ ] Animate under-table SKU panel

### Wave 3

- [ ] Convert hardcoded font sizes to `--text-*` variables
- [ ] Reduce `--text-2xs` reliance
- [ ] Set minimum font sizes at narrow breakpoints
- [ ] Expand checkbox touch target (20px → 44px hit area)
- [ ] Expand quick action touch targets (26px → 44px)
- [ ] Expand modal close button (32px → 44px)

### Wave 4

- [ ] Replace 31 native `title=` tooltips (if keeping Tooltip.svelte)
- [ ] Fix page tab menu button keyboard access
- [ ] Add `aria-modal="true"` to UserAvatar settings panel
- [ ] Add Playwright tests for new behavior

### Wave 5 (optional)

- [ ] Migrate hardcoded colors to CSS variables
- [ ] Clean spacing values to `--space-*` scale
- [ ] Normalize border-radius to defined scale
- [ ] Consolidate breakpoints to 3-4 values
- [ ] Consolidate clipboard helpers (13 sites)
- [ ] Consolidate localStorage calls (20+ sites)
- [ ] Consolidate deepCopy patterns (10+ sites)
- [ ] Add subtle list entry animations
- [ ] Standardize line-heights
- [ ] Standardize callback prop naming
- [ ] Resolve `TODO` in `firestore.rules`
- [ ] Re-verify `pnpm build` in CI/Linux
