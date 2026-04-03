import type { Reticle, Wing } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import type { WingKey } from '../../App'
import NumberInput from '../ui/NumberInput'
import CheckboxInput from '../ui/CheckboxInput'
import Section from '../ui/Section'
import Tooltip from '../ui/Tooltip'
import styles from './WingEditor.module.css'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
  activeWing: WingKey
  setActiveWing: (w: WingKey) => void
}

const wingLabels: Record<WingKey, string> = {
  up: '↑ Верх',
  down: '↓ Низ',
  left: '← Лево',
  right: '→ Право',
}

export default function WingEditor({ reticle, setReticle, ppm, activeWing, setActiveWing }: Props) {
  const wing = reticle.wings[activeWing]
  const axisPpm = (activeWing === 'up' || activeWing === 'down') ? ppm.v : ppm.h

  const updateWing = (patch: Partial<Wing>) => {
    setReticle({
      ...reticle,
      wings: {
        ...reticle.wings,
        [activeWing]: { ...wing, ...patch },
      },
    })
  }

  const updateDots = (patch: Partial<Wing['dots']>) => {
    updateWing({ dots: { ...wing.dots, ...patch } })
  }

  const markCount = wing.dots.enabled && wing.dots.spacing > 0
    ? Math.floor(wing.length / wing.dots.spacing)
    : 0

  const dotSizeMrad = wing.dotSize / axisPpm

  return (
    <Section title="КРЫЛЬЯ" collapsible={false} tooltip="Крыло — линия от центральной точки. Вдоль неё размещаются метки через равные интервалы для измерения расстояний и поправок">
      <div className={styles.tabs}>
        {(['up', 'down', 'left', 'right'] as const).map(key => {
          const w = reticle.wings[key]
          return (
            <button
              key={key}
              className={`${styles.tab} ${activeWing === key ? styles.tabActive : ''} ${!w.enabled ? styles.tabOff : ''}`}
              onClick={() => setActiveWing(key)}
            >
              {wingLabels[key]} {w.enabled && w.length > 0 ? w.length.toFixed(1) : ''}
            </button>
          )
        })}
      </div>

      <div className={styles.controls}>
        <CheckboxInput
          label={wing.enabled ? 'Включено' : 'Выключено'}
          checked={wing.enabled}
          onChange={v => updateWing({ enabled: v })}
        />
        {wing.enabled && (
          <CheckboxInput
            label="Точки на крыле"
            checked={wing.dots.enabled}
            onChange={v => updateDots({ enabled: v })}
          />
        )}
      </div>

      {wing.enabled && (
        <div className={styles.cards}>
          <NumberInput
            label="Длина"
            value={wing.length}
            onChange={v => updateWing({ length: v })}
            min={0}
            defaultValue={5}
            step={0.1}
            pxValue={wing.length * axisPpm}
            unit="MRAD"
          />
          <NumberInput
            label="Толщина линии"
            value={wing.lineThickness}
            onChange={v => updateWing({ lineThickness: v })}
            min={0}
            defaultValue={0.1}
            step={0.05}
            pxValue={wing.lineThickness * axisPpm}
            unit="MRAD"
          />
          {wing.dots.enabled && (
            <>
              <div className={styles.dotSizeField}>
                <div className={styles.dotSizeLabelRow}>
                  <span className={styles.dotSizeLabel}>РАЗМЕР ТОЧКИ</span>
                  <Tooltip text="Диаметр каждой точки-метки в пикселях. Задаётся напрямую в пикселях — без пересчёта из MRAD. Каждое крыло может иметь свой размер точки. Минимум 1 пиксель" />
                </div>
                <div className={styles.dotSizeInputRow}>
                  <input
                    type="number"
                    className={styles.dotSizeInput}
                    value={wing.dotSize}
                    min={1}
                    step={1}
                    onChange={e => {
                      const v = parseInt(e.target.value)
                      if (!isNaN(v) && v >= 1) updateWing({ dotSize: v })
                    }}
                    onBlur={e => {
                      const v = parseInt(e.target.value)
                      if (isNaN(v) || v < 1) updateWing({ dotSize: 2 })
                    }}
                  />
                  <span className={styles.dotSizeUnit}>пикс</span>
                </div>
                <div className={styles.dotSizeMrad}>= {dotSizeMrad.toFixed(2)} MRAD</div>
              </div>
              <NumberInput
                label="Интервал"
                value={wing.dots.spacing}
                onChange={v => updateDots({ spacing: v })}
                min={0.1}
                defaultValue={1}
                step={0.1}
                pxValue={wing.dots.spacing * axisPpm}
                unit="MRAD"
              />
              <div className={styles.markCount}>
                <div className={styles.markCountLabel}>Меток</div>
                <div className={styles.markCountValue}>{markCount}</div>
              </div>
            </>
          )}
        </div>
      )}
    </Section>
  )
}
