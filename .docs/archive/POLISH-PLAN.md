# Triple-A Polish Plan (Revised)

Focused, low-risk polish pass. Preserves density, minimizes file touches.

## Constraints

- **1080p no-scroll goal** - keep tight spacing
- **Reuse existing patterns** - no new component architectures
- **Priority files only** - ~15 files total
- **Targeted reduced-motion** - don't kill spinners
- **Fix bugs before polish** - P0 issues first

---

## Phase 0: State Persistence Fix (P0 BUG)

**Problem:** Package/panel selections don't survive page switches or reloads.

**Root Cause:** One-way data flow with no return path:

- `companiesStore` → `packagesStore` (load works)
- `packagesStore` → `companiesStore` (save missing)
- `panelsStore` never loaded at all

**Fix in `+page.svelte`:**

```typescript
// 1. Load BOTH stores on page state change
$effect(() => {
	const pageState = companiesStore.currentPageState;
	packagesStore.loadFromPageState(pageState);
	panelsStore.loadFromPageState(pageState); // ADD THIS
});

// 2. Save changes back to companiesStore
$effect(() => {
	const currentPage = companiesStore.currentPage;
	if (!currentPage) return;

	const newState: PageState = {
		packages: packagesStore.getPageState(),
		panels: panelsStore.getPageState()
	};

	// Guard against no-op saves to avoid reactive loops
	const previousState = companiesStore.currentPageState;
	if (JSON.stringify(previousState) !== JSON.stringify(newState)) {
		companiesStore.savePageState(currentPage.id, newState);
	}
});
```

**Files:**

- `src/routes/+page.svelte` - add bidirectional sync (import `panelsStore` + `PageState`)
- `src/lib/stores/packages.svelte.ts` - verify `getPageState()` works
- `src/lib/stores/panels.svelte.ts` - verify `getPageState()` works

---

## Phase 1: Touch Targets (P1 Accessibility)

**Problem:** Multiple elements below 24px minimum.

| Element                  | Current | Target                    |
| ------------------------ | ------- | ------------------------- |
| Checkbox                 | 12px    | 20px (with 24px hit area) |
| Chevron (mobile)         | 10px    | 16px (with 24px hit area) |
| Control buttons (mobile) | 14px    | 20px (with 24px hit area) |

**Pattern:** Keep visual size compact, expand clickable area:

```css
.small-button {
	/* Visual size */
	width: 20px;
	height: 20px;

	/* Expanded hit area */
	position: relative;
	overflow: visible;
}
.small-button::before {
	content: '';
	position: absolute;
	inset: -4px; /* Expands to 28px hit area */
}
```

**Files:**

- `src/lib/components/ui/Checkbox.svelte`
- `src/lib/components/layout/CompanyPageBar.svelte`
- `src/lib/components/panels/MaintenancePanel.svelte`

---

## Phase 2: Keyboard Accessibility (P1)

**Problem:** Dropdowns missing Escape/focus-return (Modal has it).

**Add to CompanyPageBar.svelte:**

```typescript
function handleKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape') {
		if (dropdownOpen) {
			closeDropdown();
			dropdownTriggerRef?.focus(); // Return focus
		}
		if (contextMenu) {
			closeContextMenu();
		}
	}
}
```

```svelte
<svelte:window onkeydown={handleKeydown} />

<!-- Add a ref on the trigger -->
<button bind:this={dropdownTriggerRef} ...>
```

**Files:**

- `src/lib/components/layout/CompanyPageBar.svelte`

---

## Phase 3: Micro Tokens (app.css)

Add density-preserving tokens without changing existing values yet.

```css
@theme {
	/* Micro spacing (preserve density) */
	--space-px: 1px;
	--space-0: 0.125rem; /* 2px */
	--space-0-5: 0.1875rem; /* 3px */
	--space-1: 0.25rem; /* 4px */
	--space-2: 0.5rem; /* 8px */
	--space-3: 0.75rem; /* 12px */
	--space-4: 1rem; /* 16px */

	/* Compact type scale */
	--text-2xs: 0.625rem; /* 10px */
	--text-xs: 0.6875rem; /* 11px */
	--text-sm: 0.75rem; /* 12px */
	--text-base: 0.8125rem; /* 13px */
	--text-lg: 0.875rem; /* 14px */
	--text-xl: 1rem; /* 16px */

	/* Timing */
	--duration-fast: 100ms;
	--duration-normal: 150ms;
	--duration-smooth: 200ms;
}
```

