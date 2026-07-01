import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService } from '../services/api'
import {
  ChevronLeft,
  Loader2,
  Edit,
  Plus,
  Building2,
  UserCheck,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Car,
  ArrowRight,
  X,
  Info,
  FileText,
  Wrench
} from 'lucide-react'

interface Client {
  id: number
  name: string
  email?: string
  contact: string
  address?: string
  region: string
  category: 'individual' | 'company'
  taxPin?: string
}

interface Vehicle {
  id: number
  conversion_client_id: number
  registration_number: string
  vin_serial_number?: string
  vehicle_type?: string
  year?: number
  make?: string
  model: string
  trim_option?: string
  transmission_type?: string
  driven_wheel?: string
  engine?: string
  current_odo?: number
  odo_unit: 'KM' | 'Miles'
  color?: string
  unit_number?: string
  notes?: string
  photo_url?: string
  created_at: string
  updated_at: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

const VEHICLE_TYPE_COLORS: Record<string, string> = {
  Sedan:   'bg-blue-100 text-blue-700',
  SUV:     'bg-emerald-100 text-emerald-700',
  Truck:   'bg-amber-100 text-amber-700',
  Van:     'bg-purple-100 text-purple-700',
  Bus:     'bg-orange-100 text-orange-700',
}

function vehicleTypeStyle(type?: string): string {
  if (!type) return 'bg-gray-100 text-gray-500'
  return VEHICLE_TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600'
}

const ClientDetails: React.FC = () => {
  const navigate = useNavigate()
  const { clientId } = useParams<{ clientId: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingClient, setLoadingClient] = useState(true)
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'information' | 'vehicles' | 'invoices' | 'service'>('information')

  useEffect(() => {
    if (clientId) {
      fetchClient(Number(clientId))
      fetchVehicles(Number(clientId))
    }
  }, [clientId])

  const fetchClient = async (id: number) => {
    try {
      setLoadingClient(true)
      const data = await adminApiService.getConversionClient(id)
      if (data) {
        setClient({
          id: data.id,
          name: data.name,
          email: data.email || undefined,
          contact: data.contact,
          address: data.address || undefined,
          region: data.region || '',
          category: (data.category as 'individual' | 'company') || 'individual',
          taxPin: data.tax_pin || undefined
        })
      }
    } catch (error) {
      console.error('Error fetching client:', error)
    } finally {
      setLoadingClient(false)
    }
  }

  const fetchVehicles = async (id: number) => {
    try {
      setLoadingVehicles(true)
      const data = await adminApiService.getConversionVehiclesByClient(id)
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      setVehicles([])
    } finally {
      setLoadingVehicles(false)
    }
  }

  const handleSave = async (clientData: Partial<Client>) => {
    if (!client) return
    await adminApiService.updateConversionClient(client.id, {
      name: clientData.name || '',
      email: clientData.email || '',
      contact: clientData.contact || '',
      category: clientData.category || 'individual',
      tax_pin: clientData.taxPin || '',
      address: clientData.address || '',
      region: clientData.region || '',
      is_active: 1
    })
    await fetchClient(client.id)
  }

  if (loadingClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <button onClick={() => navigate('/clients')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ChevronLeft className="h-4 w-4" /> Back to Clients
        </button>
        <p className="text-center text-sm text-gray-400 mt-16">Client not found.</p>
      </div>
    )
  }

  const isCompany = client.category === 'company'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero banner ── */}
      <div className="relative text-white" style={{ backgroundColor: '#0b0f24' }}>
        {/* subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative px-5 pt-3 pb-3">
          {/* Top row: back + edit */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate('/clients')}
              className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" />
              Clients
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white/15 hover:bg-white/25 rounded-lg backdrop-blur transition-colors"
            >
              <Edit className="h-3 w-3" />
              Edit
            </button>
          </div>

