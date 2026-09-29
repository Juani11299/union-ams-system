import type { PuntoCurva } from './tipos'

/** g (m/s²), usado para convertir kg → N y para la física del vuelo. */
export const G = 9.81

/** Tiempo de vuelo real a partir de la altura de salto medida: h = g·t²/8 → t = √(8h/g). */
export const tiempoDeVuelo = (alturaM: number): number => Math.sqrt((8 * Math.max(alturaM, 0)) / G)

/** Duración de la fase concéntrica real: RSI-modified [m/s] = altura(m) / tiempo(s). */
export const duracionConcentrica = (alturaM: number, rsiModMs: number): number | null =>
  rsiModMs > 0 ? alturaM / rsiModMs : null

interface Knot {
  t: number
  v: number
}

/**
 * Spline cúbica monótona (Fritsch–Carlson): interpola sin overshoot entre los
 * puntos reales/derivados de cada fase — una meseta se queda plana, un pico no
 * se dispara por encima del valor real que lo define.
 */
function splineMonotona(knots: Knot[]): (t: number) => number {
  const n = knots.length
  if (n === 1) return () => knots[0].v
  const t = knots.map((k) => k.t)
  const v = knots.map((k) => k.v)
  const d: number[] = []
  for (let i = 0; i < n - 1; i++) d.push((v[i + 1] - v[i]) / (t[i + 1] - t[i] || 1e-9))
  const m: number[] = new Array(n)
  m[0] = d[0]
  m[n - 1] = d[n - 2]
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] === 0 || d[i] === 0 || d[i - 1] * d[i] < 0 ? 0 : (d[i - 1] + d[i]) / 2
  // Limitador de Fritsch–Carlson: evita que la tangente se pase del secante vecino (garantiza monotonía local).
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / d[i]
    const b = m[i + 1] / d[i]
    const s = Math.sqrt(a * a + b * b)
    if (s > 3) {
      const tau = 3 / s
      m[i] = tau * a * d[i]
      m[i + 1] = tau * b * d[i]
    }
  }
  return (x: number) => {
    const xc = Math.min(Math.max(x, t[0]), t[n - 1])
    let i = 0
    while (i < n - 2 && xc > t[i + 1]) i++
    const h = t[i + 1] - t[i] || 1e-9
    const s = (xc - t[i]) / h
    const s2 = s * s
    const s3 = s2 * s
    const h00 = 2 * s3 - 3 * s2 + 1
    const h10 = s3 - 2 * s2 + s
    const h01 = -2 * s3 + 3 * s2
    const h11 = s3 - s2
    return h00 * v[i] + h10 * h * m[i] + h01 * v[i + 1] + h11 * h * m[i + 1]
  }
}

export interface CanalKnots {
  total: Knot[]
  izq?: Knot[]
  der?: Knot[]
}

/** Muestrea los 3 canales (total/izq/der) sobre una grilla temporal uniforme para graficar. */
export function muestrearCurva(knots: CanalKnots, muestras = 180): PuntoCurva[] {
  const tMin = knots.total[0].t
  const tMax = knots.total[knots.total.length - 1].t
  const fTotal = splineMonotona(knots.total)
  const fIzq = knots.izq ? splineMonotona(knots.izq) : null
  const fDer = knots.der ? splineMonotona(knots.der) : null
  const out: PuntoCurva[] = []
  for (let i = 0; i <= muestras; i++) {
    const t = tMin + ((tMax - tMin) * i) / muestras
    out.push({ t, total: fTotal(t), izq: fIzq ? fIzq(t) : null, der: fDer ? fDer(t) : null })
  }
  return out
}
