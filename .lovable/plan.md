

# Fix Static vs Dynamic Beam Classification and MLC Display

## Problem Summary

Two bugs found through live testing with demo plans:

1. **All IMRT beams wrongly labeled "Arc"**: The `isArc` flag in `parser.ts` uses `beamType === 'DYNAMIC'` as a condition, but DICOM uses "DYNAMIC" for both VMAT arcs (gantry rotates) and step-and-shoot IMRT (MLC moves, gantry fixed). This cascades into wrong technique detection ("VMAT" instead of "IMRT"), wrong beam labels ("Arc" vs "Static"), and wrong arc length display (360 degrees for static beams).

2. **MLC aperture not rendered when jaw data is missing**: The `MLCApertureViewer` refuses to render if `hasValidJaws` is false, even when valid MLC leaf positions exist. Some vendor plans (particularly Elekta/Monaco) may not have explicit jaw data, causing the MLC viewer to show "No jaw data available" instead of the aperture.

## Changes

### 1. Fix `isArc` detection in `src/lib/dicom/parser.ts` (line 434)

**Current (wrong):**
```
const isArc = Math.abs(gantryEnd - gantryStart) > 5 || beamType === 'DYNAMIC';
```

**Fixed:**
Use `gantryRotationDirection` as the primary arc indicator. A beam is an arc only if:
- The first control point has a rotation direction of 'CW' or 'CCW', OR
- The gantry angles span more than 5 degrees across control points (fallback for plans missing rotation direction)

The `beamType === 'DYNAMIC'` condition is removed since it conflates MLC motion with gantry rotation.

```
const hasGantryRotation = controlPoints.length > 0 &&
  (controlPoints[0].gantryRotationDirection === 'CW' ||
   controlPoints[0].gantryRotationDirection === 'CCW');
const gantrySpan = (() => {
  if (controlPoints.length < 2) return 0;
  const angles = controlPoints.map(cp => cp.gantryAngle);
  let maxSpan = 0;
  for (let i = 1; i < angles.length; i++) {
    let d = Math.abs(angles[i] - angles[i-1]);
    if (d > 180) d = 360 - d;
    maxSpan += d;
  }
  return maxSpan;
})();
const isArc = hasGantryRotation || gantrySpan > 5;
```

This correctly classifies:
- VMAT arcs (CW/CCW rotation) as arcs
- Step-and-shoot IMRT (DYNAMIC beam type, NONE rotation, same gantry angle) as non-arcs
- Static conformal beams (STATIC type) as non-arcs

### 2. Fix MLC display without jaw data in `src/components/viewer/MLCApertureViewer.tsx` (line 89)

**Current (wrong):**
```
if (bankA.length === 0 || bankB.length === 0 || !hasValidJaws) {
  return <div>No MLC/jaw data</div>;
}
```

**Fixed:**
When MLC data exists but jaw data is missing, derive the viewBox from the MLC positions alone and render the aperture without the jaw outline rectangle. Only show "No MLC data" when leaf positions are truly empty.

- Remove `!hasValidJaws` from the early-return guard
- Adjust `viewBox` calculation to work with MLC-only data (use leaf extent when jaws are invalid)
- Conditionally render the jaw outline rectangle only when `hasValidJaws` is true

### 3. Update `determineTechnique` in `src/lib/dicom/parser.ts` (line 486)

The technique detection function already uses `isArc` from beams, so fixing `isArc` automatically fixes the plan-level technique badge. No additional changes needed here -- it will now correctly return 'IMRT' for plans with DYNAMIC beams that have no gantry rotation.

### 4. Update `BeamSummaryCard.tsx` label logic (line 99)

**Current:**
```
{beam.isArc ? 'VMAT Arc' : beam.beamType === 'DYNAMIC' ? 'IMRT' : 'Static'}
```

This is already correct in principle -- with the `isArc` fix, DYNAMIC non-arc beams will now reach the 'IMRT' branch. No change needed.

### 5. Update `BeamSelector.tsx` label (line 47)

Already uses `beam.isArc ? 'Arc' : 'Static'`. With the fix, IMRT beams will correctly show "Static". No change needed.

## Files Modified

| File | Change |
|---|---|
| `src/lib/dicom/parser.ts` | Fix `isArc` detection logic (line 434) to use gantry rotation direction instead of beam type |
| `src/components/viewer/MLCApertureViewer.tsx` | Remove jaw-data guard, allow MLC rendering with MLC-only extent |

## Impact

- All existing VMAT plans continue to work correctly (they have CW/CCW rotation)
- IMRT plans now correctly show "IMRT" technique badge, "Static" beam labels, and proper gantry range
- MLC aperture viewer renders for all plans with MLC data, regardless of jaw presence
- Metrics calculations are unaffected (they don't depend on `isArc`)
- Cross-validation parity with Python unaffected (metrics are independent of display classification)
