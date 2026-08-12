import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NOMBRE_AREA, FIRMA_AUTOR } from '@/constants/branding'

/**
 * Manual Metodológico — El Estirón (9na y 8va división). Versión maquetada
 * 1-a-1 sobre el contenido académico redactado en `docs/Manual_9na_8va.md`
 * (no es un resumen — es ese texto distribuido en hojas A4). Documento
 * digital exportable a PDF vía `window.print()`, reutilizando estrictamente
 * la arquitectura de impresión A4 de `ManualFuerzaView.tsx`.
 */
export function Manual9na8vaView() {
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
          <span className="text-sm font-medium">📗 El Estirón — 9na y 8va División</span>
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
          <Encabezado eyebrow="01 — Cualidades de la Edad (14-15 años)" />
          <Titulo>1.1 El Pico de Velocidad de Crecimiento (PHV)</Titulo>
          <P>
            Esta es la etapa que da nombre al tomo. El pico de velocidad de crecimiento (PVC o
            PHV) es el momento de mayor velocidad de crecimiento longitudinal de la talla, y en
            varones ocurre en promedio alrededor de los 14 años, con una variabilidad
            inter-sujeto de 12 a 16 años (Añon, 2026). 9na y 8va división —14 y 15 años
            cronológicos— es, para la mayoría del plantel, la ventana donde efectivamente ocurre
            el estirón, aunque con una dispersión individual tan amplia que dentro del mismo
            equipo conviven jugadores que ya lo atravesaron, jugadores que lo están atravesando y
            jugadores que todavía no llegaron a él.
          </P>
          <P>
            El método de campo más aplicable para estimar en qué punto de esa ventana está cada
            jugador es la ecuación de offset madurativo de Mirwald et al. (2002): a partir de
            talla de pie, talla sentado, peso y edad cronológica, se calcula el "estatus
            madurativo" del sujeto en años de distancia al PHV. Ejemplo del propio libro: un niño
            de 12,1 años con 152 cm de talla y 40 kg arroja -1,54 años al PVC — le faltan
            aproximadamente 18 meses para atravesar su pico de crecimiento (Añon, 2026, citando a
            Mirwald et al., 2002). Esta ecuación, aplicada al ingreso a 9na división, es la
            herramienta de campo recomendada para clasificar a cada jugador según su proximidad
            real al PHV, no su edad cronológica.
          </P>
          <Titulo>1.2 Torpeza motora transitoria: por qué el cuerpo "deja de responder"</Titulo>
          <P>
            Es un fenómeno ampliamente descripto —y frecuentemente mal interpretado— que durante
            el pico de crecimiento muchos jugadores atraviesan una fase de coordinación
            aparentemente más pobre: pierden precisión en gestos que ya dominaban, se "traban" en
            cambios de dirección. Este documento adopta un criterio de honestidad de fuente: no
            se encontró un estudio puntual dedicado exclusivamente a cuantificar la "torpeza
            adolescente" bajo ese nombre — lo que sí está sólidamente verificado es la explicación
            fisiológica subyacente: el desfasaje entre el crecimiento óseo y la adaptación del
            tejido blando.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="01 — Cualidades de la Edad (14-15 años)" />
          <P>
            El crecimiento óseo longitudinal ocurre en la metáfisis, donde las células se
            multiplican y osifican hasta la fusión final de la epífisis con la diáfisis (Añon,
            2026). Ese alargamiento del hueso —el "brazo de palanca" de cada músculo y tendón—
            ocurre más rápido de lo que el sistema músculo-tendinoso puede reorganizarse: el
            stiffness miotendinoso, la longitud del fascículo muscular, el ángulo de penación y
            el tamaño del tendón también aumentan durante el crecimiento, pero de forma
            progresiva, no instantánea (Añon, 2026, citando a Rador et al., 2018). Mientras el
            hueso ya alcanzó su nueva longitud, el sistema neuromuscular todavía está
            recalibrando la coordinación a esa nueva palanca — de ahí la sensación, real y
            medible, de que el jugador "perdió" una coordinación que en rigor tiene que
            reconstruir sobre un cuerpo distinto al de seis meses atrás.
          </P>
          <Titulo>1.3 Ventana de máximo riesgo: hueso, cartílago de crecimiento y tendón</Titulo>
          <P>
            Esta es, según la literatura revisada, la etapa de mayor vulnerabilidad estructural
            de todo el proceso formativo. Los factores de riesgo de lesión documentados por Añon
            (2026, citando a Faigenbaum, 2010) identifican al pico de crecimiento durante la
            pubertad como el primer factor: incrementa la posibilidad de lesiones de tendón y
            fracturas epifisiarias. La razón biomecánica: el cartílago de crecimiento puede ser
            entre tres y cinco veces más débil que el tejido conectivo que lo rodea, y menos
            resistente a las fuerzas de corte y tensión durante el pico de crecimiento (Añon,
            2026, citando a Myer, 2009, y Maffulli, 2016). Consistente con esto, la edad de mayor
            incidencia de fracturas es, precisamente, 14 años en varones y 11 en mujeres (Añon,
            2026, citando a Fuchs, 2022) — exactamente la franja de este tomo.
          </P>
          <Nota>
            Es clave remarcar que el propio entrenamiento de fuerza bien supervisado no es la
            causa de este riesgo: los reportes de lesión de cartílago de crecimiento vinculados
            al entrenamiento de fuerza son escasos, y las excepciones documentadas están
            consistentemente asociadas a técnica inapropiada, carga inadecuada o falta de
            supervisión calificada (Añon, 2026, citando a Jenkins et al., 1986; Gumbs, 1982) — no
            al entrenamiento de fuerza en sí. El riesgo de esta etapa es estructural y hormonal;
            la mitigación es exactamente la función de un programa de fuerza bien supervisado.
          </Nota>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="01 — Cualidades de la Edad (14-15 años)" />
          <Titulo>1.4 Inicio del impulso hormonal</Titulo>
          <P>
            Hacia el final de esta franja comienza a estar disponible el sustrato hormonal que
            habilitará la hipertrofia real: los niveles de testosterona e IGF-1 aumentan de forma
            marcada en torno al PHV (Añon, 2026, citando a Jones &amp; Round, 2008). Pero el
            desfasaje temporal es clave: el pico de incremento de la fuerza ocurre entre 0,5 y 1
            año después del PHV, coincidiendo con el pico de velocidad del peso corporal, y en
            varones incluso entre 1 y 2 años después del pico de crecimiento de la masa muscular
            (Añon, 2026, citando a Beunen &amp; Malina, 2008, y Carvalho et al., 2012). Esto ubica
            a la mayor parte de 9na y 8va división todavía antes de ese pico de ganancia de
            fuerza — el estímulo hormonal recién está empezando a estar disponible, razón por la
            cual este tomo habla de "hipertrofia funcional básica" y no de hipertrofia como
            objetivo central.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="02 — Objetivos del Área de Fuerza" />
          <Titulo>2.1 Objetivos primarios</Titulo>
          <Subtitulo>a) Re-educación motora</Subtitulo>
          <P>
            El crecimiento acelerado del hueso desactualiza —de forma transitoria y
            fisiológicamente normal— la coordinación fina consolidada en la etapa anterior. El
            objetivo primario no es "avanzar" en carga, es re-verificar y reconstruir los
            patrones fundamentales sobre la nueva palanca corporal del jugador, exigiendo volver
            a evaluar técnica en cada jugador que atraviesa un salto de talla marcado.
          </P>
          <Subtitulo>b) Hipertrofia funcional básica</Subtitulo>
          <P>
            Con el inicio del impulso hormonal (Sección 1.4), se habilita —de forma todavía
            incipiente— trabajo orientado a volumen muscular básico, priorizando siempre la
            integridad articular y tendinosa por sobre la magnitud de la carga. "Funcional"
            implica que la hipertrofia buscada sostiene y protege los patrones fundamentales, no
            grupos musculares aislados.
          </P>
          <Subtitulo>c) Salud del tendón y del tejido conectivo</Subtitulo>
          <P>
            Dado que esta es la ventana de mayor vulnerabilidad estructural (Sección 1.3), la
            prioridad explícita es que el tendón y el tejido conectivo lleguen a la etapa
            siguiente en condiciones de tolerar el salto de carga e intensidad que exige. Esto se
            traduce en dosificación conservadora, priorización de isometría de sostén sobre
            trabajo excéntrico agresivo, y monitoreo constante de síntomas de sobreuso.
          </P>
          <Titulo>2.2 Objetivos secundarios</Titulo>
          <Lista
            items={[
              'Introducción progresiva de carga externa real, siempre condicionada a la revalidación técnica sobre la palanca corporal actual del jugador.',
              'Monitoreo antropométrico periódico: registro de talla, peso y proporciones para detectar el salto de crecimiento y ajustar la progresión de carga en consecuencia.',
              'Manejo activo de la heterogeneidad madurativa del plantel: planificación individual de cargas, no un programa único por categoría.',
              'Continuidad de la diversificación motriz heredada del tomo anterior.',
            ]}
          />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="03 — Metodología de Aprendizaje" />
          <Titulo>3.1 Re-diagnóstico como punto de partida de cada bloque</Titulo>
          <P>
            Ya no se asume un punto de partida homogéneo. Cada bloque debe iniciar con una
            verificación técnica de los patrones fundamentales para cada jugador, con particular
            atención a quienes muestran signos evidentes de estar atravesando el PHV (aumento
            marcado de talla, cambio de proporciones tronco/pierna, torpeza motora transitoria).
            Es la aplicación directa de la lógica de "edad de entrenamiento" versus "edad
            biológica" que el modelo LTAD prioriza por sobre la edad cronológica (Añon, 2026).
          </P>
          <Titulo>3.2 Progresión condicionada, no lineal</Titulo>
          <P>
            A diferencia de una progresión puramente calendárica, en esta etapa la progresión es
            explícitamente no lineal: un jugador puede necesitar retroceder temporalmente en
            carga o complejidad durante las semanas de crecimiento más acelerado, para retomar
            luego. Este criterio se apoya en la evidencia de que el rendimiento motor durante la
            adolescencia no es lineal, y presenta fluctuaciones vinculadas al momento madurativo
            (Añon, 2026).
          </P>
          <Titulo>3.3 Comunicación y expectativas</Titulo>
          <P>
            Es responsabilidad del cuerpo técnico comunicar explícitamente al jugador que la
            pérdida transitoria de coordinación durante el estirón es un fenómeno fisiológico
            normal y esperable, no un retroceso ni un indicador de bajo talento — y evitar que un
            jugador atravesando su PHV sea mal evaluado por una torpeza motora que es transitoria
            y biológicamente esperable.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Desarrollo de la Fuerza: Cómo Atacarla" />
          <Titulo>4.1 Adaptaciones neurales y estructurales en transición</Titulo>
          <P>
            El modelo YPD de Lloyd y Oliver (2012) describe la franja que atraviesa el PHV como
            el punto de inflexión entre adaptaciones "predominantemente neurales" y adaptaciones
            que combinan lo neural con lo hormonal (Añon, 2026). En 9na y 8va división ese punto
            de inflexión está efectivamente ocurriendo: el estímulo hormonal recién comienza a
            estar disponible, y las adaptaciones estructurales que dominarán la etapa siguiente
            todavía se combinan con el componente neural predominante en la mayoría del plantel.
          </P>
          <P>
            La tabla de adaptaciones evolutivas del ciclo estiramiento-acortamiento (CEA) que
            documenta Añon (2026, citando a Rador et al., 2018) es especialmente relevante: con
            la maduración aumentan el tipo de fibra predominante, la masa muscular, el ángulo de
            penación, la longitud del fascículo muscular, el tamaño y el stiffness del tendón, y
            el reclutamiento de unidades motoras — todas variables que inciden directamente sobre
            la Tasa de Desarrollo de la Fuerza (RFD) y sobre la acumulación de energía elástica.
            En 9na y 8va estas variables están en proceso de cambio activo, no estabilizadas —
            razón por la cual el trabajo de fuerza debe priorizar la adaptación segura del tejido
            por sobre la explotación agresiva de esas capacidades.
          </P>
          <Titulo>4.2 Re-educación de los patrones fundamentales sobre la nueva palanca</Titulo>
          <P>
            Los cinco patrones fundamentales trabajados en 10ma y Pre 9na se mantienen como
            estructura de trabajo, pero con un criterio distinto: en lugar de progresar en
            complejidad, el foco es revalidar la calidad de ejecución de cada patrón sobre las
            nuevas proporciones corporales del jugador. Un jugador que atravesó recientemente su
            PHV puede necesitar volver temporalmente a una versión más simple de un patrón que ya
            dominaba con su cuerpo anterior — mismo criterio metodológico, aplicado a un cuerpo
            que cambió.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Desarrollo de la Fuerza: Cómo Atacarla" />
          <Titulo>4.3 Isometría: consolidación de Yielding e introducción cauta de trabajo excéntrico</Titulo>
          <P>
            En esta etapa se consolida el uso de la isometría Yielding —ya no solo con propósito
            puramente educativo, sino progresando hacia tiempos de sostén más largos y cargas
            moderadas, dado que el jugador ya cuenta con base técnica sólida. Dado el riesgo
            estructural desarrollado en la Sección 1.3, el trabajo excéntrico de mayor intensidad
            y la isometría Overcoming —que en la etapa siguiente se introducen de lleno— se
            mantienen en esta etapa de forma muy conservadora y estrictamente individualizada,
            priorizando siempre la salud tendinosa por sobre la anticipación de estímulos que
            corresponden a la ventana post-PHV.
          </P>
          <Titulo>4.4 Progresión de cargas</Titulo>
          <P>
            La progresión se apoya en el mismo criterio de dominio técnico que en la etapa
            anterior, con dos diferencias operativas: la progresión ya no es unidireccional (un
            jugador puede retroceder temporalmente un escalón durante las semanas de crecimiento
            más acelerado, sin que eso represente un fracaso del programa) y se habilita el
            incremento gradual de carga externa real, siempre condicionado a la revalidación
            técnica, priorizando ejercicios que refuercen los patrones fundamentales por sobre
            ejercicios de aislamiento. El objetivo no es la fuerza máxima —que corresponde a la
            ventana post-PHV— es consolidar de forma segura el puente entre la técnica de peso
            corporal/bandas de la etapa anterior y el trabajo de barra que dominará la etapa
            siguiente.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="05 — Plan de Acción: Proyección LTAD" />
          <Titulo>5.1 Corto plazo (1-3 meses)</Titulo>
          <Lista
            items={[
              'Control antropométrico de ingreso: talla de pie, talla sentado y peso para cada jugador, aplicando la ecuación de Mirwald et al. (2002) para estimar la distancia individual al PHV.',
              'Re-evaluación técnica de los cinco patrones fundamentales heredados de 10ma y Pre 9na para todo el plantel.',
              'Establecimiento de protocolo de monitoreo de síntomas de sobreuso como rutina de control semanal.',
            ]}
          />
          <Titulo>5.2 Mediano plazo (3-6 meses)</Titulo>
          <Lista
            items={[
              'Consolidación de la re-educación motora para los jugadores identificados en la fase de corto plazo.',
              'Introducción progresiva de hipertrofia funcional básica para los jugadores con técnica ya consolidada, con volumen moderado y prioridad absoluta a la integridad articular.',
              'Consolidación de isometría Yielding con tiempos de sostén más largos, manteniendo criterio conservador respecto al trabajo excéntrico intenso.',
            ]}
          />
          <Titulo>5.3 Largo plazo (6-12 meses)</Titulo>
          <Lista
            items={[
              'Preparación para la transición a 7ma y 6ta división: tejido tendinoso y conectivo listo para tolerar el salto de intensidad de esa etapa, con la base técnica ya revalidada sobre el cuerpo adulto en formación.',
              'Introducción gradual y ya supervisada de cargas de barra en rango moderado, sentando el puente técnico específico (sentadilla, peso muerto, cargada).',
              'Consolidación del criterio de progresión no lineal como parte del bagaje metodológico permanente: el crecimiento no es un proceso homogéneo.',
            ]}
          />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="06 — Referencias Bibliográficas" />
          <Referencias
            items={[
              'Añon, P. (2026). Entrenamiento de la fuerza en niños y adolescentes.',
              'Beunen, G., & Malina, R. (2008). Growth and biologic maturation: Relevance to athletic performance. In H. Hebestreit & O. Bar-Or (Eds.), The young athlete (1.ª ed., pp. 3–17). Blackwell.',
              'Faigenbaum, A., & Myer, G. (2010). Pediatric resistance training: Benefits, concerns, and program design considerations. Current Sports Medicine Reports, 9(3), 161–168.',
              'Fuchs, R. K. (2022). Citado en Añon, 2026, respecto a la edad de mayor incidencia de fracturas del cartílago de crecimiento; referencia secundaria sin datos bibliográficos completos disponibles en la fuente.',
              'Gumbs, V. L. (1982). Citado en Añon, 2026, respecto a lesiones bilaterales de radio y cúbito distal en levantadores jóvenes; referencia secundaria sin datos bibliográficos completos disponibles en la fuente.',
              'Jenkins, D. P., et al. (1986). Citado en Añon, 2026, respecto a fractura bilateral de la epífisis del radio distal en un niño de 13 años; referencia secundaria sin datos bibliográficos completos disponibles en la fuente.',
              'Jones, D., & Round, J. (2008). Muscle development during childhood and adolescence. In H. Hebestreit & O. Bar-Or (Eds.), The young athlete (1.ª ed., pp. 18–26). Blackwell.',
              'Lloyd, R. S., & Oliver, J. L. (2012). The youth physical development model: A new approach to long-term athletic development. Strength and Conditioning Journal, 34(3), 61–72.',
              'Maffulli, N. (2016). Citado en Añon, 2026, respecto a la resistencia mecánica del cartílago de crecimiento; referencia secundaria sin datos bibliográficos completos disponibles en la fuente.',
              'Mirwald, R., Baxter-Jones, A., Bailey, D., & Beunen, G. (2002). An assessment of maturity from anthropometric measurements. Medicine & Science in Sports & Exercise, 34(4), 689–694.',
              'Myer, G. (2009). Citado en Añon, 2026, respecto a la resistencia mecánica relativa del cartílago de crecimiento; referencia secundaria sin datos bibliográficos completos disponibles en la fuente.',
              'Rador, J., Oliver, J., Waugh, C., Myer, G., Moore, I., & Lloyd, R. (2018). The influence of growth and maturation on stretch-shortening cycle function in youth. Sports Medicine, 48(1), 57–71.',
            ]}
          />
        </Hoja>

        <Hoja ultima>
          <Encabezado eyebrow="Nota Final y Firma" />
          <Titulo>Nota final sobre la carpeta "Máster en Alto Rendimiento — Real Madrid"</Titulo>
          <P>
            Se revisó nuevamente la carpeta completa (4 subcarpetas, 13 archivos) buscando
            específicamente contenido sobre la ventana de 14-15 años y riesgo de lesión en el
            pico de crecimiento. No se encontró material dedicado a esta franja etaria más allá
            de lo ya citado en el primer tomo (sesión de Eduardo López Martínez sobre maduración
            biológica). Se documenta esta búsqueda por transparencia, en línea con el criterio de
            honestidad de fuentes que rige todos los manuales de esta área.
          </P>
          <Cierre />
          <Pie />
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
          Manual LTAD — 9na y 8va · {NOMBRE_AREA}
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
          Manual Metodológico · Tomo 2 de la colección LTAD
        </p>
        <h1 className="text-4xl font-black leading-tight text-union-charcoal">El Estirón</h1>
        <p className="mt-2 text-lg font-semibold text-slate-500">9na y 8va División (14 y 15 años)</p>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
          La ventana de Pico de Velocidad de Crecimiento (PHV): torpeza motora transitoria,
          riesgo estructural del cartílago de crecimiento, re-educación motora, hipertrofia
          funcional básica y prioridad absoluta a la salud del tendón y el tejido conectivo.
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

