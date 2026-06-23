import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import packageJson from './package.json'

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-chart': ['chart.js', 'react-chartjs-2'],
          'vendor-motion': ['framer-motion'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-pdf': ['@react-pdf/renderer'],
          'vendor-qrcode': ['qrcode'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/*', 'icons/*', 'logo.jpg'],
      manifest: {
        name: 'NetFlow',
        short_name: 'NetFlow',
        description: 'Tracciamento finanziario per professionisti',
        theme_color: '#6C5CE7',
        background_color: '#0F0F1A',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.jpg', sizes: '192x192', type: 'image/jpeg' },
          { src: '/icons/icon-512.jpg', sizes: '512x512', type: 'image/jpeg' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/rest\/v1\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 86400 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 86400 * 60 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
})
