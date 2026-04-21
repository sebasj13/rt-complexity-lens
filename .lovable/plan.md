

# General Revision: Metric Implementation Review & Improvement Suggestions

## Audit Summary

I reviewed the metric implementations against published references (UCoMx v1.1, Masi 2013, McNiven 2010, Du 2014, Younge 2016, Crowe 2014) and the public reference implementations (`ComplexityCalc`, UCoMx MATLAB). The **core metrics (MCS, LSV, AAV, MFA, LT, EM, PI)** are correctly implemented and well cross-validated. I identified **a few issues and several improvement opportunities**.

---

## Issues Found

### 1. MEDIUM — Per-CP `AAV` formula is non-standard and unused

`calculateControlPointMetrics` (lines 511–524) computes per-CP AAV as:
```
aav = |A_curr − A_prev| / A_prev
```
This is **not** the AAV definition from the literature (which is `A / A_max_union`). The correct beam-level AAV is computed separately and correctly using CA midpoint, but the per-CP value stored in `controlPointMetrics` is misleading and may be displayed in the UI as "AAV per CP".

**Fix:** Either remove this per-CP field, rename it to "ApertureAreaChange", or replace it with `A_cp / A_max_union` so the per-CP display is consistent with the beam-level definition.

### 2. MEDIUM — Tongue-and-Groove uses a magic constant (0.5 mm)

`calculateTongueAndGroove` (lines 322–353) uses a hardcoded `0.5 mm` "approximate T&G width". This is not the standard formulation. The Webb (2001) / Younge T&G index normalizes adjacent leaf step differences by aperture area without an arbitrary scaling factor. The current approach is internally consistent but won't match other tools.

**Fix:** Replace with a literature-standard formulation, e.g.:
```
TGI = Σ_pairs |gap_i − gap_{i+1}| / Σ_pairs (gap_i + gap_{i+1})
```
or document this as an in-house variant in `ALGORITHMS.md`.

### 3. LOW — `MAD` references central axis = 0 instead of jaw center

`calculateMAD` (lines 274–292) uses `centralAxis = 0` regardless of jaw asymmetry. For asymmetric jaws (off-axis fields), this overstates asymmetry. Most reference tools use the **jaw center** as the reference, not the isocenter.

**Fix:** Use `(jawX1 + jawX2) / 2` as reference; document the change.

### 4. LOW — `getMaxLeafTravel` total is summed but called "max"

In `estimateBeamDeliveryTime` (lines 575–582), `getMaxLeafTravel` returns the per-CP max single-leaf travel, then they are **summed across CPs**. This is consistent with the assumption that the slowest leaf gates each segment, but the variable name `totalMLCTravel` and the docstring are slightly misleading.

**Fix:** Rename to `totalMaxPerSegmentLeafTravel` and clarify in `ALGORITHMS.md` that delivery time uses "max-leaf-per-segment" gating, not the cumulative leaf travel `LT`.

### 5. LOW — Arc length wraps incorrectly for >180° single arcs

`estimateBeamDeliveryTime` (lines 567–571) collapses `arcLength > 180` to `360 − arcLength`. This is wrong for partial arcs > 180° (e.g., a 270° single arc). It should use the cumulative CP-by-CP arc span (already used correctly elsewhere in `parser.ts` after the recent fix). Same issue at lines 604–607 for `MUperDegree`.

**Fix:** Use the same cumulative-summation pattern as the parser's `gantry_span`.

---

## Suggested Improvements

### A. Add benchmark against publicly available, runnable references

The validation page already shows TS↔Python parity, but external benchmarks are limited to MRI-imported "UCoMx reference" and ad-hoc ComplexityCalc. Two open-source tools could be wired in as offline benchmarks:

1. **PyComplexityMetric** (`umcu/pycomplexitymetric`, Python, MIT) — implements MCS, AAV, LSV, EM, MAD, etc., on `pydicom`. Easy to call from `cross_validate.py`.
2. **PyMedPhys** (`pymedphys.metrics.mu_density` and complexity) — well-maintained Apache 2.0 package, used clinically.

