import { useMemo } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '@/utils/idbStorage'
import { useAuthStore } from '@/store/useAuthStore'
import type {
  Athlete,
  SessionPlan,
  SessionExecution,
  ExternalLoad,
  WellnessEntry,
  Club,
  Season,
  TeamCategory,
  Roster,
  PhysicalTest,
  BloqueFuerza,
  ColumnaFuerza,
  DailyTask,
  GpsObjetivo,
  TacboardData,
  GymSheetData,
  StrengthTemplate,
  StrengthTemplateExercise,
  StrengthAssignment,
  StrengthAssignmentAthlete,
  GymExternalLoad,
  Posicion,
  ComplementaryPlan,
  VideoMatch,
  VideoTag,
} from '@/types'
import type { GrupoPosicion } from '@/utils/posicion'
import { supabase, isSupabaseConfigured } from '@/utils/supabase'
import { getErrorMessage } from '@/utils/errors'
import {
  athleteFromRow,
  athleteToRow,
  sessionPlanFromRow,
  sessionPlanToInsertRow,
  sessionPlanConfigToUpdateRow,
  sessionExecutionFromRow,
  sessionExecutionToUpsertRow,
  wellnessEntryFromRow,
  wellnessEntryToUpsertRow,
  externalLoadFromRow,
  externalLoadToInsertRow,
  physicalTestFromRow,
  physicalTestToInsertRow,
  strengthBlockFromRow,
  strengthBlockToInsertRow,
  dailyTaskFromRow,
  dailyTaskToInsertRow,
  dailyTaskEdicionToUpdateRow,
  tacboardDataToUpdateRow,
  gymSheetDataToUpdateRow,
  gpsObjetivoToUpdateRow,
  resultadoPartidoToUpsertRow,
  strengthTemplateFromRow,
  strengthTemplateToInsertRow,
  strengthTemplateExerciseFromRow,
  strengthTemplateExerciseToInsertRow,
  strengthAssignmentFromRow,
  strengthAssignmentToInsertRow,
  strengthAssignmentAthleteFromRow,
  gymExternalLoadFromRow,
  gymExternalLoadToUpsertRow,
  complementaryPlanFromRow,
  complementaryPlanToInsertRow,
  complementaryPlanToUpdateRow,
  videoMatchFromRow,
  videoMatchToInsertRow,
  videoTagFromRow,
  videoTagToInsertRow,
  type AthleteRow,
  type AthleteInput,
  type SessionPlanRow,
  type NuevoSessionPlanInput,
  type SessionPlanConfigInput,
  type SessionExecutionRow,
  type WellnessEntryRow,
  type ExternalLoadRow,
  type NuevaCargaInput,
  type NuevoWellnessInput,
  type NuevaCargaExternaInput,
  type PhysicalTestRow,
  type NuevoPhysicalTestInput,
  type StrengthBlockRow,
  type NuevoStrengthBlockInput,
  type DailyTaskRow,
  type NuevoDailyTaskInput,
  type DailyTaskEdicionInput,
  type ResultadoPartidoInput,
  type StrengthTemplateRow,
  type NuevaStrengthTemplateInput,
  type StrengthTemplateExerciseRow,
  type NuevoStrengthTemplateExerciseInput,
  type StrengthAssignmentRow,
  type StrengthAssignmentAthleteRow,
  type GymExternalLoadRow,
  type NuevoGymExternalLoadInput,
  type ComplementaryPlanRow,
  type NuevoComplementaryPlanInput,
  type ComplementaryPlanUpdateInput,
  type VideoMatchRow,
  type NuevoVideoMatchInput,
  type VideoTagRow,
  type NuevoVideoTagInput,
} from '@/utils/supabaseMappers'

const SUPABASE_NO_CONFIGURADO =
  'Faltan las variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Configuralas en un archivo .env (ver .env.example) y reiniciá el servidor.'

interface NuevaTemporadaInput {
  year: number
  isActive: boolean
}

interface NuevaCategoriaInput {
  nombre: string
}

interface AsignarPlantelInput {
  seasonId: string
  categoryId: string
  athleteIds: string[]
}

/** Importador masivo de jugadores (Fase 19) — un `AthleteInput` mínimo por
 * fila pegada desde Excel, ya validada por `parsearImportacionJugadores`.
 * `posiciones` es `string[]` y no `Posicion[]`: el Excel real del club trae
 * abreviaturas ("vol. der.") que `parsearImportacionJugadores` canoniza
 * cuando puede, pero guarda tal cual cuando no reconoce la abreviatura —
 * `athletes.posiciones` es `text[]` libre en el esquema (a diferencia de
 * `estado_salud`, no tiene `check`), así que no hace falta forzarlo al union
 * estricto que sí exige el formulario manual de "Nuevo jugador". */
interface ImportarJugadoresInput {
  seasonId: string
  categoryId: string
  jugadores: { nombre: string; posiciones: string[]; fechaNacimiento: string }[]
}

/** Alta de una asignación de plantilla de fuerza a un día (Fase 12) — el store hace los 2 inserts (assignment + athletes). */
interface AsignarStrengthTemplateInput {
  templateId: string
  sessionPlanId: string
  tipo: 'General' | 'Vitamina'
  athleteIds: string[]
}

