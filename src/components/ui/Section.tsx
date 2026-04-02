import { useState, type ReactNode } from 'react'
import styles from './Section.module.css'

interface Props {
  title: string
  collapsible?: boolean
  defaultOpen?: boolean
  summary?: string
  children: ReactNode
}

export default function Section({ title, collapsible = true, defaultOpen = true, summary, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={styles.section}>
      <div
        className={styles.header}
        onClick={() => collapsible && setOpen(!open)}
        style={{ cursor: collapsible ? 'pointer' : 'default' }}
      >
        <span className={styles.title}>{title}</span>
        {collapsible && (
          <span className={styles.chevron}>{open ? '▾' : '▸'}</span>
        )}
        {!open && summary && (
          <span className={styles.summary}>{summary}</span>
        )}
      </div>
      {open && <div className={styles.body}>{children}</div>}
    </div>
  )
}
