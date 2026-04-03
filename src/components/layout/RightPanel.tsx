import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { WingKey } from '../../App'
import RasterTable from '../table/RasterTable'
import SummaryCards from './SummaryCards'
import styles from './RightPanel.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  activeWing: WingKey
  setActiveWing: (w: WingKey) => void
  tableOpen: boolean
  setTableOpen: (open: boolean) => void
}

export default function RightPanel({ scope, reticle, activeWing, setActiveWing, tableOpen, setTableOpen }: Props) {
  return (
    <aside
      className={styles.panel}
      style={{ width: tableOpen ? 340 : 36, minWidth: tableOpen ? 340 : 36 }}
    >
      {tableOpen ? (
        <>
          <button className={styles.collapseBtn} onClick={() => setTableOpen(false)}>◂</button>
          <RasterTable
            scope={scope}
            reticle={reticle}
            activeWing={activeWing}
            setActiveWing={setActiveWing}
          />
          <SummaryCards scope={scope} reticle={reticle} activeWing={activeWing} />
        </>
      ) : (
        <div className={styles.collapsedInner} onClick={() => setTableOpen(true)}>
          <span className={styles.collapsedText}>ТАБЛИЦА ▸</span>
        </div>
      )}
    </aside>
  )
}
