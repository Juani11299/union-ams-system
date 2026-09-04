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

function rutaPermitidaParaStaff(pathname: string): boolean {
  if (pathname === '/') return true
  return PREFIJOS_PERMITIDOS_STAFF.some(
    (prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`),
  )
}

/**
 * Fase 35 — "Link de sólo lectura, todo el club". A diferencia del Modo
 * Staff de arriba (allowlist chico, pensado para un asistente acotado a UNA
 * categoría), acá el criterio se invierte a BLOCKLIST: se abre TODO el
 * árbol de `MainLayout` salvo Administración (gestión de usuarios/
 * categorías/temporadas del club) y Ficha Médica (datos sensibles de
 * jugadores) — decisión explícita del club sobre qué compartir ampliamente,
 * no un default técnico.
 */
const PREFIJOS_BLOQUEADOS_SOLO_LECTURA_GLOBAL = ['/admin', '/medical']

/**
 * Fase 35.1 — el club pidió ocultar del link de sólo lectura el Manual
 * General de Área de Fuerza y la Escuela de Movimiento (Isometría), y con
 * ellos la Biblioteca de Manuales (el índice, que linkea a los dos) —
 * dejando visibles ÚNICAMENTE los 4 tomos LTAD (uno por categoría). A
 * diferencia de `/admin`/`/medical` de arriba, acá NO alcanza con bloquear
 * por prefijo: `/metodologia/ltad-*` cuelga del mismo prefijo
 * `/metodologia` y tiene que seguir visible, así que estas 3 son rutas
 * EXACTAS, no prefijos.
 */
const RUTAS_EXACTAS_BLOQUEADAS_SOLO_LECTURA_GLOBAL = [
  '/metodologia',
  '/metodologia/manual-fuerza',
  '/metodologia/isometria',
]

function rutaPermitidaParaSoloLecturaGlobal(pathname: string): boolean {
  if (RUTAS_EXACTAS_BLOQUEADAS_SOLO_LECTURA_GLOBAL.includes(pathname)) return false
  return !PREFIJOS_BLOQUEADOS_SOLO_LECTURA_GLOBAL.some(
    (prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`),
  )
}

/**
 * Punto único de decisión para los 3 lugares (`MainLayout`, `Sidebar`,
 * `BottomTabBar`) que necesitan saber si una ruta está bloqueada para el
 * visitante actual — evita que cada uno arme su propio if/else de cuál de
 * los dos modos manda cuando, en teoría, podrían estar los dos flags en
 * `true` a la vez (no debería pasar en la práctica, pero así no depende de
 * en qué orden se chequeen).
 */
export function rutaBloqueadaParaVisitante(
  pathname: string,
  categoryLocked: boolean,
  soloLecturaGlobal: boolean,
): boolean {
  if (categoryLocked) return !rutaPermitidaParaStaff(pathname)
  if (soloLecturaGlobal) return !rutaPermitidaParaSoloLecturaGlobal(pathname)
  return false
}
