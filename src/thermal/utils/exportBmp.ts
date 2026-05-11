import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import { computeReticleRects } from './reticleRects'

export function exportBmp(scope: ScopeProfile, reticle: Reticle, magnification = 1): void {
  const width = scope.displayResX
  const height = scope.displayResY

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  for (const r of computeReticleRects(scope, reticle, magnification)) {
    ctx.fillStyle = r.color
    ctx.fillRect(r.x, r.y, r.w, r.h)
  }

  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  const rowSize = Math.ceil((width * 3) / 4) * 4
  const imageSize = rowSize * height
  const fileSize = 54 + imageSize
  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  bytes[0] = 0x42
  bytes[1] = 0x4d
  view.setUint32(2, fileSize, true)
  view.setUint32(6, 0, true)
  view.setUint32(10, 54, true)

  view.setUint32(14, 40, true)
  view.setInt32(18, width, true)
  view.setInt32(22, height, true)
  view.setUint16(26, 1, true)
  view.setUint16(28, 24, true)
  view.setUint32(30, 0, true)
  view.setUint32(34, imageSize, true)
  view.setUint32(38, 2835, true)
  view.setUint32(42, 2835, true)
  view.setUint32(46, 0, true)
  view.setUint32(50, 0, true)

  for (let y = 0; y < height; y++) {
    const srcRow = height - 1 - y
    for (let x = 0; x < width; x++) {
      const srcIdx = (srcRow * width + x) * 4
      const dstIdx = 54 + y * rowSize + x * 3
      bytes[dstIdx] = pixels[srcIdx + 2]
      bytes[dstIdx + 1] = pixels[srcIdx + 1]
      bytes[dstIdx + 2] = pixels[srcIdx]
    }
  }

  const blob = new Blob([buffer], { type: 'image/bmp' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${scope.name.replace(/\s+/g, '_')}_reticle_${width}x${height}_x${magnification}.bmp`
  a.click()
  URL.revokeObjectURL(url)
}
