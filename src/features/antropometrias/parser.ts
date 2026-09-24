import { normalizarClave, parsearFechaCsv } from '../periodization/evaluations/csvClassifier'
import { normalizarNombre } from '../../utils/smartEntityMatcher'
import { SIN_CATEGORIA } from './types'
import type { CampoAntropo, MapeoColumnas, MedicionAntropo } from './types'

/** Lo que puede traer una celda de un CSV (texto) o de un Excel (texto/número/fecha). */
export type Celda = string | number | boolean | Date | null | undefined
export type Matriz = Celda[][]
export type FilaArchivo = Record<string, Celda>

// -----------------------------------------------------------------------------
// Smart Parser — detección de columnas por nombre de encabezado
// -----------------------------------------------------------------------------

const JUGADOR_EXACTOS = [
  'jugador',
  'jugadora',
  'player',
  'nombre',
  'atleta',
  'name',
  'deportista',
  'apellidoynombre',
  'nombreyapellido',
  'apellidonombre',
  'nombreapellido',
]
const CATEGORIA_EXACTOS = ['categoria', 'category', 'division', 'cat']
const PESO_EXACTOS = ['weight', 'bodymass', 'bodyweight', 'bw', 'bwkg']

/**
 * Clasifica UN encabezado (ya normalizado con `normalizarClave`: minúsculas,
 * sin tildes ni símbolos) en el campo que representa, o `null` si no es de
 * ninguno. Ejemplos reales: "Peso [kg]" → `pesokg`, "Masa Adiposa [%]" →
 * `masaadiposa`, "Masa Muscular [%]" → `masamuscular`, "Sumatoria de
 * Pliegues" → `sumatoriadepliegues`.
 *
 * Regla clave: grasa y músculo se aceptan SÓLO si el encabezado no dice `kg`
 * — una columna "Masa Adiposa [kg]" es masa absoluta, no el porcentaje que
 * necesita el análisis, y mezclarlas daría números sin sentido.
 */
export function clasificarEncabezado(clave: string): CampoAntropo | null {
  if (clave === '') return null
  if (JUGADOR_EXACTOS.includes(clave)) return 'jugador'
  if (CATEGORIA_EXACTOS.includes(clave)) return 'categoria'
  if (clave === 'fecha' || clave === 'date' || (clave.startsWith('fecha') && !clave.includes('nac'))) return 'fecha'

  const esPliegues =
    (clave.includes('pliegue') || clave.includes('skinfold')) && (clave.includes('suma') || clave.includes('sum'))
  if (esPliegues || clave === 'sumatoria' || clave === 'sumpliegues') return 'pliegues'

  const sinKg = !clave.includes('kg')
  if (
    sinKg &&
    (clave.includes('adiposa') ||
      clave.includes('grasa') ||
      clave.includes('bodyfat') ||
      clave.includes('fatmass') ||
      clave.includes('fatpercent') ||
      clave === 'fat' ||
      clave === 'bf')
  ) {
    return 'grasa'
  }
  if (sinKg && (clave.includes('muscular') || clave.includes('musculo') || clave.includes('muscle'))) return 'musculo'

  const esPeso =
    PESO_EXACTOS.includes(clave) ||
    clave.startsWith('masacorporal') ||
    (clave.startsWith('peso') && !/ideal|objetivo|meta|graso|magro|oseo|residual|libre/.test(clave))
  if (esPeso) return 'peso'

  return null
}

/** Asigna a cada campo la PRIMERA columna del archivo que lo representa. */
export function detectarColumnas(columnas: string[]): MapeoColumnas {
  const mapeo: MapeoColumnas = {
    jugador: null,
    fecha: null,
    categoria: null,
    peso: null,
    grasa: null,
    musculo: null,
    pliegues: null,
  }
  for (const columna of columnas) {
    const campo = clasificarEncabezado(normalizarClave(columna))
    if (campo && mapeo[campo] === null) mapeo[campo] = columna
  }
  return mapeo
}

/** Mínimo para poder importar: quién, cuándo y al menos una medida. */
export function mapeoAlcanza(mapeo: MapeoColumnas): boolean {
  return !!mapeo.jugador && !!mapeo.fecha && !!(mapeo.peso || mapeo.grasa || mapeo.musculo || mapeo.pliegues)
}

// -----------------------------------------------------------------------------
// De matriz cruda (CSV o Excel) a tabla con encabezados
// -----------------------------------------------------------------------------

