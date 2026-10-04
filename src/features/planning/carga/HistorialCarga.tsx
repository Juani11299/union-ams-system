import { useMemo, useState } from 'react'
import { Card } from '@/components/Card'
import { inputClass } from '@/components/FormField'
import { historialCarga, type RangoHistorial } from '@/features/workload/cargaInterna'
import { GraficoHistorial } from './GraficoHistorial'
import { fmtNum } from './etiquetas'
import { useCargaInterna } from './useCargaInterna'

export const RANGOS: Array<{ id: RangoHistorial; label: string; desc: string }> = [
  { id: '7d', label: 'Últimos 7 días', desc: 'Microciclo en curso, día por día' },
  { id: '4s', label: '4 semanas / mesociclo', desc: '28 días, día por día' },
  { id: 'temporada', label: 'Temporada completa', desc: 'Todo el historial, agrupado por semana' },
]

/**
 * Historial de Carga / Microciclos — barras de carga (apiladas por tipo de
 * sesión) superpuestas con las curvas de carga aguda (7 d) y crónica (28 d).
 * Se puede mirar el plantel completo (carga media por jugador) o a un jugador.
 */
export function HistorialCarga({ atletaInicial = '' }: { atletaInicial?: string }) {
  const { athletes, ctx, hoy, resumenes } = useCargaInterna()
  const [rango, setRango] = useState<RangoHistorial>('4s')
  const [atletaId, setAtletaId] = useState(atletaInicial)

  const ids = useMemo(() => (atletaId ? [atletaId] : athletes.map((a) => a.id)), [atletaId, athletes])
  const puntos = useMemo(() => historialCarga(ctx, ids, hoy, rango), [ctx, ids, hoy, rango])
  const ordenados = useMemo(() => [...athletes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [athletes])

  const total = puntos.reduce((s, p) => s + p.carga, 0)
  const ultimo = puntos[puntos.length - 1]
  const r = atletaId ? resumenes.get(atletaId) : null
  const semanal = rango === 'temporada'

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Período</span>
          <select className={`${inputClass} min-w-[200px]`} value={rango} onChange={(e) => setRango(e.target.value as RangoHistorial)}>
            {RANGOS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Ver</span>
          <select className={`${inputClass} min-w-[220px]`} value={atletaId} onChange={(e) => setAtletaId(e.target.value)}>
            <option value="">Plantel completo (media por jugador)</option>
            {ordenados.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
        <p className="max-w-md text-[11px] text-slate-400">{RANGOS.find((x) => x.id === rango)?.desc}. Los días planificados sin RPE se imputan con la media propia del jugador (nunca con 0); los días sin sesión cuentan como descanso.</p>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-500">Carga del período</span>
          <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">{fmtNum(total)} UA</span>
          <span className="text-[11px] text-slate-400">{atletaId ? 'del jugador' : 'media por jugador'}</span>
        </Card>
        <Card className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-500">Carga aguda (7d)</span>
          <span className="text-xl font-semibold text-rose-600">{fmtNum(ultimo?.aguda)} UA</span>
        </Card>
        <Card className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-500">Carga crónica (28d)</span>
          <span className="text-xl font-semibold text-slate-700 dark:text-slate-200">{fmtNum(ultimo?.cronica)} UA/sem</span>
        </Card>
        <Card className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-500">ACWR actual</span>
          <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">{fmtNum(ultimo?.acwr, 2)}</span>
          <span className="text-[11px] text-slate-400">{r ? (r.estado === 'confiable' ? 'dato confiable' : r.estado === 'provisorio' ? 'dato provisorio' : 'sin datos suficientes') : 'promedio de las curvas del grupo'}</span>
        </Card>
      </div>

      <Card className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Carga {semanal ? 'semanal' : 'diaria'} · {atletaId ? (ordenados.find((a) => a.id === atletaId)?.nombre ?? '') : 'plantel'} vs. carga aguda y crónica
        </h3>
        <GraficoHistorial puntos={puntos} semanal={semanal} />
        <p className="text-[11px] text-slate-400">
          Las barras (eje izquierdo) son la carga {semanal ? 'de cada semana' : 'de cada día'} apilada por tipo de sesión; las líneas (eje derecho) son la carga aguda —suma de los últimos 7 días— y la crónica —promedio semanal de los últimos 28 días—, ambas en UA por semana. Cuando la aguda se separa por encima de la crónica sube el ACWR.
        </p>
      </Card>
    </div>
  )
}
