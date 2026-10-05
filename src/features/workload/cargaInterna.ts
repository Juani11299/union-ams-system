import type { SessionExecution, SessionPlan } from '@/types'
import { diferenciaDias, fechaHoyLocal, inicioSemanaFecha, sumarDiasFecha } from '@/utils/fecha'
import { baseSinSesion, calcularCargaEjecutadaReal } from './cargaEjecutada'

/**
 * Motor de Carga Interna (Fase 48) — todo en FECHAS CIVILES (YYYY-MM-DD, hora
 * del club) y funciones puras; nada usa `Date` + horas, así no hay forma de que
 * "hoy" cambie a las 21:00 hs ART (= 00:00 UTC) ni de que una ventana de 7/28
 * días pierda o gane un día según la hora en que se mira.
 *
 * Qué resuelve respecto del cálculo anterior:
 *  · ACWR sobre una serie DIARIA continua (descanso = 0 UA conocido, día
 *    planificado sin dato = faltante) en vez de sumar sólo los días con RPE.
 *  · Los faltantes se IMPUTAN de forma conservadora (media de las sesiones
 *    reales del propio jugador en la ventana) y el resultado informa cuánta
 *    cobertura real hay. Antes se exigían 21 días DISTINTOS de reporte en 28
 *    — con un microciclo de 5 sesiones por semana eso casi nadie lo alcanza y
 *    el ACWR quedaba en "Calibrando" para siempre.
 *  · ACWR por promedios móviles (RA, Gabbett 2016) y por EWMA (Williams et al.
 *    2017), Monotonía y Tensión de Foster (1998) y variación semanal.
 *
 * Método de carga del día (NO cambia): sRPE = RPE del jugador × minutos totales
 * de trabajo (Foster) — Campo + Gimnasio comparten el mismo RPE y los minutos
 * se suman, SIN factores de atenuación. El desglose Campo/Gimnasio es la parte
 * proporcional a los minutos de cada bloque, así que Campo + Gimnasio = Total.
 */

export const VENTANA_AGUDA = 7
export const VENTANA_CRONICA = 28
/** Cobertura mínima (días planificados con dato real / días planificados) para considerar el ACWR "confiable". */
export const COBERTURA_MINIMA = 0.7
/** Mínimo de días con dato real en la ventana crónica para mostrar un ACWR (aunque sea provisorio). */
export const MIN_DIAS_REALES_PROVISORIO = 4
export const LAMBDA_AGUDA = 2 / (VENTANA_AGUDA + 1)
export const LAMBDA_CRONICA = 2 / (VENTANA_CRONICA + 1)
export const UMBRAL_SPIKE_SEMANAL_ALTO = 0.15
export const UMBRAL_SPIKE_SEMANAL_MEDIO = 0.1

// ─────────────────────────────────────────────────────────────────────────────
// Desglose de la carga de un día (Campo + Gimnasio = Total integrado)
// ─────────────────────────────────────────────────────────────────────────────

export interface DesgloseCarga {
  campo: number
  gimnasio: number
  partido: number
  otros: number
  /** campo + gimnasio + partido + otros — coincide con `calcularCargaEjecutadaReal`. */
  total: number
  minCampo: number
  minGimnasio: number
  minPartido: number
  minOtros: number
  rpe: number
  /** Día sin sesión planificada: se aplicó la base del club por día de la semana (ver `baseSinSesion`). */
  baseClub?: boolean
  /** Texto para mostrar de la base aplicada, ej. "Campo (Base 90m)" o "Partido (70m estándar de la categoría)". */
  baseEtiqueta?: string
}

/**
 * Carga ejecutada de UN jugador en UN día, separada por tipo de sesión. Misma
 * regla que `calcularCargaEjecutadaReal` (el RPE único del jugador × los minutos
 * de cada sesión; el Partido usa sus minutos individuales), por eso la suma de
 * las partes es exactamente el total. `null` si el día no es calculable todavía
 * (sin plan o sin "Tiempo Total de Trabajo" cargado).
 */
