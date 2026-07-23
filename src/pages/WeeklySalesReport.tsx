import React, { useState, useEffect, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { adminApiService, WeeklySalesReport as WeeklyReport, WeeklyReportVehicle, Station } from '../services/api'
import { ArrowLeft, Search, Download, RefreshCw, FileText, Loader2 } from 'lucide-react'
import { exportElementToPdf } from '../utils/pdf'

// ISO-8601 week number (matches spreadsheet W23, W24, ...)
const isoWeek = (d: Date): number => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

const toDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

interface DayInfo {
  dateStr: string // YYYY-MM-DD
  monthKey: string // YYYY-MM
  week: number
}

interface MonthGroup {
  key: string
  label: string
  weeks: number[]
}

const WeeklySalesReport: React.FC = () => {
  const navigate = useNavigate()

  const today = new Date()
  const defaultStart = toDateStr(new Date(today.getFullYear(), today.getMonth() - 1, 1))
  const defaultEnd = toDateStr(today)

  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null)
  const [exportingPdf, setExportingPdf] = useState(false)

  const tableWrapperRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchStations()
  }, [])

  useEffect(() => {
    fetchReport()
  }, [startDate, endDate, selectedStationId])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const data = await adminApiService.getWeeklySalesReport(startDate, endDate, selectedStationId || undefined)
      setReport(data)
    } catch (error) {
      console.error('❌ [WeeklySalesReport] Error fetching report:', error)
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchStations = async () => {
    try {
      const data = await adminApiService.getStations()
      setStations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [WeeklySalesReport] Error fetching stations:', error)
      setStations([])
    }
  }

  // Every day of the report range, tagged with month + ISO week
  const days: DayInfo[] = useMemo(() => {
    const result: DayInfo[] = []
    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      result.push({
        dateStr: toDateStr(d),
        monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        week: isoWeek(d),
      })
    }
    return result
  }, [startDate, endDate])

  // Month groups with the ISO weeks each month contains (for the Performance section)
  const months: MonthGroup[] = useMemo(() => {
    const groups: MonthGroup[] = []
    for (const day of days) {
      let group = groups.find(g => g.key === day.monthKey)
      if (!group) {
        const [y, m] = day.monthKey.split('-').map(Number)
        group = {
          key: day.monthKey,
          label: new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long' }),
          weeks: [],
        }
        groups.push(group)
      }
      if (!group.weeks.includes(day.week)) group.weeks.push(day.week)
    }
    return groups
  }, [days])

  // Daily INPUT columns: the last month of the range (like the sheet shows 07/01..today)
  const inputDays: DayInfo[] = useMemo(() => {
    if (days.length === 0) return []
    const lastMonth = days[days.length - 1].monthKey
    return days.filter(d => d.monthKey === lastMonth)
  }, [days])

  const weekQty = (vehicle: WeeklyReportVehicle, monthKey: string, week: number): number =>
    days
      .filter(d => d.monthKey === monthKey && d.week === week)
      .reduce((sum, d) => sum + (vehicle.daily[d.dateStr] || 0), 0)

  const monthQty = (vehicle: WeeklyReportVehicle, monthKey: string): number =>
    days
      .filter(d => d.monthKey === monthKey)
      .reduce((sum, d) => sum + (vehicle.daily[d.dateStr] || 0), 0)

  const formatQty = (v: number): string => {
    if (v === 0) return '0'
    return v % 1 === 0 ? String(v) : v.toFixed(1)
  }

  const formatDayHeader = (dateStr: string): string => {
    const [, m, d] = dateStr.split('-')
    return `${m}/${d}`
  }

  const filteredVehicles = useMemo(() => {
    if (!report) return []
    const term = searchTerm.toLowerCase()
    return report.vehicles.filter(
      v =>
        v.regNo.toLowerCase().includes(term) ||
        v.org.toLowerCase().includes(term) ||
        v.driver.toLowerCase().includes(term) ||
        v.tel.toLowerCase().includes(term)
    )
  }, [report, searchTerm])

  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const exportToCSV = () => {
    if (filteredVehicles.length === 0) {
      alert('No data to export')
      return
    }

    const headers = [
      'No.', 'Reg No', 'Org/Sacco', 'Driver/Owner', 'Tel',
      ...months.flatMap(m => [...m.weeks.map(w => `${m.label} W${w}`), `${m.label} Total`]),
      ...inputDays.map(d => formatDayHeader(d.dateStr)),
      'Total Quantity',
    ]

    const rows = filteredVehicles.map((v, idx) => [
      idx + 1,
      escapeCSV(v.regNo),
      escapeCSV(v.org),
      escapeCSV(v.driver),
      escapeCSV(v.tel),
      ...months.flatMap(m => [...m.weeks.map(w => formatQty(weekQty(v, m.key, w))), formatQty(monthQty(v, m.key))]),
      ...inputDays.map(d => formatQty(v.daily[d.dateStr] || 0)),
      formatQty(v.totalQuantity),
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const BOM = String.fromCharCode(0xfeff)
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `weekly-sales-report-${startDate}-to-${endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportToPdf = async () => {
    if (filteredVehicles.length === 0) {
      alert('No data to export')
      return
    }
    const wrapper = tableWrapperRef.current
    const scrollEl = scrollContainerRef.current
    if (!wrapper || !scrollEl) return

    // Flush the exportingPdf render (horizontal header labels) before capture —
    // html2canvas cannot render vertical writing-mode text.
    flushSync(() => setExportingPdf(true))
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    // Temporarily un-clip and shrink-wrap the containers so the full table
    // (all sticky columns + weekly + daily columns) renders flat at its
    // natural width — the PDF then scales exactly that to the page width.
    const prevWrapperOverflow = wrapper.style.overflow
    const prevWrapperWidth = wrapper.style.width
    const prevScrollOverflow = scrollEl.style.overflow
    const prevScrollWidth = scrollEl.style.width

    try {
      wrapper.style.overflow = 'visible'
      wrapper.style.width = 'max-content'
      scrollEl.style.overflow = 'visible'
      scrollEl.style.width = 'max-content'

      const stationName = selectedStationId ? stations.find(s => s.id === selectedStationId)?.name : null
      const subtitleParts = [`${startDate} to ${endDate}`]
      if (stationName) subtitleParts.push(stationName)

      await exportElementToPdf(wrapper, `weekly-sales-report-${startDate}-to-${endDate}.pdf`, {
        orientation: 'l',
        header: {
          title: 'Weekly Sales Report',
          subtitle: subtitleParts.join(' • '),
          logoUrl: '/motor.jpeg',
        },
      })
    } finally {
      wrapper.style.overflow = prevWrapperOverflow
      wrapper.style.width = prevWrapperWidth
      scrollEl.style.overflow = prevScrollOverflow
      scrollEl.style.width = prevScrollWidth
      setExportingPdf(false)
    }
  }

  // Sticky left column offsets (px) — No. | Reg No | Org/Sacco | Driver/Owner | Tel
  const stickyCols = [
    { label: 'No.', width: 36, left: 0 },
    { label: 'Reg No', width: 88, left: 36 },
    { label: 'Org/Sacco', width: 100, left: 124 },
    { label: 'Driver/Owner', width: 128, left: 224 },
    { label: 'Tel', width: 120, left: 352 },
  ]
  // Thick divider after Tel mimics the sheet's frozen-pane line
  const freezeDivider: React.CSSProperties = { borderRight: '2px solid #374151' }
  const monthDivider: React.CSSProperties = { borderRight: '2px solid #6b7280' }

  const stickyStyle = (i: number): React.CSSProperties => ({
    position: 'sticky',
    left: stickyCols[i].left,
    minWidth: stickyCols[i].width,
    maxWidth: stickyCols[i].width,
    zIndex: 2,
    ...(i === stickyCols.length - 1 ? freezeDivider : {}),
  })

  const weekColCount = months.reduce((sum, m) => sum + m.weeks.length + 1, 0)

  // html2canvas garbles vertical writing-mode text, so render header labels
  // horizontally while capturing the PDF.
  const rotatedHeaderClass = exportingPdf
    ? 'mx-auto py-0.5 whitespace-nowrap text-center'
    : '[writing-mode:vertical-rl] rotate-180 mx-auto py-1 whitespace-nowrap'

  const columnTotal = (getter: (v: WeeklyReportVehicle) => number): number =>
    filteredVehicles.reduce((sum, v) => sum + getter(v), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => navigate('/sales/report')}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Back to Sales Report"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xs font-bold text-gray-900">Weekly Sales Report</h1>
        </div>

        {/* Filters */}
        <div className="mb-2 grid grid-cols-2 md:grid-cols-5 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => e.target.value && setStartDate(e.target.value)}
              className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => e.target.value && setEndDate(e.target.value)}
              className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Station</label>
            <select
              value={selectedStationId || ''}
              onChange={(e) => setSelectedStationId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Stations</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Search</label>
            <div className="relative">
              <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
              <input
                type="text"
                placeholder="Reg no, sacco, driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-6 pr-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-end gap-1">
            <button
              onClick={fetchReport}
              className="flex items-center justify-center gap-1 px-2 py-1 text-[10px] bg-gray-600 text-white rounded hover:bg-gray-700"
              title="Refresh"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredVehicles.length === 0}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-3 w-3" />
              Export CSV
            </button>
            <button
              onClick={exportToPdf}
              disabled={filteredVehicles.length === 0 || exportingPdf}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[10px] bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
              Export PDF
            </button>
          </div>
        </div>

        {/* Report Table */}
        <div ref={tableWrapperRef} className="bg-white rounded border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-gray-500">No sales found for this period</div>
          ) : (
            <div ref={scrollContainerRef} className="overflow-x-auto">
              <table className="border-collapse text-[10px]" style={{ minWidth: '100%' }}>
                <thead>
                  {/* Band header row */}
                  <tr>
                    <th
                      colSpan={5}
                      className="border border-gray-300 bg-[#6f5fc0] text-white font-bold py-1 px-2 text-center"
                      style={{ position: 'sticky', left: 0, zIndex: 3, ...freezeDivider }}
                    >
                      Vehicle Details
                    </th>
                    <th
                      colSpan={weekColCount}
                      className="border border-gray-300 bg-[#fce8b2] text-gray-900 font-bold py-1 px-2 text-center"
                      style={monthDivider}
                    >
                      Performance
                    </th>
                    <th colSpan={inputDays.length + 1} className="border border-gray-300 bg-[#f4c7c3] text-gray-900 font-bold py-1 px-2 text-center">
                      INPUT
                    </th>
                  </tr>
                  {/* Sub header: vehicle cols (span 3), Weekly, day headers (span 3) */}
                  <tr>
                    {stickyCols.map((col, i) => (
                      <th
                        key={col.label}
                        rowSpan={3}
                        className="border border-gray-300 bg-[#cfc7ea] text-gray-900 font-bold px-1 py-0.5 text-center"
                        style={{ ...stickyStyle(i), zIndex: 3 }}
                      >
                        {col.label}
                      </th>
                    ))}
                    <th colSpan={weekColCount} className="border border-gray-300 bg-white font-semibold py-0.5 text-center" style={monthDivider}>
                      Weekly
                    </th>
                    {inputDays.map((d) => (
                      <th key={d.dateStr} rowSpan={3} className="border border-gray-300 bg-white font-medium px-0.5 align-bottom text-center">
                        <div className={rotatedHeaderClass}>
                          {formatDayHeader(d.dateStr)}
                        </div>
                      </th>
                    ))}
                    <th rowSpan={3} className="border border-gray-300 bg-white font-semibold px-1 align-bottom text-center">
                      <div className={rotatedHeaderClass}>Total Qty</div>
                    </th>
                  </tr>
                  {/* Month names */}
                  <tr>
                    {months.map((m) => (
                      <th
                        key={m.key}
                        colSpan={m.weeks.length + 1}
                        className="border border-gray-300 bg-white font-semibold py-0.5 text-center"
                        style={monthDivider}
                      >
                        {m.label}
                      </th>
                    ))}
                  </tr>
                  {/* Week labels */}
                  <tr>
                    {months.map((m) => (
                      <React.Fragment key={m.key}>
                        {m.weeks.map((w) => (
                          <th key={w} className="border border-gray-300 bg-white font-medium px-0.5 align-bottom text-center" style={{ minWidth: 30 }}>
                            <div className={rotatedHeaderClass}>W{w}</div>
                          </th>
                        ))}
                        <th
                          className="border border-gray-300 bg-white font-bold px-0.5 align-bottom text-center"
                          style={{ minWidth: 34, ...monthDivider }}
                        >
                          <div className={rotatedHeaderClass}>Total</div>
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle, idx) => (
                    <tr key={vehicle.key} className="hover:bg-blue-50">
                      <td className="border border-gray-300 bg-white text-center px-1 py-0.5" style={stickyStyle(0)}>
                        {idx + 1}
                      </td>
                      <td className="border border-gray-300 bg-white font-medium px-1 py-0.5 whitespace-nowrap" style={stickyStyle(1)}>
                        {vehicle.regNo}
                      </td>
                      <td className="border border-gray-300 bg-white px-1 py-0.5 whitespace-nowrap overflow-hidden text-ellipsis text-center" style={stickyStyle(2)}>
                        {vehicle.org || '-'}
                      </td>
                      <td className="border border-gray-300 bg-white px-1 py-0.5 whitespace-nowrap overflow-hidden text-ellipsis text-center" style={stickyStyle(3)}>
                        {vehicle.driver || '-'}
                      </td>
                      <td className="border border-gray-300 bg-white px-1 py-0.5 whitespace-nowrap text-center" style={stickyStyle(4)}>
                        {vehicle.tel || '-'}
                      </td>
                      {months.map((m) => (
                        <React.Fragment key={m.key}>
                          {m.weeks.map((w) => (
                            <td key={w} className="border border-gray-300 text-right px-1 py-0.5">
                              {formatQty(weekQty(vehicle, m.key, w))}
                            </td>
                          ))}
                          <td className="border border-gray-300 text-right font-semibold px-1 py-0.5" style={monthDivider}>
                            {formatQty(monthQty(vehicle, m.key))}
                          </td>
                        </React.Fragment>
                      ))}
                      {inputDays.map((d) => (
                        <td key={d.dateStr} className="border border-gray-300 text-right px-1 py-0.5">
                          {formatQty(vehicle.daily[d.dateStr] || 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 text-right font-semibold px-1 py-0.5">
                        {formatQty(vehicle.totalQuantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={5} className="border border-gray-300 bg-gray-100 text-right px-1 py-0.5" style={{ position: 'sticky', left: 0, zIndex: 2, ...freezeDivider }}>
                      Totals
                    </td>
                    {months.map((m) => (
                      <React.Fragment key={m.key}>
                        {m.weeks.map((w) => (
                          <td key={w} className="border border-gray-300 text-right px-1 py-0.5">
                            {formatQty(columnTotal(v => weekQty(v, m.key, w)))}
                          </td>
                        ))}
                        <td className="border border-gray-300 text-right px-1 py-0.5" style={monthDivider}>
                          {formatQty(columnTotal(v => monthQty(v, m.key)))}
                        </td>
                      </React.Fragment>
                    ))}
                    {inputDays.map((d) => (
                      <td key={d.dateStr} className="border border-gray-300 text-right px-1 py-0.5">
                        {formatQty(columnTotal(v => v.daily[d.dateStr] || 0))}
                      </td>
                    ))}
                    <td className="border border-gray-300 text-right px-1 py-0.5">
                      {formatQty(columnTotal(v => v.totalQuantity))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WeeklySalesReport
