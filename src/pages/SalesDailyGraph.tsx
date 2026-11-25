import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'
import { adminApiService, DailySalesTotal, SalesPageParams, Station } from '../services/api'

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const shortDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const longDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const compact = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

// 1-2-5 step so the axis ends on round numbers
const niceScale = (max: number, ticks = 4) => {
  if (max <= 0) return { top: 1, step: 0.25 }
  const raw = max / ticks
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / pow
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow
  return { top: Math.ceil(max / step) * step, step }
}

interface BarChartProps {
  title: string
  data: { date: string; value: number }[]
  formatValue: (n: number) => string
  formatAxis?: (n: number) => string
  unit?: string
}

const BarChart: React.FC<BarChartProps> = ({ title, data, formatValue, formatAxis = compact, unit }) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => setWidth(Math.max(320, entries[0].contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const height = 480
  const m = { top: 16, right: 16, bottom: 34, left: 60 }
  const innerW = width - m.left - m.right
  const innerH = height - m.top - m.bottom
  const max = Math.max(0, ...data.map(d => d.value))
  const { top, step } = niceScale(max)
  const band = data.length ? innerW / data.length : innerW
  const barW = Math.min(56, Math.max(2, band * 0.7))
  const yOf = (v: number) => m.top + innerH - (v / top) * innerH
  const gridValues = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  // keep x labels from colliding: roughly one per 56px
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(innerW / 64))))

  const hovered = hover !== null ? data[hover] : null
  const tipLeft = hover !== null ? Math.min(Math.max(m.left + band * hover + band / 2, 70), width - 70) : 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <h2 className="text-[11px] font-semibold text-gray-700 mb-1">{title}</h2>
      <div ref={wrapRef} className="relative">
        <svg width={width} height={height} role="img" aria-label={`${title} by day`}>
          {gridValues.map(v => (
            <g key={v}>
              <line x1={m.left} x2={width - m.right} y1={yOf(v)} y2={yOf(v)} stroke="#e5e7eb" strokeWidth={1} />
              <text x={m.left - 6} y={yOf(v) + 3} textAnchor="end" fontSize={12} fill="#6b7280">{formatAxis(v)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = m.left + band * i + (band - barW) / 2
            const y = yOf(d.value)
            const h = Math.max(0, m.top + innerH - y)
            const r = Math.min(4, barW / 2, h)
            return (
              <g key={d.date}>
                {/* wider invisible hit target than the mark */}
                <rect x={m.left + band * i} y={m.top} width={band} height={innerH} fill="transparent"
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
                {h > 0 && (
                  <path
                    d={`M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${y + h} Z`}
                    fill="#2563eb" opacity={hover === null || hover === i ? 1 : 0.45} pointerEvents="none" />
                )}
                {i % labelEvery === 0 && (
                  <text x={x + barW / 2} y={height - 10} textAnchor="middle" fontSize={12} fill="#6b7280">{shortDay(d.date)}</text>
                )}
              </g>
            )
          })}
          <line x1={m.left} x2={width - m.right} y1={m.top + innerH} y2={m.top + innerH} stroke="#9ca3af" strokeWidth={1} />
        </svg>
        {hovered && (
          <div className="absolute pointer-events-none -translate-x-1/2 bg-gray-900 text-white rounded-md px-2 py-1 text-[11px] shadow-lg whitespace-nowrap"
            style={{ left: tipLeft, top: 0 }}>
            <div className="text-gray-300">{longDay(hovered.date)}</div>
            <div className="font-semibold">{formatValue(hovered.value)}{unit ? ` ${unit}` : ''}</div>
          </div>
        )}
      </div>
    </div>
  )
}

