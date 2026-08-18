import { Link } from 'react-router-dom'

/**
 * "Módulo Restringido" (Fase 23, Soft-RBAC) — se renderiza en el área de
 * contenido de `MainLayout` en vez de la vista real cuando el store está en
 * "Modo Staff" (`categoryLocked`, ver `useScopedCategoryFromUrl`) y la ruta
 * actual no está en el allowlist de `rutaPermitidaParaStaff`. La navegación
 * del Sidebar/BottomTabBar no se intercepta a propósito — el click SÍ
 * cambia la URL (el usuario ve que el botón "existe" y funciona), lo único
 * que cambia es qué se dibuja en `<main>`.
 */
export function LockedModuleView() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 rounded-2xl bg-union-charcoal px-6 py-16 text-center text-white">
      <span className="text-6xl" aria-hidden>
        🔒
      </span>
      <div>
        <h1 className="text-xl font-bold">Módulo Restringido</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/70">
          Estás navegando en el Modo Staff. Para visualizar o editar esta sección, debes solicitar
          acceso de Administrador al Director de Rendimiento (Mg. Juan Ignacio Robles).
        </p>
      </div>
      <Link
        to="/"
        className="rounded-xl bg-union-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-union-red-700"
      >
        Volver al Dashboard
      </Link>
    </div>
  )
}
