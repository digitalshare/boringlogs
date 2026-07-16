// Domain model for boring log projects.
// Persisted as JSON (localStorage + export files) — bump schemaVersion on breaking changes.

export const SCHEMA_VERSION = 1

export interface ProjectFile {
  schemaVersion: number
  project: Project
}

export interface Project {
  id: string
  name: string
  // Shared header fields (appear on every sheet)
  projectLine1: string
  projectLine2: string
  location: string
  fileNumber: string
  projectEngineer: string
  fieldEngineer: string
  draftedBy: string
  dateOfDrawing: string
  companyLabel: string
  logoDataUrl?: string
  // Figure numbering
  boringFigureStart: number
  sieveFigureStart: number
  borings: Boring[]
  sieveCharts: SieveChart[]
}

export interface WaterInfo {
  encountered: boolean
  depthFt?: number
  date: string
  time: string
}

export interface Boring {
  id: string
  number: string
  surfaceElevation: string // free text, e.g. "Not Available"
  water: WaterInfo
  dateCompleted: string
  bohDepthFt: number
  strata: Stratum[]
  samples: Sample[]
  subNotes: SubNote[]
}

export interface Stratum {
  id: string
  topDepthFt: number
  description: string
  uscs: string // key into hatch registry, e.g. "ML", "SW-SM", "SM", "GM", "WH", "PAVEMENT"
  unitLabel?: string // "FILL", "BEACH SAND", ... rendered bold right-aligned at stratum bottom
}

export interface Sample {
  id: string
  number: string
  depthFt: number
  rawBlows: string // "42", "75/9\"", "R", ""
  nValue: string // converted value shown in parens; editable, auto-suggested
  seeLegend: boolean // first sample carries "*" markers referencing the legend
  moisturePct?: number
  dryDensityPcf?: number
  labResults: string // multiline free text for LAB TEST RESULTS column
}

export interface SubNote {
  id: string
  depthFt: number
  text: string // e.g. "At 13.0', grades very loose"
}

export type MarkerShape = 'circle' | 'square' | 'triangle' | 'diamond'

export interface SievePoint {
  sizeMm: number
  percentFiner: number
}

export interface SieveSample {
  id: string
  label: string // "1 - 4" (boring - sample)
  depthFt: number
  classification: string
  mcPct?: number
  ll?: number
  pl?: number
  points: SievePoint[]
  markerShape: MarkerShape
  overrides?: Partial<SieveDerived>
}

export interface SieveDerived {
  d100?: number
  d60?: number
  d30?: number
  d10?: number
  cc?: number
  cu?: number
  pctGravel?: number
  pctSand?: number
  pctFines?: number
}

export interface SieveChart {
  id: string
  name: string
  samples: SieveSample[]
}
