export interface Wing {
  enabled: boolean
  length: number          // MRAD
  lineThickness: number   // MRAD
  dots: {
    enabled: boolean
    spacing: number       // MRAD
    radius: number        // MRAD, snap к целым пикселям
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
  rasterization: 'independent' | 'fixed_step' | 'bresenham'
}
