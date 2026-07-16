import { useProjectStore } from '../store/useProjectStore'
import { projectPages } from '../domain/pagination'
import { LogSheet } from '../sheet/LogSheet'
import { SieveSheet } from '../sievesheet/SieveSheet'

/** All sheets of the project in figure order, one per printed page. */
export function PrintView() {
  const project = useProjectStore((s) => s.project)
  const setPrintMode = useProjectStore((s) => s.setPrintMode)
  const pages = projectPages(project)

  return (
    <div className="print-view">
      <div className="print-toolbar">
        <button className="secondary" onClick={() => setPrintMode(false)}>
          ← Back to editor
        </button>
        <button className="primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <span className="note">
          {pages.length} sheet{pages.length === 1 ? '' : 's'} — in the print dialog set margins to None and scale to 100%.
        </span>
      </div>
      {pages.map((p) => {
        if (p.kind === 'boring') {
          const boring = project.borings.find((b) => b.id === p.boringId)
          if (!boring) return null
          return (
            <div className="sheet-page" key={`${p.boringId}-${p.pageIndex}`}>
              <LogSheet project={project} boring={boring} pageIndex={p.pageIndex} figureLabel={p.figureLabel} />
            </div>
          )
        }
        const chart = project.sieveCharts.find((c) => c.id === p.sieveChartId)
        if (!chart) return null
        return (
          <div className="sheet-page" key={p.sieveChartId}>
            <SieveSheet project={project} chart={chart} figureLabel={p.figureLabel} />
          </div>
        )
      })}
    </div>
  )
}
