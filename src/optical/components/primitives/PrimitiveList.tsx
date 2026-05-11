import { useTranslation } from 'react-i18next'
import type { Primitive } from '../../types/reticle'
import styles from './PrimitiveList.module.css'

interface Props {
  primitives: Primitive[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onRemove: (id: string) => void
}

const fmt = (n: number) => n.toFixed(1)

function describe(p: Primitive): string {
  if (p.type === 'line') {
    return `line (${fmt(p.x1)}, ${fmt(p.y1)}) → (${fmt(p.x2)}, ${fmt(p.y2)})`
  }
  return `dot (${fmt(p.x)}, ${fmt(p.y)})`
}

export default function PrimitiveList({ primitives, selectedId, onSelect, onRemove }: Props) {
  const { t } = useTranslation()

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>{t('optical.list.title')}</h2>
      {primitives.length === 0 ? (
        <div className={styles.empty}>{t('optical.list.empty')}</div>
      ) : (
        <ul className={styles.list}>
          {primitives.map(p => (
            <li
              key={p.id}
              className={p.id === selectedId ? styles.itemSelected : styles.item}
              onClick={() => onSelect(p.id)}
            >
              <span className={styles.label}>{describe(p)}</span>
              <button
                type="button"
                className={styles.removeBtn}
                aria-label={t('optical.list.remove')}
                title={t('optical.list.remove')}
                onClick={e => {
                  e.stopPropagation()
                  onRemove(p.id)
                }}
              >
                {'×'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
