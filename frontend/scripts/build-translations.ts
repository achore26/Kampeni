import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { enTranslations } from '../src/locales/en-data'

const __dirname = dirname(fileURLToPath(import.meta.url))

const TARJUMI_BASE = 'https://api.thexi.dev'
const TARJUMI_KEY = process.env.VITE_TARJUMI_API_KEY

const LANGUAGES = [
  'sw', 'ki', 'luo', 'kam', 'so', 'am', 'yo', 'zu', 'xh', 'sn', 'rw', 'lg', 'luy', 'kln', 'mer', 'mas',
]

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value as Record<string, unknown>, fullKey))
    } else {
      result[fullKey] = String(value)
    }
  }
  return result
}

function unflatten(flat: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let cur: Record<string, unknown> = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {}
      cur = cur[parts[i]] as Record<string, unknown>
    }
    cur[parts[parts.length - 1]] = value
  }
  return result
}

async function bundleChunk(targetLang: string, chunk: Record<string, string>): Promise<Record<string, string>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)
  try {
    const res = await fetch(`${TARJUMI_BASE}/v1/bundle`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${TARJUMI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target_lang: targetLang, strings: chunk }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Tarjumi ${res.status} for ${targetLang}: ${body}`)
    }
    const data = await res.json()
    return (data.translations ?? {}) as Record<string, string>
  } finally {
    clearTimeout(timeout)
  }
}

async function translateLanguage(lang: string, force = false): Promise<void> {
  const outDir = join(__dirname, '..', 'public', 'locales', lang)
  const outFile = join(outDir, 'translation.json')

  if (!force && existsSync(outFile)) {
    console.log(`[build-i18n] ${lang}: skipping (already exists)`)
    return
  }

  const flatEn = flatten(enTranslations as unknown as Record<string, unknown>)
  const entries = Object.entries(flatEn)
  const CHUNK_SIZE = 15
  const chunks: Record<string, string>[] = []
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    chunks.push(Object.fromEntries(entries.slice(i, i + CHUNK_SIZE)))
  }

  console.log(`[build-i18n] ${lang}: ${entries.length} keys in ${chunks.length} chunks`)

  // Process chunks sequentially with a small delay to avoid rate limiting
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
  const results: Record<string, string>[] = []
  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) await sleep(500)
    results.push(await bundleChunk(lang, chunks[i]))
  }

  const merged = Object.assign({}, ...results)
  const nested = unflatten(merged)

  mkdirSync(outDir, { recursive: true })
  writeFileSync(outFile, JSON.stringify(nested, null, 2))
  console.log(`[build-i18n] ${lang}: done (${Object.keys(merged).length} keys)`)
}

async function main() {
  if (!TARJUMI_KEY) {
    console.error('Error: VITE_TARJUMI_API_KEY not set')
    process.exit(1)
  }
  const force = process.argv.includes('--force')
  console.log(`[build-i18n] Translating ${LANGUAGES.length} languages...`)
  for (const lang of LANGUAGES) {
    await translateLanguage(lang, force)
  }
  console.log('[build-i18n] All done!')
}

main().catch(err => { console.error(err); process.exit(1) })
