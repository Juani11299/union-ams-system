import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Field, inputClass } from '@/components/FormField'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { getErrorMessage } from '@/utils/errors'
import type { TeamCategory } from '@/types'

export function CategoriesTab() {
  const categories = useAppStore((s) => s.categories)
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
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Categorías del club
        </h2>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-400">Todavía no hay categorías creadas.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.id}
                className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1.5 pl-3 pr-1.5 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {category.nombre}
                <button
                  type="button"
                  onClick={() => setCategoriaAEliminar(category)}
                  aria-label={`Eliminar categoría ${category.nombre}`}
                  className="rounded-full px-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                >
                  ✕
                </button>
              </span>
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
