# CheatSheet-Svelte Modernization Tracker

> **Branch:** `feature/modernization-v2` (branched from `feature/build-mode`)
> **Rollback:** `git checkout feature/build-mode` or `git checkout pre-modernization-checkpoint`
> **Started:** 2026-03-08

---

## How This Works

Each step below is a small, focused change. After each step:

1. We run the relevant checks (`pnpm check`, `pnpm lint`, etc.)
2. If checks pass, we commit
3. If something breaks, we fix it before moving on
4. At the end of each Phase, we push and do a manual smoke test

---

## Phase 1: Foundation — Security, Lint, Quick Fixes

### Step 1.1: Security — Bump @sveltejs/kit

- [ ] Update `package.json`: `@sveltejs/kit` from `^2.49.1` → `^2.49.5`
- [ ] Run `pnpm install`
- [ ] Run `pnpm audit` — confirm 0 high/critical
- [ ] Run `pnpm check` — confirm no breakage
- [ ] **Commit**: "fix: bump @sveltejs/kit to patch CVEs"

### Step 1.2: Fix Lint Errors

- [ ] `BDMPanel.svelte` lines 29, 38, 47 — add comment in empty catch blocks
- [ ] `+page.svelte` line 3 — remove unused `browser` import
- [ ] Run `pnpm lint` — confirm 0 errors
- [ ] **Commit**: "fix: resolve all lint errors"

### Step 1.3: Nullish Coalescing Fix

- [ ] `userPrefs.svelte.ts` lines 52-60 — change `||` to `??` for 5 object-typed fields
- [ ] `userPrefs.svelte.ts` lines 336-340 — same fix in `importData()`
- [ ] Run `pnpm check`
- [ ] **Commit**: "fix: use ?? instead of || for object defaults in userPrefs"

### Step 1.4: Convert onMount → $effect (3 files)

- [ ] `+layout.svelte` — replace onMount with $effect, wrap boot in untrack()
- [ ] `ToastContainer.svelte` — replace onMount with $effect for reduced-motion listener
- [ ] `UserAvatar.svelte` — replace onMount with $effect for touch detection
- [ ] Run `pnpm check`
- [ ] **Smoke test**: App loads, toasts work, avatar tooltip works
- [ ] **Commit**: "refactor: convert onMount to $effect (Svelte 5 runes-only)"

### Phase 1 Gate

- [ ] `pnpm lint` — 0 errors
- [ ] `pnpm check` — 0 errors
- [ ] `pnpm build` — succeeds
- [ ] **Push branch**

---

## Phase 2: Data Integrity — Error UX, Data Derivation

### Step 2.1: Toast Warnings for Silent Errors

- [ ] `companies.svelte.ts` load() catch — add toast: "Could not load saved data"
- [ ] `companies.svelte.ts` save() catch — add toast for non-quota errors
- [ ] Run `pnpm check`
- [ ] **Commit**: "ux: surface toast warnings on data load/save failures"

### Step 2.2: Derive MASTER_GROUP_BITS

- [ ] `quickbooksExport.ts` — replace hardcoded object with derivation from packages.ts
- [ ] Run `pnpm check`
- [ ] **Smoke test**: Export QuickBooks CSV, compare output looks correct
- [ ] **Commit**: "refactor: derive MASTER_GROUP_BITS from packages.ts"

### Step 2.3: Panels Reactivity Fix

- [ ] `panels.svelte.ts` getState() — add didNormalize flag + spread trigger
- [ ] Run `pnpm check`
- [ ] **Commit**: "fix: trigger reactivity after panel state normalization"

### Step 2.4: Document SC-Turn Dual SKU

- [ ] `packages.ts` — add comment explaining BDM vs MS SKU context
- [ ] **Commit**: "docs: document SC-Turn dual SKU context (BDM vs MS)"

### Phase 2 Gate

- [ ] `pnpm check` — 0 errors
- [ ] `pnpm build` — succeeds
- [ ] **Smoke test**: Select SC-Turn in BDM mode, check sidebar SKU. Switch to MS, check SKU.
- [ ] **Push branch**

---

## Phase 3: Architecture — Boot, Sync, Persistence Coordination

### Step 3.1: Add New Types

- [ ] `types/index.ts` — add `BootPhase` and `SyncSessionState` types
- [ ] Run `pnpm check`
- [ ] **Commit**: "feat: add BootPhase and SyncSessionState types"

### Step 3.2: Boot Phase Coordinator

- [ ] Create `stores/bootPhase.svelte.ts` — centralized boot sequence
- [ ] Update `+layout.svelte` — use bootPhaseStore instead of inline IIFE
- [ ] Run `pnpm check`
- [ ] **Smoke test**: App boots normally, login works
- [ ] **Commit**: "feat: add boot phase coordinator"

