import { useMemo } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import { calcPixelsPerMrad } from '../../math/optics'
import ScopeProfilePanel from '../scope/ScopeProfilePanel'
import CenterDotConfig from '../reticle/CenterDotConfig'
import ColorInput from '../ui/ColorInput'
import WingConfig from '../reticle/WingConfig'
import RasterStrategySelector from '../reticle/RasterStrategySelector'
import Section from '../ui/Section'
import styles from './LeftPanel.module.css'

interface Props {
  scope: ScopeProfile
  setScope: (s: ScopeProfile) => void
  reticle: Reticle
  setReticle: (r: Reticle) => void
}

export default function LeftPanel({ scope, setScope, reticle, setReticle }: Props) {
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])

  return (
    <aside className={styles.panel}>
      <ScopeProfilePanel scope={scope} setScope={setScope} />
      <CenterDotConfig reticle={reticle} setReticle={setReticle} ppm={ppm} />
      <Section title="ЦВЕТ СЕТКИ" collapsible={false}>
        <ColorInput
          label="Цвет"
          value={reticle.color}
          onChange={v => setReticle({ ...reticle, color: v })}
        />
        <div style={{ fontSize: 11, color: '#8890a8', marginTop: 2 }}>
          Должен быть контрастным на тепловых палитрах (White Hot, Black Hot). Рекомендуется зелёный или красный
        </div>
      </Section>
      <WingConfig reticle={reticle} setReticle={setReticle} ppm={ppm} wingKey="left" title="← ЛЕВОЕ КРЫЛО" />
      <WingConfig reticle={reticle} setReticle={setReticle} ppm={ppm} wingKey="right" title="→ ПРАВОЕ КРЫЛО" />
      <WingConfig reticle={reticle} setReticle={setReticle} ppm={ppm} wingKey="down" title="↓ НИЖНЕЕ КРЫЛО" />
      <RasterStrategySelector reticle={reticle} setReticle={setReticle} />
    </aside>
  )
}
