import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ["assets/*"],
  plugins: [react()],
  base: '/calcium-transient-analysis/'
})
