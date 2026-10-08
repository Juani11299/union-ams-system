import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, MessageSquare, Target, Users, Activity } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { Badge } from '@/components/Badge'
import { Card } from '@/components/Card'
import { InfoTooltip } from '@/components/InfoTooltip'
import type { Athlete, WellnessEntry } from '@/types'
import { resumenCarga, tieneAlerta, type ContextoCarga, type ResumenCarga } from '@/features/workload/cargaInterna'
import {
  READINESS_ATENCION,
  READINESS_CRITICO,
  UMBRAL_DISCORDANCIA_RPE,
  UMBRAL_SOBRECARGA_DIA,
  nombreDiaSemana,
  resumenDia,
  type FilaDia,
} from '@/features/workload/controlDiario'
import { formatFechaLarga, sumarDiasFecha } from '@/utils/fecha'
import { UMBRAL_DOLOR_INTENSO } from '../riskAssessment'
import { ACWR_LABEL, ACWR_TONE, fmtNum } from './etiquetas'
import { RpeBadge, nivelRpe } from './RpeBadge'

type Orden = 'rpe' | 'nombre' | 'estado' | 'tiempo' | 'srpe' | 'z' | 'readiness' | 'acwr'
type Filtro = 'todos' | 'completaron' | 'pendientes' | 'no-convocados'

const MONO = 'font-mono tabular-nums'
const f1 = (v: number | null | undefined) => fmtNum(v, 1)
const signo = (v: number, d = 1) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${fmtNum(Math.abs(v), d)}`

/** Abreviatura de la posición; tolera los valores libres que hay cargados en la base ("Medio Ofensivo", "Def Lateral"…). */
function posicionCorta(p: string): string {
  const t = p.toLowerCase()
  if (t.includes('arq')) return 'ARQ'
  if (t.includes('lat')) return 'LAT'
  if (t.includes('def')) return 'DFC'
  if (t.includes('ofens')) return 'MCO'
  if (t.includes('medio') || t.includes('volante') || t.includes('central')) return 'MC'
  if (t.includes('extremo')) return 'EXT'
  if (t.includes('delan')) return 'DEL'
  return p.slice(0, 3).toUpperCase()
}

function colorReadiness(score: number): string {
  if (score <= READINESS_CRITICO) return 'text-rose-600 dark:text-rose-400'
  if (score <= READINESS_ATENCION) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

function KpiDia({ icono, titulo, tooltip, children, tono }: { icono: React.ReactNode; titulo: string; tooltip?: React.ReactNode; children: React.ReactNode; tono?: 'rojo' | 'ambar' }) {
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-xl border bg-white p-3.5 shadow-sm dark:bg-slate-900 ${tono === 'rojo' ? 'border-rose-300 dark:border-rose-500/40' : tono === 'ambar' ? 'border-amber-300 dark:border-amber-500/40' : 'border-slate-200 dark:border-slate-800'}`}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <span className="text-slate-400 dark:text-slate-500">{icono}</span>
        {titulo}
        {tooltip}
      </span>
      {children}
    </div>
  )
}

interface Props {
  fecha: string
  onFecha: (f: string) => void
  hoy: string
  athletes: Athlete[]
  ctx: ContextoCarga
  wellness: WellnessEntry[]
  onAbrirAtleta: (id: string) => void
}

/**
 * Control rápido del plantel por JORNADA: navegador de fecha (default hoy, hora ART), los 4 KPIs del día
 * y la grilla con TODOS los atletas de la categoría — quién respondió, quién debe el RPE y cómo se
 * desvió cada uno de su propia media (Impellizzeri et al., 2021) y del plan (Foster).
 */
