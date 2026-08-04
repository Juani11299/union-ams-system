# Fundamentos científicos — Fase 8

Este documento registra, métrica por métrica, la regla de negocio aplicada en el código y
la evidencia real que la respalda (archivo fuente, autor y año). Se generó a partir de un
análisis exhaustivo de dos fuentes provistas explícitamente por el usuario:

1. **Google Drive → carpeta "Bibliografia"** (compartida por `ezequielmeder@gmail.com`, y la
   carpeta "Bibliografia" propia de `juanirobles11299@gmail.com`).
2. **Carpeta local `~/Desktop/Maestria Real Madrid`** — incluye el propio Trabajo Fin de
   Máster (TFM) del usuario.

**Filtro de disciplina aplicado:** todas las fuentes citadas abajo estudian deportes de
conjunto (fútbol, baloncesto, voleibol, balonmano, rugby). No se utilizó ningún artículo
sobre deportes individuales para calibrar la lógica de negocio.

**Regla de cero alucinaciones:** cada cita de la Sección 1 fue verificada leyendo el PDF
original (extracción de texto completo, no resumen de metadatos). La Sección 2 (sRPE/ACWR)
fue actualizada en **Fase 8.1** con citas que el propio usuario aportó directamente (no
encontradas por Claude en las carpetas indicadas) — se marcan explícitamente como tales.

---

## 1. Alerta de Fatiga Neuromuscular (CMJ / RSI modificado)

### Hallazgo central de la bibliografía

El hallazgo más consistente en las 8 fuentes revisadas es que **la altura del salto (CMJ,
en cm) es una métrica de baja sensibilidad para detectar fatiga neuromuscular real**: se
mantiene prácticamente estable incluso cuando el atleta está objetivamente fatigado, porque
compensa modificando su estrategia de movimiento (tiempo de contracción, profundidad del
contramovimiento, etc.). Este es precisamente el tema del propio TFM del usuario.

- **Fuente:** `Trabajo Fin de Master- Robles Juan Ignacio..pdf` (carpeta local
  `Maestria Real Madrid/Trabajo FIN DE MASTER/entrega final/`).
  **Autor:** Robles, Juan Ignacio (2026). Dirigido por PhD. Javier Olaya Cuartero.
  **Título:** *"Alteraciones en las fases del Salto con Contramovimiento (CMJ) como
  indicador de fatiga neuromuscular en deportes de conjunto: Una Revisión Sistemática"*.
  **Conclusión citada textualmente:** *"las variables derivadas de la curva fuerza-tiempo
  del salto con contramovimiento (CMJ), como el tiempo de contracción, la duración de la
  fase de frenado, la RFD excéntrica y el mRSI, son significativamente más sensibles a la
  fatiga neuromuscular y a la carga acumulada que la altura del salto."*

- **Fuente:** `SPSR293_Marques GoogleScholar.pdf` (Drive, carpeta `Bibliografia/CMJ- Salto
  Vertical/`, citado también en el TFM anterior).
  **Autor:** Marques, J.B. et al. (2026). *"Jump Height Lies: Force–Time CMJ Metrics
  Reveal Hidden Neuromuscular Responses in Elite Football"*. Sport Performance & Science
  Reports, 293.
  **Cita textual (Practical Applications):** *"RSI modified, early concentric impulse, and
  concentric peak force were approximately 2-4 times more sensitive than jump height,
  making them more suitable for detecting post-match neuromuscular changes."* Jump height
  varió apenas -0.12 a +0.11 (d de Cohen) entre niveles de exposición al partido, mientras
  el RSI modificado sí mostró cambios sistemáticos.

### Umbral de intervención (RSI modificado) — el número usado en el código

- **Fuente:** `MartinezDanielJASCRSIRSImodFTCTasMonitoringTools.pdf` (Drive, carpeta
  `Bibliografia/DSI/`).
  **Autor:** Martinez, D. (2016). *"The Use of Reactive Strength Index, Reactive Strength
  Index Modified, and Flight Time:Contraction Time as Monitoring Tools"*. Journal of the
  Australian Strength and Conditioning, 24(5), 37-41.
  **Cita textual:** *"A decline of 8% in FT:CT or RSImod would indicate a change requiring
  intervention as at this level of neuromuscular fatigue there are considerable changes to
  performance"*, citando a **Ronglan, L.T., Raastad, T. & Borgesen, A. (2006)**,
  *"Neuromuscular Fatigue and Recovery in Elite Female Handball Players"* (balonmano de
  élite — deporte de conjunto), Scandinavian Journal of Medicine and Science in Sports.

  → **`UMBRAL_FATIGA_MRSI_PCT = 8`** en
  [`src/features/external-load/calculations.ts`](../src/features/external-load/calculations.ts).

### Piso de ruido de medición (altura del CMJ) — por qué ya no es 10% fijo

- **Fuente:** `countermovement_jump_reliability_performed_with.29 Pubmed.pdf` (local,
  `Trabajo FIN DE MASTER/3ra entrega/Articulos TFM/`).
  **Autor:** Heishman, A.D. et al. (2020). *"Countermovement jump reliability performed
  with and without an arm swing in NCAA Division I intercollegiate basketball players"*.
  Journal of Strength & Conditioning Research, 34(2), 546-558.
  **Datos textuales (Tabla 4/6, protocolo sin balanceo de brazos, fiabilidad
  intersesión):** altura de salto CV% = **4.7%**; RSI modificado CV% = **10.4%**, SWC =
  0.03 m·s⁻¹.

  Un cambio por debajo del CV% del propio test puede ser ruido de medición, no una caída
  real. Por eso el código ya no usa un "10% fijo" inventado (como en Fase 7): usa el CV%
  real reportado para la altura del CMJ como piso de ruido, y trata esa señal como débil.

  → **`UMBRAL_RUIDO_CMJ_PCT = 4.7`** en
  [`src/features/external-load/calculations.ts`](../src/features/external-load/calculations.ts).

  ⚠️ Nota de honestidad: este dato de fiabilidad proviene de baloncesto universitario
  (NCAA), no de la población específica de este club. `Which+Metrics+can+I+Monitor...pdf`
  (Badby et al., 2025, jugadores de fútbol juveniles) muestra que la fiabilidad del RSI
  modificado varía según la población y el protocolo — se documenta como limitación.

