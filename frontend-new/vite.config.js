import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // Ye line lazmi add karein
  server: {
    port: 5173,
    strictPort: true,
  }
})