import { Link, NavLink } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import Icon from './Icon'
import { NAV_TABS } from './navTabs'

export default function Header() {
  const { user } = useApp()
  return (
    <header className="z-[1100] flex h-16 shrink-0 items-center justify-between gap-space-sm bg-surface/90 px-gutter shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:px-8">
      <Link to="/" className="flex min-w-0 items-center gap-space-sm lg:w-64">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
          <Icon name="location_on" fill className="!text-[22px]" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-headline-sm text-headline-sm leading-tight tracking-tight text-primary">CarmelAlerta</span>
          <span className="truncate font-label-sm text-label-sm leading-none text-on-surface-variant">El Carmel · Horta-Guinardó</span>
        </span>
      </Link>

      <nav aria-label="Navegació principal" className="hidden items-center gap-1 lg:flex">
        {NAV_TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex h-10 items-center gap-2 rounded-full px-4 font-label-lg text-label-lg transition-colors ${
                t.center
                  ? 'bg-primary text-on-primary hover:bg-[#b83e1e]'
                  : isActive
                    ? 'bg-primary-fixed text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
              }`
            }
          >
            <Icon name={t.icon} fill={t.center} className="!text-[20px]" />
            {t.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex shrink-0 justify-end lg:w-64">
        {user ? (
          <Link to="/perfil" className="flex items-center gap-space-sm" aria-label="El meu perfil">
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
      </div>
    </header>
  )
}
