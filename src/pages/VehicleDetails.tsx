import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import html2canvas from 'html2canvas'
import { adminApiService, VehicleInspection, Staff, JobCard, ConversionClient } from '../services/api'
import JobCardInvoiceDocument from '../components/JobCardInvoiceDocument'
import { STATUS_STYLES as JOB_STATUS_STYLES, STATUS_LABELS as JOB_STATUS_LABELS, ESTIMATE_STAGE_STATUSES } from './JobCardForm'
import {
  ChevronLeft,
  Loader2,
  Edit,
  Trash2,
  Car,
  Gauge,
  Wrench,
  StickyNote,
  Hash,
  Palette,
  Activity,
  ArrowUpDown,
  CircleDot,
  Info,
  X,
  ChevronRight,
  ClipboardCheck,
  UserCog,
  Receipt,
  Printer,
  Fuel,
  SatelliteDish,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Plus,
  Copy,
  Check,
  List,
  LayoutGrid,
  ChevronsLeft,
  ChevronsRight,
  Calculator,
  History as HistoryIcon,
  Clock,
  QrCode,
  Download,
} from 'lucide-react'

export interface Vehicle {
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
  engine_capacity?: string
  engine_code?: string
  current_odo?: number
  odo_unit: 'KM' | 'Miles'
  color?: string
  unit_number?: string
  tank_capacity?: string
  telemetry_status?: string
  notes?: string
  photo_url?: string
  photo_urls?: string[]
  vsa_url?: string
  logbook_url?: string
  labels?: string[]
  created_at: string
  updated_at: string
  conversionClient?: ConversionClient
}

type Tab = 'owner' | 'estimates' | 'invoices' | 'inspections' | 'history' | 'deferred' | 'notes' | 'qrcode'

const INSPECTION_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
}

const INSPECTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

function jobCardFinancials(jc: JobCard) {
  const items = jc.items || []
  const subtotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0)
  const taxable = items.filter(i => i.taxable !== 0).reduce((sum, i) => sum + Number(i.amount || 0), 0)
  const vat = jc.vat_enabled ? taxable * (Number(jc.vat_rate) / 100) : 0
  const discount = Number(jc.discount || 0)
  const total = subtotal + vat - discount + Number(jc.other_charges || 0)

  const profitFromParts = items.filter(i => i.item_type === 'part')
    .reduce((sum, i) => sum + (Number(i.price || 0) - Number(i.cost || 0)) * Number(i.quantity || 0), 0)
  const profitFromLabor = items.filter(i => i.item_type === 'labor')
    .reduce((sum, i) => sum + Number(i.amount || 0), 0)
  const profit = profitFromParts + profitFromLabor - discount

  const amountPaid = Number(jc.amount_paid || 0)
  const balanceDue = total - amountPaid

  return { total, profit, amountPaid, balanceDue }
}

