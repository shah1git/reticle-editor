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
    left: RasterMark[]
    right: RasterMark[]
    down: RasterMark[]
  }
}

export function saveToJson(scope: ScopeProfile, reticle: Reticle): void {
  const ppm = calcPixelsPerMrad(scope)

  const buildMarks = (wingKey: 'left' | 'right' | 'down'): RasterMark[] => {
    const wing = reticle.wings[wingKey]
    if (!wing.enabled || !wing.dots.enabled || wing.dots.spacing <= 0) return []
    const axisPpm = wingKey === 'down' ? ppm.v : ppm.h
    const count = Math.floor(wing.length / wing.dots.spacing)
    return rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count)
  }

  const data: SaveData = {
    version: 1,
    unit: 'MRAD',
    scopeProfile: scope,
    reticle,
    rasterization: {
      left: buildMarks('left'),
      right: buildMarks('right'),
      down: buildMarks('down'),
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
    const data = JSON.parse(reader.result as string) as SaveData
    if (data.scopeProfile) setScope(data.scopeProfile)
    if (data.reticle) setReticle(data.reticle)
  }
  reader.readAsText(file)
}
