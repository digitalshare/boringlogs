import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Project, Boring, SieveChart, SieveSample, Stratum, Sample, SubNote } from '../types'
import {
  loadIndex,
  loadProject,
  saveProject,
  deleteProject as removeStored,
  parseProjectFile,
  type ProjectIndexEntry,
} from './persistence'
import { makeSeedProject, makeEmptyProject, makeEmptyBoring, makeEmptySieveChart } from './seed'

export type Selection =
  | { kind: 'project' }
  | { kind: 'boring'; id: string }
  | { kind: 'sieve'; id: string }

interface StoreState {
  index: ProjectIndexEntry[]
  project: Project
  selection: Selection
  printMode: boolean

  setSelection: (s: Selection) => void
  setPrintMode: (on: boolean) => void

  updateProject: (patch: Partial<Project>) => void
  switchProject: (id: string) => void
  newProject: (name: string) => void
  importProject: (jsonText: string) => void
  deleteProject: (id: string) => void

  addBoring: () => void
  updateBoring: (id: string, patch: Partial<Boring>) => void
  deleteBoring: (id: string) => void

  addStratum: (boringId: string) => void
  updateStratum: (boringId: string, stratumId: string, patch: Partial<Stratum>) => void
  deleteStratum: (boringId: string, stratumId: string) => void

  addSample: (boringId: string) => void
  updateSample: (boringId: string, sampleId: string, patch: Partial<Sample>) => void
  deleteSample: (boringId: string, sampleId: string) => void

  addSubNote: (boringId: string) => void
  updateSubNote: (boringId: string, noteId: string, patch: Partial<SubNote>) => void
  deleteSubNote: (boringId: string, noteId: string) => void

  addSieveChart: () => void
  updateSieveChart: (id: string, patch: Partial<SieveChart>) => void
  deleteSieveChart: (id: string) => void
  addSieveSample: (chartId: string) => void
  updateSieveSample: (chartId: string, sampleId: string, patch: Partial<SieveSample>) => void
  deleteSieveSample: (chartId: string, sampleId: string) => void
}

function initialProject(): Project {
  const index = loadIndex()
  if (index.length > 0) {
    const p = loadProject(index[0].id)
    if (p) return p
  }
  const seed = makeSeedProject()
  saveProject(seed)
  return seed
}

let saveTimer: ReturnType<typeof setTimeout> | undefined
function scheduleSave(project: Project) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveProject(project), 500)
}

