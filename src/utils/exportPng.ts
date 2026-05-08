import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import i18n from '../i18n'
import { calcPixelsPerMrad, getFovMrad, isSquarePixelRatio, type PixelsPerMrad } from '../math/optics'
import { rasterize, effectiveDotCount } from '../math/rasterization'
import { loadLogo } from './logoLoader'
import { computeReticleRects } from './reticleRects'

declare const __APP_VERSION__: string

const PROJECT_URL = 'https://shah1git.github.io/reticle-editor/'
import { findBestStrategy } from '../math/bestStrategy'
import { errorToColor } from '../math/errorColor'

const t = (key: string, opts?: Record<string, unknown>): string => i18n.t(key, opts as never) as unknown as string

const INFO_WIDTH = 420
const PADDING = 16
const LINE_H = 18
const FONT = '13px JetBrains Mono, monospace'
const FONT_BOLD = 'bold 13px JetBrains Mono, monospace'
const FONT_TITLE = 'bold 15px JetBrains Mono, monospace'
const FONT_MAG = 'bold 22px JetBrains Mono, monospace'
const FONT_SMALL = '11px JetBrains Mono, monospace'
const COL_LABEL = '#8b95b0'
const COL_VALUE = '#e8ecf4'
const COL_ACCENT = '#00ff88'
const COL_WARN = '#ff8c42'
const COL_BG = '#12141c'
const COL_PANEL = '#181b25'
const COL_BORDER = '#252938'

const MAG_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const
const MAG_HEADER_H = 36
const TILE_GAP = 12

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
}

function getWingStats(reticle: Reticle, ppm: PixelsPerMrad): WingStats[] {
  const nameKeys: Record<string, string> = {
    up: 'export.wingUp', down: 'export.wingDown',
    left: 'export.wingLeft', right: 'export.wingRight',
  }
  const result: WingStats[] = []
  for (const key of ['up', 'down', 'left', 'right'] as const) {
    const wing = reticle.wings[key]
    const count = effectiveDotCount(wing)
    if (count <= 0) continue
    const axisPpm = (key === 'up' || key === 'down') ? ppm.v : ppm.h
    const marks = rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count)
    let maxError = 0, minStep = Infinity, maxStep = 0
    for (const m of marks) {
      const err = Math.abs(m.errorPx)
      if (err > maxError) maxError = err
      if (m.stepPx < minStep) minStep = m.stepPx
      if (m.stepPx > maxStep) maxStep = m.stepPx
    }
    result.push({
      name: t(nameKeys[key]), key, count, maxError,
      minStep, maxStep,
      lastError: marks.length > 0 ? marks[marks.length - 1].errorPx : 0,
      marks, axisPpm,
      spacing: wing.dots.spacing,
    })
  }
  return result
}

