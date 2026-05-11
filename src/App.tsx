import { useState, useCallback, useMemo, useEffect } from 'react'
import type { ScopeProfile } from './types/scope'
import type { Reticle } from './types/reticle'
import { defaultScope, defaultReticle } from './defaults'
import { saveToCurrentFile, saveAsJson, loadFromJson } from './utils/fileIO'
import { migrateReticle, migrateScope } from './utils/migrateReticle'
import { calcPixelsPerMrad } from './math/optics'
import { findBestStrategy } from './math/bestStrategy'
import { useKeyboard } from './hooks/useKeyboard'
import { useIsMobile } from './hooks/useIsMobile'
import TopBar from './components/layout/TopBar'
import Toolbar from './components/layout/Toolbar'
import LeftPanel from './components/layout/LeftPanel'
import Canvas from './components/layout/Canvas'
import RightPanel from './components/layout/RightPanel'
import MobileLayout from './components/layout/MobileLayout'
import './global.css'

export type WingKey = 'up' | 'down' | 'left' | 'right'

const STORAGE_KEY = 'reticle-editor-state'

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        scope: migrateScope(parsed.scope),
        reticle: migrateReticle(parsed.reticle),
      }
    }
  } catch {}
  return { scope: defaultScope, reticle: defaultReticle }
}

const initial = loadState()

export default function App() {
  const [scope, setScope] = useState<ScopeProfile>(initial.scope)
  const [reticle, setReticle] = useState<Reticle>(initial.reticle)
  const [activeWing, setActiveWing] = useState<WingKey>('down')
  const [magnification, setMagnification] = useState(1)
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null)
  const [loadedFileHandle, setLoadedFileHandle] = useState<FileSystemFileHandle | null>(null)
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])

  const effectivePpm = useMemo(
    () => ({ h: ppm.h * magnification, v: ppm.v * magnification }),
    [ppm, magnification],
  )

  const bestStrategy = useMemo(() => findBestStrategy(reticle, effectivePpm), [reticle, effectivePpm])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ scope, reticle }))
    } catch {}
  }, [scope, reticle])

  const acceptFile = useCallback((file: File, handle?: FileSystemFileHandle | null) => {
    loadFromJson(file, setScope, setReticle)
    setLoadedFileName(file.name)
    setLoadedFileHandle(handle ?? null)
  }, [])

  const handleSaveAs = useCallback(async () => {
    const result = await saveAsJson(scope, reticle, loadedFileName ?? undefined)
    if (result.cancelled) return
    setLoadedFileName(result.fileName)
    setLoadedFileHandle(result.handle)
  }, [scope, reticle, loadedFileName])

  const handleSave = useCallback(async () => {
    if (loadedFileName) {
      await saveToCurrentFile(scope, reticle, loadedFileName, loadedFileHandle)
    } else {
      await handleSaveAs()
    }
  }, [scope, reticle, loadedFileName, loadedFileHandle, handleSaveAs])

  useKeyboard({ onSave: handleSave })
  const isMobile = useIsMobile()

  const fileProps = {
    loadedFileName,
    loadedFileHandle,
    onAcceptFile: acceptFile,
    onSave: handleSave,
    onSaveAs: handleSaveAs,
  }

  if (isMobile) {
    return (
      <MobileLayout
        scope={scope} setScope={setScope}
        reticle={reticle} setReticle={setReticle}
        ppm={effectivePpm} bestStrategy={bestStrategy}
        activeWing={activeWing} setActiveWing={setActiveWing}
        magnification={magnification} setMagnification={setMagnification}
        {...fileProps}
      />
    )
  }

  return (
    <div className="app">
      <TopBar
        scope={scope} reticle={reticle}
        ppm={effectivePpm} magnification={magnification}
        {...fileProps}
      />
      <Toolbar scope={scope} setScope={setScope} reticle={reticle} setReticle={setReticle} ppm={effectivePpm} bestStrategy={bestStrategy} />
      <div className="app-body">
        <LeftPanel
          reticle={reticle} setReticle={setReticle}
          ppm={effectivePpm}
          activeWing={activeWing} setActiveWing={setActiveWing}
        />
        <Canvas
          scope={scope} reticle={reticle} setReticle={setReticle}
          ppm={effectivePpm}
          magnification={magnification} setMagnification={setMagnification}
          onAcceptFile={acceptFile}
        />
        <RightPanel
          reticle={reticle}
          ppm={effectivePpm}
          magnification={magnification}
          activeWing={activeWing} setActiveWing={setActiveWing}
        />
      </div>
    </div>
  )
}
