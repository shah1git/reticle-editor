export interface DotHoverInfo {
  dir: 'up' | 'down' | 'left' | 'right'
  index: number
  targetMrad: number
  targetPx: number
  actualPx: number
  actualMrad: number
  errorPx: number
  errorMrad: number
  stepPx: number
  nextStepPx: number | null
  crossAxisInfo: { dir: string; index: number; distancePx: number } | null
  screenX: number
  screenY: number
}
