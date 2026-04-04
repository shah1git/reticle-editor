import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScopeProfile } from '../../types/scope'
import { calcPixelsPerMrad, getFovMrad, isSquarePixelRatio } from '../../math/optics'
import Section from '../ui/Section'
import NumberInput from '../ui/NumberInput'
import SelectInput from '../ui/SelectInput'
import styles from './ScopeProfilePanel.module.css'

interface Props {
  scope: ScopeProfile
  setScope: (s: ScopeProfile) => void
}

export default function ScopeProfilePanel({ scope, setScope }: Props) {
  const { t } = useTranslation()
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])
  const fov = useMemo(() => getFovMrad(scope), [scope])
  const squarePx = useMemo(() => isSquarePixelRatio(ppm), [ppm])

  const update = (patch: Partial<ScopeProfile>) => setScope({ ...scope, ...patch })

  return (
    <Section title={t('scopePanel.title')} defaultOpen={true}>
      <div className={styles.field}>
        <label className={styles.label}>{t('scopePanel.name')}</label>
        <input
          className={styles.nameInput}
          value={scope.name}
          onChange={e => update({ name: e.target.value })}
          placeholder={t('scopePanel.namePlaceholder')}
        />
        <div className={styles.hint}>{t('scopePanel.nameHint')}</div>
      </div>

      <SelectInput
        label={t('scopePanel.type')}
        value={scope.type}
        onChange={v => update({ type: v as 'digital' | 'optical' })}
        options={[
          { value: 'digital', label: t('scopePanel.typeDigital') },
          { value: 'optical', label: t('scopePanel.typeOptical') },
        ]}
        hint={t('scopePanel.typeHint')}
      />

      {scope.type === 'digital' ? (
        <>
          <NumberInput label={t('scopePanel.focalLength')} value={scope.lensFL} onChange={v => update({ lensFL: v })} min={1} step={1} unit={t('units.mm')} hint={t('scopePanel.focalLengthHint')} />
          <div className={styles.pairRow}>
            <NumberInput label={t('scopePanel.sensorW')} value={scope.sensorResX} onChange={v => update({ sensorResX: v })} min={1} step={1} unit={t('units.px')} />
            <NumberInput label={t('scopePanel.sensorH')} value={scope.sensorResY} onChange={v => update({ sensorResY: v })} min={1} step={1} unit={t('units.px')} />
          </div>
          <div className={styles.hint}>{t('scopePanel.sensorHint')}</div>
          <div className={styles.pairRow}>
            <NumberInput label={t('scopePanel.displayW')} value={scope.displayResX} onChange={v => update({ displayResX: v })} min={1} step={1} unit={t('units.px')} />
            <NumberInput label={t('scopePanel.displayH')} value={scope.displayResY} onChange={v => update({ displayResY: v })} min={1} step={1} unit={t('units.px')} />
          </div>
          <div className={styles.hint}>{t('scopePanel.displayHint')}</div>
          <NumberInput label={t('scopePanel.pixelPitch')} value={scope.pixelPitch} onChange={v => update({ pixelPitch: v })} min={0.1} step={0.1} unit={t('units.um')} hint={t('scopePanel.pixelPitchHint')} />
        </>
      ) : (
        <>
          <NumberInput label={t('scopePanel.fovDegrees')} value={scope.fovDegrees} onChange={v => update({ fovDegrees: v })} min={0.1} step={0.1} unit={t('units.deg')} hint={t('scopePanel.fovHint')} />
          <div className={styles.pairRow}>
            <NumberInput label={t('scopePanel.displayW')} value={scope.displayResX} onChange={v => update({ displayResX: v })} min={1} step={1} unit={t('units.px')} />
            <NumberInput label={t('scopePanel.displayH')} value={scope.displayResY} onChange={v => update({ displayResY: v })} min={1} step={1} unit={t('units.px')} />
          </div>
          <div className={styles.hint}>{t('scopePanel.displayHintOptical')}</div>
        </>
      )}

      <div className={styles.calc}>
        <div className={styles.calcLabel}>{t('scopePanel.calculated')}</div>
        {squarePx ? (
          <div className={styles.calcValue}>{t('scopePanel.oneMrad', { value: ppm.h.toFixed(3) })}</div>
        ) : (
          <>
            <div className={styles.calcValue}>{t('scopePanel.horizontal', { value: ppm.h.toFixed(3) })}</div>
            <div className={styles.calcValue}>{t('scopePanel.vertical', { value: ppm.v.toFixed(3) })}</div>
          </>
        )}
        <div className={styles.calcValue}>{t('scopePanel.fov', { h: fov.h.toFixed(1), v: fov.v.toFixed(1) })}</div>
        {!squarePx && (
          <div className={styles.warning}>{t('scopePanel.nonSquareWarning')}</div>
        )}
      </div>
    </Section>
  )
}
