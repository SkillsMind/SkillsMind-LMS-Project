import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Yahan apni pasand ka port fix kar dein
    strictPort: true, // Agar ye port busy ho to Vite error dega, port change nahi karega
  }
})