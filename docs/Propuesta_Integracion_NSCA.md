# Auditoría NSCA: Expansión del AMS Unión

## Club Atlético Unión de Santa Fe · Athlete Management System

**Autor:** Análisis solicitado por Mg. Juan Ignacio Robles — Director de Ciencias del Deporte
**Redactado por:** Claude (rol asumido: Director de Ciencias del Deporte / CSCS / Arquitecto AMS)
**Naturaleza del documento:** Auditoría de brechas ("gap analysis") entre el estado actual del
software y las mejores prácticas internacionales de evaluación, periodización, monitoreo y
Return to Play, con propuestas concretas de módulos a construir. **No contiene código** — es
el documento de arquitectura previo a la implementación.

---

## Nota metodológica sobre las fuentes citadas

Esta es la **segunda versión** de este documento. La primera (commit anterior) se escribió sin
acceso al PDF del libro y lo dijo explícitamente. En esta versión **sí leí el PDF real** que se
adjuntó: *G. Gregory Haff y N. Travis Triplett (eds.), Principios del entrenamiento de la
fuerza y del acondicionamiento físico (4.ª ed.), Paidotribo, 2017 — traducción de Essentials of
Strength Training and Conditioning, NSCA, 2016*. Siguiendo el mismo estándar de
[`fundamentos_cientificos.md`](fundamentos_cientificos.md), distingo:

1. **Citas verificadas** — leídas página por página en esta sesión, con capítulo, autor del
   capítulo y página exacta. Son la base de las secciones "Qué dice el libro" de cada apartado.
2. **Literatura complementaria (no está en este libro)** — cuando una herramienta de moda en
   ciencias del deporte (TQR, VBT con encoder, Índice de Hooper) no aparece en este texto, lo
   digo explícitamente en vez de fingir que sí. Confirmé esto con una búsqueda de texto
   completo sobre las 1.537 páginas del PDF: **"TQR" (0 apariciones), "wellness" (0), "cuestionario de
   bienestar" (0), "Índice de Hooper" — la palabra "Hooper" aparece 1 sola vez, y es el
   apellido de un autor en la bibliografía (Szivak, Hooper, et al.), no el cuestionario de Sarah
   Hooper.** Es decir: **el Índice de Hooper y el TQR NO son parte de este libro de la NSCA** — son
   literatura complementaria real (Hooper et al. 1995; Kenttä & Hassmén 1998), pero atribuirlos a
   *este* texto habría sido una alucinación. Lo mismo con "monotonía/strain" al estilo Foster: el
   libro usa la palabra "monotonía" de forma genérica (aburrimiento del entrenamiento, un ítem
   más en la lista de errores de programación), no la fórmula de Foster (media/desvío estándar) —
   esa fórmula tampoco es de este libro.

Qué capítulos leí (de los 24 del libro), completos o en las secciones relevantes:
**Capítulo 12** (Principios de la selección y administración de pruebas, McGuigan, pp.
551-572, completo), **Capítulo 13** (Administración, puntuación e interpretación de las
pruebas seleccionadas, McGuigan, pp. 573-635, completo), **Capítulo 21** (Periodización,
Haff, pp. 1216-1245, completo), **Capítulo 22** (Rehabilitación y reacondicionamiento físico,
Potach y Grindstaff, pp. 1253-1285, completo), y las secciones de sobreentrenamiento del
**Capítulo 5** (Adaptaciones a los programas de entrenamiento anaeróbico, French, pp. 253-267).

---

## Resumen ejecutivo

El AMS Unión ya cubre con solidez el **microciclo semanal** (Planificador, Cuadrantes de Bove,
Planillas de Fuerza), la **carga interna diaria** (sRPE, Wellness/Hooper normalizado, ACWR con
período de gracia) y un **modelo de progresión juvenil** (LTAD por franja etaria). Frente al
libro de la NSCA, la brecha más grande está en los **tres niveles que rodean al microciclo**:

| Nivel NSCA | Estado actual del AMS Unión | Brecha |
|---|---|---|
| **Testeo y evaluación** (batería, perfil del atleta) | No existe — no hay batería estandarizada ni perfil de rendimiento | 🔴 Crítica |
| **Periodización macro/meso** (temporada completa) | No existe — sólo semana a semana | 🔴 Crítica |
| **Monitoreo de sobreentrenamiento más allá de ACWR/Hooper** | Parcial — falta un checklist diferencial y marcadores hormonales/psicológicos | 🟡 Media |
| **Return to Play estructurado** | No existe — Área Médica y Área de Fuerza no están conectadas por un flujo formal | 🔴 Crítica |

