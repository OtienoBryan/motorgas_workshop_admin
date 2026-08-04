import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Sale, Station } from '../services/api'
import {
  ArrowLeft,
  SlidersHorizontal,
  Calendar,
  X,
  Download,
  Receipt,
  Fuel,
  DollarSign,
  Loader2,
  ChevronRight,
} from 'lucide-react'

interface StationSummary {
  stationId: number
  stationName: string
  cash: number
  card: number
  mpesa: number
  credit: number
  other: number
  quantity: number
  total: number
  saleCount: number
}

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const SalesSummaryReport: React.FC = () => {
  const navigate = useNavigate()

  const [sales, setSales] = useState<Sale[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)

  const [datePreset, setDatePreset] = useState<'this_month' | 'last_month' | 'last_30' | 'all' | 'custom'>('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const dateRange = useMemo(() => {
    if (datePreset === 'all') return null
    const now = new Date()
    let start: Date
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    if (datePreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (datePreset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    } else if (datePreset === 'last_30') {
      start = new Date(now)
      start.setDate(start.getDate() - 29)
    } else {
      start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1)
      end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : end
    }
    return { start, end }
  }, [datePreset, customStart, customEnd])

  const dateRangeLabel = useMemo(() => {
    if (datePreset === 'this_month') return new Date().toLocaleString(undefined, { month: 'long', year: 'numeric' })
    if (datePreset === 'last_month') {
      const d = new Date()
      d.setMonth(d.getMonth() - 1)
      return d.toLocaleString(undefined, { month: 'long', year: 'numeric' })
    }
    if (datePreset === 'last_30') return 'Last 30 days'
    if (datePreset === 'all') return 'All time'
    return dateRange ? `${dateRange.start.toLocaleDateString()} – ${dateRange.end.toLocaleDateString()}` : ''
  }, [datePreset, dateRange])

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

  const hasActiveFilters = datePreset !== 'this_month'
  const clearFilters = () => {
    setDatePreset('this_month')
    setCustomStart('')
    setCustomEnd('')
  }

  const filteredSales = sales.filter(s => {
    if (!dateRange) return true
    const d = new Date(s.saleDate)
    return d >= dateRange.start && d <= dateRange.end
  })

  const summaries: StationSummary[] = useMemo(() => {
    const byStation = new Map<number, StationSummary>()
    // Seed every station up front so ones with no sales in the period still show (as zeros).
    for (const st of stations) {
      byStation.set(st.id, {
        stationId: st.id,
        stationName: st.name,
        cash: 0, card: 0, mpesa: 0, credit: 0, other: 0,
        quantity: 0, total: 0, saleCount: 0,
      })
    }
    for (const s of filteredSales) {
      const name = stations.find(st => st.id === s.stationId)?.name || `Station #${s.stationId}`
      const entry = byStation.get(s.stationId) || {
        stationId: s.stationId,
        stationName: name,
        cash: 0, card: 0, mpesa: 0, credit: 0, other: 0,
        quantity: 0, total: 0, saleCount: 0,
      }
      const amount = Number(s.totalAmount)
      switch (s.paymentMethod) {
        case 'CASH': entry.cash += amount; break
        case 'CARD': entry.card += amount; break
        case 'MPESA': entry.mpesa += amount; break
        case 'CREDIT': entry.credit += amount; break
        default: entry.other += amount; break
      }
      entry.quantity += Number(s.quantity)
      entry.total += amount
      entry.saleCount += 1
      byStation.set(s.stationId, entry)
    }
    return Array.from(byStation.values()).sort((a, b) => b.total - a.total || a.stationName.localeCompare(b.stationName))
  }, [filteredSales, stations])

  const grandTotal = summaries.reduce((acc, s) => ({
    cash: acc.cash + s.cash,
    card: acc.card + s.card,
    mpesa: acc.mpesa + s.mpesa,
    credit: acc.credit + s.credit,
    other: acc.other + s.other,
    quantity: acc.quantity + s.quantity,
    total: acc.total + s.total,
    saleCount: acc.saleCount + s.saleCount,
  }), { cash: 0, card: 0, mpesa: 0, credit: 0, other: 0, quantity: 0, total: 0, saleCount: 0 })

  const exportToCSV = () => {
    if (summaries.length === 0) {
      alert('No data to export')
      return
    }
    const headers = ['Station', 'Cash', 'Card', 'Mpesa', 'Credit', 'Other', 'Quantity Sold (L)', 'Total Sales Value', 'No. of Sales']
    const rows = summaries.map(s => [
      s.stationName, s.cash.toFixed(2), s.card.toFixed(2), s.mpesa.toFixed(2), s.credit.toFixed(2), s.other.toFixed(2),
      s.quantity.toFixed(2), s.total.toFixed(2), String(s.saleCount)
    ])
    rows.push(['TOTAL', grandTotal.cash.toFixed(2), grandTotal.card.toFixed(2), grandTotal.mpesa.toFixed(2), grandTotal.credit.toFixed(2), grandTotal.other.toFixed(2), grandTotal.quantity.toFixed(2), grandTotal.total.toFixed(2), String(grandTotal.saleCount)])

    const escapeCSV = (v: string) => (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v
    const csvContent = [headers.join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n')
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sales-summary-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

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
          <h1 className="text-sm font-bold text-gray-900">Sales Summary Report</h1>
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
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
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

              <button
                onClick={exportToCSV}
                disabled={summaries.length === 0}
                className="flex items-center justify-center gap-1 px-3 py-1 text-[11px] font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ml-auto"
                title={summaries.length === 0 ? 'No data to export' : 'Export to CSV'}
              >
                <Download className="h-3 w-3" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">{dateRangeLabel}</div>
                <div className="text-sm font-bold text-gray-900 truncate">{grandTotal.saleCount} sales</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Fuel className="h-4 w-4 text-orange-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Total quantity sold</div>
                <div className="text-sm font-bold text-gray-900 truncate">{money(grandTotal.quantity)} L</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Total sales value</div>
                <div className="text-sm font-bold text-gray-900 truncate">{money(grandTotal.total)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : summaries.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-gray-500">
              No sales found for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Station</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Cash</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Card</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Mpesa</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Credit</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Other</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Quantity Sold</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Sales Value</th>
                    <th className="px-2 py-1 w-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summaries.map((s) => (
                    <tr
                      key={s.stationId}
                      onClick={() => navigate(`/sales/report/summary/${s.stationId}?preset=${datePreset}&start=${customStart}&end=${customEnd}`)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      title="View daily breakdown"
                    >
                      <td className="px-2 py-1 text-[11px] font-medium text-gray-900">{s.stationName.trim()}</td>
                      <td className="px-2 py-1 text-[11px] text-right text-gray-600">{s.cash > 0 ? money(s.cash) : '—'}</td>
                      <td className="px-2 py-1 text-[11px] text-right text-gray-600">{s.card > 0 ? money(s.card) : '—'}</td>
                      <td className="px-2 py-1 text-[11px] text-right text-gray-600">{s.mpesa > 0 ? money(s.mpesa) : '—'}</td>
                      <td className="px-2 py-1 text-[11px] text-right text-gray-600">{s.credit > 0 ? money(s.credit) : '—'}</td>
                      <td className="px-2 py-1 text-[11px] text-right text-gray-600">{s.other > 0 ? money(s.other) : '—'}</td>
                      <td className="px-2 py-1 text-[11px] text-right font-medium text-gray-900">{money(s.quantity)} L</td>
                      <td className="px-2 py-1 text-[11px] text-right font-bold text-purple-600">{money(s.total)}</td>
                      <td className="px-2 py-1 text-right"><ChevronRight className="h-3.5 w-3.5 text-gray-300" /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td className="px-2 py-1.5 text-[11px] font-bold text-gray-900">Total</td>
                    <td className="px-2 py-1.5 text-[11px] text-right font-bold text-gray-900">{money(grandTotal.cash)}</td>
                    <td className="px-2 py-1.5 text-[11px] text-right font-bold text-gray-900">{money(grandTotal.card)}</td>
                    <td className="px-2 py-1.5 text-[11px] text-right font-bold text-gray-900">{money(grandTotal.mpesa)}</td>
                    <td className="px-2 py-1.5 text-[11px] text-right font-bold text-gray-900">{money(grandTotal.credit)}</td>
                    <td className="px-2 py-1.5 text-[11px] text-right font-bold text-gray-900">{money(grandTotal.other)}</td>
                    <td className="px-2 py-1.5 text-[11px] text-right font-bold text-gray-900">{money(grandTotal.quantity)} L</td>
                    <td className="px-2 py-1.5 text-[11px] text-right font-bold text-purple-700">{money(grandTotal.total)}</td>
                    <td></td>
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

export default SalesSummaryReport
