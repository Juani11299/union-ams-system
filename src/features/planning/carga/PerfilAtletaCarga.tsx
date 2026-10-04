import { useMemo, useState } from 'react'
import { Badge } from '@/components/Badge'
import { Card } from '@/components/Card'
import { inputClass } from '@/components/FormField'
import { InfoTooltip } from '@/components/InfoTooltip'
import { serieDiariaAtleta, zContraGrupo, type ResumenCarga } from '@/features/workload/cargaInterna'
import { formatFechaCorta } from '@/utils/fecha'
import { ACWR_LABEL, ACWR_TONE, ESTADO_BADGE, fmtNum, fmtPct } from './etiquetas'
import { HistorialCarga } from './HistorialCarga'
import { useCargaInterna } from './useCargaInterna'

const ORIGEN: Record<string, { label: string; tone: 'green' | 'yellow' | 'gray' | 'orange' }> = {
  real: { label: 'RPE real', tone: 'green' },
  imputado: { label: 'Imputado', tone: 'yellow' },
  descanso: { label: 'Descanso', tone: 'gray' },
  faltante: { label: 'Sin dato', tone: 'orange' },
  'partido-sin-minutos': { label: 'No jugó', tone: 'gray' },
  'sin-plan': { label: 'RPE sin sesión planificada', tone: 'orange' },
}

/**
 * Perfil del Atleta (ficha longitudinal individual): ACWR por promedios móviles
 * y por EWMA, Monotonía y Strain de Foster, comparativa contra la media de su
 * división (Z-score y Δ), historial del gráfico y el detalle de las respuestas
 * de RPE y duración día por día.
 */
