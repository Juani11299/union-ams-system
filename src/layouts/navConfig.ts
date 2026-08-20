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
  {
    to: '/metodologia/ltad-10ma-pre9na',
    label: 'LTAD — 10ma y Pre 9na (12-13 años)',
    shortLabel: '10ma-Pre9na',
    icon: '📗',
    group: 'Estructura de Trabajo',
  },
  {
    to: '/metodologia/ltad-9na-8va',
    label: 'LTAD — 9na y 8va (14-15 años)',
    shortLabel: '9na-8va',
    icon: '📗',
    group: 'Estructura de Trabajo',
  },
  {
    to: '/metodologia/ltad-7ma-6ta',
    label: 'LTAD — 7ma y 6ta (16-17 años)',
    shortLabel: '7ma-6ta',
    icon: '📗',
    group: 'Estructura de Trabajo',
  },
  {
    to: '/metodologia/ltad-5ta-4ta',
    label: 'LTAD — 5ta y 4ta (18-20 años)',
    shortLabel: '5ta-4ta',
    icon: '📗',
    group: 'Estructura de Trabajo',
  },
  { to: '/admin', label: 'Administración', shortLabel: 'Admin', icon: '⚙️' },
  {
    to: '/testing/perfil',
    label: 'Perfil de Rendimiento 360°',
    shortLabel: 'Testing',
    icon: '🎯',
    group: 'Evaluaciones',
  },
  {
    to: '/medico/rtp',
    label: 'Dashboard RTP (Kinesiología)',
    shortLabel: 'RTP',
    icon: '🩹',
    group: 'Área Médica',
  },
  {
    to: '/coordinacion/macro',
    label: 'Torre de Control de Temporada',
    shortLabel: 'Macrociclo',
    icon: '🗺️',
    group: 'Dashboard Estratégico',
  },
]
