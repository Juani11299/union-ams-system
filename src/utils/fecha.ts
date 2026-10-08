/**
 * Zona horaria del club (Argentina, UTC-3 todo el año, sin horario de verano).
 * TODA fecha "de hoy" de la app se calcula en esta zona, sin importar la zona
 * del dispositivo ni la del servidor: así "hoy" no cambia a las 21:00 hs
 * locales (= 00:00 UTC) ni se corre por un celular configurado en otra zona.
 */
export const ZONA_CLUB = 'America/Argentina/Buenos_Aires'

// `en-CA` formatea como YYYY-MM-DD; la zona se fija explícitamente.
const formatoFechaClub = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_CLUB,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * Fecha civil (YYYY-MM-DD) de `referencia` en la hora del club (ART). Nunca usa
 * `toISOString` (UTC) ni la zona del dispositivo. El nombre se conserva por
 * compatibilidad con todos los llamadores existentes.
 */
export function fechaHoyLocal(referencia: Date = new Date()): string {
  return formatoFechaClub.format(referencia)
}

const DIA_MS = 24 * 60 * 60 * 1000
const aUtcMs = (fecha: string): number => {
  const [y, m, d] = fecha.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/**
 * Aritmética de fechas civiles SIN horas ni zonas: opera sobre el calendario
 * (UTC puro sobre año/mes/día), por eso `sumarDiasFecha('2026-10-04', -1)` es
 * siempre '2026-10-03' en cualquier dispositivo y a cualquier hora del día.
 */
export function sumarDiasFecha(fecha: string, dias: number): string {
  return new Date(aUtcMs(fecha) + dias * DIA_MS).toISOString().slice(0, 10)
}

/** Días de calendario entre dos fechas (`a − b`): 0 = mismo día, 1 = `a` es un día después de `b`. */
export function diferenciaDias(a: string, b: string): number {
  return Math.round((aUtcMs(a) - aUtcMs(b)) / DIA_MS)
}

/** Día de la semana de una fecha civil: 0=domingo … 6=sábado. */
export function diaSemanaFecha(fecha: string): number {
  return new Date(aUtcMs(fecha)).getUTCDay()
}

/** Lunes de la semana que contiene `fecha` (YYYY-MM-DD). */
export function inicioSemanaFecha(fecha: string): string {
  const dia = diaSemanaFecha(fecha)
  return sumarDiasFecha(fecha, dia === 0 ? -6 : 1 - dia)
}

/** Parsea "YYYY-MM-DD" como fecha local (evita que `new Date(str)` la lea como UTC y corra un día). */
export function parsearFechaLocal(fecha: string): Date {
  const [year, month, day] = fecha.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatFechaCorta(fecha: string): string {
  return parsearFechaLocal(fecha).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** Lunes (00:00 local) de la semana que contiene `referencia`. */
export function inicioDeSemana(referencia: Date): Date {
  const d = new Date(referencia)
  const dia = d.getDay() // 0=domingo .. 6=sábado
  const diffALunes = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + diffALunes)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Los 7 días (lunes a domingo) de la semana de `referencia`, como YYYY-MM-DD (en la hora del club). */
export function diasDeLaSemanaActual(referencia: Date = new Date()): string[] {
  const lunes = inicioSemanaFecha(fechaHoyLocal(referencia))
  return Array.from({ length: 7 }, (_, i) => sumarDiasFecha(lunes, i))
}

/** "miércoles, 7 de octubre de 2026" — formato largo de una fecha civil `YYYY-MM-DD` (sin corrimientos de zona). */
export function formatFechaLarga(fecha: string): string {
  return parsearFechaLocal(fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
