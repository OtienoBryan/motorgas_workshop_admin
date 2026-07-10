import React from 'react'
import { VehicleInspection } from '../services/api'
import { COMPANY } from './JobCardInvoiceDocument'

interface VehicleLike {
  registration_number: string
  vin_serial_number?: string
  vehicle_type?: string
  year?: number
  make?: string
  model: string
  engine?: string
  current_odo?: number
  odo_unit?: 'KM' | 'Miles'
  unit_number?: string
}

interface ChecklistItem {
  item: string
  rating: 'good' | 'fair' | 'poor' | '' | string
  details?: string
}

type ChecklistData = Record<string, ChecklistItem[]>

function parseChecklist(raw?: string | null): ChecklistData {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const RATING_DOT: Record<string, string> = {
  good: 'bg-green-500',
  fair: 'bg-amber-400',
  poor: 'bg-red-500',
}

const RatingCell: React.FC<{ active: boolean; color: string }> = ({ active, color }) => (
  <div className="flex items-center justify-center">
    {active
      ? <span className={`w-4 h-4 rounded-full ${color}`} />
      : <span className="w-4 h-4 rounded-full border border-gray-200" />}
  </div>
)

interface InspectionDetailsDocumentProps {
  inspection: VehicleInspection
  vehicle: VehicleLike
  className?: string
}

const InspectionDetailsDocument: React.FC<InspectionDetailsDocumentProps> = ({ inspection, vehicle, className }) => {
  const checklist = parseChecklist(inspection.checklist)
  const sections = Object.entries(checklist)
  const client = inspection.conversionClient

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden ${className || ''}`}>
      <div className="h-2 bg-gradient-to-r from-green-600 to-green-500" />

      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 tracking-wide">Inspection Checklist</h1>
          <img src="/motor.jpeg" alt="MotorGas" className="h-14 object-contain" />
        </div>

        {/* Vehicle + Company + Results */}
        <div className="grid grid-cols-3 gap-8 py-6 border-b border-gray-100">
          <div>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Vehicle Details</p>
            <dl className="text-xs text-gray-600 space-y-1.5">
              <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-24 shrink-0">Inspection Date</dt><dd>{new Date(inspection.inspection_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-24 shrink-0">Year</dt><dd>{vehicle.year || '—'}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-24 shrink-0">Make</dt><dd>{vehicle.make || '—'}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-24 shrink-0">Model</dt><dd>{vehicle.model || '—'}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-24 shrink-0">Engine</dt><dd>{vehicle.engine || '—'}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-24 shrink-0">VIN</dt><dd className="font-mono">{vehicle.vin_serial_number || '—'}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-24 shrink-0">License</dt><dd className="font-mono">{vehicle.registration_number}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-24 shrink-0">Mileage</dt><dd>{vehicle.current_odo ? `${vehicle.current_odo.toLocaleString()} ${vehicle.odo_unit}` : '—'}</dd></div>
              {vehicle.unit_number && <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-24 shrink-0">Unit</dt><dd className="font-mono">{vehicle.unit_number}</dd></div>}
            </dl>
          </div>

          <div>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Company Info</p>
            <p className="text-sm font-bold text-gray-900">{COMPANY.name}</p>
            <p className="text-xs text-gray-500 mt-1.5">{COMPANY.phones}</p>
            <p className="text-xs text-gray-500">{COMPANY.emails}</p>
            <p className="text-xs text-gray-500">{COMPANY.website}</p>

            {client && (
              <dl className="text-xs text-gray-600 space-y-1.5 mt-4 pt-4 border-t border-gray-50">
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Client</p>
                <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-16 shrink-0">Name</dt><dd>{client.name}</dd></div>
                {client.contact && <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-16 shrink-0">Phone</dt><dd>{client.contact}</dd></div>}
                {client.address && <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-16 shrink-0">Address</dt><dd>{client.address}</dd></div>}
                {client.region && <div className="flex gap-2"><dt className="font-semibold text-gray-800 w-16 shrink-0">Region</dt><dd>{client.region}</dd></div>}
              </dl>
            )}
          </div>

          <div>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Inspection Results</p>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                inspection.status === 'completed' ? 'bg-emerald-100 text-emerald-700'
                  : inspection.status === 'in_progress' ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {inspection.status.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-700">
                <span className="font-bold">{inspection.issues_found ?? 0}</span> issue{(inspection.issues_found ?? 0) === 1 ? '' : 's'} found
              </span>
            </div>
            {inspection.technician && (
              <p className="text-xs text-gray-500 mb-3">
                <span className="font-semibold text-gray-700">Technician:</span> {inspection.technician.name}
              </p>
            )}
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Summary</p>
            {inspection.summary
              ? <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{inspection.summary}</p>
              : <p className="text-xs text-gray-300 italic">No summary recorded</p>}
          </div>
        </div>

        {/* Checklist sections */}
        {sections.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-8 text-center">No checklist recorded for this inspection.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
            {sections.map(([sectionName, items]) => (
              <div key={sectionName} className="break-inside-avoid">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-white uppercase tracking-wide rounded-l-lg">{sectionName}</th>
                      <th className="px-2 py-2 text-center text-[10px] font-semibold text-white uppercase tracking-wide w-14">Good</th>
                      <th className="px-2 py-2 text-center text-[10px] font-semibold text-white uppercase tracking-wide w-14">Fair</th>
                      <th className="px-2 py-2 text-center text-[10px] font-semibold text-white uppercase tracking-wide w-14">Poor</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-white uppercase tracking-wide rounded-r-lg">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-xs text-gray-800 whitespace-nowrap">{row.item}</td>
                        <td className="px-2 py-2"><RatingCell active={row.rating === 'good'} color={RATING_DOT.good} /></td>
                        <td className="px-2 py-2"><RatingCell active={row.rating === 'fair'} color={RATING_DOT.fair} /></td>
                        <td className="px-2 py-2"><RatingCell active={row.rating === 'poor'} color={RATING_DOT.poor} /></td>
                        <td className="px-3 py-2 text-[11px] text-gray-500">{row.details || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InspectionDetailsDocument
