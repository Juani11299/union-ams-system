import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { fechaHoyLocal } from '@/utils/fecha'
import { ToastContainer } from '@/components/ToastContainer'
import { RegistroModal } from './RegistroModal'
import { ListaControlCarga } from './ListaControlCarga'
import type { Athlete, GymSheetEjercicio } from '@/types'

/**
 * Terminal de Fuerza (Fase 17, multi-ejercicio + Modo Lista desde Fase 37)
 * — pantalla táctil, sin sidebar/topbar (ruta montada fuera de `MainLayout`
 * en `App.tsx`, mismo criterio que `/ingreso-rapido`). Dos modos:
 *
 * - "Modo Jugador" (histórico): el jugador toca su propio nombre y carga su
 *   Top Set de cada ejercicio 🎯 marcado en la Planilla de Fuerza de hoy
 *   (`GymSheetEditor`) — pantalla grande, autogestionado.
 * - "Modo Lista" (Fase 37): pensado para que el profe complete la carga de
 *   TODO el plantel de una sentada, desde una notebook/tablet — una tabla
 *   con todos los jugadores y un grupo de columnas por ejercicio, en vez de
 *   ir modal por modal. Ver `ListaControlCarga`.
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
  const [modo, setModo] = useState<'jugador' | 'lista'>('jugador')

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

  // Fase 37 — puede haber más de un ejercicio marcado 🎯 en la planilla de
  // hoy (ver `GymSheetEditor.marcarTrackeado`), no sólo el primero.
  const ejerciciosTrackeados: GymSheetEjercicio[] = useMemo(() => {
    return (sesionHoy?.gymSheetData?.bloques ?? []).flatMap((b) => b.ejercicios.filter((e) => e.isTracked))
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

  // Fase 37 — "completo" ahora significa un registro por CADA ejercicio
  // trackeado, no cualquiera — antes alcanzaba con uno solo porque sólo
  // podía haber un ejercicio marcado.
  const idsCompletosHoy = useMemo(() => {
    if (!sesionHoy || ejerciciosTrackeados.length === 0) return new Set<string>()
    const nombresTrackeados = new Set(ejerciciosTrackeados.map((e) => e.nombre))
    const conteoPorAtleta = new Map<string, number>()
    for (const g of gymExternalLoads) {
      if (g.sessionId !== sesionHoy.id || !nombresTrackeados.has(g.exerciseName)) continue
      conteoPorAtleta.set(g.athleteId, (conteoPorAtleta.get(g.athleteId) ?? 0) + 1)
    }
    const completos = new Set<string>()
    for (const [athleteId, cantidad] of conteoPorAtleta) {
      if (cantidad >= ejerciciosTrackeados.length) completos.add(athleteId)
    }
    return completos
  }, [gymExternalLoads, sesionHoy, ejerciciosTrackeados])

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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
            <button
              type="button"
              onClick={() => setModo('jugador')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                modo === 'jugador' ? 'bg-union-red-600 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              👤 Modo Jugador
            </button>
            <button
              type="button"
              onClick={() => setModo('lista')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                modo === 'lista' ? 'bg-union-red-600 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              📋 Modo Lista
            </button>
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
        </div>
      </header>

      <main className="px-4 py-6 md:px-8">
        {!sesionHoy ? (
          <EstadoVacio
            icono="📅"
            mensaje="No hay una sesión de Gimnasio planificada para hoy en esta categoría."
          />
        ) : ejerciciosTrackeados.length === 0 ? (
          <EstadoVacio
            icono="🎯"
            mensaje="El profe todavía no marcó qué ejercicio(s) medir en la Planilla de Fuerza de hoy."
          />
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-2 rounded-2xl bg-union-red-600 px-6 py-5 text-center shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
                🔥 {ejerciciosTrackeados.length > 1 ? 'Ejercicios a registrar hoy' : 'Ejercicio a registrar hoy'}
              </p>
              {ejerciciosTrackeados.map((ej) => (
                <div key={ej.id}>
                  <p className="text-2xl font-black leading-tight">{ej.nombre}</p>
                  {(ej.series || ej.repeticiones) && (
                    <p className="text-sm text-white/80">
                      Planificado: {ej.series || '—'} x {ej.repeticiones || '—'}
                      {ej.cargaKg ? ` — ${ej.cargaKg}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {jugadores.length === 0 ? (
              <EstadoVacio icono="👥" mensaje="No hay jugadores cargados en el plantel de esta categoría." />
            ) : modo === 'lista' ? (
              <ListaControlCarga jugadores={jugadores} sesionId={sesionHoy.id} ejercicios={ejerciciosTrackeados} />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {jugadores.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => setJugadorSeleccionado(j)}
                    className="relative flex h-32 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-white/10 bg-white/5 px-3 text-center text-lg font-bold transition-colors hover:bg-white/10 active:bg-white/20"
                  >
                    {idsCompletosHoy.has(j.id) && (
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

      {jugadorSeleccionado && sesionHoy && ejerciciosTrackeados.length > 0 && (
        <RegistroModal
          jugador={jugadorSeleccionado}
          sesionId={sesionHoy.id}
          ejercicios={ejerciciosTrackeados}
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
