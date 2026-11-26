import { Outlet } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import Header from './Header'
import BottomNav from './BottomNav'

export default function Layout() {
  const { api, toastMsg } = useApp()
  return (
    <div className="relative mx-auto flex h-full max-w-[480px] flex-col bg-surface shadow-[0_0_40px_rgba(27,59,111,0.14)]">
      <Header />
      {api.mode === 'local' && (
        <div className="z-[1100] shrink-0 bg-tertiary-fixed px-gutter py-1 text-center font-label-sm text-label-sm text-on-tertiary-fixed-variant">
          Mode demostració · les dades es guarden només en aquest dispositiu
        </div>
      )}
      <main className="relative min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
      {toastMsg && (
        <div
          role="status"
          className="absolute inset-x-4 bottom-24 z-[2000] rounded-xl bg-inverse-surface px-4 py-3 text-center font-body-md text-body-md text-inverse-on-surface shadow-lg"
        >
          {toastMsg}
        </div>
      )}
    </div>
  )
}
