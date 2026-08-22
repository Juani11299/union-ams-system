import { parsearFechaLocal, fechaHoyLocal } from '@/utils/fecha'
import type { GymSheetData, GymSheetEjercicio } from '@/types'

/**
 * Motor de Periodización de Mesociclo (Fase 35) — a partir de UNA sesión de
 * Gimnasio ya cargada, genera el bloque mensual entero (esquema "2x1", "3x1",
 * etc.) mutando series/reps/carga semana a semana según reglas de sobrecarga
 * progresiva (semanas de carga) y supercompensación (semanas de descarga).
 * Pura lógica de datos — no toca React ni el store, así se puede testear con
 * un script suelto (ver verificación en el commit).
 */

export type TipoProgresionMesociclo = 'volumen' | 'intensidad'

export interface EsquemaMesociclo {
  loadWeeks: number
  deloadWeeks: number
}

/** "2x1", "3x1", "1x1" → { loadWeeks, deloadWeeks }. `null` si el input no es un esquema NxM válido. */
export function parsearEsquema(input: string): EsquemaMesociclo | null {
  const partes = input.trim().toLowerCase().split('x')
  if (partes.length !== 2) return null

  const [loadWeeks, deloadWeeks] = partes.map(Number)
  if (!Number.isFinite(loadWeeks) || !Number.isFinite(deloadWeeks)) return null
  if (!Number.isInteger(loadWeeks) || !Number.isInteger(deloadWeeks)) return null
  if (loadWeeks < 1 || deloadWeeks < 0) return null

  return { loadWeeks, deloadWeeks }
}

/** Lunes de la semana `i` del mesociclo — misma aritmética nativa de `Date.setDate` que ya usa `inicioDeSemana`/`diasDeLaSemanaActual` en toda la app: segura contra fin de mes y años bisiestos, sin dependencias nuevas. */
function sumarDias(fecha: string, dias: number): string {
  const d = parsearFechaLocal(fecha)
  d.setDate(d.getDate() + dias)
  return fechaHoyLocal(d)
}

function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Aplica `calcularNuevoValor` sólo si `textoOriginal` arranca con un número
 * ("70", "70%", "8kg"...) — un campo vacío o texto libre (ej. "BW", "Fallo",
 * o directamente sin cargar) se devuelve TAL CUAL, nunca se convierte en
 * "0": mutar algo que el profe nunca completó sería inventar un dato, no
 * progresar uno real.
 */
function mutarCampoNumerico(
  textoOriginal: string,
  calcularNuevoValor: (valorActual: number) => number,
  minimo: number,
): string {
  const limpio = textoOriginal.trim()
  const match = limpio.match(/^(-?\d+(?:[.,]\d+)?)(.*)$/)
  if (!match) return textoOriginal

  const valorActual = Number(match[1].replace(',', '.'))
  const sufijo = match[2]
  const nuevoValor = Math.max(minimo, calcularNuevoValor(valorActual))
  const redondeado = Math.round(nuevoValor * 10) / 10
  const texto = Number.isInteger(redondeado) ? String(redondeado) : redondeado.toFixed(1)
  return `${texto}${sufijo}`
}

/** +5% de carga por semana de carga en progresión de Intensidad (compuesto semana a semana). */
const INCREMENTO_CARGA_CARGA_PCT = 0.05
/** -17.5% de carga en el deload de Intensidad — punto medio del "15-20%" pedido. */
const REDUCCION_DELOAD_INTENSIDAD_PCT = 0.175
/** +3% de carga en el deload de Volumen — sube "ligeramente" la intensidad para mantener el tono sin acumular fatiga real. */
const INCREMENTO_DELOAD_TONO_PCT = 0.03

/**
 * Muta UN ejercicio de la semana `i-1` a la semana `i` (nunca el objeto
 * original). En semanas de carga, alterna el driver de sobrecarga entre
 * repeticiones (todas las semanas) y series (sólo semanas pares del bloque
 * de carga) — evita sumar reps Y series todas las semanas a la vez, que en
 * 3-4 semanas de carga dispararía el volumen de forma poco realista.
 */
