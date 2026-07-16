import { SCHEMA_VERSION, type Project, type ProjectFile } from '../types'

const INDEX_KEY = 'bl:index'
const PROJECT_PREFIX = 'bl:project:'

export interface ProjectIndexEntry {
  id: string
  name: string
  updatedAt: number
}

export function loadIndex(): ProjectIndexEntry[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    return raw ? (JSON.parse(raw) as ProjectIndexEntry[]) : []
  } catch {
    return []
  }
}

function saveIndex(index: ProjectIndexEntry[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index))
}

export function saveProject(project: Project) {
  try {
    const file: ProjectFile = { schemaVersion: SCHEMA_VERSION, project }
    localStorage.setItem(PROJECT_PREFIX + project.id, JSON.stringify(file))
    const index = loadIndex().filter((e) => e.id !== project.id)
    index.unshift({ id: project.id, name: project.name, updatedAt: Date.now() })
    saveIndex(index)
  } catch (e) {
    console.warn('autosave failed', e)
  }
}

export function loadProject(id: string): Project | null {
  try {
    const raw = localStorage.getItem(PROJECT_PREFIX + id)
    if (!raw) return null
    return migrate(JSON.parse(raw) as ProjectFile)
  } catch {
    return null
  }
}

export function deleteProject(id: string) {
  localStorage.removeItem(PROJECT_PREFIX + id)
  saveIndex(loadIndex().filter((e) => e.id !== id))
}

/** Migration chain for older schema versions. */
export function migrate(file: ProjectFile): Project {
  if (typeof file !== 'object' || file === null || !file.project) {
    throw new Error('Not a boring-logs project file')
  }
  if (file.schemaVersion > SCHEMA_VERSION) {
    throw new Error(`Project file schema v${file.schemaVersion} is newer than this app supports (v${SCHEMA_VERSION})`)
  }
  // v1 is current; add stepwise migrations here as the schema evolves.
  return file.project
}

export function exportProject(project: Project) {
  const file: ProjectFile = { schemaVersion: SCHEMA_VERSION, project }
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const base = project.fileNumber || project.name || 'project'
  a.download = `${base.replace(/[^\w.-]+/g, '_')}.boringlogs.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseProjectFile(text: string): Project {
  return migrate(JSON.parse(text) as ProjectFile)
}