export interface TablaLeida {
  columnas: string[]
  filas: FilaArchivo[]
}

function textoCelda(celda: Celda): string {
  return celda === null || celda === undefined ? '' : String(celda).trim()
}

/**
 * Convierte una matriz cruda en una tabla con encabezados. Las planillas de
 * un nutricionista suelen traer filas de título arriba del encabezado real
 * ("Evaluación antropométrica 2026", nombre del club, etc.), así que en vez
 * de asumir la fila 0 se busca, entre las primeras 20, la que más columnas
 * reconocibles tiene (mínimo 2). Si ninguna alcanza, cae a la primera fila
 * con contenido. Los encabezados repetidos se desambiguan con " (2)", " (3)".
 */
export function leerTabla(matriz: Matriz): TablaLeida {
  const limite = Math.min(20, matriz.length)
  let mejorFila = -1
  let mejorPuntaje = 0
  for (let i = 0; i < limite; i++) {
    const puntaje = matriz[i].filter((c) => clasificarEncabezado(normalizarClave(textoCelda(c))) !== null).length
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje
      mejorFila = i
    }
  }
  if (mejorPuntaje < 2) {
    mejorFila = matriz.findIndex((fila) => fila.some((c) => textoCelda(c) !== ''))
  }
  if (mejorFila < 0) return { columnas: [], filas: [] }

  const vistos = new Map<string, number>()
  const encabezados = matriz[mejorFila].map((celda) => {
    const base = textoCelda(celda)
    if (base === '') return ''
    const n = (vistos.get(base) ?? 0) + 1
    vistos.set(base, n)
    return n === 1 ? base : `${base} (${n})`
  })
  const columnas = encabezados.filter((h) => h !== '')

  const filas: FilaArchivo[] = []
  for (const cruda of matriz.slice(mejorFila + 1)) {
    if (!cruda.some((c) => textoCelda(c) !== '')) continue
    const fila: FilaArchivo = {}
    encabezados.forEach((h, idx) => {
      if (h !== '') fila[h] = cruda[idx]
    })
    filas.push(fila)
  }
  return { columnas, filas }
}

// -----------------------------------------------------------------------------
// Conversión de valores
// -----------------------------------------------------------------------------

/** "23,5 %" → 23.5 · "72.4 kg" → 72.4 · "" → null. (No reusa `parsearNumeroCsv`: ese devuelve 0 para una celda vacía.) */
export function aNumero(valor: Celda): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null
  if (valor === null || valor === undefined || typeof valor === 'boolean' || valor instanceof Date) return null
  const limpio = String(valor)
    .trim()
    .replace(/%/g, '')
    .replace(/(kg|mm)$/i, '')
    .replace(/\s/g, '')
    .replace(',', '.')
  if (limpio === '') return null
  const numero = Number(limpio)
  return Number.isFinite(numero) ? numero : null
}

