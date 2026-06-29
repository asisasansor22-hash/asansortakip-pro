import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'

// Her build'de değişen sürüm kimliği — otomatik güncelleme tespiti için.
const BUILD_ID = String(Date.now())

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    {
      name: 'write-version',
      closeBundle() {
        try { writeFileSync('dist/version.json', JSON.stringify({ v: BUILD_ID })) } catch (e) {}
      },
    },
  ],
})
