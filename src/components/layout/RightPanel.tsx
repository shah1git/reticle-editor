import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import RasterTable from '../table/RasterTable'
import styles from './RightPanel.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
}

export default function RightPanel({ scope, reticle }: Props) {
  return (
    <aside className={styles.panel}>
      <RasterTable scope={scope} reticle={reticle} />
    </aside>
  )
}
