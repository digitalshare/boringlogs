import { useProjectStore } from '../store/useProjectStore'
import { Field, NumInput } from './fields'

export function ProjectSettingsForm() {
  const project = useProjectStore((s) => s.project)
  const updateProject = useProjectStore((s) => s.updateProject)
  const up = (patch: Parameters<typeof updateProject>[0]) => updateProject(patch)

  const onLogoFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => up({ logoDataUrl: String(reader.result) })
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <h2>Project Settings</h2>
      <p className="hint">These fields appear in the header/title block of every sheet.</p>
      <div className="field-grid">
        <Field label="Project name">
          <input type="text" value={project.name} onChange={(e) => up({ name: e.target.value })} />
        </Field>
        <Field label="Project line 1">
          <input type="text" value={project.projectLine1} onChange={(e) => up({ projectLine1: e.target.value })} />
        </Field>
        <Field label="Project line 2">
          <input type="text" value={project.projectLine2} onChange={(e) => up({ projectLine2: e.target.value })} />
        </Field>
        <Field label="Location">
          <input type="text" value={project.location} onChange={(e) => up({ location: e.target.value })} />
        </Field>
        <Field label="File number">
          <input type="text" value={project.fileNumber} onChange={(e) => up({ fileNumber: e.target.value })} />
        </Field>
        <Field label="Project engineer">
          <input type="text" value={project.projectEngineer} onChange={(e) => up({ projectEngineer: e.target.value })} />
        </Field>
        <Field label="Field engineer">
          <input type="text" value={project.fieldEngineer} onChange={(e) => up({ fieldEngineer: e.target.value })} />
        </Field>
        <Field label="Drafted by">
          <input type="text" value={project.draftedBy} onChange={(e) => up({ draftedBy: e.target.value })} />
        </Field>
        <Field label="Date of drawing">
          <input type="text" value={project.dateOfDrawing} onChange={(e) => up({ dateOfDrawing: e.target.value })} />
        </Field>
        <Field label="Company label">
          <input type="text" value={project.companyLabel} onChange={(e) => up({ companyLabel: e.target.value })} />
        </Field>
        <Field label="Logo image">
          <div>
            <input type="file" accept="image/*" onChange={(e) => onLogoFile(e.target.files?.[0])} />
            {project.logoDataUrl && (
              <button className="add" style={{ marginTop: 4 }} onClick={() => up({ logoDataUrl: undefined })}>
                Remove logo
              </button>
            )}
          </div>
        </Field>
        <Field label="First boring figure #">
          <NumInput value={project.boringFigureStart} step={1} required onCommit={(v) => up({ boringFigureStart: v ?? 1 })} />
        </Field>
        <Field label="First sieve figure #">
          <NumInput value={project.sieveFigureStart} step={1} required onCommit={(v) => up({ sieveFigureStart: v ?? 1 })} />
        </Field>
      </div>
    </div>
  )
}
