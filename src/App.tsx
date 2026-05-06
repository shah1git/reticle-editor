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
      // the only currently available variants ('square4' and 'pair').
      const cd = reticle.centerDot as { kind?: string; radius?: number; diameter?: number } | undefined
      if (!cd || cd.kind !== 'square4') {
        reticle.centerDot = { kind: 'square4' }
      }
      for (const k of ['up', 'down', 'left', 'right'] as const) {
        const w = reticle.wings?.[k] as { dots?: { kind?: string; maxDots?: number; enabled?: boolean; spacing?: number }; dotSize?: number } | undefined
        if (!w) continue
        if (w.dots == null || w.dots.maxDots == null) {
          w.dots = { enabled: true, spacing: 1, ...(w.dots ?? {}), maxDots: 0 } as typeof w.dots
        }
        if (w.dots && w.dots.kind !== 'pair') {
          w.dots.kind = 'pair'
        }
        // dotSize was a separate field — drop it; new mark sizing is variant-driven
        if ('dotSize' in w) delete (w as Record<string, unknown>).dotSize
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
