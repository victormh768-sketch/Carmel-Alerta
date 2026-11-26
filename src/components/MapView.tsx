import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import { CARMEL_BOUNDS, CARMEL_CENTER } from '../lib/geo'
import { catById } from '../lib/categories'
import type { Incident, LatLng } from '../types'

export const PREVIEW = !!import.meta.env.VITE_PREVIEW
export const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

export const MAX_BOUNDS: L.LatLngBoundsExpression = [
  [CARMEL_BOUNDS.south - 0.01, CARMEL_BOUNDS.west - 0.015],
  [CARMEL_BOUNDS.north + 0.01, CARMEL_BOUNDS.east + 0.015],
]

function pinIcon(i: Incident, selected: boolean) {
  const c = catById(i.category)
  const solved = i.status === 'solved'
  const pending = i.status === 'pending'
  const size = selected ? 46 : 38
  const bg = solved ? 'bg-surface-container-highest text-green-600' : c.pin
  const icon = solved ? 'check_circle' : c.icon
  const ring = selected ? `ring-4 ${c.ring}` : 'ring-2 ring-white'
  const dashed = pending ? 'opacity-70 border-2 border-dashed border-white' : ''
  return L.divIcon({
    className: '',
    html: `<div class="flex items-center justify-center rounded-full shadow-lg ${bg} ${ring} ${dashed}" style="width:${size}px;height:${size}px"><span class="material-symbols-outlined" style="font-size:${selected ? 26 : 21}px;font-variation-settings:'FILL' 1">${icon}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const meIcon = L.divIcon({
  className: '',
  html: '<div class="rounded-full bg-secondary ring-4 ring-secondary-fixed-dim/60 border-2 border-white" style="width:16px;height:16px"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

/** Vuela a una posición; `offsetY` desplaza el punto hacia arriba para dejar sitio a la ficha. */
function Fly({ target, offsetY = 0 }: { target: (LatLng & { key: string }) | null; offsetY?: number }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    const z = Math.max(map.getZoom(), 17)
    const p = map.project([target.lat, target.lng], z).add([0, offsetY])
    map.flyTo(map.unproject(p, z), z, { duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.key])
  return null
}

interface Props {
  incidents: Incident[]
  selectedId: string | null
  onSelect: (id: string) => void
  position: LatLng | null
  focus: (LatLng & { key: string }) | null
}

export default function MapView({ incidents, selectedId, onSelect, position, focus }: Props) {
  return (
    <MapContainer
      center={[CARMEL_CENTER.lat, CARMEL_CENTER.lng]}
      zoom={16}
      minZoom={14}
      maxBounds={MAX_BOUNDS}
      zoomControl={false}
      className="absolute inset-0 z-0"
      style={PREVIEW ? { backgroundImage: 'linear-gradient(#d8e3f9 1px, transparent 1px), linear-gradient(90deg, #d8e3f9 1px, transparent 1px)', backgroundSize: '48px 48px' } : undefined}
    >
      {!PREVIEW && <TileLayer url={TILES} attribution={TILE_ATTR} maxZoom={19} />}
      {incidents.map((i) => (
        <Marker
          key={`${i.id}-${i.id === selectedId}-${i.status}`}
          position={[i.lat, i.lng]}
          icon={pinIcon(i, i.id === selectedId)}
          zIndexOffset={i.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(i.id) }}
        />
      ))}
      {position && <Marker position={[position.lat, position.lng]} icon={meIcon} interactive={false} />}
      <Fly target={focus} offsetY={focus?.key.startsWith('inc') ? 120 : 0} />
    </MapContainer>
  )
}
