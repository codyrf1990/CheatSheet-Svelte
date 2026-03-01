# CheatSheet Source of Truth — Build Rules & SKU Reference

Last updated: 2026-03-01

---

## 0) How The Tool Is Used

### Import mode
- Fills out the license view from a Salesforce dongle page paste.
- No role assumption — a maintenance specialist uses it to build a renewal estimate, a BDM uses it to visually see what the customer already has.
- Import just maps what's in the license. No extra gating or validation on import.

### "What's left to sell" view (planned)
- A button that shows everything **not** currently toggled on.
- Each unselected item shows a short description of what it does / why a customer might want it.
- Gives BDMs a quick upsell view without changing any selections.

### New build mode (planned)
- BDM builds a fresh quote from scratch for a new customer.
- Full package + module SKUs, no maintenance SKUs.
- Gates enforced so only valid combinations can be built.

---

## 1) Package Structure & Toggle Behavior

### SC-Mill (Base package — no prerequisite)
- **Package toggle:** Selects 25M group + HSS together
- **25M group (SKU: SC-25M — "2.5D Milling + AFRM"):** AFRM = Automatic Feature Recognition Module. All-or-nothing on new builds. Cannot pick individual bits within the group.
  - Bits: Modeler, Machinist, SolidCAM Mill 2D, Profile/Pocket 2.5D Rest Material, SolidCAM Mill 2.5D, Pocket Recognition, Chamfer Recognition, Hole+Drill Recognition, SC Mill 3D, C-axes (Wrap), 4-axes Indexial, 5-axes Indexial, Multi-Depth Drill
- **HSS (SKU: SC-HSS):** Loose — selected by package toggle, but can be toggled separately after.
- **Maintenance SKU:** SC-Mill-Maint
- **Gating note:** 25M alone (without HSS) still counts as SC-Mill present for all downstream gates.

### SC-Turn (Base package — no prerequisite)
- **Package toggle:** Selects SolidCAM Turning + Backspindle together
- **SolidCAM Turning + Backspindle:** Always sold together — cannot be split or sold separately
- **Maintenance SKU:** SC-Turn-Maint
- **Bonus rule:** SC-Mill + SC-Turn both selected → Mill Turn capability included automatically, no extra bit or charge.

### SC-Mill-Adv (Add-on — requires SC-Mill)
- **Package toggle:** Selects iMach2D + Machine Simulation + Edge Breaking together
- **Individual bits:** Each can be purchased and selected separately — all three still require SC-Mill
- **Maintenance SKU:** SC-Mill-Adv-Maint

### SC-Mill-3D (Add-on — requires SC-Mill; iMach3D also requires iMach2D)
- **Package toggle:** Selects HSM + iMach3D together
- **HSM alone:** Requires SC-Mill only
- **iMach3D alone:** Requires SC-Mill + iMach2D
- **Package (both):** Requires SC-Mill + iMach2D (because package includes iMach3D)
- **Maintenance SKU:** SC-Mill-3D-Maint

### SC-Mill-5Axis (Add-on — requires SC-Mill)
- **SIM5X group toggle:** Selects all 7 bits together, or individual bits can be toggled separately
  - Bits: Sim5x, Swarf machining, 5x Drill, Contour 5x, Convert5X, Auto 3+2 Roughing, Screw Machining (Rotary)
- **Loose:** Sim4x, Multiaxis Roughing — still require SC-Mill
- **Maintenance SKU:** SC-Mill-5Axis-Maint

---

## 2) Prerequisite Rules (Hard Gates)

| To select this | Needs SC-Mill | Needs iMach2D | Notes |
|---|---|---|---|
| SC-Mill (25M or HSS) | No | No | Base package, standalone |
| SC-Turn (either bit) | No | No | Base package, standalone |
| Any SC-Mill-Adv bit (iMach2D, MachSim, Edge Breaking) | Yes | No | Each bit individually still needs SC-Mill |
| HSM | Yes | No | HSM only — SC-Mill is the only gate |
| iMach3D | Yes | Yes | Needs SC-Mill and iMach2D |
| SC-Mill-3D package (HSM + iMach3D) | Yes | Yes | Package includes iMach3D so iMach2D is required |
| Any SC-Mill-5Axis bit | Yes | No | Just needs SC-Mill present |

---

## 3) Package Toggle Behavior

| Package toggle | What it selects | Can bits be split after? |
|---|---|---|
| SC-Mill | 25M (all 13 bits) + HSS | Yes — 25M and HSS can be toggled separately |
| SC-Turn | SolidCAM Turning + Backspindle | No — always together, cannot be split |
| SC-Mill-Adv | iMach2D + Machine Simulation + Edge Breaking | Yes — each can be toggled separately |
| SC-Mill-3D | HSM + iMach3D | Yes — each can be toggled separately (iMach3D gate still applies) |
| SC-Mill-5Axis SIM5X group | All 7 SIM5X bits | Yes — individual bits can be toggled |

---

## 4) What "SC-Mill is present" Means

SC-Mill is considered present when **any** SC-Mill selection is active — 25M, HSS, or both. Selecting 25M without HSS still satisfies the SC-Mill prerequisite for all downstream packages.

