# CheatSheet Source of Truth — Build Rules & SKU Reference

Last updated: 2026-03-02
Primary pricing source: `Pricing Matrix 2026 1.xlsx`
Implementation plan: `.docs/build-mode-plan.md`

---

## 0) How The Tool Is Used

### Import mode

- Fills out the license view from a Salesforce dongle page paste.
- No role assumption — a maintenance specialist uses it to build a renewal estimate, a BDM uses it to visually see what the customer already has.
- Import just maps what's in the license. No extra gating or validation on import.

### Build mode (default for new pages)

- BDM builds a fresh quote from scratch for a new customer.
- Full package + module SKUs shown in New Sale panel; no maintenance SKUs.
- **Hard gates enforced** — invalid selections are disabled with tooltip + toast explaining why.
- Only valid, sellable combinations can be built.

### "What's Left to Sell" view

- A button that shows everything **not** currently toggled on.
- Grouped by base package (SC-Mill bits together, SC-Turn together, then additional modules).
- Each unselected item shows: name, SKU, list price, one-sentence description with prerequisite text.
- Focused on BDM upgrade opportunities — what can be added to an existing customer's setup.
- Read-only — no checkboxes, no interaction.
- v1: no search/filter.

### Page mode behavior

- **New pages** default to `build` mode.
- **Imported pages** auto-switch to `import` mode after successful license import.
- **Legacy pages** (no mode field) treated as `import`.
- **Mode badge** is always visible in the package table header and always clickable — serves as both indicator and manual toggle.

---

## 1) Package Structure & Toggle Behavior

### SC-Mill (Base package — no prerequisite)

- **Package toggle:** Selects 25M group + HSS together.
- **25M group (SKU: SC-25M — "2.5D Milling + AFRM"):** AFRM = Automatic Feature Recognition Module. All-or-nothing on new builds. Cannot pick individual bits within the group.
  - Bits: Modeler, Machinist, SolidCAM Mill 2D, Profile/Pocket 2.5D Rest Material, SolidCAM Mill 2.5D, Pocket Recognition, Chamfer Recognition, Hole+Drill Recognition, SC Mill 3D, C-axes (Wrap), 4-axes Indexial, 5-axes Indexial, Multi-Depth Drill
- **25M display:** Master checkbox labeled "2.5D Milling + AFRM" (matching pricing matrix naming). 13 sub-items listed underneath as read-only bullets so the rep sees what's included.
- **HSS (SKU: SC-HSS):** Loose — selected by package toggle, but can be toggled separately after.
- **Maintenance SKU:** SC-Mill-Maint
- **Gating note:** 25M alone (without HSS) still counts as SC-Mill present for all downstream gates.

### SC-Turn (Base package — no prerequisite)

- **Package toggle:** Selects SolidCAM Turning + Backspindle together.
- **SolidCAM Turning + Backspindle:** Always sold together — cannot be split or sold separately.
- **Display:** Single combined entry "SC-Turn Module" — no separate checkboxes for Turning/Backspindle.
- **Maintenance SKU:** SC-Turn-Maint
- **Mill Turn rule:** SC-Mill + SC-Turn both selected → Mill Turn capability included automatically, no extra bit or charge. Toast notification: "Note: Mill-Turn capability is automatically included with this combination."

### SC-Mill-Adv (Add-on — requires SC-Mill)

- **Package toggle:** Selects iMach2D + Machine Simulation + Edge Breaking together.
- **Individual bits:** Each can be purchased and selected separately — all three still require SC-Mill.
- **Maintenance SKU:** SC-Mill-Adv-Maint

### SC-Mill-3D (Add-on — requires SC-Mill; iMach3D also requires iMach2D)

- **Package toggle:** Selects HSM + iMach3D together.
- **HSM alone:** Requires SC-Mill only.
- **iMach3D alone:** Requires SC-Mill + iMach2D.
- **Package (both):** Requires SC-Mill + iMach2D (because package includes iMach3D).
- **Maintenance SKU:** SC-Mill-3D-Maint

### SC-Mill-5Axis (Add-on — requires SC-Mill)

