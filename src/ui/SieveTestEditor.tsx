import type { SieveChart, SieveSample, SievePoint, MarkerShape } from '../types'
import { useProjectStore } from '../store/useProjectStore'
import { deriveSieve, plasticityIndex } from '../domain/sieve'
import { Field, NumInput } from './fields'

const SHAPES: MarkerShape[] = ['circle', 'square', 'triangle', 'diamond']

function fmtD(v: number | undefined): string {
  return v === undefined ? '—' : String(v)
}

function PointsEditor({
  chartId,
  sample,
}: {
  chartId: string
  sample: SieveSample
}) {
  const updateSieveSample = useProjectStore((s) => s.updateSieveSample)
  const setPoints = (points: SievePoint[]) => updateSieveSample(chartId, sample.id, { points })

  const updatePoint = (i: number, patch: Partial<SievePoint>) =>
    setPoints(sample.points.map((p, j) => (j === i ? { ...p, ...patch } : p)))

  const addPoint = () => {
    const last = sample.points[sample.points.length - 1]
    setPoints([...sample.points, { sizeMm: last ? last.sizeMm / 2 : 25, percentFiner: last ? last.percentFiner : 100 }])
  }

  return (
    <div>
      <table className="row-table" style={{ maxWidth: 360 }}>
        <thead>
          <tr>
            <th style={{ width: 110 }}>Size (mm)</th>
            <th style={{ width: 110 }}>% finer</th>
            <th style={{ width: 28 }}></th>
          </tr>
        </thead>
        <tbody>
          {sample.points.map((p, i) => (
            <tr key={i}>
              <td>
                <NumInput value={p.sizeMm} step={0.001} required onCommit={(v) => updatePoint(i, { sizeMm: v ?? p.sizeMm })} />
              </td>
              <td>
                <NumInput value={p.percentFiner} required onCommit={(v) => updatePoint(i, { percentFiner: v ?? p.percentFiner })} />
              </td>
              <td>
                <button className="icon" title="Delete point" onClick={() => setPoints(sample.points.filter((_, j) => j !== i))}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add" style={{ marginTop: 4 }} onClick={addPoint}>
        + Add point
      </button>
    </div>
  )
}

function SieveSampleCard({ chartId, sample }: { chartId: string; sample: SieveSample }) {
  const updateSieveSample = useProjectStore((s) => s.updateSieveSample)
  const deleteSieveSample = useProjectStore((s) => s.deleteSieveSample)
  const up = (patch: Partial<SieveSample>) => updateSieveSample(chartId, sample.id, patch)

  const d = deriveSieve(sample)
  const pi = plasticityIndex(sample.ll, sample.pl)

  return (
    <div className="sieve-sample-card">
      <div className="card-head">
        <span>Sample {sample.label || '(unlabeled)'}</span>
        <button className="icon" title="Delete sieve sample" onClick={() => deleteSieveSample(chartId, sample.id)}>
          ✕
        </button>
      </div>
      <div className="field-grid">
        <Field label="Sample ID">
          <input type="text" value={sample.label} placeholder="e.g. 1 - 4 (boring - sample)" onChange={(e) => up({ label: e.target.value })} />
        </Field>
        <Field label="Depth (ft)">
          <NumInput value={sample.depthFt} required onCommit={(v) => up({ depthFt: v ?? 0 })} />
        </Field>
        <Field label="Classification">
          <input type="text" value={sample.classification} onChange={(e) => up({ classification: e.target.value })} />
        </Field>
        <Field label="MC %">
          <NumInput value={sample.mcPct} onCommit={(v) => up({ mcPct: v })} />
        </Field>
        <Field label="LL">
          <NumInput value={sample.ll} onCommit={(v) => up({ ll: v })} />
        </Field>
        <Field label="PL">
          <NumInput value={sample.pl} onCommit={(v) => up({ pl: v })} />
        </Field>
        <Field label="Marker shape">
          <select value={sample.markerShape} onChange={(e) => up({ markerShape: e.target.value as MarkerShape })}>
            {SHAPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <h3>Gradation points</h3>
      <p className="hint">Particle size vs. percent passing; plotted largest → smallest on the semi-log chart.</p>
      <PointsEditor chartId={chartId} sample={sample} />

      <div className="derived-box">
        <span>
          <b>PI</b> {pi === undefined ? '—' : pi}
        </span>
        <span>
          <b>D100</b> {fmtD(d.d100)}
        </span>
        <span>
          <b>D60</b> {fmtD(d.d60)}
        </span>
        <span>
          <b>D30</b> {fmtD(d.d30)}
        </span>
        <span>
          <b>D10</b> {fmtD(d.d10)}
        </span>
        <span>
          <b>Cu</b> {fmtD(d.cu)}
        </span>
        <span>
          <b>Cc</b> {fmtD(d.cc)}
        </span>
        <span>
          <b>% Gravel</b> {fmtD(d.pctGravel)}
        </span>
        <span>
          <b>% Sand</b> {fmtD(d.pctSand)}
        </span>
        <span>
          <b>% Fines</b> {fmtD(d.pctFines)}
        </span>
      </div>
    </div>
  )
}

export function SieveTestEditor({ chart }: { chart: SieveChart }) {
  const updateSieveChart = useProjectStore((s) => s.updateSieveChart)
  const addSieveSample = useProjectStore((s) => s.addSieveSample)

  return (
    <div>
      <h2>Grain Size Distribution — {chart.name}</h2>
      <div className="field-grid">
        <Field label="Sheet name">
          <input type="text" value={chart.name} onChange={(e) => updateSieveChart(chart.id, { name: e.target.value })} />
        </Field>
      </div>
      <h3>
        Samples on this sheet
        <button className="add" onClick={() => addSieveSample(chart.id)}>
          + Add sample
        </button>
      </h3>
      {chart.samples.map((s) => (
        <SieveSampleCard key={s.id} chartId={chart.id} sample={s} />
      ))}
      {chart.samples.length === 0 && <p className="hint">No samples yet — add one to start a curve.</p>}
    </div>
  )
}
