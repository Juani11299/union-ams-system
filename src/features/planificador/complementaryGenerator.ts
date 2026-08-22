import type { ComplementaryPlanExercise } from '@/types'

/**
 * Auto-generador de Planes Complementarios por objetivo en lenguaje natural
 * (Fase 36, "Varita Mágica"). Motor local por Keywords — no la Edge Function
 * `generate-workout` (Fase 17.5, ver `aiPlanGenerator.ts`), que genera
 * `GymSheetData` de UNA sesión y necesita un deploy que no puedo verificar
 * yo mismo end-to-end. Acá la tarea es puramente determinística (una tabla
 * de progresión de hipertrofia fija + un diccionario de ejercicios por tag),
 * así que un motor local es más rápido, gratis y 100% testeable sin
 * depender de una API externa.
 *
 * Reglas Fisiológicas del Club (fijas, no configurables desde el prompt):
 * 1. Objetivo único: Hipertrofia y Prevención (ejercicios "Vitamina").
 *    NUNCA fuerza máxima ni potencia neural — por eso el catálogo de abajo
 *    no incluye ejercicios explosivos/pesados de una sola repetición.
 * 2. Minimizar fatiga residual, en especial de tren inferior — las notas de
 *    cada ejercicio de tren inferior lo recuerdan explícitamente.
 * 3. Sobrecarga progresiva de VOLUMEN semana a semana, con descarga en la
 *    última semana del plan (ver `PROGRESION_HIPERTROFIA_BASE`/`DELOAD`).
 */

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10)
}

interface EjercicioCatalogo {
  exercise: string
  notes: string
}

interface TagDefinicion {
  tag: string
  /** OR de grupos — alcanza con que UN grupo matchee. Cada grupo es un AND: TODAS sus palabras deben aparecer en el prompt. */
  gruposClave: string[][]
  ejercicios: EjercicioCatalogo[]
}

const DICCIONARIO_TAGS: TagDefinicion[] = [
  {
    tag: 'empuje_sup',
    gruposClave: [['empuje', 'superior'], ['empuje', 'tren superior'], ['push']],
    ejercicios: [
      { exercise: 'Press inclinado con mancuernas', notes: 'Hipertrofia — tempo controlado, RIR 2-3, nunca al fallo' },
      { exercise: 'Flexiones de brazos (lastradas o en banco)', notes: 'Vitamina — variante según nivel, foco en técnica' },
      { exercise: 'Press militar sentado con mancuernas', notes: 'Hipertrofia — core activo, evitar arqueo lumbar' },
    ],
  },
  {
    tag: 'traccion_sup',
    gruposClave: [['traccion', 'superior'], ['traccion', 'tren superior'], ['espalda'], ['remo'], ['pull']],
    ejercicios: [
      { exercise: 'Remo con mancuerna a un brazo', notes: 'Hipertrofia — pausa de 1s en la contracción' },
      { exercise: 'Jalón al pecho en polea', notes: 'Hipertrofia — controlar la fase excéntrica' },
      { exercise: 'Face pull con banda', notes: 'Vitamina — salud de hombro, cargas livianas' },
    ],
  },
  {
    tag: 'zona_media',
    gruposClave: [['zona media'], ['core'], ['abdomen'], ['abdominales']],
    ejercicios: [
      { exercise: 'Plancha frontal con anti-extensión', notes: 'Vitamina — no perder la alineación lumbo-pélvica' },
      { exercise: 'Pallof press', notes: 'Vitamina — anti-rotación, clave para prevención lumbar' },
      { exercise: 'Dead bug', notes: 'Vitamina — control motor, baja fatiga residual' },
    ],
  },
  {
    tag: 'preventivo_aductor',
    gruposClave: [['aductor'], ['aductores'], ['copenhague']],
    ejercicios: [
      { exercise: 'Copenhagen plank (rodilla o pie apoyado)', notes: 'Vitamina — prevención de pubalgia, progresar por tiempo de sostén' },
      { exercise: 'Slide lateral (Cossack asistido)', notes: 'Vitamina — bajo impacto, controlar la excursión' },
      { exercise: 'Aducción de cadera con banda', notes: 'Vitamina — activación, sin buscar fatiga' },
    ],
  },
  {
    tag: 'preventivo_isquios',
    gruposClave: [['isquio'], ['isquios'], ['isquiotibial'], ['isquiotibiales'], ['nordic']],
    ejercicios: [
      { exercise: 'Nordic curl asistido (excéntrico)', notes: 'Vitamina — prevención de desgarros, progresar por rango, no por carga' },
      { exercise: 'Puente de glúteo unipodal', notes: 'Vitamina — foco en control excéntrico' },
      { exercise: 'Peso muerto rumano con mancuernas (carga liviana)', notes: 'Vitamina — nunca cerca del fallo, sin fatiga residual para el campo' },
    ],
  },
  {
    tag: 'preventivo_hombro',
    gruposClave: [['hombro'], ['manguito'], ['rotador']],
    ejercicios: [
      { exercise: 'Rotación externa de hombro con banda', notes: 'Vitamina — manguito rotador, cargas mínimas' },
      { exercise: 'Y-T-W en banco inclinado', notes: 'Vitamina — estabilidad escapular' },
    ],
  },
  {
    tag: 'tren_inferior_general',
    gruposClave: [['tren inferior'], ['pierna'], ['piernas'], ['cuadriceps'], ['gluteo'], ['gluteos']],
    ejercicios: [
      { exercise: 'Sentadilla goblet (carga liviana)', notes: 'Hipertrofia — RIR alto, minimizar fatiga residual para el campo' },
      { exercise: 'Step-up bajo con mancuernas', notes: 'Vitamina — unilateral, controlar la fase excéntrica' },
      { exercise: 'Puente de glúteo con barra (carga moderada)', notes: 'Hipertrofia — foco en glúteo, sin buscar 1RM' },
    ],
  },
  {
    tag: 'movilidad',
    gruposClave: [['movilidad']],
    ejercicios: [
      { exercise: 'Movilidad de cadera 90/90', notes: 'Vitamina — entre bloques o como activación' },
      { exercise: 'Movilidad torácica en cuadrupedia', notes: 'Vitamina — activación, sin carga' },
    ],
  },
]

