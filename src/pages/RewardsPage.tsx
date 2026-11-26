import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { levelInfo } from '../lib/categories'
import type { Redemption, Reward } from '../types'
import Icon from '../components/Icon'

const SHOP_ICON: Record<string, string> = {
  'Alimentació': 'shopping_basket',
  'Llibreria i papereria': 'menu_book',
  'Salut': 'local_pharmacy',
}

export default function RewardsPage() {
  const { api, user, act } = useApp()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [shopCat, setShopCat] = useState('all')
  const [confirm, setConfirm] = useState<Reward | null>(null)
  const [done, setDone] = useState<Redemption | null>(null)

  useEffect(() => { api.listRewards().then(setRewards).catch(() => setRewards([])) }, [api])

  const cats = Array.from(new Set(rewards.map((r) => r.category)))
  const list = shopCat === 'all' ? rewards : rewards.filter((r) => r.category === shopCat)
  const lv = user ? levelInfo(user.lifetime_points) : null
  const tickets = user ? Math.floor(user.lifetime_points / 100) : 0

  const redeem = async () => {
    if (!confirm) return
    const r = await act(() => api.redeem(confirm.id))
    setConfirm(null)
    if (r) setDone(r)
  }

  return (
    <div className="flex flex-col gap-5 p-gutter pb-8">
      {user && lv ? (
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-tertiary-container p-5 text-white shadow-[0_8px_24px_-4px_rgba(211,82,48,0.25)]">
          <Icon name="star" fill className="absolute -right-4 -top-4 !text-[120px] text-white/10" />
          <p className="font-label-sm text-label-sm uppercase opacity-90">El teu saldo cívic</p>
          <p className="mt-1 font-headline-xl text-headline-xl">{user.points} <span className="font-headline-sm text-headline-sm">Punts Carmel</span></p>
          <div className="mt-3 flex items-center gap-2 font-label-md text-label-md">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white font-bold text-primary">{lv.current.n}</span>
            {lv.current.name} · Nivell {lv.current.n}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={Math.round(lv.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-tertiary-fixed-dim" style={{ width: `${Math.round(lv.progress * 100)}%` }} />
          </div>
          <p className="mt-2 font-caption text-caption opacity-90">
            {lv.next ? `Següent nivell: ${lv.next.name} · ${lv.remaining} pts restants` : 'Has arribat al nivell màxim'}
          </p>
        </section>
      ) : (
        <section className="rounded-xl bg-secondary-fixed p-5">
          <h1 className="font-headline-md text-headline-md text-on-secondary-fixed">Suma punts i guanya premis al barri</h1>
          <p className="mt-1 text-body-md text-on-secondary-fixed-variant">Reporta incidències, dona suport als teus veïns i bescanvia els punts als comerços del Carmel.</p>
          <Link to="/acces" state={{ from: '/comerc' }} className="mt-3 inline-flex h-12 items-center rounded-lg bg-primary px-5 font-label-lg text-label-lg text-on-primary">Entra</Link>
        </section>
      )}

      <section className="rounded-xl bg-secondary-fixed/60 p-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-tertiary-fixed px-2.5 py-1 font-label-sm text-label-sm uppercase text-on-tertiary-fixed-variant">Aviat</span>
          <span className="font-label-sm text-label-sm uppercase text-secondary">Sorteig de comerç de proximitat</span>
        </div>
        <p className="mt-2 text-body-md">
          Preparem un sorteig entre veïns amb premis dels comerços del Carmel. <b>1 tiquet per cada 100 punts</b> aconseguits.
        </p>
        {user && <p className="mt-2 font-label-md text-label-md text-primary">Ara tens {tickets} {tickets === 1 ? 'tiquet' : 'tiquets'}</p>}
      </section>

      <section>
        <h2 className="font-headline-md text-headline-md">Bescanvis al barri</h2>
        <p className="text-body-md text-on-surface-variant">Recompenses directes a les teves botigues.</p>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {['all', ...cats].map((c) => (
            <button
              key={c}
              onClick={() => setShopCat(c)}
              className={`h-9 shrink-0 rounded-full px-3.5 font-label-md text-label-md ${shopCat === c ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface'}`}
            >
              {c === 'all' ? 'Tots els comerços' : c}
            </button>
          ))}
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          {list.map((r) => {
            const can = !!user && user.points >= r.cost
            return (
              <li key={r.id} className="flex gap-3 rounded-xl bg-white p-3 shadow-[0_2px_8px_-2px_rgba(27,59,111,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
                  <Icon name={SHOP_ICON[r.category] ?? 'storefront'} fill className="!text-[34px] text-secondary" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="inline-flex w-fit items-center gap-1 font-label-sm text-label-sm uppercase text-primary">
                    <Icon name="storefront" className="!text-[13px]" /> {r.address}
                  </span>
                  <h3 className="font-headline-sm text-headline-sm leading-tight">{r.shop}</h3>
                  <p className="text-body-sm text-on-surface-variant">{r.title}</p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-headline-sm text-headline-sm text-tertiary">{r.cost} punts</span>
                    <button
                      disabled={!!user && !can}
                      onClick={() => (user ? setConfirm(r) : undefined)}
                      className="flex h-10 items-center gap-1 rounded-lg bg-primary px-3 font-label-md text-label-md text-on-primary active:bg-[#b83e1e] disabled:bg-surface-container-high disabled:text-on-surface-variant"
                    >
                      {!user ? <Link to="/acces" state={{ from: '/comerc' }}>Entra</Link> : can ? <>Bescanviar <Icon name="redeem" className="!text-[16px]" /></> : 'Et falten punts'}
                    </button>
                  </div>
                  {r.open_until && <p className="mt-1 font-caption text-caption text-on-surface-variant">Obert fins les {r.open_until}</p>}
                </div>
              </li>
            )
          })}
        </ul>
        {api.mode === 'local' && (
          <p className="mt-3 text-center font-caption text-caption text-on-surface-variant">
            Comerços i premis d'exemple. Es substituiran pels comerços reals del Carmel al llançament.
          </p>
        )}
      </section>

      <section className="rounded-xl bg-secondary-fixed/50 p-4">
        <h2 className="mb-3 flex items-center gap-2 font-headline-sm text-headline-sm">
          <Icon name="lightbulb" className="text-tertiary-container" /> Com funciona el Saldo Cívic?
        </h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['photo_camera', '1. Reporta', 'Fes foto d\'un desperfecte'],
            ['how_to_reg', '2. Verifica', 'Un moderador la valida'],
            ['redeem', '3. Gaudeix', 'Bescanvia els punts al barri'],
          ].map(([ic, t, d]) => (
            <div key={t} className="rounded-lg bg-white p-2">
              <Icon name={ic} className="text-primary" />
              <p className="font-label-md text-label-md">{t}</p>
              <p className="font-caption text-caption text-on-surface-variant">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {confirm && (
        <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/40" role="dialog" aria-modal="true">
          <div className="w-full max-w-[480px] rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <h2 className="font-headline-md text-headline-md">Bescanviar el premi?</h2>
            <p className="mt-2 text-body-md text-on-surface-variant">{confirm.shop}: {confirm.title}. Et costarà <b>{confirm.cost} punts</b>.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirm(null)} className="h-12 flex-1 rounded-lg bg-surface-container-high font-label-lg text-label-lg">Cancel·la</button>
              <button onClick={redeem} className="h-12 flex-1 rounded-lg bg-primary font-label-lg text-label-lg text-on-primary">Bescanvia</button>
            </div>
          </div>
        </div>
      )}

      {done && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 p-gutter" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
            <Icon name="celebration" fill className="!text-[40px] text-tertiary-container" />
            <h2 className="mt-2 font-headline-md text-headline-md">Premi bescanviat!</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">{done.shop}: ensenya aquest codi al comerç.</p>
            <p className="my-4 rounded-lg bg-surface-container-low py-3 font-headline-xl text-headline-xl tracking-[0.2em] text-primary">{done.code}</p>
            <button onClick={() => setDone(null)} className="h-12 w-full rounded-lg bg-primary font-label-lg text-label-lg text-on-primary">Entesos</button>
          </div>
        </div>
      )}
    </div>
  )
}
