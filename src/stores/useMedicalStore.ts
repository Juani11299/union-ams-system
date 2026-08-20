import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '@/utils/idbStorage'

/**
 * Fases de curación tisular (Fase 31 — Puente Médico-Fuerza, ver
 * docs/Propuesta_Integracion_NSCA.md sección 4, Cap. 22 Potach y Grindstaff,
 * Tabla 22.1) — NO es el modelo genérico de 6 fases de RTP, es el modelo real
 * del libro auditado.
 */
export type FaseCuracion = 'inflamatoria' | 'fibroblastica' | 'remodelacion'

export const FASES_CURACION: { key: FaseCuracion; label: string; descripcion: string }[] = [
  {
    key: 'inflamatoria',
    label: 'Respuesta Inflamatoria',
    descripcion: 'Días 1-7. Sin ejercicio activo en la zona dañada; se mantiene la función de zonas sanas.',
  },
  {
    key: 'fibroblastica',
    label: 'Reparación Fibroblástica',
    descripcion: 'Día 2 hasta 8 semanas. Isométrico submáximo indoloro, propiocepción, superficies inestables.',
  },
  {
    key: 'remodelacion',
    label: 'Maduración y Remodelación',
    descripcion: 'Meses a años. Fortalecimiento específico del deporte, cadena cinética abierta y cerrada.',
  },
]

/** Umbral de alta citado textualmente del libro (Cap. 22, p. 1283): diferencias laterolaterales <10% se consideran aceptables. */
export const UMBRAL_ASIMETRIA_ALTA_PCT = 10

export interface RtpProtocolo {
  id: string
  athleteId: string
  lesionDescripcion: string
  fechaInicio: string
  faseActual: FaseCuracion
  /** % de diferencia laterolateral de fuerza/rendimiento funcional. null = todavía no testeado. */
  asimetriaPct: number | null
  notas: string
  estado: 'activo' | 'alta'
  fechaAlta?: string
}

interface MedicalState {
  protocolos: RtpProtocolo[]
  crearProtocolo: (input: { athleteId: string; lesionDescripcion: string; fechaInicio: string }) => void
  actualizarFase: (id: string, fase: FaseCuracion) => void
  actualizarAsimetria: (id: string, asimetriaPct: number | null) => void
  actualizarNotas: (id: string, notas: string) => void
  /** Sólo aplica el alta si la asimetría cargada es <= UMBRAL_ASIMETRIA_ALTA_PCT — guarda de negocio duplicada acá además de en la UI. */
  darDeAlta: (id: string) => boolean
  eliminarProtocolo: (id: string) => void
}

export const useMedicalStore = create<MedicalState>()(
  persist(
    (set, get) => ({
      protocolos: [],

      crearProtocolo: ({ athleteId, lesionDescripcion, fechaInicio }) => {
        const protocolo: RtpProtocolo = {
          id: `rtp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          athleteId,
          lesionDescripcion,
          fechaInicio,
          faseActual: 'inflamatoria',
          asimetriaPct: null,
          notas: '',
          estado: 'activo',
        }
        set((state) => ({ protocolos: [...state.protocolos, protocolo] }))
      },

      actualizarFase: (id, fase) => {
        set((state) => ({
          protocolos: state.protocolos.map((p) => (p.id === id ? { ...p, faseActual: fase } : p)),
        }))
      },

      actualizarAsimetria: (id, asimetriaPct) => {
        set((state) => ({
          protocolos: state.protocolos.map((p) => (p.id === id ? { ...p, asimetriaPct } : p)),
        }))
      },

      actualizarNotas: (id, notas) => {
        set((state) => ({
          protocolos: state.protocolos.map((p) => (p.id === id ? { ...p, notas } : p)),
        }))
      },

      darDeAlta: (id) => {
        const protocolo = get().protocolos.find((p) => p.id === id)
        if (!protocolo) return false
        if (protocolo.asimetriaPct === null || protocolo.asimetriaPct > UMBRAL_ASIMETRIA_ALTA_PCT) return false

        set((state) => ({
          protocolos: state.protocolos.map((p) =>
            p.id === id ? { ...p, estado: 'alta', fechaAlta: new Date().toISOString().slice(0, 10) } : p,
          ),
        }))
        return true
      },

      eliminarProtocolo: (id) => {
        set((state) => ({ protocolos: state.protocolos.filter((p) => p.id !== id) }))
      },
    }),
    {
      name: 'soma-medical-rtp-store',
      storage: createJSONStorage(() => idbStorage),
    },
  ),
)