- **SIM5X group toggle:** Selects all 7 bits together, or individual bits can be toggled separately.
  - Bits: Sim5x, Swarf machining, 5x Drill, Contour 5x, Convert5X, Auto 3+2 Roughing, Screw Machining (Rotary)
- **Loose:** Sim4x, Multiaxis Roughing — still require SC-Mill.
- **Maintenance SKU:** SC-Mill-5Axis-Maint

---

## 2) Prerequisite Rules (Hard Gates — Build Mode Only)

These rules are enforced in build mode. Import mode has no enforcement.

| To select this                                        | Needs SC-Mill | Needs iMach2D | Notes                                           |
| ----------------------------------------------------- | ------------- | ------------- | ----------------------------------------------- |
| SC-Mill (25M or HSS)                                  | No            | No            | Base package, standalone                        |
| SC-Turn (either bit)                                  | No            | No            | Base package, standalone                        |
| Any SC-Mill-Adv bit (iMach2D, MachSim, Edge Breaking) | Yes           | No            | Each bit individually still needs SC-Mill       |
| HSM                                                   | Yes           | No            | HSM only — SC-Mill is the only gate             |
| iMach3D                                               | Yes           | Yes           | Needs SC-Mill and iMach2D                       |
| SC-Mill-3D package (HSM + iMach3D)                    | Yes           | Yes           | Package includes iMach3D so iMach2D is required |
| Any SC-Mill-5Axis bit                                 | Yes           | No            | Just needs SC-Mill present                      |
| Edge Trimming / Multiblade / Port Machining           | Yes           | No            | Milling-specific additional modules             |
| Probe, Vericut, Wire EDM, CIMCO, SC-4Op, iMachNX      | No            | No            | Standalone additional modules                   |

---

## 3) Package Toggle Behavior

| Package toggle            | What it selects                              | Can bits be split after?                                          | Display                                                            |
| ------------------------- | -------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| SC-Mill                   | 25M (all 13 bits) + HSS                      | Yes — 25M and HSS can be toggled separately                       | Master checkbox "2.5D Milling + AFRM" + read-only sub-item bullets |
| SC-Turn                   | SolidCAM Turning + Backspindle               | No — always together, cannot be split                             | Single combined entry "SC-Turn Module"                             |
| SC-Mill-Adv               | iMach2D + Machine Simulation + Edge Breaking | Yes — each can be toggled separately                              | Individual toggles                                                 |
| SC-Mill-3D                | HSM + iMach3D                                | Yes — each can be toggled separately (iMach3D gate still applies) | Individual toggles                                                 |
| SC-Mill-5Axis SIM5X group | All 7 SIM5X bits                             | Yes — individual bits can be toggled                              | Group toggle + individual loose bits                               |

---

## 4) What "SC-Mill Is Present" Means

SC-Mill is considered present when **any** SC-Mill selection is active — 25M, HSS, or both. Selecting 25M without HSS still satisfies the SC-Mill prerequisite for all downstream packages.

---

## 5) What Cannot Be Built (Hard Blocks — Build Mode Only)

| Invalid combo                                               | Block reason                                | Toast message                                        |
| ----------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| iMach3D selected, iMach2D not selected                      | iMach3D requires iMach2D                    | "iMach3D requires iMach2D — select iMach2D first"    |
| SC-Mill-3D package selected, iMach2D not selected           | Package includes iMach3D — iMach2D required | "SC-Mill-3D requires iMach2D — select iMach2D first" |
| Any SC-Mill-Adv bit selected, no SC-Mill bits               | SC-Mill-Adv requires SC-Mill                | "Requires SC-Mill"                                   |
| Any SC-Mill-3D bit selected, no SC-Mill bits                | SC-Mill-3D requires SC-Mill                 | "Requires SC-Mill"                                   |
| Any SC-Mill-5Axis bit selected, no SC-Mill bits             | 5-Axis requires SC-Mill                     | "Requires SC-Mill"                                   |
| Edge Trimming / Multiblade / Port selected, no SC-Mill bits | Milling-specific module requires SC-Mill    | "Requires SC-Mill"                                   |
| SC-Turn split (only Turning or only Backspindle)            | Always sold together — cannot be split      | "SC-Turn is always sold as a pair"                   |

