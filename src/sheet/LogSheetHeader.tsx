import type { Project, Boring } from '../types'
import { BORDER, HEADER, FONT } from './layout'
import { Logo } from './Logo'

function waterText(b: Boring): string {
  const when = b.water.date || b.water.time ? ` (${[b.water.date, b.water.time].filter(Boolean).join(', ')})` : ''
  if (!b.water.encountered) return `None Encountered${when}`
  const depth = b.water.depthFt !== undefined ? `${b.water.depthFt}'` : ''
  return `${depth}${when}`
}

interface Props {
  project: Project
  boring: Boring
}

export function LogSheetHeader({ project, boring }: Props) {
  const ff = FONT.family
  const fs = FONT.header
  const L = HEADER
  const rows: Array<[string, string]> = [
    ['Boring:', boring.number],
    ['Project:', project.projectLine1],
    ['', project.projectLine2],
    ['Location:', project.location],
    ['Surface Elevation:', boring.surfaceElevation],
    ['Depth to Water:', waterText(boring)],
    ['Date Completed:', boring.dateCompleted],
  ]
  const right: Array<[string, string, number]> = [
    ['File:', project.fileNumber, 0],
    ['Project Engineer:', project.projectEngineer, 3],
    ['Field Engineer:', project.fieldEngineer, 4],
    ['Drafted by:', project.draftedBy, 5],
    ['Date of Drawing:', project.dateOfDrawing, 6],
  ]
  const logoCx = BORDER.x + L.logoW / 2
  const logoCy = L.top + L.h / 2 - 8

  return (
    <g>
      <Logo cx={logoCx} cy={logoCy} r={34} label={project.companyLabel} logoDataUrl={project.logoDataUrl} />
      {rows.map(([label, value], i) =>
        label || value ? (
          <g key={i}>
            {label && (
              <text x={L.leftLabelX} y={L.line1Y + i * L.lineH} fontSize={fs} fontFamily={ff} fontWeight="bold">
                {label}
              </text>
            )}
            <text x={L.leftValueX} y={L.line1Y + i * L.lineH} fontSize={fs} fontFamily={ff}>
              {value}
            </text>
          </g>
        ) : null,
      )}
      {right.map(([label, value, row]) => (
        <g key={label}>
          <text x={L.rightLabelX} y={L.line1Y + row * L.lineH} fontSize={fs} fontFamily={ff} fontWeight="bold">
            {label}
          </text>
          <text x={L.rightValueX} y={L.line1Y + row * L.lineH} fontSize={fs} fontFamily={ff}>
            {value}
          </text>
        </g>
      ))}
    </g>
  )
}
