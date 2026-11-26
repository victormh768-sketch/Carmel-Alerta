import { useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { CARMEL_CENTER, clampToCarmel } from '../lib/geo'
import type { LatLng } from '../types'
import { MAX_BOUNDS, PREVIEW, TILES, TILE_ATTR } from './MapView'
import Icon from './Icon'

const pin = L.divIcon({
  className: '',
  html: '<div class="flex items-center justify-center rounded-full bg-primary text-on-primary shadow-lg ring-4 ring-primary-fixed" style="width:44px;height:44px"><span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1">location_on</span></div>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

function Clicker({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

interface Props {
  initial: LatLng
  onConfirm: (p: LatLng) => void
  onClose: () => void
}

export default function LocationPicker({ initial, onConfirm, onClose }: Props) {
  const [p, setP] = useState<LatLng>(initial)
  const markerRef = useRef<L.Marker>(null)
  const handlers = useMemo(
    () => ({
      dragend() {
        const m = markerRef.current
        if (m) {
          const ll = m.getLatLng()
          setP(clampToCarmel({ lat: ll.lat, lng: ll.lng }))
        }
      },
    }),
    [],
  )

  return (
    <div className="fixed inset-0 z-[3000] mx-auto flex max-w-[480px] flex-col bg-surface" role="dialog" aria-label="Ajusta la ubicació">
      <div className="flex h-14 shrink-0 items-center justify-between px-gutter">
        <h2 className="font-headline-sm text-headline-sm">Ajusta la ubicació</h2>
        <button onClick={onClose} aria-label="Tanca" className="flex h-12 w-12 items-center justify-center">
          <Icon name="close" />
        </button>
      </div>
      <div className="relative flex-1">
        <MapContainer
          center={[initial.lat || CARMEL_CENTER.lat, initial.lng || CARMEL_CENTER.lng]}
          zoom={18}
          minZoom={15}
          maxBounds={MAX_BOUNDS}
          zoomControl={false}
          className="absolute inset-0"
        >
          {!PREVIEW && <TileLayer url={TILES} attribution={TILE_ATTR} maxZoom={19} />}
          <Clicker onPick={(q) => setP(clampToCarmel(q))} />
          <Marker position={[p.lat, p.lng]} icon={pin} draggable ref={markerRef} eventHandlers={handlers} />
        </MapContainer>
      </div>
      <div className="shrink-0 p-gutter pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="mb-3 text-center font-body-sm text-body-sm text-on-surface-variant">
          Toca el mapa o arrossega el punt fins al lloc exacte.
        </p>
        <button
          onClick={() => onConfirm(p)}
          className="h-12 w-full rounded-lg bg-primary font-label-lg text-label-lg text-on-primary active:bg-[#b83e1e]"
        >
          Confirma la ubicació
        </button>
      </div>
    </div>
  )
}
