import type {
  Athlete,
  BloqueFuerza,
  ColumnaFuerza,
  DailyTask,
  EstadoSalud,
  ExternalLoad,
  FuenteCarga,
  GpsObjetivo,
  GymExternalLoad,
  GymSet,
  GymSheetData,
  NivelCargaCognitiva,
  PhysicalTest,
  Posicion,
  SessionExecution,
  SessionPlan,
  MatchDayTag,
  StrengthAssignment,
  StrengthAssignmentAthlete,
  StrengthTemplate,
  StrengthTemplateExercise,
  TacboardData,
  TipoPlantillaFuerza,
  TipoSesion,
  TipoTarea,
  WellnessEntry,
  WellnessRating,
  ComplementaryPlan,
  ComplementaryPlanData,
} from '@/types'

// Las tablas `clubs`, `seasons`, `team_categories` y `rosters` ya usan snake_case
// idéntico a sus tipos TS (Club/Season/TeamCategory/Roster) — no necesitan mapper,
// el row de Supabase se castea directo. Estas cuatro sí mezclan camelCase (UI) con
// snake_case (season_id/category_id ya vienen snake_case en el tipo TS) y necesitan
// traducción explícita en ambos sentidos.

export interface AthleteRow {
  id: string
  nombre: string
  fecha_nacimiento: string
  posiciones: string[]
  estado_salud: string
  observaciones_medicas: string | null
  foto_url: string | null
}

export function athleteFromRow(row: AthleteRow): Athlete {
  return {
    id: row.id,
    nombre: row.nombre,
    fechaNacimiento: row.fecha_nacimiento,
    posiciones: row.posiciones as Posicion[],
    estadoSalud: row.estado_salud as EstadoSalud,
    observacionesMedicas: row.observaciones_medicas ?? undefined,
    fotoUrl: row.foto_url ?? undefined,
  }
}

export interface AthleteInput {
  nombre: string
  fechaNacimiento: string
  posiciones: Posicion[]
  estadoSalud: EstadoSalud
  observacionesMedicas?: string
}

export function athleteToRow(input: AthleteInput) {
  return {
    nombre: input.nombre,
    fecha_nacimiento: input.fechaNacimiento,
    posiciones: input.posiciones,
    estado_salud: input.estadoSalud,
    observaciones_medicas: input.observacionesMedicas || null,
  }
}

export interface SessionPlanRow {
  id: string
  season_id: string
  category_id: string
  titulo: string
  fecha: string
  match_day: string
  tipo: string
  duracion_estimada_min: number
  carga_objetivo: number
  descripcion: string | null
  rpe_esperado: number | null
  duracion_real_min: number | null
  gym_sheet_data: GymSheetData | null
}

export function sessionPlanFromRow(row: SessionPlanRow): SessionPlan {
  return {
    id: row.id,
    season_id: row.season_id,
    category_id: row.category_id,
    titulo: row.titulo,
    fecha: row.fecha,
    matchDay: row.match_day as MatchDayTag,
    tipo: row.tipo as TipoSesion,
    duracionEstimadaMin: row.duracion_estimada_min,
    cargaObjetivo: row.carga_objetivo,
    descripcion: row.descripcion ?? undefined,
    rpeEsperado: row.rpe_esperado ?? undefined,
    duracionRealMin: row.duracion_real_min ?? undefined,
    gymSheetData: row.gym_sheet_data ?? undefined,
  }
}

/**
 * Fase 14 — "Objetivo (UA)" dejó de ser un input manual: se deriva siempre de
 * `rpeEsperado × duracionEstimadaMin` ("Carga Interna Proyectada"), la misma
 * fórmula sRPE ya usada en toda la app (`calcularCargaInterna`). Por eso acá
 * ya no se recibe `cargaObjetivo` del caller — se calcula en este mapper para
 * que sea imposible que el número guardado quede desincronizado del cálculo.
 */
export interface NuevoSessionPlanInput {
  seasonId: string
  categoryId: string
  titulo: string
  fecha: string
  matchDay: MatchDayTag
  tipo: TipoSesion
  duracionEstimadaMin: number
  rpeEsperado: number
  descripcion?: string
}