### Regla de negocio implementada

`evaluarFatiga()` en `calculations.ts`:
1. Si hay dos evaluaciones con **RSI modificado** cargado → alerta si la caída es **≥ 8%**
   (Martinez, 2016 / Ronglan et al., 2006).
2. Si no hay RSI modificado, cae a la **altura del CMJ**: alerta (más débil, badge
   "Posible fatiga") si la caída es **≥ 4.7%** (piso de ruido, Heishman et al., 2020).

---

## 2. sRPE (carga interna) y ACWR (Acute:Chronic Workload Ratio)

**Actualizado en Fase 8.1.** En la Fase 8 original no se encontró bibliografía sobre estas
dos métricas en las carpetas `Bibliografia` (Drive) ni `Maestria Real Madrid` (local) — ambas
están centradas en fuerza/potencia/CMJ, el mismo campo del TFM del usuario. En Fase 8.1 el
propio usuario (Científico de Datos Deportivos) aportó directamente los metadatos y citas
exactas que siguen, como material ya validado por él. **Distinción importante para la regla
de cero alucinaciones:** a diferencia de la Sección 1 (verificada leyendo el PDF completo
dentro de las carpetas indicadas), las citas de esta sección no fueron leídas por Claude en
un PDF fuente — fueron provistas textualmente por el usuario el 2026-07-29 y se transcriben
tal cual, sin agregar ni inferir nada que él no haya dado.

### sRPE (session-RPE)

**Fórmula:** RPE de la sesión (0-10) × duración en minutos = Unidades Arbitrarias (UA). Sin
cambios respecto a Fase 6/7 — sólo se agregó la cita.

**Cita provista por el usuario:** Impellizzeri, F.M. et al. (2004). *Use of RPE-based
training load in soccer*. Medicine & Science in Sports & Exercise.

**Regla de negocio / texto del tooltip:** "Método válido para cuantificar la carga interna
en fútbol, correlacionado fuertemente con la frecuencia cardíaca y lactato en deportes de
conjunto intermitentes."

### ACWR (Acute:Chronic Workload Ratio)

**Fórmula:** carga aguda (7 días) / carga crónica (28 días, promedio semanal) — sin cambios
en el cálculo. Las franjas de riesgo ya coincidían exactamente con las provistas por el
usuario, así que sólo se actualizó la cita:

- Zona Óptima (verde): 0.8 a 1.3 — "sweet spot" de adaptación.
- Zona de Peligro (rojo/alerta): &gt;1.5 — riesgo de lesión aumenta exponencialmente.
- (Zona intermedia, ya existente en el código: 1.3–1.5 precaución; &lt;0.8 baja carga.)

**Cita provista por el usuario:** Gabbett, T.J. (2016). *The training-injury prevention
paradox: should athletes be training smarter and harder?* British Journal of Sports
Medicine. (Basado en deportes de equipo.)

**Regla de negocio / texto del tooltip:** "Mantener el ACWR entre 0.8 y 1.3 minimiza el
riesgo relativo de lesión. Picos mayores a 1.5 representan la zona de peligro."

→ Implementado en [`src/features/workload/calculations.ts`](../src/features/workload/calculations.ts)
(`calcularAcwr`, sin cambios de lógica) y en los tooltips ℹ️ de
[`src/features/planning/DashboardEquipo.tsx`](../src/features/planning/DashboardEquipo.tsx).

---

## 3. Resumen de archivos fuente utilizados

| Archivo | Autor(es) y año | Ubicación |
|---|---|---|
| Trabajo Fin de Master- Robles Juan Ignacio..pdf | Robles, J.I. (2026) | Local, `Maestria Real Madrid/Trabajo FIN DE MASTER/entrega final/` |
| SPSR293_Marques GoogleScholar.pdf | Marques et al. (2026) | Local, `.../Articulos TFM/`; también en Drive `Bibliografia/CMJ- Salto Vertical/` |
| MartinezDanielJASCRSIRSImodFTCTasMonitoringTools.pdf | Martinez, D. (2016), cita a Ronglan et al. (2006) | Drive, `Bibliografia/DSI/` |
| countermovement_jump_reliability_performed_with.29 Pubmed.pdf | Heishman et al. (2020) | Local, `.../Articulos TFM/` |
| Which+Metrics+can+I+Monitor...pdf | Badby et al. (2025) | Drive, `Bibliografia/` (raíz) |
| journal.pone.0286581 Pubmed.pdf | Philipp et al. (2023) | Local, `.../Articulos TFM/` |
| sports-11-00120 Pubmed.pdf | Cabarkapa et al. (2023) | Local, `.../Articulos TFM/` |
| jfmk-08-00137 pubmed.pdf | Donahue et al. (2023) | Local, `.../Articulos TFM/` |
| sports-10-00033 Pubmed.pdf | Alba-Jiménez et al. (2022) | Local, `.../Articulos TFM/` |
| — (cita provista directamente por el usuario, no leída de un PDF) | Impellizzeri, F.M. et al. (2004) | sRPE — ver Sección 2 |
| — (cita provista directamente por el usuario, no leída de un PDF) | Gabbett, T.J. (2016) | ACWR — ver Sección 2 |

No se usó ninguna fuente sobre deportes individuales.
