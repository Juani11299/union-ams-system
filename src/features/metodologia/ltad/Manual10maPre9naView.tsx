import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NOMBRE_AREA, FIRMA_AUTOR } from '@/constants/branding'

/**
 * Manual Metodológico — Etapa de Alfabetización y Cimientos (10ma y Pre 9na
 * división). Versión maquetada 1-a-1 sobre el contenido académico redactado
 * en `docs/Manual_10ma_Pre9na.md` (no es un resumen — es ese texto
 * distribuido en hojas A4). Documento digital exportable a PDF vía
 * `window.print()`, reutilizando estrictamente la arquitectura de impresión
 * A4 de `ManualFuerzaView.tsx` / `MetodologiaIsometriaView.tsx`.
 */
export function Manual10maPre9naView() {
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
          <span className="text-sm font-medium">📗 Etapa de Alfabetización y Cimientos — 10ma y Pre 9na</span>
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
          <Encabezado eyebrow="01 — Cualidades de la Edad (12-13 años)" />
          <Titulo>1.1 Ubicación biológica: la etapa pre-PHV</Titulo>
          <P>
            Lo primero que un entrenador de 10ma y Pre 9na división tiene que desterrar es la
            idea de que "12-13 años" es información suficiente para diseñar un entrenamiento. La
            edad cronológica es apenas el dato de partida — lo que realmente determina qué puede
            y qué no puede hacer un jugador de esta franja es su edad biológica, es decir, su
            grado real de maduración (Añon, 2026). Dos jugadores de exactamente 13 años pueden
            presentar estatus madurativos tan distintos como "pre-púber, maduración tardía" y
            "pospúber, maduración temprana" (Malina, Bouchard, &amp; Bar-Or, 2004) — con
            diferencias sustanciales en talla, masa muscular, coordinación y tolerancia a la
            carga que ningún calendario puede predecir.
          </P>
          <P>
            Para la enorme mayoría del plantel de 10ma y Pre 9na, 12-13 años ubica al jugador en
            la fase pre-PHV (previa al pico de velocidad de crecimiento): el PHV en varones
            ocurre, en promedio, alrededor de los 14 años, con una variabilidad inter-sujeto de
            entre los 12 y los 16 años (Añon, 2026; Baxter-Jones &amp; Sherar, 2007). La enorme
            mayoría de nuestros jugadores de esta etapa todavía no entraron en el estirón de
            crecimiento — están en la ventana previa, la que el modelo Youth Physical
            Development (YPD) de Lloyd y Oliver (2012) caracteriza como "años pre-PHV".
          </P>
          <Titulo>1.2 Maduración ósea: qué está pasando con el esqueleto</Titulo>
          <P>
            El hueso largo tiene una zona de crecimiento activo —el cartílago de crecimiento o
            "fisis"— donde los condrocitos proliferan y se calcifican progresivamente. A los
            12-13 años esa zona sigue mayoritariamente abierta. Esto históricamente alimentó uno
            de los mitos más dañinos del entrenamiento de fuerza en niños: que levantar
            sobrecarga "cierra" el cartílago de crecimiento y detiene la talla. Ese mito puede
            rastrearse a un trabajo puntual de Kato e Ishiko (1964) sobre niños japoneses que
            transportaban leña y carbón en condiciones de trabajo extremo y desnutrición
            proteica — sin relación alguna con un programa de fuerza supervisado (Añon, 2026;
            Cappa, 2019).
          </P>
          <P>
            La evidencia es consistente en la dirección contraria: el entrenamiento con
            sobrecarga bien dosificado es un estímulo positivo para el tejido óseo (Añon, 2026,
            citando a Blimkie, 2003, y Lloyd et al., 2014). Estudios longitudinales comparando
            niños activos e inactivos sugieren que la actividad física regular no afecta ni
            atenúa la talla final ni el tiempo del PHV (Malina, 1994; Malina, 2006), y que la
            actividad física durante el crecimiento aumenta la densidad mineral ósea entre un
            10% y un 20% en los huesos sometidos a sobrecarga (Añon, 2026).
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="01 — Cualidades de la Edad (12-13 años)" />
          <P>
            El estudio de Sadres, Eliakim, Constantini, Lidor y Falk (2001) siguió durante dos
            años a niños de 9,2 años que entrenaron fuerza dos veces por semana, con cargadas,
            sentadillas, peso muerto y arranque bajo supervisión, comenzando con bastón y barra
            de 8 kg durante los primeros tres meses exclusivamente para técnica. No se
            registraron efectos negativos sobre el crecimiento. Ese diseño —bastón antes que
            barra, técnica antes que carga, supervisión permanente— es el mismo criterio
            metodológico que este tomo adopta para 10ma y Pre 9na.
          </P>
          <Titulo>1.3 El sistema nervioso central: la ventana de mayor plasticidad neural</Titulo>
          <P>
            La curva de Scammon muestra que el tejido neural alcanza el 95% de su desarrollo
            total ya a los 7 años, muy por delante de la curva de crecimiento general del cuerpo
            (Añon, 2026, citando a Malina, Bouchard, &amp; Bar-Or, 2004). La consecuencia
            práctica: "los niños tienen un sistema nervioso altamente apto para desarrollar
            habilidades coordinativas y de fuerza desde una edad muy temprana, lo cual se ve
            favorecido por un crecimiento corporal moderado" (Añon, 2026).
          </P>
          <P>
            12-13 años, entonces, no es una edad de sistema nervioso "inmaduro" que haya que
            esperar — es, en términos neurales, prácticamente un sistema adulto alojado en un
            cuerpo que todavía no completó su desarrollo estructural. El jugador puede aprender
            patrones de movimiento complejos con una eficiencia que no va a volver a tener de la
            misma forma más adelante — pero su tejido todavía no está preparado para tolerar las
            cargas altas que sí va a poder tolerar dentro de 2 o 3 años. El modelo YPD de Lloyd y
            Oliver (2012) formaliza esta idea: los años pre-PHV son un período de adaptación
            predominantemente neural, en contraste con los años post-PHV, donde las adaptaciones
            combinan lo neural con lo hormonal.
          </P>
          <Titulo>1.4 Perfil cognitivo, emocional y social</Titulo>
          <P>
            El modelo LTAD identifica el desarrollo intelectual, emocional y moral como uno de
            sus factores clave: los niños se desarrollan a ritmos diferentes, lo que significa
            que la heterogeneidad de esta etapa no es solo física. Esta franja equivale a la
            etapa "Aprender a entrenar" del modelo LTAD, descripta como "la edad dorada para
            aprender habilidades deportivas fundamentales", recomendando explorar múltiples
            patrones de movimiento antes de la especialización (Añon, 2026).
          </P>
          <Nota>
            La literatura compilada en el Máster en Alto Rendimiento (Real Madrid, sesión de
            Eduardo López Martínez) advierte que cuanto menor es la edad del sujeto, menor es la
            capacidad predictiva de cualquier test de selección (Lidor et al., 2009), que las
            variables asociadas a ventaja competitiva temprana pueden no ser las mismas que
            explican el rendimiento adulto (Baker et al., 2018), y que el desarrollo no es
            lineal (Barraclough et al., 2022). Ningún resultado de esta etapa debe usarse para
            etiquetar de forma definitiva a un jugador.
          </Nota>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="02 — Objetivos del Área de Fuerza" />
          <Titulo>2.1 Objetivos primarios</Titulo>
          <Subtitulo>a) Alfabetización motora</Subtitulo>
          <P>
            El concepto central del modelo LTAD es la alfabetización física — moverse con
            competencia y confianza en diferentes contextos (Añon, 2026, citando a Balyi et al.,
            2013). En 10ma y Pre 9na, el objetivo primario no es "hacer más fuerte" al jugador en
            el sentido de aumentar cargas — es enseñarle a moverse bien: sentadilla, bisagra de
            cadera, empuje, tracción y rotación con calidad técnica objetivamente verificable,
            antes de cualquier consideración de carga externa.
          </P>
          <Subtitulo>b) Control del propio peso corporal</Subtitulo>
          <P>
            Antes de manipular una carga externa, el jugador tiene que demostrar control total
            de su propio peso corporal en cada patrón fundamental — sentadilla profunda con
            alineación de rodilla estable, bisagra de cadera sin flexión lumbar compensatoria,
            empuje y tracción con escápula estabilizada, aterrizaje controlado sin colapso de
            rodilla en valgo.
          </P>
          <Subtitulo>c) Higiene postural</Subtitulo>
          <P>
            La supervisión constante que describe el estudio de Sadres et al. (2001) tiene como
            propósito explícito reducir el riesgo de lesiones y prevenir malos hábitos motores.
            A los 12-13 años se están consolidando patrones de postura que, si se automatizan
            mal, son mucho más difíciles de corregir en categorías posteriores.
          </P>
          <Titulo>2.2 Objetivos secundarios</Titulo>
          <Lista
            items={[
              'Adherencia y cultura de gimnasio: que el espacio de entrenamiento de fuerza sea parte natural y positiva de ser futbolista, no una obligación aislada de la pelota.',
              'Diversificación motriz: variedad de patrones, implementos y contextos en lugar de especialización temprana (Añon, 2026, citando a Côté et al., 2009), dado que la especialización temprana se asocia con mayor riesgo de lesiones por sobreuso, burnout y abandono deportivo (Añon, 2026, citando a Lloyd et al., 2015b, y Côté, 1999).',
              'Prevención básica: educación temprana del gesto de aterrizaje y activación general, sin sobrecarga individualizada (que corresponde a etapas posteriores).',
              'Detección honesta de asimetrías, exclusivamente con fines correctivos, nunca de descarte o selección.',
            ]}
          />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="03 — Metodología de Aprendizaje" />
          <Titulo>3.1 Cómo se le enseña a un chico de esta edad</Titulo>
          <P>
            La pregunta metodológica central no es "cuánto peso puede levantar un chico de 12
            años" — es "cómo aprende un chico de 12 años a moverse bien". La respuesta es
            consistente: mediante estímulos variados, con alto componente lúdico, alta frecuencia
            de exposición y bajo volumen de carga estructurada, en un contexto supervisado que
            corrija el gesto antes de que se automatice mal (Añon, 2026). El modelo YPD de Lloyd
            y Oliver (2012) ubica a la franja pre-PHV en un nivel de estructura de entrenamiento
            todavía moderado, no en el "muy alta estructura" que corresponde recién a la
            adolescencia avanzada.
          </P>
          <Titulo>3.2 El juego y la exploración del movimiento</Titulo>
          <P>
            El propio marco LTAD ubica a esta franja como continuación directa de las etapas
            "Comienzo Activo" y "FUNdamentos" — construidas alrededor de la palabra "diversión"
            como principio organizador (Añon, 2026). Trasladado al gimnasio, esto no significa
            que "no haya estructura" — significa que la exploración del movimiento (carreras con
            cambios de dirección, saltos multidireccionales, trepas, lanzamientos, juegos de
            equilibrio y reacción) debe convivir con el trabajo técnico de los patrones
            fundamentales, no ser reemplazada por él. La fuerza muscular ha sido identificada
            como un determinante clave del rendimiento motor, y su desarrollo temprano se asocia
            con reducción del riesgo de lesiones (Añon, 2026, citando a Faigenbaum et al., 2009,
            y Lloyd et al., 2016).
          </P>
          <Titulo>3.3 La prioridad absoluta de la técnica sobre la carga externa</Titulo>
          <P>
            Este es el principio no negociable de todo el tomo, apoyado en tres pilares: el
            neural (la ventana de plasticidad de esta edad hace que el aprendizaje motor sea
            excepcionalmente eficiente), el estructural (el esqueleto no completó su osificación
            y el sistema hormonal todavía no aportó la masa muscular ni los cambios
            arquitectónicos del sistema musculotendinoso disponibles después del PHV — Añon,
            2026, citando a Beunen &amp; Malina, 2008) y el del modelo YPD (Lloyd y Oliver, 2012,
            son explícitos en que la fuerza debe ser prioridad en todas las etapas, pero con
            "contenidos, medios y objetivos distintos" — en la etapa pre-puberal, ese contenido es
            coordinación intermuscular, control postural y técnica, no carga).
          </P>
          <Nota>
            En la práctica, el estándar de esta categoría es: ningún jugador avanza de bloque de
            progresión (peso corporal → banda/bastón → carga externa liviana) hasta demostrar
            dominio técnico verificable en el bloque anterior, sin excepción por edad, posición
            o jerarquía dentro del plantel.
          </Nota>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Desarrollo de la Fuerza: Cómo Atacarla" />
          <Titulo>4.1 Adaptaciones neurales vs. estructurales en esta edad</Titulo>
          <P>
            El punto de partida conceptual es la tabla del modelo YPD de Lloyd y Oliver (2012),
            reproducida por Añon (2026), que organiza el desarrollo físico juvenil en función del
            estatus madurativo, no de la edad cronológica. La franja pre-PHV se caracteriza como
            "predominantemente neural (relacionado con la edad)", en contraposición a los años
            post-PHV, donde la adaptación combina lo neural con lo hormonal. Cita textual:{' '}
            <span className="italic">
              "antes de la adolescencia, las adaptaciones al entrenamiento tendrán una base
              predominantemente neural, mientras que, una vez alcanzada la pubertad, las
              adaptaciones también pueden atribuirse a cambios morfológicos estimulados por el
              aumento de andrógenos circulantes que interactúan con los estímulos del
              entrenamiento"
            </span>{' '}
            (Añon, 2026, citando a Lloyd &amp; Oliver, 2012).
          </P>
          <P>
            Consecuencia práctica directa: el trabajo de fuerza en 10ma y Pre 9na no busca
            hipertrofia — no puede buscarla, porque el sustrato hormonal todavía no está
            disponible en la magnitud necesaria — busca coordinación intermuscular, reclutamiento
            eficiente de unidades motoras y sincronización neural. Interpretar de forma lineal
            que "la ventana óptima para entrenar fuerza es después del PHV" es, en palabras del
            propio libro, un error, porque esa lectura "soslaya las adaptaciones neurales que
            permiten las ganancias de fuerza previo al PVC, y que junto con el desarrollo técnico
            son fundamentales para luego poder aprovechar el impulso hormonal" (Añon, 2026).
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Desarrollo de la Fuerza: Cómo Atacarla" />
          <Titulo>4.2 Patrones fundamentales de movimiento</Titulo>
          <P>
            Alineado con la taxonomía ya establecida en la Sección 3 del Manual Metodológico
            Oficial, el trabajo técnico de 10ma y Pre 9na se organiza en cinco patrones
            fundamentales — marco de práctica profesional estándar en fuerza y acondicionamiento
            juvenil, no una cita textual de un documento específico.
          </P>
          <Tabla
            columnas={['Patrón', 'Ejemplo de progresión en esta etapa', 'Objetivo técnico']}
            filas={[
              [
                'Empuje',
                'Flexión de brazos asistida → push-up completo → empuje con banda',
                'Estabilidad escapular, alineación de muñeca/codo, control del core en el bloqueo',
              ],
              [
                'Tracción',
                'Remo invertido con banda → dominada asistida con banda',
                'Retracción escapular activa, evitar compensación con trapecio superior',
              ],
              [
                'Dominancia de rodilla',
                'Sentadilla con peso corporal → sentadilla con bastón → goblet squat liviano',
                'Profundidad completa, rodilla alineada con la punta del pie, talón en el piso',
              ],
              [
                'Dominancia de cadera',
                'Bisagra con bastón (3 puntos de contacto) → peso muerto rumano con carga mínima',
                'Columna neutra, flexión de cadera sin compensación lumbar',
              ],
              [
                'Anti-movimientos de core',
                'Plancha frontal/lateral → dead bug → pallof press con banda liviana',
                'Resistir extensión, flexión lateral o rotación del tronco — no producirlas',
              ],
            ]}
          />
          <P>
            El uso sistemático del bastón como herramienta de enseñanza (no de carga) es central:
            permite verificar en tiempo real la alineación de columna en la bisagra de cadera (los
            tres puntos de contacto —cabeza, dorsal alto y sacro— deben mantenerse pegados durante
            todo el recorrido) sin que el jugador gestione al mismo tiempo una carga externa. Este
            mismo criterio —bastón antes que barra, exactamente como en Sadres et al. (2001)— es
            el que adopta esta categoría para introducir cualquier patrón nuevo.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Desarrollo de la Fuerza: Cómo Atacarla" />
          <Titulo>4.3 Introducción a la isometría básica (Yielding)</Titulo>
          <P>
            Tal como establece la Sección 3.1 del Manual Metodológico Oficial, la isometría
            Yielding es la acción en la que el atleta resiste una carga externa —o su propio peso
            corporal— sin ceder, absorbiendo fuerza sin desplazamiento articular. En 10ma y Pre
            9na, esta herramienta se utiliza con un propósito específicamente pedagógico: enseñar
            postura y enseñar a frenar, no todavía desarrollar tolerancia a la fuerza excéntrica
            bajo carga significativa.
          </P>
          <Lista
            items={[
              'Sostenes isométricos de posición (3-5 segundos en el punto más bajo de una sentadilla o de máxima flexión de cadera) para que el jugador verifique su propia alineación en el punto crítico del movimiento.',
              'Aterrizajes controlados con sostén (saltar desde altura mínima y sostener 2-3 segundos, sin colapso de rodilla en valgo), como introducción de bajísimo impacto a la mecánica de frenado.',
              'Plancha y variantes anti-movimiento como forma introductoria de isometría de core.',
            ]}
          />
          <P>
            En ningún caso se introduce en esta etapa la isometría Overcoming contra resistencia
            inamovible con intención máxima — esa herramienta corresponde a etapas posteriores.
            En 10ma y Pre 9na, el propósito de la isometría es exclusivamente educativo: postura,
            alineación y frenado seguro.
          </P>
          <Titulo>4.4 Progresión de cargas</Titulo>
          <P>
            La progresión de cargas sigue un único criterio de avance: dominio técnico
            demostrado, nunca calendario ni edad. Secuencia estándar: (1) peso corporal, punto de
            partida obligatorio para todo patrón nuevo; (2) bandas elásticas, como resistencia
            añadida o como asistencia; (3) bastones, con función puramente técnica; (4)
            introducción paulatina a barras livianas, reservada a jugadores que ya demostraron
            dominio técnico completo, con carga inicial mínima (Sadres et al., 2001, usó 8 kg
            durante los primeros tres meses exclusivamente para consolidar técnica) e incremento
            siempre gradual, supervisado y condicionado a la calidad de movimiento.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="05 — Plan de Acción: Proyección LTAD" />
          <Titulo>5.1 Corto plazo (1-3 meses)</Titulo>
          <Lista
            items={[
              'Evaluación diagnóstica funcional: screening de movimiento en los cinco patrones fundamentales para todo el plantel, con propósito exclusivamente correctivo — nunca de selección o descarte.',
              'Corrección de asimetrías severas: identificación de compensaciones marcadas entre lados y patrones compensatorios evidentes (valgo de rodilla, pérdida de columna neutra en la bisagra).',
              'Aprendizaje de posturas base: alineación correcta en los tres puntos de contacto del bastón y profundidad de sentadilla con peso corporal.',
            ]}
          />
          <Titulo>5.2 Mediano plazo (3-6 meses)</Titulo>
          <Lista
            items={[
              'Consolidación de la técnica en patrones básicos: los cinco patrones ejecutados con peso corporal de forma técnicamente sólida y repetible, sin corrección verbal constante.',
              'Creación del hábito y la "cultura de gimnasio": el espacio de trabajo de fuerza integrado como parte natural de la rutina del jugador.',
              'Introducción sistemática de isometría Yielding educativa, como puente hacia el trabajo de frenado que se intensificará en categorías posteriores.',
            ]}
          />
          <Titulo>5.3 Largo plazo (6-12 meses)</Titulo>
          <Lista
            items={[
              'Preparación estructural y técnica de los tejidos para soportar el aumento de carga e intensidad de la etapa siguiente (8va y 7ma división).',
              'Introducción paulatina y ya consolidada de barras livianas para los jugadores que completaron la progresión completa.',
              'Transferencia del criterio de esta etapa —técnica antes que carga— como estándar internalizado al ingresar a 8va y 7ma división: el objetivo no es que el jugador de 13 años sea fuerte, es que llegue a los 14 años listo para volverse fuerte de forma segura.',
            ]}
          />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="06 — 📖 Fundamentos Fisiológicos y Biomecánicos (NSCA)" />
          <Titulo>06. Fundamentos Fisiológicos y Biomecánicos (NSCA)</Titulo>
          <P>
            Los capítulos anteriores justificaron la alfabetización motora en términos de
            entrenabilidad neural. Este capítulo suma el fundamento biomecánico complementario,
            apoyado en el marco curricular de la NSCA (Haff &amp; Triplett, 2017): durante el
            estirón puberal, el cuerpo del jugador no crece de forma proporcional ni sincronizada
            — y esa asincronía cambia literalmente las palancas con las que el sistema nervioso
            tiene que aprender a moverse.
          </P>
          <Titulo>6.1 Palancas biomecánicas en transformación</Titulo>
          <P>
            Un segmento óseo actúa, mecánicamente, como una palanca: la longitud de ese segmento
            determina el brazo de momento sobre el que un músculo aplica torque en la
            articulación. Durante el Pico de Velocidad de Crecimiento (PHV), los huesos largos
            —fémur, tibia— crecen en longitud a una velocidad mucho mayor que la del tronco, y de
            forma marcadamente más rápida que la capacidad del sistema neuromuscular de
            recalibrar la coordinación intermuscular necesaria para controlar esa nueva palanca.
            El resultado, ampliamente documentado en el marco curricular de la NSCA, es una
            ventana de torpeza motora transitoria (<span className="italic">adolescent awkwardness</span>):
            patrones que el jugador dominaba con su cuerpo anterior dejan de ejecutarse con la
            misma eficiencia, no por regresión de capacidad sino porque la relación entre
            longitud de palanca y fuerza muscular disponible cambió más rápido de lo que el
            control motor pudo recalibrar.
          </P>
          <Titulo>6.2 El cartílago de crecimiento como límite estructural real</Titulo>
          <P>
            A diferencia del adulto, el hueso de un jugador de 12-13 años conserva placas de
            crecimiento (cartílago epifisario) activas en los extremos de los huesos largos —el
            tejido responsable del propio crecimiento longitudinal, y estructuralmente más débil
            frente a cargas de cizallamiento y compresión axial repetida que el hueso maduro que
            eventualmente lo reemplaza. Es la razón biomecánica, no solo prudencial, por la que
            este manual (Capítulo 4) prioriza el dominio técnico del propio peso corporal por
            sobre la carga externa: cualquier sobrecarga axial alta aplicada sobre una palanca
            ósea todavía inmadura, con cartílago de crecimiento activo, expone al jugador a un
            riesgo estructural que no existe de la misma forma en categorías post-PHV.
          </P>
          <blockquote className="mt-3 border-l-4 border-union-red-600 bg-slate-50 py-2 pl-4 pr-3 text-[11px] italic leading-relaxed text-slate-600 break-inside-avoid">
            Concepto clave NSCA: la alfabetización motora de esta etapa no es una elección
            metodológica conservadora — es la respuesta biomecánica correcta a un cuerpo cuyas
            palancas óseas cambian de longitud más rápido de lo que el sistema nervioso puede
            recalibrar el control motor, sobre un tejido (cartílago de crecimiento) que todavía
            no tiene la resistencia estructural del hueso adulto.
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
              'Baker, J., et al. (2018). Citado en material del Máster en Alto Rendimiento — Real Madrid; referencia secundaria sin datos bibliográficos completos disponibles en la fuente.',
              'Balyi, I., & Way, R. (2009). The role of monitoring growth in Long-Term Athlete Development. Canadian Sport for Life.',
              'Balyi, I., Way, R., & Higgs, C. (2013). Long-term athlete development (1.ª ed.). Human Kinetics.',
              'Barraclough, S., et al. (2022). Citado en material del Máster en Alto Rendimiento — Real Madrid; referencia secundaria sin datos bibliográficos completos disponibles en la fuente.',
              "Baxter-Jones, A. (2017). Growth and maturation. In N. Armstrong & W. van Mechelen (Eds.), Oxford textbook of children's sport and exercise medicine (3.ª ed., pp. 13–23). Oxford University Press.",
              'Baxter-Jones, A., & Sherar, L. (2007). Growth and maturation. In N. Spurway & D. MacLaren (Eds.), Paediatric exercise physiology (1.ª ed., pp. 1–26). Elsevier.',
              'Behm, D., Faigenbaum, A., Falk, B., & Klentrou, P. (2008). Canadian Society for Exercise Physiology position paper: Resistance training in children and adolescents. Applied Physiology, Nutrition, and Metabolism, 33, 547–561.',
              'Beunen, G., & Malina, R. (2008). Growth and biologic maturation: Relevance to athletic performance. In H. Hebestreit & O. Bar-Or (Eds.), The young athlete (1.ª ed., pp. 3–17). Blackwell.',
              'Blimkie, C., & Hogler, W. (2003). Muscle-bone mutualism, mechanical loading and the mechanostat theory: A pediatric perspective. Revista Portuguesa de Ciências do Desporto, 3(2), 11–28.',
              'Cappa, D. (2019). Entrenamiento de sobrecarga en niños y jóvenes. En D. Cappa, Fisiología y entrenamiento neuromuscular (1.ª ed., pp. 349–404). Editorial Científica Universitaria de la Universidad Nacional de Catamarca.',
              'Committee on Sports Medicine and Fitness. (2001). Strength training by children and adolescents. Pediatrics, 107(4), 1470–1472.',
              'Côté, J. (1999). The influence of the family in the development of talent in sport. The Sport Psychologist, 13(4), 395–417. Citado en Añon, 2026.',
              'Côté, J., Lidor, R., & Hackfort, D. (2009). ISSP position stand: To sample or to specialize? International Journal of Sport and Exercise Psychology, 9, 7–17.',
              'Faigenbaum, A., Kraemer, W., Blimkie, C., Jeffreys, I., Micheli, L., Nitka, M., et al. (2009). Youth resistance training: Updated position statement paper from the NSCA. Journal of Strength and Conditioning Research, 23(5), 60–79.',
              'Ford, P., De Ste Croix, M., Lloyd, R., Meyers, R., Moosavi, M., Oliver, J., & Williams, C. (2011). The Long-Term Athlete Development model: Physiological evidence and application. Journal of Sports Sciences, 29(4), 389–402.',
              'Iglesias-Camaño, M., Padrón-Cabo, A., & García-Soidán, J. I. (2016). Estudio del efecto de la edad relativa en jugadores de voleibol de nivel mundial. Citado en material del Máster en Alto Rendimiento — Real Madrid.',
              'Issurin, V., et al. (2019). Citado en material del Máster en Alto Rendimiento — Real Madrid; referencia secundaria sin datos bibliográficos completos disponibles en la fuente.',
              "Kato, S., & Ishiko, T. (1964). Obstructed growth of children's bones due to excessive labor in remote corners. En Proceedings of the International Congress of Sport Sciences.",
              'Lidor, R., et al. (2009). Citado en material del Máster en Alto Rendimiento — Real Madrid; referencia secundaria sin datos bibliográficos completos disponibles en la fuente.',
              'Lloyd, R., Cronin, J., Faigenbaum, A., Haff, G., Howard, R., Kraemer, W., & Oliver, J. (2016). NSCA position statement on Long-Term Athletic Development. Journal of Strength and Conditioning Research, 30(6), 1491–1509.',
              'Lloyd, R. S., & Oliver, J. L. (2012). The youth physical development model: A new approach to long-term athletic development. Strength and Conditioning Journal, 34(3), 61–72.',
              'Lloyd, R. S., Oliver, J. L., Faigenbaum, A. D., Myer, G. D., & De Ste Croix, M. (2014). Chronological age vs. biological maturation. Journal of Strength and Conditioning Research, 28(5), 1454–1464.',
              'Lloyd, R., Oliver, J., Faigenbaum, A., Howard, R., De Ste Croix, M., Williams, C., et al. (2015b). Long-term athletic development, part 2: Barriers to success and potential solutions. Journal of Strength and Conditioning Research, 29(5), 1451–1464.',
              'Malina, R. (1994). Physical activity and training: Effects on stature and the adolescent growth spurt. Medicine and Science in Sports and Exercise, 759–766.',
              'Malina, R. (2006). Weight training in youth—growth, maturation, and safety: An evidence-based review. Clinical Journal of Sport Medicine, 16, 478–487.',
              'Malina, R., Baxter-Jones, A., Armstrong, N., Beunen, G., Caine, D., Daly, R., et al. (2013). Role of intensive training in the growth and maturation of artistic gymnasts. Sports Medicine, 43, 783–802.',
              'Malina, R., Bouchard, C., & Bar-Or, O. (2004). Growth, maturation and physical activity (2.ª ed.). Human Kinetics.',
              'Sadres, E., Eliakim, A., Constantini, N., Lidor, R., & Falk, B. (2001). The effect of long-term resistance training on anthropometric measures, muscle strength, and self concept in pre-pubertal boys. Pediatric Exercise Science, 13, 357–372.',
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
          Manual LTAD — 10ma y Pre 9na · {NOMBRE_AREA}
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
          Manual Metodológico · Tomo 1 de la colección LTAD
        </p>
        <h1 className="text-4xl font-black leading-tight text-union-charcoal">
          Etapa de Alfabetización y Cimientos
        </h1>
        <p className="mt-2 text-lg font-semibold text-slate-500">10ma y Pre 9na División (12 y 13 años)</p>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
          Perfil fisiológico, biomecánico, neural y cognitivo del jugador pre-PHV; objetivos de
          alfabetización motora; metodología de aprendizaje basada en el juego; desarrollo de la
          fuerza sobre patrones fundamentales e isometría básica; y proyección LTAD a corto,
          mediano y largo plazo.
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

