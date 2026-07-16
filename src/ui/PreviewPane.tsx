import { useProjectStore } from '../store/useProjectStore'
import { boringPages } from '../domain/pagination'
import { LogSheet } from '../sheet/LogSheet'
import { SieveSheet } from '../sievesheet/SieveSheet'

/** Live preview of the sheet(s) for the current selection, scaled to fit. */
export function PreviewPane() {
  const project = useProjectStore((s) => s.project)
  const selection = useProjectStore((s) => s.selection)

  if (selection.kind === 'boring') {
    const i = project.borings.findIndex((b) => b.id === selection.id)
    const boring = project.borings[i]
    if (!boring) return <div className="preview-pane" />
    const pages = boringPages(boring, project.boringFigureStart + i)
    return (
      <div className="preview-pane">
        {pages.map((p) => (
          <div className="sheet-wrap" key={p.figureLabel}>
            <LogSheet project={project} boring={boring} pageIndex={p.pageIndex} figureLabel={p.figureLabel} />
          </div>
        ))}
      </div>
    )
  }

  if (selection.kind === 'sieve') {
    const i = project.sieveCharts.findIndex((c) => c.id === selection.id)
    const chart = project.sieveCharts[i]
    if (!chart) return <div className="preview-pane" />
    return (
      <div className="preview-pane">
        <div className="sheet-wrap">
          <SieveSheet project={project} chart={chart} figureLabel={String(project.sieveFigureStart + i)} />
        </div>
      </div>
    )
  }

  return (
    <div className="preview-pane">
      <div className="preview-empty">Select a boring or grain size sheet to preview it here.</div>
    </div>
  )
}
