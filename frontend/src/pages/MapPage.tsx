import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react'
import { apiClient } from '../api/client'

/* ── Ward coordinates (Nairobi) ─────────────────────────────────────────── */
const WARD_COORDS: Record<string, [number, number]> = {
  'Kayole Central':    [-1.2636, 36.9018],
  'Kayole':            [-1.2636, 36.9018],
  'Embakasi East':     [-1.3192, 36.9102],
  'Eastlands':         [-1.2950, 36.8650],
  'Pumwani':           [-1.2744, 36.8455],
  'Korogocho':         [-1.2494, 36.8838],
  'South B':           [-1.3078, 36.8333],
  'Kilimani':          [-1.2933, 36.7875],
  'Mukuru kwa Njenga': [-1.3236, 36.8694],
  'Mukuru Kwa Njenga': [-1.3236, 36.8694],
  'Nairobi Central':   [-1.2833, 36.8167],
  'Nairobi CBD':       [-1.2833, 36.8167],
  'Ruai':              [-1.2812, 37.0091],
  'Mathare':           [-1.2592, 36.8565],
  'Mathare North':     [-1.2520, 36.8620],
  'Westlands':         [-1.2637, 36.8030],
  'Kibra':             [-1.3121, 36.7874],
  'Kasarani':          [-1.2230, 36.8988],
  'Langata':           [-1.3438, 36.7596],
  'Starehe':           [-1.2800, 36.8260],
  'Makadara':          [-1.3010, 36.8550],
  'Roysambu':          [-1.2070, 36.8820],
  'Dagoretti North':   [-1.2980, 36.7550],
  'Multiple':          [-1.2921, 36.8219],
  'Multiple wards':    [-1.2921, 36.8219],
}

const NAIROBI: [number, number] = [-1.2921, 36.8219]

const SEVERITY_COLOR: Record<string, string> = {
  high: '#dc2626', medium: '#f97316', low: '#16a34a',
}
const SEVERITY_RADIUS: Record<string, number> = {
  high: 18, medium: 13, low: 9,
}

interface PainPoint {
  id: string; category: string; description: string
  severity: 'high' | 'medium' | 'low'; location: string | null
  county: string | null; constituency: string | null
  confidence: number; created_at: string
}

