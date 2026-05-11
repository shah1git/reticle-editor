import type { ScopeProfile } from './types/scope'
import type { Reticle } from './types/reticle'

export const defaultScope: ScopeProfile = {
  type: 'FFP',
  eyepieceFL: 80,
  glassDiameter: 30,
  glassThickness: 1.0,
  minLineWidth: 0.03,
  minGap: 0.05,
}

export const emptyReticle: Reticle = {
  name: 'Untitled',
  scope: defaultScope,
  primitives: [],
}
