import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  adminApiService,
  EXTERNAL_VEHICLE_FUEL_TYPES,
  ExternalVehicle,
  ExternalVehicleOwner,
  ExternalOwnershipType,
  ExternalVehicleFuelType,
} from '../services/api'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Car,
  User,
  Building2,
  Bus,
  MapPin,
  UserPlus,
  Loader2,
} from 'lucide-react'

type IconType = React.ComponentType<{ className?: string }>

const OWNERSHIP: Record<
  ExternalOwnershipType,
  { label: string; icon: IconType; badge: string; nameLabel: string; idLabel: string }
> = {
  individual: {
    label: 'Individual',
    icon: User,
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    nameLabel: 'Full name',
    idLabel: 'National ID / Passport No.',
  },
  company: {
    label: 'Company',
    icon: Building2,
    badge: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    nameLabel: 'Company name',
    idLabel: 'KRA PIN / Registration No.',
  },
  sacco: {
    label: 'Sacco',
    icon: Bus,
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    nameLabel: 'Sacco name',
    idLabel: 'Sacco registration No.',
  },
}
const OWNERSHIP_TYPES = Object.keys(OWNERSHIP) as ExternalOwnershipType[]

const NEW_OWNER = 'new'

interface NewOwnerForm {
  name: string
  id_number: string
  contact_person: string
  phone: string
  email: string
  address: string
}
const emptyOwner: NewOwnerForm = { name: '', id_number: '', contact_person: '', phone: '', email: '', address: '' }

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

const Field: React.FC<{ label: string; required?: boolean; className?: string; children: React.ReactNode }> = ({
  label,
  required,
  className,
  children,
}) => (
  <div className={className}>
    <label className="mb-1 block text-xs font-medium text-gray-600">
      {label}
      {required && <span className="text-rose-500"> *</span>}
    </label>
    {children}
  </div>
)

/* ----------------------------- Modal ----------------------------- */

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  vehicle: ExternalVehicle | null
  owners: ExternalVehicleOwner[]
  onSave: () => Promise<void>
  onOwnerCreated: (owner: ExternalVehicleOwner) => void
}

