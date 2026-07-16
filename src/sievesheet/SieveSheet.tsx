import type { Project, SieveChart, SieveSample, MarkerShape } from '../types'
import { SHEET, BORDER, PLOT, DECADES, xForSize, yForPct, STANDARD_SIEVES, ZONE, ZONE_BREAKS, TABLE1, TABLE2, TITLE, FONT } from './sieveLayout'
import { deriveSieve, sortedPoints, plasticityIndex } from '../domain/sieve'
import { Logo } from '../sheet/Logo'

const ff = FONT.family

function fmt(v: number | undefined): string {
  return v === undefined ? '' : String(v)
}

/* ---------- chart grid ---------- */

function Grid() {
  const lines: JSX.Element[] = []
  // vertical: decade majors + log minors
  for (let d = 0; d <= DECADES; d++) {
    const decade = 100 / Math.pow(10, d)
    lines.push(
      <line key={`maj-${d}`} x1={xForSize(decade)} y1={PLOT.y} x2={xForSize(decade)} y2={PLOT.y + PLOT.h} stroke="black" strokeWidth={0.9} />,
    )
    if (d < DECADES) {
      for (let m = 2; m <= 9; m++) {
        const v = (decade / 10) * m
        lines.push(
          <line key={`min-${d}-${m}`} x1={xForSize(v)} y1={PLOT.y} x2={xForSize(v)} y2={PLOT.y + PLOT.h} stroke="#888" strokeWidth={0.3} />,
        )
      }
    }
  }
  // horizontal: every 2% light, every 10% heavy
  for (let p = 0; p <= 100; p += 2) {
    const major = p % 10 === 0
    lines.push(
      <line
        key={`h-${p}`}
        x1={PLOT.x}
        y1={yForPct(p)}
        x2={PLOT.x + PLOT.w}
        y2={yForPct(p)}
        stroke={major ? 'black' : '#888'}
        strokeWidth={major ? 0.7 : 0.3}
      />,
    )
  }
  return <g>{lines}</g>
}

function Axes() {
  const els: JSX.Element[] = []
  // Y labels 0-100
  for (let p = 0; p <= 100; p += 10) {
    els.push(
      <text key={`y-${p}`} x={PLOT.x - 6} y={yForPct(p) + 3} textAnchor="end" fontSize={FONT.axis} fontFamily={ff}>
        {p}
      </text>,
    )
  }
  // X decade labels
  const decadeValues = [100, 10, 1, 0.1, 0.01, 0.001]
  decadeValues.forEach((v) => {
    els.push(
      <text key={`x-${v}`} x={xForSize(v)} y={PLOT.y + PLOT.h + 14} textAnchor="middle" fontSize={FONT.axis} fontFamily={ff}>
        {v}
      </text>,
    )
  })
  // Axis titles
  els.push(
    <text key="xt" x={PLOT.x + PLOT.w / 2} y={PLOT.y + PLOT.h + 32} textAnchor="middle" fontSize={10} fontFamily={ff} fontWeight="bold">
      PARTICLE SIZE (in MM)
    </text>,
  )
  const yTitle = 'PERCENT FINER BY WEIGHT'
  els.push(
    <text key="yt" x={PLOT.x - 44} y={PLOT.y + PLOT.h / 2} textAnchor="middle" fontSize={9} fontFamily={ff} fontWeight="bold"
      transform={`rotate(-90 ${PLOT.x - 44} ${PLOT.y + PLOT.h / 2})`}>
      {yTitle}
    </text>,
  )
  return <g>{els}</g>
}

