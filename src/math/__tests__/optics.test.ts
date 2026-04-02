import { describe, it, expect } from 'vitest'
import { calcPixelsPerMrad, getFovMrad, snapToPixel, isSquarePixelRatio } from '../optics'
import type { ScopeProfile } from '../../types/scope'

const digitalScope: ScopeProfile = {
  type: 'digital',
  name: 'Test Thermal',
  lensFL: 35,
  sensorResX: 384,
  sensorResY: 288,
  displayResX: 1024,
  displayResY: 768,
  pixelPitch: 12,
  fovDegrees: 7.5,
  tubeDiameter: 30,
}

const opticalScope: ScopeProfile = {
  type: 'optical',
  name: 'Test Optical',
  lensFL: 35,
  sensorResX: 384,
  sensorResY: 288,
  displayResX: 1024,
  displayResY: 768,
  pixelPitch: 12,
  fovDegrees: 7.5,
  tubeDiameter: 30,
}

describe('calcPixelsPerMrad', () => {
  it('calculates correctly for digital scope', () => {
    const ppm = calcPixelsPerMrad(digitalScope)
    // mm_per_100m_h = (384/1024) * 12 * 100 / 35 = 0.375 * 12 * 100 / 35 = 12.857...
    // ppm_h = 100 / 12.857 = 7.777...
    expect(ppm.h).toBeCloseTo(7.778, 2)
    // mm_per_100m_v = (288/768) * 12 * 100 / 35 = 0.375 * 12 * 100 / 35 = 12.857...
    expect(ppm.v).toBeCloseTo(7.778, 2)
  })

  it('digital scope with square sensor/display has square pixels', () => {
    const ppm = calcPixelsPerMrad(digitalScope)
    // Both ratios are 384/1024 = 288/768 = 0.375 → square
    expect(isSquarePixelRatio(ppm)).toBe(true)
  })

  it('digital scope with non-square ratio', () => {
    const ns: ScopeProfile = {
      ...digitalScope,
      sensorResX: 640,
      sensorResY: 480,
      displayResX: 1024,
      displayResY: 768,
    }
    const ppm = calcPixelsPerMrad(ns)
    // 640/1024 = 0.625, 480/768 = 0.625 → still square in this case
    expect(isSquarePixelRatio(ppm)).toBe(true)
  })

  it('detects non-square pixels', () => {
    const ns: ScopeProfile = {
      ...digitalScope,
      sensorResX: 640,
      sensorResY: 480,
      displayResX: 1024,
      displayResY: 600,
    }
    const ppm = calcPixelsPerMrad(ns)
    // 640/1024 = 0.625, 480/600 = 0.8 → not square
    expect(isSquarePixelRatio(ppm)).toBe(false)
  })

  it('calculates correctly for optical scope', () => {
    const ppm = calcPixelsPerMrad(opticalScope)
    const expectedFovMrad = 7.5 * 17.4533
    const expectedPpm = 1024 / expectedFovMrad
    expect(ppm.h).toBeCloseTo(expectedPpm, 2)
    expect(ppm.v).toBeCloseTo(expectedPpm, 2)
  })
})

describe('getFovMrad', () => {
  it('returns correct FOV for digital scope', () => {
    const fov = getFovMrad(digitalScope)
    const ppm = calcPixelsPerMrad(digitalScope)
    expect(fov.h).toBeCloseTo(digitalScope.displayResX / ppm.h, 2)
    expect(fov.v).toBeCloseTo(digitalScope.displayResY / ppm.v, 2)
  })

  it('returns correct FOV for optical scope', () => {
    const fov = getFovMrad(opticalScope)
    expect(fov.h).toBeCloseTo(7.5 * 17.4533, 2)
  })
})

describe('snapToPixel', () => {
  it('snaps to nearest whole pixel', () => {
    const ppm = 7.778
    const snapped = snapToPixel(0.15, ppm)
    const px = Math.round(0.15 * ppm)
    expect(snapped * ppm).toBeCloseTo(px, 5)
  })

  it('returns same value if already at whole pixel', () => {
    const ppm = 10
    const snapped = snapToPixel(0.5, ppm)
    expect(snapped).toBeCloseTo(0.5, 5)
    expect(snapped * ppm).toBe(5)
  })

  it('handles zero ppm gracefully', () => {
    expect(snapToPixel(0.15, 0)).toBe(0.15)
  })
})
