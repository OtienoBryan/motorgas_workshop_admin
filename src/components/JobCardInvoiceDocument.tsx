import React from 'react'
import { JobCard } from '../services/api'
import { ESTIMATE_STAGE_STATUSES } from '../pages/JobCardForm'

export const COMPANY = {
  name: 'MOTORGAS AFRICA',
  phones: '0780600257 / 0702334976',
  emails: 'info@motorgas.africa · motorgasltd@gmail.com',
  website: 'motorgas.co.ke',
  paybill: '630640',
  account: '573401',
  accountName: 'MOTORGAS LIMITED',
}

export function jobCardFinancials(jc: JobCard) {
  const items = jc.items || []
  const partItems = items.filter(i => i.item_type === 'part')
  const laborItems = items.filter(i => i.item_type === 'labor')
  const itemsSubtotal = partItems.reduce((s, i) => s + Number(i.amount || 0), 0)
  const laborSubtotal = laborItems.reduce((s, i) => s + Number(i.amount || 0), 0)
  const subtotal = itemsSubtotal + laborSubtotal
  const taxableSubtotal = items.filter(i => i.taxable !== 0).reduce((s, i) => s + Number(i.amount || 0), 0)
  const vatAmount = jc.vat_enabled ? taxableSubtotal * (Number(jc.vat_rate) / 100) : 0
  const discount = Number(jc.discount || 0)
  const total = subtotal + vatAmount - discount + Number(jc.other_charges || 0)
  const paid = Number(jc.amount_paid || 0)
  const balanceDue = total - paid
  return { partItems, laborItems, itemsSubtotal, laborSubtotal, subtotal, vatAmount, discount, total, paid, balanceDue }
}

