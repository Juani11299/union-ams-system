import { Card } from '@/components/Card'

/**
 * Panel "Campo (GPS)" — preparado para cuando el club integre un dispositivo
 * GPS real (Catapult, STATSports, GPSports, etc.). Todavía no hay una fuente
 * de datos en vivo, así que las tarjetas muestran "—" en vez de un número
 * fabricado (mismo criterio que el período de gracia del ACWR: nunca un
 * valor inventado en lugar de "sin datos").
 */
const METRICAS_PLACEHOLDER = [
  { icono: '🏃', label: 'Distancia Total', unidad: 'm' },
  { icono: '⚡', label: 'HSR (Alta Velocidad)', unidad: 'm' },
  { icono: '💥', label: 'Aceleraciones', unidad: 'cant.' },
]

export function GpsPlaceholderTab() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-2 py-8 text-center">
        <span className="text-3xl">📡</span>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Preparado para GPS
        </h2>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          Todavía no hay un dispositivo GPS conectado a esta categoría. Cuando se integre,
          estas tarjetas van a mostrar el promedio del equipo por sesión.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {METRICAS_PLACEHOLDER.map((m) => (
          <Card key={m.label} className="flex flex-col items-center gap-1 py-6 text-center">
            <span className="text-2xl" aria-hidden>
              {m.icono}
            </span>
            <span className="text-2xl font-semibold text-slate-300 dark:text-slate-700">—</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {m.label} ({m.unidad})
            </span>
          </Card>
        ))}
      </div>
    </div>
  )
}
