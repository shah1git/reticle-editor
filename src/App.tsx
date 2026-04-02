import { useState } from 'react'
import type { ScopeProfile } from './types/scope'
import type { Reticle } from './types/reticle'
import { defaultScope, defaultReticle } from './defaults'
import TopBar from './components/layout/TopBar'
import LeftPanel from './components/layout/LeftPanel'
import Canvas from './components/layout/Canvas'
import RightPanel from './components/layout/RightPanel'
import './global.css'

export default function App() {
  const [scope, setScope] = useState<ScopeProfile>(defaultScope)
  const [reticle, setReticle] = useState<Reticle>(defaultReticle)

  return (
    <div className="app">
      <TopBar scope={scope} reticle={reticle} setScope={setScope} setReticle={setReticle} />
      <div className="app-body">
        <LeftPanel scope={scope} setScope={setScope} reticle={reticle} setReticle={setReticle} />
        <Canvas scope={scope} reticle={reticle} />
        <RightPanel scope={scope} reticle={reticle} />
      </div>
    </div>
  )
}
