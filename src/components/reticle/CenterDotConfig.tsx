import { useMemo } from 'react'
import type { Reticle } from '../../types/reticle'
import type { PixelsPerMrad } from '../../math/optics'
import { snapToPixel } from '../../math/optics'
import Section from '../ui/Section'
import NumberInput from '../ui/NumberInput'

interface Props {
  reticle: Reticle
  setReticle: (r: Reticle) => void
  ppm: PixelsPerMrad
}

export default function CenterDotConfig({ reticle, setReticle, ppm }: Props) {
  const ppmMin = Math.min(ppm.h, ppm.v)
  const radiusPx = reticle.centerDot.radius * ppmMin
  const snappedRadius = useMemo(() => snapToPixel(reticle.centerDot.radius, ppmMin), [reticle.centerDot.radius, ppmMin])
  const diameterPx = Math.round(snappedRadius * ppmMin) * 2

  return (
    <Section
      title="● ЦЕНТРАЛЬНАЯ ТОЧКА"
      tooltip="Точка прицеливания в центре сетки. Размер задаётся в MRAD и автоматически привязывается к целым пикселям"
    >
      <NumberInput
        label="Радиус"
        value={reticle.centerDot.radius}
        onChange={v => setReticle({ ...reticle, centerDot: { radius: v } })}
        min={0}
        step={1 / ppmMin}
        pxValue={radiusPx}
        unit="MRAD"
        hint="Радиус центральной точки. Значение подбирается так, чтобы точка занимала целое число пикселей"
      />
      <div style={{ fontSize: 12, color: '#a1adc4', marginTop: -4 }}>
        Диаметр: {diameterPx} пикс
      </div>
    </Section>
  )
}