function drawInfoPanel(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  scope: ScopeProfile,
  reticle: Reticle,
  ppm: PixelsPerMrad,
  magnification: number,
  logo: HTMLImageElement | null,
) {
  const fov = getFovMrad(scope)
  const sqPx = isSquarePixelRatio(ppm)
  const best = findBestStrategy(reticle, ppm)
  const wingStats = getWingStats(reticle, ppm)
  const stratLabels: Record<string, string> = {
    independent: t('strategies.independent'),
    fixed_step: t('strategies.fixedStep'),
  }

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

  title(`${t('export.title')} — ×${magnification}`, y)
  y += LINE_H + 4

  ctx.font = FONT_BOLD
  ctx.fillStyle = COL_VALUE
  ctx.fillText(t('export.scope'), x0 + PADDING, y)
  y += LINE_H

  label(t('export.name'), y); value(scope.name, valX, y); y += LINE_H

  if (scope.type === 'digital') {
    label(t('export.type'), y); value(t('export.typeDigital'), valX, y); y += LINE_H
    label(t('export.focalLength'), y); value(`${scope.lensFL} ${t('units.mm')}`, valX, y); y += LINE_H
    label(t('export.sensor'), y); value(`${scope.sensorResX}×${scope.sensorResY} ${t('units.px')}`, valX, y); y += LINE_H
    label(t('export.display'), y); value(`${scope.displayResX}×${scope.displayResY} ${t('units.px')}`, valX, y); y += LINE_H
    label(t('export.pixelPitch'), y); value(`${scope.pixelPitch} ${t('units.um')}`, valX, y); y += LINE_H
  } else {
    label(t('export.type'), y); value(t('export.typeOptical'), valX, y); y += LINE_H
    label(t('export.fov'), y); value(`${scope.fovDegrees}${t('units.deg')}`, valX, y); y += LINE_H
    label(t('export.display'), y); value(`${scope.displayResX}×${scope.displayResY} ${t('units.px')}`, valX, y); y += LINE_H
  }

  label(t('export.magnification'), y); value(`×${magnification}`, valX, y, COL_ACCENT); y += LINE_H

  if (sqPx) {
    label(t('export.pxPerMrad'), y); value(`${ppm.h.toFixed(3)}`, valX, y, COL_ACCENT); y += LINE_H
  } else {
    label(t('export.pxPerMradH'), y); value(`${ppm.h.toFixed(3)}`, valX, y, COL_ACCENT); y += LINE_H
    label(t('export.pxPerMradV'), y); value(`${ppm.v.toFixed(3)}`, valX, y, COL_ACCENT); y += LINE_H
  }
  label(t('export.fov'), y); value(`${fov.h.toFixed(1)} × ${fov.v.toFixed(1)} ${t('units.mrad')}`, valX, y); y += LINE_H
  label(t('export.focalPlane'), y); value(reticle.focalPlane.toUpperCase(), valX, y); y += LINE_H

  y += 4
  y = separator(y)

  ctx.font = FONT_BOLD
  ctx.fillStyle = COL_VALUE
  ctx.fillText(t('export.reticle'), x0 + PADDING, y)
  y += LINE_H

  if (reticle.mode === 'pixels') {
    label(t('export.mode'), y); value(t('export.modePixels'), valX, y, COL_ACCENT); y += LINE_H
    label(t('export.customPixels'), y); value(`${reticle.customPixels.length}`, valX, y); y += LINE_H
  } else {
    label(t('export.centerDot'), y); value(t(`centerDot.kindLabel.${reticle.centerDot.kind}`), valX, y); y += LINE_H
  }
  if (reticle.refCircle.enabled && reticle.refCircle.diameterMrad > 0) {
    const d = reticle.refCircle.diameterMrad
    label(t('export.refCircle'), y)
    value(t('export.refCircleValue', { diameterMrad: d.toFixed(1), sizeAt100m: (d * 0.1).toFixed(2) }), valX, y)
    y += LINE_H
  }
  label(t('export.color'), y); value(reticle.color, valX, y); y += LINE_H
  label(t('export.strategy'), y)
  const isOptimal = best.best === reticle.rasterization
  value(
    `${stratLabels[reticle.rasterization]}${isOptimal ? ' ✓' : ''}`,
    valX, y, isOptimal ? COL_ACCENT : COL_VALUE,
  )
  y += LINE_H
  if (!isOptimal) {
    label(t('export.recommended'), y); value(`${stratLabels[best.best]} (±${best.bestMaxError.toFixed(2)} ${t('units.px')})`, valX, y, COL_WARN); y += LINE_H
  }
  label(t('export.maxError'), y); value(`±${best.currentMaxError.toFixed(2)} ${t('units.px')}`, valX, y, best.currentMaxError > 0.4 ? COL_WARN : COL_ACCENT); y += LINE_H

  y += 4
  y = separator(y)

  for (const ws of wingStats) {
    ctx.font = FONT_BOLD
    ctx.fillStyle = COL_VALUE
    ctx.fillText(`${t('export.wing')} ${ws.name}`, x0 + PADDING, y)
    y += LINE_H

    label(t('export.interval'), y); value(`${ws.spacing} ${t('units.mrad')}`, valX, y); y += LINE_H
    label(t('export.pxPerMradAxis'), y); value(`${ws.axisPpm.toFixed(3)}`, valX, y, COL_ACCENT); y += LINE_H
    label(t('export.marks'), y); value(`${ws.count}`, valX, y); y += LINE_H

    if (ws.count > 0) {
      label(t('export.maxError'), y)
      value(`±${ws.maxError.toFixed(2)} ${t('units.px')}`, valX, y, ws.maxError > 0.4 ? COL_WARN : COL_ACCENT)
      y += LINE_H

      const stepsStr = ws.minStep === ws.maxStep ? `all = ${ws.minStep}` : `${ws.minStep}–${ws.maxStep}`
      label(t('export.steps'), y); value(`${stepsStr} ${t('units.px')}`, valX, y); y += LINE_H

      label(t('export.lastMarkError'), y)
      const accum = reticle.rasterization === 'fixed_step' ? ` ${t('export.accumulated')}` : ''
      value(`${ws.lastError >= 0 ? '+' : ''}${ws.lastError.toFixed(2)} ${t('units.px')}${accum}`, valX, y)
      y += LINE_H

      y += 4
      ctx.font = FONT_SMALL
      ctx.fillStyle = COL_LABEL
      const cols = [
        { label: t('rasterTable.colIndex'), x: x0 + PADDING, w: 28 },
        { label: t('rasterTable.colMrad'), x: x0 + PADDING + 28, w: 52 },
        { label: t('rasterTable.colPx'), x: x0 + PADDING + 80, w: 40 },
        { label: t('rasterTable.colActual'), x: x0 + PADDING + 120, w: 60 },
        { label: t('rasterTable.colError'), x: x0 + PADDING + 180, w: 52 },
        { label: t('rasterTable.colStep'), x: x0 + PADDING + 232, w: 36 },
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
        ctx.fillStyle = errColor(m.errorPx)
        ctx.fillText(`${m.errorPx >= 0 ? '+' : ''}${m.errorPx.toFixed(2)}`, cols[4].x, y)
        ctx.fillStyle = m.stepPx !== modalStep ? COL_WARN : COL_VALUE
        ctx.fillText(`${m.stepPx}`, cols[5].x, y)
        y += LINE_H - 4
      }
    }

    y += 4
    y = separator(y)
  }

  let totalMarks = 0
  for (const ws of wingStats) totalMarks += ws.count
  ctx.font = FONT_BOLD
  ctx.fillStyle = COL_VALUE
  ctx.fillText(t('export.summary'), x0 + PADDING, y)
  y += LINE_H
  label(t('export.totalMarks'), y); value(`${totalMarks}`, valX, y); y += LINE_H
  label(t('export.activeWings'), y); value(`${wingStats.length}`, valX, y); y += LINE_H
  label(t('export.globalMaxError'), y); value(`±${best.currentMaxError.toFixed(2)} ${t('units.px')}`, valX, y, best.currentMaxError > 0.4 ? COL_WARN : COL_ACCENT); y += LINE_H
  label(t('export.bestStrategy'), y); value(`${stratLabels[best.best]} (±${best.bestMaxError.toFixed(2)} ${t('units.px')})`, valX, y); y += LINE_H

  y += 8
  y = separator(y)
  if (logo) {
    const maxW = INFO_WIDTH - PADDING * 2
    const logoW = Math.min(maxW, 240)
    const logoH = logoW * (logo.height / logo.width || 0.29)
    ctx.drawImage(logo, x0 + (INFO_WIDTH - logoW) / 2, y, logoW, logoH)
    y += logoH + 6
  }
  ctx.font = FONT_SMALL
  ctx.fillStyle = COL_LABEL
  ctx.textAlign = 'center'
  const footerText = t('describe.footer', { version: __APP_VERSION__, url: PROJECT_URL })
  const footerLines = footerText.split(' · ')
  for (const line of footerLines) {
    ctx.fillText(line, x0 + INFO_WIDTH / 2, y + LINE_H - 6)
    y += LINE_H - 4
  }
  ctx.textAlign = 'left'

  return y + PADDING
}

