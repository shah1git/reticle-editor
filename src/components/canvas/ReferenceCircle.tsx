interface Props {
  cx: number
  cy: number
  /** Circle radius in MRAD (e.g. 5 for a "1 m at 100 m" diameter). */
  radiusMrad: number
  /** Screen pixels per MRAD. */
  zoom: number
}

/**
 * On-canvas reference overlay — a dashed circle centred on the reticle that
 * shows what a chosen angular size looks like at the current zoom. Helps
 * sanity-check the reticle scale without measuring against marks. Doesn't
 * leak into PNG/BMP export — the canvas is preview-only for this widget.
 */
export default function ReferenceCircle({ cx, cy, radiusMrad, zoom }: Props) {
  const r = radiusMrad * zoom
  if (r <= 0) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke="#ffd166"
      strokeWidth={1.5}
      strokeDasharray="6 4"
      strokeOpacity={0.85}
      pointerEvents="none"
    />
  )
}
