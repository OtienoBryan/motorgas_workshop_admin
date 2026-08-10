import React, { useState, useEffect, useRef } from 'react'
import { adminApiService, JobCardPayment, JobCardPaymentMethod } from '../services/api'
import PaymentReceiptDocument from '../components/PaymentReceiptDocument'
import { exportElementToPdf } from '../utils/pdf'
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Receipt,
  CalendarDays,
  Printer,
  Download,
  X,
} from 'lucide-react'

const PAYMENT_METHOD_LABELS: Record<JobCardPaymentMethod, string> = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  other: 'Other',
}

const PAYMENT_METHOD_STYLES: Record<JobCardPaymentMethod, string> = {
  cash: 'bg-emerald-100 text-emerald-700',
  mobile_money: 'bg-green-100 text-green-700',
  card: 'bg-blue-100 text-blue-700',
  bank_transfer: 'bg-indigo-100 text-indigo-700',
  cheque: 'bg-amber-100 text-amber-700',
  other: 'bg-gray-100 text-gray-600',
}

const PAGE_SIZE = 15

const isThisMonth = (date: string) => {
  const d = new Date(date)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<JobCardPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [methodFilter, setMethodFilter] = useState<'all' | JobCardPaymentMethod>('all')
  const [page, setPage] = useState(1)
  const [receiptPayment, setReceiptPayment] = useState<JobCardPayment | null>(null)
  const [exporting, setExporting] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchPayments() }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const data = await adminApiService.getAllPayments()
      setPayments(Array.isArray(data) ? data : [])
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = payments.filter(p => {
    if (methodFilter !== 'all' && p.payment_method !== methodFilter) return false
    const q = searchTerm.toLowerCase()
    return !q || [
      p.jobCard?.conversionClient?.name,
      p.reference,
      p.postedBy?.name,
      String(p.job_card_id),
    ].some(v => v?.toLowerCase().includes(q))
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const thisMonth = payments
    .filter(p => isThisMonth(p.payment_date))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const money = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const handleExportReceipt = async () => {
    const target = receiptRef.current?.querySelector('.receipt-printable') as HTMLElement | null
    if (!target || !receiptPayment) return
    try {
      setExporting(true)
      const clientName = receiptPayment.jobCard?.conversionClient?.name?.trim().replace(/[^a-zA-Z0-9]+/g, '-') || 'Client'
      await exportElementToPdf(target, `Receipt-${clientName}-${receiptPayment.id}.pdf`)
    } catch {
      alert('Failed to export PDF')
    } finally {
      setExporting(false)
    }
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
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-sm font-bold whitespace-nowrap">Payments</h1>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">
              {payments.length} recorded
            </span>
          </div>

          <select
            value={methodFilter}
            onChange={e => { setMethodFilter(e.target.value as 'all' | JobCardPaymentMethod); setPage(1) }}
            className="px-2 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all" className="text-gray-900">All Methods</option>
            {(Object.keys(PAYMENT_METHOD_LABELS) as JobCardPaymentMethod[]).map(m => (
              <option key={m} value={m} className="text-gray-900">{PAYMENT_METHOD_LABELS[m]}</option>
            ))}
          </select>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input
              type="text"
              placeholder="Search client, reference, invoice #…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="px-5 pt-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Wallet className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Collected</p>
            <p className="text-sm font-bold text-gray-900 truncate">{money(totalCollected)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">This Month</p>
            <p className="text-sm font-bold text-gray-900 truncate">{money(thisMonth)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <Receipt className="h-4 w-4 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Payments Posted</p>
            <p className="text-sm font-bold text-gray-900 truncate">{payments.length}</p>
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
            <p className="text-sm font-medium text-gray-500">No payments found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm || methodFilter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Payments posted against job cards will appear here'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Invoice #</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Method</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Reference</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Posted By</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(p => (
                    <tr
                      key={p.id}
                      className="group hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setReceiptPayment(p)}
                    >
                      <td className="px-4 py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-1.5">
                        <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                          #{p.job_card_id}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 text-xs text-gray-700">
                        {p.jobCard?.conversionClient?.name || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${PAYMENT_METHOD_STYLES[p.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                          {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 text-xs text-gray-600 font-mono">
                        {p.reference || <span className="text-gray-300 font-sans">—</span>}
                      </td>
                      <td className="px-4 py-1.5 text-xs text-gray-600 whitespace-nowrap">
                        {p.postedBy?.name || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5 text-xs font-semibold text-gray-900 text-right whitespace-nowrap">
                        {money(Number(p.amount))}
                      </td>
                      <td className="px-4 py-1.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 group-hover:text-green-600 transition-colors">
                          <Receipt className="h-3.5 w-3.5" /> Receipt
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* ── Receipt modal ── */}
      {receiptPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .receipt-printable, .receipt-printable * { visibility: visible; }
              .receipt-printable { position: absolute; top: 0; left: 0; width: 100%; margin: 0; box-shadow: none !important; border: none !important; border-radius: 0 !important; }
              .no-print { display: none !important; }
            }
          `}</style>

          <div className="max-w-3xl mx-auto">
            <div className="no-print flex items-center justify-between bg-white rounded-t-2xl px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-green-600" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Receipt RCP-{String(receiptPayment.id).padStart(5, '0')}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportReceipt}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {exporting ? 'Exporting…' : 'Export PDF'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
                <button
                  onClick={() => setReceiptPayment(null)}
                  className="text-gray-400 hover:text-gray-700 ml-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div ref={receiptRef}>
              <PaymentReceiptDocument
                payment={receiptPayment}
                className="receipt-printable rounded-t-none shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments
