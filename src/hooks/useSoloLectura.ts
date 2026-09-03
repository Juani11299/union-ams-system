import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * `true` si la vista actual debe comportarse como visor de sólo lectura
 * (Fase 32, ampliado en Fase 35): sin sesión de Staff real, O con
 * `?locked=true` en la URL — sea el link escopeado a una categoría
 * (`categoryLocked`) o el link "todo el club" (`soloLecturaGlobal`).
 * Cualquiera de las tres alcanza, da igual si el que abrió el link estaba
 * logueado o no.
 *
 * Nota: el bloqueo REAL de escritura ya no depende de que cada componente
 * llame a este hook — vive centralizado envolviendo las acciones del store
 * (ver el final de `useAppStore.ts`). Este hook sigue existiendo para las
 * vistas que quieren dar mejor UX ocultando botones en vez de dejarlos
 * fallar al tocarlos (`DashboardEquipo`, `PlanificadorView`).
 *
 * Reemplaza el propósito original del "Modo Staff" de Fase 19/23
 * (`categoryLocked`), que dejaba a un asistente LOGUEADO editar el
 * Planificador acotado a su categoría vía un link `locked=true`. Ahora que
 * existe login real (Fase 18), ese caso de uso (Staff que necesita editar)
 * lo cubre entrar con su cuenta — `locked=true` pasó a significar
 * exclusivamente "link público de sólo lectura para compartir", sin
 * excepción para quien ya esté logueado.
 */
export function useSoloLectura(): boolean {
  const session = useAuthStore((s) => s.session)
  const categoryLocked = useAppStore((s) => s.categoryLocked)
  const soloLecturaGlobal = useAppStore((s) => s.soloLecturaGlobal)
  return !session || categoryLocked || soloLecturaGlobal
}
