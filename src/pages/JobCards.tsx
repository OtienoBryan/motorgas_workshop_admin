import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, JobCard } from '../services/api'
import {
  Plus,
  Search,
  ClipboardList,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  User,
  Car,
  Wallet,
  CreditCard,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
}

function jobCardFinancials(jc: JobCard) {
  const items = jc.items || []
  const subtotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0)
  const taxable = items.filter(i => i.taxable !== 0).reduce((sum, i) => sum + Number(i.amount || 0), 0)
  const vat = jc.vat_enabled ? taxable * (Number(jc.vat_rate) / 100) : 0
  const discount = Number(jc.discount || 0)
  const total = subtotal + vat - discount + Number(jc.other_charges || 0)

  const profitFromParts = items.filter(i => i.item_type === 'part')
    .reduce((sum, i) => sum + (Number(i.price || 0) - Number(i.cost || 0)) * Number(i.quantity || 0), 0)
  const profitFromLabor = items.filter(i => i.item_type === 'labor')
    .reduce((sum, i) => sum + Number(i.amount || 0), 0)
  const profit = profitFromParts + profitFromLabor - discount

  const amountPaid = Number(jc.amount_paid || 0)
  const balanceDue = total - amountPaid

  return { total, profit, amountPaid, balanceDue }
}

const PAGE_SIZE = 15

const JobCards: React.FC = () => {
  const navigate = useNavigate()
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { fetchJobCards() }, [])

  const fetchJobCards = async () => {
    try {
      setLoading(true)
      const data = await adminApiService.getJobCards()
      setJobCards(Array.isArray(data) ? data : [])
    } catch {
      setJobCards([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = jobCards.filter(jc => {
    const q = searchTerm.toLowerCase()
    return !q || [jc.conversionClient?.name, jc.conversionVehicle?.registration_number, String(jc.id)]
      .some(v => v?.toLowerCase().includes(q))
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const openCount = jobCards.filter(jc => jc.status === 'open' || jc.status === 'in_progress').length

  const totals = jobCards.reduce((acc, jc) => {
    const fin = jobCardFinancials(jc)
    acc.total += fin.total
    acc.paid += fin.amountPaid
    acc.balance += fin.balanceDue
    acc.profit += fin.profit
    return acc
  }, { total: 0, paid: 0, balance: 0, profit: 0 })

  const money = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-sm font-bold whitespace-nowrap">Job Cards</h1>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">
                {jobCards.length} total
              </span>
              {openCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-[10px] text-blue-300">
                  {openCount} open
                </span>
              )}
            </div>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input
              type="text"
              placeholder="Search client, plate, job #…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <button
            onClick={() => navigate('/job-cards/new')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            New Job Card
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="px-5 pt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Wallet className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Billed</p>
            <p className="text-sm font-bold text-gray-900 truncate">{money(totals.total)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Amount Paid</p>
            <p className="text-sm font-bold text-gray-900 truncate">{money(totals.paid)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Balance Due</p>
            <p className="text-sm font-bold text-gray-900 truncate">{money(totals.balance)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Profit</p>
            <p className="text-sm font-bold text-gray-900 truncate">{money(totals.profit)}</p>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <ClipboardList className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No job cards found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Create your first job card to get started'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Job #</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Vehicle</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Model</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Paid</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Balance Due</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Profit</th>
                  <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(jc => {
                const fin = jobCardFinancials(jc)
                return (
                  <tr key={jc.id}
                    className="group hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/job-cards/${jc.id}`)}>
                    <td className="px-4 py-1.5">
                      <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                        #{jc.id}
                      </span>
                    </td>
                    <td className="px-4 py-1.5">
                      {jc.conversionClient
                        ? <span className="flex items-center gap-1 text-xs text-gray-700 whitespace-nowrap">
                            <User className="h-3 w-3 text-gray-400 shrink-0" />{jc.conversionClient.name}
                          </span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-1.5">
                      {jc.conversionVehicle
                        ? <span className="flex items-center gap-1 text-xs font-mono text-gray-700 whitespace-nowrap">
                            <Car className="h-3 w-3 text-gray-400 shrink-0" />{jc.conversionVehicle.registration_number}
                          </span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-1.5 text-xs text-gray-600 whitespace-nowrap">
                      {jc.conversionVehicle
                        ? [jc.conversionVehicle.year, jc.conversionVehicle.make, jc.conversionVehicle.model].filter(Boolean).join(' ')
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${STATUS_STYLES[jc.status]}`}>
                        {STATUS_LABELS[jc.status]}
                      </span>
                    </td>
                    <td className="px-4 py-1.5 text-xs font-semibold text-gray-900 whitespace-nowrap">
                      KES {fin.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-1.5 text-xs text-gray-700 whitespace-nowrap">
                      KES {fin.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-1.5 text-xs font-medium whitespace-nowrap ${fin.balanceDue > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                      KES {fin.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-1.5 text-xs font-medium text-green-600 whitespace-nowrap">
                      KES {fin.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-1.5 text-right">
                      <button
                        onClick={() => navigate(`/job-cards/${jc.id}`)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
                      >
                        Open
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-xs text-gray-400">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) => n === '…'
                  ? <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
                  : <button key={n} onClick={() => setPage(n as number)}
                      className={`w-7 h-7 text-xs rounded-lg border transition-colors ${
                        safePage === n ? 'bg-green-600 border-green-600 text-white font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}>{n}</button>
                )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating add button ── */}
      <button
        onClick={() => navigate('/job-cards/new')}
        className="fixed bottom-6 right-6 w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-40"
        title="New Job Card"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  )
}

export default JobCards
