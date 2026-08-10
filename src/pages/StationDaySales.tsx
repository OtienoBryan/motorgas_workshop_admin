import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { adminApiService, Sale, Station, KeyAccount, Staff } from '../services/api'
import {
  ArrowLeft,
  Download,
  Receipt,
  Fuel,
  DollarSign,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react'

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const dateKeyOf = (value: string) => {
  const d = new Date(value)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const StationDaySales: React.FC = () => {
  const navigate = useNavigate()
  const { stationId, date } = useParams<{ stationId: string; date: string }>()
  const [searchParams] = useSearchParams()

  const [sales, setSales] = useState<Sale[]>([])
  const [station, setStation] = useState<Station | null>(null)
  const [keyAccounts, setKeyAccounts] = useState<KeyAccount[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  useEffect(() => {
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
  }, [stationId])

  // Only needed to label rows; sales carry most relations already.
  useEffect(() => {
    adminApiService.getKeyAccounts().then(d => setKeyAccounts(Array.isArray(d) ? d : [])).catch(() => setKeyAccounts([]))
    adminApiService.getStaff().then(d => setStaff(Array.isArray(d) ? d : [])).catch(() => setStaff([]))
  }, [])

  const daySales = useMemo(
    () => sales
      .filter(s => dateKeyOf(s.saleDate) === date)
      .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()),
    [sales, date]
  )

  const totals = daySales.reduce(
    (acc, s) => ({
      quantity: acc.quantity + Number(s.quantity),
      total: acc.total + Number(s.totalAmount),
    }),
    { quantity: 0, total: 0 }
  )

  const dayLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  const getOwnerName = (sale: Sale) => {
    if (sale.keyAccountId) return keyAccounts.find(ka => ka.id === sale.keyAccountId)?.name || 'Unknown Account'
    if (sale.conversionClient) return sale.conversionClient.name
    if (sale.conversionClientId) return 'Unknown Client'
    return '-'
  }

  const getVehicleName = (sale: Sale) => {
    if (sale.vehicle) return `${sale.vehicle.registration_number} - ${sale.vehicle.model}`
    if (sale.conversionVehicle) return `${sale.conversionVehicle.registration_number} - ${sale.conversionVehicle.model}`
    return '-'
  }

  const getStaffName = (staffId?: number) => {
    if (!staffId) return '-'
    return staff.find(s => s.id === staffId)?.name || 'Unknown'
  }

  const backToBreakdown = () => {
    const qs = searchParams.toString()
    navigate(`/sales/report/summary/${stationId}${qs ? `?${qs}` : ''}`)
  }

  const exportToCSV = () => {
    if (daySales.length === 0) {
      alert('No data to export')
      return
    }
    const headers = ['Sale Date', 'Client', 'Vehicle', 'Quantity', 'Unit Price', 'Total Amount', 'Payment Method', 'Reference', 'Staff', 'Notes']
    const escapeCSV = (v: string) => (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v
    const rows = daySales.map(s => [
      new Date(s.saleDate).toLocaleString(),
      escapeCSV(getOwnerName(s)),
      escapeCSV(getVehicleName(s)),
      Number(s.quantity).toFixed(2),
      Number(s.unitPrice).toFixed(2),
      Number(s.totalAmount).toFixed(2),
      escapeCSV(s.paymentMethod || ''),
      escapeCSV(s.referenceNumber || ''),
      escapeCSV(getStaffName(s.createdBy)),
      escapeCSV(s.notes || ''),
    ])
    rows.push(['TOTAL', '', '', totals.quantity.toFixed(2), '', totals.total.toFixed(2), '', '', '', ''])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `sales-${(station?.name || `station-${stationId}`).replace(/\s+/g, '-')}-${date}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={backToBreakdown}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Back to Daily Breakdown"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-bold text-gray-900">
            {station ? station.name.trim() : 'Station'} — Sales on {dayLabel}
          </h1>
          <button
            onClick={exportToCSV}
            disabled={daySales.length === 0}
            className="ml-auto flex items-center gap-1 px-3 py-1 text-[11px] font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={daySales.length === 0 ? 'No data to export' : 'Export to CSV'}
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-2 grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
            <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-gray-500 font-medium truncate">{dayLabel}</div>
              <div className="text-sm font-bold text-gray-900 truncate">{daySales.length} sales</div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
            <div className="shrink-0 h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Fuel className="h-4 w-4 text-orange-600" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-gray-500 font-medium truncate">Total quantity sold</div>
              <div className="text-sm font-bold text-gray-900 truncate">{money(totals.quantity)} L</div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
            <div className="shrink-0 h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-gray-500 font-medium truncate">Total sales value</div>
              <div className="text-sm font-bold text-gray-900 truncate">{money(totals.total)}</div>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : daySales.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-gray-500">
              No sales recorded for this station on this day.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Image</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Sale Date</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Client</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Vehicle</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Quantity</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Unit Price</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Total Amount</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Payment Method</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Reference</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Staff</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {daySales.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-[11px]">
                        {sale.imagePath ? (
                          <button
                            type="button"
                            onClick={() => setExpandedImage(sale.imagePath!)}
                            className="w-8 h-8 rounded bg-gray-100 overflow-hidden cursor-zoom-in hover:opacity-80 transition-opacity"
                            title="Click to expand"
                          >
                            <img src={sale.imagePath} alt="Sale" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-3.5 w-3.5 text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1 text-[11px] whitespace-nowrap">
                        {new Date(sale.saleDate).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{getOwnerName(sale)}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{getVehicleName(sale)}</td>
                      <td className="px-2 py-1 text-[11px] text-right font-medium">{Number(sale.quantity).toFixed(2)} L</td>
                      <td className="px-2 py-1 text-[11px] text-right">{Number(sale.unitPrice).toFixed(2)}</td>
                      <td className="px-2 py-1 text-[11px] text-right font-bold text-purple-600">{Number(sale.totalAmount).toFixed(2)}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{sale.paymentMethod || '-'}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{sale.referenceNumber || '-'}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{getStaffName(sale.createdBy)}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600 max-w-xs truncate">{sale.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td className="px-2 py-1.5 text-[11px] font-bold text-gray-900" colSpan={4}>Total</td>
                    <td className="px-2 py-1.5 text-[11px] text-right font-bold text-gray-900">{money(totals.quantity)} L</td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5 text-[11px] text-right font-bold text-purple-700">{money(totals.total)}</td>
                    <td className="px-2 py-1.5" colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Image lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="Sale"
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default StationDaySales
