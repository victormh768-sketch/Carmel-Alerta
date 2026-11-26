import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import Icon from './Icon'

export default function Header() {
  const { user } = useApp()
  return (
    <header className="z-[1100] flex h-16 shrink-0 items-center justify-between gap-space-sm bg-surface/90 px-gutter shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <Link to="/" className="flex min-w-0 items-center gap-space-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
          <Icon name="location_on" fill className="!text-[22px]" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-headline-sm text-headline-sm leading-tight tracking-tight text-primary">CarmelAlerta</span>
          <span className="truncate font-label-sm text-label-sm leading-none text-on-surface-variant">El Carmel · Horta-Guinardó</span>
        </span>
      </Link>

      {user ? (
        <Link to="/perfil" className="flex shrink-0 items-center gap-space-sm" aria-label="El meu perfil">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-1">
            <Icon name="stars" fill className="!text-[16px] text-tertiary-container" />
            <span className="font-label-sm text-label-sm font-bold text-on-surface">
              {user.points} <span className="font-normal text-on-surface-variant">pts</span>
            </span>
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-label-lg text-label-lg uppercase text-on-secondary">
            {user.username[0]}
          </span>
        </Link>
      ) : (
        <Link to="/acces" className="rounded-full bg-secondary px-4 py-2 font-label-md text-label-md text-on-secondary">
          Entra
        </Link>
      )}
    </header>
  )
}
