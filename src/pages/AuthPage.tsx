import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import Icon from '../components/Icon'

const input =
  'h-12 w-full rounded-lg border-[1.5px] border-[#D1D5DB] bg-white px-3 font-body-lg text-body-lg outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/15'

export default function AuthPage() {
  const { api, act, user } = useApp()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const local = api.mode === 'local'
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) {
    return (
      <div className="p-gutter text-center">
        <p className="mb-4">Ja has iniciat sessió com a <b>{user.username}</b>.</p>
        <button onClick={() => nav('/')} className="h-12 rounded-lg bg-primary px-6 font-label-lg text-on-primary">Anar al mapa</button>
      </div>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const r = await act(() =>
      mode === 'signup' || local ? api.signUp({ username, email, password }) : api.signIn({ email, password }),
    )
    setBusy(false)
    if (r) nav(from, { replace: true })
  }

  return (
    <form onSubmit={submit} className="flex min-h-full flex-col gap-4 p-gutter pt-8">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary">
        <Icon name="location_on" fill className="!text-[32px]" />
      </span>
      <div>
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile">
          {local ? 'Entra a CarmelAlerta' : mode === 'signup' ? 'Crea el teu compte' : 'Torna a entrar'}
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Per reportar incidències, donar suport i guanyar punts cal tenir un perfil de veí.
        </p>
      </div>

      {(mode === 'signup' || local) && (
        <label className="block">
          <span className="mb-1 block font-label-md text-label-md">Nom d'usuari</span>
          <input className={input} value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={20} required autoComplete="username" placeholder="p. ex. Veí_Carmel" />
        </label>
      )}
      {!local && (
        <>
          <label className="block">
            <span className="mb-1 block font-label-md text-label-md">Correu electrònic</span>
            <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="block">
            <span className="mb-1 block font-label-md text-label-md">Contrasenya</span>
            <input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </label>
        </>
      )}

      <button disabled={busy} className="h-12 rounded-lg bg-primary font-label-lg text-label-lg text-on-primary active:bg-[#b83e1e] disabled:opacity-60">
        {busy ? 'Un moment…' : local ? 'Entra' : mode === 'signup' ? 'Crea el compte' : 'Entra'}
      </button>

      {!local && (
        <button type="button" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')} className="min-h-12 font-label-md text-label-md text-secondary">
          {mode === 'signup' ? 'Ja tinc compte' : 'Encara no tinc compte'}
        </button>
      )}
      {local && (
        <p className="rounded-lg bg-tertiary-fixed p-3 text-body-sm text-on-tertiary-fixed-variant">
          Mode demostració: només cal un nom d'usuari i les dades es guarden en aquest dispositiu.
        </p>
      )}
    </form>
  )
}