export const useProjectStore = create<StoreState>((set, get) => {
  const mutateProject = (fn: (p: Project) => Project) => {
    const project = fn(get().project)
    scheduleSave(project)
    set({ project, index: mergeIndex(get().index, project) })
  }

  const mutateBoring = (id: string, fn: (b: Boring) => Boring) =>
    mutateProject((p) => ({
      ...p,
      borings: p.borings.map((b) => (b.id === id ? fn(b) : b)),
    }))

  const mutateSieveChart = (id: string, fn: (c: SieveChart) => SieveChart) =>
    mutateProject((p) => ({
      ...p,
      sieveCharts: p.sieveCharts.map((c) => (c.id === id ? fn(c) : c)),
    }))

  const project = initialProject()
  return {
    index: loadIndex(),
    project,
    selection: project.borings.length
      ? { kind: 'boring', id: project.borings[0].id }
      : { kind: 'project' },
    printMode: false,

    setSelection: (selection) => set({ selection }),
    setPrintMode: (printMode) => set({ printMode }),

    updateProject: (patch) => mutateProject((p) => ({ ...p, ...patch })),

    switchProject: (id) => {
      const p = loadProject(id)
      if (p) {
        set({
          project: p,
          selection: p.borings.length ? { kind: 'boring', id: p.borings[0].id } : { kind: 'project' },
          index: loadIndex(),
        })
      }
    },

    newProject: (name) => {
      const p = makeEmptyProject(name || 'New Project')
      saveProject(p)
      set({ project: p, selection: { kind: 'boring', id: p.borings[0].id }, index: loadIndex() })
    },

    importProject: (jsonText) => {
      const imported = parseProjectFile(jsonText)
      // Assign a fresh id if it collides with an existing project
      const exists = loadIndex().some((e) => e.id === imported.id)
      const p = exists ? { ...imported, id: nanoid() } : imported
      saveProject(p)
      set({
        project: p,
        selection: p.borings.length ? { kind: 'boring', id: p.borings[0].id } : { kind: 'project' },
        index: loadIndex(),
      })
    },

    deleteProject: (id) => {
      removeStored(id)
      const index = loadIndex()
      if (get().project.id === id) {
        const next = index.length ? loadProject(index[0].id) : null
        const p = next ?? makeSeedProject()
        if (!next) saveProject(p)
        set({
          project: p,
          selection: p.borings.length ? { kind: 'boring', id: p.borings[0].id } : { kind: 'project' },
          index: loadIndex(),
        })
      } else {
        set({ index })
      }
    },

    addBoring: () =>
      mutateProject((p) => {
        const b = makeEmptyBoring(String(p.borings.length + 1))
        set({ selection: { kind: 'boring', id: b.id } })
        return { ...p, borings: [...p.borings, b] }
      }),
    updateBoring: (id, patch) => mutateBoring(id, (b) => ({ ...b, ...patch })),
    deleteBoring: (id) =>
      mutateProject((p) => {
        const borings = p.borings.filter((b) => b.id !== id)
        const sel = get().selection
        if (sel.kind === 'boring' && sel.id === id) {
          set({ selection: borings.length ? { kind: 'boring', id: borings[0].id } : { kind: 'project' } })
        }
        return { ...p, borings }
      }),

    addStratum: (boringId) =>
      mutateBoring(boringId, (b) => {
        const last = b.strata[b.strata.length - 1]
        const top = last ? last.topDepthFt + 5 : 0
        return {
          ...b,
          strata: [...b.strata, { id: nanoid(), topDepthFt: top, description: '', uscs: 'ML' }],
        }
      }),
    updateStratum: (boringId, stratumId, patch) =>
      mutateBoring(boringId, (b) => ({
        ...b,
        strata: b.strata
          .map((s) => (s.id === stratumId ? { ...s, ...patch } : s))
          .sort((a, z) => a.topDepthFt - z.topDepthFt),
      })),
    deleteStratum: (boringId, stratumId) =>
      mutateBoring(boringId, (b) => ({ ...b, strata: b.strata.filter((s) => s.id !== stratumId) })),

    addSample: (boringId) =>
      mutateBoring(boringId, (b) => {
        const last = b.samples[b.samples.length - 1]
        return {
          ...b,
          samples: [
            ...b.samples,
            {
              id: nanoid(),
              number: String(b.samples.length + 1),
              depthFt: last ? last.depthFt + 2.5 : 1.5,
              rawBlows: '',
              nValue: '',
              seeLegend: b.samples.length === 0,
              labResults: '',
            },
          ],
        }
      }),
    updateSample: (boringId, sampleId, patch) =>
      mutateBoring(boringId, (b) => ({
        ...b,
        samples: b.samples
          .map((s) => (s.id === sampleId ? { ...s, ...patch } : s))
          .sort((a, z) => a.depthFt - z.depthFt),
      })),
    deleteSample: (boringId, sampleId) =>
      mutateBoring(boringId, (b) => ({ ...b, samples: b.samples.filter((s) => s.id !== sampleId) })),

    addSubNote: (boringId) =>
      mutateBoring(boringId, (b) => ({
        ...b,
        subNotes: [...b.subNotes, { id: nanoid(), depthFt: 0, text: '' }],
      })),
    updateSubNote: (boringId, noteId, patch) =>
      mutateBoring(boringId, (b) => ({
        ...b,
        subNotes: b.subNotes.map((n) => (n.id === noteId ? { ...n, ...patch } : n)),
      })),
    deleteSubNote: (boringId, noteId) =>
      mutateBoring(boringId, (b) => ({ ...b, subNotes: b.subNotes.filter((n) => n.id !== noteId) })),

    addSieveChart: () =>
      mutateProject((p) => {
        const c = makeEmptySieveChart(`Grain Size ${p.sieveCharts.length + 1}`)
        set({ selection: { kind: 'sieve', id: c.id } })
        return { ...p, sieveCharts: [...p.sieveCharts, c] }
      }),
    updateSieveChart: (id, patch) => mutateSieveChart(id, (c) => ({ ...c, ...patch })),
    deleteSieveChart: (id) =>
      mutateProject((p) => {
        const sieveCharts = p.sieveCharts.filter((c) => c.id !== id)
        const sel = get().selection
        if (sel.kind === 'sieve' && sel.id === id) {
          set({ selection: { kind: 'project' } })
        }
        return { ...p, sieveCharts }
      }),
    addSieveSample: (chartId) =>
      mutateSieveChart(chartId, (c) => {
        const shapes = ['circle', 'square', 'triangle', 'diamond'] as const
        return {
          ...c,
          samples: [
            ...c.samples,
            {
              id: nanoid(),
              label: '',
              depthFt: 0,
              classification: '',
              markerShape: shapes[c.samples.length % shapes.length],
              points: [],
            },
          ],
        }
      }),
    updateSieveSample: (chartId, sampleId, patch) =>
      mutateSieveChart(chartId, (c) => ({
        ...c,
        samples: c.samples.map((s) => (s.id === sampleId ? { ...s, ...patch } : s)),
      })),
    deleteSieveSample: (chartId, sampleId) =>
      mutateSieveChart(chartId, (c) => ({ ...c, samples: c.samples.filter((s) => s.id !== sampleId) })),
  }
})

function mergeIndex(index: ProjectIndexEntry[], project: Project): ProjectIndexEntry[] {
  const rest = index.filter((e) => e.id !== project.id)
  return [{ id: project.id, name: project.name, updatedAt: Date.now() }, ...rest]
}