function isoDesdePartes(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/**
 * Fecha de una celda → "YYYY-MM-DD". Texto: ISO o DD/MM/AAAA (reusa
 * `parsearFechaCsv`, el mismo criterio que Evaluaciones de Rendimiento).
 * Número: número de serie de Excel (días desde 1899-12-30), que es lo que
 * llega de un .xlsx cuando la celda tiene formato fecha — es aritmética
 * pura sobre días enteros, no depende de la zona horaria de la máquina.
 */
export function aFechaIso(valor: Celda): string | null {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : isoDesdePartes(valor.getFullYear(), valor.getMonth() + 1, valor.getDate())
  }
  if (typeof valor === 'number') {
    if (valor < 20000 || valor > 80000) return null
    const d = new Date((Math.floor(valor) - 25569) * 86400000)
    return isoDesdePartes(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
  }
  return parsearFechaCsv(valor)
}

// -----------------------------------------------------------------------------
// Construcción de mediciones
// -----------------------------------------------------------------------------

/** Rangos fisiológicamente posibles — un valor fuera de acá es un error de carga, no una medición. */
export const RANGOS: Record<'peso' | 'grasa' | 'musculo' | 'pliegues', [number, number]> = {
  peso: [25, 200],
  grasa: [2, 60],
  musculo: [15, 80],
  pliegues: [10, 500],
}

export interface ResumenImportacion {
  filasLeidas: number
  importables: number
  sinNombre: number
  sinFecha: number
  sinDatos: number
  duplicadas: number
  valoresFueraDeRango: number
  /** Columnas de % que venían como fracción (0.152) y se pasaron a porcentaje (15.2) — pasa cuando Excel guarda celdas con formato %. */
  escaladasDeFraccion: Array<'grasa' | 'musculo'>
}

export interface ResultadoParseo {
  mediciones: MedicionAntropo[]
  resumen: ResumenImportacion
}

/** ¿Todos los valores no nulos están entre 0 y 1? → es una fracción de Excel, no un porcentaje. */
function esFraccion(valores: Array<number | null>): boolean {
  const presentes = valores.filter((v): v is number => v !== null)
  return presentes.length > 0 && presentes.every((v) => v > 0 && v <= 1)
}

export function construirMediciones(filas: FilaArchivo[], mapeo: MapeoColumnas): ResultadoParseo {
  const resumen: ResumenImportacion = {
    filasLeidas: filas.length,
    importables: 0,
    sinNombre: 0,
    sinFecha: 0,
    sinDatos: 0,
    duplicadas: 0,
    valoresFueraDeRango: 0,
    escaladasDeFraccion: [],
  }
  if (!mapeoAlcanza(mapeo)) return { mediciones: [], resumen }

  const leer = (fila: FilaArchivo, campo: CampoAntropo): Celda => (mapeo[campo] ? fila[mapeo[campo]!] : undefined)

  // Pasada 1: valores crudos por columna, para poder detectar la escala de los %.
  const crudos = filas.map((fila) => ({
    peso: aNumero(leer(fila, 'peso')),
    grasa: aNumero(leer(fila, 'grasa')),
    musculo: aNumero(leer(fila, 'musculo')),
    pliegues: aNumero(leer(fila, 'pliegues')),
  }))
  const escalarGrasa = esFraccion(crudos.map((c) => c.grasa))
  const escalarMusculo = esFraccion(crudos.map((c) => c.musculo))
  if (escalarGrasa) resumen.escaladasDeFraccion.push('grasa')
  if (escalarMusculo) resumen.escaladasDeFraccion.push('musculo')

  const validar = (campo: keyof typeof RANGOS, valor: number | null): number | null => {
    if (valor === null) return null
    const [min, max] = RANGOS[campo]
    if (valor < min || valor > max) {
      resumen.valoresFueraDeRango++
      return null
    }
    return valor
  }

  // Misma categoría escrita distinto ("8va División" / "8VA DIVISION") → una sola, con la primera grafía vista.
  const etiquetaPorClaveCategoria = new Map<string, string>()
  const porId = new Map<string, MedicionAntropo>()

  filas.forEach((fila, i) => {
    const jugador = textoCelda(leer(fila, 'jugador'))
    if (jugador === '') {
      resumen.sinNombre++
      return
    }
    const fecha = aFechaIso(leer(fila, 'fecha'))
    if (fecha === null) {
      resumen.sinFecha++
      return
    }

    const crudo = crudos[i]
    const pesoKg = validar('peso', crudo.peso)
    const grasaPct = validar('grasa', crudo.grasa !== null && escalarGrasa ? crudo.grasa * 100 : crudo.grasa)
    const musculoPct = validar('musculo', crudo.musculo !== null && escalarMusculo ? crudo.musculo * 100 : crudo.musculo)
    const pliegues = validar('pliegues', crudo.pliegues)
    if (pesoKg === null && grasaPct === null && musculoPct === null && pliegues === null) {
      resumen.sinDatos++
      return
    }

    const categoriaTexto = mapeo.categoria ? textoCelda(leer(fila, 'categoria')) : ''
    const claveCategoria = categoriaTexto === '' ? '' : normalizarClave(categoriaTexto)
    if (claveCategoria !== '' && !etiquetaPorClaveCategoria.has(claveCategoria)) {
      etiquetaPorClaveCategoria.set(claveCategoria, categoriaTexto)
    }
    const categoria = claveCategoria === '' ? SIN_CATEGORIA : (etiquetaPorClaveCategoria.get(claveCategoria) ?? categoriaTexto)

    const jugadorKey = normalizarNombre(jugador)
    const id = `${jugadorKey}|${claveCategoria || 'sincategoria'}|${fecha}`
    if (porId.has(id)) resumen.duplicadas++
    porId.set(id, { id, jugador, jugadorKey, categoria, fecha, pesoKg, grasaPct, musculoPct, pliegues })
  })

  const mediciones = Array.from(porId.values())
  resumen.importables = mediciones.length
  return { mediciones, resumen }
}
