export type CategoryId =
  | 'mobiliari' | 'voreres' | 'neteja' | 'enllumenat'
  | 'barreres' | 'transit' | 'obres' | 'verd'

export type Status = 'pending' | 'verified' | 'communicated' | 'in_progress' | 'solved' | 'rejected'

export type LatLng = { lat: number; lng: number }

export interface Profile {
  id: string
  username: string
  points: number
  lifetime_points: number
  is_moderator: boolean
  strikes: number
  suspended_until: string | null
  created_at: string
}

export interface Incident {
  id: string
  category: CategoryId
  description: string
  address: string
  lat: number
  lng: number
  photo_url: string | null
  status: Status
  author_id: string
  author_name: string
  supports: number
  supported_by_me: boolean
  reject_reason: string | null
  demo?: boolean
  created_at: string
  updated_at: string
}

export interface NewIncident {
  category: CategoryId
  description: string
  address: string
  lat: number
  lng: number
  photo: Blob | null
}

export interface Reward {
  id: string
  shop: string
  title: string
  cost: number
  category: string
  address: string
  open_until: string | null
}

export interface Redemption {
  id: string
  reward_id: string
  shop: string
  title: string
  cost: number
  code: string
  created_at: string
}

export interface Notice {
  id: string
  title: string
  body: string
  created_at: string
}

export type ModAction = 'verify' | 'reject' | 'reject_fake' | 'set_status'