interface AppState {
  club: Club | null
  seasons: Season[]
  categories: TeamCategory[]
  rosters: Roster[]
  athletes: Athlete[]
  sessionPlans: SessionPlan[]
  sessionExecutions: SessionExecution[]
  externalLoads: ExternalLoad[]
  wellnessEntries: WellnessEntry[]
  physicalTests: PhysicalTest[]
  strengthBlocks: BloqueFuerza[]
  dailyTasks: DailyTask[]
  strengthTemplates: StrengthTemplate[]
  strengthTemplateExercises: StrengthTemplateExercise[]
  strengthAssignments: StrengthAssignment[]
  strengthAssignmentAthletes: StrengthAssignmentAthlete[]
  gymExternalLoads: GymExternalLoad[]
  complementaryPlans: ComplementaryPlan[]
  videoMatches: VideoMatch[]
  videoTags: VideoTag[]
  activeSeasonId: string | null
  activeCategoryId: string | null
  /** Link mágico con `?locked=true` (Fase 19) — mientras esté en `true`, el
   * selector de categoría del TopBar se deshabilita. Deliberadamente no se
   * persiste (ver `partialize` al final del archivo): es un modo de sesión
   * que sólo debe activarse cuando la URL lo pide explícitamente, nunca
   * sobrevivir a un refresh sin la URL escopeada. */
  categoryLocked: boolean
  /** Link mágico con `?locked=true` SIN `category` (Fase 35, "Link de sólo
   * lectura, todo el club") — a diferencia de `categoryLocked`, no fija
   * ninguna categoría (el selector del TopBar sigue habilitado, el
   * visitante puede ver cualquiera) y habilita navegar a CASI todas las
   * rutas de `MainLayout` (ver `rutaBloqueadaParaVisitante` en
   * `staffAccess.ts` — bloquea sólo Administración y Ficha Médica). Al
   * igual que `categoryLocked`, deliberadamente no se persiste: sin la URL
   * que lo pide, no debe sobrevivir a un refresh. El bloqueo real de
   * ESCRITURA para ambos modos vive centralizado más abajo, envolviendo
   * cada acción que graba en Supabase — no hace falta que cada vista nueva
   * se acuerde de chequear `useSoloLectura()` a mano. */
  soloLecturaGlobal: boolean
  isLoading: boolean
  error: string | null
  /** Filtros de la vista "Control Carga Interna" (Fase 9). */
  filtroNombre: string
  filtroPosicion: GrupoPosicion | 'todas'
  /** Estado del modal/drawer de ingreso de datos (Fase 9). */
  modalIngresoAbierto: boolean
  modalIngresoTab: 'wellness' | 'rpe'
  setActiveSeason: (seasonId: string) => void
  setActiveCategory: (categoryId: string) => void
  /** Fija la categoría activa Y bloquea el selector — usado por los links mágicos escopeados (Fase 19). */
  setActiveCategoryLocked: (categoryId: string) => void
  /** Activa el "Link de sólo lectura, todo el club" (Fase 35) — no toca la categoría activa. */
  setSoloLecturaGlobal: () => void
  setFiltroNombre: (nombre: string) => void
  setFiltroPosicion: (posicion: GrupoPosicion | 'todas') => void
  abrirModalIngreso: (tab?: 'wellness' | 'rpe') => void
  cerrarModalIngreso: () => void
  setModalIngresoTab: (tab: 'wellness' | 'rpe') => void
  fetchInitialData: () => Promise<void>
  submitSessionLoad: (input: NuevaCargaInput) => Promise<void>
  submitWellness: (input: NuevoWellnessInput) => Promise<void>
  updateClub: (input: { nombre: string; logoUrl?: string }) => Promise<void>
  createSeason: (input: NuevaTemporadaInput) => Promise<void>
  marcarTemporadaActiva: (seasonId: string) => Promise<void>
  /** Borra la temporada — cascada real en la base (rosters, sesiones, RPE, wellness, GPS, CMJ, Fuerza de esa temporada). Resincroniza todo el store desde Supabase al terminar. */
  deleteSeason: (seasonId: string) => Promise<void>
  createCategory: (input: NuevaCategoriaInput) => Promise<void>
  /** Borra la categoría — misma cascada real que `deleteSeason`, pero por category_id. */
  deleteCategory: (categoryId: string) => Promise<void>
  createAthlete: (input: AthleteInput) => Promise<void>
  updateAthlete: (id: string, input: AthleteInput) => Promise<void>
  deleteAthlete: (id: string) => Promise<void>
  assignAthletesToRoster: (input: AsignarPlantelInput) => Promise<void>
  /** Alta + asignación a plantel en un solo paso (Fase 19, importador de Excel/CSV). Devuelve la cantidad de jugadores creados. */
  importAthletesBulk: (input: ImportarJugadoresInput) => Promise<number>
  removeAthleteFromRoster: (rosterId: string) => Promise<void>
  /** Devuelve la sesión creada — Fase 13 la usa para autogenerar una Sesión de Gimnasio al recibir un drop de plantilla de Fuerza y necesitar su id de inmediato. */
  createSessionPlan: (input: NuevoSessionPlanInput) => Promise<SessionPlan>
  updateSessionPlanConfig: (planId: string, input: SessionPlanConfigInput) => Promise<void>
  deleteSessionPlan: (id: string) => Promise<void>
  updateSessionPlanGymSheet: (id: string, data: GymSheetData) => Promise<void>
  submitExternalLoadsBulk: (inputs: NuevaCargaExternaInput[]) => Promise<void>
  submitPhysicalTest: (input: NuevoPhysicalTestInput) => Promise<void>
  createStrengthBlock: (input: NuevoStrengthBlockInput) => Promise<void>
  moveStrengthBlock: (id: string, columna: ColumnaFuerza) => Promise<void>
  deleteStrengthBlock: (id: string) => Promise<void>
  createDailyTask: (input: NuevoDailyTaskInput) => Promise<void>
  updateDailyTask: (id: string, input: DailyTaskEdicionInput) => Promise<void>
  updateDailyTaskTacboard: (id: string, data: TacboardData) => Promise<void>
  updateDailyTaskGpsObjetivo: (id: string, input: GpsObjetivo) => Promise<void>
  deleteDailyTask: (id: string) => Promise<void>
  submitMatchDayResultsBulk: (inputs: ResultadoPartidoInput[]) => Promise<void>
  createStrengthTemplate: (input: NuevaStrengthTemplateInput) => Promise<void>
  deleteStrengthTemplate: (id: string) => Promise<void>
  addStrengthTemplateExercise: (input: NuevoStrengthTemplateExerciseInput) => Promise<void>
  deleteStrengthTemplateExercise: (id: string) => Promise<void>
  assignTemplateToDay: (input: AsignarStrengthTemplateInput) => Promise<void>
  deleteStrengthAssignment: (id: string) => Promise<void>
  /** Alta/corrección del registro de la Terminal de Fuerza (Fase 17) — upsert por `(athleteId, sessionId)`. */
  submitGymExternalLoad: (input: NuevoGymExternalLoadInput) => Promise<void>
  /** Devuelve el plan creado — el editor lo necesita de inmediato para seguir editando sin recargar. */
  createComplementaryPlan: (input: NuevoComplementaryPlanInput) => Promise<ComplementaryPlan>
  updateComplementaryPlan: (id: string, input: ComplementaryPlanUpdateInput) => Promise<void>
  deleteComplementaryPlan: (id: string) => Promise<void>
  /** Clona un plan a otra categoría (Fase 39, "Clonado entre Categorías") — mismo `planData`/`durationWeeks`, categoría y título nuevos. Devuelve el plan clonado ya creado en Supabase. */
  cloneComplementaryPlan: (
    planOrigen: ComplementaryPlan,
    categoryIdDestino: string,
    tituloNuevo: string,
  ) => Promise<ComplementaryPlan>

  // ---------------------------------------------------------------------------
  // Video Analysis (Fase 34) — ver migration_fase34_video_analysis.sql
  // ---------------------------------------------------------------------------
  createVideoMatch: (input: NuevoVideoMatchInput) => Promise<VideoMatch>
  deleteVideoMatch: (id: string) => Promise<void>
  createVideoTag: (input: NuevoVideoTagInput) => Promise<VideoTag>
  updateVideoTag: (id: string, input: Partial<NuevoVideoTagInput>) => Promise<void>
  deleteVideoTag: (id: string) => Promise<void>
}

/** Lanza y deja el mensaje en `error` del store si Supabase no está configurado. */
function exigirSupabase(set: (partial: Partial<AppState>) => void): void {
  if (isSupabaseConfigured) return
  set({ error: SUPABASE_NO_CONFIGURADO })
  throw new Error(SUPABASE_NO_CONFIGURADO)
}

/** Tamaño de página de PostgREST — Supabase corta cualquier `.select()` sin `.range()` acá por defecto. */
const TAMANO_PAGINA_SUPABASE = 1000

/**
 * Trae TODAS las filas de una tabla, sin el límite silencioso de 1000 filas
 * que aplica PostgREST por defecto a cualquier `.select('*')` sin `.range()`
 * (Fase 34 — bug real detectado: `wellness_entries` ya superó las 1000 filas
 * y un `.select('*')` plano dejaba afuera los ~74 registros más nuevos, sin
 * ningún error visible; `session_executions` iba exactamente al mismo
 * destino apenas cruzara las 1000). Pagina con `.range()` en bloques de
 * `TAMANO_PAGINA_SUPABASE`, ordenando siempre por `fecha` descendente —así,
 * si algún día hace falta capear el total en vez de traer todo, los
 * registros más recientes son los primeros en llegar, nunca los más viejos.
 * Se corta quieto (page vacía o más corta que el tamaño pedido) en vez de
 * loopear un `count` aparte, para no sumar un round-trip extra.
 */
