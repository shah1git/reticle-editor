import { useMemo } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { WingKey } from '../../App'
import { calcPixelsPerMrad } from '../../math/optics'
import { rasterize } from '../../math/rasterization'
import styles from './SummaryCards.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  activeWing: WingKey
}

const strategyLabels: Record<string, string> = {
  independent: 'А: Независимое',
  fixed_step: 'Б: Фиксированный',
  bresenham: 'В: Брезенхем',
}

export default function SummaryCards({ scope, reticle }: Props) {
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])

  const stats = useMemo(() => {
    let totalMarks = 0
    let maxError = 0
    let minStep = Infinity
    let maxStep = 0

    for (const key of ['up', 'down', 'left', 'right'] as const) {
      const wing = reticle.wings[key]
      if (!wing.enabled || wing.length <= 0 || !wing.dots.enabled || wing.dots.spacing <= 0) continue
      const axisPpm = (key === 'up' || key === 'down') ? ppm.v : ppm.h
      const count = Math.floor(wing.length / wing.dots.spacing)
      if (count <= 0) continue
      const marks = rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count)
      totalMarks += marks.length
      for (const m of marks) {
        const err = Math.abs(m.errorPx)
        if (err > maxError) maxError = err
        if (m.stepPx < minStep) minStep = m.stepPx
        if (m.stepPx > maxStep) maxStep = m.stepPx
      }
    }

    return {
      totalMarks,
      maxError,
      stepRange: totalMarks > 0
        ? (minStep === maxStep ? `${minStep}` : `${minStep}–${maxStep}`)
        : '—',
      strategy: strategyLabels[reticle.rasterization] || reticle.rasterization,
    }
  }, [reticle, ppm])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardLabel}>Всего меток</div>
        <div className={styles.cardValue}>{stats.totalMarks}</div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardLabel}>Макс. ошибка</div>
        <div className={styles.cardValue}>{stats.maxError.toFixed(2)} пикс</div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardLabel}>Диапазон шагов</div>
        <div className={styles.cardValue}>{stats.stepRange} пикс</div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardLabel}>Стратегия</div>
        <div className={styles.cardValue}>{stats.strategy}</div>
      </div>
    </div>
  )
}
