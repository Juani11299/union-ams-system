import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Field, inputClass } from '@/components/FormField'
import { getErrorMessage } from '@/utils/errors'

export function CategoriesTab() {
  const categories = useAppStore((s) => s.categories)
  const createCategory = useAppStore((s) => s.createCategory)
  const showToast = useToastStore((s) => s.showToast)

  const [nombre, setNombre] = useState('')
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {category.nombre}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
