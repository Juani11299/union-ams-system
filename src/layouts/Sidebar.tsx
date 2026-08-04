import { NavLink } from 'react-router-dom'
import { navItems } from './navConfig'
import { useAppStore } from '@/store/useAppStore'
import { ClubLogo } from '@/components/ClubLogo'

export function Sidebar() {
  const club = useAppStore((s) => s.club)

  return (
    <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-slate-200 md:bg-white md:dark:border-slate-800 md:dark:bg-slate-900">
      <div className="flex items-center px-5 py-6">
        <ClubLogo logoUrl={club?.logo_url} size="lg" />
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-union-red-50 text-union-red-700 dark:bg-union-red-500/10 dark:text-union-red-400'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
