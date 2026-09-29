import type { DatasetU, MetricaU, RegistroU } from '../universal/tipos'
import { G, duracionConcentrica, muestrearCurva, tiempoDeVuelo } from './curveBuilder'
import type { EstadoHito, FaseCurva, HitoAuditoria, ResultadoAuditoria, TestKind } from './tipos'

// ─────────────────────────────────────────────────────────────────────────────
// Bibliografía citada por el motor de auditoría (Paso 2 del pedido).
// ─────────────────────────────────────────────────────────────────────────────
const CITA = {
  mcmahon: 'McMahon, J.J., Suchomel, T.J., Lake, J.P. & Comfort, P. (2018). Understanding the Key Phases of the Countermovement Jump Force-Time Curve. Strength & Conditioning Journal, 40(4), 96–106.',
  linthorne: 'Linthorne, N.P. (2001). Analysis of standing vertical jumps using a force platform. American Journal of Physics, 69(11), 1198–1204.',
  owen: 'Owen, N.J., Watkins, J., Kilduff, L.P., Bevan, H.R. & Bennett, M.A. (2014). Development of a Criterion Method to Determine Peak Mechanical Power Output in a Countermovement Jump. Journal of Strength and Conditioning Research, 28(6), 1552–1558.',
  opar: 'Opar, D.A., Williams, M.D., Timmins, R.G., Hickey, J., Duhig, S.J. & Shield, A.J. (2012). Eccentric hamstring strength and hamstring injury risk in Australian footballers. Medicine & Science in Sports & Exercise, 47(4), 857–865.',
  timmins: 'Timmins, R.G., Bourne, M.N., Shield, A.J., Williams, M.D., Lorenzen, C. & Opar, D.A. (2016). Short biceps femoris fascicles and eccentric knee flexor weakness increase the risk of hamstring injury. British Journal of Sports Medicine, 50(24), 1524–1535.',
} as const

const ok = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v)

/** "L Max Force (N)" / "Max Force (N) (L)" → { base, lado }. Mismo criterio de `datos.ts`, no exportado de ahí. */
function ladoYBase(m: MetricaU): { base: string; lado: 'L' | 'R' } | null {
  const k = m.key.trim()
  const pre = k.match(/^([LR])\s+(.+)$/)
  if (pre) return { base: pre[2].trim(), lado: pre[1] as 'L' | 'R' }
  const suf = k.match(/^(.*\S)\s*\(([LR])\)\s*$/)
  if (suf) return { base: suf[1].trim(), lado: suf[2] as 'L' | 'R' }
  return null
}

const esRelativa = (unidad: string): boolean => /\/\s*kg\b/i.test(unidad)

function buscarMetrica(ds: DatasetU, patrones: RegExp[], opts: { soloRelativa?: boolean; excluirLateral?: boolean; excluirAsim?: boolean } = {}): MetricaU | undefined {
  const cands = ds.metricas.filter((m) => {
    if (opts.excluirLateral && m.lateral) return false
    if (opts.excluirAsim && m.esAsim) return false
    if (opts.soloRelativa && !esRelativa(m.unidad)) return false
    const hay = `${m.key} ${m.label}`
    return patrones.some((re) => re.test(hay))
  })
  // Prioriza "peak" sobre "mean" y la no-derivada sobre la derivada cuando hay varias candidatas.
  return cands.sort((a, b) => Number(/peak|pico/i.test(b.key)) - Number(/peak|pico/i.test(a.key)) || Number(a.derivada) - Number(b.derivada))[0]
}

function buscarParLR(ds: DatasetU, patronBase: RegExp): { L?: MetricaU; R?: MetricaU } {
  const out: { L?: MetricaU; R?: MetricaU } = {}
  for (const m of ds.metricas) {
    if (!m.lateral) continue
    const lb = ladoYBase(m)
    if (!lb || !patronBase.test(lb.base)) continue
    if (lb.lado === 'L') out.L = m
    else out.R = m
  }
  return out
}