function errColor(errorPx: number): string {
  const abs = Math.abs(errorPx)
  if (abs <= 0.1) return COL_ACCENT
  if (abs <= 0.4) return COL_VALUE
  return COL_WARN
}

function measureInfoHeight(scope: ScopeProfile, reticle: Reticle, ppm: PixelsPerMrad): number {
  const sqPx = isSquarePixelRatio(ppm)
  const best = findBestStrategy(reticle, ppm)
  const wingStats = getWingStats(reticle, ppm)

  let lines = 0
  lines += 2 // title
  lines += 1 + 1 // scope header + name
  lines += scope.type === 'digital' ? 4 : 3
  lines += 1 // magnification line
  lines += sqPx ? 1 : 2
  lines += 2 + 1 // fov + focalPlane + separator
  lines += 1 + 3 // reticle header + dot/color/strategy
  if (!best || best.best !== reticle.rasterization) lines += 1
  lines += 1 + 1 // maxError + separator

  for (const ws of wingStats) {
    lines += 1 + 6 // header + params
    if (ws.count > 0) {
      lines += 3 + 1 + ws.count // stats + table header + rows
    }
    lines += 1 // separator
  }

  lines += 5 // summary

  const tableRows = wingStats.reduce((s, w) => s + (w.count > 0 ? w.count + 1 : 0), 0)
  const normalRows = lines - tableRows
  return PADDING * 2 + normalRows * LINE_H + tableRows * (LINE_H - 4) + wingStats.length * 12 + 80 + 130
}

