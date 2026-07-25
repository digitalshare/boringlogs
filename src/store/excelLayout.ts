import * as ExcelJS from 'exceljs'
import type { Project, Boring, SieveChart, Stratum, MarkerShape } from '../types'
import { projectPages, FEET_PER_PAGE, type LogPage } from '../domain/pagination'
import { patternIdFor } from '../domain/uscs'
import { deriveSieve, plasticityIndex } from '../domain/sieve'
import { waterText } from '../domain/water'

// Formatted "layout" worksheets approximating the drawn SVG sheets.
// Cell geometry mirrors src/sheet/layout.ts: the SVG's 7 columns map onto
// Excel columns A-J (CLASSIFICATION splits into hatch strip G + text H:J),
// and the 35 ft body maps onto 70 rows at half-foot resolution.
// DOM-free so tests can round-trip workbooks in node.

const BODY_TOP = 9 // first body row; rows 1-7 header block, row 8 column band
const BODY_ROWS = FEET_PER_PAGE * 2
const BODY_BOTTOM = BODY_TOP + BODY_ROWS - 1
const FIGURE_ROW = BODY_BOTTOM + 1

const THIN: Partial<ExcelJS.Border> = { style: 'thin' }
const MEDIUM: Partial<ExcelJS.Border> = { style: 'medium' }
const HEADER_FONT = { name: 'Arial', size: 8.5 }
const BODY_FONT = { name: 'Arial', size: 7 }

const HATCH_PATTERNS: Record<string, ExcelJS.FillPatterns> = {
  'hatch-cap': 'darkTrellis',
  'hatch-diag': 'lightUp',
  'hatch-diag-dense': 'darkUp',
  'hatch-stipple-fine': 'gray0625',
  'hatch-stipple-dense': 'gray125',
  'hatch-gravel': 'lightGrid',
  'hatch-rock': 'lightHorizontal',
}

/** exceljs pattern fill approximating the SVG hatch for a USCS key (undefined = no fill). */
export function excelFillForUscs(uscs: string): ExcelJS.FillPattern | undefined {
  const pattern = HATCH_PATTERNS[patternIdFor(uscs)]
  if (!pattern) return undefined
  return { type: 'pattern', pattern, fgColor: { argb: 'FF000000' }, bgColor: { argb: 'FFFFFFFF' } }
}

/** Sanitize to a legal, unique worksheet name (≤31 chars, no []:*?/\, no edge apostrophes). */
export function sheetNameFor(raw: string, used: Set<string>): string {
  const base = raw.replace(/[[\]:*?/\\]+/g, '-').replace(/^'+|'+$/g, '').trim() || 'Sheet'
  let name = base.slice(0, 31)
  for (let i = 2; used.has(name); i++) name = `${base.slice(0, 27)} (${i})`
  used.add(name)
  return name
}

function rowForDepth(depthFt: number, pageStartFt: number): number {
  const r = BODY_TOP + Math.round((depthFt - pageStartFt) * 2)
  return Math.min(Math.max(r, BODY_TOP), BODY_BOTTOM)
}

interface StratumSpan {
  stratum: Stratum
  topFt: number
  bottomFt: number
}

function stratumSpans(boring: Boring): StratumSpan[] {
  const sorted = [...boring.strata].sort((a, b) => a.topDepthFt - b.topDepthFt)
  return sorted.map((stratum, i) => ({
    stratum,
    topFt: stratum.topDepthFt,
    bottomFt: i + 1 < sorted.length ? sorted[i + 1].topDepthFt : boring.bohDepthFt,
  }))
}

/** Occupancy-tracked cell writes: layered content (strata, samples, notes) never overwrites. */
class SheetWriter {
  private occupied = new Set<string>()
  constructor(private ws: ExcelJS.Worksheet) {}

  isFree(row: number, col: number): boolean {
    return !this.occupied.has(`${row}:${col}`)
  }

