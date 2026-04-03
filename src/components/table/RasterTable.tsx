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
  up: '\u2191 \u0412\u0435\u0440\u0445\u043d\u0435\u0435',
  down: '\u2193 \u041d\u0438\u0436\u043d\u0435\u0435',
  left: '\u2190 \u041b\u0435\u0432\u043e\u0435',
  right: '\u2192 \u041f\u0440\u0430\u0432\u043e\u0435',
}

const wingNames: Record<WingKey, string> = {
  up: '\u0412\u0415\u0420\u0425\u041d\u0415\u0415',
  down: '\u041d\u0418\u0416\u041d\u0415\u0415',
  left: '\u041b\u0415\u0412\u041e\u0415',
  right: '\u041f\u0420\u0410\u0412\u041e\u0415',
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
        <span className={styles.title}>{'\u0422\u0410\u0411\u041b\u0418\u0426\u0410 \u0420\u0410\u0421\u0422\u0415\u0420\u0418\u0417\u0410\u0426\u0418\u0418'}</span>
        <Tooltip text={'\u0422\u043e\u0447\u043d\u044b\u0435 \u043a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u044b \u043a\u0430\u0436\u0434\u043e\u0439 \u043c\u0435\u0442\u043a\u0438 \u0432 \u043f\u0438\u043a\u0441\u0435\u043b\u044f\u0445 \u0438 MRAD. \u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442 \u043a\u0443\u0434\u0430 \u0440\u0435\u0430\u043b\u044c\u043d\u043e \u0432\u0441\u0442\u0430\u043d\u0435\u0442 \u043a\u0430\u0436\u0434\u0430\u044f \u0442\u043e\u0447\u043a\u0430 \u043d\u0430 \u0434\u0438\u0441\u043f\u043b\u0435\u0435 \u0438 \u043d\u0430\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u043e\u043d\u0430 \u043e\u0442\u043a\u043b\u043e\u043d\u044f\u0435\u0442\u0441\u044f \u043e\u0442 \u0438\u0434\u0435\u0430\u043b\u0430. \u0422\u0430\u0431\u043b\u0438\u0446\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u0442\u0441\u044f \u0432 JSON \u0438 \u043c\u043e\u0436\u0435\u0442 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c\u0441\u044f \u043a\u0430\u043a \u0441\u043f\u0435\u0446\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044f \u0434\u043b\u044f \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0441\u0442\u0432\u0430'} />
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
        <div className={styles.empty}>{'\u041a\u0440\u044b\u043b\u043e \u0432\u044b\u043a\u043b\u044e\u0447\u0435\u043d\u043e'}</div>
      ) : marks.length === 0 ? (
        <div className={styles.empty}>{'\u0422\u043e\u0447\u043a\u0438 \u043d\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d\u044b'}</div>
      ) : (
        <>
          <div className={styles.summary}>
            {wingNames[activeWing]} &bull; {marks.length} {'\u043c\u0435\u0442\u043e\u043a'} &bull; {'\u043c\u0430\u043a\u0441. \u043e\u0448\u0438\u0431\u043a\u0430'} {maxError.toFixed(2)} {'\u043f\u0438\u043a\u0441'} &bull; {'\u0448\u0430\u0433\u0438:'} {steps.allEqual ? `\u0432\u0441\u0435 = ${steps.min}` : `${steps.min}\u2013${steps.max}`} {'\u043f\u0438\u043a\u0441'}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th><span className={styles.thContent}>#<Tooltip text={'\u041f\u043e\u0440\u044f\u0434\u043a\u043e\u0432\u044b\u0439 \u043d\u043e\u043c\u0435\u0440 \u0442\u043e\u0447\u043a\u0438 \u043e\u0442 \u0446\u0435\u043d\u0442\u0440\u0430. \u041c\u0435\u0442\u043a\u0430 #1 \u0441\u0442\u043e\u0438\u0442 \u0431\u043b\u0438\u0436\u0435 \u0432\u0441\u0435\u0433\u043e \u043a \u043f\u0435\u0440\u0435\u043a\u0440\u0435\u0441\u0442\u0438\u044e, \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u044f\u044f \u2014 \u043d\u0430 \u043a\u0440\u0430\u044e \u043a\u0440\u044b\u043b\u0430. \u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u043c\u0435\u0442\u043e\u043a = \u0434\u043b\u0438\u043d\u0430 \u043a\u0440\u044b\u043b\u0430 \u00f7 \u0438\u043d\u0442\u0435\u0440\u0432\u0430\u043b (\u0434\u0440\u043e\u0431\u043d\u044b\u0435 \u043e\u0442\u0431\u0440\u0430\u0441\u044b\u0432\u0430\u044e\u0442\u0441\u044f)'} /></span></th>
                  <th><span className={styles.thContent}>MRAD<Tooltip text={'\u0413\u0434\u0435 \u043c\u0435\u0442\u043a\u0430 \u0414\u041e\u041b\u0416\u041d\u0410 \u0441\u0442\u043e\u044f\u0442\u044c \u043f\u043e \u0440\u0430\u0441\u0447\u0451\u0442\u0443: \u043d\u043e\u043c\u0435\u0440 \u00d7 \u0438\u043d\u0442\u0435\u0440\u0432\u0430\u043b. \u042d\u0442\u043e \u0434\u0440\u043e\u0431\u043d\u043e\u0435 \u0447\u0438\u0441\u043b\u043e \u2014 \u0442\u043e\u0447\u043d\u0430\u044f \u043c\u0430\u0442\u0435\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u043f\u043e\u0437\u0438\u0446\u0438\u044f, \u043a\u043e\u0442\u043e\u0440\u0430\u044f \u043d\u0435 \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043e\u0442 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0439 \u043f\u0438\u043a\u0441\u0435\u043b\u0435\u0439'} /></span></th>
                  <th><span className={styles.thContent}>{'\u043f\u0438\u043a\u0441'}<Tooltip text={'\u0413\u0434\u0435 \u043c\u0435\u0442\u043a\u0430 \u0420\u0415\u0410\u041b\u042c\u041d\u041e \u0432\u0441\u0442\u0430\u043d\u0435\u0442 \u043d\u0430 \u0434\u0438\u0441\u043f\u043b\u0435\u0435 \u2014 \u0446\u0435\u043b\u043e\u0435 \u0447\u0438\u0441\u043b\u043e \u043f\u0438\u043a\u0441\u0435\u043b\u0435\u0439. \u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u0440\u0430\u0431\u043e\u0442\u044b \u0441\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u0438 \u0440\u0430\u0441\u0442\u0435\u0440\u0438\u0437\u0430\u0446\u0438\u0438. \u0418\u043c\u0435\u043d\u043d\u043e \u044d\u0442\u0438 \u0447\u0438\u0441\u043b\u0430 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u044e\u0442\u0441\u044f \u043f\u0440\u0438 \u044d\u043a\u0441\u043f\u043e\u0440\u0442\u0435 PNG \u0438 \u043f\u0435\u0440\u0435\u0434\u0430\u0447\u0435 \u0441\u043f\u0435\u0446\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u0438 \u043d\u0430 \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0441\u0442\u0432\u043e'} /></span></th>
                  <th><span className={styles.thContent}>{'\u0444\u0430\u043a\u0442.'}<Tooltip text={'\u041a\u0430\u043a\u043e\u0439 MRAD \u0440\u0435\u0430\u043b\u044c\u043d\u043e \u043f\u043e\u043b\u0443\u0447\u0438\u043b\u0441\u044f: \u043f\u0438\u043a\u0441 \u00f7 (\u043f\u0438\u043a\u0441\u0435\u043b\u0435\u0439 \u043d\u0430 MRAD). \u041f\u043e\u0437\u0432\u043e\u043b\u044f\u0435\u0442 \u043e\u0446\u0435\u043d\u0438\u0442\u044c \u0440\u0435\u0430\u043b\u044c\u043d\u0443\u044e \u0443\u0433\u043b\u043e\u0432\u0443\u044e \u043f\u043e\u0437\u0438\u0446\u0438\u044e \u043c\u0435\u0442\u043a\u0438 \u043f\u043e\u0441\u043b\u0435 \u043e\u043a\u0440\u0443\u0433\u043b\u0435\u043d\u0438\u044f. \u0421\u0440\u0430\u0432\u043d\u0438\u0442\u0435 \u0441 \u043a\u043e\u043b\u043e\u043d\u043a\u043e\u0439 MRAD \u2014 \u0440\u0430\u0437\u043d\u0438\u0446\u0430 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442 \u0443\u0433\u043b\u043e\u0432\u0443\u044e \u043e\u0448\u0438\u0431\u043a\u0443'} /></span></th>
                  <th><span className={styles.thContent}>{'\u043e\u0448\u0438\u0431\u043a\u0430'}<Tooltip text={'\u041d\u0430\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0440\u0435\u0430\u043b\u044c\u043d\u0430\u044f \u043f\u043e\u0437\u0438\u0446\u0438\u044f \u043e\u0442\u043b\u0438\u0447\u0430\u0435\u0442\u0441\u044f \u043e\u0442 \u0438\u0434\u0435\u0430\u043b\u044c\u043d\u043e\u0439: \u043f\u0438\u043a\u0441_\u0444\u0430\u043a\u0442 \u2212 \u043f\u0438\u043a\u0441_\u0438\u0434\u0435\u0430\u043b. \u0417\u043d\u0430\u043a \u00ab+\u00bb \u2014 \u043c\u0435\u0442\u043a\u0430 \u0441\u0434\u0432\u0438\u043d\u0443\u0442\u0430 \u0434\u0430\u043b\u044c\u0448\u0435 \u043e\u0442 \u0446\u0435\u043d\u0442\u0440\u0430, \u00ab\u2212\u00bb \u2014 \u0431\u043b\u0438\u0436\u0435. \u0417\u0435\u043b\u0451\u043d\u044b\u0439 (\u22640.1) \u2014 \u043e\u0442\u043b\u0438\u0447\u043d\u043e, \u0441\u0435\u0440\u044b\u0439 (\u22640.4) \u2014 \u043d\u043e\u0440\u043c\u0430\u043b\u044c\u043d\u043e, \u044f\u043d\u0442\u0430\u0440\u043d\u044b\u0439 (>0.4) \u2014 \u0437\u0430\u043c\u0435\u0442\u043d\u043e \u043d\u0430 \u043f\u0440\u0430\u043a\u0442\u0438\u043a\u0435'} /></span></th>
                  <th><span className={styles.thContent}>{'\u0448\u0430\u0433'}<Tooltip text={'\u0421\u043a\u043e\u043b\u044c\u043a\u043e \u043f\u0438\u043a\u0441\u0435\u043b\u0435\u0439 \u043c\u0435\u0436\u0434\u0443 \u044d\u0442\u043e\u0439 \u043c\u0435\u0442\u043a\u043e\u0439 \u0438 \u043f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0435\u0439. \u0414\u043b\u044f \u0441\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u0438 \u0411 \u0432\u0441\u0435 \u0448\u0430\u0433\u0438 \u043e\u0434\u0438\u043d\u0430\u043a\u043e\u0432\u044b\u0435. \u0414\u043b\u044f \u0410 \u0438 \u0412 \u2014 \u0447\u0435\u0440\u0435\u0434\u0443\u044e\u0442\u0441\u044f \u0434\u0432\u0430 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u044f (floor \u0438 ceil). \u042f\u043d\u0442\u0430\u0440\u043d\u044b\u0439 \u0446\u0432\u0435\u0442 = \u0448\u0430\u0433 \u043e\u0442\u043b\u0438\u0447\u0430\u0435\u0442\u0441\u044f \u043e\u0442 \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u0448\u0430\u0433\u0430, \u0447\u0442\u043e \u0443\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442 \u043d\u0430 \u0432\u0438\u0437\u0443\u0430\u043b\u044c\u043d\u0443\u044e \u043d\u0435\u0440\u0430\u0432\u043d\u043e\u043c\u0435\u0440\u043d\u043e\u0441\u0442\u044c'} /></span></th>
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
            <div>{'\u0412\u0441\u0435\u0433\u043e \u043c\u0435\u0442\u043e\u043a:'} {marks.length}</div>
            <div>{'\u041c\u0430\u043a\u0441. \u043e\u0448\u0438\u0431\u043a\u0430:'} {maxError.toFixed(2)} {'\u043f\u0438\u043a\u0441'}</div>
            <div>{'\u0428\u0430\u0433\u0438:'} {steps.allEqual ? `\u0432\u0441\u0435 = ${steps.min} \u043f\u0438\u043a\u0441` : `\u043e\u0442 ${steps.min} \u0434\u043e ${steps.max} \u043f\u0438\u043a\u0441`}</div>
            <div>{'\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0439 \u043c\u0435\u0442\u043a\u0438:'} {lastError >= 0 ? '+' : ''}{lastError.toFixed(2)} {'\u043f\u0438\u043a\u0441'}{reticle.rasterization === 'fixed_step' ? ' (\u043d\u0430\u043a\u043e\u043f\u043b\u0435\u043d\u043d\u0430\u044f \u2014 \u0448\u043a\u0430\u043b\u0430 \u0440\u0430\u0441\u0442\u044f\u043d\u0443\u0442\u0430/\u0441\u0436\u0430\u0442\u0430)' : ' (\u0431\u0435\u0437 \u043d\u0430\u043a\u043e\u043f\u043b\u0435\u043d\u0438\u044f)'}</div>
          </div>

          <div className={styles.legend}>
            <div className={styles.legendTitle}>{'\u0426\u0432\u0435\u0442\u0430:'}</div>
            <div className={styles.legendRow}><span className={styles.dotGreen} /> {'\u2264 0.1 \u043f\u0438\u043a\u0441 \u2014 \u043e\u0442\u043b\u0438\u0447\u043d\u043e'}</div>
            <div className={styles.legendRow}><span className={styles.dotGray} /> {'\u2264 0.4 \u043f\u0438\u043a\u0441 \u2014 \u043d\u043e\u0440\u043c\u0430\u043b\u044c\u043d\u043e'}</div>
            <div className={styles.legendRow}><span className={styles.dotOrange} /> {'> 0.4 \u043f\u0438\u043a\u0441 \u2014 \u0437\u0430\u043c\u0435\u0442\u043d\u043e'}</div>
            <div className={styles.legendRow}><span className={styles.dotOrange} /> {'\u044f\u043d\u0442\u0430\u0440\u043d\u044b\u0439 \u0448\u0430\u0433 \u2014 \u043d\u0435\u0440\u0430\u0432\u043d\u043e\u043c\u0435\u0440\u043d\u043e'}</div>
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
