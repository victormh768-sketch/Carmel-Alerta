import type {
  Incident, ModAction, NewIncident, Notice, Profile, Redemption, Reward, Status,
} from '../types'

export const POINTS = { verified: 50, support: 5, fake: 100 }
export const MAX_DESC = 250

export interface Api {
  mode: 'local' | 'supabase'
  getUser(): Promise<Profile | null>
  signUp(a: { username: string; email?: string; password?: string }): Promise<Profile>
  signIn(a: { email: string; password: string }): Promise<Profile>
  signOut(): Promise<void>
  listIncidents(): Promise<Incident[]>
  createIncident(n: NewIncident): Promise<void>
  support(id: string): Promise<void>
  moderate(id: string, action: ModAction, opts?: { status?: Status; reason?: string }): Promise<void>
  listRewards(): Promise<Reward[]>
  redeem(rewardId: string): Promise<Redemption>
  listRedemptions(): Promise<Redemption[]>
  listNotices(): Promise<Notice[]>
  addNotice(title: string, body: string): Promise<void>
  /** Solo modo demo: activa/desactiva el rol de moderador del usuario actual */
  toggleModeratorDemo?(): Promise<void>
}

/** Usa Supabase si hay variables de entorno; si no, modo demo con localStorage. */
export async function loadApi(): Promise<Api> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (url && key && !import.meta.env.VITE_PREVIEW) {
    const m = await import('./supabase')
    return m.createSupabaseApi(url, key)
  }
  const m = await import('./local')
  return m.createLocalApi()
}
