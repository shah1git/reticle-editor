import { useState, type ReactNode } from 'react'
import Tooltip from './Tooltip'
import styles from './Section.module.css'

interface Props {
  title: string
  collapsible?: boolean
  defaultOpen?: boolean
  summary?: string
  tooltip?: string
  children: ReactNode
}

export default function Section({ title, collapsible = true, defaultOpen = true, summary, tooltip, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={styles.section}>
      <div
        className={styles.header}
        onClick={() => collapsible && setOpen(!open)}
        style={{ cursor: collapsible ? 'pointer' : 'default' }}
      >
        <span className={styles.title}>{title}</span>
        {tooltip && <Tooltip text={tooltip} />}
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
