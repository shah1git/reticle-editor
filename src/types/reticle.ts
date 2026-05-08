/**
 * Mark-shape variants. Each entity (center, horizontal-wing dot,
 * vertical-wing dot) carries its own `kind` field. Today every entity has a
 * single allowed value; new variants are added later by extending the union.
 */
export type CenterMarkKind = 'square4' | 'square2' | 'pixelBR' | 'pixelTL'
export type WingDotKind = 'pair' | 'single'

export interface Wing {
  enabled: boolean
  dots: {
    enabled: boolean
    spacing: number       // MRAD — interval between marks
    count: number         // number of marks (≥ 0); placed at i·spacing for i = 1..count
    kind: WingDotKind     // mark-shape variant
  }
}

export interface Reticle {
  /**
   * Sparse list of user-painted pixel offsets from the reticle centre, in
   * firmware pixels. Each entry is `[dx, dy]` — the pixel occupies
   * `[cx+dx .. cx+dx+1] × [cy+dy .. cy+dy+1]`. Always rendered on top of the
   * parametric reticle (centre + wings + ring), so the user can decorate the
   * generated reticle with hand-drawn pixels without losing parametric edit.
   */
  customPixels: Array<[number, number]>
  centerDot: {
    kind: CenterMarkKind  // mark-shape variant
  }
  wings: {
    up: Wing
    down: Wing
    left: Wing
    right: Wing
  }
  color: string
  rasterization: 'independent' | 'fixed_step'
  focalPlane: 'ffp' | 'sfp'
  /**
   * Optional reference ring. When `enabled`, a 1-pixel-thick circle is
   * rasterized around the centre at the given diameter. Same colour as the
   * rest of the reticle and exported into BMP/PNG and the JSON manifest.
   */
  refCircle: {
    enabled: boolean
    diameterMrad: number
  }
}
