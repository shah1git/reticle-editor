import { useMemo } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { WingKey } from '../../App'
import { calcPixelsPerMrad } from '../../math/optics'
import ScopeProfilePanel from '../scope/ScopeProfilePanel'
import CenterDotConfig from '../reticle/CenterDotConfig'
import ColorInput from '../ui/ColorInput'
import WingEditor from '../reticle/WingEditor'
import RasterStrategySelector from '../reticle/RasterStrategySelector'
import RasterTable from '../table/RasterTable'
import Section from '../ui/Section'
import styles from './LeftPanel.module.css'

interface Props {
  scope: ScopeProfile
  setScope: (s: ScopeProfile) => void
  reticle: Reticle
  setReticle: (r: Reticle) => void
  activeWing: WingKey
  setActiveWing: (w: WingKey) => void
}

export default function LeftPanel({ scope, setScope, reticle, setReticle, activeWing, setActiveWing }: Props) {
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])

  return (
    <main className={styles.panel}>
      <ScopeProfilePanel scope={scope} setScope={setScope} />

      <div className={styles.row2}>
        <div className={styles.rowItem}>
          <CenterDotConfig reticle={reticle} setReticle={setReticle} ppm={ppm} />
        </div>
        <div className={styles.rowItem}>
          <Section title="ЦВЕТ СЕТКИ" collapsible={false}>
            <ColorInput
              label="Цвет"
              value={reticle.color}
              onChange={v => setReticle({ ...reticle, color: v })}
            />
            <div className={styles.colorHint}>
              Контрастный на тепловых палитрах. Рекомендуется: #4ade80, #ff0000, #ffffff
            </div>
          </Section>
        </div>
      </div>

      <WingEditor
        reticle={reticle}
        setReticle={setReticle}
        ppm={ppm}
        activeWing={activeWing}
        setActiveWing={setActiveWing}
      />

      <RasterStrategySelector reticle={reticle} setReticle={setReticle} />

      <RasterTable
        scope={scope}
        reticle={reticle}
        activeWing={activeWing}
        setActiveWing={setActiveWing}
      />
    </main>
  )
}