const ExternalVehicleModal: React.FC<ModalProps> = ({ isOpen, onClose, vehicle, owners, onSave, onOwnerCreated }) => {
  const [registration, setRegistration] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [fuelType, setFuelType] = useState<ExternalVehicleFuelType | ''>('')
  const [location, setLocation] = useState('')
  const [ownershipType, setOwnershipType] = useState<ExternalOwnershipType | ''>('')
  const [ownerChoice, setOwnerChoice] = useState<string>('') // owner id or NEW_OWNER
  const [newOwner, setNewOwner] = useState<NewOwnerForm>(emptyOwner)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setRegistration(vehicle?.registration_number ?? '')
    setMake(vehicle?.make ?? '')
    setModel(vehicle?.model ?? '')
    setFuelType(vehicle?.fuel_type ?? '')
    setLocation(vehicle?.location ?? '')
    setOwnershipType(vehicle?.owner?.ownership_type ?? '')
    setOwnerChoice(vehicle ? String(vehicle.owner_id) : '')
    setNewOwner(emptyOwner)
  }, [isOpen, vehicle])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, saving, onClose])

  const ownersOfType = useMemo(() => owners.filter((o) => o.ownership_type === ownershipType), [owners, ownershipType])
  const selectedOwner = ownerChoice && ownerChoice !== NEW_OWNER ? owners.find((o) => String(o.id) === ownerChoice) : undefined

  const handleTypeChange = (value: ExternalOwnershipType) => {
    if (value === ownershipType) return
    setOwnershipType(value)
    // Owners are per-type, so reset the pick; go straight to "new" when there's nothing to choose from
    setOwnerChoice(owners.some((o) => o.ownership_type === value) ? '' : NEW_OWNER)
    setNewOwner(emptyOwner)
  }

  const setOwnerField = (field: keyof NewOwnerForm, value: string) => setNewOwner((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ownershipType || !fuelType) return
    if (!ownerChoice) {
      alert('Select an existing owner or choose "Add new"')
      return
    }
    try {
      setSaving(true)
      let ownerId: number
      if (ownerChoice === NEW_OWNER) {
        const trim = (v: string) => v.trim() || undefined
        const created = await adminApiService.createExternalVehicleOwner({
          ownership_type: ownershipType,
          name: newOwner.name.trim(),
          id_number: trim(newOwner.id_number),
          contact_person: trim(newOwner.contact_person),
          phone: trim(newOwner.phone),
          email: trim(newOwner.email),
          address: trim(newOwner.address),
        })
        onOwnerCreated(created)
        ownerId = created.id
      } else {
        ownerId = Number(ownerChoice)
      }

      const payload = {
        registration_number: registration.trim(),
        make: make.trim(),
        model: model.trim(),
        fuel_type: fuelType,
        location: location.trim() || undefined,
        owner_id: ownerId,
      }
      if (vehicle) await adminApiService.updateExternalVehicle(vehicle.id, payload)
      else await adminApiService.createExternalVehicle(payload)
      await onSave()
      onClose()
    } catch (error) {
      console.error('Error saving external vehicle:', error)
      alert(`Failed to save vehicle: ${(error as Error).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const cfg = ownershipType ? OWNERSHIP[ownershipType] : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{vehicle ? 'Edit vehicle' : 'Add external vehicle'}</h2>
              <p className="text-xs text-gray-500">Vehicle details and ownership</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Vehicle section */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Vehicle</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Registration number" required>
                  <input
                    className={`${inputClass} font-mono uppercase tracking-wider`}
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value)}
                    required
                    placeholder="KDA 123A"
                  />
                </Field>
                <Field label="Fuel type" required>
                  <select
                    className={inputClass}
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as ExternalVehicleFuelType)}
                    required
                  >
                    <option value="">Select fuel type</option>
                    {EXTERNAL_VEHICLE_FUEL_TYPES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Make" required>
                  <input className={inputClass} value={make} onChange={(e) => setMake(e.target.value)} required placeholder="Toyota" />
                </Field>
                <Field label="Model" required>
                  <input className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} required placeholder="Hiace" />
                </Field>
                <Field label="Location / operating area" className="sm:col-span-2">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      className={`${inputClass} pl-9`}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Nairobi – Thika Road"
                    />
                  </div>
                </Field>
              </div>
            </section>

            {/* Ownership section */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Ownership</h3>

              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Vehicle ownership">
                {OWNERSHIP_TYPES.map((t) => {
                  const Icon = OWNERSHIP[t].icon
                  const active = ownershipType === t
                  return (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => handleTypeChange(t)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                        active
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {OWNERSHIP[t].label}
                    </button>
                  )
                })}
              </div>

              {cfg && (
                <div className="mt-4 space-y-3">
                  <Field label={`Select ${cfg.label.toLowerCase()}`} required>
                    <select className={inputClass} value={ownerChoice} onChange={(e) => setOwnerChoice(e.target.value)} required>
                      <option value="">Choose existing…</option>
                      {ownersOfType.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                          {o.phone ? ` · ${o.phone}` : ''}
                        </option>
                      ))}
                      <option value={NEW_OWNER}>+ Add new {cfg.label.toLowerCase()}</option>
                    </select>
                  </Field>

                  {selectedOwner && (
                    <div className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
                      {[
                        [cfg.idLabel, selectedOwner.id_number],
                        ['Contact person', selectedOwner.contact_person],
                        ['Phone', selectedOwner.phone],
                        ['Email', selectedOwner.email],
                        ['Address', selectedOwner.address],
                      ].map(([k, v]) => (
                        <div key={k as string}>
                          <div className="text-xs text-gray-500">{k}</div>
                          <div className="text-gray-900">{v || '—'}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {ownerChoice === NEW_OWNER && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-700">
                        <UserPlus className="h-4 w-4" />
                        New {cfg.label.toLowerCase()} details
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label={cfg.nameLabel} required>
                          <input className={inputClass} value={newOwner.name} onChange={(e) => setOwnerField('name', e.target.value)} required />
                        </Field>
                        <Field label={cfg.idLabel}>
                          <input
                            className={inputClass}
                            value={newOwner.id_number}
                            onChange={(e) => setOwnerField('id_number', e.target.value)}
                          />
                        </Field>
                        {ownershipType !== 'individual' && (
                          <Field label="Contact person">
                            <input
                              className={inputClass}
                              value={newOwner.contact_person}
                              onChange={(e) => setOwnerField('contact_person', e.target.value)}
                            />
                          </Field>
                        )}
                        <Field label="Phone">
                          <input className={inputClass} value={newOwner.phone} onChange={(e) => setOwnerField('phone', e.target.value)} />
                        </Field>
                        <Field label="Email">
                          <input
                            type="email"
                            className={inputClass}
                            value={newOwner.email}
                            onChange={(e) => setOwnerField('email', e.target.value)}
                          />
                        </Field>
                        <Field label="Address" className="sm:col-span-2">
                          <input
                            className={inputClass}
                            value={newOwner.address}
                            onChange={(e) => setOwnerField('address', e.target.value)}
                          />
                        </Field>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !ownershipType}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving…' : vehicle ? 'Save changes' : 'Add vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ------------------------------ Page ------------------------------ */

const ExternalVehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<ExternalVehicle[]>([])
  const [owners, setOwners] = useState<ExternalVehicleOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<ExternalOwnershipType | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<ExternalVehicle | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchAll = async () => {
    try {
      const [v, o] = await Promise.all([adminApiService.getExternalVehicles(), adminApiService.getExternalVehicleOwners()])
      setVehicles(Array.isArray(v) ? v : [])
      setOwners(Array.isArray(o) ? o : [])
    } catch (error) {
      console.error('Error loading external vehicles:', error)
      alert(`Failed to load external vehicles: ${(error as Error).message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const openModal = (v: ExternalVehicle | null) => {
    setEditing(v)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return
    try {
      setDeletingId(id)
      await adminApiService.deleteExternalVehicle(id)
      await fetchAll()
    } catch (error) {
      alert(`Failed to delete vehicle: ${(error as Error).message || 'Unknown error'}`)
    } finally {
      setDeletingId(null)
    }
  }

  const counts = useMemo(() => {
    const c: Record<ExternalOwnershipType, number> = { individual: 0, company: 0, sacco: 0 }
    vehicles.forEach((v) => v.owner && c[v.owner.ownership_type]++)
    return c
  }, [vehicles])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return vehicles.filter((v) => {
      if (typeFilter !== 'all' && v.owner?.ownership_type !== typeFilter) return false
      if (!term) return true
      return [v.registration_number, v.make, v.model, v.fuel_type, v.location, v.owner?.name, v.owner?.phone].some((f) =>
        f?.toLowerCase().includes(term)
      )
    })
  }, [vehicles, searchTerm, typeFilter])

  const stats: { label: string; value: number }[] = [
    { label: 'Total vehicles', value: vehicles.length },
    { label: 'Individual', value: counts.individual },
    { label: 'Company', value: counts.company },
    { label: 'Sacco', value: counts.sacco },
  ]

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
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">External Vehicle Database</h1>
            <p className="text-sm text-gray-500">Vehicles outside the workshop fleet, with their registered owners.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/external-vehicles/owners"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              View owners ({owners.length})
            </Link>
            <button
              onClick={() => openModal(null)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add vehicle
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">{label}</div>
              <div className="mt-1 text-2xl font-semibold leading-none text-gray-900">{value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search registration, make, owner…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
          <div className="inline-flex rounded-lg bg-gray-200/60 p-1 text-sm">
            {(['all', ...OWNERSHIP_TYPES] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  typeFilter === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t === 'all' ? 'All' : OWNERSHIP[t].label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-900">
              {vehicles.length === 0 ? 'No external vehicles yet' : 'No vehicles match your filters'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {vehicles.length === 0 ? 'Add the first vehicle to start building the database.' : 'Try a different search or filter.'}
            </p>
            {vehicles.length === 0 && (
              <button
                onClick={() => openModal(null)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Add vehicle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Registration</th>
                    <th className="px-4 py-3 font-medium">Make / Model</th>
                    <th className="px-4 py-3 font-medium">Fuel</th>
                    <th className="px-4 py-3 font-medium">Operating area</th>
                    <th className="px-4 py-3 font-medium">Ownership type</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((v) => {
                    const o = v.owner
                    const cfg = o ? OWNERSHIP[o.ownership_type] : null
                    return (
                      <tr key={v.id} className="transition hover:bg-gray-50/70">
                        <td className="px-4 py-3">
                          {v.registration_number}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {v.make} {v.model}
                        </td>
                        <td className="px-4 py-3 text-gray-900">{v.fuel_type}</td>
                        <td className="px-4 py-3 text-gray-600">{v.location || <span className="text-gray-400">—</span>}</td>
                        <td className="px-4 py-3 text-gray-900">{cfg ? cfg.label : <span className="text-gray-400">—</span>}</td>
                        <td className="px-4 py-3 text-gray-900">
                          {o ? (
                            <Link to={`/external-vehicles/owners/${o.id}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                              {o.name}
                            </Link>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {o?.phone && <div>{o.phone}</div>}
                          {o?.email && <div className="mt-0.5">{o.email}</div>}
                          {!o?.phone && !o?.email && <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openModal(v)}
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(v.id)}
                              disabled={deletingId === v.id}
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2 text-xs text-gray-500">
              Showing {filtered.length} of {vehicles.length} vehicles · {owners.length} registered owners
            </div>
          </div>
        )}

        <ExternalVehicleModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditing(null)
          }}
          vehicle={editing}
          owners={owners}
          onSave={fetchAll}
          onOwnerCreated={(owner) => setOwners((prev) => [...prev, owner])}
        />
      </div>
    </div>
  )
}

export default ExternalVehicles
