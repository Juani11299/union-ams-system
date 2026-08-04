import { useState } from 'react'
import { useAppStore, useAthletesActivos, usePhysicalTestsActivos } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Avatar } from '@/components/Avatar'
import { Field, inputClass } from '@/components/FormField'
import { InfoTooltip } from '@/components/InfoTooltip'
import { calcularCaidaCmjPct, calcularCaidaMrsiPct, UMBRAL_FATIGA_MRSI_PCT } from './calculations'
import { fechaHoyLocal, parsearFechaLocal } from '@/utils/fecha'
import { getErrorMessage } from '@/utils/errors'

export function CmjTab() {
  const athletes = useAthletesActivos()
  const physicalTests = usePhysicalTestsActivos()
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const submitPhysicalTest = useAppStore((s) => s.submitPhysicalTest)
  const showToast = useToastStore((s) => s.showToast)

  const [athleteId, setAthleteId] = useState(athletes[0]?.id ?? '')
  const [fecha, setFecha] = useState(fechaHoyLocal())
  const [cmjCm, setCmjCm] = useState(35)
  const [rsiModificado, setRsiModificado] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!athleteId || !activeSeasonId || !activeCategoryId || guardando) return
    if (!Number.isFinite(cmjCm) || cmjCm <= 0) {
      setError('Ingresá un valor de CMJ válido (en cm).')
      return
    }
    const rsiValor = rsiModificado.trim() === '' ? undefined : Number(rsiModificado)
    if (rsiValor !== undefined && (!Number.isFinite(rsiValor) || rsiValor <= 0)) {
      setError('El RSI modificado debe ser un número válido (o dejalo vacío).')
      return
    }
    setError(null)
    setGuardando(true)

    try {
      await submitPhysicalTest({
        athleteId,
        seasonId: activeSeasonId,
        categoryId: activeCategoryId,
        fecha,
        cmjCm,
        rsiModificado: rsiValor,
        notas: notas.trim() || undefined,
      })
      showToast('success', '¡Evaluación CMJ cargada exitosamente!')
      setRsiModificado('')
      setNotas('')
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar la evaluación.'))
    } finally {
      setGuardando(false)
    }
  }

  const historial = physicalTests
    .filter((t) => t.athleteId === athleteId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  if (athletes.length === 0) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        No hay jugadores cargados para esta categoría en esta temporada.
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
      <Card as="form" onSubmit={handleSubmit} className="flex h-fit flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Nueva evaluación CMJ
        </h2>
        <Field label="Jugador" required>
          <select className={inputClass} value={athleteId} onChange={(e) => setAthleteId(e.target.value)}>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha" required>
          <input type="date" className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
        <Field label="CMJ (cm)" error={error ?? undefined} required>
          <input
            type="number"
            step="0.1"
            className={inputClass}
            value={cmjCm}
            onChange={(e) => setCmjCm(Number(e.target.value))}
          />
        </Field>
        <Field
          label={
            <span className="flex items-center gap-1">
              RSI modificado (opcional)
              <InfoTooltip
                titulo="RSI modificado (mRSI)"
                descripcion="Altura de salto / tiempo hasta despegue. Requiere plataforma de fuerza (VALD ForceDecks, Hawkin Dynamics, etc.). Es el indicador más sensible a la fatiga neuromuscular disponible en esta app."
                cita="Marques et al. (2026), Sport Perf & Science Reports 293; TFM Robles, J.I. (2026), dir. Olaya Cuartero, J."
              />
            </span>
          }
        >
          <input
            type="number"
            step="0.01"
            placeholder="Ej: 0.46"
            className={inputClass}
            value={rsiModificado}
            onChange={(e) => setRsiModificado(e.target.value)}
          />
        </Field>
        <Field label="Notas (opcional)">
          <textarea className={inputClass} rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </Field>
        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar evaluación'}
        </button>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Avatar nombre={athletes.find((a) => a.id === athleteId)?.nombre ?? ''} size="sm" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Historial de {athletes.find((a) => a.id === athleteId)?.nombre}
          </h2>
        </div>
        {historial.length === 0 ? (
          <p className="text-sm text-slate-400">Todavía no hay evaluaciones cargadas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {historial.map((test, i) => {
              const par = i < historial.length - 1 ? [test, historial[i + 1]] : null
              const caidaCmj = par ? calcularCaidaCmjPct(par, athleteId) : null
              const caidaMrsi = par ? calcularCaidaMrsiPct(par, athleteId) : null
              return (
                <div
                  key={test.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
                >
                  <span className="capitalize text-slate-500 dark:text-slate-400">
                    {parsearFechaLocal(test.fecha).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {test.cmjCm} cm
                      {test.rsiModificado !== undefined && (
                        <span className="ml-1 font-normal text-slate-400">· mRSI {test.rsiModificado}</span>
                      )}
                    </span>
                    <span className="flex gap-2 text-xs">
                      {caidaCmj !== null && (
                        <span
                          className={
                            caidaCmj >= 4.7 ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-slate-400'
                          }
                        >
                          CMJ {caidaCmj > 0 ? `▼ -${caidaCmj}%` : `▲ +${Math.abs(caidaCmj)}%`}
                        </span>
                      )}
                      {caidaMrsi !== null && (
                        <span
                          className={
                            caidaMrsi >= UMBRAL_FATIGA_MRSI_PCT
                              ? 'font-medium text-rose-600 dark:text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          mRSI {caidaMrsi > 0 ? `▼ -${caidaMrsi}%` : `▲ +${Math.abs(caidaMrsi)}%`}
                        </span>
                      )}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
