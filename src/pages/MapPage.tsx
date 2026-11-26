import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { CATEGORIES, catById } from '../lib/categories'
import { incidentTitle, timeAgo } from '../lib/util'
import { distanceM } from '../lib/geo'
import type { CategoryId } from '../types'
import Icon from '../components/Icon'
import MapView, { PREVIEW } from '../components/MapView'
import IncidentSheet from '../components/IncidentSheet'
import StatusBadge from '../components/StatusBadge'

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

  const chips = (
    <>
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
    </>
  )

  return (
    <div className="absolute inset-0 lg:flex">
      <aside className="hidden w-[380px] shrink-0 flex-col border-r border-outline-variant/30 bg-surface-container-lowest lg:flex">
        <div className="shrink-0 px-5 pb-4 pt-5">
          <h1 className="font-headline-md text-headline-md">Incidències al Carmel</h1>
          <p className="text-body-sm text-on-surface-variant">
            {shown.length} {shown.length === 1 ? 'incidència' : 'incidències'} al mapa
          </p>
          <div className="mt-3 flex flex-wrap gap-2">{chips}</div>
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-outline-variant/30 overflow-y-auto border-t border-outline-variant/30">
          {shown.length === 0 && <li className="p-5 text-body-md text-on-surface-variant">No hi ha incidències d'aquesta categoria.</li>}
          {shown.map((i) => {
            const c = catById(i.category)
            return (
              <li key={i.id}>
                <button
                  onClick={() => select(i.id)}
                  className={`flex w-full items-start gap-3 px-5 py-3 text-left transition-colors ${
                    i.id === selId ? 'bg-primary-fixed/40' : 'hover:bg-surface-container-low'
                  }`}
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
                    <Icon name={c.icon} fill className={c.chipIcon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-label-lg text-label-lg">{incidentTitle(i.description, c.label)}</span>
                    <span className="block truncate text-body-sm text-on-surface-variant">{i.address || c.label}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <StatusBadge status={i.status} short />
                      <span className="font-caption text-caption text-on-surface-variant">
                        {i.supports} suports · {timeAgo(i.created_at)}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <div className="absolute inset-0 lg:relative lg:flex-1">
      <MapView incidents={shown} selectedId={selId} onSelect={select} position={position} focus={focus} />

      <div className="absolute inset-x-0 top-0 z-[1000] bg-gradient-to-b from-surface/90 via-surface/60 to-transparent px-gutter pb-4 pt-3 lg:hidden">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">{chips}</div>
      </div>

      {PREVIEW && (
        <span className="absolute bottom-2 left-2 z-[900] rounded bg-white/80 px-2 py-0.5 font-caption text-caption text-on-surface-variant">Previsualització · sense mapa base</span>
      )}

      <button
        onClick={goMe}
        aria-label="La meva ubicació"
        className="absolute right-3 top-16 z-[1000] lg:right-4 lg:top-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest text-secondary shadow-[0_8px_24px_-4px_rgba(211,82,48,0.16)]"
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
    </div>
  )
}
