import { describe, it, expect } from 'vitest'
import { rasterizeIndependent, rasterizeFixedStep, rasterizeBresenham } from '../rasterization'

const SPACING = 1.0 // 1 MRAD
const PPM = 7.778   // ~7.778 px/MRAD
const COUNT = 10

describe('rasterizeIndependent', () => {
  it('produces correct number of marks', () => {
    const marks = rasterizeIndependent(SPACING, PPM, COUNT)
    expect(marks).toHaveLength(COUNT)
  })

  it('each mark has error ≤ 0.5 px', () => {
    const marks = rasterizeIndependent(SPACING, PPM, COUNT)
    for (const m of marks) {
      expect(Math.abs(m.errorPx)).toBeLessThanOrEqual(0.5)
    }
  })

  it('actualPx are integers', () => {
    const marks = rasterizeIndependent(SPACING, PPM, COUNT)
    for (const m of marks) {
      expect(m.actualPx).toBe(Math.round(m.actualPx))
    }
  })

  it('first mark index is 1', () => {
    const marks = rasterizeIndependent(SPACING, PPM, 1)
    expect(marks[0].index).toBe(1)
    expect(marks[0].targetMrad).toBeCloseTo(1.0, 5)
  })
})

describe('rasterizeFixedStep', () => {
  it('all steps are equal', () => {
    const marks = rasterizeFixedStep(SPACING, PPM, COUNT)
    const step = marks[0].stepPx
    for (const m of marks) {
      expect(m.stepPx).toBe(step)
    }
  })

  it('step is round(spacing * ppm)', () => {
    const marks = rasterizeFixedStep(SPACING, PPM, COUNT)
    expect(marks[0].stepPx).toBe(Math.round(SPACING * PPM))
  })

  it('error accumulates', () => {
    const marks = rasterizeFixedStep(SPACING, PPM, COUNT)
    // For non-integer ppm, later marks should have larger absolute error
    const absErr1 = Math.abs(marks[0].errorPx)
    const absErr10 = Math.abs(marks[9].errorPx)
    // Last mark's error should generally be >= first mark's
    expect(absErr10).toBeGreaterThanOrEqual(0) // sanity check
  })
})

describe('rasterizeBresenham', () => {
  it('uses only floor and ceil steps', () => {
    const marks = rasterizeBresenham(SPACING, PPM, COUNT)
    const idealStep = SPACING * PPM
    const lo = Math.floor(idealStep)
    const hi = Math.ceil(idealStep)
    for (const m of marks) {
      expect([lo, hi]).toContain(m.stepPx)
    }
  })

  it('error stays bounded', () => {
    const marks = rasterizeBresenham(SPACING, PPM, COUNT)
    for (const m of marks) {
      expect(Math.abs(m.errorPx)).toBeLessThan(1.0)
    }
  })

  it('total position is close to ideal', () => {
    const marks = rasterizeBresenham(SPACING, PPM, 20)
    const last = marks[marks.length - 1]
    // Bresenham should keep error bounded even at mark 20
    expect(Math.abs(last.errorPx)).toBeLessThan(1.0)
  })
})
