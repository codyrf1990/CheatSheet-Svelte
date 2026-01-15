# CheatSheet SvelteKit - Progress Tracker

Migration from vanilla JS to SvelteKit 2 + Svelte 5.

---

## Phase 1: Project Setup

**Status:** Complete
**Started:** 2026-01-15
**Completed:** 2026-01-15

### Completed

- [x] Initialize SvelteKit project with `npx sv create`
  - Files: `package.json`, `svelte.config.js`, `tsconfig.json`

- [x] Install all dependencies
  - Runtime: `firebase`, `zod`
  - Dev: `@tailwindcss/vite`, `tailwindcss`, `@vite-pwa/sveltekit`
  - Linting: `eslint`, `prettier`, `eslint-plugin-svelte`, `typescript-eslint`

- [x] Configure path aliases ($components, $stores, $firebase, $types, $data, $utils)
  - Files: `svelte.config.js`

- [x] Set up Vite with correct plugin order (tailwindcss → sveltekit)
  - Files: `vite.config.ts`

- [x] Configure ESLint 9 flat config with Svelte support
  - Files: `eslint.config.js`

- [x] Configure Prettier with Tailwind class sorting
  - Files: `.prettierrc`

- [x] Set up Tailwind v4 CSS-first config with SolidCAM design tokens
  - Files: `src/app.css`
  - Tokens: solidcam-red, solidcam-gold, surface colors, glass effects, shadows

- [x] Create base layout with video background
  - Files: `src/routes/+layout.svelte`

- [x] Update app.html with fonts (Inter, JetBrains Mono) and meta tags
  - Files: `src/app.html`

- [x] Create placeholder main page with test styling
  - Files: `src/routes/+page.svelte`

- [x] Set up security headers (CSP, X-Frame-Options, etc.)
  - Files: `src/hooks.server.ts`

- [x] Copy static assets from original app
  - Files: `static/video/Particle.mp4`, `static/img/solidcam-logo.svg`, `static/favicon.png`

- [x] Create directory structure for lib
  - Directories: `src/lib/{components,stores,firebase,types,data,utils}`
  - Component subdirs: `ui`, `layout`, `packages`, `panels`, `calculator`, `background`

- [x] Define core TypeScript interfaces
  - Files: `src/lib/types/index.ts`
  - Types: Company, Page, PageState, Package, PackageState, Panel, CloudUserData, etc.

- [x] Create environment variable template
  - Files: `.env.example`

- [x] Create CLAUDE.md project guide
  - Files: `CLAUDE.md`

### Verification

- `pnpm check` - 0 errors, 0 warnings
- `pnpm build` - Success (client ~75KB gzipped)
- `pnpm dev` - Works at http://localhost:5173

---

## Phase 2: Core Components

**Status:** Complete
**Started:** 2026-01-15
**Completed:** 2026-01-15

### Completed

- [x] Toast store (runes-based, adapted from TOS Parser)
  - Files: `src/lib/stores/toast.svelte.ts`
  - Features: success/error/warning/info, auto-dismiss, pause/resume for WCAG

- [x] ToastContainer component
  - Files: `src/lib/components/ui/ToastContainer.svelte`
  - Features: Fixed bottom-right, fly/fade transitions, type-based icons

- [x] Button component (copied from TOS Parser)
  - Files: `src/lib/components/ui/Button.svelte`
  - Variants: primary, gold, orange, ghost, danger
  - Sizes: sm, md, lg

- [x] Input component (copied from TOS Parser)
  - Files: `src/lib/components/ui/Input.svelte`
  - Features: Label, error state, gold focus accent, $bindable value

- [x] SmokedGlassCard component (copied from TOS Parser)
  - Files: `src/lib/components/ui/SmokedGlassCard.svelte`
  - Features: Padding variants, glow options, glass effect

- [x] Modal component (copied from TOS Parser)
  - Files: `src/lib/components/ui/Modal.svelte`
  - Features: Focus trap, escape key, backdrop click, size variants

