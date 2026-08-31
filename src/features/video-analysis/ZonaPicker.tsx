import { ORDEN_BANDAS, ORDEN_CARRILES, BANDA_LABEL, CARRIL_LABEL, zonasIguales } from './videoAnalysisConstants'
import type { ZonaCancha } from '@/types'

interface ZonaPickerProps {
  value: ZonaCancha | null
  onChange: (zona: ZonaCancha) => void
  /** Zona sugerida por `sugerirContexto` — se resalta distinto de la elegida, así el profe ve qué propuso el sistema aunque haya tocado otra celda. */
  sugerida?: ZonaCancha | null
  className?: string
}

/**
 * Grilla 6x3 de Zonas de la Cancha (Fase 34.2, Paso 2) — reusada en el
 * Tagging en Vivo (elegir/confirmar zona) y como referencia visual de la
 * matriz. Compacta a propósito (celdas de ~28px) para no competir en
 * pantalla con el video ni los botones de evento.
 */
export function ZonaPicker({ value, onChange, sugerida = null, className = '' }: ZonaPickerProps) {
  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      {ORDEN_CARRILES.map((carril) => (
        <div key={carril} className="flex gap-0.5">
          {ORDEN_BANDAS.map((banda) => {
            const zona: ZonaCancha = { banda, carril }
            const esElegida = zonasIguales(value, zona)
            const esSugerida = !esElegida && zonasIguales(sugerida, zona)
            return (
              <button
                key={banda}
                type="button"
                onClick={() => onChange(zona)}
                title={`${BANDA_LABEL[banda]} · ${CARRIL_LABEL[carril]}`}
                className={`h-6 w-9 rounded-sm border text-[8px] transition-colors ${
                  esElegida
                    ? 'border-union-red-600 bg-union-red-600'
                    : esSugerida
                      ? 'border-union-red-300 bg-union-red-100 dark:bg-union-red-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
                }`}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