async function fetchTodasLasFilasPaginado(
  tabla: string,
): Promise<{ data: Record<string, unknown>[]; error: { message: string } | null }> {
  const filas: Record<string, unknown>[] = []
  let desde = 0

  while (true) {
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .order('fecha', { ascending: false })
      .range(desde, desde + TAMANO_PAGINA_SUPABASE - 1)

    if (error) return { data: filas, error }
    if (!data || data.length === 0) break

    filas.push(...data)
    if (data.length < TAMANO_PAGINA_SUPABASE) break
    desde += TAMANO_PAGINA_SUPABASE
  }

  return { data: filas, error: null }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  club: null,
  seasons: [],
  categories: [],
  rosters: [],
  athletes: [],
  sessionPlans: [],
  sessionExecutions: [],
  externalLoads: [],
  wellnessEntries: [],
  physicalTests: [],
  strengthBlocks: [],
  dailyTasks: [],
  strengthTemplates: [],
  strengthTemplateExercises: [],
  strengthAssignments: [],
  strengthAssignmentAthletes: [],
  gymExternalLoads: [],
  complementaryPlans: [],
  videoMatches: [],
  videoTags: [],
  activeSeasonId: null,
  activeCategoryId: null,
  categoryLocked: false,
  soloLecturaGlobal: false,
  isLoading: true,
  error: null,
  filtroNombre: '',
  filtroPosicion: 'todas',
  modalIngresoAbierto: false,
  modalIngresoTab: 'wellness',

  setActiveSeason: (seasonId) => set({ activeSeasonId: seasonId }),
  setActiveCategory: (categoryId) => set({ activeCategoryId: categoryId }),
  setActiveCategoryLocked: (categoryId) => set({ activeCategoryId: categoryId, categoryLocked: true }),
  setSoloLecturaGlobal: () => set({ soloLecturaGlobal: true }),
  setFiltroNombre: (nombre) => set({ filtroNombre: nombre }),
  setFiltroPosicion: (posicion) => set({ filtroPosicion: posicion }),
  abrirModalIngreso: (tab) => set({ modalIngresoAbierto: true, modalIngresoTab: tab ?? 'wellness' }),
  cerrarModalIngreso: () => set({ modalIngresoAbierto: false }),
  setModalIngresoTab: (tab) => set({ modalIngresoTab: tab }),

  fetchInitialData: async () => {
    if (!isSupabaseConfigured) {
      set({ isLoading: false, error: SUPABASE_NO_CONFIGURADO })
      return
    }

    set({ isLoading: true, error: null })

    // Nunca dejar la UI colgada esperando a Supabase: si a los 8s no respondió
    // (URL mal armada, red caída, proyecto pausado), seguimos con lo que haya.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase no respondió a tiempo (timeout de 8s).')), 8000),
    )

    try {
      const resultados = await Promise.race([
        Promise.all([
          supabase.from('clubs').select('*').limit(1).maybeSingle(),
          supabase.from('seasons').select('*').order('year'),
          supabase.from('team_categories').select('*'),
          supabase.from('rosters').select('*'),
          supabase.from('athletes').select('*'),
          supabase.from('session_plans').select('*'),
          fetchTodasLasFilasPaginado('session_executions'),
          fetchTodasLasFilasPaginado('wellness_entries'),
          supabase.from('external_loads').select('*'),
          supabase.from('physical_tests').select('*'),
          supabase.from('strength_blocks').select('*').order('orden'),
          supabase.from('daily_tasks').select('*').order('orden'),
          supabase.from('strength_templates').select('*'),
          supabase.from('strength_template_exercises').select('*').order('orden'),
          supabase.from('strength_assignments').select('*'),
          supabase.from('strength_assignment_athletes').select('*'),
          supabase.from('gym_external_loads').select('*'),
          supabase.from('complementary_plans').select('*'),
          supabase.from('video_matches').select('*').order('fecha', { ascending: false }),
          supabase.from('video_tags').select('*'),
        ]),
        timeout,
      ])

      const [
        clubRes,
        seasonsRes,
        categoriesRes,
        rostersRes,
        athletesRes,
        plansRes,
        executionsRes,
        wellnessRes,
        externalLoadsRes,
        physicalTestsRes,
        strengthBlocksRes,
        dailyTasksRes,
        strengthTemplatesRes,
        strengthTemplateExercisesRes,
        strengthAssignmentsRes,
        strengthAssignmentAthletesRes,
        gymExternalLoadsRes,
        complementaryPlansRes,
        videoMatchesRes,
        videoTagsRes,
      ] = resultados

      // Resiliente a fallas parciales: una tabla que falle (RLS mal configurada, tabla
      // todavía no creada, etc.) no debe tirar abajo las que sí respondieron OK — la
      // reunión necesita navegar la UI aunque falte una tabla, no un cartel rojo total.
      const primerError = [
        clubRes,
        seasonsRes,
        categoriesRes,
        rostersRes,
        athletesRes,
        plansRes,
        executionsRes,
        wellnessRes,
        externalLoadsRes,
        physicalTestsRes,
        strengthBlocksRes,
        dailyTasksRes,
        strengthTemplatesRes,
        strengthTemplateExercisesRes,
        strengthAssignmentsRes,
        strengthAssignmentAthletesRes,
        gymExternalLoadsRes,
        complementaryPlansRes,
        videoMatchesRes,
        videoTagsRes,
      ].find((r) => r.error)?.error

      const seasons = (seasonsRes.data ?? []) as Season[]
      const categories = (categoriesRes.data ?? []) as TeamCategory[]
      const temporadaActiva = seasons.find((s) => s.is_active) ?? seasons[0]

      // No pisar una temporada/categoría ya vigente (persistida de una sesión
      // anterior, o recién fijada por un link escopeado — ver
      // `useScopedCategoryFromUrl`, que corre en paralelo y normalmente gana
      // esta carrera porque no depende de la red): sólo caemos al default si
      // no hay ninguna seleccionada todavía, o si la que había ya no existe
      // (categoría/temporada borrada del lado del servidor).
      const { activeSeasonId: seasonIdVigente, activeCategoryId: categoryIdVigente } = get()
      const activeSeasonId = seasons.some((s) => s.id === seasonIdVigente)
        ? seasonIdVigente
        : (temporadaActiva?.id ?? null)
      const activeCategoryId = categories.some((c) => c.id === categoryIdVigente)
        ? categoryIdVigente
        : (categories[0]?.id ?? null)

      set({
        club: (clubRes.data as Club | null) ?? null,
        seasons,
        categories,
        rosters: (rostersRes.data ?? []) as Roster[],
        athletes: ((athletesRes.data ?? []) as AthleteRow[]).map(athleteFromRow),
        sessionPlans: ((plansRes.data ?? []) as SessionPlanRow[]).map(sessionPlanFromRow),
        sessionExecutions: ((executionsRes.data ?? []) as unknown as SessionExecutionRow[]).map(
          sessionExecutionFromRow,
        ),
        wellnessEntries: ((wellnessRes.data ?? []) as unknown as WellnessEntryRow[]).map(
          wellnessEntryFromRow,
        ),
        externalLoads: ((externalLoadsRes.data ?? []) as ExternalLoadRow[]).map(externalLoadFromRow),
        physicalTests: ((physicalTestsRes.data ?? []) as PhysicalTestRow[]).map(physicalTestFromRow),
        strengthBlocks: ((strengthBlocksRes.data ?? []) as StrengthBlockRow[]).map(strengthBlockFromRow),
        dailyTasks: ((dailyTasksRes.data ?? []) as DailyTaskRow[]).map(dailyTaskFromRow),
        strengthTemplates: ((strengthTemplatesRes.data ?? []) as StrengthTemplateRow[]).map(
          strengthTemplateFromRow,
        ),
        strengthTemplateExercises: (
          (strengthTemplateExercisesRes.data ?? []) as StrengthTemplateExerciseRow[]
        ).map(strengthTemplateExerciseFromRow),
        strengthAssignments: ((strengthAssignmentsRes.data ?? []) as StrengthAssignmentRow[]).map(
          strengthAssignmentFromRow,
        ),
        strengthAssignmentAthletes: (
          (strengthAssignmentAthletesRes.data ?? []) as StrengthAssignmentAthleteRow[]
        ).map(strengthAssignmentAthleteFromRow),
        gymExternalLoads: ((gymExternalLoadsRes.data ?? []) as GymExternalLoadRow[]).map(
          gymExternalLoadFromRow,
        ),
        complementaryPlans: ((complementaryPlansRes.data ?? []) as ComplementaryPlanRow[]).map(
          complementaryPlanFromRow,
        ),
        videoMatches: ((videoMatchesRes.data ?? []) as VideoMatchRow[]).map(videoMatchFromRow),
        videoTags: ((videoTagsRes.data ?? []) as VideoTagRow[]).map(videoTagFromRow),
        activeSeasonId,
        activeCategoryId,
        isLoading: false,
        error: primerError
          ? getErrorMessage(primerError, 'Algunas tablas no se pudieron sincronizar con Supabase.')
          : null,
      })
    } catch (err) {
      // Falla total (timeout, red caída, URL inválida): no bloquear la app — se
      // mantienen los datos que hubiera (vacíos en el primer load) y las vistas
      // quedan navegables con su propio estado vacío; el error queda como aviso.
      set({
        isLoading: false,
        error: getErrorMessage(err, 'No se pudo conectar con Supabase.'),
      })
    }
  },

  submitSessionLoad: async (input) => {
    exigirSupabase(set)

    // Fase 21: upsert por (athlete_id, fecha) — un jugador sólo tiene un RPE
    // por día; si reenvía el formulario, "gana" el último envío en vez de
    // sumarse como una sesión fantasma. Requiere la unique constraint de
    // `migration_fase21_upsert_diario.sql`.
    const { data, error } = await supabase
      .from('session_executions')
      .upsert(sessionExecutionToUpsertRow(input), { onConflict: 'athlete_id,fecha' })
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const guardado = sessionExecutionFromRow(data as SessionExecutionRow)
    set((state) => ({
      sessionExecutions: [...state.sessionExecutions.filter((e) => e.id !== guardado.id), guardado],
    }))
  },

  submitWellness: async (input) => {
    exigirSupabase(set)

    // Fase 21: mismo criterio "keep the latest" que submitSessionLoad — ver
    // esa nota y `migration_fase21_upsert_diario.sql`.
    const { data, error } = await supabase
      .from('wellness_entries')
      .upsert(wellnessEntryToUpsertRow(input), { onConflict: 'athlete_id,fecha' })
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const guardado = wellnessEntryFromRow(data as WellnessEntryRow)
    set((state) => ({
      wellnessEntries: [...state.wellnessEntries.filter((w) => w.id !== guardado.id), guardado],
    }))
  },

  updateClub: async (input) => {
    exigirSupabase(set)
    const club = get().club
    if (!club) throw new Error('Todavía no se cargó el club.')

    const { data, error } = await supabase
      .from('clubs')
      .update({ nombre: input.nombre, logo_url: input.logoUrl || null })
      .eq('id', club.id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    set({ club: data as Club })
  },

  createSeason: async (input) => {
    exigirSupabase(set)
    const club = get().club
    if (!club) throw new Error('Todavía no se cargó el club.')

    if (input.isActive) {
      const { error: clearError } = await supabase
        .from('seasons')
        .update({ is_active: false })
        .eq('club_id', club.id)
      if (clearError) {
        set({ error: clearError.message })
        throw clearError
      }
    }

    const { data, error } = await supabase
      .from('seasons')
      .insert({ club_id: club.id, year: input.year, is_active: input.isActive })
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const nueva = data as Season
    set((state) => ({
      seasons: [
        ...state.seasons.map((s) => (input.isActive ? { ...s, is_active: false } : s)),
        nueva,
      ].sort((a, b) => a.year - b.year),
      activeSeasonId: input.isActive ? nueva.id : (state.activeSeasonId ?? nueva.id),
    }))
  },

  marcarTemporadaActiva: async (seasonId) => {
    exigirSupabase(set)
    const club = get().club
    if (!club) throw new Error('Todavía no se cargó el club.')

    const { error: clearError } = await supabase
      .from('seasons')
      .update({ is_active: false })
      .eq('club_id', club.id)
    if (clearError) {
      set({ error: clearError.message })
      throw clearError
    }

    const { error: setError } = await supabase
      .from('seasons')
      .update({ is_active: true })
      .eq('id', seasonId)
    if (setError) {
      set({ error: setError.message })
      throw setError
    }

    set((state) => ({
      seasons: state.seasons.map((s) => ({ ...s, is_active: s.id === seasonId })),
      activeSeasonId: seasonId,
    }))
  },

  deleteSeason: async (seasonId) => {
    exigirSupabase(set)

    const { error } = await supabase.from('seasons').delete().eq('id', seasonId)
    if (error) {
      set({ error: error.message })
      throw error
    }

    // La cascada real (rosters/sesiones/RPE/wellness/GPS/CMJ/Fuerza de esa
    // temporada) ya la hizo la base — se resincroniza todo el store desde
    // Supabase en vez de replicar 8 filtros a mano, para no arriesgar que el
    // estado local quede desincronizado de lo que realmente quedó en la base.
    await get().fetchInitialData()
  },

  createCategory: async (input) => {
    exigirSupabase(set)
    const club = get().club
    if (!club) throw new Error('Todavía no se cargó el club.')

    const { data, error } = await supabase
      .from('team_categories')
      .insert({ club_id: club.id, nombre: input.nombre })
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const nueva = data as TeamCategory
    set((state) => ({
      categories: [...state.categories, nueva],
      activeCategoryId: state.activeCategoryId ?? nueva.id,
    }))
  },

  deleteCategory: async (categoryId) => {
    exigirSupabase(set)

    const { error } = await supabase.from('team_categories').delete().eq('id', categoryId)
    if (error) {
      set({ error: error.message })
      throw error
    }

    await get().fetchInitialData()
  },

  createAthlete: async (input) => {
    exigirSupabase(set)

    const { data, error } = await supabase.from('athletes').insert(athleteToRow(input)).select().single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({ athletes: [...state.athletes, athleteFromRow(data as AthleteRow)] }))
  },

  updateAthlete: async (id, input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('athletes')
      .update(athleteToRow(input))
      .eq('id', id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const actualizado = athleteFromRow(data as AthleteRow)
    set((state) => ({
      athletes: state.athletes.map((a) => (a.id === id ? actualizado : a)),
    }))
  },

  deleteAthlete: async (id) => {
    exigirSupabase(set)

    const { error } = await supabase.from('athletes').delete().eq('id', id)

    if (error) {
      set({ error: error.message })
      throw error
    }

    // Espeja el ON DELETE CASCADE del esquema (rosters/ejecuciones/wellness del atleta).
    set((state) => ({
      athletes: state.athletes.filter((a) => a.id !== id),
      rosters: state.rosters.filter((r) => r.athlete_id !== id),
      sessionExecutions: state.sessionExecutions.filter((e) => e.athleteId !== id),
      wellnessEntries: state.wellnessEntries.filter((w) => w.athleteId !== id),
    }))
  },

  assignAthletesToRoster: async (input) => {
    exigirSupabase(set)
    if (input.athleteIds.length === 0) return

    const rows = input.athleteIds.map((athleteId) => ({
      season_id: input.seasonId,
      category_id: input.categoryId,
      athlete_id: athleteId,
    }))

    const { data, error } = await supabase
      .from('rosters')
      .upsert(rows, { onConflict: 'season_id,category_id,athlete_id', ignoreDuplicates: true })
      .select()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const nuevos = (data ?? []) as Roster[]
    set((state) => {
      const idsExistentes = new Set(state.rosters.map((r) => r.id))
      const aAgregar = nuevos.filter((r) => !idsExistentes.has(r.id))
      return { rosters: [...state.rosters, ...aAgregar] }
    })
  },

  importAthletesBulk: async (input) => {
    exigirSupabase(set)
    if (input.jugadores.length === 0) return 0

    // `fechaNacimiento` ya viene resuelta por `parsearFechaNacimiento` (fecha
    // real del Excel del club o el fallback '2000-01-01' si vino vacía o
    // inválida) — acá no hace falta un placeholder propio, sólo castear
    // `posiciones` de `string[]` a `Posicion[]`: `athleteToRow` no valida en
    // runtime y `athletes.posiciones` es `text[]` libre en el esquema, así
    // que guardar una posición no canónica ("Vol. Der.") es seguro — ver
    // comentario de `ImportarJugadoresInput` sobre por qué no se fuerza el
    // union estricto acá.
    const rows = input.jugadores.map((j) =>
      athleteToRow({
        nombre: j.nombre,
        posiciones: j.posiciones as Posicion[],
        estadoSalud: 'Activo',
        fechaNacimiento: j.fechaNacimiento,
      }),
    )

    const { data, error } = await supabase.from('athletes').insert(rows).select()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const nuevos = ((data ?? []) as AthleteRow[]).map(athleteFromRow)
    set((state) => ({ athletes: [...state.athletes, ...nuevos] }))

    await get().assignAthletesToRoster({
      seasonId: input.seasonId,
      categoryId: input.categoryId,
      athleteIds: nuevos.map((a) => a.id),
    })

    return nuevos.length
  },

  removeAthleteFromRoster: async (rosterId) => {
    exigirSupabase(set)

    const { error } = await supabase.from('rosters').delete().eq('id', rosterId)

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({ rosters: state.rosters.filter((r) => r.id !== rosterId) }))
  },

  createSessionPlan: async (input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('session_plans')
      .insert(sessionPlanToInsertRow(input))
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const creada = sessionPlanFromRow(data as SessionPlanRow)
    set((state) => ({
      sessionPlans: [...state.sessionPlans, creada],
    }))
    return creada
  },

  updateSessionPlanConfig: async (planId, input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('session_plans')
      .update(sessionPlanConfigToUpdateRow(input))
      .eq('id', planId)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const actualizado = sessionPlanFromRow(data as SessionPlanRow)
    set((state) => ({
      sessionPlans: state.sessionPlans.map((p) => (p.id === planId ? actualizado : p)),
    }))
  },

  deleteSessionPlan: async (id) => {
    exigirSupabase(set)

    const { error } = await supabase.from('session_plans').delete().eq('id', id)

    if (error) {
      set({ error: error.message })
      throw error
    }

    // Espeja los ON DELETE del esquema (Fase 13): cascade en daily_tasks,
    // strength_assignments/strength_assignment_athletes y external_loads;
    // set null en session_executions.planId (el RPE del jugador no se borra,
    // sólo pierde el vínculo con esta sesión puntual).
    set((state) => ({
      sessionPlans: state.sessionPlans.filter((p) => p.id !== id),
      dailyTasks: state.dailyTasks.filter((t) => t.session_plan_id !== id),
      strengthAssignments: state.strengthAssignments.filter((a) => a.sessionPlanId !== id),
      strengthAssignmentAthletes: state.strengthAssignmentAthletes.filter((aa) => {
        const asignacionBorrada = state.strengthAssignments.find(
          (a) => a.sessionPlanId === id && a.id === aa.assignmentId,
        )
        return !asignacionBorrada
      }),
      externalLoads: state.externalLoads.filter((e) => e.planId !== id),
      sessionExecutions: state.sessionExecutions.map((e) => (e.planId === id ? { ...e, planId: '' } : e)),
    }))
  },

  updateSessionPlanGymSheet: async (id, data) => {
    exigirSupabase(set)

    const { data: fila, error } = await supabase
      .from('session_plans')
      .update(gymSheetDataToUpdateRow(data))
      .eq('id', id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const actualizado = sessionPlanFromRow(fila as SessionPlanRow)
    set((state) => ({
      sessionPlans: state.sessionPlans.map((p) => (p.id === id ? actualizado : p)),
    }))
  },

  submitExternalLoadsBulk: async (inputs) => {
    exigirSupabase(set)
    if (inputs.length === 0) return

    const rows = inputs.map(externalLoadToInsertRow)

    const { data, error } = await supabase
      .from('external_loads')
      .upsert(rows, { onConflict: 'plan_id,athlete_id' })
      .select()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const guardados = ((data ?? []) as ExternalLoadRow[]).map(externalLoadFromRow)
    set((state) => {
      const clave = (e: { planId: string; athleteId: string }) => `${e.planId}:${e.athleteId}`
      const clavesGuardadas = new Set(guardados.map(clave))
      const restantes = state.externalLoads.filter((e) => !clavesGuardadas.has(clave(e)))
      return { externalLoads: [...restantes, ...guardados] }
    })
  },

  submitPhysicalTest: async (input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('physical_tests')
      .insert(physicalTestToInsertRow(input))
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({
      physicalTests: [...state.physicalTests, physicalTestFromRow(data as PhysicalTestRow)],
    }))
  },

  createStrengthBlock: async (input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('strength_blocks')
      .insert(strengthBlockToInsertRow(input))
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({
      strengthBlocks: [...state.strengthBlocks, strengthBlockFromRow(data as StrengthBlockRow)],
    }))
  },

  moveStrengthBlock: async (id, columna) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('strength_blocks')
      .update({ columna })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const actualizado = strengthBlockFromRow(data as StrengthBlockRow)
    set((state) => ({
      strengthBlocks: state.strengthBlocks.map((b) => (b.id === id ? actualizado : b)),
    }))
  },

  deleteStrengthBlock: async (id) => {
    exigirSupabase(set)

    const { error } = await supabase.from('strength_blocks').delete().eq('id', id)

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({ strengthBlocks: state.strengthBlocks.filter((b) => b.id !== id) }))
  },

  createDailyTask: async (input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('daily_tasks')
      .insert(dailyTaskToInsertRow(input))
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({
      dailyTasks: [...state.dailyTasks, dailyTaskFromRow(data as DailyTaskRow)],
    }))
  },

  updateDailyTask: async (id, input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('daily_tasks')
      .update(dailyTaskEdicionToUpdateRow(input))
      .eq('id', id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const actualizada = dailyTaskFromRow(data as DailyTaskRow)
    set((state) => ({
      dailyTasks: state.dailyTasks.map((t) => (t.id === id ? actualizada : t)),
    }))
  },

  updateDailyTaskTacboard: async (id, data) => {
    exigirSupabase(set)

    const { data: fila, error } = await supabase
      .from('daily_tasks')
      .update(tacboardDataToUpdateRow(data))
      .eq('id', id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const actualizada = dailyTaskFromRow(fila as DailyTaskRow)
    set((state) => ({
      dailyTasks: state.dailyTasks.map((t) => (t.id === id ? actualizada : t)),
    }))
  },

  updateDailyTaskGpsObjetivo: async (id, input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('daily_tasks')
      .update(gpsObjetivoToUpdateRow(input))
      .eq('id', id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const actualizada = dailyTaskFromRow(data as DailyTaskRow)
    set((state) => ({
      dailyTasks: state.dailyTasks.map((t) => (t.id === id ? actualizada : t)),
    }))
  },

  deleteDailyTask: async (id) => {
    exigirSupabase(set)

    const { error } = await supabase.from('daily_tasks').delete().eq('id', id)

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({ dailyTasks: state.dailyTasks.filter((t) => t.id !== id) }))
  },

  submitMatchDayResultsBulk: async (inputs) => {
    exigirSupabase(set)
    if (inputs.length === 0) return

    const rows = inputs.map(resultadoPartidoToUpsertRow)

    const { data, error } = await supabase
      .from('session_executions')
      .upsert(rows, { onConflict: 'athlete_id,plan_id' })
      .select()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const guardados = ((data ?? []) as SessionExecutionRow[]).map(sessionExecutionFromRow)
    set((state) => {
      const clave = (e: SessionExecution) => `${e.athleteId}:${e.planId}`
      const clavesGuardadas = new Set(guardados.map(clave))
      const restantes = state.sessionExecutions.filter((e) => !clavesGuardadas.has(clave(e)))
      return { sessionExecutions: [...restantes, ...guardados] }
    })
  },

  createStrengthTemplate: async (input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('strength_templates')
      .insert(strengthTemplateToInsertRow(input))
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({
      strengthTemplates: [...state.strengthTemplates, strengthTemplateFromRow(data as StrengthTemplateRow)],
    }))
  },

  deleteStrengthTemplate: async (id) => {
    exigirSupabase(set)

    const { error } = await supabase.from('strength_templates').delete().eq('id', id)

    if (error) {
      set({ error: error.message })
      throw error
    }

    // Espeja el ON DELETE CASCADE del esquema (ejercicios y asignaciones de la plantilla).
    set((state) => ({
      strengthTemplates: state.strengthTemplates.filter((t) => t.id !== id),
      strengthTemplateExercises: state.strengthTemplateExercises.filter((e) => e.templateId !== id),
      strengthAssignments: state.strengthAssignments.filter((a) => a.templateId !== id),
    }))
  },

  addStrengthTemplateExercise: async (input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('strength_template_exercises')
      .insert(strengthTemplateExerciseToInsertRow(input))
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({
      strengthTemplateExercises: [
        ...state.strengthTemplateExercises,
        strengthTemplateExerciseFromRow(data as StrengthTemplateExerciseRow),
      ],
    }))
  },

  deleteStrengthTemplateExercise: async (id) => {
    exigirSupabase(set)

    const { error } = await supabase.from('strength_template_exercises').delete().eq('id', id)

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({
      strengthTemplateExercises: state.strengthTemplateExercises.filter((e) => e.id !== id),
    }))
  },

  assignTemplateToDay: async (input) => {
    exigirSupabase(set)
    if (input.athleteIds.length === 0) {
      throw new Error('Elegí al menos un jugador para asignar esta plantilla.')
    }

    const { data: asignacion, error: errorAsignacion } = await supabase
      .from('strength_assignments')
      .insert(
        strengthAssignmentToInsertRow({
          templateId: input.templateId,
          sessionPlanId: input.sessionPlanId,
          tipo: input.tipo,
        }),
      )
      .select()
      .single()

    if (errorAsignacion) {
      set({ error: errorAsignacion.message })
      throw errorAsignacion
    }

    const asignacionCreada = strengthAssignmentFromRow(asignacion as StrengthAssignmentRow)

    const filasAtletas = input.athleteIds.map((athleteId) => ({
      assignment_id: asignacionCreada.id,
      athlete_id: athleteId,
    }))

    const { data: atletas, error: errorAtletas } = await supabase
      .from('strength_assignment_athletes')
      .insert(filasAtletas)
      .select()

    if (errorAtletas) {
      set({ error: errorAtletas.message })
      throw errorAtletas
    }

    const atletasCreados = ((atletas ?? []) as StrengthAssignmentAthleteRow[]).map(
      strengthAssignmentAthleteFromRow,
    )

    set((state) => ({
      strengthAssignments: [...state.strengthAssignments, asignacionCreada],
      strengthAssignmentAthletes: [...state.strengthAssignmentAthletes, ...atletasCreados],
    }))
  },

  deleteStrengthAssignment: async (id) => {
    exigirSupabase(set)

    const { error } = await supabase.from('strength_assignments').delete().eq('id', id)

    if (error) {
      set({ error: error.message })
      throw error
    }

    // Espeja el ON DELETE CASCADE del esquema (filas de atletas de esa asignación).
    set((state) => ({
      strengthAssignments: state.strengthAssignments.filter((a) => a.id !== id),
      strengthAssignmentAthletes: state.strengthAssignmentAthletes.filter((a) => a.assignmentId !== id),
    }))
  },

  submitGymExternalLoad: async (input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('gym_external_loads')
      .upsert(gymExternalLoadToUpsertRow(input), { onConflict: 'athlete_id,session_id' })
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const guardado = gymExternalLoadFromRow(data as GymExternalLoadRow)
    set((state) => ({
      gymExternalLoads: [...state.gymExternalLoads.filter((g) => g.id !== guardado.id), guardado],
    }))
  },

  createComplementaryPlan: async (input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('complementary_plans')
      .insert(complementaryPlanToInsertRow(input))
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const creado = complementaryPlanFromRow(data as ComplementaryPlanRow)
    set((state) => ({ complementaryPlans: [...state.complementaryPlans, creado] }))
    return creado
  },

  updateComplementaryPlan: async (id, input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('complementary_plans')
      .update(complementaryPlanToUpdateRow(input))
      .eq('id', id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const actualizado = complementaryPlanFromRow(data as ComplementaryPlanRow)
    set((state) => ({
      complementaryPlans: state.complementaryPlans.map((p) => (p.id === id ? actualizado : p)),
    }))
  },

  deleteComplementaryPlan: async (id) => {
    exigirSupabase(set)

    const { error } = await supabase.from('complementary_plans').delete().eq('id', id)

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({
      complementaryPlans: state.complementaryPlans.filter((p) => p.id !== id),
    }))
  },

  cloneComplementaryPlan: async (planOrigen, categoryIdDestino, tituloNuevo) => {
    return get().createComplementaryPlan({
      categoryId: categoryIdDestino,
      title: tituloNuevo,
      durationWeeks: planOrigen.durationWeeks,
      planData: planOrigen.planData,
    })
  },

  createVideoMatch: async (input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('video_matches')
      .insert(videoMatchToInsertRow(input))
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const creado = videoMatchFromRow(data as VideoMatchRow)
    set((state) => ({ videoMatches: [creado, ...state.videoMatches] }))
    return creado
  },

  deleteVideoMatch: async (id) => {
    exigirSupabase(set)

    // `on delete cascade` en `video_tags.match_id` (migration_fase34) se
    // encarga de borrar los tags del partido del lado de la base — acá sólo
    // hace falta limpiar los dos arrays en memoria para que la UI no se
    // quede mostrando tags huérfanos hasta el próximo `fetchInitialData`.
    const { error } = await supabase.from('video_matches').delete().eq('id', id)

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({
      videoMatches: state.videoMatches.filter((m) => m.id !== id),
      videoTags: state.videoTags.filter((t) => t.matchId !== id),
    }))
  },

  createVideoTag: async (input) => {
    exigirSupabase(set)

    const { data, error } = await supabase
      .from('video_tags')
      .insert(videoTagToInsertRow(input))
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const creado = videoTagFromRow(data as VideoTagRow)
    set((state) => ({ videoTags: [...state.videoTags, creado] }))
    return creado
  },

  updateVideoTag: async (id, input) => {
    exigirSupabase(set)

    const payload: Record<string, unknown> = {}
    if (input.athleteId !== undefined) payload.athlete_id = input.athleteId
    if (input.tipo !== undefined) payload.tipo = input.tipo
    if (input.fase !== undefined) payload.fase = input.fase
    if (input.timestampSegundos !== undefined) payload.timestamp_segundos = input.timestampSegundos
    if (input.zona !== undefined) {
      payload.zona_banda = input.zona?.banda ?? null
      payload.zona_carril = input.zona?.carril ?? null
    }
    if (input.nota !== undefined) payload.nota = input.nota

    const { data, error } = await supabase
      .from('video_tags')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    const actualizado = videoTagFromRow(data as VideoTagRow)
    set((state) => ({
      videoTags: state.videoTags.map((t) => (t.id === id ? actualizado : t)),
    }))
  },

  deleteVideoTag: async (id) => {
    exigirSupabase(set)

    const { error } = await supabase.from('video_tags').delete().eq('id', id)

    if (error) {
      set({ error: error.message })
      throw error
    }

    set((state) => ({
      videoTags: state.videoTags.filter((t) => t.id !== id),
    }))
  },
    }),
    {
      name: 'soma-app-store',
      storage: createJSONStorage(() => idbStorage),
      // Sólo se persisten los DATOS (para que el profe vea la última semana
      // sincronizada sin señal) — nunca `isLoading`/`error` (arrancarían la
      // próxima sesión en un estado de carga/error viejo que ya no aplica) ni
      // los filtros/estado de modales (son de la sesión de UI actual, no del
      // club). Las funciones ni hace falta excluirlas: no sobreviven el
      // `JSON.stringify` que hace `persist` por debajo.
      partialize: (state) => ({
        club: state.club,
        seasons: state.seasons,
        categories: state.categories,
        rosters: state.rosters,
        athletes: state.athletes,
        sessionPlans: state.sessionPlans,
        sessionExecutions: state.sessionExecutions,
        externalLoads: state.externalLoads,
        wellnessEntries: state.wellnessEntries,
        physicalTests: state.physicalTests,
        strengthBlocks: state.strengthBlocks,
        dailyTasks: state.dailyTasks,
        strengthTemplates: state.strengthTemplates,
        strengthTemplateExercises: state.strengthTemplateExercises,
        strengthAssignments: state.strengthAssignments,
        strengthAssignmentAthletes: state.strengthAssignmentAthletes,
        gymExternalLoads: state.gymExternalLoads,
        complementaryPlans: state.complementaryPlans,
        activeSeasonId: state.activeSeasonId,
        activeCategoryId: state.activeCategoryId,
      }),
    },
  ),
)

