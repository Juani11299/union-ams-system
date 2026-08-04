import type { Posicion } from '@/types'

/**
 * Agrupación simplificada de las 7 posiciones granulares del roster en las 4
 * categorías que pide el filtro del Dashboard. No reemplaza `Posicion` (que
 * sigue siendo la posición real del jugador en Administración) — es sólo una
 * proyección para el Select de "Control Carga Interna".
 */
export type GrupoPosicion = 'Arquero' | 'Defensor' | 'Mediocampista' | 'Delantero'

export const GRUPOS_POSICION: GrupoPosicion[] = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero']

const MAPA_GRUPO: Record<Posicion, GrupoPosicion> = {
  Arquero: 'Arquero',
  'Defensor Central': 'Defensor',
  Lateral: 'Defensor',
  'Volante Central': 'Mediocampista',
  'Volante Ofensivo': 'Mediocampista',
  Extremo: 'Delantero',
  Delantero: 'Delantero',
}

export function grupoDePosicion(posicion: Posicion): GrupoPosicion {
  return MAPA_GRUPO[posicion]
}
