import { describe, it, expect } from 'vitest'
import * as ExcelJS from 'exceljs'
import { buildWorkbook } from './excelExport'
import { sheetNameFor } from './excelLayout'
import { makeSeedProject } from './seed'

async function roundTrip(wb: ExcelJS.Workbook): Promise<ExcelJS.Workbook> {
  const buf = await wb.xlsx.writeBuffer()
  const rt = new ExcelJS.Workbook()
  // exceljs bundles its own Node Buffer typings, which clash with ours; the runtime value is fine
  await rt.xlsx.load(buf as unknown as ArrayBuffer)
  return rt
}

describe('buildWorkbook', () => {
  it('exports the seed project as a workbook that round-trips', async () => {
    const wb = await roundTrip(buildWorkbook(makeSeedProject()))

    expect(wb.worksheets.map((ws) => ws.name)).toEqual([
      'Log B1 Fig 3',
      'Fig 10 Grain Size — Sample 1-4',
      'Project',
      'Borings',
      'Strata',
      'Samples',
      'Sub-Notes',
      'Sieve Samples',
      'Sieve Points',
    ])

    const dataRows = (name: string) => wb.getWorksheet(name)!.actualRowCount - 1
    expect(dataRows('Borings')).toBe(1)
    expect(dataRows('Strata')).toBe(4)
    expect(dataRows('Samples')).toBe(5)
    expect(dataRows('Sub-Notes')).toBe(1)
    expect(dataRows('Sieve Samples')).toBe(1)
    expect(dataRows('Sieve Points')).toBe(9)
  })

  it('writes key cells, derived values, and header styling', async () => {
    const wb = await roundTrip(buildWorkbook(makeSeedProject()))

    const project = wb.getWorksheet('Project')!
    const fileNumberRow = project
      .getSheetValues()
      .findIndex((r) => Array.isArray(r) && r[1] === 'File Number')
    expect(project.getCell(fileNumberRow, 2).value).toBe('3609.01')

    // First stratum's bottom depth comes from the next stratum's top.
    const strata = wb.getWorksheet('Strata')!
    expect(strata.getRow(1).font?.bold).toBe(true)
    expect(strata.getCell(2, 3).value).toBe(0.6)
    // Last stratum bottoms out at the boring's BOH depth.
    expect(strata.getCell(5, 3).value).toBe(15)

    // Multiline lab results survive verbatim (sample 1, column "Lab Results").
    const samples = wb.getWorksheet('Samples')!
    expect(samples.getCell(2, 10).value).toContain('\n')
    // Suggested N for rawBlows "42" at the default 0.68 ratio.
    expect(samples.getCell(3, 6).value).toBe('29')

    // Derived gradation for the Fig 10 curve: the curve never reaches 10%
    // finer, so D10/Cc/Cu stay blank while the fractions are defined.
    const sieve = wb.getWorksheet('Sieve Samples')!
    const header = sieve.getRow(1)
    const col = (h: string) => {
      let idx = 0
      header.eachCell((c, n) => {
        if (c.value === h) idx = n
      })
      return idx
    }
    expect(sieve.getCell(2, col('% Gravel')).value).toBe(10)
    expect(sieve.getCell(2, col('% Sand')).value).toBe(76)
    expect(sieve.getCell(2, col('% Fines')).value).toBe(14)
    expect(sieve.getCell(2, col('D10')).value).toBeNull()
    expect(sieve.getCell(2, col('Cc')).value).toBeNull()
    expect(sieve.getCell(2, col('Cu')).value).toBeNull()
  })
})