/**
 * Guard centralizado de escritura (Fase 35, "Link de sólo lectura") —
 * envuelve TODAS las acciones que graban en Supabase (todo lo que aparece
 * en `ACCIONES_DE_ESCRITURA`) para que, en modo sólo lectura, ninguna
 * llegue a ejecutar su lógica real, sin importar desde qué botón de qué
 * vista se la haya llamado. Es un solo punto de control en vez de tener
 * que acordarse de chequear `useSoloLectura()` en cada componente nuevo
 * que se agregue — así una vista que hoy no existe todavía queda cubierta
 * de entrada, no sólo las que ya se auditaron a mano (Dashboard y
 * Planificador, que además dan una UX más prolija: ocultan los botones en
 * vez de dejarlos fallar al tocarlos).
 *
 * Importante: esto es una barrera de UX, no de seguridad de backend — las
 * políticas RLS de Supabase siguen aceptando escritura con la key `anon`
 * (ver `staffAccess.ts`). Bloquea el 100% de lo que la app misma puede
 * disparar; no bloquea a alguien que decida llamar a Supabase directo
 * desde la consola del navegador.
 */
const ACCIONES_DE_ESCRITURA = [
  'submitSessionLoad',
  'submitWellness',
  'updateClub',
  'createSeason',
  'marcarTemporadaActiva',
  'deleteSeason',
  'createCategory',
  'deleteCategory',
  'createAthlete',
  'updateAthlete',
  'deleteAthlete',
  'assignAthletesToRoster',
  'importAthletesBulk',
  'removeAthleteFromRoster',
  'createSessionPlan',
  'updateSessionPlanConfig',
  'deleteSessionPlan',
  'updateSessionPlanGymSheet',
  'submitExternalLoadsBulk',
  'submitPhysicalTest',
  'createStrengthBlock',
  'moveStrengthBlock',
  'deleteStrengthBlock',
  'createDailyTask',
  'updateDailyTask',
  'updateDailyTaskTacboard',
  'updateDailyTaskGpsObjetivo',
  'deleteDailyTask',
  'submitMatchDayResultsBulk',
  'createStrengthTemplate',
  'deleteStrengthTemplate',
  'addStrengthTemplateExercise',
  'deleteStrengthTemplateExercise',
  'assignTemplateToDay',
  'deleteStrengthAssignment',
  'submitGymExternalLoad',
  'createComplementaryPlan',
  'updateComplementaryPlan',
  'deleteComplementaryPlan',
  'cloneComplementaryPlan',
  'createVideoMatch',
  'deleteVideoMatch',
  'createVideoTag',
  'updateVideoTag',
  'deleteVideoTag',
] as const satisfies readonly (keyof AppState)[]

