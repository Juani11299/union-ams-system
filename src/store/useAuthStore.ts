import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/utils/supabase'

const SUPABASE_NO_CONFIGURADO =
  'Faltan las variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Configuralas en un archivo .env (ver .env.example) y reiniciá el servidor.'

interface AuthState {
  session: Session | null
  user: User | null
  isLoading: boolean
  error: string | null
  /**
   * Trae la sesión actual y suscribe a `onAuthStateChange` — se llama una
   * sola vez al montar `App` (Fase 18). Devuelve la función de unsubscribe
   * para el cleanup del `useEffect` que la llama.
   */
  init: () => () => void
  signInWithPassword: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  error: null,

  init: () => {
    if (!isSupabaseConfigured) {
      set({ isLoading: false })
      return () => {}
    }

    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, user: data.session?.user ?? null, isLoading: false })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, isLoading: false })
    })

    return () => subscription.unsubscribe()
  },

  signInWithPassword: async (email, password) => {
    if (!isSupabaseConfigured) {
      set({ error: SUPABASE_NO_CONFIGURADO })
      throw new Error(SUPABASE_NO_CONFIGURADO)
    }
    set({ error: null })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message })
      throw error
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
  },
}))