export function sessionPlanToInsertRow(input: NuevoSessionPlanInput) {
  return {
    season_id: input.seasonId,
    category_id: input.categoryId,
    titulo: input.titulo,
    fecha: input.fecha,
    match_day: input.matchDay,
    tipo: input.tipo,
    duracion_estimada_min: input.duracionEstimadaMin,
    rpe_esperado: input.rpeEsperado,
    carga_objetivo: input.rpeEsperado * input.duracionEstimadaMin,
    descripcion: input.descripcion || null,
  }
}

/**
 * "Configuración de Sesión Diaria" — RPE esperado (pre) y tiempo real (post).
 * Fase 14: cuando se edita `rpeEsperado` acá, el caller (`ConfiguracionSesionDiaria`)
 * también manda `cargaObjetivo` recalculado (rpeEsperado × duracionEstimadaMin
 * del plan) para que el "Objetivo (UA)" guardado nunca quede desincronizado.
 */
export interface SessionPlanConfigInput {
  rpeEsperado?: number
  duracionRealMin?: number
  cargaObjetivo?: number
}

export function sessionPlanConfigToUpdateRow(input: SessionPlanConfigInput) {
  const row: Record<string, number> = {}
  if (input.rpeEsperado !== undefined) row.rpe_esperado = input.rpeEsperado
  if (input.duracionRealMin !== undefined) row.duracion_real_min = input.duracionRealMin
  if (input.cargaObjetivo !== undefined) row.carga_objetivo = input.cargaObjetivo
  return row
}

export interface SessionExecutionRow {
  id: string
  plan_id: string | null
  athlete_id: string
  season_id: string
  category_id: string
  fecha: string
  rpe: number
  duracion_min: number
  carga_interna_calculada: number
  comentario: string | null
}

export function sessionExecutionFromRow(row: SessionExecutionRow): SessionExecution {
  return {
    id: row.id,
    planId: row.plan_id ?? '',
    athleteId: row.athlete_id,
    season_id: row.season_id,
    category_id: row.category_id,
    fecha: row.fecha,
    rpe: row.rpe,
    duracionMin: row.duracion_min,
    cargaInternaCalculada: row.carga_interna_calculada,
    comentario: row.comentario ?? undefined,
  }
}

export interface NuevaCargaInput {
  /** null si el jugador registra RPE sin que haya una sesión planificada para hoy. */
  planId: string | null
  athleteId: string
  seasonId: string
  categoryId: string
  fecha: string
  rpe: number
  duracionMin: number
  cargaInternaCalculada: number
}

/**
 * Fase 21: `submitSessionLoad` la usa con `.upsert(row, { onConflict:
 * 'athlete_id,fecha' })` — un jugador sólo puede tener UN registro de RPE por
 * día, así que un reenvío del mismo día (typeo, "mejor pongo de nuevo")
 * sobreescribe la fila anterior en vez de sumar una carga fantasma. Requiere
 * la unique constraint de `migration_fase21_upsert_diario.sql`.
 */
export function sessionExecutionToUpsertRow(input: NuevaCargaInput) {
  return {
    plan_id: input.planId || null,
    athlete_id: input.athleteId,
    season_id: input.seasonId,
    category_id: input.categoryId,
    fecha: input.fecha,
    rpe: input.rpe,
    duracion_min: input.duracionMin,
    carga_interna_calculada: input.cargaInternaCalculada,
  }
}

export interface WellnessEntryRow {
  id: string
  athlete_id: string
  season_id: string
  category_id: string
  fecha: string
  sueno: number
  dolor_muscular: number
  estres: number
  fatiga: number
  comentarios_dolor: string | null
}

export function wellnessEntryFromRow(row: WellnessEntryRow): WellnessEntry {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    season_id: row.season_id,
    category_id: row.category_id,
    fecha: row.fecha,
    sueno: row.sueno as WellnessRating,
    dolorMuscular: row.dolor_muscular as WellnessRating,
    estres: row.estres as WellnessRating,
    fatiga: row.fatiga as WellnessRating,
    comentarioDolor: row.comentarios_dolor ?? undefined,
  }
}

