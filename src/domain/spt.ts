// SPT blow-count helpers.
//
// The BLOWS PER FT. column shows the raw field value with a converted N-value
// in parentheses beneath it, e.g.  42 / (29).  Refusal-style values keep their
// notation: "75/9\"" -> "(51/9\")", and a bare "R" has no converted value.
// The conversion ratio in the reference logs is not one constant, so the
// converted value is only *suggested* here and stays editable per sample.

const DEFAULT_ENERGY_RATIO = 0.68 // typical automatic-hammer correction to N60

export interface ParsedBlows {
  kind: 'number' | 'partial' | 'refusal' | 'empty'
  blows?: number
  inches?: string // the '/9"' tail for partial-penetration values
}

export function parseBlows(raw: string): ParsedBlows {
  const s = raw.trim()
  if (!s) return { kind: 'empty' }
  if (/^r$/i.test(s)) return { kind: 'refusal' }
  const partial = s.match(/^(\d+)\s*\/\s*(\d+(?:\.\d+)?)"?$/)
  if (partial) return { kind: 'partial', blows: Number(partial[1]), inches: `${partial[2]}"` }
  const num = s.match(/^(\d+(?:\.\d+)?)$/)
  if (num) return { kind: 'number', blows: Number(num[1]) }
  return { kind: 'empty' }
}

/** Suggest the converted N-value text for a raw blows string ("" when none applies). */
export function suggestNValue(raw: string, ratio: number = DEFAULT_ENERGY_RATIO): string {
  const p = parseBlows(raw)
  if (p.kind === 'number' && p.blows !== undefined) {
    return String(Math.round(p.blows * ratio))
  }
  if (p.kind === 'partial' && p.blows !== undefined) {
    return `${Math.round(p.blows * ratio)}/${p.inches}`
  }
  return ''
}