function estaEnSoloLectura(): boolean {
  const { categoryLocked, soloLecturaGlobal } = useAppStore.getState()
  return !useAuthStore.getState().session || categoryLocked || soloLecturaGlobal
}

const accionesOriginales = useAppStore.getState()
const accionesEnvueltas = Object.fromEntries(
  ACCIONES_DE_ESCRITURA.map((nombre) => {
    const original = accionesOriginales[nombre] as (...args: unknown[]) => unknown
    const envuelta = (...args: unknown[]) => {
      if (estaEnSoloLectura()) {
        return Promise.reject(
          new Error('Estás viendo esta página en modo sólo lectura — no se puede guardar ni eliminar nada.'),
        )
      }
      return original(...args)
    }
    return [nombre, envuelta]
  }),
) as Partial<AppState>
useAppStore.setState(accionesEnvueltas)

/** Atletas de la categoría/temporada activa (vía Roster). */
export function useAthletesActivos(): Athlete[] {
  const athletes = useAppStore((s) => s.athletes)
  const rosters = useAppStore((s) => s.rosters)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  return useMemo(() => {
    const idsActivos = new Set(
      rosters
        .filter((r) => r.season_id === activeSeasonId && r.category_id === activeCategoryId)
        .map((r) => r.athlete_id),
    )
    return athletes.filter((a) => idsActivos.has(a.id))
  }, [athletes, rosters, activeSeasonId, activeCategoryId])
}

