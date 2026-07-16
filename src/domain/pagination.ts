import type { Project, Boring } from '../types'

export const FEET_PER_PAGE = 35

export interface LogPage {
  kind: 'boring'
  boringId: string
  pageIndex: number // 0-based within the boring
  pageCount: number
  startDepthFt: number // depth at top of page (0, 35, 70, ...)
  figureLabel: string // "3", "3 a", "3 b"
}

export interface SievePage {
  kind: 'sieve'
  sieveChartId: string
  figureLabel: string
}

export type SheetPage = LogPage | SievePage

const PAGE_SUFFIX = 'abcdefghij'

export function boringMaxDepth(b: Boring): number {
  let max = b.bohDepthFt || 0
  for (const s of b.strata) max = Math.max(max, s.topDepthFt)
  for (const s of b.samples) max = Math.max(max, s.depthFt)
  return max
}

export function boringPageCount(b: Boring): number {
  return Math.max(1, Math.ceil(boringMaxDepth(b) / FEET_PER_PAGE))
}

export function boringPages(b: Boring, figureNumber: number): LogPage[] {
  const count = boringPageCount(b)
  const pages: LogPage[] = []
  for (let i = 0; i < count; i++) {
    const suffix = count > 1 ? ` ${PAGE_SUFFIX[i] ?? String(i + 1)}` : ''
    pages.push({
      kind: 'boring',
      boringId: b.id,
      pageIndex: i,
      pageCount: count,
      startDepthFt: i * FEET_PER_PAGE,
      figureLabel: `${figureNumber}${suffix}`,
    })
  }
  return pages
}

/** All pages of the project in figure order: borings first, then sieve charts. */
export function projectPages(project: Project): SheetPage[] {
  const pages: SheetPage[] = []
  let fig = project.boringFigureStart
  for (const b of project.borings) {
    pages.push(...boringPages(b, fig))
    fig += 1
  }
  let sieveFig = project.sieveFigureStart
  for (const c of project.sieveCharts) {
    pages.push({ kind: 'sieve', sieveChartId: c.id, figureLabel: String(sieveFig) })
    sieveFig += 1
  }
  return pages
}
