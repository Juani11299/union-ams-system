import { useMemo, useState } from 'react'
import { Card } from '@/components/Card'
import { InfoTooltip } from '@/components/InfoTooltip'
import { calcularCargaEsperadaDia } from '@/features/workload/calculations'
import { adhesionDia, desgloseEsperadoDia, kpisGrupo, type ResumenCarga } from '@/features/workload/cargaInterna'
import { useWellnessEntriesActivas } from '@/store/useAppStore'
import { formatFechaCorta } from '@/utils/fecha'
import { fmtNum } from './etiquetas'
import { ControlRapido } from './ControlRapido'
import { useCargaInterna } from './useCargaInterna'

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
  const wellness = useWellnessEntriesActivas()
  // Fecha consultada: por defecto HOY (día civil del club, ART); se puede auditar cualquier jornada anterior.
  const [fecha, setFecha] = useState(hoy)

  const resumenesLista = useMemo(() => athletes.map((a) => resumenes.get(a.id)).filter((r): r is ResumenCarga => Boolean(r)), [athletes, resumenes])
  const kpis = useMemo(() => kpisGrupo(resumenesLista), [resumenesLista])
  const sinDatos = resumenesLista.filter((r) => r.estado === 'sin-datos').length

  const ids = useMemo(() => athletes.map((a) => a.id), [athletes])
  const dia = useMemo(() => adhesionDia(ctx, ids, fecha), [ctx, ids, fecha])
  const planesRef = useMemo(() => planes.filter((p) => p.fecha === fecha), [planes, fecha])
  const esperada = useMemo(() => calcularCargaEsperadaDia(planesRef), [planesRef])
  const desgEsp = useMemo(() => desgloseEsperadoDia(planesRef, esperada), [planesRef, esperada])
  const etiquetaDia = fecha === hoy ? 'Hoy' : formatFechaCorta(fecha)

  if (athletes.length === 0) return <Card className="py-10 text-center text-sm text-slate-500">No hay jugadores cargados para esta categoría en esta temporada.</Card>

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Kpi
          titulo="Atletas en alerta (a hoy)"
          valor={String(kpis.enAlerta)}
          pie="ACWR > 1,5 · salto semanal > 15 % · semana monótona (dato confiable)"
          tono={kpis.enAlerta > 0 ? 'rojo' : undefined}
          tooltip={<InfoTooltip titulo="Criterio de alerta" descripcion="Sólo cuentan los jugadores con dato confiable (≥ 70 % de las sesiones planificadas con RPE): ACWR > 1,5 (Gabbett, 2016), incremento de la carga semanal > 15 %, o Monotonía > 2 con carga semanal igual o superior a la crónica (Foster, 1998)." />}
        />
        <Kpi
          titulo="Calidad del dato (a hoy)"
          valor={`${resumenesLista.length - kpis.provisorios - sinDatos} / ${resumenesLista.length}`}
          pie={`${kpis.provisorios} provisorios · ${sinDatos} sin datos suficientes`}
          tooltip={<InfoTooltip titulo="Dato confiable" descripcion="ACWR confiable = al menos el 70 % de las sesiones planificadas de los últimos 28 días tienen RPE real. Los días faltantes se imputan con la media propia del jugador (nunca con 0); un jugador con menos cobertura se muestra como provisorio y no dispara alertas." />}
        />
      </div>

      {kpis.rpeSinCarga > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <span aria-hidden>⚠️</span>
          <span>
            <b>{kpis.rpeSinCarga} RPE de los últimos 28 días ({kpis.jugadoresConRpeSinCarga} jugadores) no suman carga</b>: se reportaron en sesiones planificadas a las que todavía les falta el
            "Tiempo Total de Trabajo". Cargándolo en el Planificador esos RPE entran solos al ACWR y la cobertura sube. (Los RPE de días sin sesión planificada ya suman con la base del club: Lun–Vie campo 90 min, sábado partido, domingo 60 min.)
          </span>
        </div>
      )}

      <ControlRapido fecha={fecha} onFecha={setFecha} hoy={hoy} athletes={athletes} ctx={ctx} wellness={wellness} onAbrirAtleta={onAbrirAtleta} />

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

    </div>
  )
}
