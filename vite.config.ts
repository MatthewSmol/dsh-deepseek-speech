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
  define: {
    'process.env.NODE_ENV': '"production"',
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  resolve: {
    // EN: Use the full Vue build so the single-file app can use a template.
    // RU: Полная сборка Vue нужна, чтобы приложение могло использовать template.
    alias: { vue: 'vue/dist/vue.esm-bundler.js' },
  },
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
