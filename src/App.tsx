import { useState, useCallback, useMemo } from 'react'
import type { ScopeProfile } from './types/scope'
import type { Reticle } from './types/reticle'
import { defaultScope, defaultReticle } from './defaults'
import { saveToJson } from './utils/fileIO'
import { calcPixelsPerMrad } from './math/optics'
import { useKeyboard } from './hooks/useKeyboard'
import TopBar from './components/layout/TopBar'
import Toolbar from './components/layout/Toolbar'
import LeftPanel from './components/layout/LeftPanel'
import Canvas from './components/layout/Canvas'
import BottomPanel from './components/layout/BottomPanel'
import './global.css'

export type WingKey = 'up' | 'down' | 'left' | 'right'

export default function App() {
  const [scope, setScope] = useState<ScopeProfile>(defaultScope)
  const [reticle, setReticle] = useState<Reticle>(defaultReticle)
  const [activeWing, setActiveWing] = useState<WingKey>('down')
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])

  const handleSave = useCallback(() => {
    saveToJson(scope, reticle)
  }, [scope, reticle])

  useKeyboard({ onSave: handleSave })

  return (
    <div className="app">
      <TopBar scope={scope} reticle={reticle} setScope={setScope} setReticle={setReticle} />
      <Toolbar scope={scope} setScope={setScope} reticle={reticle} setReticle={setReticle} ppm={ppm} />
      <div className="app-main">
        <div className="app-top">
          <LeftPanel
            reticle={reticle} setReticle={setReticle}
            ppm={ppm}
            activeWing={activeWing} setActiveWing={setActiveWing}
          />
          <Canvas scope={scope} reticle={reticle} />
        </div>
        <BottomPanel
          scope={scope} reticle={reticle}
          activeWing={activeWing} setActiveWing={setActiveWing}
        />
      </div>
    </div>
  )
}
