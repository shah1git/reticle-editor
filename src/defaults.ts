import type { ScopeProfile } from './types/scope'
import type { Reticle, Wing } from './types/reticle'

const defaultWing = (length: number): Wing => ({
  enabled: true,
  length,
  dots: {
    enabled: true,
    spacing: 1.0,
    maxDots: 0,
    kind: 'pair',
  },
})

export const defaultScope: ScopeProfile = {
  type: 'digital',
  name: 'По умолчанию',
  lensFL: 35,
  sensorResX: 384,
  sensorResY: 288,
  displayResX: 1024,
  displayResY: 768,
  pixelPitch: 12,
  fovDegrees: 7.5,
  tubeDiameter: 30,
}

export const defaultReticle: Reticle = {
  centerDot: { kind: 'square4' },
  wings: {
    up: { enabled: false, length: 0, dots: { enabled: true, spacing: 1.0, maxDots: 0, kind: 'pair' } },
    down: defaultWing(10.0),
    left: defaultWing(5.0),
    right: defaultWing(5.0),
  },
  color: '#00ff88',
  rasterization: 'independent',
  focalPlane: 'ffp' as const,
}
