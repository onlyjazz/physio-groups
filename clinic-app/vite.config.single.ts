import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// Configuration for single-file build
export default defineConfig({
  plugins: [svelte()],
  define: {
    'import.meta.env.SINGLE_FILE_BUILD': 'true'
  }
})
