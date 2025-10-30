import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [svelte(), viteSingleFile()],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000, // inline everything
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      input: 'src/index.html',
      output: {
        inlineDynamicImports: true
      }
    }
  }
})