/** Asimetrías ya detectadas por `datos.ts` (regex Asym/ASIM/Imbalance), clasificadas por fase del gesto. */
function buscarAsimetria(ds: DatasetU, patronFase: RegExp): MetricaU | undefined {
  return ds.asimetrias.filter((m) => patronFase.test(`${m.key} ${m.label}`)).sort((a, b) => Number(/peak|pico|max/i.test(b.key)) - Number(/peak|pico|max/i.test(a.key)))[0]
}

function detectarTestKind(nombreTest: string): TestKind {
  const n = nombreTest.toLowerCase()
  if (/nordbord|nordic|n[oó]rdico|hamstring|isquiotibial/.test(n)) return 'nordic'
  if (/imtp|isometric mid.?thigh|tir[oó]n isom[eé]trico/.test(n)) return 'imtp'
  if (/\bsj\b|squat jump/.test(n)) return 'sj'
  if (/cmj|countermovement|contramovimiento|salto/.test(n)) return 'cmj'
  return 'generico'
}

/** Semáforo de asimetría de fase: <10 % verde, ≥10 % rojo (≥15 % se marca "severa" en el detalle, criterio del pedido). */
function estadoAsim(v: number | null | undefined, umbralFail = 10): { estado: EstadoHito; severa: boolean } {
  if (!ok(v)) return { estado: 'na', severa: false }
  const abs = Math.abs(v)
  return { estado: abs < umbralFail ? 'ok' : 'fail', severa: abs >= 15 }
}

const NA = (id: string, fase: string, label: string, metrica: string, criterio: string, cita: string, t: number, f: number, detalle: string): HitoAuditoria => ({
  id, fase, label, estado: 'na', t, f, metrica, valorReal: '— (no incluido en el export de métricas por fase)', criterioEsperado: criterio, cita, detalle,
})

