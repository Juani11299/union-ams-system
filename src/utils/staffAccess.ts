/**
 * Soft-RBAC vía "Modo Staff" (Fase 23) — cuando un link escopeado
 * (`?category=<uuid>&locked=true`, Fase 19) fija `categoryLocked=true` en el
 * store, el asistente que lo abrió queda restringido a un allowlist chico de
 * rutas dentro de `MainLayout`. Todo lo demás (Administración, Metodología,
 * y cualquier ruta futura que se agregue sin tocar este archivo) queda
 * bloqueado por defecto — allowlist, no blocklist, a propósito.
 *
 * No es seguridad real de backend (Supabase sigue aceptando todo con la key
 * anon): es una barrera de UX para que un profe de categoría no termine, por
 * error o curiosidad, editando Administración desde un link pensado sólo
 * para cargar su microciclo.
 */
const PREFIJOS_PERMITIDOS_STAFF = ['/planificador']

export function rutaPermitidaParaStaff(pathname: string): boolean {
  if (pathname === '/') return true
  return PREFIJOS_PERMITIDOS_STAFF.some(
    (prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`),
  )
}