- [x] Checkbox component (new - tri-state)
  - Files: `src/lib/components/ui/Checkbox.svelte`
  - Features: checked/indeterminate/disabled states, gold accent

- [x] CloudSyncIndicator component (new)
  - Files: `src/lib/components/layout/CloudSyncIndicator.svelte`
  - Features: Status indicator (connected/syncing/error), username display

- [x] Header component (new - CheatSheet specific)
  - Files: `src/lib/components/layout/Header.svelte`
  - Features: Logo, title, nav links, operations dropdown, cloud sync

- [x] Barrel exports for clean imports
  - Files: `src/lib/components/ui/index.ts`, `src/lib/components/layout/index.ts`

- [x] Updated root layout with ToastContainer
  - Files: `src/routes/+layout.svelte`

- [x] Updated main page with Header and component showcase
  - Files: `src/routes/+page.svelte`

### Verification

- `pnpm check` - 0 errors, 0 warnings
- `pnpm build` - Success (client ~30KB gzipped)
- All components render correctly
- Modal focus trap works
- Toast notifications appear and dismiss
- Header nav links open in new tabs

### Remaining for Phase 2 (deferred)

- [ ] Sidebar component (needed for panels)
- [ ] CompanySelector component (needed for page system)
- [ ] ParticleBackground component (video already in layout)

---

## Phase 3: State Management

**Status:** Complete
**Started:** 2026-01-15
**Completed:** 2026-01-15

### Completed

- [x] Sync store (runes-based)
  - Files: `src/lib/stores/sync.svelte.ts`
  - Features: username validation/normalization, status tracking, localStorage persistence
  - localStorage key: `solidcam-sync-username`

- [x] Companies store (runes-based) - Main data store
  - Files: `src/lib/stores/companies.svelte.ts`
  - Features: Company CRUD, page CRUD, favorites, recent tracking, search
  - localStorage keys: `solidcam-companies`, `solidcam-current-company-id`, `solidcam-favorites`, `solidcam-recent`
  - Migration: Handles legacy `solidcam-pages-data` and `solidcam-cheatsheet-state` formats
  - Export/import for cloud sync, change handler for external sync

- [x] Packages store (runes-based)
  - Files: `src/lib/stores/packages.svelte.ts`
  - Features: Bit selection toggle, master bit logic (select all/none), custom bits, ordering
  - Syncs with PageState from companies store

- [x] Panels store (runes-based)
  - Files: `src/lib/stores/panels.svelte.ts`
  - Features: Item add/remove/toggle, reordering, removed items tracking, restore
  - Syncs with PageState from companies store

### Verification

- `pnpm check` - 0 errors, 0 warnings
- `pnpm build` - Success

### Notes

- Toast store was already created in Phase 2
- User store not needed (username handled by sync store)
- All stores follow runes pattern from `toast.svelte.ts`
- localStorage keys match original app for migration compatibility

---

## Phase 4: Feature Components

**Status:** Complete
**Started:** 2026-01-15
**Completed:** 2026-01-15

### Completed

- [x] Data migration (included from Phase 5)
  - Files: `src/lib/data/packages.ts`, `src/lib/data/panels.ts`, `src/lib/data/index.ts`
  - 5 packages with groups (master bits) and looseBits
  - 3 panels: standalone-modules, maintenance-skus, solidworks-maintenance

- [x] LooseBit component (standalone bit checkbox)
  - Files: `src/lib/components/packages/LooseBit.svelte`
  - Features: Checkbox, click-to-copy, keyboard accessible, draggable

- [x] SubBit component (bit under master group)
  - Files: `src/lib/components/packages/SubBit.svelte`
  - Features: Same as LooseBit, linked to masterId for drag-drop scoping

- [x] MasterBit component (expandable group with tri-state checkbox)
  - Files: `src/lib/components/packages/MasterBit.svelte`
  - Features: Tri-state checkbox (checked/indeterminate), expand/collapse, renders SubBits

- [x] PackageRow component (single table row)
  - Files: `src/lib/components/packages/PackageRow.svelte`
  - Features: Package code, maintenance SKU, bits layout, click-to-copy

- [x] PackageTable component (main table)
  - Files: `src/lib/components/packages/PackageTable.svelte`
  - Features: Table with header, iterates packages with PackageRow

- [x] PanelItem component (single panel item)
  - Files: `src/lib/components/panels/PanelItem.svelte`
  - Features: Click-to-copy, optional checkbox, remove button, draggable

- [x] Panel component (collapsible container)
  - Files: `src/lib/components/panels/Panel.svelte`
  - Features: Title, collapse toggle, +/- controls for editable panels

- [x] EditablePanel component (panel with store integration)
  - Files: `src/lib/components/panels/EditablePanel.svelte`
  - Features: Drag-drop reordering, add/remove items, syncs with panelsStore

- [x] Calculator component
  - Files: `src/lib/components/calculator/Calculator.svelte`, `src/lib/components/calculator/index.ts`
  - Features: Currency display, +/-/×/÷/%, quick percent buttons (5-30%), click-to-copy

- [x] Barrel exports
  - Files: `src/lib/components/packages/index.ts`, `src/lib/components/panels/index.ts`

- [x] Main page updated with all components
  - Files: `src/routes/+page.svelte`
  - Layout: Package table (main), sidebar with panels + calculator

### Verification

- `pnpm check` - 0 errors, 0 warnings
- `pnpm build` - Success (client ~39KB gzipped)
- Package table renders 5 packages
- Checkboxes toggle with store persistence
- Master bit tri-state works correctly
- Click-to-copy shows toast notifications
- Calculator performs calculations correctly
- Responsive layout (sidebar stacks on mobile)

### Notes

- Data migration (Phase 5) was included in Phase 4 since components needed the data
- Accessibility: All interactive elements have keyboard handlers
- Drag-drop uses HTML5 Drag and Drop API (no external library)

---

## Phase 5: Data Migration

**Status:** Complete (merged into Phase 4)

Data migration was completed as part of Phase 4 since the feature components required the data files to function.

---

## Phase 6: Firebase Integration

**Status:** Complete
**Started:** 2026-01-15
**Completed:** 2026-01-15

### Completed

- [x] Firebase client initialization
  - Files: `src/lib/firebase/client.ts`, `src/lib/firebase/index.ts`
  - Lazy singleton pattern with SSR safety
  - Multi-tab support via `persistentMultipleTabManager()`

- [x] Firebase sync operations
  - Files: `src/lib/firebase/sync.ts`
  - Load/save user data to Firestore (`users/{normalizedUsername}`)
  - Debounced writes (900ms) to reduce Firestore costs
  - Merge strategy on writes for conflict handling

- [x] Cloud sync store integration
  - Files: `src/lib/stores/sync.svelte.ts`
  - Connect/disconnect with username
  - Auto-sync: local changes trigger cloud save
  - Status tracking: disconnected/connecting/connected/syncing/error

- [x] SyncModal UI component
  - Files: `src/lib/components/ui/SyncModal.svelte`
  - Username input with validation
  - Connected state shows username and last sync time
  - Error display

- [x] Page integration
  - Files: `src/routes/+page.svelte`
  - Store initialization on mount
  - Sync modal opens from Header CloudSyncIndicator

- [x] Environment configuration
  - Files: `.env` (Firebase credentials)

- [x] CompanyPageBar component (Company/Page system UI)
  - Files: `src/lib/components/layout/CompanyPageBar.svelte`, `src/lib/components/layout/index.ts`
  - Compact header bar design (user chose over original UI)
  - Company dropdown with search and recents (no favorites per user request)
  - Page tabs with inline rename on double-click
  - Right-click context menus for company/page actions
  - Sync status indicator integrated

- [x] Page integration updated
  - Files: `src/routes/+page.svelte`
  - CompanyPageBar positioned below Header
  - Full company/page switching functionality

### Verification

- `pnpm check` - 0 errors, 0 warnings
- `pnpm build` - Success (client ~118KB gzipped including Firebase)

### Notes

