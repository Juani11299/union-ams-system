import type { Athlete, GymExternalLoad, SessionPlan } from '@/types'

export type ClaveGrupoRack = 'fuerte' | 'en-desarrollo' | 'sin-cargas'

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
 * "Organizador de Racks" (Fase 29, simplificado a 3 grupos en Fase 39) —
 * para un ejercicio troncal, agrupa a los atletas activos en 3 columnas
 * según su Top Set máximo registrado en `gym_external_loads` dentro de una
 * ventana de días (default 60, dentro del rango "30-60 días" pedido — más
 * ancho para no dejar a un atleta activo "Sin Cargas" sólo porque su
 * último registro tiene 35 días):
 *
 * - "Grupo Fuerte": la mitad de los atletas CALIBRADOS con mayor Top Set.
 * - "Grupo No Tan Fuerte / En Desarrollo": la otra mitad.
 * - "Sin Cargas Registradas": nunca cargaron un Top Set de ese ejercicio en
 *   la ventana — no se puede asignarles un rack sin un dato real de partida,
 *   así el cuerpo técnico los detecta rápido y les toma una carga en el momento.
 *
 * La división Fuerte/En Desarrollo es por CANTIDAD de atletas (mitad y
 * mitad, no por un umbral de kg fijo): el rango de kg de cada tarjeta se
 * muestra recién DESPUÉS de armar los grupos, como el min-max real de ese
 * grupo. (Antes de Fase 39 eran 3 terciles — A/B/C — en vez de 2 mitades;
 * se simplificó a 2 porque distinguir "medio" de "liviano" no cambiaba en
 * la práctica qué rack se les asignaba.)
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
  const sinCargas: AtletaConTopSet[] = []

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
      sinCargas.push({ athlete, topSetKg: null })
      continue
    }

    const topSetKg = Math.max(...registros.flatMap((r) => r.setsData.map((s) => s.weightKg)))
    conTopSet.push({ athlete, topSetKg })
  }

  // Fuerte/En Desarrollo ordenados por Top Set descendente (el orden en sí
  // ya es información útil); Sin Cargas no tiene una métrica para ordenar,
  // así que va alfabético — más fácil de ubicar un nombre puntual en la lista.
  conTopSet.sort((a, b) => (b.topSetKg ?? 0) - (a.topSetKg ?? 0))
  sinCargas.sort((a, b) => a.athlete.nombre.localeCompare(b.athlete.nombre, 'es'))

  const [tamañoFuerte] = tamañosBalanceados(conTopSet.length, 2)
  const grupoFuerte = conTopSet.slice(0, tamañoFuerte)
  const grupoEnDesarrollo = conTopSet.slice(tamañoFuerte)

  return [
    { clave: 'fuerte', nombre: 'Grupo Fuerte', rangoKg: calcularRango(grupoFuerte), atletas: grupoFuerte },
    {
      clave: 'en-desarrollo',
      nombre: 'Grupo No Tan Fuerte / En Desarrollo',
      rangoKg: calcularRango(grupoEnDesarrollo),
      atletas: grupoEnDesarrollo,
    },
    { clave: 'sin-cargas', nombre: 'Sin Cargas Registradas', rangoKg: null, atletas: sinCargas },
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
