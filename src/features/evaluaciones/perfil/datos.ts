import type { MedicionAntropo } from '@/features/antropometrias/types'
import { esMetricaAsimetria } from '@/features/periodization/evaluations/calculations'
import { poolFor } from '@/features/nordbord/calculations'
import { matchRoster, tokenizarRoster } from '@/features/nordbord/roster'
import type { Dataset, RosterEntry } from '@/features/nordbord/types'
import { catDeLabel, esAnio } from '../categorias'
import type { TestDinamico } from '../dinamicas'
import { normalizarNombre } from '@/utils/smartEntityMatcher'

/**
 * Modelo unificado del Perfil de Atleta 360° (Fase 45). Junta en UN solo lugar
 * las mediciones de todas las fuentes — NordBord, ForceDecks (CMJ), Antropometrías
 * y los tests dinámicos que crea el staff — bajo una identidad común de
 * jugador, y normaliza cada métrica clave a un puntaje 0–100 (percentil dentro
 * de su categoría) para poder dibujarlas en un mismo radar.
 */

/** Rol semántico de una métrica — lo usan las reglas de `Global Smart Insights`. */
export type RolMetrica =
  | 'nb_fuerza' // fuerza excéntrica relativa de isquios (NordBord)
  | 'nb_asim' // asimetría de isquios (NordBord, %)
  | 'salto' // altura de salto
  | 'rsi' // RSI-modificado
  | 'fuerza_conc' // fuerza concéntrica relativa
  | 'asim_salto' // asimetría del salto (%)
  | 'grasa' // % masa grasa
  | 'musculo' // % masa muscular

export interface MetricaDef {
  id: string
  fuente: string
  fuenteLabel: string
  label: string
  unidad: string
  d: number
  masEsMejor: boolean
  /** Entra al Radar Neuromuscular Unificado. */
  radar: boolean
  radarLabel: string
  rol?: RolMetrica
}

export interface AtletaModelo {
  key: string
  nombre: string
  categoria: string
  valores: Record<string, number>
  fechas: Record<string, string>
}

export interface ModeloPerfil {
  atletas: AtletaModelo[]
  catalogo: MetricaDef[]
  fuentes: Array<{ id: string; label: string; atletas: number }>
}

export interface FuentesPerfil {
  roster: RosterEntry[]
  nordbord: Dataset | null
  antropo: MedicionAntropo[]
  custom: TestDinamico[]
}

const SIN_CAT = 'Sin categoría'

