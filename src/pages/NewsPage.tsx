import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { timeAgo } from '../lib/util'
import type { Notice } from '../types'
import Icon from '../components/Icon'

export default function NewsPage() {
  const { api, incidents } = useApp()
  const [notices, setNotices] = useState<Notice[]>([])
  useEffect(() => { api.listNotices().then(setNotices).catch(() => setNotices([])) }, [api])

  const verified = incidents.filter((i) => !['pending', 'rejected'].includes(i.status))
  const solved = verified.filter((i) => i.status === 'solved').length
  const neighbors = new Set(verified.map((i) => i.author_id)).size
  const stats = [
    ['fact_check', verified.length, 'Incidències verificades'],
    ['task_alt', solved, 'Solucionades'],
    ['groups', neighbors, 'Veïns participants'],
  ] as const

  return (
    <div className="flex flex-col gap-5 p-gutter pb-8 lg:mx-auto lg:w-full lg:p-8 lg:max-w-4xl">
      <div>
        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-secondary-fixed px-3 py-1 font-label-sm text-label-sm uppercase text-on-secondary-fixed-variant">
          <Icon name="info" className="!text-[14px]" /> Informació del veïnat
        </span>
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile">Notícies i avisos</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Avisos publicats pels moderadors i l'impacte de la participació al barri.</p>
      </div>

      <section className="rounded-xl bg-gradient-to-br from-secondary to-[#1B3B6F] p-5 text-white">
        <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm">
          <Icon name="volunteer_activism" /> Gràcies al veïnat del Carmel
        </h2>
        <p className="mt-1 text-body-sm opacity-90">Això és el que heu aconseguit entre tots amb CarmelAlerta:</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {stats.map(([ic, n, l]) => (
            <div key={l} className="rounded-lg bg-white/15 p-3">
              <Icon name={ic} className="opacity-90" />
              <p className="font-headline-lg text-headline-lg">{n}</p>
              <p className="font-caption text-caption opacity-90">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {notices.length === 0 && <p className="text-body-md text-on-surface-variant">Encara no hi ha avisos.</p>}
        {notices.map((n) => (
          <article key={n.id} className="rounded-xl border-l-4 border-primary bg-white p-4 shadow-[0_2px_8px_-2px_rgba(27,59,111,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="font-caption text-caption text-on-surface-variant">{timeAgo(n.created_at)}</p>
            <h3 className="mt-1 font-headline-sm text-headline-sm">{n.title}</h3>
            <p className="mt-1 text-body-md text-on-surface-variant">{n.body}</p>
          </article>
        ))}
      </section>

      <Link to="/reportar" className="flex items-center gap-3 rounded-xl bg-secondary-fixed/60 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-on-secondary"><Icon name="campaign" /></span>
        <span className="flex-1">
          <span className="block font-headline-sm text-headline-sm">Has vist un problema al barri?</span>
          <span className="text-body-sm text-on-surface-variant">Reporta-ho en menys d'un minut.</span>
        </span>
        <Icon name="arrow_forward" className="text-primary" />
      </Link>
    </div>
  )
}
