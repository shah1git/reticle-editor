import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import styles from './IntervalPicker.module.css'

interface Props {
  axisPpm: number
  axis: 'h' | 'v'
  currentSpacing: number
  onPick: (spacing: number) => void
  onClose: () => void
}

const TARGETS = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10] as const

interface Candidate {
  target: number
  spacing: number
  stepPx: number
  deltaPct: number
}

export default function IntervalPicker({ axisPpm, axis, currentSpacing, onPick, onClose }: Props) {
  const { t } = useTranslation()
  const axisLabel = t(axis === 'h' ? 'intervalPicker.axisH' : 'intervalPicker.axisV')

  const candidates: Candidate[] = TARGETS.map(target => {
    const stepPx = Math.max(1, Math.round(target * axisPpm))
    const spacing = stepPx / axisPpm
    const deltaPct = (spacing - target) / target * 100
    return { target, spacing, stepPx, deltaPct }
  })

  return (
    <Modal onClose={onClose} className={styles.modal}>
      <div className={styles.header}>
        <div className={styles.title}>
          {t('intervalPicker.title')} <span className={styles.axisChip}>{axisLabel}</span>
        </div>
        <div className={styles.hint}>{t('intervalPicker.hint', { ppm: axisPpm.toFixed(3) })}</div>
      </div>
      <div className={styles.body}>
        <div className={styles.head}>
          <span title={t('intervalPicker.colTargetTip')}>{t('intervalPicker.colTarget')}</span>
          <span title={t('intervalPicker.colExactTip')}>{t('intervalPicker.colExact')}</span>
          <span title={t('intervalPicker.colStepTip')}>{t('intervalPicker.colStep')}</span>
          <span title={t('intervalPicker.colDeltaTip')}>{t('intervalPicker.colDelta')}</span>
        </div>
        {candidates.map(c => {
          const isCurrent = Math.abs(c.spacing - currentSpacing) < 0.0005
          return (
            <button
              key={c.target}
              className={`${styles.row} ${isCurrent ? styles.rowCurrent : ''}`}
              onClick={() => { onPick(c.spacing); onClose() }}
              title={t('intervalPicker.rowTooltip', {
                target: c.target,
                exact: c.spacing.toFixed(4),
                step: c.stepPx,
              })}
            >
              <span className={styles.target}>~{c.target}</span>
              <span className={styles.exact}>{c.spacing.toFixed(4)}</span>
              <span className={styles.step}>{c.stepPx}</span>
              <span className={styles.delta}>{c.deltaPct >= 0 ? '+' : ''}{c.deltaPct.toFixed(2)}%</span>
            </button>
          )
        })}
      </div>
      <div className={styles.footer}>
        <button className={styles.btn} onClick={onClose}>
          {t('intervalPicker.cancel')}
        </button>
      </div>
    </Modal>
  )
}
