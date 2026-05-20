import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, RefreshCw, MapPin, Clock, Target } from 'lucide-react'
import { apiClient } from '../api/client'
import { KENYA_COUNTIES } from '../data/kenya-counties'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'

// ── Types ────────────────────────────────────────────────────────────────────

interface StatItem { label: string; value: string | number; change?: string; color?: string }
interface ChartItem { name: string; value: number; color?: string }
interface ListItem { title: string; subtitle?: string; badge?: string; badgeColor?: string }

interface Panel {
  id: string
  type: 'bar' | 'pie' | 'stat' | 'list'
  title: string
  width: 'full' | 'half' | 'third'
  data: StatItem[] | ChartItem[] | ListItem[]
  config: Record<string, unknown>
}

interface DashboardConfig {
  title: string
  subtitle: string
  narrative: string
  panels: Panel[]
}

// ── Param options ─────────────────────────────────────────────────────────────

const TIME_RANGES = [
  { value: '7d',  label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
]

const FOCUS_OPTIONS = [
  { value: 'comprehensive', label: 'Comprehensive' },
  { value: 'painpoints',    label: 'Pain Points' },
  { value: 'field_reports', label: 'Field Reports' },
  { value: 'sentiment',     label: 'Media Sentiment' },
]

const COUNTY_OPTIONS = [
  { value: 'All Kenya', label: 'All Kenya' },
  ...KENYA_COUNTIES.map(c => ({ value: c.name, label: c.name })),
]

const WIDTH_CLASS: Record<string, string> = {
  full: 'col-span-1 md:col-span-3',
  half: 'col-span-1 md:col-span-1',
  third: 'col-span-1',
}

// ── Panel renderers ──────────────────────────────────────────────────────────

const COLORS = ['#1d4ed8', '#3b82f6', '#60a5fa', '#16a34a', '#f97316', '#dc2626', '#9ca3af']

function StatPanel({ panel }: { panel: Panel }) {
  const data = panel.data as StatItem[]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {data.map((item, i) => (
        <div key={i} className="bg-gray-50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
          <p className="text-2xl font-bold" style={{ color: item.color || '#1d4ed8' }}>{item.value}</p>
          {item.change && <p className="text-xs text-gray-400 mt-0.5">{item.change}</p>}
        </div>
      ))}
    </div>
  )
}

function BarPanel({ panel }: { panel: Panel }) {
  const data = panel.data as ChartItem[]
  const isVertical = panel.config?.vertical !== false && data.length > 4
  return (
    <ResponsiveContainer width="100%" height={220}>
      {isVertical ? (
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} width={80} />
          <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      ) : (
        <BarChart data={data} margin={{ top: 4, right: 20, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}

function PiePanel({ panel }: { panel: Panel }) {
  const data = (panel.data as ChartItem[]).filter(d => d.value > 0)
  const innerRadius = (panel.config?.innerRadius as number) ?? 50
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={innerRadius}
          outerRadius={innerRadius + 28}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function ListPanel({ panel }: { panel: Panel }) {
  const data = panel.data as ListItem[]
  return (
    <ul className="divide-y divide-gray-50">
      {data.map((item, i) => (
        <li key={i} className="flex items-center justify-between py-2.5 gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
            {item.subtitle && <p className="text-xs text-gray-400">{item.subtitle}</p>}
          </div>
          {item.badge && (
            <span
              className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: `${item.badgeColor || '#1d4ed8'}18`,
                color: item.badgeColor || '#1d4ed8',
              }}
            >
              {item.badge}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

function DashboardPanel({ panel }: { panel: Panel }) {
  const content = () => {
    switch (panel.type) {
      case 'stat': return <StatPanel panel={panel} />
      case 'bar':  return <BarPanel panel={panel} />
      case 'pie':  return <PiePanel panel={panel} />
      case 'list': return <ListPanel panel={panel} />
      default:     return null
    }
  }

  return (
    <Card className={WIDTH_CLASS[panel.width] ?? 'col-span-1'}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {panel.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-5">
        {content()}
      </CardContent>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AIDashboardPage() {
  const [county, setCounty] = useState('All Kenya')
  const [timeRange, setTimeRange] = useState('30d')
  const [focus, setFocus] = useState('comprehensive')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<DashboardConfig | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await apiClient.post<DashboardConfig>('/ai/dashboard/generate', {
        county,
        time_range: timeRange,
        focus,
      })
      setDashboard(r.data)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Failed to generate dashboard — check that ANTHROPIC_API_KEY is set in your .env'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-blue-600" />
          AI Dashboard Builder
        </h1>
        <p className="text-gray-400 mt-0.5 text-sm">
          Describe what you want to see — Claude generates a custom intelligence dashboard from your live data.
        </p>
      </div>

      {/* Parameter form */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {/* County */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                <MapPin className="w-3.5 h-3.5" /> Location
              </label>
              <select
                value={county}
                onChange={e => setCounty(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                {COUNTY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Time range */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                <Clock className="w-3.5 h-3.5" /> Time Range
              </label>
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                {TIME_RANGES.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Focus */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                <Target className="w-3.5 h-3.5" /> Intelligence Focus
              </label>
              <select
                value={focus}
                onChange={e => setFocus(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                {FOCUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {loading
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</>
              : <><Sparkles className="w-4 h-4" /> Generate Dashboard</>
            }
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-80 bg-gray-100 rounded animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Generated dashboard */}
      {!loading && dashboard && (
        <div className="space-y-5">
          {/* Dashboard header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{dashboard.title}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{dashboard.subtitle}</p>
            </div>
            <Badge variant="neutral" className="shrink-0 flex items-center gap-1 text-xs">
              <Sparkles className="w-3 h-3" /> AI Generated
            </Badge>
          </div>

          {/* Narrative */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1.5">
              Intelligence Briefing
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">{dashboard.narrative}</p>
          </div>

          {/* Panels grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {dashboard.panels.map(panel => (
              <DashboardPanel key={panel.id} panel={panel} />
            ))}
          </div>

          {/* Regenerate */}
          <div className="flex justify-end">
            <button
              onClick={generate}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !dashboard && !error && (
        <div className="text-center py-16 text-gray-400">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-gray-600">Select parameters and generate your dashboard</p>
          <p className="text-sm mt-1">Claude will analyse your live campaign data and build a custom intelligence view</p>
        </div>
      )}
    </div>
  )
}
