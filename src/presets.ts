import type { Reticle, Wing } from './types/reticle'

export type PresetId = 'hunting' | 'fine' | 'longRange' | 'milGrid' | 'windBias' | 'minDot'

export interface ReticlePreset {
  id: PresetId
  reticle: Reticle
}

const BASE_COLOR = '#00ff88'

const noRefCircle = { enabled: false, diameterMrad: 10 }

const wing = (count: number, spacing: number, kind: Wing['dots']['kind']): Wing => ({
  enabled: count > 0,
  dots: { enabled: true, spacing, count, kind },
})

const offWing = (): Wing => ({
  enabled: false,
  dots: { enabled: true, spacing: 1, count: 0, kind: 'pair' },
})

export const PRESETS: ReticlePreset[] = [
  {
    id: 'hunting',
    reticle: {
      centerDot: { kind: 'square4' },
      wings: {
        up: offWing(),
        down: wing(10, 1.0, 'pair'),
        left: wing(5, 1.0, 'pair'),
        right: wing(5, 1.0, 'pair'),
      },
      color: BASE_COLOR,
      rasterization: 'independent',
      focalPlane: 'ffp',
      refCircle: noRefCircle,
    },
  },
  {
    id: 'fine',
    reticle: {
      centerDot: { kind: 'pixelBR' },
      wings: {
        up: offWing(),
        down: wing(8, 0.5, 'single'),
        left: wing(4, 0.5, 'single'),
        right: wing(4, 0.5, 'single'),
      },
      color: BASE_COLOR,
      rasterization: 'independent',
      focalPlane: 'ffp',
      refCircle: noRefCircle,
    },
  },
  {
    id: 'longRange',
    reticle: {
      centerDot: { kind: 'square2' },
      wings: {
        up: offWing(),
        down: wing(15, 1.0, 'pair'),
        left: wing(3, 1.0, 'pair'),
        right: wing(3, 1.0, 'pair'),
      },
      color: BASE_COLOR,
      rasterization: 'independent',
      focalPlane: 'ffp',
      refCircle: noRefCircle,
    },
  },
  {
    id: 'milGrid',
    reticle: {
      centerDot: { kind: 'square4' },
      wings: {
        up: wing(8, 1.0, 'pair'),
        down: wing(8, 1.0, 'pair'),
        left: wing(8, 1.0, 'pair'),
        right: wing(8, 1.0, 'pair'),
      },
      color: BASE_COLOR,
      rasterization: 'independent',
      focalPlane: 'ffp',
      refCircle: noRefCircle,
    },
  },
  {
    id: 'windBias',
    reticle: {
      centerDot: { kind: 'square2' },
      wings: {
        up: wing(2, 1.0, 'pair'),
        down: wing(10, 1.0, 'pair'),
        left: wing(10, 0.5, 'pair'),
        right: wing(10, 0.5, 'pair'),
      },
      color: BASE_COLOR,
      rasterization: 'independent',
      focalPlane: 'ffp',
      refCircle: noRefCircle,
    },
  },
  {
    id: 'minDot',
    reticle: {
      centerDot: { kind: 'pixelTL' },
      wings: {
        up: offWing(),
        down: offWing(),
        left: offWing(),
        right: offWing(),
      },
      color: BASE_COLOR,
      rasterization: 'independent',
      focalPlane: 'ffp',
      refCircle: noRefCircle,
    },
  },
]

export function reticleMatchesPreset(reticle: Reticle, preset: Reticle): boolean {
  if (reticle.centerDot.kind !== preset.centerDot.kind) return false
  if (reticle.color !== preset.color) return false
  if (reticle.rasterization !== preset.rasterization) return false
  if (reticle.focalPlane !== preset.focalPlane) return false
  if (reticle.refCircle.enabled !== preset.refCircle.enabled) return false
  if (reticle.refCircle.diameterMrad !== preset.refCircle.diameterMrad) return false
  for (const k of ['up', 'down', 'left', 'right'] as const) {
    const a = reticle.wings[k]
    const b = preset.wings[k]
    if (a.enabled !== b.enabled) return false
    if (a.dots.enabled !== b.dots.enabled) return false
    if (a.dots.spacing !== b.dots.spacing) return false
    if (a.dots.count !== b.dots.count) return false
    if (a.dots.kind !== b.dots.kind) return false
  }
  return true
}
