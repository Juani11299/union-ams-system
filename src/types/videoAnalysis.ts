/**
 * Módulo de Análisis de Video y Tagging Inteligente (Fase 34, "estilo AURE
 * Sports" — ver migration_fase34_video_analysis.sql). Dos entidades: un
 * `VideoMatch` es un partido o entrenamiento filmado (con su link de video,
 * VEO u otro), y un `VideoTag` es UN evento marcado dentro de ese video, con
 * el segundo exacto de aparición.
 *
 * Fase 34.2 ("Nivel Champions") — Smart Context Tagging + Matriz de Zonas:
 * ver `zonaCancha.ts` sugerirContexto (fase/zona sugeridas por heurística
 * explícita sobre el historial reciente, NO un modelo de IA/CV real — este
 * módulo no procesa video ni pixeles, sólo la secuencia de tags ya
 * cargados) y `videoAnalysisConstants.ts` (grilla 6x3, atajos de teclado).
 */

/** Botones de tagging rápido (Paso 2 del pedido) — un solo click durante el vivo. */
export type EventoTipoTag =
  | 'gol'
  | 'perdida_salida'
  | 'recuperacion_campo_rival'
  | 'tiro_libre'
  | 'falta'
  | 'transicion'

/**
 * Fase del juego (Paso 3, filtro táctico; Fase 34.2 split de "transición"
 * en ofensiva/defensiva para que el Smart Context Tagging pueda distinguir
 * "recién perdimos la pelota" de "recién la recuperamos" — ambas eran antes
 * la misma etiqueta genérica "transicion", perdiendo la distinción táctica
 * más importante del concepto). Cada `EventoTipoTag` cae en una por
 * defecto, ver `FASE_POR_EVENTO`; `sugerirContexto` puede pisar ese default
 * según lo que pasó en los ~5 segundos previos.
 */
export type FaseJuego = 'ataque_organizado' | 'defensa' | 'transicion_ofensiva' | 'transicion_defensiva' | 'abp'

/**
 * Matriz de Zonas de la Cancha (Fase 34.2, Paso 2) — 6 bandas longitudinales
 * (iniciación/creación/finalización, propia y rival) × 3 carriles
 * (izquierdo/central/derecho) = 18 zonas. Es la unidad de ubicación que usa
 * tanto la sugerencia de zona en el tagging como el posicionamiento
 * automático de fichas en la Pizarra 2D.
 */
export type BandaCancha =
  | 'iniciacion_propia'
  | 'creacion_propia'
  | 'finalizacion_propia'
  | 'finalizacion_rival'
  | 'creacion_rival'
  | 'iniciacion_rival'

export type CarrilCancha = 'izquierdo' | 'central' | 'derecho'

export interface ZonaCancha {
  banda: BandaCancha
  carril: CarrilCancha
}

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
  /** Zona de la cancha (Fase 34.2) — `null` en tags viejos de antes de esta fase, o si el profe no la cargó. */
  zona: ZonaCancha | null
  nota: string | null
  createdAt: string
}

/**
 * Detección de Visión por Computadora (Fase 34.3) — UN objeto detectado por
 * un modelo de object detection (COCO-SSD vía TensorFlow.js) corriendo
 * ENTERAMENTE en el navegador de quien usa la app: no hay servidor, no hay
 * API key, no hay costo por uso. Es visión real (caja delimitadora +
 * confianza genuinas de una red neuronal, no inventadas), pero acotada a lo
 * que COCO-SSD sabe reconocer — personas y la pelota — no a conceptos
 * tácticos de fútbol. Ver `aiVisionService.ts`.
 */
export interface DeteccionObjeto {
  /** Clase de COCO-SSD relevante para el módulo — filtra el resto de las ~80 clases del dataset. */
  clase: 'person' | 'sports ball'
  /** 0 a 1 — confianza real que devuelve el modelo para esta detección puntual. */
  score: number
  /** Caja delimitadora en píxeles DEL FOTOGRAMA CAPTURADO (no del elemento `<video>` en pantalla) — [x, y, ancho, alto] desde la esquina superior izquierda. */
  bbox: [number, number, number, number]
}

/**
 * Resultado completo de analizar el fotograma actual (Fase 34.3). La
 * `zonaSugerida` es un cálculo geométrico honesto — el centroide de los
 * jugadores detectados, mapeado a la matriz 6x3 — NO una lectura táctica:
 * asume que el fotograma muestra una porción representativa de la cancha
 * (no sirve, por ejemplo, sobre un primer plano de un jugador). La fase de
 * juego la sigue sugiriendo `sugerirContexto` (heurística sobre el
 * historial de tags), que no cambia con esto.
 */
export interface AnalisisVisionLocal {
  detecciones: DeteccionObjeto[]
  zonaSugerida: ZonaCancha | null
  /** Resumen en una frase para mostrarle al profe, ej. "8 jugadores y 1 pelota detectados — concentrados en Creación propia · Carril central". */
  resumen: string
}
