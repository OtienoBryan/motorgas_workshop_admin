import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService } from '../services/api'
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
  X
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
  created_at: string
  updated_at: string
}

type Tab = 'overview' | 'notes' | 'service' | 'documents'

const VehicleDetails: React.FC = () => {
  const navigate = useNavigate()
  const { clientId, vehicleId } = useParams<{ clientId: string; vehicleId: string }>()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [deleting, setDeleting] = useState(false)
  const [imgOpen, setImgOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

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

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',   label: 'Overview',   icon: <Info className="h-3.5 w-3.5" /> },
    { id: 'notes',      label: 'Notes',      icon: <StickyNote className="h-3.5 w-3.5" /> },
    { id: 'service',    label: 'Service',    icon: <Wrench className="h-3.5 w-3.5" /> },
    { id: 'documents',  label: 'Documents',  icon: <FileText className="h-3.5 w-3.5" /> },
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
              {vehicle.photo_url
                ? <img src={vehicle.photo_url} alt={title} className="w-full h-full object-cover" />
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
            {/* Photo card (if exists) */}
            {vehicle.photo_url && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
                <img
                  src={vehicle.photo_url}
                  alt={title}
                  onClick={() => setImgOpen(true)}
                  className="h-32 w-48 object-cover rounded-xl cursor-zoom-in"
                />
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

        {/* Service — placeholder */}
        {activeTab === 'service' && (
          <EmptyTab icon={<Wrench className="h-5 w-5 text-gray-300" />}
            title="No service records" subtitle="Service history will appear here" />
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

      {/* ── Image lightbox ── */}
      {imgOpen && vehicle.photo_url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImgOpen(false)}
        >
          <img
            src={vehicle.photo_url}
            alt={title}
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setImgOpen(false)}
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

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const modelOptions = MODELS_BY_MAKE[form.make] ?? []

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

export default VehicleDetails