function SieveLabels() {
  const els: JSX.Element[] = []
  const rowY = [PLOT.y - 26, PLOT.y - 14] // upper / lower stagger rows
  for (const s of STANDARD_SIEVES) {
    const x = xForSize(s.mm)
    els.push(
      <line key={`g-${s.label}`} x1={x} y1={PLOT.y} x2={x} y2={PLOT.y + PLOT.h} stroke="black" strokeWidth={0.4} strokeDasharray="2.5 2.5" />,
      <line key={`t-${s.label}`} x1={x} y1={PLOT.y - 5} x2={x} y2={PLOT.y} stroke="black" strokeWidth={0.7} />,
      <text key={`l-${s.label}`} x={x} y={rowY[s.row]} textAnchor="middle" fontSize={FONT.sieveLabel} fontFamily={ff}>
        {s.label}
      </text>,
    )
  }
  // split header: Sieve Analysis | Hydrometer Analysis
  const splitX = xForSize(0.075)
  const headerY = PLOT.y - 40
  els.push(
    <text key="sa" x={(PLOT.x + splitX) / 2} y={headerY} textAnchor="middle" fontSize={9.5} fontFamily={ff}>
      Sieve Analysis
    </text>,
    <text key="ha" x={(splitX + PLOT.x + PLOT.w) / 2} y={headerY} textAnchor="middle" fontSize={9.5} fontFamily={ff}>
      Hydrometer Analysis
    </text>,
    <line key="split" x1={splitX} y1={headerY - 9} x2={splitX} y2={headerY + 3} stroke="black" strokeWidth={0.7} />,
  )
  return <g>{els}</g>
}

/* ---------- curves ---------- */

function Marker({ shape, x, y, size = 3.2 }: { shape: MarkerShape; x: number; y: number; size?: number }) {
  switch (shape) {
    case 'square':
      return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} fill="black" />
    case 'triangle':
      return <path d={`M ${x} ${y - size} L ${x + size} ${y + size} L ${x - size} ${y + size} Z`} fill="black" />
    case 'diamond':
      return <path d={`M ${x} ${y - size} L ${x + size} ${y} L ${x} ${y + size} L ${x - size} ${y} Z`} fill="black" />
    default:
      return <circle cx={x} cy={y} r={size} fill="black" />
  }
}

/** Monotone cubic path through the curve points, computed in (log-x, y) space. */
function curvePath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  const n = pts.length
  const dx: number[] = []
  const dy: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x)
    dy.push(pts[i + 1].y - pts[i].y)
    m.push(dy[i] / dx[i])
  }
  const t: number[] = [m[0]]
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t.push(0)
    else {
      const w1 = 2 * dx[i] + dx[i - 1]
      const w2 = dx[i] + 2 * dx[i - 1]
      t.push((w1 + w2) / (w1 / m[i - 1] + w2 / m[i]))
    }
  }
  t.push(m[n - 2])
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i]
    d += ` C ${pts[i].x + h / 3} ${pts[i].y + (t[i] * h) / 3}, ${pts[i + 1].x - h / 3} ${pts[i + 1].y - (t[i + 1] * h) / 3}, ${pts[i + 1].x} ${pts[i + 1].y}`
  }
  return d
}

function Curves({ samples }: { samples: SieveSample[] }) {
  return (
    <g>
      {samples.map((s) => {
        const pts = sortedPoints(s.points).map((p) => ({ x: xForSize(p.sizeMm), y: yForPct(p.percentFiner) }))
        return (
          <g key={s.id}>
            <path d={curvePath(pts)} fill="none" stroke="black" strokeWidth={1.6} />
            {pts.map((p, i) => (
              <Marker key={i} shape={s.markerShape} x={p.x} y={p.y} />
            ))}
          </g>
        )
      })}
    </g>
  )
}

/* ---------- zone band ---------- */

