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
      <Section title="Reticle Color" collapsible={false}>
        <ColorInput
          label="Color"
          value={reticle.color}
          onChange={v => setReticle({ ...reticle, color: v })}
        />
      </Section>
      <WingConfig reticle={reticle} setReticle={setReticle} ppm={ppm} wingKey="left" title="Left Wing" />
      <WingConfig reticle={reticle} setReticle={setReticle} ppm={ppm} wingKey="right" title="Right Wing" />
      <WingConfig reticle={reticle} setReticle={setReticle} ppm={ppm} wingKey="down" title="Down Wing" />
      <RasterStrategySelector reticle={reticle} setReticle={setReticle} />
    </aside>
  )
}
