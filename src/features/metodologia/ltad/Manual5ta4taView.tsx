import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NOMBRE_AREA, FIRMA_AUTOR } from '@/constants/branding'

/**
 * Manual Metodológico — Transferencia y Rendimiento (5ta y 4ta división).
 * Versión maquetada 1-a-1 sobre el contenido académico redactado en
 * `docs/Manual_5ta_4ta.md` (no es un resumen — es ese texto distribuido en
 * hojas A4). Documento digital exportable a PDF vía `window.print()`,
 * reutilizando estrictamente la arquitectura de impresión A4 de
 * `ManualFuerzaView.tsx`.
 */
export function Manual5ta4taView() {
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
          <span className="text-sm font-medium">📗 Transferencia y Rendimiento — 5ta y 4ta División</span>
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
          <Encabezado eyebrow="01 — Cualidades de la Edad (18-20 años)" />
          <Titulo>1.1 Maduración biológica completa: el fin de la ventana de crecimiento</Titulo>
          <P>
            A los 18-20 años, el proceso de maduración esquelética ya concluyó: las placas de
            crecimiento se cierran y el hueso deja de crecer en longitud hacia los 18-20 años,
            momento en el que se alcanza la madurez esquelética (Añon, 2026). Esto marca el
            cierre definitivo del eje conceptual que organizó toda la colección de manuales
            anteriores —edad biológica versus edad cronológica, proximidad al PHV, riesgo
            estructural asociado al crecimiento activo—: en 5ta y 4ta división, la variable
            madurativa deja de ser una incógnita individual a estimar y pasa a ser, para la
            enorme mayoría del plantel, una condición ya alcanzada y estable.
          </P>
          <P>
            En términos del modelo LTAD, esta franja corresponde al tramo final de la etapa
            "Entrenar para competir" y al ingreso en "Entrenar para ganar" (Añon, 2026) — la
            etapa en la que los atletas "optimizan su motor" construido en las etapas anteriores
            y se especializan para competir en situaciones de alta presión. El Manual
            Metodológico Oficial (Sección 5.4) es explícito: en esta categoría "ya no hay una
            ventana de desarrollo biológico que explotar — el objetivo deja de ser 'construir la
            capacidad' para pasar a ser 'transferir la capacidad ya construida al rendimiento
            competitivo específico'".
          </P>
          <Titulo>1.2 Fisiología del rendimiento adulto: el marco que ahora aplica sin reservas</Titulo>
          <P>
            A diferencia de los tres tomos anteriores —donde el material de ciencia del deporte
            adulto revisado en la carpeta del Máster en Alto Rendimiento (Real Madrid) se dejaba
            deliberadamente fuera por no corresponder a la fisiología infanto-juvenil—, en esta
            etapa ese marco aplica sin reservas, porque el jugador de 18-20 años es,
            fisiológicamente, un adulto. Esto incluye el Síndrome General de Adaptación (Selye,
            1936) como base biológica de la supercompensación, la clasificación de fibras
            musculares (Tipo I, IIa, IIx) y su relación con la producción de fuerza y velocidad
            de contracción, y el modelo trifásico de Skinner y McLellan sobre la transición
            metabólica aeróbica-anaeróbica a través de los umbrales ventilatorios VT1 y VT2.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="01 — Cualidades de la Edad (18-20 años)" />
          <Titulo>1.3 Perfil neuromuscular individual: de la norma poblacional al perfil de cada jugador</Titulo>
          <P>
            La diferencia cualitativa más importante de esta etapa respecto a las tres anteriores
            es que la evaluación deja de compararse contra curvas normativas de crecimiento y
            maduración (Scammon, Tanner, Mirwald) y pasa a apoyarse en el perfil neuromuscular
            individual medido directamente sobre cada jugador. El Trabajo de Fin de Máster del
            propio autor (Robles, s.f.), centrado en las alteraciones de las fases del salto con
            contramovimiento (CMJ) como indicador de fatiga neuromuscular en deportes de conjunto,
            es el marco conceptual central de esta sección: variables derivadas de la curva
            fuerza-tiempo del CMJ —más allá de la altura de salto como única medida— permiten
            detectar cambios en el estado neuromuscular del deportista tras estrés físico
            significativo (Robles, s.f., citando a Wu et al., 2019). Tanto variables tradicionales
            (altura de salto, potencia, velocidad máxima) como variables específicas de fase
            (tiempos de fase, impulsos, RFD) muestran alteraciones significativas tras protocolos
            que inducen fatiga neuromuscular, y estas últimas reflejan cambios en la estrategia de
            movimiento que el sistema neuromuscular adopta para compensar la fatiga y proteger la
            integridad estructural del atleta (Robles, s.f., citando a Yoshida et al., 2024).
          </P>
          <Nota>
            El propio TFM señala una limitación metodológica relevante: las mediciones
            convencionales basadas únicamente en la altura de salto pueden no ser suficientemente
            sensibles para detectar estados tempranos o sutiles de fatiga, lo que exige un enfoque
            más amplio e integrado que incluya variables biomecánicas y cinemáticas específicas
            de cada fase (Robles, s.f., citando a Verón, 2024). Esta limitación justifica mirar
            más allá de la altura de salto en el monitoreo de esta categoría (Sección 4.2).
          </Nota>
          <Titulo>1.4 Transición institucional: de la categoría formativa al plantel superior</Titulo>
          <P>
            18-20 años es, además de una etapa fisiológica, una etapa institucional: la
            transición efectiva desde el proceso formativo del club hacia el plantel de Reserva y
            eventualmente Primera. Esto refuerza la necesidad de que el perfil de fuerza de cada
            jugador, y no solo su edad o su categoría, determine el diseño de su programa
            individual (Manual Metodológico Oficial, Sección 5.4).
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="02 — Objetivos del Área de Fuerza" />
          <Titulo>2.1 Objetivos primarios</Titulo>
          <Subtitulo>a) Transferencia directa de la fuerza al gesto deportivo</Subtitulo>
          <P>
            Tal como establece el Manual Metodológico Oficial (Sección 5.4), el objetivo central
            es la velocidad y la potencia como expresión aplicada de la fuerza y la RFD ya
            construidas en 7ma y 6ta división. El trabajo de fuerza deja de perseguirse como fin
            en sí mismo y se subordina, en su diseño, al gesto específico del fútbol: aceleración,
            cambio de dirección, salto, duelo de contacto.
          </P>
          <Subtitulo>b) Individualización total basada en datos</Subtitulo>
          <P>
            En 5ta y 4ta división la programación es, según el propio Manual Metodológico Oficial
            (Sección 5.4), "literalmente, un programa por jugador". Esto exige integrar de forma
            sistemática el perfil de fuerza individual (plataformas de fuerza y test de salto) con
            los datos de carga externa registrados por GPS.
          </P>
          <Subtitulo>c) Optimización del rendimiento competitivo</Subtitulo>
          <P>
            El objetivo de esta etapa, en los términos del propio modelo LTAD, es que el atleta
            "optimice su motor" ya construido y aprenda a competir en situaciones de alta presión
            con entrenamientos intensivos (Añon, 2026) — el cierre natural del proceso que
            comenzó, seis categorías atrás, en la alfabetización motora de 10ma división.
          </P>
          <Titulo>2.2 Objetivos secundarios</Titulo>
          <Lista
            items={[
              'Monitoreo de fatiga neuromuscular mediante CMJ, como herramienta de ajuste fino de carga dentro del microciclo.',
              'Prevención de lesiones específica del rendimiento adulto, apoyada en el control de asimetrías entre miembros y en la relación entre carga aguda y crónica (ACWR).',
              'Continuidad de la periodización ondulante semanal heredada de 7ma y 6ta división, enriquecida con variables de control objetivo.',
              'Preparación para la exigencia de calendario de Reserva y Primera, donde la densidad competitiva y la recuperación entre estímulos se vuelven variables de primer orden.',
            ]}
          />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="03 — Metodología de Aprendizaje" />
          <Titulo>3.1 De la pedagogía a la programación basada en datos</Titulo>
          <P>
            La metodología de esta etapa se aparta del componente pedagógico que dominaba las
            tres etapas anteriores para adoptar una lógica de programación basada en datos
            objetivos, propia del alto rendimiento adulto. El material de estudio revisado en la
            carpeta del Máster en Alto Rendimiento distingue con claridad dos tipos de
            evaluación: evaluaciones de rendimiento —punto de partida de un proceso de
            entrenamiento, para determinar virtudes y deficiencias del deportista— y evaluaciones
            de control —para tomar decisiones en tiempo real y determinar cargas de
            entrenamiento. Ambas conviven en la programación de esta etapa.
          </P>
          <Titulo>3.2 Periodización individual</Titulo>
          <P>
            Los tres modelos de periodización revisados —lineal (incrementos progresivos hacia un
            pico de rendimiento), no lineal u ondulatoria (variación frecuente de intensidad y
            volumen en ciclos cortos, apropiada para deportes de equipo con competición continua)
            y simultánea (integración de capacidades sin buscar un único pico de forma)— conviven
            como herramientas disponibles, seleccionadas según el momento de temporada y el
            perfil individual de cada jugador. Las variables que se manipulan son volumen,
            intensidad, frecuencia y densidad (relación entre tiempo de trabajo efectivo y tiempo
            de recuperación).
          </P>
          <Titulo>3.3 Control de carga aguda:crónica (ACWR)</Titulo>
          <P>
            El control riguroso del entrenamiento incorpora tecnología —monitores de frecuencia
            cardíaca, GPS, plataformas de análisis biomecánico— que permite calcular la relación
            entre carga aguda y carga crónica (ACWR, modelo de Gabbett) para prevenir lesiones y
            ajustar el rendimiento. Este indicador ya está desarrollado en profundidad en la
            Sección 1.4 del Manual Metodológico Oficial, y en 5ta y 4ta división se aplica
            cruzado, por primera vez de forma sistemática en esta colección, con el perfil de
            fuerza individual del jugador.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Desarrollo de la Fuerza: Cómo Atacarla" />
          <Titulo>4.1 Evaluación con plataformas de fuerza</Titulo>
          <P>
            La herramienta central de evaluación es la plataforma de fuerza, con dos test
            complementarios: el Tirón Isométrico de Medio Muslo (IMTP), que mide fuerza máxima a
            costo casi nulo y aporta fuerza pico, fuerza relativa y RFD en ventanas tempranas
            (por ejemplo, RFD a 250 ms); y el salto con contramovimiento (CMJ), que mide de forma
            objetiva la fuerza dinámica para una acción balística, aportando altura de salto,
            fuerza máxima propulsiva, fuerza máxima de frenado, tiempo de fuerza máxima y el
            índice RSI modificado. En ambos test, el control de asimetrías entre miembros
            —criterio de semáforo: menor al 10%, entre 10% y 20%, mayor al 20%— es una variable
            de riesgo de lesión de seguimiento sistemático.
          </P>
          <Titulo>4.2 Fatiga neuromuscular: mirar más allá de la altura de salto</Titulo>
          <P>
            Tal como se desarrolló en la Sección 1.3, la variable específicamente identificada
            como más sensible es la fuerza de frenado promedio durante la fase excéntrica del
            CMJ: cuando un atleta está fatigado a nivel neuromuscular, pierde eficiencia para
            producir fuerza rápida, lo que se traduce en menor fuerza de frenado promedio y mayor
            tiempo de frenado, muchas veces sin cambios significativos en la altura de salto
            (documento "Fuerza de Frenado como predictor de Fatiga", citando a Gathercole et al.,
            2015). Un descenso del 5-10% en fuerza de frenado promedio respecto al valor basal
            individual se interpreta como fatiga moderada; un descenso mayor al 10% se interpreta
            como fatiga significativa.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Desarrollo de la Fuerza: Cómo Atacarla" />
          <Titulo>4.3 Ejercicios VITAMINA individualizados cruzando fuerza y GPS</Titulo>
          <P>
            Siguiendo lo establecido en la Sección 2.2 del Manual Metodológico Oficial, en 5ta y
            4ta división los Ejercicios VITAMINA se individualizan completamente por jugador
            según su propio perfil de carga externa registrado por GPS: volumen de sprints,
            aceleraciones y desaceleraciones, y distancia recorrida a alta velocidad. Un jugador
            cuyo GPS muestra un volumen elevado de desaceleraciones de alta intensidad en la
            semana requiere un énfasis VITAMINA distinto —con mayor peso en isometría Yielding de
            frenado y control excéntrico de rodilla— que un jugador cuyo perfil esté dominado por
            volumen de sprint lineal. Esta es la etapa donde "la prevención deja de ser genérica
            por categoría y pasa a ser, literalmente, un programa por jugador".
          </P>
          <Titulo>4.4 Progresión de cargas: mantenimiento y refinamiento, no construcción</Titulo>
          <P>
            A diferencia de las tres etapas anteriores, donde la progresión de carga era el eje
            central del desarrollo, en 5ta y 4ta división pasa a un rol de mantenimiento y
            refinamiento de la capacidad ya construida. El margen de mejora general que dominaba
            las categorías formativas ya se agotó; lo que queda es optimización de detalle: ajuste
            fino de intensidad relativa por bloque de periodización, y priorización de la calidad
            de ejecución bajo la fatiga acumulada de un calendario competitivo denso, por sobre
            cualquier incremento adicional de carga máxima absoluta.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="05 — Plan de Acción: Proyección LTAD" />
          <Titulo>5.1 Corto plazo (1-3 meses)</Titulo>
          <Lista
            items={[
              'Evaluación de referencia con plataforma de fuerza (IMTP y CMJ) para todo el plantel, estableciendo el perfil neuromuscular individual de base.',
              'Integración de datos de GPS y plataforma de fuerza en un mismo tablero de seguimiento por jugador.',
              'Cálculo de ACWR individual para todo el plantel como línea de base de control de carga.',
            ]}
          />
          <Titulo>5.2 Mediano plazo (3-6 meses)</Titulo>
          <Lista
            items={[
              'Implementación sistemática del monitoreo de fuerza de frenado como variable de ajuste semanal de carga, cruzada con picos de volumen de GPS.',
              'Individualización completa de los Ejercicios VITAMINA por jugador, reemplazando cualquier resabio de programación genérica por categoría.',
              'Consolidación de la periodización individual, seleccionando el modelo más apropiado para el momento de temporada y el perfil de cada jugador.',
            ]}
          />
          <Titulo>5.3 Largo plazo (6-12 meses)</Titulo>
          <Lista
            items={[
              'Transferencia definitiva al rendimiento competitivo específico, con el perfil de fuerza y RFD de cada jugador expresado directamente en velocidad, potencia y gestos específicos del fútbol.',
              'Consolidación del jugador como sujeto de programación individual completa, integrando de forma estable plataforma de fuerza, GPS y control de fatiga neuromuscular.',
              'Cierre del recorrido LTAD completo del club: de la alfabetización motora de 10ma división a la transferencia y el rendimiento específico de 5ta y 4ta división.',
            ]}
          />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="06 — 📖 Fundamentos Fisiológicos y Biomecánicos (NSCA)" />
          <Titulo>06. Fundamentos Fisiológicos y Biomecánicos (NSCA)</Titulo>
          <P>
            Los capítulos anteriores establecieron que esta etapa deja de "construir capacidad"
            para pasar a "transferir capacidad" al rendimiento competitivo específico. Este
            capítulo desarrolla el fundamento bioenergético de esa transferencia, apoyado en el
            marco curricular de la NSCA (Haff &amp; Triplett, 2017): la especificidad metabólica
            del entrenamiento y el mecanismo periférico de la fatiga que ese entrenamiento debe
            aprender a manejar.
          </P>
          <Titulo>6.1 Especificidad metabólica y transferencia de potencia</Titulo>
          <P>
            El principio de especificidad metabólica establece que la adaptación al
            entrenamiento es máxima cuando el sistema energético predominante del estímulo de
            entrenamiento coincide con el sistema energético predominante de la demanda
            competitiva real. El fútbol de alto rendimiento exige, de forma repetida y en
            secuencia impredecible, potencia máxima de corta duración (sprints, saltos, duelos)
            sostenida sobre 90+ minutos — una combinación de demanda del sistema del fosfágeno
            (la acción puntual) y del sistema glucolítico/aeróbico (la capacidad de repetir esa
            acción con mínima degradación). En esta etapa, con la capacidad estructural de fuerza
            y RFD ya construida en las categorías anteriores (Manual 7ma y 6ta, Sección 1.4), el
            objetivo del entrenamiento deja de ser desarrollar esa capacidad desde cero y pasa a
            ser <span className="font-semibold text-union-charcoal">transferirla</span> —
            expresarla en gestos y velocidades específicas del fútbol competitivo, bajo el mismo
            perfil metabólico que exige el partido real, no bajo el perfil metabólico genérico
            de un programa de fuerza de gimnasio.
          </P>
          <Titulo>6.2 Fatiga periférica y acidosis metabólica</Titulo>
          <P>
            La fatiga periférica —a diferencia de la fatiga central, de origen en el sistema
            nervioso— ocurre directamente en el tejido muscular, y uno de sus mecanismos mejor
            documentados en el marco de la NSCA es la acumulación de metabolitos de la
            glucólisis anaeróbica, en particular iones de hidrógeno (H+), que reducen el pH
            intramuscular (acidosis metabólica). Esa acidificación interfiere directamente con el
            ciclo de los puentes cruzados de miosina-actina (Capítulo 6 del Manual Metodológico
            Oficial): reduce la sensibilidad al calcio de las proteínas contráctiles y la tasa a
            la que los puentes cruzados pueden ciclarse, disminuyendo tanto la fuerza máxima
            disponible como la velocidad de producción de esa fuerza — el correlato bioquímico
            exacto de por qué un jugador fatigado en el minuto 80 no solo "siente" cansancio,
            produce objetivamente menos fuerza y a menor velocidad que en el minuto 10. Entrenar
            la tolerancia a este mecanismo —sin comprometer la calidad de fuerza y potencia ya
            construida— es el objetivo metabólico específico de esta última etapa del recorrido
            LTAD del club.
          </P>
          <blockquote className="mt-3 border-l-4 border-union-red-600 bg-slate-50 py-2 pl-4 pr-3 text-[11px] italic leading-relaxed text-slate-600 break-inside-avoid">
            Concepto clave NSCA: transferir capacidad al rendimiento específico exige que el
            estímulo de entrenamiento respete la especificidad metabólica de la demanda
            competitiva, y que el jugador entrene explícitamente su tolerancia a la acidosis
            metabólica que produce la fatiga periférica — la misma acidificación que, a nivel del
            sarcómero, interfiere con el ciclo de los puentes cruzados que sostiene toda
            producción de fuerza.
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
              'Gathercole, R., Sporer, B., Stellingwerff, T., & Sleivert, G. (2015). Citado en material de estudio del Máster en Alto Rendimiento — Real Madrid ("Fuerza de Frenado como predictor de Fatiga"); referencia secundaria sin datos bibliográficos completos disponibles en la fuente original.',
              'Robles, J. I. (s.f.). Alteraciones en las fases del salto con contramovimiento (CMJ) como indicador de la fatiga neuromuscular en deportes de conjunto [Trabajo de Fin de Máster, Máster en Alto Rendimiento Deportivo]. Tutor: Javier Olaya Cuartero.',
              'Selye, H. (1936). A syndrome produced by diverse nocuous agents. Nature, 138, 32. Citado en material de estudio del Máster en Alto Rendimiento — Real Madrid.',
              'Skinner, J. S., & McLellan, T. H. (1980). The transition from aerobic to anaerobic metabolism. Research Quarterly for Exercise and Sport, 51(1), 234–248. Citado en material de estudio del Máster en Alto Rendimiento — Real Madrid.',
              'Verón, P. A. (2024). Altura del salto CMJ como indicador de niveles de fatiga y rendimiento neuromuscular [Tesis, Universidad Nacional de La Plata]. SEDICI. http://sedici.unlp.edu.ar/handle/10915/175514',
              'Wu, P.-Y., Sterkenburg, N., Everett, K., Chapman, D. W., White, N., & Mengersen, K. (2019). Predicting fatigue using countermovement jump force–time signatures. PLoS ONE, 14(7), e0219292. https://doi.org/10.1371/journal.pone.0219292',
              'Yoshida, N., Hornsby, W. G., Sole, C. J., Sato, K., & Stone, M. H. (2024). Effect of neuromuscular fatigue on the countermovement jump characteristics: Basketball-related high-intensity exercises. Journal of Strength & Conditioning Research. https://pubmed.ncbi.nlm.nih.gov/37889855/',
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
          Manual LTAD — 5ta y 4ta · {NOMBRE_AREA}
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
          Manual Metodológico · Tomo 4 de la colección LTAD
        </p>
        <h1 className="text-4xl font-black leading-tight text-union-charcoal">Transferencia y Rendimiento</h1>
        <p className="mt-2 text-lg font-semibold text-slate-500">5ta y 4ta División (18 a 20 años)</p>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
          Maduración biológica completa y transición al plantel de Reserva/Primera:
          transferencia de la fuerza a la velocidad y la potencia, plataformas de fuerza,
          monitoreo de fatiga neuromuscular y Ejercicios VITAMINA individualizados cruzando
          fuerza y GPS.
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
  { numero: '01', titulo: 'Cualidades de la Edad (18-20 años)' },
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
      <P>
        Este tomo tiene una diferencia relevante respecto a los tres anteriores: en esta etapa el
        material de la carpeta "Máster en Alto Rendimiento" (Real Madrid) sí resulta directamente
        aplicable, porque 18-20 años corresponde a maduración biológica completa.
      </P>
      <ol className="mt-2 flex flex-col gap-2">
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            1. Fuente primaria verificada — Pablo Añon (2026):{' '}
          </span>
          aporta principalmente el cierre conceptual del modelo LTAD y del modelo YPD.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            2. Fuente primaria verificada — Máster en Alto Rendimiento (Real Madrid):{' '}
          </span>
          se citan el propio Trabajo de Fin de Máster del autor (Robles, s.f.) sobre CMJ y fatiga
          neuromuscular, con su bibliografía original verificada, y el material de fisiología y
          periodización de la subcarpeta "4) La base del conocimiento en el deporte de alto
          rendimiento".
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            3. Marco conceptual de consenso científico —{' '}
          </span>
          la aplicación específica de los Ejercicios VITAMINA cruzando perfil de fuerza con datos
          de GPS se presenta alineada con la Sección 2.2 del Manual Metodológico Oficial.
        </li>
      </ol>
    </section>
  )
}