const SalesDailyGraph: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initial = useMemo(() => {
    const fromParam = searchParams.get('startDate')
    return {
      month: fromParam ? fromParam.slice(0, 7) : fmtDate(new Date()).slice(0, 7),
      shift: '', // always open on all shifts, whatever shift the report was showing
      stationId: searchParams.get('stationId') || '',
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [month, setMonth] = useState(initial.month)
  const [metric, setMetric] = useState<'totalRevenue' | 'totalQuantity' | 'totalSales'>('totalRevenue')
  // The whole calendar month, first day to last day
  const { startDate, endDate } = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    return { startDate: fmtDate(new Date(y, m - 1, 1)), endDate: fmtDate(new Date(y, m, 0)) }
  }, [month])
  const shiftMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number)
    setMonth(fmtDate(new Date(y, m - 1 + delta, 1)).slice(0, 7))
  }
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const [shift, setShift] = useState<string>(initial.shift)
  const [stationId, setStationId] = useState(initial.stationId)
  const [stations, setStations] = useState<Station[]>([])
  const [days, setDays] = useState<DailySalesTotal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Client/search filters carried over from the Sales Report; shown as read-only context
  const clientId = searchParams.get('conversionClientId') || undefined
  const keyAccountId = searchParams.get('keyAccountId') || undefined
  const search = searchParams.get('search') || undefined

  useEffect(() => {
    adminApiService.getStations().then(s => setStations(Array.isArray(s) ? s : [])).catch(() => setStations([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    const params: SalesPageParams = {
      startDate,
      endDate,
      shift: shift === 'shift1' || shift === 'shift2' ? shift : undefined,
      stationId: stationId ? Number(stationId) : undefined,
      conversionClientId: clientId ? Number(clientId) : undefined,
      keyAccountId: keyAccountId ? Number(keyAccountId) : undefined,
      search,
    }
    setLoading(true)
    setError('')
    adminApiService.getDailySalesTotals(params)
      .then(rows => { if (!cancelled) setDays(rows) })
      .catch(e => { if (!cancelled) { setDays([]); setError(e?.message || 'Failed to load') } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [startDate, endDate, shift, stationId, clientId, keyAccountId, search])

  // Fill days with no sales so gaps show as zero instead of being skipped
  const series = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return days
    const byDate = new Map(days.map(d => [d.date, d]))
    const out: DailySalesTotal[] = []
    const cur = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)
    for (let guard = 0; cur <= end && guard < 800; guard++) {
      const key = fmtDate(cur)
      out.push(byDate.get(key) ?? { date: key, totalSales: 0, totalQuantity: 0, totalRevenue: 0 })
      cur.setDate(cur.getDate() + 1)
    }
    return out
  }, [days, startDate, endDate])

  const totals = useMemo(() => series.reduce(
    (a, d) => ({ sales: a.sales + d.totalSales, qty: a.qty + d.totalQuantity, rev: a.rev + d.totalRevenue }),
    { sales: 0, qty: 0, rev: 0 },
  ), [series])

  const input = 'px-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white'

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-full mx-auto space-y-2">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/sales/report')} className="p-1 text-gray-600 hover:text-gray-800" title="Back to Sales Report">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-bold text-gray-900">Daily Sales Graph</h1>
          <span className="text-[10px] text-gray-400">A day runs 7am – 7am</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Month</label>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => shiftMonth(-1)} className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100" title="Previous month">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <input type="month" value={month} onChange={e => e.target.value && setMonth(e.target.value)} className={input} />
              <button type="button" onClick={() => shiftMonth(1)} className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100" title="Next month">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Station</label>
            <div className="relative">
              <MapPin className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              <select value={stationId} onChange={e => setStationId(e.target.value)} className={`${input} w-full pl-5`}>
                <option value="">All Stations</option>
                {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Shift</label>
            <div className="relative">
              <Clock className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              <select value={shift} onChange={e => setShift(e.target.value)} className={`${input} pl-5`}>
                <option value="">All Day</option>
                <option value="shift1">Shift 1 (7am – 7pm)</option>
                <option value="shift2">Shift 2 (7pm – 7am)</option>
              </select>
            </div>
          </div>
          {(clientId || keyAccountId || search) && (
            <span className="text-[10px] text-gray-500 pb-1.5">
              Also filtered by {[clientId || keyAccountId ? 'client' : null, search ? `“${search}”` : null].filter(Boolean).join(' and ')} from the report
            </span>
          )}
        </div>

        {error ? (
          <div className="bg-white rounded-lg border border-red-200 p-6 text-center text-[11px] text-red-600">{error}</div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Total sales', String(totals.sales)],
                ['Total quantity', `${money(totals.qty)} L`],
                ['Total revenue', money(totals.rev)],
              ].map(([label, value]) => (
                <div key={label} className="bg-white rounded-lg border border-gray-200 p-2.5">
                  <div className="text-[10px] text-gray-500 font-medium">{label}</div>
                  <div className="text-sm font-bold text-gray-900">{value}</div>
                </div>
              ))}
            </div>

            {totals.sales === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-[11px] text-gray-500">
                No sales in this period
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-1 p-1 bg-gray-200 rounded-lg w-fit">
                  {([
                    ['totalRevenue', 'Revenue'],
                    ['totalQuantity', 'Quantity (L)'],
                    ['totalSales', 'No. of sales'],
                  ] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setMetric(key)}
                      className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors ${
                        metric === key ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-white'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
                <BarChart
                  title={`${metric === 'totalRevenue' ? 'Revenue' : metric === 'totalQuantity' ? 'Quantity (litres)' : 'Number of sales'} per day — ${monthLabel}`}
                  data={series.map(d => ({ date: d.date, value: d[metric] }))}
                  formatValue={metric === 'totalSales' ? n => String(n) : money}
                  unit={metric === 'totalQuantity' ? 'L' : undefined}
                />
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-2 py-1.5 border-b text-[11px] font-semibold text-gray-700">Daily breakdown</div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Day</th>
                      <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Sales</th>
                      <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Quantity (L)</th>
                      <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...series].reverse().map(d => (
                      <tr key={d.date} className="hover:bg-gray-50">
                        <td className="px-2 py-1 text-[11px]">{longDay(d.date)}</td>
                        <td className="px-2 py-1 text-[11px] text-right">{d.totalSales}</td>
                        <td className="px-2 py-1 text-[11px] text-right">{money(d.totalQuantity)}</td>
                        <td className="px-2 py-1 text-[11px] text-right font-medium text-purple-600">{money(d.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SalesDailyGraph
