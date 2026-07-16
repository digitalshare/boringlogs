import type { Project, Boring, Stratum } from '../types'
import { SHEET, BORDER, COLHEAD, COLS, FEET_PER_PAGE, PX_PER_FT, yForDepth, FONT } from './layout'
import { HatchDefs } from './HatchDefs'
import { LogSheetHeader } from './LogSheetHeader'
import { ColumnHeaderBand } from './ColumnHeaderBand'
import { patternIdFor } from '../domain/uscs'
import { wrapText } from '../domain/text'

const ff = FONT.family

interface StratumSpan {
  stratum: Stratum
  topFt: number
  bottomFt: number // actual bottom (may be below page)
  continued: boolean // continues from previous page
}

function stratumSpans(boring: Boring): StratumSpan[] {
  const sorted = [...boring.strata].sort((a, b) => a.topDepthFt - b.topDepthFt)
  return sorted.map((s, i) => ({
    stratum: s,
    topFt: s.topDepthFt,
    bottomFt: i + 1 < sorted.length ? sorted[i + 1].topDepthFt : boring.bohDepthFt,
    continued: false,
  }))
}

function DepthScale({ pageStartFt }: { pageStartFt: number }) {
  const ticks = []
  for (let ft = 0; ft <= FEET_PER_PAGE; ft++) {
    const depth = pageStartFt + ft
    const y = yForDepth(depth, pageStartFt)
    const isMajor = depth % 5 === 0 && depth !== 0
    ticks.push(
      <g key={ft}>
        <line x1={COLS.graphic - (isMajor ? 10 : 6)} y1={y} x2={COLS.graphic} y2={y} stroke="black" strokeWidth={0.8} />
        {isMajor && (
          <text x={COLS.graphic - 12} y={y + 3.5} textAnchor="end" fontSize={FONT.depthLabel} fontFamily={ff}>
            {depth}
          </text>
        )}
      </g>,
    )
  }
  return <g>{ticks}</g>
}

function SamplesLayer({ boring, pageStartFt }: { boring: Boring; pageStartFt: number }) {
  const pageEndFt = pageStartFt + FEET_PER_PAGE
  const markerW = 9
  const markerX = (COLS.sample + COLS.depth) / 2 + 1
  return (
    <g>
      {boring.samples
        .filter((s) => s.depthFt >= pageStartFt && s.depthFt < pageEndFt)
        .map((s) => {
          const y = yForDepth(s.depthFt, pageStartFt)
          const markerH = Math.min(1.5 * PX_PER_FT, 30)
          const centerY = y + markerH / 2
          const star = s.seeLegend ? '*' : ''
          const labLines = wrapText(s.labResults, COLS.moist - COLS.labLeft - 10, `${FONT.lab}px Arial`)
          return (
            <g key={s.id}>
              {/* lab test results */}
              {labLines.map((line, i) => (
                <text key={i} x={COLS.labLeft + 5} y={y + 2 + (i + 0.5) * (FONT.lab + 1.5)} fontSize={FONT.lab} fontFamily={ff}>
                  {line}
                </text>
              ))}
              {/* moisture / dry density */}
              {s.moisturePct !== undefined && (
                <text x={(COLS.moist + COLS.dryDen) / 2} y={centerY + 3} textAnchor="middle" fontSize={FONT.small + 1} fontFamily={ff}>
                  {s.moisturePct}
                </text>
              )}
              {s.dryDensityPcf !== undefined && (
                <text x={(COLS.dryDen + COLS.blows) / 2} y={centerY + 3} textAnchor="middle" fontSize={FONT.small + 1} fontFamily={ff}>
                  {s.dryDensityPcf}
                </text>
              )}
              {/* blows raw + (converted) stacked */}
              {s.rawBlows && (
                <text x={(COLS.blows + COLS.sample) / 2} y={centerY - 1.5} textAnchor="middle" fontSize={FONT.small + 1} fontFamily={ff}>
                  {s.rawBlows}
                </text>
              )}
              {s.nValue && (
                <text x={(COLS.blows + COLS.sample) / 2} y={centerY + 8} textAnchor="middle" fontSize={FONT.small + 1} fontFamily={ff}>
                  {star}({s.nValue})
                </text>
              )}
              {/* sample number + marker */}
              <text x={markerX - markerW / 2 - 4} y={centerY + 3} textAnchor="end" fontSize={FONT.small + 1} fontFamily={ff}>
                {s.number}
              </text>
              <rect x={markerX - markerW / 2} y={y} width={markerW} height={markerH} fill="black" />
            </g>
          )
        })}
    </g>
  )
}

