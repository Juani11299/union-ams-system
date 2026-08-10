import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NOMBRE_AREA, FIRMA_AUTOR } from '@/constants/branding'

/**
 * Manual Metodológico Institucional — Área de Fuerza (filosofía, logística,
 * macrociclo anual y desarrollo LTAD por categoría). Documento digital
 * exportable a PDF vía `window.print()`, reutilizando estrictamente la
 * arquitectura del Manual de Isometría (`.print-area` de `src/index.css` +
 * hojas A4 con `print:break-after-page`, ver `MetodologiaIsometriaView.tsx`).
 * Vigencia: desde su publicación hasta fines de 2027.
 */
export function ManualFuerzaView() {
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
          <span className="text-sm font-medium">🏋️ Manual Metodológico — Área de Fuerza</span>
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
          <Encabezado eyebrow="01 — Cultura & Infraestructura" />
          <Filosofia />
          <Logistica />
        </Hoja>
        <Hoja>
          <Encabezado eyebrow="02 — Proyección Anual" />
          <Macrociclo />
        </Hoja>
        <Hoja>
          <Encabezado eyebrow="03 — LTAD: 10ma a 7ma" />
          <LtadFormativas />
        </Hoja>
        <Hoja ultima>
          <Encabezado eyebrow="04 — LTAD: 6ta a 4ta / Reserva" />
          <LtadSuperiores />
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
          Manual Metodológico · {NOMBRE_AREA}
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
          Manual Metodológico Institucional
        </p>
        <h1 className="text-4xl font-black leading-tight text-union-charcoal">{NOMBRE_AREA}</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
          Filosofía, infraestructura, planificación anual y desarrollo por categorías (LTAD)
          del trabajo de fuerza del club. Guía de referencia vigente hasta diciembre de 2027.
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

function Filosofia() {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-union-charcoal">Filosofía — El "Por Qué"</h2>
      <p className="text-justify text-[13px] leading-relaxed text-slate-600">
        Le entrenamos fuerza al jugador por dos razones, en este orden: primero para que
        pueda jugar — sostener una temporada completa sin quedar afuera por una lesión
        evitable — y después para que juegue mejor. Un cuerpo más fuerte tolera más carga
        de entrenamiento y de partido sin romperse; esa es la base de la prevención de
        lesiones, no un capítulo aparte de la planificación.
      </p>
      <p className="mt-3 text-justify text-[13px] leading-relaxed text-slate-600">
        Sobre esa base se apoya la segunda razón: la transferencia directa al juego. La
        fuerza que se construye en el gimnasio no es un fin en sí mismo — es la materia
        prima de la velocidad (producir más fuerza en menos tiempo) y de la tolerancia al
        choque (ganar los duelos, los cruces y los contactos sin ceder terreno ni
        quedar expuesto a una lesión de contacto). Todo lo que se planifica en este manual
        responde a estas dos preguntas: ¿esto lo cuida? ¿esto lo hace más rápido y más
        difícil de tumbar?
      </p>
    </section>
  )
}

interface Estacion {
  icono: string
  titulo: string
  capacidad: string
  texto: string
}

const ESTACIONES: Estacion[] = [
  {
    icono: '🏋️',
    titulo: 'Racks Internos',
    capacidad: '15 barras · ~13-14 atletas',
    texto:
      'Fuerza máxima y tensión mecánica bajo carga externa (sentadilla, peso muerto, press, tracción). La estación de mayor demanda de espacio e implementos — organiza al resto de la sala alrededor de su rotación.',
  },
  {
    icono: '🧘',
    titulo: 'Espacio Libre — Isometría / Vitamina',
    capacidad: 'Sin implementos pesados · mayor densidad',
    texto:
      'Isometría de Natera (Overcoming/Yielding) y planes "Vitamina" individualizados de prevención puntual. Al no depender de barras ni discos, es la estación que más atletas puede absorber en simultáneo.',
  },
  {
    icono: '🌱',
    titulo: 'Pasto / Jaula Exterior',
    capacidad: '~12 atletas · trabajo a cielo abierto',
    texto:
      'Pliometría, sprints resistidos y ejercicios de transferencia directa al gesto de carrera. La estación que conecta físicamente la sala de fuerza con el campo de juego.',
  },
]