const cmjUnilateral = (evaluationName: string): boolean => /1\s*pp|slj|unilateral|single|una pierna|1 pierna/i.test(evaluationName)
const esLateral = (key: string): boolean => /\((L|R)\)\s*$/.test(key.trim())
const limpiarLabel = (key: string): string => key.replace(/\s*\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim()

export function construirModelo(f: FuentesPerfil): ModeloPerfil {
  const RN = tokenizarRoster(f.roster)
  const defs = new Map<string, MetricaDef>()
  const atletas = new Map<string, AtletaModelo>()
  const porFuente = new Map<string, Set<string>>()
  const labelFuente = new Map<string, string>()

  /** Identidad canónica: si el nombre calza con la ficha antropométrica, se usa su nombre completo; si no, el propio. */
  function resolver(nombre: string): { key: string; nombre: string; cat: string | null } {
    const m = matchRoster(nombre, RN)
    if (m && !('amb' in m)) return { key: normalizarNombre(m.r.n), nombre: m.r.n, cat: m.r.cat }
    return { key: normalizarNombre(nombre), nombre, cat: null }
  }

  function atleta(key: string, nombre: string, cat: string | null, catRoster: boolean): AtletaModelo {
    let a = atletas.get(key)
    if (!a) {
      a = { key, nombre, categoria: SIN_CAT, valores: {}, fechas: {} }
      atletas.set(key, a)
    }
    cat = catDeLabel(cat)
    // Prioridad de categoría: la de la ficha antropométrica; después la primera "real" que aparezca (los años tipo "2010" sólo si no hay otra).
    if (cat && cat !== SIN_CAT) {
      if (catRoster) a.categoria = cat
      else if (a.categoria === SIN_CAT || (esAnio(a.categoria) && !esAnio(cat))) a.categoria = cat
    }
    return a
  }

  function definir(d: MetricaDef) {
    if (!defs.has(d.id)) defs.set(d.id, d)
    labelFuente.set(d.fuente, d.fuenteLabel)
  }

  function poner(a: AtletaModelo, id: string, valor: number, fecha: string) {
    if (!Number.isFinite(valor)) return
    const previa = a.fechas[id]
    if (previa && previa > fecha) return // se queda el dato más reciente
    a.valores[id] = valor
    a.fechas[id] = fecha
    const fuente = defs.get(id)?.fuente
    if (fuente) {
      if (!porFuente.has(fuente)) porFuente.set(fuente, new Set())
      porFuente.get(fuente)?.add(a.key)
    }
  }

  // ── NordBord — último test de cada atleta
  if (f.nordbord) {
    const F = 'nordbord'
    const L = 'NordBord'
    const base = { fuente: F, fuenteLabel: L }
    definir({ ...base, id: 'nb:forceRel', label: 'Fuerza excéntrica relativa', unidad: 'N/kg', d: 2, masEsMejor: true, radar: true, radarLabel: 'NordBord · Fuerza rel.', rol: 'nb_fuerza' })
    definir({ ...base, id: 'nb:forceMean', label: 'Fuerza excéntrica pico', unidad: 'N', d: 0, masEsMejor: true, radar: false, radarLabel: 'NordBord · Fuerza pico' })
    definir({ ...base, id: 'nb:weakF', label: 'Fuerza pico · pierna débil', unidad: 'N', d: 0, masEsMejor: true, radar: false, radarLabel: 'NordBord · Pierna débil' })
    definir({ ...base, id: 'nb:asym', label: 'Asimetría de isquios', unidad: '%', d: 1, masEsMejor: false, radar: true, radarLabel: 'NordBord · Simetría', rol: 'nb_asim' })
    for (const t of poolFor(f.nordbord, 'latest', 'all', 'all')) {
      const id = resolver(t.ath.rosterName ?? t.ath.name)
      const a = atleta(id.key, id.nombre, id.cat ?? t.ath.cat, id.cat !== null)
      const fecha = t.date.toISOString().slice(0, 10)
      poner(a, 'nb:forceMean', t.forceMean, fecha)
      poner(a, 'nb:weakF', t.weakF, fecha)
      poner(a, 'nb:asym', t.asymAbs, fecha)
      if (t.forceRel !== null) poner(a, 'nb:forceRel', t.forceRel, fecha)
    }
  }

  // ── Antropometrías — última medición de cada jugador
  {
    const F = 'antropo'
    const L = 'Antropometría'
    const base = { fuente: F, fuenteLabel: L }
    definir({ ...base, id: 'an:peso', label: 'Peso corporal', unidad: 'kg', d: 1, masEsMejor: true, radar: false, radarLabel: 'Antropo · Peso' })
    definir({ ...base, id: 'an:grasa', label: 'Masa grasa', unidad: '%', d: 1, masEsMejor: false, radar: true, radarLabel: 'Antropo · Masa grasa', rol: 'grasa' })
    definir({ ...base, id: 'an:musculo', label: 'Masa muscular', unidad: '%', d: 1, masEsMejor: true, radar: true, radarLabel: 'Antropo · Masa muscular', rol: 'musculo' })
    definir({ ...base, id: 'an:pliegues', label: 'Σ pliegues', unidad: 'mm', d: 1, masEsMejor: false, radar: false, radarLabel: 'Antropo · Σ pliegues' })
    const ultimas = new Map<string, MedicionAntropo>()
    for (const m of f.antropo) {
      const p = ultimas.get(m.jugadorKey)
      if (!p || m.fecha > p.fecha) ultimas.set(m.jugadorKey, m)
    }
    for (const m of ultimas.values()) {
      const a = atleta(m.jugadorKey, m.jugador, m.categoria, true)
      if (m.pesoKg !== null) poner(a, 'an:peso', m.pesoKg, m.fecha)
      if (m.grasaPct !== null) poner(a, 'an:grasa', m.grasaPct, m.fecha)
      if (m.musculoPct !== null) poner(a, 'an:musculo', m.musculoPct, m.fecha)
      if (m.pliegues !== null) poner(a, 'an:pliegues', m.pliegues, m.fecha)
    }
  }

  // ── Tests dinámicos (incluye CMJ Bilateral / Unilateral: sus métricas se leen del JSONB)
  for (const t of f.custom) {
    const F = `custom:${t.id}`
    const esCmj = /cmj|salto|jump|slj/i.test(t.nombre)
    const uni = cmjUnilateral(t.nombre)
    const pre = uni ? 'CMJ 1P' : 'CMJ'
    for (const m of t.metricas) {
      const asim = esMetricaAsimetria(m.key)
      // Los CMJ cruzan con NordBord y antropometría: se reconocen las métricas que usan las reglas de Global Smart Insights.
      let rol: RolMetrica | undefined
      let radarLabel = `${t.nombre} · ${limpiarLabel(m.label)}`
      if (esCmj && !esLateral(m.key)) {
        if (/^jump height/i.test(m.key) && !asim) [rol, radarLabel] = ['salto', `${pre} · Altura`]
        else if (/^rsi/i.test(m.key) && !asim) [rol, radarLabel] = ['rsi', `${pre} · RSI-mod`]
        else if (/^concentric peak force/i.test(m.key) && !asim) [rol, radarLabel] = ['fuerza_conc', `${pre} · Fuerza conc.`]
        else if (/^jump height/i.test(m.key) && asim) [rol, radarLabel] = ['asim_salto', `${pre} · Simetría`]
      }
      definir({
        id: `${F}:${m.key}`, fuente: F, fuenteLabel: t.nombre, label: limpiarLabel(m.label), unidad: m.unidad, d: 2,
        masEsMejor: !m.menosEsMejor && !asim, radar: m.clave || rol !== undefined, radarLabel, rol,
      })
    }
    for (const fila of [...t.filas].sort((x, y) => x.fecha.localeCompare(y.fecha))) {
      const id = resolver(fila.jugador)
      const a = atleta(id.key, id.nombre, id.cat ?? fila.categoria, id.cat !== null)
      for (const [key, valor] of Object.entries(fila.valores)) poner(a, `${F}:${key}`, esMetricaAsimetria(key) ? Math.abs(valor) : valor, fila.fecha)
    }
  }

  const lista = [...atletas.values()].filter((a) => Object.keys(a.valores).length > 0).sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'))
  const catalogo = [...defs.values()].filter((d) => lista.some((a) => a.valores[d.id] !== undefined))
  const fuentes = [...porFuente.entries()].map(([id, s]) => ({ id, label: labelFuente.get(id) ?? id, atletas: s.size }))
  return { atletas: lista, catalogo, fuentes }
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalización 0–100 (percentil dentro de la categoría)
// ─────────────────────────────────────────────────────────────────────────────

/** Grupo de referencia: los de su categoría con esa métrica; si son menos de 5, todo el plantel con esa métrica. */
export function grupoReferencia(m: ModeloPerfil, a: AtletaModelo, id: string): number[] {
  const conMetrica = m.atletas.filter((x) => x.valores[id] !== undefined)
  const deCat = conMetrica.filter((x) => x.categoria === a.categoria)
  return (deCat.length >= 5 ? deCat : conMetrica).map((x) => x.valores[id])
}

/** Percentil 0–100 donde 100 = mejor del grupo (invierte las métricas de "menos es mejor"). */
export function percentil(valor: number, grupo: number[], masEsMejor: boolean): number | null {
  if (grupo.length < 2) return null
  const c = grupo.filter((x) => (masEsMejor ? x <= valor : x >= valor)).length
  return (c / grupo.length) * 100
}

export function puntaje(m: ModeloPerfil, a: AtletaModelo, def: MetricaDef): number | null {
  const v = a.valores[def.id]
  return v === undefined ? null : percentil(v, grupoReferencia(m, a, def.id), def.masEsMejor)
}

export const defsRadar = (m: ModeloPerfil): MetricaDef[] => m.catalogo.filter((d) => d.radar)

// ─────────────────────────────────────────────────────────────────────────────
// Global Smart Insights — reglas que cruzan tests distintos
// ─────────────────────────────────────────────────────────────────────────────

export interface InsightGlobal {
  id: string
  nivel: 'riesgo' | 'precaucion' | 'ok' | 'info'
  icono: string
  titulo: string
  mensaje: string
  /** Fuentes que se cruzaron para llegar a la conclusión. */
  fuentes: string[]
}

export function generarInsightsGlobales(m: ModeloPerfil, a: AtletaModelo): InsightGlobal[] {
  const out: InsightGlobal[] = []
  const porRol = (rol: RolMetrica): MetricaDef | undefined => {
    const c = m.catalogo.filter((d) => d.rol === rol && a.valores[d.id] !== undefined)
    return c.find((d) => d.fuente === 'cmj' || /bilateral/i.test(d.fuenteLabel)) ?? c[0] // preferir el CMJ bilateral
  }
  const val = (rol: RolMetrica) => {
    const d = porRol(rol)
    return d ? { d, v: a.valores[d.id], p: puntaje(m, a, d) } : null
  }

  const nbAsim = val('nb_asim')
  const nbFza = val('nb_fuerza')
  const salto = val('salto')
  const rsi = val('rsi')
  const asimSalto = val('asim_salto')
  const grasa = val('grasa')
  const musculo = val('musculo')
  const bajo = (x: { p: number | null } | null, umbral = 30) => x !== null && x.p !== null && x.p <= umbral
  const alto = (x: { p: number | null } | null, umbral = 70) => x !== null && x.p !== null && x.p >= umbral
  const fu = (...xs: Array<{ d: MetricaDef } | null>) => [...new Set(xs.filter((x): x is { d: MetricaDef } => x !== null).map((x) => x.d.fuenteLabel))]
  const pf = (v: number | undefined, d = 1) => (v === undefined ? '—' : v.toFixed(d).replace('.', ','))

  // 1. Asimetría de isquios + salto bajo
  if (nbAsim && nbAsim.v > 10 && (bajo(salto) || bajo(rsi))) {
    const k = bajo(salto) ? salto : rsi
    out.push({
      id: 'asim-y-salto-bajo', nivel: nbAsim.v > 20 ? 'riesgo' : 'precaucion', icono: nbAsim.v > 20 ? '🔴' : '🟡',
      titulo: 'Asimetría de isquios + baja capacidad de salto',
      mensaje: `Asimetría de ${pf(nbAsim.v)} % en NordBord y ${k?.d.label.toLowerCase()} en el percentil P${pf(k?.p ?? undefined, 0)} de su grupo. Combina riesgo de lesión de isquiotibiales con déficit de potencia: derivar a kinesiología, sumar trabajo excéntrico unilateral y re-testear ambas pruebas en 4 semanas.`,
      fuentes: fu(nbAsim, k),
    })
  }

  // 2. Asimetría consistente en dos tests
  if (nbAsim && nbAsim.v > 10 && asimSalto && asimSalto.v > 10) {
    out.push({
      id: 'asim-doble', nivel: 'riesgo', icono: '🔴', titulo: 'Asimetría consistente en dos pruebas distintas',
      mensaje: `${pf(nbAsim.v)} % en isquios (NordBord) y ${pf(asimSalto.v)} % en el salto. Cuando dos tests independientes coinciden, el déficit lateral probablemente es estructural (no ruido de medición): revisar antecedentes de lesión y controlar la exposición a sprint máximo.`,
      fuentes: fu(nbAsim, asimSalto),
    })
  } else if (nbAsim && nbAsim.v > 10 && asimSalto && asimSalto.v <= 5) {
    out.push({
      id: 'asim-solo-isquios', nivel: 'info', icono: 'ℹ️', titulo: 'Asimetría localizada en isquiotibiales',
      mensaje: `El salto es simétrico (${pf(asimSalto.v)} %) pero los isquios muestran ${pf(nbAsim.v)} %: el déficit es específico del patrón excéntrico de isquios, no global del tren inferior.`,
      fuentes: fu(nbAsim, asimSalto),
    })
  }

  // 3. Fuerza alta pero salto bajo → transferencia
  if (alto(nbFza) && (bajo(salto) || bajo(rsi))) {
    out.push({
      id: 'transferencia', nivel: 'precaucion', icono: '🟡', titulo: 'Fuerza sin transferencia al salto',
      mensaje: 'Buena fuerza excéntrica de isquios pero salto/reactividad por debajo del grupo: la fuerza no se está expresando en velocidad. Priorizar pliometría, trabajo de fuerza-velocidad y técnica de salto.',
      fuentes: fu(nbFza, bajo(salto) ? salto : rsi),
    })
  }

  // 4. Déficit general
  if (bajo(nbFza) && (bajo(salto) || bajo(rsi))) {
    out.push({
      id: 'deficit-general', nivel: 'riesgo', icono: '🔴', titulo: 'Déficit general de fuerza y potencia',
      mensaje: 'Fuerza excéntrica y capacidad de salto están ambas en el tercio inferior de su grupo: bloque de fuerza estructural (nórdicos + sentadilla/RDL) antes de aumentar la exposición a alta velocidad.',
      fuentes: fu(nbFza, bajo(salto) ? salto : rsi),
    })
  }

  // 5. Composición corporal vs. rendimiento
  if (grasa && grasa.p !== null && grasa.p <= 30 && (bajo(salto) || bajo(rsi) || bajo(nbFza))) {
    out.push({
      id: 'grasa-vs-rendimiento', nivel: 'precaucion', icono: '🟡', titulo: 'Composición corporal puede estar limitando el rendimiento',
      mensaje: `Masa grasa de ${pf(grasa.v)} % (entre las más altas del grupo) junto con métricas relativas por debajo de su categoría: derivar al nutricionista para un plan de recomposición antes de re-testear.`,
      fuentes: fu(grasa, bajo(salto) ? salto : bajo(rsi) ? rsi : nbFza),
    })
  }
  if (alto(musculo) && (bajo(nbFza) || bajo(salto))) {
    out.push({
      id: 'musculo-sin-fuerza', nivel: 'info', icono: 'ℹ️', titulo: 'Masa muscular alta que no se traduce en fuerza/salto',
      mensaje: 'Buena masa muscular relativa pero fuerza o salto bajos: probable déficit de activación/velocidad de contracción más que de cantidad de músculo.',
      fuentes: fu(musculo, bajo(nbFza) ? nbFza : salto),
    })
  }

  // 6. Perfil integral
  const radares = defsRadar(m).map((d) => ({ d, p: puntaje(m, a, d) })).filter((x): x is { d: MetricaDef; p: number } => x.p !== null)
  const fuertes = radares.filter((x) => x.p >= 75)
  const debiles = radares.filter((x) => x.p <= 15)
  if (radares.length >= 4 && fuertes.length >= Math.ceil(radares.length * 0.6)) {
    out.push({
      id: 'perfil-integral', nivel: 'ok', icono: '🟢', titulo: 'Perfil integral destacado',
      mensaje: `${fuertes.length} de ${radares.length} ejes clave están en el cuartil superior de su grupo. Sostener con dosis mínima efectiva y monitorear.`,
      fuentes: [...new Set(fuertes.map((x) => x.d.fuenteLabel))],
    })
  }
  for (const x of debiles.slice(0, 3)) {
    out.push({
      id: `debil-${x.d.id}`, nivel: 'precaucion', icono: '🟡', titulo: `Punto débil: ${x.d.radarLabel}`,
      mensaje: `Percentil P${x.p.toFixed(0)} dentro de su grupo. Es el eje más comprometido del perfil: incluirlo como objetivo del próximo bloque.`,
      fuentes: [x.d.fuenteLabel],
    })
  }

  // 7. Cobertura
  const fuentes = new Set(m.catalogo.filter((d) => a.valores[d.id] !== undefined).map((d) => d.fuenteLabel))
  if (fuentes.size < 2) {
    out.push({
      id: 'cobertura', nivel: 'info', icono: 'ℹ️', titulo: 'Datos de una sola prueba',
      mensaje: 'Este jugador sólo tiene datos de una fuente: los cruces entre tests (asimetría + salto, composición corporal + fuerza) se habilitan cuando tenga al menos dos.',
      fuentes: [...fuentes],
    })
  }
  if (out.length === 0) {
    out.push({ id: 'sin-alertas', nivel: 'ok', icono: '🟢', titulo: 'Sin señales de alerta cruzadas', mensaje: 'Ningún cruce entre pruebas dispara una alerta para este jugador.', fuentes: [...fuentes] })
  }
  const orden = { riesgo: 0, precaucion: 1, info: 2, ok: 3 }
  return out.sort((x, y) => orden[x.nivel] - orden[y.nivel])
}
