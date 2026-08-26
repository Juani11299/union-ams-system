import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * `true` si la vista actual debe comportarse como visor de sólo lectura
 * (Fase 32): sin sesión de Staff real, O con `?locked=true` en la URL —
 * cualquiera de las dos alcanza, da igual si el que abrió el link estaba
 * logueado o no.
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
  return !session || categoryLocked
}
