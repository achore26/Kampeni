import { useEffect, useState, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth0 } from '@auth0/auth0-react'
import { Button } from '@/components/ui/button'
import {
  TrendingUp, TrendingDown, Activity, Users,
  ExternalLink, ArrowRight, CheckCircle2, Clock,
  RefreshCw, Loader2, Newspaper, Shield,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '../api/client'
import { useCandidateId } from '../contexts/CandidateContext'

interface Summary { positive: number; negative: number; neutral: number; total: number }
interface Article {
  article_id: string; title: string; url: string; source: string
  published_at: string | null; label: string; score: number
}
interface Opponent {
  id: string; name: string; constituency: string; party: string | null
  position: string | null; is_incumbent: boolean; mention_count: number
}
interface BriefingSection { title: string; content: string }
interface Briefing {
  id: string; candidate_id: string; briefing_date: string; language: string
  sections: BriefingSection[]; is_approved: boolean; approved_by: string | null
  approved_at: string | null; delivered_at: string | null; delivery_channels: string[]
  created_at: string; used_mock?: boolean
}

const SOURCE_SHORT: Record<string, string> = {
  nation: 'Nation', standard: 'Standard', citizen: 'Citizen',
  capitalfm: 'Capital FM', kbc: 'KBC', youtube: 'YouTube',
  facebook: 'Facebook', facebook_pages: 'Facebook', facebook_forager: 'Facebook',
}

function pct(n: number, total: number) {
  return total ? Math.round((n / total) * 100) : 0
}

function getGreeting(lang: string) {
  const h = new Date().getHours()
  if (lang === 'en') {
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }
  if (h < 12) return 'Habari za Asubuhi'
  if (h < 17) return 'Habari za Mchana'
  return 'Habari za Jioni'
}

const SECTION_COLORS = ['#1d4ed8', '#16a34a', '#dc2626', '#d97706', '#7c3aed']

// ─── Animation variants ───────────────────────────────────────────────────────
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.28, ease: EASE_OUT, delay: i * 0.08 },
  }),
}

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000, active = true) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)
  const startTime = useRef<number | null>(null)

  useEffect(() => {
    if (!active || target === 0) { setValue(target); return }
    startTime.current = null
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const tick = (now: number) => {
      if (!startTime.current) startTime.current = now
      const elapsed = now - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      setValue(Math.round(easeOutCubic(progress) * target))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, active])

  return value
}

// ─── Skeleton block ───────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg bg-gray-200 animate-pulse', className)} />
  )
}

// ─── Filled KPI card ──────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, bg, Icon, index, loaded,
}: {
  label: string; value: string | number; sub?: string; bg: string; Icon: any; index: number; loaded: boolean
}) {
  // Parse numeric part for count-up; suffix is % or nothing
  const isPercent = typeof value === 'string' && value.endsWith('%')
  const numTarget = typeof value === 'number' ? value
    : parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0
  const counted = useCountUp(numTarget, 1000, loaded)
  const displayValue = loaded
    ? (isPercent ? `${counted}%` : counted.toLocaleString())
    : value

  if (!loaded) {
    return (
      <div className="rounded-xl px-5 py-5 relative overflow-hidden"
        style={{ background: bg, boxShadow: `0 4px 20px ${bg}55` }}>
        <Skeleton className="h-2 w-20 mb-3 opacity-30" />
        <Skeleton className="h-9 w-16 opacity-30" />
        <Skeleton className="h-2 w-24 mt-2 opacity-20" />
      </div>
    )
  }

  return (
    <motion.div
      className="rounded-xl flex items-center gap-4 px-5 py-5 relative overflow-hidden"
      style={{ background: bg, boxShadow: `0 4px 20px ${bg}55` }}
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="show"
    >
      {/* Background watermark icon */}
      <div className="absolute right-4 bottom-3 opacity-[0.12]">
        <Icon className="w-14 h-14 text-white" />
      </div>
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70 mb-1.5">{label}</p>
        <p className="text-[2.2rem] font-black leading-none text-white tracking-tight tabular-nums">{displayValue}</p>
        {sub && <p className="text-xs text-white/60 mt-1.5">{sub}</p>}
      </div>
    </motion.div>
  )
}

