# Visual Upgrade Plan

A phased, screen-by-screen polish pass. **Functionality is preserved exactly** — this is purely a visual + code-quality lift. Each phase ends with a smoke test before commit.

> Audience: BDMs (sole users). Aesthetic target: feels expensive, calm, confident. Less "web app", more "tool I'm proud to demo to a customer."

---

## Guiding principles

1. **Functionality first** — if a change risks behavior, skip or flag it.
2. **Don't reflow** — narrow viewport never stacks the sidebar (per binding rule).
3. **Full visuals always** — never gate motion behind `prefers-reduced-motion` (per binding rule).
4. **One source of truth for design tokens** — colors, radii, shadows, motion all live in `src/app.css`. Anything new gets added there, not hardcoded.
5. **Three-layer rule** — when touching backgrounds, always check `html`/`body`, the `.video-bg` container, and the `::after` overlay (per memory).
6. **Group commits by phase** (per user preference).
7. **Smoke test between phases** before pushing.

---

## Approach (recommended phasing)

| Phase | Surface                                                                           | Why this order                                                       |
| ----- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1     | Login screen                                                                      | First impression. Self-contained, low risk.                          |
| 2     | Boot/loading skeleton                                                             | Pairs with Phase 1 — same entry experience.                          |
| 3     | Background system + global tokens                                                 | Foundation everything else sits on. Refine once, benefit everywhere. |
| 4     | Header (logo, nav, user)                                                          | Persistent on every screen.                                          |
| 5     | Company/Page bar                                                                  | Persistent. Dense interaction zone.                                  |
| 6     | Package table (Master/Sub/Loose bits)                                             | Core surface. Highest visual weight.                                 |
| 7     | SKU + Quote panels (BDM / Maintenance / NewSale)                                  | Secondary read surface.                                              |
| 8     | Calculator                                                                        | Discrete widget.                                                     |
| 9     | Modals (Sales Tax, Current Products, Companies, What's Left, Import License)      | Final polish for overlay surfaces.                                   |
| 10    | Micro-interactions sweep (toasts, tooltips, focus rings, skeletons, empty states) | Final unifying pass.                                                 |

Each phase: audit details (below) → make changes → I demo → you smoke test in browser → commit phase.

---

## Phase 1 — Login Screen

**File:** `src/lib/components/layout/LoginScreen.svelte`

### What's there now

- Smoked-glass card centered on video background
- 3 ambient blob glows (gold, red, gold) drifting on long loops
- 12 rising gold/warm particles with stagger and drift
- SolidCAM logo pinned top, breathing red glow underneath
- Header decoration: gold bracket-icon between two fade lines
- "Welcome" gradient title (white → gold)
- Single name input + remember-me checkbox (tooltip)
- Gold "Start" CTA with arrow, transitions to spinner → green check on success
- 3-dot footer + "SolidCAM CheatSheet" bottom brand
- Offline banner (top)
- Shake animation on input error
- Mount-in animation (fade + lift) on logo, card, bottom brand

### Strengths

- Lots of layered atmosphere already
- Good motion vocabulary (mount, breathe, shake, success pop)
- Accessible (autofocus, autocomplete, aria-labels, focus rings)

### Polish checklist

- [ ] **Logo placement** — currently `top: 7%` with absolute positioning + a hardcoded right-shifted glow (`right: -20%`). Center the glow under the logo properly so it doesn't drift right at narrow widths.
- [ ] **`mix-blend-mode: lighten` on logo** — works on dark bg but can desaturate on lighter video frames. Validate, or swap to drop-shadow only.
- [ ] **Title hierarchy** — "Welcome" + "Enter your name to get started" feels generic. Consider a 2-line setup that names the tool and signals the purpose ("SolidCAM CheatSheet" / "Sign in to start a quote") so the first frame is self-explanatory.
- [ ] **Decorative bracket icon** — meaning is unclear (looks like a tag/label). Either pick something brand-meaningful (SolidCAM mark, key, briefcase) or remove and let the gradient title carry the moment.
- [ ] **Input row alignment** — checkbox `padding-top: 0.65rem` is a magic number to align with input center. Tie it to the input's actual padding so it stays aligned at any size.
- [ ] **Remember-me affordance** — bare checkbox with tooltip-only label means the label only appears on hover. Add a visible "Remember me" label next to the box.
- [ ] **Submit button width** — `min-width: 160px` + `width: 100%` is fine, but the success-state green is jarring against the card. Try a softer celebration (gold → gold-with-check, then route).
- [ ] **Footer 3-dots** — purely decorative, slightly arbitrary. Either make them semantic (step indicator) or remove.
- [ ] **Particles count** — 12 is fine on desktop, may feel busy on mobile. Reduce to 6 below 480px.
- [ ] **Ambient glow positions** — `top: -100px; left: -100px;` etc. Verify they don't get cropped on ultrawide or short-viewport laptops.
- [ ] **Offline banner** — currently red-tinted box. Brand it with a small Wi-Fi-off icon already present, but make the copy gentler ("Working offline — your changes will sync when you reconnect").
- [ ] **Bottom brand** — "SolidCAM CheatSheet" in low-opacity grey. Could promote to a tasteful version chip or remove entirely (logo already brands it).
- [ ] **Reduce inline magic numbers** — many one-off colors like `rgba(212, 175, 55, 0.45)` could reuse `--color-solidcam-gold` with opacity tokens.
- [ ] **Code: `LoginScreen.svelte` is 700 lines** — split CSS into a `<style>` of named blocks (or extract `LoginAtmosphere.svelte` for particles + glows) so the script + markup is the focus.

---

## Phase 2 — Boot / Loading Skeleton

**File:** `src/routes/+layout.svelte` (`.skeleton-card`, `.boot-error-card`)

### What's there now

- Centered glass card with brand wordmark + skeleton placeholders for avatar, title, subtitle, input, button
- Boot error card with "Try again" gold button

### Polish checklist

- [ ] **Skeleton geometry** — placeholders don't match the login card geometry exactly (one input, one button, no checkbox, no dots). Make them mirror the login layout so the boot → login transition is seamless (no jump).
- [ ] **Brand wordmark "CheatSheet"** — different from the login title. Pick one wordmark style and use it both places (or drop it from boot — logo image is enough).
- [ ] **Shimmer pace** — verify `animate-shimmer` in app.css is gentle, not strobe-y, on slow boots.
- [ ] **Boot error empathy** — copy is "Unable to start" / "Something went wrong during startup." Consider naming what to try ("Check your connection and try again. If this persists, refresh the page.").
- [ ] **Error icon** — currently no icon. A small alert-circle in gold would match the brand language.

---

## Phase 3 — Background system + global tokens

**Files:** `src/app.css`, `src/routes/+layout.svelte` (`.video-bg`)

### What's there now

- `Particle.mp4` looping muted video, fixed full-bleed at `z-index: -10`
- Linear-gradient `::after` overlay for legibility (40% → 20% → 50%)
- Tokens for glass, tile, modal, chip surfaces; gold/red brand; semantic colors; spacing & type scales

### Polish checklist

- [ ] **Video performance** — pause when tab is hidden (already partial via visibilitychange) and when user toggles `userPrefsStore.backgroundVideoPaused` (already done — verify it works on Safari).
- [ ] **Static fallback image** — if video fails to load (no decode, no autoplay permission), fall back to a still poster so the app never sits on solid black.
- [ ] **Overlay tuning** — current 40/20/50 gradient can be too dark in the center where content sits. Try a vignette (darker edges, lighter center) so content tiles "lift" off the background.
- [ ] **Token cleanup** — `--color-bg-card` and `--color-glass` overlap; `--color-surface-dark` and `--color-bg-primary` are identical. Consolidate.
- [ ] **Motion timing tokens** — `--ease-fast` / `--ease-smooth` / `--ease-bounce` are all just `ease`. Define real cubic-beziers (`cubic-bezier(0.4, 0, 0.2, 1)` etc) so animations feel intentional.
- [ ] **Type scale** — `--text-2xs: 0.625rem` (10px) is below readable for most BDMs at arm's length. Audit where it's used; promote to 11–12px where possible.
- [ ] **Scrollbar** — current 8px gold-on-hover is good. Verify it doesn't conflict with table scroll on narrow viewports.

---

## Phase 4 — Header

**File:** `src/lib/components/layout/Header.svelte`

### What's there now

- SolidCAM logo (left)
- 5 nav links with colored icons (Main Support, Ticket Site, University, Academy, ChatBot)
- Operations + CF Tools dropdown buttons
- User avatar with sync status + logout

### Polish checklist

- [ ] **Visual density** — header has many entry points. Group: brand | external links | tools | user. Add subtle dividers between groups.
- [ ] **Icon set** — mixed colors per link is loud. Try a single muted icon style with a colored dot indicator instead.
- [ ] **Dropdown buttons** — `Operations` and `CF Tools` are plain text. Add a chevron + treat them as primary tool entries, distinct from external links.
- [ ] **User avatar** — verify sync status indicator (online/offline/syncing) is visible without hover.
- [ ] **Sticky behavior** — confirm header stays put or scrolls naturally based on intent.

> _This section will be expanded with full audit when Phase 4 begins._

---

## Phase 5 — Company / Page Bar

**File:** `src/lib/components/layout/CompanyPageBar.svelte` (~50+ lines, dense)

### What's there now

- Current company display with dropdown (search, recents, all companies, favorite)
- Page tabs (rename, delete, copy)
- Cluster buttons: Add / Remove / Order / Reset (gold/red gradients in app.css)
- Import License button
- New company / new page dialogs

### Polish checklist

- [ ] **Cluster button visual hierarchy** — currently active states use gold/red gradients. Verify the inactive states read as buttons, not chips.
- [ ] **Tab affordance** — page tabs need a clearer "active" indicator (underline, glow, or filled bg) and a clear hover state for inactive ones.
- [ ] **Dropdown polish** — consider a search-with-instant-filter pattern with a "Recent" pinned section.
- [ ] **Inline rename UX** — confirm the read-only-customer rule is visible (not just enforced silently).

> _Full audit when Phase 5 begins._

---

## Phase 6 — Package Table

**Files:** `PackageTable.svelte`, `MasterBit.svelte`, `SubBit.svelte`, `LooseBit.svelte`, `PackageRow.svelte`

### Polish checklist (preview)

- [ ] **Table grain** — define a single rhythm: row height, sub-row indent, divider color, hover/selected/disabled states.
- [ ] **Bit selection visual language** — make selected/unselected/locked obvious from 4 ft away.
- [ ] **Header row** — gold accent is good; verify contrast at narrow viewport.
- [ ] **Empty-state** — what does the table look like with zero selections? Should invite, not feel broken.

> _Full audit when Phase 6 begins._

---

## Phase 7 — SKU + Quote Panels

**Files:** `BDMPanel.svelte`, `MaintenancePanel.svelte`, `NewSalePanel.svelte`, `Panel.svelte`, `PanelItem.svelte`, `EditablePanel.svelte`

### Polish checklist (preview)

- [ ] **Mode pill (BDM | MS)** — gold vs blue is good. Make the transition between modes smoother (cross-fade not snap).
- [ ] **Currency rendering** — confirm `font-mono` + `tabular-nums` is applied everywhere money appears.
- [ ] **Editable cells** — clear hover affordance, clean save/cancel pattern.

> _Full audit when Phase 7 begins._

---

## Phase 8 — Calculator

**File:** `src/lib/components/calculator/Calculator.svelte`

### Polish checklist (preview)

- [ ] **Tile rhythm** — match the rest of the sidebar tiles in spacing and header style.
- [ ] **Input ergonomics** — currency input with live formatting.
- [ ] **Result clarity** — answer should feel like the destination, not just another row.

> _Full audit when Phase 8 begins._

---

## Phase 9 — Modals

**Files:** `Modal.svelte` (base), `SalesTaxModal.svelte`, `CurrentProductsModal.svelte`, `CompaniesModal.svelte`, `WhatLeftModal.svelte`, `ImportLicenseModal.svelte`

### Polish checklist (preview)

- [ ] **Backdrop** — single shared backdrop style (blur + dim).
- [ ] **Title bar** — single icon + title pattern across all modals.
- [ ] **Footer actions** — primary/secondary button placement consistent (primary right).
- [ ] **Close affordance** — top-right X always reachable; ESC always closes.
- [ ] **Modal sizes** — `default | wide | full` exist; verify each is used appropriately.

> _Full audit when Phase 9 begins._

---

## Phase 10 — Micro-interactions sweep

**Files:** `Toast`, `Tooltip`, `Skeleton`, `Checkbox`, `CollapseWrapper`, `Button`, `Input` (+ focus rings everywhere)

### Polish checklist (preview)

- [ ] **Toast** — entrance, stack behavior, dismiss timing, type colors.
- [ ] **Tooltip** — singleton portal good; verify positioning at viewport edges.
- [ ] **Skeleton** — single shimmer style across the app.
- [ ] **Checkbox** — bounce on toggle is good; verify keyboard activation.
- [ ] **Collapse** — single timing/easing across the app.
- [ ] **Button hover** — `translateY(-2px)` is universal; make sure it's never used inside fixed-height rows where it pops out of layout.
- [ ] **Input focus** — gold ring + soft glow is good; standardize across all editable surfaces.
- [ ] **Focus-visible** — already global; spot-check every interactive element.

---

## What I'll touch (and won't)

✅ I will:

- Edit visual styling (CSS, classes, motion, layout)
- Refactor large component files into focused pieces if it helps readability — without changing behavior
- Consolidate design tokens in `app.css`
- Tighten copy in headings, hints, errors

🚫 I won't (without explicit go-ahead):

- Change any data model, store API, or sync logic
- Touch the SolidCAM v1 site (`main` branch)
- Add new features or remove existing ones
- Add or change tests
- Change keyboard shortcuts or routing