function drawReticle(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  reticleW: number,
  reticleH: number,
  scope: ScopeProfile,
  reticle: Reticle,
  magnification: number,
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x0, y0, reticleW, reticleH)
  ctx.clip()

  ctx.fillStyle = '#000000'
  ctx.fillRect(x0, y0, reticleW, reticleH)

  const rects = computeReticleRects(scope, reticle, magnification, {
    markColor: (mark) => errorToColor(mark.errorPx),
  })
  for (const r of rects) {
    ctx.fillStyle = r.color
    ctx.fillRect(x0 + r.x, y0 + r.y, r.w, r.h)
  }

  ctx.restore()
}

export async function exportPng(scope: ScopeProfile, reticle: Reticle): Promise<void> {
  const basePpm = calcPixelsPerMrad(scope)
  const reticleW = scope.displayResX
  const reticleH = scope.displayResY
  const logo = await loadLogo()

  const tiles = MAG_LEVELS.map(k => {
    const ppm = { h: basePpm.h * k, v: basePpm.v * k }
    const infoH = measureInfoHeight(scope, reticle, ppm)
    const bodyH = Math.max(reticleH, infoH)
    return { k, ppm, infoH, bodyH }
  })

  const totalW = reticleW + INFO_WIDTH
  const totalH = tiles.reduce((s, t) => s + MAG_HEADER_H + t.bodyH + TILE_GAP, 0)

  const canvas = document.createElement('canvas')
  canvas.width = totalW
  canvas.height = totalH
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = COL_BG
  ctx.fillRect(0, 0, totalW, totalH)

  let y = 0
  for (const tile of tiles) {
    // Magnification header band spanning the full width.
    ctx.fillStyle = COL_PANEL
    ctx.fillRect(0, y, totalW, MAG_HEADER_H)
    ctx.strokeStyle = COL_BORDER
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y + MAG_HEADER_H - 0.5)
    ctx.lineTo(totalW, y + MAG_HEADER_H - 0.5)
    ctx.stroke()

    ctx.font = FONT_MAG
    ctx.fillStyle = COL_ACCENT
    ctx.textBaseline = 'middle'
    ctx.fillText(`×${tile.k}`, PADDING, y + MAG_HEADER_H / 2)
    ctx.font = FONT
    ctx.fillStyle = COL_LABEL
    ctx.fillText(
      `${tile.ppm.h.toFixed(2)} ${t('units.px')}/${t('units.mrad')}`,
      PADDING + 60,
      y + MAG_HEADER_H / 2,
    )
    ctx.textBaseline = 'alphabetic'

    y += MAG_HEADER_H

    // Reticle area background (left).
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, y, reticleW, tile.bodyH)

    // Info panel background (right).
    ctx.fillStyle = COL_PANEL
    ctx.fillRect(reticleW, y, INFO_WIDTH, tile.bodyH)

    // Vertical separator.
    ctx.strokeStyle = COL_BORDER
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(reticleW, y)
    ctx.lineTo(reticleW, y + tile.bodyH)
    ctx.stroke()

    drawReticle(ctx, 0, y, reticleW, reticleH, scope, reticle, tile.k)
    drawInfoPanel(ctx, reticleW, y, scope, reticle, tile.ppm, tile.k, logo)

    y += tile.bodyH + TILE_GAP
  }

  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${scope.name.replace(/\s+/g, '_')}_reticle_${reticleW}x${reticleH}_x1-x8.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
