# Respaldo científico — Metodología Área de Fuerza (Manual de Fuerza)

Este documento registra el respaldo teórico para la división **Plan GENERAL / Ejercicios
VITAMINA**, la nomenclatura de microciclo por **Día de Partido (MD-4 a MD+1)**, el modelo
**LTAD** por categoría y el **modelo de 3 estaciones** (Racks / Isometría-Vitamina /
Pasto-Jaula) que describe `ManualFuerzaView.tsx`. Se generó analizando la carpeta de Drive
compartida por el usuario: [`Bibliografia — Nueva carpeta de referencia`](https://drive.google.com/drive/folders/1G9uhyueG9QxND-YPXeXqU8qC-KOVPV0P)
(propiedad mixta de `juanirobles11299@gmail.com` y `ezequielmeder@gmail.com`).

**Regla de cero alucinaciones (misma convención que [`fundamentos_cientificos.md`](fundamentos_cientificos.md)):**
cada cita textual de este documento fue verificada leyendo el archivo completo, no un
resumen de metadatos. Cuando una fuente aparece catalogada pero **no** fue leída en
profundidad en este análisis (por tamaño o por no ser prioritaria), se marca explícitamente
como tal — no se le atribuyen citas.

**Hallazgo honesto sobre la naturaleza de la carpeta:** a diferencia de la carpeta
`Bibliografia` usada en la Fase 8 (papers de journals sobre CMJ/RSI/sRPE/ACWR), esta carpeta
nueva es mayormente el archivo de trabajo profesional de Ezequiel Meder (Prof. Educación
Física, Lic. Cs. del Entrenamiento, referente académico IVOLUTION): protocolos de
estandarización de tests (CMJ, IMTP, Drop Jump, McCall, ASH), programas de clientes
individuales de gimnasio, e investigaciones internas comparando pesos libres vs. dispositivos
inerciales/VBT. No es una bibliografía curada específicamente para el desarrollo LTAD de
fútbol formativo — por eso el respaldo de la Sección 3 (LTAD) es más limitado y se dice así
explícitamente en vez de forzar una cita que no existe en la carpeta.

---

## 1. Plan GENERAL vs. Ejercicios VITAMINA

**Fuente leída en profundidad:** *"Periodización del Entrenamiento de Fuerza: Lineal vs.
Ondulante"*, doc. de Google Drive, **Autor: Juan Ignacio Robles** (carpeta `Investigaciones`
del Drive analizado), con bibliografía propia citada: Issurin (2008), Buford et al. (2007),
Rhea et al. (2002), Harries et al. (2015), Kraemer & Ratamess (2004).

**Cita textual, sobre cuándo usar Periodización Lineal (LP):**
> *"Claridad y simplicidad. Ideal para quienes se están iniciando en el entrenamiento
> estructurado **o para grupos grandes donde la individualización es limitada**."*
> *"Suelo pedagógico sólido. Útil en contextos educativos, academias o **deportes
> formativos**."*

Esto es exactamente la situación logística de Unión: turnos de hasta 40 atletas
simultáneos, donde no es viable individualizar cada serie/carga en tiempo real. El **Plan
GENERAL** es la aplicación directa de este principio: una progresión lineal simple,
comunicable y ejecutable en grupo grande, sin requerir seguimiento individual continuo.

Sobre la individualización **dentro** de una estructura grupal, la carpeta aporta un
precedente de club profesional: *"Propuesta Evaluaciones Aptitud Neuromuscular — Defensa y
Justicia 2023-2024.pdf"* (protocolo real de un club de Primera División argentina) asigna
cada batería de tests a un **"Prof. Responsable Área Fuerza"**, y estructura la valoración
para dar seguimiento diferenciado sin desarmar la planificación grupal general. Los
**Ejercicios VITAMINA** aplican esa misma lógica al entrenamiento (no a la evaluación): un
plan general corre para todo el plantel, y encima se agregan bloques puntuales,
individualizados, de bajo requerimiento de espacio/implemento (activación, prevención,
corrección técnica) para el jugador o subgrupo que lo necesita — sin que el resto del grupo
espere.

---

## 2. Nomenclatura de Microciclo (MD-4 a MD+1)

**Misma fuente** (Robles, *Periodización Lineal vs. Ondulante*).

