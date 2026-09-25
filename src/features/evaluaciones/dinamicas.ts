/**
 * Modelo de la tabla `dynamic_evaluations` (Fase 46, ver
 * `migration_fase44_tests_dinamicos.sql`) y su traducción al modelo que ya
 * consumen los dashboards y el Perfil 360°. Una fila = un jugador en una fecha
 * de un test; las métricas viajan en crudo en `metrics` (JSONB).
 */

/** Nombre de test reservado para el dashboard de NordBord. */
export const TEST_NORDBORD = 'NordBord'
export const TEST_CMJ_BILATERAL = 'CMJ Bilateral'
export const TEST_CMJ_UNILATERAL = 'CMJ Unilateral'
/** Tests con tarjeta propia en el Hub (el resto de las tarjetas se crean con "Subir Nuevo Test"). */
export const TESTS_FIJOS: string[] = [TEST_NORDBORD, TEST_CMJ_BILATERAL, TEST_CMJ_UNILATERAL]

/** Valores que puede traer el JSONB: métricas numéricas y metadatos de texto (claves con "_"). */
export type ValorMetrica = number | string | null

/** `test_config` (JSONB): igual en todas las filas de un mismo test. */
export interface ConfigTest {
  icono?: string
  archivo?: string
  /** Métricas clave — entran al radar unificado del Perfil 360°. */
  key_metrics?: string[]
  /** Métricas donde MENOS es mejor (tiempos, asimetrías). */
  less_is_better?: string[]
  unidades?: Record<string, string>
  /** Filas del archivo descartadas al importar (sin jugador, fecha o valores). */
  descartados?: number
  cargado_en?: string
  /** Fila que viene de la tabla vieja `performance_evaluations` (sólo lectura, ver `useFilasEvaluaciones`). */
  desde_legacy?: boolean
}

export interface FilaEvaluacionDinamica {
  id?: string
  test_name: string
  player_name: string
  player_key: string
  category_label: string
  /** YYYY-MM-DD */
  fecha: string
  metrics: Record<string, ValorMetrica>
  test_config: ConfigTest
}

// ── Forma que consumen la UI de tests dinámicos y el Perfil 360° ─────────────

export interface MetricaTestDinamico {
  /** Encabezado tal cual vino en el archivo (clave dentro de `metrics`). */
  key: string
  label: string
  unidad: string
  /** Métrica donde MENOS es mejor: invierte Z-score y percentil. */
  menosEsMejor: boolean
  /** Métrica clave: se suma al Radar Neuromuscular Unificado. */
  clave: boolean
}

export interface FilaTestDinamico {
  jugador: string
  categoria: string
  fecha: string
  valores: Record<string, number>
}

export interface TestDinamico {
  /** = `test_name` (único por test). */
  id: string
  nombre: string
  icono: string
  archivo: string
  creadoEn: string
  metricas: MetricaTestDinamico[]
  filas: FilaTestDinamico[]
}

/** "Jump Height (Imp-Mom) [cm]" → "cm". */
export function unidadDe(key: string): string {
  const m = key.match(/\[([^\]]+)\]/) ?? key.match(/\(([^)]{1,8})\)\s*$/)
  return m ? m[1].trim() : ''
}

const esNumero = (v: ValorMetrica | undefined): v is number => typeof v === 'number' && Number.isFinite(v)

/** JSONB → tests dinámicos (todo lo que no es NordBord), con sus métricas y filas numéricas. */
export function testsDesdeFilas(filas: FilaEvaluacionDinamica[]): TestDinamico[] {
  const porTest = new Map<string, FilaEvaluacionDinamica[]>()
  for (const f of filas) {
    if (f.test_name === TEST_NORDBORD) continue
    const arr = porTest.get(f.test_name)
    if (arr) arr.push(f)
    else porTest.set(f.test_name, [f])
  }
  const tests: TestDinamico[] = []
  for (const [nombre, arr] of porTest) {
    // La config se repite en todas las filas; si difiere (re-subida parcial) manda la más reciente.
    const cfg = arr.reduce<ConfigTest>((mejor, f) => ((f.test_config.cargado_en ?? '') >= (mejor.cargado_en ?? '') ? f.test_config : mejor), arr[0].test_config)
    const claves: string[] = []
    const vistas = new Set<string>()
    for (const f of arr) {
      for (const [k, v] of Object.entries(f.metrics)) {
        if (k.startsWith('_') || !esNumero(v) || vistas.has(k)) continue
        vistas.add(k)
        claves.push(k)
      }
    }
    const clave = new Set(cfg.key_metrics ?? [])
    const inversas = new Set(cfg.less_is_better ?? [])
    tests.push({
      id: nombre,
      nombre,
      icono: cfg.icono ?? '🧪',
      archivo: cfg.archivo ?? '',
      creadoEn: cfg.cargado_en ?? '',
      metricas: claves.map((key) => ({ key, label: key, unidad: cfg.unidades?.[key] ?? unidadDe(key), menosEsMejor: inversas.has(key), clave: clave.has(key) })),
      filas: arr.map((f) => ({
        jugador: f.player_name,
        categoria: f.category_label,
        fecha: f.fecha,
        valores: Object.fromEntries(Object.entries(f.metrics).filter(([k, v]) => !k.startsWith('_') && esNumero(v))) as Record<string, number>,
      })),
    })
  }
  return tests.sort((a, b) => a.creadoEn.localeCompare(b.creadoEn) || a.nombre.localeCompare(b.nombre, 'es'))
}