function mutarEjercicio(
  base: GymSheetEjercicio,
  i: number,
  loadWeeks: number,
  tipo: TipoProgresionMesociclo,
): GymSheetEjercicio {
  const enCarga = i <= loadWeeks
  const esSemanaParDeCarga = enCarga && i % 2 === 0

  let series = base.series
  let repeticiones = base.repeticiones
  let cargaKg = base.cargaKg

  if (enCarga) {
    if (tipo === 'volumen') {
      // Sobrecarga progresiva de Volumen: +1 rep todas las semanas de carga;
      // +1 serie extra además, en las semanas pares del bloque.
      repeticiones = mutarCampoNumerico(repeticiones, (v) => v + 1, 1)
      if (esSemanaParDeCarga) series = mutarCampoNumerico(series, (v) => v + 1, 1)
    } else {
      // Sobrecarga progresiva de Intensidad: -1 rep (-2 en semanas pares) +
      // sube la carga/RPE — menos volumen, más peso, semana a semana.
      repeticiones = mutarCampoNumerico(repeticiones, (v) => v - (esSemanaParDeCarga ? 2 : 1), 1)
      cargaKg = mutarCampoNumerico(cargaKg, (v) => v * (1 + INCREMENTO_CARGA_CARGA_PCT), 0)
    }
  } else if (tipo === 'volumen') {
    // Veníamos en Volumen: deload de VOLUMEN — baja series y reps
    // drásticamente, sube apenas la carga para mantener el tono.
    series = mutarCampoNumerico(series, (v) => v - 1, 1)
    repeticiones = mutarCampoNumerico(repeticiones, (v) => Math.round(v * 0.7), 1)
    cargaKg = mutarCampoNumerico(cargaKg, (v) => v * (1 + INCREMENTO_DELOAD_TONO_PCT), 0)
  } else {
    // Veníamos en Intensidad: deload de INTENSIDAD — baja la carga/RPE
    // drásticamente, sube apenas las reps (lavado de fatiga neuromuscular).
    cargaKg = mutarCampoNumerico(cargaKg, (v) => v * (1 - REDUCCION_DELOAD_INTENSIDAD_PCT), 0)
    repeticiones = mutarCampoNumerico(repeticiones, (v) => v + 1, 1)
  }

  return { ...base, id: nuevoId(), series, repeticiones, cargaKg }
}

function mutarGymSheetData(
  base: GymSheetData,
  i: number,
  loadWeeks: number,
  tipo: TipoProgresionMesociclo,
): GymSheetData {
  return {
    ...base,
    bloques: base.bloques.map((bloque) => ({
      ...bloque,
      id: nuevoId(),
      ejercicios: bloque.ejercicios.map((ej) => mutarEjercicio(ej, i, loadWeeks, tipo)),
    })),
  }
}

export interface SesionMesocicloGenerada {
  fecha: string
  semana: number
  faseDeload: boolean
  gymSheetData: GymSheetData
}

/**
 * Genera el bloque de sesiones del mesociclo completo (Paso 2/3) — NO
 * incluye la sesión base (día 0, que ya existe y queda intacta): arranca en
 * `fechaBase + 7` (semana 1) y sigue sumando 7 días exactos por semana hasta
 * `loadWeeks + deloadWeeks`. Cada semana muta a partir del resultado de la
 * ANTERIOR (cadena compuesta, no siempre respecto a la base original), tal
 * como pide la consigna ("respecto a la semana i-1").
 */
export function generarMesociclo(
  gymSheetBase: GymSheetData,
  fechaBase: string,
  esquema: EsquemaMesociclo,
  tipo: TipoProgresionMesociclo,
): SesionMesocicloGenerada[] {
  const { loadWeeks, deloadWeeks } = esquema
  const totalSemanas = loadWeeks + deloadWeeks
  const sesiones: SesionMesocicloGenerada[] = []

  let anterior = gymSheetBase
  for (let i = 1; i <= totalSemanas; i++) {
    const mutado = mutarGymSheetData(anterior, i, loadWeeks, tipo)
    sesiones.push({
      fecha: sumarDias(fechaBase, i * 7),
      semana: i,
      faseDeload: i > loadWeeks,
      gymSheetData: mutado,
    })
    anterior = mutado
  }

  return sesiones
}
