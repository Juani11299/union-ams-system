import { buscar, categoriaRsiMod, datosNordBord, fasesUnilaterales, tipoDeTest, type TipoTest } from '@/features/evaluaciones/universal/perfilClinico'
import type { AntropometriaPersonal, EvaluacionLegacy, EvaluacionPersonal } from './api'

/**
 * Lenguaje para el JUGADOR (Fase 53): mismo criterio clínico que el dashboard del
 * Staff (`perfilClinico.ts`) pero traducido a mensajes simples y positivos. Funciones
 * puras: no leen el store ni la base.
 */

export type TonoFeedback = 'verde' | 'amarillo' | 'rojo' | 'gris'

export interface TarjetaTest {
  test: string
  tipo: TipoTest
  fecha: string
  /** Hasta 6 mediciones del valor principal (la última, al final) para la evolución. */
  serie: { fecha: string; valor: number }[]
  principal: { label: string; valor: number | null; unidad: string; deltaVsPrevia: number | null }
  secundarios: { label: string; valor: string }[]
  titulo: string
  mensaje: string
  tono: TonoFeedback
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const sinMeta = (m: Record<string, number | string | null>): Record<string, number> =>
  Object.fromEntries(Object.entries(m).filter(([k, v]) => !k.startsWith('_') && num(v) !== null)) as Record<string, number>
const f1 = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const f2 = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const lado = (l: 'L' | 'R') => (l === 'L' ? 'izquierda' : 'derecha')

/** Los CMJ importados con el panel viejo se leen como tests "CMJ Bilateral" / "CMJ Unilateral". */
export function nombreTestLegacy(evaluationName: string): string {
  if (/nord|curl/i.test(evaluationName)) return 'NordBord'
  if (/1\s*pp|slj|unilateral|single|1 pierna|una pierna/i.test(evaluationName)) return 'CMJ Unilateral'
  if (/cmj|salto|jump/i.test(evaluationName)) return 'CMJ Bilateral'
  return evaluationName
}

interface Medicion {
  fecha: string
  v: Record<string, number>
  pesoKg: number | null
}

function agrupar(evals: EvaluacionPersonal[], legacy: EvaluacionLegacy[]): Map<string, Medicion[]> {
  const out = new Map<string, Medicion[]>()
  const poner = (test: string, m: Medicion) => {
    const arr = out.get(test)
    if (arr) arr.push(m)
    else out.set(test, [m])
  }
  const dyn = new Set(evals.map((e) => e.test_name))
  for (const e of evals) poner(e.test_name, { fecha: e.fecha, v: sinMeta(e.metrics), pesoKg: num(e.metrics._bw) })
  for (const l of legacy) {
    const test = nombreTestLegacy(l.evaluation_name)
    if (dyn.has(test)) continue // lo nuevo manda sobre lo viejo
    const v: Record<string, number> = {}
    for (const [k, x] of Object.entries(l.metrics)) if (typeof x === 'number' && Number.isFinite(x)) v[k.trim()] = x
    poner(test, { fecha: l.fecha, v, pesoKg: l.body_weight_kg })
  }
  for (const arr of out.values()) arr.sort((a, b) => a.fecha.localeCompare(b.fecha))
  return out
}

function valorPrincipal(tipo: TipoTest, v: Record<string, number>, pesoKg: number | null): { label: string; valor: number | null; unidad: string } {
  if (tipo === 'nordbord') {
    const d = datosNordBord(v)
    if (!d) return { label: 'Fuerza de isquios', valor: null, unidad: 'N' }
    const rel = d.nkg ?? (pesoKg ? ((d.L + d.R) / 2) / pesoKg : null)
    return rel !== null ? { label: 'Fuerza de isquiotibiales', valor: rel, unidad: 'N/kg' } : { label: 'Fuerza de isquiotibiales', valor: (d.L + d.R) / 2, unidad: 'N' }
  }
  const jh = buscar(v, /^Jump Height \(Imp-Mom\) \[cm\]$/i) ?? buscar(v, /^Jump Height \(Imp-Mom\)\b(?!.*(Asym|\(L\)|\(R\)))/i)
  return { label: 'Altura de salto', valor: jh?.v ?? null, unidad: 'cm' }
}

function mensajeNordBord(v: Record<string, number>): { titulo: string; mensaje: string; tono: TonoFeedback; sec: { label: string; valor: string }[] } | null {
  const d = datosNordBord(v)
  if (!d) return null
  const sec = [
    { label: 'Pierna izquierda', valor: `${Math.round(d.L)} N` },
    { label: 'Pierna derecha', valor: `${Math.round(d.R)} N` },
    { label: 'Diferencia entre piernas', valor: `${f1(d.deficitPct)} %` },
  ]
  if (d.deficitPct < 10) return { titulo: '¡Piernas parejas!', mensaje: 'Tus dos piernas empujan parejo: ese equilibrio te protege de lesiones en los isquiotibiales.', tono: 'verde', sec }
  if (d.deficitPct <= 20) return { titulo: 'Casi parejo', mensaje: `Tu pierna ${lado(d.debil)} empuja algo menos. Sumá trabajo de fuerza excéntrica (nórdicos) en la pierna ${lado(d.debil)} con tu preparador.`, tono: 'amarillo', sec }
  return { titulo: 'A trabajar el equilibrio', mensaje: `Enfocar fuerza excéntrica en la pierna ${lado(d.debil)}: hay una diferencia importante con la otra. Tu preparador va a armarte un plan.`, tono: 'rojo', sec }
}

function mensajeCmj(v: Record<string, number>): { titulo: string; mensaje: string; tono: TonoFeedback; sec: { label: string; valor: string }[] } | null {
  const rsi = buscar(v, /^RSI-modified \[/i) ?? buscar(v, /^RSI-modified$/i)
  const sec: { label: string; valor: string }[] = []
  if (rsi) sec.push({ label: 'RSI-mod (reactividad)', valor: f2(rsi.v) })
  const asim = buscar(v, /^Concentric Peak Force \/ BM.*Asym/i)
  if (asim) sec.push({ label: 'Diferencia entre piernas al despegar', valor: `${f1(asim.v)} %` })
  if (!rsi) return sec.length ? { titulo: 'Tu salto', mensaje: 'Seguí evaluándote: la comparación con tus tests anteriores te muestra cómo evolucionás.', tono: 'gris', sec } : null
  const c = categoriaRsiMod(rsi.v)
  if (c.nivel === 'ok') return { titulo: '¡Potencia excelente!', mensaje: 'Saltás alto y rápido: tu reactividad está en un gran nivel. ¡A sostenerlo!', tono: 'verde', sec }
  if (c.nivel === 'info') return { titulo: 'Buen nivel de potencia', mensaje: 'Estás en un nivel competitivo. Con constancia en gimnasio y pliometría podés seguir subiendo.', tono: 'amarillo', sec }
  return { titulo: 'Hoy el salto vino cansado', mensaje: 'Tu reactividad estuvo más baja: puede ser fatiga. Cuidá el sueño, la hidratación y la alimentación estos días.', tono: 'amarillo', sec }
}

function mensajeUnilateral(v: Record<string, number>): { titulo: string; mensaje: string; tono: TonoFeedback; sec: { label: string; valor: string }[] } | null {
  const fases = fasesUnilaterales(v)
  if (!fases.length) return null
  const alt = fases.find((f) => f.id === 'altura')
  const ate = fases.find((f) => f.id === 'aterrizaje')
  const sec: { label: string; valor: string }[] = []
  if (alt) sec.push({ label: 'Salto pierna izq. / der.', valor: `${f1(alt.L)} / ${f1(alt.R)} cm` })
  if (ate) sec.push({ label: 'Diferencia al aterrizar', valor: `${f1(ate.asimPct)} %` })
  if (ate && ate.asimPct > 15) return { titulo: 'Atención al aterrizaje', mensaje: 'Notamos una diferencia grande al aterrizar con cada pierna. Trabajá la técnica de frenado con tu preparador y el kinesiólogo.', tono: 'rojo', sec }
  if (alt && alt.asimPct >= 10) return { titulo: 'Una pierna salta menos', mensaje: `Tu pierna ${lado(alt.lado)} salta menos que la otra. Con trabajo unilateral lo vas a emparejar.`, tono: 'amarillo', sec }
  return { titulo: '¡Piernas parejas!', mensaje: 'Saltás parecido con las dos piernas y aterrizás de forma pareja. ¡Muy bien!', tono: 'verde', sec }
}

/** `pesoFallback`: último peso de la antropometría, para calcular N/kg cuando el test no trae el peso del día. */
export function construirTarjetas(evals: EvaluacionPersonal[], legacy: EvaluacionLegacy[], pesoFallback: number | null = null): TarjetaTest[] {
  const out: TarjetaTest[] = []
  for (const [test, meds] of agrupar(evals, legacy)) {
    const tipo = tipoDeTest(test)
    const ult = meds[meds.length - 1]
    const prev = meds.length > 1 ? meds[meds.length - 2] : null
    const p = valorPrincipal(tipo, ult.v, ult.pesoKg ?? pesoFallback)
    const pPrev = prev ? valorPrincipal(tipo, prev.v, prev.pesoKg ?? pesoFallback) : null
    const fb = tipo === 'nordbord' ? mensajeNordBord(ult.v) : tipo === 'cmj-unilateral' ? mensajeUnilateral(ult.v) : tipo === 'cmj-bilateral' ? mensajeCmj(ult.v) : null
    const serie = meds
      .map((m) => ({ fecha: m.fecha, valor: valorPrincipal(tipo, m.v, m.pesoKg ?? pesoFallback).valor }))
      .filter((x): x is { fecha: string; valor: number } => x.valor !== null)
      .slice(-6)
    out.push({
      test, tipo, fecha: ult.fecha, serie,
      principal: { ...p, deltaVsPrevia: p.valor !== null && pPrev?.valor != null ? p.valor - pPrev.valor : null },
      secundarios: fb?.sec ?? [],
      titulo: fb?.titulo ?? 'Resultado cargado',
      mensaje: fb?.mensaje ?? 'Tu resultado quedó registrado. Tu preparador te lo va a explicar.',
      tono: fb?.tono ?? 'gris',
    })
  }
  const orden = ['NordBord', 'CMJ Bilateral', 'CMJ Unilateral']
  return out.sort((a, b) => (orden.indexOf(a.test) + 99 * +(orden.indexOf(a.test) < 0)) - (orden.indexOf(b.test) + 99 * +(orden.indexOf(b.test) < 0)))
}

// ─────────────────────────────────────────────────────────────────────────────
// Composición corporal
// ─────────────────────────────────────────────────────────────────────────────

export interface ResumenComposicion {
  fecha: string
  fechaPrevia: string | null
  peso: number | null
  musculoPct: number | null
  grasaPct: number | null
  dPeso: number | null
  dMusculo: number | null
  dGrasa: number | null
  titulo: string
  mensaje: string
  tono: TonoFeedback
}

export function resumirComposicion(filas: AntropometriaPersonal[]): ResumenComposicion | null {
  const ord = [...filas].sort((a, b) => a.fecha.localeCompare(b.fecha))
  if (ord.length === 0) return null
  const conv = (x: number | string | null) => (x === null ? null : Number.isFinite(Number(x)) ? Number(x) : null)
  const ult = ord[ord.length - 1]
  const prev = ord.length > 1 ? ord[ord.length - 2] : null
  const d = (a: number | string | null, b: number | string | null | undefined) => (conv(a) !== null && b !== undefined && conv(b) !== null ? (conv(a) as number) - (conv(b) as number) : null)
  const dPeso = d(ult.peso, prev?.peso)
  const dMusculo = d(ult.masa_muscular, prev?.masa_muscular)
  const dGrasa = d(ult.masa_adiposa, prev?.masa_adiposa)

  // Orientación AUTOMÁTICA a partir de los cambios; no es una indicación del área nutricional.
  let titulo = 'Primera medición'
  let mensaje = 'Es tu primera medición: la vamos a usar como punto de partida para ver cómo evolucionás.'
  let tono: TonoFeedback = 'gris'
  if (prev) {
    if (dMusculo !== null && dMusculo >= 0.5 && (dGrasa === null || dGrasa <= 0.5)) {
      titulo = 'Excelente ganancia muscular'
      mensaje = 'Subió tu masa muscular sin aumentar la grasa: el trabajo de gimnasio y la alimentación están funcionando.'
      tono = 'verde'
    } else if (dGrasa !== null && dGrasa >= 1 && (dMusculo === null || dMusculo <= 0.5)) {
      titulo = 'Subió la masa adiposa'
      mensaje = 'Aumentó el porcentaje de grasa sin ganar músculo. Cuidá la alimentación y hablalo con la nutricionista del club.'
      tono = 'amarillo'
    } else if (dMusculo !== null && dMusculo <= -1) {
      titulo = 'Bajó la masa muscular'
      mensaje = 'Priorizá las proteínas, el descanso y el trabajo de fuerza. Consultalo con la nutricionista.'
      tono = 'amarillo'
    } else {
      titulo = 'Composición estable'
      mensaje = 'Tu composición se mantiene. Seguí con buena hidratación, descanso y una alimentación ordenada.'
      tono = 'verde'
    }
  }
  return { fecha: ult.fecha, fechaPrevia: prev?.fecha ?? null, peso: conv(ult.peso), musculoPct: conv(ult.masa_muscular), grasaPct: conv(ult.masa_adiposa), dPeso, dMusculo, dGrasa, titulo, mensaje, tono }
}

