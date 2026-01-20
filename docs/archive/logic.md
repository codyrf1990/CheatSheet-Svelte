## License Import Scenarios

| Scenario               | Dongle No.    | Network Product Key | Net Dongle  | Profile | Display Type           | Page Name   |
| ---------------------- | ------------- | ------------------- | ----------- | ------- | ---------------------- | ----------- |
| Hardware Dongle        | 5 digits      | -                   | Not Checked | -       | Hardware Dongle        | `77518`     |
| Network Dongle         | 5 digits      | -                   | Checked     | -       | Network Dongle         | `NWD 77518` |
| Network Product Key    | >5 digits     | Yes                 | Checked     | -       | Network Product Key    | `NPK 7452`  |
| Standalone Product Key | >5 digits     | Yes                 | Not Checked | -       | Standalone Product Key | `SPK 8575`  |
| Profile Only           | Use Profile # | Possibly            | Possibly    | Yes     | NPK/NWD (varies)       | `P5801`     |

### Detection Logic

**Hardware Dongle:**

- Dongle No. = 5 digits
- Net Dongle = Not Checked

**Network Dongle (NWD):**

- Dongle No. = 5 digits
- Net Dongle = Checked

**Network Product Key (NPK):**

- Dongle No. = Long number (>5 digits)
- Net Dongle = Checked

**Standalone Product Key (SPK):**

- Dongle No. = Long number (>5 digits)
- Net Dongle = Not Checked

**Profile Only:**

- Has Profile Name or Profile No.
- Page name uses profile number (e.g., `P5801`)
- Can be NPK or NWD underneath (never SPK)

---

## Profile Dataset Special Handling

### 1. Auto-add Modeler & Machinist

Profile datasets do not include Modeler or Machinist in their feature list, but these should **always be selected** when importing a profile.

### 2. C-axes Mapping

The profile dataset uses different naming for C-axes:

- `"Simultaneous 4-axes(C axes)"` → Maps to **C-axes (Wrap)** in SC-Mill package
- This is NOT the same as Sim4x

### 3. Sim 5x Level Logic

**Applies to Profile-based dongles only.**

**All Sim 5x levels get:** HSS bit (SC-Mill) + HSS-Maint

| Sim 5x Bit      | Sim 5x Level    | Additional                    | Notes                           |
| --------------- | --------------- | ----------------------------- | ------------------------------- |
| 0 (Not Checked) | Any             | None                          | Bit disabled — ignore level     |
| 1 (Checked)     | "3 Axis" or "1" | (HSS only)                    | Restricted to 3-axis HSS        |
| 1 (Checked)     | "3/4 Axis"      | Sim4x bit + Sim4x-Maint       | Allows 4-axis simultaneous      |
| 1 (Checked)     | Blank / empty   | All 5-axis bits + Sim5x-Maint | Unrestricted — they have it all |

**"All 5-axis bits" includes:**

- Sim5x
- Swarf machining
- 5x Drill
- Contour 5x
- Convert5X
- Auto 3+2 Roughing

**Maintenance SKU summary:**

- Sim 5x Level blank → HSS-Maint + Sim5x-Maint
- Sim 5x Level "3/4 Axis" → HSS-Maint + Sim4x-Maint
- Sim 5x Level "3 Axis" → HSS-Maint only

---

## Page Name Generation Rules

```
IF productKey exists AND length > 4:
    last4 = last 4 characters of productKey
    IF isNetworkLicense:
        pageName = "NPK " + last4
    ELSE:
        pageName = "SPK " + last4

ELSE IF dongleNo exists AND not empty:
    IF isNetworkLicense:
        pageName = "NWD " + dongleNo
    ELSE:
        pageName = dongleNo (just the number)

ELSE IF profileNo exists:
    pageName = "P" + profileNo

ELSE:
    pageName = "P1" (fallback)
```

---

## Feature Detection from Salesforce Text

### Header Fields (tab-separated)

- `Dongle No.` - 5 digits for hardware, long number for product keys
- `Customer` - Company name
- `Serial No.` - Hardware serial
- `Dongle Type` - MINI-USB, MINI-NETUSB, Software
- `Net Dongle` - Checked/Not Checked (determines network license)
- `Maintenance Type` - SC, SC+SW, etc.
- `Maintenance Start Date` / `Maintenance Start`
- `Maintenance End Date` / `Maintenance End`
- `SolidCAM Version`
- `Profile No.` - For profile pages
- `Profile Name` - e.g., "Profile-5801"

### Feature Checkbox Detection

For each known feature name:

```
Pattern: FeatureName\s+Checked(?!\s*Not)
```

This matches "Feature Checked" but NOT "Feature Not Checked"

### Profile Information Section

If the Information section is collapsed, look for:

```
Pattern: Profile-(\d+)
```

Extract profile number from the page header.

---

## Validation Rules

Text must contain at least one of:

1. `Dongle No.` field
2. `Profile Name` or `Profile No.` field

AND must contain:

- At least one known feature name from FEATURE_MAP or SKU_MAP
- At least one `Checked` status indicator
