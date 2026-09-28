import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Source TS files take precedence over legacy generated JS sidecars.
  resolve: { extensions: ['.tsx', '.ts', '.mjs', '.js', '.jsx', '.json'] },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