export function PerfilAtletaCarga({ atletaId, onElegir }: { atletaId: string; onElegir: (id: string) => void }) {
  const { athletes, ctx, hoy, resumenes } = useCargaInterna()
  const [verTodos, setVerTodos] = useState(false)
  const ordenados = useMemo(() => [...athletes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [athletes])
  const id = atletaId && athletes.some((a) => a.id === atletaId) ? atletaId : (ordenados[0]?.id ?? '')
  const atleta = athletes.find((a) => a.id === id)
  const r: ResumenCarga | undefined = id ? resumenes.get(id) : undefined

  const grupo = useMemo(() => [...resumenes.values()].filter((x) => x.estado !== 'sin-datos'), [resumenes])
  const comparativa = useMemo(() => {
    if (!r) return []
    const filas: Array<{ k: string; label: string; valor: number | null; d: number; tooltip?: string; vals: number[]; invertir?: boolean }> = [
      { k: 'aguda', label: 'Carga aguda 7d (UA)', valor: r.aguda, d: 0, vals: grupo.map((x) => x.aguda) },
      { k: 'cronica', label: 'Carga crónica (UA/sem)', valor: r.cronica, d: 0, vals: grupo.map((x) => x.cronica) },
      { k: 'acwr', label: 'ACWR', valor: r.acwr, d: 2, vals: grupo.map((x) => x.acwr).filter((v): v is number => v !== null) },
      { k: 'monotonia', label: 'Monotonía (Foster)', valor: r.monotonia, d: 2, vals: grupo.map((x) => x.monotonia).filter((v): v is number => v !== null && v < 99) },
      { k: 'strain', label: 'Strain (Foster)', valor: r.strain, d: 0, vals: grupo.map((x) => x.strain).filter((v): v is number => v !== null) },
    ]
    return filas.map((f) => ({ ...f, ...(f.valor === null ? { z: null, delta: null, media: null } : zContraGrupo(f.valor, f.vals)) }))
  }, [r, grupo])

  const detalle = useMemo(() => {
    if (!id) return []
    return serieDiariaAtleta(ctx, id, hoy, 28)
      .filter((d) => d.planificado || d.origen === 'real' || d.origen === 'sin-plan')
      .reverse()
  }, [ctx, id, hoy])

  if (athletes.length === 0) return <Card className="py-10 text-center text-sm text-slate-500">No hay jugadores cargados para esta categoría en esta temporada.</Card>
  if (!atleta || !r) return null

  const tarjeta = (titulo: string, valor: string, pie: React.ReactNode, tooltip?: React.ReactNode) => (
    <Card className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        {titulo}
        {tooltip}
      </span>
      <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{valor}</span>
      <span className="text-[11px] text-slate-400">{pie}</span>
    </Card>
  )

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-wrap items-center gap-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Jugador</span>
          <select className={`${inputClass} min-w-[240px]`} value={id} onChange={(e) => onElegir(e.target.value)}>
            {ordenados.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={ACWR_TONE[r.estado === 'sin-datos' ? 'sin-datos' : r.riesgo]}>{ACWR_LABEL[r.estado === 'sin-datos' ? 'sin-datos' : r.riesgo]}</Badge>
          <span title={r.motivoEstado}>
            <Badge tone={ESTADO_BADGE[r.estado].tone}>{ESTADO_BADGE[r.estado].label}{r.cobertura !== null ? ` · ${Math.round(r.cobertura * 100)} % de sesiones con RPE` : ''}</Badge>
          </span>
          {r.spikeSemanal === 'alto' && <Badge tone="red">Salto semanal {fmtPct(r.variacionSemanal)}</Badge>}
          {r.semanaMonotona && <Badge tone="orange">Semana monótona de riesgo</Badge>}
          <Badge tone={r.reportoHoy ? 'green' : r.sesionHoy ? 'yellow' : 'gray'}>{r.reportoHoy ? '✅ Completó RPE hoy' : r.sesionHoy ? '⏳ RPE de hoy pendiente' : 'Sin sesión hoy'}</Badge>
        </div>
        <p className="w-full text-[11px] text-slate-400">{r.motivoEstado}</p>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {tarjeta('Carga aguda 7d', `${fmtNum(r.aguda)}`, 'UA acumuladas en la semana')}
        {tarjeta('Carga crónica', `${fmtNum(r.cronica)}`, 'UA/semana (prom. 28 días)')}
        {tarjeta(
          'ACWR (promedios)',
          r.estado === 'sin-datos' ? '—' : fmtNum(r.acwr, 2),
          r.estado === 'sin-datos' ? 'sin datos suficientes' : ACWR_LABEL[r.riesgo],
          <InfoTooltip titulo="ACWR (Gabbett, 2016)" descripcion="Carga aguda (7 días) sobre carga crónica (promedio semanal de 28 días). 0,8–1,3 zona óptima (sweet spot); < 0,8 subentrenamiento; 1,3–1,5 precaución; > 1,5 zona de riesgo (spike)." cita="Gabbett, T.J. (2016). The training-injury prevention paradox. Br J Sports Med." />,
        )}
        {tarjeta(
          'ACWR (EWMA)',
          r.estado === 'sin-datos' ? '—' : fmtNum(r.acwrEwma, 2),
          r.estado === 'sin-datos' ? 'sin datos suficientes' : ACWR_LABEL[r.riesgoEwma],
          <InfoTooltip titulo="ACWR por EWMA" descripcion="Promedio móvil exponencialmente ponderado (λ aguda = 2/(7+1), λ crónica = 2/(28+1)): da más peso a los días recientes y tolera mejor los baches de datos que el promedio móvil simple." cita="Williams, S. et al. (2017). Better way to determine the acute:chronic workload ratio? Br J Sports Med." />,
        )}
        {tarjeta('Monotonía', fmtNum(r.monotonia, 2), r.monotonia === null ? '' : r.monotonia > 2 ? '🔴 > 2,0: zona de peligro' : r.monotonia >= 1.5 ? '🟡 1,5–2,0: precaución' : '🟢 < 1,5: óptima', <InfoTooltip titulo="Monotonía de Foster" descripcion="Carga diaria media de los últimos 7 días / desvío estándar. Entrenar siempre igual de fuerte, sin días de descarga, se asocia a sobreentrenamiento aunque la carga total no sea extrema." cita="Foster, C. (1998). Monitoring training in athletes with reference to overtraining syndrome. MSSE 30(7)." />)}
        {tarjeta('Strain (tensión)', fmtNum(r.strain), 'Carga semanal × Monotonía', <InfoTooltip titulo="Strain de Foster" descripcion="Carga total semanal × Monotonía. Dos semanas con la misma carga pueden tener una tensión muy distinta según cuán monótonas hayan sido." cita="Foster, C. (1998). MSSE 30(7)." />)}
      </div>

      <Card className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Comparativa contra su división</h3>
          <p className="text-xs text-slate-400">Valor del jugador contra la media del plantel ({grupo.length} jugadores con dato). Z = desvíos estándar respecto de la media; Δ = diferencia absoluta.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase text-slate-400 dark:border-slate-700">
                <th className="py-1.5 pr-3">Métrica</th>
                <th className="py-1.5 pr-3 text-right">Jugador</th>
                <th className="py-1.5 pr-3 text-right">Media división</th>
                <th className="py-1.5 pr-3 text-right">Δ vs. grupo</th>
                <th className="py-1.5 text-right">Z-score</th>
              </tr>
            </thead>
            <tbody>
              {comparativa.map((f) => (
                <tr key={f.k} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">{f.label}</td>
                  <td className="py-1.5 pr-3 text-right font-semibold tabular-nums">{fmtNum(f.valor, f.d)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-slate-500">{fmtNum(f.media, f.d)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{f.delta === null ? '—' : `${f.delta >= 0 ? '+' : '−'}${fmtNum(Math.abs(f.delta), f.d)}`}</td>
                  <td className={`py-1.5 text-right font-semibold tabular-nums ${f.z === null ? 'text-slate-400' : Math.abs(f.z) >= 2 ? 'text-rose-600' : Math.abs(f.z) >= 1 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-200'}`}>{f.z === null ? '—' : `${f.z >= 0 ? '+' : '−'}${fmtNum(Math.abs(f.z), 2)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <HistorialCarga key={id} atletaInicial={id} />

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Histórico de respuestas · RPE y duración</h3>
            <p className="text-xs text-slate-400">Últimos 28 días con sesión planificada o RPE. UA = RPE × minutos totales (Campo + Gimnasio).</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={verTodos} onChange={(e) => setVerTodos(e.target.checked)} />
            Mostrar también los días sin dato
          </label>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="sticky top-0 bg-white dark:bg-slate-900">
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase text-slate-400 dark:border-slate-700">
                <th className="py-1.5 pr-3">Fecha</th>
                <th className="py-1.5 pr-3 text-right">RPE</th>
                <th className="py-1.5 pr-3 text-right">Campo (min)</th>
                <th className="py-1.5 pr-3 text-right">Gimnasio (min)</th>
                <th className="py-1.5 pr-3 text-right">Campo UA</th>
                <th className="py-1.5 pr-3 text-right">Gimnasio UA</th>
                <th className="py-1.5 pr-3 text-right">Total UA</th>
                <th className="py-1.5">Origen</th>
              </tr>
            </thead>
            <tbody>
              {detalle
                .filter((d) => verTodos || d.origen === 'real' || d.origen === 'imputado' || d.origen === 'sin-plan')
                .map((d) => (
                  <tr key={d.fecha} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">{formatFechaCorta(d.fecha)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{d.rpe ?? '—'}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{d.desglose ? fmtNum(d.desglose.minCampo + d.desglose.minPartido) : '—'}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{d.desglose ? fmtNum(d.desglose.minGimnasio) : '—'}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{d.desglose ? fmtNum(d.desglose.campo + d.desglose.partido) : '—'}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{d.desglose ? fmtNum(d.desglose.gimnasio) : '—'}</td>
                    <td className="py-1.5 pr-3 text-right font-semibold tabular-nums">{fmtNum(d.carga)}</td>
                    <td className="py-1.5">
                      <Badge tone={ORIGEN[d.origen].tone}>{d.origen === 'imputado' && d.rpeSinCarga ? 'Imputado (falta el tiempo de la sesión)' : ORIGEN[d.origen].label}</Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
