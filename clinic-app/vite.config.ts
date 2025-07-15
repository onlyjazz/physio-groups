// vite.config.ts          (TypeScript version)
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    svelte(),          // Svelte compiler & HMR
    viteSingleFile()   // Inlines JS + CSS so clinic PCs see only <script> tags
  ],

  build: {
    outDir: 'dist',    // where the finished HTML files land
    rollupOptions: {
      input: {
        // every static page you serve to the clinic
        index:      resolve(__dirname, 'index.html'),
        groups:     resolve(__dirname, 'html/groups.html'),
        therapists: resolve(__dirname, 'html/therapists.html'),
        patients:   resolve(__dirname, 'html/patients.html'),
        'db-update':resolve(__dirname, 'html/db-update.html')
      }
    }
  }
});
