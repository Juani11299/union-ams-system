import { useEffect, useState } from 'react'

/**
 * Estado de conexión del navegador (Fase 18, PWA offline-first) — escucha
 * los eventos nativos `online`/`offline` en vez de pingear algo propio: para
 * avisarle al profe que está viendo datos locales alcanza con saber si el
 * navegador tiene salida a internet, no hace falta un heartbeat contra
 * Supabase acá (`fetchInitialData` ya reporta sus propias fallas de red vía
 * `error` en `useAppStore`).
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }
    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
