import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService, ConversionClient } from '../services/api'
import { cloudinaryService } from '../services/cloudinary'
import {
  ChevronLeft,
  ImageIcon,
  Loader2,
  Hash,
  CreditCard,
  Car,
  Gauge,
  Palette,
  StickyNote,
  Settings2,
  Plus,
  X,
  FileText,
  Upload,
  Eye,
  User,
} from 'lucide-react'
import { Vehicle, MAKES, MODELS_BY_MAKE, VEHICLE_TYPES, TRIMS, TRANSMISSIONS } from './VehicleDetails'

interface VehicleFormData {
  registration_number: string
  vin_serial_number: string
  vehicle_type: string
  year: string
  make: string
  model: string
  trim_option: string
  transmission_type: string
  driven_wheel: string
  engine: string
  current_odo: string
  odo_unit: 'KM' | 'Miles'
  color: string
  unit_number: string
  notes: string
}

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10 MB — Cloudinary preset limit

const EditVehicle: React.FC = () => {
  const navigate = useNavigate()
  const { clientId, vehicleId } = useParams<{ clientId: string; vehicleId: string }>()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<VehicleFormData | null>(null)
  const [clients, setClients] = useState<ConversionClient[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [vsaUrl, setVsaUrl] = useState('')
  const [logbookUrl, setLogbookUrl] = useState('')
  const [uploadingVsa, setUploadingVsa] = useState(false)
  const [uploadingLogbook, setUploadingLogbook] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const vsaInputRef = useRef<HTMLInputElement>(null)
  const logbookInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!vehicleId) return
    const fetch = async () => {
      setLoading(true)
      const data: Vehicle | null = await adminApiService.getConversionVehicle(Number(vehicleId))
      if (data) {
        setFormData({
          registration_number: data.registration_number,
          vin_serial_number:   data.vin_serial_number   ?? '',
          vehicle_type:        data.vehicle_type         ?? '',
          year:                data.year?.toString()     ?? '',
          make:                data.make                 ?? '',
          model:               data.model,
          trim_option:         data.trim_option          ?? '',
          transmission_type:   data.transmission_type    ?? '',
          driven_wheel:        data.driven_wheel         ?? '',
          engine:              data.engine               ?? '',
          current_odo:         data.current_odo?.toString() ?? '',
          odo_unit:            data.odo_unit,
          color:               data.color                ?? '',
          unit_number:         data.unit_number          ?? '',
          notes:               data.notes                ?? '',
        })
        setPhotoUrls(data.photo_urls?.length ? data.photo_urls : (data.photo_url ? [data.photo_url] : []))
        setVsaUrl(data.vsa_url ?? '')
        setLogbookUrl(data.logbook_url ?? '')
        setSelectedClientId(String(data.conversion_client_id))
      }
      setLoading(false)
    }
    fetch()
  }, [vehicleId])

  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true)
      try {
        const data = await adminApiService.getConversionClients()
        setClients(data)
      } catch {
        setClients([])
      } finally {
        setLoadingClients(false)
      }
    }
    fetchClients()
  }, [])

  const set = (k: keyof VehicleFormData, v: string) =>
    setFormData(p => (p ? { ...p, [k]: v } : p))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    set(name as keyof VehicleFormData, value)
  }

  const modelOptions = formData ? (MODELS_BY_MAKE[formData.make] ?? []) : []

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

  const handleDocumentSelect = async (kind: 'vsa' | 'logbook', file: File) => {
    const label = kind === 'vsa' ? 'VSA' : 'logbook'
    if (file.size > MAX_DOCUMENT_SIZE) {
      alert(`${label} file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 10 MB.`)
      return
    }
    const setUploading = kind === 'vsa' ? setUploadingVsa : setUploadingLogbook
    const setUrl = kind === 'vsa' ? setVsaUrl : setLogbookUrl
    setUploading(true)
    try {
      const result = await cloudinaryService.uploadDocument(file, { folder: `vehicle-${kind}` })
      setUrl(result.secure_url)
    } catch (error) {
      console.error(`${kind.toUpperCase()} upload failed:`, error)
      alert(`Failed to upload ${label}: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData || !vehicleId) return
    if (!selectedClientId) {
      alert('Please select an owner')
      return
    }
    try {
      setSaving(true)
      await adminApiService.updateConversionVehicle(Number(vehicleId), {
        conversion_client_id: Number(selectedClientId),
        registration_number: formData.registration_number,
        vin_serial_number:   formData.vin_serial_number   || undefined,
        vehicle_type:        formData.vehicle_type        || undefined,
        year:                formData.year ? Number(formData.year) : undefined,
        make:                formData.make                || undefined,
        model:               formData.model,
        trim_option:         formData.trim_option         || undefined,
        transmission_type:   formData.transmission_type   || undefined,
        driven_wheel:        formData.driven_wheel        || undefined,
        engine:              formData.engine              || undefined,
        current_odo:         formData.current_odo ? Number(formData.current_odo) : undefined,
        odo_unit:            formData.odo_unit,
        color:               formData.color               || undefined,
        unit_number:         formData.unit_number         || undefined,
        notes:               formData.notes               || undefined,
        photo_url:           photoUrls[0] || undefined,
        photo_urls:          photoUrls,
        vsa_url:             vsaUrl,
        logbook_url:         logbookUrl,
      })
      navigate(`/clients/${selectedClientId}/vehicles/${vehicleId}`)
    } catch (error) {
      alert(`Failed to save: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const lbl = 'block text-xs font-medium text-gray-600 mb-1'
  const inp = 'w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400'
  const inpPlain = 'w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400'
  const iconWrap = 'relative'
  const fieldIcon = 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none'
  const section = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5'
  const sectionTitle = 'flex items-center gap-2 text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2.5'

  if (loading || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="text-white px-5 py-2" style={{ backgroundColor: '#0b0f24' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/clients/${clientId}/vehicles/${vehicleId}`)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold">Edit Vehicle</h1>
            <p className="text-xs text-white/50">{formData.registration_number}</p>
          </div>
        </div>
      </div>

      <div className="w-full px-5 py-3">
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* ── Owner ── */}
          <div className={section}>
            <div className={sectionTitle}>
              <User className="h-3.5 w-3.5 text-green-600" />
              Owner
            </div>
            <div>
              <label className={lbl}>Client *</label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                required
                disabled={loadingClients}
                className={inpPlain}
              >
                <option value="">{loadingClients ? 'Loading clients…' : 'Select a client'}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Photos ── */}
          <div className={section}>
            <p className="text-xs font-semibold text-gray-900 mb-2.5">
              Vehicle Photos {photoUrls.length > 0 && `(${photoUrls.length})`}
            </p>
            <div className="flex flex-wrap gap-2">
              {photoUrls.map(url => (
                <div key={url} className="relative w-20 h-16 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={url} alt="Vehicle" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(url)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-20 h-16 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-green-600 hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50"
                title="Add photos"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : photoUrls.length === 0 ? (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-[9px]">Add photos</span>
                  </>
                ) : (
                  <Plus className="h-4 w-4" />
                )}
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

          {/* ── Documents ── */}
          <div className={section}>
            <div className={sectionTitle}>
              <FileText className="h-3.5 w-3.5 text-green-600" />
              Documents
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DocumentUploadSlot
                label="VSA"
                url={vsaUrl}
                uploading={uploadingVsa}
                onSelect={() => vsaInputRef.current?.click()}
                onRemove={() => setVsaUrl('')}
              />
              <DocumentUploadSlot
                label="Logbook"
                url={logbookUrl}
                uploading={uploadingLogbook}
                onSelect={() => logbookInputRef.current?.click()}
                onRemove={() => setLogbookUrl('')}
              />
              <input
                ref={vsaInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleDocumentSelect('vsa', file)
                  e.target.value = ''
                }}
              />
              <input
                ref={logbookInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleDocumentSelect('logbook', file)
                  e.target.value = ''
                }}
              />
            </div>
          </div>

          {/* ── Identification ── */}
          <div className={section}>
            <div className={sectionTitle}>
              <Hash className="h-3.5 w-3.5 text-green-600" />
              Identification
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>VIN / Serial Number</label>
                <div className={iconWrap}>
                  <Hash className={fieldIcon} />
                  <input
                    type="text"
                    name="vin_serial_number"
                    value={formData.vin_serial_number}
                    onChange={handleChange}
                    className={inp + ' uppercase'}
                    placeholder="Enter VIN or SN"
                  />
                </div>
              </div>
              <div>
                <label className={lbl}>License Plate *</label>
                <div className={iconWrap}>
                  <CreditCard className={fieldIcon} />
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    required
                    className={inp + ' uppercase'}
                    placeholder="State & plate number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Vehicle Details ── */}
          <div className={section}>
            <div className={sectionTitle}>
              <Car className="h-3.5 w-3.5 text-green-600" />
              Vehicle Details
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Year</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className={inpPlain}
                    placeholder="e.g. 2020"
                  />
                </div>
                <div>
                  <label className={lbl}>Make</label>
                  <input
                    list="makes-list"
                    name="make"
                    value={formData.make}
                    onChange={e => { set('make', e.target.value); set('model', '') }}
                    className={inpPlain}
                    placeholder="Search make…"
                  />
                  <datalist id="makes-list">
                    {MAKES.map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>
                <div>
                  <label className={lbl}>Model *</label>
                  <input
                    list="models-list"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    className={inpPlain}
                    placeholder="Search model…"
                  />
                  <datalist id="models-list">
                    {modelOptions.map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Trim</label>
                  <input
                    list="trims-list"
                    name="trim_option"
                    value={formData.trim_option}
                    onChange={handleChange}
                    className={inpPlain}
                    placeholder="Search trim…"
                  />
                  <datalist id="trims-list">
                    {TRIMS.map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>
                <div>
                  <label className={lbl}>Vehicle Type</label>
                  <input
                    list="types-list"
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleChange}
                    className={inpPlain}
                    placeholder="Search type…"
                  />
                  <datalist id="types-list">
                    {VEHICLE_TYPES.map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Engine</label>
                  <div className={iconWrap}>
                    <Settings2 className={fieldIcon} />
                    <input
                      type="text"
                      name="engine"
                      value={formData.engine}
                      onChange={handleChange}
                      className={inp}
                      placeholder="e.g. 5.6L V6"
                    />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Transmission</label>
                  <select
                    name="transmission_type"
                    value={formData.transmission_type}
                    onChange={handleChange}
                    className={inpPlain}
                  >
                    <option value="">— Select —</option>
                    {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Driven Wheels</label>
                  <select
                    name="driven_wheel"
                    value={formData.driven_wheel}
                    onChange={handleChange}
                    className={inpPlain}
                  >
                    <option value="">— Select —</option>
                    <option value="FWD">FWD</option>
                    <option value="RWD">RWD</option>
                    <option value="AWD">AWD</option>
                    <option value="4WD">4WD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Odometer, Color & Unit ── */}
          <div className={section}>
            <div className={sectionTitle}>
              <Gauge className="h-3.5 w-3.5 text-green-600" />
              Odometer &amp; Appearance
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={lbl}>Current ODO Reading</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="current_odo"
                    value={formData.current_odo}
                    onChange={handleChange}
                    className={inpPlain}
                    placeholder="e.g. 8000"
                  />
                  <select
                    name="odo_unit"
                    value={formData.odo_unit}
                    onChange={handleChange}
                    className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    <option value="KM">KM</option>
                    <option value="Miles">Miles</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Color</label>
                <div className={iconWrap}>
                  <Palette className={fieldIcon} />
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className={inp}
                    placeholder="e.g. Red"
                  />
                </div>
              </div>
              <div>
                <label className={lbl}>Unit Number</label>
                <input
                  type="text"
                  name="unit_number"
                  value={formData.unit_number}
                  onChange={handleChange}
                  className={inpPlain}
                  placeholder="Internal unit number"
                />
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className={section}>
            <div className="flex items-center justify-between mb-2.5">
              <div className={sectionTitle + ' mb-0'}>
                <StickyNote className="h-3.5 w-3.5 text-green-600" />
                Notes
              </div>
              <span className="text-[10px] text-gray-400">Internal only — won't show up on invoices</span>
            </div>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className={inpPlain + ' resize-none'}
              placeholder="Enter any internal notes…"
            />
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2 pb-2">
            <button
              type="button"
              onClick={() => navigate(`/clients/${clientId}/vehicles/${vehicleId}`)}
              className="px-4 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Document upload slot used for VSA / Logbook ── */
interface DocumentUploadSlotProps {
  label: string
  url: string
  uploading: boolean
  onSelect: () => void
  onRemove: () => void
}

const DocumentUploadSlot: React.FC<DocumentUploadSlotProps> = ({ label, url, uploading, onSelect, onRemove }) => {
  if (url) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs font-medium text-gray-700 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-white transition-colors"
            title={`View ${label}`}
          >
            <Eye className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
            title={`Remove ${label}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={uploading}
      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:text-green-600 hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50"
    >
      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      <span className="text-xs font-medium">{uploading ? 'Uploading…' : `Upload ${label}`}</span>
    </button>
  )
}

export default EditVehicle
