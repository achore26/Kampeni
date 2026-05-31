import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa','Homa Bay',
  'Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi','Kirinyaga','Kisii','Kisumu',
  'Kitui','Kwale','Laikipia','Lamu','Machakos','Makueni','Mandera','Marsabit','Meru',
  'Migori','Mombasa','Murang\'a','Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua',
  'Nyeri','Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia',
  'Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
]

const POLITICAL_LEVELS = ['MCA', 'MP', 'Woman Rep', 'Senator', 'Governor']

const STATS_VALUES = [
  { value: '47+', key: 'marketing.stats.counties' },
  { value: '3',   key: 'marketing.stats.newsSources' },
  { value: '30min', key: 'marketing.stats.cadence' },
  { value: '6 AM',  key: 'marketing.stats.briefing' },
]

export default function HomePage() {
  const { t } = useTranslation()
  const [earlyAccess, setEarlyAccess] = useState({ email: '', county: '', level: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const PROBLEMS = [
    t('marketing.problem.item1'),
    t('marketing.problem.item2'),
    t('marketing.problem.item3'),
  ]

  const SOLUTIONS = [
    t('marketing.solution.item1'),
    t('marketing.solution.item2'),
    t('marketing.solution.item3'),
  ]

  async function handleSubmit() {
    if (!earlyAccess.email || !earlyAccess.county || !earlyAccess.level) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/waitlist/early-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(earlyAccess),
      })
      if (!res.ok) throw new Error('Request failed')
      setSubmitted(true)
    } catch {
      setError(t('marketing.earlyAccess.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Kampeni | Kenya's Political Intelligence Platform</title>
        <meta name="description" content="Kenya's first AI-powered political intelligence platform. Win elections with real-time voter insights, opponent tracking, and daily campaign briefings across all 47 counties." />
        <link rel="canonical" href="https://kampeni.net/" />
        <meta property="og:title" content="Kampeni | Kenya's Political Intelligence Platform" />
        <meta property="og:description" content="Kenya's first AI-powered political intelligence platform. Win elections with real-time voter insights, opponent tracking, and daily campaign briefings." />
        <meta property="og:url" content="https://kampeni.net/" />
        <meta property="og:image" content="https://kampeni.net/Home%20Hero.png" />
        <meta name="twitter:title" content="Kampeni | Kenya's Political Intelligence Platform" />
        <meta name="twitter:description" content="Kenya's first AI-powered political intelligence platform. Win with data, not guesswork." />
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-0">
        <div className="grid md:grid-cols-2 gap-8 items-end pb-12">
          <div>
            <h1 className="text-hero font-black text-gray-900 leading-none">
              {t('marketing.hero.line1')}<br />
              <span className="highlight">{t('marketing.hero.line2')}</span>
            </h1>
          </div>

          <div className="md:pb-2">
            <p className="text-base leading-relaxed text-gray-500 mb-8 max-w-sm">
              {t('marketing.hero.subtitle')}
            </p>
            <a
              href="#early-access"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded text-sm"
            >
              {t('marketing.hero.cta')} <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Full-bleed hero image */}
        <div className="w-full overflow-hidden">
          <img
            src="/Home Hero.png"
            alt="Kenyan political rally"
            className="w-full h-[480px] md:h-[580px] object-cover object-top"
          />
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section className="border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS_VALUES.map(({ value, key }, i) => (
              <div
                key={key}
                className={`py-12 px-6 ${i < STATS_VALUES.length - 1 ? 'border-r border-gray-100' : ''}`}
              >
                <p className="text-4xl md:text-5xl font-black text-[#2e6417] mb-2">{value}</p>
                <p className="text-sm text-gray-400">{t(key)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem / Solution ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-start">
        <div>
          <span className="section-label">{t('marketing.problem.label')}</span>
          <h2 className="text-display font-black text-gray-900 mt-4 mb-10">
            {t('marketing.problem.title')}
          </h2>
          <div className="space-y-0">
            {PROBLEMS.map(p => (
              <div key={p} className="flex items-center gap-4 text-sm text-gray-600 border-b border-gray-100 py-4">
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                {p}
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="section-label">{t('marketing.solution.label')}</span>
          <h2 className="text-display font-black text-gray-900 mt-4 mb-10">
            {t('marketing.solution.title')}
          </h2>
          <div className="space-y-0">
            {SOLUTIONS.map(s => (
              <div key={s} className="flex items-center gap-4 text-sm text-gray-600 border-b border-gray-100 py-4">
                <CheckCircle2 className="w-5 h-5 text-[#2e6417] shrink-0" />
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard preview ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex justify-center">
          <div className="w-full max-w-3xl rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <img
              src="/dashboard.png"
              alt="Kampeni dashboard"
              className="w-full object-cover object-top"
            />
          </div>
        </div>
      </section>

      {/* ── Early Access ─────────────────────────────────────────────── */}
      <section id="early-access" className="bg-gray-950 py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4 block">
            {t('marketing.earlyAccess.label')}
          </span>
          <h2 className="text-display font-black text-white mb-4">
            {t('marketing.earlyAccess.title')}
          </h2>
          <p className="text-gray-400 mb-10">
            {t('marketing.earlyAccess.subtitle')}
          </p>

          {submitted ? (
            <div className="px-8 py-6 rounded-xl bg-[#1a3310] border border-[#2e6417] text-[#7eba5a] font-medium text-sm">
              ✓ {t('marketing.earlyAccess.success')}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-3 mb-3">
                <input
                  type="email"
                  value={earlyAccess.email}
                  onChange={e => setEarlyAccess({ ...earlyAccess, email: e.target.value })}
                  placeholder={t('marketing.earlyAccess.emailPlaceholder')}
                  className="px-4 py-3 text-sm rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-500 outline-none focus:border-[#2e6417] transition-colors"
                />
                <select
                  value={earlyAccess.county}
                  onChange={e => setEarlyAccess({ ...earlyAccess, county: e.target.value })}
                  className="px-4 py-3 text-sm rounded bg-gray-800 border border-gray-700 text-white outline-none focus:border-[#2e6417] transition-colors"
                >
                  <option value="">{t('marketing.earlyAccess.selectCounty')}</option>
                  {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={earlyAccess.level}
                  onChange={e => setEarlyAccess({ ...earlyAccess, level: e.target.value })}
                  className="px-4 py-3 text-sm rounded bg-gray-800 border border-gray-700 text-white outline-none focus:border-[#2e6417] transition-colors"
                >
                  <option value="">{t('marketing.earlyAccess.selectLevel')}</option>
                  {POLITICAL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full md:w-auto px-10 py-3 rounded text-sm mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? t('marketing.earlyAccess.submitting') : t('marketing.earlyAccess.submit')}
              </button>
              {error && (
                <p className="text-xs text-red-400 mb-2">{error}</p>
              )}
              <p className="text-xs text-gray-600">{t('marketing.earlyAccess.limited')}</p>
            </>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <h2 className="text-display font-black text-gray-900">
          {t('marketing.bottomCta.title')}
        </h2>
        <div>
          <p className="text-gray-500 text-base leading-relaxed mb-8">
            {t('marketing.bottomCta.subtitle')}
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link to="/contact" className="btn-primary px-7 py-3.5 rounded text-sm">
              {t('marketing.bottomCta.requestAccess')}
            </Link>
            <Link to="/features" className="px-7 py-3.5 rounded text-sm border border-gray-200 text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors">
              {t('marketing.bottomCta.exploreFeatures')} →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
