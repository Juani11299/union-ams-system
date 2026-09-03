import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'

/**
 * Lee `?locked=true` de la URL (Fase 19, ampliado en Fase 35) y activa el
 * modo de sólo lectura correspondiente según venga o no acompañado de
 * `category`:
 *
 * - `?category=<uuid>&locked=true` — link ESCOPEADO (Fase 19): fija esa
 *   categoría como activa y bloquea el selector de categoría del TopBar,
 *   además de restringir la navegación a un allowlist chico de rutas (ver
 *   `staffAccess.ts`). Pensado para compartir el Planificador de UNA
 *   división puntual.
 * - `?locked=true` SOLO (sin `category`) — link GLOBAL (Fase 35, "Link de
 *   sólo lectura, todo el club"): no toca la categoría activa (el
 *   visitante puede cambiarla con el selector, ve cualquier división), y
 *   habilita navegar a casi todas las rutas — bloquea sólo Administración
 *   y Ficha Médica (`soloLecturaGlobal`, ver `staffAccess.ts`).
 *
 * En ambos casos, `categoryLocked`/`soloLecturaGlobal` son la señal que usa
 * `useSoloLectura` para forzar modo sólo lectura (además de
 * `ProtectedRoute`, que deja entrar sin sesión cuando cualquiera de los dos
 * está presente en la URL). Este hook lee la URL igual sin importar si hay
 * sesión de Supabase Auth o no — es justo esa independencia de la sesión la
 * que permite que el mismo link sirva para un visitante 100% anónimo.
 *
 * Sólo aplica al árbol de rutas montado bajo `MainLayout` (donde vive el
 * selector global de `activeCategoryId`); la Terminal de Fuerza es una ruta
 * standalone con su propio selector de categoría en estado local y lee estos
 * mismos parámetros por su cuenta, no a través de este hook.
 */
export function useScopedCategoryFromUrl() {
  const [searchParams] = useSearchParams()
  const setActiveCategoryLocked = useAppStore((s) => s.setActiveCategoryLocked)
  const setSoloLecturaGlobal = useAppStore((s) => s.setSoloLecturaGlobal)

  useEffect(() => {
    const categoryId = searchParams.get('category')
    const locked = searchParams.get('locked') === 'true'
    if (!locked) return

    const aplicar = () => {
      if (categoryId) setActiveCategoryLocked(categoryId)
      else setSoloLecturaGlobal()
    }

    // `activeCategoryId` está persistido en IndexedDB (Fase 18) y rehidrata
    // de forma ASÍNCRONA — si aplicáramos el link ya, la rehidratación puede
    // resolver después y pisarlo con la categoría de una sesión anterior
    // (bug real: un profe que recibe un link nuevo para otra categoría
    // terminaba viendo la vieja, marcada como "bloqueada" igual, sin ningún
    // indicio de que estaba en la categoría equivocada). Esperar a que
    // termine de rehidratar garantiza que la URL siempre gane.
    if (useAppStore.persist.hasHydrated()) {
      aplicar()
      return
    }
    return useAppStore.persist.onFinishHydration(aplicar)
    // Sólo nos importa la lectura inicial de la URL con la que se abrió el
    // link — no queremos volver a disparar esto en cada cambio de
    // searchParams que agregue otra parte de la app (por ejemplo, un filtro).
  }, [])
}
