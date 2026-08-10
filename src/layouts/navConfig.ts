export interface NavItem {
  to: string
  label: string
  /** Etiqueta corta para la bottom tab bar mobile (los labels completos son muy largos). */
  shortLabel: string
  icon: string
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Control Carga Interna', shortLabel: 'Carga Interna', icon: '📊' },
  { to: '/planificador', label: 'PLANIFICADOR', shortLabel: 'Planificador', icon: '🗓️' },
  { to: '/match-day', label: 'Día de Partido', shortLabel: 'Partido', icon: '🏆' },
  { to: '/carga-externa', label: 'Control de Carga Externa', shortLabel: 'Carga Externa', icon: '📡' },
  { to: '/medical', label: 'Área Médica', shortLabel: 'Médica', icon: '🩺' },
  { to: '/metodologia/isometria', label: 'Manual Metodológico', shortLabel: 'Metodología', icon: '📘' },
  { to: '/metodologia/manual-fuerza', label: 'Manual Área de Fuerza', shortLabel: 'Fuerza', icon: '🏋️' },
  { to: '/admin', label: 'Administración', shortLabel: 'Admin', icon: '⚙️' },
]
