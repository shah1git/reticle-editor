import { useTranslation } from 'react-i18next'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { WingKey } from '../../App'
import CenterDotConfig from '../reticle/CenterDotConfig'

import WingEditor from '../reticle/WingEditor'
import PresetPicker from '../reticle/PresetPicker'
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
  const { t } = useTranslation()

  if (reticle.mode === 'pixels') {
    return (
      <aside className={styles.panel}>
        <Section title={t('paint.panelTitle')} collapsible={false} tooltip={t('paint.panelTooltip')}>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            <div>{t('paint.modeBadge', { count: reticle.customPixels.length })}</div>
            <div style={{ marginTop: 6, color: 'var(--text-hint)' }}>{t('paint.howTo')}</div>
          </div>
        </Section>
      </aside>
    )
  }

  return (
    <aside className={styles.panel}>
      <PresetPicker reticle={reticle} setReticle={setReticle} />

      <Section title={t('leftPanel.reticle')} collapsible={false}>
        <CenterDotConfig reticle={reticle} setReticle={setReticle} />
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