Adding even one of these as a third validation column on `/validation` would significantly strengthen the scientific credibility narrative.

### B. Add SAS2 and SAS20 (already partly tracked)

`checkSmallApertures` already tracks below2mm, below5mm, below10mm, below20mm — but only `SAS5` and `SAS10` are surfaced in the UI/exports. SAS2 (sub-leaf-resolution apertures) is highly clinically relevant for SBRT. Wire up SAS2 and SAS20 in `metrics-definitions.ts` and exports.

### C. Add Modulation Index (MI_total / MI_speed / MI_acc) per Park et al. 2014

The current `MI = LT / (N_leaves × N_CPs)` is a simplification. Park's MI integrates leaf speed/acceleration distributions and is the most cited modulation metric in QA literature. Worth adding as `MI_t`, `MI_s`, `MI_a`.

### D. Add MCSv (van Esch-style MCSv for VMAT)

The current MCS treats all CAs uniformly weighted by ΔMU. The arc-weighted variant **MCSv** explicitly factors `Δθ` into the weighting and is the de-facto standard for VMAT plan QA in many institutions.

### E. Standardize per-CP aperture metric naming

Per-CP fields are named `apertureLSV`, `apertureAAV`, `apertureArea`, `aperturePerimeter` — but `apertureAAV` is the non-standard per-CP variant (issue 2) and `apertureLSV` is the simplified per-CP LSV (not the bank-product Masi formula). Either prefix these with `cp_` or document clearly that they are display approximations.

### F. Document jaw-area aggregation choice

After the recent Python parity update, plan-level `JA` is now **summed** (not averaged). This is unusual — most papers report mean JA. Worth adding a clear note in `ALGORITHMS.md` explaining why summation was chosen (or revert to mean and expose both).

---

## Proposed Plan (Prioritized)

| # | Change | File(s) | Priority |
|---|--------|---------|----------|
| 1 | Fix per-CP AAV definition (use `A_cp / A_max_union`) | `src/lib/dicom/metrics.ts` + Python mirror | High |
| 2 | Fix arc length calculation in `estimateBeamDeliveryTime` to use cumulative span | `src/lib/dicom/metrics.ts` | High |
| 3 | Replace magic-constant T&G with Webb 2001 formulation; document | `src/lib/dicom/metrics.ts`, `python/.../metrics.py`, `docs/ALGORITHMS.md` | Medium |
| 4 | MAD: use jaw center as reference instead of isocenter | `src/lib/dicom/metrics.ts`, Python mirror | Medium |
| 5 | Surface SAS2 and SAS20 in metrics definitions and exports | `src/lib/metrics-definitions.ts`, exports | Medium |
| 6 | Add `pycomplexitymetric` benchmark to `cross_validate.py` and Validation Report | `python/tests/`, `src/lib/validation-data.ts`, `src/pages/ValidationReport.tsx` | Medium |
| 7 | Document JA summation choice in ALGORITHMS.md | `docs/ALGORITHMS.md` | Low |
| 8 | Clarify naming of per-CP "approximate" metrics in code & docs | `src/lib/dicom/metrics.ts`, `docs/ALGORITHMS.md` | Low |
| 9 | (Optional) Add MCSv arc-weighted variant | `metrics.ts`, Python mirror, docs | Low/future |
| 10 | (Optional) Add Park MI_t / MI_s / MI_a | `metrics.ts`, Python mirror, docs | Low/future |

After implementation: re-run TS test suite + Python `cross_validate.py` to confirm no regressions; regenerate `reference_metrics_ts.json`.

**I recommend starting with items 1–6** (the correctness fixes plus the external benchmark), which together meaningfully improve both accuracy and the "publicly verifiable" story. Items 9–10 are larger feature additions that could come later.

