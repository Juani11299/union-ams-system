import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAthletesActivos, useExternalLoadsActivos, usePhysicalTestsActivos } from '@/store/useAppStore'
import { Card } from '@/components/Card'
import { InfoTooltip } from '@/components/InfoTooltip'
import { obtenerUltimoCmj, tieneAlertaFatiga } from './calculations'

const VERDE = '#10b981'
const ROJO = '#f43f5e'
const GRIS = '#cbd5e1'

export function DashboardIntegrado() {
  const athletes = useAthletesActivos()
  const externalLoads = useExternalLoadsActivos()
  const physicalTests = usePhysicalTestsActivos()

  const ultimaFechaConGps = [...externalLoads].sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.fecha
  const datosGps = athletes
    .map((a) => {
      const carga = externalLoads.find((e) => e.athleteId === a.id && e.fecha === ultimaFechaConGps)
      return { nombre: a.nombre.split(' ')[0], distancia: carga?.totalDistance ?? 0 }
    })
    .filter((d) => d.distancia > 0)

  const datosCmj = athletes.map((a) => {
    const ultimo = obtenerUltimoCmj(physicalTests, a.id)
    return {
      nombre: a.nombre.split(' ')[0],
      cmj: ultimo?.cmjCm ?? 0,
      fatiga: tieneAlertaFatiga(physicalTests, a.id),
      sinDatos: !ultimo,
    }
  })

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Distancia Total — última sesión con GPS
        </h2>
        {datosGps.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Todavía no hay datos GPS cargados para esta categoría.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGps} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value} m`, 'Distancia']} />
                <Bar dataKey="distancia" fill={VERDE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            Último CMJ por jugador
            <InfoTooltip
              titulo="Altura de CMJ: señal de baja sensibilidad"
              descripcion="La altura del salto por sí sola tiende a mantenerse estable aunque exista fatiga neuromuscular real. Para una señal más sensible, cargá también el RSI modificado en cada evaluación."
              cita="Marques et al. (2026); TFM Robles, J.I. (2026), dir. Olaya Cuartero, J. — 'Jump height lies'."
            />
          </h2>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: ROJO }} /> Alerta de fatiga
          </span>
        </div>
        {datosCmj.every((d) => d.sinDatos) ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Todavía no hay evaluaciones CMJ cargadas para esta categoría.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosCmj} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value} cm`, 'CMJ']} />
                <Bar dataKey="cmj" radius={[4, 4, 0, 0]}>
                  {datosCmj.map((d, i) => (
                    <Cell key={i} fill={d.sinDatos ? GRIS : d.fatiga ? ROJO : VERDE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  )
}