// ─────────────────────────────────────────────────────────────────────────────
// CMJ / SJ (ForceDecks) — trabaja en N/kg: BW siempre vale exactamente g = 9.81,
// sea cual sea el peso real del atleta, así que no hace falta conocerlo para
// que la curva sea físicamente correcta.
// ─────────────────────────────────────────────────────────────────────────────
function auditarSaltoVertical(registro: RegistroU, ds: DatasetU, kind: 'cmj' | 'sj'): ResultadoAuditoria {
  const v = registro.valores
  const mAltura = buscarMetrica(ds, [/jump\s*height|altura.*salto/i], { excluirLateral: true, excluirAsim: true })
  const mRsi = buscarMetrica(ds, [/rsi.?mod/i], { excluirLateral: true })
  const mConcPeak = buscarMetrica(ds, [/concentric.*(peak|pico).*force|fuerza.*(peak|pico).*concentric/i], { soloRelativa: true, excluirLateral: true, excluirAsim: true })
  const mEccPeakForce = buscarMetrica(ds, [/eccentric.*(peak|pico).*force/i], { soloRelativa: true, excluirLateral: true, excluirAsim: true })
  const mLandPeak = buscarMetrica(ds, [/(peak|pico).*landing.*force|landing.*(peak|pico).*force|aterrizaje.*(peak|pico)/i], { soloRelativa: true, excluirLateral: true, excluirAsim: true })

  const alturaCm = mAltura ? v[mAltura.key] : undefined
  const alturaM = ok(alturaCm) ? alturaCm / 100 : null
  const rsiMod = mRsi ? v[mRsi.key] : undefined
  const concPeak = mConcPeak ? v[mConcPeak.key] : undefined
  const landPeakReal = mLandPeak ? v[mLandPeak.key] : undefined
  const eccPeakReal = mEccPeakForce ? v[mEccPeakForce.key] : undefined

  const notas: string[] = []
  if (!ok(alturaCm) || !ok(concPeak)) {
    return {
      testKind: kind, testLabel: ds.config.nombre, valida: null, curva: [], fases: [], hitos: [], bilateral: false,
      unidadFuerza: 'N/kg', refBW: G,
      notaMetodologica: 'Este test no trae "Jump Height" ni el pico de fuerza concéntrica relativo al peso (N/kg): sin esos dos datos no se puede reconstruir una curva Fuerza-Tiempo con base física real.',
      citas: [CITA.mcmahon],
    }
  }

  // ── landmarks (tiempos en s, fuerza en N/kg) ──────────────────────────────
  const flight = ok(alturaM) ? tiempoDeVuelo(alturaM) : 0.35
  if (!ok(mRsi ? rsiMod : null)) notas.push('sin RSI-modified: la duración de la fase concéntrica es un valor de referencia, no derivado de este test')
  const concDur = ok(rsiMod) && ok(alturaM) ? duracionConcentrica(alturaM, rsiMod) : null
  const concDurFinal = concDur ?? 0.25
  const brakeDur = Math.max(0.15, concDurFinal * 1.1)
  const eccPeak = ok(eccPeakReal) ? eccPeakReal : (() => { notas.push('sin pico de fuerza excéntrica: el fondo del contramovimiento se estimó en 0.8× el pico concéntrico (valor típico, no medido)'); return concPeak * 0.8 })()
  const landPeak = ok(landPeakReal) ? landPeakReal : (() => { notas.push('sin pico de fuerza de aterrizaje: se estimó en 1.3× el pico concéntrico (valor típico, no medido)'); return concPeak * 1.3 })()

  const QUIET = 1.0
  const UNWEIGHT_DUR = kind === 'sj' ? 0 : 0.35
  const UNWEIGHT_DEPTH = kind === 'sj' ? 0 : G * 0.28
  const LAND_DECAY = 0.45

  const t0 = 0
  const t1 = QUIET // fin quietud
  const t2 = t1 + UNWEIGHT_DUR // mínimo de descarga (o, en SJ, mismo punto = fin de la pausa estática)
  const t3 = t2 + brakeDur // pico excéntrico / fondo del squat
  const t4 = t3 + concDurFinal // pico concéntrico, justo antes del despegue
  const t5 = t4 + 0.02 // despegue: F=0
  const t6 = t5 + flight // aterrizaje: contacto
  const t7 = t6 + 0.02 // pico de aterrizaje
  const t8 = t7 + LAND_DECAY // vuelve a BW

  const fQuiet = G
  const fUnweight = kind === 'sj' ? G : G - UNWEIGHT_DEPTH

  const totalKnots =
    kind === 'sj'
      ? [{ t: t0, v: fQuiet }, { t: t2, v: fQuiet }, { t: t3, v: eccPeak * 0.97 }, { t: t4, v: concPeak }, { t: t5, v: 0 }, { t: t6, v: 0 }, { t: t7, v: landPeak }, { t: t8, v: G }]
      : [{ t: t0, v: fQuiet }, { t: t1, v: fQuiet }, { t: t2, v: fUnweight }, { t: t3, v: eccPeak }, { t: t4, v: concPeak }, { t: t5, v: 0 }, { t: t6, v: 0 }, { t: t7, v: landPeak }, { t: t8, v: G }]

  // ── bilateral (CMJ Unilateral): L/R reales en los landmarks que trae el CSV; en quietud/vuelo, simétrico ──
  const concPar = buscarParLR(ds, /concentric.*(peak|pico).*force/i)
  const landPar = buscarParLR(ds, /(peak|pico).*landing.*force|landing.*(peak|pico).*force/i)
  const eccPar = buscarParLR(ds, /eccentric.*(peak|pico).*force/i)
  const bilateral = !!(concPar.L && concPar.R)
  const lr = (par: { L?: MetricaU; R?: MetricaU }, fallback: number): { l: number; r: number } => {
    const l = par.L ? v[par.L.key] : undefined
    const r = par.R ? v[par.R.key] : undefined
    return { l: ok(l) ? l : fallback, r: ok(r) ? r : fallback }
  }
  let izqKnots: { t: number; v: number }[] | undefined
  let derKnots: { t: number; v: number }[] | undefined
  if (bilateral) {
    const eccLR = lr(eccPar, eccPeak / 2)
    const concLR = lr(concPar, concPeak / 2)
    const landLR = lr(landPar, landPeak / 2)
    izqKnots = (kind === 'sj'
      ? [{ t: t0, v: fQuiet / 2 }, { t: t2, v: fQuiet / 2 }, { t: t3, v: eccLR.l * 0.97 }, { t: t4, v: concLR.l }, { t: t5, v: 0 }, { t: t6, v: 0 }, { t: t7, v: landLR.l }, { t: t8, v: G / 2 }]
      : [{ t: t0, v: fQuiet / 2 }, { t: t1, v: fQuiet / 2 }, { t: t2, v: fUnweight / 2 }, { t: t3, v: eccLR.l }, { t: t4, v: concLR.l }, { t: t5, v: 0 }, { t: t6, v: 0 }, { t: t7, v: landLR.l }, { t: t8, v: G / 2 }])
    derKnots = (kind === 'sj'
      ? [{ t: t0, v: fQuiet / 2 }, { t: t2, v: fQuiet / 2 }, { t: t3, v: eccLR.r * 0.97 }, { t: t4, v: concLR.r }, { t: t5, v: 0 }, { t: t6, v: 0 }, { t: t7, v: landLR.r }, { t: t8, v: G / 2 }]
      : [{ t: t0, v: fQuiet / 2 }, { t: t1, v: fQuiet / 2 }, { t: t2, v: fUnweight / 2 }, { t: t3, v: eccLR.r }, { t: t4, v: concLR.r }, { t: t5, v: 0 }, { t: t6, v: 0 }, { t: t7, v: landLR.r }, { t: t8, v: G / 2 }])
  }

  const curva = muestrearCurva({ total: totalKnots, izq: izqKnots, der: derKnots })

  const fases: FaseCurva[] = kind === 'sj'
    ? [
        { id: 'quiet', label: 'Pausa estática', t0, t1: t2, color: '#e2e8f0' },
        { id: 'brake', label: 'Frenado / fondo', t0: t2, t1: t3, color: '#fde68a' },
        { id: 'prop', label: 'Propulsión concéntrica', t0: t3, t1: t5, color: '#bbf7d0' },
        { id: 'flight', label: 'Vuelo', t0: t5, t1: t6, color: '#dbeafe' },
        { id: 'land', label: 'Aterrizaje', t0: t6, t1: t8, color: '#fecaca' },
      ]
    : [
        { id: 'quiet', label: 'Quietud (pesaje)', t0, t1, color: '#e2e8f0' },
        { id: 'unweight', label: 'Descarga / contramovimiento', t0: t1, t1: t2, color: '#fef3c7' },
        { id: 'brake', label: 'Frenado excéntrico', t0: t2, t1: t3, color: '#fde68a' },
        { id: 'prop', label: 'Propulsión concéntrica', t0: t3, t1: t5, color: '#bbf7d0' },
        { id: 'flight', label: 'Vuelo', t0: t5, t1: t6, color: '#dbeafe' },
        { id: 'land', label: 'Aterrizaje', t0: t6, t1: t8, color: '#fecaca' },
      ]

  const asimBrake = buscarAsimetria(ds, /ecc|exc\b|braking|frenado/i)
  const asimProp = buscarAsimetria(ds, /conc|prop/i)
  const asimLand = buscarAsimetria(ds, /land|aterriz/i)
  const vBrake = asimBrake ? v[asimBrake.key] : undefined
  const vProp = asimProp ? v[asimProp.key] : undefined
  const vLand = asimLand ? v[asimLand.key] : undefined
  const eBrake = estadoAsim(vBrake)
  const eProp = estadoAsim(vProp)
  const eLand = estadoAsim(vLand, 20)
  const landingForceEstado: EstadoHito = ok(landPeakReal) ? (landPeakReal < G * 3.5 ? 'ok' : 'fail') : 'na'

  const hitos: HitoAuditoria[] = [
    NA('quiet', 'Quietud', 'Fase de pesaje y quietud previa', '—', 'Estabilidad ≥1-2 s, CV < 2 % respecto al peso corporal', CITA.mcmahon, t0 + QUIET / 2, fQuiet, 'Requiere la serie cruda de los 1-2 s previos al inicio del movimiento; el export de métricas por fase no incluye esa ventana.'),
    ...(kind === 'cmj'
      ? [NA('unweight', 'Descarga', 'Fase de descarga / contramovimiento', '—', 'Descenso continuo y fluido, sin "doble bajada"', CITA.mcmahon, t1 + UNWEIGHT_DUR / 2, fUnweight, 'La detección de un amague o "doble bajada" exige la forma completa de la caída de fuerza; no es reconstruible desde picos y medias.')]
      : [{
          id: 'sjcheck', fase: 'Pausa estática', label: 'Contramovimiento encubierto', estado: 'na' as EstadoHito, t: t2 - 0.05, f: fQuiet,
          metrica: '—', valorReal: '— (no incluido en el export de métricas por fase)',
          criterioEsperado: 'Sin caída de fuerza > 5 % BW antes de la fase concéntrica pura',
          cita: CITA.linthorne, detalle: 'Ver si el jugador ejecutó SJ estático o un CMJ encubierto exige la curva de descenso completa; no es reconstruible desde picos y medias del export.',
        }]),
    {
      id: 'brake', fase: 'Frenado excéntrico', label: kind === 'sj' ? 'Fondo del squat' : 'Absorción en el frenado', estado: eBrake.estado, t: t3, f: eccPeak,
      metrica: asimBrake?.label ?? 'Asimetría de frenado', valorReal: ok(vBrake) ? `${vBrake.toFixed(1)} %` : '— (sin métrica de asimetría excéntrica en este archivo)',
      criterioEsperado: 'Absorción simétrica, asimetría < 10 % (> 15 % = severa)',
      cita: CITA.mcmahon,
      detalle: eBrake.estado === 'na' ? 'Este archivo no trae una asimetría de fase excéntrica/frenado identificable.' : eBrake.estado === 'ok' ? 'Absorción simétrica entre ambas piernas.' : `Asimetría de frenado ${eBrake.severa ? 'severa' : 'por encima del umbral'}: compensación o colapso excéntrico de un lado.`,
    },
    {
      id: 'prop', fase: 'Propulsión concéntrica', label: 'Vector de empuje', estado: eProp.estado, t: t4, f: concPeak,
      metrica: asimProp?.label ?? 'Asimetría concéntrica', valorReal: ok(vProp) ? `${vProp.toFixed(1)} %` : '— (sin métrica de asimetría concéntrica en este archivo)',
      criterioEsperado: 'Empuje coordinado, asimetría < 10 %',
      cita: CITA.owen,
      detalle: eProp.estado === 'na' ? 'Este archivo no trae una asimetría de fase concéntrica identificable.' : eProp.estado === 'ok' ? 'Pico de potencia/fuerza concéntrica simétrico.' : 'Pérdida de empuje o asimetría concéntrica por encima del umbral: revisar dominancia de pierna.',
    },
    NA('flight', 'Vuelo', 'Fuerza vertical en el aire', 'Fuerza total', 'Fuerza = 0 N estricto durante todo el vuelo', CITA.linthorne, (t5 + t6) / 2, 0, 'La curva de vuelo se fuerza a 0 por construcción (se deriva de la altura medida, no de la placa): no permite detectar roce o descalibración real del cero — eso exige la señal cruda.'),
    {
      id: 'landF', fase: 'Aterrizaje', label: 'Pico de fuerza de aterrizaje', estado: landingForceEstado, t: t7, f: landPeak,
      metrica: mLandPeak?.label ?? 'Peak Landing Force', valorReal: ok(landPeakReal) ? `${(landPeakReal / G).toFixed(2)} × BW` : '— (sin pico de aterrizaje en este archivo; valor de referencia en la curva)',
      criterioEsperado: 'Pico de aterrizaje < 3.5 × BW',
      cita: CITA.mcmahon,
      detalle: landingForceEstado === 'na' ? 'Este archivo no trae el pico de fuerza de aterrizaje: el nodo de la curva usa un valor de referencia, no auditable.' : landingForceEstado === 'ok' ? 'Absorción dentro de parámetros fisiológicos.' : 'Impacto por encima de 3.5× el peso corporal: aterrizaje rígido, revisar técnica de absorción.',
    },
    {
      id: 'landS', fase: 'Aterrizaje', label: 'Balance bilateral de aterrizaje', estado: eLand.estado, t: t7 + 0.03, f: landPeak * 0.9,
      metrica: asimLand?.label ?? 'Asimetría de aterrizaje', valorReal: ok(vLand) ? `${vLand.toFixed(1)} %` : '— (sin métrica de asimetría de aterrizaje en este archivo)',
      criterioEsperado: 'Disipación equilibrada, asimetría < 20 %',
      cita: CITA.mcmahon,
      detalle: eLand.estado === 'na' ? 'Este archivo no trae una asimetría de aterrizaje identificable.' : eLand.estado === 'ok' ? 'Aterrizaje equilibrado entre ambas piernas.' : 'Descarga asimétrica en el aterrizaje: derivar a control de rodilla/kinesiología.',
    },
  ]

  const evaluables = hitos.filter((h) => h.estado !== 'na')
  const valida = evaluables.length === 0 ? null : !evaluables.some((h) => h.estado === 'fail')

  return {
    testKind: kind,
    testLabel: ds.config.nombre,
    valida,
    curva,
    fases,
    hitos,
    bilateral,
    unidadFuerza: 'N/kg',
    refBW: G,
    notaMetodologica: `Curva reconstruida paramétricamente a partir de las métricas de fase informadas por la plataforma (altura, RSI-modified, picos de fuerza) — no es la señal cruda del sensor.${notas.length ? ` ${notas.map((n) => n[0].toUpperCase() + n.slice(1)).join('; ')}.` : ''}`,
    citas: [CITA.mcmahon, CITA.linthorne, CITA.owen],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NordBord (dinamometría excéntrica de isquiotibiales) — canales L/R en N absolutos.
// ─────────────────────────────────────────────────────────────────────────────
function auditarNordic(registro: RegistroU, ds: DatasetU): ResultadoAuditoria {
  const v = registro.valores
  const parFuerza = buscarParLR(ds, /max.*force|fuerza.*max/i)
  const parTiempoPico = buscarParLR(ds, /time.*to.*(peak|pico)|tiempo.*pico/i)
  const parAvg = buscarParLR(ds, /avg.*force|fuerza.*media|fuerza.*promedio/i)
  const fL = parFuerza.L ? v[parFuerza.L.key] : undefined
  const fR = parFuerza.R ? v[parFuerza.R.key] : undefined

  if (!ok(fL) && !ok(fR)) {
    return {
      testKind: 'nordic', testLabel: ds.config.nombre, valida: null, curva: [], fases: [], hitos: [], bilateral: false,
      unidadFuerza: 'N', refBW: null,
      notaMetodologica: 'Este test no trae "L/R Max Force (N)": sin el pico de fuerza por pierna no se puede reconstruir la curva de tensión excéntrica.',
      citas: [CITA.opar],
    }
  }

  const tPeakL = parTiempoPico.L && ok(v[parTiempoPico.L.key]) ? v[parTiempoPico.L.key] : 1.2
  const tPeakR = parTiempoPico.R && ok(v[parTiempoPico.R.key]) ? v[parTiempoPico.R.key] : 1.2
  const avgL = parAvg.L && ok(v[parAvg.L.key]) ? v[parAvg.L.key] : (ok(fL) ? fL * 0.85 : 0)
  const avgR = parAvg.R && ok(v[parAvg.R.key]) ? v[parAvg.R.key] : (ok(fR) ? fR * 0.85 : 0)
  const vL = ok(fL) ? fL : 0
  const vR = ok(fR) ? fR : 0
  const tEndL = tPeakL + 0.4
  const tEndR = tPeakR + 0.4
  const tMax = Math.max(tEndL, tEndR)

  const izqKnots = [{ t: 0, v: 0 }, { t: tPeakL, v: vL }, { t: tEndL, v: avgL }, { t: tMax, v: avgL }]
  const derKnots = [{ t: 0, v: 0 }, { t: tPeakR, v: vR }, { t: tEndR, v: avgR }, { t: tMax, v: avgR }]
  const totalKnots = izqKnots.map((k, i) => ({ t: k.t, v: k.v + derKnots[i].v }))

  const curva = muestrearCurva({ total: totalKnots, izq: izqKnots, der: derKnots })
  const fases: FaseCurva[] = [
    { id: 'onset', label: 'Inicio de tensión', t0: 0, t1: Math.min(tPeakL, tPeakR) * 0.2, color: '#e2e8f0' },
    { id: 'load', label: 'Pendiente excéntrica', t0: Math.min(tPeakL, tPeakR) * 0.2, t1: Math.max(tPeakL, tPeakR), color: '#fde68a' },
    { id: 'peak', label: 'Pico / post-pico', t0: Math.max(tPeakL, tPeakR), t1: tMax, color: '#bbf7d0' },
  ]

  const asimPico = buscarAsimetria(ds, /max.*force|fuerza.*max|imbalance|desbalance/i)
  const vAsim = asimPico ? v[asimPico.key] : undefined
  const eAsim = estadoAsim(vAsim)

  const hitos: HitoAuditoria[] = [
    NA('onset', 'Inicio de tensión', 'Aumento progresivo de la tensión', '—', 'Inicio suave, sin tirón (jerk) en los primeros 200 ms', CITA.opar, Math.min(tPeakL, tPeakR) * 0.1, Math.min(vL, vR) * 0.15, 'Detectar un tirón brusco en los primeros 200 ms exige la señal cruda a alta frecuencia; el export sólo trae picos y medias.'),
    NA('slope', 'Pendiente excéntrica', 'Resistencia sostenida hasta el fallo', '—', 'Pendiente continua, sin quiebre prematuro de cadera antes de ~300 N', CITA.timmins, (Math.min(tPeakL, tPeakR) + Math.max(tPeakL, tPeakR)) / 2, (vL + vR) / 2, 'El quiebre de cadera (compensación) se ve en la forma de la caída de fuerza; no es reconstruible desde el pico y la fuerza media.'),
    {
      id: 'peakSym', fase: 'Pico de fuerza', label: 'Simetría bilateral', estado: eAsim.estado, t: (tPeakL + tPeakR) / 2, f: Math.max(vL, vR),
      metrica: asimPico?.label ?? 'Asimetría de fuerza pico', valorReal: ok(vAsim) ? `${vAsim.toFixed(1)} %` : `${vL && vR ? ((Math.abs(vL - vR) / Math.max(vL, vR)) * 100).toFixed(1) : '—'} % (calculada de L/R Max Force)`,
      criterioEsperado: 'Asimetría de fuerza pico < 10 % (15-20 % = desenganche/alerta)',
      cita: CITA.opar,
      detalle: eAsim.estado === 'ok' ? 'Pico alcanzado de forma coordinada entre ambas piernas.' : eAsim.estado === 'fail' ? `Asimetría ${eAsim.severa ? 'severa' : 'por encima del umbral'} entre isquiotibiales: riesgo de lesión, ver Opar et al. (2012).` : 'Sin dato de asimetría de pico en este archivo.',
    },
  ]

  const evaluables = hitos.filter((h) => h.estado !== 'na')
  const valida = evaluables.length === 0 ? null : !evaluables.some((h) => h.estado === 'fail')

  return {
    testKind: 'nordic', testLabel: ds.config.nombre, valida, curva, fases, hitos, bilateral: true,
    unidadFuerza: 'N', refBW: null,
    notaMetodologica: 'NordBord es un test unilateral por diseño: no existe una "fuerza total" fisiológicamente significativa, así que se muestran únicamente los canales izquierdo y derecho (la línea "Total" es la suma, sólo de referencia). Curva reconstruida a partir del pico de fuerza, el tiempo al pico y la fuerza media informados por la plataforma.',
    citas: [CITA.opar, CITA.timmins],
  }
}

/** Punto de entrada del motor: detecta el tipo de test y delega en el auditor correspondiente. */
export function auditarRegistro(registro: RegistroU, ds: DatasetU): ResultadoAuditoria {
  const kind = detectarTestKind(ds.config.nombre)
  if (kind === 'cmj' || kind === 'sj') return auditarSaltoVertical(registro, ds, kind)
  if (kind === 'nordic') return auditarNordic(registro, ds)
  return {
    testKind: kind, testLabel: ds.config.nombre, valida: null, curva: [], fases: [], hitos: [], bilateral: false,
    unidadFuerza: '', refBW: null,
    notaMetodologica: kind === 'imtp'
      ? 'IMTP: sin protocolo de auditoría de fases definido todavía en este motor — se necesita el criterio clínico específico del cuerpo técnico antes de marcar puntos verdes/rojos.'
      : `"${ds.config.nombre}" no coincide con ningún protocolo de curva Fuerza-Tiempo soportado (CMJ, SJ, NordBord).`,
    citas: [],
  }
}