/** Fallback cuando el prompt no matchea ningún tag conocido — nunca deja la planilla vacía. */
const CATALOGO_GENERICO: EjercicioCatalogo[] = [
  { exercise: 'Plancha frontal', notes: 'Vitamina — genérico, ajustar según el objetivo real del plan' },
  { exercise: 'Press inclinado con mancuernas', notes: 'Hipertrofia — genérico, RIR 2-3' },
  { exercise: 'Remo con mancuerna a un brazo', notes: 'Hipertrofia — genérico, controlar la excéntrica' },
]

function coincideGrupo(promptNormalizado: string, grupo: string[]): boolean {
  return grupo.every((palabra) => promptNormalizado.includes(normalizar(palabra)))
}

/** Selecciona hasta 3 ejercicios por cada tag que matchee el prompt (Paso 2) — nunca duplica un ejercicio entre tags. */
export function seleccionarEjerciciosPorObjetivo(prompt: string): EjercicioCatalogo[] {
  const promptNormalizado = normalizar(prompt)
  const seleccionados: EjercicioCatalogo[] = []
  const yaElegidos = new Set<string>()

  for (const tagDef of DICCIONARIO_TAGS) {
    const tagActivo = tagDef.gruposClave.some((grupo) => coincideGrupo(promptNormalizado, grupo))
    if (!tagActivo) continue

    for (const ej of tagDef.ejercicios.slice(0, 3)) {
      if (yaElegidos.has(ej.exercise)) continue
      seleccionados.push(ej)
      yaElegidos.add(ej.exercise)
    }
  }

  return seleccionados.length > 0 ? seleccionados : CATALOGO_GENERICO
}

export type MetodoHipertrofia = 'tradicional' | 'rest-pause' | 'drop-sets' | 'tut'

/** Para el `<select>` del editor — orden = orden de aparición en el dropdown. */
export const METODOS_HIPERTROFIA_OPCIONES: { value: MetodoHipertrofia; label: string }[] = [
  { value: 'tradicional', label: 'Tradicional' },
  { value: 'rest-pause', label: 'Rest-Pause' },
  { value: 'drop-sets', label: 'Drop Sets' },
  { value: 'tut', label: 'Tiempo Bajo Tensión (TUT)' },
]

