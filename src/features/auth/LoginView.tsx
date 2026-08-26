import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { getErrorMessage } from '@/utils/errors'

/**
 * Pantalla de login del Staff (Fase 18) — Supabase Auth con email/contraseña.
 * A propósito NO tiene link de "Crear cuenta": los usuarios de Staff los da
 * de alta el Administrador directo desde el dashboard de Supabase, no hay
 * registro público (ver `ProtectedRoute.tsx` para qué queda protegido).
 */
export function LoginView() {
  const session = useAuthStore((s) => s.session)
  const isLoading = useAuthStore((s) => s.isLoading)
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoading && session) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await signInWithPassword(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesión.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-800/60 p-8 shadow-2xl ring-1 ring-white/10">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img src="/logo-union.png" alt="" className="h-16 w-16 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-white">C.A. Unión de Santa Fe</h1>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Preparación Física — Acceso Staff
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-300">Email</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@union.com"
              className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-union-red-500 focus:ring-1 focus:ring-union-red-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-300">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-union-red-500 focus:ring-1 focus:ring-union-red-500"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-1 rounded-lg bg-union-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