---

## 6) Additional Modules

Not part of the 5 core packages. Split into two groups based on prerequisites.

### Milling-Specific Modules (Require SC-Mill)

These are milling operations — they need a milling seat to function. Grouped under "MILLING MODULES" in the pricing matrix workbook.

| Module         | SKU           | List Price | Maint Price | Prerequisite |
| -------------- | ------------- | ---------- | ----------- | ------------ |
| Edge Trimming  | SC-EdgeTrim   | $1,380     | $180        | SC-Mill      |
| Multiblade     | SC-Multiblade | $8,740     | $1,140      | SC-Mill      |
| Port Machining | SC-Port       | $3,588     | $468        | SC-Mill      |

### Standalone Modules (No Prerequisites)

These can be added freely — no base package required.

| Module                       | SKU              | List Price | Maint Price | Notes                            |
| ---------------------------- | ---------------- | ---------- | ----------- | -------------------------------- |
| Solid Probe (Home + Measure) | SC-Probe         | $3,450     | $450        | ADD-ON MODULE                    |
| Solid Probe (Home Only)      | SC-Probe1        | $1,150     | $150        | ADD-ON MODULE                    |
| Vericut Integration          | SC-Vericut       | $1,150     | $150        | ADD-ON MODULE                    |
| iMachining NX                | iMachNX-Mod      | $7,268     | $948        | ADD-ON MODULE (NX platform)      |
| Wire EDM — Wirecut 2 Axis    | WC2-Mod          | $2,668     | $348        | WIRE EDM (separate machine type) |
| Wire EDM — Wirecut 4 Axis    | SC-Wire          | $3,450     | $450        | WIRE EDM (separate machine type) |
| CIMCO Editor                 | SolidShop-Editor | $500       | $75         | SOLIDSHOP (standalone NC editor) |
| SC for Operators             | SC-4Op           | $2,500     | $375        | SOLIDSHOP (operator interface)   |
| SC for Operators (Sim Only)  | SC-4Op-Sim       | $1,000     | $150        | SOLIDSHOP (operator interface)   |

---

## 7) SKU Panel (Right Sidebar)

### Toggle behavior

- **New Sale tab:** Package SKUs + module SKUs from pricing matrix, labeled for easy copying.
- **Maintenance tab:** `-Maint` SKU codes from pricing matrix for renewal estimates.
- **Remember last selected tab** across sessions (localStorage or userPrefs).

### Valid estimate codes

NPD-Maint, SolidShop-Sim-Maint, and SW-Recap are **valid estimate codes** — not internal-only. No special labeling or hiding.

### New-sale SKU panel — full reference

| Package / Module             | SKU              | List Price | Maint Price |
| ---------------------------- | ---------------- | ---------- | ----------- |
| SC-Mill (25M + AFRM)         | SC-25M           | $3,868     | $648        |
| High Speed Surfacing         | SC-HSS           | $1,380     | $180        |
| SC-Turn                      | SC-Turn          | $2,300     | $300        |
| SC-Mill-Adv (package)        | SC-Mill-Adv      | $3,412     | $828        |
| iMachining 2D                | SC-iMach2D       | $3,588     | $468        |
| Machine Simulation           | SC-MachSim       | $1,380     | $180        |
| Edge Breaking                | SC-EdgeBreak     | $1,380     | $180        |
| SC-Mill-3D (package)         | SC-Mill-3D       | $6,820     | $1,020      |
| High Speed Machining         | SC-HSM           | $5,060     | $660        |
| iMachining 3D                | SC-iMach3D       | $2,760     | $360        |
| SC-Mill-5Axis (package)      | SC-Mill-5Axis    | $5,520     | $720        |
| Simultaneous 4 Axis          | SC-Sim4x         | $920       | $120        |
| Simultaneous 5 Axis          | SC-Sim5x         | $3,680     | $480        |
| Multiaxis Roughing           | SC-Multiaxis     | $920       | $120        |
| Edge Trimming                | SC-EdgeTrim      | $1,380     | $180        |
| Multiblade                   | SC-Multiblade    | $8,740     | $1,140      |
| Port Machining               | SC-Port          | $3,588     | $468        |
| Solid Probe (Home + Measure) | SC-Probe         | $3,450     | $450        |
| Solid Probe (Home Only)      | SC-Probe1        | $1,150     | $150        |
| Vericut Integration          | SC-Vericut       | $1,150     | $150        |
| iMachining NX                | iMachNX-Mod      | $7,268     | $948        |
| Wire EDM — 2 Axis            | WC2-Mod          | $2,668     | $348        |
| Wire EDM — 4 Axis            | SC-Wire          | $3,450     | $450        |
| CIMCO Editor                 | SolidShop-Editor | $500       | $75         |
| SC for Operators             | SC-4Op           | $2,500     | $375        |
| SC for Operators (Sim Only)  | SC-4Op-Sim       | $1,000     | $150        |

