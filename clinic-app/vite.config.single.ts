import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// Configuration for single-file build
export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      external: ['xlsx'], // Exclude xlsx from bundle
      output: {
        // Mark xlsx as external in the bundle
        paths: {
          'xlsx': 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js'
        }
      }
    }
  },
  define: {
    'import.meta.env.SINGLE_FILE_BUILD': 'true'
  }
})