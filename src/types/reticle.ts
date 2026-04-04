export interface Wing {
  enabled: boolean
  length: number          // MRAD
  lineThickness: number   // MRAD
  dotSize: number         // пикс — диаметр точки-метки, целое число >= 1
  dots: {
    enabled: boolean
    spacing: number       // MRAD
  }
}

export interface Reticle {
  centerDot: {
    radius: number  // MRAD, snapped to whole pixels via snapToPixel
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
