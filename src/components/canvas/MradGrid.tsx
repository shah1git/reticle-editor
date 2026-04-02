import React, { useMemo } from 'react'

interface Props {
  width: number
  height: number
  zoom: number   // screen pixels per MRAD
  panX: number
  panY: number
}

export default function MradGrid({ width, height, zoom, panX, panY }: Props) {
  const lines = useMemo(() => {
    const cx = width / 2 + panX
    const cy = height / 2 + panY

    // Determine visible MRAD range
    const mradLeft = -cx / zoom
    const mradRight = (width - cx) / zoom
    const mradTop = -cy / zoom
    const mradBottom = (height - cy) / zoom

    // Choose grid spacing based on zoom level
    let minorStep = 0.5
    let majorStep = 5
    if (zoom < 5) {
      minorStep = 5
      majorStep = 25
    } else if (zoom < 15) {
      minorStep = 1
      majorStep = 5
    }

    const result: React.JSX.Element[] = []
    const startH = Math.floor(mradLeft / minorStep) * minorStep
    const endH = Math.ceil(mradRight / minorStep) * minorStep
    const startV = Math.floor(mradTop / minorStep) * minorStep
    const endV = Math.ceil(mradBottom / minorStep) * minorStep

    // Vertical lines
    for (let mrad = startH; mrad <= endH; mrad += minorStep) {
      const x = cx + mrad * zoom
      const isZero = Math.abs(mrad) < 0.001
      const isMajor = Math.abs(mrad % majorStep) < 0.001
      const opacity = isZero ? 0.25 : isMajor ? 0.15 : 0.06
      const strokeWidth = isZero ? 1 : isMajor ? 0.7 : 0.5

      result.push(
        <line
          key={`v${mrad}`}
          x1={x} y1={0} x2={x} y2={height}
          stroke="#6b7394"
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
      )

      // Labels on major lines
      if (isMajor && !isZero && mrad !== 0) {
        result.push(
          <text
            key={`vl${mrad}`}
            x={x + 3} y={cy + 12}
            fill="#6b7394"
            fontSize="9"
            fontFamily="JetBrains Mono"
            opacity={0.5}
          >
            {mrad}
          </text>
        )
      }
    }

    // Horizontal lines
    for (let mrad = startV; mrad <= endV; mrad += minorStep) {
      const y = cy + mrad * zoom
      const isZero = Math.abs(mrad) < 0.001
      const isMajor = Math.abs(mrad % majorStep) < 0.001
      const opacity = isZero ? 0.25 : isMajor ? 0.15 : 0.06
      const strokeWidth = isZero ? 1 : isMajor ? 0.7 : 0.5

      result.push(
        <line
          key={`h${mrad}`}
          x1={0} y1={y} x2={width} y2={y}
          stroke="#6b7394"
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
      )

      if (isMajor && !isZero && mrad !== 0) {
        result.push(
          <text
            key={`hl${mrad}`}
            x={cx + 3} y={y - 3}
            fill="#6b7394"
            fontSize="9"
            fontFamily="JetBrains Mono"
            opacity={0.5}
          >
            {mrad}
          </text>
        )
      }
    }

    return result
  }, [width, height, zoom, panX, panY])

  return <>{lines}</>
}
