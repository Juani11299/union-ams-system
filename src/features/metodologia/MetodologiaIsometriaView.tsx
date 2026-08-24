import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NOMBRE_AREA, FIRMA_AUTOR } from '@/constants/branding'
import { DiagramaBiomecanico, type TipoDiagramaBiomecanico } from '@/components/ui/DiagramaBiomecanico'

/**
 * Manual de Isometría Avanzada — Escuela de Movimiento e Isometría. Libro de
 * texto interno maquetado 1-a-1 sobre `docs/Manual_Isometria_Avanzada.md`
 * (no es un resumen — es ese texto distribuido en hojas A4). Las figuras
 * biomecánicas del documento (marcadas `[IMAGEN: ...]` en el Markdown, por
 * no depender de imágenes externas ni de derechos de autor de terceros) se
 * renderizan acá como `<DiagramaBiomecanico>`, un SVG dibujado a mano.
 * Documento exportable a PDF vía `window.print()`, reutilizando la
 * arquitectura de impresión A4 del resto de los manuales del club.
 */
export function MetodologiaIsometriaView() {
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
          <span className="text-sm font-medium">📘 Isometría Avanzada — Escuela de Movimiento</span>
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
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="Nota Metodológica sobre las Fuentes Citadas" />
          <NotaFuentes />
        </Hoja>

        {/* ================= CAPÍTULO 1 — FISIOLOGÍA Y ARQUITECTURA MUSCULAR ================= */}

        <Hoja>
          <Encabezado eyebrow="01 — Fisiología y Arquitectura Muscular" />
          <Titulo>1.1 La isometría como estímulo arquitectónico específico</Titulo>
          <P>
            El error conceptual más extendido sobre la isometría es tratarla como un estímulo
            neuromuscular homogéneo —"hacer fuerza sin moverse"— como si toda contracción
            isométrica produjera el mismo tipo de adaptación independientemente del ángulo, la
            longitud muscular o la intención con la que se ejecuta. La evidencia contemporánea
            contradice esa simplificación: la isometría es, en rigor, una familia de estímulos
            que produce adaptaciones arquitectónicas distintas —y a veces opuestas— según tres
            variables de programación: el ángulo articular en el que se entrena, la longitud
            muscular relativa (elongada o acortada) en ese ángulo, y la intención neuromuscular
            con la que se ejecuta la contracción (Oranchuk et al., 2019). Este capítulo desarrolla,
            célula por célula y reflejo por reflejo, por qué esas tres variables importan.
          </P>
          <Titulo>1.2 Sarcomerogénesis y longitud del fascículo muscular</Titulo>
          <P>
            El sarcómero es la unidad contráctil fundamental del músculo esquelético: la porción
            del miofilamento comprendida entre dos líneas Z consecutivas, donde los filamentos
            gruesos de miosina y los delgados de actina se interdigitan y generan fuerza mediante
            el ciclo de puentes cruzados. Un fascículo muscular —el haz de fibras agrupado por el
            perimisio— está compuesto, en su eje longitudinal, por sarcómeros dispuestos en
            serie. La longitud total del fascículo es, entonces, directamente proporcional a la
            cantidad de sarcómeros en serie que lo componen.
          </P>
          <P>
            Este dato anatómico es la clave para entender una de las adaptaciones más relevantes
            del entrenamiento isométrico: el músculo puede responder agregando sarcómeros en
            serie —sarcomerogénesis—, lo que alarga el fascículo. Esta adaptación depende de la
            longitud muscular relativa en la que se aplica la tensión: el entrenamiento
            isométrico en posiciones de elongación muscular (ángulo articular abierto) es el que
            tiende a estimular la adición de sarcómeros en serie, un fenómeno emparentado con el
            del entrenamiento excéntrico en longitud larga (Oranchuk et al., 2019).
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="01 — Fisiología y Arquitectura Muscular" />
          <P>
            El resultado funcional de un fascículo más largo es doble: primero, desplaza hacia la
            derecha el ángulo de pico de fuerza del músculo —puede producir su fuerza máxima en
            una posición más elongada—; segundo, mejora la tolerancia mecánica del tejido en esas
            posiciones de riesgo, base fisiológica de por qué se recomienda el trabajo isométrico
            en longitud larga para grupos musculares con alta incidencia de lesión por elongación.
          </P>
          <P>
            En el extremo opuesto, el entrenamiento isométrico en posiciones de acortamiento
            (ángulo articular cerrado) no estimula de la misma manera la adición de sarcómeros en
            serie: produce una ganancia de fuerza marcadamente específica al ángulo entrenado, con
            escasa transferencia a otros rangos articulares (Oranchuk et al., 2019) — el mecanismo
            que explica, en última instancia, por qué la Teoría de Vectores de Fuerza (Capítulo 2)
            insiste en prescribir cada ejercicio en el ángulo exacto del gesto que se busca
            mejorar.
          </P>
          <Titulo>1.3 Ángulo de penación y el compromiso fuerza-velocidad</Titulo>
          <P>
            El ángulo de penación es el ángulo formado entre la orientación de las fibras
            musculares y el eje de la aponeurosis. Un músculo con fibras penadas puede empaquetar
            más sarcómeros en paralelo dentro de la misma sección transversal, comparado con un
            músculo de fibras paralelas al eje de tracción. El entrenamiento isométrico de alta
            tensión sostenida tiende a incrementar este ángulo.
          </P>
          <P>
            La consecuencia es un compromiso clásico en fisiología muscular: a mayor ángulo de
            penación, mayor la cantidad de sarcómeros en paralelo —favorece la fuerza máxima—
            pero menor la proporción de fuerza de cada fibra transmitida en línea recta al
            tendón, y menor la velocidad de acortamiento efectiva. Un ángulo de penación mayor
            construye un músculo más orientado a la fuerza máxima y menos a la velocidad de
            contracción pura — por eso el trabajo isométrico de fuerza máxima (Capítulo 3) y el
            trabajo de velocidad pura no son estímulos intercambiables, sino complementarios.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="01 — Fisiología y Arquitectura Muscular" />
          <Titulo>1.4 Rigidez tendinosa (stiffness): colágeno, entrecruzamientos y transmisión de fuerza</Titulo>
          <P>
            El tendón no es un cable inerte: es tejido conectivo dinámico compuesto
            mayoritariamente por fibras de colágeno tipo I organizadas en haces paralelos,
            embebidas en una matriz de proteoglicanos. Su rigidez —cuánto se deforma por unidad
            de fuerza aplicada— es una propiedad mecánica entrenable. La tensión isométrica alta
            y sostenida promueve, con el tiempo, mayor densidad de entrecruzamientos entre las
            fibrillas de colágeno y, en adaptaciones más crónicas, mayor área de sección
            transversal del tendón.
          </P>
          <P>
            La unidad músculo-tendón funciona como un sistema de resortes en serie: cuando el
            músculo se contrae, parte de esa contracción se invierte en estirar el componente
            elástico en serie (el tendón) antes de que la fuerza se transmita al hueso. Un tendón
            más rígido "pierde" menos tiempo en esa fase — se traduce en un menor retardo
            electromecánico, una mejora directa de la Tasa de Desarrollo de la Fuerza (RFD) que
            desarrolla la Sección 1.2 del Manual Metodológico Oficial: producir fuerza más rápido,
            la cualidad que determina el resultado de acciones que duran menos de 300ms de
            contacto con el suelo.
          </P>
          <Titulo>1.5 Reclutamiento de unidades motoras de alto umbral (principio de Henneman)</Titulo>
          <P>
            Una unidad motora es el conjunto formado por una motoneurona alfa y todas las fibras
            que inerva. El principio de tamaño de Henneman establece que, ante demanda creciente
            de fuerza, las unidades motoras se reclutan en orden predecible: primero las de menor
            umbral (fibras Tipo I, lentas), y progresivamente las de mayor umbral (fibras Tipo II,
            rápidas, mayor capacidad de fuerza y potencia).
          </P>
          <Nota>
            Un gesto dinámico submáximo puede no reclutar plenamente las unidades de alto umbral.
            La contracción isométrica de intención voluntaria máxima es, en cambio, el tipo de
            estímulo que exige ese reclutamiento completo: al no existir movimiento articular ni
            límite de velocidad, el sistema nervioso puede sostener la demanda de máxima fuerza
            durante varios segundos — la base fisiológica del bloque de Overcoming Isometrics de
            máxima intención del Capítulo 3.
          </Nota>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="01 — Fisiología y Arquitectura Muscular" />
          <Titulo>1.6 Cortical drive y activación voluntaria</Titulo>
          <P>
            Existe una brecha entre la fuerza que un músculo es fisiológicamente capaz de producir
            (medible mediante estimulación eléctrica externa superpuesta a una contracción
            voluntaria máxima) y la fuerza que ese sujeto logra expresar de forma voluntaria. Esa
            brecha se explica en gran parte por la eficiencia del cortical drive — la capacidad de
            la corteza motora y las vías descendentes de reclutar y sincronizar el conjunto
            completo de unidades motoras disponibles.
          </P>
          <P>
            El entrenamiento isométrico de alta intensidad sostenido se asocia con una mejora de
            esta activación voluntaria: el sistema nervioso central "aprende" a reclutar una
            proporción mayor de su propio potencial contráctil disponible, sin que
            necesariamente haya cambiado el tamaño del tejido. Es una adaptación puramente
            neural, y explica por qué las primeras semanas de un bloque de Overcoming de
            intención máxima suelen producir ganancias de fuerza rápidas — no porque el músculo
            haya crecido, sino porque el jugador aprendió a "encender" una porción mayor de la
            maquinaria contráctil que ya tenía.
          </P>
          <Titulo>1.7 El Órgano Tendinoso de Golgi: anatomía, reflejo Ib y la hipótesis de desensibilización</Titulo>
          <P>
            El Órgano Tendinoso de Golgi (OTG) es un receptor sensorial ubicado en la unión
            miotendinosa, intercalado en serie con un pequeño grupo de fibras. A diferencia del
            huso muscular —que detecta longitud y velocidad de estiramiento del vientre
            muscular— el OTG está ubicado para detectar tensión activa: la fuerza real que el
            músculo transmite a través del tendón en un momento dado.
          </P>
          <P>
            Cuando el OTG detecta tensión que su umbral interpreta como potencialmente lesiva,
            dispara señales aferentes Ib que, vía una interneurona inhibitoria en la médula
            espinal, producen un reflejo de inhibición autogénica: la motoneurona alfa del propio
            músculo agonista recibe una señal que reduce su activación, relajando la contracción
            para proteger al tendón.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="01 — Fisiología y Arquitectura Muscular" />
          <P>
            En el campo del entrenamiento de fuerza máxima se postula —y este manual lo presenta
            explícitamente como hipótesis mecanicista discutida, no como hallazgo cerrado— que la
            exposición crónica y progresiva a tensión isométrica elevada puede elevar el umbral
            de disparo de este reflejo protector, permitiendo expresar picos de fuerza voluntaria
            mayores sin que la contracción se interrumpa de forma prematura.
          </P>
          <Nota>
            La evidencia directa de desensibilización del OTG en humanos entrenados es indirecta
            —se infiere de las mejoras de fuerza voluntaria observadas tras entrenamiento de
            intención máxima, no de una medición directa del umbral del reflejo— y se presenta
            aquí con esa salvedad explícita.
          </Nota>
          <Titulo>1.8 Metabolismo, hipoxia local y señalización del tejido conectivo</Titulo>
          <P>
            Las isometrías de larga duración a intensidades submáximas —el estímulo que
            caracteriza al bloque Yielding del Capítulo 4— generan un fenómeno distinto al
            reclutamiento de alto umbral del bloque Overcoming: la tensión sostenida puede superar
            la presión intramuscular necesaria para mantener el flujo sanguíneo capilar normal,
            generando hipoxia local transitoria — un mecanismo emparentado con el entrenamiento
            con restricción de flujo sanguíneo (BFR), aunque acá la oclusión es producto de la
            propia tensión muscular, no de un manguito externo.
          </P>
          <P>
            Esa hipoxia se asocia con mayor acumulación de metabolitos (lactato, fosfato
            inorgánico, iones de hidrógeno) y con la liberación de factores de crecimiento que
            participan en la señalización anabólica del tejido.
          </P>
          <Nota>
            El cuerpo de investigación sobre hipoxia/BFR está mayoritariamente centrado en la
            hipertrofia del tejido muscular; su extensión al fortalecimiento específico del
            tendón y el ligamento es un mecanismo plausible, pero se presenta como una vía
            complementaria emergente, no como un hallazgo cerrado y unánime.
          </Nota>
        </Hoja>

        {/* ================= CAPÍTULO 2 — BIOMECÁNICA Y TEORÍA DE VECTORES DE FUERZA ================= */}

        <Hoja>
          <Encabezado eyebrow="02 — Biomecánica y Teoría de Vectores de Fuerza" />
          <Titulo>2.1 El principio de especificidad angular: la física de la transferencia (±15°)</Titulo>
          <P>
            El Capítulo 1 estableció, a partir de Oranchuk et al. (2019), que la ganancia de
            fuerza producida por el entrenamiento isométrico depende del ángulo y de la longitud
            muscular en la que se entrena. Este capítulo traduce esa evidencia fisiológica en una
            regla de aplicación práctica: la Teoría de Vectores de Fuerza, el estándar
            biomecánico propio de la Metodología UNIÓN.
          </P>
          <P>
            El principio central es la especificidad angular: la ganancia de fuerza se expresa
            con su magnitud máxima en el ángulo articular exacto en el que fue entrenada, y decae
            progresivamente a medida que el ángulo se aleja de ese punto. La Metodología UNIÓN
            adopta, como estándar de aplicación práctica, una ventana de transferencia de
            aproximadamente <span className="font-semibold text-union-charcoal">±15°</span>{' '}
            alrededor del ángulo entrenado: dentro de esa ventana se asume transferencia
            relevante; fuera de ella, la transferencia cae de forma marcada.
          </P>
          <Nota>
            Elegir el ángulo de un ejercicio isométrico no es un detalle técnico menor — es la
            decisión que determina si ese ejercicio transfiere o no transfiere al gesto que se
            busca mejorar. Un Overcoming Isometric con intención máxima, técnica perfecta y
            dosificación ideal, pero en el ángulo equivocado, puede producir ganancias de fuerza
            reales en un test de laboratorio y, sin embargo, aportar poco o nada al sprint o al
            frenado que motivó su inclusión en el programa.
          </Nota>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="02 — Biomecánica y Teoría de Vectores de Fuerza" />
          <Titulo>2.2 Vectores horizontales vs. verticales</Titulo>
          <P>
            La segunda decisión biomecánica central es la dirección del vector de fuerza que el
            ejercicio reproduce, porque distintas fases de la carrera exigen producir fuerza en
            direcciones mecánicamente distintas.
          </P>
          <P>
            <span className="font-semibold text-union-charcoal">Vectores horizontales — aceleración.</span>{' '}
            En los primeros pasos, el cuerpo está marcadamente inclinado hacia adelante y el
            objetivo es proyectar el centro de masa horizontalmente. Se prescriben angulaciones
            de cadera y rodilla relativamente cerradas (~90°), emulando la posición del primer y
            segundo apoyo.
          </P>
          <P>
            <span className="font-semibold text-union-charcoal">Vectores verticales — velocidad máxima.</span>{' '}
            El cuerpo adopta una posición erguida y la demanda dominante es la fuerza vertical en
            un tiempo de contacto brevísimo (80-100ms). Se prescriben angulaciones de rodilla más
            abiertas (~140°), emulando el touchdown del sprint a máxima velocidad.
          </P>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Figura tipo="aceleracion" caption="Vector horizontal — postura de aceleración, cadera y rodilla ~90°." />
            <Figura tipo="top-speed" caption="Vector vertical — postura de top speed, rodilla de apoyo ~140° (touchdown)." />
          </div>
          <Titulo>2.3 Consecuencias metodológicas</Titulo>
          <P>
            La combinación de ambos ejes —ángulo específico y dirección del vector— convierte a
            la prescripción de cualquier ejercicio isométrico en la respuesta a una pregunta
            siempre igual: ¿qué fase del gesto, en qué ángulo exacto y en qué dirección de
            fuerza, estoy tratando de mejorar? Nunca se prescribe isometría como estímulo
            genérico indiferenciado.
          </P>
        </Hoja>

        {/* ================= CAPÍTULO 3 — OVERCOMING ISOMETRICS ================= */}

        <Hoja>
          <Encabezado eyebrow="03 — Overcoming Isometrics: Aceleración y Sprint" />
          <Titulo>3.1 Definición fisiológica y sesgo concéntrico</Titulo>
          <P>
            La isometría de superación (Overcoming, en la clasificación de Natera) es la acción
            en la que el atleta empuja con máxima intención voluntaria contra una resistencia
            inamovible, sin lograr —ni buscar— desplazamiento articular. Fisiológicamente tiene
            un sesgo concéntrico: la intención motora es idéntica a la de un movimiento
            concéntrico de superación de carga, solo que la resistencia externa impide que ese
            intento se traduzca en acortamiento real. Es el opuesto biomecánico exacto de la
            isometría de sostén (Manual Metodológico Oficial, Sección 3.2).
          </P>
          <P>
            Esta definición determina el objetivo neuromuscular completo del bloque: reclutamiento
            de unidades motoras de alto umbral (Sección 1.5), mejora del cortical drive (Sección
            1.6) y, según la hipótesis discutida en la Sección 1.7, una eventual
            desensibilización progresiva del reflejo inhibitorio del OTG.
          </P>
          <Titulo>3.2 Postura de Aceleración</Titulo>
          <P>
            Siguiendo el criterio de vectores horizontales (Sección 2.2), el trabajo Overcoming
            orientado a la aceleración se prescribe reproduciendo, milimétricamente, la posición
            corporal del primer y segundo apoyo de la arrancada: cadera en flexión ~90°, rodilla
            en flexión ~90°, y tronco inclinado hacia adelante ~45° respecto a la vertical,
            manteniendo la línea hombro-cadera-tobillo del apoyo trasero lo más recta posible.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="03 — Overcoming Isometrics: Aceleración y Sprint" />
          <Figura tipo="aceleracion" caption="Postura de Overcoming Isometric para aceleración — tronco inclinado ~45°, cadera y rodilla de la pierna motriz a ~90°, vector de fuerza horizontal hacia adelante y abajo." grande />
          <P>
            El objetivo neuromuscular de esta postura es la producción de fuerza horizontal
            máxima en el umbral de reclutamiento más alto posible (Sección 1.5), sin el
            componente de fatiga técnica del sprint completo ni el riesgo articular de repetir
            esa acción dinámica bajo carga máxima de forma reiterada.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="03 — Overcoming Isometrics: Aceleración y Sprint" />
          <Titulo>3.3 Postura de Velocidad Máxima (Top Speed)</Titulo>
          <P>
            Siguiendo el criterio de vectores verticales, el trabajo Overcoming orientado a la
            velocidad máxima reproduce la posición articular del instante de touchdown: rodilla de
            apoyo en ~140° (rango 135°-145°), notablemente más extendida que en la postura de
            aceleración, y tronco casi vertical, con inclinación mínima hacia adelante — muy
            distinta de la inclinación marcada de la postura de aceleración, porque a velocidad
            máxima el cuerpo ya no proyecta el centro de masa hacia adelante con la misma
            agresividad, sino que lo mantiene estable sobre un apoyo de apenas 80-100ms.
          </P>
          <Figura tipo="top-speed" caption="Postura de Overcoming Isometric para velocidad máxima (Top Speed) — tronco casi vertical, rodilla de apoyo ~140° emulando el touchdown, vector de fuerza vertical hacia abajo." grande />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="03 — Overcoming Isometrics: Aceleración y Sprint" />
          <P>
            Aquí el objetivo neuromuscular se desplaza de la fuerza horizontal pura hacia la
            capacidad de producir fuerza vertical con una Tasa de Desarrollo de la Fuerza (RFD)
            muy elevada — coherente con que, en esta fase, el tiempo de contacto real con el
            suelo es tan breve que la fuerza máxima absoluta nunca llega a expresarse por
            completo: lo que determina el resultado del apoyo no es cuánta fuerza puede producir
            el jugador eventualmente, sino cuánta logra producir en esa ventana brevísima.
          </P>
          <Titulo>3.4 Dosificación exhaustiva de carga</Titulo>
          <Tabla
            columnas={['Variable', 'Prescripción', 'Fundamento fisiológico']}
            filas={[
              ['Intensidad', '100% de Máxima Contracción Voluntaria Isométrica (MVCI) — intención máxima', 'Solo la intención máxima recluta el extremo superior del pool de unidades motoras (1.5)'],
              ['Duración del esfuerzo', '3 a 5 segundos por repetición', 'Expresa el pico de fuerza voluntaria sin fatiga metabólica que degrade el reclutamiento'],
              ['Series', '3 a 5 series', 'Volumen suficiente para consolidar el patrón de reclutamiento sin perder calidad'],
              ['Pausa entre series', 'Completa, mayor a 2 minutos', 'Recuperación neural completa entre esfuerzos de alto umbral (1.5)'],
              ['Intención neuromuscular', 'Explosiva desde el inicio (RFD), no una rampa gradual', 'El objetivo es la tasa de desarrollo de la fuerza, no solo el pico eventual (1.4)'],
            ]}
          />
          <Nota>
            La pausa completa de más de dos minutos no es un detalle conservador: dado que el
            objetivo fisiológico es el reclutamiento de alto umbral y la RFD, una recuperación
            incompleta introduce fatiga metabólica periférica que compromete exactamente la
            cualidad neural que el ejercicio busca entrenar.
          </Nota>
        </Hoja>

        {/* ================= CAPÍTULO 4 — YIELDING ISOMETRICS ================= */}

        <Hoja>
          <Encabezado eyebrow="04 — Yielding Isometrics: Frenado y Cambio de Dirección" />
          <Titulo>4.1 Definición fisiológica y sesgo excéntrico</Titulo>
          <P>
            La isometría de sostén (Yielding, en la clasificación de Natera) es la acción en la
            que el atleta resiste una carga externa —o su propio peso corporal— sin ceder,
            absorbiendo fuerza durante un tiempo determinado sin desplazamiento articular
            visible. Fisiológicamente tiene un sesgo excéntrico: el músculo trabaja de forma
            activa para no ser vencido por una fuerza externa que tiende constantemente a
            estirarlo — la misma demanda mecánica que enfrenta el sistema neuromuscular durante
            la fase de frenado de una deceleración real.
          </P>
          <Titulo>4.2 El rol de la titina</Titulo>
          <P>
            La titina es una proteína estructural gigante —la más grande conocida en el cuerpo
            humano— que se extiende a lo largo de medio sarcómero, conectando la línea Z con la
            banda M. Funciona como un resorte molecular incorporado en la propia estructura
            contráctil: durante el estiramiento activo del músculo bajo tensión —exactamente la
            condición de la isometría Yielding, y de la fase de frenado real— los segmentos
            elásticos de la titina se despliegan y rigidizan, almacenando energía elástica y
            aportando fuerza pasiva adicional y estabilidad estructural al sarcómero bajo cargas
            de estiramiento elevadas.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Yielding Isometrics: Frenado y Cambio de Dirección" />
          <P>
            Este mecanismo es una de las explicaciones fisiológicas propuestas en la literatura
            de fisiología muscular para la potenciación por estiramiento residual (residual force
            enhancement): el hallazgo, observado en contracciones excéntricas e isométricas en
            longitud alargada, de que el músculo sostiene niveles de fuerza mayores a los que
            predeciría solo la relación longitud-tensión del sarcómero. Es parte de por qué el
            trabajo Yielding en ángulos de elongación entrena, específicamente, la capacidad de
            absorber energía cinética sin que la estructura articular colapse.
          </P>
          <Titulo>4.3 Biomecánica del cambio de dirección</Titulo>
          <P>
            El cambio de dirección (COD) exige una secuencia biomecánica precisa, que la Teoría
            de Vectores de Fuerza reproduce de forma deliberada en el ejercicio de Yielding
            correspondiente:
          </P>
          <Lista
            items={[
              'Plantado del pie externo: el pie contrario a la dirección hacia la que se va a girar absorbe la totalidad de la fuerza de frenado y luego la redirige.',
              'Hundimiento del centro de masa: flexión coordinada de cadera, rodilla y tobillo que baja el centro de gravedad y genera mayor recorrido articular para absorber la energía de forma progresiva.',
              'Absorción en un plano combinado: a diferencia de una deceleración lineal, el COD exige absorber fuerza en un plano que combina componentes lineales y laterales — una demanda que la sentadilla genérica de dos piernas no reproduce.',
            ]}
          />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Yielding Isometrics: Frenado y Cambio de Dirección" />
          <Titulo>4.4 Postura de Absorción: la estocada profunda (lunge)</Titulo>
          <P>
            El ejercicio de referencia de la Teoría de Vectores de Fuerza para esta biomecánica es
            la estocada profunda isométrica: pierna externa (delantera) con flexión profunda de
            cadera, rodilla y tobillo, rodilla trackeando en línea con la punta del pie —nunca
            colapsando hacia adentro—, soportando la mayor parte del peso y la carga; pierna
            trasera extendida hacia atrás y levemente hacia el costado, ampliando la base lateral;
            tronco con leve inclinación hacia adelante pero columna neutra, centro de masa
            deliberadamente hundido entre ambos apoyos.
          </P>
          <Figura tipo="cod-yielding" caption="Postura de Yielding Isometric para absorción en cambio de dirección — estocada profunda (lunge), rodilla externa alineada sobre el pie, centro de masa hundido, vector de fuerza de frenado hacia el centro de masa." grande />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Yielding Isometrics: Frenado y Cambio de Dirección" />
          <P>
            El objetivo neuromuscular de esta postura no es la intención explosiva del bloque
            Overcoming: es la co-contracción masiva de la musculatura agonista y antagonista
            alrededor de cadera, rodilla y tobillo, sosteniendo la alineación articular objetivo
            bajo una carga que tiende constantemente a colapsarla — exactamente la demanda que
            enfrenta el jugador en el instante real de frenado antes de redirigir su
            desplazamiento.
          </P>
          <Titulo>4.5 Dosificación para tolerancia estructural del tejido</Titulo>
          <Tabla
            columnas={['Variable', 'Prescripción', 'Fundamento fisiológico']}
            filas={[
              ['Intensidad', 'Submáxima — o hasta la falla técnica (pérdida de alineación, no fatiga total)', 'El objetivo es tolerancia estructural sostenida, no reclutamiento de alto umbral (cf. 3.4)'],
              ['Tiempo bajo tensión (TUT)', '10 a 30 segundos por repetición', 'Duración suficiente para generar la hipoxia local y señalización de la Sección 1.8'],
              ['Foco neuromuscular', 'Co-contracción agonista/antagonista y resistencia estructural, no intención explosiva', 'Reproduce la demanda de estabilidad articular sostenida del frenado real (4.3)'],
              ['Progresión', 'Aumento gradual del TUT y/o la carga, condicionado a mantener la alineación objetivo', 'La variable de progresión es la calidad de alineación bajo fatiga, no la carga levantada'],
            ]}
          />
          <Nota>
            A diferencia del bloque Overcoming, donde la pausa completa protege la calidad del
            reclutamiento neural, aquí el objetivo es exactamente el opuesto: acumular tiempo bajo
            tensión suficiente para generar el estímulo metabólico e hipóxico local que sostiene
            la adaptación estructural del tendón y el tejido conectivo.
          </Nota>
        </Hoja>

        {/* ================= CAPÍTULO 5 — PROPUESTA METODOLÓGICA Y PROGRESIÓN LTAD ================= */}

        <Hoja>
          <Encabezado eyebrow="05 — Propuesta Metodológica y Progresión LTAD" />
          <P>
            Los cuatro tomos de la colección LTAD del club —del Manual de 10ma y Pre 9na al
            Manual de 5ta y 4ta— establecen que la fuerza no se entrena igual en todas las
            edades, porque la fisiología del jugador cambia de forma radical entre la etapa
            pre-PHV, el propio pico de crecimiento y la ventana post-PHV. La isometría avanzada
            no es una excepción: introducirla de la misma forma en un jugador de 12 años que en
            uno de 17 sería ignorar todo lo que esos cuatro tomos documentan sobre maduración
            ósea, riesgo estructural y disponibilidad hormonal. Este capítulo traduce ese marco
            LTAD a una hoja de ruta específica para la isometría avanzada.
          </P>
          <Titulo>5.1 10ma y Pre 9na (12-13 años) — Alfabetización</Titulo>
          <P>
            Esta etapa es fisiológicamente pre-PHV: adaptaciones predominantemente neurales, el
            esqueleto no completó su osificación, y el sistema hormonal no aportó todavía la masa
            muscular ni los cambios arquitectónicos necesarios para tolerar tensión isométrica de
            alta intensidad.
          </P>
          <Lista
            items={[
              'Se habilita: Yielding básico, exclusivamente con peso corporal, con propósito estrictamente pedagógico — enseñar postura y a frenar (sostenes de 3-5s, aterrizajes controlados de bajísimo impacto).',
              'Está prohibido: cualquier forma de Overcoming Isometric de intención máxima — el sustrato hormonal y estructural no está disponible; forzarlo no acelera el desarrollo, solo aumenta el riesgo.',
            ]}
          />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="05 — Propuesta Metodológica y Progresión LTAD" />
          <Titulo>5.2 9na y 8va (14-15 años) — El Estirón (PHV)</Titulo>
          <P>
            La ventana de mayor vulnerabilidad estructural del proceso formativo: el cartílago de
            crecimiento puede ser hasta cinco veces más débil que el tejido conectivo que lo
            rodea durante el pico de crecimiento, y el desfasaje entre el crecimiento óseo
            acelerado y la adaptación del tejido blando explica la torpeza motora transitoria
            característica de esta etapa.
          </P>
          <Lista
            items={[
              'Se habilita: Yielding extenso (TUT moderado-alto, carga conservadora) para fortalecer tendones durante el crecimiento óseo rápido, y Overcoming submáximo —muy por debajo del 100% MVCI— con propósito puramente pedagógico: postura correcta e intención de empuje técnicamente limpia.',
              'Se pospone: el Overcoming de intención verdaderamente máxima (100% MVCI), que corresponde a la etapa siguiente, cuando el tejido completó la transición arquitectónica del Capítulo 1.',
            ]}
          />
          <Titulo>5.3 7ma a 4ta/Reserva (16 años en adelante) — Rendimiento</Titulo>
          <P>
            La ventana post-PHV de máxima adaptación hormonal y neural: el tejido ya completó la
            transición arquitectónica (mayor ángulo de penación, mayor stiffness tendinoso, mayor
            masa muscular) que habilita, con pleno sentido fisiológico, la exposición a los
            estímulos de mayor intensidad de este manual.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="05 — Propuesta Metodológica y Progresión LTAD" />
          <Lista
            items={[
              'Se habilita en plenitud: Overcoming de intención máxima (Sección 3.4), objetivo RFD, transferido a los vectores de aceleración (~90°) y velocidad máxima (~140°) de la Teoría de Vectores de Fuerza. En paralelo, Yielding pesado (Sección 4.5) para frenado y cambio de dirección, con cargas y TUT que exceden ampliamente los de la etapa anterior.',
              'Se integra: dentro de la periodización semanal por Día de Partido del Manual Metodológico Oficial, incluyendo Overcoming de intención máxima en MD-1 como estímulo de Potenciación Post-Activación (PAP).',
            ]}
          />
          <Tabla
            columnas={['Categoría', 'Yielding', 'Overcoming', 'Objetivo dominante']}
            filas={[
              ['10ma y Pre 9na', 'Básico, peso corporal', 'Prohibido en intensidad máxima', 'Educación postural y del frenado'],
              ['9na y 8va', 'Extenso, TUT moderado-alto', 'Submáximo (aprendizaje de postura)', 'Fortalecimiento tendinoso durante el PHV'],
              ['7ma a 4ta/Reserva', 'Pesado (COD, frenado)', 'Máximo (100% MVCI, RFD)', 'Transferencia a aceleración y velocidad máxima'],
            ]}
          />
        </Hoja>

        {/* ================= CAPÍTULO 6 — FUNDAMENTOS NSCA ================= */}

        <Hoja>
          <Encabezado eyebrow="06 — 📖 Fundamentos Fisiológicos y Biomecánicos (NSCA)" />
          <Titulo>06. Fundamentos Fisiológicos y Biomecánicos (NSCA)</Titulo>
          <P>
            La clasificación de Natera (Overcoming/Yielding, Capítulos 3-4) describe el "qué" de
            la isometría aplicada al fútbol. Este capítulo cierra el círculo con el "por qué"
            neurofisiológico, apoyado en el marco curricular estándar de la NSCA (Haff &amp;
            Triplett, 2017): dos reflejos propioceptivos — el Órgano Tendinoso de Golgi (OTG) y
            el huso muscular — que explican, respectivamente, por qué el Overcoming entrena algo
            que el sistema nervioso normalmente frena, y por qué el Yielding y la isometría
            específica de sprint (Sección 3.4) construyen la rigidez reactiva que sostiene la
            velocidad máxima.
          </P>
          <Titulo>6.1 El Órgano Tendinoso de Golgi y la inhibición autogénica</Titulo>
          <P>
            El Órgano Tendinoso de Golgi (OTG) es un propioceptor ubicado en la unión
            miotendinosa que detecta la tensión que atraviesa el tendón durante la contracción
            muscular. Cuando esa tensión supera un umbral crítico, el OTG dispara un reflejo de
            <span className="font-semibold text-union-charcoal"> inhibición autogénica</span>: una
            señal inhibitoria que reduce abruptamente la activación del propio músculo que generó
            la tensión, como mecanismo protector para evitar que el tendón o el músculo se
            desgarren bajo una carga potencialmente peligrosa. Es, en esencia, un freno de
            seguridad instalado por el sistema nervioso central — y explica por qué, en una
            persona sin entrenamiento, la fuerza voluntaria máxima está muy por debajo del límite
            estructural real del tejido.
          </P>
          <Titulo>6.2 Overcoming Isometrics como superación voluntaria de ese freno</Titulo>
          <P>
            La evidencia recogida en el marco de la NSCA (Haff &amp; Triplett, 2017) documenta
            que el entrenamiento de fuerza sostenido —y en particular el trabajo isométrico de
            intención máxima contra una resistencia inamovible, exactamente la definición de
            Overcoming Isometrics (Sección 3.1)— eleva progresivamente el umbral de disparo de la
            inhibición autogénica del OTG. El atleta entrenado no "vence" al reflejo por fuerza de
            voluntad en cada repetición: reeduca el umbral al que ese reflejo protector interviene,
            permitiendo reclutar una proporción mayor del potencial contráctil real del músculo
            antes de que el freno inhibitorio se active. Este es el mecanismo neural de fondo —no
            sólo mecánico— detrás de por qué Overcoming mejora la producción de fuerza máxima
            voluntaria y la RFD (Sección 1.2 del Manual Metodológico Oficial): no se construye
            tejido nuevo en el corto plazo, se libera acceso a tejido contráctil que ya existía
            pero que el sistema nervioso mantenía retenido por seguridad.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="06 — 📖 Fundamentos Fisiológicos y Biomecánicos (NSCA)" />
          <Titulo>6.3 Husos musculares, el reflejo miotático y la rigidez (stiffness) en el sprint</Titulo>
          <P>
            El huso muscular es un propioceptor intramuscular, dispuesto en paralelo a las fibras
            contráctiles, que detecta tanto la longitud del músculo como la velocidad a la que esa
            longitud cambia (estiramiento). Cuando el músculo se estira de forma súbita, el huso
            dispara el <span className="font-semibold text-union-charcoal">reflejo miotático</span>{' '}
            (reflejo de estiramiento): una señal excitatoria monosináptica que activa de forma
            refleja —y muy rápida, sin mediar decisión consciente— al mismo músculo que se está
            estirando, generando una contracción de resistencia casi instantánea.
          </P>
          <P>
            Este reflejo es el sustrato neural directo de la rigidez músculo-tendinosa (
            <span className="italic">stiffness</span>) que la Sección 1.3 del Manual Metodológico
            Oficial identifica como el mecanismo dominante del Ciclo Estiramiento-Acortamiento
            (CEA) rápido — el que ocurre en tiempos de contacto menores a 250ms, exactamente el
            rango del apoyo en sprint a máxima velocidad (80-100ms). Cuanto mayor es la
            sensibilidad y la velocidad de respuesta del huso muscular, mayor es la capacidad del
            complejo tobillo-rodilla de comportarse, en ese instante de apoyo, como un resorte
            rígido que devuelve energía elástica en vez de absorberla pasivamente — la base
            fisiológica de por qué la isometría específica de sprint (Sección 3.4) entrena
            tiempos de contacto cortos y no simplemente fuerza máxima: el objetivo es la velocidad
            y la magnitud de la respuesta refleja del huso, no la tensión voluntaria sostenida.
          </P>
          <blockquote className="mt-3 border-l-4 border-union-red-600 bg-slate-50 py-2 pl-4 pr-3 text-[11px] italic leading-relaxed text-slate-600 break-inside-avoid">
            Concepto clave NSCA: el Órgano Tendinoso de Golgi y el huso muscular son los dos
            propioceptores que enmarcan, desde extremos opuestos, toda la lógica de este manual —
            el OTG frena la producción de fuerza voluntaria para proteger el tejido (y el
            entrenamiento Overcoming reeduca ese freno), mientras que el huso muscular dispara la
            respuesta refleja involuntaria que sostiene la rigidez reactiva del sprint (y el
            entrenamiento Yielding/específico de sprint la refina). No son mecanismos redundantes:
            son las dos caras de la misma moneda neuromuscular.
            <footer className="mt-1 text-[10px] font-semibold not-italic text-union-charcoal">
              Haff, G.G., &amp; Triplett, N.T. (Eds.). (2017). Essentials of Strength Training and
              Conditioning (4th ed.). National Strength and Conditioning Association / Human
              Kinetics.
            </footer>
          </blockquote>
        </Hoja>

        {/* ================= CAPÍTULO 7 — REFERENCIAS ================= */}

        <Hoja>
          <Encabezado eyebrow="07 — Referencias Bibliográficas" />
          <Referencias
            items={[
              'Haff, G.G., & Triplett, N.T. (Eds.). (2017). Essentials of Strength Training and Conditioning (4th ed.). National Strength and Conditioning Association / Human Kinetics.',
              'Manual Metodológico Oficial — Área de Fuerza, Club Atlético Unión de Santa Fe (documento interno, Sección 3, clasificación Yielding/Overcoming de Natera; Sección 1, RFD y ciclo estiramiento-acortamiento).',
              'Manual de 10ma y Pre 9na División — Área de Fuerza, Club Atlético Unión de Santa Fe (documento interno).',
              'Manual de 9na y 8va División — Área de Fuerza, Club Atlético Unión de Santa Fe (documento interno).',
              'Manual de 7ma y 6ta División — Área de Fuerza, Club Atlético Unión de Santa Fe (documento interno).',
              'Manual de 5ta y 4ta División — Área de Fuerza, Club Atlético Unión de Santa Fe (documento interno).',
              'Área de Fuerza, Club Atlético Unión de Santa Fe (2026). Teoría de Vectores de Fuerza: especificidad angular (±15°) y diferenciación entre vectores horizontales y verticales aplicada al entrenamiento isométrico. Estándar biomecánico institucional de la Metodología UNIÓN — desarrollado y adoptado internamente por el Área de Fuerza, no atribuido a una fuente externa.',
              'Lum, D., & Zavorsky, G. S. (2017). Referencia provista como parte del encargo original; no verificada de forma independiente en esta sesión — se cita tal como fue indicada, sin datos editoriales (journal, volumen, páginas) que no pudieron ser corroborados.',
              'Natera, A. (s.f.). Clasificación biomecánica de la isometría aplicada al fútbol: Run Isometrics, Yielding (Hold) y Overcoming (Push). Material de formación práctica y clínicas técnicas (ALTIS) — no peer-reviewed; citado por su relevancia práctica y adopción extendida en preparación física de fútbol de élite.',
              'Oranchuk, D. J., Storey, A. G., Nelson, A. R., & Cronin, J. B. (2019). Isometric training and long-term adaptations: Effects of muscle length, intensity, and intent: A systematic review. Scandinavian Journal of Medicine & Science in Sports, 29(4), 484–503.',
            ]}
          />
        </Hoja>

        <Hoja ultima>
          <Encabezado eyebrow="Nota Final y Firma" />
          <Titulo>Nota metodológica de cierre</Titulo>
          <P>
            Este documento distingue explícitamente los niveles de cita, siguiendo el mismo
            criterio de honestidad de fuentes que rige el resto de los manuales de esta área: el
            marco de práctica profesional (Natera) se desarrolla y difunde principalmente en
            contextos de formación práctica, no en journals de revisión por pares; la literatura
            científica de consenso (Oranchuk et al., 2019) se presenta como atribución conceptual
            estándar por autor y año; y la Teoría de Vectores de Fuerza se asienta como estándar
            biomecánico propio de la Metodología UNIÓN. La referencia de Lum &amp; Zavorsky
            (2017) fue provista como parte del encargo original y no pudo ser corroborada con
            datos editoriales completos en esta sesión — se cita con esa salvedad explícita.
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
          Manual de Isometría Avanzada · {NOMBRE_AREA}
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
          Libro de Texto Interno · Escuela de Movimiento e Isometría
        </p>
        <h1 className="text-4xl font-black leading-tight text-union-charcoal">
          Isometría
          <br />
          Avanzada
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
          Fisiología celular y neural, arquitectura muscular, biomecánica de vectores de fuerza,
          clasificación funcional Overcoming/Yielding, dosificación exhaustiva de carga y
          progresión LTAD del entrenamiento isométrico aplicado al fútbol.
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

function P({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-justify text-xs leading-relaxed tracking-wide text-slate-600">{children}</p>
}

function Nota({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-md bg-slate-50 p-2.5 text-[10px] italic leading-relaxed text-slate-400 break-inside-avoid">
      <span className="font-semibold not-italic text-union-red-600">Profundización: </span>
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

/**
 * Contenedor "de libro de texto" para los diagramas biomecánicos: fondo
 * sutil, borde redondeado y pie de figura científico — envuelve al SVG de
 * `DiagramaBiomecanico`, que no sabe nada de layout ni de captions (queda
 * reutilizable para otras vistas del club el día de mañana).
 */
function Figura({
  tipo,
  caption,
  grande = false,
}: {
  tipo: TipoDiagramaBiomecanico
  caption: string
  grande?: boolean
}) {
  return (
    <figure className="mt-4 break-inside-avoid rounded-lg border border-slate-200 bg-slate-50 p-4">
      <DiagramaBiomecanico tipo={tipo} className={grande ? 'mx-auto h-64 w-auto' : 'mx-auto h-40 w-auto'} />
      <figcaption className="mt-2 text-center text-[10px] italic leading-snug text-slate-500">
        {caption}
      </figcaption>
    </figure>
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
  { numero: '01', titulo: 'Fisiología y Arquitectura Muscular' },
  { numero: '02', titulo: 'Biomecánica y Teoría de Vectores de Fuerza' },
  { numero: '03', titulo: 'Overcoming Isometrics — Aceleración y Sprint' },
  { numero: '04', titulo: 'Yielding Isometrics — Frenado y Cambio de Dirección (COD)' },
  { numero: '05', titulo: 'Propuesta Metodológica y Progresión LTAD' },
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
      <P>
        Este documento distingue explícitamente los niveles de cita. Ninguna cifra, porcentaje o
        mecanismo fisiológico fue inventado: donde el dato tiene respaldo en la literatura de
        consenso se cita a su autor y año; donde es un estándar de aplicación propio del club, se
        declara como tal; y donde un mecanismo es una hipótesis discutida, se dice
        explícitamente que lo es.
      </P>
      <ol className="mt-2 flex flex-col gap-2">
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            1. Marco de práctica profesional (no peer-reviewed) —{' '}
          </span>
          la clasificación funcional Yielding/Overcoming de Alex Natera se desarrolla y difunde
          principalmente en contextos de formación práctica de alto rendimiento, no en journals
          de revisión por pares con DOI verificable. Se cita por su relevancia práctica y
          adopción extendida en preparación física de fútbol de élite.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            2. Literatura científica de consenso —{' '}
          </span>
          los mecanismos fisiológicos generales corresponden a fisiología del ejercicio y
          neurofisiología establecidas. La referencia de Oranchuk et al. (2019) se cita
          explícitamente en cada afirmación que depende de su revisión sistemática — atribución
          estándar por autor y año, no transcripción verbatim de un documento leído en esta
          sesión. La referencia de Lum &amp; Zavorsky (2017) fue provista como parte del encargo
          original y no pudo ser corroborada de forma independiente en esta sesión — se cita con
          esa salvedad explícita.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            3. Estándar biomecánico propio — Metodología UNIÓN —{' '}
          </span>
          la Teoría de Vectores de Fuerza (especificidad angular de ±15°, vectores horizontales y
          verticales, Capítulo 2) se presenta como el estándar de aplicación práctica propio del
          Área de Fuerza del club — no como cita a un tercero externo.
        </li>
      </ol>
      <Nota>
        Las figuras de este documento son diagramas biomecánicos esquemáticos ("stick figure"),
        dibujados internamente en SVG por el Área de Fuerza — no son fotografías ni material con
        derechos de autor de terceros.
      </Nota>
    </section>
  )
}

function Cierre() {
  return (
    <section className="mt-6">
      <Titulo>Cierre</Titulo>
      <P>
        Este manual es el marco de referencia obligatorio para la prescripción de isometría
        avanzada en el club, y su hoja de ruta LTAD (Capítulo 5) es de aplicación obligatoria por
        categoría. Ningún ejercicio se incorpora al programa sin responder primero a la pregunta
        que organiza todo el documento: qué fase del gesto, en qué ángulo y en qué dirección de
        fuerza, se está tratando de mejorar — y si el jugador, según su categoría y su momento
        madurativo, está fisiológicamente preparado para recibir ese estímulo.
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
