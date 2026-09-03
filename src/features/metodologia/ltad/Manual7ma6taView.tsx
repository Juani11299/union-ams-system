import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NOMBRE_AREA, FIRMA_AUTOR } from '@/constants/branding'

/**
 * Manual Metodológico — Fuerza y Tensión (7ma y 6ta división). Versión
 * maquetada 1-a-1 sobre el contenido académico redactado en
 * `docs/Manual_7ma_6ta.md` (no es un resumen — es ese texto distribuido en
 * hojas A4). Documento digital exportable a PDF vía `window.print()`,
 * reutilizando estrictamente la arquitectura de impresión A4 de
 * `ManualFuerzaView.tsx`.
 */
export function Manual7ma6taView() {
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
          <span className="text-sm font-medium">📗 Fuerza y Tensión — 7ma y 6ta División</span>
        </div>
        <button
          type="button"
          onClick={handleDescargarPdf}
          className="rounded-lg bg-union-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-union-red-700"
        >
          🖨️ Exportar a PDF
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

        <Hoja>
          <Encabezado eyebrow="01 — Cualidades de la Edad (16-17 años)" />
          <Titulo>1.1 Post-PHV: la ventana de máxima adaptación disponible</Titulo>
          <P>
            Si el tomo anterior describió el PHV como el punto de inflexión de mayor riesgo
            estructural, este tomo describe lo que ocurre después: la ventana de mayor capacidad
            de adaptación al entrenamiento de fuerza de toda la etapa infanto-juvenil. El pico de
            incremento de la fuerza ocurre entre 0,5 y 1 año después del PHV, coincidiendo con el
            pico de velocidad del peso corporal (Añon, 2026, citando a Beunen &amp; Malina,
            2008) — y para la mayoría del plantel de 7ma y 6ta división, ese pico de ganancia de
            fuerza está ocurriendo ahora, o ya ocurrió recientemente. El modelo YPD de Lloyd y
            Oliver (2012) lo describe con precisión: una vez alcanzada la pubertad, las
            adaptaciones ya no son solo neurales, también se atribuyen a cambios morfológicos
            estimulados por el aumento de andrógenos circulantes que interactúan con los
            estímulos del entrenamiento (Añon, 2026). Es la primera etapa donde el estímulo
            hormonal y el neural trabajan a favor del entrenamiento de fuerza de forma simultánea
            y con la magnitud necesaria para producir adaptación estructural real.
          </P>
          <Titulo>1.2 El tejido ya cambió: stiffness, tendón y arquitectura muscular</Titulo>
          <P>
            La tabla de adaptaciones evolutivas del ciclo estiramiento-acortamiento (CEA) que
            documenta Añon (2026, citando a Rador et al., 2018) —ya introducida en el tomo
            anterior como un proceso de cambio activo— describe en esta etapa un tejido que
            completó buena parte de esa transición: mayor masa muscular, mayor ángulo de
            penación, mayor longitud del fascículo muscular, mayor área de sección transversal y
            mayor stiffness del tendón. El stiffness miotendinoso es la capacidad del tejido
            muscular y tendinoso para resistir la deformación bajo carga, y su incremento
            contribuye a mayor estabilidad articular y a una respuesta más rápida y eficiente
            durante el CEA (Añon, 2026). El incremento del stiffness tendinoso mejora la Tasa de
            Desarrollo de la Fuerza (RFD) y el reflejo de estiramiento; el incremento del ángulo
            de penación mejora tanto la producción de fuerza como el stiffness general y la
            acumulación de energía elástica (Añon, 2026, citando a Rador et al., 2018).
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="01 — Cualidades de la Edad (16-17 años)" />
          <P>
            En términos prácticos, el jugador de 16-17 años ya cuenta con la arquitectura
            muscular y tendinosa necesaria para tolerar y beneficiarse de estímulos de fuerza
            máxima e isometría de alta intensidad, algo que en las dos etapas anteriores hubiera
            sido fisiológicamente prematuro o directamente riesgoso.
          </P>
          <Titulo>1.3 Testosterona y masa muscular: la ventana hormonal en su punto máximo</Titulo>
          <P>
            Los niveles de testosterona muestran un incremento marcado en torno al PHV y se
            mantienen elevados en los años siguientes, correlacionando con diferencias de fuerza
            cada vez mayores entre varones y mujeres de la misma edad relativa al PHV (Añon,
            2026, citando a Jones &amp; Round, 2008). Es clave, sin embargo, un hallazgo que Añon
            (2026) desarrolla a partir del estudio longitudinal de Lefevre et al. (1990): los
            maduradores tempranos presentan ventajas de rendimiento marcadas durante la
            adolescencia, pero esas diferencias se atenúan o se revierten hacia los 30 años, y
            los mejores resultados adultos los obtienen quienes tuvieron buen desempeño
            adolescente y maduraron tarde, mientras que los peores resultados adultos
            corresponden a quienes maduraron temprano con bajo desempeño adolescente. La
            ganancia de fuerza acelerada de esta etapa no debe usarse para descartar jugadores de
            maduración más tardía que todavía no expresaron su potencial.
          </P>
          <Titulo>1.4 Perfil neuromuscular: RFD como cualidad entrenable con sentido fisiológico pleno</Titulo>
          <P>
            A diferencia de las etapas anteriores, donde el trabajo de RFD tenía valor
            introductorio, en 16-17 años la RFD se convierte en una cualidad directamente
            entrenable con pleno sentido fisiológico: el reclutamiento de unidades motoras, la
            frecuencia de disparo de las motoneuronas, su sincronización, el stiffness tendinoso
            y el ángulo de penación convergen exactamente en esta ventana en los mecanismos que
            determinan cuánta fuerza es capaz de producir un atleta en los primeros 100-250
            milisegundos de una acción (Manual Metodológico Oficial, Sección 1.2).
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="02 — Objetivos del Área de Fuerza" />
          <Titulo>2.1 Objetivos primarios</Titulo>
          <Subtitulo>a) Fuerza máxima</Subtitulo>
          <P>
            Con el tejido ya preparado y el estímulo hormonal en su ventana de mayor
            disponibilidad, la fuerza máxima —cargas altas sobre patrones ya consolidados
            técnicamente— pasa a ser objetivo central, no introductorio. Esta es la etapa donde,
            según el Manual Metodológico Oficial (Sección 5.3), "se construyen los cimientos
            definitivos del jugador profesional".
          </P>
          <Subtitulo>b) Tensión mecánica</Subtitulo>
          <P>
            El objetivo de fuerza máxima no se persigue por volumen de repeticiones, sino por
            tensión mecánica sostenida bajo carga alta: series de baja a moderada repetición,
            intención máxima de producción de fuerza, y control estricto de la técnica bajo
            fatiga.
          </P>
          <Subtitulo>c) Tasa de Desarrollo de la Fuerza (RFD)</Subtitulo>
          <P>
            Introducción sistemática del entrenamiento de RFD como cualidad diferenciada de la
            fuerza máxima, dado que esta es la primera etapa donde el sustrato neuromuscular para
            entrenarla con sentido pleno está disponible (Sección 1.4).
          </P>
          <Titulo>2.2 Objetivos secundarios</Titulo>
          <Lista
            items={[
              'Isometría avanzada (Overcoming e Yielding pesado) como herramienta complementaria de fuerza máxima y RFD, sin el desgaste articular de un levantamiento dinámico equivalente.',
              'Consolidación definitiva de los patrones fundamentales bajo carga real, cerrando el proceso iniciado en 10ma y Pre 9na.',
              'Prevención específica de lesiones de sobrecarga (isquiotibiales, rodilla) propias de esta ventana de alta intensidad.',
              'Preparación de la transición a 4ta y Reserva, donde el objetivo pasa de construir capacidad a transferirla al rendimiento competitivo específico.',
            ]}
          />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="03 — Metodología de Aprendizaje" />
          <Titulo>3.1 De la exploración a la especialización estructurada</Titulo>
          <P>
            El modelo YPD ubica a esta franja en el nivel de "muy alta estructura" de
            entrenamiento (Añon, 2026) — el opuesto de la baja estructura y alto componente
            lúdico que organizaba la etapa de 10ma y Pre 9na. Esto no significa abandonar la
            diversificación motriz como principio general, sino que el entrenamiento de fuerza
            en sí mismo adopta un formato de periodización explícita, con objetivos de carga,
            volumen e intensidad definidos por microciclo, alineado con la nomenclatura de
            microciclo por Día de Partido de la Sección 4 del Manual Metodológico Oficial.
          </P>
          <Titulo>3.2 Periodización ondulante semanal</Titulo>
          <P>
            7ma y 6ta división es la primera categoría donde el microciclo por Día de Partido se
            aplica en su forma completa (Manual Metodológico Oficial, Sección 5.3): distintos
            días de la semana atacan distintas ventanas de la curva fuerza-tiempo (RFD temprana,
            RFD tardía, fuerza máxima), en lugar de repetir el mismo estímulo genérico en todas
            las sesiones.
          </P>
          <Titulo>3.3 Supervisión técnica bajo fatiga</Titulo>
          <P>
            El criterio de supervisión constante no desaparece — se redefine. Ya no se trata
            principalmente de corregir un patrón que el jugador todavía no domina, sino de
            sostener la calidad técnica de un patrón ya dominado bajo condiciones de carga alta y
            fatiga acumulada, que es exactamente el contexto donde la técnica tiende a
            deteriorarse y donde ocurre la mayor parte del riesgo de lesión. La regla operativa
            de esta etapa: la carga se reduce antes de que la técnica se deteriore, nunca al
            revés.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Desarrollo de la Fuerza: Cómo Atacarla" />
          <Titulo>4.1 Fuerza máxima como prioridad central</Titulo>
          <P>
            Con la base técnica consolidada en las dos etapas anteriores y el tejido ya
            preparado, el trabajo de fuerza máxima se estructura sobre los mismos cinco patrones
            fundamentales trabajados desde 10ma división, ahora bajo cargas de intensidad
            relativa alta. No se introducen patrones nuevos en esta etapa — se intensifica la
            carga sobre patrones ya dominados, con el principio de "técnica antes que carga"
            ahora aplicado como condición de entrada a cada incremento de carga.
          </P>
          <Titulo>4.2 Tasa de Desarrollo de la Fuerza (RFD): introducción sistemática</Titulo>
          <P>
            La RFD se entrena en ventanas específicas de la curva fuerza-tiempo —RFD temprana
            (0-50ms, 0-100ms) y RFD tardía (100-200ms, 100-250ms)— porque ambas están gobernadas
            por mecanismos fisiológicos distintos (Manual Metodológico Oficial, Sección 1.2). 7ma
            y 6ta división es la primera etapa donde entrenar específicamente estas ventanas
            —mediante trabajo de intención máxima, isometría Overcoming y pliometría de mayor
            intensidad— tiene pleno sentido fisiológico, porque el sistema neuromuscular ya
            cuenta con el reclutamiento de unidades motoras, la sincronización y el stiffness
            tendinoso necesarios para expresarla (Añon, 2026, citando a Rador et al., 2018).
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Desarrollo de la Fuerza: Cómo Atacarla" />
          <Titulo>4.3 Isometría avanzada: Overcoming e Yielding pesado</Titulo>
          <P>
            Siguiendo la taxonomía de la Sección 3 del Manual Metodológico Oficial, esta etapa
            introduce de lleno la isometría Overcoming —el atleta empuja con máxima intención
            voluntaria contra una resistencia inamovible, sin buscar desplazamiento articular—
            con el objetivo explícito de producción de fuerza máxima voluntaria y, sobre todo,
            RFD, permitiendo repetir cargas de intención máxima sin el desgaste articular de un
            levantamiento dinámico equivalente. Su aplicación directa al juego es el primer paso
            de la aceleración y el empuje en duelos de contacto.
          </P>
          <P>
            En paralelo, la isometría Yielding —consolidada desde la etapa anterior con
            propósito educativo— se intensifica hacia cargas de sostén reales, como puente entre
            la fase excéntrica de una deceleración y la posterior reproducción de fuerza, con
            aplicación directa a la prevención de lesiones de rodilla e isquiotibiales en
            frenados bruscos. Complementariamente, la isometría específica de sprint y cambio de
            dirección se incorpora por primera vez con pleno sentido fisiológico, dado que exige
            la rigidez músculo-tendinosa desarrollada en la Sección 1.2, que en las etapas
            pre-PHV todavía no estaba disponible en la magnitud necesaria.
          </P>
          <Titulo>4.4 Progresión de cargas</Titulo>
          <P>
            La progresión se organiza en función de la periodización ondulante semanal, no de un
            incremento lineal simple. El criterio de entrada a cada bloque de mayor intensidad
            sigue siendo técnico, pero a diferencia de las etapas anteriores —donde la
            restricción principal era estructural—, en esta etapa la restricción principal es de
            dosificación de volumen e intensidad relativa dentro del microciclo, para evitar
            sobreentrenamiento en una ventana donde el jugador, por primera vez, es capaz de
            tolerar y buscar cargas significativamente más altas que en cualquier etapa anterior.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="05 — Plan de Acción: Proyección LTAD" />
          <Titulo>5.1 Corto plazo (1-3 meses)</Titulo>
          <Lista
            items={[
              'Evaluación de fuerza máxima de referencia en los patrones fundamentales ya consolidados, estableciendo la línea de base individual.',
              'Introducción de isometría Overcoming con cargas conservadoras, evaluando tolerancia individual antes de intensificar.',
              'Verificación de calidad técnica bajo fatiga como criterio de habilitación para el trabajo de fuerza máxima e intensidad.',
            ]}
          />
          <Titulo>5.2 Mediano plazo (3-6 meses)</Titulo>
          <Lista
            items={[
              'Implementación completa de la periodización ondulante semanal por Día de Partido, integrando fuerza máxima, RFD e isometría avanzada en microciclos diferenciados.',
              'Consolidación de la isometría Yielding pesada como herramienta central de prevención de lesiones de rodilla e isquiotibiales.',
              'Introducción sistemática de trabajo de RFD en ventanas tempranas y tardías de la curva fuerza-tiempo.',
            ]}
          />
          <Titulo>5.3 Largo plazo (6-12 meses)</Titulo>
          <Lista
            items={[
              'Consolidación de los cimientos definitivos del jugador: fuerza máxima, RFD e isometría avanzada plenamente integradas sobre una base técnica sólida desde 10ma división.',
              'Preparación de la transición a 4ta división y Reserva, donde el objetivo pasa a ser transferencia directa al gesto deportivo específico.',
              'Individualización creciente de la carga, sentando el precedente que en 4ta división y Reserva se completará cruzando datos de fuerza con datos de carga externa por GPS.',
            ]}
          />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="06 — 📖 Fundamentos Fisiológicos y Biomecánicos (NSCA)" />
          <Titulo>06. Fundamentos Fisiológicos y Biomecánicos (NSCA)</Titulo>
          <P>
            El Capítulo 1 estableció que esta etapa es la primera donde la RFD se convierte en
            una cualidad directamente entrenable con pleno sentido fisiológico. Este capítulo
            desarrolla el mecanismo neuromuscular exacto detrás de esa afirmación, apoyado en el
            marco curricular de la NSCA (Haff &amp; Triplett, 2017): el orden de reclutamiento de
            unidades motoras y el rol específico de las fibras de contracción rápida en la
            producción de fuerza máxima y de RFD.
          </P>
          <Titulo>6.1 El Principio del Tamaño y el orden de reclutamiento</Titulo>
          <P>
            El sistema nervioso no recluta unidades motoras al azar: las recluta siguiendo el{' '}
            <span className="font-semibold text-union-charcoal">Principio del Tamaño</span> de
            Henneman —de menor a mayor umbral de activación—, comenzando por unidades motoras
            pequeñas de Tipo I (fibras de contracción lenta, bajo umbral, alta resistencia a la
            fatiga) y progresando, a medida que la demanda de fuerza aumenta, hacia unidades
            motoras grandes de Tipo II (fibras de contracción rápida). Las unidades motoras
            grandes de{' '}
            <span className="font-semibold text-union-charcoal">Tipo IIx y IIa</span> —las de
            mayor umbral de reclutamiento, mayor velocidad de conducción y mayor capacidad de
            producción de fuerza por fibra— sólo se activan cuando la demanda de fuerza o de
            velocidad de producción de fuerza es lo suficientemente alta: cargas cercanas al
            máximo, o intención de movimiento explosiva incluso con cargas submáximas.
          </P>
          <Titulo>6.2 Por qué esta etapa es la ventana de reclutamiento pleno de Tipo IIx/IIa</Titulo>
          <P>
            Reclutar unidades motoras grandes de forma consistente y segura exige dos condiciones
            que, según lo desarrollado en la Sección 1.2 de este tomo, recién convergen en 16-17
            años: arquitectura muscular y tendinosa ya adaptada (mayor ángulo de penación, mayor
            stiffness tendinoso) capaz de tolerar la tensión que esas fibras producen, y un
            sistema neuromuscular con la sincronización y frecuencia de disparo necesarias para
            activarlas de forma coordinada. La fuerza máxima depende de reclutar la mayor
            proporción posible de estas unidades motoras de alto umbral; la RFD depende, además,
            de la velocidad con la que ese reclutamiento ocurre en los primeros 100-250ms del
            esfuerzo (Manual Metodológico Oficial, Sección 1.2) — ambas cualidades comparten el
            mismo sustrato neuromuscular de fondo: el acceso pleno y veloz a las fibras Tipo
            IIx/IIa, exactamente lo que el trabajo de fuerza máxima e isometría Overcoming de esta
            etapa (Sección 4.3) entrena de forma directa.
          </P>
          <blockquote className="mt-3 border-l-4 border-union-red-600 bg-slate-50 py-2 pl-4 pr-3 text-[11px] italic leading-relaxed text-slate-600 break-inside-avoid">
            Concepto clave NSCA: la fuerza máxima y la RFD no son cualidades independientes de las
            fibras Tipo IIx/IIa — son dos expresiones distintas (cuánta fuerza vs. qué tan rápido)
            del mismo evento neuromuscular: el reclutamiento pleno de las unidades motoras de
            mayor umbral, disponible con plenitud fisiológica recién a partir de esta etapa.
            <footer className="mt-1 text-[10px] font-semibold not-italic text-union-charcoal">
              Haff, G.G., &amp; Triplett, N.T. (Eds.). (2017). Essentials of Strength Training and
              Conditioning (4th ed.). National Strength and Conditioning Association / Human
              Kinetics.
            </footer>
          </blockquote>
        </Hoja>

        <Hoja ultima>
          <Encabezado eyebrow="07 — Referencias Bibliográficas" />
          <Referencias
            items={[
              'Haff, G.G., & Triplett, N.T. (Eds.). (2017). Essentials of Strength Training and Conditioning (4th ed.). National Strength and Conditioning Association / Human Kinetics.',
              'Añon, P. (2026). Entrenamiento de la fuerza en niños y adolescentes.',
              'Beunen, G., & Malina, R. (2008). Growth and biologic maturation: Relevance to athletic performance. In H. Hebestreit & O. Bar-Or (Eds.), The young athlete (1.ª ed., pp. 3–17). Blackwell.',
              'Carvalho, H. M., et al. (2012). Citado en Añon, 2026, respecto al desfasaje temporal entre el pico de crecimiento de la masa muscular y el pico de fuerza en varones; referencia secundaria sin datos bibliográficos completos disponibles en la fuente.',
              'Jones, D., & Round, J. (2008). Muscle development during childhood and adolescence. In H. Hebestreit & O. Bar-Or (Eds.), The young athlete (1.ª ed., pp. 18–26). Blackwell.',
              'Lefevre, J., Beunen, G., Steens, G., Claessens, A., & Renson, R. (1990). Motor performance during adolescence and age thirty as related to age at peak height velocity. Annals of Human Biology, 17(5), 423–435.',
              'Lloyd, R. S., & Oliver, J. L. (2012). The youth physical development model: A new approach to long-term athletic development. Strength and Conditioning Journal, 34(3), 61–72.',
              'Rador, J., Oliver, J., Waugh, C., Myer, G., Moore, I., & Lloyd, R. (2018). The influence of growth and maturation on stretch-shortening cycle function in youth. Sports Medicine, 48(1), 57–71.',
            ]}
          />
        </Hoja>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Estructura base (hoja A4 / encabezado / portada)
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
          Manual LTAD — 7ma y 6ta · {NOMBRE_AREA}
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
          Manual Metodológico · Tomo 3 de la colección LTAD
        </p>
        <h1 className="text-4xl font-black leading-tight text-union-charcoal">Fuerza y Tensión</h1>
        <p className="mt-2 text-lg font-semibold text-slate-500">7ma y 6ta División (16 y 17 años)</p>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
          La ventana post-PHV de máxima adaptación hormonal y neural: fuerza máxima, Tasa de
          Desarrollo de la Fuerza (RFD), isometría avanzada (Overcoming e Yielding pesado) y los
          cimientos definitivos del jugador profesional.
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
// Helpers de tipografía editorial
// ---------------------------------------------------------------------------

