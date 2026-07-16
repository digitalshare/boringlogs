import type { Boring } from '../types'
import { useProjectStore } from '../store/useProjectStore'
import { Field, NumInput } from './fields'

export function WaterLevelForm({ boring }: { boring: Boring }) {
  const updateBoring = useProjectStore((s) => s.updateBoring)
  const w = boring.water
  const up = (patch: Partial<Boring['water']>) => updateBoring(boring.id, { water: { ...w, ...patch } })

  return (
    <div className="field-grid">
      <label>Water encountered</label>
      <div className="check-row">
        <input
          type="checkbox"
          checked={w.encountered}
          onChange={(e) => up({ encountered: e.target.checked, depthFt: e.target.checked ? w.depthFt : undefined })}
        />
        <span>{w.encountered ? 'Yes — shows depth + ▼ symbol' : 'No — shows "None Encountered"'}</span>
      </div>
      {w.encountered && (
        <Field label="Depth to water (ft)">
          <NumInput value={w.depthFt} onCommit={(v) => up({ depthFt: v })} placeholder="e.g. 7.2" />
        </Field>
      )}
      <Field label="Observation date">
        <input type="text" value={w.date} placeholder="e.g. 3-9-26" onChange={(e) => up({ date: e.target.value })} />
      </Field>
      <Field label="Observation time">
        <input type="text" value={w.time} placeholder="e.g. 10:34am" onChange={(e) => up({ time: e.target.value })} />
      </Field>
    </div>
  )
}
