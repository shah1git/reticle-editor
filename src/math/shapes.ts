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

/** Pixel rectangles for the center mark, anchored at the reticle center. */
export function centerMarkPixels(kind: CenterMarkKind): PixelRect[] {
  switch (kind) {
    case 'square4':
      // 4×4 block centered on (0,0). Top-left at (-2,-2).
      return [{ x: -2, y: -2, w: 4, h: 4 }]
  }
}

/** The maximum perpendicular extent of a center mark from the axis (in fw-px). */
export function centerMarkHalfExtent(kind: CenterMarkKind): number {
  switch (kind) {
    case 'square4':
      return 2
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
      if (axisAlong === 'h') {
        // Horizontal wing: one pixel above the axis row, one below.
        return [
          { x: 0, y: -1, w: 1, h: 1 },
          { x: 0, y: 1, w: 1, h: 1 },
        ]
      }
      // Vertical wing: one pixel left of the axis column, one right.
      return [
        { x: -1, y: 0, w: 1, h: 1 },
        { x: 1, y: 0, w: 1, h: 1 },
      ]
    }
  }
}