/** Planes Complementarios de la categoría activa — biblioteca de club, no de temporada (mismo criterio que `strengthTemplates`). */
export function useComplementaryPlansActivos(): ComplementaryPlan[] {
  const complementaryPlans = useAppStore((s) => s.complementaryPlans)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  return useMemo(
    () => complementaryPlans.filter((p) => p.categoryId === activeCategoryId),
    [complementaryPlans, activeCategoryId],
  )
}

/** Partidos/entrenamientos filmados (Fase 34) de la categoría/temporada activa — a diferencia de los Planes Complementarios, sí scopea por temporada porque un video es de UN partido puntual, no una biblioteca reutilizable entre años. */
export function useVideoMatchesActivos(): VideoMatch[] {
  const videoMatches = useAppStore((s) => s.videoMatches)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  return useMemo(
    () => videoMatches.filter((m) => m.seasonId === activeSeasonId && m.categoryId === activeCategoryId),
    [videoMatches, activeSeasonId, activeCategoryId],
  )
}

/** Tags de UN partido puntual — ordenados por segundo de aparición, así la Lista de Clips ya sale en orden cronológico. */
export function useVideoTagsDeMatch(matchId: string | null): VideoTag[] {
  const videoTags = useAppStore((s) => s.videoTags)

  return useMemo(() => {
    if (!matchId) return []
    return videoTags
      .filter((t) => t.matchId === matchId)
      .sort((a, b) => a.timestampSegundos - b.timestampSegundos)
  }, [videoTags, matchId])
}

