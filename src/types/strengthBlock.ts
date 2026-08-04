/** Bloques del Kanban de Planificación de Fuerza — conectado a Supabase (tabla `strength_blocks`). */
export type ColumnaFuerza = 'Activación' | 'Fuerza Máxima' | 'Potencia' | 'Accesorios'

export const COLUMNAS_FUERZA: ColumnaFuerza[] = [
  'Activación',
  'Fuerza Máxima',
  'Potencia',
  'Accesorios',
]

export interface BloqueFuerza {
  id: string
  season_id: string
  category_id: string
  columna: ColumnaFuerza
  titulo: string
  seriesReps: string
  cargaPct?: string
  notas?: string
  orden: number
}
