import { BORDER, COLHEAD, COLS, FONT } from './layout'

function StackedWord({ word, x, cy, fontSize }: { word: string; x: number; cy: number; fontSize: number }) {
  const lineH = fontSize + 1
  const startY = cy - ((word.length - 1) * lineH) / 2 + fontSize * 0.35
  return (
    <text x={x} textAnchor="middle" fontSize={fontSize} fontFamily={FONT.family} fontWeight="bold">
      {word.split('').map((ch, i) => (
        <tspan key={i} x={x} y={startY + i * lineH}>
          {ch}
        </tspan>
      ))}
    </text>
  )
}

export function ColumnHeaderBand() {
  const ff = FONT.family
  const top = COLHEAD.top
  const cy = top + COLHEAD.h / 2
  const mid = (a: number, b: number) => (a + b) / 2

  return (
    <g>
      {/* band borders */}
      <line x1={BORDER.x} y1={top} x2={COLS.right} y2={top} stroke="black" strokeWidth={1.5} />
      <line x1={BORDER.x} y1={top + COLHEAD.h} x2={COLS.right} y2={top + COLHEAD.h} stroke="black" strokeWidth={1.5} />

      {/* LAB TEST RESULTS */}
      <text x={COLS.labLeft + 8} y={top + 20} fontSize={FONT.colTitle} fontFamily={ff} fontWeight="bold">
        <tspan x={COLS.labLeft + 8} dy={0}>LAB</tspan>
        <tspan x={COLS.labLeft + 8} dy={11}>TEST</tspan>
        <tspan x={COLS.labLeft + 8} dy={11}>RESULTS</tspan>
      </text>

      {/* MOIST CONT. % (rotated) */}
      <text
        transform={`rotate(-90 ${mid(COLS.moist, COLS.dryDen)} ${cy})`}
        x={mid(COLS.moist, COLS.dryDen)}
        y={cy + 3}
        textAnchor="middle"
        fontSize={FONT.colTitle}
        fontFamily={ff}
        fontWeight="bold"
      >
        MOIST CONT. %
      </text>

      {/* DRY DEN. PCF (rotated) */}
      <text
        transform={`rotate(-90 ${mid(COLS.dryDen, COLS.blows)} ${cy})`}
        x={mid(COLS.dryDen, COLS.blows)}
        y={cy + 3}
        textAnchor="middle"
        fontSize={FONT.colTitle}
        fontFamily={ff}
        fontWeight="bold"
      >
        DRY DEN. PCF
      </text>

      {/* BLOWS PER FT. + legend footnote */}
      <text x={mid(COLS.blows, COLS.sample)} y={top + 24} textAnchor="middle" fontSize={FONT.colTitle} fontFamily={ff} fontWeight="bold">
        <tspan x={mid(COLS.blows, COLS.sample)} dy={0}>BLOWS</tspan>
        <tspan x={mid(COLS.blows, COLS.sample)} dy={11}>PER</tspan>
        <tspan x={mid(COLS.blows, COLS.sample)} dy={11}>FT.</tspan>
      </text>
      <text x={mid(COLS.blows, COLS.sample)} y={top + COLHEAD.h - 5} textAnchor="middle" fontSize={6.5} fontFamily={ff}>
        *(x) See Legend
      </text>

      {/* SAMPLE / DEPTH stacked */}
      <StackedWord word="SAMPLE" x={mid(COLS.sample, COLS.depth)} cy={cy} fontSize={8} />
      <StackedWord word="DEPTH" x={mid(COLS.depth, COLS.graphic)} cy={cy} fontSize={8} />

      {/* CLASSIFICATION spanning graphic + text area */}
      <text
        x={mid(COLS.graphic, COLS.right)}
        y={cy + 4}
        textAnchor="middle"
        fontSize={FONT.colTitle + 1}
        fontFamily={ff}
        fontWeight="bold"
      >
        CLASSIFICATION
      </text>
    </g>
  )
}
