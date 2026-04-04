import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { WingKey } from '../../App'
import { rasterize } from '../../math/rasterization'
import Tooltip from '../ui/Tooltip'
import styles from './RasterTable.module.css'

interface Props {
  reticle: Reticle
  ppm: PixelsPerMrad
  magnification: number
  focalPlane: 'ffp' | 'sfp'
  activeWing: WingKey
  setActiveWing: (w: WingKey) => void
}

const MAG_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8]

export default function RasterTable({ reticle, ppm, magnification, focalPlane, activeWing, setActiveWing }: Props) {
  const { t } = useTranslation()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

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

  const wing = reticle.wings[activeWing]
  const axisPpm = (activeWing === 'down' || activeWing === 'up') ? ppm.v : ppm.h
  const baseAxisPpm = focalPlane === 'ffp' && magnification > 0 ? axisPpm / magnification : axisPpm

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

  const magDetail = useMemo(() => {
    if (hoveredIndex === null || !wing.enabled || wing.length <= 0 || !wing.dots.enabled || wing.dots.spacing <= 0) return null
    const count = Math.floor(wing.length / wing.dots.spacing)
    if (count <= 0) return null

    return MAG_PRESETS.map(m => {
      const magPpm = focalPlane === 'ffp' ? baseAxisPpm * m : baseAxisPpm
      const allMarks = rasterize(reticle.rasterization, wing.dots.spacing, magPpm, count)
      const mark = allMarks.find(mk => mk.index === hoveredIndex)
      if (!mark) return null
      return { mag: m, ppmVal: magPpm, mark }
    }).filter(Boolean) as { mag: number; ppmVal: number; mark: (typeof marks)[number] }[]
  }, [hoveredIndex, wing, reticle.rasterization, focalPlane, baseAxisPpm])

  const modalStep = marks.length > 0 ? marks[0].stepPx : 0
  const disabled = !wing.enabled || wing.length <= 0

  const stepsText = steps.allEqual
    ? t('rasterTable.summaryStepsAll', { step: steps.min })
    : t('rasterTable.summaryStepsRange', { min: steps.min, max: steps.max })

  const magInfo = magnification > 1
    ? ` \u00b7 [${magnification}\u00d7 ${focalPlane.toUpperCase()} \u00b7 ${axisPpm.toFixed(1)} ${t('toolbar.pixPerMrad')}]`
    : ''

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
            })}{magInfo}
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
                  <tr
                    key={m.index}
                    onMouseEnter={() => setHoveredIndex(m.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={hoveredIndex === m.index ? styles.rowHovered : ''}
                  >
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

          {magDetail && magDetail.length > 0 && (
            <div className={styles.magDetail}>
              <div className={styles.magDetailTitle}>
                #{hoveredIndex} {'\u00b7'} {magDetail[0].mark.targetMrad.toFixed(2)} {t('units.mrad')} @ {t('magnification.label')}
              </div>
              <table className={styles.magTable}>
                <thead>
                  <tr>
                    <th>M</th>
                    <th>{t('toolbar.pixPerMrad')}</th>
                    <th>{t('rasterTable.colMrad')}</th>
                    <th>ideal {t('units.px')}</th>
                    <th>{t('rasterTable.colPx')}</th>
                    <th>{t('rasterTable.colError')}</th>
                    <th>{t('rasterTable.colStep')}</th>
                  </tr>
                </thead>
                <tbody>
                  {magDetail.map(d => (
                    <tr key={d.mag} className={d.mag === magnification ? styles.magRowCurrent : ''}>
                      <td>{d.mag}{'\u00d7'}</td>
                      <td>{d.ppmVal.toFixed(1)}</td>
                      <td>{d.mark.targetMrad.toFixed(2)}</td>
                      <td>{d.mark.targetPx.toFixed(2)}</td>
                      <td>{d.mark.actualPx}</td>
                      <td className={errorClass(d.mark.errorPx)}>{d.mark.errorPx >= 0 ? '+' : ''}{d.mark.errorPx.toFixed(2)}</td>
                      <td>{d.mark.stepPx}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
