import { Link } from 'react-router-dom'

interface LockedModuleViewProps {
  /** Fase 35 — cuál de los dos links de sólo lectura está activo, para mostrar un mensaje que tenga sentido para cada caso ("pedí acceso de Staff" no aplica a un visitante externo con el link de todo el club). Por defecto `'staff'`, el caso histórico. */
  modo?: 'staff' | 'soloLecturaGlobal'
}

const COPY = {
  staff: {
    titulo: 'Módulo Restringido',
    mensaje:
      'Estás navegando en el Modo Staff. Para visualizar o editar esta sección, debes solicitar acceso de Administrador al Director de Rendimiento (Mg. Juan Ignacio Robles).',
  },
  soloLecturaGlobal: {
    titulo: 'Sección no disponible en este link',
    mensaje:
      'Este link de sólo lectura no incluye Administración ni Ficha Médica — son datos de gestión o sensibles del club. El resto de la app sí está disponible para ver.',
  },
} as const

/**
 * "Módulo Restringido" (Fase 23, Soft-RBAC; ampliado en Fase 35) — se
 * renderiza en el área de contenido de `MainLayout` en vez de la vista real
 * cuando el visitante está en cualquiera de los dos modos de link de sólo
 * lectura (`categoryLocked` o `soloLecturaGlobal`, ver
 * `useScopedCategoryFromUrl`) y la ruta actual está bloqueada para ese modo
 * (`rutaBloqueadaParaVisitante`, ver `staffAccess.ts`). La navegación del
 * Sidebar/BottomTabBar no se intercepta a propósito — el click SÍ cambia la
 * URL (el usuario ve que el botón "existe" y funciona), lo único que
 * cambia es qué se dibuja en `<main>`.
 */
export function LockedModuleView({ modo = 'staff' }: LockedModuleViewProps) {
  const { titulo, mensaje } = COPY[modo]
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 rounded-2xl bg-union-charcoal px-6 py-16 text-center text-white">
      <span className="text-6xl" aria-hidden>
        🔒
      </span>
      <div>
        <h1 className="text-xl font-bold">{titulo}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/70">{mensaje}</p>
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
