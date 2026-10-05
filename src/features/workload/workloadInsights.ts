import type { DatosPeriodo, CorrelacionPlan, DesvioRpe, ResumenCarga } from './cargaInterna'

/**
 * Smart Decision Engine de Carga Interna (Fase 51) — traduce las métricas YA
 * calculadas por `cargaInterna.ts` en (1) decisiones operativas en lenguaje de
 * vestuario y (2) un diagnóstico académico/fisiológico del período. Son
 * funciones puras y deterministas: no leen el store, no usan la hora y todo
 * número que aparece en un texto sale de los argumentos (nada hardcodeado).
 * Con pocos datos devuelven un estado explícito "sin datos suficientes" en vez
 * de fallar o inventar.
 *
 * Marco de referencia (los textos lo citan):
 *  · Gabbett, T.J. (2016). The training-injury prevention paradox. Br J Sports Med 50(5):
 *    ACWR 0,8–1,3 zona óptima; > 1,5 zona de riesgo.
 *  · Foster, C. (1998). Monitoring training in athletes with reference to overtraining
 *    syndrome. Med Sci Sports Exerc 30(7): monotonía y tensión (strain).
 *  · Impellizzeri, F.M. et al. (2004). Use of RPE-based training load in soccer. Med Sci
 *    Sports Exerc 36(6): validez del sRPE como medida de carga interna en fútbol.
 */

export type Tono = 'verde' | 'amarillo' | 'rojo' | 'azul' | 'gris'

export interface TarjetaDecision {
  id: 'microciclo' | 'monotonia' | 'spike'
  titulo: string
  /** Estado en una frase corta (lo que va en el badge). */
  estado: string
  tono: Tono
  /** Valores y contexto que respaldan el estado. */
  detalle: string
}

export interface InformeAcademico {
  dinamica: string
  respuesta: string
  prescripcion: string
}

export const REFERENCIAS = [
  'Gabbett, T.J. (2016). The training-injury prevention paradox: should athletes be training smarter and harder? Br J Sports Med, 50(5), 273-280.',
  'Foster, C. (1998). Monitoring training in athletes with reference to overtraining syndrome. Med Sci Sports Exerc, 30(7), 1164-1168.',
  'Impellizzeri, F.M., Rampinini, E., Coutts, A.J., Sassi, A. & Marcora, S.M. (2004). Use of RPE-based training load in soccer. Med Sci Sports Exerc, 36(6), 1042-1047.',
]

// ─────────────────────────────────────────────────────────────────────────────
// Formato
// ─────────────────────────────────────────────────────────────────────────────

