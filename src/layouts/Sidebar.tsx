import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { navItems, type NavItem } from './navConfig'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { ClubLogo } from '@/components/ClubLogo'
import { rutaBloqueadaParaVisitante } from '@/utils/staffAccess'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-union-red-50 text-union-red-700 dark:bg-union-red-500/10 dark:text-union-red-400'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

/** Candado (Fase 23) al lado de los links bloqueados en "Modo Staff" — no se ocultan, sólo se marcan. */
function CandadoStaff() {
  return (
    <span className="ml-auto text-xs" aria-label="Bloqueado en Modo Staff" title="Bloqueado en Modo Staff">
      🔒
    </span>
  )
}

export function Sidebar() {
  const club = useAppStore((s) => s.club)
  const categoryLocked = useAppStore((s) => s.categoryLocked)
  const soloLecturaGlobal = useAppStore((s) => s.soloLecturaGlobal)
  const signOut = useAuthStore((s) => s.signOut)
  const gruposRenderizados = new Set<string>()

  return (
    <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-slate-200 md:bg-white md:dark:border-slate-800 md:dark:bg-slate-900">
      <div className="flex items-center px-5 py-6">
        <ClubLogo logoUrl={club?.logo_url} size="lg" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          if (item.group) {
            if (gruposRenderizados.has(item.group)) return null
            gruposRenderizados.add(item.group)
            const itemsDelGrupo = navItems.filter((i) => i.group === item.group)
            return (
              <NavGroup
                key={item.group}
                titulo={item.group}
                items={itemsDelGrupo}
                categoryLocked={categoryLocked}
                soloLecturaGlobal={soloLecturaGlobal}
              />
            )
          }

          const bloqueado = rutaBloqueadaParaVisitante(item.to, categoryLocked, soloLecturaGlobal)
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
              <span aria-hidden>{item.icon}</span>
              {item.label}
              {bloqueado && <CandadoStaff />}
            </NavLink>
          )
        })}
      </nav>
      <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-800">
        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <span aria-hidden>🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

/** Submenú desplegable del Sidebar (ej. "Estructura de Trabajo") — se abre solo si contiene la ruta activa. */
function NavGroup({
  titulo,
  items,
  categoryLocked,
  soloLecturaGlobal,
}: {
  titulo: string
  items: NavItem[]
  categoryLocked: boolean
  soloLecturaGlobal: boolean
}) {
  const location = useLocation()
  const contieneActivo = items.some((item) => item.to === location.pathname)
  const [abierto, setAbierto] = useState(contieneActivo)
  const grupoBloqueado = items.every((item) => rutaBloqueadaParaVisitante(item.to, categoryLocked, soloLecturaGlobal))

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          contieneActivo
            ? 'text-union-red-700 dark:text-union-red-400'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
      >
        <span className="flex items-center gap-3">
          <span aria-hidden>🗂️</span>
          {titulo}
        </span>
        <span className="flex items-center gap-1.5">
          {grupoBloqueado && <CandadoStaff />}
          <span aria-hidden className={`text-[10px] transition-transform ${abierto ? 'rotate-90' : ''}`}>
            ▶
          </span>
        </span>
      </button>

      {abierto && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-slate-200 pl-3 dark:border-slate-700">
          {items.map((item) => {
            const bloqueado = rutaBloqueadaParaVisitante(item.to, categoryLocked, soloLecturaGlobal)
            return (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                <span aria-hidden>{item.icon}</span>
                {item.label}
                {bloqueado && <CandadoStaff />}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}
