import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService, VehicleInspection, Staff, JobCard } from '../services/api'
import JobCardInvoiceDocument from '../components/JobCardInvoiceDocument'
import { cloudinaryService } from '../services/cloudinary'
import {
  ChevronLeft,
  Loader2,
  Edit,
  Trash2,
  Car,
  Gauge,
  Wrench,
  FileText,
  StickyNote,
  Hash,
  Palette,
  Calendar,
  Activity,
  ArrowUpDown,
  CircleDot,
  Info,
  X,
  ChevronRight,
  Image as Images,
  ImageIcon,
  Plus,
  ClipboardCheck,
  UserCog,
  Receipt,
  Printer,
} from 'lucide-react'

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
  photo_urls?: string[]
  created_at: string
  updated_at: string
}

type Tab = 'overview' | 'notes' | 'service' | 'documents' | 'inspections'

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

const JOB_STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-500',
}

const JOB_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
}

function jobCardTotal(jc: JobCard) {
  const items = jc.items || []
  const subtotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0)
  const taxable = items.filter(i => i.taxable !== 0).reduce((sum, i) => sum + Number(i.amount || 0), 0)
  const vat = jc.vat_enabled ? taxable * (Number(jc.vat_rate) / 100) : 0
  return subtotal + vat - Number(jc.discount || 0) + Number(jc.other_charges || 0)
}

