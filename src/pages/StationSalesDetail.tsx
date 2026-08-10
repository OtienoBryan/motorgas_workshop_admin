import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { adminApiService, Sale, Station, SalesPosting } from '../services/api'
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
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Gauge,
} from 'lucide-react'

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash' },
  { key: 'card', label: 'Card' },
  { key: 'mpesa', label: 'Mpesa' },
  { key: 'credit', label: 'Credit' },
  { key: 'other', label: 'Other' },
] as const

type PaymentMethodKey = typeof PAYMENT_METHODS[number]['key']

const VARIANCE_EPSILON = 0.01

function varianceRows(posting: {
  cash_posted: number | string; card_posted: number | string; mpesa_posted: number | string; credit_posted: number | string; other_posted: number | string
  cash_system: number | string; card_system: number | string; mpesa_system: number | string; credit_system: number | string; other_system: number | string
}) {
  return PAYMENT_METHODS.map(m => {
    const posted = Number(posting[`${m.key}_posted` as const])
    const system = Number(posting[`${m.key}_system` as const])
    const variance = posted - system
    return { key: m.key, label: m.label, posted, system, variance, matching: Math.abs(variance) < VARIANCE_EPSILON }
  })
}

interface DailySummary {
  dateKey: string
  dateLabel: string
  cash: number
  card: number
  mpesa: number
  credit: number
  other: number
  quantity: number
  total: number
  saleCount: number
}

