import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Shift, Station } from '../services/api'
import {
  ArrowLeft,
  SlidersHorizontal,
  Calendar,
  MapPin,
  Search,
  X,
  Clock,
  Users,
  CheckCircle2,
  Fuel,
  ExternalLink,
  Loader2,
} from 'lucide-react'

function timeSpent(checkInTime: string | null, checkoutTime: string | null): string {
  if (!checkInTime) return '—'
  if (!checkoutTime) return 'In progress'
  const ms = new Date(checkoutTime).getTime() - new Date(checkInTime).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  return `${hours}h ${minutes}m`
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

type ShiftStatus = 'checked_out' | 'checked_in' | 'pending'

function shiftStatus(shift: Shift): ShiftStatus {
  if (shift.checkoutTime) return 'checked_out'
  if (shift.checkInTime) return 'checked_in'
  return 'pending'
}

const STATUS_STYLES: Record<ShiftStatus, string> = {
  checked_out: 'bg-emerald-100 text-emerald-700',
  checked_in: 'bg-amber-100 text-amber-700',
  pending: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<ShiftStatus, string> = {
  checked_out: 'Checked Out',
  checked_in: 'Checked In',
  pending: 'Pending',
}

const Attendance: React.FC = () => {
  const navigate = useNavigate()

  const [shifts, setShifts] = useState<Shift[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null)

  const [datePreset, setDatePreset] = useState<'today' | 'this_week' | 'this_month' | 'last_30' | 'all' | 'custom'>('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const dateRange = useMemo(() => {
    if (datePreset === 'all') return null
    const now = new Date()
    let start: Date
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    if (datePreset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (datePreset === 'this_week') {
      const dayOfWeek = (now.getDay() + 6) % 7 // Monday-start week
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
    } else if (datePreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (datePreset === 'last_30') {
      start = new Date(now)
      start.setDate(start.getDate() - 29)
    } else {
      start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), now.getDate())
      end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : end
    }
    return { start, end }
  }, [datePreset, customStart, customEnd])

  const fetchData = () => {
    setLoading(true)
    const startDate = dateRange ? dateRange.start.toISOString().slice(0, 10) : undefined
    const endDate = dateRange ? dateRange.end.toISOString().slice(0, 10) : undefined
    Promise.all([
      adminApiService.getShifts(selectedStationId || undefined, startDate, endDate),
      adminApiService.getStations(),
    ])
      .then(([sh, st]) => {
        setShifts(Array.isArray(sh) ? sh : [])
        setStations(Array.isArray(st) ? st : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [selectedStationId, dateRange])

  const filteredShifts = shifts.filter(s =>
    s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.outlet_address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const hasActiveFilters = datePreset !== 'today' || selectedStationId !== null || searchTerm !== ''

  const clearFilters = () => {
    setDatePreset('today')
    setCustomStart('')
    setCustomEnd('')
    setSelectedStationId(null)
    setSearchTerm('')
  }

  const totalShifts = filteredShifts.length
  const checkedInCount = filteredShifts.filter(s => shiftStatus(s) === 'checked_in').length
  const checkedOutCount = filteredShifts.filter(s => shiftStatus(s) === 'checked_out').length
  const uniqueAttendants = new Set(filteredShifts.map(s => s.userId ?? s.userName)).size

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-bold text-gray-900">Attendance</h1>
        </div>

        {/* Filters */}
        <div className="mb-2 space-y-2">
          <div className="bg-white rounded-lg border border-gray-200 p-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-700">Filters</span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-auto flex items-center gap-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                >
                  <X className="h-3 w-3" />
                  Clear all
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="w-36">
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Date Range</label>
                <div className="relative">
                  <Calendar className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value as typeof datePreset)}
                    className="w-full pl-5 pr-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="today">Today</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_30">Last 30 Days</option>
                    <option value="all">All Time</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              {datePreset === 'custom' && (
                <>
                  <div className="w-32">
                    <label className="block text-[10px] font-medium text-gray-500 mb-0.5">From</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-medium text-gray-500 mb-0.5">To</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="w-px self-stretch bg-gray-100 hidden sm:block" />

              <div className="min-w-[160px] flex-1">
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Station</label>
                <div className="relative">
                  <MapPin className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                  <select
                    value={selectedStationId || ''}
                    onChange={(e) => setSelectedStationId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full pl-5 pr-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">All Stations</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>{station.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="min-w-[200px] flex-[2]">
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Search</label>
                <div className="relative">
                  <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 h-3 w-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Attendant, station, address…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-5 pr-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Total shifts</div>
                <div className="text-sm font-bold text-gray-900 truncate">{totalShifts}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Checked in</div>
                <div className="text-sm font-bold text-gray-900 truncate">{checkedInCount}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Checked out</div>
                <div className="text-sm font-bold text-gray-900 truncate">{checkedOutCount}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Attendants</div>
                <div className="text-sm font-bold text-gray-900 truncate">{uniqueAttendants}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Shifts Table */}
        <div className="bg-white rounded border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-gray-500">
              No shifts found for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Attendant</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Station</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Pump</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Check-in</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Checkout</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Time Spent</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Location</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredShifts.map((shift) => {
                    const status = shiftStatus(shift)
                    const mapUrl = shift.latitude != null && shift.longitude != null
                      ? `https://www.google.com/maps?q=${shift.latitude},${shift.longitude}`
                      : null
                    return (
                      <tr key={shift.id} className="hover:bg-gray-50">
                        <td className="px-2 py-1 text-[11px] font-medium text-gray-900">{shift.userName.trim()}</td>
                        <td className="px-2 py-1 text-[11px] text-gray-600">{shift.station_name.trim()}</td>
                        <td className="px-2 py-1 text-[11px] text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Fuel className="h-3 w-3 text-gray-400" />
                            {shift.pump_number}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-[11px] text-gray-600 whitespace-nowrap">{formatDateTime(shift.checkInTime)}</td>
                        <td className="px-2 py-1 text-[11px] text-gray-600 whitespace-nowrap">{formatDateTime(shift.checkoutTime)}</td>
                        <td className="px-2 py-1 text-[11px] font-medium text-gray-900 whitespace-nowrap">
                          {timeSpent(shift.checkInTime, shift.checkoutTime)}
                        </td>
                        <td className="px-2 py-1 text-[11px] text-gray-600">
                          {mapUrl ? (
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                              title={shift.outlet_address}
                            >
                              <MapPin className="h-3 w-3" />
                              {shift.latitude!.toFixed(4)}, {shift.longitude!.toFixed(4)}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-1 text-[11px]">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[status]}`}>
                            {STATUS_LABELS[status]}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Attendance
