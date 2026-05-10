/**
 * Minimal type shims for the File System Access API
 * (https://developer.mozilla.org/docs/Web/API/File_System_API). TypeScript's
 * lib.dom.d.ts ships handles but not the picker entry-points; we carry our
 * own narrow definitions to avoid `any` at the call sites.
 */

export interface FilePickerAcceptType {
  description?: string
  accept: Record<string, string[]>
}

export interface ShowOpenFilePicker {
  (options?: {
    types?: FilePickerAcceptType[]
    multiple?: boolean
    excludeAcceptAllOption?: boolean
  }): Promise<FileSystemFileHandle[]>
}

export interface ShowSaveFilePicker {
  (options?: {
    suggestedName?: string
    types?: FilePickerAcceptType[]
    excludeAcceptAllOption?: boolean
  }): Promise<FileSystemFileHandle>
}

interface PickerWindow {
  showOpenFilePicker?: ShowOpenFilePicker
  showSaveFilePicker?: ShowSaveFilePicker
}

export function getOpenFilePicker(): ShowOpenFilePicker | undefined {
  return (window as unknown as PickerWindow).showOpenFilePicker
}

export function getSaveFilePicker(): ShowSaveFilePicker | undefined {
  return (window as unknown as PickerWindow).showSaveFilePicker
}
