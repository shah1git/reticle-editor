import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import styles from './LeftPanel.module.css'

interface Props {
  scope: ScopeProfile
  setScope: (s: ScopeProfile) => void
  reticle: Reticle
  setReticle: (r: Reticle) => void
}

export default function LeftPanel({ scope, setScope, reticle, setReticle }: Props) {
  return (
    <aside className={styles.panel}>
      <div className={styles.placeholder}>Left Panel</div>
    </aside>
  )
}
