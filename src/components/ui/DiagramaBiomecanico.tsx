/**
 * Diagramas biomecánicos de vectores de fuerza — dibujados a mano en SVG
 * puro (sin imágenes externas: nada de .png/.jpg ni búsquedas en internet,
 * para no arrastrar problemas de derechos de autor ni peso extra a la app).
 * Ilustran las tres posturas de referencia de la Teoría de Vectores de
 * Fuerza (Metodología UNIÓN) que desarrolla
 * `docs/Manual_Isometria_Avanzada.md`: aceleración (vector horizontal), top
 * speed (vector vertical) y absorción en cambio de dirección (Yielding).
 *
 * Decisión de diseño — fondo oscuro, silueta clara: la estética de
 * "informe de laboratorio biomecánico" (paneles de force-plate, software de
 * captura de movimiento) funciona mejor sobre un panel carbón oscuro que
 * sobre blanco, y sobre ese fondo la silueta del atleta necesita un tono
 * claro para tener contraste real — por eso el atleta se dibuja en un gris
 * claro con volumen (no en `union-charcoal`, que se volvería ilegible sobre
 * un panel igual de oscuro). Los vectores de fuerza (GRF) y los arcos
 * articulares se mantienen en `union-red-600`, el color que en toda la
 * documentación del club identifica "física aplicada sobre el cuerpo".
 *
 * Los ángulos articulares no son decorativos: se calculan por trigonometría
 * a partir de las coordenadas reales de cada segmento (`anguloInterior`), así
 * el arco dibujado y el número en la etiqueta siempre corresponden
 * exactamente a la postura trazada.
 */

export type TipoDiagramaBiomecanico = 'aceleracion' | 'top-speed' | 'cod-yielding'

interface DiagramaBiomecanicoProps {
  tipo: TipoDiagramaBiomecanico
  className?: string
}

const ANCHO_VIEWBOX = 260
const ALTO_VIEWBOX = 320
const Y_SUELO = 288

export function DiagramaBiomecanico({ tipo, className }: DiagramaBiomecanicoProps) {
  return (
    <svg
      viewBox={`0 0 ${ANCHO_VIEWBOX} ${ALTO_VIEWBOX}`}
      className={className}
      role="img"
      aria-label={ARIA_LABEL[tipo]}
    >
      <Definiciones />
      <PanelLaboratorio />
      <EncabezadoInforme titulo={TITULO_INFORME[tipo]} />
      <Plataforma />
      {tipo === 'aceleracion' && <FiguraAceleracion />}
      {tipo === 'top-speed' && <FiguraTopSpeed />}
      {tipo === 'cod-yielding' && <FiguraCodYielding />}
    </svg>
  )
}

const ARIA_LABEL: Record<TipoDiagramaBiomecanico, string> = {
  aceleracion:
    'Diagrama biomecánico: postura de aceleración, tronco inclinado ~45°, cadera y rodilla a ~90°, vector de fuerza horizontal hacia adelante y abajo.',
  'top-speed':
    'Diagrama biomecánico: postura de velocidad máxima (top speed), tronco casi vertical, rodilla de apoyo a ~140° emulando el touchdown, vector de fuerza vertical.',
  'cod-yielding':
    'Diagrama biomecánico: postura de absorción en cambio de dirección, estocada profunda (lunge), vector de reacción de frenado hacia el centro de masa.',
}

const TITULO_INFORME: Record<TipoDiagramaBiomecanico, string> = {
  aceleracion: 'Aceleración — Vector Horizontal',
  'top-speed': 'Top Speed — Vector Vertical',
  'cod-yielding': 'COD / Yielding — Vector de Frenado',
}

// ---------------------------------------------------------------------------
// Geometría — helpers de trigonometría compartidos por las tres posturas
// ---------------------------------------------------------------------------

interface Punto {
  x: number
  y: number
}

