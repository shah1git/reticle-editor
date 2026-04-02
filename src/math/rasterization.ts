import type { RasterMark, RasterStrategy } from '../types/rasterization'

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

/**
 * Strategy C: Bresenham
 * Alternates floor/ceil steps distributed evenly (like Bresenham line algorithm)
 * Error doesn't accumulate, visually smoothest result
 */
export function rasterizeBresenham(
  spacingMrad: number,
  pxPerMrad: number,
  count: number,
): RasterMark[] {
  const idealStep = spacingMrad * pxPerMrad
  const shortStep = Math.floor(idealStep)
  const longStep = Math.ceil(idealStep)
  const marks: RasterMark[] = []
  let accumPx = 0
  let error = 0

  for (let i = 1; i <= count; i++) {
    const targetMrad = i * spacingMrad
    const targetPx = targetMrad * pxPerMrad
    // Bresenham-style: accumulate fractional part
    error += idealStep - shortStep
    let step: number
    if (error >= 0.5) {
      step = longStep
      error -= 1
    } else {
      step = shortStep
    }
    accumPx += step
    const actualMrad = accumPx / pxPerMrad
    marks.push({
      index: i,
      targetMrad,
      targetPx,
      actualPx: accumPx,
      actualMrad,
      errorMrad: actualMrad - targetMrad,
      errorPx: accumPx - targetPx,
      stepPx: step,
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
    case 'bresenham': return rasterizeBresenham(spacingMrad, pxPerMrad, count)
  }
}
