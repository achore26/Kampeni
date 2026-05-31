import { Helmet } from 'react-helmet-async'
import { Download, Image, FileText, Mail, Phone, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function MediaPage() {
  const { t } = useTranslation()

  const RESOURCES = [
    { icon: Download, titleKey: 'marketing.media.r1Title', descKey: 'marketing.media.r1Desc', actionKey: 'marketing.media.r1Action' },
    { icon: Image,    titleKey: 'marketing.media.r2Title', descKey: 'marketing.media.r2Desc', actionKey: 'marketing.media.r2Action' },
    { icon: FileText, titleKey: 'marketing.media.r3Title', descKey: 'marketing.media.r3Desc', actionKey: 'marketing.media.r3Action' },
  ]

  return (
    <>
      <Helmet>
        <title>Media & Press | Kampeni</title>
        <meta name="description" content="Kampeni in the press. Find media resources, press kit downloads, and news coverage about Kenya's first political intelligence platform." />
        <link rel="canonical" href="https://kampeni.net/media" />
        <meta property="og:title" content="Media & Press | Kampeni" />
        <meta property="og:description" content="Find Kampeni media resources, press kit, and coverage of Kenya's first political intelligence platform." />
        <meta property="og:url" content="https://kampeni.net/media" />
      </Helmet>

      {/* ── Header ── */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#2e6417] mb-6">
          {t('marketing.media.headerLabel')}
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-8">
          {t('marketing.media.headerTitle')}
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-gray-500">
          {t('marketing.media.headerSubtitle')}
        </p>
      </section>

      {/* ── Resources ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {RESOURCES.map(({ icon: Icon, titleKey, descKey, actionKey }) => (
            <div key={titleKey} className="p-8 rounded-2xl border border-gray-200 bg-white">
              <div className="w-10 h-10 rounded-xl bg-[#f0f7eb] flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-[#2e6417]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t(titleKey)}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{t(descKey)}</p>
              <button className="text-sm font-medium text-[#2e6417] border-b border-[#2e6417] pb-0.5 hover:text-[#1e4510] transition-colors">
                {t(actionKey)} →
              </button>
            </div>
          ))}
        </div>

        {/* ── Founder Quote ── */}
        <div className="mb-16">
          <span className="section-label">{t('marketing.media.quoteLabel')}</span>
          <blockquote className="mt-8 max-w-3xl">
            <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-6">
              {t('marketing.media.quote')}
            </p>
            <footer className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t('marketing.media.quoteName')}</p>
                <p className="text-xs text-gray-500">{t('marketing.media.quoteRole')}</p>
              </div>
            </footer>
          </blockquote>
        </div>

        {/* ── Media Contact ── */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="p-8 rounded-2xl border border-gray-200 bg-white">
            <span className="section-label">{t('marketing.media.contactLabel')}</span>
            <h3 className="font-bold text-gray-900 mt-4 mb-5">{t('marketing.media.contactTitle')}</h3>
            <div className="space-y-3 text-sm text-gray-500">
              <p className="font-medium text-gray-900">Kampeni Intelligence Platform</p>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <a href="mailto:info@kampeni.net" className="hover:text-gray-900 transition-colors">info@kampeni.net</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <a href="tel:+254713657133" className="hover:text-gray-900 transition-colors">+254 713 657133</a>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-gray-950 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              {t('marketing.media.responseLabel')}
            </p>
            <p className="text-white font-bold text-2xl mb-1">{t('marketing.media.responseTime')}</p>
            <p className="text-xs text-gray-400">{t('marketing.media.responseNote')}</p>
          </div>
        </div>
      </section>
    </>
  )
}
