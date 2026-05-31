import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { BarChart2, Users, MapPin, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function FeaturesPage() {
  const { t } = useTranslation()

  const FEATURES = [
    {
      number: '01',
      icon: BarChart2,
      titleKey: 'marketing.features.f1Title',
      subKey: 'marketing.features.f1Sub',
      bulletKeys: ['marketing.features.f1b1', 'marketing.features.f1b2', 'marketing.features.f1b3'],
    },
    {
      number: '02',
      icon: Users,
      titleKey: 'marketing.features.f2Title',
      subKey: 'marketing.features.f2Sub',
      bulletKeys: ['marketing.features.f2b1', 'marketing.features.f2b2', 'marketing.features.f2b3'],
    },
    {
      number: '03',
      icon: MapPin,
      titleKey: 'marketing.features.f3Title',
      subKey: 'marketing.features.f3Sub',
      bulletKeys: ['marketing.features.f3b1', 'marketing.features.f3b2', 'marketing.features.f3b3'],
    },
    {
      number: '04',
      icon: TrendingUp,
      titleKey: 'marketing.features.f4Title',
      subKey: 'marketing.features.f4Sub',
      bulletKeys: ['marketing.features.f4b1', 'marketing.features.f4b2', 'marketing.features.f4b3'],
    },
  ]

  return (
    <>
      <Helmet>
        <title>Features | Kampeni Political Intelligence Platform</title>
        <meta name="description" content="Real-time voter insights, opponent intelligence, smart resource allocation, and daily briefings. Kampeni gives your campaign a decisive data advantage across Kenya's 47 counties." />
        <link rel="canonical" href="https://kampeni.net/features" />
        <meta property="og:title" content="Features | Kampeni Political Intelligence Platform" />
        <meta property="og:description" content="Real-time voter insights, opponent intelligence, smart resource allocation, and daily briefings. Kampeni gives your campaign a decisive data advantage." />
        <meta property="og:url" content="https://kampeni.net/features" />
      </Helmet>

      {/* ── Header ── */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#2e6417] mb-6">
          {t('marketing.features.headerLabel')}
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6">
          {t('marketing.features.headerTitle')}
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-gray-500">
          {t('marketing.features.headerSubtitle')}
        </p>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="space-y-5">
          {FEATURES.map(({ number, icon: Icon, titleKey, subKey, bulletKeys }) => (
            <div key={number} className="p-8 md:p-10 rounded-2xl border border-gray-200 bg-white grid md:grid-cols-5 gap-8 items-start">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold text-gray-300 tracking-widest">{number}</span>
                  <div className="w-9 h-9 rounded-xl bg-[#f0f7eb] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#2e6417]" />
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-2">{t(titleKey)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(subKey)}</p>
              </div>
              <div className="md:col-span-3">
                <ul className="space-y-3">
                  {bulletKeys.map(bk => (
                    <li key={bk} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2e6417] shrink-0 mt-2" />
                      {t(bk)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mockups ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 flex flex-col items-center justify-center min-h-[220px] text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">{t('marketing.features.mockupLabel')}</p>
            <p className="font-semibold text-gray-900 mb-1">{t('marketing.features.mockupBriefing')}</p>
            <a href="#" className="text-sm text-[#2e6417] font-medium border-b border-[#2e6417] pb-0.5">
              {t('marketing.features.mockupView')} →
            </a>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 flex flex-col items-center justify-center min-h-[220px] text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">{t('marketing.features.mockupLabel')}</p>
            <p className="font-semibold text-gray-900">{t('marketing.features.mockupOpponent')}</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gray-950 py-24 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t('marketing.features.ctaTitle')}</h2>
        <p className="text-gray-400 text-sm mb-8">{t('marketing.features.ctaSubtitle')}</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/contact" className="btn-primary px-8 py-3.5 rounded text-sm font-semibold">
            {t('marketing.features.ctaAccess')}
          </Link>
          <Link to="/dashboard" className="px-8 py-3.5 rounded text-sm font-semibold border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-colors">
            {t('marketing.features.ctaDashboard')} →
          </Link>
        </div>
      </section>
    </>
  )
}
