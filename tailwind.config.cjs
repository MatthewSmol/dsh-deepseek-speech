/** @type {import('tailwindcss').Config} */
module.exports = {
  // EN: Only classes present in the client source are emitted.
  // RU: В CSS попадают только классы, найденные в исходнике клиента.
  content: ['./src/client.ts', './src/vue/**/*.ts', './src/locales.ts'],
  prefix: 'dss-',
  // EN: Scope every utility under the plugin root, so DSH is never affected.
  // RU: Все утилиты ограничены корнем плагина, DSH не затрагивается.
  important: '.dss-root',
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
}
