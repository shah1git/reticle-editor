import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
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

const strategyTransKeys: Record<string, string> = {
  independent: 'strategies.independent',
  fixed_step: 'strategies.fixedStep',
}

export default function Toolbar({ scope, setScope, reticle, setReticle, ppm, bestStrategy }: Props) {
  const { t } = useTranslation()
  const [scopeOpen, setScopeOpen] = useState(false)

  const strategyOptions: { value: RasterStrategy; label: string }[] = [
    { value: 'independent', label: t('strategies.independent') },
    { value: 'fixed_step', label: t('strategies.fixedStep') },
  ]

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
        <span className={styles.label}>{t('toolbar.scope')}</span>
        <span className={styles.value}>{scope.name}</span>
        <span className={styles.valueDim}>{ppm.h.toFixed(1)} {t('toolbar.pixPerMrad')}</span>
        <button className={styles.scopeBtn} onClick={() => setScopeOpen(true)}>{t('toolbar.configureScope')}</button>
      </div>

      <div className={styles.sep} />

      <div className={styles.group}>
        <span className={styles.label}>{t('focalPlane.label')}</span>
        <select
          className={styles.select}
          value={reticle.focalPlane}
          onChange={e => setReticle({ ...reticle, focalPlane: e.target.value as 'ffp' | 'sfp' })}
        >
          <option value="ffp">{t('focalPlane.ffp')}</option>
          <option value="sfp">{t('focalPlane.sfp')}</option>
        </select>
      </div>

      <div className={styles.sep} />

      <div className={styles.group}>
        <span className={styles.label}>{t('toolbar.rounding')}</span>
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
          <span className={styles.strategyWarning}>{'\u26a0'} {t('toolbar.recommended')}: {t(strategyTransKeys[bestStrategy.best])}</span>
        )}
      </div>

      {scopeOpen && createPortal(
        <div className={styles.overlay} onClick={() => setScopeOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <ScopeProfilePanel scope={scope} setScope={setScope} />
            <div className={styles.modalFooter}>
              <button className={styles.modalClose} onClick={() => setScopeOpen(false)}>{t('toolbar.done')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
