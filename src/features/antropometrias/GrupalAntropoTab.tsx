import { useMemo } from 'react'
import { Card } from '@/components/Card'
import { analizarGrupo } from './calculations'
import type { EvolucionJugador, KpiGrupal } from './calculations'
import { fmtDelta, fmtFechaLarga, fmtNum } from './format'
import type { MedicionAntropo } from './types'

type Sentido = 'neutro' | 'menos-es-mejor' | 'mas-es-mejor'

function VariacionChip({ variacion, unidad, sentido }: { variacion: number | null; unidad: string; sentido: Sentido }) {
  if (variacion === null) {
    return <span className="text-xs text-slate-400">Sin medición anterior para comparar</span>
  }
  const redondeado = Number(variacion.toFixed(1))
  const mejora = sentido === 'mas-es-mejor' ? redondeado > 0 : sentido === 'menos-es-mejor' ? redondeado < 0 : null
  const empeora = sentido === 'mas-es-mejor' ? redondeado < 0 : sentido === 'menos-es-mejor' ? redondeado > 0 : null
  const clase = redondeado === 0
    ? 'text-slate-500 dark:text-slate-400'
    : mejora
      ? 'text-emerald-600 dark:text-emerald-400'
      : empeora
        ? 'text-union-red-600 dark:text-union-red-400'
        : 'text-slate-600 dark:text-slate-300'
  return (
    <span className={`text-xs font-semibold ${clase}`}>
      {redondeado === 0 ? '＝' : redondeado > 0 ? '▲' : '▼'} {fmtDelta(variacion)} {unidad}{' '}
      <span className="font-normal text-slate-400">vs. medición anterior</span>
    </span>
  )
}

function KpiCard({
  titulo,
  icono,
  kpi,
  unidad,
  sentido,
}: {
  titulo: string
  icono: string
  kpi: KpiGrupal
  unidad: string
  sentido: Sentido
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {icono} {titulo}
      </span>
      <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
        {fmtNum(kpi.valor)}
        <span className="ml-1 text-base font-semibold text-slate-400">{unidad}</span>
      </span>
      <VariacionChip variacion={kpi.variacion} unidad={unidad === '%' ? 'pp' : unidad} sentido={sentido} />
      <span className="text-[11px] text-slate-400">Promedio de la última medición de {kpi.n} jugador(es)</span>
    </Card>
  )
}

function TablaTop5({
  titulo,
  icono,
  filas,
  vacio,
  tono,
}: {
  titulo: string
  icono: string
  filas: EvolucionJugador[]
  vacio: string
  tono: 'verde' | 'rojo'
}) {
  const claseTono = tono === 'verde' ? 'text-emerald-600 dark:text-emerald-400' : 'text-union-red-600 dark:text-union-red-400'
  return (
    <Card className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {icono} {titulo}
      </h3>
      {filas.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">{vacio}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-700">
                <th className="py-1.5 pr-2">#</th>
                <th className="py-1.5 pr-2">Jugador</th>
                <th className="py-1.5 pr-2 text-right">Δ Músculo</th>
                <th className="py-1.5 pr-2 text-right">Δ Grasa</th>
                <th className="py-1.5 text-right">Δ Peso</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((e, i) => (
                <tr key={e.jugadorKey} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="py-2 pr-2 text-[11px] font-bold text-slate-300 dark:text-slate-600">{i + 1}</td>
                  <td className="py-2 pr-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{e.jugador}</span>
                    <span className="block text-[11px] text-slate-400">
                      {fmtFechaLarga(e.cambio.previa.fecha)} → {fmtFechaLarga(e.cambio.actual.fecha)}
                    </span>
                  </td>
                  <td className={`py-2 pr-2 text-right font-semibold tabular-nums ${claseTono}`}>
                    {fmtDelta(e.cambio.dMusculo)} pp
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                    {fmtDelta(e.cambio.dGrasa)} pp
                  </td>
                  <td className="py-2 text-right tabular-nums text-slate-500 dark:text-slate-400">
                    {fmtDelta(e.cambio.dPeso)} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-slate-400">
        Ordenado por {tono === 'verde' ? 'ganancia muscular + pérdida de grasa' : 'pérdida muscular + ganancia de grasa'}{' '}
        (en puntos porcentuales, pp). Sólo cambios combinados de 0,5 pp o más.
      </p>
    </Card>
  )
}

/**
 * Análisis Grupal — las mediciones que recibe ya vienen filtradas por el
 * selector "AGRUPAR POR" del panel. KPIs = promedio de la última medición de
 * cada jugador; Top 5 = evolución de la última medición contra la anterior.
 */
export function GrupalAntropoTab({ mediciones }: { mediciones: MedicionAntropo[] }) {
  const analisis = useMemo(() => analizarGrupo(mediciones), [mediciones])

  if (mediciones.length === 0) {
    return (
      <Card className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        No hay mediciones para este grupo. Importá el archivo del nutricionista para empezar.
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {analisis.jugadores} jugador(es) · {analisis.conComparativa} con al menos dos mediciones (entran a los
        rankings) {analisis.ultimaFecha && <>· última medición: {fmtFechaLarga(analisis.ultimaFecha)}</>}
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard titulo="Peso promedio" icono="⚖️" kpi={analisis.peso} unidad="kg" sentido="neutro" />
        <KpiCard titulo="Masa grasa promedio" icono="🟡" kpi={analisis.grasa} unidad="%" sentido="menos-es-mejor" />
        <KpiCard titulo="Masa muscular promedio" icono="💪" kpi={analisis.musculo} unidad="%" sentido="mas-es-mejor" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TablaTop5
          titulo="Mejor Recomposición"
          icono="🟢"
          filas={analisis.mejorRecomposicion}
          tono="verde"
          vacio={
            analisis.conComparativa === 0
              ? 'Hace falta al menos una medición anterior por jugador para calcular la evolución.'
              : 'Ningún jugador ganó músculo y perdió grasa de forma relevante en la última medición.'
          }
        />
        <TablaTop5
          titulo="Alertas"
          icono="🔴"
          filas={analisis.alertas}
          tono="rojo"
          vacio={
            analisis.conComparativa === 0
              ? 'Hace falta al menos una medición anterior por jugador para calcular la evolución.'
              : 'Sin alertas: nadie perdió músculo ni ganó grasa de forma relevante.'
          }
        />
      </div>
    </div>
  )
}
