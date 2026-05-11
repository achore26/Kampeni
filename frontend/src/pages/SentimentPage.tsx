import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, Legend, CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '../api/client'

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.28, ease: EASE_OUT, delay: i * 0.08 },
  }),
}

interface Summary { positive: number; negative: number; neutral: number; total: number }
interface Article {
  article_id: string; title: string; url: string; source: string
  published_at: string | null; label: string; score: number; language_detected: string
}
interface TrendPoint { date: string; positive: number; negative: number; neutral: number }

const COLORS = { positive: '#16a34a', negative: '#dc2626', neutral: '#9ca3af' }
const SOURCE_LABEL: Record<string, string> = {
  nation: 'Nation Africa', standard: 'Standard Media', citizen: 'Citizen Digital',
  capitalfm: 'Capital FM', kbc: 'KBC', youtube: 'YouTube',
  facebook: 'Facebook', facebook_pages: 'Facebook', facebook_forager: 'Facebook',
}
const SOURCES = ['nation', 'standard', 'citizen', 'capitalfm', 'kbc', 'youtube', 'facebook']

function SentimentIcon({ label }: { label: string }) {
  if (label === 'positive') return <TrendingUp className="w-3.5 h-3.5" />
  if (label === 'negative') return <TrendingDown className="w-3.5 h-3.5" />
  return <Minus className="w-3.5 h-3.5" />
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{formatDate(label)}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="leading-5">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function SentimentPage() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [trendDays, setTrendDays] = useState(7)

  const load = (source: string) => {
    const srcParam = source !== 'all' ? `&source=${source}` : ''
    return Promise.all([
      apiClient.get<Summary>(`/sentiment/summary${source !== 'all' ? `?source=${source}` : ''}`),
      apiClient.get<Article[]>(`/sentiment/articles?limit=30${srcParam}`),
    ])
  }

  useEffect(() => {
    Promise.all([
      load('all'),
      apiClient.get<TrendPoint[]>(`/sentiment/trend?days=${trendDays}`),
    ])
      .then(([[s, a], tr]) => {
        setSummary(s.data)
        setArticles(a.data ?? [])
        setTrend(tr.data ?? [])
      })
      .catch(() => setError(t('sentiment.error')))
      .finally(() => setLoading(false))
  }, [])

  const handleSource = (source: string) => {
    setSourceFilter(source)
    setLoading(true)
    load(source)
      .then(([s, a]) => { setSummary(s.data); setArticles(a.data ?? []) })
      .catch(() => setError(t('sentiment.error')))
      .finally(() => setLoading(false))
  }

  const handleTrendDays = (days: number) => {
    setTrendDays(days)
    apiClient.get<TrendPoint[]>(`/sentiment/trend?days=${days}`)
      .then((r) => setTrend(r.data ?? []))
      .catch(() => {})
  }

  const LABELS = {
    positive: t('sentiment.positive'),
    negative: t('sentiment.negative'),
    neutral: t('sentiment.neutral'),
  }

  if (loading && !summary) return (
    <div className="flex items-center gap-3 text-gray-400 py-12">
      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      {t('sentiment.loading')}
    </div>
  )
  if (error) return <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">{error}</p>

  const barData = summary
    ? [
        { name: LABELS.positive, value: summary.positive, color: COLORS.positive },
        { name: LABELS.negative, value: summary.negative, color: COLORS.negative },
        { name: LABELS.neutral, value: summary.neutral, color: COLORS.neutral },
      ]
    : []
  const pct = (n: number) => summary?.total ? Math.round((n / summary.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-start justify-between flex-wrap gap-3"
        custom={0} variants={fadeUp} initial="hidden" animate="show"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('sentiment.title')}</h1>
          <p className="text-gray-500 mt-1">
            <span className="font-semibold text-gray-700">{summary?.total ?? 0}</span>{' '}
            {t('sentiment.subtitle')}
          </p>
        </div>
        {/* Source filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleSource('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              sourceFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Sources
          </button>
          {SOURCES.map((src) => (
            <button
              key={src}
              onClick={() => handleSource(src)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sourceFilter === src ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {SOURCE_LABEL[src] ?? src}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {(['positive', 'negative', 'neutral'] as const).map((label, i) => (
          <motion.div key={label} custom={i + 1} variants={fadeUp} initial="hidden" animate="show">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: COLORS[label] }} />
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-500 mb-1">{LABELS[label]}</p>
              <p className="text-3xl font-bold" style={{ color: COLORS[label] }}>{summary?.[label] ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">{pct(summary?.[label] ?? 0)}{t('sentiment.ofTotal')}</p>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </div>

      {/* Trend line chart */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base">{t('sentiment.trendTitle', { defaultValue: 'Sentiment Trend' })}</CardTitle>
              <CardDescription>{t('sentiment.trendDesc', { defaultValue: 'Daily coverage over the selected period' })}</CardDescription>
            </div>
            <div className="flex gap-1.5">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => handleTrendDays(d)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    trendDays === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No trend data yet — sentiment will appear here as articles are ingested
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={formatDate}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="positive"
                  name={LABELS.positive}
                  stroke={COLORS.positive}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="negative"
                  name={LABELS.negative}
                  stroke={COLORS.negative}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="neutral"
                  name={LABELS.neutral}
                  stroke={COLORS.neutral}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Bar breakdown */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sentiment.chartTitle')}</CardTitle>
          <CardDescription>{t('sentiment.chartDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} barSize={56}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={600} animationEasing="ease-out">
                {barData.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* Articles list */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sentiment.listTitle')}</CardTitle>
          <CardDescription>{t('sentiment.listDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {articles.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">{t('sentiment.noArticles')}</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {articles.map((art, i) => (
                <motion.li
                  key={art.article_id}
                  className="px-6 py-3.5 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                >
                  <div className="flex-1 min-w-0">
                    <a href={art.url} target="_blank" rel="noreferrer"
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 flex items-start gap-1.5 group">
                      <span className="line-clamp-2">{art.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {SOURCE_LABEL[art.source] ?? art.source}
                      {art.published_at && <> · {new Date(art.published_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</>}
                      {art.language_detected === 'sw' && <> · 🇰🇪 Kiswahili</>}
                    </p>
                  </div>
                  <Badge variant={art.label as any} className="shrink-0 flex items-center gap-1">
                    <SentimentIcon label={art.label} />
                    {LABELS[art.label as keyof typeof LABELS]}
                    <span className="opacity-60">{art.score > 0 ? '+' : ''}{art.score.toFixed(2)}</span>
                  </Badge>
                </motion.li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </div>
  )
}
