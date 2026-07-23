import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService, ConversionClient } from '../services/api'
import { cloudinaryService } from '../services/cloudinary'
import {
  ChevronLeft,
  ChevronDown,
  ImageIcon,
  Loader2,
  Sparkles,
  CheckCircle2,
  Hash,
  CreditCard,
  Car,
  Gauge,
  Palette,
  StickyNote,
  Settings2,
  Plus,
  X,
  User,
  FileText,
  Upload,
  Eye,
} from 'lucide-react'

interface VehicleFormData {
  vin_serial_number: string
  registration_number: string
  vehicle_type: string
  year: string
  make: string
  model: string
  trim_option: string
  transmission_type: string
  driven_wheel: string
  engine: string
  engine_capacity: string
  engine_code: string
  current_odo: string
  odo_unit: 'KM' | 'Miles'
  color: string
  tank_capacity: string
  telemetry_status: string
  notes: string
  photo_urls: string[]
  vsa_url: string
  logbook_url: string
}

const TANK_CAPACITIES = ['37L Internal', '42L Internal', '42L External', '92L']
const TELEMETRY_STATUSES = ['Manual Tracking', 'OBD2 + TM', 'TM']

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10 MB — Cloudinary preset limit

const emptyVehicleForm: VehicleFormData = {
  vin_serial_number: '',
  registration_number: '',
  vehicle_type: '',
  year: '',
  make: '',
  model: '',
  trim_option: '',
  transmission_type: '',
  driven_wheel: '',
  engine: '',
  engine_capacity: '',
  engine_code: '',
  current_odo: '',
  odo_unit: 'KM',
  color: '',
  tank_capacity: '',
  telemetry_status: '',
  notes: '',
  photo_urls: [],
  vsa_url: '',
  logbook_url: ''
}

