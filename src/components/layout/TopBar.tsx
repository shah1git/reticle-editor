import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

declare const __APP_VERSION__: string
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import { saveToJson, saveToCurrentFile } from '../../utils/fileIO'
import { exportPng } from '../../utils/exportPng'
import { exportBmp } from '../../utils/exportBmp'
import { useFileLoader } from '../../hooks/useFileLoader'
import DescribeModal from '../ui/DescribeModal'
import BmpScalePicker from '../ui/BmpScalePicker'
import LanguageSwitcher from './LanguageSwitcher'
import styles from './TopBar.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  setScope: (s: ScopeProfile) => void
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
  magnification: number
  loadedFileName: string | null
  setLoadedFileName: (n: string | null) => void
  loadedFileHandle: FileSystemFileHandle | null
  setLoadedFileHandle: (h: FileSystemFileHandle | null) => void
}

interface ShowOpenFilePicker {
  (options?: {
    types?: { description?: string; accept: Record<string, string[]> }[]
    multiple?: boolean
    excludeAcceptAllOption?: boolean
  }): Promise<FileSystemFileHandle[]>
}

export default function TopBar({
  scope, reticle, setScope, setReticle, ppm, magnification,
  loadedFileName, setLoadedFileName, loadedFileHandle, setLoadedFileHandle,
}: Props) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [describeOpen, setDescribeOpen] = useState(false)
  const [bmpPickerOpen, setBmpPickerOpen] = useState(false)

  const { acceptFile } = useFileLoader(setScope, setReticle, setLoadedFileName, setLoadedFileHandle)

  const handleLoad = async () => {
    const picker = (window as unknown as { showOpenFilePicker?: ShowOpenFilePicker }).showOpenFilePicker
    if (picker) {
      try {
        const [handle] = await picker({
          types: [{ description: 'Reticle JSON', accept: { 'application/json': ['.json'] } }],
          multiple: false,
        })
        const file = await handle.getFile()
        acceptFile(file, handle)
        return
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return
        // Fall through to <input> fallback on any other error.
      }
    }
    fileRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      acceptFile(file)
      e.target.value = ''
    }
  }

  const handleSaveCurrent = async () => {
    if (!loadedFileName) return
    await saveToCurrentFile(scope, reticle, loadedFileName, loadedFileHandle)
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <img src={import.meta.env.BASE_URL + 'logo.svg'} alt="RIKA" className={styles.logo} />
        <span className={styles.title}>{t('topbar.title')}</span>
        <span className={styles.version}>v{__APP_VERSION__}</span>
        <LanguageSwitcher />
        {loadedFileName && (
          <span className={styles.fileName} title={loadedFileName}>{loadedFileName}</span>
        )}
      </div>
      <div className={styles.right}>
        <button className={styles.btn} onClick={handleLoad}>
          <span className={styles.btnText}>{t('topbar.open')}</span>
          <span className={styles.btnIcon}>{'📂'}</span>
        </button>
        <button className={styles.btn} onClick={() => saveToJson(scope, reticle)}>
          <span className={styles.btnText}>{t('topbar.save')}</span>
          <span className={styles.btnIcon}>{'💾'}</span>
        </button>
        {loadedFileName && (
          <button
            className={styles.btnAccent}
            onClick={handleSaveCurrent}
            title={loadedFileHandle ? t('topbar.saveCurrentTipOverwrite') : t('topbar.saveCurrentTipDownload')}
          >
            <span className={styles.btnText}>{t('topbar.saveCurrent')}</span>
            <span className={styles.btnIcon}>{'📝'}</span>
          </button>
        )}
        <button className={styles.btn} onClick={() => setDescribeOpen(true)} title={t('describe.title')}>
          <span className={styles.btnText}>{t('topbar.describe')}</span>
          <span className={styles.btnIcon}>{'📋'}</span>
        </button>
        <button className={styles.btnAccent} onClick={() => exportPng(scope, reticle)}>
          <span className={styles.btnText}>{t('topbar.exportPng')}</span>
          <span className={styles.btnIcon}>{'⬇'}</span>
        </button>
        <button className={styles.btnAccent} onClick={() => setBmpPickerOpen(true)}>
          <span className={styles.btnText}>{t('topbar.exportBmp')}</span>
          <span className={styles.btnIcon}>{'⬇'}</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {describeOpen && (
        <DescribeModal
          scope={scope}
          reticle={reticle}
          ppm={ppm}
          magnification={magnification}
          onClose={() => setDescribeOpen(false)}
        />
      )}
      {bmpPickerOpen && (
        <BmpScalePicker
          onPick={(k) => {
            exportBmp(scope, reticle, k)
            setBmpPickerOpen(false)
          }}
          onClose={() => setBmpPickerOpen(false)}
        />
      )}
    </header>
  )
}
