import { useCallback, useEffect, useState } from 'react'
import type { ScopeProfile } from '../types/scope'
import type { Primitive, Reticle } from '../types/reticle'
import { emptyReticle } from '../defaults'

const STORAGE_KEY = 'reticle-editor-optical-state'
const SAVE_DEBOUNCE_MS = 300

function loadInitial(): Reticle {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.primitives) && parsed.scope) {
        return parsed as Reticle
      }
    }
  } catch (err) {
    void err
  }
  return emptyReticle
}

export interface ReticleStateApi {
  reticle: Reticle
  selectedId: string | null
  setScope: (scope: ScopeProfile) => void
  setName: (name: string) => void
  addPrimitive: (p: Primitive) => void
  updatePrimitive: (id: string, patch: Partial<Primitive>) => void
  removePrimitive: (id: string) => void
  selectPrimitive: (id: string | null) => void
  replaceReticle: (r: Reticle) => void
}

export function useReticleState(): ReticleStateApi {
  const [reticle, setReticle] = useState<Reticle>(loadInitial)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reticle))
      } catch (err) {
    void err
  }
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [reticle])

  const setScope = useCallback((scope: ScopeProfile) => {
    setReticle(prev => ({ ...prev, scope }))
  }, [])

  const setName = useCallback((name: string) => {
    setReticle(prev => ({ ...prev, name }))
  }, [])

  const addPrimitive = useCallback((p: Primitive) => {
    setReticle(prev => ({ ...prev, primitives: [...prev.primitives, p] }))
  }, [])

  const updatePrimitive = useCallback((id: string, patch: Partial<Primitive>) => {
    setReticle(prev => ({
      ...prev,
      primitives: prev.primitives.map(p =>
        p.id === id ? ({ ...p, ...patch } as Primitive) : p,
      ),
    }))
  }, [])

  const removePrimitive = useCallback((id: string) => {
    setReticle(prev => ({
      ...prev,
      primitives: prev.primitives.filter(p => p.id !== id),
    }))
    setSelectedId(prev => (prev === id ? null : prev))
  }, [])

  const selectPrimitive = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const replaceReticle = useCallback((r: Reticle) => {
    setReticle(r)
    setSelectedId(null)
  }, [])

  return {
    reticle,
    selectedId,
    setScope,
    setName,
    addPrimitive,
    updatePrimitive,
    removePrimitive,
    selectPrimitive,
    replaceReticle,
  }
}
