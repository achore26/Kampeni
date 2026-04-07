import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, ExternalLink, Building2, Brain, ArrowRight } from 'lucide-react'
import { apiClient } from '../api/client'

interface Summary { positive: number; negative: number; neutral: number; total: number }
interface Article {
  article_id: string; title: string; url: string; source: string
  published_at: string | null; label: string; score: number
}
interface Opponent {
  id: string; name: string; constituency: string; party: string | null
  position: string | null; is_incumbent: boolean; mention_count: number
}

const SENTIMENT_COLOR = { positive: '#16a34a', negative: '#dc2626', neutral: '#6b7280' }
const SOURCE_LABEL: Record<string, string> = {
  nation: 'Nation Africa', standard: 'Standard Media', citizen: 'Citizen Digital',
}

function SentimentIcon({ label }: { label: string }) {
  if (label === 'positive') return <TrendingUp className="w-3.5 h-3.5" />
  if (label === 'negative') return <TrendingDown className="w-3.5 h-3.5" />
  return <Minus className="w-3.5 h-3.5" />
}

function pct(n: number, total: number) {
  return total ? Math.round((n / total) * 100) : 0
}

export default function BriefingPage() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      apiClient.get<Summary>('/sentiment/summary'),
      apiClient.get<Article[]>('/sentiment/articles?limit=5'),
      apiClient.get<Opponent[]>('/opponents/'),
    ])
      .then(([s, a, o]) => {
        setSummary(s.data)
        setArticles(a.data ?? [])
        setOpponents((o.data ?? []).sort((a, b) => b.mention_count - a.mention_count).slice(0, 3))
      })
      .catch(() => setError(t('briefing.error')))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date().toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  if (loading) return (
    <div className="flex items-center gap-3 text-gray-400 py-12">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      {t('briefing.loading')}
    </div>
  )
  if (error) return <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">{error}</p>

  const statCards = [
    {
      label: t('briefing.articlesAnalysed'),
      value: summary?.total ?? 0,
      sub: null,
      color: '#1d4ed8',
      border: 'border-blue-200',
    },
    {
      label: t('briefing.positiveRate'),
      value: `${pct(summary?.positive ?? 0, summary?.total ?? 0)}%`,
      sub: summary?.positive ?? 0,
      color: SENTIMENT_COLOR.positive,
      border: 'border-green-200',
    },
    {
      label: t('briefing.negativeRate'),
      value: `${pct(summary?.negative ?? 0, summary?.total ?? 0)}%`,
      sub: summary?.negative ?? 0,
      color: SENTIMENT_COLOR.negative,
      border: 'border-red-200',
    },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('briefing.title')}</h1>
        <p className="text-gray-400 mt-0.5 text-sm">{t('briefing.subtitle')} {now}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map(({ label, value, sub, color, border }) => (
          <Card key={label} className={`relative overflow-hidden border ${border}`}>
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-bold" style={{ color }}>{value}</p>
              {sub !== null && (
                <p className="text-xs text-gray-400 mt-1">{sub} articles</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column: opponents + headlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top opponents */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t('briefing.topOpponents')}
              </CardTitle>
              <NavLink
                to="/dashboard/opponents"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('nav.opponents')} <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {opponents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">{t('briefing.noOpponents')}</p>
                <NavLink to="/dashboard/opponents" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                  {t('briefing.noOpponentsDesc')}
                </NavLink>
              </div>
            ) : (
              <ul className="space-y-3">
                {opponents.map((opp, i) => (
                  <li key={opp.id} className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs font-bold text-gray-300">#{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0">
                      {opp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{opp.name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {[opp.position, opp.party, opp.constituency].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-gray-900">{opp.mention_count}</p>
                      <p className="text-xs text-gray-400">{t('briefing.mentions')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Latest headlines */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t('briefing.headlines')}
              </CardTitle>
              <NavLink
                to="/dashboard/sentiment"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('nav.sentiment')} <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>
          </CardHeader>
          <CardContent className="pt-0 p-0">
            {articles.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">{t('briefing.noHeadlines')}</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {articles.map((art) => (
                  <li key={art.article_id} className="px-6 py-3 flex items-start gap-3">
                    <Badge
                      variant={art.label as any}
                      className="shrink-0 mt-0.5 flex items-center gap-1"
                    >
                      <SentimentIcon label={art.label} />
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 flex items-start gap-1 group leading-snug"
                      >
                        <span className="line-clamp-2">{art.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {SOURCE_LABEL[art.source] ?? art.source}
                        {art.published_at && (
                          <> · {new Date(art.published_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Briefing — clearly labelled, not a placeholder */}
      <Card className="border-gray-200">
        <CardContent className="py-6 flex items-start gap-5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-gray-900 text-sm">{t('briefing.aiTitle')}</h3>
              <Badge variant="neutral" className="text-xs">{t('briefing.aiStatus')}</Badge>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">{t('briefing.aiDesc')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
