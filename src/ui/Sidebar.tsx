import { useRef } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { exportProject } from '../store/persistence'
import { boringPageCount } from '../domain/pagination'

export function Sidebar() {
  const index = useProjectStore((s) => s.index)
  const project = useProjectStore((s) => s.project)
  const selection = useProjectStore((s) => s.selection)
  const setSelection = useProjectStore((s) => s.setSelection)
  const setPrintMode = useProjectStore((s) => s.setPrintMode)
  const switchProject = useProjectStore((s) => s.switchProject)
  const newProject = useProjectStore((s) => s.newProject)
  const importProject = useProjectStore((s) => s.importProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const addBoring = useProjectStore((s) => s.addBoring)
  const addSieveChart = useProjectStore((s) => s.addSieveChart)

  const fileInput = useRef<HTMLInputElement>(null)

  const onImportFile = (file: File | undefined) => {
    if (!file) return
    file.text().then(
      (text) => {
        try {
          importProject(text)
        } catch (e) {
          alert(`Import failed: ${e instanceof Error ? e.message : e}`)
        }
      },
      () => alert('Could not read file'),
    )
  }

  return (
    <div className="sidebar">
      <h1>Boring Logs</h1>

      <div className="section">
        <div className="section-title">Project</div>
        <select value={project.id} onChange={(e) => switchProject(e.target.value)}>
          {index.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <div className="btn-row">
          <button
            className="small"
            onClick={() => {
              const name = prompt('New project name?')
              if (name !== null) newProject(name)
            }}
          >
            New
          </button>
          <button className="small" onClick={() => fileInput.current?.click()}>
            Import
          </button>
          <button className="small" onClick={() => exportProject(project)}>
            Export
          </button>
          <button
            className="small"
            onClick={() => {
              if (confirm(`Delete project "${project.name}" from browser storage? Export it first if you want a backup.`)) {
                deleteProject(project.id)
              }
            }}
          >
            Delete
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            onImportFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <button
          className={`nav-item${selection.kind === 'project' ? ' active' : ''}`}
          onClick={() => setSelection({ kind: 'project' })}
        >
          <span>Project settings</span>
        </button>
      </div>

      <div className="section">
        <div className="section-title">
          Borings
          <button className="add-btn" onClick={addBoring}>
            + Add
          </button>
        </div>
        {project.borings.map((b, i) => {
          const fig = project.boringFigureStart + i
          const pages = boringPageCount(b)
          return (
            <button
              key={b.id}
              className={`nav-item${selection.kind === 'boring' && selection.id === b.id ? ' active' : ''}`}
              onClick={() => setSelection({ kind: 'boring', id: b.id })}
            >
              <span>Boring {b.number}</span>
              <span className="fig">
                Fig {fig}
                {pages > 1 ? ` (${pages} pg)` : ''}
              </span>
            </button>
          )
        })}
      </div>

      <div className="section">
        <div className="section-title">
          Grain Size Sheets
          <button className="add-btn" onClick={addSieveChart}>
            + Add
          </button>
        </div>
        {project.sieveCharts.map((c, i) => (
          <button
            key={c.id}
            className={`nav-item${selection.kind === 'sieve' && selection.id === c.id ? ' active' : ''}`}
            onClick={() => setSelection({ kind: 'sieve', id: c.id })}
          >
            <span>{c.name}</span>
            <span className="fig">Fig {project.sieveFigureStart + i}</span>
          </button>
        ))}
      </div>

      <button className="print-all" onClick={() => setPrintMode(true)}>
        Print / Export PDF…
      </button>
    </div>
  )
}
