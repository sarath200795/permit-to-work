import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Only split out heavy, SELF-CONTAINED libs (firebase). React-coupled
        // libs (recharts, react-router…) stay in the vendor chunk; route-level
        // React.lazy already code-splits the pages.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          const m = id.split('node_modules/')[1] || ''
          const pkg = m.startsWith('@') ? m.split('/').slice(0, 2).join('/') : m.split('/')[0]
          if (pkg === 'firebase' || pkg.startsWith('@firebase')) return 'firebase'
          return undefined
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
