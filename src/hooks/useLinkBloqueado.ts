import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'

/**
 * `true` si la sesión actual entró por un link mágico `locked=true` (Fase 19/35),
 * escopeado o global. Combina dos señales porque `?locked=true` sólo viaja en la
 * URL de entrada: apenas el visitante navega con el Sidebar el parámetro se
 * pierde, pero `categoryLocked`/`soloLecturaGlobal` (store, no persistidos)
 * siguen en `true`. En el primer render de una entrada fresca el store todavía
 * no procesó la URL, así que se lee también el parámetro directamente.
 *
 * Es la señal que usa el blindaje anti-extracción (`AntiLeakWrapper`) y que
 * oculta los botones de exportar / imprimir / descargar. Un login normal (sin
 * link) da `false`: ahí todo funciona como siempre.
 */
export function useLinkBloqueado(): boolean {
  const categoryLocked = useAppStore((s) => s.categoryLocked)
  const soloLecturaGlobal = useAppStore((s) => s.soloLecturaGlobal)
  const { search } = useLocation()
  return categoryLocked || soloLecturaGlobal || new URLSearchParams(search).get('locked') === 'true'
}
