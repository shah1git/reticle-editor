import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import type { RasterMark } from '../types/rasterization'
import { calcPixelsPerMrad } from '../math/optics'
import { rasterize, effectiveDotCount } from '../math/rasterization'
import { buildRenderManifest, RENDER_README, type RenderManifest } from './renderManifest'
import { migrateReticle } from './migrateReticle'
import { getSaveFilePicker } from '../types/fileSystemAccess'

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

const JSON_FILE_TYPES = [
  { description: 'Reticle JSON', accept: { 'application/json': ['.json'] } },
]

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

/** Auto-generated filename used when the user hasn't picked one yet. */
export function defaultReticleFileName(scope: ScopeProfile): string {
  return `сетка-${scope.name.replace(/\s+/g, '_')}.json`
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
  const fallbackName = suggestedName ?? defaultReticleFileName(scope)

  const picker = getSaveFilePicker()
  if (picker) {
    try {
      const handle = await picker({ suggestedName: fallbackName, types: JSON_FILE_TYPES })
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
    const data = JSON.parse(reader.result as string) as { scopeProfile?: ScopeProfile; reticle?: unknown }
    if (data.scopeProfile) setScope(data.scopeProfile)
    if (data.reticle) setReticle(migrateReticle(data.reticle))
  }
  reader.readAsText(file)
}