### Step 3.3: Persistence Helper

- [ ] Create `stores/persistence.svelte.ts` — centralized localStorage I/O
- [ ] Run `pnpm check`
- [ ] **Commit**: "feat: add persistence utility for localStorage"

### Step 3.4: Sync Session Model

- [ ] Create `stores/syncSession.svelte.ts` — expanded sync states + reconnection
- [ ] Update `stores/sync.svelte.ts` — delegate status to syncSession
- [ ] Run `pnpm check`
- [ ] **Smoke test**: Login, make changes, verify sync. Disconnect WiFi, verify status changes. Reconnect, verify recovery.
- [ ] **Commit**: "feat: add sync session model with reconnection logic"

### Phase 3 Gate

- [ ] `pnpm check` — 0 errors
- [ ] `pnpm build` — succeeds
- [ ] **Smoke test**: Full login → edit → sync → logout flow
- [ ] **Push branch**

---

## Phase 4: UX/Accessibility — Menus, Keyboard, ARIA

### Step 4.1: Shared Menu Primitive

- [ ] Create `components/ui/MenuPrimitive.svelte`
  - Click-outside dismiss
  - Escape key with focus return
  - Arrow key navigation (Up/Down cycle through items)
  - Viewport clamping
- [ ] Run `pnpm check`
- [ ] **Commit**: "feat: add MenuPrimitive shared component"

### Step 4.2: CompanyPageBar Adoption

- [ ] Replace 3 inline menus (dropdown, actions, context) with MenuPrimitive
- [ ] Remove duplicated click-outside handler
- [ ] Run `pnpm check`
- [ ] **Smoke test**: All three menus open/close, arrow keys navigate, Escape closes
- [ ] **Commit**: "refactor: CompanyPageBar adopts MenuPrimitive"

### Step 4.3: Touch-Accessible Page Tab Menu

- [ ] Add small "..." button on page tabs (visible on hover/focus)
- [ ] Button opens same context menu as right-click
- [ ] Run `pnpm check`
- [ ] **Smoke test**: Hover over page tab, click "..." button, menu appears
- [ ] **Commit**: "a11y: add visible page tab menu button for touch/keyboard"

### Step 4.4: ARIA Enhancements

- [ ] Sync status dot: add `role="status"` + `aria-live="polite"`
- [ ] Kebab trigger: add `aria-pressed` for toggle state
- [ ] Remove mode toggle: add `aria-pressed`
- [ ] Run `pnpm check`
- [ ] **Commit**: "a11y: add aria-live sync status, aria-pressed toggles"

### Phase 4 Gate

- [ ] `pnpm check` — 0 errors
- [ ] `pnpm build` — succeeds
- [ ] **Smoke test**: Keyboard-only navigation through entire CompanyPageBar
- [ ] **Push branch**

---

## Phase 5: Quality — Fix Tests, Add Tests, CI

### Step 5.1: Fix Failing Playwright Tests

- [ ] Run tests headed to identify actual failures
- [ ] Update selectors/assertions to match current UI (Upgrades rename, BDM/MS toggle)
- [ ] Run `pnpm test` — all tests pass
- [ ] **Commit**: "test: fix Playwright tests for current UI"

### Step 5.2: Add Boot & Accessibility Tests

- [ ] Create `tests/boot-sequence.spec.ts` — fresh login, corrupted data, offline
- [ ] Create `tests/accessibility.spec.ts` — arrow keys, escape, focus return
- [ ] Run `pnpm test` — all pass
- [ ] **Commit**: "test: add boot sequence and accessibility tests"

### Step 5.3: CI Enhancement

- [ ] `.github/workflows/ci.yml` — add Playwright test step after build
- [ ] **Commit**: "ci: add Playwright tests to CI pipeline"

### Phase 5 Gate

- [ ] `pnpm lint` — 0 errors
- [ ] `pnpm check` — 0 errors
- [ ] `pnpm build` — succeeds
- [ ] `pnpm test` — all tests pass
- [ ] **Push branch**

---

## Final Checklist

- [ ] All 5 phases complete
- [ ] Full smoke test: boot → login → create company → add packages → switch pages → export QB → logout
- [ ] Keyboard-only walkthrough of main workflows
- [ ] PR from `feature/modernization-v2` → `main`

---

## Rollback Instructions

If anything goes catastrophically wrong at any point:

```bash
# Option 1: Go back to pre-modernization state
git checkout pre-modernization-checkpoint

# Option 2: Go back to feature/build-mode (unchanged)
git checkout feature/build-mode

# Option 3: Undo last commit on this branch
git reset --soft HEAD~1
```
