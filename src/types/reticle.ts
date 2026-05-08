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

export type ReticleMode = 'parametric' | 'pixels'

export interface Reticle {
  /**
   * Drawing mode. `parametric` uses center+wings+ring (rasterised on demand).
   * `pixels` ignores all parametric fields and renders/exports `customPixels`
   * directly. Switching parametric→pixels is a one-way conversion that
   * flattens the current parametric reticle into editable pixels.
   */
  mode: ReticleMode
  /**
   * Sparse list of lit pixel offsets from the reticle centre, in firmware
   * pixels. Each entry is `[dx, dy]` — the pixel occupies
   * `[cx+dx .. cx+dx+1] × [cy+dy .. cy+dy+1]`. Used only when `mode === 'pixels'`.
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
