import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NOMBRE_AREA, FIRMA_AUTOR } from '@/constants/branding'

/**
 * Manual de Isometría Avanzada — Escuela de Movimiento e Isometría. Versión
 * maquetada 1-a-1 sobre el contenido académico redactado en
 * `docs/Manual_Isometria_Avanzada.md` (no es un resumen — es ese texto
 * distribuido en hojas A4). Documento digital exportable a PDF vía
 * `window.print()`, reutilizando estrictamente la arquitectura de impresión
 * A4 de `ManualFuerzaView.tsx` / la colección de manuales LTAD.
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
          <NotaFuentes />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="01 — Fundamentos Fisiológicos y Neurales (El Motor Interno)" />
          <Titulo>1.1 Adaptaciones arquitectónicas</Titulo>
          <P>
            La isometría no es un estímulo neutro para el tejido: modifica de forma medible la
            arquitectura del músculo y la rigidez del tendón, y lo hace de forma específica al
            ángulo y a la longitud muscular en la que se entrena (Oranchuk et al., 2019). Dos
            variables concentran la mayor parte de esa adaptación.
          </P>
          <Subtitulo>Ángulo de penación</Subtitulo>
          <P>
            El ángulo con el que las fibras musculares se insertan en la aponeurosis tiende a
            aumentar con el entrenamiento isométrico de alta tensión, empaquetando más sarcómeros
            en paralelo dentro de la misma sección transversal — favorece la producción de
            fuerza máxima, a costa de una velocidad de acortamiento levemente menor.
          </P>
          <Subtitulo>Longitud del fascículo muscular</Subtitulo>
          <P>
            La dirección de esta adaptación depende de la longitud en la que se entrena. El
            trabajo isométrico en posiciones de <span className="font-semibold text-union-charcoal">elongación</span>{' '}
            (ángulos abiertos, músculo estirado) tiende a aumentar la longitud del fascículo
            —adición de sarcómeros en serie, emparentado con el entrenamiento excéntrico—
            mejorando la tolerancia del tejido en posiciones de riesgo (relevante, por ejemplo,
            para isquiotibiales). El trabajo en posiciones de{' '}
            <span className="font-semibold text-union-charcoal">acortamiento</span> (ángulos
            cerrados) produce, en cambio, adaptaciones orientadas a la rigidez tendinosa y a una
            ganancia de fuerza marcadamente específica al ángulo entrenado, con menor
            transferencia a otros rangos articulares (Oranchuk et al., 2019).
          </P>
          <Nota>
            Esta dependencia de la longitud/ángulo de entrenamiento es la base fisiológica de
            por qué en este manual no existe una isometría genérica: cada ejercicio se prescribe
            en un ángulo articular específico, elegido en función del gesto deportivo que se
            busca transferir (desarrollado en la Sección 2).
          </Nota>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="01 — Fundamentos Fisiológicos y Neurales (El Motor Interno)" />
          <Titulo>1.2 Rigidez tendinosa (stiffness)</Titulo>
          <P>
            En paralelo a la adaptación muscular, el tendón incrementa su rigidez con el
            entrenamiento isométrico de alta tensión sostenida: mayor densidad de
            entrecruzamientos de colágeno y, con el tiempo, mayor área de sección transversal
            del tendón. Un tendón más rígido transmite la fuerza generada por el músculo hacia
            el hueso con menor retardo electromecánico — mejora directamente la Tasa de
            Desarrollo de la Fuerza (RFD, Manual Metodológico Oficial, Sección 1.2), porque una
            unidad músculo-tendón más rígida "pierde" menos tiempo estirando el componente
            elástico en serie antes de que esa fuerza se traduzca en movimiento.
          </P>
          <Titulo>1.3 Adaptaciones neurales</Titulo>
          <Subtitulo>Reclutamiento de unidades motoras de alto umbral</Subtitulo>
          <P>
            Según el principio de tamaño de Henneman, las unidades motoras se reclutan en orden
            creciente de umbral a medida que aumenta la demanda de fuerza. Las contracciones
            isométricas de intención máxima son, precisamente, el estímulo que exige reclutar el
            extremo superior de ese espectro — las unidades de fibras rápidas (Tipo II), de mayor
            umbral y capacidad de fuerza y potencia, que en un gesto dinámico submáximo pueden no
            llegar a activarse plenamente.
          </P>
          <Subtitulo>Cortical drive</Subtitulo>
          <P>
            El entrenamiento isométrico de alta intensidad sostenido se asocia con un incremento
            de la activación voluntaria — la eficiencia con la que la corteza motora logra
            reclutar el potencial contráctil total del músculo. En la práctica, reduce la brecha
            entre la fuerza que un músculo puede producir y la que el atleta logra expresar de
            forma voluntaria: el jugador aprende a "encender" una proporción mayor de su propio
            potencial contráctil.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="01 — Fundamentos Fisiológicos y Neurales (El Motor Interno)" />
          <Subtitulo>Órgano Tendinoso de Golgi (OTG) y su rol inhibitorio</Subtitulo>
          <P>
            El OTG es un propioceptor ubicado en la unión miotendinosa que detecta la tensión
            activa del músculo y, ante niveles que interpreta como potencialmente lesivos,
            dispara un reflejo de inhibición autogénica —relaja el agonista para proteger al
            tendón de una sobrecarga mecánica. Se postula que la exposición crónica y progresiva
            a tensión isométrica elevada puede elevar el umbral de disparo de este reflejo,
            permitiendo expresar picos de fuerza voluntaria mayores sin que el sistema nervioso
            "frene" la contracción de forma prematura.
          </P>
          <Nota>
            Es importante remarcar que este mecanismo de desensibilización del OTG es, en gran
            medida, una hipótesis mecanicista discutida en el campo del entrenamiento de fuerza
            máxima — no una medición directa e inequívoca en humanos entrenados — y se presenta
            aquí con esa salvedad.
          </Nota>
          <Titulo>1.4 Metabolismo y oclusión</Titulo>
          <P>
            Las isometrías de larga duración a intensidades submáximas generan un fenómeno
            mecánico particular: la tensión sostenida puede superar la presión intramuscular
            necesaria para mantener el flujo sanguíneo normal, generando hipoxia local
            transitoria —un mecanismo emparentado con el entrenamiento con restricción de flujo
            sanguíneo (BFR). Esa hipoxia se asocia con mayor acumulación de metabolitos y con la
            liberación de factores de crecimiento sistémicos que participan en la señalización
            anabólica del tejido.
          </P>
          <Nota>
            El cuerpo de investigación sobre hipoxia/BFR está mayoritariamente centrado en la
            hipertrofia muscular; su extensión al fortalecimiento específico del tendón y el
            ligamento es un mecanismo plausible, pero se presenta como una vía complementaria
            emergente, no como un hallazgo cerrado y unánime.
          </Nota>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="02 — Biomecánica y Teoría de Vectores de Fuerza" />
          <Titulo>2.1 Por qué el ángulo articular es innegociable</Titulo>
          <P>
            El principio central que organiza la prescripción de isometría en este manual es la
            especificidad angular: la ganancia de fuerza producida por un entrenamiento
            isométrico se expresa con su magnitud máxima en el ángulo articular exacto en el que
            fue entrenada, y decae progresivamente a medida que el ángulo se aleja de ese punto.
            La Metodología UNIÓN adopta como estándar de aplicación práctica una ventana de
            transferencia de aproximadamente <span className="font-semibold text-union-charcoal">±15°</span>{' '}
            alrededor del ángulo entrenado: fuera de esa ventana, la transferencia al gesto
            deportivo real cae de forma marcada.
          </P>
          <Nota>
            Elegir el ángulo de un ejercicio isométrico no es un detalle técnico menor, es la
            decisión que determina si ese ejercicio transfiere o no transfiere al gesto que se
            busca mejorar — un Overcoming Isometric ejecutado en el ángulo equivocado puede
            producir ganancias de fuerza reales y, sin embargo, aportar poco o nada al sprint o
            al frenado que motivó su inclusión en el programa.
          </Nota>
          <Titulo>2.2 Vectores horizontales vs. vectores verticales</Titulo>
          <P>
            La segunda decisión biomecánica central es la dirección del vector de fuerza que el
            ejercicio reproduce, porque distintas fases de la carrera exigen producir fuerza en
            direcciones distintas.
          </P>
          <Tabla
            columnas={['Vector', 'Fase de carrera', 'Angulación de referencia']}
            filas={[
              [
                'Horizontal',
                'Aceleración (primeros pasos): cuerpo inclinado hacia adelante, proyección horizontal del centro de masa.',
                'Cadera y rodilla ~90°-100° (posición del primer y segundo apoyo)',
              ],
              [
                'Vertical',
                'Velocidad máxima (Top Speed): posición erguida, fuerza vertical en tiempo de contacto brevísimo (80-100ms).',
                'Rodilla ~135°-145° (emulando el touchdown)',
              ],
            ]}
          />
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="03 — Overcoming Isometrics: Aceleración y Sprint" />
          <Titulo>3.1 Definición fisiológica</Titulo>
          <P>
            La isometría de superación (Overcoming) es la acción en la que el atleta empuja con
            máxima intención voluntaria contra una resistencia inamovible, sin lograr —ni
            buscar— desplazamiento articular. Fisiológicamente tiene un sesgo concéntrico: la
            intención motora es la misma que la de un movimiento concéntrico de superación de
            carga, solo que la resistencia externa impide que ese intento se traduzca en
            acortamiento muscular real. Es el opuesto biomecánico de la isometría de sostén
            (Manual Metodológico Oficial, Sección 3.2).
          </P>
          <Titulo>3.2 Aplicación — Aceleración (primeros pasos)</Titulo>
          <P>
            Siguiendo el criterio de vectores horizontales (Sección 2.2), el trabajo Overcoming
            orientado a la aceleración se prescribe en angulaciones de cadera y rodilla de
            aproximadamente 90°-100°, reproduciendo la posición corporal de los primeros apoyos
            de la arrancada. El objetivo neuromuscular es la producción de fuerza horizontal
            máxima en el umbral de reclutamiento más alto posible (Sección 1.3), sin el
            componente de fatiga técnica ni el riesgo articular de repetir el gesto dinámico
            completo bajo carga máxima.
          </P>
          <Titulo>3.3 Aplicación — Velocidad máxima (Top Speed)</Titulo>
          <P>
            Siguiendo el criterio de vectores verticales, el trabajo Overcoming orientado a la
            velocidad máxima se prescribe en angulaciones de rodilla de aproximadamente
            135°-145°, emulando el touchdown del sprint a máxima velocidad. Aquí el objetivo
            neuromuscular se desplaza de la fuerza horizontal pura hacia la capacidad de producir
            fuerza vertical con una RFD muy elevada — coherente con que, en esta fase, el tiempo
            de contacto real con el suelo es de apenas 80-100ms, un margen en el que la fuerza
            máxima absoluta nunca llega a expresarse por completo.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="03 — Overcoming Isometrics: Aceleración y Sprint" />
          <Titulo>3.4 Dosificación de carga</Titulo>
          <Tabla
            columnas={['Variable', 'Prescripción']}
            filas={[
              ['Intensidad', '100% de Máxima Contracción Voluntaria Isométrica (MVCI) — intención máxima'],
              ['Duración del esfuerzo', '3 a 5 segundos por repetición'],
              ['Series', '3 a 5 series'],
              ['Pausa entre series', 'Completa, mayor a 2 minutos'],
              ['Intención neuromuscular', 'Explosiva desde el inicio de la contracción (RFD), no una rampa gradual hacia el pico'],
            ]}
          />
          <Nota>
            La pausa completa (mayor a 2 min) no es un detalle conservador: dado que el objetivo
            es reclutamiento de alto umbral y RFD (Sección 1.3), una recuperación incompleta
            entre series compromete exactamente la cualidad neural que el ejercicio busca
            entrenar, degradando el estímulo hacia una demanda metabólica que no es el objetivo
            de este bloque.
          </Nota>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Yielding Isometrics: Frenado y Cambio de Dirección" />
          <Titulo>4.1 Definición fisiológica</Titulo>
          <P>
            La isometría de sostén (Yielding) es la acción en la que el atleta resiste una carga
            externa —o su propio peso corporal— sin ceder, absorbiendo fuerza durante un tiempo
            determinado sin desplazamiento articular visible. Fisiológicamente tiene un sesgo
            excéntrico: el músculo trabaja activamente para no ser vencido por una fuerza externa
            que tiende constantemente a estirarlo, la misma demanda mecánica que enfrenta el
            sistema neuromuscular durante la fase de frenado de una deceleración real.
          </P>
          <Subtitulo>El rol de la titina</Subtitulo>
          <P>
            La titina es una proteína estructural gigante que conecta la línea Z con la banda M
            del sarcómero y actúa como un resorte molecular: durante el estiramiento activo del
            músculo bajo tensión —exactamente la condición de la isometría Yielding— la titina
            se rigidiza y almacena energía elástica, contribuyendo a la producción de fuerza
            pasiva adicional y a la estabilidad del sarcómero bajo cargas de estiramiento
            elevadas. Este mecanismo es una de las explicaciones fisiológicas propuestas para el
            fenómeno de potenciación por estiramiento residual observado en contracciones
            excéntricas e isométricas en longitud alargada.
          </P>
          <Titulo>4.2 Biomecánica del cambio de dirección (COD)</Titulo>
          <P>
            El cambio de dirección exige una secuencia biomecánica precisa: plantado del pie
            externo (el pie contrario a la dirección hacia la que se va a girar, que se convierte
            en el punto de apoyo que debe absorber y redirigir la fuerza), hundimiento del centro
            de masa (flexión de cadera, rodilla y tobillo que baja el centro de gravedad y genera
            un mayor recorrido de absorción), y absorción de las fuerzas de frenado en un plano
            que combina componentes lineales y laterales. El trabajo Yielding orientado al COD se
            prescribe en ángulos de cadera, rodilla y tobillo que reproducen específicamente esa
            posición de plantado — no en la sentadilla genérica de dos piernas, apropiada para el
            frenado lineal.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="04 — Yielding Isometrics: Frenado y Cambio de Dirección" />
          <Titulo>4.3 Dosificación de carga</Titulo>
          <Tabla
            columnas={['Variable', 'Prescripción']}
            filas={[
              ['Intensidad', 'Submáxima — o hasta la falla técnica (pérdida de alineación, no fatiga muscular total)'],
              ['Tiempo bajo tensión (TUT)', '10 a 30 segundos por repetición'],
              ['Foco neuromuscular', 'Co-contracción masiva de agonista/antagonista y resistencia estructural del tejido, no intención explosiva'],
              ['Progresión', 'Aumento gradual del TUT y/o de la carga externa, siempre condicionado a mantener la alineación articular objetivo'],
            ]}
          />
          <Nota>
            A diferencia del bloque Overcoming (Sección 3.4), aquí el objetivo no es la
            intención máxima instantánea sino la tolerancia estructural sostenida — la variable
            de progresión primaria es el tiempo bajo tensión y la calidad de la alineación bajo
            fatiga acumulada, no la carga externa levantada.
          </Nota>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="05 — Progresión Pedagógica y Dosificación Práctica" />
          <P>
            La secuencia de introducción de la isometría avanzada en el club sigue cuatro fases,
            en orden estricto — ninguna fase se salta ni se adelanta por presión de calendario
            competitivo.
          </P>
          <Titulo>Fase 1 — Yielding Extenso (construcción de tejidos y tolerancia)</Titulo>
          <P>
            Punto de entrada obligatorio para todo jugador, independientemente de su categoría o
            nivel de fuerza previo. El objetivo es construir la tolerancia estructural de base
            (tendón, tejido conectivo, co-contracción) mediante Yielding de TUT moderado a alto y
            carga conservadora, antes de introducir cualquier estímulo de intención máxima —
            aplicación directa, en el terreno de la isometría avanzada, del principio "técnica y
            tejido antes que intensidad" que organiza la colección LTAD del club.
          </P>
          <Titulo>Fase 2 — Overcoming Sub-máximo (aprendizaje del reclutamiento y postura)</Titulo>
          <P>
            Introducción de la isometría Overcoming con intensidades submáximas, con el objetivo
            de que el jugador aprenda a organizar la postura correcta en el ángulo específico de
            trabajo (Sección 2.1) y a reclutar la intención de empuje máximo de forma
            técnicamente limpia, antes de exponerlo a la carga de intención verdaderamente
            máxima de la fase siguiente.
          </P>
          <Titulo>Fase 3 — Overcoming Máximo (tensión mecánica y RFD puro)</Titulo>
          <P>
            Una vez consolidada la postura y el patrón de reclutamiento en la Fase 2, se habilita
            la intensidad de 100% MVCI (Sección 3.4), con el objetivo explícito de tensión
            mecánica máxima y desarrollo de RFD — la fase donde el trabajo Overcoming alcanza su
            propósito fisiológico pleno.
          </P>
          <Titulo>Fase 4 — Integración en Microciclo MD (Potenciación Post-Activación en MD-1)</Titulo>
          <P>
            Con las tres fases anteriores consolidadas, la isometría avanzada se integra dentro
            de la periodización semanal por Día de Partido (Manual Metodológico Oficial, Sección
            4): un bloque breve de Overcoming Isometrics de intención máxima en MD-1 (activación)
            puede utilizarse como estímulo de Potenciación Post-Activación (PAP) — una
            contracción voluntaria máxima previa que incrementa transitoriamente la
            excitabilidad neuromuscular y la RFD disponible para la competencia del día
            siguiente.
          </P>
        </Hoja>

        <Hoja>
          <Encabezado eyebrow="06 — Referencias Bibliográficas" />
          <Referencias
            items={[
              'Manual Metodológico Oficial — Área de Fuerza, Club Atlético Unión de Santa Fe (documento interno, Sección 3, desarrollo original de la clasificación Yielding/Overcoming de Natera).',
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
            estándar por autor y año; y la Teoría de Vectores de Fuerza (especificidad angular,
            vectores horizontales/verticales) se asienta como estándar biomecánico propio de la
            Metodología UNIÓN. La referencia de Lum &amp; Zavorsky (2017) fue provista como parte
            del encargo original y no pudo ser corroborada con datos editoriales completos en
            esta sesión — se cita con esa salvedad explícita, en lugar de inventar un dato
            editorial no verificado.
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
          Manual Metodológico Institucional · Escuela de Movimiento e Isometría
        </p>
        <h1 className="text-4xl font-black leading-tight text-union-charcoal">
          Isometría
          <br />
          Avanzada
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
          Fundamentos fisiológicos y neurales, biomecánica de vectores y angulaciones,
          clasificación funcional Overcoming/Yielding, dosificación de carga y progresión
          pedagógica del entrenamiento isométrico aplicado al fútbol.
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
      <span className="font-semibold not-italic text-union-red-600">Profundización: </span>
      {children}
    </p>
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
  { numero: '01', titulo: 'Fundamentos Fisiológicos y Neurales (El Motor Interno)' },
  { numero: '02', titulo: 'Biomecánica y Teoría de Vectores de Fuerza' },
  { numero: '03', titulo: 'Overcoming Isometrics — Aceleración y Sprint' },
  { numero: '04', titulo: 'Yielding Isometrics — Frenado y Cambio de Dirección (COD)' },
  { numero: '05', titulo: 'Progresión Pedagógica y Dosificación Práctica' },
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
      <P>
        Este documento distingue explícitamente los niveles de cita, para no mezclar rigor
        verificado con conocimiento general del campo:
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
          los mecanismos fisiológicos generales y la referencia de Oranchuk et al. (2019) se
          presentan como marco conceptual de consenso, atribución estándar por autor y año — no
          transcripción verbatim de un documento leído en esta sesión. La referencia de Lum
          &amp; Zavorsky (2017) fue provista como parte del encargo original y no pudo ser
          corroborada de forma independiente en esta sesión — se cita con esa salvedad
          explícita.
        </li>
        <li className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-union-charcoal">
            3. Estándar biomecánico propio — Metodología UNIÓN —{' '}
          </span>
          la Teoría de Vectores de Fuerza (especificidad angular de ±15°, diferenciación entre
          vectores horizontales y verticales, Sección 2) se presenta como el estándar de
          aplicación práctica propio del Área de Fuerza del club — no como cita a un tercero
          externo, sino como marco biomecánico institucional.
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
        Este manual es el marco de referencia obligatorio para la prescripción de isometría
        avanzada en el club. Ningún ejercicio se incorpora al programa sin responder primero a
        la pregunta que organiza todo el documento: qué fase del gesto, en qué ángulo y en qué
        dirección de fuerza, se está tratando de mejorar.
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
