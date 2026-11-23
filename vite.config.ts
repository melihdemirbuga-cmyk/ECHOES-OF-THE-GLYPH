
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ECHOES-OF-THE-GLYPH/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});

