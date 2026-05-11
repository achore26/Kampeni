import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Link } from 'react-router-dom'
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react'

/* ── Decorative SVG illustration ───────────────────────────────────────── */
function SecurityIllustration() {
  return (
    <svg viewBox="0 0 480 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md">
      {/* Blob backgrounds — green tones */}
      <ellipse cx="240" cy="210" rx="200" ry="180" fill="#2e6417" opacity="0.12" />
      <ellipse cx="310" cy="150" rx="120" ry="100" fill="#2e6417" opacity="0.10" />
      <ellipse cx="160" cy="290" rx="100" ry="80" fill="#3d7f1e" opacity="0.08" />

      {/* Phone / ID card */}
      <rect x="150" y="80" width="160" height="240" rx="20" fill="white" stroke="#c6e0b4" strokeWidth="2" />
      <rect x="168" y="110" width="124" height="14" rx="7" fill="#edf7e8" />
      <rect x="168" y="134" width="90" height="10" rx="5" fill="#edf7e8" />
      <rect x="168" y="154" width="110" height="10" rx="5" fill="#edf7e8" />

      {/* Avatar */}
      <circle cx="230" cy="82" r="22" fill="#2e6417" />
      <circle cx="230" cy="75" r="10" fill="white" opacity="0.9" />
      <ellipse cx="230" cy="96" rx="14" ry="8" fill="white" opacity="0.9" />

      {/* Keyhole */}
      <circle cx="230" cy="210" r="18" fill="#edf7e8" stroke="#c6e0b4" strokeWidth="1.5" />
      <circle cx="230" cy="205" r="7" fill="#2e6417" />
      <rect x="226" y="210" width="8" height="12" rx="2" fill="#2e6417" />

      {/* Key — Kenyan red accent */}
      <g transform="translate(260, 190) rotate(-30)">
        <circle cx="0" cy="0" r="22" fill="none" stroke="#ff0000" strokeWidth="6" />
        <circle cx="0" cy="0" r="10" fill="none" stroke="#ff0000" strokeWidth="6" />
        <rect x="20" y="-4" width="70" height="8" rx="4" fill="#ff0000" />
        <rect x="68" y="4" width="10" height="14" rx="2" fill="#cc0000" />
        <rect x="80" y="4" width="10" height="10" rx="2" fill="#cc0000" />
      </g>

      {/* Person */}
      <ellipse cx="295" cy="280" rx="22" ry="22" fill="#2e6417" />
      <ellipse cx="295" cy="270" rx="10" ry="11" fill="#c6e0b4" />
      <path d="M273 320 Q295 305 317 320 L322 370 H268 Z" fill="#255213" />
      <rect x="268" y="315" width="18" height="50" rx="8" fill="#2e6417" />
      <rect x="309" y="315" width="18" height="50" rx="8" fill="#2e6417" />
      <path d="M273 330 Q240 310 230 290" stroke="#2e6417" strokeWidth="14" strokeLinecap="round" />

      {/* Shield — Kenyan flag black */}
      <path d="M80 140 L80 170 Q80 190 100 200 Q120 190 120 170 L120 140 L100 132 Z" fill="#1a1a1a" />
      <path d="M92 165 L98 171 L112 155" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Plants */}
      <rect x="50" y="340" width="20" height="30" rx="3" fill="#2e6417" />
      <ellipse cx="60" cy="330" rx="28" ry="20" fill="#3d7f1e" />
      <ellipse cx="42" cy="318" rx="18" ry="14" fill="#255213" />
      <ellipse cx="78" cy="320" rx="16" ry="12" fill="#255213" />
      <ellipse cx="60" cy="308" rx="14" ry="10" fill="#3d7f1e" />

      {/* Clouds */}
      <ellipse cx="380" cy="110" rx="40" ry="24" fill="#c6e0b4" opacity="0.6" />
      <ellipse cx="355" cy="118" rx="28" ry="18" fill="#c6e0b4" opacity="0.6" />
      <ellipse cx="405" cy="120" rx="24" ry="16" fill="#c6e0b4" opacity="0.6" />
      <ellipse cx="100" cy="170" rx="32" ry="18" fill="#c6e0b4" opacity="0.5" />
      <ellipse cx="78" cy="176" rx="22" ry="14" fill="#c6e0b4" opacity="0.5" />
      <ellipse cx="122" cy="178" rx="18" ry="12" fill="#c6e0b4" opacity="0.5" />
    </svg>
  )
}

