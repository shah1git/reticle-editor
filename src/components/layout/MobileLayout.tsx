import { useState } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { BestStrategyInfo } from '../../math/bestStrategy'
import type { WingKey } from '../../App'
import TopBar from './TopBar'
import Toolbar from './Toolbar'
import LeftPanel from './LeftPanel'
import Canvas from './Canvas'
import RightPanel from './RightPanel'
import MobileTabBar, { type MobileTab } from './MobileTabBar'
import styles from './MobileLayout.module.css'

interface Props {
  scope: ScopeProfile
  setScope: (s: ScopeProfile) => void
  reticle: Reticle
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
  bestStrategy: BestStrategyInfo
  activeWing: WingKey
  setActiveWing: (w: WingKey) => void
}

export default function MobileLayout({
  scope, setScope, reticle, setReticle,
  ppm, bestStrategy, activeWing, setActiveWing,
}: Props) {
  const [activeTab, setActiveTab] = useState<MobileTab>('canvas')

  return (
    <div className={styles.layout}>
      <TopBar scope={scope} reticle={reticle} setScope={setScope} setReticle={setReticle} />

      <div className={styles.content}>
        {activeTab === 'settings' && (
          <div className={styles.scrollPanel}>
            <Toolbar
              scope={scope} setScope={setScope}
              reticle={reticle} setReticle={setReticle}
              ppm={ppm} bestStrategy={bestStrategy}
            />
            <LeftPanel
              reticle={reticle} setReticle={setReticle}
              ppm={ppm}
              activeWing={activeWing} setActiveWing={setActiveWing}
            />
          </div>
        )}

        {activeTab === 'canvas' && (
          <div className={styles.canvasPanel}>
            <Canvas scope={scope} reticle={reticle} />
          </div>
        )}

        {activeTab === 'table' && (
          <div className={styles.scrollPanel}>
            <RightPanel
              scope={scope} reticle={reticle}
              activeWing={activeWing} setActiveWing={setActiveWing}
            />
          </div>
        )}
      </div>

      <MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}
