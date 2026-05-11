export interface ScopeProfile {
  name: string
  lensFL: number        // mm, lens focal length
  sensorResX: number    // px, sensor horizontal resolution
  sensorResY: number    // px, sensor vertical resolution
  displayResX: number   // px, display horizontal resolution
  displayResY: number   // px, display vertical resolution
  pixelPitch: number    // μm, sensor pixel pitch
}