  claim(r1: number, c1: number, r2 = r1, c2 = c1) {
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) this.occupied.add(`${r}:${c}`)
  }

  setIfEmpty(row: number, col: number, value: ExcelJS.CellValue, style?: Partial<ExcelJS.Style>): boolean {
    if (!this.isFree(row, col)) return false
    const cell = this.ws.getCell(row, col)
    cell.value = value
    if (style) Object.assign(cell, style)
    this.claim(row, col)
    return true
  }

  merge(r1: number, c1: number, r2: number, c2: number): boolean {
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (!this.isFree(r, c)) return false
    try {
      this.ws.mergeCells(r1, c1, r2, c2)
    } catch {
      return false
    }
    this.claim(r1, c1, r2, c2)
    return true
  }
}

function addLogoOrLabel(wb: ExcelJS.Workbook, ws: ExcelJS.Worksheet, project: Project, range: string) {
  ws.mergeCells(range)
  const anchor = ws.getCell(range.split(':')[0])
  const m = project.logoDataUrl?.match(/^data:image\/(png|jpeg);base64,(.+)$/)
  if (m) {
    try {
      const imageId = wb.addImage({ base64: m[2], extension: m[1] as 'png' | 'jpeg' })
      ws.addImage(imageId, range)
      return
    } catch {
      // fall through to the text label
    }
  }
  anchor.value = project.companyLabel
  anchor.font = { ...HEADER_FONT, bold: true }
  anchor.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
}

function setPageSetup(ws: ExcelJS.Worksheet) {
  ws.pageSetup = {
    paperSize: 1 as ExcelJS.PaperSize,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: { left: 0.25, right: 0.25, top: 0.25, bottom: 0.25, header: 0.1, footer: 0.1 },
  }
}