const n0 = (v: number) => Math.round(v).toLocaleString('es-AR')
const n1 = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const n2 = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(0)} %`
const pct0 = (v: number) => `${(v * 100).toFixed(0)} %`

/** Zona del ACWR según Gabbett (2016), con el texto para insertar en una oración. */
export function zonaAcwr(valor: number): { id: 'bajo' | 'optimo' | 'precaucion' | 'alto'; texto: string } {
  const acwr = Math.round(valor * 100) / 100 // se clasifica el valor que se muestra (2 decimales)
  if (acwr < 0.8) return { id: 'bajo', texto: 'por debajo de 0,8 (subentrenamiento relativo)' }
  if (acwr <= 1.3) return { id: 'optimo', texto: "dentro del 'Sweet Spot' (0,8–1,3)" }
  if (acwr <= 1.5) return { id: 'precaucion', texto: 'en zona de precaución (1,3–1,5)' }
  return { id: 'alto', texto: 'en zona de riesgo (> 1,5)' }
}

export function clasificarMonotoniaFoster(m: number): { tono: Tono; estado: string } {
  if (m > 2) return { tono: 'rojo', estado: 'Riesgo elevado de sobreentrenamiento y enfermedad' }
  if (m >= 1.5) return { tono: 'amarillo', estado: 'Precaución: poca variación entre días' }
  return { tono: 'verde', estado: 'Variabilidad óptima (estímulos ondulados)' }
}

const LABEL_RANGO = { '7d': 'los últimos 7 días', '4s': 'las últimas 4 semanas (mesociclo)', temporada: 'la temporada completa' } as const

// ─────────────────────────────────────────────────────────────────────────────
// Panel colectivo — Historial de carga / microciclos
// ─────────────────────────────────────────────────────────────────────────────

export interface InsightsMicrociclo {
  sinDatos: boolean
  tarjetas: TarjetaDecision[]
  informe: InformeAcademico
}

export interface EntradaMicrociclo {
  periodo: DatosPeriodo
  /** Resúmenes por jugador del grupo analizado (para contar alertas y calidad de dato). */
  resumenes: ResumenCarga[]
  /** "el plantel" o el nombre del jugador, para los textos. */
  alcance: string
}

export function insightsMicrociclo({ periodo: p, resumenes, alcance }: EntradaMicrociclo): InsightsMicrociclo {
  const actual = p.semanas[0]
  const sinDatos = !actual || p.cronica <= 0 || p.aguda <= 0

  if (sinDatos) {
    const vacio = 'Sin datos suficientes en este período: hacen falta al menos algunas sesiones con RPE y "Tiempo Total de Trabajo" cargado.'
    return {
      sinDatos: true,
      tarjetas: (['microciclo', 'monotonia', 'spike'] as const).map((id) => ({
        id,
        titulo: id === 'microciclo' ? 'Estado del microciclo' : id === 'monotonia' ? 'Monotonía & Strain (Foster)' : 'Bandera de riesgo colectivo',
        estado: 'Sin datos suficientes',
        tono: 'gris' as Tono,
        detalle: vacio,
      })),
      informe: { dinamica: vacio, respuesta: 'No se puede estimar la respuesta adaptativa sin carga registrada en la ventana.', prescripcion: 'Completar el RPE de los jugadores y el "Tiempo Total de Trabajo" de cada sesión en el Planificador.' },
    }
  }

  const acwr = Math.round((p.aguda / p.cronica) * 100) / 100
  const zona = zonaAcwr(acwr)
  const v = p.variacionSemanal
  const enAlertaSpike = resumenes.filter((r) => r.estado === 'confiable' && r.spikeSemanal === 'alto').length
  const semanaMonotona = resumenes.filter((r) => r.estado === 'confiable' && r.semanaMonotona).length
  const confiables = resumenes.filter((r) => r.estado === 'confiable').length
  const provisorios = resumenes.filter((r) => r.estado === 'provisorio').length

  // ── 1. Estado del microciclo ──
  let micro: { estado: string; tono: Tono; motivo: string }
  if ((v !== null && v > 0.15) || acwr > 1.5) {
    micro = { estado: 'Alerta: Pico Brusco de Carga', tono: 'rojo', motivo: `la carga de la semana actual (${n0(p.aguda)} UA${v !== null ? `, ${pct(v)} respecto de la anterior` : ''}) y un ACWR de ${n2(acwr)} superan lo que el grupo viene tolerando` }
  } else if (acwr > 1.15 || (v !== null && v > 0.1)) {
    micro = { estado: 'Microciclo de Impacto / Sobrecarga', tono: 'amarillo', motivo: `ACWR ${n2(acwr)}${v !== null ? ` y ${pct(v)} de variación semanal` : ''}: bloque de carga elevada, todavía dentro de márgenes manejables` }
  } else if (acwr < 0.8 || (v !== null && v <= -0.2)) {
    micro = { estado: 'Semana Regenerativa / Descarga', tono: 'azul', motivo: `ACWR ${n2(acwr)}${v !== null ? ` y ${pct(v)} de variación semanal` : ''}: la carga reciente quedó por debajo de la acumulada` }
  } else {
    micro = { estado: 'Microciclo de Mantenimiento', tono: 'verde', motivo: `ACWR ${n2(acwr)}${v !== null ? ` y ${pct(v)} de variación semanal` : ''}: la carga sostiene la crónica sin picos` }
  }

  // ── 2. Monotonía & Strain (semana actual) ──
  const m = actual.monotonia
  let monoCard: TarjetaDecision
  if (m === null) {
    monoCard = { id: 'monotonia', titulo: 'Monotonía & Strain (Foster)', estado: 'Sin datos suficientes', tono: 'gris', detalle: 'No hay carga diaria suficiente en los últimos 7 días para calcular la variabilidad.' }
  } else {
    const c = clasificarMonotoniaFoster(m)
    const previas = p.semanas.slice(0, Math.max(1, Math.ceil(p.dias / 7))).map((s) => s.monotonia).filter((x): x is number => x !== null && x < 99)
    const pico = previas.length > 1 ? ` En el período la monotonía osciló entre ${n2(Math.min(...previas))} y ${n2(Math.max(...previas))}.` : ''
    monoCard = {
      id: 'monotonia',
      titulo: 'Monotonía & Strain (Foster)',
      estado: c.estado,
      tono: c.tono,
      detalle: `Monotonía ${m >= 99 ? '≥ 10 (misma carga todos los días)' : n2(m)} · Strain ${actual.strain !== null ? n0(actual.strain) : '—'} (carga semanal × monotonía).${pico}${semanaMonotona > 0 ? ` ${semanaMonotona} jugador(es) con semana monótona de riesgo.` : ''}`,
    }
  }

  // ── 3. Spike de carga semanal ──
  let spike: TarjetaDecision
  if (v === null) {
    spike = { id: 'spike', titulo: 'Bandera de riesgo colectivo', estado: 'Sin semana anterior para comparar', tono: 'gris', detalle: 'No hay carga registrada en la semana previa, no se puede medir el incremento semanal.' }
  } else if (v > 0.15) {
    spike = { id: 'spike', titulo: 'Bandera de riesgo colectivo', estado: 'Spike peligroso de carga semanal', tono: 'rojo', detalle: `La carga subió ${pct(v)} (${n0(p.semanas[1].carga)} → ${n0(actual.carga)} UA), por encima del 15 % de referencia.${enAlertaSpike > 0 ? ` ${enAlertaSpike} jugador(es) con spike individual.` : ''}` }
  } else if (v > 0.1) {
    spike = { id: 'spike', titulo: 'Bandera de riesgo colectivo', estado: 'Incremento semanal notable (10–15 %)', tono: 'amarillo', detalle: `La carga subió ${pct(v)} (${n0(p.semanas[1].carga)} → ${n0(actual.carga)} UA): vigilar que no se encadene otro incremento.` }
  } else {
    spike = { id: 'spike', titulo: 'Bandera de riesgo colectivo', estado: v <= -0.2 ? 'Descarga: sin spikes' : 'Sin spikes: progresión controlada', tono: 'verde', detalle: `Variación semanal ${pct(v)} (${n0(p.semanas[1].carga)} → ${n0(actual.carga)} UA).${p.mayorSalto && p.mayorSalto.valor > 0.15 && p.rango !== '7d' ? ` Ojo: dentro del período hubo un salto de ${pct(p.mayorSalto.valor)} en la semana que cerró el ${p.mayorSalto.hasta}.` : ''}` }
  }

  // ── Informe académico ──
  const seq = p.semanas.slice(0, Math.min(p.semanas.length, 6)).map((s) => n0(s.carga)).reverse().join(' → ')
  const comp = p.composicion
  const compTxt = comp.campo + comp.gimnasio + comp.partido > 0 ? ` La carga se repartió ${pct0(comp.campo)} campo, ${pct0(comp.gimnasio)} gimnasio y ${pct0(comp.partido)} partido.` : ''
  const adhTxt = p.adhesionMedia !== null ? ` La adhesión media al RPE en las ${p.diasConSesion} sesiones del período fue de ${pct0(p.adhesionMedia)}.` : ''
  const calidad = resumenes.length > 0 ? ` Calidad del dato: ${confiables} de ${resumenes.length} jugadores con ACWR confiable${provisorios > 0 ? ` y ${provisorios} provisorios (cobertura < 70 %)` : ''}.` : ''
  const dinamica =
    `Durante ${LABEL_RANGO[p.rango]}, para ${alcance}, la carga media por jugador acumuló ${n0(p.cargaTotal)} UA (${n0(p.cargaMediaDiaria)} UA/día). ` +
    `La carga aguda (7 días) cerró en ${n0(p.aguda)} UA frente a una crónica de ${n0(p.cronica)} UA/semana, con una relación Agudo:Crónico de ${n2(acwr)}: el grupo queda ${zona.texto}.` +
    (v !== null ? ` Respecto de la semana anterior la carga varió ${pct(v)}.` : '') +
    (p.semanas.length > 2 ? ` Secuencia semanal (UA): ${seq}.` : '') +
    compTxt + adhTxt + calidad

  const mono = m === null ? '' : m > 2 ? ` La monotonía de ${n2(m)} indica poca ondulación entre días; Foster (1998) vinculó monotonía > 2 con carga alta a mayor incidencia de enfermedad y sobreentrenamiento.` : m >= 1.5 ? ` La monotonía de ${n2(m)} está en zona de precaución: la alternancia entre días de alta y baja carga empieza a achatarse.` : ` La monotonía de ${n2(m)} refleja buena ondulación de estímulos (días fuertes alternados con días de descarga), condición que favorece la supercompensación (Foster, 1998).`
  const respuestaBase =
    zona.id === 'optimo'
      ? "Una relación aguda:crónica entre 0,8 y 1,3 se asocia, en deportes de equipo, con el menor riesgo relativo de lesión y con adaptaciones sostenidas, porque la carga reciente no excede la que el organismo ya viene tolerando (Gabbett, 2016). Se espera un estímulo neuromuscular y metabólico suficiente para mantener la condición con fatiga residual manejable."
      : zona.id === 'precaucion'
        ? 'Con la carga aguda por encima de la crónica (1,3–1,5) el estímulo empieza a superar la preparación acumulada: se espera mayor fatiga neuromuscular y metabólica residual y menor capacidad de recuperación entre sesiones, con riesgo de lesión en ascenso (Gabbett, 2016).'
        : zona.id === 'alto'
          ? 'Un ACWR > 1,5 (spike) expone al grupo a una carga reciente muy superior a la que está adaptado a tolerar; la evidencia en deportes de equipo asocia estos picos con el mayor riesgo de lesión (Gabbett, 2016). Es esperable fatiga neuromuscular y metabólica acumulada, con peor calidad de sesión en las próximas 48–72 h.'
          : 'Un ACWR < 0,8 significa que la carga reciente cayó por debajo de lo acumulado. Una descarga breve favorece la disipación de fatiga, pero sostenida erosiona la carga crónica y la tolerancia a picos futuros (desentrenamiento relativo; Gabbett, 2016).'
  const respuesta = `${respuestaBase}${mono} El sRPE es una medida válida de carga interna en fútbol (Impellizzeri et al., 2004), por lo que estas curvas reflejan la respuesta integrada percibida por los jugadores.`

  const objetivoMax = 1.3 * p.cronica
  const reduccion = p.aguda > objetivoMax ? 1 - objetivoMax / p.aguda : 0
  let prescripcion: string
  if (zona.id === 'alto' || (v !== null && v > 0.15)) {
    const red = Math.min(0.3, Math.max(0.1, reduccion))
    prescripcion = `Reducir la carga de la próxima semana a ≤ ${n0(objetivoMax)} UA (aprox. ${pct0(Math.max(reduccion, 0.1))} menos) para volver al límite de 1,3 del ACWR: recortar ~${pct0(red)} del volumen de campo en MD-3 y MD-2, priorizar la densidad sobre el volumen y sumar descanso activo o trabajo regenerativo antes del partido.`
  } else if (zona.id === 'precaucion') {
    prescripcion = `Mantener el volumen sin sumar carga adicional (máx. ${n0(objetivoMax)} UA por semana) y ondular: concentrar la intensidad en MD-4/MD-3 y bajar MD-2/MD-1. ${enAlertaSpike + semanaMonotona > 0 ? `Dosificar la exposición de los ${enAlertaSpike + semanaMonotona} jugadores en alerta.` : 'Sin jugadores en alerta individual por ahora.'}`
  } else if (zona.id === 'bajo') {
    prescripcion = `Reponer carga de forma gradual: apuntar a ${n0(p.cronica)}–${n0(p.cronica * 1.1)} UA en la próxima semana (≈ ${n0(p.cronica * 0.9)} UA como piso para sostener la crónica) con incrementos progresivos, sin saltos mayores a 10–15 % semanales. Si fue una descarga planificada, retomar la progresión habitual luego del partido.`
  } else if (m !== null && m >= 1.5) {
    prescripcion = `Mantener el volumen pero aumentar la ondulación: llevar al menos un día intermedio a menos del 50 % de la carga diaria media (${n0(p.cargaMediaDiaria * 0.5)} UA) y concentrar las cargas altas en MD-4/MD-3 para bajar la monotonía de ${n2(m)} por debajo de 1,5.`
  } else {
    prescripcion = `Sostener la progresión habitual con incrementos semanales ≤ 10 % (techo orientativo ${n0(Math.min(objetivoMax, p.aguda * 1.1))} UA), manteniendo la alternancia de días de alta carga (MD-4/MD-3) y descarga (MD-2/MD-1).`
  }
  if (provisorios > confiables && resumenes.length > 0) prescripcion += ' Nota: la mayoría de los jugadores tiene dato provisorio; completar el RPE y el "Tiempo Total de Trabajo" de cada sesión consolida el ACWR antes de decidir cambios fuertes.'

  return {
    sinDatos: false,
    tarjetas: [{ id: 'microciclo', titulo: 'Estado del microciclo', estado: micro.estado, tono: micro.tono, detalle: micro.motivo.charAt(0).toUpperCase() + micro.motivo.slice(1) + '.' }, monoCard, spike],
    informe: { dinamica, respuesta, prescripcion },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel individual — Perfil del atleta
// ─────────────────────────────────────────────────────────────────────────────

export type Disponibilidad = 'apto' | 'regular' | 'riesgo' | 'sin-datos'

export interface InsightsAtleta {
  sinDatos: boolean
  disponibilidad: { id: Disponibilidad; label: string; tono: Tono; motivos: string[] }
  acwr: { valor: number | null; confiable: boolean; texto: string; zona: string }
  zScore: { valor: number | null; texto: string; tono: Tono }
  desvioRpe: { media: number | null; n: number; texto: string; tono: Tono }
  acciones: string[]
  diagnostico: { evolucion: string; pendiente: string; adherencia: string; calidad: string }
}

export interface EntradaAtleta {
  nombre: string
  r: ResumenCarga
  /** Z-score de la carga aguda del jugador contra la media del plantel (null si el grupo es muy chico o no varía). */
  zGrupo: number | null
  grupoN: number
  desvio: DesvioRpe
  periodo: DatosPeriodo
  correlacion: CorrelacionPlan
}

export function insightsAtleta({ nombre, r, zGrupo, grupoN, desvio, periodo: p, correlacion }: EntradaAtleta): InsightsAtleta {
  const sinDatos = r.estado === 'sin-datos' || r.acwr === null
  const confiable = r.estado === 'confiable'
  const acwr = r.acwr
  const zona = acwr === null ? 'sin datos' : zonaAcwr(acwr).texto
  const primerNombre = nombre.split(' ')[0]

  // ── Z-Score contra la categoría ──
  let zs: InsightsAtleta['zScore']
  if (zGrupo === null) zs = { valor: null, texto: grupoN < 5 ? `Grupo de comparación muy chico (${grupoN} jugadores con dato).` : 'La carga del plantel no varía lo suficiente para calcular un Z-score.', tono: 'gris' }
  else if (zGrupo > 1.5) zs = { valor: zGrupo, texto: `Z ${n2(zGrupo)}: entrena MUY por encima de la media del plantel (+1,5 DE).`, tono: 'rojo' }
  else if (zGrupo > 1) zs = { valor: zGrupo, texto: `Z ${n2(zGrupo)}: entrena por encima de la media del plantel (+1,0 DE).`, tono: 'amarillo' }
  else if (zGrupo < -1) zs = { valor: zGrupo, texto: `Z ${n2(zGrupo)}: entrena por debajo de la media del plantel (−1,0 DE).`, tono: 'amarillo' }
  else zs = { valor: zGrupo, texto: `Z ${n2(zGrupo)}: carga dentro de ±1 DE de la media del plantel.`, tono: 'verde' }

  // ── Desvío de RPE vs. planificado ──
  let dr: InsightsAtleta['desvioRpe']
  if (desvio.media === null || desvio.n < 3) dr = { media: desvio.media, n: desvio.n, texto: desvio.n === 0 ? 'Sin sesiones con RPE esperado y RPE del jugador para comparar.' : `Pocas sesiones comparables (${desvio.n}) para concluir un sesgo.`, tono: 'gris' }
  else if (desvio.media >= 2) dr = { media: desvio.media, n: desvio.n, texto: `Percibe las sesiones sistemáticamente más duras: +${n1(desvio.media)} pts vs. el RPE planificado (${desvio.n} sesiones).`, tono: 'rojo' }
  else if (desvio.media <= -2) dr = { media: desvio.media, n: desvio.n, texto: `Percibe las sesiones más livianas que lo planificado: ${n1(desvio.media)} pts (${desvio.n} sesiones).`, tono: 'azul' }
  else dr = { media: desvio.media, n: desvio.n, texto: `RPE acorde al plan (${desvio.media >= 0 ? '+' : '−'}${n1(Math.abs(desvio.media))} pts en ${desvio.n} sesiones).`, tono: 'verde' }

  // ── Disponibilidad ──
  const motivos: string[] = []
  let nivel: Disponibilidad = 'apto'
  const sube = (n: Disponibilidad, motivo: string) => {
    const orden: Disponibilidad[] = ['apto', 'regular', 'riesgo']
    if (orden.indexOf(n) > orden.indexOf(nivel)) nivel = n
    motivos.push(motivo)
  }
  if (sinDatos) {
    nivel = 'sin-datos'
    motivos.push(r.motivoEstado)
  } else {
    const a = Math.round((acwr as number) * 100) / 100
    if (a > 1.5) confiable ? sube('riesgo', `ACWR ${n2(a)} > 1,5 (zona de riesgo)`) : sube('regular', `ACWR provisorio ${n2(a)} > 1,5: confirmar con más datos antes de actuar`)
    else if (a > 1.3) sube('regular', `ACWR ${n2(a)} en zona de precaución (1,3–1,5)`)
    else if (a < 0.8) sube('regular', `ACWR ${n2(a)} < 0,8: subentrenamiento relativo`)
    if (r.spikeSemanal === 'alto' && r.variacionSemanal !== null) sube(confiable ? 'riesgo' : 'regular', `Salto semanal de carga ${pct(r.variacionSemanal)} (> 15 %)`)
    else if (r.spikeSemanal === 'medio' && r.variacionSemanal !== null) sube('regular', `Incremento semanal ${pct(r.variacionSemanal)} (10–15 %)`)
    if (r.semanaMonotona) sube(a > 1.3 && confiable ? 'riesgo' : 'regular', `Semana monótona de riesgo (monotonía ${r.monotonia !== null ? n2(r.monotonia) : '—'} > 2,0)`)
    else if (r.monotonia !== null && r.monotonia >= 1.5 && r.monotonia < 99) sube('regular', `Monotonía ${n2(r.monotonia)} en zona de precaución`)
    if (zGrupo !== null && zGrupo > 1.5) sube(a > 1.3 && confiable ? 'riesgo' : 'regular', `Carga ${n2(zGrupo)} DE por encima del plantel`)
    else if (zGrupo !== null && Math.abs(zGrupo) > 1) sube('regular', `Carga ${n2(zGrupo)} DE respecto del plantel`)
    if (dr.tono === 'rojo') sube('regular', 'Percibe las sesiones más duras de lo planificado')
    if (nivel === 'apto') motivos.push(`ACWR ${n2(a)} ${zona}, sin banderas de spike, monotonía ni desvío de carga.`)
  }
  const disp = {
    apto: { label: '🟢 Apto Competitivo', tono: 'verde' as Tono },
    regular: { label: '🟡 Regulación de Volumen', tono: 'amarillo' as Tono },
    riesgo: { label: '🔴 Riesgo de Sobrecarga', tono: 'rojo' as Tono },
    'sin-datos': { label: 'Sin datos suficientes', tono: 'gris' as Tono },
  }[nivel]

  // ── Acciones ──
  const acciones: string[] = []
  if (sinDatos) acciones.push('Completar el RPE del jugador y el "Tiempo Total de Trabajo" de las sesiones para poder tomar decisiones con datos.')
  else {
    const a = Math.round((acwr as number) * 100) / 100
    if (a > 1.5 || (zGrupo !== null && zGrupo > 1.5)) acciones.push('Dosificar minutos de juego o reducir volumen de alta velocidad (HSR).')
    if (a < 0.8) acciones.push('Requiere estímulo compensatorio para no perder condición crónica.')
    if (a > 1.3 && a <= 1.5) acciones.push('No sumar volumen: mantener la carga actual, ondular los días y controlar la exposición a HSR.')
    if (a >= 0.8 && a <= 1.3 && dr.tono !== 'rojo' && !(zGrupo !== null && zGrupo > 1.5)) acciones.push('Mantener progresión habitual.')
    if (a >= 0.8 && a <= 1.3 && dr.tono === 'rojo') acciones.push('El ACWR es correcto pero percibe las sesiones mucho más duras que lo planificado: revisar wellness y fatiga con el jugador antes de subir la carga.')
    if (dr.tono === 'azul') acciones.push('Percibe las sesiones más livianas que lo planificado: verificar la comprensión de la escala RPE o la intensidad real de las tareas.')
    if (r.semanaMonotona) acciones.push('Introducir variación: bajar un día intermedio a menos del 50 % de su carga media diaria.')
    if (!confiable) acciones.push(`El dato es provisorio (${r.cobertura !== null ? pct0(r.cobertura) : '0 %'} de las sesiones con RPE): tomar la decisión como orientativa hasta consolidar el registro.`)
  }

  // ── Diagnóstico longitudinal ──
  const hay = (s: DatosPeriodo['semanas'][number]) => s.carga > 0
  const ult = p.semanas.slice(0, 4).filter(hay)
  let evolucion: string
  if (ult.length < 2) evolucion = `${primerNombre} no tiene suficientes semanas con carga registrada para describir la evolución de su tolerancia al estrés.`
  else {
    const cronolog = [...ult].reverse()
    const cambio = cronolog[cronolog.length - 1].carga / cronolog[0].carga - 1
    const sube = cronolog.every((x, i) => i === 0 || x.carga >= cronolog[i - 1].carga * 0.95)
    const baja = cronolog.every((x, i) => i === 0 || x.carga <= cronolog[i - 1].carga * 1.05)
    const tolerancia = cambio > 0.15 ? (sube ? 'tolerando cargas progresivamente mayores' : 'con un aumento neto de la carga, aunque irregular entre semanas') : cambio < -0.15 ? (baja ? 'con una reducción sostenida de la carga que recibe' : 'con una caída neta de la carga semanal, aunque irregular entre semanas') : 'con una carga semanal estable'
    evolucion = `En las últimas ${cronolog.length} semanas la carga semanal de ${primerNombre} fue ${cronolog.map((s) => n0(s.carga)).join(' → ')} UA (${pct(cambio)} entre la primera y la última), ${tolerancia}. ${!sinDatos && r.acwr !== null ? `Hoy su ACWR es ${n2(r.acwr)}, ${zona}${confiable ? '' : ' (dato provisorio)'}.` : 'Todavía no hay suficientes sesiones con RPE para calcular su ACWR.'}`
  }

  let pendiente: string
  if (p.pendienteCronica === null) pendiente = 'Todavía no hay suficiente historia para estimar la pendiente de su carga crónica.'
  else if (p.pendienteCronica >= 0.1) pendiente = `La carga crónica subió ${pct(p.pendienteCronica)} en el período (hasta ${n0(p.cronica)} UA/semana): está construyendo base física, lo que eleva su tolerancia a cargas agudas futuras (Gabbett, 2016).`
  else if (p.pendienteCronica <= -0.1) pendiente = `La carga crónica cayó ${pct(p.pendienteCronica)} en el período (hasta ${n0(p.cronica)} UA/semana): está perdiendo base, con riesgo de desentrenamiento aeróbico y muscular y menor tolerancia a picos de carga.`
  else pendiente = `La carga crónica se mantiene estable (${pct(p.pendienteCronica)}, ${n0(p.cronica)} UA/semana): sostiene su condición sin ganar ni perder base de forma relevante.`

  const cobTxt = r.cobertura !== null ? `${r.diasReales} de ${r.diasPlanificados} sesiones/días con RPE en 28 días (${pct0(r.cobertura)})` : 'sin sesiones planificadas en la ventana'
  let corrTxt: string
  if (correlacion.r === null) corrTxt = 'No hay suficientes sesiones con carga planificada y reportada para estimar la correlación.'
  else if (correlacion.r >= 0.7) corrTxt = `La correlación entre la carga planificada y la que reporta es alta (r = ${n2(correlacion.r)}, n = ${correlacion.n}): responde de forma proporcional a lo que se le prescribe.`
  else if (correlacion.r >= 0.4) corrTxt = `La correlación entre la carga planificada y la reportada es moderada (r = ${n2(correlacion.r)}, n = ${correlacion.n}): sigue en parte el plan, con variaciones personales.`
  else corrTxt = `La correlación entre la carga planificada y la reportada es baja (r = ${n2(correlacion.r)}, n = ${correlacion.n}): lo que reporta no acompaña lo planificado; conviene revisar la comprensión de la escala RPE o el cumplimiento de las sesiones.`
  const adherencia = `Adherencia: ${cobTxt}. ${corrTxt} El sRPE es una medida válida de carga interna en fútbol (Impellizzeri et al., 2004), por lo que la adherencia al reporte condiciona directamente la fiabilidad de este análisis.`

  const calidad = confiable
    ? `Dato confiable (${r.motivoEstado})`
    : sinDatos
      ? r.motivoEstado
      : `Dato provisorio: ${r.motivoEstado}${r.rpeSinCarga > 0 ? ` Además ${r.rpeSinCarga} RPE no suman carga porque a la sesión le falta el "Tiempo Total de Trabajo".` : ''}`

  return {
    sinDatos,
    disponibilidad: { id: nivel, label: disp.label, tono: disp.tono, motivos },
    acwr: { valor: acwr, confiable, texto: acwr === null ? '—' : `${n2(acwr)} · ${confiable ? 'Confiable' : 'Provisorio'}`, zona },
    zScore: zs,
    desvioRpe: dr,
    acciones,
    diagnostico: { evolucion, pendiente, adherencia, calidad },
  }
}
