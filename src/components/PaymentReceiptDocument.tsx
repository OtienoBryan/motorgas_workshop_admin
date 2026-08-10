import React from 'react'
import { JobCardPayment, JobCardPaymentMethod } from '../services/api'
import { COMPANY, jobCardFinancials, money } from './JobCardInvoiceDocument'

const METHOD_LABELS: Record<JobCardPaymentMethod, string> = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  other: 'Other',
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function threeDigitsToWords(n: number): string {
  const parts: string[] = []
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`)
    n %= 100
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)])
    n %= 10
  }
  if (n > 0) parts.push(ONES[n])
  return parts.join(' ')
}

/** Receipts are expected to state the amount in words, so it can't be altered after issue. */
export function amountInWords(amount: number): string {
  const shillings = Math.floor(Math.abs(amount))
  const cents = Math.round((Math.abs(amount) - shillings) * 100)

  let words = ''
  if (shillings === 0) {
    words = 'Zero'
  } else {
    const scales = [
      { value: 1_000_000_000, name: 'Billion' },
      { value: 1_000_000, name: 'Million' },
      { value: 1_000, name: 'Thousand' },
      { value: 1, name: '' },
    ]
    const parts: string[] = []
    let remaining = shillings
    for (const { value, name } of scales) {
      const chunk = Math.floor(remaining / value)
      if (chunk > 0) {
        parts.push(`${threeDigitsToWords(chunk)}${name ? ` ${name}` : ''}`)
        remaining %= value
      }
    }
    words = parts.join(' ')
  }

  const centsText = cents > 0 ? ` and ${threeDigitsToWords(cents)} Cents` : ''
  return `${words} Shillings${centsText} Only`
}

interface PaymentReceiptDocumentProps {
  payment: JobCardPayment
  className?: string
}

/** The visual receipt itself — no toolbar, so it can be embedded in a page or modal. */
const PaymentReceiptDocument: React.FC<PaymentReceiptDocumentProps> = ({ payment, className }) => {
  const jobCard = payment.jobCard
  const client = jobCard?.conversionClient
  const vehicle = jobCard?.conversionVehicle
  const fin = jobCard ? jobCardFinancials(jobCard) : null

  const paidOn = new Date(payment.payment_date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-baseline gap-3 py-1.5 border-b border-dashed border-gray-100">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-32 shrink-0">{label}</span>
      <span className="text-xs text-gray-900">{value}</span>
    </div>
  )

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden ${className || ''}`}>
      <div className="h-2 bg-gradient-to-r from-green-600 to-green-500" />

      <div className="p-10">
        {/* Company + receipt number */}
        <div className="flex items-start justify-between gap-8 pb-6 border-b border-gray-100">
          <div className="max-w-sm">
            <h1 className="text-base font-bold text-gray-900 tracking-wide">{COMPANY.name}</h1>
            <p className="text-xs text-gray-500 mt-1.5">{COMPANY.phones}</p>
            <p className="text-xs text-gray-500">{COMPANY.emails}</p>
            <p className="text-xs text-gray-500">{COMPANY.website}</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <img src="/motor.jpeg" alt="MotorGas" className="h-24 object-contain mb-2" />
            <h2 className="text-xl font-bold text-green-700 tracking-wide">PAYMENT RECEIPT</h2>
            <p className="text-xs text-gray-400 font-mono">RCP-{String(payment.id).padStart(5, '0')}</p>
          </div>
        </div>

        {/* Received from */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b border-gray-100">
          <div>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Received From</p>
            <p className="text-xs font-semibold text-gray-900">{client?.name || '—'}</p>
            {client?.contact && <p className="text-[11px] text-gray-500">{client.contact}</p>}
            {client?.email && <p className="text-[11px] text-gray-500">{client.email}</p>}
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Date</p>
            <p className="text-xs font-semibold text-gray-900">{paidOn}</p>
          </div>
        </div>

        {/* Amount headline */}
        <div className="my-6 rounded-2xl bg-green-50 border border-green-100 px-6 py-5">
          <p className="text-[9px] font-semibold text-green-700 uppercase tracking-wide mb-1">Amount Received</p>
          <p className="text-3xl font-bold text-green-700">{money(Number(payment.amount))}</p>
          <p className="text-[11px] text-green-800/70 mt-1.5 italic">{amountInWords(Number(payment.amount))}</p>
        </div>

        {/* Detail rows */}
        <div className="mb-6">
          {row('Payment Method', METHOD_LABELS[payment.payment_method] || payment.payment_method)}
          {row('Reference', payment.reference || '—')}
          {row('Invoice No.', <span className="font-mono">#{payment.job_card_id}</span>)}
          {vehicle && row('Vehicle', [vehicle.registration_number, vehicle.make, vehicle.model].filter(Boolean).join(' · '))}
          {row('Received By', payment.postedBy?.name || '—')}
          {payment.notes && row('Notes', payment.notes)}
        </div>

        {/* Invoice standing */}
        {fin && (
          <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 mb-8">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-[11px] text-gray-500">Invoice Total</span>
              <span className="text-xs font-medium text-gray-900">{money(fin.total)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-[11px] text-gray-500">Total Paid to Date</span>
              <span className="text-xs font-medium text-gray-900">{money(fin.paid)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
              <span className="text-xs font-semibold text-gray-900">Balance Due</span>
              <span className={`text-xs font-bold ${fin.balanceDue > 0 ? 'text-red-600' : 'text-green-700'}`}>
                {money(fin.balanceDue)}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-end justify-between gap-8 pt-6 border-t border-gray-100">
          <div>
            <p className="text-[10px] text-gray-400">Paybill {COMPANY.paybill} · A/C {COMPANY.account}</p>
            <p className="text-[10px] text-gray-400">{COMPANY.accountName}</p>
            <p className="text-[11px] text-gray-600 mt-3 font-medium">Thank you for your business.</p>
          </div>
          <div className="text-center shrink-0">
            <div className="w-44 border-b border-gray-300 mb-1.5" />
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Authorised Signature</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentReceiptDocument
