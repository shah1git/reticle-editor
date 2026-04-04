import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import { calcPixelsPerMrad, snapToPixel, getFovMrad, isSquarePixelRatio } from '../math/optics'
import { rasterize } from '../math/rasterization'
import { findBestStrategy } from '../math/bestStrategy'
import { errorToColor } from '../math/errorColor'

const INFO_WIDTH = 420
const PADDING = 16
const LINE_H = 18
const SECTION_GAP = 12
const FONT = '13px JetBrains Mono, monospace'
const FONT_BOLD = 'bold 13px JetBrains Mono, monospace'
const FONT_TITLE = 'bold 15px JetBrains Mono, monospace'
const FONT_SMALL = '11px JetBrains Mono, monospace'
const COL_LABEL = '#8b95b0'
const COL_VALUE = '#e8ecf4'
const COL_ACCENT = '#00ff88'
const COL_WARN = '#ff8c42'
const COL_BG = '#12141c'
const COL_PANEL = '#181b25'
const COL_BORDER = '#252938'

interface WingStats {
  name: string
  key: string
  count: number
  maxError: number
  minStep: number
  maxStep: number
  lastError: number
  marks: ReturnType<typeof rasterize>
  axisPpm: number
  spacing: number
  length: number
  dotSize: number
  lineThickness: number
}

function getWingStats(reticle: Reticle, ppm: { h: number; v: number }): WingStats[] {
  const names: Record<string, string> = { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT' }
  const result: WingStats[] = []
  for (const key of ['up', 'down', 'left', 'right'] as const) {
    const wing = reticle.wings[key]
    if (!wing.enabled || wing.length <= 0) continue
    const axisPpm = (key === 'up' || key === 'down') ? ppm.v : ppm.h
    const count = (wing.dots.enabled && wing.dots.spacing > 0) ? Math.floor(wing.length / wing.dots.spacing) : 0
    const marks = count > 0 ? rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count) : []
    let maxError = 0, minStep = Infinity, maxStep = 0
    for (const m of marks) {
      const err = Math.abs(m.errorPx)
      if (err > maxError) maxError = err
      if (m.stepPx < minStep) minStep = m.stepPx
      if (m.stepPx > maxStep) maxStep = m.stepPx
    }
    result.push({
      name: names[key], key, count, maxError,
      minStep: count > 0 ? minStep : 0,
      maxStep: count > 0 ? maxStep : 0,
      lastError: marks.length > 0 ? marks[marks.length - 1].errorPx : 0,
      marks, axisPpm,
      spacing: wing.dots.spacing,
      length: wing.length,
      dotSize: wing.dotSize,
      lineThickness: wing.lineThickness,
    })
  }
  return result
}

