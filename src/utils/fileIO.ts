import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import type { RasterMark } from '../types/rasterization'
import { calcPixelsPerMrad } from '../math/optics'
import { rasterize, effectiveDotCount } from '../math/rasterization'
import { buildRenderManifest, RENDER_README, type RenderManifest } from './renderManifest'

interface SaveData {
  _readme: string
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
  renderManifest: RenderManifest
}

export function saveToJson(scope: ScopeProfile, reticle: Reticle): void {
  const ppm = calcPixelsPerMrad(scope)

  const buildMarks = (wingKey: 'up' | 'down' | 'left' | 'right'): RasterMark[] => {
    const wing = reticle.wings[wingKey]
    const count = effectiveDotCount(wing)
    if (count <= 0) return []
    const axisPpm = (wingKey === 'down' || wingKey === 'up') ? ppm.v : ppm.h
    return rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count)
  }

  const data: SaveData = {
    _readme: RENDER_README,
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
    renderManifest: buildRenderManifest(scope, reticle),
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
      const cdKind = (r.centerDot && (r.centerDot as { kind?: string }).kind) || 'square4'
      r.centerDot = { kind: cdKind === 'square2' ? 'square2' : 'square4' }
      for (const key of ['up', 'down', 'left', 'right']) {
        const w = r.wings?.[key]
        if (!w) continue
        const dots = w.dots ?? {}
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
          kind: dots.kind === 'single' ? 'single' : 'pair',
        }
        if ('length' in w) delete w.length
        if ('dotSize' in w) delete w.dotSize
        if ('lineThickness' in w) delete w.lineThickness
      }
      setReticle(r as Reticle)
    }
  }
  reader.readAsText(file)
}