---

## 1. Módulo de Evaluación y Batería de Test (Testing)

### 1.1 Qué dice el libro (Caps. 12 y 13, McGuigan)

**Orden de la batería.** El capítulo 12 es explícito sobre la secuencia de pruebas para no
contaminar resultados con fatiga acumulada. Cita textual (p. 568): *"Una secuencia lógica,
aunque haya algunas variaciones, pasa por administrar pruebas en este orden: 1. Pruebas no
fatigantes (p. ej., mediciones de la altura, el peso, la flexibilidad y los pliegues cutáneos y
perímetros del cuerpo, salto vertical). 2. Pruebas de agilidad (...). 3. Pruebas de fuerza y
potencia máximas (p. ej., 1RM, cargada de potencia, 1RM en sentadilla). 4. Pruebas de
velocidad (...). 5. Pruebas de resistencia de musculatura localizada (...). 6. Pruebas de
capacidad anaeróbica (...). 7. Pruebas de capacidad aeróbica (...)"*. Además: al menos 2 minutos
de descanso entre intentos cercanos al máximo, y 5 minutos entre pruebas distintas de una serie
(p. 566).

**Validez y fiabilidad no son opcionales.** El capítulo dedica su primera mitad a esto: la
*validez* (que la prueba mida lo que dice medir — de constructo, aparente, de contenido,
referida a criterios) y la *fiabilidad* (test-retest, entre evaluadores) son "los factores clave
para evaluar la calidad de las pruebas y deben estar presentes para que sean provechosas" (p.
554). Un detalle muy relevante para nuestro contexto de club amateur con cronómetro manual: *"las
marcas en esprines cronometradas manualmente son hasta 0,24 segundos más rápidas que los
esprines medidos electrónicamente"* (p. 578) — si el club algún día usa fotocélulas, el software
debe distinguir el método de cronometraje como metadato de cada test, porque **no son
comparables entre sí**.

**Batería de pruebas — protocolos exactos que leí en el Cap. 13:**

| Categoría | Test (numeración del libro) | Protocolo resumido |
|---|---|---|
| Fuerza máxima | 13.1-13.3: 1RM en press de banca, remo en banca, sentadilla trasnuca | Calentamiento con 5-10 reps a carga ligera-moderada, luego 2 series de 2-5 reps con más peso, luego 3-5 intentos posteriores al calentamiento para hallar 1RM con margen de error de pocos % (p. 574) |
| Potencia (fuerza a alta velocidad) | 13.6-13.8: Salto vertical, salto vertical estático, **Índice de Fuerza Reactiva (RSI)** | RSI = altura del salto ÷ tiempo de contacto, medido con alfombrilla de contacto desde cajones de distinta altura, "para obtener un perfil de la tolerancia a los estiramientos del atleta" (p. 593) |
| Agilidad | 13.18-13.21: Test T, prueba del hexágono, agilidad 10×5m, **agilidad 505** | Test T: circuito de 4 conos, 9,1m totales, mejor de 2 intentos con margen de 0,1s (p. 606) |
| Velocidad | 13.22: Esprín en línea recta con splits | Distancia específica (ej. 10m/20m/40m) con 18m de zona de desaceleración tras la meta, cronómetro electrónico recomendado (p. 611) |
| Equilibrio | 13.23-13.24: BESS, SEBT (Star Excursion Balance Test) | BESS: 6 posturas × 20s con ojos cerrados, se cuentan errores (p. 612) |
| Composición corporal | 13.27: Pliegues cutáneos (8 puntos) | Error típico de estimación mínimo ±3-5% — "hay que tener en cuenta el ETE e informar del margen de porcentajes" (p. 621), nunca un número seco |

### 1.2 Estadística del perfil atlético — el método exacto del libro (Cap. 13, pp. 627-634)

Esto es lo más directamente trasladable a código de todo lo que leí. El libro define, con
fórmulas:

