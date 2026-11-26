import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { CATEGORIES } from '../lib/categories'
import { distanceM } from '../lib/geo'
import type { CategoryId } from '../types'
import Icon from '../components/Icon'
import MapView, { PREVIEW } from '../components/MapView'
import IncidentSheet from '../components/IncidentSheet'

export default function MapPage() {
  const { incidents, user, api, act, position, locate, toast } = useApp()
  const nav = useNavigate()
  const [cat, setCat] = useState<CategoryId | 'all'>('all')
  const [selId, setSelId] = useState<string | null>(null)
  const [focus, setFocus] = useState<{ lat: number; lng: number; key: string } | null>(null)

  const onMap = useMemo(() => incidents.filter((i) => i.status !== 'rejected'), [incidents])
  const shown = cat === 'all' ? onMap : onMap.filter((i) => i.category === cat)
  const selected = incidents.find((i) => i.id === selId) ?? null
  const count = (c: CategoryId) => onMap.filter((i) => i.category === c).length

  const select = (id: string) => {
    const i = incidents.find((x) => x.id === id)
    setSelId(id)
    if (i) setFocus({ lat: i.lat, lng: i.lng, key: `inc-${id}-${Date.now()}` })
  }

  const goMe = async () => {
    const p = await locate()
    if (p) setFocus({ ...p, key: `me-${Date.now()}` })
  }

  const share = async () => {
    if (!selected) return
    const text = `${selected.address || 'El Carmel'}: ${selected.description || 'Incidència al barri'}`
    try {
      if (navigator.share) await navigator.share({ title: 'CarmelAlerta', text, url: window.location.origin })
      else {
        await navigator.clipboard.writeText(`${text} ${window.location.origin}`)
        toast('Enllaç copiat')
      }
    } catch { /* cancel·lat */ }
  }

  const support = () => {
    if (!selected) return
    if (!user) return nav('/acces', { state: { from: '/' } })
    act(() => api.support(selected.id), 'Gràcies pel teu suport! +5 punts')
  }

  const chip = (active: boolean) =>
    `flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 font-label-md text-label-md shadow-sm transition-colors ${
      active ? 'bg-secondary text-on-secondary' : 'bg-surface-container-lowest text-on-surface ring-1 ring-outline-variant/40'
    }`

  return (
    <div className="absolute inset-0">
      <MapView incidents={shown} selectedId={selId} onSelect={select} position={position} focus={focus} />

      <div className="absolute inset-x-0 top-0 z-[1000] bg-gradient-to-b from-surface/90 via-surface/60 to-transparent px-gutter pb-4 pt-3">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <button className={chip(cat === 'all')} onClick={() => setCat('all')}>
            {cat === 'all' && <Icon name="check" className="!text-[16px]" />}
            Totes
            <span className="rounded-full bg-black/10 px-1.5 text-caption font-bold">{onMap.length}</span>
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={chip(cat === c.id)} onClick={() => setCat(c.id)}>
              <Icon name={c.icon} fill className={`!text-[16px] ${cat === c.id ? '' : c.chipIcon}`} />
              {c.short}
              <span className="rounded-full bg-black/10 px-1.5 text-caption font-bold">{count(c.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {PREVIEW && (
        <span className="absolute bottom-2 left-2 z-[900] rounded bg-white/80 px-2 py-0.5 font-caption text-caption text-on-surface-variant">Previsualització · sense mapa base</span>
      )}

      <button
        onClick={goMe}
        aria-label="La meva ubicació"
        className="absolute right-3 top-16 z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest text-secondary shadow-[0_8px_24px_-4px_rgba(211,82,48,0.16)]"
      >
        <Icon name="my_location" />
      </button>

      {selected ? (
        <IncidentSheet
          incident={selected}
          distance={position ? distanceM(position, selected) : null}
          isMine={user?.id === selected.author_id}
          loggedIn={!!user}
          onClose={() => setSelId(null)}
          onSupport={support}
          onShare={share}
        />
      ) : (
        <button
          onClick={() => nav('/reportar')}
          className="absolute bottom-4 right-4 z-[1000] flex h-14 items-center gap-2 rounded-full bg-primary px-5 font-label-lg text-label-lg text-on-primary shadow-[0_8px_24px_-4px_rgba(211,82,48,0.4)] active:bg-[#b83e1e]"
        >
          <Icon name="photo_camera" />
          Reportar
        </button>
      )}
    </div>
  )
}
