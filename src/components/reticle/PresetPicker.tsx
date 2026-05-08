import { useTranslation } from 'react-i18next'
import type { Reticle } from '../../types/reticle'
import { PRESETS, reticleMatchesPreset } from '../../presets'
import Section from '../ui/Section'
import styles from './PresetPicker.module.css'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
}

export default function PresetPicker({ reticle, setReticle }: Props) {
  const { t } = useTranslation()

  return (
    <Section title={t('presets.title')} tooltip={t('presets.tooltip')}>
      <div className={styles.grid}>
        {PRESETS.map(p => {
          const active = reticleMatchesPreset(reticle, p.reticle)
          return (
            <button
              key={p.id}
              type="button"
              className={`${styles.btn} ${active ? styles.btnActive : ''}`}
              title={t(`presets.${p.id}.desc`)}
              onClick={() => setReticle(p.reticle)}
            >
              {t(`presets.${p.id}.name`)}
            </button>
          )
        })}
      </div>
    </Section>
  )
}
