import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import i18n, { enTranslations } from '@/i18n'
import { flatten, unflatten } from '@/lib/flattenI18n'
import { apiClient } from '@/api/client'

const TARJUMI_BASE = 'https://api.thexi.dev'
const TARJUMI_KEY = import.meta.env.VITE_TARJUMI_API_KEY as string | undefined

async function callTarjumiDirect(
  targetLang: string,
  strings: Record<string, string>,
): Promise<Record<string, string>> {
  if (!TARJUMI_KEY) throw new Error('VITE_TARJUMI_API_KEY not set')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    console.log('[Tarjumi] calling /v1/bundle directly, lang=%s, keys=%d', targetLang, Object.keys(strings).length)
    const res = await fetch(`${TARJUMI_BASE}/v1/bundle`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${TARJUMI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target_lang: targetLang, strings }),
    })
    console.log('[Tarjumi] response status=%d', res.status)
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Tarjumi ${res.status}: ${body}`)
    }
    const data = await res.json()
    console.log('[Tarjumi] received translations, keys=%d', Object.keys(data.translations ?? {}).length)
    return data.translations as Record<string, string>
  } finally {
    clearTimeout(timeout)
  }
}

export interface Language {
  code: string
  name: string
  native: string
  quality: 'high' | 'low'
}

interface LanguageContextType {
  languages: Language[]
  currentLang: string
  setLanguage: (code: string) => Promise<void>
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType>({
  languages: [],
  currentLang: 'sw',
  setLanguage: async () => {},
  isLoading: false,
})

// Bump this when i18n.ts string keys change to bust stale localStorage caches
const CACHE_VERSION = 'v2'

const FALLBACK_LANGUAGES: Language[] = [
  { code: 'en',  name: 'English',    native: 'English',     quality: 'high' },
  { code: 'sw',  name: 'Swahili',    native: 'Kiswahili',   quality: 'high' },
  { code: 'ki',  name: 'Kikuyu',     native: 'Gĩkũyũ',     quality: 'high' },
  { code: 'luo', name: 'Luo',        native: 'Dholuo',      quality: 'high' },
  { code: 'kam', name: 'Kamba',      native: 'Kikamba',     quality: 'high' },
  { code: 'so',  name: 'Somali',     native: 'Af Soomaali', quality: 'high' },
  { code: 'am',  name: 'Amharic',    native: 'አማርኛ',        quality: 'high' },
  { code: 'yo',  name: 'Yoruba',     native: 'Yorùbá',      quality: 'high' },
  { code: 'zu',  name: 'Zulu',       native: 'isiZulu',     quality: 'high' },
  { code: 'xh',  name: 'Xhosa',      native: 'isiXhosa',    quality: 'high' },
  { code: 'sn',  name: 'Shona',      native: 'chiShona',    quality: 'high' },
  { code: 'rw',  name: 'Kinyarwanda',native: 'Kinyarwanda', quality: 'high' },
  { code: 'lg',  name: 'Luganda',    native: 'Luganda',     quality: 'high' },
  { code: 'luy', name: 'Luhya',      native: 'Oluluhya',    quality: 'low'  },
  { code: 'kln', name: 'Kalenjin',   native: 'Kalenjin',    quality: 'low'  },
  { code: 'mer', name: 'Meru',       native: 'Kimeru',      quality: 'low'  },
  { code: 'mas', name: 'Maasai',     native: 'Maa',         quality: 'low'  },
]

const flatEn = flatten(enTranslations as Record<string, unknown>)

function cacheKey(lang: string) {
  return `kampeni_i18n_${lang}_${CACHE_VERSION}`
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [languages, setLanguages] = useState<Language[]>(FALLBACK_LANGUAGES)
  const [currentLang, setCurrentLang] = useState(i18n.language || 'sw')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    apiClient.get<{ languages: Language[] }>('/translate/languages')
      .then(res => { if (res.data.languages?.length) setLanguages(res.data.languages) })
      .catch(() => { /* keep fallback */ })
  }, [])

  const setLanguage = useCallback(async (code: string) => {
    if (code === currentLang) return

    // en and sw have static translations already loaded in i18next
    if (code === 'en' || code === 'sw') {
      await i18n.changeLanguage(code)
      setCurrentLang(code)
      return
    }

    // Check localStorage cache first
    const cached = localStorage.getItem(cacheKey(code))
    if (cached) {
      try {
        const translations = JSON.parse(cached)
        i18n.addResourceBundle(code, 'translation', translations, true, true)
        await i18n.changeLanguage(code)
        setCurrentLang(code)
        return
      } catch {
        localStorage.removeItem(cacheKey(code))
      }
    }

    // Fetch translations — try api-gateway first, fall back to direct Tarjumi call
    setIsLoading(true)
    try {
      let translations: Record<string, string>

      try {
        console.log('[LanguageContext] trying backend /translate/bundle for lang=%s', code)
        const res = await apiClient.post<{ translations: Record<string, string> }>(
          '/translate/bundle',
          { target_lang: code, strings: flatEn },
        )
        translations = res.data.translations
        console.log('[LanguageContext] backend succeeded')
      } catch (backendErr) {
        console.warn('[LanguageContext] backend failed, falling back to direct Tarjumi:', backendErr)
        translations = await callTarjumiDirect(code, flatEn)
      }

      const nested = unflatten(translations)
      localStorage.setItem(cacheKey(code), JSON.stringify(nested))
      i18n.addResourceBundle(code, 'translation', nested, true, true)
      await i18n.changeLanguage(code)
      setCurrentLang(code)
    } catch (err) {
      console.error('[LanguageContext] Translation fetch failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentLang])

  return (
    <LanguageContext.Provider value={{ languages, currentLang, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
