// Geometry for the Grain Size Distribution sheet (Figs 10-12).
// Same 816x1056 (8.5x11in @96dpi) canvas as the log sheet.

export const SHEET = { W: 816, H: 1056 }
export const BORDER = { x: 56, y: 40, w: 704, h: 952 }

// Plot area (semi-log chart)
export const PLOT = { x: 120, y: 128, w: 600, h: 470 }
export const DECADES = 5 // 100 -> 0.001 mm

export function xForSize(mm: number): number {
  return PLOT.x + (PLOT.w * (Math.log10(100) - Math.log10(mm))) / DECADES
}
export function yForPct(pct: number): number {
  return PLOT.y + (PLOT.h * (100 - pct)) / 100
}

// Standard sieves: label, opening in mm, and which stagger row the label sits on (0 = upper, 1 = lower)
export const STANDARD_SIEVES: Array<{ label: string; mm: number; row: number }> = [
  { label: '3"', mm: 75, row: 1 },
  { label: '2.5"', mm: 63, row: 0 },
  { label: '2"', mm: 50, row: 1 },
  { label: '1.5"', mm: 37.5, row: 0 },
  { label: '1"', mm: 25, row: 0 },
  { label: '3/4"', mm: 19, row: 1 },
  { label: '1/2"', mm: 12.5, row: 0 },
  { label: '3/8"', mm: 9.5, row: 1 },
  { label: '#4', mm: 4.75, row: 1 },
  { label: '#10', mm: 2.0, row: 1 },
  { label: '#20', mm: 0.85, row: 1 },
  { label: '#40', mm: 0.425, row: 1 },
  { label: '#60', mm: 0.25, row: 1 },
  { label: '#100', mm: 0.15, row: 1 },
  { label: '#140', mm: 0.106, row: 0 },
  { label: '#200', mm: 0.075, row: 1 },
]

// Soil fraction breakpoints for the zone band (mm)
export const ZONE_BREAKS = { maxSize: 100, coarseGravel: 19, gravel: 4.75, coarseSand: 2.0, mediumSand: 0.425, fines: 0.075 }

// Zone band strip below x-axis labels
export const ZONE = { y: 664, h: 34 }

// Summary tables
export const TABLE1 = { x: 130, y: 716, w: 570, headerH: 14, rowH: 17 }
export const TABLE2 = { x: 130, y: 786, w: 570, headerH: 14, rowH: 17 }

// Title block
export const TITLE = { y: 856, h: 96, logoW: 130, rightW: 120 }

export const FONT = {
  family: 'Arial, Helvetica, sans-serif',
  axis: 9,
  sieveLabel: 8,
  table: 8.5,
  tableHeader: 7.5,
  title: 15,
  sub: 9,
  figure: 12,
}