export default function LoginPage() {
  const { loginWithRedirect, isLoading } = useAuth0()
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setError(null)
    try {
      await loginWithRedirect()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-stretch">

      {/* ── Left panel — illustration ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#f0f7eb] via-[#e4f2db] to-[#d0e8c0] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#2e6417] rounded-full opacity-5 -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#2e6417] rounded-full opacity-5 translate-x-1/4 translate-y-1/4" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-[#3d7f1e] rounded-full opacity-5 translate-x-1/4" />

        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Logo */}
          <img
            src="/Kampeni_Logo_transparent.png"
            alt="Kampeni"
            className="h-10 w-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />

          <SecurityIllustration />

          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#255213]">Campaign Intelligence</h2>
            <p className="text-[#2e6417] mt-1 text-sm font-medium">Real-time political intelligence for Kenya</p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 text-xs text-[#3d7f1e]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2e6417] inline-block" />
              End-to-end encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2e6417] inline-block" />
              Auth0 secured
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2e6417] inline-block" />
              Built in Kenya
            </span>
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <img
            src="/Kampeni_Logo_transparent.png"
            alt="Kampeni"
            className="h-9 w-auto mx-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome!</h1>
            <p className="text-[#2e6417] mt-1 font-medium">Sign in to your Account</p>
          </div>

          {/* Fake fields — clicking triggers Auth0 */}
          <div className="space-y-4 mb-2">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <div
                onClick={handleSignIn}
                className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 bg-white text-gray-400 text-sm cursor-pointer hover:border-[#2e6417]/40 hover:text-gray-500 transition-colors select-none"
              >
                Email Address
              </div>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <div
                onClick={handleSignIn}
                className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 bg-white text-gray-400 text-sm cursor-pointer hover:border-[#2e6417]/40 hover:text-gray-500 transition-colors select-none"
              >
                Password
              </div>
            </div>
          </div>

          {/* Forgot password */}
          <div className="text-right mb-6">
            <button
              onClick={handleSignIn}
              className="text-sm text-gray-500 hover:text-[#2e6417] transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          {/* Sign In / Sign Up */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#2e6417] hover:bg-[#255213] disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-full transition-colors tracking-wide uppercase"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center bg-white hover:bg-gray-50 disabled:opacity-60 text-gray-700 font-bold text-sm py-3.5 rounded-full border border-gray-200 transition-colors tracking-wide uppercase"
            >
              Sign Up
            </button>
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">or login with</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Social login */}
          <div className="flex justify-center gap-4 mb-10">
            {[
              { label: 'f', color: '#1877f2', connection: 'facebook' },
              { label: 'G', color: '#ea4335', connection: 'google-oauth2' },
              { label: 'in', color: '#0a66c2', connection: 'linkedin' },
            ].map(({ label, color, connection }) => (
              <button
                key={label}
                onClick={() => loginWithRedirect({ authorizationParams: { connection } })}
                className="w-14 h-14 rounded-full border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm flex items-center justify-center transition-all font-bold text-lg"
                style={{ color }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Back link */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to kampeni.net
            </Link>
          </div>
        </div>

        <p className="mt-auto pt-8 text-xs text-gray-300 text-center">
          © 2026 Kampeni · Powered by <span className="text-gray-400 font-medium">CIF AI</span> · Built in Kenya
        </p>
      </div>
    </div>
  )
}
