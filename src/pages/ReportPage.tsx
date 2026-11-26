import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { CATEGORIES, catById } from '../lib/categories'
import { CARMEL_CENTER, distanceM, inCarmel, reverseGeocode } from '../lib/geo'
import { resizeImage } from '../lib/image'
import { MAX_DESC, POINTS } from '../data/api'
import type { CategoryId, LatLng } from '../types'
import Icon from '../components/Icon'
import LocationPicker from '../components/LocationPicker'

export default function ReportPage() {
  const { api, user, incidents, act, locate, toast } = useApp()
  const nav = useNavigate()
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [category, setCategory] = useState<CategoryId | null>(null)
  const [description, setDescription] = useState('')
  const [loc, setLoc] = useState<LatLng>(CARMEL_CENTER)
  const [locNote, setLocNote] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const addrEdited = useRef(false)
  const [picker, setPicker] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (!user) nav('/acces', { replace: true, state: { from: '/reportar' } }) }, [user, nav])

  // Ubicación inicial por GPS
  useEffect(() => {
    let alive = true
    locate().then((p) => {
      if (!alive || !p) return
      if (inCarmel(p)) setLoc(p)
      else setLocNote('Ets fora del Carmel. Ajusta el punt al mapa on hi ha la incidència.')
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Dirección aproximada (con retardo para respetar el servicio gratuito)
  useEffect(() => {
    if (addrEdited.current) return
    const t = window.setTimeout(async () => {
      const a = await reverseGeocode(loc)
      if (a && !addrEdited.current) setAddress(a)
    }, 700)
    return () => window.clearTimeout(t)
  }, [loc])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const onFile = async (f: File | undefined) => {
    if (!f) return
    try {
      const blob = await resizeImage(f)
      setPhoto(blob)
      setPreview(URL.createObjectURL(blob))
    } catch {
      toast("No s'ha pogut llegir la foto. Prova amb una altra.")
    }
  }

  const nearby = useMemo(
    () =>
      category
        ? incidents.filter(
            (i) => i.category === category && !['solved', 'rejected'].includes(i.status) && distanceM(i, loc) < 60,
          )
        : [],
    [incidents, category, loc],
  )

  const suspended = user?.suspended_until && new Date(user.suspended_until) > new Date()
  const ready = !!photo && !!category && inCarmel(loc) && !suspended

  const submit = async () => {
    if (!ready || !category) return
    setBusy(true)
    const ok = await act(async () => {
      await api.createIncident({ category, description, address, lat: loc.lat, lng: loc.lng, photo })
      return true
    }, 'Gràcies! Un moderador la revisarà aviat.')
    setBusy(false)
    if (ok) nav('/')
  }

  const input =
    'w-full rounded-lg border-[1.5px] border-[#D1D5DB] bg-white px-3 font-body-md text-body-md outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/15'

  return (
    <div className="flex flex-col gap-5 p-gutter pb-8 lg:mx-auto lg:w-full lg:p-8 lg:max-w-3xl">
      <div>
        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1 font-label-sm text-label-sm uppercase text-on-primary-fixed-variant">
          <Icon name="add_a_photo" className="!text-[14px]" /> Nova incidència
        </span>
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile">Nova alerta urbana al Carmel</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Fes una foto, confirma on és i un moderador la revisarà abans que es publiqui al mapa.
        </p>
      </div>

      {/* Foto */}
      {preview ? (
        <div className="relative overflow-hidden rounded-xl">
          <img src={preview} alt="Previsualització de la foto" className="h-56 w-full object-cover" />
          <label className="absolute right-3 top-3 flex h-10 cursor-pointer items-center gap-1 rounded-full bg-white/90 px-3 font-label-md text-label-md shadow">
            <Icon name="cached" className="!text-[18px]" /> Canvia
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-container bg-primary-fixed/30 text-primary">
            <Icon name="photo_camera" className="!text-[40px]" />
            <span className="font-label-lg text-label-lg">Fes una foto de la incidència</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-1 font-label-md text-label-md text-secondary">
            <Icon name="photo_library" className="!text-[18px]" /> O tria-la de la galeria
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
      )}

      {/* Compromís */}
      <div className="flex gap-3 rounded-xl bg-primary-fixed/50 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
          <Icon name="shield" fill />
        </span>
        <div>
          <p className="font-label-lg text-label-lg text-primary">Compromís contra el frau cívic</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Si un moderador detecta imatges falses, manipulades o no pertinents, restaràs <b className="text-primary">{POINTS.fake} punts</b>.
            Amb 3 infraccions, el teu compte quedarà suspès durant 30 dies.
          </p>
        </div>
      </div>

      {suspended && (
        <p className="rounded-lg bg-error-container p-3 text-body-md text-on-error-container">
          El teu compte està suspès fins al {new Date(user!.suspended_until!).toLocaleDateString('ca-ES')}.
        </p>
      )}

      {/* Ubicación */}
      <div className="rounded-xl bg-white p-4 shadow-[0_2px_8px_-2px_rgba(27,59,111,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
        <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Ubicació</p>
        <div className="mt-1 flex items-center gap-3">
          <Icon name="my_location" className="text-primary" />
          <input
            aria-label="Adreça"
            className="h-10 min-w-0 flex-1 bg-transparent font-headline-sm text-headline-sm outline-none"
            value={address}
            placeholder="Carrer i número (opcional)"
            onChange={(e) => { addrEdited.current = true; setAddress(e.target.value) }}
          />
          <button onClick={() => setPicker(true)} className="h-9 shrink-0 rounded-full bg-secondary-fixed px-3 font-label-md text-label-md text-secondary">
            Ajusta
          </button>
        </div>
        {locNote && <p className="mt-2 text-body-sm text-amber-700">{locNote}</p>}
      </div>

      {/* Categoria */}
      <div>
        <p className="mb-2 font-label-lg text-label-lg">Categoria d'incidència</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Categoria">
          {CATEGORIES.map((c) => {
            const on = category === c.id
            return (
              <button
                key={c.id}
                role="radio"
                aria-checked={on}
                onClick={() => setCategory(c.id)}
                className={`flex h-10 items-center gap-1.5 rounded-full px-3.5 font-label-md text-label-md ${
                  on ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface'
                }`}
              >
                <Icon name={on ? 'check' : c.icon} className="!text-[16px]" />
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {nearby.length > 0 && (
        <div className="rounded-xl bg-tertiary-fixed p-4 text-on-tertiary-fixed-variant">
          <p className="font-label-lg text-label-lg">Ja hi ha {nearby.length === 1 ? 'una incidència' : `${nearby.length} incidències`} similar{nearby.length === 1 ? '' : 's'} a prop</p>
          <p className="mt-1 text-body-sm">
            {catById(nearby[0].category).label} · {nearby[0].address || 'a menys de 60 m'}. Millor dona-li suport des del mapa que no pas duplicar-la.
          </p>
          <button onClick={() => nav('/')} className="mt-2 font-label-md text-label-md underline">Veure al mapa</button>
        </div>
      )}

      {/* Descripció */}
      <label className="block">
        <span className="mb-1 flex items-baseline justify-between">
          <span className="font-label-lg text-label-lg">Descripció breu <span className="font-normal">(opcional)</span></span>
          <span className="font-caption text-caption text-on-surface-variant">{description.length}/{MAX_DESC}</span>
        </span>
        <textarea
          className={`${input} min-h-24 py-3`}
          maxLength={MAX_DESC}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Què passa i per què és un problema?"
        />
      </label>

      <div>
        <button
          disabled={!ready || busy}
          onClick={submit}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary font-label-lg text-label-lg text-on-primary shadow-[0_8px_24px_-4px_rgba(211,82,48,0.25)] active:bg-[#b83e1e] disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none"
        >
          <Icon name="send" />
          {busy ? 'Enviant…' : 'Publicar incidència'}
        </button>
        <p className="mt-2 text-center font-caption text-caption text-on-surface-variant">
          {!photo ? 'Falta la foto. ' : !category ? 'Tria una categoria. ' : ''}
          Guanyaràs +{POINTS.verified} punts quan un moderador la verifiqui.
        </p>
      </div>

      {picker && (
        <LocationPicker
          initial={loc}
          onClose={() => setPicker(false)}
          onConfirm={(p) => { setLoc(p); setLocNote(null); addrEdited.current = false; setPicker(false) }}
        />
      )}
    </div>
  )
}
