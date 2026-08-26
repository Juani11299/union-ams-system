import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * Guardia de rutas administrativas (Fase 18) — envuelve sólo el grupo de
 * rutas de `MainLayout` en `App.tsx` (Dashboard, Planificador, Admin,
 * Metodología, etc). Las rutas públicas de jugador/kiosco (`/ingreso-rapido`,
 * `/terminal-fuerza`) NUNCA pasan por acá: ya están montadas como hermanas
 * de este grupo en `App.tsx`, fuera del `<Route element={<ProtectedRoute/>}>`
 * — es una exclusión estructural (imposible de romper por accidente
 * agregando un prefijo a una whitelist), no una lista de regex de rutas.
 */
export function ProtectedRoute() {
  const session = useAuthStore((s) => s.session)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-union-red-600 dark:border-slate-700 dark:border-t-union-red-400" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
