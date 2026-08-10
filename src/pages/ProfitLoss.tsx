import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, JobCard, PurchaseOrder } from '../services/api'
import { ESTIMATE_STAGE_STATUSES } from './JobCardForm'
import { COMPANY } from '../components/JobCardInvoiceDocument'
import { exportElementToPdf } from '../utils/pdf'
import { ChevronLeft, Printer, Download, Loader2 } from 'lucide-react'

const money = (n: number) =>
  `Ksh${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const pct = (part: number, whole: number) =>
  whole === 0 ? '0.00%' : `${((part / whole) * 100).toFixed(2)}%`

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const reportDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`

const slugify = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')

const rangeLabel = (from: string, to: string) =>
  `${reportDate(new Date(`${from}T00:00:00`))} – ${reportDate(new Date(`${to}T00:00:00`))}`

const startOfYear = () => `${new Date().getFullYear()}-01-01`
const endOfYear = () => `${new Date().getFullYear()}-12-31`

const sumItems = (jc: JobCard, type: 'part' | 'labor') =>
  (jc.items || []).filter(i => i.item_type === type).reduce((s, i) => s + Number(i.amount || 0), 0)

/** Each drillable statement line, and how to pull its per-invoice figure. */
const DETAIL_SPECS = {
  parts: {
    title: 'Income Detail — Sales (Parts)',
    category: 'Sales',
    amountOf: (jc: JobCard) => sumItems(jc, 'part'),
  },
  labor: {
    title: 'Income Detail — Sales (Labor/Services)',
    category: 'Sales',
    amountOf: (jc: JobCard) => sumItems(jc, 'labor'),
  },
  other: {
    title: 'Income Detail — Other Charges',
    category: 'Other Charges',
    amountOf: (jc: JobCard) => Number(jc.other_charges || 0),
  },
  discounts: {
    title: 'Income Detail — Discounts',
    category: 'Discounts',
    amountOf: (jc: JobCard) => -Number(jc.discount || 0),
  },
  cogs: {
    title: 'Cost of Goods Sold Detail — Invoice-based Parts COGS',
    category: 'Cost of Goods Sold',
    amountOf: (jc: JobCard) =>
      (jc.items || [])
        .filter(i => i.item_type === 'part')
        .reduce((s, i) => s + Number(i.cost || 0) * Number(i.quantity || 0), 0),
  },
} as const

type DetailKey = keyof typeof DETAIL_SPECS

/** One period's figures. Pulled out of the component so it can run twice for comparisons. */
function computeReport(jobCards: JobCard[], purchaseOrders: PurchaseOrder[], fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00`)
  const to = new Date(`${toDate}T23:59:59`)
  const inRange = (value?: string | null) => {
    if (!value) return false
    const d = new Date(value)
    return d >= from && d <= to
  }

  // Accrual basis: an invoice is recognised on its date, not when it is paid.
  // Quotations haven't been billed yet and voided invoices never existed.
  const invoices = jobCards.filter(jc =>
    !ESTIMATE_STAGE_STATUSES.includes(jc.status) &&
    jc.status !== 'voided' &&
    inRange(jc.created_at)
  )

  let partsSales = 0
  let laborSales = 0
  let partsCogs = 0
  let discounts = 0
  let otherCharges = 0

  for (const jc of invoices) {
    for (const item of jc.items || []) {
      const amount = Number(item.amount || 0)
      if (item.item_type === 'part') {
        partsSales += amount
        partsCogs += Number(item.cost || 0) * Number(item.quantity || 0)
      } else {
        laborSales += amount
      }
    }
    discounts += Number(jc.discount || 0)
    otherCharges += Number(jc.other_charges || 0)
  }

  // VAT is collected on behalf of KRA, so it is deliberately excluded from income.
  const totalIncome = partsSales + laborSales + otherCharges - discounts
  const totalCogs = partsCogs
  const grossProfit = totalIncome - totalCogs
  const operatingExpenses = 0
  const netProfit = grossProfit - operatingExpenses

  const purchasesInPeriod = purchaseOrders
    .filter(po => po.status !== 'cancelled' && inRange(po.order_date))
    .reduce((sum, po) => sum + Number(po.total_amount || 0), 0)

  return {
    invoices,
    invoiceCount: invoices.length,
    partsSales, laborSales, otherCharges, discounts,
    totalIncome, partsCogs, totalCogs, grossProfit,
    operatingExpenses, netProfit, purchasesInPeriod,
  }
}

type Report = ReturnType<typeof computeReport>

/** Prior period of the same length, ending the day before the current one starts. */
function priorPeriod(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00`)
  const to = new Date(`${toDate}T00:00:00`)
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1)

  const cmpTo = new Date(from)
  cmpTo.setDate(cmpTo.getDate() - 1)
  const cmpFrom = new Date(cmpTo)
  cmpFrom.setDate(cmpFrom.getDate() - (days - 1))

  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { from: iso(cmpFrom), to: iso(cmpTo) }
}

