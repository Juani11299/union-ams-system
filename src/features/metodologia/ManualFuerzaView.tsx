import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NOMBRE_AREA, FIRMA_AUTOR } from '@/constants/branding'

/**
 * Manual Metodológico Institucional — Área de Fuerza. Versión completa,
 * maquetada 1-a-1 sobre el contenido académico redactado en
 * `docs/Manual_Metodologico_Fuerza_Oficial.md` (no es un resumen — es ese
 * texto distribuido en hojas A4). Documento digital exportable a PDF vía
 * `window.print()`, reutilizando estrictamente la arquitectura del Manual de
 * Isometría (`.print-area` de `src/index.css` + hojas A4 con
 * `print:break-after-page`, ver `MetodologiaIsometriaView.tsx`).
 *
 * Cada capítulo (1-5 del Markdown) arranca en hoja nueva, como un libro de
 * texto — el contenido de un capítulo largo se reparte en varias hojas
 * consecutivas en vez de forzarlo en una sola.
 */
export function ManualFuerzaView() {
  function handleDescargarPdf() {
    window.print()
  }

  return (
    <div className="pb-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/" className="rounded-lg px-2 py-1.5 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Volver">
            ← Volver
          </Link>
          <span className="text-sm font-medium">🏋️ Manual Metodológico — Área de Fuerza</span>
        </div>
        <button
          type="button"
          onClick={handleDescargarPdf}
          className="rounded-lg bg-union-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-union-red-700"
        >
          🖨️ Descargar Manual (PDF)
        </button>
      </div>

      <div className="print-area flex flex-col items-center gap-8">
        <Hoja>
          <Portada />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="Índice y Nota Metodológica" />
          <Indice />
          <NotaFuentes />
        </Hoja>

        {/* Capítulo 1 — Fundamentos Fisiológicos y Biomecánicos (3 hojas) */}
        <Hoja>
          <Encabezado eyebrow="01 — Fundamentos Fisiológicos y Biomecánicos" />
          <Cap1Intro />
          <Cap1Rfd />
        </Hoja>
        <Hoja>
          <Encabezado eyebrow="01 — Fundamentos Fisiológicos y Biomecánicos" />
          <Cap1Cea />
          <Cap1Acwr />
        </Hoja>
        <Hoja>
          <Encabezado eyebrow="01 — Fundamentos Fisiológicos y Biomecánicos" />
          <Cap1Neural />
        </Hoja>

        {/* Capítulo 2 — Arquitectura y Organización de la Sesión (2 hojas) */}
        <Hoja>
          <Encabezado eyebrow="02 — Arquitectura de la Sesión: Plan GENERAL" />
          <Cap2General />
        </Hoja>
        <Hoja>
          <Encabezado eyebrow="02 — Arquitectura de la Sesión: Ejercicios VITAMINA" />
          <Cap2Vitamina />
        </Hoja>

        {/* Capítulo 3 — Escuela de Movimiento e Isometría (2 hojas) */}
        <Hoja>
          <Encabezado eyebrow="03 — Escuela de Movimiento e Isometría" />
          <Cap3Intro />
          <Cap3Yielding />
        </Hoja>
        <Hoja>
          <Encabezado eyebrow="03 — Escuela de Movimiento e Isometría" />
          <Cap3Overcoming />
          <Cap3Especifica />
        </Hoja>

        {/* Capítulo 4 — Periodización y Nomenclatura del Microciclo (2 hojas) */}
        <Hoja>
          <Encabezado eyebrow="04 — Periodización y Nomenclatura del Microciclo" />
          <Cap4Intro />
          <GrillaMicrociclo items={MICROCICLO.slice(0, 3)} />
        </Hoja>
        <Hoja>
          <Encabezado eyebrow="04 — Periodización y Nomenclatura del Microciclo" />
          <GrillaMicrociclo items={MICROCICLO.slice(3)} />
          <NotaImplementacion />
        </Hoja>

        {/* Capítulo 5 — Modelo LTAD (5 hojas) */}
        <Hoja>
          <Encabezado eyebrow="05 — Modelo LTAD: Marco General" />
          <Cap5Intro />
        </Hoja>
        <Hoja>
          <Encabezado eyebrow="05.1 — LTAD: 10ma y 9na División" />
          <CategoriaLtad {...LTAD_101} />
        </Hoja>
        <Hoja>
          <Encabezado eyebrow="05.2 — LTAD: 8va y 7ma División" />
          <CategoriaLtad {...LTAD_87} />
        </Hoja>
        <Hoja>
          <Encabezado eyebrow="05.3 — LTAD: 6ta y 5ta División" />
          <CategoriaLtad {...LTAD_65} />
        </Hoja>
        <Hoja ultima>
          <Encabezado eyebrow="05.4 — LTAD: 4ta División y Reserva" />
          <CategoriaLtad {...LTAD_4R} />
          <Cierre />
          <Pie />
        </Hoja>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Estructura base (hoja A4 / encabezado / portada) — igual a la Fase 17
// ---------------------------------------------------------------------------

function Hoja({ children, ultima = false }: { children: ReactNode; ultima?: boolean }) {
  return (
    <div
      className={`min-h-[1123px] w-full max-w-[794px] rounded-lg bg-white p-12 shadow-2xl print:min-h-0 print:w-full print:max-w-none print:rounded-none print:p-0 print:shadow-none ${
        ultima ? '' : 'print:break-after-page'
      }`}
    >
      {children}
    </div>
  )
}

function Encabezado({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 border-b-2 border-union-red-600 pb-2">
      <div className="flex items-center gap-2">
        <img src="/logo-union.png" alt="" className="h-6 w-6 shrink-0 object-contain" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Manual Metodológico · {NOMBRE_AREA}
        </p>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-union-red-600">{eyebrow}</p>
    </div>
  )
}

function Portada() {
  return (
    <div className="flex h-full min-h-[999px] flex-col justify-between">
      <div className="flex items-start justify-between border-b-4 border-union-red-600 pb-6">
        <img src="/logo-union.png" alt="" className="h-20 w-20 shrink-0 object-contain" />
        <p className="text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {NOMBRE_AREA}
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-union-red-600">
          Manual Metodológico Oficial · "Metodología UNIÓN"
        </p>
        <h1 className="text-4xl font-black leading-tight text-union-charcoal">{NOMBRE_AREA}</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
          Fundamentos fisiológicos y biomecánicos, arquitectura de sesión, escuela de
          movimiento e isometría, periodización por microciclo y modelo de Desarrollo
          Atlético a Largo Plazo (LTAD) — marco teórico de referencia para la planificación,
          ejecución y supervisión del entrenamiento de fuerza en todas las categorías del
          club, desde la 10ma división hasta el plantel de Reserva y Primera.
        </p>
      </div>

      <div className="flex items-end justify-between border-t border-slate-200 pt-4">
        <p className="text-[11px] text-slate-400">Club Atlético Unión de Santa Fe</p>
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-wide text-union-charcoal">{FIRMA_AUTOR}</p>
          <p className="text-[10px] text-slate-400">{NOMBRE_AREA} — Documento interno de uso metodológico</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers de tipografía editorial — reutilizados en todo el manual
// ---------------------------------------------------------------------------

function Titulo({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 text-base font-bold leading-snug text-union-charcoal">{children}</h2>
}

function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-union-red-600">{children}</h3>
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-justify text-xs leading-relaxed tracking-wide text-slate-600">{children}</p>
}

function MarcoConceptual({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-[10px] italic leading-relaxed text-slate-400">
      <span className="font-semibold not-italic text-union-red-600">Marco conceptual: </span>
      {children}
    </p>
  )
}

function CitaVerificada({ children, fuente }: { children: ReactNode; fuente: string }) {
  return (
    <blockquote className="mt-3 border-l-4 border-union-red-600 bg-slate-50 py-2 pl-4 pr-3 text-[11px] italic leading-relaxed text-slate-600 break-inside-avoid">
      {children}
      <footer className="mt-1 text-[10px] font-semibold not-italic text-union-charcoal">{fuente}</footer>
    </blockquote>
  )
}

function NotaTransparencia({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-md bg-slate-50 p-2.5 text-[10px] italic leading-relaxed text-slate-400 break-inside-avoid">
      {children}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Índice y nota sobre fuentes
// ---------------------------------------------------------------------------

const INDICE: { numero: string; titulo: string }[] = [
  { numero: '01', titulo: 'Fundamentos Fisiológicos y Biomecánicos en el Fútbol' },
  { numero: '02', titulo: 'Arquitectura y Organización de la Sesión (El "Por Qué")' },
  { numero: '03', titulo: 'Escuela de Movimiento e Isometría' },
  { numero: '04', titulo: 'Periodización y Nomenclatura del Microciclo' },
  { numero: '05', titulo: 'Modelo LTAD — Desarrollo Atlético a Largo Plazo' },
]

function Indice() {
  return (
    <section className="mb-8">
      <Titulo>Índice</Titulo>
      <ol className="mt-3 flex flex-col gap-2">
        {INDICE.map((item) => (
          <li key={item.numero} className="flex items-baseline gap-3 border-b border-dotted border-slate-200 pb-1.5">
            <span className="text-xs font-black text-union-red-600">{item.numero}</span>
            <span className="text-xs text-slate-700">{item.titulo}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function NotaFuentes() {
  return (
    <section>
      <Titulo>Nota metodológica sobre las fuentes citadas</Titulo>
      <P>
        Este documento distingue explícitamente dos niveles de cita, para no mezclar rigor
        verificado con conocimiento general del campo:
      </P>
      <ol className="mt-2 flex flex-col gap-2">
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">1. Citas verificadas — </span>
          extractos textuales de documentos leídos en su totalidad como parte del trabajo de
          esta plataforma (ver <span className="italic">fundamentos_cientificos.md</span> y{' '}
          <span className="italic">respaldo_cientifico_union.md</span>). Se marcan entre
          comillas y con la referencia exacta al archivo fuente.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            2. Marco conceptual de consenso científico —{' '}
          </span>
          el resto de las referencias de este manual (RFD, CEA, LTAD, PHV, adaptaciones
          neurales, etc.) corresponden a literatura canónica y ampliamente establecida en
          ciencias del entrenamiento de fuerza y desarrollo atlético juvenil. Se citan por
          autor, año y publicación como atribución conceptual estándar — <span className="font-semibold">no</span> como
          transcripción verbatim verificada línea por línea en esta sesión.
        </li>
      </ol>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Capítulo 1 — Fundamentos Fisiológicos y Biomecánicos en el Fútbol
// ---------------------------------------------------------------------------

function Cap1Intro() {
  return (
    <section>
      <Titulo>1.1 La fuerza como cualidad madre</Titulo>
      <P>
        Todo gesto decisivo del fútbol —acelerar, frenar, saltar, cambiar de dirección, ganar
        un duelo de contacto— es, en el fondo, un problema de producción de fuerza contra el
        suelo o contra un rival en una ventana de tiempo muy breve. La velocidad de
        desplazamiento es el resultado de aplicar fuerza horizontal al suelo; el salto es el
        resultado de aplicar fuerza vertical antes del despegue; la capacidad de no perder un
        cruce es, biomecánicamente, la capacidad de producir y tolerar fuerza en la
        articulación de la cadera y la rodilla bajo perturbación externa. La fuerza no compite
        con la velocidad, la potencia o la resistencia a la lesión: es el sustrato común de
        todas ellas. Por eso la llamamos la cualidad madre — no porque sea "más importante" en
        abstracto, sino porque el resto de las cualidades físicas del fútbol son, en distintas
        proporciones, expresiones aplicadas de la capacidad de producir fuerza.
      </P>
      <P>
        Esta idea no es nueva ni exclusiva de este club: es el fundamento de todo programa de
        preparación física orientado al rendimiento en deportes de conjunto, y es la razón por
        la que la Metodología UNIÓN ubica al entrenamiento de fuerza — no al trabajo aeróbico
        ni a la repetición de gestos técnicos aislados — como el eje estructural de la
        temporada completa.
      </P>
    </section>
  )
}

function Cap1Rfd() {
  return (
    <section className="mt-5">
      <Titulo>1.2 Tasa de Desarrollo de la Fuerza (RFD)</Titulo>
      <P>
        La Tasa de Desarrollo de la Fuerza (<span className="italic">Rate of Force Development</span>, RFD) es la
        derivada de la fuerza respecto al tiempo: cuánta fuerza es capaz de producir un atleta
        por unidad de tiempo, no cuánta fuerza máxima puede producir eventualmente. Se calcula
        sobre la curva fuerza-tiempo en ventanas específicas — típicamente RFD temprana
        (0-50ms, 0-100ms) y RFD tardía (100-200ms, 100-250ms) — porque ambas ventanas están
        gobernadas por mecanismos fisiológicos distintos y tienen aplicación deportiva
        distinta.
      </P>
      <P>
        La mayoría de las acciones decisivas del fútbol duran menos de 300 milisegundos de
        contacto con el suelo: el apoyo de un sprint a máxima velocidad ronda los 80-100ms, un
        primer paso de aceleración es todavía más breve. En esa ventana de tiempo, un atleta{' '}
        <span className="font-semibold text-union-charcoal">nunca llega a expresar su fuerza máxima absoluta</span> —
        el tiempo disponible no alcanza para reclutar y activar todo el potencial contráctil
        del músculo. Lo que sí determina el resultado del gesto es cuánta fuerza logra producir
        en esos primeros 100-250ms, es decir, su RFD. Esto explica por qué dos jugadores con la
        misma fuerza máxima en una sentadilla pueden tener capacidades de aceleración
        completamente distintas: lo que los separa no es "cuánto pueden levantar", es "qué tan
        rápido pueden empezar a producir fuerza".
      </P>
      <P>
        La RFD temprana (0-100ms) está determinada casi exclusivamente por factores neurales:
        tasa de reclutamiento de unidades motoras, frecuencia de disparo (
        <span className="italic">rate coding</span>) y sincronización entre unidades motoras.
        La RFD tardía (100-250ms) empieza a depender también de la sección transversal del
        músculo y, por lo tanto, de la fuerza máxima construida previamente. Esta es la base
        fisiológica de por qué el entrenamiento de fuerza máxima (que mejora la RFD tardía) y
        el entrenamiento de intención explosiva/isométrico de superación (que mejora la RFD
        temprana) no son intercambiables — son dos estímulos complementarios que atacan
        mecanismos distintos de la misma curva.
      </P>
      <MarcoConceptual>
        Aagaard, P., Simonsen, E.B., Andersen, J.L., Magnusson, P., &amp; Dyhre-Poulsen, P.
        (2002). "Increased rate of force development and neural drive of human skeletal
        muscle following resistance training." Journal of Applied Physiology, 93(4),
        1318-1326 — referencia canónica sobre el origen neural de las mejoras en RFD tras
        entrenamiento de fuerza.
      </MarcoConceptual>
    </section>
  )
}

function Cap1Cea() {
  return (
    <section>
      <Titulo>1.3 Ciclo Estiramiento-Acortamiento (CEA)</Titulo>
      <P>
        El Ciclo Estiramiento-Acortamiento (CEA, o <span className="italic">Stretch-Shortening Cycle</span>, SSC)
        describe la secuencia biomecánica en la que un músculo es estirado activamente (fase
        excéntrica) de forma inmediata antes de acortarse concéntricamente para producir el
        movimiento — el patrón que ocurre en cada zancada de carrera, en cada salto, en cada
        frenada. El CEA produce más fuerza y más rápido que una contracción concéntrica pura,
        por dos mecanismos combinados: el almacenamiento y la posterior liberación de energía
        elástica en el componente elástico en serie (fundamentalmente el tendón), y la
        potenciación refleja del reflejo miotático, que incrementa la activación muscular
        durante la fase concéntrica.
      </P>
      <P>
        La literatura distingue dos tipos de CEA según su duración de acoplamiento (el tiempo
        entre el fin de la fase excéntrica y el inicio de la concéntrica):
      </P>
      <ul className="mt-2 flex flex-col gap-2">
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">CEA rápido </span>
          (tiempo de contacto/acoplamiento &lt; 250ms): el que ocurre en el sprint y en saltos
          reactivos (drop jump). Depende casi por completo de la rigidez músculo-tendinosa (
          <span className="italic">stiffness</span>) y de la capacidad reactiva del sistema
          neuromuscular — es el mecanismo que el Capítulo 3 desarrolla en profundidad bajo el
          nombre de isometría específica de sprint.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">CEA lento </span>
          (acoplamiento &gt; 250ms): el que ocurre, por ejemplo, en la fase de amortiguación de
          un salto con contramovimiento (CMJ). Depende más de la fuerza máxima y de la
          capacidad de producir tensión durante un rango articular mayor.
        </li>
      </ul>
      <MarcoConceptual>
        Komi, P.V. (2000). "Stretch-shortening cycle: a powerful model to study normal and
        fatigued muscle." Journal of Biomechanics, 33(10), 1197-1206; Bosco, C., Komi, P.V.,
        &amp; Ito, A. (1981). "Prestretch potentiation of human skeletal muscle during
        ballistic movement." Acta Physiologica Scandinavica, 111(2), 135-140 — referencias
        fundacionales del modelo de CEA.
      </MarcoConceptual>
    </section>
  )
}

function Cap1Acwr() {
  return (
    <section className="mt-5">
      <Titulo>1.4 ACWR y prevención de lesiones</Titulo>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-union-red-600">
        Cita verificada — fundamentos_cientificos.md, Sección 2
      </p>
      <CitaVerificada fuente='Gabbett, T.J. (2016). "The training-injury prevention paradox: should athletes be training smarter and harder?" British Journal of Sports Medicine.'>
        "The training-injury prevention paradox: should athletes be training smarter and
        harder?"
      </CitaVerificada>
      <P>
        El Índice de Carga Aguda:Crónica (ACWR) compara la carga de entrenamiento de los
        últimos 7 días (aguda) contra el promedio semanal de las últimas 4 semanas (crónica).
        La franja de riesgo mínimo relativo de lesión ya implementada en la plataforma (
        <span className="italic">calcularAcwr</span>,{' '}
        <span className="italic">src/features/workload/calculations.ts</span>) es{' '}
        <span className="font-semibold text-union-charcoal">0.8-1.3</span> ("zona óptima"), con{' '}
        <span className="font-semibold text-union-charcoal">&gt;1.5</span> como zona de peligro
        donde el riesgo de lesión aumenta de forma pronunciada. La lógica de fondo es
        directamente relevante para el entrenamiento de fuerza: subir la carga de gimnasio
        demasiado rápido respecto al promedio reciente del jugador es tan riesgoso como subir
        la carga de campo demasiado rápido — el ACWR no distingue el tipo de estímulo,
        distingue la velocidad del cambio.
      </P>
    </section>
  )
}

function Cap1Neural() {
  return (
    <section>
      <Titulo>1.5 Adaptaciones neurales vs. hipertrofia funcional</Titulo>
      <P>
        El progreso de fuerza en las primeras semanas de un programa de entrenamiento no
        proviene, en su mayor parte, de crecimiento muscular — proviene de eficiencia
        neuromuscular. En las primeras 4-6 semanas, las mejoras de fuerza están dominadas por
        adaptaciones neurales: incremento en el reclutamiento de unidades motoras, mayor
        frecuencia de disparo, sincronización intermuscular, y{' '}
        <span className="font-semibold text-union-charcoal">
          reducción de la co-contracción de los músculos antagonistas
        </span>{' '}
        (menos "freno" involuntario durante el movimiento). Recién a partir de esa ventana
        temporal la hipertrofia funcional (incremento del área de sección transversal del
        músculo, vía síntesis de proteína miofibrilar) empieza a aportar una proporción
        creciente de la ganancia de fuerza.
      </P>
      <P>
        Esta distinción tiene una implicación práctica directa para la Metodología UNIÓN: en
        categorías formativas (Capítulo 5), donde el objetivo central es la técnica del
        movimiento y no la carga, las ganancias de fuerza que efectivamente se observan en las
        primeras semanas de trabajo son casi enteramente neurales — el jugador se vuelve más
        eficiente moviendo su propio peso corporal, no necesariamente más grande. Interpretar
        mal esa curva (esperar hipertrofia donde lo que hay es aprendizaje motor) lleva a
        errores de progresión de carga en categorías donde la prioridad, según el modelo LTAD
        (Capítulo 5), no es la carga externa sino la calidad del patrón.
      </P>
      <MarcoConceptual>
        Sale, D.G. (1988). "Neural adaptation to resistance training." Medicine &amp; Science
        in Sports &amp; Exercise, 20(5 Suppl), S135-145 — referencia canónica sobre el timeline
        neural-antes-que-estructural de la adaptación a la fuerza.
      </MarcoConceptual>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Capítulo 2 — Arquitectura y Organización de la Sesión (El "Por Qué")
// ---------------------------------------------------------------------------

function Cap2General() {
  return (
    <section>
      <Titulo>2.1 Plan GENERAL</Titulo>
      <P>
        El Plan GENERAL es el entrenamiento troncal: el programa que corre para todo el
        plantel de una categoría, sin individualización sesión a sesión. Su función no es
        cubrir cada particularidad de cada jugador — es construir, de forma predecible y
        comunicable, la base fisiológica común que todo el grupo necesita: fuerza máxima,
        tensión mecánica y dominio técnico de los patrones fundamentales de movimiento.
      </P>
      <Subtitulo>Objetivo fisiológico</Subtitulo>
      <P>
        Producir sobrecarga progresiva sobre los grandes patrones motores (triple extensión de
        cadera-rodilla-tobillo, empuje horizontal y vertical, tracción horizontal y vertical,
        antirotación de tronco) para generar tensión mecánica — el estímulo mecánico primario
        que dispara tanto adaptación neural (Sección 1.5) como, con el tiempo, hipertrofia
        funcional.
      </P>
      <Subtitulo>Selección de ejercicios</Subtitulo>
      <P>
        El Plan GENERAL prioriza ejercicios{' '}
        <span className="font-semibold text-union-charcoal">multiarticulares</span> — sentadilla
        y sus variantes, peso muerto y sus variantes, press horizontal y vertical, tracción
        horizontal y vertical — y{' '}
        <span className="font-semibold text-union-charcoal">derivados de levantamiento</span>{' '}
        (despegues, tirones, variantes de arranque/envión adaptadas) para las categorías donde
        la técnica ya está consolidada. Los ejercicios multiarticulares tienen una ventaja
        estructural sobre los analíticos/monoarticulares para el Plan GENERAL: permiten cargar
        simultáneamente múltiples grupos musculares y patrones motores con una sola progresión
        de carga, lo cual es metodológicamente coherente con un modelo de Periodización Lineal
        aplicado a un grupo grande.
      </P>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-union-red-600">
        Cita verificada — respaldo_cientifico_union.md, Sección 1
      </p>
      <CitaVerificada fuente='Robles, J.I. — "Periodización del Entrenamiento de Fuerza: Lineal vs. Ondulante"'>
        "Claridad y simplicidad. Ideal para quienes se están iniciando en el entrenamiento
        estructurado o para grupos grandes donde la individualización es limitada."
      </CitaVerificada>
    </section>
  )
}

function Cap2Vitamina() {
  return (
    <section>
      <Titulo>2.2 Ejercicios VITAMINA</Titulo>
      <P>
        Si el Plan GENERAL es la base común, los Ejercicios VITAMINA son la corrección de lo
        que esa base común, por definición, no puede resolver: las asimetrías y compensaciones
        individuales de cada jugador.
      </P>
      <Subtitulo>Justificación biomecánica</Subtitulo>
      <P>
        Ningún cuerpo es simétrico, y el fútbol —un deporte unilateral por naturaleza, donde
        una pierna golpea y la otra pisa, donde el jugador gira sistemáticamente hacia un mismo
        lado dominante— tiende a acentuar esa asimetría con los años de práctica. Dos tipos de
        desbalance son especialmente relevantes para la prevención de lesiones en fútbol:
      </P>
      <ul className="mt-2 flex flex-col gap-2">
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">Asimetría entre miembros </span>
          (déficit de fuerza de una pierna respecto a la otra): un desbalance interlimb por
          encima de umbrales del 10-15% se asocia consistentemente en la literatura con mayor
          riesgo de lesión, particularmente de rodilla y tobillo.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">Desbalance agonista-antagonista </span>
          (ratio isquiotibiales:cuádriceps, H:Q): un ratio H:Q excéntrico/concéntrico deprimido
          es uno de los predictores de lesión de isquiotibiales mejor documentados en fútbol
          profesional.
        </li>
      </ul>
      <MarcoConceptual>
        Croisier, J.L., Ganteaume, S., Binet, J., Genty, M., &amp; Ferret, J.M. (2008).
        "Strength imbalances and prevention of hamstring injury in professional soccer
        players: a prospective study." American Journal of Sports Medicine, 36(8), 1469-1475 —
        estudio prospectivo que vincula el desbalance de fuerza no corregido con mayor
        incidencia de lesión de isquiotibiales, y la corrección del desbalance con reducción
        del riesgo.
      </MarcoConceptual>
      <Subtitulo>Aplicación práctica</Subtitulo>
      <P>
        El Plan GENERAL, al estar diseñado para todo el grupo, no puede (ni debe)
        reprogramarse cada semana en función de la asimetría puntual de un jugador — eso
        rompería la simplicidad que lo hace viable para un plantel completo. Los Ejercicios
        VITAMINA resuelven esa tensión: son bloques cortos, de bajo requerimiento de espacio y
        carga, que se agregan <span className="font-semibold text-union-charcoal">encima</span>{' '}
        del Plan GENERAL para el jugador o subgrupo que lo necesita — activación unilateral,
        trabajo excéntrico de isquiotibiales, control motor de cadera, propiocepción de
        tobillo — sin desarmar la progresión general del resto del plantel.
      </P>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Capítulo 3 — Escuela de Movimiento e Isometría
// ---------------------------------------------------------------------------

function Cap3Intro() {
  return (
    <section>
      <Titulo>03. Escuela de Movimiento e Isometría</Titulo>
      <P>
        La isometría es la acción muscular en la que se produce fuerza sin que exista cambio
        apreciable en la longitud del músculo ni desplazamiento articular visible. Durante
        décadas se la relegó a un rol secundario — testeo diagnóstico (Isometric Mid-Thigh
        Pull) o rehabilitación post-lesión — pero el marco conceptual desarrollado por{' '}
        <span className="font-semibold text-union-charcoal">Alex Natera</span> (biomecánico
        aplicado, con trabajo documentado en ALTIS y en preparación física de atletismo de alto
        rendimiento) reformuló su lugar: la isometría no es un complemento del entrenamiento de
        fuerza, es un método de entrenamiento específico de las demandas reales del fútbol,
        porque correr, frenar, acelerar y cambiar de dirección son, en su instante decisivo,
        una sucesión de apoyos isométricos — momentos de contacto donde el sistema
        neuromuscular debe producir o absorber fuerza antes de que el movimiento articular sea
        siquiera visible.
      </P>
      <NotaTransparencia>
        Nota de transparencia: el marco de Natera se desarrolla y difunde principalmente en
        contextos de formación práctica de alto rendimiento (clínicas, conferencias, material
        técnico de ALTIS), no en journals de revisión por pares con DOI verificable. Se lo cita
        en este manual por su relevancia práctica y su adopción extendida en preparación física
        de fútbol de élite, no como literatura peer-reviewed verificada.
      </NotaTransparencia>
    </section>
  )
}

function Cap3Yielding() {
  return (
    <section className="mt-5">
      <Titulo>3.1 Yielding Isometrics — isometría de sostén/absorción</Titulo>
      <P>
        En la isometría <span className="font-semibold text-union-charcoal">Yielding</span>, el
        atleta resiste una carga externa (o su propio peso) sin ceder, absorbiendo fuerza
        durante un tiempo determinado sin moverse. Biomecánicamente, es una contracción
        isométrica sostenida bajo una fuerza externa que tiende constantemente a vencer la
        posición — el músculo trabaja para{' '}
        <span className="font-semibold text-union-charcoal">no perder</span> la articulación
        frente a esa fuerza.
      </P>
      <ul className="mt-2 flex flex-col gap-2">
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">Objetivo neuromuscular: </span>
          tolerancia a la fuerza excéntrica, capacidad de absorción, control postural bajo
          carga sostenida.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">Aplicación en el juego: </span>
          aterrizajes, frenadas, cualquier apoyo de deceleración donde el cuerpo debe absorber
          energía cinética sin colapsar la articulación.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">Puente post-excéntrico: </span>
          la isometría Yielding actúa como el punto intermedio entre la fase excéntrica de una
          deceleración y la posterior reproducción de fuerza (por ejemplo, el cambio de
          dirección inmediato después de frenar) — entrenar la capacidad de{' '}
          <span className="font-semibold text-union-charcoal">sostener</span> la posición de
          máxima carga excéntrica, antes de revertir el movimiento, es directamente relevante
          para la prevención de lesiones de rodilla e isquiotibiales en las acciones de frenado
          brusco.
        </li>
      </ul>
    </section>
  )
}

function Cap3Overcoming() {
  return (
    <section>
      <Titulo>3.2 Overcoming Isometrics — isometría de empuje/superación</Titulo>
      <P>
        En la isometría <span className="font-semibold text-union-charcoal">Overcoming</span>,
        el atleta empuja con máxima intención voluntaria contra una resistencia inamovible (un
        rack, una pared, una banda anclada a un punto fijo), sin lograr — ni buscar —
        desplazamiento articular. Biomecánicamente es lo opuesto al caso Yielding: en vez de
        resistir una fuerza externa que amenaza con vencerlo, el atleta genera su propia fuerza
        máxima contra un objeto que no cede.
      </P>
      <ul className="mt-2 flex flex-col gap-2">
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">Objetivo neuromuscular: </span>
          producción de fuerza máxima voluntaria y, sobre todo, Tasa de Desarrollo de la
          Fuerza (Sección 1.2) — al no existir componente de movimiento ni fatiga técnica del
          gesto completo, permite entrenar cargas de intención máxima de forma repetida sin el
          desgaste articular de un levantamiento dinámico equivalente.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">Aplicación en el juego: </span>
          el primer paso de la aceleración (superar la inercia del cuerpo mediante producción
          de fuerza horizontal máxima en un tiempo brevísimo), el empuje en duelos de contacto,
          la salida explosiva desde parado.
        </li>
      </ul>
    </section>
  )
}

function Cap3Especifica() {
  return (
    <section className="mt-5">
      <Titulo>3.3 Isometría específica de sprint y cambio de dirección</Titulo>
      <P>
        Ni Yielding ni Overcoming explican por sí solas la capacidad de sprintar a máxima
        velocidad: esa capacidad depende, como se desarrolló en la Sección 1.3, de la rigidez
        músculo-tendinosa (<span className="italic">stiffness</span>) en un CEA rápido (&lt;
        250ms de acoplamiento) — no de la fuerza máxima ni de la RFD pura. La isometría
        específica de carrera (<span className="italic">Run Specific Isometrics</span>) entrena
        esta rigidez reactiva del complejo tobillo-rodilla en tiempos de contacto compatibles
        con el sprint real (los 80-100ms mencionados en la Sección 1.2), y es la que se
        traduce en mejoras del Índice de Fuerza Reactiva (RSI).
      </P>
      <P>
        El cambio de dirección combina ambos regímenes en ángulos específicos: exige producir
        fuerza isométrica en vectores laterales (plano frontal y transverso), no lineales, en
        ángulos puntuales de tobillo y cadera — el trabajo isométrico en ángulos de corte
        prepara al tejido y al sistema nervioso para esa demanda rotacional específica que ni
        el trabajo lineal de Yielding ni el de Overcoming, aplicados de forma genérica, cubren
        por sí solos.
      </P>
      <NotaTransparencia>
        Ver <span className="not-italic font-semibold">Escuela de Movimiento (Isometría)</span>{' '}
        (<span className="not-italic">/metodologia/isometria</span>) para el desarrollo
        completo de esta clasificación, incluida la tabla de aplicación práctica por patrón de
        movimiento.
      </NotaTransparencia>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Capítulo 4 — Periodización y Nomenclatura del Microciclo
// ---------------------------------------------------------------------------

function Cap4Intro() {
  return (
    <section>
      <Titulo>04. Periodización y Nomenclatura del Microciclo</Titulo>
      <P>
        El Capítulo 1 estableció que la fuerza es la cualidad madre y que distintas ventanas de
        tiempo de la curva fuerza-tiempo dependen de mecanismos fisiológicos distintos. La
        consecuencia directa de ambas ideas es que{' '}
        <span className="font-semibold text-union-charcoal">
          no todos los días de la semana compiten por el mismo estímulo
        </span>
        : el microciclo se organiza en función de la distancia al próximo partido (Match Day,
        MD), y cada día tiene un objetivo fisiológico predominante y deliberadamente distinto.
      </P>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-union-red-600">
        Respaldo teórico — respaldo_cientifico_union.md, Sección 2
      </p>
      <CitaVerificada fuente='Robles, J.I. — "Periodización del Entrenamiento de Fuerza: Lineal vs. Ondulante"'>
        "Demandas competitivas concurrentes: deportes de equipo, calendario denso, múltiples
        partidos por semana."
      </CitaVerificada>
      <P>
        Es, textualmente, el caso de uso que la fuente identifica para justificar por qué no
        alcanza con una progresión lineal simple durante la fase de Competencia — hace falta
        que la variable de entrenamiento "ondule" en función de un ancla externa, que en
        nuestro caso es el partido.
      </P>
    </section>
  )
}

interface DiaMicrociclo {
  md: string
  titulo: string
  texto: string
}

const MICROCICLO: DiaMicrociclo[] = [
  {
    md: 'MD-4',
    titulo: 'Tensión / Fuerza Máxima',
    texto:
      'El día más alejado del próximo partido y, por lo tanto, el de mayor margen de recuperación disponible antes de competir. Ventana para el estímulo de mayor intensidad relativa y mayor tensión mecánica de la semana: cargas altas (%RM) sobre los patrones del Plan GENERAL, con foco explícito en fuerza máxima e isometría Overcoming a intensidad máxima.',
  },
  {
    md: 'MD-3',
    titulo: 'Potencia',
    texto:
      'Transición desde la tensión pesada de MD-4 hacia la expresión de esa fuerza a mayor velocidad. El objetivo deja de ser "cuánta fuerza" para pasar a ser "cuánta fuerza en cuánto tiempo" — trabajo de RFD, movimientos balísticos y derivados de levantamiento a intención de velocidad máxima, volumen moderado.',
  },
  {
    md: 'MD-2',
    titulo: 'Reactividad / Velocidad',
    texto:
      'Cargas bajas, ejecución a máxima velocidad. Día natural para la isometría específica de sprint y de cambio de dirección: volumen bajo, foco en rigidez reactiva y tiempos de contacto cortos, nunca en fatiga acumulada.',
  },
  {
    md: 'MD-1',
    titulo: 'Activación',
    texto:
      'Carga mínima. El único objetivo fisiológico legítimo de este día es la activación neuromuscular pre-partido — isometrías breves de bajo umbral con función de potenciación post-activación, nunca trabajo de fuerza máxima ni volumen que comprometa la disponibilidad para el partido del día siguiente.',
  },
  {
    md: 'MD',
    titulo: 'Día de Partido',
    texto:
      'Sin trabajo de gimnasio. El estímulo de fuerza de la semana ya está aplicado; este día es exclusivamente de expresión competitiva.',
  },
  {
    md: 'MD+1 / MD+2',
    titulo: 'Recuperación / Vitamina',
    texto:
      'El día (o los dos días, según la densidad del calendario) posterior al partido tiene función exclusivamente regenerativa: carga interna muy baja, movilidad, isometría Yielding de bajo umbral orientada a zona media y prevención de isquiotibiales/aductores — el terreno natural de los Ejercicios VITAMINA, aplicados aquí como recuperación activa individualizada según el desgaste de cada jugador en el partido.',
  },
]

function GrillaMicrociclo({ items }: { items: DiaMicrociclo[] }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {items.map((dia) => (
        <div key={dia.md} className="rounded-lg border border-slate-200 p-3 break-inside-avoid">
          <span className="inline-block rounded bg-union-charcoal px-1.5 py-0.5 text-[10px] font-bold text-white">
            {dia.md}
          </span>
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-union-red-600">{dia.titulo}</p>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-600">{dia.texto}</p>
        </div>
      ))}
    </div>
  )
}

function NotaImplementacion() {
  return (
    <NotaTransparencia>
      <span className="not-italic font-semibold text-union-charcoal">Nota de implementación: </span>
      la nomenclatura de microciclo actualmente soportada por la plataforma (
      <span className="not-italic">MatchDayTag</span>,{' '}
      <span className="not-italic">src/types/sessionPlan.ts</span>) contempla MD-4 a MD+1 — un
      único día compensatorio. La distinción MD+1/MD+2 de este apartado es un desarrollo
      teórico para semanas con calendario competitivo poco denso (un solo partido, con margen
      para dos días de transición antes de retomar tensión); su implementación en el sistema
      como tag distinto queda pendiente de una decisión de producto explícita, no debe
      asumirse ya disponible en el planificador.
    </NotaTransparencia>
  )
}

// ---------------------------------------------------------------------------
// Capítulo 5 — Modelo LTAD
// ---------------------------------------------------------------------------

function Cap5Intro() {
  return (
    <section>
      <Titulo>05. Modelo LTAD — Desarrollo Atlético a Largo Plazo</Titulo>
      <P>
        El modelo de Desarrollo Atlético a Largo Plazo (<span className="italic">Long-Term Athlete Development</span>,
        LTAD) organiza el entrenamiento de un deportista no como una escalera de intensidad
        creciente sin más, sino como una secuencia de fases sensibles: ventanas del desarrollo
        biológico donde el cuerpo responde de forma especialmente efectiva a un tipo
        específico de estímulo, y donde forzar un estímulo prematuro (carga externa alta en un
        cuerpo que todavía no consolidó el patrón motor) o tardío (seguir entrenando sólo
        técnica cuando el cuerpo ya está listo para tensión mecánica real) desperdicia la
        ventana o, peor, aumenta el riesgo de lesión.
      </P>
      <MarcoConceptual>
        Balyi, I., Way, R., &amp; Higgs, C. (2013). "Long-Term Athlete Development." Human
        Kinetics — marco original del modelo LTAD; Lloyd, R.S., &amp; Oliver, J.L. (2012). "The
        Youth Physical Development Model: A New Approach to Long-Term Athletic Development."
        Strength and Conditioning Journal, 34(3), 61-72 — adaptación del modelo LTAD
        específicamente a variables de fuerza/potencia y ventanas de entrenabilidad en jóvenes;
        Mirwald, R.L., Baxter-Jones, A.D., Bailey, D.A., &amp; Beunen, G.P. (2002). "An
        assessment of maturity from anthropometric measurements." Medicine &amp; Science in
        Sports &amp; Exercise, 34(4), 689-694 — ecuación de "maturity offset" usada para
        estimar la proximidad al Pico de Velocidad de Crecimiento (PHV), la referencia estándar
        para identificar la fase sensible de mayor riesgo de sobrecarga en categorías
        formativas.
      </MarcoConceptual>
    </section>
  )
}

interface CategoriaLtadProps {
  numero: string
  titulo: string
  edad: string
  faseSensible: ReactNode
  objetivo: ReactNode
  vitamina?: ReactNode
}

const LTAD_101: CategoriaLtadProps = {
  numero: '5.1',
  titulo: '10ma y 9na División — Alfabetización motora y técnica',
  edad: 'Infancia tardía / pre-púber, previa a la ventana de PHV.',
  faseSensible: (
    <>
      Desarrollo de las ABCs del movimiento (agilidad, balance, coordinación, velocidad) y de
      los patrones motores fundamentales (sentadilla, bisagra de cadera, empuje, tracción,
      rotación) — la ventana donde el sistema nervioso central es más receptivo a la
      adquisición de nuevos patrones de coordinación, y donde ese aprendizaje es más eficiente
      que en cualquier etapa posterior.
    </>
  ),
  objetivo: (
    <>
      Ningún objetivo de carga externa. El Plan GENERAL en estas categorías es, en rigor, un
      plan de aprendizaje motor: dominio técnico del propio peso corporal, sin resistencia
      añadida más allá de implementos livianos ocasionales con fines exclusivamente técnicos.
      Las ganancias de "fuerza" observables en esta etapa son, según lo desarrollado en la
      Sección 1.5, casi enteramente neurales — coordinación, no hipertrofia.
    </>
  ),
  vitamina: (
    <>
      Prevención básica — control postural, activación, educación temprana del gesto de
      aterrizaje. Nunca sobrecarga, ni siquiera individualizada.
    </>
  ),
}

const LTAD_87: CategoriaLtadProps = {
  numero: '5.2',
  titulo: '8va y 7ma División — Construcción estructural y hormonal',
  edad:
    'Ventana cercana al Pico de Velocidad de Crecimiento (PHV) — mayor velocidad de crecimiento longitudinal de huesos largos, previa a la consolidación de fuerza y coordinación sobre la nueva palanca corporal.',
  faseSensible: (
    <>
      Dos consideraciones simultáneas: <span className="font-semibold text-union-charcoal">(1) Ventana estructural y hormonal favorable</span> —
      el entorno endócrino de esta etapa (inicio del incremento de testosterona y hormona de
      crecimiento en varones) empieza a favorecer la respuesta hipertrófica de una manera que
      las categorías previas no tenían disponible: es la primera ventana donde la hipertrofia
      funcional (Sección 1.5) empieza a ser una adaptación relevante.{' '}
      <span className="font-semibold text-union-charcoal">(2) Precaución durante el pico de crecimiento</span> — el
      tejido óseo crece más rápido que la capacidad del tejido blando (tendón, ligamento) de
      adaptarse a esa nueva longitud de palanca: período de mayor fragilidad relativa frente a
      sobrecarga axial alta. La progresión de carga externa debe ser conservadora y
      supervisada durante esta ventana específica, no bloqueada por completo.
    </>
  ),
  objetivo: (
    <>
      Introducción progresiva y supervisada de carga externa — prioridad absoluta a la técnica
      sobre el kilaje — con volumen moderado orientado a hipertrofia funcional: construir la
      estructura (tendón, músculo, densidad ósea) que va a sostener las cargas de fuerza
      máxima de las categorías siguientes.
    </>
  ),
}

const LTAD_65: CategoriaLtadProps = {
  numero: '5.3',
  titulo: '6ta y 5ta División — Fuerza máxima y RFD',
  edad:
    'Post-PHV, con la palanca corporal ya consolidada y el tejido blando adaptado a la nueva longitud ósea.',
  faseSensible: (
    <>
      Ventana de máxima entrenabilidad de la fuerza máxima absoluta — el sistema neuromuscular
      ya tolera cargas altas relativas (%RM) con seguridad técnica, y la respuesta hormonal e
      hipertrófica de la categoría anterior ya construyó la base estructural necesaria para
      soportarlas.
    </>
  ),
  objetivo: (
    <>
      Fuerza máxima (cargas altas, patrones ya consolidados técnicamente) como prioridad
      central, con introducción plena de la Tasa de Desarrollo de la Fuerza (Sección 1.2) y de
      la isometría avanzada de Natera (Capítulo 3) — Overcoming para aceleración, Yielding
      para frenado, isometría específica para sprint y cambio de dirección. Es la primera
      categoría donde el microciclo por Día de Partido (Capítulo 4) se aplica en su forma
      completa, con periodización ondulante semanal.
    </>
  ),
}

const LTAD_4R: CategoriaLtadProps = {
  numero: '5.4',
  titulo: '4ta División y Reserva — Transferencia, velocidad y potencia específica',
  edad: 'Adultez temprana, madurez física completa.',
  faseSensible: (
    <>
      Ya no hay una ventana de desarrollo biológico que explotar — el objetivo deja de ser
      "construir la capacidad" para pasar a ser "transferir la capacidad ya construida al
      rendimiento competitivo específico". Es la categoría donde la periodización se vuelve
      más individual y más fina, porque el margen de mejora general (el que domina en
      categorías formativas) ya se agotó, y lo que queda es optimización de detalle.
    </>
  ),
  objetivo: (
    <>
      Transferencia directa al gesto deportivo — velocidad y potencia como expresión aplicada
      de la fuerza y la RFD ya construidas en las categorías previas, con periodización de
      microciclo por MD (Capítulo 4) en su versión más precisa, y Ejercicios VITAMINA
      completamente individualizados por jugador según su propio perfil de carga externa
      registrado por GPS (volumen de sprints, aceleraciones/desaceleraciones, distancia a alta
      velocidad) — la etapa donde la prevención deja de ser genérica por categoría y pasa a
      ser, literalmente, un programa por jugador.
    </>
  ),
}

function CategoriaLtad({ numero, titulo, edad, faseSensible, objetivo, vitamina }: CategoriaLtadProps) {
  return (
    <section>
      <Titulo>
        {numero} {titulo}
      </Titulo>
      <Subtitulo>Edad biológica aproximada</Subtitulo>
      <P>{edad}</P>
      <Subtitulo>Fase sensible</Subtitulo>
      <P>{faseSensible}</P>
      <Subtitulo>Objetivo metodológico</Subtitulo>
      <P>{objetivo}</P>
      {vitamina && (
        <>
          <Subtitulo>Ejercicios VITAMINA</Subtitulo>
          <P>{vitamina}</P>
        </>
      )}
    </section>
  )
}

function Cierre() {
  return (
    <section className="mt-6 border-t border-slate-200 pt-4">
      <Titulo>Cierre</Titulo>
      <P>
        Este manual establece la Metodología UNIÓN como el estándar metodológico único del
        Área de Fuerza del club, aplicable de forma consistente desde la 10ma división hasta
        el plantel de Reserva y Primera. No es un documento cerrado: se actualiza en la medida
        en que la evidencia científica del campo avanza y en la medida en que la propia
        experiencia del club — la mejor fuente de retroalimentación que existe sobre si una
        metodología funciona — lo exige.
      </P>
    </section>
  )
}

function Pie() {
  return (
    <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-3">
      <p className="text-[10px] text-slate-400">
        Club Atlético Unión de Santa Fe — {NOMBRE_AREA}. Documento metodológico interno.
      </p>
      <p className="text-[10px] font-semibold tracking-wide text-union-charcoal">{FIRMA_AUTOR}</p>
    </div>
  )
}