**File:** `src/app.css`

---

## Phase 4: Modal Pattern (4 files)

Reuse existing `Modal.svelte` with inline content. No new components.

**Files to Update:**

| File                      | Dialogs | Changes                                                         |
| ------------------------- | ------- | --------------------------------------------------------------- |
| `CompanyPageBar.svelte`   | 5       | Replace prompt/confirm                                          |
| `CompaniesModal.svelte`   | 3       | Avoid nested modal; use inline confirm or reuse top-level modal |
| `MaintenancePanel.svelte` | 2       | Replace prompt                                                  |
| `EditablePanel.svelte`    | 1       | Replace prompt                                                  |

**Verification:** Confirm `Modal.svelte` provides focus trap and ESC close behavior after replacing dialogs.

---

## Phase 5: Priority File Polish (~12 files)

Focus on user-visible core. Standardize spacing/typography using new tokens.

### Tier 1: Critical Path

| File                      | Focus                        |
| ------------------------- | ---------------------------- |
| `+page.svelte`            | Layout gaps, section spacing |
| `Header.svelte`           | Nav consistency              |
| `CompanyPageBar.svelte`   | Tab spacing, dropdown polish |
| `PackageTable.svelte`     | Header alignment             |
| `MaintenancePanel.svelte` | Item spacing                 |

### Tier 2: Row/Item Components (where spacing actually lives)

| File                | Focus                    |
| ------------------- | ------------------------ |
| `PackageRow.svelte` | Cell padding consistency |
| `MasterBit.svelte`  | Header/label spacing     |
| `SubBit.svelte`     | Checkbox alignment       |
| `LooseBit.svelte`   | Checkbox alignment       |
| `PanelItem.svelte`  | Item padding             |

### Tier 3: UI Primitives

| File            | Focus               |
| --------------- | ------------------- |
| `Button.svelte` | Consistent padding  |
| `Input.svelte`  | Label/field spacing |
| `Modal.svelte`  | Header/body spacing |

**Examples of what “standardize” means (Phase 5):**

- Padding/margins: convert arbitrary values (0.15/0.2/0.3rem) to micro tokens (`--space-0`, `--space-0-5`, `--space-1`).
- Font sizes: map 0.6–0.9rem to compact scale (`--text-xs` → `--text-lg`).
- Gaps: use `--space-0-5`/`--space-1` instead of raw values.

---

## Phase 6: Targeted Reduced Motion

Only disable decorative animations. Keep functional feedback.

```css
@media (prefers-reduced-motion: reduce) {
	/* Decorative - disable */
	.ambient-glow,
	.particle,
	.animate-shimmer,
	.logo-container::after {
		animation: none !important;
	}

	/* Entrance animations - instant */
	.mounted {
		transition: none !important;
	}

	/* Toasts - instant but visible */
	.toast {
		animation: none !important;
		opacity: 1 !important;
	}

	/* KEEP: spinners, focus rings, progress */
}
```

**Files:**

- `src/app.css`
- `src/lib/components/ui/ToastContainer.svelte`
- `src/lib/components/layout/LoginScreen.svelte`

---

## Execution Order

| Phase | Files | Risk   | Type          |
| ----- | ----- | ------ | ------------- |
| 0     | 3     | Medium | Bug fix       |
| 1     | 3     | Low    | Accessibility |
| 2     | 1     | Low    | Accessibility |
| 3     | 1     | None   | Additive      |
| 4     | 4     | Low    | Polish        |
| 5     | 13    | Medium | Polish        |
| 6     | 3     | Low    | Accessibility |

---

## Verification

After each phase:

```bash
pnpm check   # Type errors
pnpm lint    # Lint errors
pnpm build   # Build succeeds
```

Manual checks:

- [ ] **Phase 0:** Select bits, switch page, switch back - selections persist
- [ ] **Phase 0:** Select bits, reload page - selections persist
- [ ] **Phase 1:** Touch targets usable on mobile (test 375px)
- [ ] **Phase 2:** Escape closes dropdowns, focus returns to trigger
- [ ] **Phase 5:** 1080p viewport fits without scroll
- [ ] **Phase 6:** Reduced motion: spinners still work, toasts still visible
- [ ] **Phase 4:** Modal focus trap works; focus returns to trigger after close
- [ ] **Phase 0 (optional):** Add a simple dev-only check to confirm persistence across page switch
