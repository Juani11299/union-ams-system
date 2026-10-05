import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useLinkBloqueado } from '@/hooks/useLinkBloqueado'

/**
 * Rutas donde el link bloqueado además impide imprimir / "Guardar como PDF"
 * (Evaluaciones y Estructura de Trabajo). En el resto (ej. Planificador) el
 * link sigue pudiendo imprimir como antes.
 */
const PREFIJOS_SIN_IMPRESION = ['/evaluaciones', '/metodologia']
const enPrefijo = (pathname: string, prefijo: string) => pathname === prefijo || pathname.startsWith(`${prefijo}/`)

/**
 * Blindaje "anti-extracción" para quien entra por un link `locked=true`
 * (Fase 49). Sin marcas de agua: la interfaz queda limpia. Sólo actúa cuando
 * `useLinkBloqueado()` es `true`; con un login normal no cambia nada.
 *
 * - Contenedor (`display: contents`, no altera el layout): `select-none`,
 *   imágenes sin arrastre ni `pointer-events`, `onContextMenu` bloqueado.
 *   Los inputs/textarea siguen siendo seleccionables y editables (buscadores).
 * - Portales: `PantallaCompleta` y otros renderizan sobre `document.body`, fuera
 *   de este contenedor. Por eso, mientras está activo, el efecto marca el
 *   `<html>` con `data-anti-leak` (reglas en `index.css`) y registra los mismos
 *   bloqueos (clic derecho, arrastre, copiar/cortar, Ctrl/⌘+S, Ctrl/⌘+P) a nivel
 *   `document`.
 * - Videos: sin botón de descarga ni picture-in-picture.
 *
 * Límite real: es una barrera de UX en el navegador, no seguridad de datos.
 * Quien abra las herramientas de desarrollo o consulte la API con la key anon
 * puede leer lo que ya llegó al navegador.
 */
export function AntiLeakWrapper({ children }: { children: ReactNode }) {
  const bloqueado = useLinkBloqueado()
  const { pathname } = useLocation()
  const sinImpresion = PREFIJOS_SIN_IMPRESION.some((p) => enPrefijo(pathname, p))

  useEffect(() => {
    if (!bloqueado) return
    const root = document.documentElement
    root.dataset.antiLeak = 'true'
    if (sinImpresion) root.dataset.antiLeakPrint = 'true'
    else delete root.dataset.antiLeakPrint

    const esCampoDeTexto = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest('input, textarea, [contenteditable="true"]')
    const bloquear = (e: Event) => e.preventDefault()
    const bloquearSalvoTexto = (e: Event) => {
      if (!esCampoDeTexto(e.target)) e.preventDefault()
    }
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 's' || (k === 'p' && sinImpresion)) e.preventDefault()
    }
    const protegerVideos = (raiz: ParentNode) => {
      raiz.querySelectorAll('video').forEach((v) => {
        v.setAttribute('controlsList', 'nodownload noremoteplayback')
        v.disablePictureInPicture = true
      })
    }
    protegerVideos(document)
    const observer = new MutationObserver(() => protegerVideos(document))
    observer.observe(document.body, { childList: true, subtree: true })

    document.addEventListener('contextmenu', bloquear)
    document.addEventListener('dragstart', bloquear)
    document.addEventListener('copy', bloquearSalvoTexto)
    document.addEventListener('cut', bloquearSalvoTexto)
    document.addEventListener('keydown', onKey)
    return () => {
      observer.disconnect()
      document.removeEventListener('contextmenu', bloquear)
      document.removeEventListener('dragstart', bloquear)
      document.removeEventListener('copy', bloquearSalvoTexto)
      document.removeEventListener('cut', bloquearSalvoTexto)
      document.removeEventListener('keydown', onKey)
      delete root.dataset.antiLeak
      delete root.dataset.antiLeakPrint
    }
  }, [bloqueado, sinImpresion])

  const clasesBloqueo = bloqueado
    ? `select-none [-webkit-touch-callout:none] [&_img]:pointer-events-none [&_img]:[-webkit-user-drag:none] [&_input]:select-text [&_textarea]:select-text ${sinImpresion ? 'print:hidden' : ''}`
    : ''

  return (
    <div className={`contents ${clasesBloqueo}`} onContextMenu={bloqueado ? (e) => e.preventDefault() : undefined}>
      {children}
    </div>
  )
}
