import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { MapPin, Phone, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const POLITICAL_LEVELS = ['MCA', 'Woman Rep', 'MP', 'Senator', 'Governor']

export default function ContactPage() {
  const { t } = useTranslation()
  const [earlyAccess, setEarlyAccess] = useState({
    name: '', email: '', phone: '', level: '', location: '', howHeard: '',
  })
  const [partnership, setPartnership] = useState({
    name: '', org: '', email: '', details: '',
  })
  const [eaSubmitted, setEaSubmitted] = useState(false)
  const [pSubmitted, setPSubmitted] = useState(false)

  const HOW_HEARD = [
    { key: 'social',    label: t('marketing.contact.howHeardOptions.social') },
    { key: 'referred',  label: t('marketing.contact.howHeardOptions.referred') },
    { key: 'news',      label: t('marketing.contact.howHeardOptions.news') },
    { key: 'google',    label: t('marketing.contact.howHeardOptions.google') },
    { key: 'event',     label: t('marketing.contact.howHeardOptions.event') },
    { key: 'other',     label: t('marketing.contact.howHeardOptions.other') },
  ]

  function submitEarlyAccess() {
    if (!earlyAccess.name || !earlyAccess.email) return
    const body = [
      `Name: ${earlyAccess.name}`,
      `Email: ${earlyAccess.email}`,
      `Phone: ${earlyAccess.phone || '—'}`,
      `Political Level: ${earlyAccess.level || '—'}`,
      `Location: ${earlyAccess.location || '—'}`,
      `How they heard: ${earlyAccess.howHeard || '—'}`,
    ].join('\n')
    window.location.href = `mailto:info@kampeni.net?subject=Early Access Request — ${earlyAccess.name}&body=${encodeURIComponent(body)}`
    setEaSubmitted(true)
  }

  function submitPartnership() {
    if (!partnership.name || !partnership.email) return
    const body = [
      `Name: ${partnership.name}`,
      `Organization: ${partnership.org || '—'}`,
      `Email: ${partnership.email}`,
      `Details: ${partnership.details || '—'}`,
    ].join('\n')
    window.location.href = `mailto:info@kampeni.net?subject=Partnership Inquiry — ${partnership.org || partnership.name}&body=${encodeURIComponent(body)}`
    setPSubmitted(true)
  }

  const inputCls = 'w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2e6417] focus:ring-2 focus:ring-[#ddeece] transition-all'
  const selectCls = 'w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2e6417] bg-white'

  return (
    <>
      <Helmet>
        <title>Request Early Access | Kampeni</title>
        <meta name="description" content="Request early access to Kampeni — Kenya's first AI-powered political intelligence platform. Limited spots available for MCA, MP, Senator, Woman Rep, and Governor campaigns." />
        <link rel="canonical" href="https://kampeni.net/contact" />
        <meta property="og:title" content="Request Early Access | Kampeni" />
        <meta property="og:description" content="Get early access to Kampeni. Gain a decisive data advantage for your Kenyan campaign." />
        <meta property="og:url" content="https://kampeni.net/contact" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      {/* ── Header ── */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#2e6417] mb-6">
          {t('marketing.contact.headerLabel')}
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          {t('marketing.contact.headerTitle')}
        </h1>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 space-y-14">

        {/* ── Early Access Form ── */}
        <div className="grid md:grid-cols-5 gap-10 items-start">
          <div className="md:col-span-2">
            <span className="section-label">{t('marketing.contact.eaLabel')}</span>
            <h2 className="text-xl font-bold text-gray-900 mt-4 mb-3">{t('marketing.contact.eaTitle')}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{t('marketing.contact.eaDesc')}</p>
          </div>

          <div className="md:col-span-3">
            {eaSubmitted ? (
              <div className="p-10 rounded-2xl bg-green-50 border border-green-100 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-xl">✓</div>
                <h3 className="font-bold text-gray-900 mb-2">{t('marketing.contact.eaSuccess')}</h3>
                <p className="text-sm text-gray-500">
                  {t('marketing.contact.eaSuccessDesc')}
                </p>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('marketing.contact.fields.fullName')}</label>
                    <input type="text" className={inputCls} value={earlyAccess.name}
                      onChange={e => setEarlyAccess({ ...earlyAccess, name: e.target.value })}
                      placeholder={t('marketing.contact.fields.namePlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('marketing.contact.fields.email')}</label>
                    <input type="email" className={inputCls} value={earlyAccess.email}
                      onChange={e => setEarlyAccess({ ...earlyAccess, email: e.target.value })}
                      placeholder={t('marketing.contact.fields.emailPlaceholder')} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('marketing.contact.fields.phone')}</label>
                  <input type="tel" className={inputCls} value={earlyAccess.phone}
                    onChange={e => setEarlyAccess({ ...earlyAccess, phone: e.target.value })}
                    placeholder={t('marketing.contact.fields.phonePlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('marketing.contact.fields.level')}</label>
                  <select className={selectCls} value={earlyAccess.level}
                    onChange={e => setEarlyAccess({ ...earlyAccess, level: e.target.value })}>
                    <option value="">{t('marketing.contact.fields.selectLevel')}</option>
                    {POLITICAL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('marketing.contact.fields.location')}</label>
                  <input type="text" className={inputCls} value={earlyAccess.location}
                    onChange={e => setEarlyAccess({ ...earlyAccess, location: e.target.value })}
                    placeholder={t('marketing.contact.fields.locationPlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('marketing.contact.fields.howHeard')}</label>
                  <select className={selectCls} value={earlyAccess.howHeard}
                    onChange={e => setEarlyAccess({ ...earlyAccess, howHeard: e.target.value })}>
                    <option value="">{t('marketing.contact.fields.selectOption')}</option>
                    {HOW_HEARD.map(({ key, label }) => <option key={key} value={label}>{label}</option>)}
                  </select>
                </div>
                <button onClick={submitEarlyAccess} className="btn-primary w-full py-3.5 rounded-lg font-semibold text-sm">
                  {t('marketing.contact.submit')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Partnership Inquiries ── */}
        <div className="grid md:grid-cols-5 gap-10 items-start">
          <div className="md:col-span-2">
            <span className="section-label">{t('marketing.contact.partnerLabel')}</span>
            <h2 className="text-xl font-bold text-gray-900 mt-4 mb-3">{t('marketing.contact.partnerTitle')}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{t('marketing.contact.partnerDesc')}</p>
          </div>

          <div className="md:col-span-3">
            {pSubmitted ? (
              <div className="p-10 rounded-2xl bg-green-50 border border-green-100 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-xl">✓</div>
                <h3 className="font-bold text-gray-900 mb-2">{t('marketing.contact.partnerSuccess')}</h3>
                <p className="text-sm text-gray-500">
                  {t('marketing.contact.eaSuccessDesc')}
                </p>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('marketing.contact.fields.name')}</label>
                    <input type="text" className={inputCls} value={partnership.name}
                      onChange={e => setPartnership({ ...partnership, name: e.target.value })}
                      placeholder={t('marketing.contact.fields.yourName')} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('marketing.contact.fields.org')}</label>
                    <input type="text" className={inputCls} value={partnership.org}
                      onChange={e => setPartnership({ ...partnership, org: e.target.value })}
                      placeholder={t('marketing.contact.fields.orgPlaceholder')} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('marketing.contact.fields.email')}</label>
                  <input type="email" className={inputCls} value={partnership.email}
                    onChange={e => setPartnership({ ...partnership, email: e.target.value })}
                    placeholder={t('marketing.contact.fields.emailPlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('marketing.contact.fields.details')}</label>
                  <textarea rows={4} className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2e6417] focus:ring-2 focus:ring-[#ddeece] transition-all resize-none"
                    value={partnership.details}
                    onChange={e => setPartnership({ ...partnership, details: e.target.value })}
                    placeholder={t('marketing.contact.fields.detailsPlaceholder')} />
                </div>
                <button onClick={submitPartnership} className="btn-primary w-full py-3.5 rounded-lg font-semibold text-sm">
                  {t('marketing.contact.sendInquiry')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Office ── */}
        <div className="grid md:grid-cols-5 gap-10 items-start">
          <div className="md:col-span-2">
            <span className="section-label">{t('marketing.contact.officeLabel')}</span>
            <h2 className="text-xl font-bold text-gray-900 mt-4">{t('marketing.contact.officeTitle')}</h2>
          </div>
          <div className="md:col-span-3">
            <div className="p-8 rounded-2xl bg-white border border-gray-200 space-y-4">
              <p className="font-bold text-gray-900">Kampeni Intelligence Platform</p>
              <div className="space-y-3 text-sm text-gray-500">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span>CIF AI HQ</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href="tel:+254713657133" className="hover:text-gray-900 transition-colors">+254 713 657133</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href="mailto:info@kampeni.net" className="hover:text-gray-900 transition-colors">info@kampeni.net</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer tagline ── */}
      <section className="bg-gray-950 py-16 text-center">
        <p className="text-white font-bold text-xl md:text-2xl">
          {t('marketing.contact.footerTagline')}
        </p>
      </section>
    </>
  )
}