const ProfitLoss: React.FC = () => {
  const navigate = useNavigate()
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportingDetail, setExportingDetail] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)
  const [fromDate, setFromDate] = useState(startOfYear())
  const [toDate, setToDate] = useState(endOfYear())
  const [compareOn, setCompareOn] = useState(false)
  const [cmpFromDate, setCmpFromDate] = useState(`${new Date().getFullYear() - 1}-01-01`)
  const [cmpToDate, setCmpToDate] = useState(`${new Date().getFullYear() - 1}-12-31`)
  const documentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      adminApiService.getJobCards().catch((): JobCard[] => []),
      adminApiService.getPurchaseOrders().catch((): PurchaseOrder[] => []),
    ])
      .then(([jc, po]) => {
        setJobCards(Array.isArray(jc) ? jc : [])
        setPurchaseOrders(Array.isArray(po) ? po : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const report = useMemo(
    () => computeReport(jobCards, purchaseOrders, fromDate, toDate),
    [jobCards, purchaseOrders, fromDate, toDate]
  )

  const comparison = useMemo(
    () => (compareOn ? computeReport(jobCards, purchaseOrders, cmpFromDate, cmpToDate) : null),
    [compareOn, jobCards, purchaseOrders, cmpFromDate, cmpToDate]
  )

  // Which line the user drilled into, if any.
  const [detailKey, setDetailKey] = useState<DetailKey | null>(null)

  const detail = useMemo(() => {
    if (!detailKey) return null
    const spec = DETAIL_SPECS[detailKey]

    const rows = report.invoices
      .map(jc => ({
        date: jc.created_at,
        reference: `Invoice #${jc.id}`,
        type: 'Invoice',
        category: spec.category,
        amount: spec.amountOf(jc),
        note: [jc.conversionClient?.name, jc.conversionVehicle?.registration_number]
          .filter(Boolean).join(' - '),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      title: spec.title,
      rows,
      total: rows.reduce((sum, r) => sum + r.amount, 0),
    }
  }, [detailKey, report.invoices])

  const handleExportDetailPdf = async () => {
    const target = detailRef.current
    if (!target || !detail) return
    try {
      setExportingDetail(true)
      await exportElementToPdf(target, `${slugify(detail.title)}-${fromDate}-to-${toDate}.pdf`)
    } catch {
      alert('Failed to export PDF')
    } finally {
      setExportingDetail(false)
    }
  }

  const handleExportDetailCsv = () => {
    if (!detail) return
    const header = ['Date', 'Reference', 'Type', 'Category', 'Amount', 'Note']
    const lines = detail.rows.map(r => [
      reportDate(new Date(r.date)),
      r.reference,
      r.type,
      r.category,
      r.amount.toFixed(2),
      r.note,
    ])
    lines.push(['', '', '', 'Total', detail.total.toFixed(2), ''])

    const csv = [header, ...lines]
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${slugify(detail.title)}-${fromDate}-to-${toDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = async () => {
    const target = documentRef.current?.querySelector('.pl-printable') as HTMLElement | null
    if (!target) return
    try {
      setExporting(true)
      await exportElementToPdf(target, `Profit-and-Loss-${fromDate}-to-${toDate}.pdf`)
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

  const colCount = comparison ? 7 : 3

  const sectionRow = (label: string) => (
    <tr className="bg-blue-50/60">
      <td className="px-4 py-2 text-xs font-bold text-gray-900" colSpan={colCount}>{label}</td>
    </tr>
  )

  /** Comparison cells: prior amount, prior % of its own income, and the variance. */
  const compareCells = (current: number, prior: number, bold = false) => {
    if (!comparison) return null
    const change = current - prior
    const changePct = prior === 0 ? null : (change / Math.abs(prior)) * 100
    // For discounts and COGS a rise is unwelcome, so colour by direction only.
    const tone = change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-gray-400'
    const weight = bold ? 'font-bold' : ''

    return (
      <>
        <td className={`px-4 py-2 text-xs text-gray-900 text-right whitespace-nowrap bg-blue-50/20 ${weight}`}>
          {money(prior)}
        </td>
        <td className={`px-4 py-2 text-xs text-gray-700 text-right whitespace-nowrap bg-blue-50/20 ${weight}`}>
          {pct(prior, comparison.totalIncome)}
        </td>
        <td className={`px-4 py-2 text-xs text-right whitespace-nowrap ${tone} ${weight}`}>
          {change >= 0 ? '+' : '−'}{money(Math.abs(change)).replace('Ksh', 'Ksh')}
        </td>
        <td className={`px-4 py-2 text-xs text-right whitespace-nowrap ${tone} ${weight}`}>
          {changePct === null ? '—' : `${changePct >= 0 ? '+' : '−'}${Math.abs(changePct).toFixed(2)}%`}
        </td>
      </>
    )
  }

  const lineRow = (label: string, amount: number, priorOf?: (r: Report) => number, key?: DetailKey) => (
    <tr
      className={`border-b border-gray-100 ${key ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''} ${key && detailKey === key ? 'bg-blue-50/40' : ''}`}
      onClick={key ? () => setDetailKey(detailKey === key ? null : key) : undefined}
    >
      <td className="px-4 py-2 pl-8 text-xs text-gray-700">
        {label}
        {key && <span className="no-print ml-2 text-[10px] text-gray-300">view detail</span>}
      </td>
      <td className="px-4 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{money(amount)}</td>
      <td className="px-4 py-2 text-xs text-gray-700 text-right whitespace-nowrap">
        {pct(amount, report.totalIncome)}
      </td>
      {comparison && priorOf && compareCells(amount, priorOf(comparison))}
    </tr>
  )

  const totalRow = (label: string, amount: number, priorOf?: (r: Report) => number, emphasis = false) => (
    <tr className={`border-b border-gray-200 ${emphasis ? 'bg-emerald-50/60' : ''}`}>
      <td className={`px-4 py-2 text-xs font-bold ${emphasis ? 'text-emerald-700' : 'text-gray-900'}`}>{label}</td>
      <td className={`px-4 py-2 text-xs font-bold text-right whitespace-nowrap ${emphasis ? 'text-emerald-700' : 'text-gray-900'}`}>
        {money(amount)}
      </td>
      <td className={`px-4 py-2 text-xs font-bold text-right whitespace-nowrap ${emphasis ? 'text-emerald-700' : 'text-gray-900'}`}>
        {pct(amount, report.totalIncome)}
      </td>
      {comparison && priorOf && compareCells(amount, priorOf(comparison), true)}
    </tr>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .pl-printable, .pl-printable * { visibility: visible; }
          .pl-printable { position: absolute; top: 0; left: 0; width: 100%; margin: 0; box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── Toolbar ── */}
      {/* Sits below the app top bar (h-10 in Layout), which is also sticky at top-0. */}
      <div className="no-print sticky top-10 z-20 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => navigate('/accounts')} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" /> Back to Accounting
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-gray-500">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <label className="text-xs text-gray-500">To</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
          />

          <label className="flex items-center gap-1.5 ml-3 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={compareOn}
              onChange={e => setCompareOn(e.target.checked)}
              className="accent-green-600"
            />
            Compare
          </label>

          {compareOn && (
            <>
              <input
                type="date"
                value={cmpFromDate}
                onChange={e => setCmpFromDate(e.target.value)}
                className="px-2 py-1.5 text-xs border border-blue-200 bg-blue-50/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={cmpToDate}
                onChange={e => setCmpToDate(e.target.value)}
                className="px-2 py-1.5 text-xs border border-blue-200 bg-blue-50/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  const prior = priorPeriod(fromDate, toDate)
                  setCmpFromDate(prior.from)
                  setCmpToDate(prior.to)
                }}
                className="px-2 py-1.5 text-[11px] font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
                title="Set the comparison to the period of equal length immediately before the current one"
              >
                Prior period
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {/* ── Statement ── */}
      <div ref={documentRef}>
        <div className="pl-printable bg-white mx-4 my-6 shadow-lg rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h1 className="text-lg text-gray-800">Profit and Loss</h1>
            <p className="text-xs font-bold text-gray-600">{COMPANY.name}</p>
            <p className="text-[11px] font-bold text-gray-700 mt-1">
              Date Range: {reportDate(new Date(`${fromDate}T00:00:00`))} to {reportDate(new Date(`${toDate}T00:00:00`))}
              {'  '}Report Type: Accrual (Invoice Date)
            </p>
            {comparison && (
              <p className="text-[11px] font-bold text-blue-700">
                Compared To: {rangeLabel(cmpFromDate, cmpToDate)}
              </p>
            )}

            <div className="flex gap-12 mt-4">
              <div>
                <p className="text-[11px] font-bold text-gray-700">Generated On</p>
                <p className="text-[11px] font-bold text-gray-700">
                  {reportDate(new Date())} {new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-700">Purchases in Period</p>
                <p className="text-[11px] font-bold text-gray-700">{money(report.purchasesInPeriod)}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-700">Invoices in Period</p>
                <p className="text-[11px] font-bold text-gray-700">{report.invoiceCount}</p>
              </div>
            </div>
          </div>

          <table className="w-full border-t border-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Accounts</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-gray-700">
                  Amount
                  {comparison && <span className="block text-[10px] font-normal text-gray-400">{rangeLabel(fromDate, toDate)}</span>}
                </th>
                <th className="px-4 py-2 text-right text-xs font-bold text-gray-700">% of Income</th>
                {comparison && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 bg-blue-50/40">
                      Amount
                      <span className="block text-[10px] font-normal text-gray-400">{rangeLabel(cmpFromDate, cmpToDate)}</span>
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 bg-blue-50/40">% of Income</th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700">Change</th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700">Change %</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sectionRow('Income')}
              {lineRow('Sales (Parts)', report.partsSales, r => r.partsSales, 'parts')}
              {lineRow('Sales (Labor/Services)', report.laborSales, r => r.laborSales, 'labor')}
              {report.otherCharges > 0 && lineRow('Other Charges', report.otherCharges, r => r.otherCharges, 'other')}
              {lineRow('Discounts', -report.discounts, r => -r.discounts, 'discounts')}
              {totalRow('Total Income', report.totalIncome, r => r.totalIncome)}

              {sectionRow('Cost of Goods Sold')}
              {lineRow('Invoice-based Parts COGS', report.partsCogs, r => r.partsCogs, 'cogs')}
              {totalRow('Total Cost of Goods Sold', report.totalCogs, r => r.totalCogs)}
              {totalRow('Gross Profit', report.grossProfit, r => r.grossProfit)}

              {sectionRow('Operating Expenses')}
              {totalRow('Total Operating Expenses', report.operatingExpenses, r => r.operatingExpenses)}

              {totalRow('Net Profit', report.netProfit, r => r.netProfit, true)}
            </tbody>
          </table>

          {/* ── Drill-down detail ── */}
          {detail && (
            <div className="border-t border-gray-200 px-6 py-6 relative">
              {/* Kept outside detailRef so the buttons never land in the exported PDF. */}
              <div className="no-print absolute right-6 top-6 flex items-center gap-2">
                <button
                  onClick={handleExportDetailCsv}
                  disabled={detail.rows.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> CSV
                </button>
                <button
                  onClick={handleExportDetailPdf}
                  disabled={exportingDetail || detail.rows.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  {exportingDetail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {exportingDetail ? 'Exporting…' : 'PDF'}
                </button>
                <button
                  onClick={() => setDetailKey(null)}
                  className="text-xs text-gray-400 hover:text-gray-700 ml-1"
                >
                  Close
                </button>
              </div>

              <div ref={detailRef} className="bg-white">
                <h2 className="text-base font-bold text-gray-900">{detail.title}</h2>
                <p className="text-[11px] text-gray-500 mb-3">
                  {COMPANY.name} · {rangeLabel(fromDate, toDate)}
                </p>

                {detail.rows.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No entries in this period.</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Reference</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Category</th>
                        <th className="px-4 py-2 text-right text-xs font-bold text-gray-700">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.rows.map((r, i) => (
                        <tr key={`${r.reference}-${i}`} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-xs text-gray-700 whitespace-nowrap">
                            {reportDate(new Date(r.date))}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-700 whitespace-nowrap">{r.reference}</td>
                          <td className="px-4 py-2 text-xs text-gray-700">{r.type}</td>
                          <td className="px-4 py-2 text-xs text-gray-700">{r.category}</td>
                          <td className="px-4 py-2 text-xs text-gray-900 text-right whitespace-nowrap">
                            {money(r.amount)}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-700">{r.note || '—'}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td className="px-4 py-2 text-xs font-bold text-gray-900" colSpan={4}>
                          Total ({detail.rows.length} {detail.rows.length === 1 ? 'entry' : 'entries'})
                        </td>
                        <td className="px-4 py-2 text-xs font-bold text-gray-900 text-right whitespace-nowrap">
                          {money(detail.total)}
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">
              Accrual basis — revenue is recognised on the invoice date, not when payment is received.
              VAT is excluded from income. Quotations and voided invoices are not included.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfitLoss
