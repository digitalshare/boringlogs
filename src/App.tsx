import { useProjectStore } from './store/useProjectStore'
import { Sidebar } from './ui/Sidebar'
import { PreviewPane } from './ui/PreviewPane'
import { PrintView } from './ui/PrintView'
import { ProjectSettingsForm } from './ui/ProjectSettingsForm'
import { HoleHeaderForm } from './ui/HoleHeaderForm'
import { WaterLevelForm } from './ui/WaterLevelForm'
import { StrataEditor } from './ui/StrataEditor'
import { SamplesEditor } from './ui/SamplesEditor'
import { SubNotesEditor } from './ui/SubNotesEditor'
import { SieveTestEditor } from './ui/SieveTestEditor'

function EditorPane() {
  const project = useProjectStore((s) => s.project)
  const selection = useProjectStore((s) => s.selection)
  const deleteBoring = useProjectStore((s) => s.deleteBoring)
  const deleteSieveChart = useProjectStore((s) => s.deleteSieveChart)

  if (selection.kind === 'boring') {
    const boring = project.borings.find((b) => b.id === selection.id)
    if (!boring) return <div className="editor-pane" />
    return (
      <div className="editor-pane">
        <h2>Boring {boring.number}</h2>
        <HoleHeaderForm boring={boring} />
        <h3>Ground water</h3>
        <WaterLevelForm boring={boring} />
        <StrataEditor boring={boring} />
        <SamplesEditor boring={boring} />
        <SubNotesEditor boring={boring} />
        <h3>Danger zone</h3>
        <button
          className="add"
          style={{ color: '#b3372f', borderColor: '#e5c1bd', background: '#fdf1f0' }}
          onClick={() => {
            if (confirm(`Delete Boring ${boring.number}?`)) deleteBoring(boring.id)
          }}
        >
          Delete this boring
        </button>
      </div>
    )
  }

  if (selection.kind === 'sieve') {
    const chart = project.sieveCharts.find((c) => c.id === selection.id)
    if (!chart) return <div className="editor-pane" />
    return (
      <div className="editor-pane">
        <SieveTestEditor chart={chart} />
        <h3>Danger zone</h3>
        <button
          className="add"
          style={{ color: '#b3372f', borderColor: '#e5c1bd', background: '#fdf1f0' }}
          onClick={() => {
            if (confirm(`Delete sheet "${chart.name}"?`)) deleteSieveChart(chart.id)
          }}
        >
          Delete this sheet
        </button>
      </div>
    )
  }

  return (
    <div className="editor-pane">
      <ProjectSettingsForm />
    </div>
  )
}

export function App() {
  const printMode = useProjectStore((s) => s.printMode)

  if (printMode) return <PrintView />

  return (
    <div className="app-chrome">
      <Sidebar />
      <EditorPane />
      <PreviewPane />
    </div>
  )
}