export function addLogLayoutSheet(
  wb: ExcelJS.Workbook,
  project: Project,
  boring: Boring,
  page: LogPage,
  name: string,
): ExcelJS.Worksheet {
  const ws = wb.addWorksheet(name)
  setPageSetup(ws)
  const w = new SheetWriter(ws)
  const pageStart = page.startDepthFt
  const pageEnd = pageStart + FEET_PER_PAGE

  const widths = [17.4, 4.9, 4.9, 6.9, 4.3, 4.3, 3.4, 18, 16, 20.6]
  widths.forEach((width, i) => (ws.getColumn(i + 1).width = width))
  for (let r = 1; r <= 7; r++) ws.getRow(r).height = 14
  ws.getRow(8).height = 57
  for (let r = BODY_TOP; r <= BODY_BOTTOM; r++) ws.getRow(r).height = 8
  ws.getRow(FIGURE_ROW).height = 18

  // Header block (rows 1-7): logo cell + left/right label-value pairs, as in LogSheetHeader.
  addLogoOrLabel(wb, ws, project, 'A1:A7')
  const leftRows: Array<[string, string]> = [
    ['Boring:', boring.number],
    ['Project:', project.projectLine1],
    ['', project.projectLine2],
    ['Location:', project.location],
    ['Surface Elevation:', boring.surfaceElevation],
    ['Depth to Water:', waterText(boring)],
    ['Date Completed:', boring.dateCompleted],
  ]
  const rightRows: Array<[string, string, number]> = [
    ['File:', project.fileNumber, 1],
    ['Project Engineer:', project.projectEngineer, 4],
    ['Field Engineer:', project.fieldEngineer, 5],
    ['Drafted by:', project.draftedBy, 6],
    ['Date of Drawing:', project.dateOfDrawing, 7],
  ]
  leftRows.forEach(([label, value], i) => {
    const r = i + 1
    ws.mergeCells(r, 2, r, 3)
    ws.getCell(r, 2).value = label
    ws.getCell(r, 2).font = { ...HEADER_FONT, bold: true }
    ws.mergeCells(r, 4, r, 8)
    ws.getCell(r, 4).value = value
    ws.getCell(r, 4).font = HEADER_FONT
  })
  for (const [label, value, r] of rightRows) {
    ws.getCell(r, 9).value = label
    ws.getCell(r, 9).font = { ...HEADER_FONT, bold: true }
    ws.getCell(r, 10).value = value
    ws.getCell(r, 10).font = HEADER_FONT
  }

  // Column header band (row 8).
  const rotated = { textRotation: 90, horizontal: 'center', vertical: 'middle' } as const
  const band: Array<[number, string, Partial<ExcelJS.Style>]> = [
    [1, 'LAB TEST RESULTS', { alignment: { wrapText: true, horizontal: 'left', vertical: 'top' } }],
    [2, 'MOIST CONT. %', { alignment: rotated }],
    [3, 'DRY DEN. PCF', { alignment: rotated }],
    [4, 'BLOWS PER FT.\n*(x) See Legend', { alignment: { wrapText: true, horizontal: 'center', vertical: 'middle' } }],
    [5, 'SAMPLE', { alignment: rotated }],
    [6, 'DEPTH', { alignment: rotated }],
  ]
  for (const [col, title, style] of band) {
    const cell = ws.getCell(8, col)
    cell.value = title
    cell.font = { name: 'Arial', size: 7, bold: true }
    Object.assign(cell, style)
  }
  ws.mergeCells(8, 7, 8, 10)
  const classCell = ws.getCell(8, 7)
  classCell.value = 'CLASSIFICATION'
  classCell.font = { ...HEADER_FONT, bold: true }
  classCell.alignment = { horizontal: 'center', vertical: 'middle' }
  for (let c = 1; c <= 10; c++) {
    ws.getCell(8, c).border = { top: MEDIUM, bottom: MEDIUM }
  }

  // Depth scale: absolute depth labels every 5 ft (never at absolute 0).
  for (let d = pageStart; d <= pageEnd; d++) {
    if (d % 5 === 0 && d > 0) {
      w.setIfEmpty(rowForDepth(d, pageStart), 6, d, {
        font: BODY_FONT,
        alignment: { horizontal: 'right', vertical: 'middle' },
      })
    }
  }

  // Strata: hatch strip, description, bottom boundary, unit label.
  for (const span of stratumSpans(boring)) {
    const clipTop = Math.max(span.topFt, pageStart)
    const clipBottom = Math.min(span.bottomFt, pageEnd)
    if (clipBottom <= pageStart || clipTop >= pageEnd) continue
    const rTop = rowForDepth(clipTop, pageStart)
    const rBot = Math.max(rowForDepth(clipBottom, pageStart) - 1, rTop)

    const fill = excelFillForUscs(span.stratum.uscs)
    for (let r = rTop; r <= rBot; r++) {
      const cell = ws.getCell(r, 7)
      if (fill) cell.fill = fill
      cell.border = { ...cell.border, left: THIN, right: THIN }
    }

    const spanRows = rBot - rTop + 1
    const hasUnit = Boolean(span.stratum.unitLabel)
    const available = Math.max(spanRows - (hasUnit && spanRows > 1 ? 1 : 0), 1)
    const descRows = Math.min(Math.ceil(span.stratum.description.length / 55) || 1, available)
    if (w.merge(rTop, 8, rTop + descRows - 1, 10)) {
      const cell = ws.getCell(rTop, 8)
      cell.value = span.stratum.description
      cell.font = BODY_FONT
      cell.alignment = { wrapText: true, vertical: 'top' }
    }

    if (span.bottomFt <= pageEnd) {
      for (let c = 7; c <= 10; c++) {
        const cell = ws.getCell(rBot, c)
        cell.border = { ...cell.border, bottom: MEDIUM }
      }
      if (hasUnit) {
        w.setIfEmpty(rBot, 10, `(${span.stratum.unitLabel})`, {
          font: { ...BODY_FONT, bold: true },
          alignment: { horizontal: 'right', vertical: 'bottom' },
        })
      }
    }
  }

  // Samples: number + marker, blows over (N), moisture/density, lab result lines.
  let prevBlockEnd = 0
  const centered = { horizontal: 'center', vertical: 'middle' } as const
  for (const s of [...boring.samples].sort((a, b) => a.depthFt - b.depthFt)) {
    if (s.depthFt < pageStart || s.depthFt >= pageEnd) continue
    const r = Math.max(rowForDepth(s.depthFt, pageStart), prevBlockEnd + 1)
    if (r > BODY_BOTTOM) break
    prevBlockEnd = Math.min(r + 2, BODY_BOTTOM)

    w.setIfEmpty(r, 5, s.number, { font: BODY_FONT, alignment: centered })
    for (let mr = r + 1; mr <= prevBlockEnd; mr++) {
      if (w.setIfEmpty(mr, 5, null)) {
        ws.getCell(mr, 5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } }
      }
    }
    if (s.rawBlows) w.setIfEmpty(r, 4, s.rawBlows, { font: BODY_FONT, alignment: centered })
    if (s.nValue) {
      w.setIfEmpty(r + 1, 4, `${s.seeLegend ? '*' : ''}(${s.nValue})`, { font: BODY_FONT, alignment: centered })
    }
    if (s.moisturePct !== undefined) w.setIfEmpty(r + 1, 2, s.moisturePct, { font: BODY_FONT, alignment: centered })
    if (s.dryDensityPcf !== undefined) w.setIfEmpty(r + 1, 3, s.dryDensityPcf, { font: BODY_FONT, alignment: centered })
    s.labResults
      .split('\n')
      .filter(Boolean)
      .forEach((line, i) => {
        if (r + i <= BODY_BOTTOM) w.setIfEmpty(r + i, 1, line, { font: BODY_FONT })
      })
  }

  // Sub-notes share the description area; shift down a little if a merge is in the way.
  for (const note of boring.subNotes) {
    if (note.depthFt < pageStart || note.depthFt >= pageEnd) continue
    const r0 = rowForDepth(note.depthFt, pageStart)
    let placed = false
    for (let r = r0; r <= Math.min(r0 + 2, BODY_BOTTOM) && !placed; r++) {
      if (w.merge(r, 8, r, 10)) {
        const cell = ws.getCell(r, 8)
        cell.value = note.text
        cell.font = BODY_FONT
        cell.alignment = { wrapText: true, vertical: 'top' }
        placed = true
      }
    }
    if (!placed) w.setIfEmpty(r0, 10, note.text, { font: BODY_FONT })
  }

  // Water symbol rides on the hatch cell at the observed depth.
  if (boring.water.encountered && boring.water.depthFt !== undefined) {
    const d = boring.water.depthFt
    if (d >= pageStart && d < pageEnd) {
      const cell = ws.getCell(rowForDepth(d, pageStart), 7)
      cell.value = '▼'
      cell.font = BODY_FONT
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    }
  }

  // BOH label just below the last stratum boundary.
  if (boring.bohDepthFt >= pageStart && boring.bohDepthFt <= pageEnd) {
    const r = rowForDepth(boring.bohDepthFt, pageStart)
    if (w.merge(r, 7, r, 10) || w.isFree(r, 7)) {
      const cell = ws.getCell(r, 7)
      cell.value = `BOH @ ${boring.bohDepthFt}'`
      cell.font = { ...BODY_FONT, bold: true }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      w.claim(r, 7)
    }
  }

  // Column rules (right edges of A-F) and the outer frame.
  for (let r = BODY_TOP; r <= BODY_BOTTOM; r++) {
    for (let c = 1; c <= 6; c++) {
      const cell = ws.getCell(r, c)
      cell.border = { ...cell.border, right: THIN }
    }
  }
  for (let c = 1; c <= 10; c++) {
    const top = ws.getCell(1, c)
    top.border = { ...top.border, top: MEDIUM }
    const bottom = ws.getCell(BODY_BOTTOM, c)
    bottom.border = { ...bottom.border, bottom: MEDIUM }
  }
  for (let r = 1; r <= BODY_BOTTOM; r++) {
    const left = ws.getCell(r, 1)
    left.border = { ...left.border, left: MEDIUM }
    const right = ws.getCell(r, 10)
    right.border = { ...right.border, right: MEDIUM }
  }

  ws.mergeCells(FIGURE_ROW, 8, FIGURE_ROW, 10)
  const fig = ws.getCell(FIGURE_ROW, 8)
  fig.value = `Figure ${page.figureLabel}`
  fig.font = { ...HEADER_FONT, bold: true }
  fig.alignment = { horizontal: 'right', vertical: 'middle' }

  return ws
}

