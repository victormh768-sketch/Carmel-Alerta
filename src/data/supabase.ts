import { createClient } from '@supabase/supabase-js'
import type { Incident, Notice, Profile, Redemption, Reward } from '../types'
import { uid } from '../lib/util'
import type { Api } from './api'

export function createSupabaseApi(url: string, key: string): Api {
  const sb = createClient(url, key)

  const fail = (e: { message?: string } | null): never => {
    throw new Error(e?.message ?? 'Error de connexió')
  }

  async function profile(): Promise<Profile | null> {
    const { data: { session } } = await sb.auth.getSession()
    if (!session) return null
    const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single()
    if (error) return null
    return data as Profile
  }

  return {
    mode: 'supabase',

    getUser: profile,

    async signUp({ username, email, password }) {
      if (!email || !password) throw new Error('Cal un correu i una contrasenya')
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { username: username.trim() } } })
      if (error) fail(error)
      if (!data.session) throw new Error('Compte creat. Revisa el correu per confirmar-lo i després entra.')
      return (await profile())!
    },

    async signIn({ email, password }) {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) fail(error)
      return (await profile())!
    },

    async signOut() { await sb.auth.signOut() },

    async listIncidents() {
      const { data, error } = await sb
        .from('incidents')
        .select('*, author:profiles(username)')
        .order('created_at', { ascending: false })
      if (error) fail(error)
      const { data: { session } } = await sb.auth.getSession()
      let mine = new Set<string>()
      if (session) {
        const { data: v } = await sb.from('votes').select('incident_id').eq('user_id', session.user.id)
        mine = new Set((v ?? []).map((x: { incident_id: string }) => x.incident_id))
      }
      return (data ?? []).map((r: any): Incident => ({
        id: r.id, category: r.category, description: r.description, address: r.address,
        lat: r.lat, lng: r.lng, photo_url: r.photo_url, status: r.status, author_id: r.author_id,
        author_name: r.author?.username ?? 'Veí', supports: r.supports, supported_by_me: mine.has(r.id),
        reject_reason: r.reject_reason, created_at: r.created_at, updated_at: r.updated_at,
      }))
    },

    async createIncident(n) {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) throw new Error('Cal iniciar sessió')
      let photo_url: string | null = null
      if (n.photo) {
        const path = `${session.user.id}/${uid()}.jpg`
        const up = await sb.storage.from('incident-photos').upload(path, n.photo, { contentType: 'image/jpeg' })
        if (up.error) fail(up.error)
        photo_url = sb.storage.from('incident-photos').getPublicUrl(path).data.publicUrl
      }
      const { error } = await sb.from('incidents').insert({
        author_id: session.user.id, category: n.category, description: n.description.trim(),
        address: n.address.trim(), lat: n.lat, lng: n.lng, photo_url,
      })
      if (error) fail(error)
    },

    async support(id) {
      const { error } = await sb.rpc('support_incident', { p_id: id })
      if (error) fail(error)
    },

    async moderate(id, action, opts) {
      const { error } = await sb.rpc('moderate_incident', {
        p_id: id, p_action: action, p_status: opts?.status ?? null, p_reason: opts?.reason ?? null,
      })
      if (error) fail(error)
    },

    async listRewards() {
      const { data, error } = await sb.from('rewards').select('*').eq('active', true).order('cost')
      if (error) fail(error)
      return (data ?? []) as Reward[]
    },

    async redeem(rewardId) {
      const { data, error } = await sb.rpc('redeem_reward', { p_id: rewardId })
      if (error) fail(error)
      return data as Redemption
    },

    async listRedemptions() {
      const { data, error } = await sb
        .from('redemptions')
        .select('id, reward_id, code, cost, created_at, reward:rewards(shop, title)')
        .order('created_at', { ascending: false })
      if (error) fail(error)
      return (data ?? []).map((r: any): Redemption => ({
        id: r.id, reward_id: r.reward_id, code: r.code, cost: r.cost, created_at: r.created_at,
        shop: r.reward?.shop ?? '', title: r.reward?.title ?? '',
      }))
    },

    async listNotices() {
      const { data, error } = await sb.from('notices').select('*').order('created_at', { ascending: false })
      if (error) fail(error)
      return (data ?? []) as Notice[]
    },

    async addNotice(title, body) {
      const { error } = await sb.from('notices').insert({ title: title.trim(), body: body.trim() })
      if (error) fail(error)
    },
  }
}
