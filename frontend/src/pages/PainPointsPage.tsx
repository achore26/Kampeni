import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, MapPin, Tag, ChevronDown } from 'lucide-react'
import { apiClient } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'

interface PainPointItem {
  id: string; article_id: string; category: string; description: string
  severity: 'high' | 'medium' | 'low'; location: string | null
  county: string | null; constituency: string | null
  politicians: string[]; confidence: number; used_mock: boolean; created_at: string
}
interface Summary { by_category: { category: string; count: number }[]; total: number }
interface CountyData { county: string; count: number; painpoint_count?: number }
interface ListData { total: number; items: PainPointItem[] }

const SEVERITY_VARIANT: Record<string, 'negative' | 'warning' | 'neutral'> = {
  high: 'negative', medium: 'warning', low: 'neutral',
}
const SEVERITY_LABEL: Record<string, { en: string; sw: string }> = {
  high: { en: 'High', sw: 'Juu' },
  medium: { en: 'Medium', sw: 'Wastani' },
  low: { en: 'Low', sw: 'Chini' },
}

const CATEGORY_COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff']

const CATEGORY_ICON: Record<string, string> = {
  jobs: '💼', water: '💧', school_fees: '📚', roads: '🛣️',
  security: '🛡️', health: '🏥', corruption: '⚖️', economy: '📈',
  housing: '🏠', food: '🌽', other: '•',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs font-semibold text-gray-700 capitalize">{label}</p>
        <p className="text-xs text-blue-600">{payload[0].value} issues</p>
      </div>
    )
  }
  return null
}

