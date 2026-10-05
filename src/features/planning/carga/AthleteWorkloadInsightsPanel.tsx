import { useMemo } from 'react'
import { Activity, BookOpen, ClipboardCheck, Gauge, HeartPulse, LineChart, Scale, UserCheck, Zap } from 'lucide-react'
import { Card } from '@/components/Card'
import { correlacionPlanificado, datosPeriodo, desvioRpe, zContraGrupo, type ContextoCarga, type RangoHistorial, type ResumenCarga } from '@/features/workload/cargaInterna'
import { insightsAtleta, REFERENCIAS } from '@/features/workload/workloadInsights'
import { BloqueTexto, EncabezadoPanel, TarjetaAccion, TONO } from './insightsUi'

interface Props {
  ctx: ContextoCarga
  hasta: string
  rango: RangoHistorial
  athleteId: string
  nombre: string
  r: ResumenCarga
  /** Resúmenes de todo el plantel (para el Z-score contra la categoría). */
  grupo: ResumenCarga[]
}

/**
 * Smart Decision Engine — Perfil del atleta. Semáforo clínico de disponibilidad,
 * métricas clave (ACWR, Z-score vs. categoría, desvío de RPE vs. plan), acción
 * inmediata sugerida y diagnóstico longitudinal individual. Se recalcula con el
 * jugador elegido y con el rango temporal activo.
 */
export function AthleteWorkloadInsightsPanel({ ctx, hasta, rango, athleteId, nombre, r, grupo }: Props) {
  const insights = useMemo(() => {
    const comparables = grupo.filter((x) => x.estado !== 'sin-datos')
    const z = comparables.length >= 5 ? zContraGrupo(r.aguda, comparables.map((x) => x.aguda)).z : null
    return insightsAtleta({
      nombre,
      r,
      zGrupo: r.estado === 'sin-datos' ? null : z,
      grupoN: comparables.length,
      desvio: desvioRpe(ctx, athleteId, hasta),
      periodo: datosPeriodo(ctx, [athleteId], hasta, rango),
      correlacion: correlacionPlanificado(ctx, athleteId, hasta),
    })
  }, [ctx, hasta, rango, athleteId, nombre, r, grupo])

  const d = insights.disponibilidad
  const t = TONO[d.tono]

  return (
    <Card className="flex flex-col gap-5">
      <EncabezadoPanel icono={<HeartPulse size={18} />} titulo={`Smart Decision Engine · ${nombre}`} subtitulo="Semáforo de disponibilidad, acción inmediata y lectura longitudinal; sigue al jugador elegido y al rango temporal." />

      <section className="flex flex-col gap-3">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <UserCheck size={14} /> Semáforo clínico y toma de decisión diaria
        </h4>
        <div className={`flex flex-col gap-2 rounded-xl border p-4 ${t.card}`}>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado de disponibilidad</span>
          <span className={`w-fit rounded-full px-4 py-1.5 text-base font-extrabold ${t.badge}`}>{d.label}</span>
          <ul className="list-disc pl-5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {d.motivos.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <TarjetaAccion icono={<Gauge size={16} />} titulo="ACWR individual" estado={insights.acwr.texto} tono={insights.acwr.valor === null ? 'gris' : insights.acwr.confiable ? (insights.acwr.valor > 1.5 ? 'rojo' : insights.acwr.valor > 1.3 || insights.acwr.valor < 0.8 ? 'amarillo' : 'verde') : 'amarillo'}>
            {insights.acwr.valor === null ? 'Sin datos suficientes para calcular el ACWR.' : `Ubicado ${insights.acwr.zona}. ${insights.acwr.confiable ? 'Dato confiable: ≥ 70 % de las sesiones planificadas con RPE.' : 'Dato provisorio: los días faltantes se imputaron con su media; no dispara alertas.'}`}
          </TarjetaAccion>
          <TarjetaAccion icono={<Scale size={16} />} titulo="Z-score vs. su categoría" estado={insights.zScore.valor === null ? 'Sin comparación' : `Z ${insights.zScore.valor >= 0 ? '+' : '−'}${Math.abs(insights.zScore.valor).toFixed(2).replace('.', ',')}`} tono={insights.zScore.tono}>
            {insights.zScore.texto}
          </TarjetaAccion>
          <TarjetaAccion icono={<Zap size={16} />} titulo="Desvío de RPE vs. planificado" estado={insights.desvioRpe.media === null ? 'Sin datos' : `${insights.desvioRpe.media >= 0 ? '+' : '−'}${Math.abs(insights.desvioRpe.media).toFixed(1).replace('.', ',')} pts`} tono={insights.desvioRpe.tono}>
            {insights.desvioRpe.texto}
          </TarjetaAccion>
        </div>

        <div className="rounded-xl border border-union-charcoal/20 bg-union-charcoal p-4 text-white">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-300">
            <ClipboardCheck size={14} /> Acción inmediata sugerida
          </div>
          <ul className="flex flex-col gap-1 text-sm leading-relaxed">
            {insights.acciones.map((a) => (
              <li key={a} className="flex gap-2">
                <span aria-hidden>➜</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <BookOpen size={14} /> Diagnóstico longitudinal individual
        </h4>
        <div className="grid gap-3 xl:grid-cols-3">
          <BloqueTexto icono={<LineChart size={14} />} titulo="Tolerancia al estrés">
            {insights.diagnostico.evolucion}
          </BloqueTexto>
          <BloqueTexto icono={<Activity size={14} />} titulo="Pendiente de la carga crónica">
            {insights.diagnostico.pendiente}
          </BloqueTexto>
          <BloqueTexto icono={<UserCheck size={14} />} titulo="Adherencia y carga reportada">
            {insights.diagnostico.adherencia}
          </BloqueTexto>
        </div>
        <p className="text-[11px] text-slate-400">{insights.diagnostico.calidad}</p>
        <details className="text-[11px] text-slate-400">
          <summary className="cursor-pointer select-none">Referencias</summary>
          <ul className="mt-1 list-disc pl-5">
            {REFERENCIAS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </details>
      </section>
    </Card>
  )
}