function drawInfoPanel(ctx: CanvasRenderingContext2D, x0: number, y0: number, scope: ScopeProfile, reticle: Reticle) {
  const ppm = calcPixelsPerMrad(scope)
  const fov = getFovMrad(scope)
  const sqPx = isSquarePixelRatio(ppm)
  const best = findBestStrategy(reticle, ppm)
  const wingStats = getWingStats(reticle, ppm)
  const stratLabels: Record<string, string> = { independent: 'A: Independent', fixed_step: 'B: Fixed Step' }

  let y = y0 + PADDING

  const label = (text: string, yy: number) => {
    ctx.font = FONT
    ctx.fillStyle = COL_LABEL
    ctx.fillText(text, x0 + PADDING, yy)
  }
  const value = (text: string, xx: number, yy: number, color = COL_VALUE) => {
    ctx.font = FONT
    ctx.fillStyle = color
    ctx.fillText(text, xx, yy)
  }
  const title = (text: string, yy: number) => {
    ctx.font = FONT_TITLE
    ctx.fillStyle = COL_ACCENT
    ctx.fillText(text, x0 + PADDING, yy)
  }
  const separator = (yy: number) => {
    ctx.strokeStyle = COL_BORDER
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x0 + PADDING, yy)
    ctx.lineTo(x0 + INFO_WIDTH - PADDING, yy)
    ctx.stroke()
    return yy + 8
  }

  const valX = x0 + 180

  // Title
  title('RETICLE SPEC', y)
  y += LINE_H + 4

  // Scope section
  ctx.font = FONT_BOLD
  ctx.fillStyle = COL_VALUE
  ctx.fillText('SCOPE', x0 + PADDING, y)
  y += LINE_H

  label('Name:', y); value(scope.name, valX, y); y += LINE_H

  if (scope.type === 'digital') {
    label('Type:', y); value('Digital', valX, y); y += LINE_H
    label('Focal length:', y); value(`${scope.lensFL} mm`, valX, y); y += LINE_H
    label('Sensor:', y); value(`${scope.sensorResX}\u00d7${scope.sensorResY} px`, valX, y); y += LINE_H
    label('Display:', y); value(`${scope.displayResX}\u00d7${scope.displayResY} px`, valX, y); y += LINE_H
    label('Pixel pitch:', y); value(`${scope.pixelPitch} \u00b5m`, valX, y); y += LINE_H
  } else {
    label('Type:', y); value('Optical', valX, y); y += LINE_H
    label('FOV:', y); value(`${scope.fovDegrees}\u00b0`, valX, y); y += LINE_H
    label('Display:', y); value(`${scope.displayResX}\u00d7${scope.displayResY} px`, valX, y); y += LINE_H
  }

  if (sqPx) {
    label('px/MRAD:', y); value(`${ppm.h.toFixed(3)}`, valX, y, COL_ACCENT); y += LINE_H
  } else {
    label('px/MRAD H:', y); value(`${ppm.h.toFixed(3)}`, valX, y, COL_ACCENT); y += LINE_H
    label('px/MRAD V:', y); value(`${ppm.v.toFixed(3)}`, valX, y, COL_ACCENT); y += LINE_H
  }
  label('FOV:', y); value(`${fov.h.toFixed(1)} \u00d7 ${fov.v.toFixed(1)} MRAD`, valX, y); y += LINE_H
  label('Focal plane:', y); value(reticle.focalPlane.toUpperCase(), valX, y); y += LINE_H

  y += 4
  y = separator(y)

  // Reticle section
  ctx.font = FONT_BOLD
  ctx.fillStyle = COL_VALUE
  ctx.fillText('RETICLE', x0 + PADDING, y)
  y += LINE_H

  const dotPpmMin = Math.min(ppm.h, ppm.v)
  const dotRadMrad = snapToPixel(reticle.centerDot.radius, dotPpmMin)
  const dotRadPx = Math.round(dotRadMrad * dotPpmMin)
  label('Center dot:', y); value(`r=${reticle.centerDot.radius} MRAD \u2192 ${dotRadPx} px (d=${dotRadPx * 2})`, valX, y); y += LINE_H
  label('Color:', y); value(reticle.color, valX, y); y += LINE_H
  label('Strategy:', y)
  const isOptimal = best.best === reticle.rasterization
  value(
    `${stratLabels[reticle.rasterization]}${isOptimal ? ' \u2713' : ''}`,
    valX, y, isOptimal ? COL_ACCENT : COL_VALUE,
  )
  y += LINE_H
  if (!isOptimal) {
    label('Recommended:', y); value(`${stratLabels[best.best]} (\u00b1${best.bestMaxError.toFixed(2)} px)`, valX, y, COL_WARN); y += LINE_H
  }
  label('Max error:', y); value(`\u00b1${best.currentMaxError.toFixed(2)} px`, valX, y, best.currentMaxError > 0.4 ? COL_WARN : COL_ACCENT); y += LINE_H

  y += 4
  y = separator(y)

  // Wings section
  for (const ws of wingStats) {
    ctx.font = FONT_BOLD
    ctx.fillStyle = COL_VALUE
    ctx.fillText(`WING ${ws.name}`, x0 + PADDING, y)
    y += LINE_H

    label('Length:', y); value(`${ws.length} MRAD`, valX, y); y += LINE_H
    label('Line thickness:', y); value(`${ws.lineThickness} MRAD`, valX, y); y += LINE_H
    label('Dot size:', y); value(`${ws.dotSize} px`, valX, y); y += LINE_H
    label('Interval:', y); value(`${ws.spacing} MRAD`, valX, y); y += LINE_H
    label('px/MRAD (axis):', y); value(`${ws.axisPpm.toFixed(3)}`, valX, y, COL_ACCENT); y += LINE_H
    label('Marks:', y); value(`${ws.count}`, valX, y); y += LINE_H

    if (ws.count > 0) {
      label('Max error:', y)
      value(`\u00b1${ws.maxError.toFixed(2)} px`, valX, y, ws.maxError > 0.4 ? COL_WARN : COL_ACCENT)
      y += LINE_H

      const stepsStr = ws.minStep === ws.maxStep ? `all = ${ws.minStep}` : `${ws.minStep}\u2013${ws.maxStep}`
      label('Steps:', y); value(`${stepsStr} px`, valX, y); y += LINE_H

      label('Last mark error:', y)
      const accum = reticle.rasterization === 'fixed_step' ? ' (accumulated)' : ''
      value(`${ws.lastError >= 0 ? '+' : ''}${ws.lastError.toFixed(2)} px${accum}`, valX, y)
      y += LINE_H

      // Mini rasterization table
      y += 4
      ctx.font = FONT_SMALL
      ctx.fillStyle = COL_LABEL
      const cols = [
        { label: '#', x: x0 + PADDING, w: 28 },
        { label: 'MRAD', x: x0 + PADDING + 28, w: 52 },
        { label: 'px', x: x0 + PADDING + 80, w: 40 },
        { label: 'actual', x: x0 + PADDING + 120, w: 60 },
        { label: 'error', x: x0 + PADDING + 180, w: 52 },
        { label: 'step', x: x0 + PADDING + 232, w: 36 },
      ]
      for (const col of cols) {
        ctx.fillText(col.label, col.x, y)
      }
      y += LINE_H - 4

      ctx.strokeStyle = COL_BORDER
      ctx.beginPath()
      ctx.moveTo(x0 + PADDING, y - 4)
      ctx.lineTo(x0 + PADDING + 270, y - 4)
      ctx.stroke()

      const modalStep = ws.marks[0]?.stepPx ?? 0
      for (const m of ws.marks) {
        ctx.font = FONT_SMALL
        ctx.fillStyle = COL_LABEL
        ctx.fillText(`${m.index}`, cols[0].x, y)
        ctx.fillStyle = COL_VALUE
        ctx.fillText(`${m.targetMrad.toFixed(2)}`, cols[1].x, y)
        ctx.fillText(`${m.actualPx}`, cols[2].x, y)
        ctx.fillText(`${m.actualMrad.toFixed(3)}`, cols[3].x, y)
        ctx.fillStyle = errorColor(m.errorPx)
        ctx.fillText(`${m.errorPx >= 0 ? '+' : ''}${m.errorPx.toFixed(2)}`, cols[4].x, y)
        ctx.fillStyle = m.stepPx !== modalStep ? COL_WARN : COL_VALUE
        ctx.fillText(`${m.stepPx}`, cols[5].x, y)
        y += LINE_H - 4
      }
    }

    y += 4
    y = separator(y)
  }

  // Summary
  let totalMarks = 0
  for (const ws of wingStats) totalMarks += ws.count
  ctx.font = FONT_BOLD
  ctx.fillStyle = COL_VALUE
  ctx.fillText('SUMMARY', x0 + PADDING, y)
  y += LINE_H
  label('Total marks:', y); value(`${totalMarks}`, valX, y); y += LINE_H
  label('Active wings:', y); value(`${wingStats.length}`, valX, y); y += LINE_H
  label('Global max error:', y); value(`\u00b1${best.currentMaxError.toFixed(2)} px`, valX, y, best.currentMaxError > 0.4 ? COL_WARN : COL_ACCENT); y += LINE_H
  label('Best strategy:', y); value(`${stratLabels[best.best]} (\u00b1${best.bestMaxError.toFixed(2)} px)`, valX, y); y += LINE_H

  return y + PADDING
}

