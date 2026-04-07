import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldOff } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 py-16">

      {/* Logo + lock mark */}
      <div className="flex flex-col items-center gap-6 mb-12">
        <img
          src="/Kampeni_Logo_transparent.png"
          alt="Kampeni"
          className="h-12 w-auto brightness-0 invert"
        />
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl border border-gray-700 bg-gray-900">
          <ShieldOff className="w-6 h-6 text-gray-500" />
        </div>
      </div>

      {/* Label */}
      <span className="section-label text-gray-600 mb-4">/access restricted/</span>

      {/* Heading */}
      <h1 className="text-display font-black text-white text-center leading-none mb-4">
        Authorised<br />Access Only
      </h1>

      {/* Subtext */}
      <p className="text-gray-400 text-base leading-relaxed text-center max-w-sm mb-10">
        The Kampeni dashboard is restricted to verified campaign teams.
        Authentication is being configured and will be available shortly.
      </p>

      {/* Status badge */}
      <div className="inline-flex items-center gap-2 border border-amber-800 bg-amber-950 text-amber-400 text-xs font-semibold px-4 py-2 rounded-full mb-10">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Access configuration in progress
      </div>

      {/* Campaign team box */}
      <div className="w-full max-w-sm border border-gray-800 bg-gray-900 rounded-xl px-6 py-5 mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-2">
          Campaign Team?
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Contact your Political Director or campaign administrator to receive your access credentials.
        </p>
      </div>

      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to kampeni.co.ke
      </Link>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-gray-700">
        © 2026 Kampeni · Powered by <span className="text-gray-500 font-semibold">CIF AI</span> · Built in Kenya 🇰🇪
      </p>
    </div>
  )
}
