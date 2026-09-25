import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  titulo: string
  subtitulo?: string
  onBack: () => void
  backLabel?: string
  /** Acciones a la derecha de la barra superior (botones extra). */
  acciones?: ReactNode
  children: ReactNode
}

/**
 * Layout inmersivo compartido (CMJ, tests dinámicos, Perfil 360°): un portal
 * sobre `document.body` que tapa el layout de la app (`fixed inset-0 z-50`),
 * con el botón "⬅ Volver al Hub" arriba a la izquierda. Escape también cierra.
 * El dashboard de NordBord tiene su propia versión (CSS portado del HTML).
 */
export function PantallaCompleta({ titulo, subtitulo, onBack, backLabel = '⬅ Volver al Hub', acciones, children }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onBack])

  return createPortal(
    <div className="fixed inset-0 z-50 h-screen w-screen overflow-y-auto bg-slate-50 dark:bg-slate-950" role="dialog" aria-label={titulo}>
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-union-red-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-union-red-500 dark:hover:text-white"
        >
          {backLabel}
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{titulo}</h1>
          {subtitulo && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitulo}</p>}
        </div>
        {acciones && <div className="ml-auto flex flex-wrap items-center gap-2">{acciones}</div>}
      </header>
      <div className="mx-auto max-w-[1480px] p-4 pb-12">{children}</div>
    </div>,
    document.body,
  )
}
