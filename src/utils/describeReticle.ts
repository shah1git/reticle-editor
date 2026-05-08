import type { TFunction } from 'i18next'
import type { ScopeProfile } from '../types/scope'
import type { Reticle, Wing } from '../types/reticle'
import type { PixelsPerMrad } from '../math/optics'
import { getFovMrad, isSquarePixelRatio } from '../math/optics'
import { rasterize, effectiveDotCount } from '../math/rasterization'
import { referenceCirclePixels } from '../math/shapes'
import type { WingKey } from '../App'

declare const __APP_VERSION__: string

const PROJECT_URL = 'https://shah1git.github.io/reticle-editor/'

const fmt = (n: number, digits = 2): string => {
  if (!Number.isFinite(n)) return '—'
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(digits).replace(/\.?0+$/, '')
}

const wingHeaderKey: Record<WingKey, string> = {
  up: 'describe.wing.headerUp',
  down: 'describe.wing.headerDown',
  left: 'describe.wing.headerLeft',
  right: 'describe.wing.headerRight',
}

function describeWing(
  key: WingKey,
  wing: Wing,
  ppm: PixelsPerMrad,
  rasterStrategy: Reticle['rasterization'],
  t: TFunction,
): string[] {
  const lines: string[] = []
  const header = t(wingHeaderKey[key])
  if (!wing.enabled) {
    lines.push(`${header}: ${t('describe.wing.disabled')}`)
    return lines
  }

  const axisPpm = key === 'up' || key === 'down' ? ppm.v : ppm.h
  const isHorizontal = key === 'left' || key === 'right'

  lines.push(header)

  if (!wing.dots.enabled || wing.dots.spacing <= 0) {
    lines.push('  ' + t('describe.wing.dotsDisabled'))
    return lines
  }

  lines.push('  ' + t('describe.wing.dotKind', {
    label: t(`wings.dotKindLabel.${isHorizontal ? 'h' : 'v'}.${wing.dots.kind}`),
  }))

  const spacingPx = wing.dots.spacing * axisPpm
  const count = effectiveDotCount(wing)
  lines.push('  ' + t('describe.wing.spacing', { mrad: fmt(wing.dots.spacing), px: fmt(spacingPx, 2) }))
  lines.push('  ' + t('describe.wing.count', { count }))

  if (count > 0) {
    const marks = rasterize(rasterStrategy, wing.dots.spacing, axisPpm, count)
    let maxErrPx = 0
    let minStep = Infinity
    let maxStep = -Infinity
    for (const m of marks) {
      const e = Math.abs(m.errorPx)
      if (e > maxErrPx) maxErrPx = e
      if (m.stepPx < minStep) minStep = m.stepPx
      if (m.stepPx > maxStep) maxStep = m.stepPx
    }
    lines.push('  ' + t('describe.wing.maxError', { px: fmt(maxErrPx, 2) }))
    if (minStep === maxStep) {
      lines.push('  ' + t('describe.wing.step', { step: minStep }))
    } else {
      lines.push('  ' + t('describe.wing.stepRange', { min: minStep, max: maxStep }))
    }
  }
  return lines
}