describe('layout sheets', () => {
  it('reproduces the log sheet header, band, and body from the seed', async () => {
    const wb = await roundTrip(buildWorkbook(makeSeedProject()))
    const log = wb.getWorksheet('Log B1 Fig 3')!

    // Header block
    expect(log.getCell('B1').value).toBe('Boring:')
    expect(log.getCell('D1').value).toBe('1')
    expect(log.getCell('I1').value).toBe('File:')
    expect(log.getCell('J1').value).toBe('3609.01')
    expect(log.getCell('D6').value).toBe("7.2' (3-9-26, 10:34am)")

    // Column band
    expect(log.getCell('G8').value).toBe('CLASSIFICATION')
    expect(log.getCell('B8').alignment?.textRotation).toBe(90)

    // Hatch fills: PAVEMENT stratum (row 9) and ML stratum (rows 10-18)
    expect((log.getCell('G9').fill as ExcelJS.FillPattern).pattern).toBe('darkTrellis')
    expect((log.getCell('G13').fill as ExcelJS.FillPattern).pattern).toBe('lightUp')

    // Depth scale: 5 ft at half-foot resolution -> row 9 + 10
    expect(log.getCell('F19').value).toBe(5)

    // Sample 1 at 1.5 ft (row 12): number, blows, seeLegend-starred N, lab line
    expect(log.getCell('E12').value).toBe('1')
    expect(log.getCell('D12').value).toBe('11')
    expect(log.getCell('D13').value).toBe('*(8)')
    expect(log.getCell('A12').value).toBe('pH= 7.5')
    // Sample 2 at 3.5 ft (row 16): blows over converted N
    expect(log.getCell('D16').value).toBe('42')
    expect(log.getCell('D17').value).toBe('(29)')

    // Water symbol at 7.2 ft (row 23), BOH at 15 ft (row 39)
    expect(log.getCell('G23').value).toBe('▼')
    expect(log.getCell('G39').value).toBe("BOH @ 15'")
    expect(log.getCell('G39').font?.bold).toBe(true)

    expect(log.pageSetup.fitToPage).toBe(true)
  })

  it('splits a deep boring into lettered figure pages', async () => {
    const project = makeSeedProject()
    project.borings[0].bohDepthFt = 40
    const wb = await roundTrip(buildWorkbook(project))

    const names = wb.worksheets.map((ws) => ws.name)
    expect(names).toContain('Log B1 Fig 3 a')
    expect(names).toContain('Log B1 Fig 3 b')
    // Page b starts at 35 ft, so 40 ft lands on row 9 + 10
    expect(wb.getWorksheet('Log B1 Fig 3 b')!.getCell('F19').value).toBe(40)
  })

  it('renders the sieve summary tables and title block without a chart', async () => {
    const wb = await roundTrip(buildWorkbook(makeSeedProject()))
    const sieve = wb.getWorksheet('Fig 10 Grain Size — Sample 1-4')!

    expect(String(sieve.getCell('A1').value)).toContain('summary tables only')
    expect((sieve.getCell('B3').fill as ExcelJS.FillPattern).fgColor?.argb).toBe('FFD8D8D8')

    // Table 1 row: sample label + blank Cc/Cu (curve never reaches 10% finer)
    expect(sieve.getCell('B4').value).toBe('1 - 4')
    expect(sieve.getCell('K4').value).toBeNull()
    expect(sieve.getCell('L4').value).toBeNull()

    // Table 2 row: gradation fractions, blank D10
    expect(sieve.getCell('H8').value).toBe(10)
    expect(sieve.getCell('I8').value).toBe(76)
    expect(sieve.getCell('J8').value).toBe(14)
    expect(sieve.getCell('G8').value).toBeNull()

    expect(sieve.getCell('C12').value).toBe('GRAIN SIZE DISTRIBUTION')
  })
})

describe('sheetNameFor', () => {
  it('truncates to 31 chars and strips illegal characters', () => {
    expect(sheetNameFor('x'.repeat(40), new Set())).toHaveLength(31)
    expect(sheetNameFor('A[b]:c*d?e/f\\g', new Set())).toBe('A-b-c-d-e-f-g')
  })

  it('uniquifies collisions with a numeric suffix', () => {
    const used = new Set<string>()
    expect(sheetNameFor('Name', used)).toBe('Name')
    expect(sheetNameFor('Name', used)).toBe('Name (2)')
    expect(sheetNameFor('Name', used)).toBe('Name (3)')
  })
})
