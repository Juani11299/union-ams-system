import type { Athlete, GymExternalLoad, SessionPlan } from '@/types'

export type ClaveGrupoRack = 'A' | 'B' | 'C' | 'sin-calibrar'

export interface AtletaConTopSet {
  athlete: Athlete
  topSetKg: number | null
}

export interface GrupoRack {
  clave: ClaveGrupoRack
  nombre: string
  rangoKg: { min: number; max: number } | null
  atletas: AtletaConTopSet[]
}

const DIA_MS = 24 * 60 * 60 * 1000

/**
 * Reparte `n` elementos en `grupos` partes lo más parejo posible, sin
 * romper si `n` es chico (0, 1 o 2 atletas calibrados) — los primeros
 * grupos se llevan el resto de la división, así nunca queda un grupo
 * negativo ni un `slice` fuera de rango.
 */
function tamañosBalanceados(n: number, grupos: number): number[] {
  const base = Math.floor(n / grupos)
  const resto = n % grupos
  return Array.from({ length: grupos }, (_, i) => base + (i < resto ? 1 : 0))
}

function calcularRango(atletas: AtletaConTopSet[]): { min: number; max: number } | null {
  const valores = atletas.map((a) => a.topSetKg).filter((v): v is number => v !== null)
  if (valores.length === 0) return null
  return { min: Math.min(...valores), max: Math.max(...valores) }
}

/**
 * "Organizador de Racks" (Fase 29) — para un ejercicio troncal, agrupa a
 * los atletas activos en 3 terciles de fuerza según su Top Set máximo
 * registrado en `gym_external_loads` dentro de una ventana de días (default
 * 60, dentro del rango "30-60 días" pedido — más ancho para no dejar a un
 * atleta activo "Sin Calibrar" sólo porque su último registro tiene 35
 * días). Terciles = dividir por CANTIDAD de atletas (no por rango de kg
 * fijo): con 9 atletas calibrados, 3 van a cada grupo; el rango de kg de
 * cada tarjeta se muestra recién DESPUÉS de armar los grupos, como el
 * min-max real de ese grupo, no un umbral inventado de antemano.
 *
 * Atletas sin ningún registro de ese ejercicio en la ventana van a "Sin
 * Calibrar" — no se puede asignarles un rack sin un dato real de partida.
 */
export function organizarRacks(
  athletes: Athlete[],
  gymExternalLoads: GymExternalLoad[],
  sessionPlans: SessionPlan[],
  ejercicio: string,
  diasVentana = 60,
  fechaReferencia: Date = new Date(),
): GrupoRack[] {
  const ejercicioNormalizado = ejercicio.trim().toLowerCase()
  const limiteMs = diasVentana * DIA_MS
  const ahora = fechaReferencia.getTime()

  const conTopSet: AtletaConTopSet[] = []
  const sinCalibrar: AtletaConTopSet[] = []

  for (const athlete of athletes) {
    const registros = gymExternalLoads.filter((g) => {
      if (g.athleteId !== athlete.id) return false
      if (g.exerciseName.trim().toLowerCase() !== ejercicioNormalizado) return false
      const sesion = sessionPlans.find((p) => p.id === g.sessionId)
      if (!sesion) return false
      const diff = ahora - new Date(sesion.fecha).getTime()
      return diff >= 0 && diff <= limiteMs
    })

    if (registros.length === 0) {
      sinCalibrar.push({ athlete, topSetKg: null })
      continue
    }

    const topSetKg = Math.max(...registros.flatMap((r) => r.setsData.map((s) => s.weightKg)))
    conTopSet.push({ athlete, topSetKg })
  }

  conTopSet.sort((a, b) => (b.topSetKg ?? 0) - (a.topSetKg ?? 0))

  const [tamañoA, tamañoB] = tamañosBalanceados(conTopSet.length, 3)
  const grupoA = conTopSet.slice(0, tamañoA)
  const grupoB = conTopSet.slice(tamañoA, tamañoA + tamañoB)
  const grupoC = conTopSet.slice(tamañoA + tamañoB)

  return [
    { clave: 'A', nombre: 'Grupo A — Pesado', rangoKg: calcularRango(grupoA), atletas: grupoA },
    { clave: 'B', nombre: 'Grupo B — Medio', rangoKg: calcularRango(grupoB), atletas: grupoB },
    { clave: 'C', nombre: 'Grupo C — Ligero/Desarrollo', rangoKg: calcularRango(grupoC), atletas: grupoC },
    { clave: 'sin-calibrar', nombre: 'Sin Calibrar', rangoKg: null, atletas: sinCalibrar },
  ]
}

/** Ejercicios troncales con al menos un registro histórico — para el selector del organizador. */
export function obtenerEjerciciosDisponibles(gymExternalLoads: GymExternalLoad[]): string[] {
  return Array.from(new Set(gymExternalLoads.map((g) => g.exerciseName))).sort((a, b) =>
    a.localeCompare(b, 'es'),
  )
}

/** Mensaje prolijo para copiar y pegar en el grupo de WhatsApp del staff, antes del entrenamiento. */
export function construirMensajeGrupos(ejercicio: string, grupos: GrupoRack[]): string {
  const lineas = [`🗂️ Organización de Racks — ${ejercicio}`, '']
  for (const grupo of grupos) {
    if (grupo.atletas.length === 0) continue
    const rango = grupo.rangoKg ? ` (${grupo.rangoKg.min}kg - ${grupo.rangoKg.max}kg)` : ''
    lineas.push(`${grupo.nombre}${rango}:`)
    lineas.push(...grupo.atletas.map((a) => `- ${a.athlete.nombre}`))
    lineas.push('')
  }
  return lineas.join('\n').trim()
}
