import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface InfoTooltipProps {
  titulo: string
  descripcion: string
  cita?: string
  className?: string
  /** Ícono del disparador (por defecto ℹ️) — ej. "🩹" para un indicador de dolor. */
  icono?: string
}

/** Ícono con popover explicativo (hover en desktop, tap en mobile). */
export function InfoTooltip({ titulo, descripcion, cita, className = '', icono = 'ℹ️' }: InfoTooltipProps) {
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const visible = hover || pinned
  const ref = useRef<HTMLSpanElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [desplazamiento, setDesplazamiento] = useState(0)

  useEffect(() => {
    if (!pinned) return
    function onClickFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setPinned(false)
    }
    document.addEventListener('mousedown', onClickFuera)
    return () => document.removeEventListener('mousedown', onClickFuera)
  }, [pinned])

  useLayoutEffect(() => {
    if (!visible || !popoverRef.current) return
    const rect = popoverRef.current.getBoundingClientRect()
    const margen = 8
    let ajuste = 0
    if (rect.right > window.innerWidth - margen) ajuste = window.innerWidth - margen - rect.right
    if (rect.left + ajuste < margen) ajuste = margen - rect.left
    setDesplazamiento(ajuste)
  }, [visible])

  return (
    <span ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          setPinned((v) => !v)
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none text-slate-400 outline-none transition-colors hover:text-sky-500 focus-visible:ring-2 focus-visible:ring-sky-400 dark:text-slate-500 dark:hover:text-sky-400"
        aria-label={`Info: ${titulo}`}
      >
        {icono}
      </button>
      {visible && (
        <div
          ref={popoverRef}
          role="tooltip"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{ transform: `translateX(calc(-50% + ${desplazamiento}px))` }}
          className="absolute left-1/2 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{titulo}</p>
          <p className="mt-1 text-[11px] leading-snug text-slate-600 dark:text-slate-300">{descripcion}</p>
          {cita && (
            <p className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] italic leading-snug text-slate-400 dark:border-slate-700 dark:text-slate-500">
              {cita}
            </p>
          )}
        </div>
      )}
    </span>
  )
}
