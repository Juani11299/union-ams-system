import { aFechaIso, aNumero } from '@/features/antropometrias/parser'
import type { Celda } from '@/features/antropometrias/parser'

/**
 * Auditoría automática del Data Wrangler: marca las celdas sospechosas de un
 * archivo de test antes de subirlo.
 *   · amarillo → valor nulo (celda vacía) o cero absoluto;
 *   · rojo     → valor a más de ±N desviaciones estándar de la media de su
 *                columna (N = 3 por defecto), o nombre de jugador vacío.
 * Las columnas de identificación y de fecha se excluyen del análisis numérico.
 */

export type TipoSospecha = 'nulo' | 'cero' | 'outlier'
export type Severidad = 'amarillo' | 'rojo'

export interface Sospecha {
  tipo: TipoSospecha
  severidad: Severidad
  detalle: string
}

export interface FilaGrid {
  id: number
  celdas: Record<string, string>
}

export interface ColumnaInfo {
  nombre: string
  /** Se audita como numérica (≥ 80 % de sus valores no vacíos son números). */
  numerica: boolean
  esFecha: boolean
  esJugador: boolean
  /** Media y desvío sobre los valores válidos actuales (sólo columnas numéricas auditables). */
  media: number | null
  sd: number | null
  n: number
}

export interface ResultadoAuditoria {
  columnas: ColumnaInfo[]
  /** Clave `${filaId}|${columna}`. */
  sospechas: Map<string, Sospecha>
  filasRojo: Set<number>
  filasAmarillo: Set<number>
  totalRojo: number
  totalAmarillo: number
}

const RE_JUGADOR = /^(jugador|player|nombre|atleta|name|athlete)$/i
const RE_FECHA = /fecha|date|^time|hora/i
const RE_IDENTIFICADOR = /^(dni|documento|id|at_id|test_id|externalid|ano|año|año de nacimiento|fec nac|cat|categoria|categoría|division|división|pos|posicion|posición|test type|tags)$/i

export const claveCelda = (filaId: number, col: string): string => `${filaId}|${col}`

/** Texto de una celda cruda (número de Excel, fecha, etc.) → string editable. */
export function celdaATexto(v: Celda, col: string): string {
  if (v === null || v === undefined) return ''
  if (RE_FECHA.test(col) && (typeof v === 'number' || v instanceof Date)) return aFechaIso(v) ?? String(v)
  if (v instanceof Date) return aFechaIso(v) ?? v.toISOString().slice(0, 10)
  return String(v).trim()
}

const vacio = (s: string): boolean => s.trim() === ''

export function auditar(columnas: string[], filas: FilaGrid[], sigma = 3): ResultadoAuditoria {
  const sospechas = new Map<string, Sospecha>()
  const filasRojo = new Set<number>()
  const filasAmarillo = new Set<number>()
  const marcar = (fila: number, col: string, s: Sospecha) => {
    sospechas.set(claveCelda(fila, col), s)
    if (s.severidad === 'rojo') filasRojo.add(fila)
    else filasAmarillo.add(fila)
  }

  const info: ColumnaInfo[] = columnas.map((nombre) => {
    const esJugador = RE_JUGADOR.test(nombre.trim())
    const esFecha = RE_FECHA.test(nombre)
    const noVacios = filas.map((f) => f.celdas[nombre] ?? '').filter((s) => !vacio(s))
    const numericos = noVacios.filter((s) => aNumero(s) !== null).length
    const auditable = !esJugador && !esFecha && !RE_IDENTIFICADOR.test(nombre.trim())
    const numerica = auditable && noVacios.length > 0 && numericos / noVacios.length >= 0.8
    let media: number | null = null
    let sd: number | null = null
    let n = 0
    if (numerica) {
      const vals = noVacios.map((s) => aNumero(s)).filter((v): v is number => v !== null)
      n = vals.length
      if (n > 0) {
        media = vals.reduce((a, b) => a + b, 0) / n
        sd = n > 1 ? Math.sqrt(vals.reduce((a, b) => a + (b - (media as number)) ** 2, 0) / (n - 1)) : 0
      }
    }
    return { nombre, numerica, esFecha, esJugador, media, sd, n }
  })

  for (const f of filas) {
    for (const c of info) {
      const txt = f.celdas[c.nombre] ?? ''
      if (c.esJugador) {
        if (vacio(txt)) marcar(f.id, c.nombre, { tipo: 'nulo', severidad: 'rojo', detalle: 'Fila sin nombre de jugador' })
        continue
      }
      if (!c.numerica) {
        // Columnas de texto/fecha: sólo se avisa de vacíos (no de identificadores opcionales).
        if (c.esFecha && vacio(txt)) marcar(f.id, c.nombre, { tipo: 'nulo', severidad: 'amarillo', detalle: 'Fecha vacía' })
        continue
      }
      if (vacio(txt)) {
        marcar(f.id, c.nombre, { tipo: 'nulo', severidad: 'amarillo', detalle: 'Valor nulo' })
        continue
      }
      const v = aNumero(txt)
      if (v === null) {
        marcar(f.id, c.nombre, { tipo: 'outlier', severidad: 'rojo', detalle: `"${txt}" no es un número` })
        continue
      }
      if (v === 0) {
        marcar(f.id, c.nombre, { tipo: 'cero', severidad: 'amarillo', detalle: 'Cero absoluto (posible intento fallido)' })
        continue
      }
      if (c.sd && c.sd > 0 && c.n >= 8 && c.media !== null) {
        const z = (v - c.media) / c.sd
        if (Math.abs(z) > sigma) marcar(f.id, c.nombre, { tipo: 'outlier', severidad: 'rojo', detalle: `${z > 0 ? '+' : '−'}${Math.abs(z).toFixed(1)} DE de la media de la columna (${c.media.toFixed(2)})` })
      }
    }
  }
  // Una fila con rojo no cuenta como amarilla.
  for (const id of filasRojo) filasAmarillo.delete(id)
  let totalRojo = 0
  let totalAmarillo = 0
  for (const s of sospechas.values()) s.severidad === 'rojo' ? totalRojo++ : totalAmarillo++
  return { columnas: info, sospechas, filasRojo, filasAmarillo, totalRojo, totalAmarillo }
}

/** CSV limpio: separador coma, todo entre comillas, con BOM (Excel lo abre bien) — lo lee el importador de cada test. */
export function aCsv(columnas: string[], filas: FilaGrid[]): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
  const lineas = [columnas.map(esc).join(','), ...filas.map((f) => columnas.map((c) => esc(f.celdas[c] ?? '')).join(','))]
  return '﻿' + lineas.join('\r\n')
}
