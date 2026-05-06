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
 * Pixel rectangles for a wing dot.
 *
 * `axisAlong` is the wing direction: 'h' for horizontal wings (left/right —
 * line lies along X axis) and 'v' for vertical wings (up/down — line lies
 * along Y axis).
 *
 * `lineThicknessPx` is the wing line thickness in firmware-px so the mark
 * can sit just outside the line and not overlap it.
 *
 * Returned rectangles are anchored at the mark's position on the axis (the
 * rasterized integer firmware-px offset from the center along the wing
 * direction is applied by the renderer).
 */
export function wingDotPixels(
  kind: WingDotKind,
  axisAlong: 'h' | 'v',
  lineThicknessPx: number,
): PixelRect[] {
  switch (kind) {
    case 'pair': {
      // Pair of pixels straddling the wing line, drawn as a single contiguous
      // rectangle that also covers the axis pixels at the mark's row/column.
      // Drawing the axis column too matters because the mark is colored by
      // its rasterization error, while the wing line is the reticle colour;
      // if we left the axis column unpainted at the mark, an off-coloured
      // band of the line would appear *between* the two mark pixels, which
      // visually looks like a gap. With the axis included, the mark reads as
      // a clean perpendicular tick at its position.
      const offset = Math.floor(lineThicknessPx / 2) + 1
      const span = 2 * offset + 1
      if (axisAlong === 'h') {
        return [{ x: 0, y: -offset, w: 1, h: span }]
      }
      return [{ x: -offset, y: 0, w: span, h: 1 }]
    }
  }
}
