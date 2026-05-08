import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import { computeReticleRects } from './reticleRects'

/**
 * Rasterise the parametric reticle (centre + wings + ring) at base
 * magnification (×1) and return a deduped sparse list of lit pixel offsets
 * relative to the reticle centre. Used to one-way convert a parametric
 * reticle into its pixel-paint equivalent so the user can edit pixel-by-pixel.
 */
export function flattenReticleToPixels(scope: ScopeProfile, reticle: Reticle): Array<[number, number]> {
  const cx = Math.round(scope.displayResX / 2)
  const cy = Math.round(scope.displayResY / 2)
  const rects = computeReticleRects(scope, reticle, 1)
  const seen = new Set<string>()
  for (const r of rects) {
    for (let yi = 0; yi < r.h; yi++) {
      for (let xi = 0; xi < r.w; xi++) {
        const dx = r.x + xi - cx
        const dy = r.y + yi - cy
        seen.add(`${dx},${dy}`)
      }
    }
  }
  const out: Array<[number, number]> = []
  for (const k of seen) {
    const [dx, dy] = k.split(',').map(Number)
    out.push([dx, dy])
  }
  return out
}
