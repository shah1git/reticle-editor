export interface RasterMark {
  index: number       // mark number (1, 2, 3...)
  targetMrad: number  // target position in MRAD
  targetPx: number    // target position in pixels (fractional)
  actualPx: number    // actual position in pixels (integer)
  actualMrad: number  // actual position in MRAD (back-calculated)
  errorMrad: number   // error in MRAD
  errorPx: number     // error in pixels
  stepPx: number      // step from previous mark in pixels
}

export type RasterStrategy = 'independent' | 'fixed_step' | 'bresenham'