---

## 5) What Cannot Be Built (Hard Blocks)

| Invalid combo | Block reason |
|---|---|
| iMach3D selected, iMach2D not selected | iMach3D requires iMach2D |
| SC-Mill-3D package selected, iMach2D not selected | Package includes iMach3D — iMach2D required |
| Any SC-Mill-Adv bit selected, no SC-Mill bits | SC-Mill-Adv requires SC-Mill |
| Any SC-Mill-3D bit selected, no SC-Mill bits | SC-Mill-3D requires SC-Mill |
| Any SC-Mill-5Axis bit selected, no SC-Mill bits | 5-Axis requires SC-Mill |

---

## 6) Additional Modules (No Prerequisites)

Not part of the 5 core packages. Can be added freely — no base package required.

| Module | SKU | List Price | Maint Price |
|---|---|---|---|
| Edge Trimming | SC-EdgeTrim | $1,380 | $180 |
| Multiblade | SC-Multiblade | $8,740 | $1,140 |
| Port Machining | SC-Port | $3,588 | $468 |
| Solid Probe (Home + Measure) | SC-Probe | $3,450 | $450 |
| Solid Probe (Home Only) | SC-Probe1 | $1,150 | $150 |
| Vericut Integration | SC-Vericut | $1,150 | $150 |
| iMachining NX | iMachNX-Mod | $7,268 | $948 |
| Wire EDM — Wirecut 2 Axis | WC2-Mod | $2,668 | $348 |
| Wire EDM — Wirecut 4 Axis | SC-Wire | $3,450 | $450 |
| CIMCO Editor | SolidShop-Editor | $500 | $75 |
| SC for Operators | SC-4Op | $2,500 | $375 |
| SC for Operators (Sim Only) | SC-4Op-Sim | $1,000 | $150 |

---

## 7) SKU Panel (Right Sidebar)

### Toggle behavior
- **Default: New-sale SKUs** — package SKUs + module SKUs, labeled clearly for easy copying.
- **Toggle: Maintenance SKUs** — switches panel to maintenance SKU codes for renewal estimates.

### New-sale SKU panel — full reference

| Package / Module | SKU | List Price | Maint Price |
|---|---|---|---|
| SC-Mill (25M + AFRM) | SC-25M | $3,868 | $648 |
| High Speed Surfacing | SC-HSS | $1,380 | $180 |
| SC-Turn | SC-Turn | $2,300 | $300 |
| SC-Mill-Adv (package) | SC-Mill-Adv | $3,412 | $828 |
| iMachining 2D | SC-iMach2D | $3,588 | $468 |
| Machine Simulation | SC-MachSim | $1,380 | $180 |
| Edge Breaking | SC-EdgeBreak | $1,380 | $180 |
| SC-Mill-3D (package) | SC-Mill-3D | $6,820 | $1,020 |
| High Speed Machining | SC-HSM | $5,060 | $660 |
| iMachining 3D | SC-iMach3D | $2,760 | $360 |
| SC-Mill-5Axis (package) | SC-Mill-5Axis | $5,520 | $720 |
| Simultaneous 4 Axis | SC-Sim4x | $920 | $120 |
| Simultaneous 5 Axis | SC-Sim5x | $3,680 | $480 |
| Multiaxis Roughing | SC-Multiaxis | $920 | $120 |
| Edge Trimming | SC-EdgeTrim | $1,380 | $180 |
| Multiblade | SC-Multiblade | $8,740 | $1,140 |
| Port Machining | SC-Port | $3,588 | $468 |
| Solid Probe (Home + Measure) | SC-Probe | $3,450 | $450 |
| Solid Probe (Home Only) | SC-Probe1 | $1,150 | $150 |
| Vericut Integration | SC-Vericut | $1,150 | $150 |
| iMachining NX | iMachNX-Mod | $7,268 | $948 |
| Wire EDM — 2 Axis | WC2-Mod | $2,668 | $348 |
| Wire EDM — 4 Axis | SC-Wire | $3,450 | $450 |
| CIMCO Editor | SolidShop-Editor | $500 | $75 |
| SC for Operators | SC-4Op | $2,500 | $375 |
| SC for Operators (Sim Only) | SC-4Op-Sim | $1,000 | $150 |

> Source: `Pricing Matrix 2026 1.xlsx` — workbook wins if this table and the workbook disagree.

---

## 8) Planned: Maintenance SKU Alignment

The maintenance SKU panel should map every entry clearly to a canonical sellable SKU. Internal-only codes (NPD-Maint, SolidShop-Sim-Maint, SW-Recap) need to be labeled as internal so reps aren't confused.

---

## 9) Scope Boundary

| In scope | Out of scope |
|---|---|
| Bit prerequisite rules for new builds | Discount logic (VCD, TLV, CLR, tier) |
| Package toggle behavior | Handoff / Pending Approval gating |
| Auto-include and split rules | TSV vs TLV terminology |
| Hard block combos | |
| SKU panel toggle (new-sale vs maintenance) | |
| List prices per module (reference only) | |

