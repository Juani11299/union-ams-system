/**
 * Una medición antropométrica de UN jugador en UNA fecha, tal cual la trajo
 * el archivo del nutricionista. Módulo 100% independiente del resto de la
 * app (mismo criterio que Evaluaciones de Rendimiento, Fase 39/41): el
 * jugador se identifica por su nombre del archivo (`jugadorKey` = nombre
 * normalizado) y la categoría es la columna "Categoría/División" del propio
 * archivo — nada se matchea contra `athletes` ni `team_categories`.
 */
export interface MedicionAntropo {
  /** Clave estable: jugadorKey|categoria|fecha — re-importar el mismo archivo pisa, no duplica. */
  id: string
  jugador: string
  jugadorKey: string
  categoria: string
  /** YYYY-MM-DD */
  fecha: string
  pesoKg: number | null
  /** Masa adiposa / grasa, en % */
  grasaPct: number | null
  /** Masa muscular, en % */
  musculoPct: number | null
  /** Sumatoria de pliegues, en mm */
  pliegues: number | null
}

export const SIN_CATEGORIA = 'Sin categoría'

/** Campos que el parser sabe detectar en las columnas del archivo. */
export type CampoAntropo = 'jugador' | 'fecha' | 'categoria' | 'peso' | 'grasa' | 'musculo' | 'pliegues'

/** Mapeo campo → nombre de columna del archivo (`null` = no detectada / sin usar). */
export type MapeoColumnas = Record<CampoAntropo, string | null>
