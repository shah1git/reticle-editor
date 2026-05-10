import { useCallback } from 'react'
import type { ScopeProfile } from '../types/scope'
import type { Reticle } from '../types/reticle'
import { loadFromJson } from '../utils/fileIO'

export interface FileLoader {
  acceptFile: (file: File, handle?: FileSystemFileHandle | null) => void
}

export function useFileLoader(
  setScope: (s: ScopeProfile) => void,
  setReticle: (r: Reticle) => void,
  setLoadedFileName: (n: string | null) => void,
  setLoadedFileHandle: (h: FileSystemFileHandle | null) => void,
): FileLoader {
  const acceptFile = useCallback((file: File, handle?: FileSystemFileHandle | null) => {
    loadFromJson(file, setScope, setReticle)
    setLoadedFileName(file.name)
    setLoadedFileHandle(handle ?? null)
  }, [setScope, setReticle, setLoadedFileName, setLoadedFileHandle])
  return { acceptFile }
}
