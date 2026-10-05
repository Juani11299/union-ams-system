import { useMemo, useState } from 'react'
import { Badge } from '@/components/Badge'
import { Card } from '@/components/Card'
import { InfoTooltip } from '@/components/InfoTooltip'
import { calcularCargaEsperadaDia } from '@/features/workload/calculations'
import { adhesionDia, desgloseEsperadoDia, kpisGrupo, tieneAlerta, ultimaFechaConSesion, type ResumenCarga } from '@/features/workload/cargaInterna'
import { formatFechaCorta } from '@/utils/fecha'
import { ACWR_LABEL, ACWR_TONE, ESTADO_BADGE, fmtNum, fmtPct, puntajeAtencion } from './etiquetas'
import { useCargaInterna } from './useCargaInterna'

type Orden = 'atencion' | 'nombre' | 'aguda' | 'acwr' | 'monotonia' | 'strain' | 'variacion'

function Kpi({ titulo, valor, pie, tono, tooltip }: { titulo: string; valor: string; pie?: string; tono?: 'rojo' | 'ambar'; tooltip?: React.ReactNode }) {
  return (
    <Card className={`flex flex-col gap-1 ${tono === 'rojo' ? 'border-rose-300 dark:border-rose-500/40' : tono === 'ambar' ? 'border-amber-300 dark:border-amber-500/40' : ''}`}>
      <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
        {titulo}
        {tooltip}
      </span>
      <span className={`text-2xl font-semibold ${tono === 'rojo' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>{valor}</span>
      {pie && <span className="text-xs text-slate-400">{pie}</span>}
    </Card>
  )
}

/**
 * Vista Colectiva (plantel / división): KPIs del día —carga media, adhesión real
 * al RPE y atletas en alerta—, el desglose Campo + Gimnasio = Carga Total
 * Integrada (esperada vs. ejecutada) y la tabla de control rápido ordenable.
 */
export function VistaColectiva({ onAbrirAtleta }: { onAbrirAtleta: (id: string) => void }) {
  const { athletes, ctx, hoy, planes, resumenes } = useCargaInterna()
  const [orden, setOrden] = useState<{ k: Orden; dir: 1 | -1 }>({ k: 'atencion', dir: -1 })
  const [soloAlerta, setSoloAlerta] = useState(false)

  const lista = useMemo(() => athletes.map((a) => ({ a, r: resumenes.get(a.id) as ResumenCarga })).filter((x) => x.r), [athletes, resumenes])
  const kpis = useMemo(() => kpisGrupo(lista.map((x) => x.r)), [lista])

  // Día de referencia de los KPIs: hoy si hay sesión; si no, la última sesión (un domingo no debería mostrar "0 %").
  const hayHoy = (ctx.planesPorFecha.get(hoy)?.length ?? 0) > 0
  const fechaRef = hayHoy ? hoy : (ultimaFechaConSesion(ctx, hoy) ?? hoy)
  const ids = useMemo(() => athletes.map((a) => a.id), [athletes])
  const dia = useMemo(() => adhesionDia(ctx, ids, fechaRef), [ctx, ids, fechaRef])
  const planesRef = useMemo(() => planes.filter((p) => p.fecha === fechaRef), [planes, fechaRef])
  const esperada = useMemo(() => calcularCargaEsperadaDia(planesRef), [planesRef])
  const desgEsp = useMemo(() => desgloseEsperadoDia(planesRef, esperada), [planesRef, esperada])
  const etiquetaDia = fechaRef === hoy ? 'Hoy' : `Última sesión (${formatFechaCorta(fechaRef)})`

  const ordenada = useMemo(() => {
    const val = (x: { a: { nombre: string }; r: ResumenCarga }, k: Orden): number | string => {
      switch (k) {
        case 'nombre': return x.a.nombre
        case 'aguda': return x.r.aguda
        case 'acwr': return x.r.acwr ?? -1
        case 'monotonia': return x.r.monotonia ?? -1
        case 'strain': return x.r.strain ?? -1
        case 'variacion': return x.r.variacionSemanal ?? -99
        default: return puntajeAtencion(x.r)
      }
    }
    return lista
      .filter((x) => !soloAlerta || tieneAlerta(x.r))
      .sort((x, y) => {
        const a = val(x, orden.k)
        const b = val(y, orden.k)
        const c = typeof a === 'string' ? a.localeCompare(b as string, 'es') : (a as number) - (b as number)
        return (c !== 0 ? c * orden.dir : x.a.nombre.localeCompare(y.a.nombre, 'es'))
      })
  }, [lista, orden, soloAlerta])

  const th = (k: Orden, texto: string, num = true) => (
    <th
      className={`cursor-pointer select-none px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800 dark:text-slate-400 ${num ? 'text-right' : 'text-left'}`}
      onClick={() => setOrden((o) => ({ k, dir: o.k === k ? (-o.dir as 1 | -1) : k === 'nombre' ? 1 : -1 }))}
    >
      {texto}
      {orden.k === k ? (orden.dir > 0 ? ' ▲' : ' ▼') : ''}
    </th>
  )

  if (athletes.length === 0) return <Card className="py-10 text-center text-sm text-slate-500">No hay jugadores cargados para esta categoría en esta temporada.</Card>

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          titulo={`Carga media del grupo · ${etiquetaDia}`}
          valor={kpis.reportaronHoy > 0 || dia.cargaMedia !== null ? `${fmtNum(dia.cargaMedia)} UA` : '—'}
          pie={dia.hubo ? `${dia.reportaron} de ${dia.esperados} jugadores reportaron` : 'Sin sesión planificada'}
        />
        <Kpi
          titulo={`Adhesión al RPE · ${etiquetaDia}`}
          valor={dia.adhesion === null ? '—' : `${Math.round(dia.adhesion * 100)} %`}
          pie={dia.hubo ? `${dia.reportaron}/${dia.esperados} respondieron` : 'Sin sesión planificada'}
          tono={dia.adhesion !== null && dia.adhesion < 0.7 ? 'ambar' : undefined}
          tooltip={<InfoTooltip titulo="Adhesión real" descripcion="Jugadores que mandaron su RPE sobre el total del plantel, para el día de referencia (hoy, o la última sesión si hoy no hay). El estado queda guardado en la base por día civil del club (hora de Buenos Aires): no se reinicia a la tarde ni con la hora UTC." />}
        />
        <Kpi
          titulo="Atletas en alerta"
          valor={String(kpis.enAlerta)}
          pie="ACWR > 1,5 · salto semanal > 15 % · semana monótona (dato confiable)"
          tono={kpis.enAlerta > 0 ? 'rojo' : undefined}
          tooltip={<InfoTooltip titulo="Criterio de alerta" descripcion="Sólo cuentan los jugadores con dato confiable (≥ 70 % de las sesiones planificadas con RPE): ACWR > 1,5 (Gabbett, 2016), incremento de la carga semanal > 15 %, o Monotonía > 2 con carga semanal igual o superior a la crónica (Foster, 1998)." />}
        />
        <Kpi
          titulo="Calidad del dato"
          valor={`${lista.length - kpis.provisorios - lista.filter((x) => x.r.estado === 'sin-datos').length} / ${lista.length}`}
          pie={`${kpis.provisorios} provisorios · ${lista.filter((x) => x.r.estado === 'sin-datos').length} sin datos suficientes`}
          tooltip={<InfoTooltip titulo="Dato confiable" descripcion="ACWR confiable = al menos el 70 % de las sesiones planificadas de los últimos 28 días tienen RPE real. Los días faltantes se imputan con la media propia del jugador (nunca con 0); un jugador con menos cobertura se muestra como provisorio y no dispara alertas." />}
        />
      </div>

      {kpis.rpeSinCarga > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <span aria-hidden>⚠️</span>
          <span>
            <b>{kpis.rpeSinCarga} RPE de los últimos 28 días ({kpis.jugadoresConRpeSinCarga} jugadores) no suman carga</b>: se reportaron en sesiones planificadas a las que todavía les falta el
            "Tiempo Total de Trabajo". Cargándolo en el Planificador esos RPE entran solos al ACWR y la cobertura sube. (Los RPE de días sin sesión planificada ya suman como Campo base de 90 min.)
          </span>
        </div>
      )}

      <Card className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Carga integrada del día · {etiquetaDia}</h3>
          <p className="text-xs text-slate-400">
            Método sRPE de Foster: minutos totales de trabajo × RPE del jugador. Campo y Gimnasio se suman en minutos con un único RPE y se muestran por separado sólo para ver cuánto aporta cada bloque —
            <b> Campo + Gimnasio = Carga Total Integrada</b>, sin factores de atenuación.
          </p>
        </div>
        {!dia.hubo ? (
          <p className="text-sm text-slate-400">No hay sesiones planificadas en el período.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {([
              ['Esperada (plan)', desgEsp.campo, desgEsp.gimnasio, esperada, `${desgEsp.minCampo} min campo · ${desgEsp.minGimnasio} min gimnasio`],
              ['Ejecutada (media del grupo)', dia.desglose?.campo ?? 0, dia.desglose?.gimnasio ?? 0, dia.desglose?.total ?? 0, dia.desglose ? `${dia.reportaron} jugadores con RPE` : 'Todavía nadie reportó'],
            ] as Array<[string, number, number, number, string]>).map(([titulo, campo, gym, total, pie]) => (
              <div key={titulo} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{titulo}</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold text-sky-600">Campo {fmtNum(campo)}</span> + <span className="font-semibold text-violet-600">Gimnasio {fmtNum(gym)}</span> ={' '}
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{fmtNum(total)} UA</span>
                </p>
                {total > 0 && (
                  <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="bg-sky-500" style={{ width: `${(campo / total) * 100}%` }} />
                    <div className="bg-violet-500" style={{ width: `${(gym / total) * 100}%` }} />
                  </div>
                )}
                <p className="mt-1 text-[11px] text-slate-400">{pie}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Control rápido del plantel</h3>
            <p className="text-xs text-slate-400">Click en un encabezado para ordenar. Por defecto: mayor nivel de atención arriba. Click en un jugador para abrir su perfil.</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={soloAlerta} onChange={(e) => setSoloAlerta(e.target.checked)} />
            Sólo atletas en alerta
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {th('nombre', 'Jugador', false)}
                <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                {th('aguda', 'Aguda 7d')}
                {th('acwr', 'ACWR')}
                {th('monotonia', 'Monotonía')}
                {th('strain', 'Strain')}
                {th('variacion', 'Δ semanal')}
                <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">Datos</th>
              </tr>
            </thead>
            <tbody>
              {ordenada.map(({ a, r }) => (
                <tr key={a.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50" onClick={() => onAbrirAtleta(a.id)}>
                  <td className="px-2 py-2 font-medium text-slate-800 dark:text-slate-100">{a.nombre}</td>
                  <td className="px-2 py-2">
                    {r.estado === 'sin-datos' ? (
                      <Badge tone="gray">Sin datos</Badge>
                    ) : (
                      <span className="flex flex-wrap gap-1">
                        <Badge tone={ACWR_TONE[r.riesgo]}>{ACWR_LABEL[r.riesgo].split(' (')[0]}</Badge>
                        {r.spikeSemanal === 'alto' && <Badge tone="red">Spike semanal</Badge>}
                        {r.semanaMonotona && <Badge tone="orange">Monótona</Badge>}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtNum(r.aguda)}</td>
                  <td className={`px-2 py-2 text-right tabular-nums font-semibold ${r.estado === 'provisorio' ? 'text-slate-400' : ''}`}>
                    {r.estado === 'sin-datos' ? '—' : fmtNum(r.acwr, 2)}
                    {r.estado === 'provisorio' && <span title="Dato provisorio">*</span>}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtNum(r.monotonia, 2)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtNum(r.strain)}</td>
                  <td className={`px-2 py-2 text-right tabular-nums ${r.spikeSemanal === 'alto' ? 'font-semibold text-rose-600' : r.spikeSemanal === 'medio' ? 'text-amber-600' : ''}`}>{fmtPct(r.variacionSemanal)}</td>
                  <td className="px-2 py-2 text-right">
                    <span title={r.motivoEstado}>
                      <Badge tone={ESTADO_BADGE[r.estado].tone}>{r.cobertura === null ? ESTADO_BADGE[r.estado].label : `${Math.round(r.cobertura * 100)} %`}</Badge>
                    </span>
                  </td>
                </tr>
              ))}
              {ordenada.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-slate-400">
                    Ningún jugador cumple el filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-400">* Dato provisorio (cobertura &lt; 70 %): se muestra con imputación conservadora pero no dispara alertas. La columna Datos es el % de sesiones planificadas con RPE real en 28 días.</p>
      </Card>
    </div>
  )
}
