import type { SievePoint, SieveSample, SieveDerived } from '../types'

// Grain-size math. All interpolation is linear in log10(particle size),
// matching how gradation curves are read off a semi-log plot.

const GRAVEL_MM = 4.75 // #4 sieve
const FINES_MM = 0.075 // #200 sieve

/** Sort points by descending particle size (largest sieve first). */
export function sortedPoints(points: SievePoint[]): SievePoint[] {
  return [...points]
    .filter((p) => p.sizeMm > 0 && isFinite(p.sizeMm) && isFinite(p.percentFiner))
    .sort((a, b) => b.sizeMm - a.sizeMm)
}

/** Percent finer at a given particle size, interpolated in log-size space. */
export function percentAt(points: SievePoint[], sizeMm: number): number | undefined {
  const pts = sortedPoints(points)
  if (pts.length === 0) return undefined
  if (sizeMm >= pts[0].sizeMm) return pts[0].percentFiner
  const last = pts[pts.length - 1]
  if (sizeMm <= last.sizeMm) return sizeMm === last.sizeMm ? last.percentFiner : undefined
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    if (sizeMm <= a.sizeMm && sizeMm >= b.sizeMm) {
      const t = (Math.log10(sizeMm) - Math.log10(a.sizeMm)) / (Math.log10(b.sizeMm) - Math.log10(a.sizeMm))
      return a.percentFiner + t * (b.percentFiner - a.percentFiner)
    }
  }
  return undefined
}

/** Particle size at a given percent finer (e.g. D60 = sizeAt(60)), or undefined if the curve never crosses it. */
export function sizeAt(points: SievePoint[], pct: number): number | undefined {
  const pts = sortedPoints(points)
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const lo = Math.min(a.percentFiner, b.percentFiner)
    const hi = Math.max(a.percentFiner, b.percentFiner)
    if (pct >= lo && pct <= hi && a.percentFiner !== b.percentFiner) {
      const t = (pct - a.percentFiner) / (b.percentFiner - a.percentFiner)
      const logSize = Math.log10(a.sizeMm) + t * (Math.log10(b.sizeMm) - Math.log10(a.sizeMm))
      return Math.pow(10, logSize)
    }
  }
  return undefined
}

function round(v: number, digits: number): number {
  const f = Math.pow(10, digits)
  return Math.round(v * f) / f
}

/** Round a D-value to 3 significant figures, matching the reference figures (37.5, 1.2, 0.176). */
export function roundD(v: number | undefined): number | undefined {
  if (v === undefined || v <= 0) return v
  const digits = 2 - Math.floor(Math.log10(v))
  return round(v, Math.max(0, digits))
}

/** Compute all derived gradation values for a sample, honoring manual overrides. */
export function deriveSieve(sample: Pick<SieveSample, 'points' | 'overrides'>): SieveDerived {
  const pts = sortedPoints(sample.points)
  const o = sample.overrides ?? {}

  const d100 = o.d100 ?? (pts.length ? pts[0].sizeMm : undefined)
  const d60 = o.d60 ?? roundD(sizeAt(pts, 60))
  const d30 = o.d30 ?? roundD(sizeAt(pts, 30))
  const d10 = o.d10 ?? roundD(sizeAt(pts, 10))

  let cu = o.cu
  let cc = o.cc
  if (cu === undefined && d60 !== undefined && d10 !== undefined && d10 > 0) {
    cu = round(d60 / d10, 1)
  }
  if (cc === undefined && d60 !== undefined && d30 !== undefined && d10 !== undefined && d10 > 0 && d60 > 0) {
    cc = round((d30 * d30) / (d10 * d60), 2)
  }

  const pctFinerGravel = percentAt(pts, GRAVEL_MM)
  const pctFinerFines = percentAt(pts, FINES_MM)
  const pctGravel = o.pctGravel ?? (pctFinerGravel !== undefined ? Math.round(100 - pctFinerGravel) : undefined)
  const pctFines = o.pctFines ?? (pctFinerFines !== undefined ? Math.round(pctFinerFines) : undefined)
  const pctSand =
    o.pctSand ?? (pctGravel !== undefined && pctFines !== undefined ? 100 - pctGravel - pctFines : undefined)

  return { d100, d60, d30, d10, cc, cu, pctGravel, pctSand, pctFines }
}

/** Plasticity index from LL/PL, when both exist. */
export function plasticityIndex(ll?: number, pl?: number): number | undefined {
  if (ll === undefined || pl === undefined) return undefined
  return ll - pl
}
