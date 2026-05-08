import type { CenterMarkKind, WingDotKind } from '../types/reticle'

/**
 * A single firmware-image-pixel rectangle. All values are in **firmware
 * image-pixel units**. Renderers multiply by the active screen-pixel scale
 * and add the on-screen anchor to produce the final SVG/canvas geometry.
 *
 * Coordinates are relative to a per-shape anchor:
 *   - Center mark: anchored at the reticle center (0,0).
 *   - Wing dot: anchored at the rasterized mark position on the wing axis.
 *
 * For each pixel: x,y is the top-left corner; w,h are the size (w=h=1 means
 * a single firmware pixel).
 */
export interface PixelRect {
  x: number
  y: number
  w: number
  h: number
}

/** Total number of firmware pixels covered by a list of pixel rectangles. */
export function pixelCount(rects: PixelRect[]): number {
  let total = 0
  for (const r of rects) total += r.w * r.h
  return total
}

/** Pixel rectangles for the center mark, anchored at the reticle center. */
export function centerMarkPixels(kind: CenterMarkKind): PixelRect[] {
  switch (kind) {
    case 'square4':
      // 4×4 block centered on (0,0). Top-left at (-2,-2).
      return [{ x: -2, y: -2, w: 4, h: 4 }]
    case 'square2':
      // 2×2 block centered on (0,0). Top-left at (-1,-1).
      return [{ x: -1, y: -1, w: 2, h: 2 }]
    case 'pixelBR':
      // Single pixel in the bottom-right quadrant of the corner anchor.
      return [{ x: 0, y: 0, w: 1, h: 1 }]
    case 'pixelTL':
      // Single pixel in the top-left quadrant of the corner anchor.
      return [{ x: -1, y: -1, w: 1, h: 1 }]
  }
}

/** The maximum perpendicular extent of a center mark from the axis (in fw-px). */
export function centerMarkHalfExtent(kind: CenterMarkKind): number {
  switch (kind) {
    case 'square4':
      return 2
    case 'square2':
      return 1
    case 'pixelBR':
    case 'pixelTL':
      // 1×1 marks live in one quadrant only, but we still reserve a 1-px gap
      // on every side so the wing dots never overlap the centre pixel.
      return 1
  }
}

/**
 * Pixel rectangles for a wing dot. `axisAlong` is the wing direction:
 *   - 'h' for horizontal wings (left/right) — line lies along X axis.
 *   - 'v' for vertical wings (up/down) — line lies along Y axis.
 *
 * Returned rectangles are anchored at the mark's position on the axis.
 * Marks describe themselves only; they don't try to coordinate with the
 * wing line — that's a separate component painted independently. Any
 * visual overlap simply uses the mark colour because marks are drawn
 * after the line.
 */
export function wingDotPixels(kind: WingDotKind, axisAlong: 'h' | 'v'): PixelRect[] {
  switch (kind) {
    case 'pair': {
      // Two adjacent firmware pixels — flush to each other, no gap.
      // The mark anchor is the bottom-right pixel; the partner sits one
      // pixel earlier along the perpendicular direction.
      if (axisAlong === 'h') {
        // Horizontal wing — pair runs vertically across the axis row.
        return [{ x: 0, y: -1, w: 1, h: 2 }]
      }
      // Vertical wing — pair runs horizontally across the axis column.
      return [{ x: -1, y: 0, w: 2, h: 1 }]
    }
    case 'single':
      // Single firmware pixel sitting just below-right of the corner anchor.
      // Same quadrant as the bottom-right pixel of `pair`, so single dots
      // line up with the inner edge of pair dots.
      return [{ x: 0, y: 0, w: 1, h: 1 }]
  }
}
