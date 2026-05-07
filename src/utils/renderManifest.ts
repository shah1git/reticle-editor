import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import { calcPixelsPerMrad } from '../math/optics'
import { computeReticleRects, rectsLitPixelCount, type ColoredRect } from './reticleRects'

export interface RenderManifest {
  schemaVersion: 1
  unit: 'firmware-pixel'
  canvas: { width: number; height: number; background: string }
  center: { x: number; y: number }
  magnifications: Record<string, MagnificationLayer>
}

export interface MagnificationLayer {
  pxPerMrad: { h: number; v: number }
  litPixelCount: number
  rects: ColoredRect[]
}

const MAG_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const

/**
 * Build a self-contained recipe an external tool (Python, JS, ImageMagick,
 * an LLM with code-interpreter, …) can blindly execute to produce the same
 * pixel-perfect reticle image we ship in BMP. Each magnification carries the
 * full ordered rectangle list — no math required at the consumer side.
 */
export function buildRenderManifest(scope: ScopeProfile, reticle: Reticle): RenderManifest {
  const basePpm = calcPixelsPerMrad(scope)
  const width = scope.displayResX
  const height = scope.displayResY

  const magnifications: Record<string, MagnificationLayer> = {}
  for (const k of MAG_LEVELS) {
    const rects = computeReticleRects(scope, reticle, k)
    magnifications[String(k)] = {
      pxPerMrad: { h: basePpm.h * k, v: basePpm.v * k },
      litPixelCount: rectsLitPixelCount(rects),
      rects,
    }
  }

  return {
    schemaVersion: 1,
    unit: 'firmware-pixel',
    canvas: { width, height, background: '#000000' },
    center: { x: Math.round(width / 2), y: Math.round(height / 2) },
    magnifications,
  }
}

/**
 * Plain-text instruction block embedded next to the manifest. Aimed at any
 * AI agent that opens this JSON and is asked to "produce the reticle image".
 */
export const RENDER_README = [
  'AI render guide (read this first).',
  '',
  'This JSON contains both editable parameters (`scopeProfile`, `reticle`) and',
  'a precomputed `renderManifest` describing the firmware-pixel image. To',
  'produce a faithful reticle image for any magnification k in 1..8:',
  '',
  '  1. Allocate a canvas of `renderManifest.canvas.width` ×',
  '     `renderManifest.canvas.height` pixels and fill it with',
  '     `renderManifest.canvas.background` (black).',
  '  2. Pick the layer: `layer = renderManifest.magnifications[String(k)]`.',
  '  3. For each rect in `layer.rects` paint a solid axis-aligned rectangle:',
  '     fillRect(rect.x, rect.y, rect.w, rect.h) using `rect.color`.',
  '     x/y are top-left corners; w/h are width/height in firmware pixels.',
  '  4. (Optional) Verify: count pixels whose colour differs from the',
  '     background — it must equal `layer.litPixelCount`.',
  '',
  'Do NOT recompute positions from `scopeProfile` / `reticle` parameters; the',
  'manifest is the single source of truth for the rendered image. The',
  'parameters are kept only so the editor app can reload and re-edit the',
  'reticle. If you regenerate, your output may drift from the firmware image.',
  '',
  'Coordinate system: origin at top-left, x grows right, y grows down. Each',
  'rect is in display-pixel units, already accounting for the magnification.',
  'Marks may extend past the canvas edges at high magnifications — clip them.',
].join('\n')