- **Puntuación z**: `z = (puntuación del atleta − media del grupo) / desviación estándar del
  grupo`. Cita: *"Las gráficas son un medio útil para representar visualmente las puntuaciones
  z. Proporcionan al especialista de la fuerza y el acondicionamiento físico una comparación de
  diferentes capacidades físicas y ayudan a la toma de decisiones sobre qué debilidades
  revertir"* (p. 630) — y la Figura 13.21 del libro es **literalmente un gráfico de barras de
  z-scores de un atleta contra el promedio del equipo (cero = promedio)**. Esto es exactamente
  el "radar/comparador" que proponemos abajo, ya con su forma validada por el propio libro (no
  hace falta inventar un radar chart — un bar chart de z-scores centrado en cero, que ya sabemos
  construir con `recharts`, es la forma que el libro mismo usa).
- **Cambio mínimo relevante**: `0,2 × desviación estándar entre sujetos` (p. 632) — el umbral
  para decir "esto no es ruido de medición, es una mejora real".
- **Magnitud del efecto**: `(media post − media pre) / desviación estándar pre-entrenamiento`,
  con escalas de referencia: pequeño (0,2), moderado (0,6), grande (1,2), muy grande (2) (p.
  633).
- **6 pasos para construir un "perfil atlético"** (p. 633-634): (1) elegir tests que midan los
  parámetros del deporte, (2) elegir tests válidos/fiables en el orden correcto, (3)
  administrar a todos los atletas posibles, (4) calcular cambio mínimo relevante y comparar
  contra normativas, (5) repetir pruebas y armar el perfil visual, (6) usar los resultados para
  diseñar el programa.

### 1.3 Estructura de datos propuesta

```
testing_sessions
  id, athlete_id, season_id, category_id, fecha, tipo_bateria, notas

testing_results
  id, testing_session_id, test_key (ej. "1rm_sentadilla_kg", "rsi_20cm",
  "sprint_10m_s", "agilidad_505_izq_s", "bess_errores"), valor, unidad,
  metodo_cronometraje (manual | electrónico — por la diferencia de 0,24s citada arriba)

athlete_benchmarks (calculado, no cargado a mano)
  athlete_id, test_key, z_score (vs. su categoría/posición), cambio_minimo_relevante,
  magnitud_efecto_vs_test_anterior
```

### 1.4 Módulo propuesto: **"Perfil de Rendimiento 360°"**

- **Gráfico de z-scores** (bar chart centrado en cero, no un radar — así lo hace el propio
  libro en su Figura 13.21) por test, con `recharts` (ya instalado desde Fase 27).
