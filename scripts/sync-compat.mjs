// EN: Generates compatibility entry files for DSH's cached loader.
// RU: Генерирует compatibility-файлы для кэшированного загрузчика DSH.
import { readFile, writeFile } from 'node:fs/promises'

const client = await readFile(new URL('../dist/client.js', import.meta.url), 'utf8')
await writeFile(new URL('../client.js', import.meta.url), `// Generated from src/client.ts by scripts/sync-compat.mjs.\n// Сгенерировано из src/client.ts; не редактировать вручную.\n${client}`)
await writeFile(new URL('../index.js', import.meta.url), `// Generated compatibility entry. The TypeScript source is src/index.ts.\n// Сгенерированная compatibility-точка входа. Исходник — src/index.ts.\nexport * from './dist/index.js'\n`)
