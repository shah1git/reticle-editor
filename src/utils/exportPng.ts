import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import { calcPixelsPerMrad, snapToPixel } from '../math/optics'
import { rasterize } from '../math/rasterization'
import { errorToColor } from '../math/errorColor'

export function exportPng(scope: ScopeProfile, reticle: Reticle): void {
  const ppm = calcPixelsPerMrad(scope)
  const w = scope.displayResX
  const h = scope.displayResY
  const ppmMin = Math.min(ppm.h, ppm.v)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, w, h)

  const cxPx = w / 2
  const cyPx = h / 2
  const color = reticle.color

  // Center dot — circular, same pixel radius both axes
  const dotRadiusMrad = snapToPixel(reticle.centerDot.radius, ppmMin)
  const dotRadiusPx = Math.round(dotRadiusMrad * ppmMin)
  if (dotRadiusPx > 0) {
    ctx.beginPath()
    ctx.arc(cxPx, cyPx, dotRadiusPx, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }

  // Wings
  const dirs = ['up', 'down', 'left', 'right'] as const
  for (const dir of dirs) {
    const wing = reticle.wings[dir]
    if (!wing.enabled || wing.length <= 0) continue

    const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
    const dy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0
    const axisPpm = dy !== 0 ? ppm.v : ppm.h
    const gapPx = dotRadiusPx

    // Line (skip if thickness is 0)
    const lengthPx = Math.round(wing.length * axisPpm)
    ctx.fillStyle = color

    if (wing.lineThickness > 0) {
      const thickPx = Math.max(1, Math.round(wing.lineThickness * axisPpm))
      const halfThick = thickPx / 2
      if (dx !== 0) {
        const startX = cxPx + gapPx * dx
        const endX = cxPx + (gapPx + lengthPx) * dx
        const xMin = Math.min(startX, endX)
        const width = Math.abs(endX - startX)
        ctx.fillRect(xMin, cyPx - halfThick, width, thickPx)
      } else {
        const startY = cyPx + gapPx * dy
        ctx.fillRect(cxPx - halfThick, startY, thickPx, Math.abs(lengthPx * dy))
      }
    }

    // Dots — dotSize is directly in pixels
    if (wing.dots.enabled && wing.dots.spacing > 0) {
      const count = Math.floor(wing.length / wing.dots.spacing)
      if (count > 0) {
        const marks = rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count)
        const wingDotRadiusPx = Math.max(1, Math.round(wing.dotSize / 2))

        for (const mark of marks) {
          const posPx = gapPx + mark.actualPx
          const dotX = cxPx + posPx * dx
          const dotY = cyPx + posPx * dy
          ctx.beginPath()
          ctx.arc(dotX, dotY, wingDotRadiusPx, 0, Math.PI * 2)
          ctx.fillStyle = errorToColor(mark.errorPx)
          ctx.fill()
        }
      }
    }
  }

  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${scope.name.replace(/\s+/g, '_')}_reticle_${w}x${h}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
