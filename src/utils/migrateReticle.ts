import type { Reticle, CenterMarkKind, WingDotKind } from '../types/reticle'
import type { ScopeProfile } from '../types/scope'
import { defaultReticle, defaultScope } from '../defaults'

/**
 * Drop legacy fields from a saved scope profile so it matches the current
 * schema. Currently strips `type`, `fovDegrees`, `tubeDiameter` — leftovers
 * from the optical/digital switch that existed before the thermal-only split.
 */
export function migrateScope(raw: unknown): ScopeProfile {
  const merged = { ...defaultScope, ...(raw as object | null ?? {}) } as ScopeProfile & Record<string, unknown>
  delete merged.type
  delete merged.fovDegrees
  delete merged.tubeDiameter
  return merged as ScopeProfile
}


const KNOWN_CENTER_KINDS: readonly CenterMarkKind[] = ['square4', 'square2', 'pixelBR', 'pixelTL']

/**
 * Normalize a possibly-stale reticle object (from JSON file or localStorage)
 * into the current schema. Used as the single source of truth for migrations
 * — both fileIO.loadFromJson and App.loadState route through here.
 *
 * Tolerates partial objects, drops legacy fields (`mode`, `focalPlane`,
 * `wing.length/dotSize/lineThickness`), and supplies safe defaults for
 * anything missing.
 */
export function migrateReticle(raw: unknown): Reticle {
  const base = { ...defaultReticle, ...(raw as object | null ?? {}) } as Reticle & Record<string, unknown>

  // Drop legacy top-level fields that are no longer part of the schema.
  delete base.mode
  delete base.focalPlane

  // Center dot: snap to a known kind, fall back to square4.
  const cd = base.centerDot as { kind?: string } | undefined
  base.centerDot = {
    kind: cd?.kind && (KNOWN_CENTER_KINDS as readonly string[]).includes(cd.kind)
      ? cd.kind as CenterMarkKind
      : 'square4',
  }

  // Reference ring: enabled flag must be boolean, diameter must be positive.
  const rc = base.refCircle as { enabled?: unknown; diameterMrad?: unknown } | undefined
  base.refCircle = {
    enabled: typeof rc?.enabled === 'boolean' ? rc.enabled : false,
    diameterMrad: typeof rc?.diameterMrad === 'number' && rc.diameterMrad > 0 ? rc.diameterMrad : 10,
  }

  // Custom-painted pixels: keep only well-formed [number, number] entries.
  const savedPixels = (base as { customPixels?: unknown }).customPixels
  base.customPixels = Array.isArray(savedPixels)
    ? savedPixels.filter((p): p is [number, number] =>
        Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number')
    : []

  // Wings: normalize dot config; migrate legacy maxDots / length-based count.
  for (const k of ['up', 'down', 'left', 'right'] as const) {
    const w = base.wings?.[k] as
      | { dots?: { kind?: string; count?: number; maxDots?: number; enabled?: boolean; spacing?: number };
          length?: number; dotSize?: number; lineThickness?: number }
      | undefined
    if (!w) continue
    const dots = (w.dots ?? {}) as { kind?: string; count?: number; maxDots?: number; enabled?: boolean; spacing?: number }
    const spacing = dots.spacing ?? 1
    let count = dots.count
    if (count == null) {
      if (dots.maxDots != null && dots.maxDots > 0) count = dots.maxDots
      else if (w.length != null && w.length > 0 && spacing > 0) count = Math.floor(w.length / spacing)
      else count = 0
    }
    w.dots = {
      enabled: dots.enabled ?? true,
      spacing,
      count,
      kind: (dots.kind === 'single' ? 'single' : 'pair') as WingDotKind,
    }
    if ('length' in w) delete (w as Record<string, unknown>).length
    if ('dotSize' in w) delete (w as Record<string, unknown>).dotSize
    if ('lineThickness' in w) delete (w as Record<string, unknown>).lineThickness
  }

  return base as Reticle
}
