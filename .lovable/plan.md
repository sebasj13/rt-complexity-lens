

# Configurable Statistical Analysis + Visible Linac Characteristics

## Overview

Two improvements to make the app more configurable and transparent:

1. **Configurable Outlier Detection Parameters** -- currently the z-score thresholds and minimum plan count are hardcoded in `BatchDashboard.tsx`. These should be user-adjustable via a settings popover.

2. **Visible Linac Characteristics Panel** -- the currently selected machine preset's delivery parameters and thresholds are buried in the Preset Manager dialog. A compact, always-visible summary card should show the active machine's key specs (dose rate, gantry speed, MLC speed/type, thresholds) with a quick-edit button.

## Changes

### 1. Configurable Outlier Detection Settings

**New component: `src/components/batch/OutlierSettings.tsx`**

A popover triggered from the Outlier Report section header with controls for:
- **Z-Score Warning Threshold** (default: 2.0) -- slider or number input, range 1.0-4.0
- **Z-Score Critical Threshold** (default: 3.0) -- slider or number input, range 2.0-5.0
- **Minimum Plans Required** (default: 5) -- number input, range 3-20
- Reset to defaults button

**File: `src/pages/BatchDashboard.tsx`**

- Add state for outlier config: `outlierConfig` with `{ zScoreThreshold, criticalZScoreThreshold, minPlans }`
- Pass config to `detectOutliers()` call (currently hardcoded `{ zScoreThreshold: 2.0, criticalZScoreThreshold: 3.0 }`)
- Pass config + setter to `OutlierReport` and render the settings popover in its header
- Update the `plans.length >= 5` guard to use `minPlans` from config

**File: `src/components/batch/OutlierReport.tsx`**

- Add optional `outlierConfig` and `onOutlierConfigChange` props
- Render a Settings gear icon button in the summary alert bar that opens `OutlierSettings`

### 2. Active Machine Characteristics Card

**New component: `src/components/settings/MachineCharacteristicsCard.tsx`**

A compact card/badge strip that displays the active preset's key specs at a glance:
- Preset name (e.g., "Varian TrueBeam")
- Max Dose Rate, Gantry Speed, MLC Speed, MLC Model
- Threshold summary (warning/critical counts or key values)
- Click-to-edit: clicking the card opens the `PresetEditor` for user presets, or prompts to duplicate for built-in presets
- Shown in the sidebar/settings area of Single Plan Viewer and in the header area of Batch/Cohort dashboards

**File: `src/components/viewer/ThresholdSettings.tsx`**

- Replace the read-only delivery params display (currently only for user presets) with the new `MachineCharacteristicsCard` for ALL preset types (built-in and user)
- Show delivery params and threshold summary for built-in presets too (currently hidden)
- Add an "Edit" or "Duplicate & Edit" button depending on preset type

**File: `src/components/settings/index.ts`**

- Export the new `MachineCharacteristicsCard`

### 3. Summary of All Files

| File | Action | Description |
|---|---|---|
| `src/components/batch/OutlierSettings.tsx` | Create | Popover with z-score and min-plans controls |
| `src/components/batch/OutlierReport.tsx` | Modify | Add settings trigger in header, accept config props |
| `src/pages/BatchDashboard.tsx` | Modify | Add outlier config state, pass to detection + report |
| `src/components/settings/MachineCharacteristicsCard.tsx` | Create | Compact read-only display of active preset specs |
| `src/components/viewer/ThresholdSettings.tsx` | Modify | Show characteristics card for all presets (not just user) |
| `src/components/settings/index.ts` | Modify | Export new component |
| `src/components/batch/index.ts` | Modify | Export OutlierSettings |

### Technical Details

**OutlierSettings popover layout:**
```text
+----------------------------------+
| Outlier Detection Settings       |
+----------------------------------+
| Warning Z-Score    [===|===] 2.0 |
| Critical Z-Score   [=====|=] 3.0 |
| Min Plans Required [  5  ]       |
|                                  |
| [Reset to Defaults]              |
+----------------------------------+
```

**MachineCharacteristicsCard layout:**
```text
+------------------------------------------+
| Varian TrueBeam              [Edit/Dup]  |
| Millennium 120 | MLCX                     |
+------------------------------------------+
| Dose Rate: 600 MU/min  | Gantry: 6.0 d/s|
| MLC Speed: 25 mm/s     | FFF: 1400 MU/m |
+------------------------------------------+
| Thresholds: MCS<0.30w/0.20c  LT>15000w  |
+------------------------------------------+
```

The characteristics card will read from `useThresholdConfig()` using `getCurrentDeliveryParams()` and `getCurrentThresholds()` to always show the active preset's values, whether built-in, user, or custom.

No new dependencies required.

