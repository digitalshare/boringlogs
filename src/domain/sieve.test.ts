import { describe, it, expect } from 'vitest'
import { deriveSieve, percentAt, sizeAt } from './sieve'
import { parseBlows, suggestNValue } from './spt'

// Curve traced from Fig 11 (Tan Well-graded SAND (SW-SM) with Silt and Gravel).
// Published results: D100=37.5, D60=1.2, D30=0.58, D10=0.176, Cu=7.0, Cc=1.58,
// %Gravel=16, %Sand=78, %Silt&Clay=6.
const FIG11_POINTS = [
  { sizeMm: 37.5, percentFiner: 100 },
  { sizeMm: 25, percentFiner: 96 },
  { sizeMm: 19, percentFiner: 90 },
  { sizeMm: 12.5, percentFiner: 87 },
  { sizeMm: 9.5, percentFiner: 86 },
  { sizeMm: 4.75, percentFiner: 84 },
  { sizeMm: 2.0, percentFiner: 80 },
  { sizeMm: 1.2, percentFiner: 60 },
  { sizeMm: 0.85, percentFiner: 50 },
  { sizeMm: 0.58, percentFiner: 30 },
  { sizeMm: 0.425, percentFiner: 17 },
  { sizeMm: 0.176, percentFiner: 10 },
  { sizeMm: 0.15, percentFiner: 9 },
  { sizeMm: 0.075, percentFiner: 6 },
]

// Fig 10 (Gray Silty Coral SAND (SM)): curve bottoms at 14% so D10 never exists.
const FIG10_POINTS = [
  { sizeMm: 25, percentFiner: 100 },
  { sizeMm: 19, percentFiner: 97 },
  { sizeMm: 9.5, percentFiner: 95 },
  { sizeMm: 4.75, percentFiner: 90 },
  { sizeMm: 2.0, percentFiner: 84 },
  { sizeMm: 0.85, percentFiner: 66 },
  { sizeMm: 0.425, percentFiner: 42 },
  { sizeMm: 0.15, percentFiner: 24 },
  { sizeMm: 0.075, percentFiner: 14 },
]

describe('sieve derivations (Fig 11 reference values)', () => {
  const d = deriveSieve({ points: FIG11_POINTS })

  it('computes D100 as the largest particle size', () => {
    expect(d.d100).toBe(37.5)
  })
  it('computes D60 ≈ 1.2', () => {
    expect(d.d60).toBeCloseTo(1.2, 1)
  })
  it('computes D30 ≈ 0.58', () => {
    expect(d.d30).toBeCloseTo(0.58, 1)
  })
  it('computes D10 ≈ 0.176', () => {
    expect(d.d10).toBeCloseTo(0.176, 1)
  })
  it('computes Cu ≈ 7.0', () => {
    expect(d.cu).toBeGreaterThan(6)
    expect(d.cu).toBeLessThan(8)
  })
  it('computes Cc ≈ 1.58', () => {
    expect(d.cc).toBeGreaterThan(1.3)
    expect(d.cc).toBeLessThan(1.9)
  })
  it('computes gravel/sand/fines fractions 16/78/6', () => {
    expect(d.pctGravel).toBe(16)
    expect(d.pctSand).toBe(78)
    expect(d.pctFines).toBe(6)
  })
})

describe('sieve derivations when curve never reaches 10% (Fig 10)', () => {
  const d = deriveSieve({ points: FIG10_POINTS })

  it('leaves D10, Cu, Cc undefined instead of NaN', () => {
    expect(d.d10).toBeUndefined()
    expect(d.cu).toBeUndefined()
    expect(d.cc).toBeUndefined()
  })
  it('still computes fractions (10/76/14)', () => {
    expect(d.pctGravel).toBe(10)
    expect(d.pctSand).toBe(76)
    expect(d.pctFines).toBe(14)
  })
  it('honors manual overrides', () => {
    const o = deriveSieve({ points: FIG10_POINTS, overrides: { d10: 0.05, pctSand: 75 } })
    expect(o.d10).toBe(0.05)
    expect(o.pctSand).toBe(75)
  })
})

describe('interpolation primitives', () => {
  it('percentAt interpolates in log space', () => {
    const pts = [
      { sizeMm: 10, percentFiner: 100 },
      { sizeMm: 0.1, percentFiner: 0 },
    ]
    expect(percentAt(pts, 1)).toBeCloseTo(50, 5)
  })
  it('sizeAt inverts percentAt', () => {
    const pts = [
      { sizeMm: 10, percentFiner: 100 },
      { sizeMm: 0.1, percentFiner: 0 },
    ]
    expect(sizeAt(pts, 50)).toBeCloseTo(1, 5)
  })
  it('returns undefined outside the curve', () => {
    const pts = [
      { sizeMm: 10, percentFiner: 100 },
      { sizeMm: 1, percentFiner: 40 },
    ]
    expect(sizeAt(pts, 10)).toBeUndefined()
    expect(percentAt(pts, 0.5)).toBeUndefined()
  })
})

describe('SPT blow parsing', () => {
  it('parses plain numbers', () => {
    expect(parseBlows('42')).toEqual({ kind: 'number', blows: 42 })
  })
  it('parses partial penetration', () => {
    expect(parseBlows('75/9"')).toEqual({ kind: 'partial', blows: 75, inches: '9"' })
  })
  it('parses refusal', () => {
    expect(parseBlows('R').kind).toBe('refusal')
  })
  it('suggests converted N values preserving notation', () => {
    expect(suggestNValue('42', 0.69)).toBe('29')
    expect(suggestNValue('75/9"', 0.68)).toBe('51/9"')
    expect(suggestNValue('R')).toBe('')
    expect(suggestNValue('')).toBe('')
  })
})
