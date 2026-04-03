export interface TestObject {
  name: string
  height: number  // meters
  width: number   // meters
}

export const TEST_OBJECTS: TestObject[] = [
  { name: 'Человек (1.8 м)', height: 1.8, width: 0.5 },
  { name: 'Кабан (0.7 м)', height: 0.7, width: 1.2 },
  { name: 'Мишень 1×1 м', height: 1.0, width: 1.0 },
  { name: 'Олень (1.4 м)', height: 1.4, width: 1.0 },
]

/** Calculate angular size in MRAD: (object_size_meters / distance_meters) × 1000 */
export function objectAngularSize(sizeMeters: number, distanceMeters: number): number {
  if (distanceMeters <= 0) return 0
  return (sizeMeters / distanceMeters) * 1000
}
