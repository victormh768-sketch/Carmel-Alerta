import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { catById, levelInfo } from '../lib/categories'
import { incidentTitle, timeAgo } from '../lib/util'
import type { Redemption } from '../types'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'

export default function ProfilePage() {
  const { api, user, incidents, act } = useApp()
  const nav = useNavigate()
  const [reds, setReds] = useState<Redemption[]>([])

  useEffect(() => { if (!user) nav('/acces', { replace: true, state: { from: '/perfil' } }) }, [user, nav])
  useEffect(() => { if (user) api.listRedemptions().then(setReds).catch(() => setReds([])) }, [api, user])

  if (!user) return null
  const lv = levelInfo(user.lifetime_points)
  const mine = incidents.filter((i) => i.author_id === user.id)

  return (
    <div className="flex flex-col gap-5 p-gutter pb-8">
      <section className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary font-headline-lg text-headline-lg uppercase text-on-secondary">{user.username[0]}</span>
        <div>
          <h1 className="font-headline-lg text-headline-lg">{user.username}</h1>
          <p className="text-body-md text-on-surface-variant">{lv.current.name} · Nivell {lv.current.n}</p>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-[0_2px_8px_-2px_rgba(27,59,111,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-baseline justify-between">
          <p className="font-headline-xl-mobile text-headline-xl-mobile text-primary">{user.points} <span className="font-label-lg text-label-lg text-on-surface-variant">punts</span></p>
          <Link to="/comerc" className="font-label-md text-label-md text-secondary">Bescanviar →</Link>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full rounded-full bg-tertiary-container" style={{ width: `${Math.round(lv.progress * 100)}%` }} />
        </div>
        <p className="mt-1 font-caption text-caption text-on-surface-variant">
          {lv.next ? `${lv.remaining} punts per a ${lv.next.name}` : 'Nivell màxim'}
        </p>
        {user.strikes > 0 && <p className="mt-2 text-body-sm text-amber-700">Infraccions: {user.strikes}/3</p>}
      </section>

      <section>
        <h2 className="mb-2 font-headline-md text-headline-md">Les meves incidències</h2>
        {mine.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">Encara no n'has reportat cap. <Link to="/reportar" className="font-semibold text-primary">Fes la primera</Link>.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mine.map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
                  <Icon name={catById(i.category).icon} fill className={catById(i.category).chipIcon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-label-lg text-label-lg">{incidentTitle(i.description, catById(i.category).label)}</p>
                  <p className="font-caption text-caption text-on-surface-variant">{timeAgo(i.created_at)} · {i.supports} suports</p>
                </div>
                <StatusBadge status={i.status} short />
              </li>
            ))}
          </ul>
        )}
      </section>

      {reds.length > 0 && (
        <section>
          <h2 className="mb-2 font-headline-md text-headline-md">Els meus premis</h2>
          <ul className="flex flex-col gap-2">
            {reds.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate font-label-lg text-label-lg">{r.shop}</p>
                  <p className="truncate font-caption text-caption text-on-surface-variant">{r.title} · {timeAgo(r.created_at)}</p>
                </div>
                <span className="rounded-lg bg-surface-container-low px-3 py-1 font-label-lg text-label-lg tracking-widest text-primary">{r.code}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        {user.is_moderator && (
          <Link to="/moderacio" className="flex h-12 items-center justify-center gap-2 rounded-lg bg-secondary font-label-lg text-label-lg text-on-secondary">
            <Icon name="shield_person" /> Panell de moderació
          </Link>
        )}
        {api.toggleModeratorDemo && (
          <button onClick={() => act(() => api.toggleModeratorDemo!())} className="h-12 rounded-lg bg-surface-container-high font-label-md text-label-md">
            {user.is_moderator ? 'Desactiva el mode moderador (demo)' : 'Activa el mode moderador (demo)'}
          </button>
        )}
        <button
          onClick={async () => { await act(() => api.signOut()); nav('/') }}
          className="h-12 rounded-lg border border-outline-variant font-label-lg text-label-lg text-on-surface-variant"
        >
          Tanca la sessió
        </button>
      </section>
    </div>
  )
}
