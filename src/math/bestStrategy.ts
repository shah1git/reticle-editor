import type { Reticle } from '../types/reticle'
import type { PixelsPerMrad } from './optics'
import type { RasterStrategy } from '../types/rasterization'
import { rasterize } from './rasterization'

export const strategyLabels: Record<RasterStrategy, string> = {
  independent: 'А: Независимое',
  fixed_step: 'Б: Фиксированный',
  bresenham: 'В: Брезенхем',
}

export interface BestStrategyInfo {
  best: RasterStrategy
  bestLabel: string
  bestMaxError: number
  currentMaxError: number
}

export function findBestStrategy(reticle: Reticle, ppm: PixelsPerMrad): BestStrategyInfo {
  const strategies: RasterStrategy[] = ['independent', 'fixed_step', 'bresenham']
  let bestStrategy: RasterStrategy = reticle.rasterization
  let bestMaxErr = Infinity

  for (const strategy of strategies) {
    let maxErr = 0
    for (const key of ['up', 'down', 'left', 'right'] as const) {
      const wing = reticle.wings[key]
      if (!wing.enabled || wing.length <= 0 || !wing.dots.enabled || wing.dots.spacing <= 0) continue
      const axisPpm = (key === 'up' || key === 'down') ? ppm.v : ppm.h
      const count = Math.floor(wing.length / wing.dots.spacing)
      if (count <= 0) continue
      const marks = rasterize(strategy, wing.dots.spacing, axisPpm, count)
      for (const m of marks) {
        const err = Math.abs(m.errorPx)
        if (err > maxErr) maxErr = err
      }
    }
    if (maxErr < bestMaxErr) {
      bestMaxErr = maxErr
      bestStrategy = strategy
    }
  }

  let currentMaxErr = 0
  for (const key of ['up', 'down', 'left', 'right'] as const) {
    const wing = reticle.wings[key]
    if (!wing.enabled || wing.length <= 0 || !wing.dots.enabled || wing.dots.spacing <= 0) continue
    const axisPpm = (key === 'up' || key === 'down') ? ppm.v : ppm.h
    const count = Math.floor(wing.length / wing.dots.spacing)
    if (count <= 0) continue
    const marks = rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count)
    for (const m of marks) {
      const err = Math.abs(m.errorPx)
      if (err > currentMaxErr) currentMaxErr = err
    }
  }

  return {
    best: bestStrategy,
    bestLabel: strategyLabels[bestStrategy],
    bestMaxError: bestMaxErr,
    currentMaxError: currentMaxErr,
  }
}
