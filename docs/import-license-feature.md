# Feature: PDF License Import

## Summary

Add an "Import" option to the company right-click context menu that parses SolidCAM license PDFs (exported from Salesforce) and automatically:

1. Creates companies if they don't exist
2. Maps license features to package bits
3. Merges new data without overwriting existing selections

---

## PDF Types Supported

We have **2 PDF formats** to handle:

### Format 1: Standard License (4 of 5 PDFs)

Header shows dongle number, has "Customer" field for company name.

**Sample PDFs:**
- `Hardware DONGLE.pdf` - Lights Out Manufacturing (dongle #70625, MINI-USB)
- `Standalone Product key.pdf` - Lortie Aviation (product key, Net Dongle)
- `Network product key no profile.pdf` - Advance Machines Ltd (product key, standalone)
- `nETWORK dongle no profile .pdf` - Remo, Inc. (dongle #41871, MINI-NETUSB)

**Key Fields:**
| Field | Example |
| ----- | ------- |
| Customer | Lights Out Manufacturing |
| Dongle No. | 70625 |
| Serial No. | 58A2942F |
| Maintenance Type | SC |
| Maintenance Start Date | 4/1/2025 |
| Maintenance End Date | 3/31/2026 |
| SolidCAM Version | 2025 |
| Dongle Type | MINI-USB, Software, MINI-NETUSB |
| Net Dongle | checkbox (✓ = network license) |
| Product key | UUID (for software licenses) |

### Format 2: Profile License (1 of 5 PDFs)

Header shows "Profile-XXXX", has "Profile Name" field instead of Customer.

**Sample PDF:**
- `Network product or net dongle key but as a profile.pdf` - Profile-3124

**Key Fields:**
| Field | Example |
| ----- | ------- |
| Profile Name | Profile-3124 |
| Profile Users | 1 |
| Dongle No. | 398858942134134850 |
| Profile No. | 2 |

**Note:** Profile PDFs may need to use Profile Name as company name, or prompt user for company name.

---

## Complete CheatSheet Bits Reference

### SC-Mill Package

**25M Group (master bit):**
| Bit Name | PDF Variations |
| -------- | -------------- |
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
| Bit Name | PDF Variations |
| -------- | -------------- |
| HSS | HSS |

### SC-Turn Package

**Loose Bits:**
| Bit Name | PDF Variations |
| -------- | -------------- |
| SolidCAM Turning | SolidCAM Turning |
| Backspindle | BackSpindle, Back Spindle |

### SC-Mill-Adv Package

**Loose Bits:**
| Bit Name | PDF Variations |
| -------- | -------------- |
| iMach2D | iMachining |
| Machine Simulation | Machine Simulation |
| Edge Breaking | 5x Edge Breaking, Edge Breaking |

### SC-Mill-3D Package

**Loose Bits:**
| Bit Name | PDF Variations |
| -------- | -------------- |
| HSM | HSM |
| iMach3D | iMachining3D |

### SC-Mill-5Axis Package

**SIM5X Group (master bit):**
| Bit Name | PDF Variations |
| -------- | -------------- |
| Sim5x | Simultanous 5x, Simultaneous 5x, Sim 5x, Sim5x |
| Swarf machining | Swarf machining |
| 5x Drill | 5x Drill |
| Contour 5x | Contour 5x |
| Convert5X | Convert5X, Convert5x |
| Auto 3+2 Roughing | Auto 3+2 Roughing |
| Screw Machining (Rotary) | Screw Machining (Rotary) |

**Loose Bits:**
| Bit Name | PDF Variations |
| -------- | -------------- |
| Sim4x | Simultanous 4x, Simultaneous 4x, Simultaneous 4-axes(C axes) |
| Multiaxis Roughing | Multi-Axis Roughing, Multiaxis Roughing |

---

## Standalone Maintenance SKUs (Not in Packages)

These SKUs appear in the Maintenance SKUs panel and should be checked when corresponding dongle bits are ON.

| Maintenance SKU | PDF Dongle Bit(s) | Notes |
|-----------------|-------------------|-------|
| 25M-Maint | Any bit from 25M group | Standalone 2.5D milling |
| EdgeBreak-Maint | 5x Edge Breaking | Standalone Edge Breaking |
| EdgeTrim-Maint | 5x Edge Trimming | Standalone Edge Trimming |
| HSM-Maint | HSM | Standalone HSM |
| HSS-Maint | HSS | Standalone HSS |
| iMach2D-Maint | iMachining | Standalone iMachining 2D |
| iMach3D-Maint | iMachining3D | Standalone iMachining 3D |
| Lic-Net-Maint | Net Dongle ✓ | Network license checkbox |
| MachSim-Maint | Machine Simulation | Standalone Machine Sim |
| MTS-Maint | Multi Turret Sync | Includes Sim. Turning |
| Multiaxis-Maint | Multi-Axis Roughing | Standalone Multiaxis |
| Multiblade-Maint | MultiBlade 5x | Multiblade module |
| Port-Maint | Port 5x | Port machining module |
| Probe-Maint | Probe - Full | Solid Probe module |
| Sim4x-Maint | Simultanous 4x | Standalone Sim 4-axis |
| Sim5x-Maint | Simultanous 5x | Standalone Sim 5-axis (full SIM5X) |
| SolidShop-Editor-Maint | Cimco | CIMCO Editor |
| SolidShop-Sim-Maint | Editor Mode | SolidCAM for Operators |
| Swiss-Maint | Swiss-Type | Swiss-Type turning |
| Turn-Maint | SolidCAM Turning | Extra SKU for SC-Turn package |
| Vericut-Maint | Vericut | Vericut integration |
| NPD-Maint | Non Posting Option ✓ | Non-posting dongle checkbox |

### Import Logic for SKUs

When importing from PDF:
1. **Package bits** → Check the corresponding bits in the package (SC-Mill, SC-Turn, etc.)
2. **Standalone SKUs** → Check the item in the Maintenance SKUs panel

The import should handle **both** - user sees bits checked in packages AND relevant SKUs checked in the Maintenance panel.

---

## Complete Feature Mapping Table

This is the definitive mapping from PDF feature names to CheatSheet bits:

```typescript
const FEATURE_MAP: Record<string, { bit: string; package: string }> = {
  // SC-Mill - 25M Group
  'Modeler': { bit: 'Modeler', package: 'SC-Mill' },
  'Machinist': { bit: 'Machinist', package: 'SC-Mill' },
  'SolidCAM Mill 2D': { bit: 'SolidCAM Mill 2D', package: 'SC-Mill' },
  'Profile/Pocket 2.5D Rest Material': { bit: 'Profile/Pocket 2.5D Rest Material', package: 'SC-Mill' },
  'SolidCAM Mill 2.5D': { bit: 'SolidCAM Mill 2.5D', package: 'SC-Mill' },
  'Pocket Recognition': { bit: 'Pocket Recognition', package: 'SC-Mill' },
  'Chamfer recognition': { bit: 'Chamfer Recognition', package: 'SC-Mill' },
  'Chamfer Recognition': { bit: 'Chamfer Recognition', package: 'SC-Mill' },
  'Hole+Drill Recognition': { bit: 'Hole+Drill Recognition', package: 'SC-Mill' },
  'Hole + Drill Recognition': { bit: 'Hole+Drill Recognition', package: 'SC-Mill' },
  'SolidCAM Mill 3D': { bit: 'SC Mill 3D', package: 'SC-Mill' },
  'SolidCAM Mill3D': { bit: 'SC Mill 3D', package: 'SC-Mill' },
  'C-axes (Wrap)': { bit: 'C-axes (Wrap)', package: 'SC-Mill' },
  '4-axes Indexial': { bit: '4-axes Indexial', package: 'SC-Mill' },
  '5-axes indexial': { bit: '5-axes Indexial', package: 'SC-Mill' },
  '4/5 axes indexial': { bit: '5-axes Indexial', package: 'SC-Mill' },
  'Multi-depth Drill': { bit: 'Multi-Depth Drill', package: 'SC-Mill' },
  'Multi-Depth Drill': { bit: 'Multi-Depth Drill', package: 'SC-Mill' },

  // SC-Mill - Loose
  'HSS': { bit: 'HSS', package: 'SC-Mill' },

  // SC-Turn
  'SolidCAM Turning': { bit: 'SolidCAM Turning', package: 'SC-Turn' },
  'BackSpindle': { bit: 'Backspindle', package: 'SC-Turn' },
  'Back Spindle': { bit: 'Backspindle', package: 'SC-Turn' },

  // SC-Mill-Adv
  'iMachining': { bit: 'iMach2D', package: 'SC-Mill-Adv' },
  'Machine Simulation': { bit: 'Machine Simulation', package: 'SC-Mill-Adv' },
  '5x Edge Breaking': { bit: 'Edge Breaking', package: 'SC-Mill-Adv' },
  'Edge Breaking': { bit: 'Edge Breaking', package: 'SC-Mill-Adv' },

  // SC-Mill-3D
  'HSM': { bit: 'HSM', package: 'SC-Mill-3D' },
  'iMachining3D': { bit: 'iMach3D', package: 'SC-Mill-3D' },

  // SC-Mill-5Axis - SIM5X Group
  'Simultanous 5x': { bit: 'Sim5x', package: 'SC-Mill-5Axis' },
  'Simultaneous 5x': { bit: 'Sim5x', package: 'SC-Mill-5Axis' },
  'Sim 5x': { bit: 'Sim5x', package: 'SC-Mill-5Axis' },
  'Sim5x': { bit: 'Sim5x', package: 'SC-Mill-5Axis' },
  'Swarf machining': { bit: 'Swarf machining', package: 'SC-Mill-5Axis' },
  '5x Drill': { bit: '5x Drill', package: 'SC-Mill-5Axis' },
  'Contour 5x': { bit: 'Contour 5x', package: 'SC-Mill-5Axis' },
  'Convert5X': { bit: 'Convert5X', package: 'SC-Mill-5Axis' },
  'Convert5x': { bit: 'Convert5X', package: 'SC-Mill-5Axis' },
  'Auto 3+2 Roughing': { bit: 'Auto 3+2 Roughing', package: 'SC-Mill-5Axis' },
  'Screw Machining (Rotary)': { bit: 'Screw Machining (Rotary)', package: 'SC-Mill-5Axis' },

  // SC-Mill-5Axis - Loose
  'Simultanous 4x': { bit: 'Sim4x', package: 'SC-Mill-5Axis' },
  'Simultaneous 4x': { bit: 'Sim4x', package: 'SC-Mill-5Axis' },
  'Simultaneous 4-axes(C axes)': { bit: 'Sim4x', package: 'SC-Mill-5Axis' },
  'Multi-Axis Roughing': { bit: 'Multiaxis Roughing', package: 'SC-Mill-5Axis' },
  'Multiaxis Roughing': { bit: 'Multiaxis Roughing', package: 'SC-Mill-5Axis' },
};

/**
 * Standalone SKU mappings - PDF dongle bits that check items in Maintenance SKUs panel
 * These are NOT package bits - they are panel items
 */
const SKU_MAP: Record<string, string> = {
  // Turning modules
  'Swiss-Type': 'Swiss-Maint',
  'Multi Turret Sync': 'MTS-Maint',
  'Sim. Turning': 'MTS-Maint',  // Included in MTS

  // 5-Axis standalone modules
  'MultiBlade 5x': 'Multiblade-Maint',
  'Port 5x': 'Port-Maint',
  '5x Edge Trimming': 'EdgeTrim-Maint',

  // Add-ons
  'Probe - Full': 'Probe-Maint',
  'Vericut': 'Vericut-Maint',
  'Cimco': 'SolidShop-Editor-Maint',
  'Cimco Add-On': 'SolidShop-Editor-Maint',
  'Editor Mode': 'SolidShop-Sim-Maint',

  // Network license
  'Net Dongle': 'Lic-Net-Maint',  // Checkbox field

  // Non-posting dongle
  'Non Posting Option': 'NPD-Maint',  // Checkbox field
  'NO G-code': 'NPD-Maint',  // Alternative name
};
```

---

## PDF Features to IGNORE (Not in CheatSheet)

These PDF features have no corresponding bit or SKU and should be silently skipped:

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
- SolidCAM Turn-Mill Options (BS_XYZCB, etc.)

**5-Axis:**
- Sim 5x Level / Sim5xLevel (processed via special logic, not direct mapping)
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
- Probe - Home define (partial probe - not tracked)
- Prismatic HSM
- SolidCAM Mill 3D(No Milling)
- Xpress plus
- G-Code Simulation
- Eureka
- Profile
- Mill 2D - Express / Xpress (2D)
- HSS - Express / Xpress (HSS)

---

## Profile-Specific: Sim 5x Level Handling

Profile PDFs have a **compound field** for 5-axis simulation that requires special parsing logic. Unlike Standard PDFs where each bit has its own checkbox, Profile PDFs combine a checkbox with a level selector.

### PDF Structure

```
Sim 5x           ☐ or ✓    (checkbox)
Sim 5x Level     [value]   (text field: empty, "3 Axis", or "3/4 Axis")
```

### Logic Table

| Sim 5x Checkbox | Sim 5x Level Value | Bits to Enable |
|-----------------|-------------------|----------------|
| ✓ | *empty/blank* | Full SIM5X group: `Sim5x`, `Swarf machining`, `5x Drill`, `Contour 5x`, `Convert5X`, `Auto 3+2 Roughing`, `Screw Machining (Rotary)` |
| ✓ | "3 Axis" | `HSS` only (already in SC-Mill) |
| ✓ | "3/4 Axis" | `Sim4x` only |
| ☐ | *any* | No 5-axis bits |

### Implementation

```typescript
interface Sim5xParsed {
  enabled: boolean;      // Sim 5x checkbox checked
  level: '' | '3 Axis' | '3/4 Axis';
}

function parseSim5xFromProfile(text: string): Sim5xParsed {
  // Check if Sim 5x checkbox is checked
  const sim5xLine = text.match(/Sim 5x\s+[✓✔☑]/i);
  const enabled = !!sim5xLine;

  // Extract level value
  const levelMatch = text.match(/Sim 5x Level\s+([^\n]*)/i);
  const level = levelMatch?.[1]?.trim() || '';

  return { enabled, level: level as Sim5xParsed['level'] };
}

function getSim5xBits(parsed: Sim5xParsed): string[] {
  if (!parsed.enabled) return [];

  switch (parsed.level) {
    case '3 Axis':
      return ['HSS'];  // HSS only
    case '3/4 Axis':
      return ['Sim4x'];  // Sim4x only
    case '':
    default:
      // Full SIM5X group
      return [
        'Sim5x',
        'Swarf machining',
        '5x Drill',
        'Contour 5x',
        'Convert5X',
        'Auto 3+2 Roughing',
        'Screw Machining (Rotary)'
      ];
  }
}
```

### Notes

- **Standard PDFs**: Each 5-axis bit has its own checkbox - no special handling needed
- **Profile PDFs**: Use the compound logic above for the `Sim 5x` + `Sim 5x Level` fields
- The `Sim 5x Level` field should be in the "PDF Features to IGNORE" list for direct mapping, but processed via this special logic
- If `Sim 5x Level` contains an unexpected value, treat as empty (full 5-axis)

---

## Implementation Plan

### 1. Install Dependencies

```bash
pnpm add pdfjs-dist
```

### 2. New Type Definitions

**File:** `src/lib/types/index.ts`

```typescript
// License types
export type LicenseType = 'dongle' | 'product-key';
export type DongleType = 'MINI-USB' | 'MINI-NETUSB' | 'Software' | string;

export interface LicenseInfo {
  // Identification
  customer: string;           // From "Customer" or "Profile Name"
  dongleNo: string;           // Dongle number or product key ID
  serialNo: string;
  productKey?: string;        // UUID for software licenses

  // License details
  licenseType: LicenseType;   // 'dongle' or 'product-key'
  dongleType: DongleType;     // 'MINI-USB', 'Software', etc.
  isNetworkLicense: boolean;  // Net Dongle checkbox
  isProfile: boolean;         // True if Profile format PDF

  // Maintenance
  maintenanceType: string;    // 'SC', 'SC+SW', etc.
  maintenanceStart: string;
  maintenanceEnd: string;
  solidcamVersion: string;

  // Extracted features (raw from PDF)
  features: string[];
}

export interface ImportResult {
  success: boolean;
  companyId?: string;
  companyName: string;
  isNewCompany: boolean;
  featuresImported: number;
  featuresSkipped: number;    // Features not in our packages
  errors?: string[];
}

export interface ParsedPDF {
  fileName: string;
  license: LicenseInfo | null;
  parseError?: string;
}
```

### 3. New Files to Create

| File | Purpose |
| ---- | ------- |
| `src/lib/utils/pdfParser.ts` | PDF text extraction using pdfjs-dist |
| `src/lib/utils/featureMapper.ts` | Map PDF feature names to package bits |
| `src/lib/services/licenseImport.ts` | Orchestrate import with merge logic |
| `src/lib/components/ui/ImportLicenseModal.svelte` | UI for file selection, preview, results |

### 4. Modify Existing Files

**`src/lib/components/layout/CompanyPageBar.svelte`**

- Add "Import" button to company context menu (line ~553)
- Add `showImportModal` state
- Add `handleImportLicense()` handler
- Import and render `ImportLicenseModal`

**`src/lib/stores/companies.svelte.ts`**

- Add `findByName(name: string)` method for case-insensitive lookup
- Add `setLicenseData(id, licenseData)` method for storing license metadata
- Extend Company interface to include optional `licenseData` field

**`src/lib/stores/packages.svelte.ts`**

- Add `selectBits(packageCode, bits[])` method for batch selection

### 5. Import Flow

```text
User right-clicks company -> Context menu -> "Import"
    |
    v
ImportLicenseModal opens -> File picker (accept=".pdf", multiple)
    |
    v
Parse PDF(s) with pdfjs-dist:
  - Detect format (Standard vs Profile)
  - Extract company name
  - Extract dongle/license info
  - Extract checked features
    |
    v
Preview: Show table with:
  - Filename
  - Customer/Profile name
  - Dongle #
  - License type
  - Features found (total / mappable)
    |
    v
User confirms -> Execute import:
    |
    v
For each license:
  1. Check if company exists (by name, case-insensitive)
  2. If exists: merge features (union, preserve existing)
  3. If not: create company, add features
  4. Store license metadata in company
    |
    v
Show results:
  - Companies created/updated
  - Features imported per company
  - Any errors
```

### 6. PDF Parsing Strategy

**Detect PDF Format:**
```typescript
function detectPdfFormat(text: string): 'standard' | 'profile' {
  if (text.includes('Profile Name') && text.includes('Profile Users')) {
    return 'profile';
  }
  return 'standard';
}
```

**Extract Company Name:**
```typescript
function extractCompanyName(text: string, format: 'standard' | 'profile'): string | null {
  if (format === 'profile') {
    // Look for "Profile Name" field
    const match = text.match(/Profile Name\s+([^\n]+)/i);
    return match?.[1]?.trim() || null;
  } else {
    // Look for "Customer" field
    const match = text.match(/Customer\s+([^\n]+?)(?:\s+Product key|\s*$)/i);
    return match?.[1]?.trim() || null;
  }
}
```

**Extract Features:**
```typescript
function extractFeatures(text: string): string[] {
  const features: string[] = [];

  // PDF checkmarks appear as ✓ or similar unicode
  // Features are listed in the SolidCAM section
  // Look for patterns like "Modeler ✓" or "✓ Modeler"

  const lines = text.split('\n');
  for (const line of lines) {
    // Check for checkmark indicators
    if (/[✓✔☑]/.test(line)) {
      // Extract the feature name
      const cleaned = line.replace(/[✓✔☑]/g, '').trim();
      if (cleaned && !cleaned.includes('Close Window')) {
        features.push(cleaned);
      }
    }
  }

  return features;
}
```

### 7. Merge Logic

**When importing into an existing company:**
- Features: Union of existing + new (never removes existing selections)
- Custom bits: Preserved
- Order: Preserved
- License data: Add new license to array (supports multiple licenses per company)

**When creating a new company:**
- Create company with name from PDF
- Create default page
- Select all mapped features
- Store license metadata

### 8. UI Components

**ImportLicenseModal States:**

1. `select` - File picker with drag-drop zone
2. `parsing` - Loading spinner while parsing PDFs
3. `preview` - Table showing parsed data with import/skip status
4. `importing` - Progress indicator
5. `results` - Summary with success/error counts

**Preview Table Columns:**
- Filename
- Company Name
- Dongle/Key
- Type (Dongle/Product Key, Network/Standalone)
- Features (Found / Mappable)
- Status (Ready / Error)

---

## Critical Files

| File | Changes |
| ---- | ------- |
| `src/lib/components/layout/CompanyPageBar.svelte` | Add Import menu item (line ~553) |
| `src/lib/stores/companies.svelte.ts` | Add findByName, setLicenseData methods |
| `src/lib/stores/packages.svelte.ts` | Add selectBits method |
| `src/lib/types/index.ts` | Add LicenseInfo, ImportResult types |
| `src/lib/utils/pdfParser.ts` | NEW - PDF parsing logic |
| `src/lib/utils/featureMapper.ts` | NEW - Feature mapping table |
| `src/lib/services/licenseImport.ts` | NEW - Import orchestration |
| `src/lib/components/ui/ImportLicenseModal.svelte` | NEW - Import UI |

---

## Verification

### Test with all 5 PDFs:

1. **Hardware DONGLE.pdf** (Lights Out Manufacturing)
   - Type: Hardware dongle (MINI-USB)
   - Expected features: Full 5-axis package

2. **Standalone Product key.pdf** (Lortie Aviation)
   - Type: Product key with Net Dongle checked
   - Expected features: Full package

3. **Network product key no profile.pdf** (Advance Machines Ltd)
   - Type: Product key, standalone
   - Expected features: Milling only (no turning, no 5-axis sim)

4. **nETWORK dongle no profile .pdf** (Remo, Inc.)
   - Type: Network dongle (MINI-NETUSB)
   - Expected features: Basic milling + turning

5. **Network product or net dongle key but as a profile.pdf** (Profile-3124)
   - Type: Profile format (different structure!)
   - Expected features: Milling + 5-axis

### Test Scenarios:

- [ ] Import single PDF - creates new company
- [ ] Import same PDF twice - merges without duplicates
- [ ] Import PDF for existing company - adds features
- [ ] Import multiple PDFs at once - batch processing
- [ ] Import Profile format PDF - handles different structure
- [ ] Import malformed PDF - shows error gracefully

---

## Decisions Made

- **File Selection:** File picker modal - user selects one or many PDFs
- **License Metadata:** Yes, store dongle#, serial, maintenance dates in Company model
- **Unmapped Features:** Silently ignore - only import features that exist in our package bits
- **Profile PDFs:** Prompt user to enter company name (with note: "Will update existing company if name matches")

## Best-Practice Decisions (Clarified)

- **License metadata storage:** Append as versioned entries; never overwrite silently. Compute a "current" view from the newest entry (by import timestamp or maintenance end date).
- **Company name matching:** Normalize for matching only (case/punctuation/whitespace), preserve the original display name for UI and edits.
- **Results reporting:** Show both "new bits added" and "total bits present" per company, plus unmapped/skipped counts for verification.

---

## Implementation Log

### Phase 1: Foundations (Completed)

**Date:** 2026-01-17

**Tasks Completed:**

- [x] Installed `pdfjs-dist@5.4.530`
- [x] Created `src/lib/services/` directory
- [x] Added license types to `src/lib/types/index.ts`:
  - `LicenseType`, `DongleType`
  - `LicenseInfo` (with `importedAt`, `sourceFileName` metadata)
  - `ImportResult` (with `skusImported` count)
  - `ParsedPDF`
- [x] Created `src/lib/utils/pdfParser.ts`:
  - PDF.js worker configuration
  - `extractTextFromPdf()` - text extraction
  - `detectPdfFormat()` - standard vs profile detection
  - `extractCompanyName()`, `extractDongleNo()`, `extractSerialNo()`, etc.
  - `extractFeatures()` - checkmark-based feature detection
  - `parseSim5xFromProfile()` + `getSim5xBits()` - Profile-specific logic
  - `parseLicensePdf()` - main entry point
- [x] Created `src/lib/utils/featureMapper.ts`:
  - `FEATURE_MAP` - 50+ PDF→bit mappings with case variations
  - `SKU_MAP` - 15+ standalone SKU mappings
  - `IGNORED_FEATURES` - features to skip silently
  - `mapFeatures()` - main mapping function
  - `groupByPackage()` - group bits by package for batch selection
  - `getUniqueSkus()`, `calculateImportStats()` - utilities

**Files Created:**

| File                              | Lines | Purpose                          |
| --------------------------------- | ----- | -------------------------------- |
| `src/lib/utils/pdfParser.ts`      | ~240  | PDF text extraction and parsing  |
| `src/lib/utils/featureMapper.ts`  | ~220  | Feature→bit/SKU mapping          |

**Files Modified:**

| File                       | Changes                      |
| -------------------------- | ---------------------------- |
| `src/lib/types/index.ts`   | +48 lines (license types)    |
| `package.json`             | +pdfjs-dist dependency       |

### Phase 2: Store Integration (Completed)

**Date:** 2026-01-17

**Tasks Completed:**

- [x] Added `licenses?: LicenseInfo[]` field to Company interface in `src/lib/types/index.ts`
- [x] Added `normalizeCompanyName()` helper to companies store
- [x] Added `findByName(name: string)` to companies store - case-insensitive, normalized matching
- [x] Added `setLicenseData(companyId, licenseData)` to companies store - append-only
- [x] Added `selectBits(packageCode, bits[])` to packages store - union with existing, returns count added
- [x] Created `src/lib/services/licenseImport.ts`:
  - `parsePdf()` / `parsePdfs()` - parse single or multiple PDFs
  - `getImportPreview()` - preview what will happen without importing
  - `importLicense()` - main import logic (create/find company, select bits, add SKUs)
  - `importParsedPdfs()` - batch import multiple PDFs
  - `calculateImportSummary()` - aggregate statistics
  - `needsCompanyNameOverride()` / `getSuggestedCompanyName()` - Profile PDF helpers

**Files Created:**

| File                                | Lines | Purpose                     |
| ----------------------------------- | ----- | --------------------------- |
| `src/lib/services/licenseImport.ts` | ~200  | Import orchestration logic  |

**Files Modified:**

| File                                  | Changes                                          |
| ------------------------------------- | ------------------------------------------------ |
| `src/lib/types/index.ts`              | +1 line (licenses field on Company)              |
| `src/lib/stores/companies.svelte.ts`  | +50 lines (findByName, setLicenseData, helper)   |
| `src/lib/stores/packages.svelte.ts`   | +15 lines (selectBits method)                    |

### Phase 3: UI Implementation (Completed)

**Date:** 2026-01-18

**Tasks Completed:**

- [x] Created `src/lib/components/ui/ImportLicenseModal.svelte`:
  - 5 modal states: select, parsing, preview, importing, results
  - Drag-drop file picker zone (accept=".pdf", multiple)
  - Preview table with: Filename, Company, Dongle/Key, Type, Features, Status
  - Inline Input for Profile PDFs (company name override)
  - Status badges: Ready (green), Warning (yellow), Error (red)
  - Results summary with success/failure counts and details
- [x] Updated `src/lib/components/layout/CompanyPageBar.svelte`:
  - Added ImportLicenseModal import
  - Added `showImportModal` state variable
  - Added `handleImportLicense()` handler function
  - Added "Import License" menu item to company context menu
  - Added ImportLicenseModal rendering
- [x] Exported ImportLicenseModal from `src/lib/components/ui/index.ts`

**Files Created:**

| File                                              | Lines | Purpose                        |
| ------------------------------------------------- | ----- | ------------------------------ |
| `src/lib/components/ui/ImportLicenseModal.svelte` | ~450  | Import modal with 5-state flow |

**Files Modified:**

| File                                              | Changes                                         |
| ------------------------------------------------- | ----------------------------------------------- |
| `src/lib/components/layout/CompanyPageBar.svelte` | +15 lines (import, state, handler, menu, modal) |
| `src/lib/components/ui/index.ts`                  | +1 line (export ImportLicenseModal)             |

### Phase 3.1: Profile PDF Validation Improvements

**Date:** 2026-01-18

**Problem:** Profile PDFs were allowing import without entering a company name.

**Root Cause:**

- Profile PDFs don't have a standard "Customer" field - they have "Profile Name" instead
- The `getSuggestedCompanyName()` function was auto-filling with extracted text that may not be the actual company name
- This caused `canImport` validation to pass when it shouldn't

**Solution:**

1. Updated `getSuggestedCompanyName()` to always return empty string for Profile PDFs
2. Profile PDFs now always require manual company name entry
3. Added visual feedback: red border on empty required company name input
4. Added debug logging in `canImport` derived to trace validation issues

**Files Modified:**

| File                                              | Changes                                                  |
| ------------------------------------------------- | -------------------------------------------------------- |
| `src/lib/services/licenseImport.ts`               | Profile PDFs return empty from getSuggestedCompanyName   |
| `src/lib/components/ui/ImportLicenseModal.svelte` | Red border on empty input, debug logging in canImport    |

**Validation Flow (Profile PDFs):**

1. `needsCompanyNameOverride(pdf)` → returns `true` (isProfile = true)
2. `getSuggestedCompanyName(pdf)` → returns `''` (empty for Profile PDFs)
3. Company name input shows with red border (`required-empty` class)
4. Status column shows "Name Required" (yellow warning)
5. Import button disabled until user enters valid company name
6. `canImport` derived checks `override.trim().length > 0`

### Phase 4: Testing (Pending)

- [ ] Test all 5 sample PDFs
- [ ] Verify feature mapping accuracy
- [ ] Test edge cases
