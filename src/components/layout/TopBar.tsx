import { useRef } from 'react'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import { saveToJson, loadFromJson } from '../../utils/fileIO'
import { exportPng } from '../../utils/exportPng'
import styles from './TopBar.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  setScope: (s: ScopeProfile) => void
  setReticle: (r: Reticle) => void
}

export default function TopBar({ scope, reticle, setScope, setReticle }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleLoad = () => fileRef.current?.click()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      loadFromJson(file, setScope, setReticle)
      e.target.value = ''
    }
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <img src={import.meta.env.BASE_URL + 'logo.svg'} alt="RIKA" className={styles.logo} />
        <span className={styles.title}>RETICLE EDITOR</span>
      </div>
      <div className={styles.right}>
        <button className={styles.btn} onClick={() => saveToJson(scope, reticle)}>SAVE</button>
        <button className={styles.btn} onClick={handleLoad}>LOAD</button>
        <button className={styles.btnAccent} onClick={() => exportPng(scope, reticle)}>EXPORT PNG</button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </header>
  )
}
