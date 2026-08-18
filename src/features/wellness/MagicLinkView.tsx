import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/Card'
import { Avatar } from '@/components/Avatar'
import { RatingPicker } from '@/components/RatingPicker'
import { SearchableSelect } from '@/components/SearchableSelect'
import { colorRpe } from '@/features/workload/calculations'
import { getErrorMessage } from '@/utils/errors'
import { fechaHoyLocal } from '@/utils/fecha'
import type { Athlete, WellnessRating } from '@/types'

const RPE_LABEL: Record<number, string> = {
  0: 'Reposo',
  1: 'Muy, muy leve',
  2: 'Leve',
  3: 'Leve+',
  4: 'Moderado',
  5: 'Algo intenso',
  6: 'Intenso',
  7: 'Muy intenso',
  8: 'Muy intenso+',
  9: 'Casi máximo',
  10: 'Máximo',
}

type TipoFormulario = 'wellness' | 'rpe'

/**
 * Título del módulo (Fase 22) — usado tanto en el encabezado grande de cada
 * pantalla como (con el sufijo del club) en `document.title`. Mismo texto en
 * los dos lugares para que la pestaña del navegador y lo que ve el jugador
 * en pantalla coincidan.
 */
function tituloModulo(tipo: TipoFormulario, categoriaNombre: string | null): string {
  const modulo = tipo === 'rpe' ? 'RPE' : 'Wellness'
  return categoriaNombre ? `${modulo} — ${categoriaNombre}` : `Control de ${modulo} — C.A. Unión`
}

function Pantalla({ titulo, children }: { titulo?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-slate-50 px-4 py-8 dark:bg-slate-950">
      {titulo && (
        <p className="text-center text-xl font-bold text-slate-800 dark:text-slate-100">{titulo}</p>
      )}
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}

function PantallaCarga() {
  return (
    <Pantalla>
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-union-red-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
      </div>
    </Pantalla>
  )
}

function PantallaLinkInvalido() {
  return (
    <Pantalla>
      <Card className="flex flex-col items-center gap-2 py-10 text-center">
        <span className="text-2xl">⚠️</span>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Este link no es válido o ya expiró.
        </p>
        <p className="text-xs text-slate-400">Pedile al profe que te genere uno nuevo.</p>
      </Card>
    </Pantalla>
  )
}

interface PantallaSeleccionJugadorProps {
  jugadores: Athlete[]
  tipo: TipoFormulario
  categoriaNombre: string | null
  onSeleccionar: (athleteId: string) => void
}

/** Paso 0: el link ya no trae el jugador — cada uno elige su nombre de una lista. */
function PantallaSeleccionJugador({ jugadores, tipo, categoriaNombre, onSeleccionar }: PantallaSeleccionJugadorProps) {
  return (
    <Pantalla titulo={tituloModulo(tipo, categoriaNombre)}>
      <Card className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="text-3xl">👋</span>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">¿Quién sos?</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Elegí tu nombre para continuar</p>
        </div>
        <SearchableSelect
          className="w-full text-left"
          options={jugadores.map((a) => ({ id: a.id, label: a.nombre }))}
          value={null}
          onChange={onSeleccionar}
          placeholder="Escribí tu nombre…"
          emptyLabel="Ningún jugador coincide"
        />
      </Card>
    </Pantalla>
  )
}

interface FormularioProps {
  athleteId: string
  nombre: string
  categoriaNombre: string | null
  onCambiarJugador: () => void
}

function EncabezadoJugador({ nombre, subtitulo, onCambiarJugador }: { nombre: string; subtitulo: string; onCambiarJugador: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <Avatar nombre={nombre} size="lg" />
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Hola, {nombre.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitulo}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCambiarJugador}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        No soy yo
      </button>
    </div>
  )
}

