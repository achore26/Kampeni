import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Mail, Lock, ArrowLeft, TrendingUp, TrendingDown, Minus, BarChart2, ArrowRight } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const SAKAJA_TREND = [
  { date: 'Jul 1', positive: 38, negative: 22, neutral: 40 },
  { date: 'Jul 4', positive: 42, negative: 18, neutral: 40 },
  { date: 'Jul 7', positive: 35, negative: 28, neutral: 37 },
  { date: 'Jul 10', positive: 44, negative: 20, neutral: 36 },
  { date: 'Jul 13', positive: 51, negative: 16, neutral: 33 },
  { date: 'Jul 16', positive: 48, negative: 19, neutral: 33 },
  { date: 'Jul 19', positive: 53, negative: 14, neutral: 33 },
  { date: 'Jul 22', positive: 57, negative: 12, neutral: 31 },
]

const SAKAJA_SUMMARY = { positive: 57, negative: 12, neutral: 31 }

const COLORS = { positive: '#16a34a', negative: '#dc2626', neutral: '#9ca3af' }

function SakajaPreviewChart() {
  return (
    <div className="w-full max-w-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#255213] uppercase tracking-widest">Live Demo</p>
          <h3 className="text-lg font-bold text-gray-900 leading-tight">Johnson Sakaja</h3>
          <p className="text-xs text-gray-500">Nairobi Senator · Media Sentiment · Jul 2026</p>
        </div>
        <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
          Trending ↑
        </span>
      </div>

      {/* Stat pills */}
      <div className="flex gap-2">
        {([
          { label: 'Positive', value: SAKAJA_SUMMARY.positive, color: COLORS.positive, icon: <TrendingUp className="w-3 h-3" /> },
          { label: 'Negative', value: SAKAJA_SUMMARY.negative, color: COLORS.negative, icon: <TrendingDown className="w-3 h-3" /> },
          { label: 'Neutral',  value: SAKAJA_SUMMARY.neutral,  color: COLORS.neutral,  icon: <Minus className="w-3 h-3" /> },
        ] as const).map((s) => (
          <div key={s.label} className="flex-1 bg-white rounded-xl border border-gray-100 px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-1 mb-0.5" style={{ color: s.color }}>
              {s.icon}
              <span className="text-[10px] font-semibold uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}%</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-medium text-gray-500 mb-3">30-day sentiment trend</p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={SAKAJA_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 11 }} />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
            <Line type="monotone" dataKey="positive" name="Positive" stroke={COLORS.positive} strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="negative" name="Negative" stroke={COLORS.negative} strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="neutral"  name="Neutral"  stroke={COLORS.neutral}  strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-center text-gray-400">
        Sample data · Powered by Kampeni Intelligence
      </p>
    </div>
  )
}

export default function LoginPage() {
  const { loginWithRedirect, isLoading } = useAuth0()
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

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

      {/* ── Left panel — Sakaja demo chart ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e8f0fe] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600 rounded-full opacity-[0.03] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600 rounded-full opacity-[0.03] translate-x-1/4 translate-y-1/4" />

        <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md">
          <img
            src="/Kampeni_Logo_transparent.png"
            alt="Kampeni"
            className="h-9 w-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <SakajaPreviewChart />

          {/* Demo CTA */}
          <div className="w-full flex flex-col items-center gap-2">
            <button
              onClick={() => navigate('/demo')}
              className="group flex items-center gap-2.5 bg-[#0d1b2a] hover:bg-[#1d4ed8] text-white font-semibold text-sm px-6 py-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg w-full max-w-xs justify-center"
            >
              <BarChart2 className="w-4 h-4 shrink-0" />
              Explore Live Dashboard
              <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <p className="text-[10px] text-gray-400">Sentiment · Map · AI Briefings · No login required</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-1 text-sm">Access is by invitation only</p>
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

          {/* Demo access — only visible in demo mode */}
          {DEMO_MODE && (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full mb-4 flex items-center justify-center gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-sm py-3.5 rounded-full transition-colors tracking-wide uppercase"
            >
              Enter Demo (Sakaja — Nairobi)
            </button>
          )}

          {/* Sign In */}
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-full transition-colors tracking-wide uppercase mb-4"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Invite notice */}
          <p className="text-center text-xs text-gray-400 mb-8">
            Don't have access?{' '}
            <Link
              to="/request-access"
              className="text-[#1d4ed8] hover:underline font-medium"
            >
              Request an invitation
            </Link>
          </p>

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
