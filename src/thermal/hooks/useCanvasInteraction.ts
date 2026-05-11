import { useState, useCallback, useRef, type WheelEvent, type MouseEvent } from 'react'

interface CanvasTransform {
  zoom: number      // pixels per MRAD on screen
  panX: number      // offset in screen pixels
  panY: number      // offset in screen pixels
}

const MIN_ZOOM = 2
const MAX_ZOOM = 200
const ZOOM_FACTOR = 1.1

interface Options {
  /** Snap a candidate zoom value to an allowed value (e.g. integer pixel-scale). */
  snapZoom?: (z: number) => number
}

export function useCanvasInteraction(opts: Options = {}) {
  const [transform, setTransform] = useState<CanvasTransform>({
    zoom: 30,
    panX: 0,
    panY: 0,
  })

  const snapRef = useRef(opts.snapZoom)
  snapRef.current = opts.snapZoom

  const isPanning = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const handleWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left - rect.width / 2
    const mouseY = e.clientY - rect.top - rect.height / 2

    setTransform(prev => {
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
      let newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * factor))
      const snap = snapRef.current
      if (snap) {
        const snapped = snap(newZoom)
        // Avoid getting stuck at the same snap value: if snap clamped us back
        // to the previous zoom, force one step in the wheel direction.
        if (Math.abs(snapped - prev.zoom) < 1e-6) {
          newZoom = snap(e.deltaY < 0 ? prev.zoom * 1.5 : prev.zoom / 1.5)
        } else {
          newZoom = snapped
        }
      }
      const scale = newZoom / prev.zoom

      return {
        zoom: newZoom,
        panX: mouseX - scale * (mouseX - prev.panX),
        panY: mouseY - scale * (mouseY - prev.panY),
      }
    })
  }, [])

  const handleMouseDown = useCallback((e: MouseEvent<SVGSVGElement>) => {
    // Alt + left click or middle mouse button
    if ((e.button === 0 && e.altKey) || e.button === 1) {
      e.preventDefault()
      isPanning.current = true
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent<SVGSVGElement>) => {
    if (!isPanning.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    setTransform(prev => ({
      ...prev,
      panX: prev.panX + dx,
      panY: prev.panY + dy,
    }))
  }, [])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])

  return {
    transform,
    setTransform,
    handlers: {
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
  }
}
