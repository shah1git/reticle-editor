import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import { calcPixelsPerMrad, snapToPixel } from '../math/optics'
import { rasterize } from '../math/rasterization'

export function exportBmp(scope: ScopeProfile, reticle: Reticle): void {
  const width = scope.displayResX
  const height = scope.displayResY
  const ppm = calcPixelsPerMrad(scope)
  const ppmMin = Math.min(ppm.h, ppm.v)

  // 1. Create canvas and render reticle (no info panel, single-color marks)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Black background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  const cxPx = width / 2
  const cyPx = height / 2
  const color = reticle.color

  // Center dot
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

    const lengthPx = Math.round(wing.length * axisPpm)
    ctx.fillStyle = color

    if (wing.lineThickness > 0) {
      const thickPx = Math.max(1, Math.round(wing.lineThickness * axisPpm))
      const halfThick = thickPx / 2
      if (dx !== 0) {
        const startX = cxPx + gapPx * dx
        const endX = cxPx + (gapPx + lengthPx) * dx
        const xMin = Math.min(startX, endX)
        const lineW = Math.abs(endX - startX)
        ctx.fillRect(xMin, cyPx - halfThick, lineW, thickPx)
      } else {
        const startY = cyPx + gapPx * dy
        ctx.fillRect(cxPx - halfThick, startY, thickPx, Math.abs(lengthPx * dy))
      }
    }

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
          ctx.fillStyle = color
          ctx.fill()
        }
      }
    }
  }

  // 2. Read pixels from canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data // Uint8ClampedArray, RGBA

  // 3. Build 24-bit BMP buffer (BITMAPINFOHEADER, uncompressed)
  const rowSize = Math.ceil((width * 3) / 4) * 4
  const imageSize = rowSize * height
  const fileSize = 54 + imageSize
  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // File header (14 bytes)
  bytes[0] = 0x42 // 'B'
  bytes[1] = 0x4d // 'M'
  view.setUint32(2, fileSize, true)
  view.setUint32(6, 0, true) // reserved
  view.setUint32(10, 54, true) // pixel data offset

  // DIB header — BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40, true) // header size
  view.setInt32(18, width, true)
  view.setInt32(22, height, true) // positive = bottom-to-top
  view.setUint16(26, 1, true) // color planes
  view.setUint16(28, 24, true) // bits per pixel
  view.setUint32(30, 0, true) // compression = BI_RGB
  view.setUint32(34, imageSize, true)
  view.setUint32(38, 2835, true) // h resolution px/m (~72 DPI)
  view.setUint32(42, 2835, true) // v resolution px/m
  view.setUint32(46, 0, true) // colors in palette
  view.setUint32(50, 0, true) // important colors

  // Pixel data — bottom-to-top, BGR, row-padded to 4 bytes
  for (let y = 0; y < height; y++) {
    const srcRow = height - 1 - y // flip vertically
    for (let x = 0; x < width; x++) {
      const srcIdx = (srcRow * width + x) * 4
      const dstIdx = 54 + y * rowSize + x * 3
      bytes[dstIdx] = pixels[srcIdx + 2] // B
      bytes[dstIdx + 1] = pixels[srcIdx + 1] // G
      bytes[dstIdx + 2] = pixels[srcIdx] // R
    }
    // Trailing padding bytes in the row are already 0 (ArrayBuffer is zero-initialized).
  }

  // 4. Download
  const blob = new Blob([buffer], { type: 'image/bmp' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${scope.name.replace(/\s+/g, '_')}_reticle_${width}x${height}.bmp`
  a.click()
  URL.revokeObjectURL(url)
}
