import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

declare const __APP_VERSION__: string
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import { saveToJson, loadFromJson } from '../../utils/fileIO'
import { exportPng } from '../../utils/exportPng'
import { exportBmp } from '../../utils/exportBmp'
import { describeReticle } from '../../utils/describeReticle'
import DescribeModal from '../ui/DescribeModal'
import LanguageSwitcher from './LanguageSwitcher'
import styles from './TopBar.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  setScope: (s: ScopeProfile) => void
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
  magnification: number
}

export default function TopBar({ scope, reticle, setScope, setReticle, ppm, magnification }: Props) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [describeText, setDescribeText] = useState<string | null>(null)

  const handleDescribe = () => {
    setDescribeText(describeReticle(scope, reticle, ppm, magnification, t))
  }

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
        <span className={styles.version}>v{__APP_VERSION__}</span>
        <LanguageSwitcher />
      </div>
      <div className={styles.right}>
        <button className={styles.btn} onClick={handleLoad}>
          <span className={styles.btnText}>{t('topbar.open')}</span>
          <span className={styles.btnIcon}>{'\ud83d\udcc2'}</span>
        </button>
        <button className={styles.btn} onClick={() => saveToJson(scope, reticle)}>
          <span className={styles.btnText}>{t('topbar.save')}</span>
          <span className={styles.btnIcon}>{'\ud83d\udcbe'}</span>
        </button>
        <button className={styles.btn} onClick={handleDescribe} title={t('describe.title')}>
          <span className={styles.btnText}>{t('topbar.describe')}</span>
          <span className={styles.btnIcon}>{'\ud83d\udccb'}</span>
        </button>
        <button className={styles.btnAccent} onClick={() => exportPng(scope, reticle)}>
          <span className={styles.btnText}>{t('topbar.exportPng')}</span>
          <span className={styles.btnIcon}>{'\u2b07'}</span>
        </button>
        <button className={styles.btnAccent} onClick={() => exportBmp(scope, reticle)}>
          <span className={styles.btnText}>{t('topbar.exportBmp')}</span>
          <span className={styles.btnIcon}>{'\u2b07'}</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {describeText !== null && (
        <DescribeModal text={describeText} onClose={() => setDescribeText(null)} />
      )}
    </header>
  )
}
