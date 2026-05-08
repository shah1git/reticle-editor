/**
 * Mark-shape variants. Each entity (center, horizontal-wing dot,
 * vertical-wing dot) carries its own `kind` field. Today every entity has a
 * single allowed value; new variants are added later by extending the union.
 */
export type CenterMarkKind = 'square4' | 'square2'
export type WingDotKind = 'pair'

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
}