export function ControlRapido({ fecha, onFecha, hoy, athletes, ctx, wellness, onAbrirAtleta }: Props) {
  const [orden, setOrden] = useState<{ k: Orden; dir: 1 | -1 }>({ k: 'rpe', dir: -1 })
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [soloAlerta, setSoloAlerta] = useState(false)
  const [cronicas, setCronicas] = useState(false)

  const dia = useMemo(() => resumenDia(ctx, athletes, fecha, wellness), [ctx, athletes, fecha, wellness])
  // ACWR y demás métricas crónicas, calculadas AL cierre de la fecha consultada (no de hoy).
  const cronico = useMemo(() => {
    const m = new Map<string, ResumenCarga>()
    for (const a of athletes) m.set(a.id, resumenCarga(ctx, a.id, fecha))
    return m
  }, [ctx, athletes, fecha])
  const porId = useMemo(() => new Map(athletes.map((a) => [a.id, a])), [athletes])
  const doms = useMemo(() => new Set(wellness.filter((w) => w.fecha === fecha && w.dolorMuscular <= UMBRAL_DOLOR_INTENSO).map((w) => w.athleteId)), [wellness, fecha])

  const k = dia.kpis
  const esHoy = fecha === hoy

  const alertaDe = (f: FilaDia) => f.sobrecarga || f.discordancia !== null || (cronico.get(f.athleteId) ? tieneAlerta(cronico.get(f.athleteId) as ResumenCarga) : false)

  const filas = useMemo(() => {
    const val = (f: FilaDia): number | string => {
      const a = porId.get(f.athleteId) as Athlete
      switch (orden.k) {
        case 'nombre': return a.nombre
        case 'estado': return f.estado === 'completado' ? 2 : f.estado === 'pendiente' ? 1 : 0
        case 'tiempo': return f.minTotal
        case 'srpe': return f.ua ?? -1
        case 'z': return f.z ?? -99
        case 'readiness': return f.readiness ?? -1
        case 'acwr': return cronico.get(f.athleteId)?.acwr ?? -1
        default: return f.rpe ?? -1
      }
    }
    return dia.filas
      .filter((f) => (filtro === 'todos' ? true : filtro === 'completaron' ? f.estado === 'completado' : filtro === 'pendientes' ? f.estado === 'pendiente' : f.estado === 'no-convocado'))
      .filter((f) => !soloAlerta || alertaDe(f))
      .sort((x, y) => {
        // Quien no respondió va siempre al final de las columnas numéricas, sin importar el sentido del orden.
        const numerica = orden.k !== 'nombre' && orden.k !== 'estado'
        if (numerica && (x.estado === 'completado') !== (y.estado === 'completado')) return x.estado === 'completado' ? -1 : 1
        const a = val(x)
        const b = val(y)
        const c = typeof a === 'string' ? a.localeCompare(b as string, 'es') : (a as number) - (b as number)
        if (c !== 0) return c * orden.dir
        const d = (y.ua ?? 0) - (x.ua ?? 0)
        if (orden.k === 'rpe' && d !== 0) return d
        return (porId.get(x.athleteId) as Athlete).nombre.localeCompare((porId.get(y.athleteId) as Athlete).nombre, 'es')
      })
  }, [dia, orden, filtro, soloAlerta, porId, cronico])

  const th = (key: Orden, texto: string, num = true, tip?: string) => (
    <th
      title={tip}
      className={`cursor-pointer select-none whitespace-nowrap px-2 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${num ? 'text-right' : 'text-left'}`}
      onClick={() => setOrden((o) => ({ k: key, dir: o.k === key ? (-o.dir as 1 | -1) : key === 'nombre' ? 1 : -1 }))}
    >
      {texto}
      {orden.k === key ? (orden.dir > 0 ? ' ▲' : ' ▼') : ''}
    </th>
  )

  const chip = (id: Filtro, texto: string, n: number) => (
    <button
      key={id}
      type="button"
      onClick={() => setFiltro(id)}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filtro === id ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
    >
      {texto} <span className={MONO}>{n}</span>
    </button>
  )

  // Histograma del RPE del día (0–10) para el KPI de percepción.
  const histograma = useMemo(() => {
    const h = Array.from({ length: 11 }, () => 0)
    for (const f of dia.filas) if (f.rpe !== null) h[Math.min(10, Math.max(0, Math.round(f.rpe)))]++
    return h
  }, [dia])
  const maxH = Math.max(1, ...histograma)

  const cumpl = k.cumplimiento
  const cumplTono = cumpl === null ? 'gray' : cumpl > 1.2 ? 'red' : cumpl > 1.1 ? 'yellow' : cumpl >= 0.9 ? 'green' : 'blue'
  const cumplTexto = cumpl === null ? 'Sin objetivo' : `${cumpl >= 1 ? '+' : '−'}${Math.abs(Math.round((cumpl - 1) * 100))} % vs objetivo`

  return (
    <Card className="flex flex-col gap-4">
      {/* Cabecera + navegador de fecha */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Control rápido del plantel</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CalendarDays size={13} aria-hidden />
            <span className="first-letter:uppercase">{formatFechaLarga(fecha)}</span>
            {esHoy && <Badge tone="green">Hoy</Badge>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Navegación por fecha">
          <button type="button" onClick={() => onFecha(sumarDiasFecha(fecha, -1))} className="flex items-center gap-0.5 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" title="Día anterior">
            <ChevronLeft size={14} aria-hidden /> Día anterior
          </button>
          <input
            type="date"
            value={fecha}
            max={hoy}
            onChange={(e) => e.target.value && onFecha(e.target.value > hoy ? hoy : e.target.value)}
            aria-label="Fecha a consultar"
            className={`rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${MONO}`}
          />
          <button type="button" disabled={fecha >= hoy} onClick={() => onFecha(sumarDiasFecha(fecha, 1))} className="flex items-center gap-0.5 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" title="Día siguiente">
            Día siguiente <ChevronRight size={14} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onFecha(hoy)}
            disabled={esHoy}
            className="rounded-lg bg-union-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-union-red-700 disabled:cursor-default disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
          >
            Hoy
          </button>
        </div>
      </div>

      {!dia.hayPlan && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          No hay sesión planificada el {nombreDiaSemana(fecha)}: el sRPE de quien respondió se calcula con la base del club (Lun–Vie campo 90 min · sábado partido · domingo 60 min) y no hay carga objetivo para comparar.
        </p>
      )}

      {/* KPIs de la jornada */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiDia icono={<Target size={13} />} titulo="Carga media de la jornada" tooltip={<InfoTooltip titulo="Carga vs. objetivo" descripcion="Promedio del sRPE (RPE × minutos) de quienes respondieron, contra la carga objetivo del día que fijó el cuerpo técnico en el Planificador. Verde: ±10 %; ámbar: +10–20 %; rojo: más de +20 %; celeste: por debajo del 90 %." />}>
          <p className={`text-2xl font-semibold text-slate-900 dark:text-slate-100 ${MONO}`}>{k.cargaMedia !== null ? fmtNum(k.cargaMedia) : '—'} <span className="text-xs font-normal text-slate-400">UA</span></p>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className={MONO}>Objetivo {k.cargaObjetivo > 0 ? fmtNum(k.cargaObjetivo) : '—'}</span>
            <Badge tone={cumplTono}>{cumplTexto}</Badge>
          </div>
        </KpiDia>

        <KpiDia icono={<Users size={13} />} titulo="Adhesión del día" tono={k.adhesion !== null && k.adhesion < 0.7 ? 'ambar' : undefined} tooltip={<InfoTooltip titulo="Adhesión" descripcion="Atletas que mandaron su RPE sobre el total del plantel. No cuentan en el denominador los jugadores de baja médica o en rehabilitación que no respondieron." />}>
          <p className={`text-2xl font-semibold text-slate-900 dark:text-slate-100 ${MONO}`}>
            {k.respondieron}<span className="text-base text-slate-400">/{k.esperados}</span>{' '}
            <span className="text-base">{k.adhesion !== null ? `${Math.round(k.adhesion * 100)} %` : '—'}</span>
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className={`h-full rounded-full ${k.adhesion !== null && k.adhesion < 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.round((k.adhesion ?? 0) * 100)}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{k.nPendientes} sin registro{k.nNoConvocados > 0 ? ` · ${k.nNoConvocados} de baja` : ''}</p>
        </KpiDia>

        <KpiDia icono={<Activity size={13} />} titulo="RPE predominante" tooltip={<InfoTooltip titulo="Percepción del grupo" descripcion="Moda (valor más frecuente), media ± desvío estándar y distribución del RPE (Borg CR-10) de quienes respondieron. Un desvío alto indica que el grupo vivió la sesión de forma muy distinta." />}>
          <p className={`text-2xl font-semibold text-slate-900 dark:text-slate-100 ${MONO}`}>
            {k.rpeModa !== null ? k.rpeModa : '—'} <span className="text-xs font-normal text-slate-400">moda</span>
          </p>
          <p className={`text-[11px] text-slate-500 dark:text-slate-400 ${MONO}`}>
            Media {f1(k.rpeMedia)} ± {f1(k.rpeDesvio)}
          </p>
          <div className="flex h-6 items-end gap-0.5" aria-hidden>
            {histograma.map((n, i) => (
              <span key={i} title={`RPE ${i}: ${n}`} className={`w-full rounded-sm ${n > 0 ? nivelRpe(i).punto : 'bg-slate-200 dark:bg-slate-800'}`} style={{ height: `${n > 0 ? Math.max(15, (n / maxH) * 100) : 8}%` }} />
            ))}
          </div>
        </KpiDia>

        <KpiDia icono={<AlertTriangle size={13} />} titulo="Alerta de sobrecarga" tono={k.nSobrecarga > 0 ? 'rojo' : undefined} tooltip={<InfoTooltip titulo="Criterios del día" descripcion={`Sobrecarga: sRPE individual más de ${UMBRAL_SOBRECARGA_DIA * 100} % por encima de la carga objetivo del cuerpo técnico. Discordancia: el atleta percibió ${UMBRAL_DISCORDANCIA_RPE} o más puntos de diferencia con el RPE planificado (Foster et al., 2021).`} />}>
          <p className={`text-2xl font-semibold ${k.nSobrecarga > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'} ${MONO}`}>{k.nSobrecarga}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">sRPE &gt; +{UMBRAL_SOBRECARGA_DIA * 100} % del objetivo</p>
          <p className={`text-[11px] ${k.nDiscordancia > 0 ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>⚠️ {k.nDiscordancia} con RPE discordante del plan</p>
        </KpiDia>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {chip('todos', 'Todos', dia.filas.length)}
          {chip('completaron', '✅ Completaron', k.respondieron)}
          {chip('pendientes', '⏳ Sin registro', k.nPendientes)}
          {k.nNoConvocados > 0 && chip('no-convocados', '🚫 De baja', k.nNoConvocados)}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setOrden((o) => ({ k: 'rpe', dir: o.k === 'rpe' ? (-o.dir as 1 | -1) : -1 }))}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-union-red-400 hover:text-union-red-700 dark:border-slate-700 dark:text-slate-300"
            title="Alterna entre RPE del día de mayor a menor y de menor a mayor"
          >
            Orden por RPE: {orden.k === 'rpe' && orden.dir === 1 ? '↑ más livianos primero' : '↓ más duros primero'}
          </button>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={soloAlerta} onChange={(e) => setSoloAlerta(e.target.checked)} />
            Sólo en alerta
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={cronicas} onChange={(e) => setCronicas(e.target.checked)} />
            Métricas crónicas (ACWR)
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/60">
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {th('nombre', 'Jugador', false)}
              {th('estado', 'Respuesta', false)}
              {th('rpe', 'RPE día', false, 'Borg CR-10 del día. Debajo: media propia en ese día de la semana y desvío.')}
              {th('tiempo', 'Tiempo', true, 'Minutos de Campo + Gimnasio del día')}
              {th('srpe', 'sRPE (UA)', true, 'RPE × minutos; debajo, % contra la carga objetivo del día')}
              {th('z', 'Δ vs plantel', true, 'Z-score diario: desvío del atleta respecto de sus compañeros en la misma jornada')}
              {th('readiness', 'Readiness', true, 'Wellness (Hooper) de esa fecha, sobre 20')}
              {cronicas && th('acwr', 'ACWR', true)}
              <th className="px-2 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nota del atleta</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const a = porId.get(f.athleteId) as Athlete
              const cr = cronico.get(f.athleteId)
              const pendiente = f.estado !== 'completado'
              return (
                <tr key={f.athleteId} className={`cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/70 dark:hover:bg-slate-800/50 ${pendiente ? 'opacity-80' : ''}`} onClick={() => onAbrirAtleta(f.athleteId)}>
                  <td className="px-2 py-2">
                    <span className="flex items-center gap-2">
                      <Avatar nombre={a.nombre} size="sm" />
                      <span className="flex flex-col leading-tight">
                        <span className="font-medium text-slate-800 dark:text-slate-100">{a.nombre}</span>
                        <span className="text-[10px] uppercase tracking-wide text-slate-400">{a.posiciones.map(posicionCorta).join(' · ') || '—'}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    {f.estado === 'completado' ? (
                      <Badge tone="green">✅ Completó</Badge>
                    ) : f.estado === 'pendiente' ? (
                      <span className="inline-flex items-center rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">⏳ Sin registro</span>
                    ) : (
                      <Badge tone="red">🚫 {a.estadoSalud}</Badge>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {f.rpe !== null ? (
                      <span className="flex flex-col items-start gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <RpeBadge
                            compacto
                            rpe={f.rpe}
                            advertencia={f.rpe >= 9 && (doms.has(f.athleteId) || (cr && cr.estado !== 'sin-datos' && cr.acwr !== null && cr.acwr > 1.5)) ? [doms.has(f.athleteId) ? 'DOMS intenso' : null, cr && cr.acwr !== null && cr.acwr > 1.5 ? `ACWR ${fmtNum(cr.acwr, 2)} > 1,5` : null].filter(Boolean).join(' + ') : null}
                          />
                          {f.discordancia !== null && (
                            <span title={`Discordancia con el plan: el atleta percibió ${f.rpe}, el cuerpo técnico planificó ${f.rpeEsperado} (${signo(f.discordancia, 0)} pts)`} className="text-amber-500">
                              <AlertTriangle size={14} aria-label="Discordancia entrenador-atleta" />
                            </span>
                          )}
                        </span>
                        {f.habitual ? (
                          <span title={`Media propia de los últimos ${f.habitual.n} ${nombreDiaSemana(fecha)}s: ${f1(f.habitual.media)}`} className={`text-[10px] ${MONO} ${Math.abs(f.habitual.delta) >= 1.5 ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                            hab. {f1(f.habitual.media)} · {signo(f.habitual.delta)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">sin histórico</span>
                        )}
                      </span>
                    ) : (
                      <span className={`text-slate-300 dark:text-slate-600 ${MONO}`}>–</span>
                    )}
                  </td>
                  <td className={`px-2 py-2 text-right ${MONO}`}>
                    {f.rpe === null ? (
                      <span className="text-slate-300 dark:text-slate-600">–</span>
                    ) : f.faltaTiempo ? (
                      <span title="Falta el Tiempo Total de Trabajo de la sesión" className="text-xs text-amber-600">⏳</span>
                    ) : (
                      <span className="flex flex-col items-end leading-tight">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{f.minTotal}′</span>
                        <span className="text-[10px] text-slate-400">
                          {f.minCampo > 0 && <span className="text-sky-600 dark:text-sky-400">C {f.minCampo}′</span>}
                          {f.minCampo > 0 && (f.minGimnasio > 0 || f.minOtros > 0) && ' + '}
                          {f.minGimnasio > 0 && <span className="text-violet-600 dark:text-violet-400">G {f.minGimnasio}′</span>}
                          {f.minOtros > 0 && <span> {f.minOtros}′</span>}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className={`px-2 py-2 text-right ${MONO}`}>
                    {f.ua !== null ? (
                      <span className="flex flex-col items-end leading-tight">
                        <span className={`text-sm font-bold ${f.sobrecarga ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>{fmtNum(f.ua)}</span>
                        {f.vsObjetivo !== null && (
                          <span className={`text-[10px] ${f.sobrecarga ? 'font-semibold text-rose-600 dark:text-rose-400' : f.vsObjetivo < 0.8 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>
                            {f.sobrecarga ? '▲ ' : f.vsObjetivo < 0.8 ? '▼ ' : ''}
                            {signo((f.vsObjetivo - 1) * 100, 0)} % obj.
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">–</span>
                    )}
                  </td>
                  <td className={`px-2 py-2 text-right ${MONO}`}>
                    {f.z !== null && f.deltaMedia !== null ? (
                      <span className="flex flex-col items-end leading-tight" title="Desvío respecto de la media del plantel en esta jornada (z-score)">
                        <span className={`font-semibold ${Math.abs(f.z) >= 1.5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>{signo(f.z, 2)} σ</span>
                        <span className="text-[10px] text-slate-400">{signo(f.deltaMedia, 0)} UA</span>
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">–</span>
                    )}
                  </td>
                  <td className={`px-2 py-2 text-right ${MONO}`}>
                    {f.readiness !== null ? (
                      <span className={`font-semibold ${colorReadiness(f.readiness)}`} title="Wellness (Hooper) de la mañana de esa fecha; ≤ 12 crítico, ≤ 15 atención">
                        {f.readiness}<span className="text-[10px] font-normal text-slate-400">/20</span>
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600" title="No completó el wellness de esa fecha">–</span>
                    )}
                  </td>
                  {cronicas && (
                    <td className="px-2 py-2 text-right">
                      {cr && cr.estado !== 'sin-datos' ? (
                        <span className="flex flex-col items-end gap-0.5">
                          <span className={`text-sm font-semibold ${MONO} ${cr.estado === 'provisorio' ? 'text-slate-400' : ''}`}>{fmtNum(cr.acwr, 2)}{cr.estado === 'provisorio' && '*'}</span>
                          <Badge tone={ACWR_TONE[cr.riesgo]}>{ACWR_LABEL[cr.riesgo].split(' (')[0]}</Badge>
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                  )}
                  <td className="max-w-[220px] px-2 py-2">
                    {f.comentario ? (
                      <span className="flex items-start gap-1 text-xs italic text-slate-600 dark:text-slate-300" title={f.comentario}>
                        <MessageSquare size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
                        <span className="line-clamp-2">{f.comentario}</span>
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">–</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {filas.length === 0 && (
              <tr>
                <td colSpan={cronicas ? 9 : 8} className="py-8 text-center text-sm text-slate-400">
                  Ningún jugador cumple el filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-400">
        <b>RPE día</b>: Borg CR-10; el badge pulsa con RPE 9–10 y DOMS intenso o ACWR &gt; 1,5. <b>hab.</b> = media propia del atleta en ese mismo día de la semana (últimas 8 semanas, mínimo 3 registros) y desvío del RPE de hoy contra ella
        (comparación intra-individual, Impellizzeri et al., 2021): un RPE 8 pesa distinto en quien suele reportar 6,5 que en quien suele reportar 8. <AlertTriangle size={11} className="inline text-amber-500" aria-hidden /> = percibió ≥ {UMBRAL_DISCORDANCIA_RPE} puntos de diferencia con el RPE planificado.
        <b> Δ vs plantel</b>: z-score del sRPE entre quienes respondieron esa jornada (con ≥ 3 respuestas). <b>Readiness</b>: Wellness de esa fecha (4 ítems, 5 = óptimo). {cronicas && '* ACWR provisorio (cobertura < 70 %), calculado al cierre de la fecha consultada.'}
      </p>
    </Card>
  )
}
