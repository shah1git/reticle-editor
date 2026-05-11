import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import LanguageSwitcher from '../shared/i18n/LanguageSwitcher'
import { useReticleState } from './hooks/useReticleState'
import ReticleCanvas from './components/canvas/ReticleCanvas'
import ScopeProfilePanel from './components/scope/ScopeProfilePanel'
import PrimitiveList from './components/primitives/PrimitiveList'
import PrimitiveEditor from './components/primitives/PrimitiveEditor'
import Toolbar from './components/toolbar/Toolbar'
import styles from './OpticalApp.module.css'

export default function OpticalApp() {
  const { t } = useTranslation()
  const {
    reticle,
    selectedId,
    setScope,
    setName,
    addPrimitive,
    updatePrimitive,
    removePrimitive,
    selectPrimitive,
    replaceReticle,
  } = useReticleState()

  const selectedPrimitive = useMemo(
    () => reticle.primitives.find(p => p.id === selectedId) ?? null,
    [reticle.primitives, selectedId],
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>{t('optical.backToLanding')}</Link>
        <h1 className={styles.title}>{t('optical.title')}</h1>
        <LanguageSwitcher />
      </header>

      <div className={styles.body}>
        <aside className={styles.leftCol}>
          <ScopeProfilePanel scope={reticle.scope} onChange={setScope} />
        </aside>

        <main className={styles.centerCol}>
          <Toolbar
            reticle={reticle}
            onNameChange={setName}
            onAddPrimitive={addPrimitive}
            onReplaceReticle={replaceReticle}
            onSelect={selectPrimitive}
          />
          <div className={styles.canvasWrap}>
            <ReticleCanvas
              primitives={reticle.primitives}
              selectedId={selectedId}
              onSelect={selectPrimitive}
            />
          </div>
        </main>

        <aside className={styles.rightCol}>
          <PrimitiveList
            primitives={reticle.primitives}
            selectedId={selectedId}
            onSelect={selectPrimitive}
            onRemove={removePrimitive}
          />
          <PrimitiveEditor
            primitive={selectedPrimitive}
            onChange={patch => selectedId && updatePrimitive(selectedId, patch)}
          />
        </aside>
      </div>
    </div>
  )
}
