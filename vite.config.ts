/* Vite config for building the frontend react app: https://vite.dev/config/ */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const SHARED_VENDOR_PATTERN =
  /node_modules[\\/](clsx|tslib|@babel[\\/]runtime|react-is|prop-types)[\\/]/

const REACT_VENDOR_PATTERN =
  /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: '::',
    port: 8080,
    hmr: { overlay: true },
  },
  build: {
    minify: mode !== 'development',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          // Auxiliares usados pelo código inicial: se caírem num chunk pesado
          // (PDF/gráficos), o navegador baixa esse chunk inteiro na abertura.
          if (
            id.includes('vite/preload-helper') ||
            id.includes('commonjsHelpers') ||
            SHARED_VENDOR_PATTERN.test(id)
          ) {
            return 'vendor-shared'
          }
          if (!id.includes('node_modules')) return

          // Muda raramente: em chunk próprio, continua em cache entre deploys.
          if (REACT_VENDOR_PATTERN.test(id)) {
            return 'vendor-react'
          }
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts'
          }
          if (id.includes('date-fns')) {
            return 'vendor-date-fns'
          }
          if (id.includes('@supabase')) {
            return 'vendor-supabase'
          }
          if (id.includes('@tiptap')) {
            return 'vendor-tiptap'
          }
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'vendor-pdf'
          }
          if (id.includes('@radix-ui')) {
            return 'vendor-radix'
          }
        },
      },
    },
  },
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode ?? process.env.NODE_ENV ?? 'production'),
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: /zod\/v4\/core/,
        replacement: path.resolve(__dirname, 'node_modules', 'zod', 'v4', 'core'),
      }
    ],
  },
  optimizeDeps: {
    include: [
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-placeholder',
      '@tiptap/extension-text-align',
      '@tiptap/extension-underline',
      '@tiptap/extension-link',
      'date-fns',
      'date-fns/locale',
      'react-day-picker',
    ],
  },
}))
