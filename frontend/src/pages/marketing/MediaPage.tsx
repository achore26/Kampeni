import { Helmet } from 'react-helmet-async'
import { Download, Image, FileText, Mail, Phone, User } from 'lucide-react'

const RESOURCES = [
  { icon: Download, title: 'Logo Downloads', desc: 'PNG, SVG, and vector formats in multiple color variants.', action: 'Download logos' },
  { icon: Image, title: 'Team Photos', desc: 'High-resolution headshots and team photography for press use.', action: 'Download photos' },
  { icon: FileText, title: 'Press Kit', desc: 'Company backgrounder, product descriptions, and brand guidelines.', action: 'Download press kit' },
]

export default function MediaPage() {
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

      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#2e6417] mb-6">Media & Press</p>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-8">
          Media Resources
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-gray-500">
          Everything journalists and media professionals need to cover Kampeni.
        </p>
      </section>

      {/* ── Resources ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {RESOURCES.map(({ icon: Icon, title, desc, action }) => (
            <div key={title} className="p-8 rounded-2xl border border-gray-200 bg-white">
              <div className="w-10 h-10 rounded-xl bg-[#f0f7eb] flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-[#2e6417]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{desc}</p>
              <button className="text-sm font-medium text-[#2e6417] border-b border-[#2e6417] pb-0.5 hover:text-[#1e4510] transition-colors">
                {action} →
              </button>
            </div>
          ))}
        </div>

        {/* ── Founder Quote ───────────────────────────────────────────── */}
        <div className="mb-16">
          <span className="section-label">/founder quote/</span>
          <blockquote className="mt-8 max-w-3xl">
            <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-6">
              "Kenya's political future belongs to leaders who make data-driven decisions, not educated guesses."
            </p>
            <footer className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Morris Nyange</p>
                <p className="text-xs text-gray-500">CEO & Co-Founder, Kampeni</p>
              </div>
            </footer>
          </blockquote>
        </div>

        {/* ── Media Contact ────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="p-8 rounded-2xl border border-gray-200 bg-white">
            <span className="section-label">/media contact/</span>
            <h3 className="font-bold text-gray-900 mt-4 mb-5">Media Contact</h3>
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
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Response time</p>
            <p className="text-white font-bold text-2xl mb-1">Within 24 hours</p>
            <p className="text-xs text-gray-400">Mon–Fri, Nairobi time</p>
          </div>
        </div>
      </section>
    </>
  )
}
