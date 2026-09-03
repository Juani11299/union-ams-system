import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomTabBar } from './BottomTabBar'
import { TopBar } from './TopBar'
import { useAppStore } from '@/store/useAppStore'
import { ToastContainer } from '@/components/ToastContainer'
import { LockedModuleView } from '@/components/LockedModuleView'
import { useScopedCategoryFromUrl } from '@/hooks/useScopedCategoryFromUrl'
import { rutaBloqueadaParaVisitante } from '@/utils/staffAccess'

function EstadoCarga() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-union-red-600 dark:border-slate-700 dark:border-t-union-red-400" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Conectando con Supabase…</p>
    </div>
  )
}

/**
 * Aviso no bloqueante: si Supabase falla (total o parcialmente) igual navegamos la
 * app con las vistas en su estado vacío — nunca reemplaza el contenido de la página.
 */
function ToastError({ mensaje, onRetry, onClose }: { mensaje: string; onRetry: () => void; onClose: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-30 flex max-w-sm items-start gap-3 rounded-xl border border-rose-200 bg-white px-4 py-3 shadow-lg dark:border-rose-500/30 dark:bg-slate-900">
      <span className="text-lg">⚠️</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-rose-700 dark:text-rose-400">Sin conexión con Supabase</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{mensaje}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-md bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700"
        >
          Reintentar
        </button>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        ✕
      </button>
    </div>
  )
}

export function MainLayout() {
  const isLoading = useAppStore((s) => s.isLoading)
  const error = useAppStore((s) => s.error)
  const categoryLocked = useAppStore((s) => s.categoryLocked)
  const soloLecturaGlobal = useAppStore((s) => s.soloLecturaGlobal)
  const fetchInitialData = useAppStore((s) => s.fetchInitialData)
  const [toastCerrado, setToastCerrado] = useState(false)
  const location = useLocation()

  useScopedCategoryFromUrl()

  const bloqueadoPorModoStaff = rutaBloqueadaParaVisitante(location.pathname, categoryLocked, soloLecturaGlobal)

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  useEffect(() => {
    if (error) setToastCerrado(false)
  }, [error])

  return (
    <div className="flex min-h-svh bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4 md:px-8 md:pb-8 md:pt-6">
          {isLoading ? (
            <EstadoCarga />
          ) : bloqueadoPorModoStaff ? (
            <LockedModuleView modo={categoryLocked ? 'staff' : 'soloLecturaGlobal'} />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      <BottomTabBar />
      <ToastContainer />
      {error && !toastCerrado && !isLoading && (
        <ToastError
          mensaje={error}
          onRetry={fetchInitialData}
          onClose={() => setToastCerrado(true)}
        />
      )}
    </div>
  )
}
