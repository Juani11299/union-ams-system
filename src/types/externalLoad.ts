export type FuenteCarga = 'GPS' | 'Manual' | 'CSV Import'

export interface ExternalLoad {
  id: string
  planId: string
  athleteId: string
  season_id: string
  category_id: string
  fecha: string
  totalDistance: number
  highSpeedRunning: number
  playerLoad: number
  sprints?: number
  maxVelocity?: number
  fuente?: FuenteCarga
}
