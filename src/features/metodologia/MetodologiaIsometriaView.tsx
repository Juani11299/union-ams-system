import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * Manual Metodológico Institucional — Entrenamiento Isométrico (clasificación
 * de Alex Natera). Documento digital exportable a PDF vía `window.print()`,
 * reutilizando el trick de impresión de la Planilla de Fuerza (Fase 16, ver
 * `.print-area` en `src/index.css`): a diferencia de esa planilla (una sola
 * hoja), este manual son varias hojas A4 dentro de un único `.print-area`,
 * separadas con `print:break-after-page`.
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
          <span className="text-sm font-medium">📘 Manual Metodológico — Entrenamiento Isométrico</span>
        </div>
        <button
          type="button"
          onClick={handleDescargarPdf}
          className="rounded-lg bg-union-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-union-red-700"
        >
          🖨️ Descargar Manual (PDF)
        </button>
      </div>

      <div className="print-area flex flex-col items-center gap-8">
        <Hoja>
          <Portada />
        </Hoja>
        <Hoja>
          <Encabezado eyebrow="01 — Fundamentos" />
          <Introduccion />
          <ClasificacionNatera />
        </Hoja>
        <Hoja>
          <Encabezado eyebrow="02 — Patrones de movimiento" />
          <PatronesDeMovimiento />
        </Hoja>
        <Hoja ultima>
          <Encabezado eyebrow="03 — Aplicación práctica" />
          <AplicacionPractica />
          <Pie />
        </Hoja>
      </div>
    </div>
  )
}

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
    <div className="mb-8 flex items-center justify-between gap-4 border-b-2 border-union-red-600 pb-2">
      <div className="flex items-center gap-2">
        <img src="/logo-union.png" alt="" className="h-6 w-6 shrink-0 object-contain" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Manual Metodológico · Isometría
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
          Departamento de
          <br />
          Rendimiento Físico
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-union-red-600">
          Manual Metodológico Institucional
        </p>
        <h1 className="text-4xl font-black leading-tight text-union-charcoal">
          Entrenamiento
          <br />
          Isométrico
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
          Fundamentos, clasificación y aplicación práctica del trabajo isométrico en el
          fútbol moderno, en base a la evidencia de Alex Natera.
        </p>
      </div>

      <div className="flex items-end justify-between border-t border-slate-200 pt-4 text-[11px] text-slate-400">
        <p>Club Atlético Unión de Santa Fe</p>
        <p>Documento interno de uso metodológico</p>
      </div>
    </div>
  )
}

function Introduccion() {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-union-charcoal">Introducción</h2>
      <p className="text-justify text-[13px] leading-relaxed text-slate-600">
        En el fútbol moderno, la capacidad de generar y tolerar fuerza en ausencia de
        movimiento articular —lo que definimos como acción isométrica— se ha convertido
        en un pilar de la preparación física de élite. El trabajo de Alex Natera,
        referente internacional en biomecánica aplicada y entrenamiento de fuerza,
        reformuló la manera de entender la isometría: dejó de ser vista como una
        herramienta exclusiva de testeo o rehabilitación (por ejemplo, el Isometric
        Mid-Thigh Pull) para convertirse en un método de entrenamiento específico de las
        demandas del juego.
      </p>
      <p className="mt-3 text-justify text-[13px] leading-relaxed text-slate-600">
        Correr, frenar, acelerar y cambiar de dirección son, en última instancia, una
        sucesión de instantes isométricos: momentos de contacto donde el sistema
        neuromuscular debe producir o absorber fuerza antes de que se produzca el
        movimiento articular visible. Entrenar esta capacidad de forma específica mejora
        la producción de fuerza (RFD), la rigidez músculo-tendinosa (stiffness) y la
        tolerancia a las cargas de impacto — tres cualidades directamente relacionadas
        con la prevención de lesiones y el rendimiento en las acciones decisivas del
        partido.
      </p>
    </section>
  )
}

