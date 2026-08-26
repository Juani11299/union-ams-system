import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'

/**
 * Lee `?category=<uuid>&locked=true` de la URL (Fase 19) y, si están
 * presentes, fija esa categoría como activa en el store global y bloquea el
 * selector de categoría del TopBar — así quien abre el link no puede, ni por
 * error, cambiarse a otra. Desde Fase 23 también determina el "Modo Staff"
 * (`categoryLocked`) que usa `MainLayout` para restringir rutas fuera del
 * allowlist — ver `staffAccess.ts`.
 *
 * Fase 32: `categoryLocked` ahora hace un segundo trabajo, más importante —
 * es la señal que usa `useSoloLectura` para forzar modo sólo lectura en el
 * Planificador (además de `ProtectedRoute`, que deja entrar sin sesión a
 * `/planificador?locked=true`). Este hook no cambió: sigue leyendo la URL
 * igual, sin importar si hay sesión de Supabase Auth o no — es justo esa
 * independencia de la sesión la que permite que el mismo link sirva para un
 * visitante 100% anónimo.
 *
 * Sólo aplica al árbol de rutas montado bajo `MainLayout` (donde vive el
 * selector global de `activeCategoryId`); la Terminal de Fuerza es una ruta
 * standalone con su propio selector de categoría en estado local y lee estos
 * mismos parámetros por su cuenta, no a través de este hook.
 */
export function useScopedCategoryFromUrl() {
  const [searchParams] = useSearchParams()
  const setActiveCategoryLocked = useAppStore((s) => s.setActiveCategoryLocked)

  useEffect(() => {
    const categoryId = searchParams.get('category')
    const locked = searchParams.get('locked') === 'true'
    if (!categoryId || !locked) return

    const aplicar = () => setActiveCategoryLocked(categoryId)

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
