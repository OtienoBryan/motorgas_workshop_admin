import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService, Vendor, VendorLedgerEntry } from '../services/api'
import {
  ChevronLeft, Loader2, BookOpen,
  TrendingUp, TrendingDown, ArrowUpDown,
  ChevronRight, Search
} from 'lucide-react'

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

const TX_STYLE: Record<string, { cls: string; icon: React.ReactNode }> = {
  PURCHASE:   { cls: 'bg-red-100 text-red-700',    icon: <TrendingUp className="h-3 w-3" />   },
  PAYMENT:    { cls: 'bg-green-100 text-green-700', icon: <TrendingDown className="h-3 w-3" /> },
  ADJUSTMENT: { cls: 'bg-amber-100 text-amber-700', icon: <ArrowUpDown className="h-3 w-3" />  },
}

const PAGE_SIZE = 25

const VendorLedger: React.FC = () => {
  const navigate = useNavigate()
  const { vendorId } = useParams<{ vendorId: string }>()

  const [vendor, setVendor]   = useState<Vendor | null>(null)
  const [entries, setEntries] = useState<VendorLedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)

  useEffect(() => {
    if (!vendorId) return
    const id = Number(vendorId)
    Promise.all([
      adminApiService.getVendors(),
      adminApiService.getVendorLedger(id),
    ]).then(([vendors, ledger]) => {
      const found = (Array.isArray(vendors) ? vendors : []).find(v => v.id === id) ?? null
      setVendor(found)
      setEntries(Array.isArray(ledger) ? ledger : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [vendorId])

  const filtered = entries.filter(e => {
    const q = search.toLowerCase()
    return !q || e.reference_number?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.transaction_type.toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalDebits  = entries.reduce((s, e) => s + Number(e.debit), 0)
  const totalCredits = entries.reduce((s, e) => s + Number(e.credit), 0)

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-green-600" />
    </div>
  )

  if (!vendor) return (
    <div className="min-h-screen bg-gray-50 p-4">
      <button onClick={() => navigate('/vendors')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ChevronLeft className="h-4 w-4" /> Back to Vendors
      </button>
      <p className="text-center text-sm text-gray-400 mt-16">Vendor not found.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="text-white px-5 pt-3 pb-4" style={{ backgroundColor: '#0b0f24' }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/vendors')}
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Vendors
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center text-sm font-bold shrink-0">
            {getInitials(vendor.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight">{vendor.name}</h1>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                vendor.status === 'active' ? 'bg-green-500/30 text-green-200' : 'bg-white/10 text-white/60'
              }`}>{vendor.status}</span>
              {vendor.phone && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 text-white/70">{vendor.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-3 bg-white border-b border-gray-200 divide-x divide-gray-200">
        <div className="px-5 py-4 text-center">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Purchases</p>
          <p className="text-lg font-bold text-red-600">KES {totalDebits.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{entries.filter(e => e.transaction_type === 'PURCHASE').length} transactions</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Payments</p>
          <p className="text-lg font-bold text-green-600">KES {totalCredits.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{entries.filter(e => e.transaction_type === 'PAYMENT').length} payments</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Balance Owed</p>
          <p className={`text-lg font-bold ${Number(vendor.current_balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
            KES {Number(vendor.current_balance).toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">{entries.length} total entries</p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-5 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by reference, description or type…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-8 w-8 text-gray-200 mb-2" />
            <p className="text-sm font-medium text-gray-400">
              {entries.length === 0 ? 'No transactions yet' : 'No results for your search'}
            </p>
            {entries.length === 0 && <p className="text-xs text-gray-300 mt-1">Entries appear when POs are received</p>}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Reference</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Debit</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Credit</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(e => {
                  const st = TX_STYLE[e.transaction_type] ?? TX_STYLE.ADJUSTMENT
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(e.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.cls}`}>
                          {st.icon}{e.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                          {e.reference_number || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                        {e.description || e.notes || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-red-600 whitespace-nowrap">
                        {Number(e.debit) > 0 ? `KES ${Number(e.debit).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-green-600 whitespace-nowrap">
                        {Number(e.credit) > 0 ? `KES ${Number(e.credit).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 whitespace-nowrap">
                        KES {Number(e.balance).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-xs text-gray-400">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
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
          </div>
        )}
      </div>
    </div>
  )
}

export default VendorLedger
