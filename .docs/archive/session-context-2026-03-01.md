# Session Context — 2026-03-01

This doc captures decisions, verdicts, and context from the 2026-03-01 session
so future sessions don't lose ground. Read this alongside `source-of-truth-matrix.md`.

---

## What Was Decided This Session

### Tool Modes (How The App Is Used)

Three distinct modes — no user role enforcement, just different use cases:

1. **Import mode** — paste Salesforce dongle text → fills license view.
   - Maintenance specialists use it to build renewal estimates.
   - BDMs use it to visually see what the customer already has.
   - Import just maps what's in the license. No gating, no validation.

2. **"What's left to sell" view (not built yet)** — a button that shows everything
   NOT currently toggled on, with a short description per item. Upsell view for BDMs.
   No selections change. Pure read-only visibility.

3. **New build mode (not built yet)** — BDM builds a fresh quote from scratch.
   - Shows full package SKUs + module SKUs only. No maintenance SKUs.
   - Prerequisites enforced (see source-of-truth-matrix.md).

### SKU Panel Toggle (not built yet)

The right sidebar SKU panel needs a toggle:

- **Default: New-sale SKUs** — package + module SKUs, clearly labeled, easy to copy.
- **Toggle: Maintenance SKUs** — switches to maintenance codes for renewal estimates.

### New Build Gating Rules

All rules are documented in `source-of-truth-matrix.md`. Key corrections made this session:

- **HSM does NOT require iMach2D.** HSM only needs SC-Mill. (Previous docs had this wrong.)
- **Machine Simulation has NO entitlement gate.** It just needs SC-Mill like everything else in SC-Mill-Adv. (Previous docs invented an entitlement flag that doesn't exist.)
- **SC-Turn bits are always together** — SolidCAM Turning + Backspindle cannot be split or sold separately.
- **SC-Mill-Adv, SC-Mill-3D loose bits** can be sold individually OR as a package — all just need SC-Mill.
- **25M is all-or-nothing on new builds.** Cannot pick individual bits within the group.
- **Package toggle behavior:** SC-Mill toggle selects 25M + HSS together but they can be split after. SC-Turn cannot be split.
- **Additional modules** (Probe, Vericut, Wire EDM, EdgeTrim, Multiblade, Port, CIMCO, SC-4Op) have zero prerequisites — free to add.

### Pricing

- List prices from `Pricing Matrix 2026 1.xlsx` are captured in `source-of-truth-matrix.md` Section 7.
- No discount logic in the tool — list prices only.
- If the table and the workbook disagree, workbook wins.

---

## File Cleanup Done This Session

### Deleted

- `.docs/docs/cheatsheet-guardrails-tracker.md` — built with wrong context (HubSpot workflow, discounts, handoff). Superseded by source-of-truth-matrix.md.
- `.docs/docs/pricing-matrix-2026-workbook-facts.md` — pricing now in source-of-truth-matrix.md. Workbook is the real source.

### Kept

- `.docs/docs/source-of-truth-matrix.md` — THE reference for new build rules.
- `.docs/docs/plan.md` — cloud sync plan (userPrefs). Separate topic, still valid.
- `.docs/docs/archive/import-license-feature.md` — import feature reference. Accurate and needed.
- `.docs/docs/archive/logic.md` — import logic (license scenarios, profile handling, page naming). Accurate and needed.

### Still Needs Cleanup (not done yet — ran out of context)

- `.docs/docs/archive/TOAST_REFACTOR.md` — **DELETE. 100% implemented in code.**
- `.docs/docs/archive/USERAVATAR_REFACTOR.md` — **DELETE. 100% implemented in code.**
- `.docs/archive/MIGRATION-PLAN.md` — **DELETE. Migration complete.**
- `.docs/archive/PROGRESS.md` — **DELETE. Migration complete.**
- `.docs/archive/FIREBASE-GUIDE.md`, `PWA-GUIDE.md`, `SVELTEKIT-GUIDE.md`, `TAILWIND-V4-GUIDE.md`, `TYPESCRIPT-SVELTE.md`, `VITE-CONFIG.md`, `STACK-2026.md` — **DELETE ALL. Redundant with CLAUDE.md.**
- `.docs/archive/SPEC.md` — **KEEP.** Polish intent doc, Phases 1-6 still open.
- `.docs/archive/POLISH-PLAN.md` — **KEEP but trim Phase 0** (state persistence fix is done). Phases 1-6 still open:
  - Phase 1: Touch targets (checkbox 12→20px, chevron, control buttons)
  - Phase 2: Keyboard accessibility (Escape closes dropdowns, focus returns to trigger)
  - Phase 3: Micro tokens in app.css (spacing, type scale, timing vars)
  - Phase 4: Replace prompt/confirm dialogs with Modal.svelte (4 files)
  - Phase 5: Priority file spacing/typography polish (~13 files)
  - Phase 6: Targeted reduced motion in app.css + LoginScreen

---

## What Is Confirmed Done In Code

### Toast system (ToastContainer.svelte + toast.svelte.ts)

All 13 tasks from TOAST_REFACTOR.md are implemented:

- Subtle fly animation (x:24px, 280ms, quintOut/quintIn)
- No glow div, no icon pulse
- 2px progress bar, muted opacity gradients
- Durations: success/info=4s, warning=5s, error=6s (all using `??`)
- MAX_TOASTS=3 (smart drop — non-error first)
- Progress bar animation-duration set inline per toast
- Hover/focus-within pauses progress bar
- Tab visibility pauses all toasts (with HMR guard)
- animate:flip for smooth reordering

### UserAvatar (UserAvatar.svelte)

All 11 tasks from USERAVATAR_REFACTOR.md are implemented:

- Glass container with backdrop-filter
- Status-aware container (connected/syncing/error/disconnected) with correct styles
- Status-aware ring (faster spin on sync, paused on disconnect, red on error)
- Breathing animation when connected
- Icon glow on hover
- Sign-out button hover reveal with icon slide
- Settings button + popover panel (desktop hover, touch tap-reveal)
- Background video toggle wired to userPrefsStore
- Sync indicator scales in on appear
- Full reduced motion support

### State persistence (Phase 0 of POLISH-PLAN)

- `+page.svelte` loads both `packagesStore` and `panelsStore` from page state.
- Saves back bidirectionally with debounce and race condition guard.
- Done.

---

## Next Build Work (Priority Order)

1. **Finish doc cleanup** (delete the 9 files listed above)
2. **New build mode** — implement the build gating from source-of-truth-matrix.md
   - Add package-level master toggles to SC-Turn, SC-Mill-Adv, SC-Mill-3D
   - Enforce prerequisite rules (SC-Mill gate, iMach2D gate)
   - 25M all-or-nothing behavior
3. **SKU panel toggle** — new-sale vs maintenance toggle in right sidebar
4. **"What's left to sell" button** — show unselected items with descriptions
5. **Polish Phases 1-6** — touch targets, keyboard, tokens, modals, spacing, reduced motion