function GraphicAndClassification({ boring, pageStartFt }: { boring: Boring; pageStartFt: number }) {
  const pageEndFt = pageStartFt + FEET_PER_PAGE
  const spans = stratumSpans(boring)
  const gx = COLS.graphic
  const gw = COLS.graphicW
  const textX = COLS.classText
  const textW = COLS.right - COLS.classText - 8
  const bodyFont = `${FONT.body}px Arial`

  const elements: JSX.Element[] = []

  for (const span of spans) {
    if (span.bottomFt <= pageStartFt || span.topFt >= pageEndFt) continue
    const clipTop = Math.max(span.topFt, pageStartFt)
    const clipBottom = Math.min(span.bottomFt, pageEndFt)
    const yTop = yForDepth(clipTop, pageStartFt)
    const yBottom = yForDepth(clipBottom, pageStartFt)
    const pattern = patternIdFor(span.stratum.uscs)

    // hatched strip
    if (pattern) {
      elements.push(
        <rect
          key={`h-${span.stratum.id}`}
          x={gx}
          y={yTop}
          width={gw}
          height={yBottom - yTop}
          fill={`url(#${pattern})`}
          stroke="black"
          strokeWidth={0.8}
        />,
      )
    }

    // description at stratum top (re-printed if continuing from previous page)
    const lines = wrapText(span.stratum.description, textW, bodyFont)
    lines.forEach((line, i) => {
      elements.push(
        <text key={`d-${span.stratum.id}-${i}`} x={textX} y={yTop + 10 + i * (FONT.body + 2)} fontSize={FONT.body} fontFamily={ff}>
          {line}
        </text>,
      )
    })

    // stratum-bottom boundary + right-aligned bold unit label, only if bottom is on this page
    if (span.bottomFt <= pageEndFt) {
      elements.push(
        <line
          key={`b-${span.stratum.id}`}
          x1={gx}
          y1={yBottom}
          x2={COLS.right}
          y2={yBottom}
          stroke="black"
          strokeWidth={0.9}
        />,
      )
      if (span.stratum.unitLabel) {
        elements.push(
          <text
            key={`u-${span.stratum.id}`}
            x={COLS.right - 6}
            y={yBottom - 3}
            textAnchor="end"
            fontSize={FONT.body}
            fontFamily={ff}
            fontWeight="bold"
          >
            ({span.stratum.unitLabel})
          </text>,
        )
      }
    }
  }

  // sub-notes
  for (const note of boring.subNotes) {
    if (note.depthFt < pageStartFt || note.depthFt >= pageEndFt) continue
    const y = yForDepth(note.depthFt, pageStartFt)
    wrapText(note.text, textW, bodyFont).forEach((line, i) => {
      elements.push(
        <text key={`n-${note.id}-${i}`} x={textX} y={y + 3 + i * (FONT.body + 2)} fontSize={FONT.body} fontFamily={ff}>
          {line}
        </text>,
      )
    })
  }

  // water table symbol on the graphic column edge
  if (boring.water.encountered && boring.water.depthFt !== undefined) {
    const d = boring.water.depthFt
    if (d >= pageStartFt && d < pageEndFt) {
      const y = yForDepth(d, pageStartFt)
      const x = gx + gw + 2
      elements.push(
        <g key="water">
          <path d={`M ${x} ${y} l 7 0 l -3.5 6 z`} fill="black" />
          <line x1={x} y1={y + 8} x2={x + 7} y2={y + 8} stroke="black" strokeWidth={0.8} />
        </g>,
      )
    }
  }

  // BOH note below the final stratum
  const boh = boring.bohDepthFt
  if (boh > pageStartFt && boh <= pageEndFt) {
    const y = yForDepth(boh, pageStartFt)
    elements.push(
      <text
        key="boh"
        x={(COLS.graphic + COLS.right) / 2}
        y={y + 13}
        textAnchor="middle"
        fontSize={FONT.body}
        fontFamily={ff}
        fontWeight="bold"
      >
        BOH @ {boh}'
      </text>,
    )
  }

  return <g>{elements}</g>
}

export interface LogSheetProps {
  project: Project
  boring: Boring
  pageIndex: number
  figureLabel: string
}

export function LogSheet({ project, boring, pageIndex, figureLabel }: LogSheetProps) {
  const pageStartFt = pageIndex * FEET_PER_PAGE

  return (
    <svg
      viewBox={`0 0 ${SHEET.W} ${SHEET.H}`}
      width="8.5in"
      height="11in"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: 'white', display: 'block' }}
    >
      <HatchDefs />
      {/* outer border (double-weight) */}
      <rect x={BORDER.x} y={BORDER.y} width={BORDER.w} height={BORDER.h} fill="none" stroke="black" strokeWidth={2.5} />
      <rect x={BORDER.x + 3} y={BORDER.y + 3} width={BORDER.w - 6} height={BORDER.h - 6} fill="none" stroke="black" strokeWidth={0.8} />

      <LogSheetHeader project={project} boring={boring} />
      <ColumnHeaderBand />

      {/* vertical column rules from column-band top to page bottom */}
      {[COLS.moist, COLS.dryDen, COLS.blows, COLS.sample, COLS.depth, COLS.graphic].map((x) => (
        <line key={x} x1={x} y1={COLHEAD.top} x2={x} y2={BORDER.y + BORDER.h} stroke="black" strokeWidth={0.9} />
      ))}

      <DepthScale pageStartFt={pageStartFt} />
      <SamplesLayer boring={boring} pageStartFt={pageStartFt} />
      <GraphicAndClassification boring={boring} pageStartFt={pageStartFt} />

      {/* figure label outside the border */}
      <text
        x={BORDER.x + BORDER.w}
        y={BORDER.y + BORDER.h + 26}
        textAnchor="end"
        fontSize={FONT.figure}
        fontFamily={ff}
        fontWeight="bold"
      >
        Figure {figureLabel}
      </text>
    </svg>
  )
}