function Titulo({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 mt-5 text-base font-bold leading-snug text-union-charcoal first:mt-0">{children}</h2>
}

function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-union-red-600">{children}</h3>
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-justify text-xs leading-relaxed tracking-wide text-slate-600">{children}</p>
}

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-600">
          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-union-red-600" />
          <span className="text-justify">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Referencias({ items }: { items: string[] }) {
  return (
    <ol className="mt-2 flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={i} className="text-[10.5px] leading-relaxed text-slate-600">
          {item}
        </li>
      ))}
    </ol>
  )
}

// ---------------------------------------------------------------------------
// Índice y nota sobre fuentes
// ---------------------------------------------------------------------------

const INDICE: { numero: string; titulo: string }[] = [
  { numero: '01', titulo: 'Cualidades de la Edad (16-17 años)' },
  { numero: '02', titulo: 'Objetivos del Área de Fuerza' },
  { numero: '03', titulo: 'Metodología de Aprendizaje' },
  { numero: '04', titulo: 'Desarrollo de la Fuerza — Cómo Atacarla' },
  { numero: '05', titulo: 'Plan de Acción — Proyección LTAD' },
  { numero: '06', titulo: 'Fundamentos Fisiológicos y Biomecánicos (NSCA)' },
  { numero: '07', titulo: 'Referencias Bibliográficas' },
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
      <ol className="mt-2 flex flex-col gap-2">
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            1. Fuente primaria verificada — Pablo Añon (2026):{' '}
          </span>
          capítulo de pliometría (tabla de adaptaciones del CEA, Rador et al., 2018, stiffness
          miotendinoso) y capítulo de crecimiento y maduración, en lo referido a los picos de
          fuerza, testosterona e IGF-1 post-PHV.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            2. Fuente primaria verificada — Máster en Alto Rendimiento (Real Madrid):{' '}
          </span>
          revisión completa de la carpeta de Drive. Sin contenido específico sobre 16-17 años
          más allá de la sesión ya citada de Eduardo López Martínez.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            3. Marco conceptual de consenso científico —{' '}
          </span>
          la isometría Overcoming e Yielding pesada y la periodización de fuerza máxima se
          presentan alineadas con la Sección 3 del Manual Metodológico Oficial.
        </li>
      </ol>
    </section>
  )
}