type DatePreset = 'this_month' | 'last_month' | 'last_30' | 'all' | 'custom'

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const StationSalesDetail: React.FC = () => {
  const navigate = useNavigate()
  const { stationId } = useParams<{ stationId: string }>()
  const [searchParams] = useSearchParams()

  const [sales, setSales] = useState<Sale[]>([])
  const [station, setStation] = useState<Station | null>(null)
  const [loading, setLoading] = useState(true)

  const [postings, setPostings] = useState<SalesPosting[]>([])
  const [showPostingModal, setShowPostingModal] = useState(false)
  const [postingDay, setPostingDay] = useState<DailySummary | null>(null)
  const [editingPostingId, setEditingPostingId] = useState<number | null>(null)
  const [postForm, setPostForm] = useState<Record<PaymentMethodKey, string>>({
    cash: '', card: '', mpesa: '', credit: '', other: '',
  })
  const [postNotes, setPostNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [lastResult, setLastResult] = useState<SalesPosting | null>(null)

  const presetParam = searchParams.get('preset') as DatePreset | null
  const [datePreset, setDatePreset] = useState<DatePreset>(presetParam || 'this_month')
  const [customStart, setCustomStart] = useState(searchParams.get('start') || '')
  const [customEnd, setCustomEnd] = useState(searchParams.get('end') || '')

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
    if (!stationId) return
    setLoading(true)
    Promise.all([
      adminApiService.getSales(Number(stationId)),
      adminApiService.getStations(),
    ])
      .then(([sl, st]) => {
        setSales(Array.isArray(sl) ? sl : [])
        setStation((Array.isArray(st) ? st : []).find(s => s.id === Number(stationId)) || null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [stationId])

  const fetchPostings = () => {
    if (!stationId) return
    adminApiService.getSalesPostings(Number(stationId)).then(setPostings)
  }

  useEffect(() => { fetchPostings() }, [stationId])

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

  const dailyBreakdown: DailySummary[] = useMemo(() => {
    const byDate = new Map<string, DailySummary>()
    for (const s of filteredSales) {
      const d = new Date(s.saleDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const entry = byDate.get(key) || {
        dateKey: key,
        dateLabel: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
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
      byDate.set(key, entry)
    }
    return Array.from(byDate.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  }, [filteredSales])

  const grandTotal = dailyBreakdown.reduce((acc, d) => ({
    cash: acc.cash + d.cash,
    card: acc.card + d.card,
    mpesa: acc.mpesa + d.mpesa,
    credit: acc.credit + d.credit,
    other: acc.other + d.other,
    quantity: acc.quantity + d.quantity,
    total: acc.total + d.total,
    saleCount: acc.saleCount + d.saleCount,
  }), { cash: 0, card: 0, mpesa: 0, credit: 0, other: 0, quantity: 0, total: 0, saleCount: 0 })

  // Average vend volume — litres per sale across the period.
  const avv = grandTotal.saleCount === 0 ? 0 : grandTotal.quantity / grandTotal.saleCount

  const exportToCSV = () => {
    if (dailyBreakdown.length === 0) {
      alert('No data to export')
      return
    }
    const headers = ['Date', 'Cash', 'Card', 'Mpesa', 'Credit', 'Other', 'Quantity Sold (L)', 'Total Sales Value', 'No. of Sales', 'Amount Posted', 'Variance']
    const rows = dailyBreakdown.map(d => {
      const existing = postingsByDay.get(d.dateKey)
      const existingRows = existing ? varianceRows(existing) : null
      const totalPosted = existingRows ? existingRows.reduce((sum, r) => sum + r.posted, 0) : null
      const totalVariance = existingRows ? existingRows.reduce((sum, r) => sum + r.variance, 0) : null
      return [
        d.dateLabel, d.cash.toFixed(2), d.card.toFixed(2), d.mpesa.toFixed(2), d.credit.toFixed(2), d.other.toFixed(2),
        d.quantity.toFixed(2), d.total.toFixed(2), String(d.saleCount),
        totalPosted !== null ? totalPosted.toFixed(2) : '',
        totalVariance !== null ? (Math.abs(totalVariance) < VARIANCE_EPSILON ? 'Matching' : totalVariance.toFixed(2)) : '',
      ]
    })
    rows.push([
      'TOTAL', grandTotal.cash.toFixed(2), grandTotal.card.toFixed(2), grandTotal.mpesa.toFixed(2), grandTotal.credit.toFixed(2), grandTotal.other.toFixed(2),
      grandTotal.quantity.toFixed(2), grandTotal.total.toFixed(2), String(grandTotal.saleCount),
      postedTotals.posted.toFixed(2),
      Math.abs(postedTotals.variance) < VARIANCE_EPSILON ? 'Matching' : postedTotals.variance.toFixed(2),
    ])

    const escapeCSV = (v: string) => (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v
    const csvContent = [headers.join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n')
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const stationSlug = (station?.name || `station-${stationId}`).replace(/\s+/g, '-')
    link.setAttribute('href', url)
    link.setAttribute('download', `sales-${stationSlug}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const postingsByDay = useMemo(() => {
    const map = new Map<string, SalesPosting>()
    for (const p of postings) {
      const key = String(p.period_start).slice(0, 10)
      if (!map.has(key)) map.set(key, p)
    }
    return map
  }, [postings])

  const postedTotals = useMemo(() => {
    let posted = 0
    let variance = 0
    for (const d of dailyBreakdown) {
      const existing = postingsByDay.get(d.dateKey)
      if (!existing) continue
      const rows = varianceRows(existing)
      posted += rows.reduce((sum, r) => sum + r.posted, 0)
      variance += rows.reduce((sum, r) => sum + r.variance, 0)
    }
    return { posted, variance }
  }, [dailyBreakdown, postingsByDay])

  // Carry the active date filter across so Back returns to the same view.
  const openDaySales = (day: DailySummary) => {
    const params = new URLSearchParams({ preset: datePreset })
    if (datePreset === 'custom') {
      if (customStart) params.set('start', customStart)
      if (customEnd) params.set('end', customEnd)
    }
    navigate(`/sales/report/summary/${stationId}/day/${day.dateKey}?${params.toString()}`)
  }

  const openPostingModal = (day: DailySummary) => {
    const existing = postingsByDay.get(day.dateKey)
    setPostingDay(day)
    setEditingPostingId(existing ? existing.id : null)
    setPostForm(existing ? {
      cash: String(existing.cash_posted),
      card: String(existing.card_posted),
      mpesa: String(existing.mpesa_posted),
      credit: String(existing.credit_posted),
      other: String(existing.other_posted),
    } : { cash: '', card: '', mpesa: '', credit: '', other: '' })
    setPostNotes(existing?.notes || '')
    setSubmitError('')
    setLastResult(null)
    setShowPostingModal(true)
  }

  const submitPosting = async () => {
    if (!stationId || !postingDay) return
    setSubmitError('')
    for (const m of PAYMENT_METHODS) {
      if (postForm[m.key] !== '' && isNaN(Number(postForm[m.key]))) {
        setSubmitError(`${m.label} amount must be a number`)
        return
      }
    }
    setSubmitting(true)
    try {
      const payload = {
        station_id: Number(stationId),
        period_start: postingDay.dateKey,
        period_end: postingDay.dateKey,
        cash_posted: Number(postForm.cash || 0),
        card_posted: Number(postForm.card || 0),
        mpesa_posted: Number(postForm.mpesa || 0),
        credit_posted: Number(postForm.credit || 0),
        other_posted: Number(postForm.other || 0),
        cash_system: postingDay.cash,
        card_system: postingDay.card,
        mpesa_system: postingDay.mpesa,
        credit_system: postingDay.credit,
        other_system: postingDay.other,
        notes: postNotes || undefined,
      }
      const posting = editingPostingId
        ? await adminApiService.updateSalesPosting(editingPostingId, payload)
        : await adminApiService.createSalesPosting(payload)
      setPostings(prev => editingPostingId
        ? prev.map(p => p.id === posting.id ? posting : p)
        : [posting, ...prev])
      setLastResult(posting)
    } catch (err) {
      setSubmitError('Failed to save posting. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => navigate('/sales/report/summary')}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Back to Sales Summary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-bold text-gray-900">{station ? station.name.trim() : 'Station'} — Daily Breakdown</h1>
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
                    onChange={(e) => setDatePreset(e.target.value as DatePreset)}
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
                onClick={() => navigate(`/sales/report/summary/${stationId}/variance-report`)}
                className="flex items-center justify-center gap-1 px-3 py-1 text-[11px] font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shrink-0 ml-auto"
                title="View variance report"
              >
                <History className="h-3 w-3" />
                Variance Report
              </button>

              <button
                onClick={exportToCSV}
                disabled={dailyBreakdown.length === 0}
                className="flex items-center justify-center gap-1 px-3 py-1 text-[11px] font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title={dailyBreakdown.length === 0 ? 'No data to export' : 'Export to CSV'}
              >
                <Download className="h-3 w-3" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Gauge className="h-4 w-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">AVV</div>
                <div className="text-sm font-bold text-gray-900 truncate">{money(avv)} L</div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Table */}
        <div className="bg-white rounded border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : dailyBreakdown.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-gray-500">
              No sales recorded for this station in this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Date</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Cash</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Card</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Mpesa</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Credit</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Other</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Quantity Sold</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Sales Value</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Amount Posted</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Variance</th>
                    <th className="px-2 py-1 text-center text-[11px] font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dailyBreakdown.map((d) => {
                    const existing = postingsByDay.get(d.dateKey)
                    const existingRows = existing ? varianceRows(existing) : null
                    const existingMatching = existingRows ? existingRows.every(r => r.matching) : null
                    const totalPosted = existingRows ? existingRows.reduce((sum, r) => sum + r.posted, 0) : 0
                    const totalVariance = existingRows ? existingRows.reduce((sum, r) => sum + r.variance, 0) : 0
                    return (
                      <tr key={d.dateKey} className="hover:bg-gray-50">
                        <td className="px-2 py-1 whitespace-nowrap">
                          <button
                            onClick={() => openDaySales(d)}
                            className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            title={`View the ${d.saleCount} individual sale${d.saleCount === 1 ? '' : 's'} on this day`}
                          >
                            {d.dateLabel}
                          </button>
                        </td>
                        <td className="px-2 py-1 text-[11px] text-right text-gray-600">{d.cash > 0 ? money(d.cash) : '—'}</td>
                        <td className="px-2 py-1 text-[11px] text-right text-gray-600">{d.card > 0 ? money(d.card) : '—'}</td>
                        <td className="px-2 py-1 text-[11px] text-right text-gray-600">{d.mpesa > 0 ? money(d.mpesa) : '—'}</td>
                        <td className="px-2 py-1 text-[11px] text-right text-gray-600">{d.credit > 0 ? money(d.credit) : '—'}</td>
                        <td className="px-2 py-1 text-[11px] text-right text-gray-600">{d.other > 0 ? money(d.other) : '—'}</td>
                        <td className="px-2 py-1 text-[11px] text-right font-medium text-gray-900">{money(d.quantity)} L</td>
                        <td className="px-2 py-1 text-[11px] text-right font-bold text-purple-600">{money(d.total)}</td>
                        <td className="px-2 py-1 text-[11px] text-right whitespace-nowrap">
                          {existing ? (
                            <span className={existingMatching ? 'font-medium text-gray-900' : 'font-semibold text-red-600'}>{money(totalPosted)}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-1 text-[11px] text-right whitespace-nowrap">
                          {existing ? (
                            existingMatching ? (
                              <span className="text-emerald-600 font-medium">Matching</span>
                            ) : (
                              <span className="font-semibold text-red-600">{totalVariance > 0 ? '+' : ''}{money(totalVariance)}</span>
                            )
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-1 text-center">
                          {existing ? (
                            <button
                              onClick={() => openPostingModal(d)}
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${existingMatching ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                              title="View / re-post"
                            >
                              {existingMatching ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              {existingMatching ? 'Matching' : 'Variance'}
                            </button>
                          ) : (
                            <button
                              onClick={() => openPostingModal(d)}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                              title="Post accountant amounts for this day"
                            >
                              <ClipboardCheck className="h-3 w-3" />
                              Post
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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
                    <td className="px-2 py-1.5 text-[11px] text-right font-bold whitespace-nowrap">
                      <span className={Math.abs(postedTotals.variance) < VARIANCE_EPSILON ? 'text-gray-900' : 'text-red-600'}>{money(postedTotals.posted)}</span>
                    </td>
                    <td className="px-2 py-1.5 text-[11px] text-right font-bold whitespace-nowrap">
                      {Math.abs(postedTotals.variance) < VARIANCE_EPSILON ? (
                        <span className="text-emerald-600">Matching</span>
                      ) : (
                        <span className="text-red-600">{postedTotals.variance > 0 ? '+' : ''}{money(postedTotals.variance)}</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>


      {/* Post Accountant Amounts Modal */}
      {showPostingModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-sm font-bold text-gray-900">{editingPostingId ? 'Update Accountant Amounts' : 'Post Accountant Amounts'}</h2>
              <button onClick={() => setShowPostingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-[11px] text-gray-500">
                Day: {postingDay?.dateLabel}
              </p>

              {!lastResult ? (
                <>
                  {PAYMENT_METHODS.map(m => (
                    <div key={m.key} className="flex items-center gap-2">
                      <label className="w-16 text-[11px] font-medium text-gray-600">{m.label}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={postForm[m.key]}
                        onChange={(e) => setPostForm(prev => ({ ...prev, [m.key]: e.target.value }))}
                        placeholder="0.00"
                        className="flex-1 px-2 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-[10px] text-gray-400 w-20 text-right">
                        sys {money(postingDay ? postingDay[m.key] : 0)}
                      </span>
                    </div>
                  ))}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Notes (optional)</label>
                    <textarea
                      value={postNotes}
                      onChange={(e) => setPostNotes(e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {submitError && <p className="text-[11px] text-red-600">{submitError}</p>}
                </>
              ) : (
                <div className="space-y-2">
                  {varianceRows(lastResult).every(r => r.matching) ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-md bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-[11px] font-semibold">All amounts match the system totals.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-md bg-red-50 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-[11px] font-semibold">Variance detected — posted amounts don't match the system.</span>
                    </div>
                  )}
                  <table className="w-full">
                    <thead>
                      <tr className="text-[10px] text-gray-500">
                        <th className="text-left py-0.5">Method</th>
                        <th className="text-right py-0.5">Posted</th>
                        <th className="text-right py-0.5">System</th>
                        <th className="text-right py-0.5">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {varianceRows(lastResult).map(r => (
                        <tr key={r.key} className="text-[11px]">
                          <td className="py-1 text-gray-700">{r.label}</td>
                          <td className="py-1 text-right text-gray-900">{money(r.posted)}</td>
                          <td className="py-1 text-right text-gray-500">{money(r.system)}</td>
                          <td className={`py-1 text-right font-semibold ${r.matching ? 'text-emerald-600' : 'text-red-600'}`}>
                            {r.matching ? 'Matching' : `${r.variance > 0 ? '+' : ''}${money(r.variance)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-gray-50">
              {!lastResult ? (
                <>
                  <button
                    onClick={() => setShowPostingModal(false)}
                    className="px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitPosting}
                    disabled={submitting}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    {editingPostingId ? 'Update Posting' : 'Submit Posting'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowPostingModal(false)}
                  className="px-3 py-1.5 text-[11px] font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StationSalesDetail
