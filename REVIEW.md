# UI Polish & Clarity Review — BDM Handoff

> **Goal:** Make every part of the CheatSheet self-explanatory for BDMs.
> No features removed — polish and clarity only.
>
> **Status legend:** `[ ]` To do · `[~]` In progress · `[x]` Done · `[-]` Skipped (with reason)

---

## Phase 1: Import Flow (Highest Impact)

### ImportLicenseModal — Paste Step
- [x] Expand instructions into numbered steps with context
- [x] Add "what to expect" note so BDMs know what the import does
- [x] Improve placeholder text with clearer example

### ImportLicenseModal — Preview Step
- [x] Rename "Dongle No:" to "License Number" (parser already detects type)
- [x] Clarify "features found" toggle → "licensed modules found"
- [x] Review "Will create/update page" info box language — made more conversational

### ImportLicenseModal — Results Step
- [x] Rename "Bits Selected" → "Modules Selected"
- [x] Review import success/failure messaging — clear as-is

---

## Phase 2: Modal Cleanliness Pass

### SalesTaxModal
- [x] Update hardcoded "2025" year — now dynamic via `new Date().getFullYear()`

### AddSkuModal
- [x] Removed — dead code, nothing referenced it (orphaned after edit mode removal)

### CompaniesModal
- [x] Reviewed — already clean (search, rename, delete, "Current" badge all clear)

### CurrentProductsModal
- [x] "SW Bundles" → "SOLIDWORKS Bundles"
- [x] Tab labels verified (Overview, Milling, Other Modules, Training, Post Processors — all clear)

### WhatLeftModal (Upgrades)
- [x] Mode indicator clear — title shows "Upgrades — New Sale" or "Upgrades — Maintenance"

### CompanyPageBar
- [x] Context menu labels verified — Rename, Duplicate, Import License, Delete, Copy Page Name, Copy License Key all clear

---

## Phase 3: Terminology Sweep

- [x] "Bits Selected" → "Modules Selected" (ImportLicenseModal results)
- [x] "Select bits from the table" → "Select modules from the table" (NewSalePanel empty state, both instances)
- [x] aria-label and caption "bits" → "modules" (PackageTable)
- [x] "Pick a tag to get started" → "Enter your name to get started" (LoginScreen)

---

## Phase 4: Help Text & Tooltips

- [x] "Add new page" tooltip now explains what pages are ("each page is a separate license or quote")
- [x] "+" new page button already had tooltip — enhanced with page explanation
- [x] LoginScreen: "Pick a tag" → "Enter your name", hint now says "Your name is used to save and sync your work across devices"
- [x] Empty states updated (NewSalePanel: "Select modules from the table to see pricing")
- [x] All icon-only buttons verified — already have tooltips (Rename, Delete, Import, Add page, Upgrades, etc.)

---

## Phase 5: Visual Polish

- [x] Button styles consistent — all modals use `ghost` for cancel, `gold` for primary action
- [x] Error/success message patterns consistent — same red family throughout (#f87171 text, rgba(239,68,68) backgrounds)
- [x] Focus states use `focus-visible` on Button component; inputs use gold border + box-shadow
- [x] Spacing and font sizes consistent from prior polish phases

---

## Smoke Testing Checklist

- [ ] Login with new tag
- [ ] Create/rename/delete company
- [ ] Create/switch/delete pages
- [ ] Full import flow (paste → preview → results)
- [ ] Toggle bits in each package
- [ ] Switch New Sale ↔ Maintenance
- [ ] Open every modal, close via X / Escape / backdrop
- [ ] Context menus on company and page tabs
- [ ] Operations and CF Tools dropdowns
- [ ] Calculator

---

## Notes & Decisions

_Session-by-session notes go here._
