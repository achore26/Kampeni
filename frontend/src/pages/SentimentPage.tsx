import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import { apiClient } from '../api/client'

interface Summary { positive: number; negative: number; neutral: number; total: number }
interface Article {
  article_id: string; title: string; url: string; source: string
  published_at: string | null; label: string; score: number; language_detected: string
}

const COLORS = { positive: '#16a34a', negative: '#dc2626', neutral: '#9ca3af' }
const SOURCE_LABEL: Record<string, string> = {
  nation: 'Nation Africa', standard: 'Standard Media', citizen: 'Citizen Digital',
}

function SentimentIcon({ label }: { label: string }) {
  if (label === 'positive') return <TrendingUp className="w-3.5 h-3.5" />
  if (label === 'negative') return <TrendingDown className="w-3.5 h-3.5" />
  return <Minus className="w-3.5 h-3.5" />
}

export default function SentimentPage() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      apiClient.get<Summary>('/sentiment/summary'),
      apiClient.get<Article[]>('/sentiment/articles?limit=20'),
    ])
      .then(([s, a]) => { setSummary(s.data); setArticles(a.data ?? []) })
      .catch(() => setError(t('sentiment.error')))
      .finally(() => setLoading(false))
  }, [])

  const LABELS = {
    positive: t('sentiment.positive'),
    negative: t('sentiment.negative'),
    neutral: t('sentiment.neutral'),
  }

  if (loading) return (
    <div className="flex items-center gap-3 text-gray-400 py-12">
      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      {t('sentiment.loading')}
    </div>
  )
  if (error) return <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">{error}</p>

  const chartData = summary
    ? [
        { name: LABELS.positive, value: summary.positive, color: COLORS.positive },
        { name: LABELS.negative, value: summary.negative, color: COLORS.negative },
        { name: LABELS.neutral, value: summary.neutral, color: COLORS.neutral },
      ]
    : []
  const pct = (n: number) => summary?.total ? Math.round((n / summary.total) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('sentiment.title')}</h1>
        <p className="text-gray-500 mt-1">
          <span className="font-semibold text-gray-700">{summary?.total ?? 0}</span>{' '}
          {t('sentiment.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(['positive', 'negative', 'neutral'] as const).map((label) => (
          <Card key={label} className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: COLORS[label] }} />
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-500 mb-1">{LABELS[label]}</p>
              <p className="text-3xl font-bold" style={{ color: COLORS[label] }}>{summary?.[label] ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">{pct(summary?.[label] ?? 0)}{t('sentiment.ofTotal')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sentiment.chartTitle')}</CardTitle>
          <CardDescription>{t('sentiment.chartDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={56}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sentiment.listTitle')}</CardTitle>
          <CardDescription>{t('sentiment.listDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {articles.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-400">{t('sentiment.noArticles')}</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {articles.map((art) => (
                <li key={art.article_id} className="px-6 py-3.5 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <a href={art.url} target="_blank" rel="noreferrer"
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 flex items-start gap-1.5 group">
                      <span className="truncate">{art.title}</span>
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
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
