import React, { useState, useEffect, useMemo } from 'react'
import { adminApiService, Station, StationExpense } from '../services/api'
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  CalendarDays,
  Receipt,
  Download,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

const PAGE_SIZE_OPTIONS = [15, 25, 50, 100, 0]
const pageSizeLabel = (n: number) => (n === 0 ? 'All' : `${n} / page`)

const PAYMENT_METHODS = ['CASH', 'M-PESA', 'CARD', 'BANK', 'OTHER']

const money = (n: number) => `KES ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const todayInput = () => new Date().toISOString().slice(0, 10)
const dateOnly = (v: string) => String(v).slice(0, 10)

const methodStyle = (m: string) => {
  switch (m.toUpperCase()) {
    case 'CASH': return 'bg-emerald-100 text-emerald-700'
    case 'M-PESA': return 'bg-green-100 text-green-700'
    case 'CARD': return 'bg-blue-100 text-blue-700'
    case 'BANK': return 'bg-indigo-100 text-indigo-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

interface ExpenseDraft {
  station_id: string
  amount: string
  expense_date: string
  comment: string
  payment_method: string
}

const emptyDraft = (): ExpenseDraft => ({
  station_id: '', amount: '', expense_date: todayInput(), comment: '', payment_method: 'CASH',
})

const StationExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<StationExpense[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stationFilter, setStationFilter] = useState<'all' | number>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StationExpense | null>(null)
  const [draft, setDraft] = useState<ExpenseDraft>(emptyDraft())
  const [saving, setSaving] = useState(false)

  const fetchExpenses = () =>
    adminApiService.getStationExpenses()
      .then(d => setExpenses(Array.isArray(d) ? d : []))
      .catch(() => setExpenses([]))

  useEffect(() => {
    Promise.all([
      fetchExpenses(),
      adminApiService.getStations().then(d => setStations(Array.isArray(d) ? d : [])).catch(() => setStations([])),
    ]).finally(() => setLoading(false))
  }, [])

  const stationName = (e: StationExpense) =>
    e.station?.name?.trim() || stations.find(s => s.id === e.station_id)?.name?.trim() || `Station ${e.station_id}`

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return expenses.filter(e => {
      if (stationFilter !== 'all' && e.station_id !== stationFilter) return false
      const d = dateOnly(e.expense_date)
      if (fromDate && d < fromDate) return false
      if (toDate && d > toDate) return false
      return !q || [e.comment, e.payment_method, e.user?.name, stationName(e)]
        .some(v => v?.toLowerCase().includes(q))
    })
  }, [expenses, searchTerm, stationFilter, fromDate, toDate, stations])

  const showingAll = pageSize === 0
  const effectivePageSize = showingAll ? Math.max(filtered.length, 1) : pageSize
  const totalPages = Math.max(1, Math.ceil(filtered.length / effectivePageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = showingAll
    ? filtered
    : filtered.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize)

  useEffect(() => { setPage(1) }, [searchTerm, stationFilter, fromDate, toDate, pageSize])

  const total = filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const thisMonthTotal = filtered
    .filter(e => dateOnly(e.expense_date).slice(0, 7) === todayInput().slice(0, 7))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0)

  const openCreate = () => {
    setEditing(null)
    setDraft({ ...emptyDraft(), station_id: stationFilter !== 'all' ? String(stationFilter) : '' })
    setModalOpen(true)
  }

  const openEdit = (e: StationExpense) => {
    setEditing(e)
    setDraft({
      station_id: String(e.station_id),
      amount: String(e.amount ?? ''),
      expense_date: dateOnly(e.expense_date),
      comment: e.comment || '',
      payment_method: e.payment_method || 'CASH',
    })
    setModalOpen(true)
  }

  const save = async () => {
    const amount = Number(draft.amount)
    if (!draft.station_id) { alert('Select a station'); return }
    if (!draft.amount || isNaN(amount) || amount <= 0) { alert('Enter an amount greater than zero'); return }
    if (!draft.expense_date) { alert('Choose an expense date'); return }
    if (!draft.payment_method) { alert('Select a payment method'); return }

    const payload = {
      station_id: Number(draft.station_id),
      amount,
      expense_date: draft.expense_date,
      comment: draft.comment.trim(),
      payment_method: draft.payment_method,
    }

    try {
      setSaving(true)
      if (editing) {
        await adminApiService.updateStationExpense(editing.id, payload)
      } else {
        await adminApiService.createStationExpense(payload)
      }
      await fetchExpenses()
      setModalOpen(false)
      setEditing(null)
    } catch (error) {
      alert(`Failed to save expense: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (e: StationExpense) => {
    if (!confirm(`Delete this ${money(Number(e.amount))} expense? This cannot be undone.`)) return
    try {
      await adminApiService.deleteStationExpense(e.id)
      await fetchExpenses()
    } catch (error) {
      alert(`Failed to delete: ${(error as any).message || 'Unknown error'}`)
    }
  }

  const exportToCSV = () => {
    if (filtered.length === 0) { alert('No data to export'); return }
    const headers = ['Date', 'Station', 'Amount', 'Payment Method', 'Comment', 'Recorded By']
    const escapeCSV = (v: string) => (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v
    const rows = filtered.map(e => [
      dateOnly(e.expense_date),
      escapeCSV(stationName(e)),
      Number(e.amount || 0).toFixed(2),
      escapeCSV(e.payment_method || ''),
      escapeCSV(e.comment || ''),
      escapeCSV(e.user?.name || ''),
    ])
    rows.push(['TOTAL', '', total.toFixed(2), '', '', ''])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `station-expenses-${new Date().toISOString().split('T')[0]}.csv`
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
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-sm font-bold whitespace-nowrap">Station Expenses</h1>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">
              {expenses.length} recorded
            </span>
          </div>

          <select
            value={stationFilter}
            onChange={e => setStationFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-2 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all" className="text-gray-900">All Stations</option>
            {stations.map(s => (
              <option key={s.id} value={s.id} className="text-gray-900">{s.name.trim()}</option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            title="From date"
            className="px-2 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            title="To date"
            className="px-2 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-green-500"
          />

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input
              type="text"
              placeholder="Search comment, staff…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="px-5 pt-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <Wallet className="h-4 w-4 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Expenses</p>
            <p className="text-sm font-bold text-gray-900 truncate">{money(total)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">This Month</p>
            <p className="text-sm font-bold text-gray-900 truncate">{money(thisMonthTotal)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Receipt className="h-4 w-4 text-gray-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Entries Shown</p>
            <p className="text-sm font-bold text-gray-900 truncate">{filtered.length}</p>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Wallet className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No expenses found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm || stationFilter !== 'all' || fromDate || toDate
                ? 'Try adjusting your search or filters'
                : 'Record your first station expense to get started'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Station</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Comment</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Method</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Recorded By</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {new Date(`${dateOnly(e.expense_date)}T00:00:00`).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-1.5 text-xs text-gray-700 whitespace-nowrap">{stationName(e)}</td>
                      <td className="px-4 py-1.5 text-xs text-gray-600 max-w-xs truncate">
                        {e.comment || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${methodStyle(e.payment_method || '')}`}>
                          {e.payment_method || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 text-xs text-gray-600 whitespace-nowrap">
                        {e.user?.name || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5 text-xs font-semibold text-gray-900 text-right whitespace-nowrap">
                        {money(Number(e.amount))}
                      </td>
                      <td className="px-4 py-1.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(e)} className="text-indigo-600 hover:text-indigo-900" title="Edit expense">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={() => remove(e)} className="text-red-600 hover:text-red-900" title="Delete expense">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-100">
                  <tr>
                    <td className="px-4 py-2 text-xs font-bold text-gray-900" colSpan={5}>Total</td>
                    <td className="px-4 py-2 text-xs font-bold text-gray-900 text-right whitespace-nowrap">{money(total)}</td>
                    <td className="px-4 py-2"></td>
                  </tr>
                </tfoot>
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

      {/* ── Add / edit modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {editing ? 'Edit Expense' : 'Record Expense'}
                </h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Station *</label>
                <select
                  value={draft.station_id}
                  onChange={e => setDraft({ ...draft, station_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">Select a station</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name.trim()}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount *</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={draft.amount}
                    onChange={e => setDraft({ ...draft, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    value={draft.expense_date}
                    onChange={e => setDraft({ ...draft, expense_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
                <select
                  value={draft.payment_method}
                  onChange={e => setDraft({ ...draft, payment_method: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Comment</label>
                <textarea
                  value={draft.comment}
                  onChange={e => setDraft({ ...draft, comment: e.target.value })}
                  rows={2}
                  placeholder="What was this expense for?"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {saving ? 'Saving…' : editing ? 'Update Expense' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StationExpenses