**Cita textual, sobre cuándo usar Periodización Ondulante (UP/DUP/WUP):**
> *"Demandas competitivas concurrentes: deportes de equipo, calendario denso, **múltiples
> partidos por semana**."*
> *"Fases de mantenimiento / mejora simultánea de varias cualidades físicas."*

**Cita textual, sobre el modelo híbrido** (el que efectivamente usa Unión: macrociclo lineal
+ microciclo ondulante anclado al partido):
> *"Muchos entrenadores combinan principios lineales a nivel macro (...) con ondulaciones
> intra-mesociclo para mantener estímulos variados (...) Macro tendencia anual: Base (más
> volumen) → Fuerza → Potencia (lineal). Dentro de cada mes, micro-ondulaciones semanales:
> días de fuerza / potencia / hipertrofia para sostener cualidades (ondulante)."*

Anclar el microciclo al Día de Partido (MD-4 fuerza máxima → MD+1 compensatorio, ver
`src/utils/ai-methodology.ts`) es la traducción directa de este modelo híbrido a la
semana real del club: la variable que ondula semana a semana no es arbitraria, es la
distancia al próximo partido — el caso de uso textual que la propia fuente identifica
("múltiples partidos por semana") para justificar por qué **no** alcanza con periodización
lineal pura durante la Competencia.

---

## 3. Modelo LTAD (10ma a 4ta/Reserva)

**Estado de la fuente:** no se encontró en esta carpeta un documento específico sobre
progresión LTAD en fútbol formativo (alfabetización motora → categorías superiores). El
respaldo disponible es parcial e indirecto:

- La misma fuente de periodización (Robles) ubica explícitamente la Periodización Lineal
  como la apropiada para *"deportistas principiantes"* y *"contextos educativos, academias o
  deportes formativos"*, y la Ondulante para *"atletas avanzados que necesitan estímulos más
  variados para seguir progresando"* — esto respalda la lógica general de **progresión de
  complejidad metodológica por categoría** (simple y lineal en 10ma-7ma, más ondulante y
  específica en 6ta-4ta/Reserva), pero no es una fuente sobre LTAD en fútbol per se.
- *"ORGANIZACIÓN DE LA SESIÓN"* (material de formación interna, E. Meder — **sin cita de
  fuente primaria dentro del propio documento**, se lo trata como marco pedagógico interno,
  no como literatura revisada por pares) define 5 bloques de sesión (Movilidad → Activación
  General → Activación Neuromuscular → Tensión → Duración). Es un esqueleto de sesión
  aplicable a cualquier categoría, escalando qué bloques se enfatizan: las categorías
  formativas trabajan sobre todo Movilidad/Activación (alfabetización motora, sin cargas
  externas), las superiores incorporan de lleno el bloque de Tensión (fuerza máxima) y
  Duración (RFD/transferencia).

**Recomendación honesta:** si se quiere un respaldo específico de LTAD en fútbol (ventanas
de PHV, progresión de carga por edad biológica), conviene pedirle al usuario bibliografía
puntual — no está en esta carpeta.

---

## 4. Modelo de 3 Estaciones — viabilidad sin tecnología de laboratorio

**Fuentes leídas:** *"COMPONENTES DE LA CARGA"* y *"ORGANIZACIÓN DE LA SESIÓN"* (material de
formación interna, E. Meder, sin cita primaria propia — se cita como marco conceptual, no
como estudio).

**Densidad y Frecuencia** (de *Componentes de la Carga*):
> *"Densidad: Relación entre el tiempo de trabajo y el tiempo de pausa (...) Afecta el
> componente metabólico y la recuperación entre esfuerzos."*
> *"Frecuencia: Número de estímulos o sesiones por unidad de tiempo (...) Determina la
> distribución del volumen e intensidad en la semana."*

Con 15 barras para hasta 40 atletas, la restricción real no es teórica — es de turnos: si
todo el plantel esperara su turno en un rack, la densidad de la sesión (trabajo/pausa) se
desploma y la sesión se vuelve inviable en el tiempo disponible. El modelo de 3 estaciones
es, ante todo, una solución de **densidad**: mientras un subgrupo hace el bloque de Tensión
en los racks, otro hace Activación Neuromuscular/Vitamina en el espacio libre y otro trabaja
en el pasto — nadie espera parado, la sesión completa mantiene su densidad objetivo.

