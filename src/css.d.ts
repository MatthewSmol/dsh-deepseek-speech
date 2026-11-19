// EN: Vite returns compiled CSS as a string for `?inline` imports.
// RU: Vite возвращает собранный CSS строкой для импорта `?inline`.
declare module '*?inline' {
  const css: string
  export default css
}
