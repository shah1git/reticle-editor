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
            hint={`Как далеко тянется крыло от центральной точки. 1 MRAD \u2248 10 см на 100 м, \u2248 1 м на 1 км.\n\nПри длине ${wing.length.toFixed(1)} и интервале ${wing.dots.spacing.toFixed(1)} на крыле поместится ${Math.floor(wing.length / wing.dots.spacing)} меток. При значении 0 крыло не отображается.`}
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
            hint={`Толщина линии крыла в MRAD. Тонкая линия (0.05\u20130.1) меньше перекрывает цель, толстая (0.2+) лучше видна на шумном изображении.\n\nЗначение 0 допустимо \u2014 линия не рисуется, остаются только точки-метки (если включены). Это удобно, когда нужна только шкала без направляющей линии.`}
          />
          {wing.dots.enabled && (
            <>
              <div className={styles.dotSizeField}>
                <div className={styles.dotSizeLabelRow}>
                  <span className={styles.dotSizeLabel}>РАЗМЕР ТОЧКИ</span>
                  <Tooltip text={`Диаметр каждой точки-метки в пикселях. Задаётся напрямую \u2014 без пересчёта из MRAD. Каждое крыло может иметь свой размер.\n\n1 пикс \u2014 минимальная точка, может быть плохо видна. 2\u20133 пикс \u2014 хорошо различимая метка. 4+ пикс \u2014 крупная, для низких разрешений.\n\nТекущий размер ${wing.dotSize} пикс = ${dotSizeMrad.toFixed(2)} MRAD на этой оси.`} />
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
                hint={`Расстояние между соседними точками-метками на крыле в MRAD. Определяет, как часто расставлены деления шкалы.\n\nПри интервале 1.0 и длине ${wing.length.toFixed(1)} получится ${Math.floor(wing.length / wing.dots.spacing)} точек. Количество меток = длина \u00f7 интервал (дробные отбрасываются).\n\nИменно этот параметр порождает проблему растеризации: интервал \u00d7 пикселей на MRAD почти никогда не равен целому числу пикселей.`}
              />
            </>
          )}
        </div>
      )}
    </Section>
  )
}
