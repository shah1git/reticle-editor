import { useState, type Dispatch, type SetStateAction } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { BestStrategyInfo } from '../../math/bestStrategy'
import type { WingKey } from '../../ThermalApp'
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
  setReticle: Dispatch<SetStateAction<Reticle>>
  ppm: PixelsPerMrad
  bestStrategy: BestStrategyInfo
  activeWing: WingKey
  setActiveWing: (w: WingKey) => void
  magnification: number
  setMagnification: (m: number) => void
  loadedFileName: string | null
  loadedFileHandle: FileSystemFileHandle | null
  onAcceptFile: (file: File, handle?: FileSystemFileHandle | null) => void
  onSave: () => void | Promise<void>
  onSaveAs: () => void | Promise<void>
}

export default function MobileLayout({
  scope, setScope, reticle, setReticle,
  ppm, bestStrategy, activeWing, setActiveWing,
  magnification, setMagnification,
  loadedFileName, loadedFileHandle, onAcceptFile, onSave, onSaveAs,
}: Props) {
  const [activeTab, setActiveTab] = useState<MobileTab>('canvas')

  return (
    <div className={styles.layout}>
      <TopBar
        scope={scope} reticle={reticle} ppm={ppm} magnification={magnification}
        loadedFileName={loadedFileName} loadedFileHandle={loadedFileHandle}
        onAcceptFile={onAcceptFile} onSave={onSave} onSaveAs={onSaveAs}
      />

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
            <Canvas
              scope={scope} reticle={reticle} setReticle={setReticle}
              ppm={ppm}
              magnification={magnification} setMagnification={setMagnification}
              onAcceptFile={onAcceptFile}
            />
          </div>
        )}

        {activeTab === 'table' && (
          <div className={styles.scrollPanel}>
            <RightPanel
              reticle={reticle}
              ppm={ppm}
              magnification={magnification}
              activeWing={activeWing} setActiveWing={setActiveWing}
            />
          </div>
        )}
      </div>

      <MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}
