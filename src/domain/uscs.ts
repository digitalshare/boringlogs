// USCS soil symbol -> SVG hatch pattern id.
// Pattern elements themselves are defined in sheet/HatchDefs.tsx.

export interface SoilTypeDef {
  key: string
  label: string
  patternId: string
}

export const SOIL_TYPES: SoilTypeDef[] = [
  { key: 'PAVEMENT', label: 'Pavement / surface cap', patternId: 'hatch-cap' },
  { key: 'ML', label: 'ML — Silt', patternId: 'hatch-diag' },
  { key: 'MH', label: 'MH — Elastic silt', patternId: 'hatch-diag' },
  { key: 'CL', label: 'CL — Lean clay', patternId: 'hatch-diag-dense' },
  { key: 'CH', label: 'CH — Fat clay', patternId: 'hatch-diag-dense' },
  { key: 'SW', label: 'SW — Well-graded sand', patternId: 'hatch-stipple-fine' },
  { key: 'SP', label: 'SP — Poorly-graded sand', patternId: 'hatch-stipple-fine' },
  { key: 'SW-SM', label: 'SW-SM — Well-graded sand w/ silt', patternId: 'hatch-stipple-fine' },
  { key: 'SP-SM', label: 'SP-SM — Poorly-graded sand w/ silt', patternId: 'hatch-stipple-fine' },
  { key: 'SM', label: 'SM — Silty sand', patternId: 'hatch-stipple-dense' },
  { key: 'SC', label: 'SC — Clayey sand', patternId: 'hatch-stipple-dense' },
  { key: 'GW', label: 'GW — Well-graded gravel', patternId: 'hatch-gravel' },
  { key: 'GP', label: 'GP — Poorly-graded gravel', patternId: 'hatch-gravel' },
  { key: 'GM', label: 'GM — Silty gravel', patternId: 'hatch-gravel' },
  { key: 'GC', label: 'GC — Clayey gravel', patternId: 'hatch-gravel' },
  { key: 'WH', label: 'WH — Weathered rock', patternId: 'hatch-rock' },
  { key: 'ROCK', label: 'Rock / bedrock', patternId: 'hatch-rock' },
  { key: 'NONE', label: 'No pattern', patternId: '' },
]

export function patternIdFor(uscs: string): string {
  const t = SOIL_TYPES.find((s) => s.key === uscs)
  return t ? t.patternId : 'hatch-diag'
}
