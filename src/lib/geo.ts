import type { LatLng } from '../types'

export const CARMEL_CENTER: LatLng = { lat: 41.4195, lng: 2.1545 }

/** Caja aproximada del barrio (sur, oeste, norte, este) */
export const CARMEL_BOUNDS = { south: 41.408, west: 2.138, north: 41.430, east: 2.175 }

export const inCarmel = (p: LatLng) =>
  p.lat >= CARMEL_BOUNDS.south && p.lat <= CARMEL_BOUNDS.north &&
  p.lng >= CARMEL_BOUNDS.west && p.lng <= CARMEL_BOUNDS.east

export function clampToCarmel(p: LatLng): LatLng {
  return {
    lat: Math.min(CARMEL_BOUNDS.north, Math.max(CARMEL_BOUNDS.south, p.lat)),
    lng: Math.min(CARMEL_BOUNDS.east, Math.max(CARMEL_BOUNDS.west, p.lng)),
  }
}

export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function formatDistance(m: number): string {
  if (m < 1000) return `A ${Math.round(m / 10) * 10} m de tu`
  return `A ${(m / 1000).toFixed(1).replace('.', ',')} km de tu`
}

/** Dirección aproximada con Nominatim (OpenStreetMap). Falla en silencio. */
export async function reverseGeocode(p: LatLng): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=ca&lat=${p.lat}&lon=${p.lng}`
    const res = await fetch(url)
    if (!res.ok) return null
    const j = await res.json()
    const a = j.address ?? {}
    const road = a.road || a.pedestrian || a.footway || a.path
    if (!road) return null
    return a.house_number ? `${road}, ${a.house_number}` : road
  } catch {
    return null
  }
}
