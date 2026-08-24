import { useEffect, useState, type MouseEvent } from 'react'
import type { Presentation } from '@/data/presentations'

interface PresentationViewerProps {
  presentation: Presentation
  onClose: () => void
}

/**
 * Modo Presentación (Fase 30) — visor "estilo TED" a pantalla completa para
 * exponer un Manual Metodológico frente al cuerpo técnico: una diapositiva
 * por vez, título gigante + subtítulo de apoyo, sin viñetas ni texto largo.
 * Navegación por click (mitad izquierda/derecha de la pantalla) o flechas
 * de teclado — el manual en PDF sigue siendo el documento de referencia
 * completo, esto es sólo el resumen de alto impacto para la charla en vivo.
 */
export function PresentationViewer({ presentation, onClose }: PresentationViewerProps) {
  const [indice, setIndice] = useState(0)
  const total = presentation.slides.length
  const slide = presentation.slides[indice]

  function irAdelante() {
    setIndice((i) => Math.min(i + 1, total - 1))
  }

  function irAtras() {
    setIndice((i) => Math.max(i - 1, 0))
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') irAdelante()
      else if (e.key === 'ArrowLeft') irAtras()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [total, onClose])

  function handleClickPantalla(e: MouseEvent<HTMLDivElement>) {
    const ratio = e.clientX / window.innerWidth
    if (ratio < 0.5) irAtras()
    else irAdelante()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex h-screen w-screen cursor-pointer select-none flex-col items-center justify-center bg-union-charcoal text-white"
      onClick={handleClickPantalla}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-white/10">
        <div
          className="h-full bg-union-red-600 transition-all duration-300"
          style={{ width: `${((indice + 1) / total) * 100}%` }}
        />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Cerrar presentación"
        className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full text-xl text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        ✕
      </button>

      <div className="flex max-w-5xl flex-col items-center gap-6 px-6 text-center sm:px-16">
        <span className="h-1.5 w-16 rounded-full bg-union-red-600" aria-hidden />
        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl md:text-7xl">{slide.titulo}</h1>
        <p className="max-w-3xl text-lg text-slate-300 sm:text-2xl">{slide.subtitulo}</p>
      </div>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-widest text-slate-500">
        {indice + 1} / {total}
      </p>
    </div>
  )
}
