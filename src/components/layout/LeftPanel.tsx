import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { WingKey } from '../../App'
import CenterDotConfig from '../reticle/CenterDotConfig'
import ColorInput from '../ui/ColorInput'
import WingEditor from '../reticle/WingEditor'
import Section from '../ui/Section'
import styles from './LeftPanel.module.css'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
  activeWing: WingKey
  setActiveWing: (w: WingKey) => void
}

export default function LeftPanel({ reticle, setReticle, ppm, activeWing, setActiveWing }: Props) {
  return (
    <aside className={styles.panel}>
      <Section title="СЕТКА" collapsible={false}>
        <CenterDotConfig reticle={reticle} setReticle={setReticle} ppm={ppm} />
        <ColorInput
          label="Цвет"
          value={reticle.color}
          onChange={v => setReticle({ ...reticle, color: v })}
        />
      </Section>

      <WingEditor
        reticle={reticle}
        setReticle={setReticle}
        ppm={ppm}
        activeWing={activeWing}
        setActiveWing={setActiveWing}
      />
    </aside>
  )
}
