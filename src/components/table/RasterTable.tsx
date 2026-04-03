import { useMemo } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { WingKey } from '../../App'
import { calcPixelsPerMrad } from '../../math/optics'
import { rasterize } from '../../math/rasterization'
import Tooltip from '../ui/Tooltip'
import styles from './RasterTable.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  activeWing: WingKey
  setActiveWing: (w: WingKey) => void
}

const tabLabels: Record<WingKey, string> = {
  up: '↑ Верхнее',
  down: '↓ Нижнее',
  left: '← Левое',
  right: '→ Правое',
}

const wingNames: Record<WingKey, string> = {
  up: 'ВЕРХНЕЕ КРЫЛО',
  down: 'НИЖНЕЕ КРЫЛО',
  left: 'ЛЕВОЕ КРЫЛО',
  right: 'ПРАВОЕ КРЫЛО',
}

const strategyLabels: Record<string, string> = {
  independent: 'А: Независимое округление',
  fixed_step: 'Б: Фиксированный шаг',
  bresenham: 'В: Алгоритм Брезенхема',
}

export default function RasterTable({ scope, reticle, activeWing, setActiveWing }: Props) {
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])

  const wing = reticle.wings[activeWing]
  const axisPpm = (activeWing === 'down' || activeWing === 'up') ? ppm.v : ppm.h

  const marks = useMemo(() => {
    if (!wing.enabled || wing.length <= 0 || !wing.dots.enabled || wing.dots.spacing <= 0) return []
    const count = Math.floor(wing.length / wing.dots.spacing)
    return rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count)
  }, [wing, reticle.rasterization, axisPpm])

  const maxError = useMemo(() => {
    if (marks.length === 0) return 0
    return Math.max(...marks.map(m => Math.abs(m.errorPx)))
  }, [marks])

  const steps = useMemo(() => {
    if (marks.length === 0) return { min: 0, max: 0, allEqual: true }
    const vals = marks.map(m => m.stepPx)
    const mn = Math.min(...vals)
    const mx = Math.max(...vals)
    return { min: mn, max: mx, allEqual: mn === mx }
  }, [marks])

  const modalStep = marks.length > 0 ? marks[0].stepPx : 0
  const lastError = marks.length > 0 ? marks[marks.length - 1].errorPx : 0
  const disabled = !wing.enabled || wing.length <= 0

  return (
    <div className={styles.section}>
      <div className={styles.titleRow}>
        <span className={styles.title}>ТАБЛИЦА ОКРУГЛЕНИЯ</span>
        <Tooltip text="Точные координаты каждой метки в пикселях и MRAD. Показывает куда реально встанет каждая точка на дисплее и насколько она отклоняется от идеала" />
      </div>

      <div className={styles.tabs}>
        {(['up', 'down', 'left', 'right'] as const).map(t => {
          const w = reticle.wings[t]
          const off = !w.enabled || w.length <= 0
          return (
            <button
              key={t}
              className={`${styles.tab} ${activeWing === t ? styles.tabActive : ''} ${off ? styles.tabOff : ''}`}
              onClick={() => setActiveWing(t)}
            >
              {tabLabels[t]}
            </button>
          )
        })}
      </div>

      {disabled ? (
        <div className={styles.empty}>Крыло выключено</div>
      ) : marks.length === 0 ? (
        <div className={styles.empty}>Точки не настроены</div>
      ) : (
        <>
          <div className={styles.summary}>
            {wingNames[activeWing]} &bull; {marks.length} меток &bull; макс. ошибка &plusmn;{maxError.toFixed(2)} пикс &bull; шаги: {steps.allEqual ? `все = ${steps.min}` : `${steps.min}\u2013${steps.max}`} пикс
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th><span className={styles.thContent}>#<Tooltip text="Порядковый номер метки от центра. #1 — ближайшая к центру, последняя — самая дальняя на крыле" /></span></th>
                  <th><span className={styles.thContent}>MRAD<Tooltip text="Расчётная (идеальная) позиция в миллирадианах. Формула: номер метки × интервал. Это позиция, куда точка ДОЛЖНА встать" /></span></th>
                  <th><span className={styles.thContent}>пикс<Tooltip text="Фактическая позиция на дисплее прицела в пикселях. Целое число — именно на этот пиксель встанет точка при экспорте" /></span></th>
                  <th><span className={styles.thContent}>факт.<Tooltip text="Какой MRAD реально получился после округления до целого пикселя. Формула: позиция в пикселях ÷ (пикселей на MRAD). Позволяет оценить реальную угловую позицию метки" /></span></th>
                  <th><span className={styles.thContent}>ошибка<Tooltip text="Отклонение фактической позиции от идеальной в пикселях. Положительное значение (+) — метка сдвинута дальше от центра. Отрицательное (−) — ближе к центру. Чем ближе к нулю — тем точнее" align="left" /></span></th>
                  <th><span className={styles.thContent}>шаг<Tooltip text="Расстояние в пикселях от предыдущей метки до текущей. В идеале все шаги равны. Если шаг подсвечен оранжевым — он отличается от стандартного шага для этого крыла" align="left" /></span></th>
                </tr>
              </thead>
              <tbody>
                {marks.map(m => (
                  <tr key={m.index}>
                    <td>{m.index}</td>
                    <td>{m.targetMrad.toFixed(2)}</td>
                    <td>{m.actualPx}</td>
                    <td>{m.actualMrad.toFixed(3)}</td>
                    <td className={errorClass(m.errorPx)}>{m.errorPx >= 0 ? '+' : ''}{m.errorPx.toFixed(2)}</td>
                    <td className={m.stepPx !== modalStep ? styles.stepWarn : ''}>{m.stepPx}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.totals}>
            <div>Всего меток: {marks.length}</div>
            <div>Макс. ошибка: &plusmn;{maxError.toFixed(2)} пикс</div>
            <div>Диапазон шагов: {steps.allEqual ? `${steps.min} пикс` : `${steps.min}\u2013${steps.max} пикс`}</div>
            <div>Ошибка к последней метке: {lastError >= 0 ? '+' : ''}{lastError.toFixed(2)} пикс{reticle.rasterization === 'fixed_step' ? ' (накопленная)' : ' (без накопления)'}</div>
            <div>Стратегия: {strategyLabels[reticle.rasterization] || reticle.rasterization}</div>
          </div>

          <div className={styles.legend}>
            <div className={styles.legendTitle}>Цвета:</div>
            <div className={styles.legendRow}><span className={styles.dotGreen} /> {'\u2264'} 0.1 пикс — отличная точность</div>
            <div className={styles.legendRow}><span className={styles.dotGray} /> {'\u2264'} 0.4 пикс — приемлемая</div>
            <div className={styles.legendRow}><span className={styles.dotOrange} /> {'>'} 0.4 пикс — заметная</div>
            <div className={styles.legendRow}><span className={styles.dotOrange} /> оранжевый шаг — неравномерное расстояние</div>
          </div>
        </>
      )}
    </div>
  )
}

function errorClass(errorPx: number): string {
  const abs = Math.abs(errorPx)
  if (abs <= 0.1) return styles.errGood
  if (abs <= 0.4) return styles.errOk
  return styles.errBad
}
