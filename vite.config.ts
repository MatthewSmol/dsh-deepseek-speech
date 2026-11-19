import { defineConfig } from 'vite'

/**
 * EN: The DSH client entry is a plain browser script. Vite builds it as a
 * minified IIFE, so it still executes through `window.__ModuleLoader__.load`
 * and does not introduce imports/exports.
 * RU: Клиентская точка DSH — обычный браузерный скрипт. Vite собирает её как
 * минифицированный IIFE: код по-прежнему исполняется через
 * `window.__ModuleLoader__.load` и не добавляет import/export.
 */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: false,
    manifest: false,
    lib: {
      entry: 'src/client.ts',
      name: 'DeepSeekSpeechClient',
      formats: ['iife'],
      fileName: () => 'client.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