export default function PainPointsPage() {
  const { i18n } = useTranslation()
  const isEn = i18n.language === 'en'
  const [summary, setSummary] = useState<Summary | null>(null)
  const [counties, setCounties] = useState<CountyData[]>([])
  const [items, setItems] = useState<PainPointItem[]>([])
  const [allItems, setAllItems] = useState<PainPointItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadItems = (severity: string) => {
    const params = severity !== 'all' ? `?severity=${severity}&limit=50` : '?limit=50'
    return apiClient.get<ListData>(`/painpoints/${params}`)
  }

  useEffect(() => {
    Promise.all([
      apiClient.get<Summary>('/painpoints/summary'),
      apiClient.get<CountyData>('/painpoints/by-county'),
      loadItems('all'),
    ])
      .then(([s, c, l]) => {
        setSummary(s.data)
        setCounties(Array.isArray(c.data) ? c.data : (c.data as any)?.by_county ?? [])
        setItems(l.data.items ?? [])
        setAllItems(l.data.items ?? [])
        setTotal(l.data.total ?? 0)
      })
      .catch(() => setError(isEn ? 'Could not load pain point data' : 'Imeshindwa kupakia data'))
      .finally(() => setLoading(false))
  }, [])

  const handleFilter = (severity: string) => {
    setSeverityFilter(severity)
    loadItems(severity)
      .then((r) => { setItems(r.data.items ?? []); setTotal(r.data.total ?? 0) })
      .catch(() => {})
  }

  if (loading) return (
    <div className="flex items-center gap-3 text-gray-400 py-12">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      {isEn ? 'Loading pain points...' : 'Inapakia matatizo...'}
    </div>
  )
  if (error) return <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">{error}</p>

  const categoryChartData = (summary?.by_category ?? []).slice(0, 8).map(({ category, count }) => ({
    name: category.replace(/_/g, ' '),
    count,
    key: category,
  }))

  const severityData = [
    { name: isEn ? 'High' : 'Juu', value: allItems.filter(i => i.severity === 'high').length, color: '#dc2626' },
    { name: isEn ? 'Medium' : 'Wastani', value: allItems.filter(i => i.severity === 'medium').length, color: '#f97316' },
    { name: isEn ? 'Low' : 'Chini', value: allItems.filter(i => i.severity === 'low').length, color: '#86efac' },
  ].filter(d => d.value > 0)

  const topCounties = counties.slice(0, 5)
  const maxCounty = Math.max(...topCounties.map(c => c.painpoint_count ?? c.count), 1)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEn ? 'Citizen Pain Points' : 'Matatizo ya Wananchi'}
        </h1>
        <p className="text-gray-400 mt-0.5 text-sm">
          {isEn
            ? `${total} issues extracted from news and social media`
            : `Matatizo ${total} yaliyotolewa kutoka kwenye habari na mitandao ya kijamii`}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: isEn ? 'Total Issues' : 'Jumla ya Matatizo', value: summary?.total ?? 0, color: '#1d4ed8' },
          { label: isEn ? 'High Severity' : 'Hatari Kubwa', value: allItems.filter(i => i.severity === 'high').length, color: '#dc2626' },
          { label: isEn ? 'Counties Covered' : 'Kaunti Zilizofunikwa', value: topCounties.length, color: '#d97706' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category bar chart — spans 2 cols */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              {isEn ? 'Issues by Category' : 'Matatizo kwa Aina'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            {categoryChartData.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                {isEn ? 'No data yet' : 'Hakuna data bado'}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={categoryChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 20, bottom: 4, left: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#374151' }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {categoryChartData.map((entry, i) => (
                      <Cell key={entry.key} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Severity donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-gray-400" />
              {isEn ? 'Severity' : 'Kiwango'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            {severityData.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                {isEn ? 'No data' : 'Hakuna data'}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="45%"
                    innerRadius={52}
                    outerRadius={76}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                  >
                    {severityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* County breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            {isEn ? 'Most Affected Counties' : 'Kaunti Zilizoathirika Zaidi'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {topCounties.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              {isEn ? 'No county data yet' : 'Hakuna data ya kaunti bado'}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {topCounties.map((c, i) => {
                const n = c.painpoint_count ?? c.count
                return (
                  <li key={c.county} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-gray-300 text-center">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{c.county}</span>
                        <span className="text-xs text-gray-400">{n}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(n / maxCounty) * 100}%`, background: '#f97316' }}
                        />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Issues list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                {isEn ? 'All Issues' : 'Matatizo Yote'}
                <span className="text-xs font-normal text-gray-400 normal-case">({total})</span>
              </CardTitle>
              <CardDescription className="mt-1">
                {isEn ? 'Extracted from articles via AI analysis' : 'Yaliyotolewa kutoka makala kwa uchambuzi wa AI'}
              </CardDescription>
            </div>
            <div className="flex gap-1.5">
              {['all', 'high', 'medium', 'low'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    severityFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'all' ? (isEn ? 'All' : 'Zote') : (isEn ? SEVERITY_LABEL[s].en : SEVERITY_LABEL[s].sw)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-600">
                {isEn ? 'No pain points extracted yet' : 'Hakuna matatizo yaliyotolewa bado'}
              </p>
              <p className="text-sm mt-1 text-gray-400">
                {isEn ? 'Pain points are extracted automatically from news articles' : 'Matatizo hutolewa kiotomatiki kutoka makala za habari'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {items.map((item) => (
                <li key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-base mt-0.5">{CATEGORY_ICON[item.category] ?? '•'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={SEVERITY_VARIANT[item.severity]} className="text-xs">
                          {isEn ? SEVERITY_LABEL[item.severity].en : SEVERITY_LABEL[item.severity].sw}
                        </Badge>
                        <span className="text-xs text-gray-500 capitalize">{item.category.replace(/_/g, ' ')}</span>
                        {item.county && (
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />{item.county}
                          </span>
                        )}
                        {item.used_mock && (
                          <Badge variant="neutral" className="text-xs">mock</Badge>
                        )}
                      </div>
                      <p className={`text-sm text-gray-800 leading-relaxed ${expandedId !== item.id ? 'line-clamp-2' : ''}`}>
                        {item.description}
                      </p>
                      {item.description.length > 120 && (
                        <button
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          className="text-xs text-blue-500 hover:text-blue-600 mt-0.5 flex items-center gap-0.5"
                        >
                          {expandedId === item.id ? (isEn ? 'Less' : 'Punguza') : (isEn ? 'More' : 'Zaidi')}
                          <ChevronDown className={`w-3 h-3 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                      {item.politicians.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {isEn ? 'Mentioned:' : 'Wametajwa:'} {item.politicians.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-gray-300 mt-0.5">{Math.round(item.confidence * 100)}%</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
