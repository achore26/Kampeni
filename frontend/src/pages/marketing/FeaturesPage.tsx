import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { BarChart2, Users, MapPin, TrendingUp } from 'lucide-react'

const FEATURES = [
  {
    number: '01',
    icon: BarChart2,
    title: 'Real-Time Voter Insights',
    subtitle: 'Know what your voters care about as it happens',
    bullets: [
      'Track sentiment across social media, news, and field reports',
      'Spot emerging issues before they become crises',
      'Focus only on topics that actually move voters',
    ],
  },
  {
    number: '02',
    icon: Users,
    title: 'Opponent Intelligence Engine',
    subtitle: 'Stay ahead of every opponent move',
    bullets: [
      'Monitor all public statements and media appearances',
      'Identify messaging gaps and inconsistencies',
      'Generate fact-based counter strategies in minutes',
    ],
  },
  {
    number: '03',
    icon: MapPin,
    title: 'Smart Resource Allocation',
    subtitle: 'Where to spend for maximum vote return',
    bullets: [
      'Ward-level priority scoring',
      'Rally versus digital spend optimization',
      'Volunteer deployment planning',
    ],
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Continuous Leadership Intelligence',
    subtitle: 'Govern with confidence and plan your re-election early',
    bullets: [
      'Track pledge fulfillment against delivery',
      'Monitor constituent issues through WhatsApp and SMS',
      'Get early warnings on approval drops and political risks',
    ],
  },
]

export default function FeaturesPage() {
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

      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#2e6417] mb-6">Platform Features</p>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6">
          How Kampeni Works<br />for You
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-gray-500">
          Four intelligence modules working together — so your campaign always has better information than anyone else in the room.
        </p>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="space-y-5">
          {FEATURES.map(({ number, icon: Icon, title, subtitle, bullets }) => (
            <div key={title} className="p-8 md:p-10 rounded-2xl border border-gray-200 bg-white grid md:grid-cols-5 gap-8 items-start">
              {/* Left: number + icon + title */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold text-gray-300 tracking-widest">{number}</span>
                  <div className="w-9 h-9 rounded-xl bg-[#f0f7eb] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#2e6417]" />
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{subtitle}</p>
              </div>

              {/* Right: bullets */}
              <div className="md:col-span-3">
                <ul className="space-y-3">
                  {bullets.map(b => (
                    <li key={b} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2e6417] shrink-0 mt-2" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mockups ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 flex flex-col items-center justify-center min-h-[220px] text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Mockup</p>
            <p className="font-semibold text-gray-900 mb-1">Daily Briefing Example</p>
            <a href="#" className="text-sm text-[#2e6417] font-medium border-b border-[#2e6417] pb-0.5">
              View sample →
            </a>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 flex flex-col items-center justify-center min-h-[220px] text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Mockup</p>
            <p className="font-semibold text-gray-900">Opponent Tracking Dashboard</p>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-gray-950 py-24 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to see it in action?</h2>
        <p className="text-gray-400 text-sm mb-8">Request early access or explore the live platform.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/contact" className="btn-primary px-8 py-3.5 rounded text-sm font-semibold">
            Request Early Access
          </Link>
          <Link to="/dashboard" className="px-8 py-3.5 rounded text-sm font-semibold border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-colors">
            View Live Dashboard →
          </Link>
        </div>
      </section>
    </>
  )
}
