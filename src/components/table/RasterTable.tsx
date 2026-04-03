import { useMemo, useState } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import { calcPixelsPerMrad } from '../../math/optics'
import { rasterize } from '../../math/rasterization'
import Tooltip from '../ui/Tooltip'
import styles from './RasterTable.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
}

type WingTab = 'up' | 'down' | 'left' | 'right'

const tabLabels: Record<WingTab, string> = {
  up: '↑ Верхнее',
  down: '↓ Нижнее',
  left: '← Левое',
  right: '→ Правое',
}

const wingNames: Record<WingTab, string> = {
  up: 'ВЕРХНЕЕ',
  down: 'НИЖНЕЕ',
  left: 'ЛЕВОЕ',
  right: 'ПРАВОЕ',
}

export default function RasterTable({ scope, reticle }: Props) {
  const [tab, setTab] = useState<WingTab>('down')
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])

  const wing = reticle.wings[tab]
  const axisPpm = (tab === 'down' || tab === 'up') ? ppm.v : ppm.h

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
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <span className={styles.title}>ТАБЛИЦА РАСТЕРИЗАЦИИ</span>
        <Tooltip text="Точные координаты каждой метки в пикселях и MRAD. Показывает куда реально встанет каждая точка на дисплее и насколько она отклоняется от идеала. Таблица сохраняется в JSON и может использоваться как спецификация" />
      </div>

      <div className={styles.tabs}>
        {(['up', 'down', 'left', 'right'] as const).map(t => {
          const w = reticle.wings[t]
          const off = !w.enabled || w.length <= 0
          return (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''} ${off ? styles.tabOff : ''}`}
              onClick={() => setTab(t)}
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
            {wingNames[tab]} • {marks.length} меток • макс. ошибка {maxError.toFixed(2)} пикс • шаги: {steps.allEqual ? `все = ${steps.min}` : `${steps.min}–${steps.max}`} пикс
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th title="Порядковый номер метки">#</th>
                  <th title="Расчётная (идеальная) позиция в MRAD">MRAD</th>
                  <th title="Фактическая позиция на дисплее в пикселях (целое число)">пикс</th>
                  <th title="Какой MRAD реально получился после округления">факт.</th>
                  <th title="Отклонение от идеала в пикселях (+ дальше, − ближе)">ошибка</th>
                  <th title="Расстояние от предыдущей метки в пикселях">шаг</th>
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
            <div>Макс. ошибка: {maxError.toFixed(2)} пикс</div>
            <div>Шаги: {steps.allEqual ? `все = ${steps.min} пикс` : `от ${steps.min} до ${steps.max} пикс`}</div>
            <div>Ошибка последней метки: {lastError >= 0 ? '+' : ''}{lastError.toFixed(2)} пикс</div>
          </div>
        </>
      )}

      <div className={styles.legend}>
        <div className={styles.legendTitle}>Цвета:</div>
        <div className={styles.legendRow}><span className={styles.dotGreen} /> ≤ 0.1 пикс — отлично</div>
        <div className={styles.legendRow}><span className={styles.dotGray} /> ≤ 0.4 пикс — нормально</div>
        <div className={styles.legendRow}><span className={styles.dotOrange} /> {'>'} 0.4 пикс — заметно</div>
        <div className={styles.legendRow}><span className={styles.dotOrange} /> оранжевый шаг — неравномерно</div>
      </div>
    </div>
  )
}

function errorClass(errorPx: number): string {
  const abs = Math.abs(errorPx)
  if (abs <= 0.1) return styles.errGood
  if (abs <= 0.4) return styles.errOk
  return styles.errBad
}
