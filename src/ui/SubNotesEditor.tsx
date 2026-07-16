import type { Boring } from '../types'
import { useProjectStore } from '../store/useProjectStore'
import { NumInput } from './fields'

export function SubNotesEditor({ boring }: { boring: Boring }) {
  const addSubNote = useProjectStore((s) => s.addSubNote)
  const updateSubNote = useProjectStore((s) => s.updateSubNote)
  const deleteSubNote = useProjectStore((s) => s.deleteSubNote)

  return (
    <div>
      <h3>
        Sub-notes
        <button className="add" onClick={() => addSubNote(boring.id)}>
          + Add note
        </button>
      </h3>
      <p className="hint">In-column annotations at a depth, e.g. "At 13.0', grades very loose".</p>
      <table className="row-table">
        <thead>
          <tr>
            <th style={{ width: 70 }}>Depth (ft)</th>
            <th>Text</th>
            <th style={{ width: 28 }}></th>
          </tr>
        </thead>
        <tbody>
          {boring.subNotes.map((n) => (
            <tr key={n.id}>
              <td>
                <NumInput value={n.depthFt} required onCommit={(v) => updateSubNote(boring.id, n.id, { depthFt: v ?? 0 })} />
              </td>
              <td>
                <input type="text" value={n.text} onChange={(e) => updateSubNote(boring.id, n.id, { text: e.target.value })} />
              </td>
              <td>
                <button className="icon" title="Delete note" onClick={() => deleteSubNote(boring.id, n.id)}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
