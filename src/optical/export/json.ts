import type { Reticle } from '../types/reticle'

export function serializeReticle(r: Reticle): string {
  return JSON.stringify(r, null, 2)
}

/**
 * Parse and structurally validate a saved reticle file. Returns null on any
 * shape mismatch — caller treats this as a silent no-op.
 */
export function deserializeReticle(json: string): Reticle | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const obj = parsed as Record<string, unknown>
  if (typeof obj.name !== 'string') return null
  if (!obj.scope || typeof obj.scope !== 'object') return null
  if (!Array.isArray(obj.primitives)) return null
  return parsed as Reticle
}