export function describeReticle(
  scope: ScopeProfile,
  reticle: Reticle,
  ppm: PixelsPerMrad,
  magnification: number,
  t: TFunction,
): string {
  const lines: string[] = []

  // Scope section
  lines.push(t('describe.scope.header'))
  lines.push('  ' + t('describe.scope.name', { name: scope.name }))
  lines.push('  ' + t(scope.type === 'digital' ? 'describe.scope.typeDigital' : 'describe.scope.typeOptical'))
  if (scope.type === 'digital') {
    lines.push('  ' + t('describe.scope.lensFL', { value: fmt(scope.lensFL) }))
    lines.push('  ' + t('describe.scope.sensor', { w: scope.sensorResX, h: scope.sensorResY }))
    lines.push('  ' + t('describe.scope.pixelPitch', { value: fmt(scope.pixelPitch) }))
  } else {
    lines.push('  ' + t('describe.scope.fovDegrees', { value: fmt(scope.fovDegrees) }))
  }
  lines.push('  ' + t('describe.scope.display', { w: scope.displayResX, h: scope.displayResY }))
  lines.push('  ' + t('describe.scope.ppm', { h: fmt(ppm.h, 3), v: fmt(ppm.v, 3) }))
  // 1 пиксель в MRAD и в миллиметрах на 100 м (1 MRAD ≈ 100 мм / 100 м).
  const pxMradH = ppm.h > 0 ? 1 / ppm.h : 0
  const pxMradV = ppm.v > 0 ? 1 / ppm.v : 0
  lines.push('  ' + t('describe.scope.clickValue', {
    mradH: fmt(pxMradH, 4),
    mradV: fmt(pxMradV, 4),
    mmH: fmt(pxMradH * 100, 2),
    mmV: fmt(pxMradV * 100, 2),
  }))
  const fov = getFovMrad(scope)
  lines.push('  ' + t('describe.scope.fovMrad', { h: fmt(fov.h, 2), v: fmt(fov.v, 2) }))
  if (!isSquarePixelRatio(ppm)) {
    lines.push('  ' + t('describe.scope.nonSquare'))
  }
  lines.push('')

  // Reticle section
  lines.push(t('describe.reticle.header'))
  lines.push('  ' + t('describe.reticle.color', { color: reticle.color }))
  lines.push('  ' + t('describe.reticle.focalPlane', {
    plane: t(reticle.focalPlane === 'ffp' ? 'describe.reticle.ffp' : 'describe.reticle.sfp'),
  }))
  if (reticle.focalPlane === 'ffp' && magnification !== 1) {
    lines.push('  ' + t('describe.reticle.magnification', { value: fmt(magnification, 2) }))
  }
  lines.push('  ' + t('describe.reticle.rasterization', {
    strategy: t(reticle.rasterization === 'independent' ? 'strategyFull.independentLabel' : 'strategyFull.fixedStepLabel'),
  }))
  lines.push('  ' + t('describe.reticle.centerDot', {
    label: t(`centerDot.kindLabel.${reticle.centerDot.kind}`),
  }))
  lines.push('')

  // Reference ring — own section, only when enabled.
  if (reticle.refCircle.enabled && reticle.refCircle.diameterMrad > 0) {
    const d = reticle.refCircle.diameterMrad
    const diameterPx = d * ppm.h
    const radiusPx = diameterPx / 2
    const ringPixels = referenceCirclePixels(radiusPx)
    let maxErrPx = 0
    for (const p of ringPixels) {
      const cxp = p.x + 0.5
      const cyp = p.y + 0.5
      const dist = Math.sqrt(cxp * cxp + cyp * cyp)
      const err = Math.abs(dist - radiusPx)
      if (err > maxErrPx) maxErrPx = err
    }
    lines.push(t('describe.refCircle.header'))
    lines.push('  ' + t('describe.refCircle.diameter', {
      mrad: fmt(d, 2),
      m: fmt(d * 0.1, 2),
      px: fmt(diameterPx, 2),
    }))
    lines.push('  ' + t('describe.refCircle.litPixels', { count: ringPixels.length }))
    lines.push('  ' + t('describe.refCircle.maxError', { px: fmt(maxErrPx, 2) }))
    lines.push('')
  }

  // Wings
  const wingKeys: WingKey[] = ['up', 'down', 'left', 'right']
  let totalMarks = 0
  let globalMaxErr = 0
  for (const k of wingKeys) {
    const wing = reticle.wings[k]
    const wingLines = describeWing(k, wing, ppm, reticle.rasterization, t)
    lines.push(...wingLines)
    lines.push('')
    {
      const axisPpm = k === 'up' || k === 'down' ? ppm.v : ppm.h
      const count = effectiveDotCount(wing)
      if (count > 0) {
        totalMarks += count
        const marks = rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count)
        for (const m of marks) {
          const e = Math.abs(m.errorPx)
          if (e > globalMaxErr) globalMaxErr = e
        }
      }
    }
  }

  // Summary
  lines.push(t('describe.summary.header'))
  lines.push('  ' + t('describe.summary.totalMarks', { count: totalMarks }))
  lines.push('  ' + t('describe.summary.maxError', { px: fmt(globalMaxErr, 2) }))

  // Footer — project attribution
  lines.push('')
  lines.push('—')
  lines.push(t('describe.footer', { version: __APP_VERSION__, url: PROJECT_URL }))

  return lines.join('\n')
}
