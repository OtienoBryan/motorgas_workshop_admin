import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { adminApiService, ExternalVehicleOwner, ExternalOwnershipType } from '../services/api'
import { Search, Loader2 } from 'lucide-react'

const TYPE_LABELS: Record<ExternalOwnershipType, string> = {
  individual: 'Individual',
  company: 'Company',
  sacco: 'Sacco',
}
const TYPES = Object.keys(TYPE_LABELS) as ExternalOwnershipType[]

const Dash = () => <span className="text-gray-400">—</span>

const ExternalVehicleOwners: React.FC = () => {
  const [owners, setOwners] = useState<ExternalVehicleOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<ExternalOwnershipType | 'all'>('all')

  useEffect(() => {
    adminApiService
      .getExternalVehicleOwners()
      .then((o) => setOwners(Array.isArray(o) ? o : []))
      .catch((error) => {
        console.error('Error loading owners:', error)
        alert(`Failed to load owners: ${(error as Error).message || 'Unknown error'}`)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return owners.filter((o) => {
      if (typeFilter !== 'all' && o.ownership_type !== typeFilter) return false
      if (!term) return true
      return [o.name, o.id_number, o.contact_person, o.phone, o.email, o.address].some((f) => f?.toLowerCase().includes(term))
    })
  }, [owners, searchTerm, typeFilter])

  const totalVehicles = owners.reduce((sum, o) => sum + (o.vehicle_count ?? 0), 0)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="w-full space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Vehicle Owners</h1>
            <p className="text-sm text-gray-500">
              {owners.length} owners · {totalVehicles} vehicles
            </p>
          </div>
          <Link
            to="/external-vehicles"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            ← Back to vehicles
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(['individual', 'sacco', 'company'] as const).map((t) => (
            <div key={t} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">{TYPE_LABELS[t]} owners</div>
              <div className="mt-1 text-2xl font-semibold leading-none text-gray-900">
                {owners.filter((o) => o.ownership_type === t).length}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, phone, email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="inline-flex rounded-lg bg-gray-200/60 p-1 text-sm">
            {(['all', ...TYPES] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  typeFilter === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t === 'all' ? 'All' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-900">{owners.length === 0 ? 'No owners yet' : 'No owners match your filters'}</p>
            <p className="mt-1 text-sm text-gray-500">
              {owners.length === 0 ? 'Owners are created when you add an external vehicle.' : 'Try a different search or filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Ownership type</th>
                    <th className="px-4 py-3 font-medium">ID / PIN / Reg No.</th>
                    <th className="px-4 py-3 font-medium">Contact person</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Address</th>
                    <th className="px-4 py-3 text-right font-medium">Vehicles</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((o) => (
                    <tr key={o.id} className="transition hover:bg-gray-50/70">
                      <td className="px-4 py-3 text-gray-900">{o.name}</td>
                      <td className="px-4 py-3 text-gray-900">{TYPE_LABELS[o.ownership_type]}</td>
                      <td className="px-4 py-3 text-gray-600">{o.id_number || <Dash />}</td>
                      <td className="px-4 py-3 text-gray-600">{o.contact_person || <Dash />}</td>
                      <td className="px-4 py-3 text-gray-600">{o.phone || <Dash />}</td>
                      <td className="px-4 py-3 text-gray-600">{o.email || <Dash />}</td>
                      <td className="px-4 py-3 text-gray-600">{o.address || <Dash />}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{o.vehicle_count ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/external-vehicles/owners/${o.id}`}
                          className="inline-block rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2 text-xs text-gray-500">
              Showing {filtered.length} of {owners.length} owners
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExternalVehicleOwners
