import type { RegistroU } from './tipos'

/**
 * Perfiles clínicos de la plantilla universal (Fase 53): cada familia de test
 * (NordBord, CMJ bilateral, CMJ unilateral/SLJ) trae sus métricas troncales y
 * sus reglas de corte. Son funciones puras sobre los `valores` ya cargados del
 * registro (claves del JSONB de `dynamic_evaluations`), sin tocar el store.
 *
 * Procedencia de los cortes (dicha con honestidad):
 *  · 337 N en la pierna débil del curl nórdico: Timmins et al. (2016), referencia
 *    de fútbol profesional adulto — en juveniles se lee junto con N/kg.
 *  · Resto de los cortes (semáforo de asimetría 10/20 %, N/kg > 4,0, RSI-mod
 *    0,35/0,45, asimetría concéntrica > 10 %, aterrizaje > 15 %): CRITERIO
 *    OPERATIVO DEL CLUB definido por el cuerpo técnico. NO figuran en los papers
 *    de McMahon (2020) ni de Gathercole (2015) revisados: McMahon et al. (2020,
 *    n = 104 jugadores senior de rugby league) reporta RSImod medio 0,45–0,48
 *    (p25 0,39–0,42; p75 0,51–0,55), así que "> 0,45" equivale a la mediana de
 *    profesionales adultos, no a un corte de élite validado en juveniles.
 */

export type TipoTest = 'nordbord' | 'cmj-bilateral' | 'cmj-unilateral' | 'generico'

export function tipoDeTest(nombre: string): TipoTest {
  if (/nord|isquio|curl/i.test(nombre)) return 'nordbord'
  if (/unilateral|slj|1\s*pp|single|una pierna|1 pierna/i.test(nombre)) return 'cmj-unilateral'
  if (/cmj|salto|jump|bilateral|forcedeck/i.test(nombre)) return 'cmj-bilateral'
  return 'generico'
}

export interface UmbralesAsim {
  /** Por debajo: verde (equilibrado). */
  verde: number
  /** Por encima: rojo (alto riesgo); entre ambos: amarillo (precaución). */
  rojo: number
}

export const UMBRALES_GENERICOS: UmbralesAsim = { verde: 5, rojo: 10 }

/** NordBord usa el semáforo clásico de isquios (< 10 verde · 10–20 amarillo · > 20 rojo); el resto de los tests, el estricto 5/10. */
export function umbralesAsimDe(tipo: TipoTest): UmbralesAsim {
  return tipo === 'nordbord' ? { verde: 10, rojo: 20 } : UMBRALES_GENERICOS
}

export const NORDBORD_FUERZA_CRITICA_N = 337
export const NORDBORD_META_ELITE_NKG = 4.0
export const RSI_MOD_BAJO = 0.35
export const RSI_MOD_ELITE = 0.45
export const CMJ_ASIM_CONCENTRICA_ALERTA = 10
export const SLJ_ASIM_ATERRIZAJE_CRITICA = 15

/** Métricas troncales por familia: se eligen como "clave" cuando el test no define las suyas. */
export const METRICAS_TRONCALES: Record<TipoTest, RegExp[]> = {
  nordbord: [/^Media Max Force \(N\) \/ kg/i, /^Media Max Force \(N\)$/i, /^Media Max Torque \(Nm\) \/ kg/i, /^Max Imbalance/i],
  'cmj-bilateral': [/^Jump Height \(Imp-Mom\)/i, /^RSI-modified/i, /^Concentric Peak Force \/ BM/i, /^Eccentric Peak Power \/ BM/i],
  'cmj-unilateral': [/^Jump Height \(Imp-Mom\)/i, /^Concentric Mean Force \/ BM/i, /^Eccentric Peak Force \/ BM/i, /^Peak Landing Force \/ BM/i],
  generico: [],
}

// ─────────────────────────────────────────────────────────────────────────────
// Lecturas clínicas
// ─────────────────────────────────────────────────────────────────────────────

