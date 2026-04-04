import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import { saveToJson, loadFromJson } from '../../utils/fileIO'
import { exportPng } from '../../utils/exportPng'
import LanguageSwitcher from './LanguageSwitcher'
import styles from './TopBar.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  setScope: (s: ScopeProfile) => void
  setReticle: (r: Reticle) => void
}

export default function TopBar({ scope, reticle, setScope, setReticle }: Props) {
  const { t } = useTranslation()
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
        <span className={styles.title}>{t('topbar.title')}</span>
        <LanguageSwitcher />
      </div>
      <div className={styles.right}>
        <button className={styles.btn} onClick={handleLoad}>{t('topbar.open')}</button>
        <button className={styles.btn} onClick={() => saveToJson(scope, reticle)}>{t('topbar.save')}</button>
        <button className={styles.btnAccent} onClick={() => exportPng(scope, reticle)}>{t('topbar.exportPng')}</button>
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
