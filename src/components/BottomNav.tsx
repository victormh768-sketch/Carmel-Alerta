import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import { NAV_TABS as tabs } from './navTabs'

export default function BottomNav() {
  return (
    <nav
      aria-label="Navegació principal"
      className="z-[1100] flex shrink-0 items-end lg:hidden justify-around border-t border-outline-variant/30 bg-surface-container-lowest px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_16px_rgba(27,59,111,0.06)]"
    >
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `flex min-h-12 min-w-16 flex-1 flex-col items-center justify-end gap-0.5 font-label-sm text-label-sm ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {t.center ? (
                <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-[0_8px_24px_-4px_rgba(211,82,48,0.4)] ring-4 ring-surface-container-lowest">
                  <Icon name={t.icon} fill />
                </span>
              ) : (
                <Icon name={t.icon} fill={isActive} />
              )}
              <span>{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
