import type { ScopeProfile } from './types/scope'
import type { Reticle, Wing } from './types/reticle'

const defaultWing = (length: number): Wing => ({
  enabled: true,
  length,
  lineThickness: 0.1,
  dots: {
    enabled: true,
    spacing: 1.0,
    radius: 0.1,
  },
})

export const defaultScope: ScopeProfile = {
  type: 'digital',
  name: 'Default Thermal',
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
  centerDot: { radius: 0.15 },
  wings: {
    left: defaultWing(5.0),
    right: defaultWing(5.0),
    down: defaultWing(10.0),
  },
  color: '#00ff88',
  rasterization: 'independent',
}
