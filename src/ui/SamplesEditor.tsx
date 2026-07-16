import type { Boring } from '../types'
import { useProjectStore } from '../store/useProjectStore'
import { suggestNValue } from '../domain/spt'
import { NumInput } from './fields'

export function SamplesEditor({ boring }: { boring: Boring }) {
  const addSample = useProjectStore((s) => s.addSample)
  const updateSample = useProjectStore((s) => s.updateSample)
  const deleteSample = useProjectStore((s) => s.deleteSample)

  return (
    <div>
      <h3>
        Samples
        <button className="add" onClick={() => addSample(boring.id)}>
          + Add sample
        </button>
      </h3>
      <p className="hint">
        Blows accepts <code>42</code>, <code>75/9"</code>, or <code>R</code> (refusal). The (N) value is auto-suggested from the raw blows
        but stays editable. Kept sorted by depth.
      </p>
      <table className="row-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>#</th>
            <th style={{ width: 60 }}>Depth</th>
            <th style={{ width: 62 }}>Blows</th>
            <th style={{ width: 62 }}>(N)</th>
            <th style={{ width: 30 }} title="Show the * See Legend asterisk on this sample">
              *
            </th>
            <th style={{ width: 52 }}>MC %</th>
            <th style={{ width: 56 }}>DD pcf</th>
            <th>Lab test results</th>
            <th style={{ width: 28 }}></th>
          </tr>
        </thead>
        <tbody>
          {boring.samples.map((sm) => (
            <tr key={sm.id}>
              <td>
                <input type="text" value={sm.number} onChange={(e) => updateSample(boring.id, sm.id, { number: e.target.value })} />
              </td>
              <td>
                <NumInput value={sm.depthFt} required onCommit={(v) => updateSample(boring.id, sm.id, { depthFt: v ?? 0 })} />
              </td>
              <td>
                <input
                  type="text"
                  value={sm.rawBlows}
                  onChange={(e) =>
                    updateSample(boring.id, sm.id, { rawBlows: e.target.value, nValue: suggestNValue(e.target.value) })
                  }
                />
              </td>
              <td>
                <input type="text" value={sm.nValue} onChange={(e) => updateSample(boring.id, sm.id, { nValue: e.target.value })} />
              </td>
              <td style={{ textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={sm.seeLegend}
                  onChange={(e) => updateSample(boring.id, sm.id, { seeLegend: e.target.checked })}
                />
              </td>
              <td>
                <NumInput value={sm.moisturePct} onCommit={(v) => updateSample(boring.id, sm.id, { moisturePct: v })} />
              </td>
              <td>
                <NumInput value={sm.dryDensityPcf} onCommit={(v) => updateSample(boring.id, sm.id, { dryDensityPcf: v })} />
              </td>
              <td>
                <textarea
                  rows={1}
                  value={sm.labResults}
                  placeholder="one line per result"
                  onChange={(e) => updateSample(boring.id, sm.id, { labResults: e.target.value })}
                />
              </td>
              <td>
                <button className="icon" title="Delete sample" onClick={() => deleteSample(boring.id, sm.id)}>
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
