import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const ppmMin = Math.min(ppm.h, ppm.v)
  const diameterPx = reticle.centerDot.diameter * ppmMin

  return (
    <Section
      title={t('centerDot.title')}
      tooltip={t('centerDot.tooltip')}
    >
      <NumberInput
        label={t('centerDot.diameterLabel')}
        value={reticle.centerDot.diameter}
        onChange={v => setReticle({ ...reticle, centerDot: { diameter: v } })}
        min={0}
        step={1 / ppmMin}
        snapFn={v => snapToPixel(v, ppmMin)}
        pxValue={diameterPx}
        unit="MRAD"
        hint={t('centerDot.diameterHint')}
      />
    </Section>
  )
}
