import { useMemo } from 'react'
import type { ScopeProfile } from '../../types/scope'
import { calcPixelsPerMrad, getFovMrad, isSquarePixelRatio } from '../../math/optics'
import Section from '../ui/Section'
import NumberInput from '../ui/NumberInput'
import SelectInput from '../ui/SelectInput'
import styles from './ScopeProfilePanel.module.css'

interface Props {
  scope: ScopeProfile
  setScope: (s: ScopeProfile) => void
}

export default function ScopeProfilePanel({ scope, setScope }: Props) {
  const ppm = useMemo(() => calcPixelsPerMrad(scope), [scope])
  const fov = useMemo(() => getFovMrad(scope), [scope])
  const squarePx = useMemo(() => isSquarePixelRatio(ppm), [ppm])

  const update = (patch: Partial<ScopeProfile>) => setScope({ ...scope, ...patch })

  const summary = `1 MRAD = ${ppm.h.toFixed(2)} px`

  return (
    <Section title="Scope Profile" summary={summary}>
      <input
        className={styles.nameInput}
        value={scope.name}
        onChange={e => update({ name: e.target.value })}
        placeholder="Scope name"
      />
      <SelectInput
        label="Type"
        value={scope.type}
        onChange={v => update({ type: v as 'digital' | 'optical' })}
        options={[
          { value: 'digital', label: 'Digital (Thermal / NV)' },
          { value: 'optical', label: 'Optical' },
        ]}
      />

      {scope.type === 'digital' ? (
        <>
          <NumberInput label="Lens FL" value={scope.lensFL} onChange={v => update({ lensFL: v })} min={1} step={1} unit="mm" />
          <NumberInput label="Sensor X" value={scope.sensorResX} onChange={v => update({ sensorResX: v })} min={1} step={1} unit="px" />
          <NumberInput label="Sensor Y" value={scope.sensorResY} onChange={v => update({ sensorResY: v })} min={1} step={1} unit="px" />
          <NumberInput label="Display X" value={scope.displayResX} onChange={v => update({ displayResX: v })} min={1} step={1} unit="px" />
          <NumberInput label="Display Y" value={scope.displayResY} onChange={v => update({ displayResY: v })} min={1} step={1} unit="px" />
          <NumberInput label="Px Pitch" value={scope.pixelPitch} onChange={v => update({ pixelPitch: v })} min={0.1} step={0.1} unit="μm" />
        </>
      ) : (
        <>
          <NumberInput label="FOV" value={scope.fovDegrees} onChange={v => update({ fovDegrees: v })} min={0.1} step={0.1} unit="°" />
          <NumberInput label="Tube Ø" value={scope.tubeDiameter} onChange={v => update({ tubeDiameter: v })} min={1} step={1} unit="mm" />
          <NumberInput label="Display X" value={scope.displayResX} onChange={v => update({ displayResX: v })} min={1} step={1} unit="px" />
        </>
      )}

      <div className={styles.calc}>
        <div className={styles.calcLabel}>CALCULATED</div>
        <div className={styles.calcRow}>
          <span>H: {ppm.h.toFixed(3)} px/MRAD</span>
          <span>FOV: {fov.h.toFixed(1)} MRAD</span>
        </div>
        <div className={styles.calcRow}>
          <span>V: {ppm.v.toFixed(3)} px/MRAD</span>
          <span>FOV: {fov.v.toFixed(1)} MRAD</span>
        </div>
        {!squarePx && (
          <div className={styles.warning}>⚠ Non-square pixel ratio</div>
        )}
      </div>
    </Section>
  )
}
