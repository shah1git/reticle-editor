import { useMemo, useState } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { RasterStrategy } from '../../types/rasterization'
import type { PixelsPerMrad } from '../../math/optics'
import { calcPixelsPerMrad } from '../../math/optics'
import { rasterize } from '../../math/rasterization'
import Tooltip from '../ui/Tooltip'
import styles from './StrategyComparison.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
}

const STRATEGIES: RasterStrategy[] = ['independent', 'fixed_step', 'bresenham']
const LABELS: Record<RasterStrategy, string> = {
  independent: 'А: Незав.',
  fixed_step: 'Б: Фикс.',
  bresenham: 'В: Брез.',
}
const WING_ARROWS: Record<string, string> = { up: '↑', down: '↓', left: '←', right: '→' }

interface WingData {
  key: string
  axisPpm: number
  count: number
  spacing: number
  length: number
}

interface StrategyStats {
  strategy: RasterStrategy
  maxErr: number
  avgErr: number
  fractionalCount: number
  unevenSteps: number
  drift: number
  minStep: number
  maxStep: number
  totalMarks: number
  allEqual: boolean
}

function mode(arr: number[]): number {
  if (arr.length === 0) return 0
  const freq = new Map<number, number>()
  let maxFreq = 0
  let modeVal = arr[0]
  for (const v of arr) {
    const f = (freq.get(v) || 0) + 1
    freq.set(v, f)
    if (f > maxFreq) { maxFreq = f; modeVal = v }
  }
  return modeVal
}

function getActiveWings(reticle: Reticle, ppm: PixelsPerMrad) {
  const wings: WingData[] = []
  const info: string[] = []
  let totalMarks = 0

  for (const key of ['up', 'down', 'left', 'right'] as const) {
    const wing = reticle.wings[key]
    if (!wing.enabled || wing.length <= 0 || !wing.dots.enabled || wing.dots.spacing <= 0) continue
    const axisPpm = (key === 'up' || key === 'down') ? ppm.v : ppm.h
    const count = Math.floor(wing.length / wing.dots.spacing)
    if (count <= 0) continue
    wings.push({ key, axisPpm, count, spacing: wing.dots.spacing, length: wing.length })
    info.push(`${WING_ARROWS[key]}${wing.length}×${wing.dots.spacing}`)
    totalMarks += count
  }

  return { wings, info, totalMarks, wingCount: wings.length }
}

function calcStrategyStats(strategy: RasterStrategy, wings: WingData[]): StrategyStats {
  const allErrors: number[] = []
  const allSteps: number[] = []
  let maxDrift = 0
  let totalMarks = 0

  for (const w of wings) {
    const marks = rasterize(strategy, w.spacing, w.axisPpm, w.count)
    totalMarks += marks.length
    for (const m of marks) {
      allErrors.push(Math.abs(m.errorPx))
      allSteps.push(m.stepPx)
    }
    if (marks.length > 0) {
      const lastErr = Math.abs(marks[marks.length - 1].errorPx)
      if (lastErr > maxDrift) maxDrift = lastErr
    }
  }

  const maxErr = allErrors.length > 0 ? Math.max(...allErrors) : 0
  const avgErr = allErrors.length > 0 ? allErrors.reduce((a, b) => a + b, 0) / allErrors.length : 0
  const fractionalCount = allErrors.filter(e => e > 0.001).length
  const modalStep = mode(allSteps)
  const unevenSteps = allSteps.filter(s => s !== modalStep).length
  const minStep = allSteps.length > 0 ? Math.min(...allSteps) : 0
  const maxStep = allSteps.length > 0 ? Math.max(...allSteps) : 0

  return {
    strategy, maxErr, avgErr, fractionalCount, unevenSteps,
    drift: maxDrift, minStep, maxStep, totalMarks,
    allEqual: minStep === maxStep,
  }
}