**Mapeo estación → bloque de sesión** (de *Organización de la Sesión*):
- **Racks Internos** → Bloque de **Tensión** ("núcleo del entrenamiento: cargas
  significativas en patrones multiarticulares (...) clave para fuerza e hipertrofia").
- **Espacio Libre (Isometría/Vitamina)** → Bloque de **Activación Neuromuscular**
  ("estimula el SNC mediante ejercicios explosivos/coordinativos (...) potenciar la tasa de
  desarrollo de la fuerza (RFD)") — consistente con la isometría de Natera ya documentada en
  `MetodologiaIsometriaView.tsx`, y el terreno natural para los ejercicios Vitamina
  individualizados (bajo requerimiento de espacio/implemento, ver Sección 1).
- **Pasto / Jaula Exterior** → conecta con el bloque de **Duración** (trabajo específico,
  transferencia) y con la fase de Potencia del macrociclo (Robles, *Periodización*: *"DLO,
  velocidad de ejecución alta"*).

**Descarte explícito de tecnología de laboratorio:** la carpeta confirma que el estándar de
"punta" en evaluación de fuerza en fútbol profesional usa plataformas dinamométricas,
dinamómetros y encoders de velocidad (protocolo Defensa y Justicia; *"TECNOLOGÍA APLICADA A
LA EVALUACIÓN DE LA FUERZA"*, E. Meder, que cita a su vez a Miller, Comfort & McMahon,
*Laboratory Manual for Strength and Conditioning*). Unión no tiene ni necesita esa
instrumentación para **entrenar**: el modelo de 3 estaciones aplica los mismos principios de
carga (tensión mecánica, activación neuromuscular, densidad) sin plataformas ni encoders,
priorizando entrenar a los 40 atletas del turno por sobre medir con precisión de laboratorio
a unos pocos. La evaluación de precisión (si se justifica en el futuro) es un proyecto
aparte, no una condición para que el modelo de estaciones funcione.

---

## 5. Fuentes consultadas

| Archivo / Documento | Autor(es) | Estado | Uso en este documento |
|---|---|---|---|
| Periodización del Entrenamiento de Fuerza: Lineal vs. Ondulante | Robles, J.I. (carpeta `Investigaciones`) | ✅ Leído completo, con citas textuales | Secciones 1, 2, 3 |
| Propuesta Evaluaciones Aptitud Neuromuscular — Defensa y Justicia 2023-2024.pdf | Prof. Responsable Área Fuerza (club Defensa y Justicia) | ✅ Leído completo | Sección 1 |
| ORGANIZACIÓN DE LA SESIÓN | E. Meder (material de formación interna, sin cita primaria propia) | ✅ Leído completo | Secciones 3, 4 |
| COMPONENTES DE LA CARGA | E. Meder (ídem) | ✅ Leído completo | Sección 4 |
| TECNOLOGÍA APLICADA A LA EVALUACIÓN DE LA FUERZA | E. Meder, cita a Miller, Comfort & McMahon | ✅ Leído completo | Sección 4 |
| Protocolo de Entrenamiento / Propuesta de intervención (comparación pesos libres vs. inerciales) | E. Meder / J.I. Robles (`Investigaciones`) | ✅ Leído completo | Contexto — confirma que pesos libres es un brazo de comparación válido, usa equipamiento de laboratorio (encoders, fotocélulas) que Unión no tiene |
| Badillo.pdf | González Badillo, J.J. | 🟡 Catalogado, no leído en profundidad en este análisis | No citado |
| Principios del entrenamiento de la fuerza y del acondicionamiento físico (NSCA) | Haff, G.G. & Triplett, N.T. | 🟡 Catalogado, no leído en profundidad | No citado |
| Turner & Comfort. Advanced Strength and Conditioning | Turner, A. & Comfort, P. | 🟡 Catalogado, no leído en profundidad | No citado |
| Desarrollo-de Rendimiento-Futbol(Híbrido).docx | — | ⚠️ Leído — es una propuesta comercial para una academia de **tenis**, no aplica pese al nombre del archivo | Descartado |

No se encontró en esta carpeta bibliografía específica sobre LTAD en fútbol formativo — ver
nota de la Sección 3.
