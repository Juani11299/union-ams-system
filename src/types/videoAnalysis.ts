/**
 * Módulo de Análisis de Video y Tagging Inteligente (Fase 34, "estilo AURE
 * Sports" — ver migration_fase34_video_analysis.sql). Dos entidades: un
 * `VideoMatch` es un partido o entrenamiento filmado (con su link de video,
 * VEO u otro), y un `VideoTag` es UN evento marcado dentro de ese video, con
 * el segundo exacto de aparición.
 */

/** Botones de tagging rápido (Paso 2 del pedido) — un solo click durante el vivo. */
export type EventoTipoTag =
  | 'gol'
  | 'perdida_salida'
  | 'recuperacion_campo_rival'
  | 'tiro_libre'
  | 'falta'
  | 'transicion'

/** Fase del juego (Paso 3, filtro táctico) — cada `EventoTipoTag` cae en una por defecto, ver `FASE_POR_EVENTO` en `videoAnalysisConstants.ts`. */
export type FaseJuego = 'ataque_organizado' | 'defensa' | 'abp' | 'transicion'

export interface VideoMatch {
  id: string
  categoryId: string
  seasonId: string
  title: string
  /** Link pegado tal cual por el profe — VEO (`app.veo.co/matches/...`) u otro video directo (mp4/HLS). Ver `esUrlVeo` en `videoAnalysisConstants.ts`. */
  videoUrl: string
  fecha: string
  createdAt: string
}

export interface VideoTag {
  id: string
  matchId: string
  athleteId: string | null
  tipo: EventoTipoTag
  fase: FaseJuego
  /** Segundo exacto del video (no el minuto de partido) donde ocurre el evento. */
  timestampSegundos: number
  nota: string | null
  createdAt: string
}
