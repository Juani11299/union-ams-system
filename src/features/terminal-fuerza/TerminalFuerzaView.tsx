import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { fechaHoyLocal } from '@/utils/fecha'
import { ToastContainer } from '@/components/ToastContainer'
import { RegistroModal } from './RegistroModal'
import type { Athlete, GymSheetEjercicio } from '@/types'

/**
 * Terminal de Fuerza (Fase 17) — pantalla táctil, sin sidebar/topbar (ruta
 * montada fuera de `MainLayout` en `App.tsx`, mismo criterio que
 * `/ingreso-rapido`), para que el jugador registre él mismo, tocando, las
 * series del ejercicio troncal que el profe marcó con 🎯 en la Planilla de
 * Fuerza de la sesión de Gimnasio de HOY (`GymSheetEditor`, Fase 16/17).
 */
export function TerminalFuerzaView() {
  const isLoading = useAppStore((s) => s.isLoading)
  const fetchInitialData = useAppStore((s) => s.fetchInitialData)
  const categories = useAppStore((s) => s.categories)
  const rosters = useAppStore((s) => s.rosters)
  const athletes = useAppStore((s) => s.athletes)
  const sessionPlans = useAppStore((s) => s.sessionPlans)
  const gymExternalLoads = useAppStore((s) => s.gymExternalLoads)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)

  // Terminal de Fuerza es una ruta standalone (fuera de MainLayout) con su
  // propio selector de categoría en estado local — no comparte el
  // `activeCategoryId` global, así que el link mágico escopeado (Fase 19,
  // `useScopedCategoryFromUrl`) no le llega. Lee `?category=&locked=true`
  // acá mismo, directo de la URL.
  const [searchParams] = useSearchParams()
  const categoryIdEscopeada = searchParams.get('category')
  const categoryLocked = !!categoryIdEscopeada && searchParams.get('locked') === 'true'

  const [categoryId, setCategoryId] = useState<string | null>(categoryIdEscopeada)
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<Athlete | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  useEffect(() => {
    if (!categoryId && categories.length > 0) setCategoryId(categories[0].id)
  }, [categories, categoryId])

  const hoy = fechaHoyLocal()

  const sesionHoy = useMemo(() => {
    if (!activeSeasonId || !categoryId) return null
    return (
      sessionPlans.find(
        (p) =>
          p.season_id === activeSeasonId &&
          p.category_id === categoryId &&
          p.fecha === hoy &&
          p.tipo === 'Gimnasio',
      ) ?? null
    )
  }, [sessionPlans, activeSeasonId, categoryId, hoy])

  const ejercicioTrackeado: GymSheetEjercicio | null = useMemo(() => {
    for (const bloque of sesionHoy?.gymSheetData?.bloques ?? []) {
      const encontrado = bloque.ejercicios.find((e) => e.isTracked)
      if (encontrado) return encontrado
    }
    return null
  }, [sesionHoy])

  const jugadores = useMemo(() => {
    if (!activeSeasonId || !categoryId) return []
    const idsRoster = new Set(
      rosters
        .filter((r) => r.season_id === activeSeasonId && r.category_id === categoryId)
        .map((r) => r.athlete_id),
    )
    return athletes.filter((a) => idsRoster.has(a.id)).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [rosters, athletes, activeSeasonId, categoryId])

  const idsRegistradosHoy = useMemo(() => {
    if (!sesionHoy) return new Set<string>()
    return new Set(gymExternalLoads.filter((g) => g.sessionId === sesionHoy.id).map((g) => g.athleteId))
  }, [gymExternalLoads, sesionHoy])

  if (isLoading) return <PantallaCarga />

  return (
    <div className="min-h-svh bg-union-charcoal text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <img src="/logo-union.png" alt="" className="h-12 w-12 shrink-0 object-contain" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
              Registro de Carga Externa
            </p>
            <h1 className="text-xl font-bold">Terminal de Fuerza — C.A. Unión de Santa Fe</h1>
          </div>
        </div>
        <select
          value={categoryId ?? ''}
          disabled={categoryLocked}
          onChange={(e) => setCategoryId(e.target.value)}
          title={categoryLocked ? 'Categoría bloqueada por link — abrí el link general para poder cambiarla' : undefined}
          className={`rounded-xl border-2 border-white/20 bg-white/10 px-4 py-3 text-lg font-semibold text-white ${
            categoryLocked ? 'cursor-not-allowed opacity-70' : ''
          }`}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="text-slate-900">
              {categoryLocked ? '🔒 ' : ''}
              {c.nombre}
            </option>
          ))}
        </select>
      </header>

      <main className="px-4 py-6 md:px-8">
        {!sesionHoy ? (
          <EstadoVacio
            icono="📅"
            mensaje="No hay una sesión de Gimnasio planificada para hoy en esta categoría."
          />
        ) : !ejercicioTrackeado ? (
          <EstadoVacio
            icono="🎯"
            mensaje="El profe todavía no marcó qué ejercicio medir en la Planilla de Fuerza de hoy."
          />
        ) : (
          <>
            <div className="mb-6 rounded-2xl bg-union-red-600 px-6 py-5 text-center shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
                🔥 Ejercicio a registrar hoy
              </p>
              <p className="mt-1 text-3xl font-black leading-tight">{ejercicioTrackeado.nombre}</p>
              {(ejercicioTrackeado.series || ejercicioTrackeado.repeticiones) && (
                <p className="mt-1 text-sm text-white/80">
                  Planificado: {ejercicioTrackeado.series || '—'} x {ejercicioTrackeado.repeticiones || '—'}
                  {ejercicioTrackeado.cargaKg ? ` — ${ejercicioTrackeado.cargaKg}` : ''}
                </p>
              )}
            </div>

            {jugadores.length === 0 ? (
              <EstadoVacio icono="👥" mensaje="No hay jugadores cargados en el plantel de esta categoría." />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {jugadores.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => setJugadorSeleccionado(j)}
                    className="relative flex h-32 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-white/10 bg-white/5 px-3 text-center text-lg font-bold transition-colors hover:bg-white/10 active:bg-white/20"
                  >
                    {idsRegistradosHoy.has(j.id) && (
                      <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-base">
                        ✅
                      </span>
                    )}
                    {j.nombre}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {jugadorSeleccionado && sesionHoy && ejercicioTrackeado && (
        <RegistroModal
          jugador={jugadorSeleccionado}
          sesionId={sesionHoy.id}
          ejercicio={ejercicioTrackeado}
          onClose={() => setJugadorSeleccionado(null)}
        />
      )}

      {/* Ruta standalone (fuera de MainLayout, ver App.tsx) — la Terminal de
          Fuerza tiene que montar su propio ToastContainer, si no los
          showToast() de RegistroModal (guardado exitoso/error) no tienen
          dónde renderizar. */}
      <ToastContainer />
    </div>
  )
}

function PantallaCarga() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-union-charcoal text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-union-red-600" />
      <p className="text-sm text-white/60">Cargando…</p>
    </div>
  )
}

function EstadoVacio({ icono, mensaje }: { icono: string; mensaje: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 py-24 text-center">
      <span className="text-5xl" aria-hidden>
        {icono}
      </span>
      <p className="max-w-sm text-lg text-white/60">{mensaje}</p>
    </div>
  )
}
