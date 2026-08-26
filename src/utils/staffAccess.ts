/**
 * Soft-RBAC vía "Modo Staff" (Fase 23) — cuando un link escopeado
 * (`?category=<uuid>&locked=true`, Fase 19) fija `categoryLocked=true` en el
 * store, quien lo abrió queda restringido a un allowlist chico de rutas
 * dentro de `MainLayout`. Todo lo demás (Administración, Metodología, y
 * cualquier ruta futura que se agregue sin tocar este archivo) queda
 * bloqueado por defecto — allowlist, no blocklist, a propósito.
 *
 * Cambio de propósito en Fase 32: antes (Fase 19/23) este mecanismo existía
 * para que un asistente LOGUEADO pudiera editar el Planificador de su
 * categoría sin necesitar más permisos. Ahora que hay login real (Fase 18),
 * ese caso ya no pasa por acá — un link `locked=true` es siempre de sólo
 * lectura (ver `useSoloLectura`), esté o no logueado quien lo abre, y este
 * archivo sólo sigue restringiendo A QUÉ RUTA puede navegar, no si puede
 * editar dentro de ella. `ProtectedRoute` además deja pasar `/planificador`
 * sin sesión cuando `locked=true` está presente — por eso el mismo link le
 * sirve a un visitante 100% anónimo, no sólo a Staff logueado.
 *
 * No es seguridad real de backend (RLS sigue aceptando todo con la key
 * anon): es una barrera de UX/ruteo, no un control de acceso a datos.
 */
const PREFIJOS_PERMITIDOS_STAFF = ['/planificador']

export function rutaPermitidaParaStaff(pathname: string): boolean {
  if (pathname === '/') return true
  return PREFIJOS_PERMITIDOS_STAFF.some(
    (prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`),
  )
}
