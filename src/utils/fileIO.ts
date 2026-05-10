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

function buildSaveJson(scope: ScopeProfile, reticle: Reticle): string {
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

  return JSON.stringify(data, null, 2)
}

function downloadJson(json: string, fileName: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

export function saveToJson(scope: ScopeProfile, reticle: Reticle): void {
  downloadJson(buildSaveJson(scope, reticle), `сетка-${scope.name.replace(/\s+/g, '_')}.json`)
}

interface ShowSaveFilePicker {
  (options?: {
    suggestedName?: string
    types?: { description?: string; accept: Record<string, string[]> }[]
    excludeAcceptAllOption?: boolean
  }): Promise<FileSystemFileHandle>
}

export interface SaveAsResult {
  /** Filename the user picked (may differ from suggested). */
  fileName: string
  /** File handle for in-place overwrite, when the browser supports it. */
  handle: FileSystemFileHandle | null
  /** True if user cancelled the dialog (nothing was saved). */
  cancelled: boolean
}

/**
 * Show a save-file dialog and write the JSON to the user-picked location.
 * Falls back to a regular download with an auto-generated name in browsers
 * without File System Access API (Firefox/Safari) — which means the result's
 * `handle` will be null and `fileName` will be the suggested name.
 */
export async function saveAsJson(
  scope: ScopeProfile,
  reticle: Reticle,
  suggestedName?: string,
): Promise<SaveAsResult> {
  const json = buildSaveJson(scope, reticle)
  const fallbackName = suggestedName ?? `сетка-${scope.name.replace(/\s+/g, '_')}.json`

  const picker = (window as unknown as { showSaveFilePicker?: ShowSaveFilePicker }).showSaveFilePicker
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: fallbackName,
        types: [{ description: 'Reticle JSON', accept: { 'application/json': ['.json'] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(json)
      await writable.close()
      const file = await handle.getFile()
      return { fileName: file.name, handle, cancelled: false }
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') {
        return { fileName: fallbackName, handle: null, cancelled: true }
      }
      console.warn('Falling back to download — showSaveFilePicker failed', err)
    }
  }

  downloadJson(json, fallbackName)
  return { fileName: fallbackName, handle: null, cancelled: false }
}

/**
 * Save under the originally-loaded filename. If a FileSystemFileHandle is
 * available (Chromium browsers via showOpenFilePicker / DnD), writes back to
 * the original file in place. Otherwise falls back to a regular download with
 * the same filename — the user must overwrite manually.
 */
export async function saveToCurrentFile(
  scope: ScopeProfile,
  reticle: Reticle,
  fileName: string,
  handle: FileSystemFileHandle | null,
): Promise<'overwritten' | 'downloaded'> {
  const json = buildSaveJson(scope, reticle)

  if (handle) {
    try {
      const writable = await handle.createWritable()
      await writable.write(json)
      await writable.close()
      return 'overwritten'
    } catch (e) {
      console.warn('Falling back to download — could not write to file handle', e)
    }
  }
  downloadJson(json, fileName)
  return 'downloaded'
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
      const knownCenterKinds = ['square4', 'square2', 'pixelBR', 'pixelTL']
      r.centerDot = { kind: knownCenterKinds.includes(cdKind) ? cdKind : 'square4' }
      const rc = r.refCircle as { enabled?: unknown; diameterMrad?: unknown } | undefined
      r.refCircle = {
        enabled: typeof rc?.enabled === 'boolean' ? rc.enabled : false,
        diameterMrad: typeof rc?.diameterMrad === 'number' && rc.diameterMrad > 0 ? rc.diameterMrad : 10,
      }
      r.customPixels = Array.isArray(r.customPixels)
        ? r.customPixels.filter((p: unknown) => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number')
        : []
      delete r.mode
      delete r.focalPlane
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
