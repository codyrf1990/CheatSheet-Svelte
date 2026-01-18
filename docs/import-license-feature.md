# Feature: Salesforce License Import

## Summary

Add an "Import License" option to the company context menu that parses **pasted Salesforce dongle page text** and automatically:

1. Creates companies if they don't exist
2. Creates pages per dongle (named by dongle # or last 4 of product key)
3. Maps license features to package bits
4. Checks corresponding maintenance SKUs
5. Merges new data without overwriting existing selections

---

## Key Decisions

| Question | Decision |
|----------|----------|
| **Input method** | Text paste (Ctrl+A from Salesforce) - NOT PDF upload |
| **Import count** | One dongle at a time |
| **Parse trigger** | Click "Parse" button (not auto on paste) |
| **Company name field** | Only editable if Customer field is missing |
| **Page naming** | Dongle number (e.g., "77518") or last 4 of product key (e.g., "3a4b") |
| **Existing company** | Merge to existing page if dongle found, else create new page |
| **Multiple dongles** | Each dongle becomes a separate page within the company |
| **Menu location** | Right-click company → "Import License" |

### Page Creation Logic

```
If company exists:
  If page for this dongle/key exists → UPDATE existing page (merge bits)
  Else → CREATE new page named after dongle/key
Else:
  CREATE new company with Customer name
  CREATE page named after dongle/key
```

---

## Why Text Paste (Not PDF Upload)

### The Problem with PDFs

SolidCAM license PDFs exported from Salesforce are **flattened** - checkboxes are rendered as images, not form fields. Our attempts to detect checked vs unchecked checkboxes via image analysis proved unreliable:

- Different PDF exports use different image assets
- Position matching is error-prone
- No way to reliably distinguish checked vs unchecked

### The Solution: Ctrl+A from Salesforce

When viewing a dongle record in Salesforce, users can **Ctrl+A** (select all) and **Ctrl+C** (copy). The copied text includes explicit **"Checked"** / **"Not Checked"** labels for every feature:

```
Modeler    Checked    C-axes (Wrap)    Checked
Machinist  Checked    4-axes Indexial  Checked
HSM        Checked    5-axes indexial  Not Checked
```

This is **100% reliable** - no image detection needed.

---

## Salesforce Text Format

When copying a dongle page, the text contains:

### Header Fields
```
Dongle No.           77518
Serial No.           4953CFDB
Customer             Apollo Design Technology, Inc.
Dongle Type          MINI-USB
Net Dongle           Not Checked
Maintenance Type     SC
Maintenance Start    2/1/2026
Maintenance End      1/31/2027
SolidCAM Version     2026
```

### Feature Checkboxes (SolidCAM Section)
```
Hide Section - SolidCAMSolidCAM
Modeler             Checked    C-axes (Wrap)           Checked
Machinist           Checked    4-axes Indexial         Checked
SolidCAM Mill 2D    Checked    5-axes indexial         Checked
...
HSM                 Checked    Swarf machining         Not Checked
iMachining          Checked    5x Drill                Not Checked
```

### Key Characteristics

1. **Two-column layout**: Feature name followed by "Checked" or "Not Checked"
2. **Tab/space separated**: Columns separated by whitespace
3. **Section headers**: "Hide Section - SolidCAM" etc. can be ignored
4. **Explicit status**: Every feature has explicit Checked/Not Checked text

---

## Complete CheatSheet Bits Reference

### SC-Mill Package

**25M Group (master bit):**
| Bit Name | Salesforce Variations |
| -------- | --------------------- |
| Modeler | Modeler |
| Machinist | Machinist |
| SolidCAM Mill 2D | SolidCAM Mill 2D |
| Profile/Pocket 2.5D Rest Material | Profile/Pocket 2.5D Rest Material |
| SolidCAM Mill 2.5D | SolidCAM Mill 2.5D |
| Pocket Recognition | Pocket Recognition |
| Chamfer Recognition | Chamfer recognition, Chamfer Recognition |
| Hole+Drill Recognition | Hole+Drill Recognition, Hole + Drill Recognition |
| SC Mill 3D | SolidCAM Mill 3D, SolidCAM Mill3D |
| C-axes (Wrap) | C-axes (Wrap) |
| 4-axes Indexial | 4-axes Indexial |
| 5-axes Indexial | 5-axes indexial, 4/5 axes indexial |
| Multi-Depth Drill | Multi-depth Drill, Multi-Depth Drill |

**Loose Bits:**
| Bit Name | Salesforce Variations |
| -------- | --------------------- |
| HSS | HSS |

### SC-Turn Package

**Loose Bits:**
| Bit Name | Salesforce Variations |
| -------- | --------------------- |
| SolidCAM Turning | SolidCAM Turning |
| Backspindle | BackSpindle, Back Spindle |

### SC-Mill-Adv Package

**Loose Bits:**
| Bit Name | Salesforce Variations |
| -------- | --------------------- |
| iMach2D | iMachining |
| Machine Simulation | Machine Simulation |
| Edge Breaking | 5x Edge Breaking, Edge Breaking |

### SC-Mill-3D Package

**Loose Bits:**
| Bit Name | Salesforce Variations |
| -------- | --------------------- |
| HSM | HSM |
| iMach3D | iMachining3D |

### SC-Mill-5Axis Package

**SIM5X Group (master bit):**
| Bit Name | Salesforce Variations |
| -------- | --------------------- |
| Sim5x | Simultanous 5x, Simultaneous 5x, Sim 5x, Sim5x |
| Swarf machining | Swarf machining |
| 5x Drill | 5x Drill |
| Contour 5x | Contour 5x |
| Convert5X | Convert5X, Convert5x |
| Auto 3+2 Roughing | Auto 3+2 Roughing |
| Screw Machining (Rotary) | Screw Machining (Rotary) |

**Loose Bits:**
| Bit Name | Salesforce Variations |
| -------- | --------------------- |
| Sim4x | Simultanous 4x, Simultaneous 4x |
| Multiaxis Roughing | Multi-Axis Roughing, Multiaxis Roughing |

---

## Standalone Maintenance SKUs (Not in Packages)

These SKUs appear in the Maintenance SKUs panel and should be checked when corresponding dongle bits are ON.

| Maintenance SKU | Salesforce Feature | Notes |
|-----------------|-------------------|-------|
| 25M-Maint | Any bit from 25M group | Standalone 2.5D milling |
| EdgeBreak-Maint | 5x Edge Breaking | Standalone Edge Breaking |
| EdgeTrim-Maint | 5x Edge Trimming | Standalone Edge Trimming |
| HSM-Maint | HSM | Standalone HSM |
| HSS-Maint | HSS | Standalone HSS |
| iMach2D-Maint | iMachining | Standalone iMachining 2D |
| iMach3D-Maint | iMachining3D | Standalone iMachining 3D |
| Lic-Net-Maint | Net Dongle = Checked | Network license |
| MachSim-Maint | Machine Simulation | Standalone Machine Sim |
| MTS-Maint | Multi Turret Sync | Includes Sim. Turning |
| Multiaxis-Maint | Multi-Axis Roughing | Standalone Multiaxis |
| Multiblade-Maint | MultiBlade 5x | Multiblade module |
| Port-Maint | Port 5x | Port machining module |
| Probe-Maint | Probe - Full | Solid Probe module |
| Sim4x-Maint | Simultanous 4x | Standalone Sim 4-axis |
| Sim5x-Maint | Simultanous 5x | Standalone Sim 5-axis |
| SolidShop-Editor-Maint | Cimco | CIMCO Editor |
| SolidShop-Sim-Maint | Editor Mode | SolidCAM for Operators |
| Swiss-Maint | Swiss-Type | Swiss-Type turning |
| Turn-Maint | SolidCAM Turning | Extra SKU for SC-Turn |
| Vericut-Maint | Vericut | Vericut integration |
| NPD-Maint | NO G-code = Checked | Non-posting dongle |

---

## Salesforce Features to IGNORE (Not in CheatSheet)

These features have no corresponding bit or SKU and should be silently skipped:

**Milling/General:**
- SolidCAM 2.7D(CONSTANT Z)
- Stl Support / STL Support
- HSM Basic
- HSM Rough
- No drill recognition
- Reduced HolesR

**Turning:**
- SolidCAM TurnMILL
- SolidCAM TurnMill Level
- SolidCAM Turn-Mill Options

**5-Axis:**
- Sim 5x Level (processed via special logic)
- No HSS

**Wire EDM:**
- SolidCAM WireEDM 2 axes
- SolidCAM WireEDM 2/4 axes

**Integrations (not tracked):**
- WinTool
- TDM
- Zoller integration
- DNCTOOL For Windows
- DNCTOOL For Dos

**Other:**
- GPX
- Probe - Home define
- Prismatic HSM
- SolidCAM Mill 3D(No Milling)
- Xpress plus
- G-Code Simulation
- Eureka
- Express / Xpress variants

---

## Text Parsing Strategy

### 1. Parse Header Info

```typescript
function parseHeaderInfo(text: string): LicenseInfo {
  return {
    dongleNo: extractField(text, 'Dongle No.'),
    serialNo: extractField(text, 'Serial No.'),
    customer: extractField(text, 'Customer'),
    dongleType: extractField(text, 'Dongle Type'),
    isNetwork: extractChecked(text, 'Net Dongle'),
    maintenanceType: extractField(text, 'Maintenance Type'),
    maintenanceStart: extractField(text, 'Maintenance Start Date'),
    maintenanceEnd: extractField(text, 'Maintenance End Date'),
    solidcamVersion: extractField(text, 'SolidCAM Version'),
  };
}

function extractField(text: string, fieldName: string): string {
  // Match "Field Name    value" pattern
  const regex = new RegExp(fieldName + '\\s+([^\\n\\t]+)', 'i');
  const match = text.match(regex);
  return match?.[1]?.trim() || '';
}
```

### 2. Parse Checked Features

```typescript
function parseCheckedFeatures(text: string): string[] {
  const features: string[] = [];

  // All known feature names
  const knownFeatures = [
    'Modeler', 'Machinist', 'SolidCAM Mill 2D', 'SolidCAM Mill 2.5D',
    'SolidCAM Mill 3D', 'HSM', 'HSS', 'iMachining', 'iMachining3D',
    // ... all features from FEATURE_MAP
  ];

  for (const feature of knownFeatures) {
    // Look for "Feature    Checked" pattern (NOT "Not Checked")
    const regex = new RegExp(
      feature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+Checked(?!\\s*Not)',
      'i'
    );
    if (regex.test(text)) {
      features.push(feature);
    }
  }

  return features;
}
```

### 3. Validate Input

```typescript
function validateSalesforceText(text: string): { valid: boolean; error?: string } {
  // Must contain key Salesforce markers
  if (!text.includes('Dongle No.')) {
    return { valid: false, error: 'Not a valid Salesforce dongle page' };
  }

  // Must have SolidCAM section
  if (!text.includes('SolidCAM') && !text.includes('Modeler')) {
    return { valid: false, error: 'No SolidCAM features found' };
  }

  // Must have at least one Checked/Not Checked
  if (!text.includes('Checked')) {
    return { valid: false, error: 'No checkbox states found' };
  }

  return { valid: true };
}
```

---

## Implementation Plan

### Files to Modify

| File | Changes |
| ---- | ------- |
| `src/lib/utils/salesforceParser.ts` | NEW - Parse Salesforce text |
| `src/lib/services/licenseImport.ts` | Update to use text parsing |
| `src/lib/components/ui/ImportLicenseModal.svelte` | Replace file picker with textarea |
| `src/lib/types/index.ts` | Update types if needed |

### Files to Remove/Archive

| File | Reason |
| ---- | ------ |
| `src/lib/utils/pdfParser.ts` | No longer needed (can archive) |
| Analysis scripts (*.mjs) | No longer needed |

---

## New UI Flow

### State Machine

```text
paste → parsing → preview → importing → results
```

### State: paste

**UI:**

- Large textarea: "Paste Salesforce dongle page here (Ctrl+A, Ctrl+C)"
- Placeholder text showing example
- Parse button (disabled until text entered)
- Cancel button

**Actions:**

- On Parse click: Validate and parse (button required, no auto-parse)

### State: parsing

**UI:**
- Spinner
- "Parsing license data..."

### State: preview

**UI:**

- Summary card showing extracted info:
  - Customer: Apollo Design Technology, Inc.
  - Dongle No: 77518
  - Type: Hardware (MINI-USB)
  - Network: No
  - Features found: 22
  - Maintenance: 2/1/2026 - 1/31/2027

- Feature list (collapsible):
  - Modeler
  - Machinist
  - SolidCAM Mill 2D
  - ...

- Company name input (ONLY if Customer field missing):
  - Only shown when Customer not found in Salesforce text
  - Required field with validation
  - If Customer exists, just display it (not editable)

- Page name shown: Will create/update page "77518"

- Buttons: [Back] [Import]

### State: importing

**UI:**
- Progress indicator
- "Creating company..." / "Selecting bits..."

### State: results

**UI:**
- Success/failure summary
- Company created/updated
- Bits selected count
- SKUs checked count
- Any warnings

- Button: [Done]

---

## Key Differences from PDF Approach

| Aspect | PDF Approach | Text Paste Approach |
| ------ | ------------ | ------------------- |
| Input | File picker, drag-drop | Textarea paste |
| Parsing | Image detection (unreliable) | Text matching (100% reliable) |
| Multiple imports | Batch file select | One at a time |
| Complexity | High (pdf.js, image analysis) | Low (regex/string matching) |
| Dependencies | pdfjs-dist | None |
| Accuracy | ~60-70% | 100% |

---

## Migration Notes

### What to Keep

- `src/lib/utils/featureMapper.ts` - Feature→bit mapping (still needed)
- `src/lib/services/licenseImport.ts` - Import logic (update to use new parser)
- Type definitions in `src/lib/types/index.ts`
- Store methods (findByName, selectBits, etc.)

### What to Replace

- `src/lib/utils/pdfParser.ts` → `src/lib/utils/salesforceParser.ts`
- `ImportLicenseModal.svelte` - Complete rewrite for textarea UI

### What to Remove

- pdfjs-dist dependency (optional - keep if other features need it)
- PDF analysis scripts in project root

---

## Implementation Log

### Phase 1-3: PDF Approach (Archived)

**Date:** 2026-01-17 to 2026-01-18

**Status:** ARCHIVED - Replaced by text paste approach

**What was built:**

- `src/lib/utils/pdfParser.ts` - PDF parsing with pdfjs-dist
- `src/lib/utils/featureMapper.ts` - Feature→bit mapping (STILL USED)
- `src/lib/services/licenseImport.ts` - Import orchestration (NEEDS UPDATE)
- `src/lib/components/ui/ImportLicenseModal.svelte` - File picker UI (NEEDS REWRITE)
- Store methods: `findByName()`, `selectBits()`, `setLicenseData()` (STILL USED)
- Type definitions in `src/lib/types/index.ts` (STILL USED)

**Why archived:**

SolidCAM license PDFs are **flattened** - checkboxes are rendered as images, not form fields. Image-based detection proved unreliable:

- Different PDFs use different checkbox image assets
- Position matching between checkboxes and feature text was error-prone
- "Most common image = unchecked" heuristic didn't work for all PDFs
- Accuracy was ~60-70%, unacceptable for production use

### Phase 4: Salesforce Text Approach (Complete)

**Date:** 2026-01-18

**Status:** IMPLEMENTED

**Completed Tasks:**

- [x] Create `src/lib/utils/salesforceParser.ts` - Parse Salesforce text
- [x] Rewrite `ImportLicenseModal.svelte` for textarea UI
- [x] Update `licenseImport.ts` to use new parser
- [x] Update page creation logic (page per dongle)
- [x] Archive/remove PDF parsing code and analysis scripts
- [ ] Test with real Salesforce dongle pages

**Files created:**

| File | Purpose |
| ---- | ------- |
| `src/lib/utils/salesforceParser.ts` | Parse pasted Salesforce text |

**Files modified:**

| File | Changes |
| ---- | ------- |
| `src/lib/components/ui/ImportLicenseModal.svelte` | Textarea-based UI with paste → parse → preview → import flow |
| `src/lib/services/licenseImport.ts` | Uses salesforceParser, page-per-dongle logic |

**Files removed:**

| File | Reason |
| ---- | ------ |
| `src/lib/utils/pdfParser.ts` | PDF approach abandoned |
| `analyze-checkboxes.mjs` | PDF analysis script |
| `check-pdf.mjs` | PDF analysis script |
| `test-pdflib.mjs` | PDF analysis script |

---

## Testing Checklist

- [ ] Paste from Salesforce dongle page (Ctrl+A, Ctrl+C)
- [ ] Verify all checked features are detected
- [ ] Verify unchecked features are NOT detected
- [ ] Verify header info extraction (customer, dongle#, etc.)
- [ ] Import creates new company correctly
- [ ] Import to existing company creates new page for new dongle
- [ ] Import to existing company + existing dongle page merges bits
- [ ] Page named after dongle number (or last 4 of product key)
- [ ] Maintenance SKUs are checked correctly
- [ ] Network license (Lic-Net-Maint) detected from "Net Dongle Checked"
- [ ] Company name input only shown when Customer field missing
- [ ] Invalid text shows helpful error
- [ ] Empty paste is handled gracefully
