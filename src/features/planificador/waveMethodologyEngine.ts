import type { GymSheetBloque, GymSheetData } from '@/types'

/**
 * Generador Metodológico por Olas y Vectores (Fase 37) — construye una
 * sesión de Gimnasio completa en 3 bloques biomecánicamente coherentes
 * (Fuerza Velocidad → Fuerza Máxima → Auxiliares), según el vector de
 * movimiento dominante de la sesión. Motor local (diccionario), mismo
 * criterio que `complementaryGenerator.ts`: la estructura es fija y
 * determinística (no creatividad de IA), así que no depende de ningún
 * deploy externo.
 *
 * Arquitectura de la sesión (hardcodeada, no configurable desde la UI):
 * - BLOQUE 1: FUERZA VELOCIDAD (NEURAL) — Derivado Olímpico pesado,
 *   Isométrico Overcoming de empuje (RFD, Natera), Zona media, Salto o
 *   lanzamiento (CEA Lento). 3x3 a alta velocidad.
 * - BLOQUE 2: FUERZA MÁXIMA (ESTRUCTURAL) — Dinámico pesado de tren
 *   inferior, Empuje superior, Tracción superior, Zona media. 4x5 pesado.
 * - BLOQUE 3: AUXILIARES / VITAMINA — preventivos y compensatorios. 2x10.
 */

export type VectorObjetivo = 'vertical' | 'horizontal' | 'lateral'

export const VECTORES_OPCIONES: { value: VectorObjetivo; label: string }[] = [
  { value: 'vertical', label: 'Mejora Vertical (Saltos y Duelos aéreos)' },
  { value: 'horizontal', label: 'Mejora Horizontal (Aceleración y Sprint)' },
  { value: 'lateral', label: 'Mejora Lateral (Frenos y Cambios de Dirección - COD)' },
]

interface EjercicioOla {
  nombre: string
  notas: string
}

interface MatrizVector {
  /** Exactos 4: Derivado Olímpico, Isométrico PUSH (Overcoming), Core, Salto/Lanzamiento (CEA Lento). */
  b1: EjercicioOla[]
  /** Exactos 4: Dinámico pesado tren inferior, Empuje superior, Tracción superior, Core. */
  b2: EjercicioOla[]
  /** Auxiliares/Vitamina — preventivos y compensatorios específicos del vector. */
  b3: EjercicioOla[]
}

const MATRIZ_POR_VECTOR: Record<VectorObjetivo, MatrizVector> = {
  vertical: {
    b1: [
      { nombre: 'Power Clean desde bloques (pesado)', notas: 'Derivado Olímpico — RFD en vector vertical' },
      {
        nombre: 'Isometric Squat contra pines (Overcoming)',
        notas: 'PUSH Iso (Natera) — empuje máximo vertical contra el piso',
      },
      { nombre: 'Pallof Press de rodillas', notas: 'Core — anti-rotación, base de sostén vertical' },
      {
        nombre: 'Salto vertical con contramovimiento (CMJ cargado)',
        notas: 'CEA Lento — vector vertical, duelo aéreo',
      },
    ],
    b2: [
      { nombre: 'Sentadilla trasera (Back Squat)', notas: 'Dinámico pesado — base estructural del salto' },
      { nombre: 'Press de banca plano', notas: 'Empuje de tren superior' },
      { nombre: 'Dominadas lastradas', notas: 'Tracción de tren superior' },
      { nombre: 'Plancha frontal con anti-extensión', notas: 'Core' },
    ],
    b3: [
      { nombre: 'Elevación de talones (gemelos)', notas: 'Vitamina — stiffness de tobillo para el duelo aéreo' },
      {
        nombre: 'Isometría de rodilla en extensión parcial',
        notas: 'Vitamina — prevención de tendinopatía rotuliana',
      },
    ],
  },
  horizontal: {
    b1: [
      { nombre: 'Kettlebell Swing pesado', notas: 'Derivado — extensión de cadera explosiva' },
      {
        nombre: 'Split Squat Overcoming Isometric',
        notas: 'PUSH Iso (Natera) — empuje máximo en ángulo de aceleración',
      },
      { nombre: 'Pallof Press', notas: 'Core — anti-rotación, transferencia a la zancada' },
      { nombre: 'Broad Jump (salto en largo)', notas: 'CEA Lento — vector horizontal, aterrizaje controlado' },
    ],
    b2: [
      { nombre: 'Hip Thrust', notas: 'Dinámico pesado — extensión de cadera, base de la aceleración' },
      { nombre: 'Press inclinado con mancuernas', notas: 'Empuje de tren superior' },
      { nombre: 'Remo con mancuernas', notas: 'Tracción de tren superior' },
      { nombre: 'Plancha frontal', notas: 'Core — anti-extensión' },
    ],
    b3: [
      { nombre: 'Nordic curl (Curl Nórdico)', notas: 'Vitamina — prevención de isquiotibiales' },
      { nombre: 'Movilidad de tobillo', notas: 'Vitamina — rango de dorsiflexión para la fase de apoyo' },
    ],
  },
  lateral: {
    b1: [
      { nombre: 'Cargada colgante a una pierna (lateral)', notas: 'Derivado — producción de fuerza en plano frontal' },
      {
        nombre: 'Isométrico de Aductor/Abductor empujando el rack',
        notas: 'PUSH Iso (Natera) — empuje máximo en vector lateral',
      },
      { nombre: 'Woodchopper con polea', notas: 'Core rotacional — transferencia a cambios de dirección' },
      { nombre: 'Skater Jumps', notas: 'CEA Lento — vector lateral, aterrizaje y frenado' },
    ],
    b2: [
      { nombre: 'Sentadilla búlgara / Estocada lateral', notas: 'Dinámico pesado — unilateral, plano frontal' },
      { nombre: 'Press militar con mancuernas', notas: 'Empuje de tren superior' },
      { nombre: 'Dominadas (asistidas si hace falta)', notas: 'Tracción de tren superior' },
      { nombre: 'Copenhagen plank', notas: 'Core / aductor — estabilidad lateral' },
    ],
    b3: [
      { nombre: 'Slide lateral (Cossack asistido)', notas: 'Vitamina — control excéntrico en el plano frontal' },
      { nombre: 'Rotación externa de hombro con banda', notas: 'Vitamina — salud de hombro' },
    ],
  },
}

