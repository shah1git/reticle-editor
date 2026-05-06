export interface Wing {
  enabled: boolean
  length: number          // MRAD
  lineThickness: number   // MRAD
  dotSize: number         // пикс — диаметр точки-метки, целое число >= 1
  dots: {
    enabled: boolean
    spacing: number       // MRAD
    maxDots: number       // 0 = unlimited; otherwise hard cap on dot count
  }
}

export interface Reticle {
  centerDot: {
    diameter: number  // MRAD; snapped so diameter * ppmMin is a whole pixel count
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
