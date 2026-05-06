import { useTranslation } from 'react-i18next'
import type { Reticle, Wing, WingDotKind } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { WingKey } from '../../App'
import NumberInput from '../ui/NumberInput'
import CheckboxInput from '../ui/CheckboxInput'
import SelectInput from '../ui/SelectInput'
import Section from '../ui/Section'
import styles from './WingEditor.module.css'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
  activeWing: WingKey
  setActiveWing: (w: WingKey) => void
}

const WING_DOT_KINDS: WingDotKind[] = ['pair']

export default function WingEditor({ reticle, setReticle, ppm, activeWing, setActiveWing }: Props) {
  const { t } = useTranslation()
  const wing = reticle.wings[activeWing]
  const axisPpm = (activeWing === 'up' || activeWing === 'down') ? ppm.v : ppm.h
  const isHorizontal = activeWing === 'left' || activeWing === 'right'

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

  const dotKindOptions = WING_DOT_KINDS.map(k => ({
    value: k,
    label: t(`wings.dotKindLabel.${isHorizontal ? 'h' : 'v'}.${k}`),
  }))

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
              {wingLabels[key]} {w.enabled && w.dots.count > 0 ? w.dots.count : ''}
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

      {wing.enabled && wing.dots.enabled && (
        <div className={styles.cards}>
          <SelectInput
            label={t('wings.dotKindField')}
            value={wing.dots.kind}
            onChange={v => updateDots({ kind: v as WingDotKind })}
            options={dotKindOptions}
          />
          <NumberInput
            label={t('wings.interval')}
            value={wing.dots.spacing}
            onChange={v => updateDots({ spacing: v })}
            min={0.1}
            defaultValue={1}
            step={0.1}
            pxValue={wing.dots.spacing * axisPpm}
            unit="MRAD"
            hint={t('wings.intervalHint', { spacing: wing.dots.spacing.toFixed(1) })}
          />
          <NumberInput
            label={t('wings.count')}
            value={wing.dots.count}
            onChange={v => updateDots({ count: v })}
            min={0}
            defaultValue={5}
            step={1}
            unit=""
            snapFn={v => Math.max(0, Math.round(v))}
            hint={t('wings.countHint', {
              count: wing.dots.count,
              spacing: wing.dots.spacing.toFixed(1),
              total: (wing.dots.count * wing.dots.spacing).toFixed(1),
            })}
          />
        </div>
      )}
    </Section>
  )
}
