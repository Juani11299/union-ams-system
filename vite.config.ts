import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Fase 18 — PWA offline-first: precachea el app shell (HTML/JS/CSS/imágenes
    // locales) con un Service Worker autogenerado (Workbox `generateSW`, sin
    // lógica de SW custom que este proyecto no necesita) para que la UI abra al
    // toque en el gimnasio sin señal. El cacheo de los DATOS (planillas,
    // sesiones, jugadores) es responsabilidad aparte del `persist` de Zustand
    // sobre IndexedDB (`src/store/useAppStore.ts`) — no de este SW, que sólo
    // sirve el shell estático.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'logo-union.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'C.A. Unión — Preparación Física',
        short_name: 'Unión PF',
        description: 'Control de Carga y Planificación — Club Atlético Unión de Santa Fe',
        theme_color: '#ed1c24',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Precachea todo el build (JS/CSS/HTML/imágenes locales) — sin
        // runtime caching de la API de Supabase a propósito: esa parte la
        // cubre el store persistido en IndexedDB, con su propio mapeo a los
        // tipos de la app, en vez de cachear las respuestas REST crudas.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
