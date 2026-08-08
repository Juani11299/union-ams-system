/**
 * Planilla Estética de Gimnasio (Fase 16) — hoja de trabajo estilo europeo,
 * editable en vivo y exportable a PDF, asociada 1-a-1 a una `SessionPlan` de
 * tipo Gimnasio. Se guarda como un único JSONB (`gym_sheet_data`) porque es
 * contenido de "hoja impresa" que el profe edita como un todo, no datos que
 * otras vistas necesiten consultar fila por fila (a diferencia de `DailyTask`).
 */
export interface GymSheetEjercicio {
  id: string
  nombre: string
  series: string
  repeticiones: string
  cargaKg: string
  descanso: string
  notas: string
}

export interface GymSheetBloque {
  id: string
  titulo: string
  ejercicios: GymSheetEjercicio[]
}

export interface GymSheetData {
  titulo: string
  objetivos: string
  bloques: GymSheetBloque[]
}
