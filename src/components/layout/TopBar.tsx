import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

declare const __APP_VERSION__: string
import type { ScopeProfile } from '../../types/scope'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import { exportPng } from '../../utils/exportPng'
import { exportBmp } from '../../utils/exportBmp'
import { getOpenFilePicker } from '../../types/fileSystemAccess'
import DescribeModal from '../ui/DescribeModal'
import BmpScalePicker from '../ui/BmpScalePicker'
import LanguageSwitcher from './LanguageSwitcher'
import styles from './TopBar.module.css'

interface Props {
  scope: ScopeProfile
  reticle: Reticle
  ppm: PixelsPerMrad
  magnification: number
  loadedFileName: string | null
  loadedFileHandle: FileSystemFileHandle | null
  onAcceptFile: (file: File, handle?: FileSystemFileHandle | null) => void
  onSave: () => void | Promise<void>
  onSaveAs: () => void | Promise<void>
}

export default function TopBar({
  scope, reticle, ppm, magnification,
  loadedFileName, loadedFileHandle, onAcceptFile, onSave, onSaveAs,
}: Props) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [describeOpen, setDescribeOpen] = useState(false)
  const [bmpPickerOpen, setBmpPickerOpen] = useState(false)

  const handleLoad = async () => {
    const picker = getOpenFilePicker()
    if (picker) {
      try {
        const [handle] = await picker({
          types: [{ description: 'Reticle JSON', accept: { 'application/json': ['.json'] } }],
          multiple: false,
        })
        const file = await handle.getFile()
        onAcceptFile(file, handle)
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
      onAcceptFile(file)
      e.target.value = ''
    }
  }

  const saveTip = loadedFileName
    ? (loadedFileHandle ? t('topbar.saveTipOverwrite', { name: loadedFileName }) : t('topbar.saveTipDownload', { name: loadedFileName }))
    : t('topbar.saveTipNew')

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
        <button className={styles.btn} onClick={() => onSave()} title={saveTip}>
          <span className={styles.btnText}>{t('topbar.save')}</span>
          <span className={styles.btnIcon}>{'💾'}</span>
        </button>
        <button className={styles.btn} onClick={() => onSaveAs()} title={t('topbar.saveAsTip')}>
          <span className={styles.btnText}>{t('topbar.saveAs')}</span>
          <span className={styles.btnIcon}>{'💾'}</span>
        </button>
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
