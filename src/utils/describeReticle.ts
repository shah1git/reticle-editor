import type { TFunction } from 'i18next'
import type { ScopeProfile } from '../types/scope'
import type { Reticle, Wing } from '../types/reticle'
import type { PixelsPerMrad } from '../math/optics'
import { getFovMrad, isSquarePixelRatio } from '../math/optics'
import { rasterize, effectiveDotCount } from '../math/rasterization'
import type { WingKey } from '../App'

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
  if (!wing.enabled || wing.length <= 0) {
    lines.push(`${header}: ${t('describe.wing.disabled')}`)
    return lines
  }

  const axisPpm = key === 'up' || key === 'down' ? ppm.v : ppm.h
  const lengthPx = Math.round(wing.length * axisPpm)
  const thicknessPx = Math.round(wing.lineThickness * axisPpm)
  const dotSizeMrad = wing.dotSize / axisPpm

  lines.push(header)
  lines.push('  ' + t('describe.wing.length', { mrad: fmt(wing.length), px: lengthPx }))
  if (wing.lineThickness > 0) {
    lines.push('  ' + t('describe.wing.lineThickness', { mrad: fmt(wing.lineThickness), px: thicknessPx }))
  } else {
    lines.push('  ' + t('describe.wing.noLine'))
  }
  lines.push('  ' + t('describe.wing.dotSize', { px: wing.dotSize, mrad: fmt(dotSizeMrad, 3) }))

  if (!wing.dots.enabled || wing.dots.spacing <= 0) {
    lines.push('  ' + t('describe.wing.dotsDisabled'))
    return lines
  }

  const spacingPx = wing.dots.spacing * axisPpm
  const naturalCount = Math.floor(wing.length / wing.dots.spacing)
  const count = effectiveDotCount(wing)
  lines.push('  ' + t('describe.wing.spacing', { mrad: fmt(wing.dots.spacing), px: fmt(spacingPx, 2) }))
  if (wing.dots.maxDots > 0 && naturalCount > wing.dots.maxDots) {
    lines.push('  ' + t('describe.wing.countCapped', { count, natural: naturalCount, cap: wing.dots.maxDots }))
  } else {
    lines.push('  ' + t('describe.wing.count', { count }))
  }

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
  if (reticle.centerDot.radius > 0) {
    const centerDiameterPx = Math.max(1, Math.round(reticle.centerDot.radius * 2 * ppm.h))
    lines.push('  ' + t('describe.reticle.centerDot', {
      mradRadius: fmt(reticle.centerDot.radius, 3),
      pxDiameter: centerDiameterPx,
    }))
  } else {
    lines.push('  ' + t('describe.reticle.centerDotDisabled'))
  }
  lines.push('')

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

  return lines.join('\n')
}