- Username-based identification (no authentication)
- Firestore document path: `users/{normalizedUsername}`
- Schema version tracking for future migrations
- Offline support via Firestore's persistent local cache
- CompanyPageBar: User requested cleaner "triple A" design instead of original cluttered UI

---

## Phase 7: PWA & Polish

**Status:** In Progress
**Started:** 2026-01-15

### Completed

- [x] Triple-A UI Design System Upgrade (from machine-research-ui)
  - Files: All UI components upgraded

  **Button.svelte:**
  - Shine effect on hover
  - Premium layered shadows with inset highlights
  - 145° gradient backgrounds
  - Hover lift (`translateY(-3px) scale(1.02)`)
  - Active press effect

  **Input.svelte:**
  - Floating label pattern
  - Focus glow pulse animation
  - Animated border on focus
  - Error state animations

  **Modal.svelte:**
  - Border shimmer animation
  - Corner accent decorations (no gold lines/diamond per user request)
  - Close button rotation on hover

  **SmokedGlassCard.svelte:**
  - Enhanced 145° gradient glass effect
  - Hover lift effect with shine
  - Gold/red/accent glow variants
  - Backdrop blur 12px

  **ToastContainer.svelte:**
  - Staggered fly-in animations with `backOut` easing
  - Icon pulse animations
  - Progress bar with gradient colors
  - Shine effect animation

  **CompanyPageBar.svelte:**
  - Premium glass background
  - Dropdown fade-in animation
  - Button shine effects
  - Context menu scale animation
  - Border shimmer animation (20s cycle)

  **app.css:**
  - Dark luxury color palette (#0a0a0f base)
  - Premium scrollbar styling (gold hover)
  - Enhanced focus states with glow
  - Text selection styling
  - Global animations (fadeIn, pulse-gold, shimmer, checkBounce, subtleFloat, glowPulse)
  - Reduced motion support

- [x] Login Screen Implementation
  - Files: `src/lib/components/layout/LoginScreen.svelte`
  - 3 ambient glow effects (gold/red radial gradients)
  - 6 rising particle animations
  - Centered SmokedGlassCard with accent glow
  - Decorative header (lock icon, gradient lines)
  - Gradient title "Welcome" (white → gold)
  - Mount entrance animations
  - Bottom branding

- [x] User Avatar Component
  - Files: `src/lib/components/layout/UserAvatar.svelte`
  - Spinning conic gradient ring (gold → red → gold, 8s)
  - User icon in center
  - Username display with sign-out link
  - Sync status indicator

- [x] Login Gate in Layout
  - Files: `src/routes/+layout.svelte`
  - Shows LoginScreen when not authenticated
  - Shows main app when logged in
  - Loading spinner during initialization

- [x] **Header.svelte - Machine Research UI Match** (2026-01-15)
  - Files: `src/lib/components/layout/Header.svelte`
  - 2-row navigation layout (Row 1: external links, Row 2: dropdowns)
  - Short labels matching Machine Research: Main Support, Ticket Site, University, Academy, ChatBot
  - Color mapping: Red → Red → Purple → Blue → Orange
  - Icons on all nav links (support, ticket, video, book, chat)
  - External link indicator (arrow slides in on hover)
  - Gray dropdown buttons (Operations, CF Tools) that turn gold when active
  - Title glow (radial gold gradient behind title)
  - Border shimmer animation (25s gold/red gradient)
  - Responsive grid layout matching Machine Research

- [x] **Logo.svelte Component** (2026-01-15)
  - Files: `src/lib/components/layout/Logo.svelte`
  - Responsive width: `clamp(180px, 22vw, 280px)`
  - Breathing red glow animation (3s pulse)
  - Drop shadows and lighten blend mode
  - Hover scale effect (1.02)

- [x] **CF Tools Dropdown** (2026-01-15)
  - Files: `src/routes/+page.svelte`
  - Links: TOS Tracker, Opp Tracker, Packages & Maintenance, Machine Catalogue
  - External link icons on items
  - Gold hover state with padding shift

- [x] **Operations Dropdown Updated** (2026-01-15)
  - Files: `src/routes/+page.svelte`
  - Gray button style (not gold)
  - Items: Sales Tax Guide, Current Products (matching Machine Research)
  - Icons on menu items

- [x] **UI Refinement - Match TOS Parser "Triple-A" Quality** (2026-01-15)
  - Files: Multiple component updates

  **Logo.svelte:**
  - Replaced SVG with PNG from TOS Parser (white subtext version)
  - File: `static/images/solidcam-logo.png`

  **+layout.svelte:**
  - Removed heavy 80-95% overlay on background
  - Added LuxuryBackground pattern (subtle base gradient at z-index -2)
  - Video now plays at full visibility (no opacity reduction)

  **Button.svelte:**
  - Changed to pill shape (`border-radius: 9999px`)
  - Faster transitions (`150ms ease` instead of `250ms cubic-bezier`)
  - Simpler hover (`translateY(-2px)` + brightness, no scale)
  - Removed shine overlay effect
  - 2-stop gradients (135deg) instead of 3-stop (145deg)
  - Lighter font-weight (500 vs 600)

  **Input.svelte:**
  - Removed floating label pattern (static label above)
  - Removed animated border with mask-composite
  - Removed pulsing glow animation
  - Simpler focus state with box-shadow ring
  - Faster transitions (150ms ease)

  **SmokedGlassCard.svelte:**
  - Reduced blur (8px vs 12px)
  - Subtler border (0.04 vs 0.06 opacity)
  - Simpler 2-stop gradient (135deg)
  - Darker shadow (0.4 vs 0.35 opacity)
  - Removed shine effect and hoverable state
  - Reduced glow variants (3 vs 5)

  **Modal.svelte:**
  - Removed border shimmer animation
  - Removed corner accent decorations
  - Plain white title (no gradient)
  - Simpler close button (no rotation or glow)
  - Reduced overlay blur (4px vs 8px)
  - Single powerful shadow vs layered

  **app.css:**
  - Simplified transitions to use `ease` instead of `cubic-bezier`
  - Darker shadow values for more depth (0.4-0.6 opacity)
  - Reduced glass blur (8px)
  - Better text-muted contrast (#9ca3af for WCAG AA)

### Verification

- `pnpm check` - 0 errors, 0 warnings
- `pnpm build` - Success (client ~121KB gzipped)

- [x] **UI Compactness Fixes - Match Original CheatSheet** (2026-01-15)
  - Goal: Everything visible at 1920x1080 without scrolling

  **Key Discovery:** Original CSS uses **multi-level -20% compaction system**
  - Base values reduced by 20% (e.g., 0.24rem → 0.192rem)
  - Maintenance panels use DOUBLE reduction (-20% of -20%)

  **EditablePanel.svelte:**
  - Changed to 2-column CSS grid layout
  - `grid-template-columns: repeat(2, minmax(0, 1fr))`
  - Gap: `0.176rem` (matches original -20% pattern)

  **PanelItem.svelte:**
  - Pill shape: `border-radius: 999px`
  - Compact padding: `0.192rem 0.32rem`
  - Smaller font: `0.7rem` (was 0.8125rem)
  - Border on text: `1px solid rgba(255, 255, 255, 0.12)`

  **PackageTable.svelte:**
  - Red gradient table header: `linear-gradient(135deg, #c8102e, #8b0000)`
  - Larger letter-spacing: `0.12em`
  - Removed header row with buttons (moved to CompanyPageBar)

  **Header.svelte:**
  - Responsive clamp padding: `clamp(0.4rem, 1vw, 0.65rem)`
  - Added 680px breakpoint for split-screen compactness

  **CompanyPageBar.svelte:**
  - Reduced padding: `0.4rem 0.875rem`
  - Added Edit Order controls on right side
  - Edit mode state lifted to +page.svelte

  **Panel.svelte:**
  - Double reduction for maintenance panels
  - Smaller control buttons (24px vs 32px)

  **Responsive Breakpoints:**
  - 768px: Column hiding, padding reduction
  - 680px: Ultra-compact for split-screen (font 0.65-0.7rem)

- [x] **Edit Order Button Relocation** (2026-01-15)
  - Moved from PackageTable to CompanyPageBar
  - State lifted to +page.svelte
  - No longer affects card/panel placement

- [x] **Git Repository Created** (2026-01-15)
  - Repository: https://github.com/codyrf1990/CheatSheet-Svelte
  - Initial commit: 72 files, 17,510 insertions
  - Branch: main

- [x] **Vertical Compactness & Wider View Support** (2026-01-15)
  - Reference: `/home/cody/Projects/machine-db-project/machine-research-ui`
  - Target viewports: 1920x1080 and 2560x1440

  **Layout Container (+page.svelte):**
  - max-width: 1200px → 1600px (centered container)
  - padding: clamp(0.8rem, 2.6vw, 1.8rem) → clamp(0.5rem, 2vw, 1.25rem)
  - content gap: clamp(0.8rem, 2vw, 1.4rem) → clamp(0.6rem, 1.5vw, 1rem)
  - sidebar gap: 0.6rem → 0.5rem

  **Header.svelte:**
  - card-content gap: clamp(0.8rem, 2.5vw, 1.5rem) → clamp(0.5rem, 2vw, 1rem)
  - card-content padding: clamp(0.4rem, 1vw, 0.65rem) → clamp(0.25rem, 0.75vw, 0.5rem)
  - header-content gap: 0.4rem → 0.25rem
  - nav-row gap: 0.35rem → 0.25rem
  - nav-link padding: 0.3rem 0.65rem → 0.2rem 0.5rem

  **CompanyPageBar.svelte:**
  - gap: 0.75rem → 0.5rem
  - padding: 0.4rem 0.875rem → 0.3rem 0.625rem
  - margin-bottom: 1rem → 0.5rem (biggest vertical gain)
  - company-trigger padding: 0.5rem 0.875rem → 0.35rem 0.625rem
  - page-tab padding: 0.35rem 0.75rem → 0.25rem 0.5rem

  **PackageTable.svelte:**
  - th padding: 0.56rem 0.6rem → 0.4rem 0.5rem
  - th font-size: 0.8rem → 0.75rem

  **PackageRow.svelte:**
  - cell padding: 0.48rem 0.75rem → 0.35rem 0.5rem
  - bits-layout gap: 0.75rem → 0.5rem
  - group-column gap: 0.25rem → 0.1875rem

  **MasterBit.svelte:**
  - master-header padding: 0.5rem 0.75rem → 0.35rem 0.5rem
  - expand-toggle size: 24px → 20px
  - sub-bits padding: 0.25rem 0 → 0.125rem 0

  **LooseBit.svelte & SubBit.svelte:**
  - padding: 0.25rem 0.5rem → 0.1875rem 0.375rem
  - bit-label gap: 0.5rem → 0.375rem
  - font-size: 0.8125rem → 0.75rem

  **Panel.svelte:**
  - panel-head padding: 0.4rem 0.6rem → 0.3rem 0.5rem
  - panel-body padding: 0.35rem 0.5rem → 0.25rem 0.375rem
  - panel-control-btn size: 32px → 26px

  **EditablePanel.svelte:**
  - panel-items gap: 0.176rem → 0.125rem

  **PanelItem.svelte:**
  - padding: 0.192rem 0.32rem → 0.125rem 0.25rem
  - item-text font-size: 0.7rem → 0.675rem
  - item-remove-btn size: 22px → 18px

  **Calculator.svelte:**
  - panel-head padding: 0.4rem 0.6rem → 0.3rem 0.5rem
  - calculator-shell padding: 0.5rem → 0.375rem
  - calculator gap: 0.35rem → 0.25rem
  - calc-btn padding: 0.65rem → 0.5rem

- [x] **Narrow Viewport Layout Fixes - Match Original CheatSheet** (2026-01-15)
  - Goal: Keep packages + sidebar side-by-side at all viewport widths (like original)

  **+page.svelte - Layout:**
  - Two-column layout at ALL widths (removed 1024px stacking breakpoint)
  - Grid columns: `minmax(0, 1fr) minmax(180px, 340px)` (default)
  - 900px: sidebar shrinks to `minmax(160px, 280px)`
  - 768px: sidebar `minmax(140px, 240px)`
  - 640px: sidebar `minmax(120px, 200px)`
  - 500px: sidebar `minmax(100px, 160px)`
  - Main content gets `overflow-x: auto` for table scrolling

  **Header.svelte:**
  - Kept 3-column grid at all widths (logo, content, user)
  - Removed the 768px breakpoint that switched to single column
  - 900px: Nav labels hidden (icon-only), 0.65rem font
  - 768px: 0.6rem font, tighter padding
  - 680px: 0.55rem font, ultra-compact
  - Nav external icons hidden at 680px

  **CompanyPageBar.svelte:**
  - Progressive compaction at 900px, 768px, 640px, 500px
  - Company name max-width: 140px → 100px → 70px → 50px
  - Font sizes: 0.75rem → 0.65rem → 0.55rem → 0.5rem
  - No wrapping (removed flex-wrap)

  **PackageTable.svelte & PackageRow.svelte:**
  - Package column hidden at 768px (already implemented)
  - Maintenance column: 4.5rem @ 768px → 3.5rem @ 680px → 2.75rem @ 500px
  - Font sizes scale down to 0.55rem at 500px

  **Panel.svelte:**
  - Progressive compaction: 768px → 640px → 500px
  - Control buttons: 26px → 22px → 18px → 16px
  - Title font: 0.875rem → 0.75rem → 0.65rem → 0.55rem

  **PanelItem.svelte:**
  - Scaling: 0.675rem → 0.6rem → 0.55rem → 0.5rem
  - Remove buttons: 18px → 16px → 14px → 12px

  **EditablePanel.svelte:**
  - Single column grid at 640px and below

  **MasterBit.svelte, LooseBit.svelte, SubBit.svelte:**
  - Progressive compaction for all bit components
  - Font sizes down to 0.5rem at 500px
  - Tight padding at narrow widths

  **Calculator.svelte:**
  - Progressive compaction: 768px → 640px → 500px
  - Button padding: 0.5rem → 0.35rem → 0.25rem → 0.2rem
  - Font sizes: 0.85rem → 0.7rem → 0.6rem → 0.5rem

- [x] **Package Bits 2-Column Grid Layout** (2026-01-15)
  - Goal: Groups in 2-column grid, loose bits below, more compact overall

  **PackageRow.svelte:**
  - New `.bits-container` with flex column layout
  - `.groups-grid` with `repeat(2, minmax(0, 1fr))` CSS grid
  - Loose bits section below groups with subtle border separator
  - Falls back to 1-column at 500px
  - Tighter cell padding (0.3rem 0.4rem)

  **MasterBit.svelte:**
  - Reduced header padding (0.35rem → 0.25rem)
  - Smaller expand toggle (20px → 16px)
  - Font size reduced (0.8125rem → 0.7rem)
  - Text truncation with ellipsis

  **SubBit.svelte & LooseBit.svelte:**
  - Tighter default padding (0.1rem 0.25rem)
  - Smaller font (0.65rem default)
  - LooseBit gets subtle border + background for visual hierarchy
  - Reduced indent for SubBit (0.75rem)

  **+page.svelte (Proportions):**
  - Max-width: 1600px → 1400px (less sprawl)
  - Sidebar min: 180px → 200px, max: 340px → 380px (more balance)
  - Reduced page padding with tighter clamp values
  - Responsive breakpoints adjusted to match

- [x] **Viewport-Height Filling Layout** (2026-01-15)
  - Goal: Cards align to bottom of viewport, no wasted space

  **+page.svelte:**
  - Changed `min-height: 100vh` → `height: 100vh` on `.page-layout`
  - Added `flex: 1` and `min-height: 0` to `.content-area`
  - Added `min-height: 0` to `.sidebar` for proper flex behavior

  **MaintenancePanel.svelte:**
  - Added `flex: 1` to `.maintenance-panel` (grows to fill space)
  - Removed redundant "Maintenance SKUs" title from panel header (section headers sufficient)
  - Changed panel-head to `justify-content: flex-end` (only shows +/- controls)
  - Removed unused `.panel-title` CSS

- [x] **PWA Configuration with @vite-pwa/sveltekit** (2026-01-15)
  - Files: `vite.config.ts`, `src/routes/+layout.svelte`, `src/app.d.ts`, `src/vite-env.d.ts`
  - Added SvelteKitPWA plugin with manifest configuration
  - Generated PWA icons (192x192, 512x512) from favicon
  - Service worker with workbox precaching (22 entries, ~1.5MB)
  - Auto-update registration type
  - Added `virtual:pwa-info` type declarations
  - Dark theme colors (#0a0a0f) match app design

- [x] **Sales Tax Guide Modal** (2026-01-15)
  - Files: `src/lib/components/ui/SalesTaxModal.svelte`
  - Content sections: Required states (14), Exempt states (5), Exception states, International
  - Color-coded tags: green (required), blue (exempt), yellow (exception)
  - Responsive grid layout for state tags

- [x] **Current Products Modal** (2026-01-15)
  - Files: `src/lib/components/ui/CurrentProductsModal.svelte`
  - 5 tabbed sections: Overview, Milling, Other Modules, Training, Post Processors
  - Data tables for packages, SKUs, pricing
  - Module lists with descriptions
  - Training credits, discounts, tier pricing
  - Post processor SKUs with derivative codes
  - Scrollable content with custom scrollbar styling

- [x] **Companies Dropdown Fix & Modal** (2026-01-15)
  - Files: `src/lib/components/layout/CompanyPageBar.svelte`, `src/lib/components/ui/CompaniesModal.svelte`, `src/routes/+page.svelte`

  **Problem Fixed:** Dropdown was invisible due to `backdrop-filter: blur()` on parent creating a containing block that clipped `position: fixed` elements

  **Solution:** Moved dropdown menu outside `.company-page-bar` div entirely

  **CompanyPageBar.svelte:**
  - Dropdown now uses `position: fixed` with dynamic positioning via `getBoundingClientRect()`
  - Fixed header (search) + scrollable list + fixed footer layout
  - Compact "+" and "View All (N)" buttons in footer
  - Both buttons same height via shared base `.footer-btn` class

  **CompaniesModal.svelte (NEW):**
  - Full modal for viewing/managing all companies
  - Search bar at top (fixed)
  - Scrollable company list with hover actions (rename/delete)
  - "Current" badge on active company
  - "+ New Company" button and count in footer

  **+page.svelte:**
  - Added `showCompaniesModal` state
  - Wired `onViewAllCompanies` prop to open modal
  - Compact dropdown styles for Operations and CF Tools menus

- [x] **Cloud Data Migration - Old to New Package Format** (2026-01-15)
  - Files: `src/lib/stores/companies.svelte.ts`

  **Problem:** Old site stored package state in different format than new site
  - Old: `{ bits: [{text, checked}], groups: [{masterId, items: [{text, checked}]}] }`
  - New: `{ selectedBits: string[], customBits: string[], order: string[] }`

  **Solution:** Added `migratePackageState()` function that:
  - Detects old format (has `bits[]` or `groups[]` arrays with `{text, checked}` objects)
  - Converts to new format (flat `selectedBits[]` array of checked bit names)
  - Preserves new format data if already migrated

  **Migration applied in:**
  - `load()` - when loading from localStorage
  - `importData()` - when importing from cloud sync

### Remaining / Needs Improvement

- [ ] Further responsive testing at various viewports
- [ ] Accessibility audit
- [ ] Final polish and testing

---

## Blockers

None currently.

---

## Notes

- Reference project: `/home/cody/Projects/TOS Parser Svelte/`
- Original app: `/home/cody/CheatSheet/` (read-only)
- All research docs in `.docs/`
