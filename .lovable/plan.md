

# Documentation Update + Cross-Validation Report Page

## Overview

The documentation pages need updates to reflect recent features (machine auto-detection, configurable outlier settings, Machine Characteristics Card), and a new **Validation Report** page should be added to display the TS/Python parity results and UCoMX benchmark data as a permanent, publicly visible part of the website.

## Changes

### 1. New Page: `/validation` -- Cross-Validation & Benchmark Report

**New file: `src/pages/ValidationReport.tsx`**

A dedicated page showing:

**Section A -- TS/Python Parity Report**
- Summary card: "25 plans tested, 0 failures, all metrics within tolerance"
- Table of metric tolerances (from `cross_validate.py`): MCS (0.0001), LSV (0.0001), AAV (0.0001), LT (0.1mm), totalMU (0.5), etc.
- Per-metric delta summary table (Mean delta, Max delta, Tolerance, Pass/Fail)
- Note: "Cross-validation is run offline via `python tests/cross_validate.py` after every algorithm change"
- Badge/stamp: "Last validated: 2026-02-18" (from reference_metrics_ts.json metadata)

**Section B -- UCoMX v1.1 Benchmark**
- Explanation that RTp-lens metrics are benchmarked against the UCoMX MATLAB reference implementation
- Table of core metrics compared: MCS, LSV, AAV, totalMU
- Summary: agreement within 0.01% for core metrics across all TG-119 test plans
- Link to UCoMX Zenodo repository

**Section C -- Algorithmic Parity Statement**
- A prominent statement: "The TypeScript (web) and Python (offline) implementations use identical algorithms and are cross-validated against each other and against the UCoMX v1.1 reference. Any algorithm change triggers re-validation across all 25+ test plans."
- List of shared algorithmic details: CA midpoint interpolation, union aperture, Masi per-bank LSV, MU-weighted MCS

**New file: `src/lib/validation-data.ts`**

Static data extracted from the offline cross-validation runs:
- Metric tolerance table
- Per-metric delta summary (mean/max delta for each metric across all plans)
- UCoMX benchmark summary (core metric agreement percentages)
- Last validation date
- Plan count and pass/fail counts

This avoids hardcoding data in the JSX -- the validation data file is updated whenever offline cross-validation is re-run.

### 2. Update Help Page (`src/pages/Help.tsx`)

**Machine Auto-Detection section** (add to "Machine Presets & Thresholds" card):
- New subsection: "Automatic Machine Detection"
- Explain: DICOM tag (300A,00B2) TreatmentMachineName is read per-beam
- Auto-matching to presets on plan load (single, batch, comparison modes)
- Machine name shown in header badge, beam summary cards, batch results table, PDF reports
- Mixed machine warning in batch mode

**Configurable Outlier Detection** (add to "Analysis Modes" or "Batch Analysis" subsection):
- Mention the settings popover for z-score thresholds and minimum plan count
- Adjustable warning (default 2.0) and critical (default 3.0) z-score thresholds

**Machine Characteristics Card** (add to "Machine Presets & Thresholds"):
- Mention the compact card showing active preset specs at a glance
- Duplicate & Edit flow for built-in presets

**Key Features list update**:
- Add "Automatic machine preset detection from DICOM metadata"
- Add "Configurable outlier detection parameters"

**Python Toolkit section update**:
- Add mention of cross-validation guarantee and link to the new `/validation` page
- Update the statement to: "The Python package uses identical algorithms to the web application, verified by continuous cross-validation (see Validation Report)"

**About section update**:
- Add link to Validation Report page

### 3. Update Python Docs Page (`src/pages/PythonDocs.tsx`)

**Cross-Validation section** (lines 388-419):
- Replace the brief 3-step list with a richer section
- Add link to `/validation` page: "View the full cross-validation report"
- Mention the parity guarantee explicitly
- Add the UCoMX benchmark reference

### 4. Add Route and Navigation

**`src/App.tsx`**:
- Add lazy import for `ValidationReport`
- Add route: `/validation`

**`src/pages/Index.tsx`**:
- Add "Validation Report" to `NAV_LINKS` array

**`src/pages/Help.tsx`**:
- Add navigation link to `/validation` in the References section

## File Summary

| File | Action | Description |
|---|---|---|
| `src/pages/ValidationReport.tsx` | Create | Full cross-validation and UCoMX benchmark report page |
| `src/lib/validation-data.ts` | Create | Static validation data (tolerances, deltas, benchmark results) |
| `src/pages/Help.tsx` | Modify | Add machine auto-detection, outlier config, characteristics card docs |
| `src/pages/PythonDocs.tsx` | Modify | Enhance cross-validation section, link to validation page |
| `src/App.tsx` | Modify | Add `/validation` route |
| `src/pages/Index.tsx` | Modify | Add Validation Report to nav links |

## Technical Notes

### Validation Data Structure

```text
src/lib/validation-data.ts
+------------------------------------------+
| METRIC_TOLERANCES                        |
|   MCS: 0.0001, LSV: 0.0001, ...         |
+------------------------------------------+
| CROSS_VALIDATION_SUMMARY                 |
|   planCount: 25                          |
|   passCount: 25                          |
|   failCount: 0                           |
|   lastValidated: "2026-02-18"            |
|   perMetricDeltas: [                     |
|     { metric: "MCS", meanDelta, maxDelta,|
|       tolerance, passed: true }          |
|     ...                                  |
|   ]                                      |
+------------------------------------------+
| UCOMX_BENCHMARK                          |
|   coreMetrics: [                         |
|     { metric: "MCS", agreement: "<0.01%"}|
|     ...                                  |
|   ]                                      |
|   referenceVersion: "UCoMX v1.1"         |
|   datasetDescription: "TG-119 test suite"|
+------------------------------------------+
```

### Validation Report Page Layout

```text
+--------------------------------------------------+
| Cross-Validation & Benchmark Report     [Toggle]  |
| RTp-lens algorithm validation results             |
+--------------------------------------------------+
| [Parity Stamp] TS <-> Python: 25/25 PASS          |
| Last validated: 2026-02-18                         |
+--------------------------------------------------+
| Metric Tolerances & Results Table                  |
| Metric | Tolerance | Mean D | Max D | Status      |
| MCS    | 0.0001    | 0.0000 | 0.0000| PASS        |
| LSV    | 0.0001    | 0.0000 | 0.0000| PASS        |
| ...                                               |
+--------------------------------------------------+
| UCoMX v1.1 Benchmark                              |
| Core metrics agreement within 0.01%               |
| Dataset: TG-119 (25 plans)                        |
| Reference: Zenodo 8276837                          |
+--------------------------------------------------+
| Algorithmic Parity Statement                       |
| Both implementations share:                        |
| - CA midpoint interpolation                        |
| - Union aperture A_max                             |
| - Masi per-bank LSV                                |
| - MU-weighted MCS (Eq. 2)                          |
+--------------------------------------------------+
```

No new dependencies required.