/** Sesiones planificadas de la categoría/temporada activa. */
export function useSessionPlansActivos(): SessionPlan[] {
  const sessionPlans = useAppStore((s) => s.sessionPlans)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  return useMemo(
    () =>
      sessionPlans.filter(
        (p) => p.season_id === activeSeasonId && p.category_id === activeCategoryId,
      ),
    [sessionPlans, activeSeasonId, activeCategoryId],
  )
}

/** Ejecuciones (sRPE) de la categoría/temporada activa. */
export function useSessionExecutionsActivas(): SessionExecution[] {
  const sessionExecutions = useAppStore((s) => s.sessionExecutions)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  return useMemo(
    () =>
      sessionExecutions.filter(
        (e) => e.season_id === activeSeasonId && e.category_id === activeCategoryId,
      ),
    [sessionExecutions, activeSeasonId, activeCategoryId],
  )
}

/** Wellness de la categoría/temporada activa. */
export function useWellnessEntriesActivas(): WellnessEntry[] {
  const wellnessEntries = useAppStore((s) => s.wellnessEntries)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  return useMemo(
    () =>
      wellnessEntries.filter(
        (w) => w.season_id === activeSeasonId && w.category_id === activeCategoryId,
      ),
    [wellnessEntries, activeSeasonId, activeCategoryId],
  )
}