function Tabla({ columnas, filas }: { columnas: string[]; filas: string[][] }) {
  return (
    <table className="mt-3 w-full table-fixed border-collapse text-[10px] leading-snug break-inside-avoid">
      <thead>
        <tr>
          {columnas.map((c, i) => (
            <th
              key={i}
              className="border border-slate-200 bg-slate-50 p-1.5 text-left font-bold uppercase tracking-wide text-union-red-600"
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((fila, i) => (
          <tr key={i}>
            {fila.map((celda, j) => (
              <td key={j} className="border border-slate-200 p-1.5 align-top text-slate-600">
                {celda}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
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
  { numero: '01', titulo: 'Cualidades de la Edad (12-13 años)' },
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
        Este documento distingue explícitamente tres niveles de cita, para no mezclar rigor
        verificado con conocimiento general del campo:
      </P>
      <ol className="mt-2 flex flex-col gap-2">
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            1. Fuente primaria verificada — Pablo Añon (2026):{' '}
          </span>
          lectura completa del libro <span className="italic">Entrenamiento de la Fuerza en
          Niños y Adolescentes</span>, incluyendo sus capítulos de crecimiento, maduración,
          mitos y realidades, y desarrollo atlético a largo plazo.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            2. Fuente primaria verificada — Máster en Alto Rendimiento (Real Madrid):{' '}
          </span>
          revisión exhaustiva de la carpeta de Drive completa. La única sesión con contenido
          directamente aplicable a esta franja etaria es la de Eduardo López Martínez.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            3. Marco conceptual de consenso científico —{' '}
          </span>
          la taxonomía de patrones de movimiento y la aplicación pedagógica de la isometría
          Yielding corresponden a marco de práctica profesional estándar en fuerza y
          acondicionamiento, alineado con la Sección 3 del Manual Metodológico Oficial.
        </li>
      </ol>
    </section>
  )
}

