import type { Reticle, Wing } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import Section from '../ui/Section'
import NumberInput from '../ui/NumberInput'
import CheckboxInput from '../ui/CheckboxInput'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
  wingKey: 'left' | 'right' | 'down'
  title: string
}

export default function WingConfig({ reticle, setReticle, ppm, wingKey, title }: Props) {
  const wing = reticle.wings[wingKey]
  const axisPpm = wingKey === 'down' ? ppm.v : ppm.h
  const ppmMin = Math.min(ppm.h, ppm.v)

  const updateWing = (patch: Partial<Wing>) => {
    setReticle({
      ...reticle,
      wings: {
        ...reticle.wings,
        [wingKey]: { ...wing, ...patch },
      },
    })
  }

  const updateDots = (patch: Partial<Wing['dots']>) => {
    updateWing({ dots: { ...wing.dots, ...patch } })
  }

  return (
    <Section title={title} defaultOpen={false}>
      <CheckboxInput
        label="Enabled"
        checked={wing.enabled}
        onChange={v => updateWing({ enabled: v })}
      />
      {wing.enabled && (
        <>
          <NumberInput
            label="Length"
            value={wing.length}
            onChange={v => updateWing({ length: v })}
            min={0}
            step={0.1}
            pxValue={wing.length * axisPpm}
          />
          <NumberInput
            label="Thickness"
            value={wing.lineThickness}
            onChange={v => updateWing({ lineThickness: v })}
            min={0.01}
            step={0.01}
            pxValue={wing.lineThickness * axisPpm}
          />
          <div style={{ marginTop: 6 }}>
            <CheckboxInput
              label="Dots"
              checked={wing.dots.enabled}
              onChange={v => updateDots({ enabled: v })}
            />
          </div>
          {wing.dots.enabled && (
            <>
              <NumberInput
                label="Spacing"
                value={wing.dots.spacing}
                onChange={v => updateDots({ spacing: v })}
                min={0.01}
                step={0.1}
                pxValue={wing.dots.spacing * axisPpm}
              />
              <NumberInput
                label="Dot Radius"
                value={wing.dots.radius}
                onChange={v => updateDots({ radius: v })}
                min={0}
                step={1 / ppmMin}
                pxValue={wing.dots.radius * ppmMin}
              />
            </>
          )}
        </>
      )}
    </Section>
  )
}
