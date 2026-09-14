import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  // root é o próprio atlas/; publicDir padrão = atlas/public (data.js vai parar em dist/data.js)
  plugins: [react(), tailwindcss(), viteSingleFile()],
  define: {
    // versão do build injetada no carregamento de data.js (?v=) pra furar cache de CDN
    __ATLAS_BUILD__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 100 * 1024 * 1024,
  },
});
