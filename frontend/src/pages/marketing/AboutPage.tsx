const TEAM = [
  {
    name: 'Morris Nyange',
    role: 'CEO & Co-Founder',
    bio: 'Driving the vision and growth of Kampeni. Building Kenya\'s first political intelligence platform to change how leaders make decisions.',
    initial: 'M',
  },
  {
    name: 'Barak',
    role: 'CTO & Co-Founder',
    bio: 'Building the infrastructure that turns raw Kenyan media into campaign intelligence. Previously built data systems for East African fintechs.',
    initial: 'B',
  },
  {
    name: 'Alby',
    role: 'Head of Development & Co-Founder',
    bio: 'Engineering the core platform — from data pipelines and NLP models to the dashboard that campaigns rely on every morning.',
    initial: 'A',
  },
]

const WHY_KAMPENI = [
  'Real-time intelligence — not filtered through consultants',
  'Systematic analysis that removes guesswork',
  'Continuous support from campaign through governance',
]

export default function AboutPage() {
  return (
    <>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#2e6417] mb-6">Our Story</p>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-8">
          Built by Kenyans,<br />for Kenyan leaders
        </h1>
      </section>

      {/* ── The Kampeni Story ────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
          <div>
            <span className="section-label">/the kampeni story/</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-6">Why we're building this</h2>
            <div className="space-y-4 text-sm leading-relaxed text-gray-500">
              <p>Kenyan campaigns today run on instincts and whispers from consultants.</p>
              <p>Winners and losers are often decided by luck, not intelligence.</p>
              <p>Kampeni exists to change that.</p>
              <p>We are building a system where every political decision is backed by real, continuous intelligence. Not guesswork.</p>
            </div>
          </div>

          <div>
            <span className="section-label">/why kampeni exists/</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-6">Why Kampeni Exists</h2>
            <div className="space-y-0">
              {WHY_KAMPENI.map(item => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-600 border-b border-gray-200 py-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2e6417] shrink-0 mt-2" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 p-5 rounded-xl bg-white border border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Vision</p>
              <p className="text-gray-900 font-medium text-sm leading-relaxed">
                Leaders make decisions based on intelligence, not luck.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <span className="section-label">/the team/</span>
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-12">Meet the Team</h2>
        <div className="flex gap-10 flex-wrap">
          {TEAM.map(({ name, role, bio, initial }) => (
            <div key={name} className="flex items-start gap-5 max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#ddeece] text-[#2e6417] flex items-center justify-center text-xl font-bold shrink-0">
                {initial}
              </div>
              <div>
                <p className="font-bold text-gray-900">{name}</p>
                <p className="text-xs text-[#2e6417] mb-2">{role}</p>
                <p className="text-sm leading-relaxed text-gray-500">{bio}</p>
              </div>
            </div>
          ))}

          {/* Coming soon: Political Director */}
          <div className="flex items-start gap-5 max-w-sm opacity-60">
            <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl shrink-0">+</div>
            <div>
              <p className="font-bold text-gray-900">Coming Soon</p>
              <p className="text-xs text-gray-400 mb-2">Political Director</p>
              <p className="text-sm text-gray-400">The right person to lead our political strategy and client relationships across Kenya.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Principles ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <span className="section-label">/our principles/</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-6">How we operate</h2>
          </div>
          <div className="space-y-6">
            {[
              ['Kenya-first', 'Built for Swahili and Sheng from day one. Not English models retrofitted for East Africa.'],
              ['Privacy by default', 'Candidate data is never shared. Each campaign sees only their own intelligence.'],
              ['Fair access', 'Pricing designed so a first-time MCA candidate can afford the same tools as a gubernatorial campaign.'],
              ['Accuracy over speed', 'We\'d rather deliver one verified insight than ten noisy ones.'],
            ].map(([title, desc]) => (
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
