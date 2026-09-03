/**
 * Constructores de "links mágicos" (Fase 9/17/22) — URLs públicas que el
 * profe comparte por WhatsApp para que cada jugador cargue sus datos sin
 * login. Centralizados acá porque tanto el modal "Ingresar Datos"
 * (`IngresoModal.tsx`, para la categoría actualmente activa) como el panel
 * de Administración (`CategoriesTab.tsx`, para cualquier categoría del club)
 * necesitan generar exactamente el mismo formato de URL.
 */

/** Wellness (inicio del día) — ver `MagicLinkView.tsx`. */
export function construirLinkWellness(seasonId: string, categoryId: string): string {
  return `${window.location.origin}/ingreso-rapido?type=wellness&season=${seasonId}&category=${categoryId}`
}

/** RPE (fin de la sesión) — ver `MagicLinkView.tsx`. */
export function construirLinkRpe(seasonId: string, categoryId: string): string {
  return `${window.location.origin}/ingreso-rapido?type=rpe&season=${seasonId}&category=${categoryId}`
}

/** Terminal de Fuerza (registro táctil de carga externa) — ver `TerminalFuerzaView.tsx`. */
export function construirLinkTerminalFuerza(categoryId: string): string {
  return `${window.location.origin}/terminal-fuerza?category=${categoryId}&locked=true`
}

/**
 * "Link de sólo lectura, todo el club" (Fase 35) — a diferencia de
 * `construirLinkStaff` en `CategoriesTab.tsx` (escopeado a UNA categoría, y
 * restringido a Dashboard/Planificador), este `?locked=true` SIN `category`
 * habilita ver cualquier categoría y navegar a casi toda la app — bloquea
 * sólo Administración y Ficha Médica (ver `staffAccess.ts`). Quien lo abre
 * nunca puede crear, editar ni borrar nada, esté logueado o no.
 */
export function construirLinkSoloLecturaGlobal(): string {
  return `${window.location.origin}/?locked=true`
}

export async function copiarLinkMagico(
  url: string,
  showToast: (t: 'success' | 'error', m: string) => void,
  mensajeExito = 'Copiado al portapapeles',
): Promise<void> {
  try {
    await navigator.clipboard.writeText(url)
    showToast('success', mensajeExito)
  } catch {
    showToast('error', `No se pudo copiar el link. Copialo manualmente: ${url}`)
  }
}
