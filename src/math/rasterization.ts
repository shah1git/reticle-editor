import type { RasterMark, RasterStrategy } from '../types/rasterization'
import type { Wing } from '../types/reticle'

/**
 * Effective dot count for a wing.
 * Returns 0 if the wing or its dots are disabled / unconfigured.
 * If wing.dots.maxDots > 0, the count is clamped to that cap.
 */
export function effectiveDotCount(wing: Wing): number {
  if (!wing.enabled || wing.length <= 0) return 0
  if (!wing.dots.enabled || wing.dots.spacing <= 0) return 0
  const natural = Math.floor(wing.length / wing.dots.spacing)
  const cap = wing.dots.maxDots
  if (cap && cap > 0) return Math.min(natural, cap)
  return natural
}

/**
 * Strategy A: Independent rounding
 * Each mark positioned independently: actualPx = round(index × spacing × ppm)
 * Max accuracy per mark (error ≤ 0.5px), but steps between marks may differ ±1px
 */
export function rasterizeIndependent(
  spacingMrad: number,
  pxPerMrad: number,
  count: number,
): RasterMark[] {
  const marks: RasterMark[] = []
  for (let i = 1; i <= count; i++) {
    const targetMrad = i * spacingMrad
    const targetPx = targetMrad * pxPerMrad
    const actualPx = Math.round(targetPx)
    const actualMrad = actualPx / pxPerMrad
    const prevActualPx = i === 1 ? 0 : marks[i - 2].actualPx
    marks.push({
      index: i,
      targetMrad,
      targetPx,
      actualPx,
      actualMrad,
      errorMrad: actualMrad - targetMrad,
      errorPx: actualPx - targetPx,
      stepPx: actualPx - prevActualPx,
    })
  }
  return marks
}

/**
 * Strategy B: Fixed pixel step
 * Step is fixed: stepPx = round(spacing × ppm), all marks equidistant
 * Easy to document, but error accumulates
 */
export function rasterizeFixedStep(
  spacingMrad: number,
  pxPerMrad: number,
  count: number,
): RasterMark[] {
  const stepPx = Math.round(spacingMrad * pxPerMrad)
  const marks: RasterMark[] = []
  for (let i = 1; i <= count; i++) {
    const targetMrad = i * spacingMrad
    const targetPx = targetMrad * pxPerMrad
    const actualPx = i * stepPx
    const actualMrad = actualPx / pxPerMrad
    marks.push({
      index: i,
      targetMrad,
      targetPx,
      actualPx,
      actualMrad,
      errorMrad: actualMrad - targetMrad,
      errorPx: actualPx - targetPx,
      stepPx,
    })
  }
  return marks
}

/** Dispatch to the right rasterization function */
export function rasterize(
  strategy: RasterStrategy,
  spacingMrad: number,
  pxPerMrad: number,
  count: number,
): RasterMark[] {
  switch (strategy) {
    case 'independent': return rasterizeIndependent(spacingMrad, pxPerMrad, count)
    case 'fixed_step': return rasterizeFixedStep(spacingMrad, pxPerMrad, count)
  }
}
