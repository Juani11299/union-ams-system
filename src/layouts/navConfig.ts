export interface NavItem {
  to: string
  label: string
  /** Etiqueta corta para la bottom tab bar mobile (los labels completos son muy largos). */
  shortLabel: string
  icon: string
  /**
   * Agrupa el item bajo un submenú desplegable en el Sidebar de escritorio
   * (ej. "Estructura de Trabajo" — Fase 19). La `BottomTabBar` mobile lo
   * ignora a propósito y sigue mostrando todos los items en un solo nivel
   * plano: en una barra horizontal angosta un desplegable no aporta nada.
   */
  group?: string
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Control Carga Interna', shortLabel: 'Carga Interna', icon: '📊' },
  { to: '/planificador', label: 'PLANIFICADOR', shortLabel: 'Planificador', icon: '🗓️' },
  { to: '/match-day', label: 'Día de Partido', shortLabel: 'Partido', icon: '🏆' },
  { to: '/carga-externa', label: 'Control de Carga Externa', shortLabel: 'Carga Externa', icon: '📡' },
  { to: '/medical', label: 'Área Médica', shortLabel: 'Médica', icon: '🩺' },
  {
    to: '/metodologia/isometria',
    label: 'Escuela de Movimiento (Isometría)',
    shortLabel: 'Isometría',
    icon: '📘',
    group: 'Estructura de Trabajo',
  },
  {
    to: '/metodologia/manual-fuerza',
    label: 'Manual Área de Fuerza',
    shortLabel: 'Fuerza',
    icon: '🏋️',
    group: 'Estructura de Trabajo',
  },
  { to: '/admin', label: 'Administración', shortLabel: 'Admin', icon: '⚙️' },
]
