/**
 * Tareas Generales del día (Fase 10) — jerarquía Microciclo -> Día (SessionPlan)
 * -> Tareas -> Detalle (Fuerza/Campo). Cada `SessionPlan` puede tener varias
 * `DailyTask`, una por bloque de trabajo del día.
 */
export type TipoTarea = 'Físico de Campo' | 'Técnico-Táctico' | 'Gimnasio'

export const TIPOS_TAREA: TipoTarea[] = ['Físico de Campo', 'Técnico-Táctico', 'Gimnasio']

/**
 * Carga cognitiva (complejidad decisional de la tarea) y densidad (relación
 * trabajo:pausa) — dos variables de control de carga a "nivel general" de la
 * tarea, ampliamente usadas en el diseño de entrenamiento de deportes de
 * conjunto (ej. periodización táctica), más allá de RPE/duración: dos tareas
 * con el mismo RPE esperado pueden imponer una demanda decisional muy distinta.
 */
export type NivelCargaCognitiva = 'Baja' | 'Media' | 'Alta'
export const NIVELES_CARGA_COGNITIVA: NivelCargaCognitiva[] = ['Baja', 'Media', 'Alta']

/**
 * Elemento del editor táctico 2D (Fase 11, TacBoard) — posición en porcentaje
 * (0-100) del ancho/alto de la cancha, no en píxeles, para que el diseño quede
 * igual sin importar el tamaño de pantalla en que se edite o se vea después.
 */
export type TacboardTipoElemento = 'cono' | 'arco' | 'balon' | 'jugador'

export interface TacboardElemento {
  id: string
  tipo: TacboardTipoElemento
  x: number
  y: number
  /** Sólo para `jugador`: dorsal mostrado dentro del círculo. */
  numero?: number
  /** Sólo para `jugador`: equipo propio vs. rival. */
  color?: 'azul' | 'rojo'
}

export interface TacboardData {
  elementos: TacboardElemento[]
}

/** Objetivos de Carga Externa/GPS planificados para una tarea Físico de Campo. */
export interface GpsObjetivo {
  distanciaObjetivo?: number
  hsrObjetivo?: number
  aceleracionesObjetivo?: number
  desaceleracionesObjetivo?: number
}

export interface DailyTask {
  id: string
  session_plan_id: string
  tipo: TipoTarea
  /** Enfoque específico y corto (ej. "Ataque", "COD", "Empujes") — Fase 10.1: es
   * lo primero que se lee en la vista semanal, como un título de la tarea. */
  enfoque: string
  objetivo: string
  duracionMin: number
  rpeEsperado: number
  /** Relación trabajo:pausa (ej. "1:2", "1:3", "Continuo"). Opcional. */
  densidad?: string
  /** Complejidad decisional/táctica de la tarea. Opcional. */
  cargaCognitiva?: NivelCargaCognitiva
  orden: number
  /** Estado del editor táctico 2D — sólo tareas Técnico-Táctico (Fase 11). */
  tacboardData?: TacboardData
  /** Objetivos de Carga Externa/GPS — sólo tareas Físico de Campo (Fase 11). */
  gpsObjetivo?: GpsObjetivo
}
