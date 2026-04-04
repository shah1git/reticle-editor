import { useTranslation } from 'react-i18next'
import type { Reticle, Wing } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { WingKey } from '../../App'
import NumberInput from '../ui/NumberInput'
import CheckboxInput from '../ui/CheckboxInput'
import Section from '../ui/Section'
import Tooltip from '../ui/Tooltip'
import styles from './WingEditor.module.css'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
  activeWing: WingKey
  setActiveWing: (w: WingKey) => void
}

export default function WingEditor({ reticle, setReticle, ppm, activeWing, setActiveWing }: Props) {
  const { t } = useTranslation()
  const wing = reticle.wings[activeWing]
  const axisPpm = (activeWing === 'up' || activeWing === 'down') ? ppm.v : ppm.h

  const wingLabels: Record<WingKey, string> = {
    up: t('wings.up'),
    down: t('wings.down'),
    left: t('wings.left'),
    right: t('wings.right'),
  }

  const updateWing = (patch: Partial<Wing>) => {
    setReticle({
      ...reticle,
      wings: {
        ...reticle.wings,
        [activeWing]: { ...wing, ...patch },
      },
    })
  }

  const updateDots = (patch: Partial<Wing['dots']>) => {
    updateWing({ dots: { ...wing.dots, ...patch } })
  }

  const dotSizeMrad = wing.dotSize / axisPpm

  return (
    <Section title={t('wings.title')} collapsible={false} tooltip={t('wings.tooltip')}>
      <div className={styles.tabs}>
        {(['up', 'down', 'left', 'right'] as const).map(key => {
          const w = reticle.wings[key]
          return (
            <button
              key={key}
              className={`${styles.tab} ${activeWing === key ? styles.tabActive : ''} ${!w.enabled ? styles.tabOff : ''}`}
              onClick={() => setActiveWing(key)}
            >
              {wingLabels[key]} {w.enabled && w.length > 0 ? w.length.toFixed(1) : ''}
            </button>
          )
        })}
      </div>

      <div className={styles.controls}>
        <CheckboxInput
          label={wing.enabled ? t('wings.enabled') : t('wings.disabled')}
          checked={wing.enabled}
          onChange={v => updateWing({ enabled: v })}
        />
        {wing.enabled && (
          <CheckboxInput
            label={t('wings.dotsOnWing')}
            checked={wing.dots.enabled}
            onChange={v => updateDots({ enabled: v })}
          />
        )}
      </div>

      {wing.enabled && (
        <div className={styles.cards}>
          <NumberInput
            label={t('wings.length')}
            value={wing.length}
            onChange={v => updateWing({ length: v })}
            min={0}
            defaultValue={5}
            step={0.1}
            pxValue={wing.length * axisPpm}
            unit="MRAD"
            hint={t('wings.lengthHint', { length: wing.length.toFixed(1), spacing: wing.dots.spacing.toFixed(1), count: Math.floor(wing.length / wing.dots.spacing) })}
          />
          <NumberInput
            label={t('wings.lineThickness')}
            value={wing.lineThickness}
            onChange={v => updateWing({ lineThickness: v })}
            min={0}
            defaultValue={0.1}
            step={0.05}
            pxValue={wing.lineThickness * axisPpm}
            unit="MRAD"
            hint={t('wings.lineThicknessHint')}
          />
          {wing.dots.enabled && (
            <>
              <div className={styles.dotSizeField}>
                <div className={styles.dotSizeLabelRow}>
                  <span className={styles.dotSizeLabel}>{t('wings.dotSize')}</span>
                  <Tooltip text={t('wings.dotSizeHint', { size: wing.dotSize, mrad: dotSizeMrad.toFixed(2) })} />
                </div>
                <div className={styles.dotSizeInputRow}>
                  <input
                    type="number"
                    className={styles.dotSizeInput}
                    value={wing.dotSize}
                    min={1}
                    step={1}
                    onChange={e => {
                      const v = parseInt(e.target.value)
                      if (!isNaN(v) && v >= 1) updateWing({ dotSize: v })
                    }}
                    onBlur={e => {
                      const v = parseInt(e.target.value)
                      if (isNaN(v) || v < 1) updateWing({ dotSize: 2 })
                    }}
                  />
                  <span className={styles.dotSizeUnit}>{t('units.px')}</span>
                </div>
                <div className={styles.dotSizeMrad}>= {dotSizeMrad.toFixed(2)} MRAD</div>
              </div>
              <NumberInput
                label={t('wings.interval')}
                value={wing.dots.spacing}
                onChange={v => updateDots({ spacing: v })}
                min={0.1}
                defaultValue={1}
                step={0.1}
                pxValue={wing.dots.spacing * axisPpm}
                unit="MRAD"
                hint={t('wings.intervalHint', { length: wing.length.toFixed(1), count: Math.floor(wing.length / wing.dots.spacing) })}
              />
            </>
          )}
        </div>
      )}
    </Section>
  )
}
