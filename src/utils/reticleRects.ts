import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import type { RasterMark } from '../types/rasterization'
import { calcPixelsPerMrad } from '../math/optics'
import { rasterize, effectiveDotCount } from '../math/rasterization'
import { centerMarkPixels, centerMarkHalfExtent, wingDotPixels } from '../math/shapes'

/**
 * A coloured pixel rectangle in display-pixel coordinates, ready to be
 * blitted as `fillRect(x, y, w, h)` over a black canvas of the scope's
 * native display size. Identical for BMP/PNG export and the JSON manifest —
 * if these diverge, the firmware image will not match the JSON.
 */
export interface ColoredRect {
  x: number
  y: number
  w: number
  h: number
  color: string
  role: string
  errorPx?: number
}

export interface RectOptions {
  /**
   * Per-mark colour resolver. Default returns `reticle.color` (single colour,
   * matches BMP/firmware output). PNG passes an error-aware colourizer so
   * marks farther from the ideal position render in a warning hue.
   */
  markColor?: (mark: RasterMark) => string
}

const DIRS = ['up', 'down', 'left', 'right'] as const

/**
 * Build the full list of pixel rectangles that make up a reticle for the
 * given scope at the given digital magnification. The display canvas is
 * assumed to be `scope.displayResX × scope.displayResY` with origin at
 * top-left and the reticle anchored at the rounded centre.
 */
export function computeReticleRects(
  scope: ScopeProfile,
  reticle: Reticle,
  magnification: number,
  options: RectOptions = {},
): ColoredRect[] {
  const basePpm = calcPixelsPerMrad(scope)
  const ppm = { h: basePpm.h * magnification, v: basePpm.v * magnification }

  const cx = Math.round(scope.displayResX / 2)
  const cy = Math.round(scope.displayResY / 2)
  const color = reticle.color
  const colorize = options.markColor

  const out: ColoredRect[] = []

  for (const p of centerMarkPixels(reticle.centerDot.kind)) {
    out.push({
      x: cx + p.x,
      y: cy + p.y,
      w: p.w,
      h: p.h,
      color,
      role: 'center',
    })
  }

  const gapPxBase = centerMarkHalfExtent(reticle.centerDot.kind)

  for (const dir of DIRS) {
    const wing = reticle.wings[dir]
    const count = effectiveDotCount(wing)
    if (count <= 0) continue

    const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
    const dy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0
    const axisPpm = dy !== 0 ? ppm.v : ppm.h
    const axisAlong: 'h' | 'v' = (dx !== 0) ? 'h' : 'v'

    const marks = rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count)
    const dotPx = wingDotPixels(wing.dots.kind, axisAlong)

    for (const mark of marks) {
      const posPx = gapPxBase + mark.actualPx
      const dotX = cx + posPx * dx
      const dotY = cy + posPx * dy
      const markColor = colorize ? colorize(mark) : color
      for (const p of dotPx) {
        out.push({
          x: dotX + p.x,
          y: dotY + p.y,
          w: p.w,
          h: p.h,
          color: markColor,
          role: `wing.${dir}.mark${mark.index}`,
          errorPx: mark.errorPx,
        })
      }
    }
  }

  return out
}

/** Total lit pixels in the rect list — useful as a verification checksum. */
export function rectsLitPixelCount(rects: ColoredRect[]): number {
  let n = 0
  for (const r of rects) n += r.w * r.h
  return n
}