- **Magnitud del efecto** entre dos testeos consecutivos, mostrada como badge ("Efecto grande:
  +1,3") en vez de un simple "% de mejora" — evita el error que el libro señala explícitamente:
  comparar sólo el % de cambio castiga a los atletas ya bien entrenados, que tienen menos
  margen de mejora (p. 628).
- **Semáforo de asimetrías**: umbral de alerta en diferencias laterolaterales de fuerza/función
  > 10% — este número **no es una estimación mía, es una cita textual del Cap. 22 de RTP** (ver
  sección 4), pero el libro lo usa también como criterio de alta, así que lo reutilizamos acá
  como criterio de riesgo general.
- **Metadato de método de medición** (manual/electrónico, tipo de báscula, etc.) en cada test,
  para no comparar peras con manzanas al construir la serie histórica de un atleta.

---

## 2. Periodización a Largo Plazo (Macrociclo y Mesociclo)

### 2.1 Qué dice el libro (Cap. 21, Haff)

**Jerarquía exacta** (Tabla 21.1, p. 1224): Plan multianual (2-4 años) → Plan anual de
entrenamiento (1 año) → Macrociclo (varios meses a 1 año) → **Mesociclo (2-6 semanas, "la
duración más habitual son 4 semanas")** → **Microciclo (varios días a 2 semanas, "la duración
más habitual es 1 semana, 7 días")** → Día de entrenamiento → Sesión de entrenamiento.

**Tres teorías mecanicistas** que sostienen toda periodización (pp. 1218-1223):

1. **Síndrome General de Adaptación (SGA)**, de Hans Selye (1956): alarma → resistencia
   (adaptación/supercompensación) → agotamiento (si el estrés persiste demasiado).
2. **Teoría del estímulo-fatiga y la recuperación-adaptación**: a mayor magnitud del estímulo,
   más fatiga se acumula y más tarda la recuperación completa; el libro aclara explícitamente
   que *"no siempre es necesario alcanzar un estado de recuperación completa antes de iniciar
   una nueva tanda o sesión"* (p. 1220).
3. **Paradigma de la condición física y la fatiga** (Zatsiorsky): `Preparación = Forma física +
   Fatiga` — ambos efectos se suman a cada estímulo; *"el cansancio se disipa con más rapidez
   que la forma física, con lo cual el nivel de preparación aumenta si se usan estrategias de
   entrenamiento apropiadas"* (p. 1222). **Este es el modelo teórico exacto que fundamenta
   cualquier "índice de disposición compuesto" que combine carga y fatiga** — no es una idea
   nuestra, es el marco central del capítulo de periodización de la NSCA.

**Los 4 períodos y sus rangos exactos de %1RM/series/reps** (Tabla 21.2, p. 1229 en adelante):

| Período | Fase | Intensidad | Volumen |
|---|---|---|---|
| Preparatorio | Hipertrofia/fuerza resistencia | 50-75% 1RM | 3-6 series × 8-20 reps |
| Preparatorio | Fuerza básica | 80-95% 1RM | 2-6 series × 2-6 reps |
| Primera transición | Fuerza/potencia | 30-95% 1RM (según ejercicio) | 2-5 series × 2-5 reps |
| Competitivo | Pico de rendimiento | 50->93% 1RM | 1-3 series × 1-3 reps, 1-2 semanas |
| Competitivo | Mantenimiento (deportes de temporada larga) | 85-93% 1RM | 2-5 series × 3-6 reps |
| Segunda transición | Reposo activo | Muy bajo | 1-4 semanas, "no debe durar más de 4 semanas" |

**Tapering, con cifras exactas del libro** (p. 1219, p. 1231): *"los picos del rendimiento solo
mejoran durante períodos cortos de tiempo (7-14 días), y el tiempo medio durante el que se
mantienen es inversamente proporcional a la intensidad media del plan de entrenamiento"*. La
estrategia de pico se ejecuta reduciendo volumen mientras la intensidad se mantiene relativamente
alta (dentro del rango 50->93% 1RM según la fase del pico), nunca bajando ambas variables a la
vez — bajar las dos a la vez es desentrenamiento, no tapering.

**Lineal vs. ondulante — el libro corrige un malentendido común** (pp. 1236-1237): llamar
"lineal" al modelo tradicional es, según el propio texto, **una denominación falsa** —
*"un examen más de cerca del modelo tradicional (...) muestra que contiene una variación no
lineal en la intensidad y el volumen de carga del entrenamiento a nivel del microciclo"* (p.
1236). La diferencia real entre el modelo "tradicional" y el "ondulante" (mal llamado "no
lineal") es que el ondulante varía series/reps/objetivo día a día dentro de la MISMA semana
(ej. fuerza el martes, hipertrofia el jueves, potencia el sábado), mientras el tradicional varía
sobre todo la carga entre semanas. El libro no declara un ganador — cita evidencia en ambas
direcciones (pp. 1237).

**Ejemplo de plan anual real que el libro desarrolla en detalle** (pívot de baloncesto
universitaria, pp. 1238-1245): fuera de temporada 14 semanas → pretemporada 3,5 meses →
plena temporada 20 semanas (mesociclos de 4 semanas, el 5.º microciclo de cada uno es
descarga) → postemporada 1 mes. El detalle de "mesociclo de 4 semanas con la última semana de
descarga" es un patrón concreto y reutilizable.

### 2.2 Módulo propuesto: **"Torre de Control de Temporada"**

- **Timeline de Mesociclos** estilo Gantt, con los 4 períodos del libro como fases predefinidas
  (Preparatorio General/Específico, Primera Transición, Competitivo, Segunda Transición),
  arrastrables sobre el calendario — mismo patrón de Drag & Drop que `TemplateLibraryPanel`.
- **Gráfico Volumen vs. Intensidad**: Volume Load semanal (izquierda, el mismo cálculo que ya
  existe como Tonelaje) vs. %1RM promedio del período (derecha) — `LineChart` dual-axis con
  `ReferenceArea` de fondo por mesociclo (recharts, Fase 27).
- **Calculadora de Tapering**: el profe marca la fecha objetivo, el sistema aplica la regla del
  libro (pico sostenible 7-14 días, reduce volumen preservando intensidad relativa) y proyecta
  el Volume Load objetivo semana a semana.
- **Plantilla de mesociclo "4+1"**: bloque de 4 semanas con la 5.ª como descarga automática,
  reutilizando el patrón exacto del ejemplo del libro.

---

## 3. Monitoreo de Carga y Fatiga (Load Management)

### 3.1 Qué dice el libro (Cap. 5, French, pp. 254-261) — el continuo del sobreentrenamiento

El libro no usa "Wellness" ni "TQR" (confirmado por búsqueda de texto completo, ver nota
metodológica), pero sí desarrolla en profundidad el **continuo de sobreentrenamiento**, que es
el marco clínico real detrás de cualquier alerta de fatiga:

1. **Extralimitación Funcional (EF)**: decremento de rendimiento a *corto plazo*, recuperable en
   días o semanas — de hecho, "se puede prescribir como una fase planificada" (p. 254), es la
   base fisiológica de la supercompensación.
2. **Extralimitación No Funcional (ENF)**: si el estímulo sigue sin recuperación adecuada,
   estancamiento y decremento que dura semanas o meses.
3. **Síndrome de Sobreentrenamiento (SSE)**: "inadaptación prolongada" de los sistemas
   biológicos, neuroquímicos y hormonales — puede durar 6+ meses y "arruinar la carrera de un
   deportista" (p. 255). Dos subtipos: simpático (atletas jóvenes, entrenamiento de
   velocidad/potencia) y parasimpático (todos los estados terminan derivando a este).

**El checklist diferencial exacto del libro para sospechar EF/SSE** (p. 260) — esto es
directamente digitalizable como una herramienta:

1. Síntomas: infrarrendimiento inexplicable, fatiga persistente, mayor percepción del esfuerzo,
   trastorno del sueño, pérdida de apetito.
2. Puntuaciones peores que en pruebas anteriores (esfuerzo máximo, signos vitales).
3. Errores de diseño del programa: **aumento de volumen >5%, aumento de intensidad, monotonía
   del entrenamiento, frecuencia elevada de competiciones.**
4. Factores de confusión: alteración del POMS (Perfil de los Estados de Ánimo), RPE por encima
   de lo normal, factores sociales, viajes con cambio de huso horario.
5. Criterios de exclusión médica (anemia, infecciones, daño muscular, trastornos endocrinos,
   etc.) — a cargo del Área Médica, no del profe.

**Marcadores biológicos, con la advertencia más importante del capítulo citada textualmente**
(p. 260): *"ningún marcador por sí solo se puede tomar como un indicador de una EF inminente
(...) debería plantearse la monitorización constante de una combinación de variables
fisiológicas, bioquímicas, inmunológicas, psicológicas y del rendimiento"*. Esto incluye
explícitamente: la variabilidad de la frecuencia cardíaca (que "disminuye con el inicio del
SSE", p. 300), la relación testosterona/cortisol (histórica pero "no se puede emplear con
propósitos diagnósticos" en solitario, p. 259), y el POMS.

### 3.2 Literatura complementaria (no está en este libro, pero es real y relevante)

Para no repetir el error de la primera versión de este documento, marco esto explícitamente
como **fuera del libro leído**, aunque siga siendo ciencia real y válida para justificar
herramientas:

- **TQR (Total Quality Recovery)**: Kenttä, G. & Hassmén, P. (1998). *Overtraining and
  recovery: a conceptual model*. Sports Medicine, 26(1), 1-16.
- **Índice de Hooper (Wellness)**: Hooper, S.L. et al. (1995). *Markers for monitoring
  overtraining and recovery*. Medicine & Science in Sports & Exercise, 27(1) — ya integrado en
  el AMS Unión desde Fase 9/25, correctamente atribuido en su momento.
- **VBT (Velocity Based Training)**: no aparece en esta edición del libro (2016/2017); es una
  práctica más reciente y extendida sobre todo vía literatura post-2018.

### 3.3 Módulo propuesto: **"Checklist Diferencial de Sobreentrenamiento"**

A diferencia de la versión anterior de este documento (que proponía directamente un "Índice de
Disposición Compuesto" numérico), lo que el libro realmente respalda es un **checklist
estructurado, no un único número mágico** — la cita de la p. 260 es explícita sobre esto. Propuesta
revisada:

- Un formulario digital de 5 preguntas (calcado del checklist del libro) que el Área Médica o el
  profe completa cuando sospecha EF/ENF en un jugador puntual — no un cálculo automático
  ejecutándose todos los días para todos, sino una **herramienta de diagnóstico dirigido** que
  se abre desde la tarjeta del jugador en `DashboardEquipo` cuando su Risk Score (Fase 20) o su
  Alerta de Fatiga (Fase 24/26) ya vienen marcando algo.
- El campo "Monotonía del entrenamiento" del checklist (punto 3 de la lista) se autocompleta
  con la Monotonía de Foster que YA calculamos (Fase 24) — es un dato que el software ya tiene,
  sólo hay que engancharlo a este checklist en vez de dejarlo aislado en la tarjeta.
- El campo "RPE por encima de lo normal" (punto 4) se autocompleta con el sRPE ya existente.
- Los campos de exclusión médica (punto 5) quedan como responsabilidad exclusiva del Área
  Médica, con un link directo al perfil médico del jugador.

Esto es más fiel al libro que un "índice compuesto" automático: la NSCA describe un proceso de
*diagnóstico diferencial guiado por un profesional*, no un semáforo algorítmico solo — el
software debe **asistir esa conversación**, no reemplazarla.

---

## 4. Return to Play (RTP) / Rehabilitación

### 4.1 Qué dice el libro (Cap. 22, Potach y Grindstaff) — el modelo real es de 3 fases, no 6

**Corrección importante respecto a la primera versión de este documento**: propuse ahí un
modelo genérico de 6 fases de consenso deportivo. El libro de la NSCA en realidad estructura el
RTP alrededor de las **3 fases de curación tisular** (Tabla 22.1, p. 1262), que es un modelo más
preciso y con objetivos de tratamiento explícitos en cada una:

| Fase | Duración típica | Objetivo del tratamiento | Ejercicio permitido |
|---|---|---|---|
| **Respuesta inflamatoria** | Días 1-7 ("por lo general menos de una semana") | Prevenir más daño tisular; mantener función de zonas sanas | Ningún ejercicio activo en la zona dañada; entrenamiento de extremidades sanas |
| **Reparación fibroblástica** | Desde el día 2 hasta 8 semanas | Prevenir atrofia excesiva sin romper el colágeno nuevo; movilidad controlada temprana | Isométrico submáximo indoloro, propiocepción/equilibrio, superficies inestables |
| **Maduración y remodelación** | Meses a años | Optimizar función tisular, progresar a specificidad del deporte | Fortalecimiento por ángulo/velocidad específicos, cadena cinética cerrada y abierta |

**Principio rector citado textualmente** (p. 1270): *"las decisiones sobre la vuelta a la
actividad o a la competición se deben tomar (...) siguiendo una **progresión basada en
criterios** con objetivos predeterminados"* — no una fecha de calendario. Los criterios típicos:
grado de movilidad, fuerza, pruebas funcionales y un cuestionario de resultados percibidos por
el propio atleta.

**El criterio numérico de alta que sí está en el libro** (p. 1283, no una estimación mía):
*"Las diferencias laterolaterales en la fuerza y el rendimiento funcional **inferiores al 10%**
tal vez se consideren aceptables"* — equivalente a un Limb Symmetry Index ≥90%, comparado contra
la extremidad sana o contra valores normativos.

**El equipo de medicina del deporte, con roles exactos** (pp. 1254-1257): médico del equipo
(autoridad final sobre el alta), entrenador deportivo/EDT (rehabilitación diaria, "el que más
contacto tiene con el atleta"), fisioterapeuta, **especialista de fuerza y acondicionamiento
físico** ("papel valioso (...) integral del proceso de rehabilitación y reacondicionamiento
físico", el que diseña la reintroducción de carga), fisiólogo del ejercicio, nutricionista,
psicólogo deportivo. El libro insiste en una reunión semanal con preguntas fijas: *"¿Cuál es el
estado actual del atleta? ¿Qué ejercicios está practicando? ¿Hay restricciones? ¿Cómo está
progresando? ¿Hay que cambiar el programa?"* (p. 1258).

**Dos formularios reales que el libro incluye** (Figuras 22.1 y 22.2, p. 1260-1261): un
"formulario de derivación a rehabilitación" con indicaciones/contraindicaciones por ejercicio, y
un "formulario de resumen de fuerza y acondicionamiento físico" donde el especialista F&A
registra qué hizo el atleta y su respuesta subjetiva/objetiva. **Estos dos formularios son,
literalmente, la especificación de producto de nuestro módulo de RTP** — no hay que inventar
qué campos debe tener, el libro ya los define.

**Protocolos concretos de progresión de carga citados** (p. 1278-1279, Tabla 22.2): sistema De
Lorme (3×10, 50%→75%→100% de 10RM), sistema Oxford (inverso: 100%→75%→50%), y **ERPAD
(Ejercicio de Resistencia Progresiva Ajustable Diariamente)**: 4 series donde el número de
repeticiones logradas en la 3.ª serie (al 100% de 1RM estimada) determina automáticamente el
ajuste de carga de la 4.ª serie y de la siguiente sesión — un algoritmo determinista, fácilmente
codificable como calculadora.

**Reducción de riesgo de recaída** (p. 1282-1284): la lesión previa es "uno de los factores de
riesgo más sustanciales" de una lesión nueva. Programas nombrados: Sportsmetrics y PEP
(*prevent injury and enhance performance*) para el LCA, "Programa de Diez Ejercicios para
Lanzadores" para el hombro.

### 4.2 Flujo de trabajo propuesto: **"Puente Médico-Fuerza"** (revisado)

```
rtp_protocols
  id, athlete_id, lesion_descripcion, fecha_inicio,
  fase_actual (respuesta_inflamatoria | reparacion_fibroblastica | maduracion_remodelacion),
  criterio_progresion_actual, creado_por (Área Médica)

rtp_fase_historial
  id, rtp_protocol_id, fase, fecha_entrada, fecha_salida, aprobado_por,
  lsi_pct (referencia a testing_results — el % laterolateral del test de alta de esa fase)

rtp_registro_sesion  -- digitaliza la Figura 22.2 del libro
  id, rtp_protocol_id, fecha, ejercicios_realizados, respuesta_subjetiva,
  respuesta_objetiva, cargado_por
```

- El **Área Médica** abre el protocolo con la fase inicial (reemplaza el toggle plano
  `estadoSalud` actual) y las indicaciones/contraindicaciones — digitalización directa de la
  Figura 22.1.
- El **Área de Fuerza** ve un badge "🩺 RTP — Reparación fibroblástica" en el Planificador y la
  Terminal de Fuerza, con la lista de ejercicios contraindicados resaltada en la Planilla.
  Cada sesión que registra queda en `rtp_registro_sesion` — la Figura 22.2 digitalizada.
- El criterio de avance de fase hacia "Maduración y remodelación" se apoya en el **Perfil de
  Rendimiento 360°** (sección 1): cuando el LSI de un test relevante (ej. CMJ unilateral) supera
  el 90% (<10% de diferencia, la cifra exacta del libro), el sistema **sugiere** el avance —
  nunca lo aprueba solo, coherente con que el libro pone la decisión final en el médico del
  equipo, no en un algoritmo.
- **Calculadora ERPAD** como utilidad standalone dentro del módulo: el profe carga las
  repeticiones logradas en la 3.ª serie y el sistema aplica la Tabla 22.2 del libro para sugerir
  el ajuste de la 4.ª serie y de la sesión siguiente — la única parte de este documento que es
  un algoritmo 100% determinista y trasladable a código sin ambigüedad.

---

## Roadmap de priorización sugerido

1. **Fase 30 — Testing y Perfil de Rendimiento 360°**: base de datos que necesitan tanto la
   Torre de Control (para saber si el entrenamiento mueve la aguja) como el RTP (criterio de
   alta por LSI).
2. **Fase 31 — Puente Médico-Fuerza / RTP**: mayor impacto de riesgo/beneficio — es el único de
   los cuatro que toca directamente la salud de un jugador lesionado, y ya tiene su
   especificación casi lista (las dos figuras del libro).
3. **Fase 32 — Checklist Diferencial de Sobreentrenamiento**: extiende lo que ya existe
   (Hooper, ACWR, Foster) enganchándolo a un proceso de diagnóstico guiado en vez de dejarlo
   como badges sueltos.
4. **Fase 33 — Torre de Control de Temporada**: el más "visionario" y el que menos urgencia
   operativa tiene semana a semana.

---

## Cierre

Esta segunda versión corrige tres errores concretos de la primera (escrita sin el PDF):
atribuir el Índice de Hooper y la fórmula de Monotonía de Foster a este libro cuando no están
en él, y proponer un modelo de RTP de 6 fases genérico cuando el libro en realidad usa un
modelo de 3 fases basado en curación tisular, con dos formularios de referencia ya definidos.
El resto de la arquitectura propuesta (Perfil 360°, Torre de Control, Puente Médico-Fuerza) se
mantiene, pero ahora cada pieza está anclada a una página y una cita concreta del texto que se
nos pidió auditar, no a una síntesis general del campo.