const MARKER_CHARS: Record<MarkerShape, string> = {
  circle: '●',
  square: '■',
  triangle: '▲',
  diamond: '◆',
}

const TABLE_HEADER_STYLE: Partial<ExcelJS.Style> = {
  font: { name: 'Arial', size: 8, bold: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD8D8D8' } },
  alignment: { horizontal: 'center', vertical: 'middle' },
}

export function addSieveLayoutSheet(
  wb: ExcelJS.Workbook,
  project: Project,
  chart: SieveChart,
  figureLabel: string,
  name: string,
): ExcelJS.Worksheet {
  const ws = wb.addWorksheet(name)
  setPageSetup(ws)
  const widths = [3, 9, 6, 10, 10, 10, 8, 8, 8, 8, 8, 8]
  widths.forEach((width, i) => (ws.getColumn(i + 1).width = width))

  ws.mergeCells('A1:L1')
  const note = ws.getCell('A1')
  note.value = 'Grain size curves are plotted in the app — this export contains the summary tables only.'
  note.font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF666666' } }

  const bodyRows = Math.max(chart.samples.length + 1, 2)
  const cellFont = { name: 'Arial', size: 8 }

  const writeTable = (
    headerRow: number,
    headers: Array<[number, number, string]>, // [colStart, colEnd, title]
    rowValues: (s: (typeof chart.samples)[number]) => Array<[number, number, ExcelJS.CellValue]>,
  ) => {
    for (const [c1, c2, title] of headers) {
      if (c2 > c1) ws.mergeCells(headerRow, c1, headerRow, c2)
      const cell = ws.getCell(headerRow, c1)
      cell.value = title
      Object.assign(cell, TABLE_HEADER_STYLE)
    }
    for (let r = headerRow; r <= headerRow + bodyRows; r++) {
      for (let c = 1; c <= 12; c++) {
        ws.getCell(r, c).border = { top: THIN, bottom: THIN, left: THIN, right: THIN }
      }
    }
    chart.samples.forEach((s, i) => {
      const r = headerRow + 1 + i
      ws.getCell(r, 1).value = MARKER_CHARS[s.markerShape]
      ws.getCell(r, 1).alignment = { horizontal: 'center', vertical: 'middle' }
      for (const [c1, c2, value] of rowValues(s)) {
        if (c2 > c1) ws.mergeCells(r, c1, r, c2)
        const cell = ws.getCell(r, c1)
        cell.value = value
        cell.font = cellFont
        cell.alignment = { horizontal: c1 >= 7 || c1 === 3 ? 'center' : 'left', vertical: 'middle' }
      }
    })
  }

  const t1Header = 3
  writeTable(
    t1Header,
    [
      [2, 2, 'Sample ID'],
      [3, 3, 'Depth'],
      [4, 6, 'Classification'],
      [7, 7, 'MC%'],
      [8, 8, 'LL'],
      [9, 9, 'PL'],
      [10, 10, 'PI'],
      [11, 11, 'Cc'],
      [12, 12, 'Cu'],
    ],
    (s) => {
      const d = deriveSieve(s)
      return [
        [2, 2, s.label],
        [3, 3, `${s.depthFt}'`],
        [4, 6, s.classification],
        [7, 7, s.mcPct ?? null],
        [8, 8, s.ll ?? null],
        [9, 9, s.pl ?? null],
        [10, 10, plasticityIndex(s.ll, s.pl) ?? null],
        [11, 11, d.cc ?? null],
        [12, 12, d.cu ?? null],
      ]
    },
  )

  const t2Header = t1Header + bodyRows + 2
  writeTable(
    t2Header,
    [
      [2, 2, 'Sample ID'],
      [3, 3, 'Depth'],
      [4, 4, 'D100'],
      [5, 5, 'D60'],
      [6, 6, 'D30'],
      [7, 7, 'D10'],
      [8, 8, '% Gravel'],
      [9, 9, '% Sand'],
      [10, 12, '% Silt & Clay'],
    ],
    (s) => {
      const d = deriveSieve(s)
      return [
        [2, 2, s.label],
        [3, 3, `${s.depthFt}'`],
        [4, 4, d.d100 ?? null],
        [5, 5, d.d60 ?? null],
        [6, 6, d.d30 ?? null],
        [7, 7, d.d10 ?? null],
        [8, 8, d.pctGravel ?? null],
        [9, 9, d.pctSand ?? null],
        [10, 12, d.pctFines ?? null],
      ]
    },
  )

  // Title block: logo | project title | file/date, boxed.
  const titleTop = t2Header + bodyRows + 3
  for (let r = titleTop; r <= titleTop + 4; r++) ws.getRow(r).height = 14
  addLogoOrLabel(wb, ws, project, `A${titleTop}:B${titleTop + 4}`)
  ws.mergeCells(titleTop, 3, titleTop, 9)
  const title = ws.getCell(titleTop, 3)
  title.value = 'GRAIN SIZE DISTRIBUTION'
  title.font = { name: 'Arial', size: 11, bold: true }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  const centerLines = [project.projectLine1, project.projectLine2, project.location]
  centerLines.forEach((text, i) => {
    const r = titleTop + 1 + i
    ws.mergeCells(r, 3, r, 9)
    const cell = ws.getCell(r, 3)
    cell.value = text
    cell.font = { name: 'Arial', size: 8 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  ws.mergeCells(titleTop, 10, titleTop + 1, 12)
  const fileCell = ws.getCell(titleTop, 10)
  fileCell.value = `File: ${project.fileNumber}`
  fileCell.font = { name: 'Arial', size: 8, bold: true }
  fileCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.mergeCells(titleTop + 2, 10, titleTop + 4, 12)
  const dateCell = ws.getCell(titleTop + 2, 10)
  dateCell.value = project.dateOfDrawing
  dateCell.font = { name: 'Arial', size: 8 }
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' }
  for (let r = titleTop; r <= titleTop + 4; r++) {
    for (let c = 1; c <= 12; c++) {
      ws.getCell(r, c).border = {
        top: r === titleTop ? MEDIUM : undefined,
        bottom: r === titleTop + 4 ? MEDIUM : undefined,
        left: c === 1 || c === 3 || c === 10 ? MEDIUM : undefined,
        right: c === 12 ? MEDIUM : undefined,
      }
    }
  }

  const figRow = titleTop + 6
  ws.mergeCells(figRow, 10, figRow, 12)
  const fig = ws.getCell(figRow, 10)
  fig.value = `Figure ${figureLabel}`
  fig.font = { name: 'Arial', size: 8.5, bold: true }
  fig.alignment = { horizontal: 'right', vertical: 'middle' }

  return ws
}

/** Add all formatted figure sheets (borings then sieve charts, in figure order). */
export function addLayoutSheets(wb: ExcelJS.Workbook, project: Project) {
  const used = new Set(wb.worksheets.map((ws) => ws.name))
  for (const page of projectPages(project)) {
    if (page.kind === 'boring') {
      const boring = project.borings.find((b) => b.id === page.boringId)
      if (!boring) continue
      const name = sheetNameFor(`Log B${boring.number} Fig ${page.figureLabel}`, used)
      addLogLayoutSheet(wb, project, boring, page, name)
    } else {
      const chart = project.sieveCharts.find((c) => c.id === page.sieveChartId)
      if (!chart) continue
      const name = sheetNameFor(`Fig ${page.figureLabel} ${chart.name}`, used)
      addSieveLayoutSheet(wb, project, chart, page.figureLabel, name)
    }
  }
}
