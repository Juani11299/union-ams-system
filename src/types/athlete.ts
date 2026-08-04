export type Posicion =
  | 'Arquero'
  | 'Defensor Central'
  | 'Lateral'
  | 'Volante Central'
  | 'Volante Ofensivo'
  | 'Extremo'
  | 'Delantero'

/**
 * Estado Médico del jugador (Fase 11) — controla si aparece como elegible para
 * convocatoria en "Día de Partido". 'Rehabilitación'/'Baja Médica' lo excluyen
 * automáticamente; sólo 'Activo' es convocable.
 */
export type EstadoSalud = 'Activo' | 'Rehabilitación' | 'Baja Médica'

export interface Athlete {
  id: string
  nombre: string
  fechaNacimiento: string
  posiciones: Posicion[]
  estadoSalud: EstadoSalud
  observacionesMedicas?: string
  fotoUrl?: string
}
