import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { WingKey } from '../../App'
import RasterTable from '../table/RasterTable'
import SummaryCards from './SummaryCards'
import styles from './BottomPanel.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  activeWing: WingKey
  setActiveWing: (w: WingKey) => void
}

const tabLabels: Record<WingKey, string> = {
  up: '\u2191 Верх',
  down: '\u2193 Низ',
  left: '\u2190 Лев',
  right: '\u2192 Прав',
}

export default function BottomPanel({ scope, reticle, activeWing, setActiveWing }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.sidebar}>
        <div className={styles.tabs}>
          {(['up', 'down', 'left', 'right'] as const).map(key => {
            const w = reticle.wings[key]
            const off = !w.enabled || w.length <= 0
            return (
              <button
                key={key}
                className={`${styles.tab} ${activeWing === key ? styles.tabActive : ''} ${off ? styles.tabOff : ''}`}
                onClick={() => setActiveWing(key)}
              >
                {tabLabels[key]}
              </button>
            )
          })}
        </div>
        <div className={styles.summaryWrap}>
          <SummaryCards scope={scope} reticle={reticle} activeWing={activeWing} />
        </div>
      </div>
      <div className={styles.tableArea}>
        <RasterTable
          scope={scope}
          reticle={reticle}
          activeWing={activeWing}
          setActiveWing={setActiveWing}
        />
      </div>
    </div>
  )
}
