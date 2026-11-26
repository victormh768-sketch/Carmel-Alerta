import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react'
import { loadApi, type Api } from '../data/api'
import type { Incident, LatLng, Profile } from '../types'

interface AppCtx {
  api: Api
  user: Profile | null
  incidents: Incident[]
  position: LatLng | null
  toastMsg: string | null
  toast: (m: string) => void
  refresh: () => Promise<void>
  /** Ejecuta una acción, refresca los datos y muestra el error/éxito como aviso. */
  act: <T>(fn: () => Promise<T>, ok?: string) => Promise<T | undefined>
  locate: () => Promise<LatLng | null>
}

const Ctx = createContext<AppCtx>(null as unknown as AppCtx)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<Api | null>(null)
  const [user, setUser] = useState<Profile | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [position, setPosition] = useState<LatLng | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<number>()

  const toast = useCallback((m: string) => {
    setToastMsg(m)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToastMsg(null), 4200)
  }, [])

  const refreshWith = useCallback(async (a: Api) => {
    const [u, i] = await Promise.all([a.getUser(), a.listIncidents()])
    setUser(u)
    setIncidents(i)
  }, [])

  useEffect(() => {
    loadApi()
      .then(async (a) => {
        await refreshWith(a)
        setApi(a)
      })
      .catch((e) => setError(e?.message ?? 'No s\'ha pogut carregar l\'app'))
  }, [refreshWith])

  const refresh = useCallback(async () => { if (api) await refreshWith(api) }, [api, refreshWith])

  const act = useCallback(
    async <T,>(fn: () => Promise<T>, ok?: string): Promise<T | undefined> => {
      try {
        const r = await fn()
        if (api) await refreshWith(api)
        if (ok) toast(ok)
        return r
      } catch (e) {
        toast((e as { message?: string })?.message ?? 'Alguna cosa ha fallat')
        return undefined
      }
    },
    [api, refreshWith, toast],
  )

  const locate = useCallback(
    () =>
      new Promise<LatLng | null>((resolve) => {
        if (!navigator.geolocation) {
          toast('El teu dispositiu no té geolocalització')
          return resolve(null)
        }
        navigator.geolocation.getCurrentPosition(
          (p) => {
            const l = { lat: p.coords.latitude, lng: p.coords.longitude }
            setPosition(l)
            resolve(l)
          },
          () => {
            toast('No hem pogut obtenir la teva ubicació. Revisa els permisos del navegador.')
            resolve(null)
          },
          { enableHighAccuracy: true, timeout: 10000 },
        )
      }),
    [toast],
  )

  if (error) return <div className="p-6 text-error">{error}</div>
  if (!api) {
    return (
      <div className="flex h-full items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-pulse text-5xl text-primary">location_on</span>
      </div>
    )
  }

  return (
    <Ctx.Provider value={{ api, user, incidents, position, toastMsg, toast, refresh, act, locate }}>
      {children}
    </Ctx.Provider>
  )
}