/** Carga externa (GPS) de la categoría/temporada activa. */
export function useExternalLoadsActivos(): ExternalLoad[] {
  const externalLoads = useAppStore((s) => s.externalLoads)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  return useMemo(
    () =>
      externalLoads.filter(
        (e) => e.season_id === activeSeasonId && e.category_id === activeCategoryId,
      ),
    [externalLoads, activeSeasonId, activeCategoryId],
  )
}

/** Evaluaciones físicas (CMJ / RSI modificado) de la categoría/temporada activa. */
export function usePhysicalTestsActivos(): PhysicalTest[] {
  const physicalTests = useAppStore((s) => s.physicalTests)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  return useMemo(
    () =>
      physicalTests.filter(
        (t) => t.season_id === activeSeasonId && t.category_id === activeCategoryId,
      ),
    [physicalTests, activeSeasonId, activeCategoryId],
  )
}

/** Bloques de Fuerza (Kanban) de la categoría/temporada activa. */
export function useStrengthBlocksActivos(): BloqueFuerza[] {
  const strengthBlocks = useAppStore((s) => s.strengthBlocks)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  return useMemo(
    () =>
      strengthBlocks.filter(
        (b) => b.season_id === activeSeasonId && b.category_id === activeCategoryId,
      ),
    [strengthBlocks, activeSeasonId, activeCategoryId],
  )
}

/**
 * Asignaciones de plantillas de Fuerza (Fase 12) de la categoría/temporada
 * activa — `strength_assignments` no tiene `season_id`/`category_id` propio
 * (cuelga de `session_plan_id`), así que se filtra cruzando contra los
 * `sessionPlans` ya activos.
 */
export function useStrengthAssignmentsActivas(): StrengthAssignment[] {
  const strengthAssignments = useAppStore((s) => s.strengthAssignments)
  const sessionPlans = useAppStore((s) => s.sessionPlans)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  return useMemo(() => {
    const idsActivos = new Set(
      sessionPlans
        .filter((p) => p.season_id === activeSeasonId && p.category_id === activeCategoryId)
        .map((p) => p.id),
    )
    return strengthAssignments.filter((a) => idsActivos.has(a.sessionPlanId))
  }, [strengthAssignments, sessionPlans, activeSeasonId, activeCategoryId])
}

/**
 * Carga externa de Gimnasio (Fase 17) de la categoría/temporada activa —
 * `gym_external_loads` no tiene `season_id`/`category_id` propio (cuelga de
 * `session_id`), así que se filtra cruzando contra los `sessionPlans` ya
 * activos (mismo criterio que `useStrengthAssignmentsActivas`). Usado por el
 * Dashboard de Riesgo (Fase 20) para cruzar fatiga reportada vs. tonelaje real.
 */
export function useGymExternalLoadsActivos(): GymExternalLoad[] {
  const gymExternalLoads = useAppStore((s) => s.gymExternalLoads)
  const sessionPlans = useAppStore((s) => s.sessionPlans)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  return useMemo(() => {
    const idsActivos = new Set(
      sessionPlans
        .filter((p) => p.season_id === activeSeasonId && p.category_id === activeCategoryId)
        .map((p) => p.id),
    )
    return gymExternalLoads.filter((g) => idsActivos.has(g.sessionId))
  }, [gymExternalLoads, sessionPlans, activeSeasonId, activeCategoryId])
}