> Source: `Pricing Matrix 2026 1.xlsx` — workbook wins if this table and the workbook disagree.

---

## 8) UI Behavior Rules

### Mode badge

- Small pill in the package table header: `BUILD` (gold) or `IMPORT` (muted).
- Always visible on every page. Always clickable.
- Auto-detect sets initial mode; clicking manually overrides it.

### Build mode enforcement

- **Hard-block** invalid selections — disabled checkbox + clear toast explaining why.
- Disabled bits show reduced opacity, `cursor: not-allowed`.
- **Hover tooltip** explains exactly why the bit is disabled (e.g., "Requires SC-Mill").
- **Click on disabled bit** fires a toast with the reason so the rep knows what to do next.
- Import mode: no enforcement — import maps whatever is in the license.

### Checkbox vs name click (global fix)

- **Clicking a bit name** copies the name to clipboard. Does NOT toggle the checkbox.
- **Clicking the checkbox** toggles the bit. Does NOT copy.
- These are separated into independent elements (not wrapped in the same `<label>`).
- Applies to: SubBit, LooseBit, PanelItem.

### "What's Left to Sell" modal

- Button appears when `mode === 'import'` OR when any bits are selected.
- Lives in the package table header area, next to the mode badge.
- **Grouped by base package:** SC-Mill bits → SC-Mill-Adv bits → SC-Mill-3D bits → SC-Mill-5Axis bits → SC-Turn → Additional Modules.
- SC-Turn shown as **one combined entry** ("SC-Turn Module").
- Each entry: name, SKU, list price, one-sentence description with prerequisite text at end.
- Read-only — no checkboxes, no interaction.
- v1: no search/filter.

---

## 9) Scope Boundary

| In scope                                    | Out of scope                         |
| ------------------------------------------- | ------------------------------------ |
| Bit prerequisite rules for new builds       | Discount logic (VCD, TLV, CLR, tier) |
| Package toggle behavior                     | Handoff / Pending Approval gating    |
| Auto-include and split rules                | TSV vs TLV terminology               |
| Hard block combos + toast messaging         |                                      |
| Mode badge (auto-detect + clickable toggle) |                                      |
| Checkbox / name click separation            |                                      |
| SKU panel toggle (New Sale vs Maintenance)  |                                      |
| Sidebar tab persistence                     |                                      |
| List prices per module (reference only)     |                                      |
| "What's Left to Sell" grouped modal         |                                      |
| 25M display matching pricing matrix naming  |                                      |
| SC-Turn combined display                    |                                      |
| Mill Turn toast notification                |                                      |

---

## 10) Change Log

| Date       | Update                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-01 | Initial version — package structure, prerequisites, SKU reference from pricing matrix workbook.                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-03-02 | Split additional modules into milling-specific (require SC-Mill) and standalone. Added UI behavior rules section: mode badge, checkbox/name fix, disabled visuals, What's Left to Sell spec. Updated SC-Turn to combined display, added Mill Turn toast, added 25M pricing-matrix-matched display, added toast messages to hard blocks table. Added page mode behavior rules. Expanded scope boundary. Fixed section numbering (was missing section 8, jumped 7→9). |
