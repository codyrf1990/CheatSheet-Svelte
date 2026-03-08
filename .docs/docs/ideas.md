# Ideas & Backlog

NEW Idea add aautomatic recgonition of a solidowrks license file and auto import thatas well as we can set info gates if we need extra info will supply pdf of each type of license

## Bugs

- [ ] | **Sim5x false positive** — Sim5x bit gets checked when customer only has HSS + Sim4x. Should only check Sim5x if the license explicitly says "Sim 5x". | Sim 5x Bit      | Sim 5x Level                          | Maps To                                      | Notes                                      |
      | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | ------------------------------------- | -------------------------------------------- | ------------------------------------------ |
      | **0**                                                                                                                                                  | Any             | None                                  | Bit disabled — ignore level.                 |
      | **1**                                                                                                                                                  | "3 Axis" or "1" | **SC-HSS-Maint** only                 | Restricted to 3-axis HSS.                    |
      | **1**                                                                                                                                                  | "3/4 Axis"      | **SC-HSS-Maint** + **SC-Sim4x-Maint** | Allows 4-axis simultaneous.                  |
      | **1**                                                                                                                                                  | Blank / empty   | Check all 5-axis bits                 | Unrestricted — follow package default logic. | the logic should follow this on importing. |

- [ ] **Narrow viewport: check-all checkbox hidden** — At small screen widths the top-level "select all packages" checkbox disappears in the maintenance SKU tab. Should stay visible at all widths.

- [ ] **Duplicate license import** — Importing the same dongle twice just appends it again. Should detect duplicates and ask to update instead.

- [ ] **What's Left: total price is inflated** — The total shown in What's Left adds up every unselected bit at individual price — no bundle discounts applied. The real quote would be lower. I need all prices to match — the quote needs to match what's checked, include the discount if a full package. The remaining value should also be correct, only count what's not checked and be accurate prices.

- [ ] **Custom bits look the same as regular bits at a glance** — A bit added manually by a user (gold text) is easy to miss vs a standard bit. Easy to forget it's custom, especially when reviewing someone else's page.

- [x] **New profile not foregrounded** — Fixed: `handleNewPage` now calls `switchToPage` immediately after create.
- [x] **Remove SKU mode sticks across pages** — Fixed: `loadFromPageState` now resets `removeMode = false`.
- [x] **Page name truncates silently** — Fixed: full license key stored on Page; right-click page → Copy Key.
- [x] **What's Left: partial group shows as upgrade** — Fixed: partial packages now labelled "Complete {code}"; empty package shows bundle price row.
- [x] **Can add duplicate items to a panel** — Fixed: duplicate guard + toast warning in `EditablePanel`.
- [x] **Calculator copy behavior is confusing** — Fixed: tooltip on display + error hint "Press AC to clear".
- [x] **Package-level maint SKUs don't auto-import** — Fixed: `licenseImport` step 10 adds package maint SKUs when fully selected.

---

## Features

- [ ] **BDM / Maintenance Specialist mode on SKU tab** — ✅ Done: BDM/MS toggle added. Build mode forces BDM silently. MS mode relabels first tab to "Maintenance" and shows maint costs.

- [ ] **Add user/rep to profile export** — ✅ Done: Rep name stored in userPrefs; printed as `Rep:` line in QB export. Set via company context menu → "Set Rep Name".

- [ ] **Show imported SKUs in results screen** — ✅ Done: Collapsible "N SKUs imported" section in import results.

- [ ] **Company search should auto-focus** — ✅ Done: `$effect` focuses search input when dropdown opens.

- [ ] **Calculator error state gives no recovery hint** — ✅ Done: "Press AC to clear" hint shown below display on error; tooltip on display explains click/double-click behavior.

- [ ] **"Double-click to rename" is not discoverable** — ✅ Done: `title="Double-click to rename"` added to page tabs.

- [ ] **New Sale empty state message is vague** — ✅ Done: Updated to "Select bits from the table to see pricing."

- [ ] **Company search should auto-focus** — ✅ Done: search input auto-focuses on dropdown open.

---

## Polish

- [ ] **"Double-click to rename" is not discoverable** — ✅ Done (see above).

- [ ] **New Sale empty state message is vague** — ✅ Done (see above).

---

## Audits

- [ ] **Verify prices against Pricing Matrix 2026** — Compare all SKUs and prices in the app against `Pricing Matrix 2026 1.xlsx`.

- [ ] **Sales tax data has no revision date** — The sales tax modal says "2025" in the title but the state list is static and could drift. Should note when it was last verified and who to check with if unsure.
