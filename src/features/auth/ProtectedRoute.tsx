import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * Guardia de rutas administrativas (Fase 18) — envuelve sólo el grupo de
 * rutas de `MainLayout` en `App.tsx` (Dashboard, Planificador, Admin,
 * Metodología, etc). Las rutas públicas de jugador/kiosco (`/ingreso-rapido`,
 * `/terminal-fuerza`) NUNCA pasan por acá: ya están montadas como hermanas
 * de este grupo en `App.tsx`, fuera del `<Route element={<ProtectedRoute/>}>`
 * — es una exclusión estructural (imposible de romper por accidente
 * agregando un prefijo a una whitelist), no una lista de regex de rutas.
 *
 * Única excepción deliberada (Fase 32): `/planificador?...&locked=true` es
 * la MISMA ruta que su versión protegida, así que acá sí hace falta un
 * chequeo puntual de `pathname`+query — no hay forma de resolverlo con
 * exclusión estructural pura cuando es la misma URL la que tiene que
 * comportarse distinto según un parámetro. El bloqueo real de edición para
 * ese caso vive en `useSoloLectura` (visto por `PlanificadorView` y sus
 * hijos), no acá — este guard sólo decide si se puede ENTRAR sin sesión.
 */
export function ProtectedRoute() {
  const session = useAuthStore((s) => s.session)
  const isLoading = useAuthStore((s) => s.isLoading)
  const location = useLocation()

  const esPlanificadorPublico =
    location.pathname === '/planificador' &&
    new URLSearchParams(location.search).get('locked') === 'true'

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-union-red-600 dark:border-slate-700 dark:border-t-union-red-400" />
      </div>
    )
  }

  if (!session && !esPlanificadorPublico) return <Navigate to="/login" replace />

  return <Outlet />
}