export const money = (n: number) => `Ksh${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

interface JobCardInvoiceDocumentProps {
  jobCard: JobCard
  className?: string
}

/** The visual invoice document itself — no page chrome/toolbar, so it can be
 *  embedded in a full page or inside a modal. */
const JobCardInvoiceDocument: React.FC<JobCardInvoiceDocumentProps> = ({ jobCard, className }) => {
  const fin = jobCardFinancials(jobCard)
  const client = jobCard.conversionClient
  const vehicle = jobCard.conversionVehicle
  const invoiceDate = new Date(jobCard.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
  const isQuotation = ESTIMATE_STAGE_STATUSES.includes(jobCard.status)
  const docLabel = isQuotation ? 'QUOTATION' : 'INVOICE'

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden ${className || ''}`}>
      {/* Header band */}
      <div className="h-2 bg-gradient-to-r from-green-600 to-green-500" />

      <div className="p-10">
        {/* Company + logo */}
        <div className="flex items-start justify-between gap-8 pb-6 border-b border-gray-100">
          <div className="max-w-sm">
            <h1 className="text-base font-bold text-gray-900 tracking-wide">{COMPANY.name}</h1>
            <p className="text-xs text-gray-500 mt-1.5">{COMPANY.phones}</p>
            <p className="text-xs text-gray-500">{COMPANY.emails}</p>
            <p className="text-xs text-gray-500 mb-2">{COMPANY.website}</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <img src="/motor.jpeg" alt="MotorGas" className="h-24 object-contain mb-2" />
            <h2 className="text-xl font-bold text-green-700 tracking-wide">{docLabel}</h2>
            <p className="text-xs text-gray-400 font-mono">#{jobCard.id}</p>
          </div>
        </div>

        {/* Bill to / vehicle / date */}
        <div className="grid grid-cols-3 gap-6 py-6 border-b border-gray-100">
          <div>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Bill To</p>
            <p className="text-xs font-semibold text-gray-900">{client?.name || '—'}</p>
            {client?.contact && <p className="text-[11px] text-gray-500">{client.contact}</p>}
            {client?.email && <p className="text-[11px] text-gray-500">{client.email}</p>}
            {client?.address && <p className="text-[11px] text-gray-500">{client.address}</p>}
          </div>
          <div>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Vehicle</p>
            <p className="text-xs font-semibold text-gray-900">
              {[vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(' ') || '—'}
            </p>
            {vehicle?.vehicle_type && <p className="text-[11px] text-gray-500">{vehicle.vehicle_type}</p>}
            {vehicle?.registration_number && <p className="text-[11px] font-mono text-gray-500">{vehicle.registration_number}</p>}
            {vehicle?.vin_serial_number && <p className="text-[11px] font-mono text-gray-400">{vehicle.vin_serial_number}</p>}
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{isQuotation ? 'Quotation Date' : 'Invoice Date'}</p>
            <p className="text-xs font-semibold text-gray-900">{invoiceDate}</p>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mt-3 mb-1.5">Status</p>
            <p className="text-xs font-semibold text-gray-900 capitalize">{jobCard.status.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Parts table */}
        {fin.partItems.length > 0 && (
          <div className="mt-6">
            <table className="w-full">
              <thead>
                <tr className="bg-green-600">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-white uppercase tracking-wide rounded-l-lg w-16">Qty</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-white uppercase tracking-wide">Parts</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold text-white uppercase tracking-wide w-28">Price</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold text-white uppercase tracking-wide w-28 rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fin.partItems.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-xs text-gray-600">{item.quantity} pc.</td>
                    <td className="px-3 py-2 text-xs font-medium text-gray-800">{item.description}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 text-right whitespace-nowrap">{money(Number(item.price))}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-900 text-right whitespace-nowrap">{money(Number(item.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Labor table */}
        {fin.laborItems.length > 0 && (
          <div className="mt-5">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-white uppercase tracking-wide rounded-l-lg">Labor</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold text-white uppercase tracking-wide w-28 rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fin.laborItems.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2.5">
                      <p className="text-xs font-medium text-gray-800">{item.description}</p>
                      {item.service?.description && (
                        <p className="text-[10px] text-gray-400 italic mt-0.5">{item.service.description}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-gray-900 text-right whitespace-nowrap align-top">
                      {money(Number(item.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="flex justify-end mt-6">
          <div className="w-full max-w-sm space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Parts</span><span>{money(fin.itemsSubtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Labor</span><span>{money(fin.laborSubtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-1.5 border-t border-gray-100">
              <span>Subtotal (Exclusive)</span><span>{money(fin.subtotal)}</span>
            </div>
            {jobCard.vat_enabled ? (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>VAT ({jobCard.vat_rate}%, Exclusive)</span><span>{money(fin.vatAmount)}</span>
              </div>
            ) : null}
            {fin.discount > 0 && (
              <div className="flex items-center justify-between text-xs text-red-500">
                <span>Discount</span><span>-{money(fin.discount)}</span>
              </div>
            )}
            {Number(jobCard.other_charges) > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Other Charges</span><span>{money(Number(jobCard.other_charges))}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span><span>{money(fin.total)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Paid</span><span>{money(fin.paid)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold rounded-lg bg-green-50 text-green-800 px-3 py-2 mt-2">
              <span>Balance Due</span><span>{money(fin.balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Footer: signatures + payment info */}
        <div className="grid grid-cols-2 gap-8 mt-14 pt-6 border-t border-gray-100">
          <div className="space-y-8">
            <div>
              <div className="border-b border-gray-300 h-8" />
              <p className="text-[10px] text-gray-400 mt-1">Customer Signature</p>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Payment Info</p>
            <p className="text-[11px] text-gray-600">M-Pesa Paybill No. <span className="font-semibold">{COMPANY.paybill}</span></p>
            <p className="text-[11px] text-gray-600">Account Number <span className="font-semibold">{COMPANY.account}</span></p>
            <p className="text-[11px] text-gray-600">Account Name <span className="font-semibold">{COMPANY.accountName}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobCardInvoiceDocument
