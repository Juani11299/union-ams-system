import { normalizarClave } from '../periodization/evaluations/csvClassifier'
import { normalizarNombre } from '../../utils/smartEntityMatcher'
import { aNumero, RANGOS } from './parser'
import type { Matriz, ResultadoParseo, ResumenImportacion } from './parser'
import type { MedicionAntropo } from './types'

/**
 * Formato "Informe de composición corporal" del nutricionista: UNA HOJA POR
 * CATEGORÍA, una fila por jugador y, por cada medida, un bloque de 3 columnas
 * (ACTUAL / PREVIO / DIF — en 8va y 9na ENERO / JULIO / DIF). No trae fechas,
 * ni masa grasa/muscular en %: vienen en kg. Este parser lo "despivotea" a
 * `MedicionAntropo` (una por jugador y momento) para que el resto del módulo
 * no cambie:
 *   · fecha ACTUAL = último día del mes del título de la hoja ("… JULIO 2026");
 *   · fecha PREVIA = 31 de enero del mismo año (supuesto acordado con el profe);
 *   · % grasa / % muscular = masa (kg) ÷ peso (kg) × 100 del mismo momento.
 * Las columnas DIF y TALLA se ignoran (DIF se recalcula sola en el dashboard).
 */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

type Medida = 'peso' | 'pliegues' | 'grasaKg' | 'musculoKg'
type Momento = 'actual' | 'previo'

const MEDIDA_POR_ENCABEZADO: Array<[string, Medida]> = [
  ['peso', 'peso'],
  ['pliegue', 'pliegues'],
  ['masagrasa', 'grasaKg'],
  ['masamuscular', 'musculoKg'],
]
const MOMENTO_POR_ENCABEZADO: Record<string, Momento> = {
  actual: 'actual',
  julio: 'actual',
  previo: 'previo',
  previa: 'previo',
  enero: 'previo',
}

const texto = (c: unknown): string => (c === null || c === undefined ? '' : String(c).trim())

const cuentaMomentos = (fila: unknown[]): number => fila.filter((c) => normalizarClave(texto(c)) in MOMENTO_POR_ENCABEZADO).length

/** Fila del encabezado de grupos: la que arranca con "JUGADOR" y trae bloques como PESO / PLIEGUES. */
function filaEncabezado(m: Matriz): number {
  return m.findIndex(
    (fila) => normalizarClave(texto(fila[0])) === 'jugador' && fila.some((c) => normalizarClave(texto(c)).startsWith('peso')),
  )
}

/** ¿Alguna hoja del libro está en el formato "informe"? */
export function esFormatoInforme(hojas: Record<string, Matriz>): boolean {
  return Object.values(hojas).some((m) => {
    const r = filaEncabezado(m)
    return r >= 0 && m.slice(r + 1, r + 5).some((fila) => cuentaMomentos(fila) >= 2)
  })
}

function fechasDelTitulo(matriz: Matriz): { actual: string; previa: string } | null {
  const titulo = normalizarClave(
    matriz
      .slice(0, 3)
      .map((f) => f.map(texto).join(' '))
      .join(' '),
  )
  // `normalizarClave` quita los espacios ("JULIO 2026" → "julio2026"); se toma el último mes+año del título.
  const m = Array.from(titulo.matchAll(new RegExp(`(${MESES.join('|')})(\\d{4})`, 'g'))).pop()
  if (!m) return null
  const mes = MESES.indexOf(m[1]) + 1
  const anio = Number(m[2])
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
  const p = (n: number) => String(n).padStart(2, '0')
  return { actual: `${anio}-${p(mes)}-${p(ultimoDia)}`, previa: `${anio}-01-31` }
}

export interface ResultadoInforme extends ResultadoParseo {
  hojas: Array<{ hoja: string; jugadores: number }>
  /** Hojas ignoradas (sin encabezado reconocible, sin fecha en el título o sin jugadores). */
  hojasOmitidas: string[]
  fechaActual: string | null
  fechaPrevia: string | null
}