function Nota({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-md bg-slate-50 p-2.5 text-[10px] italic leading-relaxed text-slate-400 break-inside-avoid">
      {children}
    </p>
  )
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
  { numero: '01', titulo: 'Cualidades de la Edad (14-15 años)' },
  { numero: '02', titulo: 'Objetivos del Área de Fuerza' },
  { numero: '03', titulo: 'Metodología de Aprendizaje' },
  { numero: '04', titulo: 'Desarrollo de la Fuerza — Cómo Atacarla' },
  { numero: '05', titulo: 'Plan de Acción — Proyección LTAD' },
  { numero: '06', titulo: 'Referencias Bibliográficas' },
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
          capítulo de pliometría (tabla de adaptaciones del ciclo estiramiento-acortamiento,
          Rador et al., 2018, y stiffness miotendinoso) y capítulo de crecimiento y maduración,
          particularmente el Mito 2 sobre riesgo de lesión.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            2. Fuente primaria verificada — Máster en Alto Rendimiento (Real Madrid):{' '}
          </span>
          revisión completa de la carpeta de Drive. Sin contenido específico sobre 14-15 años
          más allá de la sesión ya citada de Eduardo López Martínez.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            3. Marco conceptual de consenso científico —{' '}
          </span>
          la re-educación motora post-crecimiento y la hipertrofia funcional básica se presentan
          alineadas con las Secciones 3 y 5.2 del Manual Metodológico Oficial.
        </li>
      </ol>
    </section>
  )
}

function Cierre() {
  return (
    <section className="mt-6">
      <Titulo>Cierre</Titulo>
      <P>
        Este tomo es el marco de referencia obligatorio para todo entrenador, preparador físico
        o colaborador que trabaje con 9na y 8va división. Es la ventana de mayor riesgo
        estructural de todo el proceso formativo — y por eso mismo, la etapa donde la
        supervisión y la dosificación conservadora son innegociables.
      </P>
    </section>
  )
}

function Pie() {
  return (
    <div className="mt-10 flex items-end justify-between border-t border-slate-200 pt-4">
      <p className="text-[10px] text-slate-400">Club Atlético Unión de Santa Fe</p>
      <div className="text-right">
        <p className="text-xs font-semibold tracking-wide text-union-charcoal">{FIRMA_AUTOR}</p>
        <p className="text-[10px] text-slate-400">{NOMBRE_AREA}</p>
      </div>
    </div>
  )
}