interface ParametrosBloque {
  series: string
  repeticiones: string
  descanso: string
  notaGeneral: string
}

/** Parámetros lógicos por defecto (Paso 3) — el profe ajusta cargaKg a mano según el jugador; nunca se fabrica un Kg. */
const PARAMETROS_B1: ParametrosBloque = {
  series: '3',
  repeticiones: '3',
  descanso: '3 min',
  notaGeneral: 'Alta velocidad de ejecución (RFD)',
}
const PARAMETROS_B2: ParametrosBloque = {
  series: '4',
  repeticiones: '5',
  descanso: '2-3 min',
  notaGeneral: 'Pesado — RPE 8-9',
}
const PARAMETROS_B3: ParametrosBloque = {
  series: '2',
  repeticiones: '10',
  descanso: '60s',
  notaGeneral: 'Vitamina — foco técnico, sin fatiga',
}

const TITULO_B1 = 'BLOQUE 1: FUERZA VELOCIDAD'
const TITULO_B2 = 'BLOQUE 2: FUERZA MÁXIMA'
const TITULO_B3 = 'BLOQUE 3: AUXILIARES / VITAMINA'

function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function construirBloque(titulo: string, ejercicios: EjercicioOla[], params: ParametrosBloque): GymSheetBloque {
  return {
    id: nuevoId(),
    titulo,
    ejercicios: ejercicios.map((ej) => ({
      id: nuevoId(),
      nombre: ej.nombre,
      series: params.series,
      repeticiones: params.repeticiones,
      cargaKg: '',
      descanso: params.descanso,
      notas: `${ej.notas} — ${params.notaGeneral}`,
    })),
  }
}

/**
 * Construye la matriz completa (Pasos 2+3) — reemplaza por completo
 * `bloques`, conserva el título de la sesión que ya tenía el profe
 * (`tituloSesion`). El caller (`GymSheetEditor`) decide cuándo sobrescribir
 * el estado local con el resultado.
 */
export function generarSesionPorVector(vector: VectorObjetivo, tituloSesion: string): GymSheetData {
  const matriz = MATRIZ_POR_VECTOR[vector]
  const vectorLabel = VECTORES_OPCIONES.find((v) => v.value === vector)?.label ?? vector

  return {
    titulo: tituloSesion,
    objetivos: `Generado por el Motor de Olas y Vectores — ${vectorLabel}`,
    bloques: [
      construirBloque(TITULO_B1, matriz.b1, PARAMETROS_B1),
      construirBloque(TITULO_B2, matriz.b2, PARAMETROS_B2),
      construirBloque(TITULO_B3, matriz.b3, PARAMETROS_B3),
    ],
  }
}
