/**
 * Diagramas biomecánicos "stick-figure" dibujados a mano en SVG (sin
 * imágenes externas: nada de .png/.jpg ni búsquedas en internet, para no
 * arrastrar problemas de derechos de autor ni peso extra a la app). Ilustran
 * las tres posturas de referencia de la Teoría de Vectores de Fuerza
 * (Metodología UNIÓN) que desarrolla `docs/Manual_Isometria_Avanzada.md`:
 * aceleración (vector horizontal), top speed (vector vertical) y absorción
 * en cambio de dirección (Yielding). El atleta se dibuja en
 * `union-charcoal`; los ángulos articulares y vectores de fuerza en
 * `union-red-600`, para que el ojo distinga de inmediato "cuerpo" de
 * "física aplicada sobre el cuerpo".
 */

export type TipoDiagramaBiomecanico = 'aceleracion' | 'top-speed' | 'cod-yielding'

interface DiagramaBiomecanicoProps {
  tipo: TipoDiagramaBiomecanico
  className?: string
}

const ANCHO_VIEWBOX = 220
const ALTO_VIEWBOX = 280
const GROSOR_CUERPO = 7
const GROSOR_VECTOR = 6

export function DiagramaBiomecanico({ tipo, className }: DiagramaBiomecanicoProps) {
  return (
    <svg
      viewBox={`0 0 ${ANCHO_VIEWBOX} ${ALTO_VIEWBOX}`}
      className={className}
      role="img"
      aria-label={ARIA_LABEL[tipo]}
    >
      <PuntaFlecha />
      <LineaSuelo />
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
    'Diagrama biomecánico: postura de absorción en cambio de dirección, estocada profunda (lunge), vector de fuerza hacia el centro de masa.',
}

// ---------------------------------------------------------------------------
// Piezas reutilizables del "kit" de dibujo
// ---------------------------------------------------------------------------

function LineaSuelo() {
  return <line x1={12} y1={262} x2={208} y2={262} className="stroke-slate-200" strokeWidth={3} strokeLinecap="round" />
}

/** Definición compartida de la punta de flecha (se referencia por `url(#punta-flecha)`). */
function PuntaFlecha() {
  return (
    <defs>
      <marker id="punta-flecha" markerWidth={9} markerHeight={9} refX={5} refY={4} orient="auto">
        <path d="M0,0 L9,4 L0,8 Z" className="fill-union-red-600" />
      </marker>
    </defs>
  )
}

function Hueso({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      className="stroke-union-charcoal"
      strokeWidth={GROSOR_CUERPO}
      strokeLinecap="round"
    />
  )
}

function Cabeza({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r={13} className="fill-union-charcoal" />
}

function Vector({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      className="stroke-union-red-600"
      strokeWidth={GROSOR_VECTOR}
      strokeLinecap="round"
      markerEnd="url(#punta-flecha)"
    />
  )
}

/** Arco decorativo que marca un ángulo articular, con su etiqueta en grados. */
function AnguloArticular({
  cx,
  cy,
  path,
  etiqueta,
  labelX,
  labelY,
}: {
  cx: number
  cy: number
  path: string
  etiqueta: string
  labelX: number
  labelY: number
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={3} className="fill-union-red-600" />
      <path d={path} className="stroke-union-red-600" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <text x={labelX} y={labelY} className="fill-union-red-600 text-[13px] font-bold">
        {etiqueta}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Postura de Aceleración — vector horizontal, cadera y rodilla ~90°
// ---------------------------------------------------------------------------

function FiguraAceleracion() {
  return (
    <g>
      {/* Pierna trasera (extendida, empuje) */}
      <Hueso x1={108} y1={158} x2={68} y2={208} />
      <Hueso x1={68} y1={208} x2={38} y2={258} />
      {/* Pierna delantera (motriz, flexionada ~90°) */}
      <Hueso x1={108} y1={158} x2={150} y2={188} />
      <Hueso x1={150} y1={188} x2={118} y2={250} />
      {/* Tronco inclinado ~45° */}
      <Hueso x1={108} y1={158} x2={150} y2={88} />
      <Cabeza cx={156} cy={74} />
      {/* Brazos (braceo opuesto) */}
      <Hueso x1={148} y1={100} x2={178} y2={128} />
      <Hueso x1={148} y1={100} x2={116} y2={112} />

      {/* Ángulo de cadera (~90°) */}
      <AnguloArticular
        cx={108}
        cy={158}
        path="M118,146 A16,16 0 0 1 132,168"
        etiqueta="~90°"
        labelX={124}
        labelY={143}
      />
      {/* Ángulo de rodilla delantera (~90°) */}
      <AnguloArticular
        cx={150}
        cy={188}
        path="M144,175 A16,16 0 0 1 165,193"
        etiqueta="~90°"
        labelX={168}
        labelY={182}
      />

      {/* Vector de fuerza horizontal (adelante y abajo) */}
      <Vector x1={104} y1={140} x2={168} y2={182} />
      <text x={172} y={178} className="fill-union-red-600 text-[11px] font-semibold italic">
        F horizontal
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Postura de Top Speed — vector vertical, rodilla de apoyo ~140° (touchdown)
// ---------------------------------------------------------------------------

function FiguraTopSpeed() {
  return (
    <g>
      {/* Pierna de apoyo (touchdown, ~140°, casi extendida) */}
      <Hueso x1={104} y1={150} x2={112} y2={200} />
      <Hueso x1={112} y1={200} x2={96} y2={252} />
      {/* Pierna de recobro (elevada detrás, mecánica de sprint) */}
      <Hueso x1={104} y1={150} x2={138} y2={148} />
      <Hueso x1={138} y1={148} x2={162} y2={116} />
      {/* Tronco casi vertical */}
      <Hueso x1={104} y1={150} x2={112} y2={82} />
      <Cabeza cx={114} cy={68} />
      {/* Brazos */}
      <Hueso x1={110} y1={96} x2={82} y2={118} />
      <Hueso x1={110} y1={96} x2={142} y2={80} />

      {/* Ángulo de rodilla de apoyo (~140°, touchdown) */}
      <AnguloArticular
        cx={112}
        cy={200}
        path="M100,188 A16,16 0 0 1 118,216"
        etiqueta="~140°"
        labelX={122}
        labelY={210}
      />

      {/* Vector de fuerza vertical (directo hacia abajo) */}
      <Vector x1={104} y1={150} x2={98} y2={244} />
      <text x={40} y={198} className="fill-union-red-600 text-[11px] font-semibold italic">
        F vertical
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Postura COD / Yielding — estocada profunda, vector hacia el centro de masa
// ---------------------------------------------------------------------------

function FiguraCodYielding() {
  return (
    <g>
      {/* Pierna externa (plantada, absorbiendo, muy flexionada) */}
      <Hueso x1={96} y1={186} x2={64} y2={220} />
      <Hueso x1={64} y1={220} x2={38} y2={258} />
      {/* Pierna trasera (extendida lateralmente, base amplia) */}
      <Hueso x1={96} y1={186} x2={148} y2={216} />
      <Hueso x1={148} y1={216} x2={188} y2={252} />
      {/* Tronco — leve inclinación hacia adelante, centro de masa hundido */}
      <Hueso x1={96} y1={186} x2={106} y2={112} />
      <Cabeza cx={108} cy={98} />
      {/* Brazos (equilibrio lateral) */}
      <Hueso x1={104} y1={126} x2={70} y2={140} />
      <Hueso x1={104} y1={126} x2={140} y2={110} />

      {/* Centro de masa */}
      <circle cx={98} cy={172} r={4} className="fill-union-red-600" />

      {/* Ángulo de rodilla externa (flexión profunda) */}
      <AnguloArticular
        cx={64}
        cy={220}
        path="M52,206 A16,16 0 0 1 76,224"
        etiqueta="Flexión profunda"
        labelX={12}
        labelY={200}
      />

      {/* Vector de fuerza hacia el centro de masa (absorción) */}
      <Vector x1={166} y1={140} x2={104} y2={174} />
      <text x={150} y={132} className="fill-union-red-600 text-[11px] font-semibold italic">
        F de frenado
      </text>
    </g>
  )
}