export function desgloseEjecucion(ejecucion: SessionExecution, planesDelDia: SessionPlan[]): DesgloseCarga | null {
  const total = calcularCargaEjecutadaReal(ejecucion, planesDelDia)
  if (total === null) return null
  const d: DesgloseCarga = { campo: 0, gimnasio: 0, partido: 0, otros: 0, total, minCampo: 0, minGimnasio: 0, minPartido: 0, minOtros: 0, rpe: ejecucion.rpe }
  if (planesDelDia.length === 0) {
    // Sin sesión planificada → base del club según el día (Lun–Vie campo 90′ · Sáb partido · Dom 60′); ver `baseSinSesion`.
    const b = baseSinSesion(ejecucion)
    return b.tipo === 'partido'
      ? { ...d, partido: total, minPartido: b.minutos, baseClub: true, baseEtiqueta: b.etiqueta }
      : { ...d, campo: total, minCampo: b.minutos, baseClub: true, baseEtiqueta: b.etiqueta }
  }
  const partido = planesDelDia.find((p) => p.tipo === 'Partido')
  if (partido) {
    d.partido = total
    d.minPartido = ejecucion.duracionMin
    return d
  }
  for (const p of planesDelDia) {
    if (p.duracionRealMin === undefined) continue
    const ua = ejecucion.rpe * p.duracionRealMin
    if (p.tipo === 'Campo') [d.campo, d.minCampo] = [d.campo + ua, d.minCampo + p.duracionRealMin]
    else if (p.tipo === 'Gimnasio') [d.gimnasio, d.minGimnasio] = [d.gimnasio + ua, d.minGimnasio + p.duracionRealMin]
    else [d.otros, d.minOtros] = [d.otros + ua, d.minOtros + p.duracionRealMin]
  }
  return d
}

// ─────────────────────────────────────────────────────────────────────────────
// Contexto indexado (una sola pasada por los arrays del store)
// ─────────────────────────────────────────────────────────────────────────────

export interface ContextoCarga {
  planesPorFecha: Map<string, SessionPlan[]>
  ejecucionesPorAtleta: Map<string, Map<string, SessionExecution[]>>
  /** Primera y última fecha con datos (planes o ejecuciones). */
  primeraFecha: string | null
}

let cacheContexto: { ejecuciones: SessionExecution[]; planes: SessionPlan[]; ctx: ContextoCarga } | null = null

/** Indexa planes y ejecuciones por fecha / atleta. Cachea por identidad de los arrays (los del store son estables entre renders). */
export function construirContexto(ejecuciones: SessionExecution[], planes: SessionPlan[]): ContextoCarga {
  if (cacheContexto && cacheContexto.ejecuciones === ejecuciones && cacheContexto.planes === planes) return cacheContexto.ctx
  const planesPorFecha = new Map<string, SessionPlan[]>()
  for (const p of planes) {
    const arr = planesPorFecha.get(p.fecha)
    if (arr) arr.push(p)
    else planesPorFecha.set(p.fecha, [p])
  }
  const ejecucionesPorAtleta = new Map<string, Map<string, SessionExecution[]>>()
  let primeraFecha: string | null = null
  const ver = (f: string) => {
    if (primeraFecha === null || f < primeraFecha) primeraFecha = f
  }
  for (const e of ejecuciones) {
    let porFecha = ejecucionesPorAtleta.get(e.athleteId)
    if (!porFecha) ejecucionesPorAtleta.set(e.athleteId, (porFecha = new Map()))
    const arr = porFecha.get(e.fecha)
    if (arr) arr.push(e)
    else porFecha.set(e.fecha, [e])
    ver(e.fecha)
  }
  for (const f of planesPorFecha.keys()) ver(f)
  const ctx: ContextoCarga = { planesPorFecha, ejecucionesPorAtleta, primeraFecha }
  cacheContexto = { ejecuciones, planes, ctx }
  return ctx
}

// ─────────────────────────────────────────────────────────────────────────────
// Serie diaria de un atleta
// ─────────────────────────────────────────────────────────────────────────────

export type OrigenDia = 'real' | 'base-club' | 'descanso' | 'imputado' | 'faltante' | 'partido-sin-minutos'

export interface DiaCarga {
  fecha: string
  /** UA que entran a los cálculos (real o imputada; 0 en descanso / faltante sin base para imputar). */
  carga: number
  origen: OrigenDia
  /** Había al menos una sesión planificada ese día. */
  planificado: boolean
  rpe: number | null
  desglose: DesgloseCarga | null
  /** El jugador mandó un RPE ese día pero no se pudo convertir en UA (la sesión planificada todavía no tiene el Tiempo Total de Trabajo). */
  rpeSinCarga?: boolean
}

function dosSesionesDeEntrenamiento(planes: SessionPlan[]): boolean {
  return planes.some((p) => p.tipo !== 'Partido')
}

/**
 * Serie diaria CONTINUA de `dias` días que termina en `hasta` (inclusive).
 * Reglas por día:
 *  · carga real calculable → `real`;
 *  · sin sesión planificada → `descanso` (0 UA, dato conocido);
 *  · día de Partido sin minutos del jugador → 0 (no jugó; no se imputa: los
 *    minutos de partido son individuales y suponerlos inflaría la carga);
 *  · sesión de entrenamiento planificada pero sin dato del jugador → `faltante`,
 *    que se IMPUTA con la media de las sesiones reales del propio jugador en la
 *    ventana (conservador: ni 0 —que hundiría el denominador crónico e inflaría
 *    el ACWR— ni un valor inventado por encima de lo que él mismo reportó).
 */
export function serieDiariaAtleta(ctx: ContextoCarga, athleteId: string, hasta: string, dias: number): DiaCarga[] {
  const propias = ctx.ejecucionesPorAtleta.get(athleteId)
  const base: DiaCarga[] = []
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = sumarDiasFecha(hasta, -i)
    const planes = ctx.planesPorFecha.get(fecha) ?? []
    const ejecs = propias?.get(fecha) ?? []
    const planificado = planes.length > 0
    let real: number | null = null
    let desglose = null as DesgloseCarga | null
    let rpe: number | null = null
    for (const e of ejecs) {
      const d = desgloseEjecucion(e, planes)
      if (d === null) continue
      real = (real ?? 0) + d.total
      rpe = e.rpe
      desglose = desglose
        ? { ...desglose, campo: desglose.campo + d.campo, gimnasio: desglose.gimnasio + d.gimnasio, partido: desglose.partido + d.partido, otros: desglose.otros + d.otros, total: desglose.total + d.total, minCampo: desglose.minCampo + d.minCampo, minGimnasio: desglose.minGimnasio + d.minGimnasio, minPartido: desglose.minPartido + d.minPartido, minOtros: desglose.minOtros + d.minOtros }
        : d
    }
    const rpeReportado = ejecs.length > 0 ? ejecs[ejecs.length - 1].rpe : null
    // RPE en un día SIN sesión planificada: entrenó igual → base del club según el día (Lun–Vie 90′ · Sáb partido · Dom 60′).
    if (real !== null) base.push({ fecha, carga: real, origen: planificado ? 'real' : 'base-club', planificado, rpe, desglose })
    else if (!planificado) base.push({ fecha, carga: 0, origen: 'descanso', planificado, rpe: null, desglose: null })
    else if (!dosSesionesDeEntrenamiento(planes)) base.push({ fecha, carga: 0, origen: 'partido-sin-minutos', planificado, rpe: null, desglose: null })
    else base.push({ fecha, carga: 0, origen: 'faltante', planificado, rpe: rpeReportado, desglose: null, rpeSinCarga: rpeReportado !== null })
  }
  const reales = base.filter((d) => (d.origen === 'real' || d.origen === 'base-club') && d.carga > 0)
  const mediaReal = reales.length > 0 ? reales.reduce((s, d) => s + d.carga, 0) / reales.length : null
  if (mediaReal === null) return base
  return base.map((d) => (d.origen === 'faltante' ? { ...d, carga: mediaReal, origen: 'imputado' as const } : d))
}

// ─────────────────────────────────────────────────────────────────────────────
// ACWR (RA + EWMA), Monotonía, Strain
// ─────────────────────────────────────────────────────────────────────────────

export type NivelAcwr = 'bajo' | 'optimo' | 'precaucion' | 'alto' | 'sin-datos'

/** Cortes de Gabbett (2016): < 0.8 subentrenamiento · 0.8–1.3 zona óptima · 1.3–1.5 precaución · > 1.5 zona de riesgo (spike). */
export function clasificarAcwr(acwr: number | null): NivelAcwr {
  if (acwr === null) return 'sin-datos'
  if (acwr < 0.8) return 'bajo'
  if (acwr <= 1.3) return 'optimo'
  if (acwr <= 1.5) return 'precaucion'
  return 'alto'
}

export type EstadoDato = 'confiable' | 'provisorio' | 'sin-datos'

export interface ResumenCarga {
  athleteId: string
  hasta: string
  /** Carga aguda: suma de los últimos 7 días (UA). */
  aguda: number
  /** Carga crónica: promedio semanal de los últimos 28 días (UA/semana). */
  cronica: number
  /** ACWR por promedios móviles (aguda / crónica). */
  acwr: number | null
  riesgo: NivelAcwr
  /** ACWR por EWMA (λ = 2/(N+1)), robusto a baches de datos. */
  acwrEwma: number | null
  riesgoEwma: NivelAcwr
  ewmaAguda: number
  ewmaCronica: number
  /** Días planificados con dato real / días de entrenamiento planificados (ventana de 28 días). */
  cobertura: number | null
  diasReales: number
  diasPlanificados: number
  diasImputados: number
  estado: EstadoDato
  /** Explicación corta de por qué el dato es provisorio o falta. */
  motivoEstado: string
  /** Monotonía de Foster de los últimos 7 días (media / desvío) y Tensión (carga semanal × monotonía). */
  monotonia: number | null
  strain: number | null
  /** Variación de la carga de los últimos 7 días respecto de los 7 anteriores (0.12 = +12 %). */
  variacionSemanal: number | null
  /** 'alto' > 15 %, 'medio' 10–15 %, 'ok' en otro caso. */
  spikeSemanal: 'alto' | 'medio' | 'ok' | null
  /** Semana monótona de riesgo: monotonía > 2 con carga semanal igual o superior a la crónica. */
  semanaMonotona: boolean
  /** Días de la ventana de 28 con RPE reportado que NO suman carga (sesión planificada sin "Tiempo Total de Trabajo"). */
  rpeSinCarga: number
  reportoHoy: boolean
  /** Había sesión de entrenamiento planificada en `hasta`. */
  sesionHoy: boolean
  hoy: DiaCarga | null
  serie: DiaCarga[]
}

function ewma(valores: number[], lambda: number): number[] {
  if (valores.length === 0) return []
  // Semilla: media de la primera semana (evita arrancar en 0 o en un día de descanso suelto).
  const semilla = valores.slice(0, 7).reduce((s, v) => s + v, 0) / Math.min(7, valores.length)
  const out: number[] = []
  let prev = semilla
  for (const v of valores) {
    prev = lambda * v + (1 - lambda) * prev
    out.push(prev)
  }
  return out
}

/** Monotonía (media / desvío poblacional de los 7 días) — misma definición que `calcularMonotonia`. */
export function monotoniaDe(cargas7: number[]): number | null {
  if (cargas7.length === 0) return null
  const media = cargas7.reduce((s, v) => s + v, 0) / cargas7.length
  if (media === 0) return null
  const sd = Math.sqrt(cargas7.reduce((s, v) => s + (v - media) ** 2, 0) / cargas7.length)
  return sd === 0 ? 99 : Number((media / sd).toFixed(2))
}