export type NivelClinico = 'ok' | 'info' | 'precaucion' | 'critico'

export interface Hallazgo {
  id: string
  nivel: NivelClinico
  titulo: string
  detalle: string
}

export interface LecturaClinica {
  hallazgos: Hallazgo[]
  /** Asimetría crítica según la regla de la familia (alimenta el KPI "Atletas con asimetría crítica"). */
  asimCritica: boolean
  /** Mayor nivel entre los hallazgos. */
  nivel: NivelClinico
}

const f1 = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const f2 = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const f0 = (v: number) => Math.round(v).toLocaleString('es-AR')

/** Primer valor numérico cuya clave calce con el patrón. */
export function buscar(valores: Record<string, number>, re: RegExp): { key: string; v: number } | null {
  for (const k of Object.keys(valores)) if (re.test(k.trim())) return { key: k, v: valores[k] }
  return null
}

export const asimEntre = (a: number, b: number): number => (Math.max(a, b) > 0 ? (Math.abs(a - b) / Math.max(a, b)) * 100 : 0)

const NIVELES: NivelClinico[] = ['ok', 'info', 'precaucion', 'critico']
const peor = (hs: Hallazgo[]): NivelClinico => hs.reduce<NivelClinico>((m, h) => (NIVELES.indexOf(h.nivel) > NIVELES.indexOf(m) ? h.nivel : m), 'ok')

/** Semáforo de asimetría con los umbrales de la familia. */
export function nivelAsim(pct: number, u: UmbralesAsim): NivelClinico {
  return pct < u.verde ? 'ok' : pct <= u.rojo ? 'precaucion' : 'critico'
}

export interface DatosNordBord {
  L: number
  R: number
  /** 'L' | 'R': la pierna con menos fuerza. */
  debil: 'L' | 'R'
  fuerzaDebil: number
  deficitPct: number
  nkg: number | null
  torqueNmKg: number | null
}

export function datosNordBord(v: Record<string, number>): DatosNordBord | null {
  const L = buscar(v, /^L Max Force \(N\)$/i)?.v
  const R = buscar(v, /^R Max Force \(N\)$/i)?.v
  if (L === undefined || R === undefined || L <= 0 || R <= 0) return null
  return {
    L, R,
    debil: L < R ? 'L' : 'R',
    fuerzaDebil: Math.min(L, R),
    deficitPct: asimEntre(L, R),
    nkg: buscar(v, /^Media Max Force \(N\) \/ kg/i)?.v ?? null,
    torqueNmKg: buscar(v, /^Media Max Torque \(Nm\) \/ kg/i)?.v ?? null,
  }
}

const LADO = { L: 'izquierda', R: 'derecha' } as const

export interface FaseUnilateral {
  id: 'altura' | 'concentrica' | 'excentrica' | 'aterrizaje'
  label: string
  unidad: string
  L: number
  R: number
  asimPct: number
  /** Lado con el valor MENOR (para altura/fuerzas: el lado más débil). En aterrizaje se informa el de MAYOR fuerza de impacto. */
  lado: 'L' | 'R'
}

const FASES: Array<{ id: FaseUnilateral['id']; label: string; unidad: string; re: (lado: 'L' | 'R') => RegExp }> = [
  { id: 'altura', label: 'Altura de salto', unidad: 'cm', re: (l) => new RegExp(`^Jump Height \\(Imp-Mom\\) \\[cm\\] \\(${l}\\)$`, 'i') },
  { id: 'concentrica', label: 'Fuerza concéntrica media', unidad: 'N/kg', re: (l) => new RegExp(`^Concentric Mean Force / BM \\[N/kg\\] \\(${l}\\)$`, 'i') },
  { id: 'excentrica', label: 'Fuerza excéntrica pico', unidad: 'N/kg', re: (l) => new RegExp(`^Eccentric Peak Force / BM \\[N/kg\\] \\(${l}\\)$`, 'i') },
  { id: 'aterrizaje', label: 'Fuerza pico de aterrizaje', unidad: 'N/kg', re: (l) => new RegExp(`^Peak Landing Force / BM \\[N/kg\\] \\(${l}\\)$`, 'i') },
]

