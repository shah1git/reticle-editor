import { useState, useCallback } from 'react'
import type { ScopeProfile } from './types/scope'
import type { Reticle } from './types/reticle'
import { defaultScope, defaultReticle } from './defaults'
import { saveToJson } from './utils/fileIO'
import { useKeyboard } from './hooks/useKeyboard'
import TopBar from './components/layout/TopBar'
import LeftPanel from './components/layout/LeftPanel'
import Canvas from './components/layout/Canvas'
import RightPanel from './components/layout/RightPanel'
import './global.css'

export type WingKey = 'up' | 'down' | 'left' | 'right'

export default function App() {
  const [scope, setScope] = useState<ScopeProfile>(defaultScope)
  const [reticle, setReticle] = useState<Reticle>(defaultReticle)
  const [activeWing, setActiveWing] = useState<WingKey>('down')

  const handleSave = useCallback(() => {
    saveToJson(scope, reticle)
  }, [scope, reticle])

  useKeyboard({ onSave: handleSave })

  return (
    <div className="app">
      <TopBar scope={scope} reticle={reticle} setScope={setScope} setReticle={setReticle} />
      <div className="app-body">
        <LeftPanel
          scope={scope} setScope={setScope}
          reticle={reticle} setReticle={setReticle}
          activeWing={activeWing} setActiveWing={setActiveWing}
        />
        <Canvas scope={scope} reticle={reticle} />
        <RightPanel
          scope={scope} reticle={reticle}
          activeWing={activeWing} setActiveWing={setActiveWing}
        />
      </div>
    </div>
  )
}
