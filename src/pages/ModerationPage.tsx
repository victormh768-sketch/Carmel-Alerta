import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { catById, PUBLIC_STATUSES, STATUS } from '../lib/categories'
import { POINTS } from '../data/api'
import { timeAgo } from '../lib/util'
import type { ModAction, Status } from '../types'
import Icon from '../components/Icon'

export default function ModerationPage() {
  const { api, user, incidents, act } = useApp()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  if (!user?.is_moderator) {
    return (
      <div className="p-gutter text-center">
        <Icon name="lock" className="!text-[40px] text-on-surface-variant" />
        <p className="mt-2 text-body-md">Aquesta secció és només per a moderadors.</p>
        <Link to="/" className="mt-3 inline-block font-label-lg text-label-lg text-primary">Tornar al mapa</Link>
      </div>
    )
  }

  const pending = incidents.filter((i) => i.status === 'pending')
  const live = incidents.filter((i) => PUBLIC_STATUSES.includes(i.status) && i.status !== 'solved')

  const moderate = (id: string, action: ModAction, opts?: { status?: Status; reason?: string }, ok?: string) =>
    act(() => api.moderate(id, action, opts), ok)

  const reject = (id: string, fake: boolean) => {
    const reason = window.prompt('Motiu (opcional, el veurà l\'autor):') ?? ''
    moderate(id, fake ? 'reject_fake' : 'reject', { reason }, fake ? `Rebutjada. −${POINTS.fake} punts a l'autor.` : 'Rebutjada')
  }

  const addNotice = async (e: FormEvent) => {
    e.preventDefault()
    const r = await act(async () => { await api.addNotice(title, body); return true }, 'Avís publicat')
    if (r) { setTitle(''); setBody('') }
  }

  const field = 'w-full rounded-lg border-[1.5px] border-[#D1D5DB] bg-white px-3 py-3 font-body-md text-body-md outline-none focus:border-secondary'

  return (
    <div className="flex flex-col gap-6 p-gutter pb-8">
      <h1 className="font-headline-xl-mobile text-headline-xl-mobile">Moderació</h1>

      <section>
        <h2 className="mb-2 font-headline-md text-headline-md">Pendents de verificació ({pending.length})</h2>
        {pending.length === 0 && <p className="text-body-md text-on-surface-variant">No hi ha res pendent. Bona feina!</p>}
        <ul className="flex flex-col gap-3">
          {pending.map((i) => (
            <li key={i.id} className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_-2px_rgba(27,59,111,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
              {i.photo_url ? (
                <img src={i.photo_url} alt="Foto de la incidència" className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-24 items-center justify-center bg-surface-container-high text-on-surface-variant">Sense foto</div>
              )}
              <div className="p-3">
                <p className="font-label-sm text-label-sm uppercase text-primary">{catById(i.category).label}</p>
                <p className="font-body-md text-body-md">{i.description || <i className="text-on-surface-variant">Sense descripció</i>}</p>
                <p className="mt-1 font-caption text-caption text-on-surface-variant">
                  {i.address || `${i.lat.toFixed(5)}, ${i.lng.toFixed(5)}`} · {i.author_name} · {timeAgo(i.created_at)}
                </p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => moderate(i.id, 'verify', undefined, `Verificada. +${POINTS.verified} punts a ${i.author_name}`)} className="h-11 flex-1 rounded-lg bg-green-600 font-label-md text-label-md text-white">Verifica</button>
                  <button onClick={() => reject(i.id, false)} className="h-11 flex-1 rounded-lg bg-surface-container-high font-label-md text-label-md">Rebutja</button>
                  <button onClick={() => reject(i.id, true)} className="h-11 flex-1 rounded-lg bg-error-container font-label-md text-label-md text-on-error-container">Falsa</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-headline-md text-headline-md">Seguiment ({live.length})</h2>
        <p className="mb-2 text-body-sm text-on-surface-variant">Marca «Comunicada a l'Ajuntament» només quan realment l'hagis enviat.</p>
        <ul className="flex flex-col gap-2">
          {live.map((i) => (
            <li key={i.id} className="rounded-xl bg-white p-3 shadow-sm">
              <p className="truncate font-label-lg text-label-lg">{i.address || catById(i.category).label}</p>
              <p className="truncate font-caption text-caption text-on-surface-variant">{i.description}</p>
              <select
                aria-label="Estat"
                value={i.status}
                onChange={(e) => moderate(i.id, 'set_status', { status: e.target.value as Status }, 'Estat actualitzat')}
                className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-2 font-body-md text-body-md"
              >
                {PUBLIC_STATUSES.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
              </select>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-headline-md text-headline-md">Publicar un avís</h2>
        <form onSubmit={addNotice} className="flex flex-col gap-2">
          <input className={field} placeholder="Títol" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className={`${field} min-h-24`} placeholder="Text de l'avís" value={body} onChange={(e) => setBody(e.target.value)} required />
          <button className="h-12 rounded-lg bg-primary font-label-lg text-label-lg text-on-primary">Publica</button>
        </form>
      </section>
    </div>
  )
}