export function fasesUnilaterales(v: Record<string, number>): FaseUnilateral[] {
  const out: FaseUnilateral[] = []
  for (const f of FASES) {
    const L = buscar(v, f.re('L'))?.v
    const R = buscar(v, f.re('R'))?.v
    if (L === undefined || R === undefined || L <= 0 || R <= 0) continue
    const lado = f.id === 'aterrizaje' ? (L > R ? 'L' : 'R') : L < R ? 'L' : 'R'
    out.push({ id: f.id, label: f.label, unidad: f.unidad, L, R, asimPct: asimEntre(L, R), lado })
  }
  return out
}

export function categoriaRsiMod(rsi: number): { nivel: NivelClinico; etiqueta: string } {
  if (rsi < RSI_MOD_BAJO) return { nivel: 'precaucion', etiqueta: 'Bajo / fatiga residual' }
  if (rsi <= RSI_MOD_ELITE) return { nivel: 'info', etiqueta: 'Promedio competitivo' }
  return { nivel: 'ok', etiqueta: 'Élite neuromuscular' }
}

export function lecturaClinica(tipo: TipoTest, reg: Pick<RegistroU, 'valores'>): LecturaClinica {
  const v = reg.valores
  const u = umbralesAsimDe(tipo)
  const hs: Hallazgo[] = []
  let asimCritica = false

  if (tipo === 'nordbord') {
    const d = datosNordBord(v)
    if (!d) return { hallazgos: [{ id: 'sin-lr', nivel: 'info', titulo: 'Sin fuerza L/R', detalle: 'El registro no trae fuerza excéntrica izquierda y derecha válidas.' }], asimCritica: false, nivel: 'info' }
    const nivel = nivelAsim(d.deficitPct, u)
    asimCritica = nivel === 'critico'
    hs.push({
      id: 'asim', nivel,
      titulo: d.deficitPct < 0.5 ? 'Piernas simétricas (0,0 %)' : `Pierna débil: ${LADO[d.debil]} (−${f1(d.deficitPct)} %)`,
      detalle: `L ${f0(d.L)} N · R ${f0(d.R)} N. Déficit exacto de la pierna ${LADO[d.debil]}: ${f1(d.deficitPct)} % (${nivel === 'ok' ? `equilibrado, < ${u.verde} %` : nivel === 'precaucion' ? `precaución, ${u.verde}–${u.rojo} %` : `alto riesgo de lesión, > ${u.rojo} %`}).`,
    })
    hs.push({
      id: 'critica', nivel: d.fuerzaDebil < NORDBORD_FUERZA_CRITICA_N ? 'precaucion' : 'ok',
      titulo: d.fuerzaDebil < NORDBORD_FUERZA_CRITICA_N ? `Pierna débil < ${NORDBORD_FUERZA_CRITICA_N} N` : `Pierna débil ≥ ${NORDBORD_FUERZA_CRITICA_N} N`,
      detalle: `${f0(d.fuerzaDebil)} N en la pierna ${LADO[d.debil]}. Benchmark de fuerza crítica de ${NORDBORD_FUERZA_CRITICA_N} N (Timmins et al., 2016, fútbol profesional adulto): en juveniles es orientativo, leerlo junto con la fuerza relativa.`,
    })
    if (d.nkg !== null)
      hs.push({ id: 'relativa', nivel: d.nkg >= NORDBORD_META_ELITE_NKG ? 'ok' : 'info', titulo: `Fuerza relativa ${f2(d.nkg)} N/kg`, detalle: d.nkg >= NORDBORD_META_ELITE_NKG ? `Supera la meta de élite del club (> ${f1(NORDBORD_META_ELITE_NKG)} N/kg).` : `Meta de élite del club: > ${f1(NORDBORD_META_ELITE_NKG)} N/kg (faltan ${f2(NORDBORD_META_ELITE_NKG - d.nkg)} N/kg).` })
    if (d.torqueNmKg !== null) hs.push({ id: 'torque', nivel: 'info', titulo: `Torque relativo ${f2(d.torqueNmKg)} Nm/kg`, detalle: 'Torque excéntrico pico medio (izquierda/derecha) sobre el peso corporal.' })
  } else if (tipo === 'cmj-bilateral') {
    const rsi = buscar(v, /^RSI-modified \[/i) ?? buscar(v, /^RSI-modified$/i)
    if (rsi) {
      const c = categoriaRsiMod(rsi.v)
      hs.push({
        id: 'rsi', nivel: c.nivel, titulo: `RSI-mod ${f2(rsi.v)} · ${c.etiqueta}`,
        detalle: `Cortes del club: < ${f2(RSI_MOD_BAJO)} bajo / fatiga residual · ${f2(RSI_MOD_BAJO)}–${f2(RSI_MOD_ELITE)} promedio competitivo · > ${f2(RSI_MOD_ELITE)} élite neuromuscular. Referencia: en rugby league senior (McMahon et al., 2020) el RSImod medio fue 0,45–0,48; un RSI-mod bajo con caída respecto del propio jugador sugiere fatiga neuromuscular (Gathercole et al., 2015).`,
      })
    }
    const asim = buscar(v, /^Concentric Peak Force \/ BM.*Asym/i)
    if (asim) {
      const alerta = asim.v > CMJ_ASIM_CONCENTRICA_ALERTA
      asimCritica = alerta
      hs.push({
        id: 'asim-conc', nivel: alerta ? 'precaucion' : 'ok', titulo: `Asimetría de fuerza pico concéntrica ${f1(asim.v)} %`,
        detalle: alerta ? `> ${CMJ_ASIM_CONCENTRICA_ALERTA} %: alerta de compensación unilateral en el despegue.` : `≤ ${CMJ_ASIM_CONCENTRICA_ALERTA} %: despegue simétrico.`,
      })
    }
    const exc = buscar(v, /^Eccentric Peak Force \/ BM.*Asym/i)
    if (exc && exc.v > CMJ_ASIM_CONCENTRICA_ALERTA) hs.push({ id: 'asim-exc', nivel: 'precaucion', titulo: `Asimetría excéntrica ${f1(exc.v)} %`, detalle: 'Diferencia entre lados en la fase de frenado del contramovimiento.' })
    const epp = buscar(v, /^Eccentric Peak Power \/ BM/i)
    if (epp) hs.push({ id: 'epp', nivel: 'info', titulo: `Potencia excéntrica pico ${f1(epp.v)} W/kg`, detalle: 'Las variables de mecánica del salto (fase excéntrica) cambian más que la altura ante la fatiga aguda (Gathercole et al., 2015): seguirla junto con la altura.' })
  } else if (tipo === 'cmj-unilateral') {
    const fases = fasesUnilaterales(v)
    for (const f of fases) {
      if (f.id === 'aterrizaje') {
        const crit = f.asimPct > SLJ_ASIM_ATERRIZAJE_CRITICA
        asimCritica = asimCritica || crit
        hs.push({
          // Sólo > 15 % es crítico; entre el corte verde y el 15 % queda en precaución.
          id: 'aterrizaje', nivel: crit ? 'critico' : f.asimPct >= u.verde ? 'precaucion' : 'ok',
          titulo: `Asimetría de aterrizaje ${f1(f.asimPct)} %`,
          detalle: crit
            ? `> ${SLJ_ASIM_ATERRIZAJE_CRITICA} %: alerta crítica de déficit en la capacidad de frenado y absorción de impacto (prioridad kinesiología). Mayor fuerza de impacto en la pierna ${LADO[f.lado]} (L ${f2(f.L)} · R ${f2(f.R)} N/kg).`
            : `L ${f2(f.L)} · R ${f2(f.R)} N/kg; mayor impacto en la pierna ${LADO[f.lado]}.`,
        })
      } else {
        // En el salto unilateral la única asimetría "crítica" es la de aterrizaje (> 15 %); el resto, como máximo precaución.
        const nivel = nivelAsim(f.asimPct, u) === 'critico' ? 'precaucion' : nivelAsim(f.asimPct, u)
        hs.push({ id: f.id, nivel, titulo: `${f.label}: ${f1(f.asimPct)} % de asimetría`, detalle: `L ${f2(f.L)} · R ${f2(f.R)} ${f.unidad}; lado más débil: ${LADO[f.lado]} (−${f1(f.asimPct)} %)${f.asimPct > u.rojo ? '. Asimetría elevada (> ' + u.rojo + ' %).' : '.'}` })
      }
    }
    if (fases.length === 0) hs.push({ id: 'sin-lr', nivel: 'info', titulo: 'Sin datos L/R', detalle: 'El registro no trae las columnas izquierda/derecha del salto unilateral.' })
  }
  return { hallazgos: hs, asimCritica, nivel: peor(hs) }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabla clínica grupal
// ─────────────────────────────────────────────────────────────────────────────

export interface FilaClinica {
  key: string
  nombre: string
  cat: string
  celdas: string[]
  nivel: NivelClinico
  asimCritica: boolean
}

export function columnasClinicas(tipo: TipoTest): string[] {
  if (tipo === 'nordbord') return ['Pierna débil', 'Déficit', 'Fuerza débil', 'N/kg', 'Hallazgo']
  if (tipo === 'cmj-bilateral') return ['RSI-mod', 'Categoría RSI', 'Asim. conc. PF', 'Hallazgo']
  if (tipo === 'cmj-unilateral') return ['Altura L / R', 'Asim. altura', 'Aterrizaje L / R', 'Asim. aterrizaje', 'Hallazgo']
  return []
}

export function filaClinica(tipo: TipoTest, reg: RegistroU): FilaClinica {
  const lc = lecturaClinica(tipo, reg)
  const v = reg.valores
  const principal = lc.hallazgos.find((h) => h.nivel === lc.nivel) ?? lc.hallazgos[0]
  const hallazgo = principal ? principal.titulo : '—'
  let celdas: string[] = []
  if (tipo === 'nordbord') {
    const d = datosNordBord(v)
    celdas = d ? [d.deficitPct < 0.5 ? 'Simétrica' : d.debil === 'L' ? 'Izquierda' : 'Derecha', d.deficitPct < 0.5 ? '0,0 %' : `−${f1(d.deficitPct)} %`, `${f0(d.fuerzaDebil)} N`, d.nkg !== null ? f2(d.nkg) : '—', hallazgo] : ['—', '—', '—', '—', hallazgo]
  } else if (tipo === 'cmj-bilateral') {
    const rsi = buscar(v, /^RSI-modified \[/i) ?? buscar(v, /^RSI-modified$/i)
    const asim = buscar(v, /^Concentric Peak Force \/ BM.*Asym/i)
    celdas = [rsi ? f2(rsi.v) : '—', rsi ? categoriaRsiMod(rsi.v).etiqueta : '—', asim ? `${f1(asim.v)} %` : '—', hallazgo]
  } else if (tipo === 'cmj-unilateral') {
    const fs = fasesUnilaterales(v)
    const alt = fs.find((f) => f.id === 'altura')
    const ate = fs.find((f) => f.id === 'aterrizaje')
    celdas = [alt ? `${f1(alt.L)} / ${f1(alt.R)} cm` : '—', alt ? `${f1(alt.asimPct)} %` : '—', ate ? `${f2(ate.L)} / ${f2(ate.R)}` : '—', ate ? `${f1(ate.asimPct)} %` : '—', hallazgo]
  }
  return { key: reg.key, nombre: reg.ath.nombre, cat: reg.ath.cat, celdas, nivel: lc.nivel, asimCritica: lc.asimCritica }
}
