import type { Incident, Notice, Profile, Redemption, Reward } from '../types'

export type Stored = Omit<Incident, 'supported_by_me'>

export interface DB {
  users: Profile[]
  me: string | null
  incidents: Stored[]
  votes: string[] // `${incidentId}:${userId}`
  redemptions: (Redemption & { user_id: string })[]
  notices: Notice[]
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600e3).toISOString()

const mkUser = (id: string, username: string, pts: number): Profile => ({
  id, username, points: pts, lifetime_points: pts, is_moderator: false,
  strikes: 0, suspended_until: null, created_at: hoursAgo(24 * 40),
})

export const REWARDS: Reward[] = [
  { id: 'r1', shop: 'Fruiteria del Barri', title: '10% de descompte en fruita i verdura', cost: 100, category: 'Alimentació', address: 'Zona Mercat', open_until: '20:00' },
  { id: 'r2', shop: 'Fleca El Forn de la Rambla', title: 'Cafè amb llet i pasta artesana', cost: 80, category: 'Alimentació', address: 'Rambla del Carmel', open_until: '19:30' },
  { id: 'r3', shop: 'Papereria La Plana', title: 'Val de 5 € en material escolar', cost: 150, category: 'Llibreria i papereria', address: 'Plaça del Carmel', open_until: '20:30' },
  { id: 'r4', shop: 'Farmàcia Ponent', title: 'Kit de primers auxilis', cost: 120, category: 'Salut', address: 'Zona Pastrana', open_until: null },
]

export function buildSeed(): DB {
  const users = [mkUser('u1', 'Marta_Carmel', 180), mkUser('u2', 'Jordi_G', 90), mkUser('u3', 'Neus_Pastrana', 40)]
  const base = { photo_url: null, reject_reason: null, demo: true, updated_at: hoursAgo(1) }
  const incidents: Stored[] = [
    { ...base, id: 's1', category: 'neteja', description: 'Contenidor desbordat i residus fora. Pendent de recollida.', address: 'Carrer del Llobregós, 142', lat: 41.4196, lng: 2.1543, status: 'verified', author_id: 'u1', author_name: 'Marta_Carmel', supports: 14, created_at: hoursAgo(20) },
    { ...base, id: 's2', category: 'transit', description: 'Cotxes aparcats sobre el pas de vianants, no es veu res en girar.', address: 'Rambla del Carmel', lat: 41.4178, lng: 2.1518, status: 'communicated', author_id: 'u2', author_name: 'Jordi_G', supports: 9, created_at: hoursAgo(50) },
    { ...base, id: 's3', category: 'enllumenat', description: 'Fanals apagats a la plaça des de fa una setmana.', address: 'Plaça Pastrana', lat: 41.4233, lng: 2.1591, status: 'in_progress', author_id: 'u3', author_name: 'Neus_Pastrana', supports: 21, created_at: hoursAgo(24 * 6) },
    { ...base, id: 's4', category: 'barreres', description: "L'escala mecànica ja funciona de nou.", address: "Carrer de l'Alguer", lat: 41.4190, lng: 2.1575, status: 'solved', author_id: 'u1', author_name: 'Marta_Carmel', supports: 33, created_at: hoursAgo(24 * 12) },
    { ...base, id: 's5', category: 'voreres', description: "Vorera aixecada per arrels d'arbres, perill de caiguda per a gent gran.", address: 'Carrer de la Murtra, 28', lat: 41.4225, lng: 2.1540, status: 'verified', author_id: 'u2', author_name: 'Jordi_G', supports: 6, created_at: hoursAgo(30) },
    { ...base, id: 's6', category: 'mobiliari', description: 'Banc trencat, falten dues llistons.', address: 'Plaça del Carmel', lat: 41.4210, lng: 2.1565, status: 'verified', author_id: 'u3', author_name: 'Neus_Pastrana', supports: 3, created_at: hoursAgo(72) },
    { ...base, id: 's7', category: 'obres', description: 'Carrer tallat per obres sense senyalització alternativa.', address: 'Carrer del Santuari', lat: 41.4201, lng: 2.1500, status: 'communicated', author_id: 'u1', author_name: 'Marta_Carmel', supports: 11, created_at: hoursAgo(24 * 3) },
    { ...base, id: 's8', category: 'verd', description: 'Zona verda amb herba molt alta i papereres plenes.', address: 'Carrer de Lloret de Mar', lat: 41.4170, lng: 2.1560, status: 'verified', author_id: 'u2', author_name: 'Jordi_G', supports: 4, created_at: hoursAgo(40) },
  ]
  const notices: Notice[] = [
    { id: 'n1', title: 'Benvinguts a CarmelAlerta (versió de prova)', body: 'Aquesta és una versió de prova. Les incidències que veus són de demostració. Reporta una incidència real i un moderador la revisarà.', created_at: hoursAgo(2) },
  ]
  return { users, me: null, incidents, votes: [], redemptions: [], notices }
}
