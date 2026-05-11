import type { ScopeProfile } from './types/scope'
import type { Primitive, Reticle } from './types/reticle'

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

/**
 * Endpoints for a new line that won't sit on top of the previous one.
 * Each subsequent line is dropped 0.5 mrad below the last (y decreases in
 * shooter convention is downward, so we add to data y which renders flipped).
 */
export function nextLineEndpoints(
  primitives: Primitive[],
): { x1: number; y1: number; x2: number; y2: number } {
  const lines = primitives.filter(
    (p): p is Extract<Primitive, { type: 'line' }> => p.type === 'line',
  )
  if (lines.length === 0) return { x1: -1, y1: 0, x2: 1, y2: 0 }
  const last = lines[lines.length - 1]
  return { x1: last.x1, y1: last.y1 + 0.5, x2: last.x2, y2: last.y2 + 0.5 }
}

/** Same trick for dots — successive adds step 0.5 mrad to the right of the previous. */
export function nextDotPosition(
  primitives: Primitive[],
): { x: number; y: number } {
  const dots = primitives.filter(
    (p): p is Extract<Primitive, { type: 'dot' }> => p.type === 'dot',
  )
  if (dots.length === 0) return { x: 0, y: 0 }
  const last = dots[dots.length - 1]
  return { x: last.x + 0.5, y: last.y }
}