/** Formulario del jugador cuando el link es `?type=wellness` — inicio del día. */
function FormularioWellness({ athleteId, nombre, categoriaNombre, onCambiarJugador }: FormularioProps) {
  const [searchParams] = useSearchParams()
  const submitWellness = useAppStore((s) => s.submitWellness)
  const seasonId = searchParams.get('season')
  const categoryId = searchParams.get('category')
  const titulo = tituloModulo('wellness', categoriaNombre)

  const [sueno, setSueno] = useState<WellnessRating>(3)
  const [dolorMuscular, setDolorMuscular] = useState<WellnessRating>(3)
  const [estres, setEstres] = useState<WellnessRating>(3)
  const [fatiga, setFatiga] = useState<WellnessRating>(3)
  const [comentarioDolor, setComentarioDolor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!seasonId || !categoryId) return <PantallaLinkInvalido />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (enviando) return
    setEnviando(true)
    setError(null)
    try {
      await submitWellness({
        athleteId,
        seasonId: seasonId!,
        categoryId: categoryId!,
        fecha: fechaHoyLocal(),
        sueno,
        dolorMuscular,
        estres,
        fatiga,
        comentarioDolor: comentarioDolor.trim() || undefined,
      })
      setEnviado(true)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el registro.'))
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <Pantalla titulo={titulo}>
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="text-4xl">✅</span>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            ¡Gracias, {nombre.split(' ')[0]}!
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tu wellness de hoy fue registrado.</p>
        </Card>
      </Pantalla>
    )
  }

  return (
    <Pantalla titulo={titulo}>
      <div className="flex flex-col gap-4">
        <EncabezadoJugador nombre={nombre} subtitulo="Wellness de hoy" onCambiarJugador={onCambiarJugador} />

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Card className="flex flex-col gap-4">
            <RatingPicker
              label="Calidad de sueño"
              value={sueno}
              onChange={(v) => setSueno(v as WellnessRating)}
              emojis={['😫', '😕', '😐', '🙂', '😄']}
            />
            <RatingPicker
              label="Dolor muscular"
              value={dolorMuscular}
              onChange={(v) => setDolorMuscular(v as WellnessRating)}
              emojis={['💪', '🙂', '😐', '😣', '🤕']}
              invert
            />
            <RatingPicker
              label="Estrés"
              value={estres}
              onChange={(v) => setEstres(v as WellnessRating)}
              emojis={['😌', '🙂', '😐', '😟', '😖']}
              invert
            />
            <RatingPicker
              label="Fatiga"
              value={fatiga}
              onChange={(v) => setFatiga(v as WellnessRating)}
              emojis={['⚡', '🙂', '😐', '😓', '🥵']}
              invert
            />
          </Card>

          <Card className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Comentarios / ¿Sentís algún dolor?
            </span>
            <textarea
              value={comentarioDolor}
              onChange={(e) => setComentarioDolor(e.target.value)}
              rows={3}
              placeholder="Opcional — contale al profe si sentís alguna molestia"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </Card>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-2xl bg-union-red-600 py-4 text-base font-bold text-white shadow-lg shadow-union-red-600/30 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      </div>
    </Pantalla>
  )
}

/** Formulario del jugador cuando el link es `?type=rpe` — fin de la sesión. La
 * duración ya la definió el coach (viaja en la URL) y no se le muestra. */
