import { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  variant?: 'light' | 'dark'
}

export function LanguagePicker({ variant = 'light' }: Props) {
  const { languages, currentLang, setLanguage, isLoading } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = languages.find(l => l.code === currentLang)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSelect(code: string) {
    setOpen(false)
    await setLanguage(code)
  }

  const isLight = variant === 'light'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none',
          isLight
            ? 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            : 'border border-white/20 text-white/80 hover:bg-white/10',
          isLoading && 'opacity-60 cursor-not-allowed',
        )}
      >
        {isLoading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Globe className="w-3.5 h-3.5" />
        }
        <span>{current?.code.toUpperCase() ?? currentLang.toUpperCase()}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="py-1 max-h-80 overflow-y-auto">
            {/* High quality languages */}
            <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">
              Available Languages
            </p>
            {languages.filter(l => l.quality === 'high').map(lang => (
              <LanguageOption
                key={lang.code}
                lang={lang}
                isActive={lang.code === currentLang}
                onSelect={handleSelect}
              />
            ))}

            {/* Beta / low quality */}
            {languages.some(l => l.quality === 'low') && (
              <>
                <div className="mx-3 my-1.5 border-t border-gray-100" />
                <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Beta
                </p>
                {languages.filter(l => l.quality === 'low').map(lang => (
                  <LanguageOption
                    key={lang.code}
                    lang={lang}
                    isActive={lang.code === currentLang}
                    onSelect={handleSelect}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LanguageOption({
  lang,
  isActive,
  onSelect,
}: {
  lang: { code: string; name: string; native: string; quality: string }
  isActive: boolean
  onSelect: (code: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(lang.code)}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2 text-xs transition-colors',
        isActive
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'text-gray-700 hover:bg-gray-50',
      )}
    >
      <span className="flex items-baseline gap-1.5 min-w-0">
        <span className="font-medium truncate">{lang.native}</span>
        <span className="text-gray-400 shrink-0">{lang.name}</span>
      </span>
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 ml-2" />
      )}
    </button>
  )
}
