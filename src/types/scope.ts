export interface ScopeProfile {
  type: 'digital' | 'optical'
  name: string
  // Digital (thermal/NV)
  lensFL: number        // mm, lens focal length
  sensorResX: number    // px, sensor horizontal resolution
  sensorResY: number    // px, sensor vertical resolution
  displayResX: number   // px, display horizontal resolution
  displayResY: number   // px, display vertical resolution
  pixelPitch: number    // μm, sensor pixel pitch
  // Optical
  fovDegrees: number    // degrees, field of view
  tubeDiameter: number  // mm
}
