import { Helmet } from 'react-helmet-async'
import { User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const TEAM = [
  { name: 'Morris Nyange',  roleKey: 'marketing.about.roles.ceo',             bioKey: 'marketing.about.bios.morris' },
  { name: 'Barak Asidi',   roleKey: 'marketing.about.roles.cto',             bioKey: 'marketing.about.bios.barak' },
  { name: 'Albert Chore',  roleKey: 'marketing.about.roles.engineer',        bioKey: 'marketing.about.bios.albert' },
  { name: 'John Chore',    roleKey: 'marketing.about.roles.cfo',             bioKey: 'marketing.about.bios.john' },
  { name: 'Anwar Omar',    roleKey: 'marketing.about.roles.politicalDirector', bioKey: 'marketing.about.bios.anwar' },
]

export default function AboutPage() {
  const { t } = useTranslation()

  const WHY_KAMPENI = [
    t('marketing.about.why1'),
    t('marketing.about.why2'),
    t('marketing.about.why3'),
  ]

  const PRINCIPLES = [
    [t('marketing.about.p1Title'), t('marketing.about.p1Desc')],
    [t('marketing.about.p2Title'), t('marketing.about.p2Desc')],
    [t('marketing.about.p3Title'), t('marketing.about.p3Desc')],
    [t('marketing.about.p4Title'), t('marketing.about.p4Desc')],
  ]

  return (
    <>
      <Helmet>
        <title>About Kampeni | Built by Kenyans for Kenyan Leaders</title>
        <meta name="description" content="Meet the team behind Kampeni. Our mission: give every Kenyan candidate — from MCA to Governor — a decisive data advantage powered by AI and real-time intelligence." />
        <link rel="canonical" href="https://kampeni.net/about" />
        <meta property="og:title" content="About Kampeni | Built by Kenyans for Kenyan Leaders" />
        <meta property="og:description" content="Meet the team behind Kampeni, Kenya's first political intelligence platform. Our mission: data-driven leadership for every Kenyan candidate." />
        <meta property="og:url" content="https://kampeni.net/about" />
      </Helmet>

      {/* ── Header ── */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#2e6417] mb-6">
          {t('marketing.about.headerLabel')}
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-8">
          {t('marketing.about.headerTitle')}
        </h1>
      </section>

      {/* ── The Kampeni Story ── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
          <div>
            <span className="section-label">{t('marketing.about.storyLabel')}</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-6">{t('marketing.about.storyTitle')}</h2>
            <div className="space-y-4 text-sm leading-relaxed text-gray-500">
              <p>{t('marketing.about.storyP1')}</p>
              <p>{t('marketing.about.storyP2')}</p>
              <p>{t('marketing.about.storyP3')}</p>
              <p>{t('marketing.about.storyP4')}</p>
            </div>
          </div>

          <div>
            <span className="section-label">{t('marketing.about.whyLabel')}</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-6">{t('marketing.about.whyTitle')}</h2>
            <div className="space-y-0">
              {WHY_KAMPENI.map(item => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-600 border-b border-gray-200 py-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2e6417] shrink-0 mt-2" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 p-5 rounded-xl bg-white border border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                {t('marketing.about.visionLabel')}
              </p>
              <p className="text-gray-900 font-medium text-sm leading-relaxed">
                {t('marketing.about.visionText')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <span className="section-label">{t('marketing.about.teamLabel')}</span>
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-12">{t('marketing.about.teamTitle')}</h2>
        <div className="flex gap-10 flex-wrap">
          {TEAM.map(({ name, roleKey, bioKey }) => (
            <div key={name} className="flex items-start gap-5 max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                <User className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-bold text-gray-900">{name}</p>
                <p className="text-xs text-[#2e6417] mb-2">{t(roleKey)}</p>
                <p className="text-sm leading-relaxed text-gray-500">{t(bioKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Principles ── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <span className="section-label">{t('marketing.about.principlesLabel')}</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-6">{t('marketing.about.principlesTitle')}</h2>
          </div>
          <div className="space-y-6">
            {PRINCIPLES.map(([title, desc]) => (
              <div key={title}>
                <p className="font-semibold text-gray-900 text-sm mb-1">{title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
