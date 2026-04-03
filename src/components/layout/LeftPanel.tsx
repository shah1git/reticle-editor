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
        <div style={{ fontSize: 12, color: '#a1adc4', marginTop: 2, lineHeight: 1.6 }}>
          Должен быть контрастным на тепловых палитрах (White Hot, Black Hot). Рекомендуется: зелёный #4ade80, красный #ff0000, белый #ffffff
        </div>
      </Section>
      <WingConfig reticle={reticle} setReticle={setReticle} ppm={ppm} wingKey="up" title="↑ ВЕРХНЕЕ КРЫЛО" />
      <WingConfig reticle={reticle} setReticle={setReticle} ppm={ppm} wingKey="down" title="↓ НИЖНЕЕ КРЫЛО" />
      <WingConfig reticle={reticle} setReticle={setReticle} ppm={ppm} wingKey="left" title="← ЛЕВОЕ КРЫЛО" />
      <WingConfig reticle={reticle} setReticle={setReticle} ppm={ppm} wingKey="right" title="→ ПРАВОЕ КРЫЛО" />
      <RasterStrategySelector reticle={reticle} setReticle={setReticle} />
    </aside>
  )
}
