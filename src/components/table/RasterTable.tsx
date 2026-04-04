import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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

export default function RasterTable({ scope, reticle, activeWing, setActiveWing }: Props) {
  const { t } = useTranslation()
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])

  const tabLabels: Record<WingKey, string> = {
    up: t('rasterTable.tabUp'),
    down: t('rasterTable.tabDown'),
    left: t('rasterTable.tabLeft'),
    right: t('rasterTable.tabRight'),
  }

  const wingNames: Record<WingKey, string> = {
    up: t('rasterTable.wingNames.up'),
    down: t('rasterTable.wingNames.down'),
    left: t('rasterTable.wingNames.left'),
    right: t('rasterTable.wingNames.right'),
  }

  const strategyLabels: Record<string, string> = {
    independent: t('strategyFull.independentLabel'),
    fixed_step: t('strategyFull.fixedStepLabel'),
  }

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

  const stepsText = steps.allEqual
    ? t('rasterTable.summaryStepsAll', { step: steps.min })
    : t('rasterTable.summaryStepsRange', { min: steps.min, max: steps.max })

  return (
    <div className={styles.section}>
      <div className={styles.titleRow}>
        <span className={styles.title}>{t('rasterTable.title')}</span>
        <Tooltip text={t('rasterTable.titleTooltip')} />
      </div>

      <div className={styles.tabs}>
        {(['up', 'down', 'left', 'right'] as const).map(tab => {
          const w = reticle.wings[tab]
          const off = !w.enabled || w.length <= 0
          return (
            <button
              key={tab}
              className={`${styles.tab} ${activeWing === tab ? styles.tabActive : ''} ${off ? styles.tabOff : ''}`}
              onClick={() => setActiveWing(tab)}
            >
              {tabLabels[tab]}
            </button>
          )
        })}
      </div>

      {disabled ? (
        <div className={styles.empty}>{t('rasterTable.wingDisabled')}</div>
      ) : marks.length === 0 ? (
        <div className={styles.empty}>{t('rasterTable.dotsNotConfigured')}</div>
      ) : (
        <>
          <div className={styles.summary}>
            {t('rasterTable.summary', {
              name: wingNames[activeWing],
              count: marks.length,
              error: maxError.toFixed(2),
              steps: stepsText,
            })}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th><span className={styles.thContent}>{t('rasterTable.colIndex')}<Tooltip text={t('rasterTable.colIndexTooltip')} /></span></th>
                  <th><span className={styles.thContent}>{t('rasterTable.colMrad')}<Tooltip text={t('rasterTable.colMradTooltip')} /></span></th>
                  <th><span className={styles.thContent}>{t('rasterTable.colPx')}<Tooltip text={t('rasterTable.colPxTooltip')} /></span></th>
                  <th><span className={styles.thContent}>{t('rasterTable.colActual')}<Tooltip text={t('rasterTable.colActualTooltip')} /></span></th>
                  <th><span className={styles.thContent}>{t('rasterTable.colError')}<Tooltip text={t('rasterTable.colErrorTooltip')} align="left" /></span></th>
                  <th><span className={styles.thContent}>{t('rasterTable.colStep')}<Tooltip text={t('rasterTable.colStepTooltip')} align="left" /></span></th>
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
            <div>{t('rasterTable.totals.totalMarks', { count: marks.length })}</div>
            <div>{t('rasterTable.totals.maxError', { value: maxError.toFixed(2) })}</div>
            <div>{t('rasterTable.totals.stepRange', { value: steps.allEqual ? `${steps.min} ${t('units.px')}` : `${steps.min}\u2013${steps.max} ${t('units.px')}` })}</div>
            <div>{t('rasterTable.totals.lastMarkError', { value: `${lastError >= 0 ? '+' : ''}${lastError.toFixed(2)}`, type: reticle.rasterization === 'fixed_step' ? t('rasterTable.totals.accumulated') : t('rasterTable.totals.noAccumulation') })}</div>
            <div>{t('rasterTable.totals.strategy', { value: strategyLabels[reticle.rasterization] || reticle.rasterization })}</div>
          </div>

          <div className={styles.legend}>
            <div className={styles.legendTitle}>{t('rasterTable.legend.title')}</div>
            <div className={styles.legendRow}><span className={styles.dotGreen} /> {t('rasterTable.legend.excellent')}</div>
            <div className={styles.legendRow}><span className={styles.dotGray} /> {t('rasterTable.legend.acceptable')}</div>
            <div className={styles.legendRow}><span className={styles.dotOrange} /> {t('rasterTable.legend.noticeable')}</div>
            <div className={styles.legendRow}><span className={styles.dotOrange} /> {t('rasterTable.legend.unevenStep')}</div>
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
