import type { Incident, Profile, Redemption } from '../types'
import { PUBLIC_STATUSES } from '../lib/categories'
import { blobToDataUrl } from '../lib/image'
import { uid } from '../lib/util'
import { POINTS, MAX_DESC, type Api } from './api'
import { buildSeed, REWARDS, type DB, type Stored } from './seed'

const KEY = 'carmel-alerta:v1'

let storageOk = true

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DB
  } catch { storageOk = false }
  return buildSeed()
}

export function createLocalApi(): Api {
  let db = load()

  const persist = () => {
    if (!storageOk) return
    try {
      localStorage.setItem(KEY, JSON.stringify(db))
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'QuotaExceededError')) { storageOk = false; return }
      throw new Error("L'emmagatzematge del navegador és ple. Esborra dades de CarmelAlerta i torna-ho a provar.")
    }
  }
  const me = (): Profile | null => db.users.find((u) => u.id === db.me) ?? null
  const needMe = (): Profile => {
    const u = me()
    if (!u) throw new Error('Cal iniciar sessió')
    return u
  }
  const addPoints = (u: Profile, n: number) => {
    u.points = Math.max(0, u.points + n)
    u.lifetime_points = Math.max(0, u.lifetime_points + n)
  }
  const toIncident = (i: Stored): Incident => ({
    ...i, supported_by_me: db.me ? db.votes.includes(`${i.id}:${db.me}`) : false,
  })

  return {
    mode: 'local',

    async getUser() { return me() },

    async signUp({ username }) {
      const name = username.trim()
      if (name.length < 3 || name.length > 20) throw new Error("El nom d'usuari ha de tenir entre 3 i 20 caràcters")
      let u = db.users.find((x) => x.username.toLowerCase() === name.toLowerCase())
      if (!u) {
        u = { id: uid(), username: name, points: 0, lifetime_points: 0, is_moderator: false, strikes: 0, suspended_until: null, created_at: new Date().toISOString() }
        db.users.push(u)
      }
      db.me = u.id
      persist()
      return u
    },

    async signIn() { throw new Error('No disponible en mode demostració') },

    async signOut() { db.me = null; persist() },

    async listIncidents() {
      const u = me()
      return db.incidents
        .filter((i) => PUBLIC_STATUSES.includes(i.status) || (u && (i.author_id === u.id || u.is_moderator)))
        .map(toIncident)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
    },

    async createIncident(n) {
      const u = needMe()
      if (u.suspended_until && new Date(u.suspended_until) > new Date()) {
        throw new Error(`El teu compte està suspès fins al ${new Date(u.suspended_until).toLocaleDateString('ca-ES')}`)
      }
      if (n.description.length > MAX_DESC) throw new Error('La descripció és massa llarga')
      const photo_url = n.photo ? await blobToDataUrl(n.photo) : null
      const now = new Date().toISOString()
      db.incidents.push({
        id: uid(), category: n.category, description: n.description.trim(), address: n.address.trim(),
        lat: n.lat, lng: n.lng, photo_url, status: 'pending', author_id: u.id, author_name: u.username,
        supports: 0, reject_reason: null, created_at: now, updated_at: now,
      })
      persist()
    },

    async support(id) {
      const u = needMe()
      const inc = db.incidents.find((i) => i.id === id)
      if (!inc) throw new Error('Incidència no trobada')
      if (inc.author_id === u.id) throw new Error('No pots donar suport a la teva pròpia incidència')
      if (!['verified', 'communicated', 'in_progress'].includes(inc.status)) throw new Error('Aquesta incidència ja no admet suport')
      const k = `${id}:${u.id}`
      if (db.votes.includes(k)) throw new Error('Ja has donat suport a aquesta incidència')
      db.votes.push(k)
      inc.supports += 1
      addPoints(u, POINTS.support)
      persist()
    },

    async moderate(id, action, opts) {
      const mod = needMe()
      if (!mod.is_moderator) throw new Error('Només moderadors')
      const inc = db.incidents.find((i) => i.id === id)
      if (!inc) throw new Error('Incidència no trobada')
      const author = db.users.find((u) => u.id === inc.author_id)
      const now = new Date().toISOString()
      if (action === 'set_status') {
        const s = opts?.status
        if (!s || !PUBLIC_STATUSES.includes(s) || !PUBLIC_STATUSES.includes(inc.status)) throw new Error('Estat no vàlid')
        inc.status = s
      } else {
        if (inc.status !== 'pending') throw new Error('Aquesta incidència ja no està pendent')
        if (action === 'verify') {
          inc.status = 'verified'
          if (author) addPoints(author, POINTS.verified)
        } else {
          inc.status = 'rejected'
          inc.reject_reason = opts?.reason?.trim() || null
          if (action === 'reject_fake' && author) {
            addPoints(author, -POINTS.fake)
            author.strikes += 1
            if (author.strikes >= 3) {
              author.strikes = 0
              author.suspended_until = new Date(Date.now() + 30 * 86400e3).toISOString()
            }
          }
        }
      }
      inc.updated_at = now
      persist()
    },

    async listRewards() { return REWARDS },

    async redeem(rewardId) {
      const u = needMe()
      const r = REWARDS.find((x) => x.id === rewardId)
      if (!r) throw new Error('Premi no disponible')
      if (u.points < r.cost) throw new Error('No tens prou punts')
      u.points -= r.cost
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      const red: Redemption & { user_id: string } = {
        id: uid(), reward_id: r.id, shop: r.shop, title: r.title, cost: r.cost, code,
        created_at: new Date().toISOString(), user_id: u.id,
      }
      db.redemptions.push(red)
      persist()
      return red
    },

    async listRedemptions() {
      const u = me()
      return u ? db.redemptions.filter((r) => r.user_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at)) : []
    },

    async listNotices() { return [...db.notices].sort((a, b) => b.created_at.localeCompare(a.created_at)) },

    async addNotice(title, body) {
      const u = needMe()
      if (!u.is_moderator) throw new Error('Només moderadors')
      db.notices.push({ id: uid(), title: title.trim(), body: body.trim(), created_at: new Date().toISOString() })
      persist()
    },

    async toggleModeratorDemo() {
      const u = needMe()
      u.is_moderator = !u.is_moderator
      persist()
    },
  }
}