/**
 * Progresión de hipertrofia predeterminada (Paso 3) — para un bloque de 4
 * semanas reproduce EXACTO el ejemplo pedido: 3x10@7 → 3x12@7.5 → 4x10@8 →
 * 3x8@6 (descarga). La última semana del plan siempre es descarga; las
 * anteriores ciclan por este patrón de 3 pasos, sumando 1 serie extra cada
 * vez que el ciclo se repite completo — así un mesociclo más largo que 4
 * semanas sigue progresando en vez de repetir números idénticos. Sólo el
 * método Tradicional tiene esta escalada numérica: es el único con una
 * estructura limpia series×reps×RPE — los otros 3 métodos (abajo) tienen
 * formatos de texto propios (clusters de Rest-Pause, "+Fallo" de Drop Sets,
 * tempo de TUT) que no se prestan a la misma aritmética, así que sólo ciclan.
 */
const PROGRESION_TRADICIONAL_BASE = [
  { series: 3, reps: 10, rpe: 7 },
  { series: 3, reps: 12, rpe: 7.5 },
  { series: 4, reps: 10, rpe: 8 },
]
const DELOAD_TRADICIONAL = { series: 3, reps: 8, rpe: 6 }

function formatearPrescripcion(p: { series: number; reps: number; rpe: number }): string {
  return `${p.series}x${p.reps} @ RPE ${p.rpe}`
}

/** Pasos de carga (se ciclan sin escalar en planes de más de 3 semanas de carga) de los métodos no-Tradicionales. */
const PASOS_CARGA_POR_METODO: Record<Exclude<MetodoHipertrofia, 'tradicional'>, string[]> = {
  'rest-pause': ['1x(12+4+4)', '1x(12+5+5)', '1x(15+5+5)'],
  'drop-sets': ['3x(8+Fallo)', '3x(10+Fallo)', '4x(8+Fallo)'],
  tut: ['3x8 (Tempo 4010)', '3x10 (Tempo 4010)', '4x8 (Tempo 4010)'],
}
const DESCARGA_POR_METODO: Record<Exclude<MetodoHipertrofia, 'tradicional'>, string> = {
  'rest-pause': '1x(12) Descarga',
  'drop-sets': '3x8 Normal (Descarga)',
  tut: '3x8 Normal (Descarga)',
}

export function generarProgresionSemanal(semanas: number, metodo: MetodoHipertrofia = 'tradicional'): string[] {
  if (metodo === 'tradicional') {
    if (semanas <= 1) return [formatearPrescripcion(PROGRESION_TRADICIONAL_BASE[0])]

    const resultado: string[] = []
    const semanasCarga = semanas - 1
    for (let i = 0; i < semanasCarga; i++) {
      const vuelta = Math.floor(i / PROGRESION_TRADICIONAL_BASE.length)
      const base = PROGRESION_TRADICIONAL_BASE[i % PROGRESION_TRADICIONAL_BASE.length]
      resultado.push(formatearPrescripcion({ ...base, series: base.series + vuelta }))
    }
    resultado.push(formatearPrescripcion(DELOAD_TRADICIONAL))
    return resultado
  }

  const pasosCarga = PASOS_CARGA_POR_METODO[metodo]
  const descarga = DESCARGA_POR_METODO[metodo]

  if (semanas <= 1) return [pasosCarga[0]]

  const resultado: string[] = []
  const semanasCarga = semanas - 1
  for (let i = 0; i < semanasCarga; i++) {
    resultado.push(pasosCarga[i % pasosCarga.length])
  }
  resultado.push(descarga)
  return resultado
}

/**
 * Genera la matriz completa del plan (Pasos 2+3) — ejercicios elegidos por
 * el objetivo en lenguaje natural, con la progresión del método de
 * hipertrofia elegido inyectada en cada semana. El caller
 * (`ComplementaryPlanEditor`) hace el append sobre el estado `ejercicios`
 * existente con el resultado (Paso 3 de esta fase — ya no sobrescribe).
 */
export function generarPlanDesdeObjetivo(
  prompt: string,
  semanas: number,
  metodo: MetodoHipertrofia = 'tradicional',
): ComplementaryPlanExercise[] {
  const ejerciciosSeleccionados = seleccionarEjerciciosPorObjetivo(prompt)
  const progresionPorSemana = generarProgresionSemanal(semanas, metodo)

  return ejerciciosSeleccionados.map((ej) => {
    const progressions: Record<string, string> = {}
    for (let i = 1; i <= semanas; i++) {
      progressions[`week${i}`] = progresionPorSemana[i - 1] ?? progresionPorSemana[progresionPorSemana.length - 1]
    }
    return { id: nuevoId(), exercise: ej.exercise, notes: ej.notes, progressions }
  })
}