function ZoneBand() {
  const y = ZONE.y
  const h = ZONE.h
  const x0 = PLOT.x
  const x1 = PLOT.x + PLOT.w
  const half = y + h / 2
  const b = ZONE_BREAKS
  const xCoarseGravel = xForSize(b.coarseGravel)
  const xGravel = xForSize(b.gravel)
  const xCoarseSand = xForSize(b.coarseSand)
  const xMediumSand = xForSize(b.mediumSand)
  const xFines = xForSize(b.fines)

  const cell = (xa: number, xb: number, label: string, yy: number, bold = false) => (
    <text key={`${label}-${xa}`} x={(xa + xb) / 2} y={yy} textAnchor="middle" fontSize={9} fontFamily={ff} fontWeight={bold ? 'bold' : 'normal'}>
      {label}
    </text>
  )

  return (
    <g>
      <rect x={x0} y={y} width={x1 - x0} height={h} fill="none" stroke="black" strokeWidth={1.2} />
      {/* top-row dividers: gravel|sand at #4, sand|fines at #200 */}
      <line x1={xGravel} y1={y} x2={xGravel} y2={y + h} stroke="black" strokeWidth={1} />
      <line x1={xFines} y1={y} x2={xFines} y2={y + h} stroke="black" strokeWidth={1} />
      {/* mid split for top/bottom rows (only left of #200) */}
      <line x1={x0} y1={half} x2={xFines} y2={half} stroke="black" strokeWidth={0.7} />
      {/* second-row dividers */}
      <line x1={xCoarseGravel} y1={half} x2={xCoarseGravel} y2={y + h} stroke="black" strokeWidth={0.7} />
      <line x1={xCoarseSand} y1={half} x2={xCoarseSand} y2={y + h} stroke="black" strokeWidth={0.7} />
      <line x1={xMediumSand} y1={half} x2={xMediumSand} y2={y + h} stroke="black" strokeWidth={0.7} />
      {/* labels */}
      {cell(x0, xGravel, 'Gravel', y + 12, true)}
      {cell(xGravel, xFines, 'Sand', y + 12, true)}
      {cell(xFines, x1, 'Silt and Clay', y + h / 2 + 3, true)}
      {cell(x0, xCoarseGravel, 'coarse', y + h - 5)}
      {cell(xCoarseGravel, xGravel, 'fine', y + h - 5)}
      {cell(xGravel, xCoarseSand, 'coarse', y + h - 5)}
      {cell(xCoarseSand, xMediumSand, 'medium', y + h - 5)}
      {cell(xMediumSand, xFines, 'fine', y + h - 5)}
    </g>
  )
}

/* ---------- summary tables ---------- */

interface Col {
  label: string
  w: number
  get: (s: SieveSample) => string
}

function SummaryTable({
  x,
  y,
  headerH,
  rowH,
  cols,
  samples,
}: {
  x: number
  y: number
  headerH: number
  rowH: number
  cols: Col[]
  samples: SieveSample[]
}) {
  const totalW = cols.reduce((a, c) => a + c.w, 0) + 14 // 14 = marker column
  const rows = Math.max(samples.length + 1, 2) // trailing blank row like the reference
  const els: JSX.Element[] = []

  // header
  els.push(<rect key="hdr" x={x} y={y} width={totalW} height={headerH} fill="#d8d8d8" stroke="black" strokeWidth={0.8} />)
  let cx = x + 14
  cols.forEach((c) => {
    els.push(
      <text key={`h-${c.label}`} x={cx + c.w / 2} y={y + headerH - 4} textAnchor="middle" fontSize={FONT.tableHeader} fontFamily={ff}>
        {c.label}
      </text>,
    )
    cx += c.w
  })

  // body grid + values
  for (let r = 0; r < rows; r++) {
    const ry = y + headerH + r * rowH
    els.push(<rect key={`r-${r}`} x={x} y={ry} width={totalW} height={rowH} fill="none" stroke="black" strokeWidth={0.6} />)
    const s = samples[r]
    if (s) {
      els.push(<Marker key={`m-${r}`} shape={s.markerShape} x={x + 7} y={ry + rowH / 2} />)
      let cx2 = x + 14
      cols.forEach((c) => {
        els.push(
          <text key={`v-${r}-${c.label}`} x={cx2 + c.w / 2} y={ry + rowH / 2 + 3} textAnchor="middle" fontSize={FONT.table} fontFamily={ff}>
            {c.get(s)}
          </text>,
        )
        cx2 += c.w
      })
    }
  }
  // vertical separators
  let vx = x + 14
  cols.forEach((c, i) => {
    if (i > 0) {
      els.push(<line key={`sep-${i}`} x1={vx} y1={y} x2={vx} y2={y + headerH + rows * rowH} stroke="black" strokeWidth={0.5} />)
    }
    vx += c.w
  })
  return <g>{els}</g>
}

/* ---------- title block ---------- */

