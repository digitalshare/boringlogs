import type { Boring } from '../types'
import { useProjectStore } from '../store/useProjectStore'
import { Field, NumInput } from './fields'

export function HoleHeaderForm({ boring }: { boring: Boring }) {
  const updateBoring = useProjectStore((s) => s.updateBoring)
  const up = (patch: Partial<Boring>) => updateBoring(boring.id, patch)

  return (
    <div className="field-grid">
      <Field label="Boring number">
        <input type="text" value={boring.number} onChange={(e) => up({ number: e.target.value })} />
      </Field>
      <Field label="Surface elevation">
        <input
          type="text"
          value={boring.surfaceElevation}
          placeholder="e.g. Not Available or 12.5'"
          onChange={(e) => up({ surfaceElevation: e.target.value })}
        />
      </Field>
      <Field label="Date completed">
        <input type="text" value={boring.dateCompleted} placeholder="e.g. 3-9-26" onChange={(e) => up({ dateCompleted: e.target.value })} />
      </Field>
      <Field label="BOH depth (ft)">
        <NumInput value={boring.bohDepthFt} required onCommit={(v) => up({ bohDepthFt: v ?? 0 })} />
      </Field>
    </div>
  )
}
