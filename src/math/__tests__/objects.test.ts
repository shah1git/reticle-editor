import { describe, it, expect } from 'vitest'
import { objectAngularSize, TEST_OBJECTS } from '../objects'

describe('objectAngularSize', () => {
  it('1.8m human at 100m = 18 MRAD', () => {
    expect(objectAngularSize(1.8, 100)).toBeCloseTo(18, 5)
  })

  it('1m target at 1000m = 1 MRAD', () => {
    expect(objectAngularSize(1.0, 1000)).toBeCloseTo(1.0, 5)
  })

  it('returns 0 for zero distance', () => {
    expect(objectAngularSize(1.0, 0)).toBe(0)
  })

  it('returns 0 for negative distance', () => {
    expect(objectAngularSize(1.0, -100)).toBe(0)
  })

  it('TEST_OBJECTS has 4 entries', () => {
    expect(TEST_OBJECTS).toHaveLength(4)
  })
})
