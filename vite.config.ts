import fs from 'fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const isCI = process.env.CI_ENV === 'true'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base: '',
  server: !isCI ? {
    https: {
      key: fs.readFileSync('./cert/192.168.27.33-key.pem'),
      cert: fs.readFileSync('./cert/192.168.27.33.pem'),
    }
  } : undefined,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
})
