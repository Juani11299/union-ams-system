import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'

/**
 * Guardia de rutas administrativas (Fase 18) — envuelve sólo el grupo de
 * rutas de `MainLayout` en `App.tsx` (Dashboard, Planificador, Admin,
 * Metodología, etc). Las rutas públicas de jugador/kiosco (`/ingreso-rapido`,
 * `/terminal-fuerza`) NUNCA pasan por acá: ya están montadas como hermanas
 * de este grupo en `App.tsx`, fuera del `<Route element={<ProtectedRoute/>}>`
 * — es una exclusión estructural (imposible de romper por accidente
 * agregando un prefijo a una whitelist), no una lista de regex de rutas.
 *
 * Excepción deliberada para links mágicos con `locked=true` (Fase 32/33) —
 * dos señales, porque hay un problema de orden de arranque real:
 *
 * 1. `esEntradaPublicaPorUrl`: lee `locked=true` DIRECTO de la URL actual,
 *    sólo para `/` o `/planificador`. Hace falta este chequeo puntual (no
 *    sólo el flag del store de abajo) porque `categoryLocked` recién se fija
 *    dentro de `useScopedCategoryFromUrl` — un hook que sólo corre una vez
 *    que `MainLayout` ya montó. En el primerísimo render de una entrada
 *    fresca por link (`/?category=X&locked=true`), el store todavía no
 *    procesó la URL — sin este chequeo directo quedaría en un bucle: no se
 *    puede entrar a `MainLayout` para fijar el flag, porque hace falta el
 *    flag para entrar a `MainLayout`.
 * 2. `categoryLocked` (store, persistido): una vez que la señal de arriba ya
 *    lo fijó en `true`, sigue valiendo aunque el visitante navegue
 *    DESPUÉS a otra ruta sin `locked=true` en su propia URL (ej. clickea
 *    "Administración" en el Sidebar) — así llega hasta `MainLayout`, que es
 *    quien de verdad decide qué se ve: `rutaPermitidaParaStaff` (ver
 *    `staffAccess.ts`) muestra `LockedModuleView` para todo lo que no sea
 *    `/`/`/planificador`, en vez de cortar acá con un redirect a `/login`
 *    que sacaría al visitante de la app.
 *
 * El bloqueo real de EDICIÓN para este caso vive en `useSoloLectura` (visto
 * por `DashboardEquipo`, `PlanificadorView` y sus hijos) — este guard sólo
 * decide si se puede ENTRAR sin sesión.
 */
export function ProtectedRoute() {
  const session = useAuthStore((s) => s.session)
  const isLoading = useAuthStore((s) => s.isLoading)
  const categoryLocked = useAppStore((s) => s.categoryLocked)
  const location = useLocation()

  const esEntradaPublicaPorUrl =
    new URLSearchParams(location.search).get('locked') === 'true' &&
    (location.pathname === '/' || location.pathname.startsWith('/planificador'))

  const esLinkMagicoStaff = categoryLocked || esEntradaPublicaPorUrl

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-union-red-600 dark:border-slate-700 dark:border-t-union-red-400" />
      </div>
    )
  }

  if (!session && !esLinkMagicoStaff) return <Navigate to="/login" replace />

  return <Outlet />
}