export interface NuevoWellnessInput {
  athleteId: string
  seasonId: string
  categoryId: string
  fecha: string
  sueno: WellnessRating
  dolorMuscular: WellnessRating
  estres: WellnessRating
  fatiga: WellnessRating
  comentarioDolor?: string
}

/**
 * Fase 21: `submitWellness` la usa con `.upsert(row, { onConflict:
 * 'athlete_id,fecha' })` — mismo criterio "keep the latest" que
 * `sessionExecutionToUpsertRow`, ver esa nota. Requiere la unique constraint
 * de `migration_fase21_upsert_diario.sql`.
 */
export function wellnessEntryToUpsertRow(input: NuevoWellnessInput) {
  return {
    athlete_id: input.athleteId,
    season_id: input.seasonId,
    category_id: input.categoryId,
    fecha: input.fecha,
    sueno: input.sueno,
    dolor_muscular: input.dolorMuscular,
    estres: input.estres,
    fatiga: input.fatiga,
    // Sólo se manda la key si hay comentario: así el wellness sigue funcionando
    // aunque `migration_fase9.sql` (columna `comentarios_dolor`) todavía no se
    // haya corrido — mandar `null` explícito igual falla si la columna no existe.
    ...(input.comentarioDolor ? { comentarios_dolor: input.comentarioDolor } : {}),
  }
}

export interface ExternalLoadRow {
  id: string
  plan_id: string
  athlete_id: string
  season_id: string
  category_id: string
  fecha: string
  total_distance: number
  high_speed_running: number
  player_load: number
  sprints: number | null
  max_velocity: number | null
  fuente: string
}

export function externalLoadFromRow(row: ExternalLoadRow): ExternalLoad {
  return {
    id: row.id,
    planId: row.plan_id,
    athleteId: row.athlete_id,
    season_id: row.season_id,
    category_id: row.category_id,
    fecha: row.fecha,
    totalDistance: row.total_distance,
    highSpeedRunning: row.high_speed_running,
    playerLoad: row.player_load,
    sprints: row.sprints ?? undefined,
    maxVelocity: row.max_velocity ?? undefined,
    fuente: row.fuente as FuenteCarga,
  }
}

export interface NuevaCargaExternaInput {
  planId: string
  athleteId: string
  seasonId: string
  categoryId: string
  fecha: string
  totalDistance: number
  highSpeedRunning: number
  playerLoad: number
}

export function externalLoadToInsertRow(input: NuevaCargaExternaInput) {
  return {
    plan_id: input.planId,
    athlete_id: input.athleteId,
    season_id: input.seasonId,
    category_id: input.categoryId,
    fecha: input.fecha,
    total_distance: input.totalDistance,
    high_speed_running: input.highSpeedRunning,
    player_load: input.playerLoad,
    fuente: 'GPS',
  }
}

export interface PhysicalTestRow {
  id: string
  athlete_id: string
  season_id: string
  category_id: string
  fecha: string
  cmj_cm: number
  rsi_modificado: number | null
  notas: string | null
}

export function physicalTestFromRow(row: PhysicalTestRow): PhysicalTest {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    season_id: row.season_id,
    category_id: row.category_id,
    fecha: row.fecha,
    cmjCm: row.cmj_cm,
    rsiModificado: row.rsi_modificado ?? undefined,
    notas: row.notas ?? undefined,
  }
}

export interface NuevoPhysicalTestInput {
  athleteId: string
  seasonId: string
  categoryId: string
  fecha: string
  cmjCm: number
  rsiModificado?: number
  notas?: string
}

export function physicalTestToInsertRow(input: NuevoPhysicalTestInput) {
  return {
    athlete_id: input.athleteId,
    season_id: input.seasonId,
    category_id: input.categoryId,
    fecha: input.fecha,
    cmj_cm: input.cmjCm,
    rsi_modificado: input.rsiModificado ?? null,
    notas: input.notas || null,
  }
}

export interface StrengthBlockRow {
  id: string
  season_id: string
  category_id: string
  columna: string
  titulo: string
  series_reps: string
  carga_pct: string | null
  notas: string | null
  orden: number
}

