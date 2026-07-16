// Single source of truth for boring-log sheet geometry.
// Coordinates are 96-dpi pixels on a US-letter page: 816 x 1056 = 8.5in x 11in.
// Calibrated against "Fig 3-5 Boring Logs.pdf".

export const SHEET = { W: 816, H: 1056 }

// Heavy outer border
export const BORDER = { x: 56, y: 40, w: 704, h: 952 }

// Header band (logo + project fields)
export const HEADER = {
  top: BORDER.y,
  h: 128,
  logoW: 120, // logo cell at left
  leftLabelX: BORDER.x + 128, // "Boring:" etc. labels
  leftValueX: BORDER.x + 196,
  rightLabelX: BORDER.x + 448, // "File:" etc. labels
  rightValueX: BORDER.x + 560,
  line1Y: BORDER.y + 18,
  lineH: 15.5,
}

// Column header band below the header
export const COLHEAD = { top: HEADER.top + HEADER.h, h: 76 }

// Vertical rules (x positions), left -> right
export const COLS = {
  labLeft: BORDER.x, // LAB TEST RESULTS
  moist: BORDER.x + 122, // MOIST CONT. %
  dryDen: BORDER.x + 156, // DRY DEN. PCF
  blows: BORDER.x + 190, // BLOWS PER FT.
  sample: BORDER.x + 238, // SAMPLE
  depth: BORDER.x + 268, // DEPTH
  graphic: BORDER.x + 298, // graphic soil column (start)
  graphicW: 24,
  classText: BORDER.x + 330, // classification text starts
  right: BORDER.x + BORDER.w,
}

// Depth body: 35 ft per page
export const BODY = {
  top: COLHEAD.top + COLHEAD.h,
  bottom: BORDER.y + BORDER.h - 4,
}
export const FEET_PER_PAGE = 35
export const PX_PER_FT = (BODY.bottom - BODY.top) / FEET_PER_PAGE // ≈ 21.5

export function yForDepth(depthFt: number, pageStartFt: number): number {
  return BODY.top + (depthFt - pageStartFt) * PX_PER_FT
}

export const FONT = {
  family: 'Arial, Helvetica, sans-serif',
  header: 11,
  headerBold: 11,
  colTitle: 9,
  body: 10,
  small: 8,
  lab: 8,
  depthLabel: 10,
  figure: 12,
}
