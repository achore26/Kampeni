import { useEffect, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react'
import { apiClient } from '../api/client'
import { KENYA_COUNTIES } from '../data/kenya-counties'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface CountyData {
  county: string
  painpoint_count: number
  top_issues: string[]
  sentiment_score: number
}

function getColor(count: number, max: number): string {
  if (max === 0 || count === 0) return '#e2e8f0'
  const intensity = count / max
  if (intensity > 0.7) return '#dc2626'
  if (intensity > 0.4) return '#f97316'
  if (intensity > 0.2) return '#eab308'
  return '#86efac'
}

function getRadius(count: number, max: number): number {
  if (max === 0 || count === 0) return 4
  return 4 + (count / max) * 16
}

export default function MapPage() {
  const [countyData, setCountyData] = useState<Record<string, CountyData>>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null)

  useEffect(() => {
    apiClient.get<CountyData[]>('/painpoints/by-county')
      .then(r => {
        const map: Record<string, CountyData> = {}
        ;(r.data ?? []).forEach(d => { map[d.county] = d })
        setCountyData(map)
      })
      .catch(() => {
        // Show map with no data — still useful for geography context
      })
      .finally(() => setLoading(false))
  }, [])

  const maxCount = Math.max(...Object.values(countyData).map(d => d.painpoint_count), 1)
  const selectedData = selected ? countyData[selected] : null

  const sortedCounties = KENYA_COUNTIES
    .map(c => ({ ...c, count: countyData[c.name]?.painpoint_count ?? 0 }))
    .sort((a, b) => b.count - a.count)

  const totalPainpoints = Object.values(countyData).reduce((s, d) => s + d.painpoint_count, 0)
  const countiesWithData = Object.keys(countyData).length
  const hotspot = sortedCounties[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ramani ya Malalamiko</h1>
        <p className="text-gray-500 mt-1">County-level painpoint intelligence across Kenya</p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Total Painpoints</p>
            <p className="text-2xl font-bold text-gray-900">{totalPainpoints}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Counties Tracked</p>
            <p className="text-2xl font-bold text-blue-600">{countiesWithData}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Hotspot</p>
            <p className="text-lg font-bold text-red-600 truncate">{hotspot?.count > 0 ? hotspot.name : '—'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Map */}
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Kenya Painpoint Heatmap
              </CardTitle>
              <CardDescription>Circle size and colour indicate painpoint intensity. Click a county for details.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Legend */}
              <div className="absolute top-3 right-3 z-10 bg-white border border-gray-100 rounded-lg shadow-sm px-3 py-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Intensity</p>
                <div className="space-y-1">
                  {[
                    { color: '#dc2626', label: 'Critical' },
                    { color: '#f97316', label: 'High' },
                    { color: '#eab308', label: 'Moderate' },
                    { color: '#86efac', label: 'Low' },
                    { color: '#e2e8f0', label: 'No data' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-[10px] text-gray-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ center: [37.9, 0.0], scale: 2200 }}
                style={{ width: '100%', height: 480, background: '#f8fafc' }}
              >
                <ZoomableGroup>
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies
                        .filter((geo) => geo.properties.name === 'Kenya')
                        .map((geo) => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="#e2e8f0"
                            stroke="#cbd5e1"
                            strokeWidth={0.5}
                            style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                          />
                        ))
                    }
                  </Geographies>

                  {KENYA_COUNTIES.map((county) => {
                    const data = countyData[county.name]
                    const count = data?.painpoint_count ?? 0
                    const color = getColor(count, maxCount)
                    const radius = getRadius(count, maxCount)
                    const isSelected = selected === county.name

                    return (
                      <Marker
                        key={county.name}
                        coordinates={county.coordinates}
                        onClick={() => setSelected(selected === county.name ? null : county.name)}
                        onMouseEnter={(e) => {
                          const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect()
                          if (rect) setTooltip({ name: county.name, x: e.clientX - rect.left, y: e.clientY - rect.top })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <circle
                          r={radius}
                          fill={color}
                          fillOpacity={0.85}
                          stroke={isSelected ? '#1d4ed8' : '#fff'}
                          strokeWidth={isSelected ? 2 : 0.8}
                          style={{ cursor: 'pointer', transition: 'r 0.2s' }}
                        />
                        {count > 0 && radius > 10 && (
                          <text
                            textAnchor="middle"
                            dy=".35em"
                            style={{ fontSize: 7, fill: '#fff', fontWeight: 700, pointerEvents: 'none' }}
                          >
                            {count}
                          </text>
                        )}
                      </Marker>
                    )
                  })}
                </ZoomableGroup>
              </ComposableMap>

              {/* Tooltip */}
              {tooltip && (
                <div
                  className="absolute z-20 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none"
                  style={{ left: tooltip.x + 12, top: tooltip.y - 12 }}
                >
                  <p className="font-semibold">{tooltip.name}</p>
                  <p className="text-gray-300">{countyData[tooltip.name]?.painpoint_count ?? 0} painpoints</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Selected county detail */}
          {selected && (
            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-blue-700">{selected}</CardTitle>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedData ? (
                  <>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-2xl font-black text-gray-900">{selectedData.painpoint_count}</span>
                      <span className="text-xs text-gray-500">painpoints</span>
                    </div>
                    {selectedData.top_issues?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Top Issues</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedData.top_issues.slice(0, 5).map(issue => (
                            <Badge key={issue} variant="neutral" className="text-xs">{issue}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{
                          background: selectedData.sentiment_score > 0 ? '#16a34a' : selectedData.sentiment_score < 0 ? '#dc2626' : '#9ca3af'
                        }} />
                        <span className="text-xs text-gray-500">
                          Sentiment: {selectedData.sentiment_score > 0 ? 'Positive' : selectedData.sentiment_score < 0 ? 'Negative' : 'Neutral'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic">No data yet for {selected} — monitoring active.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top counties ranking */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                Hotspot Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sortedCounties.filter(c => c.count > 0).length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">
                  No data yet — painpoints will appear as data is ingested
                </p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {sortedCounties.filter(c => c.count > 0).slice(0, 10).map((county, i) => (
                    <li key={county.name}>
                      <button
                        onClick={() => setSelected(county.name === selected ? null : county.name)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${selected === county.name ? 'bg-blue-50' : ''}`}
                      >
                        <span className="text-xs font-bold text-gray-300 w-4">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{county.name}</p>
                          <p className="text-xs text-gray-400">{county.region}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold" style={{ color: getColor(county.count, maxCount) }}>
                            {county.count}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
