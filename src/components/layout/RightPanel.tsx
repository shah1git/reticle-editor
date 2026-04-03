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
}

export default function RightPanel({ scope, reticle, activeWing, setActiveWing }: Props) {
  return (
    <aside className={styles.panel}>
      <RasterTable
        scope={scope}
        reticle={reticle}
        activeWing={activeWing}
        setActiveWing={setActiveWing}
      />
      <SummaryCards scope={scope} reticle={reticle} activeWing={activeWing} />
    </aside>
  )
}