const VehicleDetails: React.FC = () => {
  const navigate = useNavigate()
  const { clientId, vehicleId } = useParams<{ clientId: string; vehicleId: string }>()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [deleting, setDeleting] = useState(false)
  const [imgIndex, setImgIndex] = useState<number | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [inspections, setInspections] = useState<VehicleInspection[]>([])
  const [loadingInspections, setLoadingInspections] = useState(false)
  const [isInspectionOpen, setIsInspectionOpen] = useState(false)
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [loadingJobCards, setLoadingJobCards] = useState(false)
  const [invoiceJobCard, setInvoiceJobCard] = useState<JobCard | null>(null)

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
        setJobCards(Array.isArray(data) ? data : [])
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

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',    label: 'Overview',    icon: <Info className="h-3.5 w-3.5" /> },
    { id: 'inspections', label: 'Inspections', icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
    { id: 'notes',       label: 'Notes',       icon: <StickyNote className="h-3.5 w-3.5" /> },
    { id: 'service',     label: 'Service',     icon: <Wrench className="h-3.5 w-3.5" /> },
    { id: 'documents',   label: 'Documents',   icon: <FileText className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero banner ── */}
      <div className="relative bg-gradient-to-br from-green-700 to-green-800 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative px-5 pt-3 pb-3">
          {/* Top row */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate(`/clients/${clientId}`)}
              className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" />
              Client
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsInspectionOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white/15 hover:bg-white/25 rounded-lg transition-colors"
              >
                <ClipboardCheck className="h-3 w-3" />
                Assign Inspection
              </button>
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white/15 hover:bg-white/25 rounded-lg transition-colors"
              >
                <Edit className="h-3 w-3" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Trash2 className="h-3 w-3" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>

          {/* Photo + identity row */}
          <div className="flex items-center gap-3">
            {/* Thumbnail or icon */}
            <div className="w-10 h-10 rounded-xl bg-green-500/40 shrink-0 overflow-hidden flex items-center justify-center shadow">
              {photos[0]
                ? <img src={photos[0]} alt={title} className="w-full h-full object-cover" />
                : <Car className="h-5 w-5 text-white/80" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold leading-tight truncate">{title || 'Vehicle'}</h1>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {/* Plate badge */}
                <span className="font-mono px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20">
                  {vehicle.registration_number}
                </span>
                {vehicle.vehicle_type && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">
                    <Car className="h-2.5 w-2.5" />
                    {vehicle.vehicle_type}
                  </span>
                )}
                {vehicle.current_odo && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">
                    <Gauge className="h-2.5 w-2.5" />
                    {vehicle.current_odo.toLocaleString()} {vehicle.odo_unit}
                  </span>
                )}
                {vehicle.color && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">
                    <CircleDot className="h-2.5 w-2.5" />
                    {vehicle.color}
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
          {TABS.map(tab => (
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
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-5 py-5">

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Photo gallery (if exists) */}
            {photos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
                <div className="flex items-center gap-1.5 mb-2.5 text-gray-400">
                  <Images className="h-3.5 w-3.5" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider">
                    Photos {photos.length > 1 && `(${photos.length})`}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {photos.map((url, i) => (
                    <img
                      key={url}
                      src={url}
                      alt={`${title} photo ${i + 1}`}
                      onClick={() => setImgIndex(i)}
                      className="h-24 w-32 object-cover rounded-xl cursor-zoom-in hover:opacity-90 transition-opacity"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Identity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Identity</h2>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-50">
                <SpecCell icon={<Hash className="h-3.5 w-3.5" />}      label="Registration" value={vehicle.registration_number} mono />
                <SpecCell icon={<Hash className="h-3.5 w-3.5" />}      label="VIN / Serial"  value={vehicle.vin_serial_number} mono />
                <SpecCell icon={<Activity className="h-3.5 w-3.5" />}  label="Unit Number"  value={vehicle.unit_number} />
                <SpecCell icon={<Car className="h-3.5 w-3.5" />}       label="Type"          value={vehicle.vehicle_type} />
              </div>
            </div>

            {/* Specs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Specifications</h2>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-50">
                <SpecCell icon={<Calendar className="h-3.5 w-3.5" />}   label="Year"          value={vehicle.year?.toString()} />
                <SpecCell icon={<Car className="h-3.5 w-3.5" />}        label="Make"          value={vehicle.make} />
                <SpecCell icon={<Car className="h-3.5 w-3.5" />}        label="Model"         value={vehicle.model} />
                <SpecCell icon={<Info className="h-3.5 w-3.5" />}       label="Trim"          value={vehicle.trim_option} />
                <SpecCell icon={<Wrench className="h-3.5 w-3.5" />}     label="Engine"        value={vehicle.engine} />
                <SpecCell icon={<ArrowUpDown className="h-3.5 w-3.5" />} label="Transmission" value={vehicle.transmission_type} />
                <SpecCell icon={<CircleDot className="h-3.5 w-3.5" />}  label="Drive"         value={vehicle.driven_wheel} />
                <SpecCell icon={<Palette className="h-3.5 w-3.5" />}    label="Color"         value={vehicle.color}
                  colorDot={vehicle.color} />
              </div>
            </div>

            {/* Odometer */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Odometer</h2>
              </div>
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <Gauge className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {vehicle.current_odo ? vehicle.current_odo.toLocaleString() : '—'}
                  </p>
                  <p className="text-xs text-gray-400">{vehicle.odo_unit}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inspections */}
        {activeTab === 'inspections' && (
          loadingInspections ? (
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
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:border-green-300 transition-colors">
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
          )
        )}

        {/* Notes */}
        {activeTab === 'notes' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Internal Notes</h2>
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                Not visible to client
              </span>
            </div>
            <div className="px-4 py-4">
              {vehicle.notes
                ? <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{vehicle.notes}</p>
                : <p className="text-xs text-gray-400 italic">No notes added for this vehicle.</p>
              }
            </div>
          </div>
        )}

        {/* Service — job cards for this vehicle */}
        {activeTab === 'service' && (
          loadingJobCards ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
          ) : jobCards.length === 0 ? (
            <EmptyTab icon={<Wrench className="h-5 w-5 text-gray-300" />}
              title="No service records" subtitle="Job cards for this vehicle will appear here" />
          ) : (
            <div className="space-y-3">
              {jobCards.map(jc => {
                const total = jobCardTotal(jc)
                return (
                  <div key={jc.id}
                    onClick={() => navigate(`/job-cards/${jc.id}`)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:border-green-300 transition-colors">
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
                        <p className="text-sm font-bold text-gray-900">
                          KES {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <button
                          onClick={e => { e.stopPropagation(); setInvoiceJobCard(jc) }}
                          className="flex items-center gap-1 text-[11px] text-green-700 hover:text-green-800 font-medium mt-1"
                        >
                          <Receipt className="h-3 w-3" /> View Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Documents — placeholder */}
        {activeTab === 'documents' && (
          <EmptyTab icon={<FileText className="h-5 w-5 text-gray-300" />}
            title="No documents" subtitle="Uploaded documents will appear here" />
        )}
      </div>
      {/* ── Edit modal ── */}
      {isEditOpen && (
        <EditVehicleModal
          vehicle={vehicle}
          onClose={() => setIsEditOpen(false)}
          onSaved={async () => {
            const data = await adminApiService.getConversionVehicle(Number(vehicleId))
            setVehicle(data)
          }}
        />
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

/* ── Spec cell ── */
interface SpecCellProps {
  icon: React.ReactNode
  label: string
  value?: string | null
  mono?: boolean
  colorDot?: string
}

const SpecCell: React.FC<SpecCellProps> = ({ icon, label, value, mono, colorDot }) => (
  <div className="flex items-start gap-3 px-4 py-3">
    <span className="text-gray-300 mt-0.5 shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {colorDot && (
          <span className="w-3 h-3 rounded-full border border-gray-200 shrink-0"
            style={{ backgroundColor: colorDot.toLowerCase() }} />
        )}
        <p className={`text-xs leading-snug break-words ${!value ? 'text-gray-300' : 'text-gray-800'} ${mono ? 'font-mono' : ''}`}>
          {value || '—'}
        </p>
      </div>
    </div>
  </div>
)

/* ── Empty tab placeholder ── */
const EmptyTab: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-14 text-center">
    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
      {icon}
    </div>
    <p className="text-xs font-medium text-gray-500">{title}</p>
    <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
  </div>
)

/* ── Lookup data ── */
const MAKES = [
  'Toyota','Nissan','Mitsubishi','Isuzu','Ford','Land Rover','Mercedes-Benz',
  'BMW','Volkswagen','Mazda','Honda','Hyundai','Kia','Subaru','Suzuki',
  'Peugeot','Renault','Volvo','Hino','Tata','Scania','MAN','Ashok Leyland',
]

const MODELS_BY_MAKE: Record<string, string[]> = {
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

const VEHICLE_TYPES = ['Sedan','SUV','Hatchback','Pickup','Van','Bus','Truck','Coupe','Wagon','Minivan','Convertible']

const TRIMS = ['Base','Standard','Sport','Limited','Premium','Luxury','GX','VX','TX','GXL','SR','SR5','TRD','XL','XLS','XLT','EX','LX','EX-L']

const TRANSMISSIONS = ['Automatic','Manual','CVT','Semi-Automatic','Dual-Clutch (DCT)']

/* ── Edit vehicle modal ── */
interface EditVehicleModalProps {
  vehicle: Vehicle
  onClose: () => void
  onSaved: () => Promise<void>
}

const EditVehicleModal: React.FC<EditVehicleModalProps> = ({ vehicle, onClose, onSaved }) => {
  const [form, setForm] = useState({
    registration_number: vehicle.registration_number,
    vin_serial_number:   vehicle.vin_serial_number   ?? '',
    vehicle_type:        vehicle.vehicle_type         ?? '',
    year:                vehicle.year?.toString()     ?? '',
    make:                vehicle.make                 ?? '',
    model:               vehicle.model,
    trim_option:         vehicle.trim_option          ?? '',
    transmission_type:   vehicle.transmission_type    ?? '',
    driven_wheel:        vehicle.driven_wheel         ?? '',
    engine:              vehicle.engine               ?? '',
    current_odo:         vehicle.current_odo?.toString() ?? '',
    odo_unit:            vehicle.odo_unit,
    color:               vehicle.color                ?? '',
    unit_number:         vehicle.unit_number          ?? '',
    notes:               vehicle.notes                ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    vehicle.photo_urls?.length ? vehicle.photo_urls : (vehicle.photo_url ? [vehicle.photo_url] : [])
  )
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const modelOptions = MODELS_BY_MAKE[form.make] ?? []

  const handlePhotosSelect = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      alert('Please select image files')
      return
    }
    setUploadingPhoto(true)
    try {
      const results = await cloudinaryService.uploadMultipleImages(imageFiles, { folder: 'vehicle-photos' })
      setPhotoUrls(prev => [...prev, ...results.map(r => r.secure_url)])
    } catch (error) {
      console.error('Photo upload failed:', error)
      alert('Failed to upload one or more photos.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = (url: string) => {
    setPhotoUrls(prev => prev.filter(u => u !== url))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await adminApiService.updateConversionVehicle(vehicle.id, {
        registration_number: form.registration_number,
        vin_serial_number:   form.vin_serial_number   || undefined,
        vehicle_type:        form.vehicle_type        || undefined,
        year:                form.year ? Number(form.year) : undefined,
        make:                form.make                || undefined,
        model:               form.model,
        trim_option:         form.trim_option         || undefined,
        transmission_type:   form.transmission_type   || undefined,
        driven_wheel:        form.driven_wheel        || undefined,
        engine:              form.engine              || undefined,
        current_odo:         form.current_odo ? Number(form.current_odo) : undefined,
        odo_unit:            form.odo_unit,
        color:               form.color               || undefined,
        unit_number:         form.unit_number         || undefined,
        notes:               form.notes               || undefined,
        photo_urls:          photoUrls,
      })
      await onSaved()
      onClose()
    } catch (err) {
      alert(`Failed to save: ${(err as any).message ?? 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Edit Vehicle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {/* Photos */}
          <div>
            <label className={lbl}>Photos {photoUrls.length > 0 && `(${photoUrls.length})`}</label>
            <div className="flex flex-wrap gap-2">
              {photoUrls.map(url => (
                <div key={url} className="relative w-16 h-14 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={url} alt="Vehicle" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(url)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-16 h-14 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 hover:text-green-600 hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50"
                title="Add photos"
              >
                {uploadingPhoto
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : photoUrls.length === 0 ? <ImageIcon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files
                  if (files && files.length) handlePhotosSelect(files)
                  e.target.value = ''
                }}
              />
            </div>
          </div>

          {/* Registration + VIN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Registration *</label>
              <input className={inp} value={form.registration_number} onChange={e => set('registration_number', e.target.value)} required />
            </div>
            <div>
              <label className={lbl}>VIN / Serial</label>
              <input className={inp} value={form.vin_serial_number} onChange={e => set('vin_serial_number', e.target.value)} />
            </div>
          </div>

          {/* Year + Make + Model */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Year</label>
              <input type="number" className={inp} value={form.year} onChange={e => set('year', e.target.value)} placeholder="e.g. 2020" />
            </div>
            <div>
              <label className={lbl}>Make</label>
              <input
                list="makes-list" className={inp} value={form.make}
                onChange={e => { set('make', e.target.value); set('model', '') }}
                placeholder="Search make…"
              />
              <datalist id="makes-list">
                {MAKES.map(m => <option key={m} value={m} />)}
              </datalist>
            </div>
            <div>
              <label className={lbl}>Model *</label>
              <input
                list="models-list" className={inp} value={form.model}
                onChange={e => set('model', e.target.value)} required placeholder="Search model…"
              />
              <datalist id="models-list">
                {modelOptions.map(m => <option key={m} value={m} />)}
              </datalist>
            </div>
          </div>

          {/* Trim + Vehicle Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Trim</label>
              <input
                list="trims-list" className={inp} value={form.trim_option}
                onChange={e => set('trim_option', e.target.value)} placeholder="Search trim…"
              />
              <datalist id="trims-list">
                {TRIMS.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div>
              <label className={lbl}>Vehicle Type</label>
              <input
                list="types-list" className={inp} value={form.vehicle_type}
                onChange={e => set('vehicle_type', e.target.value)} placeholder="Search type…"
              />
              <datalist id="types-list">
                {VEHICLE_TYPES.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
          </div>

          {/* Engine + Transmission + Drive */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Engine</label>
              <input className={inp} value={form.engine} onChange={e => set('engine', e.target.value)} placeholder="e.g. 2.8L TD" />
            </div>
            <div>
              <label className={lbl}>Transmission</label>
              <select className={inp} value={form.transmission_type} onChange={e => set('transmission_type', e.target.value)}>
                <option value="">— Select —</option>
                {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Drive</label>
              <select className={inp} value={form.driven_wheel} onChange={e => set('driven_wheel', e.target.value)}>
                <option value="">— Select —</option>
                <option value="2WD">2WD</option>
                <option value="4WD">4WD</option>
                <option value="AWD">AWD</option>
                <option value="FWD">FWD</option>
                <option value="RWD">RWD</option>
              </select>
            </div>
          </div>

          {/* Color + Odometer + Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Color</label>
              <input className={inp} value={form.color} onChange={e => set('color', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Odometer</label>
              <input type="number" className={inp} value={form.current_odo} onChange={e => set('current_odo', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Unit</label>
              <select className={inp} value={form.odo_unit} onChange={e => set('odo_unit', e.target.value)}>
                <option value="KM">KM</option>
                <option value="Miles">Miles</option>
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Unit Number</label>
            <input className={inp} value={form.unit_number} onChange={e => set('unit_number', e.target.value)} />
          </div>

          <div>
            <label className={lbl}>Notes</label>
            <textarea rows={3} className={inp + ' resize-none'} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