export default function StrategyComparison({ scope, reticle }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])

  const data = useMemo(() => {
    const { wings, info, totalMarks, wingCount } = getActiveWings(reticle, ppm)
    if (wings.length === 0) return null

    const stats = STRATEGIES.map(s => calcStrategyStats(s, wings))
    const bestMaxErr = Math.min(...stats.map(s => s.maxErr))
    const bestStrategies = stats.filter(s => Math.abs(s.maxErr - bestMaxErr) < 0.001).map(s => s.strategy)

    return { stats, info, totalMarks, wingCount, bestStrategies }
  }, [reticle, ppm])

  if (!data) return null

  const { stats, info, totalMarks, wingCount, bestStrategies } = data
  const isCurrentOptimal = bestStrategies.includes(reticle.rasterization)

  return (
    <div className={styles.overlay}>
      <button className={styles.toggle} onClick={() => setCollapsed(!collapsed)}>
        Сравнение стратегий {collapsed ? '▼' : '▲'}
      </button>
      {!collapsed && (
        <>
          <div className={styles.subtitle}>
            {info.join('  ')} MRAD  при {ppm.h.toFixed(1)} пикс/MRAD
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th><span className={styles.thContent}>Макс. ошибка<Tooltip text="Наихудшая ошибка позиционирования метки на всей сетке в пикселях. Чем меньше — тем точнее расположены метки. Максимально возможная ошибка при округлении — ±0.5 пикселя" align="left" /></span></th>
                  <th><span className={styles.thContent}>Средняя<Tooltip text="Средняя ошибка по всем меткам сетки. Показывает типичную погрешность — насколько в среднем метки отклоняются от идеальных позиций" align="left" /></span></th>
                  <th><span className={styles.thContent}>Дробных<Tooltip text="Сколько меток имеют ненулевую ошибку — их идеальная позиция в пикселях дробная и была округлена. Формат: количество с ошибкой / всего меток. Чем меньше — тем точнее стратегия для данных параметров" align="left" /></span></th>
                  <th><span className={styles.thContent}>Неравн. шаги<Tooltip text="Сколько расстояний между соседними метками отличаются от основного шага. При стратегии Б всегда 0 — все шаги равны. При А и В часть шагов короче или длиннее на 1 пиксель" align="left" /></span></th>
                  <th><span className={styles.thContent}>Дрейф<Tooltip text="Ошибка самой дальней метки от центра. Показывает накапливается ли ошибка к краю крыла. При стратегии Б ошибка растёт с каждой меткой. При А и В — не накапливается" align="left" /></span></th>
                  <th><span className={styles.thContent}>Шаги<Tooltip text="Какие расстояния в пикселях между соседними метками. «все N» — все одинаковые. «N–M» — чередуются два значения шага" align="left" /></span></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stats.map(s => {
                  const isCurrent = s.strategy === reticle.rasterization
                  const isBest = bestStrategies.includes(s.strategy)
                  return (
                    <tr key={s.strategy} className={isCurrent ? styles.rowCurrent : ''}>
                      <td className={styles.strategyName}>{LABELS[s.strategy]}</td>
                      <td>±{s.maxErr.toFixed(2)}</td>
                      <td>{s.avgErr.toFixed(2)}</td>
                      <td>{s.fractionalCount}/{s.totalMarks}</td>
                      <td>{s.unevenSteps}/{s.totalMarks}</td>
                      <td className={s.drift > 1.0 ? styles.driftWarn : ''}>{s.drift > 0 ? '+' : ''}{s.drift.toFixed(2)}</td>
                      <td>{s.allEqual ? `все ${s.minStep}` : `${s.minStep}\u2013${s.maxStep}`}</td>
                      <td className={styles.checkCell}>
                        {isBest && (
                          <>
                            <span className={styles.checkMark}>✓</span>
                            {!isCurrentOptimal && !isCurrent && <span className={styles.recommend}>рекомендуется</span>}
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className={styles.footer}>
            {totalMarks} меток на {wingCount} {wingCount === 1 ? 'крыле' : 'крыльях'}
          </div>
        </>
      )}
    </div>
  )
}
