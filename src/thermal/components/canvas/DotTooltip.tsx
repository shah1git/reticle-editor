import { useRef, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DotHoverInfo } from '../../types/dotTooltip'
import { errorToColor } from '../../math/errorColor'
import styles from './DotTooltip.module.css'

const OFFSET = 14

interface Props {
  info: DotHoverInfo
}

export default function DotTooltip({ info }: Props) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: info.screenX + OFFSET, top: info.screenY + OFFSET })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let left = info.screenX + OFFSET
    let top = info.screenY + OFFSET
    if (left + rect.width > window.innerWidth - 8) {
      left = info.screenX - rect.width - OFFSET
    }
    if (top + rect.height > window.innerHeight - 8) {
      top = info.screenY - rect.height - OFFSET
    }
    setPos({ left, top })
  }, [info.screenX, info.screenY])

  const dirLabel = t(`wings.${info.dir}`)
  const errorSign = info.errorPx >= 0 ? '+' : ''

  return (
    <div
      ref={ref}
      className={styles.tooltip}
      style={{ left: pos.left, top: pos.top }}
    >
      <div className={styles.header}>
        {dirLabel} #{info.index}
      </div>
      <hr className={styles.separator} />
      <div className={styles.row}>
        <span className={styles.label}>{t('dotTooltip.target')}</span>
        <span className={styles.value}>{info.targetMrad.toFixed(3)} MRAD · {info.targetPx.toFixed(2)} {t('units.px')}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t('dotTooltip.actual')}</span>
        <span className={styles.value}>{info.actualMrad.toFixed(3)} MRAD · {info.actualPx} {t('units.px')}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t('dotTooltip.error')}</span>
        <span className={styles.value} style={{ color: errorToColor(info.errorPx) }}>
          {errorSign}{info.errorPx.toFixed(2)} {t('units.px')}
        </span>
      </div>
      <hr className={styles.separator} />
      <div className={styles.row}>
        <span className={styles.label}>{t('dotTooltip.stepPrev')}</span>
        <span className={styles.value}>{info.stepPx} {t('units.px')}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t('dotTooltip.stepNext')}</span>
        <span className={styles.value}>
          {info.nextStepPx !== null ? `${info.nextStepPx} ${t('units.px')}` : '—'}
        </span>
      </div>
      {info.crossAxisInfo && (
        <>
          <hr className={styles.separator} />
          <div className={styles.cross}>
            {t('dotTooltip.cross')}: {t(`wings.${info.crossAxisInfo.dir}`)} #{info.crossAxisInfo.index}{' '}
            <span className={styles.crossValue}>
              Δ {info.crossAxisInfo.distancePx} {t('units.px')}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