function Logistica() {
  return (
    <section>
      <h2 className="mb-1 text-lg font-bold text-union-charcoal">
        Logística — 40 Atletas Simultáneos, 3 Estaciones
      </h2>
      <p className="mb-3 text-[13px] leading-relaxed text-slate-600">
        Con un plantel completo entrenando a la vez, la sala se organiza en 3 estaciones
        rotativas para maximizar el uso del espacio y los implementos disponibles.
      </p>
      <div className="mb-4 flex items-center justify-center gap-6 rounded-lg bg-union-charcoal py-2.5 text-center text-white">
        <p className="text-xs font-semibold">
          <span className="text-sm font-black">96 m²</span> de sala
        </p>
        <p className="text-xs font-semibold">
          <span className="text-sm font-black">15</span> barras
        </p>
        <p className="text-xs font-semibold">
          <span className="text-sm font-black">1.000 kg</span> en discos
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {ESTACIONES.map((e) => (
          <div key={e.titulo} className="rounded-lg border border-slate-200 p-3 break-inside-avoid">
            <span className="text-lg" aria-hidden>
              {e.icono}
            </span>
            <p className="mt-1 text-xs font-bold text-union-charcoal">{e.titulo}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-union-red-600">
              {e.capacidad}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{e.texto}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

interface Etapa {
  icono: string
  titulo: string
  subtitulo: string
  puntos: string[]
}

const ETAPAS: Etapa[] = [
  {
    icono: '🏗️',
    titulo: 'Pretemporada',
    subtitulo: 'Acumulación y Fuerza Máxima',
    puntos: [
      'Mayor volumen de la temporada — ventana para construir base de fuerza máxima.',
      'Progresión de cargas: de hipertrofia funcional a intensidades altas (%RM).',
      'Introducción y consolidación técnica de los patrones que se van a usar todo el año.',
    ],
  },
  {
    icono: '⚔️',
    titulo: 'Competencia',
    subtitulo: 'Mantenimiento, Tapering y Microciclos MD',
    puntos: [
      'Objetivo: mantener la fuerza construida, no seguir acumulando volumen.',
      'Sesiones ancladas al microciclo semanal (MD-4 a MD+1) — ver Manual de Isometría.',
      'Tapering (reducción de volumen, mantenimiento de intensidad) antes de partidos clave.',
    ],
  },
  {
    icono: '🌴',
    titulo: 'Recesos / Parates',
    subtitulo: 'Transición y Planes de Casa',
    puntos: [
      'Programa de transición: evita el desentrenamiento sin exigir sesiones supervisadas.',
      'Planes de casa individualizados — peso corporal e implementos mínimos.',
      'Reincorporación progresiva al volver, nunca directo a la carga de competencia.',
    ],
  },
]

function Macrociclo() {
  return (
    <section>
      <h2 className="mb-1 text-lg font-bold text-union-charcoal">Proyección Anual (Macrociclo)</h2>
      <p className="mb-4 text-[13px] leading-relaxed text-slate-600">
        Tres etapas con objetivos de fuerza distintos y complementarios a lo largo del año.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {ETAPAS.map((e) => (
          <div key={e.titulo} className="rounded-lg border border-slate-200 p-3 break-inside-avoid">
            <span className="text-lg" aria-hidden>
              {e.icono}
            </span>
            <p className="mt-1 text-xs font-bold text-union-charcoal">{e.titulo}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-union-red-600">
              {e.subtitulo}
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-slate-600">
              {e.puntos.map((punto) => (
                <li key={punto}>• {punto}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function LtadFormativas() {
  return (
    <section>
      <h2 className="mb-1 text-lg font-bold text-union-charcoal">Desarrollo LTAD — 10ma a 7ma División</h2>
      <p className="mb-4 text-[13px] leading-relaxed text-slate-600">
        En las categorías formativas, la prioridad es la técnica y la calidad de movimiento
        por sobre la carga.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 break-inside-avoid">
          <p className="text-[10px] font-bold uppercase tracking-wide text-union-red-600">10ma y 9na División</p>
          <p className="text-xs font-semibold text-union-charcoal">Alfabetización Motora</p>
          <ul className="mt-3 space-y-2 text-[12px] leading-snug text-slate-600">
            <li>
              <span className="font-semibold text-union-charcoal">Plan General: </span>
              dominio del propio peso corporal (sentadilla, bisagra de cadera, empuje,
              tracción) y técnica de los patrones fundamentales, sin cargas externas.
            </li>
            <li>
              <span className="font-semibold text-union-charcoal">Vitamina: </span>
              prevención básica — control postural, activación y educación del gesto,
              nunca sobrecarga.
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-union-charcoal bg-union-charcoal p-4 text-white break-inside-avoid">
          <p className="text-[10px] font-bold uppercase tracking-wide text-union-red-400">8va y 7ma División</p>
          <p className="text-xs font-semibold text-white">Construcción Estructural</p>
          <ul className="mt-3 space-y-2 text-[12px] leading-snug text-slate-200">
            <li>
              <span className="font-semibold text-white">Cargas externas: </span>
              introducción progresiva y supervisada — prioridad absoluta a la técnica
              sobre el kilaje.
            </li>
            <li>
              <span className="font-semibold text-white">Hipertrofia funcional: </span>
              volumen moderado orientado a construir la estructura (tendón, músculo,
              tejido conectivo) que va a sostener las cargas de las categorías siguientes.
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

function LtadSuperiores() {
  return (
    <section className="mb-10">
      <h2 className="mb-1 text-lg font-bold text-union-charcoal">
        Desarrollo LTAD — 6ta a 4ta División / Reserva
      </h2>
      <p className="mb-4 text-[13px] leading-relaxed text-slate-600">
        En las categorías superiores, la fuerza se vuelve específica del rendimiento y de
        cada jugador en particular.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 break-inside-avoid">
          <p className="text-[10px] font-bold uppercase tracking-wide text-union-red-600">6ta y 5ta División</p>
          <p className="text-xs font-semibold text-union-charcoal">Fuerza Máxima y RFD</p>
          <ul className="mt-3 space-y-2 text-[12px] leading-snug text-slate-600">
            <li>
              <span className="font-semibold text-union-charcoal">Fuerza máxima: </span>
              cargas altas (%RM) sobre patrones ya consolidados técnicamente.
            </li>
            <li>
              <span className="font-semibold text-union-charcoal">RFD y tensión mecánica: </span>
              foco en producir fuerza rápido, no sólo en producir más fuerza.
            </li>
            <li>
              <span className="font-semibold text-union-charcoal">Isometría avanzada: </span>
              aplicación plena de la clasificación de Natera (ver Manual de Isometría).
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-union-charcoal bg-union-charcoal p-4 text-white break-inside-avoid">
          <p className="text-[10px] font-bold uppercase tracking-wide text-union-red-400">
            4ta División y Reserva
          </p>
          <p className="text-xs font-semibold text-white">Transferencia y Rendimiento</p>
          <ul className="mt-3 space-y-2 text-[12px] leading-snug text-slate-200">
            <li>
              <span className="font-semibold text-white">Transferencia al gesto: </span>
              velocidad y potencia como expresión directa de la fuerza construida.
            </li>
            <li>
              <span className="font-semibold text-white">Vitamina individualizada: </span>
              planes de prevención por jugador, ajustados según su propio perfil de GPS
              (volumen de sprints, aceleraciones/desaceleraciones, distancia HSR).
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

function Pie() {
  return (
    <div className="flex items-end justify-between border-t border-slate-200 pt-3">
      <p className="text-[10px] text-slate-400">
        Club Atlético Unión de Santa Fe — {NOMBRE_AREA}. Documento metodológico interno.
      </p>
      <p className="text-[10px] font-semibold tracking-wide text-union-charcoal">{FIRMA_AUTOR}</p>
    </div>
  )
}
