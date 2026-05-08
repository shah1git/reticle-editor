import { useState, useCallback, useMemo, useEffect } from 'react'
import type { ScopeProfile } from './types/scope'
import type { Reticle } from './types/reticle'
import { defaultScope, defaultReticle } from './defaults'
import { saveToJson } from './utils/fileIO'
import { calcPixelsPerMrad } from './math/optics'
import { findBestStrategy } from './math/bestStrategy'
import { useKeyboard } from './hooks/useKeyboard'
import { useIsMobile } from './hooks/useIsMobile'
import TopBar from './components/layout/TopBar'
import Toolbar from './components/layout/Toolbar'
import LeftPanel from './components/layout/LeftPanel'
import Canvas from './components/layout/Canvas'
import RightPanel from './components/layout/RightPanel'
import MobileLayout from './components/layout/MobileLayout'
import './global.css'

export type WingKey = 'up' | 'down' | 'left' | 'right'

const STORAGE_KEY = 'reticle-editor-state'

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const reticle = { ...defaultReticle, ...parsed.reticle } as Reticle
      // Migrate to kind-based shape variants. Older states stored
      // centerDot.radius / centerDot.diameter and wing.dotSize — those are
      // dropped now; we keep the user's reticle layout and snap shapes to
      // the supported variants ('square4'/'square2' for center, 'pair' for wings).
      const cd = reticle.centerDot as { kind?: string; radius?: number; diameter?: number } | undefined
      if (!cd || (cd.kind !== 'square4' && cd.kind !== 'square2')) {
        reticle.centerDot = { kind: 'square4' }
      } else {
        reticle.centerDot = { kind: cd.kind }
      }
      for (const k of ['up', 'down', 'left', 'right'] as const) {
        const w = reticle.wings?.[k] as
          | { dots?: { kind?: string; count?: number; maxDots?: number; enabled?: boolean; spacing?: number }
              ; length?: number; dotSize?: number; lineThickness?: number }
          | undefined
        if (!w) continue
        const dots = (w.dots ?? {}) as { kind?: string; count?: number; maxDots?: number; enabled?: boolean; spacing?: number }
        const enabled = dots.enabled ?? true
        const spacing = dots.spacing ?? 1
        // count = explicit count, otherwise migrated from maxDots, otherwise from length/spacing.
        let count = dots.count
        if (count == null) {
          if (dots.maxDots != null && dots.maxDots > 0) count = dots.maxDots
          else if (w.length != null && w.length > 0 && spacing > 0) count = Math.floor(w.length / spacing)
          else count = 0
        }
        const dotKind = dots.kind === 'single' ? 'single' : 'pair'
        w.dots = { enabled, spacing, count, kind: dotKind }
        if ('length' in w) delete (w as Record<string, unknown>).length
        if ('dotSize' in w) delete (w as Record<string, unknown>).dotSize
        if ('lineThickness' in w) delete (w as Record<string, unknown>).lineThickness
      }
      return {
        scope: { ...defaultScope, ...parsed.scope },
        reticle,
      }
    }
  } catch {}
  return { scope: defaultScope, reticle: defaultReticle }
}

const initial = loadState()

export default function App() {
  const [scope, setScope] = useState<ScopeProfile>(initial.scope)
  const [reticle, setReticle] = useState<Reticle>(initial.reticle)
  const [activeWing, setActiveWing] = useState<WingKey>('down')
  const [magnification, setMagnification] = useState(1)
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])

  const effectivePpm = useMemo(() => {
    if (reticle.focalPlane === 'ffp') {
      return { h: ppm.h * magnification, v: ppm.v * magnification }
    }
    return ppm
  }, [ppm, magnification, reticle.focalPlane])

  const bestStrategy = useMemo(() => findBestStrategy(reticle, effectivePpm), [reticle, effectivePpm])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ scope, reticle }))
    } catch {}
  }, [scope, reticle])

  const handleSave = useCallback(() => {
    saveToJson(scope, reticle)
  }, [scope, reticle])

  useKeyboard({ onSave: handleSave })
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <MobileLayout
        scope={scope} setScope={setScope}
        reticle={reticle} setReticle={setReticle}
        ppm={effectivePpm} bestStrategy={bestStrategy}
        activeWing={activeWing} setActiveWing={setActiveWing}
        magnification={magnification} setMagnification={setMagnification}
      />
    )
  }

  return (
    <div className="app">
      <TopBar scope={scope} reticle={reticle} setScope={setScope} setReticle={setReticle} ppm={effectivePpm} magnification={magnification} />
      <Toolbar scope={scope} setScope={setScope} reticle={reticle} setReticle={setReticle} ppm={effectivePpm} bestStrategy={bestStrategy} />
      <div className="app-body">
        <LeftPanel
          reticle={reticle} setReticle={setReticle}
          ppm={effectivePpm}
          activeWing={activeWing} setActiveWing={setActiveWing}
        />
        <Canvas
          scope={scope} reticle={reticle}
          ppm={effectivePpm}
          magnification={magnification} setMagnification={setMagnification}
        />
        <RightPanel
          reticle={reticle}
          ppm={effectivePpm}
          magnification={magnification}
          activeWing={activeWing} setActiveWing={setActiveWing}
        />
      </div>
    </div>
  )
}
