import type { RasterStrategy } from '../types/rasterization'

/**
 * Translation-key map for rasterization strategies. Single source of truth —
 * import this instead of redefining the same `{ independent, fixed_step }`
 * → key map in each component that needs to render a strategy label.
 */
export const STRATEGY_TRANS_KEYS: Record<RasterStrategy, string> = {
  independent: 'strategies.independent',
  fixed_step: 'strategies.fixedStep',
}
