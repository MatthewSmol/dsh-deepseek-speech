import { defineConfig } from 'vite'

/**
 * EN: The provider is a Node host plugin. Vite bundles all local TypeScript
 * modules into one ESM file; there are no runtime dependencies to externalize.
 * RU: Провайдер — Node host-плагин. Vite собирает локальные TypeScript-модули
 * в один ESM-файл; внешних runtime-зависимостей нет.
 */
export default defineConfig({
  build: {
    target: 'node22',
    ssr: 'src/index.ts',
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        format: 'es',
      },
    },
  },
  ssr: {
    noExternal: true,
  },
})
