import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService } from '../services/api'
import { cloudinaryService } from '../services/cloudinary'
import {
  ChevronLeft,
  Pencil,
  ImageIcon,
  Loader2
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
  current_odo: string
  odo_unit: 'KM' | 'Miles'
  color: string
  unit_number: string
  notes: string
  photo_url: string
}

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
  current_odo: '',
  odo_unit: 'KM',
  color: '',
  unit_number: '',
  notes: '',
  photo_url: ''
}

const AddVehicle: React.FC = () => {
  const navigate = useNavigate()
  const { clientId } = useParams<{ clientId: string }>()
  const [clientName, setClientName] = useState('')
  const [loadingClient, setLoadingClient] = useState(true)
  const [formData, setFormData] = useState<VehicleFormData>(emptyVehicleForm)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) return
      setLoadingClient(true)
      const client = await adminApiService.getConversionClient(Number(clientId))
      setClientName(client?.name || '')
      setLoadingClient(false)
    }
    fetchClient()
  }, [clientId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    setUploadingPhoto(true)
    try {
      const result = await cloudinaryService.uploadImage(file, { folder: 'vehicle-photos' })
      setFormData(prev => ({ ...prev, photo_url: result.secure_url }))
    } catch (error) {
      console.error('Photo upload failed:', error)
      alert('Failed to upload photo. You can still save the vehicle without one.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleAnalyzeImage = async () => {
    if (!formData.photo_url) {
      alert('Please upload a photo first')
      return
    }

    setAnalyzingImage(true)
    try {
      console.log('🚗 [AddVehicle] Starting image analysis for:', formData.photo_url)
      const analysis = await adminApiService.analyzeVehicleImage(formData.photo_url)

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
    if (!clientId) return

    try {
      setSaving(true)
      await adminApiService.createConversionVehicle({
        conversion_client_id: Number(clientId),
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
        current_odo: formData.current_odo ? Number(formData.current_odo) : undefined,
        odo_unit: formData.odo_unit,
        color: formData.color || undefined,
        unit_number: formData.unit_number || undefined,
        notes: formData.notes || undefined,
        photo_url: formData.photo_url || undefined
      })
      navigate('/clients')
    } catch (error) {
      console.error('Error saving vehicle:', error)
      alert(`Failed to save vehicle: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear + 1 - i)

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="w-full">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate('/clients')}
            className="p-1 rounded hover:bg-gray-200 text-gray-600"
            title="Back to Clients"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="text-base font-bold text-gray-900">
            Add Vehicle{loadingClient ? '' : clientName ? ` for ${clientName}` : ''}
          </h1>
        </div>

        <div className="bg-white rounded border p-3">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-3">
              {/* Photo */}
              <div className="flex-shrink-0">
                <div className="relative w-24 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                  {uploadingPhoto ? (
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  ) : formData.photo_url ? (
                    <img src={formData.photo_url} alt="Vehicle" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-300" />
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 bg-blue-600 text-white rounded-full p-1 shadow hover:bg-blue-700"
                    title="Upload photo"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handlePhotoSelect(file)
                    }}
                  />
                </div>
              </div>

              <div className="flex-1">
              <div className="mb-2">
                <button
                  type="button"
                  onClick={handleAnalyzeImage}
                  disabled={analyzingImage || !formData.photo_url}
                  className="w-full px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {analyzingImage ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Identify Vehicle from Photo'
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
                    VIN / Serial Number
                  </label>
                  <input
                    type="text"
                    name="vin_serial_number"
                    value={formData.vin_serial_number}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent uppercase"
                    placeholder="Enter VIN or SN"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    required
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent uppercase"
                    placeholder="State & plate number"
                  />
                </div>
              </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
                Vehicle Type
              </label>
              <input
                type="text"
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Select vehicle type"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">select vehicle year</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">Make</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="select vehicle make"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">Model *</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="select vehicle model"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">Trim Option</label>
                <input
                  type="text"
                  name="trim_option"
                  value={formData.trim_option}
                  onChange={handleChange}
                  className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="select vehicle trim"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">Transmission Type</label>
                <select
                  name="transmission_type"
                  value={formData.transmission_type}
                  onChange={handleChange}
                  className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">select transmission</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">Driven Wheels</label>
                <select
                  name="driven_wheel"
                  value={formData.driven_wheel}
                  onChange={handleChange}
                  className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">select drivetrain</option>
                  <option value="FWD">FWD</option>
                  <option value="RWD">RWD</option>
                  <option value="AWD">AWD</option>
                  <option value="4WD">4WD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">Engine</label>
              <input
                type="text"
                name="engine"
                value={formData.engine}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="eg. 5.6L V6"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">Current ODO reading</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    name="current_odo"
                    value={formData.current_odo}
                    onChange={handleChange}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="eg. 8000"
                  />
                  <select
                    name="odo_unit"
                    value={formData.odo_unit}
                    onChange={handleChange}
                    className="px-1 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="KM">KM</option>
                    <option value="Miles">Miles</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="eg. red"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">Unit Number</label>
                <input
                  type="text"
                  name="unit_number"
                  value={formData.unit_number}
                  onChange={handleChange}
                  className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="input unit number"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-xs font-medium text-gray-700 text-[11px]">Notes</label>
                <span className="text-[9px] text-red-500">Internal notes, won't show up on invoices</span>
              </div>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="enter notes"
              />
            </div>

            <div className="flex justify-end gap-1 pt-1.5 border-t mt-2">
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddVehicle
