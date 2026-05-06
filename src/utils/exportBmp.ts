import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import i18n from '../i18n'
import { calcPixelsPerMrad } from '../math/optics'
import { rasterize, effectiveDotCount } from '../math/rasterization'
import { centerMarkPixels, centerMarkHalfExtent, wingDotPixels } from '../math/shapes'
import { loadLogo } from './logoLoader'

declare const __APP_VERSION__: string

const PROJECT_URL = 'https://shah1git.github.io/reticle-editor/'

export async function exportBmp(scope: ScopeProfile, reticle: Reticle): Promise<void> {
  const width = scope.displayResX
  const height = scope.displayResY
  const ppm = calcPixelsPerMrad(scope)

  // 1. Create canvas and render reticle (no info panel, single-color marks)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Black background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  const cxPx = Math.round(width / 2)
  const cyPx = Math.round(height / 2)
  const color = reticle.color

  // Center mark — variant-driven, pixel-perfect
  const centerPx = centerMarkPixels(reticle.centerDot.kind)
  ctx.fillStyle = color
  for (const p of centerPx) {
    ctx.fillRect(cxPx + p.x, cyPx + p.y, p.w, p.h)
  }
  const gapPxBase = centerMarkHalfExtent(reticle.centerDot.kind)

  // Wings
  const dirs = ['up', 'down', 'left', 'right'] as const
  for (const dir of dirs) {
    const wing = reticle.wings[dir]
    const count = effectiveDotCount(wing)
    if (count <= 0) continue

    const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
    const dy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0
    const axisPpm = dy !== 0 ? ppm.v : ppm.h

    const marks = rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count)
    const axisAlong: 'h' | 'v' = (dx !== 0) ? 'h' : 'v'
    const dotPx = wingDotPixels(wing.dots.kind, axisAlong)
    ctx.fillStyle = color
    for (const mark of marks) {
      const posPx = gapPxBase + mark.actualPx
      const dotX = cxPx + posPx * dx
      const dotY = cyPx + posPx * dy
      for (const p of dotPx) {
        ctx.fillRect(dotX + p.x, dotY + p.y, p.w, p.h)
      }
    }
  }

  // Project attribution — logo + URL/version line in lower-left corner.
  // Uses the reticle colour so it's part of the same single-colour bitmap.
  const logo = await loadLogo()
  const margin = 8
  let footerY = height - margin
  const footerText = i18n.t('describe.footer', { version: __APP_VERSION__, url: PROJECT_URL })
  ctx.font = '12px sans-serif'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = color
  ctx.fillText(footerText, margin, footerY)
  footerY -= 14
  if (logo) {
    const logoH = 28
    const logoW = logoH * (logo.width / logo.height || 3.46)
    ctx.drawImage(logo, margin, footerY - logoH, logoW, logoH)
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
