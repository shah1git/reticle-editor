import { useMemo } from 'react'
import type { Primitive } from '../../types/reticle'
import styles from './ReticleCanvas.module.css'

/** Half-width of the visible mrad window (viewBox is -V..+V on each axis). */
const VIEW_HALF = 20

interface Props {
  primitives: Primitive[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

/**
 * SVG canvas showing the reticle in mrad space. Data uses +y = up
 * (shooter convention) so we flip y on render to match SVG's +y = down.
 * Grid + origin cross use vector-effect=non-scaling-stroke so they stay
 * crisp at any container size; primitive thickness is in mrad and scales
 * with the viewBox.
 */
export default function ReticleCanvas({ primitives, selectedId, onSelect }: Props) {
  const gridLines = useMemo(() => {
    const minor: number[] = []
    const major: number[] = []
    for (let v = -VIEW_HALF; v <= VIEW_HALF; v++) {
      if (v === 0) continue
      if (v % 5 === 0) major.push(v)
      else minor.push(v)
    }
    return { minor, major }
  }, [])

  return (
    <svg
      className={styles.canvas}
      viewBox={`${-VIEW_HALF} ${-VIEW_HALF} ${VIEW_HALF * 2} ${VIEW_HALF * 2}`}
      preserveAspectRatio="xMidYMid meet"
      onClick={() => onSelect(null)}
    >
      {/* Background — also catches clicks to deselect. */}
      <rect
        x={-VIEW_HALF}
        y={-VIEW_HALF}
        width={VIEW_HALF * 2}
        height={VIEW_HALF * 2}
        className={styles.bg}
      />

      {/* Minor grid: every 1 mrad. */}
      <g className={styles.gridMinor}>
        {gridLines.minor.map(v => (
          <g key={`min-${v}`}>
            <line x1={v} y1={-VIEW_HALF} x2={v} y2={VIEW_HALF} vectorEffect="non-scaling-stroke" />
            <line x1={-VIEW_HALF} y1={v} x2={VIEW_HALF} y2={v} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </g>

      {/* Major grid: every 5 mrad. */}
      <g className={styles.gridMajor}>
        {gridLines.major.map(v => (
          <g key={`maj-${v}`}>
            <line x1={v} y1={-VIEW_HALF} x2={v} y2={VIEW_HALF} vectorEffect="non-scaling-stroke" />
            <line x1={-VIEW_HALF} y1={v} x2={VIEW_HALF} y2={v} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </g>

      {/* Origin cross. */}
      <g className={styles.origin}>
        <line x1={-VIEW_HALF} y1={0} x2={VIEW_HALF} y2={0} vectorEffect="non-scaling-stroke" />
        <line x1={0} y1={-VIEW_HALF} x2={0} y2={VIEW_HALF} vectorEffect="non-scaling-stroke" />
      </g>

      {/* Reticle primitives — y is flipped (data +y up, SVG +y down). */}
      <g>
        {primitives.map(p => {
          const selected = p.id === selectedId
          const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation()
            onSelect(p.id)
          }
          if (p.type === 'line') {
            return (
              <line
                key={p.id}
                x1={p.x1}
                y1={-p.y1}
                x2={p.x2}
                y2={-p.y2}
                strokeWidth={p.thickness}
                strokeLinecap="butt"
                className={selected ? styles.primitiveSelected : styles.primitive}
                onClick={handleClick}
              />
            )
          }
          return (
            <circle
              key={p.id}
              cx={p.x}
              cy={-p.y}
              r={p.size / 2}
              className={selected ? styles.primitiveSelected : styles.primitive}
              onClick={handleClick}
            />
          )
        })}
      </g>
    </svg>
  )
}