const money = (n: number) => `Ksh ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const INVOICES_PAGE_SIZE = 10

const VehicleDetails: React.FC = () => {
  const navigate = useNavigate()
  const { clientId, vehicleId } = useParams<{ clientId: string; vehicleId: string }>()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('owner')
  const [deleting, setDeleting] = useState(false)
  const [imgIndex, setImgIndex] = useState<number | null>(null)
  const [inspections, setInspections] = useState<VehicleInspection[]>([])
  const [loadingInspections, setLoadingInspections] = useState(false)
  const [isInspectionOpen, setIsInspectionOpen] = useState(false)
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [loadingJobCards, setLoadingJobCards] = useState(false)
  const [invoiceJobCard, setInvoiceJobCard] = useState<JobCard | null>(null)
  const [invoicesView, setInvoicesView] = useState<'list' | 'grid'>('list')
  const [invoicesPage, setInvoicesPage] = useState(1)
  const [addingLabel, setAddingLabel] = useState(false)
  const [newLabelText, setNewLabelText] = useState('')
  const [savingLabel, setSavingLabel] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (!vehicleId) return
    const fetch = async () => {
      try {
        setLoading(true)
        const data = await adminApiService.getConversionVehicle(Number(vehicleId))
        setVehicle(data)
      } catch (err) {
        console.error('Error fetching vehicle:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [vehicleId])

  const fetchInspections = async () => {
    if (!vehicleId) return
    try {
      setLoadingInspections(true)
      const data = await adminApiService.getVehicleInspections(Number(vehicleId))
      setInspections(Array.isArray(data) ? data : [])
    } catch {
      setInspections([])
    } finally {
      setLoadingInspections(false)
    }
  }

  useEffect(() => { fetchInspections() }, [vehicleId])

  useEffect(() => {
    if (!vehicleId) return
    const fetchJobCards = async () => {
      try {
        setLoadingJobCards(true)
        const data = await adminApiService.getJobCards(Number(vehicleId))
        // Only converted job cards are invoices — quotations belong in the Quotations tab
        const invoiced = (Array.isArray(data) ? data : []).filter(jc => !ESTIMATE_STAGE_STATUSES.includes(jc.status))
        setJobCards(invoiced)
      } catch {
        setJobCards([])
      } finally {
        setLoadingJobCards(false)
      }
    }
    fetchJobCards()
  }, [vehicleId])

  const handleDelete = async () => {
    if (!window.confirm('Delete this vehicle? This cannot be undone.')) return
    try {
      setDeleting(true)
      await adminApiService.deleteConversionVehicle(Number(vehicleId))
      navigate(`/clients/${clientId}`)
    } catch {
      alert('Failed to delete vehicle')
    } finally {
      setDeleting(false)
    }
  }

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(f => (f === field ? null : f)), 1500)
    })
  }

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicle || !newLabelText.trim()) return
    const labels = [...(vehicle.labels || []), newLabelText.trim()]
    try {
      setSavingLabel(true)
      await adminApiService.updateConversionVehicle(vehicle.id, { labels })
      setVehicle({ ...vehicle, labels })
      setNewLabelText('')
      setAddingLabel(false)
    } catch (err) {
      alert(`Failed to add label: ${(err as any).message || 'Unknown error'}`)
    } finally {
      setSavingLabel(false)
    }
  }

  const handleRemoveLabel = async (label: string) => {
    if (!vehicle) return
    const labels = (vehicle.labels || []).filter(l => l !== label)
    try {
      await adminApiService.updateConversionVehicle(vehicle.id, { labels })
      setVehicle({ ...vehicle, labels })
    } catch (err) {
      alert(`Failed to remove label: ${(err as any).message || 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-green-600" />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <button onClick={() => navigate(`/clients/${clientId}`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-center text-sm text-gray-400 mt-16">Vehicle not found.</p>
      </div>
    )
  }

  const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')
  const photos = vehicle.photo_urls?.length ? vehicle.photo_urls : (vehicle.photo_url ? [vehicle.photo_url] : [])
  const labels = vehicle.labels || []

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'owner',       label: 'Owner',       icon: <User className="h-3.5 w-3.5" /> },
    { id: 'estimates',   label: 'Quotations',  icon: <Calculator className="h-3.5 w-3.5" /> },
    { id: 'invoices',    label: 'Invoices',    icon: <Receipt className="h-3.5 w-3.5" /> },
    { id: 'inspections', label: 'Inspections', icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
    { id: 'history',     label: 'History',     icon: <HistoryIcon className="h-3.5 w-3.5" /> },
    { id: 'deferred',    label: 'Deferred',    icon: <Clock className="h-3.5 w-3.5" /> },
    { id: 'notes',       label: 'Notes',       icon: <StickyNote className="h-3.5 w-3.5" /> },
    { id: 'qrcode',      label: 'QR Code',     icon: <QrCode className="h-3.5 w-3.5" /> },
  ]

  const invoiceTotals = jobCards.reduce((acc, jc) => {
    const fin = jobCardFinancials(jc)
    acc.total += fin.total
    acc.paid += fin.amountPaid
    acc.balance += fin.balanceDue
    acc.profit += fin.profit
    return acc
  }, { total: 0, paid: 0, balance: 0, profit: 0 })

  const invoicesTotalPages = Math.max(1, Math.ceil(jobCards.length / INVOICES_PAGE_SIZE))
  const invoicesSafePage = Math.min(invoicesPage, invoicesTotalPages)
  const paginatedJobCards = jobCards.slice((invoicesSafePage - 1) * INVOICES_PAGE_SIZE, invoicesSafePage * INVOICES_PAGE_SIZE)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#eef1fa' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/clients/${clientId}`)}
            className="p-1.5 rounded-lg hover:bg-black/5 text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Vehicle</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/clients/${clientId}/vehicles/${vehicleId}/edit`)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium border border-blue-300 text-blue-600 bg-white rounded-full hover:bg-blue-50 transition-colors"
          >
            Edit <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium border border-red-300 text-red-600 bg-white rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">

        {/* ── Left sidebar ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-[4/3] mb-3">
            {photos[0] ? (
              <img src={photos[0]} alt={title} onClick={() => setImgIndex(0)}
                className="w-full h-full object-cover cursor-zoom-in" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Car className="h-10 w-10" />
              </div>
            )}
            <button
              onClick={() => navigate(`/clients/${clientId}/vehicles/${vehicleId}/edit`)}
              className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow hover:bg-blue-700 transition-colors"
              title="Edit vehicle"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <DocumentBadge label="VSA" url={vehicle.vsa_url} />
            <DocumentBadge label="Logbook" url={vehicle.logbook_url} />
          </div>

          <h2 className="text-lg font-bold text-gray-900 leading-tight mb-2">{title || 'Vehicle'}</h2>

          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {labels.map(label => (
                <span key={label}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                  {label}
                  <button onClick={() => handleRemoveLabel(label)} className="hover:text-gray-900" title="Remove label">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {addingLabel ? (
            <form onSubmit={handleAddLabel} className="flex items-center gap-1 mb-3">
              <input
                autoFocus
                value={newLabelText}
                onChange={e => setNewLabelText(e.target.value)}
                placeholder="Label text…"
                className="min-w-0 flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button type="submit" disabled={savingLabel || !newLabelText.trim()}
                className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {savingLabel ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
              </button>
              <button type="button" onClick={() => { setAddingLabel(false); setNewLabelText('') }}
                className="p-1 text-gray-400 hover:text-gray-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAddingLabel(true)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 border border-blue-300 rounded-full px-2.5 py-1 mb-3 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-3 w-3" /> Add Label
            </button>
          )}

          <div className="-mx-1 border-t border-gray-100 pt-2">
            <SidebarRow icon={<Car className="h-3.5 w-3.5" />} value={vehicle.vehicle_type} />
            <SidebarRow icon={<Hash className="h-3.5 w-3.5" />} value={vehicle.vin_serial_number} mono
              onCopy={() => vehicle.vin_serial_number && handleCopy(vehicle.vin_serial_number, 'vin')}
              copied={copiedField === 'vin'} />
            <SidebarRow icon={<CreditCard className="h-3.5 w-3.5" />} value={vehicle.registration_number} mono
              onCopy={() => handleCopy(vehicle.registration_number, 'plate')}
              copied={copiedField === 'plate'} />
            <SidebarRow icon={<ArrowUpDown className="h-3.5 w-3.5" />} value={vehicle.transmission_type} />
            <SidebarRow icon={<CircleDot className="h-3.5 w-3.5" />} value={vehicle.driven_wheel} />
            <SidebarRow icon={<Wrench className="h-3.5 w-3.5" />} value={vehicle.engine} />
            <SidebarRow icon={<Gauge className="h-3.5 w-3.5" />} value={vehicle.engine_capacity} />
            <SidebarRow icon={<Hash className="h-3.5 w-3.5" />} value={vehicle.engine_code} mono />
            <SidebarRow icon={<Info className="h-3.5 w-3.5" />} value={vehicle.trim_option} />
            <SidebarRow icon={<Palette className="h-3.5 w-3.5" />} value={vehicle.color} colorDot={vehicle.color} />
            <SidebarRow icon={<Activity className="h-3.5 w-3.5" />} value={vehicle.unit_number} />
            <SidebarRow icon={<Gauge className="h-3.5 w-3.5" />}
              value={vehicle.current_odo ? `${vehicle.current_odo.toLocaleString()} ${vehicle.odo_unit}` : undefined} />
            <SidebarRow icon={<Fuel className="h-3.5 w-3.5" />} value={vehicle.tank_capacity} />
            <SidebarRow icon={<SatelliteDish className="h-3.5 w-3.5" />} value={vehicle.telemetry_status} />
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <div style={{ backgroundColor: '#0b0f24' }} className="flex flex-wrap gap-1 p-1.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-white text-gray-900' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white p-5 min-h-[420px]">

            {/* Owner */}
            {activeTab === 'owner' && (
              vehicle.conversionClient ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{vehicle.conversionClient.name}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700 capitalize">
                        {vehicle.conversionClient.category}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/clients/${clientId}`)}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View Client Profile
                    </button>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                    <SpecCell icon={<Phone className="h-3.5 w-3.5" />}      label="Phone"        value={vehicle.conversionClient.contact} />
                    <SpecCell icon={<Mail className="h-3.5 w-3.5" />}      label="Email"        value={vehicle.conversionClient.email || undefined} />
                    <SpecCell icon={<MapPin className="h-3.5 w-3.5" />}    label="Region"       value={vehicle.conversionClient.region || undefined} />
                    <SpecCell icon={<MapPin className="h-3.5 w-3.5" />}    label="Address"      value={vehicle.conversionClient.address || undefined} />
                    <SpecCell icon={<Hash className="h-3.5 w-3.5" />}      label="Tax PIN"      value={vehicle.conversionClient.tax_pin || undefined} mono />
                    <SpecCell icon={<CreditCard className="h-3.5 w-3.5" />} label="Account No."  value={vehicle.conversionClient.account_number} mono />
                  </div>
                </div>
              ) : (
                <EmptyTab icon={<User className="h-5 w-5 text-gray-300" />} title="No owner on record" subtitle="This vehicle has no linked client" />
              )
            )}

            {/* Quotations — placeholder */}
            {activeTab === 'estimates' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-900">Quotations</h2>
                  <button
                    onClick={() => navigate('/job-cards/new', { state: { clientId: Number(clientId), vehicleId: Number(vehicleId) } })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Quote
                  </button>
                </div>
                <EmptyTab icon={<Calculator className="h-5 w-5 text-gray-300" />}
                  title="No quotations yet" subtitle="Quotations for this vehicle will appear here" />
              </div>
            )}

            {/* Invoices */}
            {activeTab === 'invoices' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-900">Invoices</h2>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setInvoicesView('list')}
                      className={`p-1.5 rounded-md transition-colors ${invoicesView === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                      title="List view"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setInvoicesView('grid')}
                      className={`p-1.5 rounded-md transition-colors ${invoicesView === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Grid view"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {loadingJobCards ? (
                  <div className="flex items-center justify-center py-14">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  </div>
                ) : jobCards.length === 0 ? (
                  <EmptyTab icon={<Receipt className="h-5 w-5 text-gray-300" />}
                    title="No invoices yet" subtitle="Invoices for this vehicle will appear here" />
                ) : invoicesView === 'grid' ? (
                  <div className="space-y-3">
                    {paginatedJobCards.map(jc => {
                      const fin = jobCardFinancials(jc)
                      return (
                        <div key={jc.id}
                          onClick={() => navigate(`/job-cards/${jc.id}`)}
                          className="border border-gray-100 rounded-2xl p-4 cursor-pointer hover:border-green-300 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                                  Job #{jc.id}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${JOB_STATUS_STYLES[jc.status]}`}>
                                  {JOB_STATUS_LABELS[jc.status]}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-1">
                                {new Date(jc.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">{money(fin.total)}</p>
                              <button
                                onClick={e => { e.stopPropagation(); setInvoiceJobCard(jc) }}
                                className="flex items-center gap-1 text-[11px] text-green-700 hover:text-green-800 font-medium mt-1 ml-auto"
                              >
                                <Receipt className="h-3 w-3" /> View Invoice
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">id.</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Plate</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Paid Amount</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Balance Due</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Profit</th>
                            <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {paginatedJobCards.map(jc => {
                            const fin = jobCardFinancials(jc)
                            return (
                              <tr key={jc.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-2 text-xs text-gray-700">{jc.id}</td>
                                <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">
                                  {vehicle.conversionClient?.name || '—'}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${JOB_STATUS_STYLES[jc.status]}`}>
                                    {JOB_STATUS_LABELS[jc.status]}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                                  {new Date(jc.created_at).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </td>
                                <td className="px-3 py-2 text-xs font-mono text-gray-700 whitespace-nowrap">{vehicle.registration_number}</td>
                                <td className="px-3 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap">{money(fin.total)}</td>
                                <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{money(fin.amountPaid)}</td>
                                <td className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${fin.balanceDue > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                  {money(fin.balanceDue)}
                                </td>
                                <td className="px-3 py-2 text-xs font-medium text-green-600 whitespace-nowrap">{money(fin.profit)}</td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    onClick={() => navigate(`/job-cards/${jc.id}`)}
                                    className="px-2.5 py-1 text-[11px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    Open
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-gray-100 bg-gray-50 font-semibold">
                            <td className="px-3 py-2" colSpan={5}></td>
                            <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">{money(invoiceTotals.total)}</td>
                            <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">{money(invoiceTotals.paid)}</td>
                            <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">{money(invoiceTotals.balance)}</td>
                            <td className="px-3 py-2 text-xs text-green-700 whitespace-nowrap">{money(invoiceTotals.profit)}</td>
                            <td className="px-3 py-2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {jobCards.length > INVOICES_PAGE_SIZE && (
                      <div className="flex items-center justify-center gap-1 py-2 border-t border-gray-100">
                        <button onClick={() => setInvoicesPage(1)} disabled={invoicesSafePage === 1}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                          <ChevronsLeft className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setInvoicesPage(p => Math.max(1, p - 1))} disabled={invoicesSafePage === 1}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <select
                          value={invoicesSafePage}
                          onChange={e => setInvoicesPage(Number(e.target.value))}
                          className="px-2 py-1 text-xs border border-gray-200 rounded-lg text-blue-600 font-medium outline-none"
                        >
                          {Array.from({ length: invoicesTotalPages }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <button onClick={() => setInvoicesPage(p => Math.min(invoicesTotalPages, p + 1))} disabled={invoicesSafePage === invoicesTotalPages}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setInvoicesPage(invoicesTotalPages)} disabled={invoicesSafePage === invoicesTotalPages}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                          <ChevronsRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Inspections */}
            {activeTab === 'inspections' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-900">Inspections</h2>
                  <button
                    onClick={() => setIsInspectionOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Assign Inspection
                  </button>
                </div>
                {loadingInspections ? (
                  <div className="flex items-center justify-center py-14">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  </div>
                ) : inspections.length === 0 ? (
                  <EmptyTab icon={<ClipboardCheck className="h-5 w-5 text-gray-300" />}
                    title="No inspections yet" subtitle="Add an inspection to get started" />
                ) : (
                  <div className="space-y-3">
                    {inspections.map(insp => (
                      <div key={insp.id}
                        onClick={() => navigate(`/clients/${clientId}/vehicles/${vehicleId}/inspections/${insp.id}`)}
                        className="border border-gray-100 rounded-2xl p-4 cursor-pointer hover:border-green-300 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs font-semibold text-gray-900">
                              {new Date(insp.inspection_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <UserCog className="h-3 w-3" />
                              {insp.technician?.name || 'Unassigned'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${INSPECTION_STATUS_STYLES[insp.status]}`}>
                              {INSPECTION_STATUS_LABELS[insp.status]}
                            </span>
                            {insp.issues_found != null && insp.issues_found > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                                {insp.issues_found} issue{insp.issues_found === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                        </div>
                        {insp.summary && (
                          <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed border-t border-gray-50 pt-2 mt-2">{insp.summary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History — placeholder */}
            {activeTab === 'history' && (
              <EmptyTab icon={<HistoryIcon className="h-5 w-5 text-gray-300" />}
                title="No history recorded" subtitle="A timeline of activity for this vehicle will appear here" />
            )}

            {/* Deferred — placeholder */}
            {activeTab === 'deferred' && (
              <EmptyTab icon={<Clock className="h-5 w-5 text-gray-300" />}
                title="No deferred work" subtitle="Work deferred from quotations or inspections will appear here" />
            )}

            {/* Notes */}
            {activeTab === 'notes' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-900">Internal Notes</h2>
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                    Not visible to client
                  </span>
                </div>
                {vehicle.notes
                  ? <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{vehicle.notes}</p>
                  : <p className="text-xs text-gray-400 italic">No notes added for this vehicle.</p>
                }
              </div>
            )}

            {/* QR Code */}
            {activeTab === 'qrcode' && <VehicleQrTab vehicle={vehicle} />}

          </div>
        </div>
      </div>

      {/* ── Floating new invoice button ── */}
      {activeTab === 'invoices' && (
        <button
          onClick={() => navigate('/job-cards/new', { state: { clientId: Number(clientId), vehicleId: Number(vehicleId) } })}
          className="fixed bottom-6 right-6 flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl font-medium text-sm transition-all z-40"
        >
          <Plus className="h-4 w-4" />
          New invoice
        </button>
      )}

      {/* ── Add inspection modal ── */}
      {isInspectionOpen && (
        <AddInspectionModal
          vehicleId={vehicle.id}
          clientId={vehicle.conversion_client_id}
          onClose={() => setIsInspectionOpen(false)}
          onSaved={async () => {
            await fetchInspections()
            setActiveTab('inspections')
          }}
        />
      )}

      {/* ── Invoice modal ── */}
      {invoiceJobCard && (
        <InvoiceModal jobCard={invoiceJobCard} onClose={() => setInvoiceJobCard(null)} />
      )}

      {/* ── Image lightbox ── */}
      {imgIndex !== null && photos[imgIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImgIndex(null)}
        >
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setImgIndex(i => (i! - 1 + photos.length) % photos.length) }}
              className="absolute left-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <img
            src={photos[imgIndex]}
            alt={`${title} photo ${imgIndex + 1}`}
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />

          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setImgIndex(i => (i! + 1) % photos.length) }}
              className="absolute right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {photos.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/40 px-2.5 py-1 rounded-full">
              {imgIndex + 1} / {photos.length}
            </span>
          )}

          <button
            onClick={() => setImgIndex(null)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Sidebar spec row (icon + value, no label — icon implies meaning) ── */
interface SidebarRowProps {
  icon: React.ReactNode
  value?: string | null
  mono?: boolean
  colorDot?: string
  onCopy?: () => void
  copied?: boolean
  link?: string
}

const SidebarRow: React.FC<SidebarRowProps> = ({ icon, value, mono, colorDot, onCopy, copied, link }) => {
  if (!value) return null
  const content = (
    <>
      <span className="text-gray-400 shrink-0">{icon}</span>
      {colorDot && (
        <span className="w-3 h-3 rounded-full border border-gray-200 shrink-0"
          style={{ backgroundColor: colorDot.toLowerCase() }} />
      )}
      <span className={`text-xs text-gray-700 truncate ${mono ? 'font-mono' : ''}`}>{value}</span>
    </>
  )

  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 min-w-0 flex-1 hover:text-green-700">
          {content}
        </a>
      ) : (
        <div className="flex items-center gap-2 min-w-0 flex-1">{content}</div>
      )}
      {onCopy && (
        <button onClick={onCopy} className="p-1 text-gray-300 hover:text-gray-600 shrink-0" title="Copy">
          {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
        </button>
      )}
    </div>
  )
}

/* ── Document badge (VSA / Logbook) shown below the vehicle photo ── */
const DocumentBadge: React.FC<{ label: string; url?: string }> = ({ label, url }) => {
  const content = (
    <>
      <FileText className={`h-3.5 w-3.5 shrink-0 ${url ? 'text-green-600' : 'text-gray-300'}`} />
      <span className={`text-xs font-medium truncate ${url ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
    </>
  )

  if (!url) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-gray-100 bg-gray-50">
        {content}
      </div>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors">
      {content}
    </a>
  )
}

/* ── Spec cell (used in Owner tab) ── */
interface SpecCellProps {
  icon: React.ReactNode
  label: string
  value?: string | null
  mono?: boolean
  colorDot?: string
  onClick?: () => void
}

const SpecCell: React.FC<SpecCellProps> = ({ icon, label, value, mono, colorDot, onClick }) => {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex items-start gap-3 px-4 py-3 w-full text-left ${onClick ? 'hover:bg-gray-50 transition-colors' : ''}`}
    >
      <span className={`mt-0.5 shrink-0 ${onClick ? 'text-green-500' : 'text-gray-300'}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
        <div className="flex items-center gap-1.5">
          {colorDot && (
            <span className="w-3 h-3 rounded-full border border-gray-200 shrink-0"
              style={{ backgroundColor: colorDot.toLowerCase() }} />
          )}
          <p className={`text-xs leading-snug break-words ${!value ? 'text-gray-300' : onClick ? 'text-green-700 font-medium' : 'text-gray-800'} ${mono ? 'font-mono' : ''}`}>
            {value || '—'}
          </p>
        </div>
      </div>
    </Tag>
  )
}

/* ── Empty tab placeholder ── */
const EmptyTab: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-14 text-center">
    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
      {icon}
    </div>
    <p className="text-xs font-medium text-gray-500">{title}</p>
    <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
  </div>
)

/* ── Vehicle QR code tab ── */
const VehicleQrTab: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const exportRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const owner = vehicle.conversionClient
  const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')

  const qrValue = [
    'MOTORGAS TECHNOLOGIES — VEHICLE ID',
    '',
    '— VEHICLE —',
    `Vehicle ID: ${vehicle.id}`,
    `Reg No: ${vehicle.registration_number}`,
    title && `Vehicle: ${title}`,
    vehicle.vehicle_type && `Type: ${vehicle.vehicle_type}`,
    vehicle.vin_serial_number && `VIN: ${vehicle.vin_serial_number}`,
    vehicle.color && `Color: ${vehicle.color}`,
    vehicle.engine && `Engine: ${vehicle.engine}`,
    vehicle.engine_capacity && `Engine Capacity: ${vehicle.engine_capacity}`,
    vehicle.transmission_type && `Transmission: ${vehicle.transmission_type}`,
    vehicle.unit_number && `Unit No: ${vehicle.unit_number}`,
    vehicle.tank_capacity && `Tank Capacity: ${vehicle.tank_capacity}`,
    '',
    '— OWNER —',
    owner ? `Name: ${owner.name}` : 'No owner on record',
    owner?.contact && `Phone: ${owner.contact}`,
    owner?.email && `Email: ${owner.email}`,
    owner?.address && `Address: ${owner.address}`,
    owner?.region && `Region: ${owner.region}`,
    owner?.account_number && `Account No: ${owner.account_number}`,
  ].filter(Boolean).join('\n')

  const handleDownload = async () => {
    if (!exportRef.current) return
    try {
      setDownloading(true)
      const canvas = await html2canvas(exportRef.current, { backgroundColor: '#ffffff', scale: 3 })
      const link = document.createElement('a')
      link.download = `${vehicle.registration_number.replace(/\s+/g, '-')}-qr.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-gray-900">Vehicle QR Code</h2>
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
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-5">Vehicle Identity</p>

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

            <h3 className="text-base font-bold text-gray-900 mt-5 text-center leading-tight">{title || 'Vehicle'}</h3>
            <span className="mt-2 inline-flex items-center font-mono text-sm font-bold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1 tracking-wider">
              {vehicle.registration_number}
            </span>
            {owner && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <User className="h-3 w-3" /> {owner.name}
              </p>
            )}

            <p className="text-[10px] text-gray-300 mt-5">Scan for vehicle &amp; owner details</p>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-5 max-w-sm text-center">
          The QR code contains this vehicle's key details and the owner's contact information.
          Print it and attach it to the vehicle or its file for quick identification.
        </p>
      </div>

      {/* Offscreen card rendered to PNG on download */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={exportRef} className="w-[375px] bg-white px-8 py-8 flex flex-col items-center">
          <img src="/motor.jpeg" alt="MotorGas" className="h-12 object-contain mb-2" />
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.25em] mb-6">Vehicle Identity</p>
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
          <h3 className="text-lg font-bold text-gray-900 mt-6 text-center leading-tight">{title || 'Vehicle'}</h3>
          <span className="mt-3 inline-flex items-center font-mono text-sm font-bold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg px-3.5 py-1.5 tracking-wider">
            {vehicle.registration_number}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Lookup data ── */
export const MAKES = [
  'Toyota','Nissan','Mitsubishi','Isuzu','Ford','Land Rover','Mercedes-Benz',
  'BMW','Volkswagen','Mazda','Honda','Hyundai','Kia','Subaru','Suzuki',
  'Peugeot','Renault','Volvo','Hino','Tata','Scania','MAN','Ashok Leyland',
]

export const MODELS_BY_MAKE: Record<string, string[]> = {
  Toyota:          ['Hilux','Land Cruiser','Prado','Corolla','Camry','Vitz','Fielder','RAV4','Fortuner','Hiace','Probox','Rush','Harrier','Alphard'],
  Nissan:          ['Navara','Patrol','X-Trail','Juke','Note','Tiida','March','Hardbody','Caravan','NP300'],
  Mitsubishi:      ['L200','Pajero','Outlander','Eclipse Cross','Galant','Canter','Fuso'],
  Isuzu:           ['D-Max','MU-X','Forward','NPR','NMR','ELF'],
  Ford:            ['Ranger','Everest','Explorer','F-150','Transit'],
  'Land Rover':    ['Defender','Discovery','Range Rover','Freelander','Discovery Sport'],
  'Mercedes-Benz': ['C-Class','E-Class','GLC','GLE','ML','Sprinter','Actros','Axor'],
  BMW:             ['3 Series','5 Series','7 Series','X3','X5','X6'],
  Volkswagen:      ['Amarok','Tiguan','Polo','Golf','Touareg','Crafter'],
  Mazda:           ['CX-5','BT-50','Mazda 3','Mazda 6','CX-3'],
  Honda:           ['CR-V','HR-V','Fit','Accord','Civic','Pilot'],
  Hyundai:         ['Tucson','Santa Fe','Elantra','i10','H1','H100'],
  Kia:             ['Sportage','Sorento','Rio','Picanto','Telluride'],
  Subaru:          ['Forester','Outback','XV','Impreza','Legacy'],
  Suzuki:          ['Jimny','Grand Vitara','Swift','Vitara','Carry'],
  Hino:            ['300','500','700'],
  Tata:            ['Super Ace','Xenon','Prima'],
}

export const VEHICLE_TYPES = ['Sedan','SUV','Hatchback','Pickup','Van','Bus','Truck','Coupe','Wagon','Minivan','Convertible']

export const TRIMS = ['Base','Standard','Sport','Limited','Premium','Luxury','GX','VX','TX','GXL','SR','SR5','TRD','XL','XLS','XLT','EX','LX','EX-L']

export const TRANSMISSIONS = ['Automatic','Manual','CVT','Semi-Automatic','Dual-Clutch (DCT)']

/* ── Add inspection modal ── */
interface AddInspectionModalProps {
  vehicleId: number
  clientId: number
  onClose: () => void
  onSaved: () => Promise<void>
}

const AddInspectionModal: React.FC<AddInspectionModalProps> = ({ vehicleId, clientId, onClose, onSaved }) => {
  const [technicians, setTechnicians] = useState<Staff[]>([])
  const [loadingTechnicians, setLoadingTechnicians] = useState(true)
  const [saving, setSaving] = useState(false)

  const [technicianId, setTechnicianId] = useState('')
  const [inspectionDate, setInspectionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending')
  const [summary, setSummary] = useState('')

  useEffect(() => {
    adminApiService.getStaff('technician')
      .then(setTechnicians)
      .catch(() => setTechnicians([]))
      .finally(() => setLoadingTechnicians(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!technicianId) {
      alert('Please assign a technician')
      return
    }
    try {
      setSaving(true)
      await adminApiService.createVehicleInspection({
        conversion_vehicle_id: vehicleId,
        conversion_client_id: clientId,
        assigned_staff_id: Number(technicianId),
        inspection_date: inspectionDate,
        status,
        summary: summary || undefined,
      })
      await onSaved()
      onClose()
    } catch (err) {
      alert(`Failed to save inspection: ${(err as any).message ?? 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center">
              <ClipboardCheck className="h-4 w-4 text-green-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Assign Inspection</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Inspection Date *</label>
              <input type="date" className={inp} value={inspectionDate}
                onChange={e => setInspectionDate(e.target.value)} required />
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={status} onChange={e => setStatus(e.target.value as typeof status)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Assign Technician *</label>
            <div className="relative">
              <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                className={inp + ' pl-9'}
                value={technicianId}
                onChange={e => setTechnicianId(e.target.value)}
                disabled={loadingTechnicians}
                required
              >
                <option value="">{loadingTechnicians ? 'Loading technicians…' : 'Select a technician'}</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            {!loadingTechnicians && technicians.length === 0 && (
              <p className="text-[10px] text-amber-600 mt-1">No staff with role "technician" found.</p>
            )}
          </div>

          <div>
            <label className={lbl}>Summary</label>
            <textarea rows={3} className={inp + ' resize-none'} value={summary}
              onChange={e => setSummary(e.target.value)} placeholder="Findings, issues, recommendations…" />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Saving…' : 'Save Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Invoice modal ── */
interface InvoiceModalProps {
  jobCard: JobCard
  onClose: () => void
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ jobCard, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <style>{`
      @media print {
        body * { visibility: hidden; }
        .invoice-modal-printable, .invoice-modal-printable * { visibility: visible; }
        .invoice-modal-printable { position: fixed; top: 0; left: 0; width: 100%; height: auto; margin: 0; max-height: none !important; box-shadow: none !important; border: none !important; border-radius: 0 !important; }
        .no-print { display: none !important; }
      }
    `}</style>
    <div className="invoice-modal-printable bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <div className="no-print flex items-center justify-between px-5 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <h2 className="text-sm font-semibold text-gray-900">Invoice — Job #{jobCard.id}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <JobCardInvoiceDocument jobCard={jobCard} />
      </div>
    </div>
  </div>
)

export default VehicleDetails
