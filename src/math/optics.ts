import type { ScopeProfile } from '../types/scope'

export interface PixelsPerMrad {
  h: number
  v: number
}

/** Calculate pixels-per-MRAD for a given scope profile */
export function calcPixelsPerMrad(scope: ScopeProfile): PixelsPerMrad {
  if (scope.type === 'digital') {
    // mm_per_100m = (sensorRes / displayRes) * pixelPitch_μm * 100 / lensFL_mm
    // pixels_per_mrad = 100 / mm_per_100m
    const mmPer100mH = (scope.sensorResX / scope.displayResX) * scope.pixelPitch * 100 / scope.lensFL
    const mmPer100mV = (scope.sensorResY / scope.displayResY) * scope.pixelPitch * 100 / scope.lensFL
    return {
      h: 100 / mmPer100mH,
      v: 100 / mmPer100mV,
    }
  }
  // Optical
  const fovMrad = scope.fovDegrees * 17.4533
  const ppm = scope.displayResX / fovMrad
  return { h: ppm, v: ppm }
}

/** Get field of view in MRAD */
export function getFovMrad(scope: ScopeProfile): { h: number; v: number } {
  if (scope.type === 'optical') {
    const fovH = scope.fovDegrees * 17.4533
    // Assume square pixels for optical, derive vertical from aspect ratio
    const aspect = scope.displayResY / scope.displayResX
    return { h: fovH, v: fovH * aspect }
  }
  const ppm = calcPixelsPerMrad(scope)
  return {
    h: scope.displayResX / ppm.h,
    v: scope.displayResY / ppm.v,
  }
}

/** Snap a MRAD value so that it maps to a whole number of pixels */
export function snapToPixel(mradValue: number, pxPerMrad: number): number {
  if (pxPerMrad <= 0) return mradValue
  const px = Math.round(mradValue * pxPerMrad)
  return px / pxPerMrad
}

/** Check if pixel ratio is square (h ≈ v within 0.1%) */
export function isSquarePixelRatio(ppm: PixelsPerMrad): boolean {
  return Math.abs(ppm.h - ppm.v) / Math.max(ppm.h, ppm.v) < 0.001
}
