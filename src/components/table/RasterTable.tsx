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

type WingTab = 'left' | 'right' | 'down'

const tabLabels: Record<WingTab, string> = {
  left: '← Левое',
  right: '→ Правое',
  down: '↓ Нижнее',
}

export default function RasterTable({ scope, reticle }: Props) {
  const [tab, setTab] = useState<WingTab>('left')
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])

  const wing = reticle.wings[tab]
  const axisPpm = tab === 'down' ? ppm.v : ppm.h

  const marks = useMemo(() => {
    if (!wing.enabled || !wing.dots.enabled || wing.dots.spacing <= 0) return []
    const count = Math.floor(wing.length / wing.dots.spacing)
    return rasterize(reticle.rasterization, wing.dots.spacing, axisPpm, count)
  }, [wing, reticle.rasterization, axisPpm])

  const maxError = useMemo(() => {
    if (marks.length === 0) return 0
    return Math.max(...marks.map(m => Math.abs(m.errorPx)))
  }, [marks])

  const modalStep = useMemo(() => {
    if (marks.length === 0) return 0
    return marks[0].stepPx
  }, [marks])

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <span className={styles.title}>ТАБЛИЦА РАСТЕРИЗАЦИИ</span>
        <Tooltip text="Точные пиксельные позиции каждой метки на крыле. Эту таблицу можно использовать как спецификацию для производства" />
      </div>

      <div className={styles.tabs}>
        {(['left', 'right', 'down'] as const).map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      <div className={styles.meta}>
        <span>{marks.length} меток</span>
        <span>Макс. ошибка: {maxError.toFixed(2)} пикс</span>
      </div>

      {marks.length === 0 ? (
        <div className={styles.empty}>Точки не настроены</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>MRAD</th>
                <th>пикс</th>
                <th>факт.</th>
                <th>ошибка</th>
                <th>шаг</th>
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
      )}

      <div className={styles.legend}>
        <div className={styles.legendTitle}>Цвета ошибок:</div>
        <div className={styles.legendRow}><span className={styles.dotGreen} /> ≤ 0.1 пикс — отлично</div>
        <div className={styles.legendRow}><span className={styles.dotGray} /> ≤ 0.4 пикс — приемлемо</div>
        <div className={styles.legendRow}><span className={styles.dotOrange} /> {'>'} 0.4 пикс — существенная</div>
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
