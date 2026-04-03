import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import type { RasterMark } from '../types/rasterization'
import { calcPixelsPerMrad } from '../math/optics'
import { rasterize } from '../math/rasterization'

interface SaveData {
  version: 1
  unit: 'MRAD'
  scopeProfile: ScopeProfile
  reticle: Reticle
  rasterization: {
    up: RasterMark[]
    down: RasterMark[]
    left: RasterMark[]
    right: RasterMark[]
  }
}

export function saveToJson(scope: ScopeProfile, reticle: Reticle): void {
  const ppm = calcPixelsPerMrad(scope)

  const buildMarks = (wingKey: 'up' | 'down' | 'left' | 'right'): RasterMark[] => {
    const wing = reticle.wings[wingKey]
    if (!wing.enabled || wing.length <= 0 || !wing.dots.enabled || wing.dots.spacing <= 0) return []
    const axisPpm = (wingKey === 'down' || wingKey === 'up') ? ppm.v : ppm.h
    const count = Math.floor(wing.length / wing.dots.spacing)
    return rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count)
  }

  const data: SaveData = {
    version: 1,
    unit: 'MRAD',
    scopeProfile: scope,
    reticle,
    rasterization: {
      up: buildMarks('up'),
      down: buildMarks('down'),
      left: buildMarks('left'),
      right: buildMarks('right'),
    },
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `сетка-${scope.name.replace(/\s+/g, '_')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function loadFromJson(
  file: File,
  setScope: (s: ScopeProfile) => void,
  setReticle: (r: Reticle) => void,
): void {
  const reader = new FileReader()
  reader.onload = () => {
    const data = JSON.parse(reader.result as string) as any
    if (data.scopeProfile) setScope(data.scopeProfile)
    if (data.reticle) {
      const r = data.reticle as any
      // Backward compat: convert old dots.radius to new dotSize
      for (const key of ['up', 'down', 'left', 'right']) {
        const w = r.wings?.[key]
        if (!w) continue
        if (w.dotSize == null) {
          // Old format had dots.radius in MRAD — convert to pixel diameter
          if (w.dots?.radius != null) {
            const ppm = data.scopeProfile ? calcPixelsPerMrad(data.scopeProfile) : { h: 7.78, v: 7.78 }
            const axisPpm = (key === 'up' || key === 'down') ? ppm.v : ppm.h
            w.dotSize = Math.max(1, Math.round(w.dots.radius * axisPpm * 2))
          } else {
            w.dotSize = 2
          }
        }
        // Clean up old radius field
        if (w.dots?.radius != null) {
          delete w.dots.radius
        }
      }
      setReticle(r as Reticle)
    }
  }
  reader.readAsText(file)
}
