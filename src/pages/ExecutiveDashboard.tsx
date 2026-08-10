import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { adminApiService, Sale, Station } from '../services/api'
import {
  Users,
  Warehouse,
  BarChart3,
  Calculator,
  Wrench,
  FileText,
  Calendar as CalendarIcon,
  LayoutDashboard,
  Car,
  Package,
  Store,
  UserCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Bell,
  Activity,
  Star,
  PieChart,
  Megaphone,
  MapPin,
  CalendarCheck,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Fuel,
} from 'lucide-react'

const money = (n: number) => `Ksh ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

function compactMoney(n: number) {
  if (Math.abs(n) >= 1_000_000) return `Ksh ${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `Ksh ${(n / 1_000).toFixed(1)}K`
  return money(n)
}

// Bare compact number — keeps the volume axis to a few characters wide.
function compactNumber(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return Math.round(n).toString()
}

// Fixed categorical order (never cycled/reassigned by rank) — 5 station slots + a gray "Other" fold.
const STATION_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#06b6d4', '#9ca3af']
const MAX_STATION_SEGMENTS = 5

interface ModuleTile {
  name: string
  icon: React.ComponentType<{ className?: string }>
  route: string
  color: string
  bgColor: string
  badge?: string
  disabled?: boolean
}

// Identical to Dashboard.tsx's module grid — same tiles, same icons, same routes.
const MODULES: ModuleTile[] = [
  { name: 'Clients', icon: Users, route: '/clients', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: undefined },
  { name: 'Vehicles', icon: Car, route: '/vehicles', color: 'text-indigo-700', bgColor: 'bg-indigo-500', badge: undefined },
  { name: 'Parts', icon: Package, route: '/parts', color: 'text-amber-700', bgColor: 'bg-amber-500', badge: undefined },
  { name: 'Stores', icon: Store, route: '/stores', color: 'text-emerald-700', bgColor: 'bg-emerald-500', badge: undefined },
  { name: 'Inventory', icon: Warehouse, route: '/inventory', color: 'text-green-700', bgColor: 'bg-green-500', badge: undefined },
  { name: 'LPG Stock', icon: Fuel, route: '/inventory/lpg', color: 'text-orange-700', bgColor: 'bg-orange-500', badge: undefined },
  { name: 'Employees', icon: UserCheck, route: '/employees', color: 'text-teal-700', bgColor: 'bg-teal-500', badge: undefined },
  { name: 'Sales Report', icon: BarChart3, route: '/sales/report', color: 'text-pink-700', bgColor: 'bg-pink-500', badge: undefined },
  { name: 'Conversion', icon: Wrench, route: '/conversion', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined },
  { name: 'Accounting', icon: Calculator, route: '/accounts', color: 'text-indigo-700', bgColor: 'bg-indigo-500', badge: undefined },
  { name: 'Payments', icon: CreditCard, route: '/sales/report', color: 'text-amber-700', bgColor: 'bg-amber-500', badge: undefined },
  { name: 'Inspection Checklist', icon: CheckCircle2, route: '/checklist-templates', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined },
  { name: 'Calendar', icon: CalendarIcon, route: '/calendar', color: 'text-teal-700', bgColor: 'bg-teal-500', badge: undefined },
  { name: 'Notice Board', icon: Bell, route: '/notices', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: undefined },
  { name: 'OBD Scanner', icon: Activity, route: '/dashboard', color: 'text-orange-700', bgColor: 'bg-orange-500', badge: undefined, disabled: true },
  { name: 'Labor Guides', icon: FileText, route: '/notices', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined },
  { name: 'HR', icon: Clock, route: '/staff', color: 'text-red-700', bgColor: 'bg-red-500', badge: undefined },
  { name: 'Attendance', icon: MapPin, route: '/attendance', color: 'text-cyan-700', bgColor: 'bg-cyan-500', badge: undefined },
  { name: 'Working Days', icon: CalendarCheck, route: '/working-days', color: 'text-lime-700', bgColor: 'bg-lime-500', badge: undefined },
  { name: 'Financing', icon: PieChart, route: '/sales/report', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined, disabled: true },
  { name: 'Marketing', icon: Megaphone, route: '/dashboard', color: 'text-teal-700', bgColor: 'bg-teal-500', badge: undefined },
  { name: 'Reviews', icon: Star, route: '/dashboard', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: 'NEW' },
  { name: 'Dashboard', icon: LayoutDashboard, route: '/dashboard', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: undefined },
]

const ExecutiveDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [sales, setSales] = useState<Sale[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)

  const [stationDatePreset, setStationDatePreset] = useState<'this_month' | 'last_month' | 'last_30' | 'last_90' | 'custom'>('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Only the executive role may view this dashboard — bounce everyone else back.
  useEffect(() => {
    if (!authLoading && user && user.role?.toLowerCase() !== 'executive') {
      navigate('/dashboard', { replace: true })
    }
  }, [authLoading, user, navigate])

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      adminApiService.getSales(),
      adminApiService.getStations(),
    ])
      .then(([sl, st]) => {
        setSales(Array.isArray(sl) ? sl : [])
        setStations(Array.isArray(st) ? st : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleModuleClick = (module: ModuleTile) => {
    if (module.disabled) return
    navigate(module.route)
  }

  const stationDateRange = useMemo(() => {
    const now = new Date()
    let start: Date
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    if (stationDatePreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (stationDatePreset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    } else if (stationDatePreset === 'last_30') {
      start = new Date(now)
      start.setDate(start.getDate() - 29)
    } else if (stationDatePreset === 'last_90') {
      start = new Date(now)
      start.setDate(start.getDate() - 89)
    } else {
      start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1)
      end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : end
    }
    return { start, end }
  }, [stationDatePreset, customStart, customEnd])

  const stationDateRangeLabel = useMemo(() => {
    if (stationDatePreset === 'this_month') return new Date().toLocaleString(undefined, { month: 'long', year: 'numeric' })
    if (stationDatePreset === 'last_month') {
      const d = new Date()
      d.setMonth(d.getMonth() - 1)
      return d.toLocaleString(undefined, { month: 'long', year: 'numeric' })
    }
    if (stationDatePreset === 'last_30') return 'Last 30 days'
    if (stationDatePreset === 'last_90') return 'Last 90 days'
    return `${stationDateRange.start.toLocaleDateString()} – ${stationDateRange.end.toLocaleDateString()}`
  }, [stationDatePreset, stationDateRange])

  // Revenue contribution per station for the selected date range — same revenue definition
  // as /sales/report (sale.totalAmount). Capped at MAX_STATION_SEGMENTS slices + a folded "Other"
  // to respect the pie/donut ≤6-segment rule.
  const stationRevenue = useMemo(() => {
    const rangeSales = sales.filter(s => {
      const d = new Date(s.saleDate)
      return d >= stationDateRange.start && d <= stationDateRange.end
    })
    const byStation = new Map<number, number>()
    for (const s of rangeSales) {
      byStation.set(s.stationId, (byStation.get(s.stationId) || 0) + Number(s.totalAmount))
    }
    const rows = Array.from(byStation.entries())
      .map(([stationId, total]) => ({
        name: stations.find(st => st.id === stationId)?.name || `Station #${stationId}`,
        total,
      }))
      .sort((a, b) => b.total - a.total)

    if (rows.length <= MAX_STATION_SEGMENTS + 1) return rows
    const top = rows.slice(0, MAX_STATION_SEGMENTS)
    const otherTotal = rows.slice(MAX_STATION_SEGMENTS).reduce((sum, r) => sum + r.total, 0)
    return [...top, { name: 'Other', total: otherTotal }]
  }, [sales, stations, stationDateRange])

  const stationRevenueTotal = stationRevenue.reduce((sum, r) => sum + r.total, 0)

  const donutSegments = useMemo(() => {
    let cumulative = 0
    return stationRevenue.map((r, i) => {
      const fraction = stationRevenueTotal > 0 ? r.total / stationRevenueTotal : 0
      const start = cumulative
      cumulative += fraction
      return { ...r, fraction, start, color: STATION_COLORS[i] || '#9ca3af' }
    })
  }, [stationRevenue, stationRevenueTotal])

  // Same revenue definition and client attribution as /sales/report — a sale belongs to either a
  // conversion client or a key account, and the two id spaces are namespaced so they can't collide.
  const topClients = useMemo(() => {
    const byClient = new Map<string, { name: string; total: number }>()
    for (const s of sales) {
      let key: string | null = null
      let name = 'Unknown client'
      if (s.conversionClientId) {
        key = `cc-${s.conversionClientId}`
        name = s.conversionClient?.name || name
      } else if (s.keyAccountId) {
        key = `ka-${s.keyAccountId}`
        name = s.keyAccount?.name || name
      }
      if (!key) continue
      const entry = byClient.get(key) || { name, total: 0 }
      entry.total += Number(s.totalAmount)
      byClient.set(key, entry)
    }
    return Array.from(byClient.values()).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [sales])

// Same window and shape as the /sales/report page — revenue = sale.totalAmount, vehicles = unique
  // vehicleId/conversionVehicleId (namespaced so the two independent id spaces can't collide), both keyed by saleDate's month.
  const monthlyRevenue = useMemo(() => {
    const now = new Date()
    const months: { key: string; label: string }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString(undefined, { month: 'short' }) })
    }
    const revenueByMonth = new Map<string, number>()
    const volumeByMonth = new Map<string, number>()
    const vehiclesByMonth = new Map<string, Set<string>>()
    for (const s of sales) {
      const d = new Date(s.saleDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + Number(s.totalAmount))
      volumeByMonth.set(key, (volumeByMonth.get(key) || 0) + Number(s.quantity))
      const vehicleKey = s.vehicleId ? `v-${s.vehicleId}` : s.conversionVehicleId ? `cv-${s.conversionVehicleId}` : null
      if (vehicleKey) {
        if (!vehiclesByMonth.has(key)) vehiclesByMonth.set(key, new Set())
        vehiclesByMonth.get(key)!.add(vehicleKey)
      }
    }
    return months.map(m => ({
      label: m.label,
      value: revenueByMonth.get(m.key) || 0,
      volume: volumeByMonth.get(m.key) || 0,
      vehicles: vehiclesByMonth.get(m.key)?.size || 0,
    }))
  }, [sales])

  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map(m => m.value), 1)
  // Volume rides its own scale — litres and shillings differ by orders of magnitude,
  // so a shared axis would flatten the volume line onto the floor.
  const maxMonthlyVolume = Math.max(...monthlyRevenue.map(m => m.volume), 1)

  // Same "unique vehicles" logic as /sales/report — vehicleId and conversionVehicleId are
  // independent id spaces, so they're namespaced to avoid a false collision between them.
  const vehiclesServedCount = useMemo(() => {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const ids = new Set<string>()
    for (const s of sales) {
      if (new Date(s.saleDate) < sixMonthsAgo) continue
      if (s.vehicleId) ids.add(`v-${s.vehicleId}`)
      else if (s.conversionVehicleId) ids.add(`cv-${s.conversionVehicleId}`)
    }
    return ids.size
  }, [sales])

  const revenueDelta = useMemo(() => {
    if (monthlyRevenue.length < 2) return null
    const curr = monthlyRevenue[monthlyRevenue.length - 1].value
    const prev = monthlyRevenue[monthlyRevenue.length - 2].value
    if (prev === 0) return null
    return Math.round(((curr - prev) / prev) * 100)
  }, [monthlyRevenue])

  const CHART_HEIGHT = 220
  // Two hues far enough apart to read at a glance, each also colouring its own axis.
  // Volume is a saturated cyan rather than a pale blue — a light tint reads as
  // secondary and disappears against the gridlines.
  const REVENUE_COLOR = '#6d28d9'
  const VOLUME_COLOR = '#0891b2'
  const chartPoints = monthlyRevenue.map((m, i) => {
    const x = monthlyRevenue.length > 1 ? (i / (monthlyRevenue.length - 1)) * 100 : 50
    const y = CHART_HEIGHT - Math.max((m.value / maxMonthlyRevenue) * CHART_HEIGHT, m.value > 0 ? 4 : 0)
    const volumeY = CHART_HEIGHT - Math.max((m.volume / maxMonthlyVolume) * CHART_HEIGHT, m.volume > 0 ? 4 : 0)
    return { ...m, x, y, volumeY }
  })
  // Smooth curve: cubic bezier between each pair, control points offset horizontally to the
  // midpoint (y pinned to each endpoint) — a simple, overshoot-free interpolation with no library.
  const smoothLinePath = chartPoints.length
    ? chartPoints.slice(1).reduce((d, p, i) => {
        const prev = chartPoints[i]
        const midX = (prev.x + p.x) / 2
        return `${d} C ${midX} ${prev.y}, ${midX} ${p.y}, ${p.x} ${p.y}`
      }, `M ${chartPoints[0].x} ${chartPoints[0].y}`)
    : ''
  const smoothAreaPath = chartPoints.length
    ? `${smoothLinePath} L ${chartPoints[chartPoints.length - 1].x} ${CHART_HEIGHT} L ${chartPoints[0].x} ${CHART_HEIGHT} Z`
    : ''

  const smoothVolumePath = chartPoints.length
    ? chartPoints.slice(1).reduce((d, p, i) => {
        const prev = chartPoints[i]
        const midX = (prev.x + p.x) / 2
        return `${d} C ${midX} ${prev.volumeY}, ${midX} ${p.volumeY}, ${p.x} ${p.volumeY}`
      }, `M ${chartPoints[0].x} ${chartPoints[0].volumeY}`)
    : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 -m-4 p-6">
      <div className="space-y-6 w-full">

        {/* ── Navigation Pills ── */}
        <div className="flex items-center gap-2 flex-wrap bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-sm">
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-xs font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg">
            Overview
          </button>
          <div className="flex-1"></div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-white text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 transition-all border border-gray-200 hover:border-gray-300 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── Module Grid (identical to the operations Dashboard) ── */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {MODULES.map((module, index) => {
            const Icon = module.icon
            const colorName = module.bgColor.split('-')[1]
            return (
              <div
                key={index}
                onClick={() => handleModuleClick(module)}
                title={module.disabled ? 'Coming soon' : undefined}
                className={`relative bg-white rounded-lg shadow transition-all duration-300 group overflow-hidden border-2 transform ${
                  module.disabled
                    ? 'opacity-50 grayscale cursor-not-allowed border-gray-200'
                    : `hover:shadow-xl cursor-pointer hover:-translate-y-1 border-${colorName}-200 hover:border-${colorName}-300`
                }`}
              >
                <div className={`absolute inset-0 ${module.bgColor} opacity-15 ${module.disabled ? '' : 'group-hover:opacity-25'} transition-opacity duration-300`}></div>
                <div className="relative p-2 flex flex-col items-center justify-center min-h-[84px]">
                  {module.disabled ? (
                    <div className="absolute top-1 right-1 bg-gray-400 text-white text-[6px] font-bold px-1 py-0.5 rounded-full shadow z-10">
                      SOON
                    </div>
                  ) : module.badge && (
                    <div className="absolute top-1 right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow-lg z-10 animate-pulse">
                      {module.badge}
                    </div>
                  )}
                  <div className={`${module.bgColor} p-2 rounded-lg mb-1 ${module.disabled ? '' : 'group-hover:scale-110'} transition-transform duration-300 shadow-lg`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h3 className="text-[9px] font-bold text-gray-900 text-center group-hover:text-gray-900 leading-tight">
                    {module.name}
                  </h3>
                </div>
              </div>
            )
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* ── Revenue trend ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Monthly Revenue</h2>
                  <p className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                    {revenueDelta !== null && (
                      <span className={`flex items-center gap-0.5 font-semibold ${revenueDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {revenueDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {revenueDelta >= 0 ? '+' : ''}{revenueDelta}% vs last month
                      </span>
                    )}
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {vehiclesServedCount.toLocaleString()} vehicles served
                    </span>
                  </p>
                </div>
              </div>

              {/* Series captions sit above their own axis — each colour names its scale,
                  so no separate legend is needed. */}
              <div className="flex items-baseline justify-between mt-5 mb-1.5">
                <span className="text-[11px] font-medium" style={{ color: REVENUE_COLOR }}>Revenue</span>
                <span className="text-[11px] font-semibold" style={{ color: VOLUME_COLOR }}>Volume (L)</span>
              </div>

              <div className="flex gap-2">
                {/* Revenue axis */}
                <div
                  className="flex flex-col justify-between text-[10px] text-right shrink-0"
                  style={{ height: CHART_HEIGHT, color: REVENUE_COLOR }}
                >
                  {[4, 3, 2, 1, 0].map(step => (
                    <span key={step} className="leading-none">{compactMoney((maxMonthlyRevenue * step) / 4)}</span>
                  ))}
                </div>

                {/* Chart area */}
                <div className="flex-1 min-w-0">
                  <div className="relative" style={{ height: CHART_HEIGHT }}>
                    {/* Gridlines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="border-t border-gray-100 w-full" />
                      ))}
                    </div>

                    <svg
                      className="absolute inset-0 w-full h-full overflow-visible"
                      viewBox={`0 0 100 ${CHART_HEIGHT}`}
                      preserveAspectRatio="none"
                    >
                      <path
                        d={smoothLinePath}
                        fill="none"
                        stroke={REVENUE_COLOR}
                        strokeWidth={1.75}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d={smoothVolumePath}
                        fill="none"
                        stroke={VOLUME_COLOR}
                        strokeWidth={2.25}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>

                    {/* Invisible hover columns — the reference draws bare lines, so the dots are
                        gone, but each month still needs a target for its tooltip. */}
                    {chartPoints.map((p, i) => (
                      <div
                        key={p.label + i}
                        className="absolute group top-0 h-full"
                        style={{
                          left: `${p.x}%`,
                          width: `${100 / Math.max(chartPoints.length, 1)}%`,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <div className="w-full h-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute inset-y-0 left-1/2 w-px bg-gray-200" />
                          <div
                            className="absolute w-1.5 h-1.5 rounded-full left-1/2"
                            style={{ top: p.y, backgroundColor: REVENUE_COLOR, transform: 'translate(-50%, -50%)' }}
                          />
                          <div
                            className="absolute w-1.5 h-1.5 rounded-full left-1/2"
                            style={{ top: p.volumeY, backgroundColor: VOLUME_COLOR, transform: 'translate(-50%, -50%)' }}
                          />
                        </div>
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-gray-900 text-white text-[10px] font-medium whitespace-nowrap pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-gray-400">{p.label}</div>
                          <div style={{ color: '#c4b5fd' }}>{money(p.value)}</div>
                          <div style={{ color: '#67e8f9' }}>
                            {p.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })} L
                          </div>
                          <div className="text-gray-400">{p.vehicles} vehicle{p.vehicles === 1 ? '' : 's'}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Month labels — positioned at the same x as their point, not evenly split */}
                  <div className="relative mt-2" style={{ height: 14 }}>
                    {chartPoints.map((p, i) => {
                      const isFirst = i === 0
                      const isLast = i === chartPoints.length - 1
                      const translateX = isFirst ? '0%' : isLast ? '-100%' : '-50%'
                      return (
                        <span
                          key={p.label + i}
                          className="absolute top-0 text-[10px] whitespace-nowrap"
                          style={{ left: `${p.x}%`, transform: `translateX(${translateX})`, color: '#9ca3af' }}
                        >
                          {p.label}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Volume axis — its own scale, so neither line flattens against the other */}
                <div
                  className="flex flex-col justify-between text-[10px] shrink-0"
                  style={{ height: CHART_HEIGHT, color: VOLUME_COLOR }}
                >
                  {[4, 3, 2, 1, 0].map(step => (
                    <span key={step} className="leading-none">
                      {compactNumber((maxMonthlyVolume * step) / 4)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Station revenue share + Top clients ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Revenue by Station</h2>
                    <p className="text-[11px] text-gray-400">{stationDateRangeLabel}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <select
                      value={stationDatePreset}
                      onChange={e => setStationDatePreset(e.target.value as typeof stationDatePreset)}
                      className="text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="this_month">This Month</option>
                      <option value="last_month">Last Month</option>
                      <option value="last_30">Last 30 Days</option>
                      <option value="last_90">Last 90 Days</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    {stationDatePreset === 'custom' && (
                      <>
                        <input
                          type="date"
                          value={customStart}
                          onChange={e => setCustomStart(e.target.value)}
                          className="text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <span className="text-[11px] text-gray-400">to</span>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={e => setCustomEnd(e.target.value)}
                          className="text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </>
                    )}
                  </div>
                </div>
                {stationRevenue.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">No sales recorded for this period.</p>
                ) : (
                  <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap">
                    <div className="relative shrink-0 mx-auto sm:mx-0">
                      <svg width={190} height={190} viewBox="0 0 190 190">
                        <g transform="rotate(-90 95 95)">
                          {donutSegments.map((seg, i) => {
                            const gap = donutSegments.length > 1 ? 0.006 : 0
                            const dash = Math.max(seg.fraction - gap, 0)
                            return (
                              <circle
                                key={seg.name + i}
                                cx={95}
                                cy={95}
                                r={70}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={28}
                                pathLength={1}
                                strokeDasharray={`${dash} ${1 - dash}`}
                                strokeDashoffset={-seg.start}
                              />
                            )
                          })}
                        </g>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-base font-bold text-gray-900">{compactMoney(stationRevenueTotal)}</span>
                        <span className="text-[10px] text-gray-400">Total Revenue</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      {donutSegments.map((seg, i) => (
                        <div key={seg.name + i} className="flex items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                            <span className="font-medium text-gray-700 truncate">{seg.name}</span>
                          </span>
                          <span className="text-gray-500 shrink-0">
                            <span className="font-semibold text-gray-900">{Math.round(seg.fraction * 100)}%</span> · {money(seg.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Top Clients by Revenue</h2>
                {topClients.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">No sales recorded yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {topClients.map((c, i) => {
                      const pct = Math.round((c.total / topClients[0].total) * 100)
                      return (
                        <div key={c.name + i}>
                          <div className="flex items-center justify-between text-xs mb-1 gap-2">
                            <span className="font-medium text-gray-700 truncate">{i + 1}. {c.name}</span>
                            <span className="text-gray-900 font-semibold shrink-0">{money(c.total)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ExecutiveDashboard
