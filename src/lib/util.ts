export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function timeAgo(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'ara mateix'
  if (m < 60) return `fa ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `fa ${h} h`
  const d = Math.round(h / 24)
  if (d < 30) return `fa ${d} d`
  return new Date(iso).toLocaleDateString('ca-ES')
}

export function incidentTitle(description: string, fallback: string): string {
  const t = description.trim()
  if (!t) return fallback
  const first = t.split(/[.\n]/)[0].trim()
  return first.length > 70 ? first.slice(0, 67) + '…' : first
}
