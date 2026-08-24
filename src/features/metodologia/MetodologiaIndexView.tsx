import { Link } from 'react-router-dom'

interface ManualBiblioteca {
  to: string
  icon: string
  titulo: string
  subtitulo: string
  descripcion: string
}

/**
 * Biblioteca de Manuales Metodológicos (Paso 1) — índice de los 6 documentos
 * exportables a PDF A4 del Área de Fuerza: el Manual General, la Escuela de
 * Movimiento (Isometría) y los 4 tomos del modelo LTAD, uno por franja
 * etaria. Cada tarjeta linkea directo a la vista del manual (misma ruta que
 * ya usa el Sidebar, grupo "Estructura de Trabajo" — ver `navConfig.ts`);
 * esta vista es sólo el punto de entrada agrupado, no reemplaza esos links.
 */
const MANUALES: ManualBiblioteca[] = [
  {
    to: '/metodologia/manual-fuerza',
    icon: '🏋️',
    titulo: 'Manual Área de Fuerza',
    subtitulo: 'Marco general — todas las categorías',
    descripcion:
      'Fundamentos fisiológicos y biomecánicos, arquitectura de sesión, escuela de movimiento e isometría, periodización por microciclo y modelo LTAD completo.',
  },
  {
    to: '/metodologia/isometria',
    icon: '📘',
    titulo: 'Escuela de Movimiento (Isometría)',
    subtitulo: 'Marco general — todas las categorías',
    descripcion:
      'Clasificación biomecánica de la isometría aplicada al fútbol: Overcoming, Yielding e isometría específica de sprint y cambio de dirección.',
  },
  {
    to: '/metodologia/ltad-10ma-pre9na',
    icon: '📗',
    titulo: 'LTAD — 10ma y Pre 9na',
    subtitulo: '12-13 años · Alfabetización y Cimientos',
    descripcion:
      'Dominio técnico del propio peso corporal durante el estirón puberal, sin carga externa relevante — la ventana de alfabetización motora.',
  },
  {
    to: '/metodologia/ltad-9na-8va',
    icon: '📗',
    titulo: 'LTAD — 9na y 8va',
    subtitulo: '14-15 años · Construcción Estructural',
    descripcion:
      'Introducción progresiva de carga externa y volumen orientado a hipertrofia funcional, aprovechando el entorno hormonal post-PHV.',
  },
  {
    to: '/metodologia/ltad-7ma-6ta',
    icon: '📗',
    titulo: 'LTAD — 7ma y 6ta',
    subtitulo: '16-17 años · Fuerza y Tensión',
    descripcion:
      'Fuerza máxima y Tasa de Desarrollo de la Fuerza (RFD) como objetivos centrales, con isometría avanzada plenamente integrada.',
  },
  {
    to: '/metodologia/ltad-5ta-4ta',
    icon: '📗',
    titulo: 'LTAD — 5ta y 4ta',
    subtitulo: '18-20 años · Transferencia y Potencia',
    descripcion:
      'Transferencia directa al gesto competitivo específico: velocidad, potencia y manejo de fatiga, con programación completamente individual.',
  },
]

export function MetodologiaIndexView() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          📚 Biblioteca de Manuales Metodológicos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Marco teórico oficial del Área de Fuerza — 6 documentos exportables a PDF, uno por
          etapa del modelo de Desarrollo Atlético a Largo Plazo (LTAD) más los dos manuales
          generales.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MANUALES.map((manual) => (
          <Link
            key={manual.to}
            to={manual.to}
            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-union-red-300 hover:bg-union-red-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-union-red-500/40 dark:hover:bg-union-red-500/5"
          >
            <span className="text-2xl" aria-hidden>
              {manual.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{manual.titulo}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-union-red-600">{manual.subtitulo}</p>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{manual.descripcion}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