function errorColor(errorPx: number): string {
  const abs = Math.abs(errorPx)
  if (abs <= 0.1) return COL_ACCENT
  if (abs <= 0.4) return COL_VALUE
  return COL_WARN
}

function measureInfoHeight(scope: ScopeProfile, reticle: Reticle): number {
  const ppm = calcPixelsPerMrad(scope)
  const sqPx = isSquarePixelRatio(ppm)
  const best = findBestStrategy(reticle, ppm)
  const wingStats = getWingStats(reticle, ppm)

  let lines = 0
  // title
  lines += 2
  // scope section
  lines += 1 // header
  lines += 1 // name
  lines += scope.type === 'digital' ? 4 : 3 // type params
  lines += sqPx ? 1 : 2 // ppm
  lines += 2 // fov + focalPlane
  lines += 1 // separator
  // reticle section
  lines += 1 // header
  lines += 3 // dot, color, strategy
  if (!best || best.best !== reticle.rasterization) lines += 1 // recommended
  lines += 1 // max error
  lines += 1 // separator

  for (const ws of wingStats) {
    lines += 1 // wing header
    lines += 5 // length, thickness, dotSize, interval, axisPpm
    lines += 1 // marks count
    if (ws.count > 0) {
      lines += 3 // maxError, steps, lastError
      lines += 1 // table header
      lines += ws.count // table rows (smaller line height)
    }
    lines += 1 // separator
  }

  // summary
  lines += 5

  // Approximate: table rows use LINE_H-4, others use LINE_H, plus padding/gaps
  const tableRows = wingStats.reduce((s, w) => s + (w.count > 0 ? w.count + 1 : 0), 0)
  const normalRows = lines - tableRows
  return PADDING * 2 + normalRows * LINE_H + tableRows * (LINE_H - 4) + wingStats.length * SECTION_GAP + SECTION_GAP * 4 + 20
}

