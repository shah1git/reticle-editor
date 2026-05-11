import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Reticle, Primitive } from '../../types/reticle'
import { serializeReticle, deserializeReticle } from '../../export/json'
import { nextLineEndpoints, nextDotPosition } from '../../defaults'
import styles from './Toolbar.module.css'

interface Props {
  reticle: Reticle
  onNameChange: (name: string) => void
  onAddPrimitive: (p: Primitive) => void
  onReplaceReticle: (r: Reticle) => void
  onSelect: (id: string | null) => void
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'id-' + Math.random().toString(36).slice(2) + '-' + Date.now()
}

export default function Toolbar({ reticle, onNameChange, onAddPrimitive, onReplaceReticle, onSelect }: Props) {
  const { t } = useTranslation()
  const importRef = useRef<HTMLInputElement>(null)

  const addLine = () => {
    const pos = nextLineEndpoints(reticle.primitives)
    const p: Primitive = { id: makeId(), type: 'line', ...pos, thickness: 0.05 }
    onAddPrimitive(p)
    onSelect(p.id)
  }

  const addDot = () => {
    const pos = nextDotPosition(reticle.primitives)
    const p: Primitive = { id: makeId(), type: 'dot', ...pos, size: 0.2 }
    onAddPrimitive(p)
    onSelect(p.id)
  }

  const exportJson = () => {
    const blob = new Blob([serializeReticle(reticle)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safeName = (reticle.name || 'reticle').replace(/[^\w.-]+/g, '_')
    a.href = url
    a.download = `${safeName}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const r = deserializeReticle(String(reader.result ?? ''))
      if (r) onReplaceReticle(r)
    }
    reader.readAsText(file)
  }

  return (
    <div className={styles.toolbar}>
      <input
        type="text"
        className={styles.nameInput}
        value={reticle.name}
        onChange={e => onNameChange(e.target.value)}
        placeholder={t('optical.toolbar.namePlaceholder')}
        aria-label={t('optical.toolbar.name')}
      />
      <div className={styles.spacer} />
      <button type="button" className={styles.btn} onClick={addLine}>{t('optical.toolbar.addLine')}</button>
      <button type="button" className={styles.btn} onClick={addDot}>{t('optical.toolbar.addDot')}</button>
      <span className={styles.sep} />
      <button type="button" className={styles.btn} onClick={exportJson}>{t('optical.toolbar.exportJson')}</button>
      <button type="button" className={styles.btn} onClick={() => importRef.current?.click()}>
        {t('optical.toolbar.importJson')}
      </button>
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        className={styles.hiddenFile}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) importJson(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