export function strengthBlockFromRow(row: StrengthBlockRow): BloqueFuerza {
  return {
    id: row.id,
    season_id: row.season_id,
    category_id: row.category_id,
    columna: row.columna as ColumnaFuerza,
    titulo: row.titulo,
    seriesReps: row.series_reps,
    cargaPct: row.carga_pct ?? undefined,
    notas: row.notas ?? undefined,
    orden: row.orden,
  }
}

export interface NuevoStrengthBlockInput {
  seasonId: string
  categoryId: string
  columna: ColumnaFuerza
  titulo: string
  seriesReps: string
  cargaPct?: string
  notas?: string
}

export function strengthBlockToInsertRow(input: NuevoStrengthBlockInput) {
  return {
    season_id: input.seasonId,
    category_id: input.categoryId,
    columna: input.columna,
    titulo: input.titulo,
    series_reps: input.seriesReps,
    carga_pct: input.cargaPct || null,
    notas: input.notas || null,
    orden: 0,
  }
}

export interface DailyTaskRow {
  id: string
  session_plan_id: string
  tipo: string
  enfoque: string
  objetivo: string
  duracion_min: number
  rpe_esperado: number
  densidad: string | null
  carga_cognitiva: string | null
  orden: number
  tacboard_data: TacboardData | null
  distancia_objetivo: number | null
  hsr_objetivo: number | null
  aceleraciones_objetivo: number | null
  desaceleraciones_objetivo: number | null
}

export function dailyTaskFromRow(row: DailyTaskRow): DailyTask {
  const tieneGps =
    row.distancia_objetivo != null ||
    row.hsr_objetivo != null ||
    row.aceleraciones_objetivo != null ||
    row.desaceleraciones_objetivo != null

  return {
    id: row.id,
    session_plan_id: row.session_plan_id,
    tipo: row.tipo as TipoTarea,
    enfoque: row.enfoque,
    objetivo: row.objetivo,
    duracionMin: row.duracion_min,
    rpeEsperado: row.rpe_esperado,
    densidad: row.densidad ?? undefined,
    cargaCognitiva: (row.carga_cognitiva as NivelCargaCognitiva | null) ?? undefined,
    orden: row.orden,
    tacboardData: row.tacboard_data ?? undefined,
    gpsObjetivo: tieneGps
      ? {
          distanciaObjetivo: row.distancia_objetivo ?? undefined,
          hsrObjetivo: row.hsr_objetivo ?? undefined,
          aceleracionesObjetivo: row.aceleraciones_objetivo ?? undefined,
          desaceleracionesObjetivo: row.desaceleraciones_objetivo ?? undefined,
        }
      : undefined,
  }
}

export interface NuevoDailyTaskInput {
  sessionPlanId: string
  tipo: TipoTarea
  enfoque: string
  objetivo: string
  duracionMin: number
  rpeEsperado: number
  densidad?: string
  cargaCognitiva?: NivelCargaCognitiva
}

export function dailyTaskToInsertRow(input: NuevoDailyTaskInput) {
  return {
    session_plan_id: input.sessionPlanId,
    tipo: input.tipo,
    enfoque: input.enfoque,
    objetivo: input.objetivo,
    duracion_min: input.duracionMin,
    rpe_esperado: input.rpeEsperado,
    densidad: input.densidad || null,
    carga_cognitiva: input.cargaCognitiva || null,
    orden: 0,
  }
}

/** Edición de una tarea existente — mismos campos que el alta, sin `orden`. */
export interface DailyTaskEdicionInput {
  tipo: TipoTarea
  enfoque: string
  objetivo: string
  duracionMin: number
  rpeEsperado: number
  densidad?: string
  cargaCognitiva?: NivelCargaCognitiva
}

export function dailyTaskEdicionToUpdateRow(input: DailyTaskEdicionInput) {
  return {
    tipo: input.tipo,
    enfoque: input.enfoque,
    objetivo: input.objetivo,
    duracion_min: input.duracionMin,
    rpe_esperado: input.rpeEsperado,
    densidad: input.densidad || null,
    carga_cognitiva: input.cargaCognitiva || null,
  }
}

/** Guardado del editor táctico 2D (Fase 11) — reemplaza el JSON completo. */
export function tacboardDataToUpdateRow(data: TacboardData) {
  return { tacboard_data: data }
}