          {/* Avatar + name + chips on one row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold shadow bg-white/10 shrink-0">
              {getInitials(client.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold leading-tight truncate">{client.name}</h1>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-white/20">
                  {isCompany ? <Building2 className="h-2.5 w-2.5" /> : <UserCheck className="h-2.5 w-2.5" />}
                  {isCompany ? 'Company' : 'Individual'}
                </span>
                {client.region && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">
                    <MapPin className="h-2.5 w-2.5" />
                    {client.region}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">
                  <Car className="h-2.5 w-2.5" />
                  {loadingVehicles ? '—' : vehicles.length} vehicles
                </span>
                {client.taxPin && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">
                    <CreditCard className="h-2.5 w-2.5" />
                    {client.taxPin}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="bg-white border-b border-gray-200 px-5">
        <div className="flex gap-0">
          {([
            { id: 'information', label: 'Information', icon: <Info className="h-3.5 w-3.5" /> },
            { id: 'vehicles',    label: 'Vehicles',    icon: <Car className="h-3.5 w-3.5" />,
              badge: loadingVehicles ? undefined : vehicles.length },
            { id: 'invoices',    label: 'Invoices',    icon: <FileText className="h-3.5 w-3.5" /> },
            { id: 'service',     label: 'Service',     icon: <Wrench className="h-3.5 w-3.5" /> },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {'badge' in tab && tab.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                  activeTab === tab.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-5 py-5">

        {/* Information */}
        {activeTab === 'information' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Information</h2>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-gray-50">
              <InfoCell icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={client.contact} />
              {client.email
                ? <InfoCell icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={client.email} />
                : <InfoCell icon={<Mail className="h-3.5 w-3.5" />} label="Email" value="—" muted />
              }
              {client.region
                ? <InfoCell icon={<MapPin className="h-3.5 w-3.5" />} label="Region" value={client.region} />
                : <InfoCell icon={<MapPin className="h-3.5 w-3.5" />} label="Region" value="—" muted />
              }
              {client.address
                ? <InfoCell icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={client.address} />
                : <InfoCell icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value="—" muted />
              }
            </div>
          </div>
        )}

        {/* Vehicles */}
        {activeTab === 'vehicles' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-gray-700">Vehicles</h2>
                {!loadingVehicles && (
                  <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">
                    {vehicles.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate(`/clients/${client.id}/vehicles/new`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Vehicle
              </button>
            </div>

            {loadingVehicles ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <Car className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-xs text-gray-400">No vehicles attached yet</p>
                <button
                  onClick={() => navigate(`/clients/${client.id}/vehicles/new`)}
                  className="mt-3 text-xs text-green-600 hover:underline"
                >
                  Add the first vehicle →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Plate</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Vehicle</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Odometer</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Color</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vehicles.map((v) => (
                      <tr
                        key={v.id}
                        onClick={() => navigate(`/clients/${client.id}/vehicles/${v.id}`)}
                        className="group cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
                            {v.registration_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-800">
                            {[v.year, v.make, v.model].filter(Boolean).join(' ') || '—'}
                          </p>
                          {v.vin_serial_number && (
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{v.vin_serial_number}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {v.vehicle_type ? (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${vehicleTypeStyle(v.vehicle_type)}`}>
                              {v.vehicle_type}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {v.current_odo ? `${v.current_odo.toLocaleString()} ${v.odo_unit}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {v.color && (
                              <span
                                className="w-3 h-3 rounded-full border border-gray-200 shrink-0"
                                style={{ backgroundColor: v.color.toLowerCase() }}
                              />
                            )}
                            <span className="text-xs text-gray-600">{v.color || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-green-500 transition-colors ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Invoices — placeholder */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-14 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <FileText className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-xs font-medium text-gray-500">No invoices yet</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Invoices for this client will appear here</p>
          </div>
        )}

        {/* Service — placeholder */}
        {activeTab === 'service' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-14 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Wrench className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-xs font-medium text-gray-500">No service records</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Service history for this client will appear here</p>
          </div>
        )}

      </div>

      {isEditModalOpen && (
        <EditClientModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          client={client}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

/* ── Info cell used in the contact grid ── */
interface InfoCellProps {
  icon: React.ReactNode
  label: string
  value: string
  muted?: boolean
}

const InfoCell: React.FC<InfoCellProps> = ({ icon, label, value, muted }) => (
  <div className="flex items-start gap-3 px-4 py-3">
    <span className="text-gray-300 mt-0.5 shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-xs leading-snug break-words ${muted ? 'text-gray-300' : 'text-gray-800'}`}>{value}</p>
    </div>
  </div>
)

/* ── Edit modal ── */
interface EditClientModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
  onSave: (data: Partial<Client>) => Promise<void>
}

const EditClientModal: React.FC<EditClientModalProps> = ({ isOpen, onClose, client, onSave }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: client.name,
    email: client.email || '',
    contact: client.contact,
    address: client.address || '',
    region: client.region,
    category: client.category,
    taxPin: client.taxPin || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await onSave(formData)
      onClose()
    } catch (error) {
      alert(`Failed to save: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!isOpen) return null

  const field = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
  const label = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Edit Client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className={label}>Client Type</label>
            <select
              name="category"
              value={formData.category || 'individual'}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as 'individual' | 'company' }))}
              className={field}
            >
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </select>
          </div>

          <div>
            <label className={label}>{formData.category === 'company' ? 'Company Name' : 'Full Name'} *</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className={field} placeholder="Enter name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Contact *</label>
              <input type="text" name="contact" value={formData.contact || ''} onChange={handleChange} required className={field} placeholder="+254..." />
            </div>
            <div>
              <label className={label}>Email</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={field} placeholder="optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Tax PIN</label>
              <input type="text" name="taxPin" value={formData.taxPin || ''} onChange={handleChange} className={field} placeholder="optional" />
            </div>
            <div>
              <label className={label}>Region</label>
              <input type="text" name="region" value={formData.region || ''} onChange={handleChange} className={field} placeholder="e.g. Nairobi" />
            </div>
          </div>

          <div>
            <label className={label}>Address</label>
            <textarea name="address" value={formData.address || ''} onChange={handleChange} rows={2}
              className={field + ' resize-none'} placeholder="Street address..." />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientDetails
