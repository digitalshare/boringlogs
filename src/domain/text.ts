// Word-wrap helper for SVG <text>. Uses canvas measureText when available
// (browser); falls back to a character-width estimate (tests / SSR).

let ctx: CanvasRenderingContext2D | null = null

function measure(text: string, font: string): number {
  if (typeof document !== 'undefined') {
    if (!ctx) {
      const canvas = document.createElement('canvas')
      ctx = canvas.getContext('2d')
    }
    if (ctx) {
      ctx.font = font
      return ctx.measureText(text).width
    }
  }
  // crude fallback: average char width ~0.55em
  const sizeMatch = font.match(/(\d+(?:\.\d+)?)px/)
  const size = sizeMatch ? Number(sizeMatch[1]) : 10
  return text.length * size * 0.55
}

/** Wrap text into lines that fit maxWidth for the given CSS font. Honors embedded newlines. */
export function wrapText(text: string, maxWidth: number, font: string): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      out.push('')
      continue
    }
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (line && measure(candidate, font) > maxWidth) {
        out.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    if (line) out.push(line)
  }
  return out
}