function FormularioRpe({ athleteId, nombre, categoriaNombre, onCambiarJugador }: FormularioProps) {
  const [searchParams] = useSearchParams()
  const submitSessionLoad = useAppStore((s) => s.submitSessionLoad)
  const seasonId = searchParams.get('season')
  const categoryId = searchParams.get('category')
  const titulo = tituloModulo('rpe', categoriaNombre)

  const [rpe, setRpe] = useState(5)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!seasonId || !categoryId) return <PantallaLinkInvalido />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (enviando) return
    setEnviando(true)
    setError(null)
    try {
      await submitSessionLoad({
        planId: null,
        athleteId,
        seasonId: seasonId!,
        categoryId: categoryId!,
        fecha: fechaHoyLocal(),
        rpe,
        // La duración real la carga el profe en "PLANIFICAR MICROCICLO"
        // (Configuración de Sesión Diaria); el sRPE se cruza dinámicamente —
        // ver calcularCargaEjecutadaReal. Estos dos quedan como placeholder.
        duracionMin: 0,
        cargaInternaCalculada: 0,
      })
      setEnviado(true)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el registro.'))
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <Pantalla titulo={titulo}>
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="text-4xl">✅</span>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            ¡Gracias, {nombre.split(' ')[0]}!
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tu RPE de la sesión fue registrado.</p>
        </Card>
      </Pantalla>
    )
  }

  return (
    <Pantalla titulo={titulo}>
      <div className="flex flex-col gap-4">
        <EncabezadoJugador
          nombre={nombre}
          subtitulo="¿Qué tan dura sentiste la sesión de hoy?"
          onCambiarJugador={onCambiarJugador}
        />

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Card className="flex flex-col items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">RPE de la sesión</span>
            <span className="text-5xl font-bold" style={{ color: colorRpe(rpe) }}>
              {rpe}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{RPE_LABEL[rpe]}</span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={rpe}
              onChange={(e) => setRpe(Number(e.target.value))}
              className="h-3 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
              style={{
                background: `linear-gradient(to right, ${colorRpe(rpe)} 0%, ${colorRpe(rpe)} ${
                  (rpe / 10) * 100
                }%, #e2e8f0 ${(rpe / 10) * 100}%, #e2e8f0 100%)`,
              }}
            />
            <div className="flex w-full justify-between text-[11px] text-slate-400">
              <span>0</span>
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>10</span>
            </div>
          </Card>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-2xl bg-union-red-600 py-4 text-base font-bold text-white shadow-lg shadow-union-red-600/30 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      </div>
    </Pantalla>
  )
}

export function MagicLinkView() {
  const [searchParams] = useSearchParams()
  const isLoading = useAppStore((s) => s.isLoading)
  const fetchInitialData = useAppStore((s) => s.fetchInitialData)
  const athletes = useAppStore((s) => s.athletes)
  const rosters = useAppStore((s) => s.rosters)
  const categories = useAppStore((s) => s.categories)
  const [athleteId, setAthleteId] = useState<string | null>(null)

  const tipo: TipoFormulario = searchParams.get('type') === 'rpe' ? 'rpe' : 'wellness'
  const seasonId = searchParams.get('season')
  const categoryId = searchParams.get('category')
  // Fase 22: la categoría puede llegar por id (`?category=<uuid>`, el caso
  // normal — se resuelve el nombre contra `categories` una vez que cargó) o
  // ya resuelta por nombre (`?category_name=`), para no depender de que el
  // store haya sincronizado con Supabase.
  const categoryNameParam = searchParams.get('category_name')
  const categoriaNombre =
    categoryNameParam || categories.find((c) => c.id === categoryId)?.nombre || null

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  useEffect(() => {
    document.title = `${tituloModulo(tipo, categoriaNombre)}${categoriaNombre ? ' | C.A. Unión' : ''}`
  }, [tipo, categoriaNombre])

  const jugadoresActivos = useMemo(() => {
    if (!seasonId || !categoryId) return []
    const idsDelPlantel = new Set(
      rosters.filter((r) => r.season_id === seasonId && r.category_id === categoryId).map((r) => r.athlete_id),
    )
    return athletes.filter((a) => idsDelPlantel.has(a.id))
  }, [athletes, rosters, seasonId, categoryId])

  if (isLoading) return <PantallaCarga />
  if (!seasonId || !categoryId || jugadoresActivos.length === 0) return <PantallaLinkInvalido />

  const athlete = athleteId ? (jugadoresActivos.find((a) => a.id === athleteId) ?? null) : null

  if (!athlete) {
    return (
      <PantallaSeleccionJugador
        jugadores={jugadoresActivos}
        tipo={tipo}
        categoriaNombre={categoriaNombre}
        onSeleccionar={setAthleteId}
      />
    )
  }

  return tipo === 'rpe' ? (
    <FormularioRpe
      athleteId={athlete.id}
      nombre={athlete.nombre}
      categoriaNombre={categoriaNombre}
      onCambiarJugador={() => setAthleteId(null)}
    />
  ) : (
    <FormularioWellness
      athleteId={athlete.id}
      nombre={athlete.nombre}
      categoriaNombre={categoriaNombre}
      onCambiarJugador={() => setAthleteId(null)}
    />
  )
}
