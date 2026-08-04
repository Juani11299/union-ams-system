/**
 * Evaluación física manual (CMJ — Countermovement Jump).
 * Todavía vive sólo en el store local (ver useAppStore.addPhysicalTestLocal);
 * `migration_fase7.sql` prepara la tabla `physical_tests` para conectarlo a Supabase.
 *
 * `rsiModificado` (RSI mod = altura de salto / tiempo hasta despegue) es opcional porque
 * requiere una plataforma de fuerza (VALD ForceDecks, Hawkin Dynamics, etc.); si no se
 * carga, la app cae de nuevo a evaluar sólo la altura del CMJ — ver docs/fundamentos_cientificos.md.
 */
export interface PhysicalTest {
  id: string
  athleteId: string
  season_id: string
  category_id: string
  fecha: string
  cmjCm: number
  rsiModificado?: number
  notas?: string
}
