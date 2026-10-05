import { useMemo } from 'react'
import { Activity, BookOpen, ClipboardList, Gauge, Microscope, TrendingUp, Waves } from 'lucide-react'
import { Card } from '@/components/Card'
import { datosPeriodo, type ContextoCarga, type RangoHistorial, type ResumenCarga } from '@/features/workload/cargaInterna'
import { insightsMicrociclo, REFERENCIAS } from '@/features/workload/workloadInsights'
import { BloqueTexto, EncabezadoPanel, TarjetaAccion } from './insightsUi'

interface Props {
  ctx: ContextoCarga
  hasta: string
  rango: RangoHistorial
  /** Jugadores incluidos en el gráfico (todo el plantel de la división activa, o uno solo). */
  ids: string[]
  resumenes: ResumenCarga[]
  /** "el plantel" o el nombre del jugador. */
  alcance: string
  nombreDivision?: string
}

/**
 * Smart Decision Engine — Historial de carga / microciclos. Se recalcula con el
 * rango temporal (7 días / 4 semanas / temporada) y con la división o el jugador
 * elegidos: decisiones rápidas para el cuerpo técnico + informe académico.
 */
export function MicrocicloInsightsPanel({ ctx, hasta, rango, ids, resumenes, alcance, nombreDivision }: Props) {
  const insights = useMemo(() => {
    const periodo = datosPeriodo(ctx, ids, hasta, rango)
    return insightsMicrociclo({ periodo, resumenes, alcance: nombreDivision ? `${alcance} · ${nombreDivision}` : alcance })
  }, [ctx, ids, hasta, rango, resumenes, alcance, nombreDivision])

  const iconos = { microciclo: <Activity size={16} />, monotonia: <Waves size={16} />, spike: <TrendingUp size={16} /> } as const

  return (
    <Card className="flex flex-col gap-5">
      <EncabezadoPanel icono={<Microscope size={18} />} titulo="Smart Decision Engine · Microciclo" subtitulo="Decisiones inmediatas y diagnóstico del período seleccionado; se recalcula con el rango y la división." />

      <section className="flex flex-col gap-2">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <ClipboardList size={14} /> Decisiones rápidas para el cuerpo técnico
        </h4>
        <div className="grid gap-3 lg:grid-cols-3">
          {insights.tarjetas.map((t) => (
            <TarjetaAccion key={t.id} icono={iconos[t.id]} titulo={t.titulo} estado={t.estado} tono={t.tono}>
              {t.detalle}
            </TarjetaAccion>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <BookOpen size={14} /> Informe académico y fisiológico del período
        </h4>
        <div className="grid gap-3 xl:grid-cols-3">
          <BloqueTexto icono={<Gauge size={14} />} titulo="Dinámica del estímulo">
            {insights.informe.dinamica}
          </BloqueTexto>
          <BloqueTexto icono={<Activity size={14} />} titulo="Respuesta adaptativa">
            {insights.informe.respuesta}
          </BloqueTexto>
          <BloqueTexto icono={<ClipboardList size={14} />} titulo="Prescripción para el próximo ciclo">
            {insights.informe.prescripcion}
          </BloqueTexto>
        </div>
        <details className="text-[11px] text-slate-400">
          <summary className="cursor-pointer select-none">Referencias</summary>
          <ul className="mt-1 list-disc pl-5">
            {REFERENCIAS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </details>
      </section>
    </Card>
  )
}
