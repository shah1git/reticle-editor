import type { ScopeProfile } from './types/scope'
import { PRESETS } from './presets'

export const defaultScope: ScopeProfile = {
  name: 'По умолчанию',
  lensFL: 35,
  sensorResX: 384,
  sensorResY: 288,
  displayResX: 1024,
  displayResY: 768,
  pixelPitch: 12,
}

export const defaultReticle = PRESETS[0].reticle
