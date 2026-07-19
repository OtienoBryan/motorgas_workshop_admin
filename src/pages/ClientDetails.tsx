import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import html2canvas from 'html2canvas'
import { adminApiService, JobCard } from '../services/api'
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
  Info,
  FileText,
  Wrench,
  MessageSquare,
  Settings2,
  ShieldOff,
  Percent,
  Tags,
  CalendarClock,
  ClipboardCheck,
  QrCode,
  Download,
} from 'lucide-react'
import { Client, mapConversionClient } from './Clients'
import { ESTIMATE_STAGE_STATUSES, STATUS_STYLES as JOB_STATUS_STYLES, STATUS_LABELS as JOB_STATUS_LABELS } from './JobCardForm'

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
  const [activeTab, setActiveTab] = useState<'information' | 'vehicles' | 'invoices' | 'service' | 'quotations' | 'qrcode'>('information')
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [loadingJobCards, setLoadingJobCards] = useState(true)

  useEffect(() => {
    if (clientId) {
      fetchClient(Number(clientId))
      fetchVehicles(Number(clientId))
      fetchJobCards(Number(clientId))
    }
  }, [clientId])

  const fetchClient = async (id: number) => {
    try {
      setLoadingClient(true)
      const data = await adminApiService.getConversionClient(id)
      if (data) {
        setClient(mapConversionClient(data))
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

  const fetchJobCards = async (id: number) => {
    try {
      setLoadingJobCards(true)
      const data = await adminApiService.getJobCards(undefined, id)
      setJobCards(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching job cards:', error)
      setJobCards([])
    } finally {
      setLoadingJobCards(false)
    }
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
  const quotations = jobCards.filter(jc => ESTIMATE_STAGE_STATUSES.includes(jc.status))
  const invoices = jobCards.filter(jc => !ESTIMATE_STAGE_STATUSES.includes(jc.status))

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
              onClick={() => navigate(`/clients/${client.id}/edit`)}
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
            { id: 'invoices',    label: 'Invoices',    icon: <FileText className="h-3.5 w-3.5" />,
              badge: loadingJobCards ? undefined : invoices.length },
            { id: 'quotations',  label: 'Quotations',  icon: <ClipboardCheck className="h-3.5 w-3.5" />,
              badge: loadingJobCards ? undefined : quotations.length },
            { id: 'service',     label: 'Service',     icon: <Wrench className="h-3.5 w-3.5" /> },
            { id: 'qrcode',      label: 'QR Code',     icon: <QrCode className="h-3.5 w-3.5" /> },
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
          <div className="space-y-4">
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">How did you find us?</h2>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-50">
                {client.referralSource
                  ? <InfoCell icon={<Info className="h-3.5 w-3.5" />} label="Source" value={client.referralSource} />
                  : <InfoCell icon={<Info className="h-3.5 w-3.5" />} label="Source" value="—" muted />
                }
                {client.referralNotes
                  ? <InfoCell icon={<FileText className="h-3.5 w-3.5" />} label="Notes" value={client.referralNotes} />
                  : <InfoCell icon={<FileText className="h-3.5 w-3.5" />} label="Notes" value="—" muted />
                }
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5 text-gray-400" />
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Settings</h2>
              </div>
              <div className="divide-y divide-gray-50">
                <SettingRow icon={<ShieldOff className="h-3.5 w-3.5" />} label="Tax Exempt" enabled={!!client.taxExempt} />
                <SettingRow icon={<Percent className="h-3.5 w-3.5" />} label="Apply Discount" enabled={!!client.applyDiscount}
                  value={client.applyDiscount && client.discountRate ? `${client.discountRate}%` : undefined} />
                <SettingRow icon={<Wrench className="h-3.5 w-3.5" />} label="Labour Rate Override" enabled={!!client.labourRateOverride}
                  value={client.labourRateOverride && client.labourRate ? client.labourRate : undefined} />
                <SettingRow icon={<Tags className="h-3.5 w-3.5" />} label="Parts Markup Override" enabled={!!client.partsMarkupOverride}
                  value={client.partsMarkupOverride && client.partsMarkup ? `${client.partsMarkup}%` : undefined} />
                <SettingRow icon={<CalendarClock className="h-3.5 w-3.5" />} label="Payment Terms Override" enabled={!!client.paymentTermsOverride}
                  value={client.paymentTermsOverride && client.paymentTerms ? client.paymentTerms : undefined} />
              </div>
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

        {/* Invoices */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
              <h2 className="text-xs font-semibold text-gray-700">Invoices</h2>
              {!loadingJobCards && (
                <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">
                  {invoices.length}
                </span>
              )}
            </div>

            {loadingJobCards ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-xs text-gray-400">No invoices yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Invoices for this client will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Invoice #</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Vehicle</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Amount Paid</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Balance</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invoices.map(jc => {
                      const items = jc.items || []
                      const subtotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0)
                      const taxable = items.filter(i => i.taxable !== 0).reduce((sum, i) => sum + Number(i.amount || 0), 0)
                      const vat = jc.vat_enabled ? taxable * (Number(jc.vat_rate) / 100) : 0
                      const total = subtotal + vat - Number(jc.discount || 0) + Number(jc.other_charges || 0)
                      const amountPaid = Number(jc.amount_paid || 0)
                      const balance = total - amountPaid
                      const money = (n: number) => `Ksh${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      return (
                        <tr
                          key={jc.id}
                          onClick={() => navigate(`/job-cards/${jc.id}/invoice`)}
                          className="group cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
                              INV-{String(jc.id).padStart(4, '0')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-700">
                            {jc.conversionVehicle
                              ? `${jc.conversionVehicle.make ?? ''} ${jc.conversionVehicle.model}`.trim()
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                            {new Date(jc.created_at).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${JOB_STATUS_STYLES[jc.status] || 'bg-gray-100 text-gray-500'}`}>
                              {JOB_STATUS_LABELS[jc.status] || jc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-gray-900 whitespace-nowrap">
                            {money(total)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                            {money(amountPaid)}
                          </td>
                          <td className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${balance > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                            {money(balance)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-green-500 transition-colors ml-auto" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quotations */}
        {activeTab === 'quotations' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-gray-700">Quotations</h2>
                {!loadingJobCards && (
                  <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">
                    {quotations.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/job-cards/new', { state: { clientId: client.id } })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                New Quotation
              </button>
            </div>

            {loadingJobCards ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              </div>
            ) : quotations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <ClipboardCheck className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-xs text-gray-400">No quotations yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Quotation #</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Vehicle</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Amount Paid</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Balance</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {quotations.map(jc => {
                      const items = jc.items || []
                      const subtotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0)
                      const taxable = items.filter(i => i.taxable !== 0).reduce((sum, i) => sum + Number(i.amount || 0), 0)
                      const vat = jc.vat_enabled ? taxable * (Number(jc.vat_rate) / 100) : 0
                      const total = subtotal + vat - Number(jc.discount || 0) + Number(jc.other_charges || 0)
                      const amountPaid = Number(jc.amount_paid || 0)
                      const balance = total - amountPaid
                      const money = (n: number) => `Ksh${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      return (
                        <tr
                          key={jc.id}
                          onClick={() => navigate(`/job-cards/${jc.id}`)}
                          className="group cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
                              QT-{String(jc.id).padStart(4, '0')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-700">
                            {jc.conversionVehicle
                              ? `${jc.conversionVehicle.make ?? ''} ${jc.conversionVehicle.model}`.trim()
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                            {new Date(jc.created_at).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${JOB_STATUS_STYLES[jc.status] || 'bg-gray-100 text-gray-500'}`}>
                              {JOB_STATUS_LABELS[jc.status] || jc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-gray-900 whitespace-nowrap">
                            {money(total)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                            {money(amountPaid)}
                          </td>
                          <td className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${balance > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                            {money(balance)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-green-500 transition-colors ml-auto" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
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

        {/* QR Code */}
        {activeTab === 'qrcode' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <ClientQrTab client={client} vehicles={vehicles} />
          </div>
        )}

      </div>
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

/* ── Setting row used in the Settings card ── */
interface SettingRowProps {
  icon: React.ReactNode
  label: string
  enabled: boolean
  value?: string
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, label, enabled, value }) => (
  <div className="flex items-center justify-between px-4 py-2.5">
    <div className="flex items-center gap-2.5 text-gray-700">
      <span className="text-gray-300 shrink-0">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {enabled && value && <span className="text-xs font-mono text-gray-600">{value}</span>}
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
        enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
      }`}>
        {enabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  </div>
)

/* ── Client QR code tab ── */
const ClientQrTab: React.FC<{ client: Client; vehicles: Vehicle[] }> = ({ client, vehicles }) => {
  const exportRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const buildQrValue = (compactVehicles: boolean) => {
    const vehicleLines = vehicles.length === 0
      ? ['No vehicles on record']
      : vehicles.flatMap((v, i) => {
          const title = [v.year, v.make, v.model].filter(Boolean).join(' ')
          const headline = `${i + 1}. ${v.registration_number}${title ? ` — ${title}` : ''}`
          if (compactVehicles) return [headline]
          return [
            headline,
            v.vehicle_type && `   Type: ${v.vehicle_type}`,
            v.vin_serial_number && `   VIN: ${v.vin_serial_number}`,
            v.engine && `   Engine: ${v.engine}`,
            v.color && `   Color: ${v.color}`,
            v.current_odo && `   Odometer: ${v.current_odo.toLocaleString()} ${v.odo_unit}`,
          ].filter(Boolean) as string[]
        })

    return [
      'MOTORGAS AFRICA — CLIENT ID',
      '',
      '— CLIENT —',
      `Client ID: ${client.id}`,
      `Name: ${client.name}`,
      `Category: ${client.category === 'company' ? 'Company' : 'Individual'}`,
      client.contact && `Phone: ${client.contact}`,
      client.email && `Email: ${client.email}`,
      client.address && `Address: ${client.address}`,
      client.region && `Region: ${client.region}`,
      client.taxPin && `Tax PIN: ${client.taxPin}`,
      client.accountNumber && `Account No: ${client.accountNumber}`,
      '',
      `— VEHICLES (${vehicles.length}) —`,
      ...vehicleLines,
    ].filter(Boolean).join('\n')
  }

  // Full vehicle details, falling back to one line per vehicle if the payload
  // would exceed what a level-H QR code can reliably hold
  const detailedQrValue = buildQrValue(false)
  const qrValue = detailedQrValue.length <= 1100 ? detailedQrValue : buildQrValue(true)

  const handleDownload = async () => {
    if (!exportRef.current) return
    try {
      setDownloading(true)
      const canvas = await html2canvas(exportRef.current, { backgroundColor: '#ffffff', scale: 3 })
      const link = document.createElement('a')
      const clientName = client.name.trim().replace(/[^a-zA-Z0-9]+/g, '-') || 'Client'
      link.download = `${clientName}-qr.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-gray-900">Client QR Code</h2>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Download PNG
        </button>
      </div>

      <div className="flex flex-col items-center py-4">
        {/* QR card */}
        <div className="w-[340px] rounded-3xl overflow-hidden shadow-lg bg-white border border-gray-100">
          <div className="h-2.5 bg-gradient-to-r from-green-500 via-green-400 to-green-600" />

          <div className="px-8 pt-7 pb-8 flex flex-col items-center">
            <img src="/motor.jpeg" alt="MotorGas" className="h-12 object-contain mb-1" />
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-5">Client Identity</p>

            <div className="rounded-2xl border-2 border-gray-100 p-4 bg-white">
              <QRCodeCanvas
                value={qrValue}
                size={640}
                level="H"
                marginSize={0}
                bgColor="#ffffff"
                fgColor="#111827"
                imageSettings={{
                  src: '/motor.jpeg',
                  height: 128,
                  width: 128,
                  excavate: true,
                }}
                style={{ width: 224, height: 224 }}
              />
            </div>

            <h3 className="text-base font-bold text-gray-900 mt-5 text-center leading-tight">{client.name}</h3>
            {client.accountNumber && (
              <span className="mt-2 inline-flex items-center font-mono text-sm font-bold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1 tracking-wider">
                {client.accountNumber}
              </span>
            )}
            {client.contact && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Phone className="h-3 w-3" /> {client.contact}
              </p>
            )}

            <p className="text-[10px] text-gray-300 mt-5">Scan for client details</p>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-5 max-w-sm text-center">
          The QR code contains this client's key details and contact information.
          Print it and attach it to their file for quick identification.
        </p>
      </div>

      {/* Offscreen card rendered to PNG on download */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={exportRef} className="w-[375px] bg-white px-8 py-8 flex flex-col items-center">
          <img src="/motor.jpeg" alt="MotorGas" className="h-12 object-contain mb-2" />
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.25em] mb-6">Client Identity</p>
          <div className="rounded-2xl border-2 border-gray-100 p-5 bg-white">
            <QRCodeCanvas
              value={qrValue}
              size={640}
              level="H"
              marginSize={0}
              bgColor="#ffffff"
              fgColor="#111827"
              imageSettings={{
                src: '/motor.jpeg',
                height: 128,
                width: 128,
                excavate: true,
              }}
              style={{ width: 256, height: 256 }}
            />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mt-6 text-center leading-tight">{client.name}</h3>
          {client.accountNumber && (
            <span className="mt-3 inline-flex items-center font-mono text-sm font-bold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg px-3.5 py-1.5 tracking-wider">
              {client.accountNumber}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClientDetails
