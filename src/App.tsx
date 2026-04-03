import { useState, useCallback, useMemo, useEffect } from 'react'
import type { ScopeProfile } from './types/scope'
import type { Reticle } from './types/reticle'
import { defaultScope, defaultReticle } from './defaults'
import { saveToJson } from './utils/fileIO'
import { calcPixelsPerMrad } from './math/optics'
import { findBestStrategy } from './math/bestStrategy'
import { useKeyboard } from './hooks/useKeyboard'
import TopBar from './components/layout/TopBar'
import Toolbar from './components/layout/Toolbar'
import LeftPanel from './components/layout/LeftPanel'
import Canvas from './components/layout/Canvas'
import RightPanel from './components/layout/RightPanel'
import './global.css'

export type WingKey = 'up' | 'down' | 'left' | 'right'

const STORAGE_KEY = 'reticle-editor-state'

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        scope: { ...defaultScope, ...parsed.scope },
        reticle: { ...defaultReticle, ...parsed.reticle },
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
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])
  const bestStrategy = useMemo(() => findBestStrategy(reticle, ppm), [reticle, ppm])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ scope, reticle }))
    } catch {}
  }, [scope, reticle])

  const handleSave = useCallback(() => {
    saveToJson(scope, reticle)
  }, [scope, reticle])

  useKeyboard({ onSave: handleSave })

  return (
    <div className="app">
      <TopBar scope={scope} reticle={reticle} setScope={setScope} setReticle={setReticle} />
      <Toolbar scope={scope} setScope={setScope} reticle={reticle} setReticle={setReticle} ppm={ppm} bestStrategy={bestStrategy} />
      <div className="app-body">
        <LeftPanel
          reticle={reticle} setReticle={setReticle}
          ppm={ppm}
          activeWing={activeWing} setActiveWing={setActiveWing}
        />
        <Canvas scope={scope} reticle={reticle} bestStrategy={bestStrategy} />
        <RightPanel
          scope={scope} reticle={reticle}
          activeWing={activeWing} setActiveWing={setActiveWing}
        />
      </div>
    </div>
  )
}