function ClasificacionNatera() {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-union-charcoal">Clasificación de Natera</h2>
      <p className="mb-4 text-[13px] leading-relaxed text-slate-600">
        Natera propone dos grandes familias de isometría, según la intención y la
        dirección de la fuerza aplicada:
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 break-inside-avoid">
          <p className="text-[10px] font-bold uppercase tracking-wide text-union-red-600">Yielding Isometrics</p>
          <p className="text-xs font-semibold text-union-charcoal">Isometría de Sostén / Absorción</p>
          <ul className="mt-3 space-y-2 text-[12px] leading-snug text-slate-600">
            <li>
              <span className="font-semibold text-union-charcoal">Definición: </span>
              el atleta resiste y sostiene una carga externa (o su propio peso) sin
              ceder, absorbiendo fuerza durante un tiempo determinado.
            </li>
            <li>
              <span className="font-semibold text-union-charcoal">Objetivo: </span>
              tolerancia a la fuerza excéntrica, capacidad de absorción, control postural
              bajo carga.
            </li>
            <li>
              <span className="font-semibold text-union-charcoal">En el juego: </span>
              aterrizajes, frenadas, apoyos de deceleración.
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-union-charcoal bg-union-charcoal p-4 text-white break-inside-avoid">
          <p className="text-[10px] font-bold uppercase tracking-wide text-union-red-400">Overcoming Isometrics</p>
          <p className="text-xs font-semibold text-white">Isometría de Empuje / Superación</p>
          <ul className="mt-3 space-y-2 text-[12px] leading-snug text-slate-200">
            <li>
              <span className="font-semibold text-white">Definición: </span>
              el atleta empuja con máxima intención contra una resistencia inamovible
              (rack, pared, banda anclada), sin lograr desplazamiento articular.
            </li>
            <li>
              <span className="font-semibold text-white">Objetivo: </span>
              producción de fuerza máxima voluntaria, tasa de desarrollo de fuerza (RFD),
              reclutamiento de unidades motoras de alto umbral.
            </li>
            <li>
              <span className="font-semibold text-white">En el juego: </span>
              primer paso de la aceleración, empuje en duelos, salida explosiva.
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

interface Patron {
  icono: string
  titulo: string
  enfasis: string
  texto: string
}

const PATRONES: Patron[] = [
  {
    icono: '🚀',
    titulo: 'Acelerar',
    enfasis: 'Overcoming Isometrics',
    texto:
      'La fase de aceleración exige superar la inercia del cuerpo mediante producción de fuerza horizontal máxima en tiempos muy breves. El trabajo isométrico de superación entrena específicamente la RFD sin el componente de fatiga técnica del gesto completo, permitiendo cargas de intención máxima repetidas.',
  },
  {
    icono: '🏃',
    titulo: 'Sprintar',
    enfasis: 'Run Specific Isometrics (RSI) y stiffness',
    texto:
      'Durante el sprint a máxima velocidad, el tiempo de contacto con el suelo es de apenas 80-100ms. Producir fuerza vertical en ese margen depende de la rigidez (stiffness) del complejo miotendinoso de tobillo y rodilla, no de la fuerza máxima. Los ejercicios isométricos específicos de carrera entrenan esta rigidez reactiva.',
  },
  {
    icono: '🛑',
    titulo: 'Frenar',
    enfasis: 'Puente post-excéntrico (Yielding)',
    texto:
      'Frenar es absorber grandes fuerzas de deceleración en distancias y tiempos cortos. La isometría de sostén actúa como puente entre la fase excéntrica de frenado y la posterior reproducción de fuerza, entrenando la capacidad de sostener la posición de máxima carga excéntrica — clave en la prevención de lesiones.',
  },
  {
    icono: '↩️',
    titulo: 'Cambiar de Dirección',
    enfasis: 'Fuerza en vectores laterales',
    texto:
      'A diferencia de la aceleración lineal, el cambio de dirección exige producir fuerza isométrica en ángulos específicos de tobillo y cadera, en el plano frontal y transverso. El trabajo isométrico en ángulos de corte prepara al tejido y al sistema nervioso para las demandas rotacionales del COD.',
  },
]

function PatronesDeMovimiento() {
  return (
    <section>
      <h2 className="mb-1 text-lg font-bold text-union-charcoal">Desarrollo de Patrones de Movimiento</h2>
      <p className="mb-4 text-[13px] leading-relaxed text-slate-600">
        Cómo se traduce la isometría en las cuatro acciones clave del fútbol.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {PATRONES.map((p) => (
          <div key={p.titulo} className="rounded-lg border border-slate-200 p-4 break-inside-avoid">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                {p.icono}
              </span>
              <p className="text-sm font-bold text-union-charcoal">{p.titulo}</p>
            </div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-union-red-600">{p.enfasis}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{p.texto}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const EJERCICIOS = [
  { patron: 'Acelerar', ejercicio: 'Split Squat Overcoming Iso (contra rack, ángulo de arranque)', tipo: 'Overcoming', foco: 'RFD horizontal' },
  { patron: 'Sprintar', ejercicio: 'Calf Iso Holds (elevación de talón contra resistencia fija)', tipo: 'Overcoming / RSI', foco: 'Stiffness tobillo-rodilla' },
  { patron: 'Frenar', ejercicio: 'Isometric Mid-Thigh Pull en ángulo de frenado', tipo: 'Yielding', foco: 'Puente post-excéntrico' },
  { patron: 'Cambio de Dirección', ejercicio: 'Isometric Lateral Lunge Hold (ángulo de corte)', tipo: 'Yielding / Overcoming', foco: 'Fuerza en vectores laterales' },
]

function AplicacionPractica() {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-bold text-union-charcoal">Aplicación Práctica</h2>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b-2 border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-400">
            <th className="py-1.5 pr-2">Patrón</th>
            <th className="px-2 py-1.5">Ejercicio</th>
            <th className="w-28 px-2 py-1.5">Tipo</th>
            <th className="w-36 py-1.5 pl-2">Foco principal</th>
          </tr>
        </thead>
        <tbody>
          {EJERCICIOS.map((e) => (
            <tr key={e.patron} className="border-b border-slate-100">
              <td className="py-2 pr-2 font-semibold text-union-charcoal">{e.patron}</td>
              <td className="px-2 py-2 text-slate-600">{e.ejercicio}</td>
              <td className="px-2 py-2 text-slate-600">{e.tipo}</td>
              <td className="py-2 pl-2 text-slate-600">{e.foco}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Pie() {
  return (
    <p className="border-t border-slate-200 pt-3 text-[10px] text-slate-400">
      Club Atlético Unión de Santa Fe — Departamento de Rendimiento Físico. Documento
      metodológico interno.
    </p>
  )
}