export function parsearInforme(hojas: Record<string, Matriz>): ResultadoInforme {
  const resumen: ResumenImportacion = {
    filasLeidas: 0,
    importables: 0,
    sinNombre: 0,
    sinFecha: 0,
    sinDatos: 0,
    duplicadas: 0,
    valoresFueraDeRango: 0,
    escaladasDeFraccion: [],
  }
  const porId = new Map<string, MedicionAntropo>()
  const resumenHojas: ResultadoInforme['hojas'] = []
  const hojasOmitidas: string[] = []
  let fechaActual: string | null = null
  let fechaPrevia: string | null = null

  const validar = (campo: keyof typeof RANGOS, v: number | null): number | null => {
    if (v === null) return null
    const [min, max] = RANGOS[campo]
    if (v < min || v > max) {
      resumen.valoresFueraDeRango++
      return null
    }
    return v
  }

  for (const [nombreHoja, matriz] of Object.entries(hojas)) {
    const r = filaEncabezado(matriz)
    const fechas = fechasDelTitulo(matriz)
    if (r < 0 || !fechas) {
      hojasOmitidas.push(nombreHoja)
      continue
    }
    // Fila de sub-encabezados (ACTUAL/PREVIO/DIF): la primera de las siguientes con ≥2 momentos reconocibles.
    let rSub = -1
    for (let i = r + 1; i < Math.min(matriz.length, r + 5); i++) {
      if (cuentaMomentos(matriz[i]) >= 2) {
        rSub = i
        break
      }
    }
    if (rSub < 0) {
      hojasOmitidas.push(nombreHoja)
      continue
    }

    // (medida|momento) → columna. Cada celda no vacía de la fila de grupos abre un bloque de 3 columnas.
    const columnas = new Map<string, number>()
    const grupo = matriz[r]
    const sub = matriz[rSub]
    let medidaActual: Medida | null = null
    for (let c = 1; c < Math.max(grupo.length, sub.length); c++) {
      const g = normalizarClave(texto(grupo[c]))
      if (g !== '') medidaActual = MEDIDA_POR_ENCABEZADO.find(([k]) => g.startsWith(k))?.[1] ?? null
      const momento = MOMENTO_POR_ENCABEZADO[normalizarClave(texto(sub[c]))]
      if (medidaActual && momento) columnas.set(`${medidaActual}|${momento}`, c)
    }

    const categoria = nombreHoja.trim()
    const claveCategoria = normalizarClave(categoria)
    let jugadoresHoja = 0
    for (let i = rSub + 1; i < matriz.length; i++) {
      const fila = matriz[i]
      const jugador = texto(fila[0])
      if (jugador === '') continue
      resumen.filasLeidas++
      jugadoresHoja++
      const jugadorKey = normalizarNombre(jugador)
      let algunaMedicion = false

      for (const [momento, fecha] of [
        ['previo', fechas.previa],
        ['actual', fechas.actual],
      ] as Array<[Momento, string]>) {
        const leer = (medida: Medida): number | null => {
          const c = columnas.get(`${medida}|${momento}`)
          return c === undefined ? null : aNumero(fila[c])
        }
        const pesoCrudo = leer('peso')
        const pesoKg = validar('peso', pesoCrudo)
        // kg → % del peso del mismo momento (hace falta un peso para poder convertir).
        const aPct = (kg: number | null) =>
          kg !== null && kg > 0 && pesoCrudo !== null && pesoCrudo > 0 ? Math.round((kg / pesoCrudo) * 1000) / 10 : null
        const grasaPct = validar('grasa', aPct(leer('grasaKg')))
        const musculoPct = validar('musculo', aPct(leer('musculoKg')))
        const pliegues = validar('pliegues', leer('pliegues'))
        if (pesoKg === null && grasaPct === null && musculoPct === null && pliegues === null) continue
        algunaMedicion = true
        const id = `${jugadorKey}|${claveCategoria}|${fecha}`
        if (porId.has(id)) resumen.duplicadas++
        porId.set(id, { id, jugador, jugadorKey, categoria, fecha, pesoKg, grasaPct, musculoPct, pliegues })
      }
      if (!algunaMedicion) resumen.sinDatos++
    }
    if (jugadoresHoja === 0) {
      hojasOmitidas.push(nombreHoja)
      continue
    }
    resumenHojas.push({ hoja: nombreHoja, jugadores: jugadoresHoja })
    fechaActual = fechas.actual
    fechaPrevia = fechas.previa
  }

  const mediciones = Array.from(porId.values())
  resumen.importables = mediciones.length
  return { mediciones, resumen, hojas: resumenHojas, hojasOmitidas, fechaActual, fechaPrevia }
}
