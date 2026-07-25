import type { Boring } from '../types'

/** "Depth to Water" header text, e.g. "7.2' (3-9-26, 10:34am)" or "None Encountered". */
export function waterText(b: Boring): string {
  const when = b.water.date || b.water.time ? ` (${[b.water.date, b.water.time].filter(Boolean).join(', ')})` : ''
  if (!b.water.encountered) return `None Encountered${when}`
  const depth = b.water.depthFt !== undefined ? `${b.water.depthFt}'` : ''
  return `${depth}${when}`
}