function puntoEnCirculo(cx: number, cy: number, r: number, anguloDeg: number): Punto {
  const rad = (anguloDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function anguloDeVector(centro: Punto, hacia: Punto): number {
  return (Math.atan2(hacia.y - centro.y, hacia.x - centro.x) * 180) / Math.PI
}

function normalizar360(a: number): number {
  const r = a % 360
  return r < 0 ? r + 360 : r
}

/** Ángulo interior real (0°-180°) entre dos segmentos que comparten el vértice `centro`. */
function anguloInterior(centro: Punto, a: Punto, b: Punto): number {
  const diff = Math.abs(normalizar360(anguloDeVector(centro, a) - anguloDeVector(centro, b)))
  return Math.round(diff > 180 ? 360 - diff : diff)
}

/** Arco SVG que recorre, desde `centro`, el ángulo interior entre las direcciones hacia `a` y hacia `b`. */
function arcoArticular(centro: Punto, a: Punto, b: Punto, radio: number): string {
  const angA = anguloDeVector(centro, a)
  const angB = anguloDeVector(centro, b)
  const diff = normalizar360(angB - angA)
  const sweep = diff <= 180 ? 1 : 0
  const p1 = puntoEnCirculo(centro.x, centro.y, radio, angA)
  const p2 = puntoEnCirculo(centro.x, centro.y, radio, angB)
  return `M ${p1.x} ${p1.y} A ${radio} ${radio} 0 0 ${sweep} ${p2.x} ${p2.y}`
}

/** Punto sobre la bisectriz del ángulo interior, para ubicar la etiqueta numérica. */
function puntoBisectriz(centro: Punto, a: Punto, b: Punto, distancia: number): Punto {
  const angA = anguloDeVector(centro, a)
  const angB = anguloDeVector(centro, b)
  const diff = normalizar360(angB - angA)
  const bisectriz = diff <= 180 ? angA + diff / 2 : angA - (360 - diff) / 2
  return puntoEnCirculo(centro.x, centro.y, distancia, bisectriz)
}

/** Ruta de un segmento anatómico "cápsula" (grosor variable, extremos redondeados). */
function capsulaPath(p1: Punto, r1: number, p2: Punto, r2: number): string {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const largo = Math.hypot(dx, dy) || 1
  const nx = -dy / largo
  const ny = dx / largo
  const a = { x: p1.x + nx * r1, y: p1.y + ny * r1 }
  const b = { x: p2.x + nx * r2, y: p2.y + ny * r2 }
  const c = { x: p2.x - nx * r2, y: p2.y - ny * r2 }
  const d = { x: p1.x - nx * r1, y: p1.y - ny * r1 }
  return `M ${a.x} ${a.y} L ${b.x} ${b.y} A ${r2} ${r2} 0 0 1 ${c.x} ${c.y} L ${d.x} ${d.y} A ${r1} ${r1} 0 0 1 ${a.x} ${a.y} Z`
}

// ---------------------------------------------------------------------------
// Piezas reutilizables del "kit" de dibujo
// ---------------------------------------------------------------------------

function Definiciones() {
  return (
    <defs>
      <linearGradient id="panel-informe" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1f2937" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="silueta-atleta" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <marker id="punta-flecha-grf" markerWidth={10} markerHeight={10} refX={6} refY={5} orient="auto">
        <path d="M0,0 L10,5 L0,10 Z" className="fill-union-red-600" />
      </marker>
      <pattern id="textura-plataforma" width={10} height={10} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <line x1={0} y1={0} x2={0} y2={10} stroke="#475569" strokeWidth={2} />
      </pattern>
    </defs>
  )
}

/** Panel "carbón" de fondo — la lámina sobre la que se monta todo el informe. */
function PanelLaboratorio() {
  return (
    <rect
      x={4}
      y={4}
      width={ANCHO_VIEWBOX - 8}
      height={ALTO_VIEWBOX - 8}
      rx={10}
      fill="url(#panel-informe)"
      stroke="#334155"
      strokeWidth={1.5}
    />
  )
}

function EncabezadoInforme({ titulo }: { titulo: string }) {
  return (
    <g>
      <text x={16} y={22} className="fill-slate-400 text-[7px] font-bold uppercase tracking-[0.25em]">
        Análisis Biomecánico · Metodología UNIÓN
      </text>
      <text x={16} y={35} className="fill-slate-100 text-[11px] font-bold">
        {titulo}
      </text>
      <line x1={16} y1={41} x2={ANCHO_VIEWBOX - 16} y2={41} stroke="#334155" strokeWidth={1} />
    </g>
  )
}

/** Base de contacto: plataforma de fuerza con textura de fricción y su etiqueta. */
function Plataforma() {
  return (
    <g>
      <rect x={14} y={Y_SUELO} width={ANCHO_VIEWBOX - 28} height={10} fill="url(#textura-plataforma)" opacity={0.5} />
      <line x1={14} y1={Y_SUELO} x2={ANCHO_VIEWBOX - 14} y2={Y_SUELO} className="stroke-slate-400" strokeWidth={2} strokeLinecap="round" />
      <text x={ANCHO_VIEWBOX / 2} y={Y_SUELO + 22} textAnchor="middle" className="fill-slate-500 text-[6.5px] font-semibold uppercase tracking-[0.2em]">
        Plataforma de fuerza (GRF)
      </text>
    </g>
  )
}

/** Segmento anatómico con volumen (cápsula rellena + arista de sombra sutil). */
function Segmento({ p1, r1, p2, r2 }: { p1: Punto; r1: number; p2: Punto; r2: number }) {
  return (
    <path
      d={capsulaPath(p1, r1, p2, r2)}
      fill="url(#silueta-atleta)"
      stroke="#475569"
      strokeWidth={0.75}
      strokeLinejoin="round"
    />
  )
}

function Cabeza({ centro, radio = 14 }: { centro: Punto; radio?: number }) {
  return <circle cx={centro.x} cy={centro.y} r={radio} fill="url(#silueta-atleta)" stroke="#475569" strokeWidth={0.75} />
}

/** Centro articular — punto de pivote (cadera / rodilla / tobillo). */
function CentroArticular({ punto }: { punto: Punto }) {
  return (
    <g>
      <circle cx={punto.x} cy={punto.y} r={4.2} fill="#0f172a" className="stroke-union-red-600" strokeWidth={2} />
      <circle cx={punto.x} cy={punto.y} r={1.4} className="fill-union-red-600" />
    </g>
  )
}

/**
 * Arco de ángulo articular con etiqueta calculada por trigonometría real. La
 * posición de la etiqueta se puede forzar con `posEtiqueta` (recomendado
 * cuando dos articulaciones quedan cerca, como cadera-rodilla en la
 * aceleración: la bisectriz automática de ambas puede apuntar una hacia la
 * otra y encimarse; con dos puntos explícitos y separados no pasa).
 */
function AnguloArticular({
  centro,
  hacia1,
  hacia2,
  radio = 20,
  offsetEtiqueta = 12,
  posEtiqueta,
}: {
  centro: Punto
  hacia1: Punto
  hacia2: Punto
  radio?: number
  offsetEtiqueta?: number
  posEtiqueta?: Punto
}) {
  const grados = anguloInterior(centro, hacia1, hacia2)
  const etiqueta = posEtiqueta ?? puntoBisectriz(centro, hacia1, hacia2, radio + offsetEtiqueta)
  return (
    <g>
      <path d={arcoArticular(centro, hacia1, hacia2, radio)} className="stroke-union-red-600" strokeWidth={1.75} fill="none" strokeDasharray="2 2" />
      <text
        x={etiqueta.x}
        y={etiqueta.y}
        textAnchor="middle"
        className="fill-union-red-600 text-[11px] font-bold"
        style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
      >
        ~{grados}°
      </text>
    </g>
  )
}

/**
 * Vector de fuerza de reacción del suelo (GRF): flecha de alto impacto +
 * etiqueta de dirección. La etiqueta se ancla en un punto explícito
 * (`posEtiqueta`, no en el punto medio del vector): así queda siempre en un
 * hueco despejado del dibujo y nunca se corta contra el borde del panel ni
 * se superpone con un arco articular cercano.
 */
function VectorFuerza({
  desde,
  hasta,
  etiqueta,
  subtitulo,
  posEtiqueta,
  anclaTexto,
}: {
  desde: Punto
  hasta: Punto
  etiqueta: string
  subtitulo?: string
  posEtiqueta: Punto
  anclaTexto: 'start' | 'end' | 'middle'
}) {
  return (
    <g>
      <line
        x1={desde.x}
        y1={desde.y}
        x2={hasta.x}
        y2={hasta.y}
        className="stroke-union-red-600"
        strokeWidth={4.5}
        strokeLinecap="round"
        markerEnd="url(#punta-flecha-grf)"
      />
      <text x={posEtiqueta.x} y={posEtiqueta.y} textAnchor={anclaTexto} className="fill-union-red-600 text-[8.5px] font-bold uppercase tracking-wide">
        {etiqueta}
      </text>
      {subtitulo && (
        <text x={posEtiqueta.x} y={posEtiqueta.y + 10} textAnchor={anclaTexto} className="fill-union-red-400 text-[7px] font-semibold uppercase tracking-wide">
          {subtitulo}
        </text>
      )}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Postura de Aceleración — vector horizontal, cadera y rodilla ~90°
// ---------------------------------------------------------------------------

function FiguraAceleracion() {
  // Construidos para que cadera y rodilla den ~90° exactos (ver comentario
  // de cabecera del archivo): cadera es vértice de -60°/+30° = 90°; rodilla
  // es vértice de -150.1°/+119.9° = 90°.
  const cadera: Punto = { x: 126, y: 180 }
  const hombro: Punto = { x: 168, y: 107 }
  const cabeza: Punto = { x: 176, y: 89 }
  const codo: Punto = { x: 172, y: 139 }
  const munieca: Punto = { x: 200, y: 127 }

  const rodillaDelantera: Punto = { x: 164, y: 202 }
  const tobilloDelantero: Punto = { x: 138, y: 247 }

  const rodillaTrasera: Punto = { x: 90, y: 228 }
  const tobilloTrasero: Punto = { x: 56, y: 278 }

  return (
    <g>
      {/* Pierna trasera (empuje, semi-transparente para dar profundidad) */}
      <g opacity={0.6}>
        <Segmento p1={cadera} r1={11} p2={rodillaTrasera} r2={8} />
        <Segmento p1={rodillaTrasera} r1={7} p2={tobilloTrasero} r2={4.5} />
      </g>

      {/* Tronco inclinado ~45° */}
      <Segmento p1={cadera} r1={13} p2={hombro} r2={11} />

      {/* Pierna motriz delantera */}
      <Segmento p1={cadera} r1={12} p2={rodillaDelantera} r2={9} />
      <Segmento p1={rodillaDelantera} r1={8} p2={tobilloDelantero} r2={5} />

      {/* Brazos (braceo opuesto) */}
      <Segmento p1={hombro} r1={7} p2={codo} r2={5.5} />
      <Segmento p1={codo} r1={5} p2={munieca} r2={3.5} />

      <Cabeza centro={cabeza} />

      {/* Capa biomecánica */}
      <CentroArticular punto={cadera} />
      <CentroArticular punto={rodillaDelantera} />
      <CentroArticular punto={tobilloDelantero} />

      <AnguloArticular centro={cadera} hacia1={hombro} hacia2={rodillaDelantera} radio={20} posEtiqueta={{ x: 96, y: 156 }} />
      <AnguloArticular centro={rodillaDelantera} hacia1={cadera} hacia2={tobilloDelantero} radio={16} posEtiqueta={{ x: 137, y: 209 }} />

      {/* Vector de GRF: nace en el apoyo del pie (mismo punto que el
          tobillo delantero) y se proyecta hacia adelante — así nunca cruza
          por encima de la pierna ni de los arcos articulares. */}
      <VectorFuerza
        desde={tobilloDelantero}
        hasta={{ x: 218, y: 202 }}
        etiqueta="Fuerza Horizontal"
        posEtiqueta={{ x: 228, y: 268 }}
        anclaTexto="end"
      />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Postura de Top Speed — vector vertical, rodilla de apoyo ~140° (touchdown)
// ---------------------------------------------------------------------------

function FiguraTopSpeed() {
  // Construidos para que la rodilla de apoyo dé ~140° exactos: vértice de
  // -100° (hacia la cadera) / +40° (hacia el tobillo) = 140°.
  const cadera: Punto = { x: 124, y: 169 }
  const hombro: Punto = { x: 130, y: 93 }
  const cabeza: Punto = { x: 132, y: 75 }
  const codo: Punto = { x: 106, y: 117 }
  const munieca: Punto = { x: 86, y: 139 }

  const rodillaApoyo: Punto = { x: 132, y: 216 }
  const tobilloApoyo: Punto = { x: 175, y: 252 }

  // Pierna de recobro (elevada detrás, flexionada) — relativa a la cadera
  const rodillaRecobro: Punto = { x: 160, y: 161 }
  const tobilloRecobro: Punto = { x: 186, y: 123 }

  return (
    <g>
      {/* Pierna de recobro (detrás, semi-transparente) */}
      <g opacity={0.6}>
        <Segmento p1={cadera} r1={11} p2={rodillaRecobro} r2={8} />
        <Segmento p1={rodillaRecobro} r1={7} p2={tobilloRecobro} r2={4.5} />
      </g>

      {/* Tronco casi vertical */}
      <Segmento p1={cadera} r1={13} p2={hombro} r2={11} />

      {/* Pierna de apoyo (touchdown) */}
      <Segmento p1={cadera} r1={12} p2={rodillaApoyo} r2={9} />
      <Segmento p1={rodillaApoyo} r1={8} p2={tobilloApoyo} r2={5} />

      {/* Brazos */}
      <Segmento p1={hombro} r1={7} p2={codo} r2={5.5} />
      <Segmento p1={codo} r1={5} p2={munieca} r2={3.5} />

      <Cabeza centro={cabeza} />

      {/* Capa biomecánica */}
      <CentroArticular punto={cadera} />
      <CentroArticular punto={rodillaApoyo} />
      <CentroArticular punto={tobilloApoyo} />

      <AnguloArticular centro={rodillaApoyo} hacia1={cadera} hacia2={tobilloApoyo} radio={18} posEtiqueta={{ x: 174, y: 195 }} />

      {/* Vector vertical (GRF), trazado independiente del esqueleto — cae
          recto sobre el punto de apoyo, que es lo que representa. */}
      <VectorFuerza
        desde={{ x: 148, y: 182 }}
        hasta={{ x: 144, y: 274 }}
        etiqueta="Vector Vertical"
        subtitulo="(Touchdown)"
        posEtiqueta={{ x: 242, y: 228 }}
        anclaTexto="end"
      />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Postura COD / Yielding — estocada profunda, vector de frenado al centro de masa
// ---------------------------------------------------------------------------

function FiguraCodYielding() {
  // Rodilla externa construida para dar ~90° exactos de flexión (vértice de
  // -29.9°/+59.8°): una estocada realmente profunda, no una zancada abierta.
  const cadera: Punto = { x: 130, y: 209 }
  const hombro: Punto = { x: 142, y: 131 }
  const cabeza: Punto = { x: 144, y: 113 }
  const codo: Punto = { x: 104, y: 149 }
  const munieca: Punto = { x: 80, y: 165 }

  // Pierna externa (delantera, plantada, absorbiendo — flexión profunda)
  const rodillaExterna: Punto = { x: 90, y: 232 }
  const tobilloExterno: Punto = { x: 115, y: 275 }

  // Pierna trasera (extendida lateralmente, base amplia)
  const rodillaTrasera: Punto = { x: 188, y: 234 }
  const tobilloTrasero: Punto = { x: 226, y: 272 }

  const centroMasa: Punto = { x: 124, y: 196 }

  return (
    <g>
      {/* Pierna trasera (base amplia) */}
      <Segmento p1={cadera} r1={11} p2={rodillaTrasera} r2={8} />
      <Segmento p1={rodillaTrasera} r1={7} p2={tobilloTrasero} r2={4.5} />

      {/* Tronco — leve inclinación hacia adelante */}
      <Segmento p1={cadera} r1={13} p2={hombro} r2={11} />

      {/* Pierna externa (plantada, flexión profunda) */}
      <Segmento p1={cadera} r1={12} p2={rodillaExterna} r2={9} />
      <Segmento p1={rodillaExterna} r1={8} p2={tobilloExterno} r2={5} />

      {/* Brazos (equilibrio lateral) */}
      <Segmento p1={hombro} r1={7} p2={codo} r2={5.5} />
      <Segmento p1={codo} r1={5} p2={munieca} r2={3.5} />

      <Cabeza centro={cabeza} />

      {/* Centro de masa */}
      <circle cx={centroMasa.x} cy={centroMasa.y} r={3} className="fill-union-red-600" />
      <circle cx={centroMasa.x} cy={centroMasa.y} r={7} className="fill-none stroke-union-red-600" strokeWidth={1} strokeDasharray="1.5 2" />

      {/* Capa biomecánica */}
      <CentroArticular punto={cadera} />
      <CentroArticular punto={rodillaExterna} />
      <CentroArticular punto={tobilloExterno} />

      <AnguloArticular centro={rodillaExterna} hacia1={cadera} hacia2={tobilloExterno} radio={17} posEtiqueta={{ x: 118, y: 240 }} />

      <VectorFuerza
        desde={{ x: 224, y: 156 }}
        hasta={centroMasa}
        etiqueta="Fuerza de Frenado"
        posEtiqueta={{ x: 240, y: 148 }}
        anclaTexto="end"
      />
    </g>
  )
}
