export interface Wing {
  enabled: boolean
  length: number          // MRAD
  lineThickness: number   // MRAD
  dots: {
    enabled: boolean
    spacing: number       // MRAD, interval between dots
    radius: number        // MRAD, snapped to whole pixels
  }
}

export interface Reticle {
  centerDot: {
    radius: number  // MRAD, snapped to whole pixels via snapToPixel
  }
  wings: {
    left: Wing
    right: Wing
    down: Wing
  }
  color: string          // hex color for entire reticle
  rasterization: 'independent' | 'fixed_step' | 'bresenham'
}
