import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Field, inputClass } from '@/components/FormField'
import { getErrorMessage } from '@/utils/errors'

export function ClubSeasonsTab() {
  const club = useAppStore((s) => s.club)
  const seasons = useAppStore((s) => s.seasons)
  const updateClub = useAppStore((s) => s.updateClub)
  const createSeason = useAppStore((s) => s.createSeason)
  const marcarTemporadaActiva = useAppStore((s) => s.marcarTemporadaActiva)
  const showToast = useToastStore((s) => s.showToast)

  const [nombreClub, setNombreClub] = useState(club?.nombre ?? '')
  const [logoUrl, setLogoUrl] = useState(club?.logo_url ?? '')
  const [guardandoClub, setGuardandoClub] = useState(false)
  const [errorNombre, setErrorNombre] = useState<string | null>(null)

  const [year, setYear] = useState(() => new Date().getFullYear() + 1)
  const [marcarActiva, setMarcarActiva] = useState(false)
  const [creandoSeason, setCreandoSeason] = useState(false)
  const [errorYear, setErrorYear] = useState<string | null>(null)

  const [marcandoId, setMarcandoId] = useState<string | null>(null)

  async function handleGuardarClub(e: React.FormEvent) {
    e.preventDefault()
    const nombre = nombreClub.trim()
    if (!nombre) {
      setErrorNombre('El nombre no puede estar vacío.')
      return
    }
    setErrorNombre(null)
    setGuardandoClub(true)
    try {
      await updateClub({ nombre, logoUrl: logoUrl.trim() || undefined })
      showToast('success', '¡Club actualizado exitosamente!')
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo actualizar el club.'))
    } finally {
      setGuardandoClub(false)
    }
  }

  async function handleCrearSeason(e: React.FormEvent) {
    e.preventDefault()
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setErrorYear('Ingresá un año válido (2000-2100).')
      return
    }
    if (seasons.some((s) => s.year === year)) {
      setErrorYear('Ya existe una temporada con ese año.')
      return
    }
    setErrorYear(null)
    setCreandoSeason(true)
    try {
      await createSeason({ year, isActive: marcarActiva })
      showToast('success', `¡Temporada ${year} creada exitosamente!`)
      setMarcarActiva(false)
      setYear(year + 1)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo crear la temporada.'))
    } finally {
      setCreandoSeason(false)
    }
  }

  async function handleMarcarActiva(seasonId: string) {
    setMarcandoId(seasonId)
    try {
      await marcarTemporadaActiva(seasonId)
      showToast('success', 'Temporada activa actualizada.')
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo marcar la temporada como activa.'))
    } finally {
      setMarcandoId(null)
    }
  }

  const ordenadas = [...seasons].sort((a, b) => b.year - a.year)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card as="form" onSubmit={handleGuardarClub} className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Datos del club</h2>
        <Field label="Nombre del club" error={errorNombre ?? undefined} required>
          <input
            className={inputClass}
            value={nombreClub}
            onChange={(e) => setNombreClub(e.target.value)}
            placeholder="Ej. Club Atlético Deportivo"
          />
        </Field>
        <Field label="URL del logo (opcional)">
          <div className="flex items-center gap-3">
            {logoUrl.trim() ? (
              <img
                src={logoUrl.trim()}
                alt="Logo del club"
                className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-contain dark:border-slate-700"
                onError={(e) => {
                  e.currentTarget.style.visibility = 'hidden'
                }}
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 text-lg text-slate-300 dark:border-slate-700">
                🛡️
              </div>
            )}
            <input
              className={inputClass}
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…/escudo.png"
            />
          </div>
        </Field>
        <button
          type="submit"
          disabled={guardandoClub}
          className="self-start rounded-lg bg-union-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardandoClub ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </Card>

      <Card as="form" onSubmit={handleCrearSeason} className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Nueva temporada</h2>
        <Field label="Año" error={errorYear ?? undefined} required>
          <input
            type="number"
            className={inputClass}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={marcarActiva}
            onChange={(e) => setMarcarActiva(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-union-red-600 focus:ring-union-red-500"
          />
          Marcar como temporada activa
        </label>
        <button
          type="submit"
          disabled={creandoSeason}
          className="self-start rounded-lg bg-union-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creandoSeason ? 'Creando…' : 'Crear temporada'}
        </button>
      </Card>

      <Card className="flex flex-col gap-3 lg:col-span-2">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Temporadas</h2>
        {ordenadas.length === 0 ? (
          <p className="text-sm text-slate-400">Todavía no hay temporadas creadas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {ordenadas.map((season) => (
              <div
                key={season.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {season.year}
                  </span>
                  {season.is_active && <Badge tone="green">Activa</Badge>}
                </div>
                <button
                  type="button"
                  onClick={() => handleMarcarActiva(season.id)}
                  disabled={season.is_active || marcandoId === season.id}
                  className="rounded-md px-3 py-1 text-xs font-medium text-union-red-700 hover:bg-union-red-50 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-union-red-400 dark:hover:bg-union-red-500/10"
                >
                  {marcandoId === season.id ? 'Marcando…' : 'Marcar como activa'}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