/** Guardado de la Planilla Estética de Gimnasio (Fase 16) — reemplaza el JSON completo. */
export function gymSheetDataToUpdateRow(data: GymSheetData) {
  return { gym_sheet_data: data }
}

/** Objetivos GPS de una tarea Físico de Campo (Fase 11) — todos opcionales. */
export function gpsObjetivoToUpdateRow(input: GpsObjetivo) {
  const row: Record<string, number | null> = {}
  if (input.distanciaObjetivo !== undefined) row.distancia_objetivo = input.distanciaObjetivo
  if (input.hsrObjetivo !== undefined) row.hsr_objetivo = input.hsrObjetivo
  if (input.aceleracionesObjetivo !== undefined) row.aceleraciones_objetivo = input.aceleracionesObjetivo
  if (input.desaceleracionesObjetivo !== undefined) {
    row.desaceleraciones_objetivo = input.desaceleracionesObjetivo
  }
  return row
}

/**
 * "Día de Partido" (Fase 11) — Registro de Minutos post-partido. A diferencia
 * de una sesión de entrenamiento (donde `duracionRealMin` es un único valor
 * compartido por todo el equipo, cargado en `SessionPlan`), en un partido cada
 * jugador tiene minutos distintos — por eso acá SÍ se escriben `duracion_min`/
 * `carga_interna_calculada` reales por atleta directo en `session_executions`
 * (esos dos campos quedan "vestigiales" — en 0 — para el resto de los flujos
 * desde Fase 9.2). Se upsertea contra el índice único parcial
 * `(athlete_id, plan_id) where plan_id is not null` de `migration_fase11.sql`.
 */
export interface ResultadoPartidoInput {
  planId: string
  athleteId: string
  seasonId: string
  categoryId: string
  fecha: string
  rpe: number
  minutosJugados: number
}

export function resultadoPartidoToUpsertRow(input: ResultadoPartidoInput) {
  return {
    plan_id: input.planId,
    athlete_id: input.athleteId,
    season_id: input.seasonId,
    category_id: input.categoryId,
    fecha: input.fecha,
    rpe: input.rpe,
    duracion_min: input.minutosJugados,
    carga_interna_calculada: input.rpe * input.minutosJugados,
  }
}

// -----------------------------------------------------------------------------
// Biblioteca de Plantillas de Fuerza (Fase 12) — `strength_templates` es de
// club, no de season/category (ver nota en migration_fase12.sql).
// -----------------------------------------------------------------------------

export interface StrengthTemplateRow {
  id: string
  club_id: string
  tipo: string
  nombre: string
  descripcion: string | null
}

export function strengthTemplateFromRow(row: StrengthTemplateRow): StrengthTemplate {
  return {
    id: row.id,
    club_id: row.club_id,
    tipo: row.tipo as TipoPlantillaFuerza,
    nombre: row.nombre,
    descripcion: row.descripcion ?? undefined,
  }
}

export interface NuevaStrengthTemplateInput {
  clubId: string
  tipo: TipoPlantillaFuerza
  nombre: string
  descripcion?: string
}

export function strengthTemplateToInsertRow(input: NuevaStrengthTemplateInput) {
  return {
    club_id: input.clubId,
    tipo: input.tipo,
    nombre: input.nombre,
    descripcion: input.descripcion || null,
  }
}

export interface StrengthTemplateExerciseRow {
  id: string
  template_id: string
  titulo: string
  series_reps: string
  carga_pct: string | null
  notas: string | null
  orden: number
}

export function strengthTemplateExerciseFromRow(row: StrengthTemplateExerciseRow): StrengthTemplateExercise {
  return {
    id: row.id,
    templateId: row.template_id,
    titulo: row.titulo,
    seriesReps: row.series_reps,
    cargaPct: row.carga_pct ?? undefined,
    notas: row.notas ?? undefined,
    orden: row.orden,
  }
}

export interface NuevoStrengthTemplateExerciseInput {
  templateId: string
  titulo: string
  seriesReps: string
  cargaPct?: string
  notas?: string
}

