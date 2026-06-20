import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/apple-touch-icon.png',
        'icons/favicon.svg',
        'can.svg',
        'push-sw.js',
      ],
      manifest: {
        name: 'Нет энергетикам',
        short_name: 'Нет энергетикам',
        description: 'Трекер дней без энергетиков: серия, календарь с заметками и поддержка',
        lang: 'ru',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#160f22',
        theme_color: '#7c5cbf',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // обработчики Web Push (push/notificationclick) — для напоминаний
        importScripts: ['/push-sw.js'],
        runtimeCaching: [
          // ИИ-чат (этап 3) ходит в сеть; офлайн — деградирует мягко.
          { urlPattern: /\/api\/chat/, handler: 'NetworkOnly' },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true, // слушать на LAN — чтобы открыть с iPhone в одной Wi-Fi
  },
})
