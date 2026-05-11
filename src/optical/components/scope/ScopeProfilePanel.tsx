import { useTranslation } from 'react-i18next'
import type { ScopeProfile } from '../../types/scope'
import styles from './ScopeProfilePanel.module.css'

interface Props {
  scope: ScopeProfile
  onChange: (scope: ScopeProfile) => void
}

export default function ScopeProfilePanel({ scope, onChange }: Props) {
  const { t } = useTranslation()

  const update = (patch: Partial<ScopeProfile>) => onChange({ ...scope, ...patch })

  const numberField = (
    label: string,
    value: number,
    key: keyof ScopeProfile,
    step = 0.1,
  ) => (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.inputRow}>
        <input
          type="number"
          className={styles.input}
          value={Number.isFinite(value) ? value : 0}
          step={step}
          onChange={e => update({ [key]: parseFloat(e.target.value) || 0 })}
        />
        <span className={styles.unit}>{t('optical.units.mm')}</span>
      </div>
    </label>
  )

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>{t('optical.scope.title')}</h2>

      <div className={styles.field}>
        <span className={styles.label}>{t('optical.scope.type')}</span>
        <div className={styles.radioRow}>
          <label className={styles.radio}>
            <input
              type="radio"
              name="scopeType"
              checked={scope.type === 'FFP'}
              onChange={() => update({ type: 'FFP', referenceMag: undefined })}
            />
            <span>{t('optical.scope.ffp')}</span>
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="scopeType"
              checked={scope.type === 'SFP'}
              onChange={() => update({ type: 'SFP', referenceMag: scope.referenceMag ?? 10 })}
            />
            <span>{t('optical.scope.sfp')}</span>
          </label>
        </div>
      </div>

      {scope.type === 'SFP' && (
        <label className={styles.field}>
          <span className={styles.label}>{t('optical.scope.referenceMag')}</span>
          <div className={styles.inputRow}>
            <input
              type="number"
              className={styles.input}
              value={scope.referenceMag ?? 10}
              step={0.5}
              min={1}
              onChange={e => update({ referenceMag: parseFloat(e.target.value) || 1 })}
            />
            <span className={styles.unit}>{t('optical.units.x')}</span>
          </div>
        </label>
      )}

      {numberField(t('optical.scope.eyepieceFL'), scope.eyepieceFL, 'eyepieceFL', 1)}
      {numberField(t('optical.scope.glassDiameter'), scope.glassDiameter, 'glassDiameter', 0.5)}
      {numberField(t('optical.scope.glassThickness'), scope.glassThickness, 'glassThickness', 0.1)}
      {numberField(t('optical.scope.minLineWidth'), scope.minLineWidth, 'minLineWidth', 0.01)}
      {numberField(t('optical.scope.minGap'), scope.minGap, 'minGap', 0.01)}
    </div>
  )
}