// ─── Briefing sections ────────────────────────────────────────────────────────
function BriefingContent({ briefing }: { briefing: Briefing }) {
  return (
    <div className="space-y-0">
      {briefing.sections.map((sec, i) => (
        <div key={i} className={cn('flex gap-4 py-5', i > 0 && 'border-t border-gray-100')}>
          <div className="shrink-0 mt-0.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black"
              style={{ background: SECTION_COLORS[i] ?? '#9ca3af' }}>
              {i + 1}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-1.5">{sec.title}</p>
            <p className="text-sm text-gray-800 leading-relaxed">{sec.content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// ─── Sentiment bar ────────────────────────────────────────────────────────────
function SBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const w = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <p className="text-xs text-gray-500 w-14 shrink-0">{label}</p>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w}%`, background: color }} />
      </div>
      <p className="text-xs font-bold w-8 text-right tabular-nums" style={{ color }}>{count}</p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BriefingPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth0()
  const candidateId = useCandidateId()
  const isEn = i18n.language === 'en'

  const [summary, setSummary] = useState<Summary | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadBriefing = () => {
    if (!candidateId) return
    apiClient.get<Briefing | null>(`/briefings/latest?candidate_id=${encodeURIComponent(candidateId)}`)
      .then(r => setBriefing(r.data)).catch(() => {})
  }

  useEffect(() => {
    Promise.all([
      apiClient.get<Summary>('/sentiment/summary'),
      apiClient.get<Article[]>('/sentiment/articles?limit=6'),
      apiClient.get<Opponent[]>('/opponents/'),
    ])
      .then(([s, a, o]) => {
        setSummary(s.data)
        setArticles(a.data ?? [])
        setOpponents((o.data ?? []).sort((a, b) => b.mention_count - a.mention_count).slice(0, 5))
      })
      .catch(() => setError(t('briefing.error')))
      .finally(() => setLoading(false))
    loadBriefing()
  }, [])

  const handleGenerate = async () => {
    if (!candidateId) return
    setGenerating(true); setError(null)
    try {
      await apiClient.post(`/briefings/generate?candidate_id=${encodeURIComponent(candidateId)}`)
      await new Promise(r => setTimeout(r, 1500))
      loadBriefing()
    } catch { setError(t('briefing.generateError')) }
    finally { setGenerating(false) }
  }

  const handleApprove = async () => {
    if (!briefing) return
    setApproving(true); setError(null)
    try {
      const res = await apiClient.post(
        `/briefings/${briefing.id}/approve?candidate_id=${encodeURIComponent(candidateId)}`,
        { approved_by: user?.name || user?.email || 'Political Director' }
      )
      setBriefing(res.data)
    } catch { setError(t('briefing.approveError')) }
    finally { setApproving(false) }
  }

  const today = new Date().toISOString().split('T')[0]
  const isToday = briefing?.briefing_date === today
  const maxMentions = opponents[0]?.mention_count || 1
  const totalMentions = opponents.reduce((s, o) => s + o.mention_count, 0)
  const firstName = user?.name?.split(' ')[0] || (isEn ? 'Governor' : 'Mgombea')
  const dateLabel = new Date().toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-[1200px]">

      {/* ── Greeting header ─────────────────────────────────────────────────── */}
      <motion.div
        className="flex items-start justify-between gap-4 flex-wrap"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-2xl font-black text-gray-900 tracking-tight">
              {getGreeting(i18n.language)}, <span style={{ color: '#1d4ed8' }}>{firstName}!</span>
            </p>
          </div>
          <p className="text-sm text-gray-500">{dateLabel}</p>
        </div>

        {/* Brief status pill */}
        {briefing?.is_approved ? (
          <motion.div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#16a34a', boxShadow: '0 4px 14px #16a34a44' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Brief approved · ready to deliver
          </motion.div>
        ) : briefing ? (
          <motion.div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Clock className="w-4 h-4" />
            Awaiting PD approval
          </motion.div>
        ) : null}
      </motion.div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI row — filled colored cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={isEn ? 'Articles Analysed' : 'Makala Zilizochambuliwa'}
          value={(summary?.total ?? 0).toLocaleString()}
          sub={isEn ? 'across all sources' : 'kutoka vyanzo vyote'}
          bg="#1d4ed8"
          Icon={Activity}
          index={0}
          loaded={!loading}
        />
        <KpiCard
          label={isEn ? 'Positive Sentiment' : 'Msimamo Mzuri'}
          value={`${pct(summary?.positive ?? 0, summary?.total ?? 0)}%`}
          sub={isEn ? `${summary?.positive ?? 0} articles` : `makala ${summary?.positive ?? 0}`}
          bg="#16a34a"
          Icon={TrendingUp}
          index={1}
          loaded={!loading}
        />
        <KpiCard
          label={isEn ? 'Negative Sentiment' : 'Msimamo Mbaya'}
          value={`${pct(summary?.negative ?? 0, summary?.total ?? 0)}%`}
          sub={isEn ? `${summary?.negative ?? 0} articles` : `makala ${summary?.negative ?? 0}`}
          bg="#dc2626"
          Icon={TrendingDown}
          index={2}
          loaded={!loading}
        />
        <KpiCard
          label={isEn ? 'Opponents Tracked' : 'Wapinzani Wanaofuatiliwa'}
          value={opponents.length}
          sub={isEn ? `${totalMentions} total mentions` : `kutajwa ${totalMentions} mara`}
          bg="#0d1b2a"
          Icon={Users}
          index={3}
          loaded={!loading}
        />
      </div>

      {/* ── Main 2-column ────────────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start"
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >

        {/* Left — AI Brief (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl overflow-hidden flex flex-col"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>

          {/* Header */}
          <div className="px-6 py-4 flex items-start gap-4"
            style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-1">
                {isEn ? 'AI Daily Intelligence Briefing' : 'Muhtasari wa Akili wa Kila Siku'}
              </p>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-bold text-gray-900">
                  {briefing ? (isToday ? (isEn ? "Today's Briefing" : 'Muhtasari wa Leo') : briefing.briefing_date) : (isEn ? 'Not yet prepared' : 'Haijaandaliwa')}
                </span>
                {briefing?.is_approved && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white rounded-full px-2 py-0.5"
                    style={{ background: '#16a34a' }}>
                    <CheckCircle2 className="w-2.5 h-2.5" /> {isEn ? 'APPROVED' : 'IMEIDHINISHWA'}
                  </span>
                )}
                {briefing && !briefing.is_approved && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5"
                    style={{ background: '#fef3c7', color: '#92400e' }}>
                    <Clock className="w-2.5 h-2.5" /> {isEn ? 'PENDING' : 'INASUBIRI'}
                  </span>
                )}
                {briefing?.used_mock && (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    {isEn ? 'DEMO' : 'MFANO'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {briefing && !briefing.is_approved && (
                <Button size="sm" onClick={handleApprove} disabled={approving}
                  className="h-8 text-xs gap-1.5 rounded-xl">
                  {approving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  {isEn ? 'Approve' : 'Idhinisha'}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleGenerate}
                disabled={generating || !candidateId}
                className="h-8 text-xs gap-1.5 rounded-xl border-gray-200">
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {generating ? (isEn ? 'Generating…' : 'Inaandaa…') : (isEn ? 'Generate' : 'Andaa')}
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-2 flex-1">
            {loading ? (
              <div className="py-5 space-y-5">
                {[1, 2, 3].map(n => (
                  <div key={n} className="flex gap-4 py-4 border-t border-gray-100 first:border-t-0">
                    <Skeleton className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-2 w-24" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !briefing ? (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: '#eff6ff' }}>
                  <Newspaper className="w-7 h-7" style={{ color: '#1d4ed8' }} />
                </div>
                <p className="text-sm font-bold text-gray-700 mb-1">{isEn ? 'No briefing yet' : 'Hakuna muhtasari bado'}</p>
                <p className="text-xs text-gray-400 mb-5 max-w-xs leading-relaxed">
                  {candidateId
                    ? (isEn ? "Generate today's AI briefing — includes overnight news, public sentiment, and opponent activity." : 'Andaa muhtasari wa AI wa leo — unajumuisha habari za usiku, hisia za wananchi na shughuli za wapinzani.')
                    : (isEn ? 'Set VITE_candidateId to enable briefings.' : 'Weka VITE_candidateId ili kuwezesha muhtasari.')}
                </p>
                {candidateId && (
                  <Button size="sm" onClick={handleGenerate} disabled={generating}
                    className="gap-2 rounded-xl">
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {isEn ? 'Generate Briefing' : 'Andaa Muhtasari'}
                  </Button>
                )}
              </div>
            ) : (
              <BriefingContent briefing={briefing} />
            )}
          </div>

          {briefing?.delivered_at && (
            <div className="px-6 py-3 bg-gray-50" style={{ borderTop: '1px solid #f0f0f0' }}>
              <p className="text-xs text-gray-400">
                {isEn ? 'Delivered via' : 'Imetumwa kupitia'} {briefing.delivery_channels?.join(', ') || 'SMS'} · {isEn ? 'at' : 'saa'}{' '}
                {new Date(briefing.delivered_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} EAT
              </p>
            </div>
          )}
        </div>

        {/* Right column (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Sentiment breakdown */}
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid #f0f0f0' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                {isEn ? 'Public Sentiment' : 'Hisia za Wananchi'}
              </p>
              <NavLink to="/dashboard/sentiment"
                className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                style={{ color: '#1d4ed8' }}>
                {isEn ? 'Details' : 'Maelezo'} <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>
            <div className="px-5 py-4 space-y-4">
              {loading ? (
                <>
                  {[1, 2, 3].map(n => (
                    <div key={n} className="flex items-center gap-3">
                      <Skeleton className="w-2 h-2 rounded-full shrink-0" />
                      <Skeleton className="h-2 w-10 shrink-0" />
                      <Skeleton className="flex-1 h-2 rounded-full" />
                      <Skeleton className="h-2 w-6" />
                    </div>
                  ))}
                </>
              ) : summary ? (
                <>
                  <SBar label={isEn ? 'Positive' : 'Mzuri'} count={summary.positive} total={summary.total} color="#16a34a" />
                  <SBar label={isEn ? 'Negative' : 'Mbaya'} count={summary.negative} total={summary.total} color="#dc2626" />
                  <SBar label={isEn ? 'Neutral' : 'Wastani'} count={summary.neutral} total={summary.total} color="#9ca3af" />
                  <p className="text-xs text-gray-400 pt-2" style={{ borderTop: '1px solid #f5f5f5' }}>
                    {isEn ? <><span className="font-bold text-gray-700">{summary.total.toLocaleString()}</span> articles analysed · live</> : <>Makala <span className="font-bold text-gray-700">{summary.total.toLocaleString()}</span> zimechambuliwa · moja kwa moja</>}
                  </p>
                </>
              ) : null}
            </div>
          </div>

          {/* Latest headlines */}
          <div className="bg-white rounded-2xl overflow-hidden flex flex-col"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid #f0f0f0' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                {isEn ? 'Latest Headlines' : 'Vichwa vya Habari'}
              </p>
              <NavLink to="/dashboard/sentiment"
                className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                style={{ color: '#1d4ed8' }}>
                {isEn ? 'All' : 'Zote'} <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>
            <ul className="flex-1">
              {loading ? (
                [1,2,3,4].map(n => (
                  <li key={n} className="px-5 py-3 flex items-start gap-3 border-t border-gray-50 first:border-t-0">
                    <Skeleton className="w-2 h-2 rounded-full shrink-0 mt-1.5" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2 w-20" />
                    </div>
                  </li>
                ))
              ) : articles.length === 0 ? (
                <li className="px-5 py-8 text-center text-xs text-gray-400">{isEn ? 'No articles yet' : 'Hakuna makala bado'}</li>
              ) : articles.map((art, i) => {
                const dotColor = art.label === 'positive' ? '#16a34a'
                  : art.label === 'negative' ? '#dc2626' : '#d1d5db'
                return (
                  <li key={art.article_id}
                    className={cn('px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors group',
                      i > 0 && 'border-t border-gray-50')}>
                    <div className="mt-[5px] w-2 h-2 rounded-full shrink-0"
                      style={{ background: dotColor, boxShadow: `0 0 0 3px ${dotColor}30` }} />
                    <div className="flex-1 min-w-0">
                      <a href={art.url} target="_blank" rel="noreferrer"
                        className="text-sm font-medium text-gray-900 group-hover:text-blue-600 leading-snug line-clamp-2 flex items-start gap-1">
                        <span>{art.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {SOURCE_SHORT[art.source] ?? art.source}
                        {art.published_at && (
                          <> · {new Date(art.published_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</>
                        )}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* ── Opponent intelligence ────────────────────────────────────────────── */}
      <motion.div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
        custom={5}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >

        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-0.5">
              {isEn ? 'Opponent Intelligence' : 'Akili ya Wapinzani'}
            </p>
            <p className="text-sm font-bold text-gray-900">{isEn ? 'Ranked by media mentions' : 'Imepangwa kwa kutajwa na vyombo vya habari'}</p>
          </div>
          <NavLink to="/dashboard/opponents"
            className="text-xs font-semibold flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            style={{ color: '#1d4ed8' }}>
            {isEn ? 'Monitor' : 'Simamia'} <ArrowRight className="w-3 h-3" />
          </NavLink>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {[1,2,3].map(n => (
              <div key={n} className="px-6 py-3.5 flex items-center gap-4">
                <Skeleton className="w-6 h-3 rounded" />
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="w-36 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <Skeleton className="flex-1 h-2 rounded-full" />
                <Skeleton className="h-4 w-6" />
              </div>
            ))}
          </div>
        ) : opponents.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">{isEn ? 'No opponents being tracked' : 'Hakuna wapinzani wanaofuatiliwa'}</p>
            <NavLink to="/dashboard/opponents"
              className="text-xs font-semibold hover:underline"
              style={{ color: '#1d4ed8' }}>
              {isEn ? 'Add opponents to track →' : 'Ongeza wapinzani wa kufuatilia →'}
            </NavLink>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {opponents.map((opp, i) => {
              const barPct = maxMentions > 0 ? (opp.mention_count / maxMentions) * 100 : 0
              const initials = opp.name.split(' ').map(n => n[0]).slice(0, 2).join('')
              // Gradient intensity based on rank
              const avatarBg = i === 0 ? '#0d1b2a' : i === 1 ? '#1e3a5f' : '#334155'
              return (
                <motion.div key={opp.id}
                  className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/80 transition-colors"
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                >
                  <span className="w-6 text-sm font-black text-gray-200 shrink-0 text-center">
                    {i + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                    style={{ background: avatarBg }}>
                    {initials}
                  </div>
                  <div className="w-36 shrink-0 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{opp.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {[opp.position, opp.party].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 w-24 shrink-0 truncate hidden sm:block">
                    {opp.constituency}
                  </p>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${barPct}%`, background: '#1d4ed8' }} />
                    </div>
                    <span className="text-sm font-black text-gray-800 w-8 text-right tabular-nums shrink-0">
                      {opp.mention_count}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0 hidden md:block">{isEn ? 'mentions' : 'kutajwa'}</span>
                  </div>
                  {opp.is_incumbent && (
                    <span className="text-[10px] font-bold rounded-full px-2 py-0.5 hidden lg:block"
                      style={{ background: '#fef3c7', color: '#92400e' }}>
                      {isEn ? 'Incumbent' : 'Mamlakani'}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

    </div>
  )
}
