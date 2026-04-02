import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import styles from './TopBar.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  setScope: (s: ScopeProfile) => void
  setReticle: (r: Reticle) => void
}

export default function TopBar({ scope, reticle, setScope, setReticle }: Props) {
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <span className={styles.logo}>◎</span>
        <span className={styles.title}>RETICLE EDITOR</span>
      </div>
      <div className={styles.right}>
        <button className={styles.btn}>SAVE</button>
        <button className={styles.btn}>LOAD</button>
        <button className={styles.btnAccent}>EXPORT PNG</button>
      </div>
    </header>
  )
}
