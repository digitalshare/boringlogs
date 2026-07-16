import type { Boring } from '../types'
import { useProjectStore } from '../store/useProjectStore'
import { SOIL_TYPES } from '../domain/uscs'
import { NumInput } from './fields'

export function StrataEditor({ boring }: { boring: Boring }) {
  const addStratum = useProjectStore((s) => s.addStratum)
  const updateStratum = useProjectStore((s) => s.updateStratum)
  const deleteStratum = useProjectStore((s) => s.deleteStratum)

  return (
    <div>
      <h3>
        Strata
        <button className="add" onClick={() => addStratum(boring.id)}>
          + Add stratum
        </button>
      </h3>
      <p className="hint">Each stratum runs from its top depth to the next stratum's top (the last runs to BOH). Kept sorted by depth.</p>
      <table className="row-table">
        <thead>
          <tr>
            <th style={{ width: 62 }}>Top (ft)</th>
            <th style={{ width: 120 }}>Soil type (hatch)</th>
            <th>Description</th>
            <th style={{ width: 92 }}>Unit label</th>
            <th style={{ width: 28 }}></th>
          </tr>
        </thead>
        <tbody>
          {boring.strata.map((st) => (
            <tr key={st.id}>
              <td>
                <NumInput value={st.topDepthFt} required onCommit={(v) => updateStratum(boring.id, st.id, { topDepthFt: v ?? 0 })} />
              </td>
              <td>
                <select value={st.uscs} onChange={(e) => updateStratum(boring.id, st.id, { uscs: e.target.value })}>
                  {SOIL_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <textarea
                  rows={2}
                  value={st.description}
                  onChange={(e) => updateStratum(boring.id, st.id, { description: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={st.unitLabel ?? ''}
                  placeholder="FILL"
                  onChange={(e) => updateStratum(boring.id, st.id, { unitLabel: e.target.value || undefined })}
                />
              </td>
              <td>
                <button className="icon" title="Delete stratum" onClick={() => deleteStratum(boring.id, st.id)}>
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
