import { NavLink } from 'react-router-dom'
import { navItems } from './navConfig'
import { useAppStore } from '@/store/useAppStore'
import { rutaBloqueadaParaVisitante } from '@/utils/staffAccess'

export function BottomTabBar() {
  const categoryLocked = useAppStore((s) => s.categoryLocked)
  const soloLecturaGlobal = useAppStore((s) => s.soloLecturaGlobal)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex overflow-x-auto border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-slate-800 dark:bg-slate-900">
      {navItems.map((item) => {
        const bloqueado = rutaBloqueadaParaVisitante(item.to, categoryLocked, soloLecturaGlobal)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `relative flex min-w-[64px] flex-1 shrink-0 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                isActive
                  ? 'text-union-red-600 dark:text-union-red-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <span className="text-lg" aria-hidden>
              {item.icon}
            </span>
            {item.shortLabel}
            {bloqueado && (
              <span className="absolute right-2 top-1 text-[10px]" aria-label="Bloqueado en Modo Staff">
                🔒
              </span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
