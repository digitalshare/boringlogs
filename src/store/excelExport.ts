import * as ExcelJS from 'exceljs'
import type { Project } from '../types'
import { deriveSieve, plasticityIndex } from '../domain/sieve'
import { suggestNValue } from '../domain/spt'
import { addLayoutSheets } from './excelLayout'

// Excel export: formatted figure sheets (excelLayout.ts) followed by the
// project's data as plain tables, one workbook per project.
// Workbook construction is DOM-free so tests can round-trip it in node.

interface Column {
  header: string
  key: string
  width: number
  wrap?: boolean
}

type CellValue = string | number | null

function addSheet(wb: ExcelJS.Workbook, name: string, columns: Column[], rows: Record<string, CellValue>[]) {
  const ws = wb.addWorksheet(name)
  ws.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
    style: c.wrap ? { alignment: { wrapText: true, vertical: 'top' } } : undefined,
  }))
  ws.getRow(1).font = { bold: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  for (const row of rows) ws.addRow(row)
  return ws
}

const yesNo = (v: boolean) => (v ? 'Yes' : 'No')

export function buildWorkbook(project: Project): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  addLayoutSheets(wb, project)

  addSheet(
    wb,
    'Project',
    [
      { header: 'Field', key: 'field', width: 22 },
      { header: 'Value', key: 'value', width: 50 },
    ],
    [
      { field: 'Name', value: project.name },
      { field: 'Project Line 1', value: project.projectLine1 },
      { field: 'Project Line 2', value: project.projectLine2 },
      { field: 'Location', value: project.location },
      { field: 'File Number', value: project.fileNumber },
      { field: 'Project Engineer', value: project.projectEngineer },
      { field: 'Field Engineer', value: project.fieldEngineer },
      { field: 'Drafted By', value: project.draftedBy },
      { field: 'Date of Drawing', value: project.dateOfDrawing },
      { field: 'Company', value: project.companyLabel },
      { field: 'Boring Figure Start', value: project.boringFigureStart },
      { field: 'Sieve Figure Start', value: project.sieveFigureStart },
    ],
  )

  addSheet(
    wb,
    'Borings',
    [
      { header: 'Boring No.', key: 'boring', width: 10 },
      { header: 'Fig No.', key: 'fig', width: 8 },
      { header: 'Surface Elevation', key: 'elev', width: 18 },
      { header: 'Date Completed', key: 'date', width: 15 },
      { header: 'BOH Depth (ft)', key: 'boh', width: 14 },
      { header: 'Water Encountered', key: 'waterEnc', width: 17 },
      { header: 'Water Depth (ft)', key: 'waterDepth', width: 15 },
      { header: 'Water Date', key: 'waterDate', width: 12 },
      { header: 'Water Time', key: 'waterTime', width: 12 },
    ],
    project.borings.map((b, i) => ({
      boring: b.number,
      fig: project.boringFigureStart + i,
      elev: b.surfaceElevation,
      date: b.dateCompleted,
      boh: b.bohDepthFt,
      waterEnc: yesNo(b.water.encountered),
      waterDepth: b.water.depthFt ?? null,
      waterDate: b.water.date,
      waterTime: b.water.time,
    })),
  )

  addSheet(
    wb,
    'Strata',
    [
      { header: 'Boring No.', key: 'boring', width: 10 },
      { header: 'Top Depth (ft)', key: 'top', width: 13 },
      { header: 'Bottom Depth (ft)', key: 'bottom', width: 15 },
      { header: 'USCS', key: 'uscs', width: 10 },
      { header: 'Unit Label', key: 'unit', width: 14 },
      { header: 'Description', key: 'desc', width: 60, wrap: true },
    ],
    project.borings.flatMap((b) =>
      b.strata.map((s, i) => ({
        boring: b.number,
        top: s.topDepthFt,
        bottom: i + 1 < b.strata.length ? b.strata[i + 1].topDepthFt : b.bohDepthFt,
        uscs: s.uscs,
        unit: s.unitLabel ?? null,
        desc: s.description,
      })),
    ),
  )

  addSheet(
    wb,
    'Samples',
    [
      { header: 'Boring No.', key: 'boring', width: 10 },
      { header: 'Sample No.', key: 'sample', width: 10 },
      { header: 'Depth (ft)', key: 'depth', width: 10 },
      { header: 'Raw Blows', key: 'blows', width: 10 },
      { header: 'N Value', key: 'n', width: 9 },
      { header: 'Suggested N', key: 'suggestedN', width: 11 },
      { header: 'Moisture (%)', key: 'mc', width: 12 },
      { header: 'Dry Density (pcf)', key: 'density', width: 15 },
      { header: 'See Legend', key: 'legend', width: 10 },
      { header: 'Lab Results', key: 'lab', width: 50, wrap: true },
    ],
    project.borings.flatMap((b) =>
      b.samples.map((s) => ({
        boring: b.number,
        sample: s.number,
        depth: s.depthFt,
        blows: s.rawBlows,
        n: s.nValue,
        suggestedN: suggestNValue(s.rawBlows),
        mc: s.moisturePct ?? null,
        density: s.dryDensityPcf ?? null,
        legend: yesNo(s.seeLegend),
        lab: s.labResults,
      })),
    ),
  )

  addSheet(
    wb,
    'Sub-Notes',
    [
      { header: 'Boring No.', key: 'boring', width: 10 },
      { header: 'Depth (ft)', key: 'depth', width: 10 },
      { header: 'Note', key: 'note', width: 60, wrap: true },
    ],
    project.borings.flatMap((b) =>
      b.subNotes.map((n) => ({ boring: b.number, depth: n.depthFt, note: n.text })),
    ),
  )

  addSheet(
    wb,
    'Sieve Samples',
    [
      { header: 'Chart', key: 'chart', width: 26 },
      { header: 'Fig No.', key: 'fig', width: 8 },
      { header: 'Sample', key: 'sample', width: 10 },
      { header: 'Depth (ft)', key: 'depth', width: 10 },
      { header: 'Classification', key: 'class', width: 32, wrap: true },
      { header: 'MC (%)', key: 'mc', width: 8 },
      { header: 'LL', key: 'll', width: 6 },
      { header: 'PL', key: 'pl', width: 6 },
      { header: 'PI', key: 'pi', width: 6 },
      { header: 'D100', key: 'd100', width: 8 },
      { header: 'D60', key: 'd60', width: 8 },
      { header: 'D30', key: 'd30', width: 8 },
      { header: 'D10', key: 'd10', width: 8 },
      { header: 'Cc', key: 'cc', width: 7 },
      { header: 'Cu', key: 'cu', width: 7 },
      { header: '% Gravel', key: 'gravel', width: 9 },
      { header: '% Sand', key: 'sand', width: 8 },
      { header: '% Fines', key: 'fines', width: 8 },
      { header: 'Marker', key: 'marker', width: 9 },
    ],
    project.sieveCharts.flatMap((chart, ci) =>
      chart.samples.map((s) => {
        const d = deriveSieve(s)
        return {
          chart: chart.name,
          fig: project.sieveFigureStart + ci,
          sample: s.label,
          depth: s.depthFt,
          class: s.classification,
          mc: s.mcPct ?? null,
          ll: s.ll ?? null,
          pl: s.pl ?? null,
          pi: plasticityIndex(s.ll, s.pl) ?? null,
          d100: d.d100 ?? null,
          d60: d.d60 ?? null,
          d30: d.d30 ?? null,
          d10: d.d10 ?? null,
          cc: d.cc ?? null,
          cu: d.cu ?? null,
          gravel: d.pctGravel ?? null,
          sand: d.pctSand ?? null,
          fines: d.pctFines ?? null,
          marker: s.markerShape,
        }
      }),
    ),
  )

  addSheet(
    wb,
    'Sieve Points',
    [
      { header: 'Chart', key: 'chart', width: 26 },
      { header: 'Sample', key: 'sample', width: 10 },
      { header: 'Size (mm)', key: 'size', width: 10 },
      { header: '% Finer', key: 'finer', width: 9 },
    ],
    project.sieveCharts.flatMap((chart) =>
      chart.samples.flatMap((s) =>
        s.points.map((p) => ({ chart: chart.name, sample: s.label, size: p.sizeMm, finer: p.percentFiner })),
      ),
    ),
  )

  return wb
}

export async function exportProjectXlsx(project: Project) {
  const wb = buildWorkbook(project)
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const base = project.fileNumber || project.name || 'project'
  a.download = `${base.replace(/[^\w.-]+/g, '_')}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