/* ── Pure-Leaflet map component (no react-leaflet) ───────────────────────── */
function LeafletMap({ painPoints, onSelect }: {
  painPoints: PainPoint[]
  onSelect: (pp: PainPoint) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Dynamically import Leaflet so Vite doesn't SSR-crash on window
    import('leaflet').then(L => {
      const map = L.map(containerRef.current!, {
        center: NAIROBI,
        zoom: 12,
        zoomControl: true,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      painPoints.forEach(pp => {
        const coords = WARD_COORDS[pp.location ?? '']
        if (!coords) return
        const color = SEVERITY_COLOR[pp.severity]
        const radius = SEVERITY_RADIUS[pp.severity]

        const circle = L.circleMarker(coords, {
          radius,
          fillColor: color,
          fillOpacity: 0.85,
          color: '#fff',
          weight: 2,
        })

        circle.bindPopup(`
          <div style="min-width:200px;font-family:system-ui">
            <span style="background:${color};color:#fff;font-size:10px;font-weight:700;
              padding:2px 8px;border-radius:99px;text-transform:uppercase;
              letter-spacing:0.08em">${pp.severity}</span>
            <span style="font-size:11px;color:#6b7280;font-weight:600;margin-left:6px">${pp.category}</span>
            <p style="font-size:13px;color:#111827;font-weight:600;margin:6px 0 4px;line-height:1.4">
              ${pp.description}
            </p>
            <p style="font-size:11px;color:#9ca3af;margin:2px 0">
              📍 ${pp.location ?? ''}${pp.constituency ? ' · ' + pp.constituency : ''}
            </p>
            <p style="font-size:11px;color:#9ca3af">
              Confidence: ${Math.round(pp.confidence * 100)}%
            </p>
          </div>
        `)

        circle.on('click', () => onSelect(pp))
        circle.addTo(map)
      })
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [painPoints])

  const resetView = () => {
    if (mapRef.current) mapRef.current.flyTo(NAIROBI, 12, { duration: 1.0 })
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ height: 520, width: '100%' }} />
      <button
        onClick={resetView}
        style={{
          position: 'absolute', bottom: 12, right: 12, zIndex: 1000,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
          padding: '6px 12px', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        Reset view
      </button>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function MapPage() {
  const [painPoints, setPainPoints] = useState<PainPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PainPoint | null>(null)

  useEffect(() => {
    apiClient.get<{ items: PainPoint[] }>('/painpoints/?limit=50')
      .then(r => setPainPoints(r.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const mapped = painPoints.filter(p => WARD_COORDS[p.location ?? ''])
  const highCount = painPoints.filter(p => p.severity === 'high').length

  const wardCounts = painPoints.reduce<Record<string, { count: number; sev: string }>>((acc, pp) => {
    const loc = pp.location ?? 'Unknown'
    if (!acc[loc]) acc[loc] = { count: 0, sev: pp.severity }
    acc[loc].count++
    if (pp.severity === 'high') acc[loc].sev = 'high'
    return acc
  }, {})

  const categoryCounts = painPoints.reduce<Record<string, number>>((acc, pp) => {
    acc[pp.category] = (acc[pp.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ramani ya Malalamiko</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Scroll to zoom · Click a marker for details · Drag to pan
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Total Painpoints</p>
            <p className="text-2xl font-bold text-gray-900">{painPoints.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Critical (High)</p>
            <p className="text-2xl font-bold text-red-600">{highCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Wards Mapped</p>
            <p className="text-2xl font-bold text-blue-600">{mapped.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4 items-start">

        {/* Map */}
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-0 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Nairobi — Pain Point Heatmap
              </CardTitle>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-2">
                {Object.entries(SEVERITY_COLOR).map(([sev, color]) => (
                  <div key={sev} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-xs text-gray-500 capitalize">{sev}</span>
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0 mt-3">
              {loading ? (
                <div className="flex items-center justify-center bg-gray-50" style={{ height: 520 }}>
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <LeafletMap painPoints={painPoints} onSelect={setSelected} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">

          {/* Selected detail */}
          {selected && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-start justify-between">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                    style={{ background: SEVERITY_COLOR[selected.severity] }}
                  >
                    {selected.severity}
                  </span>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">{selected.category}</p>
                <p className="text-sm font-medium text-gray-900 leading-snug">{selected.description}</p>
                <div className="pt-2 space-y-1 border-t border-blue-100 text-xs text-gray-500">
                  <p><span className="font-semibold">Ward:</span> {selected.location}</p>
                  {selected.constituency && <p><span className="font-semibold">Constituency:</span> {selected.constituency}</p>}
                  <p><span className="font-semibold">Confidence:</span> {Math.round(selected.confidence * 100)}%</p>
                  <p className="text-gray-400">{new Date(selected.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hotspot ranking */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                Hotspot Wards
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="space-y-2">
                {Object.entries(wardCounts)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .slice(0, 8)
                  .map(([ward, { count, sev }], i) => (
                    <li key={ward} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-300 w-4">#{i + 1}</span>
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[sev] }} />
                      <span className="text-xs text-gray-700 flex-1 truncate font-medium">{ward}</span>
                      <span className="text-xs font-bold text-gray-500">{count}</span>
                    </li>
                  ))
                }
              </ul>
            </CardContent>
          </Card>

          {/* Category breakdown */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                By Category
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="space-y-1.5">
                {Object.entries(categoryCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <li key={cat} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{cat}</span>
                      <Badge variant="neutral" className="text-xs">{count}</Badge>
                    </li>
                  ))
                }
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