const AddVehicle: React.FC = () => {
  const navigate = useNavigate()
  const { clientId } = useParams<{ clientId?: string }>()
  const [clientName, setClientName] = useState('')
  const [loadingClient, setLoadingClient] = useState(true)
  const [clients, setClients] = useState<ConversionClient[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [formData, setFormData] = useState<VehicleFormData>(emptyVehicleForm)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingVsa, setUploadingVsa] = useState(false)
  const [uploadingLogbook, setUploadingLogbook] = useState(false)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [notesExpanded, setNotesExpanded] = useState(true)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const vsaInputRef = useRef<HTMLInputElement>(null)
  const logbookInputRef = useRef<HTMLInputElement>(null)

  const effectiveClientId = clientId || selectedClientId

  useEffect(() => {
    if (clientId) {
      const fetchClient = async () => {
        setLoadingClient(true)
        const client = await adminApiService.getConversionClient(Number(clientId))
        setClientName(client?.name || '')
        setLoadingClient(false)
      }
      fetchClient()
    } else {
      const fetchClients = async () => {
        setLoadingClient(true)
        try {
          const data = await adminApiService.getConversionClients()
          setClients(data)
        } catch {
          setClients([])
        } finally {
          setLoadingClient(false)
        }
      }
      fetchClients()
    }
  }, [clientId])

  const notesIsFirstRender = useRef(true)
  useEffect(() => {
    if (notesIsFirstRender.current) {
      notesIsFirstRender.current = false
      return
    }
    if (notesExpanded) notesRef.current?.focus()
  }, [notesExpanded])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (successMessage) setSuccessMessage('')
  }

  const handlePhotosSelect = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      alert('Please select image files')
      return
    }
    setUploadingPhoto(true)
    try {
      const results = await cloudinaryService.uploadMultipleImages(imageFiles, { folder: 'vehicle-photos' })
      setFormData(prev => ({ ...prev, photo_urls: [...prev.photo_urls, ...results.map(r => r.secure_url)] }))
    } catch (error) {
      console.error('Photo upload failed:', error)
      alert('Failed to upload one or more photos. You can still save the vehicle without them.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = (url: string) => {
    setFormData(prev => ({ ...prev, photo_urls: prev.photo_urls.filter(u => u !== url) }))
  }

  const handleDocumentSelect = async (kind: 'vsa' | 'logbook', file: File) => {
    const label = kind === 'vsa' ? 'VSA' : 'logbook'
    if (file.size > MAX_DOCUMENT_SIZE) {
      alert(`${label} file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 10 MB.`)
      return
    }
    const setUploading = kind === 'vsa' ? setUploadingVsa : setUploadingLogbook
    const field = kind === 'vsa' ? 'vsa_url' : 'logbook_url'
    setUploading(true)
    try {
      const result = await cloudinaryService.uploadDocument(file, { folder: `vehicle-${kind}` })
      setFormData(prev => ({ ...prev, [field]: result.secure_url }))
    } catch (error) {
      console.error(`${kind.toUpperCase()} upload failed:`, error)
      alert(`Failed to upload ${label}: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveDocument = (kind: 'vsa' | 'logbook') => {
    setFormData(prev => ({ ...prev, [kind === 'vsa' ? 'vsa_url' : 'logbook_url']: '' }))
  }

  const handleAnalyzeImage = async () => {
    const coverPhoto = formData.photo_urls[0]
    if (!coverPhoto) {
      alert('Please upload a photo first')
      return
    }

    setAnalyzingImage(true)
    try {
      console.log('🚗 [AddVehicle] Starting image analysis for:', coverPhoto)
      const analysis = await adminApiService.analyzeVehicleImage(coverPhoto)

      console.log('🚗 [AddVehicle] Analysis result:', analysis)

      if (analysis && analysis.confidence !== 'low') {
        setFormData(prev => ({
          ...prev,
          vin_serial_number: analysis.vin_serial_number || prev.vin_serial_number,
          registration_number: analysis.registration_number || prev.registration_number,
          vehicle_type: analysis.vehicle_type || prev.vehicle_type,
          year: analysis.year ? String(analysis.year) : prev.year,
          make: analysis.make || prev.make,
          model: analysis.model || prev.model,
          trim_option: analysis.trim_option || prev.trim_option,
          transmission_type: analysis.transmission_type || prev.transmission_type,
          driven_wheel: analysis.driven_wheel || prev.driven_wheel,
          engine: analysis.engine || prev.engine,
          color: analysis.color || prev.color
        }))
        console.log('🚗 [AddVehicle] Vehicle details auto-filled from image analysis:', analysis)
        alert(`Vehicle details identified! Confidence: ${analysis.confidence}\n\nFound: ${analysis.extractedDetails.join(', ')}`)
      } else {
        console.warn('🚗 [AddVehicle] Low confidence or no data:', analysis)
        alert('Could not identify vehicle details from image (low confidence). Please enter details manually.')
      }
    } catch (error) {
      console.error('❌ [AddVehicle] Vehicle image analysis failed:', error)
      alert(`Failed to analyze image: ${(error as any).message || 'Unknown error'}\n\nPlease enter details manually.`)
    } finally {
      setAnalyzingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!effectiveClientId) {
      alert('Please select a client')
      return
    }

    try {
      setSaving(true)
      setSuccessMessage('')
      await adminApiService.createConversionVehicle({
        conversion_client_id: Number(effectiveClientId),
        registration_number: formData.registration_number,
        vin_serial_number: formData.vin_serial_number || undefined,
        vehicle_type: formData.vehicle_type || undefined,
        year: formData.year ? Number(formData.year) : undefined,
        make: formData.make || undefined,
        model: formData.model,
        trim_option: formData.trim_option || undefined,
        transmission_type: formData.transmission_type || undefined,
        driven_wheel: formData.driven_wheel || undefined,
        engine: formData.engine || undefined,
        engine_capacity: formData.engine_capacity || undefined,
        engine_code: formData.engine_code || undefined,
        current_odo: formData.current_odo ? Number(formData.current_odo) : undefined,
        odo_unit: formData.odo_unit,
        color: formData.color || undefined,
        tank_capacity: formData.tank_capacity || undefined,
        telemetry_status: formData.telemetry_status || undefined,
        notes: formData.notes || undefined,
        photo_url: formData.photo_urls[0] || undefined,
        photo_urls: formData.photo_urls.length ? formData.photo_urls : undefined,
        vsa_url: formData.vsa_url || undefined,
        logbook_url: formData.logbook_url || undefined
      })
      setFormData(emptyVehicleForm)
      setSuccessMessage('Vehicle added successfully. You can add another one below.')
    } catch (error) {
      console.error('Error saving vehicle:', error)
      alert(`Failed to save vehicle: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear + 1 - i)

  const lbl = 'block text-xs font-medium text-gray-600 mb-1'
  const inp = 'w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400'
  const inpPlain = 'w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400'
  const iconWrap = 'relative'
  const fieldIcon = 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none'
  const section = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5'
  const sectionTitle = 'flex items-center gap-2 text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2.5'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="text-white px-5 py-2" style={{ backgroundColor: '#0b0f24' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(clientId ? `/clients/${clientId}` : '/vehicles')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold">Add Vehicle</h1>
            <p className="text-xs text-white/50">
              {clientId
                ? (loadingClient ? 'Loading client…' : clientName ? `For ${clientName}` : '')
                : 'Add a vehicle to any client'}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full px-5 py-3">
        {successMessage && (
          <div className="mb-3 flex items-center gap-2 px-4 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* ── Client ── */}
          {!clientId && (
            <div className={section}>
              <div className={sectionTitle}>
                <User className="h-3.5 w-3.5 text-green-600" />
                Client
              </div>
              <div>
                <label className={lbl}>Select Client *</label>
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  required
                  disabled={loadingClient}
                  className={inpPlain}
                >
                  <option value="">{loadingClient ? 'Loading clients…' : 'Select a client'}</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Photos + AI identify ── */}
          <div className={section}>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-semibold text-gray-900">
                Vehicle Photos {formData.photo_urls.length > 0 && `(${formData.photo_urls.length})`}
              </p>
              <button
                type="button"
                onClick={handleAnalyzeImage}
                disabled={analyzingImage || !formData.photo_urls[0]}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {analyzingImage ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Identify Vehicle from Photo
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.photo_urls.map(url => (
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
                ) : formData.photo_urls.length === 0 ? (
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
                url={formData.vsa_url}
                uploading={uploadingVsa}
                onSelect={() => vsaInputRef.current?.click()}
                onRemove={() => handleRemoveDocument('vsa')}
              />
              <DocumentUploadSlot
                label="Logbook"
                url={formData.logbook_url}
                uploading={uploadingLogbook}
                onSelect={() => logbookInputRef.current?.click()}
                onRemove={() => handleRemoveDocument('logbook')}
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
              <div>
                <label className={lbl}>Vehicle Type</label>
                <input
                  type="text"
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  className={inpPlain}
                  placeholder="e.g. Sedan, SUV, Pickup"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Year</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className={inpPlain}
                  >
                    <option value="">Select year</option>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Make</label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    className={inpPlain}
                    placeholder="e.g. Toyota"
                  />
                </div>
                <div>
                  <label className={lbl}>Model *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    className={inpPlain}
                    placeholder="e.g. Hilux"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Trim Option</label>
                  <input
                    type="text"
                    name="trim_option"
                    value={formData.trim_option}
                    onChange={handleChange}
                    className={inpPlain}
                    placeholder="e.g. GLX"
                  />
                </div>
                <div>
                  <label className={lbl}>Transmission</label>
                  <select
                    name="transmission_type"
                    value={formData.transmission_type}
                    onChange={handleChange}
                    className={inpPlain}
                  >
                    <option value="">Select transmission</option>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="CVT">CVT</option>
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
                    <option value="">Select drivetrain</option>
                    <option value="FWD">FWD</option>
                    <option value="RWD">RWD</option>
                    <option value="AWD">AWD</option>
                    <option value="4WD">4WD</option>
                  </select>
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
                  <label className={lbl}>Engine Capacity</label>
                  <div className={iconWrap}>
                    <Gauge className={fieldIcon} />
                    <input
                      type="text"
                      name="engine_capacity"
                      value={formData.engine_capacity}
                      onChange={handleChange}
                      className={inp}
                      placeholder="e.g. 2000cc"
                    />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Engine Code</label>
                  <div className={iconWrap}>
                    <Hash className={fieldIcon} />
                    <input
                      type="text"
                      name="engine_code"
                      value={formData.engine_code}
                      onChange={handleChange}
                      className={inp + ' uppercase'}
                      placeholder="e.g. 1GR-FE"
                    />
                  </div>
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
                <label className={lbl}>Tank Capacity</label>
                <select
                  name="tank_capacity"
                  value={formData.tank_capacity}
                  onChange={handleChange}
                  className={inpPlain}
                >
                  <option value="">Select tank capacity</option>
                  {TANK_CAPACITIES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Telemetry Status</label>
                <select
                  name="telemetry_status"
                  value={formData.telemetry_status}
                  onChange={handleChange}
                  className={inpPlain}
                >
                  <option value="">Select telemetry status</option>
                  {TELEMETRY_STATUSES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className={section}>
            <button
              type="button"
              onClick={() => setNotesExpanded(v => !v)}
              className={`w-full flex items-center justify-between text-left ${notesExpanded ? 'mb-2.5' : ''}`}
            >
              <div className={sectionTitle + ' mb-0'}>
                <StickyNote className="h-3.5 w-3.5 text-green-600" />
                Notes
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Internal only — won't show up on invoices</span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${notesExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {notesExpanded && (
            <textarea
              ref={notesRef}
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={22}
              className={inpPlain + ' resize-none'}
              placeholder="Enter any internal notes…"
            />
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2 pb-2">
            <button
              type="button"
              onClick={() => navigate(clientId ? `/clients/${clientId}` : '/vehicles')}
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
              {saving ? 'Saving…' : 'Add Vehicle'}
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

export default AddVehicle
