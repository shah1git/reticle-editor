import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import styles from './Canvas.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
}

export default function Canvas({ scope, reticle }: Props) {
  return (
    <div className={styles.canvas}>
      <svg width="100%" height="100%">
        <text x="50%" y="50%" fill="#6b7394" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="12">
          Canvas — SVG Reticle View
        </text>
      </svg>
    </div>
  )
}