export function strengthTemplateExerciseToInsertRow(input: NuevoStrengthTemplateExerciseInput) {
  return {
    template_id: input.templateId,
    titulo: input.titulo,
    series_reps: input.seriesReps,
    carga_pct: input.cargaPct || null,
    notas: input.notas || null,
    orden: 0,
  }
}

export interface StrengthAssignmentRow {
  id: string
  template_id: string
  session_plan_id: string
  tipo: string
}

export function strengthAssignmentFromRow(row: StrengthAssignmentRow): StrengthAssignment {
  return {
    id: row.id,
    templateId: row.template_id,
    sessionPlanId: row.session_plan_id,
    tipo: row.tipo as TipoPlantillaFuerza,
  }
}

export interface StrengthAssignmentAthleteRow {
  id: string
  assignment_id: string
  athlete_id: string
}

export function strengthAssignmentAthleteFromRow(row: StrengthAssignmentAthleteRow): StrengthAssignmentAthlete {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    athleteId: row.athlete_id,
  }
}

/**
 * Alta de una asignación (plantilla arrastrada a un día) — se hace en 2 pasos
 * desde el store (insertar `strength_assignments`, después las filas de
 * `strength_assignment_athletes` con el id que devuelve el primer insert), no
 * hay un único insert combinado porque supabase-js no soporta insertar en dos
 * tablas relacionadas de una — ver `assignTemplateToDay` en `useAppStore.ts`.
 */
export interface NuevaStrengthAssignmentInput {
  templateId: string
  sessionPlanId: string
  tipo: TipoPlantillaFuerza
}

export function strengthAssignmentToInsertRow(input: NuevaStrengthAssignmentInput) {
  return {
    template_id: input.templateId,
    session_plan_id: input.sessionPlanId,
    tipo: input.tipo,
  }
}

// -----------------------------------------------------------------------------
// gym_external_loads (Fase 17 — Terminal de Fuerza / Registro de Carga Externa)
// -----------------------------------------------------------------------------

export interface GymExternalLoadRow {
  id: string
  athlete_id: string
  session_id: string
  exercise_name: string
  sets_data: { reps: number; weight_kg: number }[]
  total_tonnage: number
  created_at: string
}

export function gymExternalLoadFromRow(row: GymExternalLoadRow): GymExternalLoad {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    sessionId: row.session_id,
    exerciseName: row.exercise_name,
    setsData: row.sets_data.map((s) => ({ reps: s.reps, weightKg: s.weight_kg })),
    totalTonnage: Number(row.total_tonnage),
    createdAt: row.created_at,
  }
}

export interface NuevoGymExternalLoadInput {
  athleteId: string
  sessionId: string
  exerciseName: string
  setsData: GymSet[]
  totalTonnage: number
}

export function gymExternalLoadToUpsertRow(input: NuevoGymExternalLoadInput) {
  return {
    athlete_id: input.athleteId,
    session_id: input.sessionId,
    exercise_name: input.exerciseName,
    sets_data: input.setsData.map((s) => ({ reps: s.reps, weight_kg: s.weightKg })),
    total_tonnage: input.totalTonnage,
  }
}

export interface ComplementaryPlanRow {
  id: string
  category_id: string
  title: string
  duration_weeks: number
  plan_data: ComplementaryPlanData
  created_at: string
}

export function complementaryPlanFromRow(row: ComplementaryPlanRow): ComplementaryPlan {
  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    durationWeeks: row.duration_weeks,
    planData: row.plan_data,
    createdAt: row.created_at,
  }
}

export interface NuevoComplementaryPlanInput {
  categoryId: string
  title: string
  durationWeeks: number
  planData: ComplementaryPlanData
}

export function complementaryPlanToInsertRow(input: NuevoComplementaryPlanInput) {
  return {
    category_id: input.categoryId,
    title: input.title,
    duration_weeks: input.durationWeeks,
    plan_data: input.planData,
  }
}

export interface ComplementaryPlanUpdateInput {
  title: string
  durationWeeks: number
  planData: ComplementaryPlanData
}

export function complementaryPlanToUpdateRow(input: ComplementaryPlanUpdateInput) {
  return {
    title: input.title,
    duration_weeks: input.durationWeeks,
    plan_data: input.planData,
  }
}
