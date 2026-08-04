import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Staff, Shift, StaffLeave } from '../services/api'
import {
  ArrowLeft,
  SlidersHorizontal,
  Calendar,
  Search,
  X,
  Users,
  CheckCircle2,
  XCircle,
  Palmtree,
  Percent,
  Loader2,
} from 'lucide-react'

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysInclusive(start: Date, end: Date): number {
  const s = startOfDay(start).getTime()
  const e = startOfDay(end).getTime()
  if (e < s) return 0
  return Math.round((e - s) / 86_400_000) + 1
}

function dateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface AttendanceRow {
  staffId: number
  name: string
  presentDays: number
  leaveDays: number
  absentDays: number
  totalWorkingDays: number
  attendancePct: number
}

const WorkingDays: React.FC = () => {
  const navigate = useNavigate()

  const [attendants, setAttendants] = useState<Staff[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [leaves, setLeaves] = useState<StaffLeave[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [datePreset, setDatePreset] = useState<'this_month' | 'last_month' | 'this_week' | 'custom'>('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const dateRange = useMemo(() => {
    const now = new Date()
    let start: Date
    let end = startOfDay(now)

    if (datePreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    } else if (datePreset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0)
    } else if (datePreset === 'this_week') {
      const dayOfWeek = (now.getDay() + 6) % 7 // Monday-start week
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 6)
    } else {
      start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1)
      end = customEnd ? new Date(`${customEnd}T00:00:00`) : end
    }
    return { start, end }
  }, [datePreset, customStart, customEnd])

  // Don't count days that haven't happened yet as "absent" when the range runs into the future.
  const effectiveEnd = useMemo(() => {
    const today = startOfDay(new Date())
    return dateRange.end.getTime() > today.getTime() ? today : dateRange.end
  }, [dateRange])

  const fetchData = () => {
    setLoading(true)
    const startDate = dateRange.start.toISOString().slice(0, 10)
    const endDate = dateRange.end.toISOString().slice(0, 10)
    Promise.all([
      adminApiService.getStaff(),
      adminApiService.getShifts(undefined, startDate, endDate),
      adminApiService.getStaffLeaves(undefined, startDate, endDate),
    ])
      .then(([st, sh, lv]) => {
        setAttendants((Array.isArray(st) ? st : []).filter(s => s.role === 'attendant'))
        setShifts(Array.isArray(sh) ? sh : [])
        setLeaves(Array.isArray(lv) ? lv : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [dateRange])

  const hasActiveFilters = datePreset !== 'this_month' || searchTerm !== ''

  const clearFilters = () => {
    setDatePreset('this_month')
    setCustomStart('')
    setCustomEnd('')
    setSearchTerm('')
  }

  const totalWorkingDays = Math.max(daysInclusive(dateRange.start, effectiveEnd), 0)

  const rows: AttendanceRow[] = useMemo(() => {
    return attendants.map(att => {
      const presentDates = new Set<string>()
      for (const s of shifts) {
        if (s.userId === att.id && s.checkInTime) {
          presentDates.add(dateKey(s.checkInTime))
        }
      }
      const presentDays = presentDates.size

      let leaveDays = 0
      for (const lv of leaves) {
        if (lv.staff_id !== att.id || lv.status !== 'approved') continue
        const leaveStart = new Date(`${lv.start_date}T00:00:00`)
        const leaveEnd = new Date(`${lv.end_date}T00:00:00`)
        const clippedStart = leaveStart.getTime() > dateRange.start.getTime() ? leaveStart : dateRange.start
        const clippedEnd = leaveEnd.getTime() < effectiveEnd.getTime() ? leaveEnd : effectiveEnd
        const clippedDays = daysInclusive(clippedStart, clippedEnd)
        if (clippedDays <= 0) continue
        leaveDays += lv.is_half_day ? Math.max(clippedDays - 0.5, 0.5) : clippedDays
      }

      const absentDays = Math.max(totalWorkingDays - presentDays - leaveDays, 0)
      const attendancePct = totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0

      return {
        staffId: att.id,
        name: att.name,
        presentDays,
        leaveDays,
        absentDays,
        totalWorkingDays,
        attendancePct,
      }
    })
  }, [attendants, shifts, leaves, dateRange, effectiveEnd, totalWorkingDays])

  const filteredRows = rows.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const avgAttendancePct = filteredRows.length > 0
    ? filteredRows.reduce((sum, r) => sum + r.attendancePct, 0) / filteredRows.length
    : 0
  const totalPresentDays = filteredRows.reduce((sum, r) => sum + r.presentDays, 0)
  const totalLeaveDays = filteredRows.reduce((sum, r) => sum + r.leaveDays, 0)

  const pctColor = (pct: number) => pct >= 90 ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600'

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
          <h1 className="text-sm font-bold text-gray-900">Working Days</h1>
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
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Period</label>
                <div className="relative">
                  <Calendar className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value as typeof datePreset)}
                    className="w-full pl-5 pr-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
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

              <div className="min-w-[200px] flex-[2]">
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Search</label>
                <div className="relative">
                  <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 h-3 w-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Attendant name…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-5 pr-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <span className="text-[10px] text-gray-400 ml-auto">
                {totalWorkingDays} working day{totalWorkingDays === 1 ? '' : 's'} in period
              </span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Attendants</div>
                <div className="text-sm font-bold text-gray-900 truncate">{filteredRows.length}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Total present days</div>
                <div className="text-sm font-bold text-gray-900 truncate">{totalPresentDays}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Palmtree className="h-4 w-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Total leave days</div>
                <div className="text-sm font-bold text-gray-900 truncate">{totalLeaveDays}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Percent className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Avg attendance</div>
                <div className="text-sm font-bold text-gray-900 truncate">{avgAttendancePct.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-gray-500">
              No attendants found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Attendant</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Days Present</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Days Absent</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Leave Days</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Working Days</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRows
                    .sort((a, b) => b.attendancePct - a.attendancePct)
                    .map((row) => (
                      <tr key={row.staffId} className="hover:bg-gray-50">
                        <td className="px-2 py-1 text-[11px] font-medium text-gray-900">{row.name.trim()}</td>
                        <td className="px-2 py-1 text-[11px] text-right">
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {row.presentDays}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-[11px] text-right">
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircle className="h-3 w-3" />
                            {row.absentDays}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-[11px] text-right">
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <Palmtree className="h-3 w-3" />
                            {row.leaveDays}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-[11px] text-right text-gray-500">{row.totalWorkingDays}</td>
                        <td className={`px-2 py-1 text-[11px] text-right font-bold ${pctColor(row.attendancePct)}`}>
                          {row.attendancePct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkingDays
