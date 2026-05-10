import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { RasterStrategy } from '../../types/rasterization'
import type { BestStrategyInfo } from '../../math/bestStrategy'
import { STRATEGY_TRANS_KEYS } from '../../i18n/strategyKeys'
import ScopeProfilePanel from '../scope/ScopeProfilePanel'
import Modal from '../ui/Modal'
import styles from './Toolbar.module.css'

interface Props {
  scope: ScopeProfile
  setScope: (s: ScopeProfile) => void
  reticle: Reticle
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
  bestStrategy: BestStrategyInfo
}

export default function Toolbar({ scope, setScope, reticle, setReticle, ppm, bestStrategy }: Props) {
  const { t } = useTranslation()
  const [scopeOpen, setScopeOpen] = useState(false)

  const strategyOptions: { value: RasterStrategy; label: string }[] = [
    { value: 'independent', label: t('strategies.independent') },
    { value: 'fixed_step', label: t('strategies.fixedStep') },
  ]

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
          <span className={styles.strategyWarning}>{'⚠'} {t('toolbar.recommended')}: {t(STRATEGY_TRANS_KEYS[bestStrategy.best])}</span>
        )}
      </div>

      {scopeOpen && (
        <Modal onClose={() => setScopeOpen(false)} className={styles.scopeModal}>
          <ScopeProfilePanel scope={scope} setScope={setScope} />
          <div className={styles.modalFooter}>
            <button className={styles.modalClose} onClick={() => setScopeOpen(false)}>{t('toolbar.done')}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
