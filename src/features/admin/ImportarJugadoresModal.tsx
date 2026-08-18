import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Field, inputClass } from '@/components/FormField'
import { getErrorMessage } from '@/utils/errors'
import { parsearImportacionJugadores } from '@/utils/parseImportacionJugadores'
import type { TeamCategory } from '@/types'

interface ImportarJugadoresModalProps {
  onClose: () => void
}

/**
 * Importador masivo "estilo pegado de Excel" (Fase 19) — el staff pega
 * directamente el rango de celdas copiado de su planilla real (Apellido y
 * Nombre | Posición | Fecha Nac. DD/MM/AAAA | DNI opcional) y el sistema da
 * de alta a todos los jugadores de una sola vez, ya asignados al plantel de
 * la categoría elegida. Pensado para el onboarding inicial de un plantel
 * completo, donde cargar jugador por jugador en el formulario de al lado
 * sería carísimo en tiempo del profe.
 */
export function ImportarJugadoresModal({ onClose }: ImportarJugadoresModalProps) {
  const categories = useAppStore((s) => s.categories)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const importAthletesBulk = useAppStore((s) => s.importAthletesBulk)
  const showToast = useToastStore((s) => s.showToast)

  const [categoryId, setCategoryId] = useState(activeCategoryId ?? categories[0]?.id ?? '')
  const [texto, setTexto] = useState('')
  const [importando, setImportando] = useState(false)

  const resultado = useMemo(() => parsearImportacionJugadores(texto), [texto])
  const categoriaElegida = categories.find((c) => c.id === categoryId)
  const puedeImportar = !importando && !!categoryId && !!activeSeasonId && resultado.validas.length > 0

  async function handleImportar() {
    if (!categoryId || !activeSeasonId || resultado.validas.length === 0) return
    setImportando(true)
    try {
      const cantidad = await importAthletesBulk({
        seasonId: activeSeasonId,
        categoryId,
        jugadores: resultado.validas.map((j) => ({
          nombre: j.nombre,
          posiciones: j.posiciones,
          fechaNacimiento: j.fechaNacimiento,
        })),
      })
      showToast(
        'success',
        `${cantidad} jugador${cantidad === 1 ? '' : 'es'} importado${cantidad === 1 ? '' : 's'} a ${categoriaElegida?.nombre ?? 'la categoría'}.`,
      )
      onClose()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo completar la importación.'))
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            📥 Importar jugadores desde Excel/CSV
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Field label="Categoría de destino" required>
            <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="" disabled>
                Elegí una categoría…
              </option>
              {categories.map((c: TeamCategory) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>

          <div className="mt-3">
            <Field label="Datos pegados desde Excel/Sheets">
              <textarea
                className={`${inputClass} font-mono text-xs`}
                rows={9}
                placeholder={'Pegá los datos de tu Excel acá\nDrescher Krause Thiago\tdef. central\t25/10/2012\t52496938\nAlbornoz Mateo\tvol. der.\t20/5/2012\t52560347'}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
            </Field>
            <p className="mt-1.5 text-xs text-slate-400">
              Formato esperado:{' '}
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Apellido y Nombre | Posición | Fecha Nac. (DD/MM/YYYY) | DNI
              </span>
              . Una fila por jugador — pegá directo desde Excel/Google Sheets (separado por tabs) o un .csv (separado
              por comas). Si la fecha viene vacía o mal escrita se guarda como 01/01/2000 provisorio, a corregir
              después.
            </p>
          </div>

          {texto.trim() && (
            <div className="mt-3 flex flex-col gap-2">
              {resultado.validas.length > 0 && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    ✅ {resultado.validas.length} jugador{resultado.validas.length === 1 ? '' : 'es'} listo
                    {resultado.validas.length === 1 ? '' : 's'} para importar:
                  </p>
                  <div className="mt-1.5 max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-emerald-600/70 dark:text-emerald-400/70">
                          <th className="py-0.5 pr-2 font-medium">Nombre</th>
                          <th className="py-0.5 pr-2 font-medium">Posición</th>
                          <th className="py-0.5 font-medium">Fecha Nac.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultado.validas.map((j, i) => (
                          <tr key={i} className="text-emerald-800 dark:text-emerald-300">
                            <td className="truncate py-0.5 pr-2">{j.nombre}</td>
                            <td className="truncate py-0.5 pr-2">{j.posiciones.join(', ')}</td>
                            <td className="whitespace-nowrap py-0.5">{j.fechaNacimiento}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {resultado.errores.length > 0 && (
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                  <p className="font-medium">
                    ⚠️ {resultado.errores.length} fila{resultado.errores.length === 1 ? '' : 's'} con problemas — no se
                    van a importar:
                  </p>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {resultado.errores.map((e) => (
                      <li key={e.fila} className="truncate">
                        Fila {e.fila}: {e.motivo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={importando}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleImportar}
            disabled={!puedeImportar}
            className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importando
              ? 'Importando…'
              : resultado.validas.length > 0
                ? `Importar ${resultado.validas.length} jugador${resultado.validas.length === 1 ? '' : 'es'}`
                : 'Importar jugadores'}
          </button>
        </div>
      </div>
    </div>
  )
}
