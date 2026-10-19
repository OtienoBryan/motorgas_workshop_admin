import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminApiService, ExternalVehicle, ExternalVehicleOwner, ExternalOwnershipType } from '../services/api'
import { Loader2 } from 'lucide-react'

const TYPE_LABELS: Record<ExternalOwnershipType, string> = {
  individual: 'Individual',
  company: 'Company',
  sacco: 'Sacco',
}

const Dash = () => <span className="text-gray-400">—</span>

const BackLink = () => (
  <Link
    to="/external-vehicles/owners"
    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
  >
    ← Back to owners
  </Link>
)

const ExternalVehicleOwnerDetails: React.FC = () => {
  const { ownerId } = useParams<{ ownerId: string }>()
  const [owner, setOwner] = useState<ExternalVehicleOwner | null>(null)
  const [vehicles, setVehicles] = useState<ExternalVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([adminApiService.getExternalVehicleOwners(), adminApiService.getExternalVehicles()])
      .then(([owners, allVehicles]) => {
        const id = Number(ownerId)
        setOwner((Array.isArray(owners) ? owners : []).find((o) => o.id === id) ?? null)
        setVehicles((Array.isArray(allVehicles) ? allVehicles : []).filter((v) => v.owner_id === id))
      })
      .catch((e) => setError((e as Error).message || 'Failed to load owner'))
      .finally(() => setLoading(false))
  }, [ownerId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!owner) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="space-y-4">
          <BackLink />
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center text-sm text-gray-600">
            {error ?? 'Owner not found.'}
          </div>
        </div>
      </div>
    )
  }

  const details: [string, string | null | undefined][] = [
    ['Ownership type', TYPE_LABELS[owner.ownership_type]],
    ['ID / PIN / Reg No.', owner.id_number],
    ['Contact person', owner.contact_person],
    ['Phone', owner.phone],
    ['Email', owner.email],
    ['Address', owner.address],
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="w-full space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{owner.name}</h1>
            <p className="text-sm text-gray-500">
              {TYPE_LABELS[owner.ownership_type]} owner · {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'}
            </p>
          </div>
          <BackLink />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Owner details</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="mt-0.5 text-gray-900">{value || <Dash />}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vehicles ({vehicles.length})</h2>
          </div>
          {vehicles.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">No vehicles linked to this owner.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Registration</th>
                    <th className="px-4 py-3 font-medium">Make</th>
                    <th className="px-4 py-3 font-medium">Model</th>
                    <th className="px-4 py-3 font-medium">Fuel</th>
                    <th className="px-4 py-3 font-medium">Operating area</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="transition hover:bg-gray-50/70">
                      <td className="px-4 py-3 text-gray-900">{v.registration_number}</td>
                      <td className="px-4 py-3 text-gray-900">{v.make}</td>
                      <td className="px-4 py-3 text-gray-900">{v.model}</td>
                      <td className="px-4 py-3 text-gray-900">{v.fuel_type}</td>
                      <td className="px-4 py-3 text-gray-600">{v.location || <Dash />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExternalVehicleOwnerDetails
