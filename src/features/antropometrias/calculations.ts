import type { MedicionAntropo } from './types'

/**
 * Lógica pura del módulo de Antropometrías (sin UI ni store): agrupar
 * mediciones por jugador, comparar la última medición contra la anterior,
 * armar los rankings del análisis grupal y evaluar las reglas clínicas de
 * los Smart Insights. Los cambios de composición (% de grasa y % muscular)
 * se miden en PUNTOS PORCENTUALES (pp) — "el músculo subió de 42,1% a
 * 43,0%" es +0,9 pp — que es como se leen en la práctica; el peso, en kg.
 */

/** Umbral por debajo del cual un cambio de composición se considera ruido/estabilidad (pp). */
export const UMBRAL_ESTABLE_PP = 0.5
/** Pérdida de masa muscular a partir de la cual se dispara la alerta de catabolismo (pp). */
export const UMBRAL_CATABOLISMO_PP = 1
/** Ganancia de masa adiposa a partir de la cual el aumento de peso se considera "graso" (pp). */
export const UMBRAL_GRASA_PP = 1

export function ordenarPorFecha(mediciones: MedicionAntropo[]): MedicionAntropo[] {
  return [...mediciones].sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/** Agrupa por jugador (clave normalizada); cada serie queda ordenada de la más vieja a la más nueva. */
export function agruparPorJugador(mediciones: MedicionAntropo[]): Map<string, MedicionAntropo[]> {
  const mapa = new Map<string, MedicionAntropo[]>()
  for (const m of mediciones) {
    const lista = mapa.get(m.jugadorKey)
    if (lista) lista.push(m)
    else mapa.set(m.jugadorKey, [m])
  }
  for (const [clave, lista] of mapa) mapa.set(clave, ordenarPorFecha(lista))
  return mapa
}

export function categoriasDisponibles(mediciones: MedicionAntropo[]): string[] {
  return Array.from(new Set(mediciones.map((m) => m.categoria))).sort((a, b) => a.localeCompare(b, 'es'))
}

function restar(actual: number | null, previo: number | null): number | null {
  return actual !== null && previo !== null ? actual - previo : null
}

export interface Cambio {
  previa: MedicionAntropo
  actual: MedicionAntropo
  /** kg */
  dPeso: number | null
  /** pp */
  dGrasa: number | null
  /** pp */
  dMusculo: number | null
}

/** Última medición vs. la anterior de una serie ya ordenada. `null` si hay menos de dos. */
export function cambioUltimaVsAnterior(serie: MedicionAntropo[]): Cambio | null {
  if (serie.length < 2) return null
  const previa = serie[serie.length - 2]
  const actual = serie[serie.length - 1]
  return {
    previa,
    actual,
    dPeso: restar(actual.pesoKg, previa.pesoKg),
    dGrasa: restar(actual.grasaPct, previa.grasaPct),
    dMusculo: restar(actual.musculoPct, previa.musculoPct),
  }
}

// -----------------------------------------------------------------------------
// Análisis grupal
// -----------------------------------------------------------------------------

function promedio(valores: Array<number | null>): number | null {
  const presentes = valores.filter((v): v is number => v !== null)
  return presentes.length === 0 ? null : presentes.reduce((s, v) => s + v, 0) / presentes.length
}

export interface KpiGrupal {
  /** Promedio de la ÚLTIMA medición de cada jugador del grupo. */
  valor: number | null
  /** Diferencia contra el promedio de la medición anterior, sólo entre los jugadores que tienen ambas. */
  variacion: number | null
  /** Jugadores con dato para este KPI. */
  n: number
}

export interface EvolucionJugador {
  jugador: string
  jugadorKey: string
  categoria: string
  cambio: Cambio
  /** Recomposición = ganancia muscular + pérdida de grasa (pp). Sólo si hay ambos deltas. */
  puntajeRecomposicion: number | null
  /** Alerta = pérdida muscular + ganancia de grasa (pp). Sólo si hay ambos deltas. */
  puntajeAlerta: number | null
}

export interface AnalisisGrupal {
  jugadores: number
  /** Jugadores con al menos dos mediciones (los que entran a los rankings). */
  conComparativa: number
  ultimaFecha: string | null
  peso: KpiGrupal
  grasa: KpiGrupal
  musculo: KpiGrupal
  mejorRecomposicion: EvolucionJugador[]
  alertas: EvolucionJugador[]
}

function kpi(
  series: MedicionAntropo[][],
  campo: 'pesoKg' | 'grasaPct' | 'musculoPct',
): KpiGrupal {
  const ultimos = series.map((s) => s[s.length - 1][campo])
  const pares = series.filter((s) => s.length >= 2 && s[s.length - 1][campo] !== null && s[s.length - 2][campo] !== null)
  const valor = promedio(ultimos)
  const variacion =
    pares.length === 0
      ? null
      : (promedio(pares.map((s) => s[s.length - 1][campo])) as number) -
        (promedio(pares.map((s) => s[s.length - 2][campo])) as number)
  return { valor, variacion, n: ultimos.filter((v) => v !== null).length }
}

/**
 * Análisis del grupo (las mediciones que le pasen ya vienen filtradas por
 * "AGRUPAR POR"). Los KPIs promedian la situación ACTUAL de cada jugador
 * (su última medición); los rankings comparan última vs. anterior y sólo
 * muestran cambios que superan el umbral de estabilidad — un +0,1 pp no es
 * ni recomposición ni alerta.
 */
export function analizarGrupo(mediciones: MedicionAntropo[], tope = 5): AnalisisGrupal {
  const porJugador = agruparPorJugador(mediciones)
  const series = Array.from(porJugador.values())

  const evoluciones: EvolucionJugador[] = []
  for (const serie of series) {
    const cambio = cambioUltimaVsAnterior(serie)
    if (!cambio) continue
    const { dGrasa, dMusculo } = cambio
    evoluciones.push({
      jugador: cambio.actual.jugador,
      jugadorKey: cambio.actual.jugadorKey,
      categoria: cambio.actual.categoria,
      cambio,
      puntajeRecomposicion: dGrasa !== null && dMusculo !== null ? dMusculo - dGrasa : null,
      puntajeAlerta: dGrasa !== null && dMusculo !== null ? dGrasa - dMusculo : null,
    })
  }

  const mejorRecomposicion = evoluciones
    .filter((e) => e.puntajeRecomposicion !== null && e.puntajeRecomposicion >= UMBRAL_ESTABLE_PP)
    .sort((a, b) => (b.puntajeRecomposicion as number) - (a.puntajeRecomposicion as number))
    .slice(0, tope)
  const alertas = evoluciones
    .filter((e) => e.puntajeAlerta !== null && e.puntajeAlerta >= UMBRAL_ESTABLE_PP)
    .sort((a, b) => (b.puntajeAlerta as number) - (a.puntajeAlerta as number))
    .slice(0, tope)

  return {
    jugadores: series.length,
    conComparativa: evoluciones.length,
    ultimaFecha: mediciones.length ? mediciones.map((m) => m.fecha).sort((a, b) => b.localeCompare(a))[0] : null,
    peso: kpi(series, 'pesoKg'),
    grasa: kpi(series, 'grasaPct'),
    musculo: kpi(series, 'musculoPct'),
    mejorRecomposicion,
    alertas,
  }
}

// -----------------------------------------------------------------------------
// Smart Insights (reglas clínicas para el cuerpo técnico)
// -----------------------------------------------------------------------------

export type SeveridadInsight = 'ideal' | 'alerta' | 'precaucion' | 'estable' | 'info'

export interface Insight {
  id: string
  severidad: SeveridadInsight
  icono: string
  titulo: string
  mensaje: string
}

/**
 * Evalúa las reglas clínicas comparando la última medición contra la
 * anterior. Puede disparar más de una a la vez (ej. catabolismo + aumento
 * de peso graso); van ordenadas por gravedad. Si ninguna regla aplica y los
 * cambios no son despreciables, cae en un aviso neutro de seguimiento.
 *
 * 1. Recomposición óptima — músculo +>0,5 pp Y grasa baja.
 * 2. Alerta de catabolismo — músculo −>1 pp.
 * 3. Aumento de peso negativo — peso sube Y grasa +>1 pp Y músculo se mantiene o baja.
 * 4. Mantenimiento — cambios de composición <0,5 pp.
 */
export function evaluarInsights(cambio: Cambio | null): Insight[] {
  if (!cambio) {
    return [
      {
        id: 'sin-comparativa',
        severidad: 'info',
        icono: 'ℹ️',
        titulo: 'Falta una segunda medición',
        mensaje: 'Hace falta al menos una medición anterior para poder comparar la evolución de este jugador.',
      },
    ]
  }

  const { dPeso, dGrasa, dMusculo } = cambio
  const insights: Insight[] = []

  if (dMusculo !== null && dGrasa !== null && dMusculo > UMBRAL_ESTABLE_PP && dGrasa < 0) {
    insights.push({
      id: 'recomposicion',
      severidad: 'ideal',
      icono: '🟢',
      titulo: 'Recomposición óptima',
      mensaje:
        'Evolución ideal: El jugador aumentó su tejido magro disminuyendo su masa adiposa. Excelente asimilación del entrenamiento de fuerza.',
    })
  }

  if (dMusculo !== null && dMusculo < -UMBRAL_CATABOLISMO_PP) {
    insights.push({
      id: 'catabolismo',
      severidad: 'alerta',
      icono: '🔴',
      titulo: 'Alerta de catabolismo',
      mensaje:
        'Alerta: Pérdida significativa de masa muscular. Revisar ingesta proteica y carga de estrés metabólico (posible sobreentrenamiento).',
    })
  }

  if (
    dPeso !== null &&
    dPeso > 0 &&
    dGrasa !== null &&
    dGrasa > UMBRAL_GRASA_PP &&
    dMusculo !== null &&
    dMusculo <= UMBRAL_ESTABLE_PP
  ) {
    insights.push({
      id: 'peso-graso',
      severidad: 'precaucion',
      icono: '🟡',
      titulo: 'Aumento de peso poco favorable',
      mensaje:
        'Precaución: El aumento de peso reciente se debe principalmente a tejido adiposo. Ajustar balance calórico.',
    })
  }

  if (insights.length === 0) {
    const cambiosComposicion = [dGrasa, dMusculo].filter((d): d is number => d !== null)
    const hayCambios = cambiosComposicion.length > 0
    if (hayCambios && cambiosComposicion.every((d) => Math.abs(d) < UMBRAL_ESTABLE_PP)) {
      insights.push({
        id: 'estabilidad',
        severidad: 'estable',
        icono: '⚪',
        titulo: 'Mantenimiento',
        mensaje: 'Estabilidad: La composición corporal se mantiene en los rangos históricos del jugador.',
      })
    } else {
      insights.push({
        id: 'seguimiento',
        severidad: 'info',
        icono: 'ℹ️',
        titulo: 'Seguimiento',
        mensaje: hayCambios
          ? 'Hubo variaciones moderadas de composición corporal que no cruzan los umbrales clínicos de alerta. Conviene seguir monitoreando en la próxima medición.'
          : 'La última medición no trae % de grasa ni % muscular para comparar con la anterior.',
      })
    }
  }

  const orden: Record<SeveridadInsight, number> = { alerta: 0, precaucion: 1, ideal: 2, estable: 3, info: 4 }
  return insights.sort((a, b) => orden[a.severidad] - orden[b.severidad])
}