/** ACWR-RA, EWMA, cobertura y métricas de Foster de un atleta al cierre de `hasta`. */
export function resumenCarga(ctx: ContextoCarga, athleteId: string, hasta: string = fechaHoyLocal()): ResumenCarga {
  // 56 días: los 28 de la ventana más otros 28 de "calentamiento" del EWMA.
  const larga = serieDiariaAtleta(ctx, athleteId, hasta, VENTANA_CRONICA * 2)
  const serie = larga.slice(-VENTANA_CRONICA)
  const ultimos7 = serie.slice(-VENTANA_AGUDA)
  const previos7 = serie.slice(-VENTANA_AGUDA * 2, -VENTANA_AGUDA)

  const aguda = ultimos7.reduce((s, d) => s + d.carga, 0)
  const cronica = serie.reduce((s, d) => s + d.carga, 0) / 4
  const acwr = cronica > 0 ? aguda / cronica : null

  const cargasLarga = larga.map((d) => d.carga)
  const ea = ewma(cargasLarga, LAMBDA_AGUDA)
  const ec = ewma(cargasLarga, LAMBDA_CRONICA)
  const ewmaAguda = ea[ea.length - 1] ?? 0
  const ewmaCronica = ec[ec.length - 1] ?? 0
  const acwrEwma = ewmaCronica > 0 ? ewmaAguda / ewmaCronica : null

  // Días de entrenamiento conocidos: los planificados + los que el propio jugador reportó sin sesión planificada
  // (Campo base del club). Estos últimos suman al numerador Y al denominador: son días en que se entrenó seguro.
  const planificados = serie.filter((d) => d.origen === 'base-club' || (d.planificado && d.origen !== 'partido-sin-minutos' && d.origen !== 'descanso'))
  const diasPlanificados = planificados.length
  const diasReales = serie.filter((d) => d.origen === 'base-club' || (d.origen === 'real' && d.planificado)).length
  const diasImputados = serie.filter((d) => d.origen === 'imputado').length
  const cobertura = diasPlanificados > 0 ? diasReales / diasPlanificados : null
  const conReal = serie.filter((d) => (d.origen === 'real' || d.origen === 'base-club') && d.carga > 0).length

  let estado: EstadoDato
  let motivoEstado: string
  if (acwr === null || conReal < MIN_DIAS_REALES_PROVISORIO) {
    estado = 'sin-datos'
    motivoEstado = `Hace falta un mínimo de ${MIN_DIAS_REALES_PROVISORIO} sesiones con RPE en los últimos 28 días (hay ${conReal}).`
  } else if (cobertura !== null && cobertura >= COBERTURA_MINIMA) {
    estado = 'confiable'
    motivoEstado = `${Math.round(cobertura * 100)} % de las sesiones planificadas tienen RPE${diasImputados > 0 ? ` (${diasImputados} día(s) imputados con la media propia)` : ''}.`
  } else {
    estado = 'provisorio'
    motivoEstado = `Sólo ${cobertura === null ? 0 : Math.round(cobertura * 100)} % de las sesiones planificadas tienen RPE (mínimo ${Math.round(COBERTURA_MINIMA * 100)} % para ser confiable); el resto se imputó con la media propia.`
  }

  const mono = monotoniaDe(ultimos7.map((d) => d.carga))
  const strain = mono === null ? null : Math.round(aguda * mono)
  const cargaPrev = previos7.reduce((s, d) => s + d.carga, 0)
  const variacionSemanal = cargaPrev > 0 ? aguda / cargaPrev - 1 : null
  const spikeSemanal = variacionSemanal === null ? null : variacionSemanal > UMBRAL_SPIKE_SEMANAL_ALTO ? 'alto' : variacionSemanal > UMBRAL_SPIKE_SEMANAL_MEDIO ? 'medio' : 'ok'

  const hoy = serie[serie.length - 1] ?? null
  return {
    athleteId, hasta, aguda, cronica, acwr, riesgo: clasificarAcwr(acwr), acwrEwma, riesgoEwma: clasificarAcwr(acwrEwma), ewmaAguda, ewmaCronica,
    cobertura, diasReales, diasPlanificados, diasImputados, estado, motivoEstado,
    monotonia: mono, strain, variacionSemanal, spikeSemanal,
    semanaMonotona: mono !== null && mono > 2 && aguda >= cronica,
    rpeSinCarga: serie.filter((d) => d.rpeSinCarga).length,
    reportoHoy: hoy?.origen === 'real' || hoy?.origen === 'base-club' || hoy?.rpeSinCarga === true,
    sesionHoy: hoy !== null && hoy.planificado && hoy.origen !== 'partido-sin-minutos' && hoy.origen !== 'descanso',
    hoy,
    serie,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Historial longitudinal (barras de carga + curvas aguda / crónica)
// ─────────────────────────────────────────────────────────────────────────────

export type RangoHistorial = '7d' | '4s' | 'temporada'

export interface PuntoHistorial {
  /** Clave del eje X: día (YYYY-MM-DD) o lunes de la semana. */
  fecha: string
  etiqueta: string
  /** Barras: carga del día (o suma de la semana) en UA. */
  carga: number
  campo: number
  gimnasio: number
  partido: number
  /** Líneas (UA/semana): carga aguda (suma 7d) y crónica (promedio semanal 28d) al cierre del período. */
  aguda: number
  cronica: number
  acwr: number | null
  /** Cantidad de jugadores que aportaron dato (vista de grupo). */
  n: number
}

interface DiaEquipo {
  fecha: string
  carga: number
  campo: number
  gimnasio: number
  partido: number
  aguda: number
  cronica: number
  n: number
}

/**
 * Serie histórica de un jugador o del promedio del grupo. Las curvas aguda y
 * crónica se calculan SIEMPRE día a día sobre la serie imputada; el rango
 * decide sólo cómo se agrupan las barras (por día hasta 4 semanas, por semana
 * en la temporada completa). Con `athleteIds` de varios jugadores la carga es
 * la MEDIA del grupo (UA por jugador), no la suma.
 */
export function historialCarga(ctx: ContextoCarga, athleteIds: string[], hasta: string, rango: RangoHistorial): PuntoHistorial[] {
  const primera = ctx.primeraFecha ?? hasta
  const diasTemporada = Math.max(VENTANA_CRONICA, diferenciaDias(hasta, primera) + 1)
  const dias = rango === '7d' ? 7 : rango === '4s' ? 28 : Math.min(diasTemporada, 365)
  const visibles = dias
  const total = visibles + VENTANA_CRONICA // calentamiento para que el primer punto ya tenga su ventana crónica

  const porAtleta = athleteIds.map((id) => serieDiariaAtleta(ctx, id, hasta, total))
  const dEq: DiaEquipo[] = []
  for (let i = 0; i < total; i++) {
    let carga = 0
    let campo = 0
    let gimnasio = 0
    let partido = 0
    let n = 0
    for (const s of porAtleta) {
      const d = s[i]
      carga += d.carga
      if ((d.origen === 'real' || d.origen === 'base-club') && d.desglose) {
        campo += d.desglose.campo
        gimnasio += d.desglose.gimnasio
        partido += d.desglose.partido
        n++
      }
    }
    const k = Math.max(athleteIds.length, 1)
    dEq.push({ fecha: porAtleta[0]?.[i].fecha ?? sumarDiasFecha(hasta, i - total + 1), carga: carga / k, campo: campo / k, gimnasio: gimnasio / k, partido: partido / k, aguda: 0, cronica: 0, n })
  }
  for (let i = 0; i < total; i++) {
    const a = dEq.slice(Math.max(0, i - VENTANA_AGUDA + 1), i + 1).reduce((s, d) => s + d.carga, 0)
    const c = dEq.slice(Math.max(0, i - VENTANA_CRONICA + 1), i + 1).reduce((s, d) => s + d.carga, 0) / 4
    dEq[i].aguda = a
    dEq[i].cronica = c
  }
  const vis = dEq.slice(VENTANA_CRONICA)

  const etiquetaDia = (f: string) => `${f.slice(8, 10)}/${f.slice(5, 7)}`
  if (rango !== 'temporada') {
    return vis.map((d) => ({ fecha: d.fecha, etiqueta: etiquetaDia(d.fecha), carga: d.carga, campo: d.campo, gimnasio: d.gimnasio, partido: d.partido, aguda: d.aguda, cronica: d.cronica, acwr: d.cronica > 0 ? d.aguda / d.cronica : null, n: d.n }))
  }
  // Temporada: barras semanales (suma de la semana), curvas al último día de cada semana.
  const semanas = new Map<string, DiaEquipo[]>()
  for (const d of vis) {
    const k = inicioSemanaFecha(d.fecha)
    const arr = semanas.get(k)
    if (arr) arr.push(d)
    else semanas.set(k, [d])
  }
  return [...semanas.entries()].map(([lunes, ds]) => {
    const ult = ds[ds.length - 1]
    const suma = (k: 'carga' | 'campo' | 'gimnasio' | 'partido') => ds.reduce((s, d) => s + d[k], 0)
    return { fecha: lunes, etiqueta: `Sem ${etiquetaDia(lunes)}`, carga: suma('carga'), campo: suma('campo'), gimnasio: suma('gimnasio'), partido: suma('partido'), aguda: ult.aguda, cronica: ult.cronica, acwr: ult.cronica > 0 ? ult.aguda / ult.cronica : null, n: Math.max(...ds.map((d) => d.n)) }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Vista colectiva
// ─────────────────────────────────────────────────────────────────────────────

export interface KpisGrupo {
  jugadores: number
  /** Jugadores que ya mandaron su RPE hoy. */
  reportaronHoy: number
  /** Si hoy hay sesión de entrenamiento planificada. */
  hayEntrenoHoy: boolean
  adhesionHoy: number | null
  /** Carga media de hoy (UA) sobre quienes reportaron. */
  cargaMediaHoy: number | null
  /** Jugadores en alerta: ACWR > 1.5 (dato confiable), monotonía alta con carga semanal ≥ crónica, o salto semanal > 15 %. */
  enAlerta: number
  provisorios: number
  cargaMediaSemana: number | null
  /** RPE de los últimos 28 días que no suman carga (suma de todos los jugadores) y cuántos jugadores los tienen. */
  rpeSinCarga: number
  jugadoresConRpeSinCarga: number
  /** Desglose medio de hoy entre quienes reportaron. */
  desgloseHoy: { campo: number; gimnasio: number; partido: number; total: number } | null
}

export function tieneAlerta(r: ResumenCarga): boolean {
  if (r.estado === 'sin-datos') return false
  const acwrAlto = r.estado === 'confiable' && (r.riesgo === 'alto' || r.riesgoEwma === 'alto')
  const spike = r.estado === 'confiable' && r.spikeSemanal === 'alto'
  return acwrAlto || spike || (r.estado === 'confiable' && r.semanaMonotona)
}

export function kpisGrupo(resumenes: ResumenCarga[]): KpisGrupo {
  const n = resumenes.length
  const hayEntrenoHoy = resumenes.some((r) => r.sesionHoy)
  const reportan = resumenes.filter((r) => r.reportoHoy)
  const conSesion = resumenes.filter((r) => r.sesionHoy).length
  const media = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null)
  const des = reportan.map((r) => r.hoy?.desglose).filter((d): d is DesgloseCarga => !!d)
  return {
    jugadores: n,
    reportaronHoy: reportan.length,
    hayEntrenoHoy,
    adhesionHoy: conSesion > 0 ? reportan.length / n : null,
    cargaMediaHoy: media(reportan.map((r) => r.hoy?.carga ?? 0)),
    enAlerta: resumenes.filter(tieneAlerta).length,
    provisorios: resumenes.filter((r) => r.estado === 'provisorio').length,
    cargaMediaSemana: media(resumenes.filter((r) => r.estado !== 'sin-datos').map((r) => r.aguda)),
    rpeSinCarga: resumenes.reduce((s, r) => s + r.rpeSinCarga, 0),
    jugadoresConRpeSinCarga: resumenes.filter((r) => r.rpeSinCarga > 0).length,
    desgloseHoy: des.length ? { campo: media(des.map((d) => d.campo)) ?? 0, gimnasio: media(des.map((d) => d.gimnasio)) ?? 0, partido: media(des.map((d) => d.partido)) ?? 0, total: media(des.map((d) => d.total)) ?? 0 } : null,
  }
}

/** Z-score y Δ de un jugador contra la media/DE de su grupo (de una métrica cualquiera). */
export function zContraGrupo(valor: number, grupo: number[]): { z: number | null; delta: number; media: number } {
  const media = grupo.length ? grupo.reduce((s, v) => s + v, 0) / grupo.length : 0
  const sd = grupo.length > 1 ? Math.sqrt(grupo.reduce((s, v) => s + (v - media) ** 2, 0) / (grupo.length - 1)) : 0
  return { z: sd > 0 ? (valor - media) / sd : null, delta: valor - media, media }
}

/** Carga esperada del día desglosada en Campo / Gimnasio proporcionalmente a los minutos (Campo + Gimnasio = Total integrado, Foster). */
export function desgloseEsperadoDia(planesDelDia: SessionPlan[], totalEsperado: number): { campo: number; gimnasio: number; otros: number; minCampo: number; minGimnasio: number } {
  const minCampo = planesDelDia.filter((p) => p.tipo === 'Campo').reduce((s, p) => s + p.duracionEstimadaMin, 0)
  const minGimnasio = planesDelDia.filter((p) => p.tipo === 'Gimnasio').reduce((s, p) => s + p.duracionEstimadaMin, 0)
  const minTotal = planesDelDia.reduce((s, p) => s + p.duracionEstimadaMin, 0)
  if (minTotal <= 0) return { campo: 0, gimnasio: 0, otros: totalEsperado, minCampo, minGimnasio }
  const porMin = (m: number) => Math.round((totalEsperado * m) / minTotal)
  const campo = porMin(minCampo)
  const gimnasio = porMin(minGimnasio)
  return { campo, gimnasio, otros: totalEsperado - campo - gimnasio, minCampo, minGimnasio }
}

// ─────────────────────────────────────────────────────────────────────────────
// Adhesión de un día concreto (KPIs de la vista colectiva)
// ─────────────────────────────────────────────────────────────────────────────

/** Última fecha ≤ `hasta` con una sesión planificada (de cualquier tipo), o null. */
export function ultimaFechaConSesion(ctx: ContextoCarga, hasta: string): string | null {
  let mejor: string | null = null
  for (const [fecha, planes] of ctx.planesPorFecha) {
    if (fecha <= hasta && planes.length > 0 && (mejor === null || fecha > mejor)) mejor = fecha
  }
  return mejor
}

export interface AdhesionDia {
  fecha: string
  /** Hay sesión planificada ese día. */
  hubo: boolean
  esperados: number
  reportaron: number
  /** reportaron / esperados (null si no hubo sesión). */
  adhesion: number | null
  /** Carga media (UA) entre quienes reportaron. */
  cargaMedia: number | null
  desglose: { campo: number; gimnasio: number; partido: number; otros: number; total: number } | null
}

/** Cuántos de `athleteIds` mandaron su RPE el día `fecha` y cuánto cargaron en promedio, con el desglose Campo + Gimnasio = Total. */
export function adhesionDia(ctx: ContextoCarga, athleteIds: string[], fecha: string): AdhesionDia {
  const planes = ctx.planesPorFecha.get(fecha) ?? []
  const desgloses: DesgloseCarga[] = []
  for (const id of athleteIds) {
    for (const e of ctx.ejecucionesPorAtleta.get(id)?.get(fecha) ?? []) {
      const d = desgloseEjecucion(e, planes)
      if (d) desgloses.push(d)
    }
  }
  const media = (k: 'campo' | 'gimnasio' | 'partido' | 'otros' | 'total') => (desgloses.length ? desgloses.reduce((s, d) => s + d[k], 0) / desgloses.length : 0)
  const reportaron = new Set(athleteIds.filter((id) => (ctx.ejecucionesPorAtleta.get(id)?.get(fecha) ?? []).length > 0)).size
  const hubo = planes.length > 0
  return {
    fecha,
    hubo,
    esperados: athleteIds.length,
    reportaron,
    adhesion: hubo && athleteIds.length > 0 ? reportaron / athleteIds.length : null,
    cargaMedia: desgloses.length ? media('total') : null,
    desglose: desgloses.length ? { campo: media('campo'), gimnasio: media('gimnasio'), partido: media('partido'), otros: media('otros'), total: media('total') } : null,
  }
}
