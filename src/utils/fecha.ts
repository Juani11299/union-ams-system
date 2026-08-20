/** Fecha de hoy en horario local, como YYYY-MM-DD (evita el corrimiento de un día que da `toISOString`). */
export function fechaHoyLocal(referencia: Date = new Date()): string {
  const y = referencia.getFullYear()
  const m = String(referencia.getMonth() + 1).padStart(2, '0')
  const d = String(referencia.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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

/** Los 7 días (lunes a domingo) de la semana actual, como YYYY-MM-DD. */
export function diasDeLaSemanaActual(referencia: Date = new Date()): string[] {
  const lunes = inicioDeSemana(referencia)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(d.getDate() + i)
    return fechaHoyLocal(d)
  })
}
