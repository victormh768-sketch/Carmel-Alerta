import { catById, STATUS } from '../lib/categories'
import { formatDistance } from '../lib/geo'
import { incidentTitle, timeAgo } from '../lib/util'
import { POINTS } from '../data/api'
import type { Incident, Status } from '../types'
import Icon from './Icon'
import StatusBadge from './StatusBadge'

const STEPS: { s: Status; label: string }[] = [
  { s: 'verified', label: 'Verificada' },
  { s: 'communicated', label: 'Ajuntament' },
  { s: 'in_progress', label: 'En procés' },
  { s: 'solved', label: 'Solucionada' },
]

interface Props {
  incident: Incident
  distance: number | null
  isMine: boolean
  loggedIn: boolean
  onClose: () => void
  onSupport: () => void
  onShare: () => void
}

export default function IncidentSheet({ incident: i, distance, isMine, loggedIn, onClose, onSupport, onShare }: Props) {
  const cat = catById(i.category)
  const stepIdx = STEPS.findIndex((x) => x.s === i.status)
  const canSupport = ['verified', 'communicated', 'in_progress'].includes(i.status)

  let supportLabel = `Donar suport (+${POINTS.support} pts)`
  let disabled = false
  if (!loggedIn) supportLabel = 'Entra per donar suport'
  else if (isMine) { supportLabel = 'És la teva incidència'; disabled = true }
  else if (i.supported_by_me) { supportLabel = 'Ja has donat suport'; disabled = true }

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1000] max-h-[66%] overflow-y-auto rounded-t-2xl border-t border-white bg-surface-container-lowest p-4 shadow-[0_-4px_32px_rgba(27,59,111,0.14)]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-label-sm uppercase text-on-surface">
          <Icon name={cat.icon} fill className={`!text-[14px] ${cat.chipIcon}`} />
          {cat.short}
        </span>
        <StatusBadge status={i.status} short />
        {distance !== null && (
          <span className="ml-auto inline-flex items-center gap-1 font-caption text-caption text-primary">
            <Icon name="near_me" className="!text-[14px]" />
            {formatDistance(distance)}
          </span>
        )}
        <button onClick={onClose} aria-label="Tanca" className={`${distance === null ? 'ml-auto' : ''} -mr-2 flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant`}>
          <Icon name="close" />
        </button>
      </div>

      <h2 className="font-headline-md text-headline-md">{incidentTitle(i.description, cat.label)}</h2>
      <p className="mt-1 flex items-center gap-1.5 text-body-md text-on-surface-variant">
        <Icon name="location_on" className="!text-[18px] text-primary" />
        {i.address || 'Ubicació al mapa'}
      </p>

      <div className="mt-3 flex gap-3 rounded-lg bg-surface-container-low p-3">
        {i.photo_url ? (
          <img src={i.photo_url} alt="Foto de la incidència" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
            <Icon name={cat.icon} fill className={`!text-[28px] ${cat.chipIcon}`} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Estat de resolució</p>
          <p className="font-body-md text-body-md font-semibold">{STATUS[i.status].detail}</p>
          <p className="mt-0.5 flex items-center gap-1 font-caption text-caption text-on-surface-variant">
            <Icon name="groups" className="!text-[14px]" />
            {i.supports === 1 ? '1 veí ha donat suport' : `${i.supports} veïns han donat suport`} · {timeAgo(i.created_at)}
          </p>
        </div>
      </div>

      {i.status === 'rejected' && i.reject_reason && (
        <p className="mt-2 rounded-lg bg-error-container p-3 text-body-sm text-on-error-container">Motiu: {i.reject_reason}</p>
      )}

      {stepIdx >= 0 && (
        <ol className="mt-3 flex items-start" aria-label="Seguiment">
          {STEPS.map((st, n) => (
            <li key={st.s} className="relative flex flex-1 flex-col items-center gap-1">
              {n > 0 && <span className={`absolute right-1/2 top-[7px] h-0.5 w-full ${n <= stepIdx ? 'bg-green-600' : 'bg-outline-variant'}`} />}
              <span className={`relative z-10 h-4 w-4 rounded-full border-2 ${n <= stepIdx ? 'border-green-600 bg-green-600' : 'border-outline-variant bg-white'}`} />
              <span className={`text-center font-caption text-caption ${n <= stepIdx ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>{st.label}</span>
            </li>
          ))}
        </ol>
      )}

      {i.description && i.description.length > 70 && (
        <p className="mt-3 text-body-md text-on-surface-variant">{i.description}</p>
      )}

      <div className="mt-4 flex gap-2">
        {canSupport && (
          <button
            onClick={onSupport}
            disabled={disabled}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary font-label-lg text-label-lg text-on-primary shadow-[0_8px_24px_-4px_rgba(211,82,48,0.16)] active:bg-[#b83e1e] disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none"
          >
            <Icon name="thumb_up" />
            {supportLabel}
          </button>
        )}
        <button onClick={onShare} aria-label="Comparteix" className={`flex h-12 items-center justify-center rounded-lg bg-secondary-fixed text-secondary ${canSupport ? 'w-12' : 'flex-1 gap-2 font-label-lg text-label-lg'}`}>
          <Icon name="share" />
          {!canSupport && 'Comparteix'}
        </button>
      </div>
    </div>
  )
}