export function exportPng(scope: ScopeProfile, reticle: Reticle): void {
  const ppm = calcPixelsPerMrad(scope)
  const reticleW = scope.displayResX
  const reticleH = scope.displayResY
  const ppmMin = Math.min(ppm.h, ppm.v)

  const infoH = measureInfoHeight(scope, reticle)
  const totalW = reticleW + INFO_WIDTH
  const totalH = Math.max(reticleH, infoH)

  const canvas = document.createElement('canvas')
  canvas.width = totalW
  canvas.height = totalH
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = COL_BG
  ctx.fillRect(0, 0, totalW, totalH)

  // Reticle area background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, reticleW, reticleH)

  // Info panel background
  ctx.fillStyle = COL_PANEL
  ctx.fillRect(reticleW, 0, INFO_WIDTH, totalH)

  // Border between reticle and info
  ctx.strokeStyle = COL_BORDER
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(reticleW, 0)
  ctx.lineTo(reticleW, totalH)
  ctx.stroke()

  const cxPx = reticleW / 2
  const cyPx = reticleH / 2
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
        const width = Math.abs(endX - startX)
        ctx.fillRect(xMin, cyPx - halfThick, width, thickPx)
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
          ctx.fillStyle = errorToColor(mark.errorPx)
          ctx.fill()
        }
      }
    }
  }

  // Draw info panel
  drawInfoPanel(ctx, reticleW, 0, scope, reticle)

  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${scope.name.replace(/\s+/g, '_')}_reticle_${reticleW}x${reticleH}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
