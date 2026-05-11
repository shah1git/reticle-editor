import { useTranslation } from 'react-i18next'
import type { Primitive } from '../../types/reticle'
import styles from './PrimitiveEditor.module.css'

interface Props {
  primitive: Primitive | null
  onChange: (patch: Partial<Primitive>) => void
}

export default function PrimitiveEditor({ primitive, onChange }: Props) {
  const { t } = useTranslation()

  if (!primitive) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.heading}>{t('optical.editor.title')}</h2>
        <div className={styles.empty}>{t('optical.editor.empty')}</div>
      </div>
    )
  }

  const numField = (label: string, value: number, key: string, step = 0.1) => (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        type="number"
        className={styles.input}
        value={value}
        step={step}
        onChange={e => onChange({ [key]: parseFloat(e.target.value) || 0 } as Partial<Primitive>)}
      />
    </label>
  )

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>
        {t('optical.editor.title')} {'—'} {t(`optical.editor.type.${primitive.type}`)}
      </h2>

      {primitive.type === 'line' ? (
        <>
          <div className={styles.row}>
            {numField(t('optical.editor.x1'), primitive.x1, 'x1')}
            {numField(t('optical.editor.y1'), primitive.y1, 'y1')}
          </div>
          <div className={styles.row}>
            {numField(t('optical.editor.x2'), primitive.x2, 'x2')}
            {numField(t('optical.editor.y2'), primitive.y2, 'y2')}
          </div>
          {numField(t('optical.editor.thickness'), primitive.thickness, 'thickness', 0.01)}
        </>
      ) : (
        <>
          <div className={styles.row}>
            {numField(t('optical.editor.x'), primitive.x, 'x')}
            {numField(t('optical.editor.y'), primitive.y, 'y')}
          </div>
          {numField(t('optical.editor.size'), primitive.size, 'size', 0.01)}
        </>
      )}
    </div>
  )
}
