/* Vite config for building the frontend react app: https://vite.dev/config/ */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

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
    // Chunks menores: o servidor Vultr/nginx estava resetando conexão em JS > ~1MB.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('react-dom') || id.includes('scheduler')) {
            return 'vendor-react-dom'
          }
          if (id.includes('/react/')) return 'vendor-react'
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
          if (id.includes('@tiptap') || id.includes('prosemirror')) {
            return 'vendor-tiptap'
          }
          if (id.includes('jspdf')) return 'vendor-jspdf'
          if (id.includes('html2canvas')) return 'vendor-html2canvas'
          if (id.includes('html5-qrcode')) return 'vendor-qrcode'
          if (id.includes('jszip')) return 'vendor-jszip'
          if (id.includes('@radix-ui')) return 'vendor-radix'
          if (id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('date-fns')) return 'vendor-date-fns'
          if (id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('zod')) return 'vendor-zod'
          if (id.includes('@tanstack')) return 'vendor-tanstack'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('dompurify')) return 'vendor-dompurify'
          if (id.includes('@hookform')) return 'vendor-forms'
          if (id.includes('sonner')) return 'vendor-sonner'
          if (id.includes('next-themes')) return 'vendor-themes'
          if (id.includes('embla-carousel')) return 'vendor-carousel'
          if (id.includes('cmdk')) return 'vendor-cmdk'
          if (id.includes('vaul')) return 'vendor-vaul'
          if (id.includes('papaparse')) return 'vendor-papaparse'
          if (id.includes('xlsx')) return 'vendor-xlsx'

          const match = id.match(
            /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/,
          )
          const pkg = match?.[1] ?? 'misc'
          return `vendor-${pkg.replace('@', '').replace('/', '-')}`
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
