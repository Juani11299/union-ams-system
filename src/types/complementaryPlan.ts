/**
 * Plan Complementario (fuerza extra-club, ver migration_fase_complementarios.sql)
 * — mesociclo de varias semanas que el jugador imprime y se lleva a un
 * gimnasio externo. Cada ejercicio guarda su progresión semana a semana en
 * `progressions` (clave `week1`, `week2`, ... según `durationWeeks`).
 */
export interface ComplementaryPlanProgressions {
  [semana: string]: string
}

export interface ComplementaryPlanExercise {
  id: string
  exercise: string
  notes: string
  progressions: ComplementaryPlanProgressions
}

export interface ComplementaryPlanData {
  exercises: ComplementaryPlanExercise[]
}

export interface ComplementaryPlan {
  id: string
  categoryId: string
  title: string
  durationWeeks: number
  planData: ComplementaryPlanData
  createdAt: string
}
