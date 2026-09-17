import type { Athlete, PerformanceEvaluation } from '@/types'

/**
 * Motor de cálculo del módulo de Evaluaciones de Rendimiento (Fase 38) —
 * separado de la UI a propósito (son funciones puras, testeables sin
 * montar ningún componente). Cubre: comparativa actual/anterior, KPIs
 * grupales, series temporales con tendencia, rankings Top 5, normalización
 * Min-Max para el Radar individual, y el motor de reglas de "Smart
 * Analysis".
 */

// ---------------------------------------------------------------------------
// Helpers numéricos
// ---------------------------------------------------------------------------

export function promedio(valores: number[]): number {
  if (valores.length === 0) return 0
  return valores.reduce((s, v) => s + v, 0) / valores.length
}

/** "Asimetria_RSI", "Asym_Force", "Imbalance_pct" → true. En estas métricas MENOS es mejor, al revés que el resto (mismo criterio que el dashboard anterior, Fase 33.2). */
export function esMetricaAsimetria(metrica: string): boolean {
  const clave = metrica
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  return clave.includes('asimetria') || clave.includes('asym') || clave.includes('imbalance')
}

/**
 * Regresión lineal simple (mínimos cuadrados) sobre el ÍNDICE de la serie
 * (0, 1, 2, ...), no sobre la fecha real — alcanza para dibujar una línea
 * de tendencia visual, no hace falta ponderar por espaciado real entre
 * evaluaciones (que además suelen ser irregulares).
 */
export function calcularTendenciaLineal(valores: number[]): { pendiente: number; intercepto: number } {
  const n = valores.length
  if (n < 2) return { pendiente: 0, intercepto: valores[0] ?? 0 }
  const xs = valores.map((_, i) => i)
  const mediaX = promedio(xs)
  const mediaY = promedio(valores)
  let numerador = 0
  let denominador = 0
  for (let i = 0; i < n; i++) {
    numerador += (xs[i] - mediaX) * (valores[i] - mediaY)
    denominador += (xs[i] - mediaX) ** 2
  }
  const pendiente = denominador === 0 ? 0 : numerador / denominador
  const intercepto = mediaY - pendiente * mediaX
  return { pendiente, intercepto }
}

// ---------------------------------------------------------------------------
// Análisis Grupal
// ---------------------------------------------------------------------------

/**
 * Agrupa las evaluaciones (ya filtradas por `evaluationName` + categoría)
 * por fecha y devuelve las filas de las DOS fechas más recientes —
 * "actual" y "anterior". Si sólo hay una fecha, `anterior` viene vacío (no
 * hay con qué comparar todavía).
 */
export function separarActualYAnterior(evaluaciones: PerformanceEvaluation[]): {
  actual: PerformanceEvaluation[]
  anterior: PerformanceEvaluation[]
  fechaActual: string | null
  fechaAnterior: string | null
} {
  const fechasUnicas = Array.from(new Set(evaluaciones.map((e) => e.fecha))).sort((a, b) => b.localeCompare(a))
  const fechaActual = fechasUnicas[0] ?? null
  const fechaAnterior = fechasUnicas[1] ?? null
  return {
    actual: fechaActual ? evaluaciones.filter((e) => e.fecha === fechaActual) : [],
    anterior: fechaAnterior ? evaluaciones.filter((e) => e.fecha === fechaAnterior) : [],
    fechaActual,
    fechaAnterior,
  }
}

export interface KpisGrupales {
  promedioActual: number | null
  mejorValor: number | null
  peorValor: number | null
  /** Promedio actual vs. promedio de la evaluación anterior del mismo tipo — `null` si no hay anterior. */
  porcentajeMejoraGrupal: number | null
  cantidadJugadores: number
}

export function calcularKpisGrupales(
  actual: PerformanceEvaluation[],
  anterior: PerformanceEvaluation[],
  metrica: string,
  invertirLogica = false,
): KpisGrupales {
  const menosEsMejor = invertirLogica ? !esMetricaAsimetria(metrica) : esMetricaAsimetria(metrica)
  const valoresActuales = actual.map((e) => e.metrics[metrica]).filter((v): v is number => typeof v === 'number')
  if (valoresActuales.length === 0) {
    return { promedioActual: null, mejorValor: null, peorValor: null, porcentajeMejoraGrupal: null, cantidadJugadores: 0 }
  }

  const promedioActual = promedio(valoresActuales)
  const valoresAnteriores = anterior.map((e) => e.metrics[metrica]).filter((v): v is number => typeof v === 'number')
  const promedioAnterior = valoresAnteriores.length > 0 ? promedio(valoresAnteriores) : null

  // Mismo signo que `construirTablaComparativa`: para una métrica donde
  // menos es mejor (asimetría, sprint), un promedio que BAJÓ es una MEJORA
  // — el % tiene que salir positivo en ese caso, no negativo.
  const variacionCruda =
    promedioAnterior !== null && promedioAnterior !== 0
      ? ((promedioActual - promedioAnterior) / Math.abs(promedioAnterior)) * 100
      : null
  const porcentajeMejoraGrupal = variacionCruda === null ? null : menosEsMejor ? -variacionCruda : variacionCruda

  return {
    promedioActual,
    mejorValor: menosEsMejor ? Math.min(...valoresActuales) : Math.max(...valoresActuales),
    peorValor: menosEsMejor ? Math.max(...valoresActuales) : Math.min(...valoresActuales),
    porcentajeMejoraGrupal,
    cantidadJugadores: valoresActuales.length,
  }
}

export interface FilaComparativa {
  athleteId: string
  nombre: string
  valorAnterior: number | null
  valorActual: number | null
  /** % de variación actual vs. anterior — ya con el signo correcto para "mejora positiva" (ver `invertirLogica`). `null` si falta cualquiera de los dos valores. */
  variacionPct: number | null
  mejora: boolean | null
}

/**
 * Tabla Jugador / Anterior / Actual / % Variación — el signo de "mejora" se
 * decide por `esMetricaAsimetria` (auto) salvo que `invertirLogica` lo dé
 * vuelta a mano (pedido explícito: en sprints MENOS es mejor, en saltos MÁS
 * es mejor, y el toggle cubre los casos que el detector automático no
 * adivine bien por el nombre de la columna).
 */
