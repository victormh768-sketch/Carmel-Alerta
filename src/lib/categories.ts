import type { CategoryId, Status } from '../types'

export interface CategoryDef {
  id: CategoryId
  label: string
  short: string
  icon: string
  /** clases completas (Tailwind las detecta en el código fuente) */
  pin: string
  ring: string
  chipIcon: string
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'neteja', label: 'Neteja i residus', short: 'Neteja', icon: 'delete', pin: 'bg-tertiary text-on-tertiary', ring: 'ring-tertiary-fixed', chipIcon: 'text-tertiary-container' },
  { id: 'voreres', label: 'Voreres i desperfectes', short: 'Voreres', icon: 'construction', pin: 'bg-primary text-on-primary', ring: 'ring-primary-fixed', chipIcon: 'text-primary' },
  { id: 'enllumenat', label: 'Enllumenat públic', short: 'Enllumenat', icon: 'lightbulb', pin: 'bg-secondary text-on-secondary', ring: 'ring-secondary-fixed', chipIcon: 'text-secondary' },
  { id: 'mobiliari', label: 'Mobiliari urbà', short: 'Mobiliari', icon: 'chair', pin: 'bg-inverse-surface text-inverse-on-surface', ring: 'ring-surface-dim', chipIcon: 'text-on-surface-variant' },
  { id: 'barreres', label: 'Barreres arquitectòniques', short: 'Barreres', icon: 'accessible', pin: 'bg-secondary text-on-secondary', ring: 'ring-secondary-fixed', chipIcon: 'text-secondary' },
  { id: 'transit', label: 'Problemes de trànsit', short: 'Trànsit', icon: 'traffic', pin: 'bg-primary text-on-primary', ring: 'ring-primary-fixed', chipIcon: 'text-primary' },
  { id: 'obres', label: 'Obres i carrers tallats', short: 'Obres', icon: 'engineering', pin: 'bg-primary-container text-on-primary-container', ring: 'ring-primary-fixed', chipIcon: 'text-primary-container' },
  { id: 'verd', label: 'Zones verdes', short: 'Zones verdes', icon: 'park', pin: 'bg-green-600 text-white', ring: 'ring-green-100', chipIcon: 'text-green-600' },
]

export const catById = (id: CategoryId): CategoryDef =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]

export interface StatusDef { label: string; detail: string; cls: string; icon: string }

export const STATUS: Record<Status, StatusDef> = {
  pending: { label: 'Pendent de verificació', detail: 'Un moderador la revisarà aviat', cls: 'bg-amber-100 text-amber-700', icon: 'schedule' },
  verified: { label: 'Verificada', detail: "Verificada. Encara no comunicada a l'Ajuntament", cls: 'bg-green-100 text-green-700', icon: 'verified' },
  communicated: { label: "Comunicada a l'Ajuntament", detail: "Comunicada a l'Ajuntament", cls: 'bg-secondary-fixed text-on-secondary-fixed-variant', icon: 'send' },
  in_progress: { label: 'En procés de resolució', detail: 'En procés de resolució', cls: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', icon: 'engineering' },
  solved: { label: 'Solucionada', detail: 'Solucionada. Gràcies, veïns!', cls: 'bg-green-100 text-green-700', icon: 'task_alt' },
  rejected: { label: 'Rebutjada', detail: 'Rebutjada pel moderador', cls: 'bg-error-container text-on-error-container', icon: 'block' },
}

/** Estados visibles para todo el mundo */
export const PUBLIC_STATUSES: Status[] = ['verified', 'communicated', 'in_progress', 'solved']

export const LEVELS = [
  { n: 1, name: 'Veí nou', min: 0 },
  { n: 2, name: 'Veí atent', min: 100 },
  { n: 3, name: 'Veí actiu', min: 250 },
  { n: 4, name: 'Veí guardià', min: 400 },
  { n: 5, name: 'Ambaixador del Carmel', min: 700 },
]

export function levelInfo(lifetime: number) {
  let idx = 0
  LEVELS.forEach((l, i) => { if (lifetime >= l.min) idx = i })
  const current = LEVELS[idx]
  const next = LEVELS[idx + 1] ?? null
  const progress = next ? (lifetime - current.min) / (next.min - current.min) : 1
  return { current, next, remaining: next ? next.min - lifetime : 0, progress }
}