function TitleBlock({ project }: { project: Project }) {
  const y = TITLE.y
  const h = TITLE.h
  const x0 = BORDER.x
  const x1 = BORDER.x + BORDER.w
  const logoX = x0 + TITLE.logoW
  const rightX = x1 - TITLE.rightW
  const midX = (logoX + rightX) / 2
  return (
    <g>
      <rect x={x0} y={y} width={x1 - x0} height={h} fill="none" stroke="black" strokeWidth={1.5} />
      <line x1={logoX} y1={y} x2={logoX} y2={y + h} stroke="black" strokeWidth={1} />
      <line x1={rightX} y1={y} x2={rightX} y2={y + h} stroke="black" strokeWidth={1} />
      <line x1={rightX} y1={y + h / 2} x2={x1} y2={y + h / 2} stroke="black" strokeWidth={1} />
      <Logo cx={x0 + TITLE.logoW / 2} cy={y + h / 2 - 6} r={26} label={project.companyLabel} logoDataUrl={project.logoDataUrl} />
      <text x={midX} y={y + 26} textAnchor="middle" fontSize={FONT.title} fontFamily={ff} fontWeight="bold">
        GRAIN SIZE DISTRIBUTION
      </text>
      {[project.projectLine1, project.projectLine2, project.location].filter(Boolean).map((line, i) => (
        <text key={i} x={midX} y={y + 46 + i * 13} textAnchor="middle" fontSize={FONT.sub} fontFamily={ff}>
          {line}
        </text>
      ))}
      <text x={(rightX + x1) / 2} y={y + h / 4 + 4} textAnchor="middle" fontSize={FONT.sub} fontFamily={ff}>
        File: {project.fileNumber}
      </text>
      <text x={(rightX + x1) / 2} y={y + (3 * h) / 4 + 4} textAnchor="middle" fontSize={FONT.sub} fontFamily={ff}>
        {project.dateOfDrawing}
      </text>
    </g>
  )
}

/* ---------- sheet ---------- */

export interface SieveSheetProps {
  project: Project
  chart: SieveChart
  figureLabel: string
}

export function SieveSheet({ project, chart, figureLabel }: SieveSheetProps) {
  const samples = chart.samples

  const cols1: Col[] = [
    { label: 'Sample ID', w: 62, get: (s) => s.label },
    { label: 'Depth', w: 40, get: (s) => fmt(s.depthFt) },
    { label: 'Classification', w: 240, get: (s) => s.classification },
    { label: 'MC%', w: 36, get: (s) => fmt(s.mcPct) },
    { label: 'LL', w: 32, get: (s) => fmt(s.ll) },
    { label: 'PL', w: 32, get: (s) => fmt(s.pl) },
    { label: 'PI', w: 32, get: (s) => fmt(plasticityIndex(s.ll, s.pl)) },
    { label: 'Cc', w: 36, get: (s) => fmt(deriveSieve(s).cc) },
    { label: 'Cu', w: 36, get: (s) => fmt(deriveSieve(s).cu) },
  ]
  const cols2: Col[] = [
    { label: 'Sample ID', w: 62, get: (s) => s.label },
    { label: 'Depth', w: 40, get: (s) => fmt(s.depthFt) },
    { label: 'D100', w: 56, get: (s) => fmt(deriveSieve(s).d100) },
    { label: 'D60', w: 56, get: (s) => fmt(deriveSieve(s).d60) },
    { label: 'D30', w: 56, get: (s) => fmt(deriveSieve(s).d30) },
    { label: 'D10', w: 56, get: (s) => fmt(deriveSieve(s).d10) },
    { label: '%Gravel', w: 56, get: (s) => fmt(deriveSieve(s).pctGravel) },
    { label: '%Sand', w: 56, get: (s) => fmt(deriveSieve(s).pctSand) },
    { label: '%Silt & Clay', w: 108, get: (s) => fmt(deriveSieve(s).pctFines) },
  ]

  return (
    <svg
      viewBox={`0 0 ${SHEET.W} ${SHEET.H}`}
      width="8.5in"
      height="11in"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: 'white', display: 'block' }}
    >
      <rect x={BORDER.x} y={BORDER.y} width={BORDER.w} height={BORDER.h} fill="none" stroke="black" strokeWidth={2.5} />
      <Grid />
      <SieveLabels />
      <Axes />
      <Curves samples={samples} />
      <ZoneBand />
      <SummaryTable x={TABLE1.x} y={TABLE1.y} headerH={TABLE1.headerH} rowH={TABLE1.rowH} cols={cols1} samples={samples} />
      <SummaryTable x={TABLE2.x} y={TABLE2.y} headerH={TABLE2.headerH} rowH={TABLE2.rowH} cols={cols2} samples={samples} />
      <TitleBlock project={project} />
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
