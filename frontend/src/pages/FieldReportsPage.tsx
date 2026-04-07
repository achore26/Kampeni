import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, MapPin, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import { apiClient } from '../api/client'

interface Report {
  id: string
  agent_id: string
  ward: string
  report_type: string
  top_issue: string
  support_level: string
  notes: string | null
  created_at: string
}

interface Summary {
  total: number
  by_support: Record<string, number>
  top_wards: { ward: string; count: number }[]
  by_issue: Record<string, number>
}

const SUPPORT_META: Record<string, { variant: 'positive' | 'negative' | 'neutral' | 'warning' | 'default'; icon: typeof TrendingUp }> = {
  strong_support:    { variant: 'positive', icon: TrendingUp },
  lean_support:      { variant: 'default',  icon: TrendingUp },
  undecided:         { variant: 'neutral',  icon: Minus },
  lean_opposition:   { variant: 'warning',  icon: TrendingDown },
  strong_opposition: { variant: 'negative', icon: TrendingDown },
}

const SUPPORT_ORDER = ['strong_support', 'lean_support', 'undecided', 'lean_opposition', 'strong_opposition']

const FILTER_LEVELS = ['all', 'strong_support', 'lean_support', 'undecided', 'lean_opposition', 'strong_opposition']

export default function FieldReportsPage() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  const loadReports = (level: string) => {
    const params = level !== 'all' ? `?support_level=${level}` : ''
    return apiClient.get<{ total: number; reports: Report[] }>(`/intake/field-reports${params}`)
  }

  useEffect(() => {
    Promise.all([
      apiClient.get<Summary>('/intake/field-reports/summary'),
      loadReports('all'),
    ])
      .then(([s, r]) => {
        setSummary(s.data)
        setReports(r.data.reports ?? [])
        setTotal(r.data.total ?? 0)
      })
      .catch(() => setError(t('fieldReports.error')))
      .finally(() => setLoading(false))
  }, [])

  const handleFilter = (level: string) => {
    setFilter(level)
    setLoading(true)
    loadReports(level)
      .then((r) => { setReports(r.data.reports ?? []); setTotal(r.data.total ?? 0) })
      .catch(() => setError(t('fieldReports.error')))
      .finally(() => setLoading(false))
  }

  if (loading) return (
    <div className="flex items-center gap-3 text-gray-400 py-12">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      {t('fieldReports.loading')}
    </div>
  )
  if (error) return <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">{error}</p>

  const pct = (n: number) => summary?.total ? Math.round((n / summary.total) * 100) : 0

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('fieldReports.title')}</h1>
        <p className="text-gray-400 mt-0.5 text-sm">{t('fieldReports.subtitle')}</p>
      </div>

      {/* Support breakdown cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {SUPPORT_ORDER.map((level) => {
          const meta = SUPPORT_META[level]
          const Icon = meta.icon
          const count = summary?.by_support[level] ?? 0
          return (
            <Card
              key={level}
              className={`cursor-pointer transition-all border-2 ${filter === level ? 'border-blue-500 shadow-sm' : 'border-transparent'}`}
              onClick={() => handleFilter(filter === level ? 'all' : level)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className={`w-3.5 h-3.5 ${
                    level.includes('support') ? 'text-green-500' :
                    level === 'undecided' ? 'text-gray-400' : 'text-red-500'
                  }`} />
                  <p className="text-xs text-gray-500 truncate">{t(`fieldReports.${level}`)}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-400 mt-0.5">{pct(count)}%</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Two-column: top wards + top issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              {t('fieldReports.topWards')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {(summary?.top_wards ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">{t('fieldReports.noReports')}</p>
            ) : (
              <ul className="space-y-2.5">
                {(summary?.top_wards ?? []).map(({ ward, count }, i) => (
                  <li key={ward} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-gray-300 text-center">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{ward}</span>
                        <span className="text-xs text-gray-400">{count} {t('fieldReports.reports')}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${summary?.total ? (count / summary.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              {t('fieldReports.topIssues')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {Object.keys(summary?.by_issue ?? {}).length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">{t('fieldReports.noReports')}</p>
            ) : (
              <ul className="space-y-2.5">
                {Object.entries(summary?.by_issue ?? {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([issue, count]) => (
                    <li key={issue} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {t(`fieldReports.${issue}`, { defaultValue: issue })}
                          </span>
                          <span className="text-xs text-gray-400">{count} {t('fieldReports.reports')}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${summary?.total ? (count / summary.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reports list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gray-400" />
              {t('fieldReports.allReports')}
              <span className="text-xs font-normal text-gray-400 normal-case">({total})</span>
            </CardTitle>
            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {FILTER_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => handleFilter(level)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level === 'all' ? t('fieldReports.filterAll') : t(`fieldReports.${level}`)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-600">{t('fieldReports.noReports')}</p>
              <p className="text-sm mt-1">{t('fieldReports.noReportsDesc')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {reports.map((r) => {
                const meta = SUPPORT_META[r.support_level]
                const Icon = meta?.icon ?? Minus
                return (
                  <li key={r.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-gray-900">{r.ward}</span>
                          <Badge variant="outline" className="text-xs">
                            {t(`fieldReports.${r.report_type}`, { defaultValue: r.report_type })}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {t(`fieldReports.${r.top_issue}`, { defaultValue: r.top_issue })}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">
                          {t('fieldReports.agent')}: {r.agent_id}
                          {' · '}
                          {new Date(r.created_at).toLocaleDateString('en-KE', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        {r.notes && (
                          <p className="text-sm text-gray-600 mt-1.5 italic">"{r.notes}"</p>
                        )}
                      </div>
                      <Badge variant={meta?.variant ?? 'neutral'} className="shrink-0 flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        {t(`fieldReports.${r.support_level}`)}
                      </Badge>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
