import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Field, inputClass } from '@/components/FormField'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { getErrorMessage } from '@/utils/errors'
import {
  construirLinkWellness,
  construirLinkRpe,
  construirLinkTerminalFuerza,
  copiarLinkMagico,
} from '@/utils/magicLinks'
import type { TeamCategory } from '@/types'

// Link mágico escopeado por categoría (Fase 19) — apunta al Planificador con
// `locked=true`: al abrirlo, el staff arranca directo en su categoría y no
// puede cambiarse a otra por error (ver `useScopedCategoryFromUrl`).
function construirLinkStaff(categoryId: string): string {
  return `${window.location.origin}/planificador?category=${categoryId}&locked=true`
}

async function copiarLinkStaff(categoryId: string, showToast: (t: 'success' | 'error', m: string) => void) {
  const url = construirLinkStaff(categoryId)
  try {
    await navigator.clipboard.writeText(url)
    showToast('success', 'Link mágico copiado')
  } catch {
    showToast('error', `No se pudo copiar el link. Copialo manualmente: ${url}`)
  }
}

interface BotonLinkProps {
  icono: string
  label: string
  title: string
  onClick: () => void
  disabled?: boolean
}

/** Botón chico de copia rápida (Fase 22) — usado para los 3 links públicos por categoría. */
function BotonLink({ icono, label, title, onClick, disabled }: BotonLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-union-red-100 hover:text-union-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-union-red-500/10 dark:hover:text-union-red-400"
    >
      <span aria-hidden>{icono}</span> {label}
    </button>
  )
}

export function CategoriesTab() {
  const categories = useAppStore((s) => s.categories)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const createCategory = useAppStore((s) => s.createCategory)
  const deleteCategory = useAppStore((s) => s.deleteCategory)
  const showToast = useToastStore((s) => s.showToast)

  const [nombre, setNombre] = useState('')
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [categoriaAEliminar, setCategoriaAEliminar] = useState<TeamCategory | null>(null)
  const [eliminando, setEliminando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valor = nombre.trim()
    if (!valor) {
      setError('El nombre de la categoría no puede estar vacío.')
      return
    }
    setError(null)
    setCreando(true)
    try {
      await createCategory({ nombre: valor })
      showToast('success', `¡Categoría "${valor}" creada exitosamente!`)
      setNombre('')
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo crear la categoría.'))
    } finally {
      setCreando(false)
    }
  }

  function handleCopiarWellness(category: TeamCategory) {
    if (!activeSeasonId) {
      showToast('error', 'Seleccioná una temporada activa primero.')
      return
    }
    copiarLinkMagico(
      construirLinkWellness(activeSeasonId, category.id),
      showToast,
      `Link de Wellness — ${category.nombre} copiado`,
    )
  }

  function handleCopiarRpe(category: TeamCategory) {
    if (!activeSeasonId) {
      showToast('error', 'Seleccioná una temporada activa primero.')
      return
    }
    copiarLinkMagico(
      construirLinkRpe(activeSeasonId, category.id),
      showToast,
      `Link de RPE — ${category.nombre} copiado`,
    )
  }

  function handleCopiarTerminalFuerza(category: TeamCategory) {
    copiarLinkMagico(
      construirLinkTerminalFuerza(category.id),
      showToast,
      `Link de Terminal de Fuerza — ${category.nombre} copiado`,
    )
  }

  async function handleEliminar() {
    if (!categoriaAEliminar) return
    setEliminando(true)
    try {
      await deleteCategory(categoriaAEliminar.id)
      showToast('success', `Categoría "${categoriaAEliminar.nombre}" eliminada.`)
      setCategoriaAEliminar(null)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo eliminar la categoría.'))
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="Nueva categoría" error={error ?? undefined} required>
            <input
              className={inputClass}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. 8va División"
            />
          </Field>
        </div>
        <button
          type="submit"
          disabled={creando}
          className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creando ? 'Creando…' : 'Crear categoría'}
        </button>
      </Card>

      <Card className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Categorías del club
          </h2>
          <p className="text-xs text-slate-400">
            Links mágicos por categoría — se comparten por WhatsApp, cada jugador entra sin login.
            {!activeSeasonId && ' Los de Wellness/RPE necesitan una temporada activa.'}
          </p>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-400">Todavía no hay categorías creadas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{category.nombre}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <BotonLink
                    icono="🌅"
                    label="Wellness"
                    title={`Copiar link de Wellness — ${category.nombre}`}
                    disabled={!activeSeasonId}
                    onClick={() => handleCopiarWellness(category)}
                  />
                  <BotonLink
                    icono="🏁"
                    label="RPE"
                    title={`Copiar link de RPE — ${category.nombre}`}
                    disabled={!activeSeasonId}
                    onClick={() => handleCopiarRpe(category)}
                  />
                  <BotonLink
                    icono="💪"
                    label="Terminal"
                    title={`Copiar link de Terminal de Fuerza — ${category.nombre}`}
                    onClick={() => handleCopiarTerminalFuerza(category)}
                  />
                  <button
                    type="button"
                    onClick={() => copiarLinkStaff(category.id, showToast)}
                    aria-label={`Copiar link para staff de ${category.nombre}`}
                    title="Copiar link para staff (Planificador)"
                    className="rounded-full px-2 py-1 text-sm text-slate-400 hover:bg-union-red-100 hover:text-union-red-600 dark:hover:bg-union-red-500/10 dark:hover:text-union-red-400"
                  >
                    🔗
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoriaAEliminar(category)}
                    aria-label={`Eliminar categoría ${category.nombre}`}
                    className="rounded-full px-2 py-1 text-sm text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {categoriaAEliminar && (
        <ConfirmDialog
          titulo="Eliminar categoría"
          mensaje={`¿Seguro que querés eliminar "${categoriaAEliminar.nombre}"? Esto borra TODO lo cargado en esa categoría, en todas las temporadas: plantel, microciclos, tareas, RPE, wellness, carga externa/GPS, evaluaciones físicas y bloques de fuerza. No se puede deshacer.`}
          onConfirm={handleEliminar}
          onCancel={() => setCategoriaAEliminar(null)}
          confirmando={eliminando}
        />
      )}
    </div>
  )
}