export function construirTablaComparativa(
  actual: PerformanceEvaluation[],
  anterior: PerformanceEvaluation[],
  metrica: string,
  athletes: Athlete[],
  invertirLogica: boolean,
): FilaComparativa[] {
  const menosEsMejor = invertirLogica ? !esMetricaAsimetria(metrica) : esMetricaAsimetria(metrica)
  const porAtletaAnterior = new Map(anterior.map((e) => [e.athleteId, e.metrics[metrica]]))
  const idsVistos = new Set<string>()
  const filas: FilaComparativa[] = []

  for (const ev of actual) {
    if (idsVistos.has(ev.athleteId)) continue
    idsVistos.add(ev.athleteId)
    const nombre = athletes.find((a) => a.id === ev.athleteId)?.nombre ?? '—'
    const valorActual = typeof ev.metrics[metrica] === 'number' ? ev.metrics[metrica] : null
    const valorAnteriorRaw = porAtletaAnterior.get(ev.athleteId)
    const valorAnterior = typeof valorAnteriorRaw === 'number' ? valorAnteriorRaw : null

    let variacionPct: number | null = null
    let mejora: boolean | null = null
    if (valorActual !== null && valorAnterior !== null && valorAnterior !== 0) {
      const variacionCruda = ((valorActual - valorAnterior) / Math.abs(valorAnterior)) * 100
      variacionPct = menosEsMejor ? -variacionCruda : variacionCruda
      mejora = variacionPct > 0
    }

    filas.push({ athleteId: ev.athleteId, nombre, valorAnterior, valorActual, variacionPct, mejora })
  }

  return filas.sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export interface PuntoSerieTemporal {
  fecha: string
  promedio: number
}

/** Promedio grupal por fecha, en orden cronológico — para el gráfico de líneas con tendencia. */
export function calcularSerieTemporalGrupal(
  evaluaciones: PerformanceEvaluation[],
  metrica: string,
): PuntoSerieTemporal[] {
  const porFecha = new Map<string, number[]>()
  for (const ev of evaluaciones) {
    const valor = ev.metrics[metrica]
    if (typeof valor !== 'number') continue
    const lista = porFecha.get(ev.fecha) ?? []
    lista.push(valor)
    porFecha.set(ev.fecha, lista)
  }
  return Array.from(porFecha.entries())
    .map(([fecha, valores]) => ({ fecha, promedio: promedio(valores) }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export interface ItemRanking {
  athleteId: string
  nombre: string
  valor: number
}

/** Valor de la métrica relativizado al peso corporal (métrica/kg) — `null` si el jugador no tiene peso cargado ese día. */
function valorRelativo(ev: PerformanceEvaluation, metrica: string): number | null {
  const valor = ev.metrics[metrica]
  if (typeof valor !== 'number' || !ev.bodyWeightKg || ev.bodyWeightKg <= 0) return null
  return valor / ev.bodyWeightKg
}

function rankingRelativo(
  actual: PerformanceEvaluation[],
  metrica: string,
  athletes: Athlete[],
  invertirLogica: boolean,
  mejores: boolean,
): ItemRanking[] {
  const menosEsMejor = invertirLogica ? !esMetricaAsimetria(metrica) : esMetricaAsimetria(metrica)
  const items = actual
    .map((ev) => {
      const valor = valorRelativo(ev, metrica)
      if (valor === null) return null
      const nombre = athletes.find((a) => a.id === ev.athleteId)?.nombre ?? '—'
      return { athleteId: ev.athleteId, nombre, valor }
    })
    .filter((x): x is ItemRanking => x !== null)

  const ordenAscendente = mejores ? menosEsMejor : !menosEsMejor
  items.sort((a, b) => (ordenAscendente ? a.valor - b.valor : b.valor - a.valor))
  return items.slice(0, 5)
}

export const top5MejoresRelativos = (
  actual: PerformanceEvaluation[],
  metrica: string,
  athletes: Athlete[],
  invertirLogica: boolean,
) => rankingRelativo(actual, metrica, athletes, invertirLogica, true)

export const top5PeoresRelativos = (
  actual: PerformanceEvaluation[],
  metrica: string,
  athletes: Athlete[],
  invertirLogica: boolean,
) => rankingRelativo(actual, metrica, athletes, invertirLogica, false)

export function top5MayorMejora(tabla: FilaComparativa[]): FilaComparativa[] {
  return [...tabla]
    .filter((f) => f.variacionPct !== null)
    .sort((a, b) => (b.variacionPct as number) - (a.variacionPct as number))
    .slice(0, 5)
}

export function top5MayorDesmejora(tabla: FilaComparativa[]): FilaComparativa[] {
  return [...tabla]
    .filter((f) => f.variacionPct !== null)
    .sort((a, b) => (a.variacionPct as number) - (b.variacionPct as number))
    .slice(0, 5)
}

// ---------------------------------------------------------------------------
// Análisis Individual — Radar + Score Global
// ---------------------------------------------------------------------------

export interface EjeRadar {
  metrica: string
  /** 0-100, ya normalizado — más alto siempre significa "mejor" (para métricas de asimetría, el sentido se invierte antes de normalizar). */
  valorNormalizado: number
  valorReal: number
}

/**
 * Radar del jugador (Fase 38) — un eje por cada métrica que el jugador
 * tiene registrada (su valor más reciente de cada una), normalizada 0-100
 * por interpolación Min-Max contra el rango histórico de ESA métrica en
 * TODA la categoría (todos los jugadores, todas las fechas) — así "35cm de
 * salto" y "120kg de fuerza" se pueden graficar en el mismo polígono. El
 * `scoreGlobal` es el promedio simple de los ejes normalizados.
 */
export function calcularRadarJugador(
  evaluacionesDelJugador: PerformanceEvaluation[],
  historicoDeLaCategoria: PerformanceEvaluation[],
): { radar: EjeRadar[]; scoreGlobal: number } {
  // Último valor registrado de cada métrica (puede venir de evaluaciones de
  // distinto `evaluationName` — el radar es un perfil general, no de un solo test).
  const ultimoValorPorMetrica = new Map<string, { valor: number; fecha: string }>()
  for (const ev of [...evaluacionesDelJugador].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    for (const [metrica, valor] of Object.entries(ev.metrics)) {
      if (typeof valor !== 'number') continue
      ultimoValorPorMetrica.set(metrica, { valor, fecha: ev.fecha })
    }
  }

  const radar: EjeRadar[] = []
  for (const [metrica, { valor }] of ultimoValorPorMetrica) {
    const todosLosValores = historicoDeLaCategoria
      .map((e) => e.metrics[metrica])
      .filter((v): v is number => typeof v === 'number')
    if (todosLosValores.length === 0) continue

    const min = Math.min(...todosLosValores)
    const max = Math.max(...todosLosValores)
    if (max === min) {
      radar.push({ metrica, valorNormalizado: 50, valorReal: valor })
      continue
    }

    const posicion = (valor - min) / (max - min)
    // Para asimetrías (menos es mejor), invertir: el valor más BAJO del
    // grupo tiene que quedar cerca de 100, no de 0.
    const normalizado = esMetricaAsimetria(metrica) ? (1 - posicion) * 100 : posicion * 100
    radar.push({ metrica, valorNormalizado: Math.round(normalizado * 10) / 10, valorReal: valor })
  }

  const scoreGlobal = radar.length > 0 ? Math.round(promedio(radar.map((r) => r.valorNormalizado))) : 0
  return { radar: radar.sort((a, b) => a.metrica.localeCompare(b.metrica)), scoreGlobal }
}

// ---------------------------------------------------------------------------
// Smart Analysis — motor de reglas
// ---------------------------------------------------------------------------

export interface AlertaSmartAnalysis {
  nivel: 'ok' | 'precaucion' | 'riesgo' | 'info'
  icono: string
  titulo: string
  mensaje: string
}

/**
 * Umbrales de asimetría — NSCA/literatura de screening de asimetrías
 * bilaterales (Curl Nórdico, fuerza isométrica por pierna, etc.), pedidos
 * textualmente: <10% aceptable, 10-20% precaución, >20% riesgo alto.
 */
function evaluarAsimetria(metrica: string, valorPct: number): AlertaSmartAnalysis {
  if (valorPct > 20) {
    return {
      nivel: 'riesgo',
      icono: '🔴',
      titulo: `Asimetría alta — ${metrica}`,
      mensaje: `${valorPct.toFixed(1)}% de diferencia entre lados — riesgo de lesión alto. Trabajo unilateral correctivo prioritario.`,
    }
  }
  if (valorPct >= 10) {
    return {
      nivel: 'precaucion',
      icono: '🟡',
      titulo: `Asimetría moderada — ${metrica}`,
      mensaje: `${valorPct.toFixed(1)}% de diferencia entre lados — precaución. Se recomienda trabajo unilateral.`,
    }
  }
  return {
    nivel: 'ok',
    icono: '🟢',
    titulo: `Asimetría aceptable — ${metrica}`,
    mensaje: `${valorPct.toFixed(1)}% de diferencia entre lados — dentro de rango aceptable.`,
  }
}

/**
 * Genera las tarjetas de "Smart Analysis" de un jugador (reglas pedidas
 * textualmente):
 * 1. Asimetrías ya cargadas como % en el CSV (columnas que matchean
 *    `esMetricaAsimetria`) → semáforo de riesgo.
 * 2. CMJ vs. peso corporal: si el salto bajó Y el peso subió respecto a la
 *    evaluación anterior → alerta de potencia relativa.
 * 3. Fatiga neuromuscular: caída >10% del valor actual respecto a la MEDIA
 *    HISTÓRICA del jugador en esa métrica (no sólo vs. la evaluación
 *    inmediatamente anterior) → alerta de fatiga/sobreentrenamiento.
 */
export function generarSmartAnalysis(evaluacionesDelJugador: PerformanceEvaluation[]): AlertaSmartAnalysis[] {
  const alertas: AlertaSmartAnalysis[] = []
  if (evaluacionesDelJugador.length === 0) return alertas

  const ordenadas = [...evaluacionesDelJugador].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const ultima = ordenadas[ordenadas.length - 1]
  const previa = ordenadas.length > 1 ? ordenadas[ordenadas.length - 2] : null

  // --- 1. Asimetrías ---
  for (const [metrica, valor] of Object.entries(ultima.metrics)) {
    if (typeof valor !== 'number' || !esMetricaAsimetria(metrica)) continue
    alertas.push(evaluarAsimetria(metrica, Math.abs(valor)))
  }

  // --- 2. CMJ vs. peso corporal ---
  const metricaCmj = Object.keys(ultima.metrics).find((m) => {
    const clave = m.toLowerCase()
    return clave.includes('cmj') || clave.includes('salto') || clave.includes('jump')
  })
  if (metricaCmj && previa) {
    const cmjActual = ultima.metrics[metricaCmj]
    const cmjPrevio = previa.metrics[metricaCmj]
    if (
      typeof cmjActual === 'number' &&
      typeof cmjPrevio === 'number' &&
      cmjActual < cmjPrevio &&
      ultima.bodyWeightKg &&
      previa.bodyWeightKg &&
      ultima.bodyWeightKg > previa.bodyWeightKg
    ) {
      alertas.push({
        nivel: 'precaucion',
        icono: '🟡',
        titulo: 'Potencia relativa en baja',
        mensaje:
          'El salto (CMJ) bajó y el peso corporal subió respecto a la evaluación anterior — revisar composición corporal, posible pérdida de potencia relativa.',
      })
    }
  }

  // --- 3. Fatiga neuromuscular (vs. media histórica, no sólo la anterior) ---
  const metricasNumericas = new Set(
    ordenadas.flatMap((e) => Object.keys(e.metrics).filter((m) => typeof e.metrics[m] === 'number')),
  )
  for (const metrica of metricasNumericas) {
    if (esMetricaAsimetria(metrica)) continue // ya cubierta por la regla 1, con su propia semántica
    const historicos = ordenadas.slice(0, -1).map((e) => e.metrics[metrica]).filter((v): v is number => typeof v === 'number')
    const valorActual = ultima.metrics[metrica]
    if (historicos.length === 0 || typeof valorActual !== 'number') continue
    const media = promedio(historicos)
    if (media === 0) continue
    const caidaPct = ((media - valorActual) / Math.abs(media)) * 100
    if (caidaPct > 10) {
      alertas.push({
        nivel: 'riesgo',
        icono: '🔴',
        titulo: `Posible fatiga — ${metrica}`,
        mensaje: `${caidaPct.toFixed(1)}% por debajo de su media histórica. Posible estado de fatiga/sobreentrenamiento — monitorear cargas externas.`,
      })
    }
  }

  if (alertas.length === 0) {
    alertas.push({
      nivel: 'info',
      icono: 'ℹ️',
      titulo: 'Sin alertas',
      mensaje: 'No se detectaron asimetrías de riesgo, caídas de potencia relativa ni señales de fatiga en la última evaluación.',
    })
  }

  return alertas
}
