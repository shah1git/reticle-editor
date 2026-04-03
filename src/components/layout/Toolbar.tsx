import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { RasterStrategy } from '../../types/rasterization'
import type { BestStrategyInfo } from '../../math/bestStrategy'
import ScopeProfilePanel from '../scope/ScopeProfilePanel'
import styles from './Toolbar.module.css'

interface Props {
  scope: ScopeProfile
  setScope: (s: ScopeProfile) => void
  reticle: Reticle
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
  bestStrategy: BestStrategyInfo
}

const strategyOptions: { value: RasterStrategy; label: string }[] = [
  { value: 'independent', label: 'А: Независимое' },
  { value: 'fixed_step', label: 'Б: Фиксированный' },
  { value: 'bresenham', label: 'В: Брезенхем' },
]

export default function Toolbar({ scope, setScope, reticle, setReticle, ppm, bestStrategy }: Props) {
  const [scopeOpen, setScopeOpen] = useState(false)

  useEffect(() => {
    if (!scopeOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setScopeOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [scopeOpen])

  const isOptimal = bestStrategy.best === reticle.rasterization

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <span className={styles.label}>ПРИЦЕЛ:</span>
        <span className={styles.value}>{scope.name}</span>
        <span className={styles.valueDim}>{ppm.h.toFixed(1)} пикс/MRAD</span>
        <button className={styles.scopeBtn} onClick={() => setScopeOpen(true)}>настроить параметры прицела</button>
      </div>

      <div className={styles.sep} />

      <div className={styles.group}>
        <span className={styles.label}>ОКРУГЛЕНИЕ:</span>
        <select
          className={styles.select}
          value={reticle.rasterization}
          onChange={e => setReticle({ ...reticle, rasterization: e.target.value as RasterStrategy })}
        >
          {strategyOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {!isOptimal && (
          <span className={styles.strategyWarning}>⚠ Рекомендуется: {bestStrategy.bestLabel}</span>
        )}
      </div>

      {scopeOpen && createPortal(
        <div className={styles.overlay} onClick={() => setScopeOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <ScopeProfilePanel scope={scope} setScope={setScope} />
            <div className={styles.modalFooter}>
              <button className={styles.modalClose} onClick={() => setScopeOpen(false)}>Готово</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
