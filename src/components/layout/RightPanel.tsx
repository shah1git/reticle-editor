import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { WingKey } from '../../App'
import Canvas from './Canvas'
import SummaryCards from './SummaryCards'
import styles from './RightPanel.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  activeWing: WingKey
}

export default function RightPanel({ scope, reticle, activeWing }: Props) {
  return (
    <aside className={styles.panel}>
      <div className={styles.canvasWrap}>
        <Canvas scope={scope} reticle={reticle} />
      </div>
      <SummaryCards scope={scope} reticle={reticle} activeWing={activeWing} />
    </aside>
  )
}
