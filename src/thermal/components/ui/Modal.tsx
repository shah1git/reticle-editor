import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import styles from './Modal.module.css'

interface Props {
  onClose: () => void
  /** Optional extra class for the inner panel — use to override width/max-height. */
  className?: string
  /** When false, clicking the backdrop does NOT close the modal — only the
   *  explicit close affordance inside `children` (or Escape) will. Default true. */
  closeOnBackdropClick?: boolean
  children: ReactNode
}

/**
 * Common modal shell: portal-rendered backdrop + centred panel that closes
 * on backdrop click or Escape. Each caller composes its own header/body/
 * footer inside `children` (and styles them in its own CSS module).
 */
export default function Modal({ onClose, className, closeOnBackdropClick = true, children }: Props) {
  useEscapeKey(onClose)
  return createPortal(
    <div className={styles.overlay} onClick={closeOnBackdropClick ? onClose : undefined}>
      <div
        className={className ? `${styles.panel} ${className}` : styles.panel}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
