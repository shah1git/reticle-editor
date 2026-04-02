import { useMemo, useState } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { RasterMark } from '../../types/rasterization'
import { calcPixelsPerMrad } from '../../math/optics'
import { rasterize } from '../../math/rasterization'
import styles from './RasterTable.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
}

type WingTab = 'left' | 'right' | 'down'

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
      <div className={styles.tabs}>
        {(['left', 'right', 'down'] as const).map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className={styles.meta}>
        <span>{marks.length} marks</span>
        <span>Max err: {maxError.toFixed(2)} px</span>
      </div>

      {marks.length === 0 ? (
        <div className={styles.empty}>No dots configured</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>MRAD</th>
                <th>px</th>
                <th>Actual</th>
                <th>Err px</th>
                <th>Step</th>
              </tr>
            </thead>
            <tbody>
              {marks.map(m => (
                <tr key={m.index}>
                  <td>{m.index}</td>
                  <td>{m.targetMrad.toFixed(2)}</td>
                  <td>{m.actualPx}</td>
                  <td>{m.actualMrad.toFixed(3)}</td>
                  <td className={errorClass(m.errorPx)}>{m.errorPx.toFixed(2)}</td>
                  <td className={m.stepPx !== modalStep ? styles.stepWarn : ''}>{m.stepPx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
