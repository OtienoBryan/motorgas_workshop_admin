import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService, Station, StationLpgLedgerEntry } from '../services/api'
import {
  ArrowLeft,
  Loader2,
  Download,
  Fuel,
  ArrowDownCircle,
  ArrowUpCircle,
  SlidersHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// 0 = show every record on one page.
const PAGE_SIZE_OPTIONS = [15, 25, 50, 100, 0]
const pageSizeLabel = (n: number) => (n === 0 ? 'All' : `${n} / page`)

const qty = (n: number) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TYPE_STYLES: Record<StationLpgLedgerEntry['transactionType'], string> = {
  IN: 'bg-emerald-100 text-emerald-700',
  OUT: 'bg-red-100 text-red-700',
  ADJUSTMENT: 'bg-amber-100 text-amber-700',
}

type TypeFilter = 'all' | StationLpgLedgerEntry['transactionType']

const StationLpgLedgerPage: React.FC = () => {
  const navigate = useNavigate()
  const { stationId } = useParams<{ stationId: string }>()

  const [entries, setEntries] = useState<StationLpgLedgerEntry[]>([])
  const [station, setStation] = useState<Station | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])

  useEffect(() => {
    if (!stationId) return
    setLoading(true)
    Promise.all([
      adminApiService.getStationLpgLedger(Number(stationId)),
      adminApiService.getStations(),
    ])
      .then(([led, st]) => {
        setEntries(Array.isArray(led) ? led : [])
        setStation((Array.isArray(st) ? st : []).find(s => s.id === Number(stationId)) || null)
      })
      .finally(() => setLoading(false))
  }, [stationId])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return entries.filter(e => {
      if (typeFilter !== 'all' && e.transactionType !== typeFilter) return false
      return !q || [e.referenceNumber, e.notes, e.createdByStaff?.name].some(v => v?.toLowerCase().includes(q))
    })
  }, [entries, typeFilter, searchTerm])

  const showingAll = pageSize === 0
  const effectivePageSize = showingAll ? Math.max(filtered.length, 1) : pageSize
  const totalPages = Math.max(1, Math.ceil(filtered.length / effectivePageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = showingAll
    ? filtered
    : filtered.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize)

  // A narrowed result set can leave you stranded on a page that no longer exists.
  useEffect(() => { setPage(1) }, [typeFilter, searchTerm, pageSize])

  const totals = entries.reduce(
    (acc, e) => ({
      in: acc.in + Number(e.quantityIn || 0),
      out: acc.out + Number(e.quantityOut || 0),
    }),
    { in: 0, out: 0 }
  )

  // Entries arrive newest-first, so the first row carries the current balance.
  const currentBalance = entries.length > 0 ? Number(entries[0].balance || 0) : Number(station?.lpgQuantity || 0)

  const exportToCSV = () => {
    if (filtered.length === 0) {
      alert('No data to export')
      return
    }
    const headers = ['Date', 'Type', 'Quantity In', 'Quantity Out', 'Previous', 'New', 'Balance', 'Reference', 'Recorded By', 'Notes']
    const escapeCSV = (v: string) => (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v
    const rows = filtered.map(e => [
      new Date(e.created_at).toLocaleString(),
      e.transactionType,
      Number(e.quantityIn || 0).toFixed(2),
      Number(e.quantityOut || 0).toFixed(2),
      Number(e.previousQuantity || 0).toFixed(2),
      Number(e.newQuantity || 0).toFixed(2),
      Number(e.balance || 0).toFixed(2),
      escapeCSV(e.referenceNumber || ''),
      escapeCSV(e.createdByStaff?.name || ''),
      escapeCSV(e.notes || ''),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `lpg-ledger-${(station?.name || `station-${stationId}`).replace(/\s+/g, '-')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Page header ── */}
      <div className="text-white px-5 py-3" style={{ backgroundColor: '#0b0f24' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/inventory/lpg')}
            className="p-1 text-white/70 hover:text-white"
            title="Back to LPG Inventory"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-sm font-bold whitespace-nowrap">
              {station ? station.name.trim() : 'Station'} — LPG Ledger
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">
              {entries.length} movements
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-white/40" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as TypeFilter)}
              className="px-2 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="all" className="text-gray-900">All Types</option>
              <option value="IN" className="text-gray-900">In</option>
              <option value="OUT" className="text-gray-900">Out</option>
              <option value="ADJUSTMENT" className="text-gray-900">Adjustment</option>
            </select>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input
              type="text"
              placeholder="Search reference, notes…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="px-5 pt-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total In</p>
            <p className="text-sm font-bold text-gray-900 truncate">{qty(totals.in)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Out</p>
            <p className="text-sm font-bold text-gray-900 truncate">{qty(totals.out)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Fuel className="h-4 w-4 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Current Balance</p>
            <p className="text-sm font-bold text-gray-900 truncate">{qty(currentBalance)}</p>
          </div>
        </div>
      </div>

      {/* ── Ledger table ── */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Fuel className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No ledger entries</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm || typeFilter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'LPG movements for this station will appear here'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">In</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Out</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Previous</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">New</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Balance</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Reference</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Recorded By</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_STYLES[e.transactionType]}`}>
                          {e.transactionType}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 text-xs text-right whitespace-nowrap text-emerald-600 font-medium">
                        {Number(e.quantityIn || 0) > 0 ? qty(e.quantityIn) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5 text-xs text-right whitespace-nowrap text-red-600 font-medium">
                        {Number(e.quantityOut || 0) > 0 ? qty(e.quantityOut) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5 text-xs text-gray-500 text-right whitespace-nowrap">{qty(e.previousQuantity)}</td>
                      <td className="px-4 py-1.5 text-xs text-gray-700 text-right whitespace-nowrap">{qty(e.newQuantity)}</td>
                      <td className="px-4 py-1.5 text-xs text-gray-900 text-right font-semibold whitespace-nowrap">{qty(e.balance)}</td>
                      <td className="px-4 py-1.5 text-xs text-gray-600 font-mono">
                        {e.referenceNumber || <span className="text-gray-300 font-sans">—</span>}
                      </td>
                      <td className="px-4 py-1.5 text-xs text-gray-600 whitespace-nowrap">
                        {e.createdByStaff?.name || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5 text-xs text-gray-600 max-w-xs truncate">
                        {e.notes || <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400">
                {showingAll
                  ? `Showing all ${filtered.length}`
                  : `Showing ${(safePage - 1) * effectivePageSize + 1}–${Math.min(safePage * effectivePageSize, filtered.length)} of ${filtered.length}`}
              </p>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="border border-gray-200 rounded px-1 py-0.5 text-[10px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{pageSizeLabel(size)}</option>
                ))}
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                  .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                    if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                    acc.push(n); return acc
                  }, [])
                  .map((n, i) => n === '…'
                    ? <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
                    : <button key={n} onClick={() => setPage(n as number)}
                        className={`w-7 h-7 text-xs rounded-lg border transition-colors ${safePage === n ? 'bg-green-600 border-green-600 text-white font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                        {n}
                      </button>
                  )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default StationLpgLedgerPage
