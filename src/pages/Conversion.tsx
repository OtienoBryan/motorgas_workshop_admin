import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApiService, Conversion } from '../services/api'
import { 
  Plus,
  Search,
  Car,
  XCircle,
  Eye,
  Calendar,
  CheckCircle,
  XCircle as XCircleIcon,
  CheckCircle2
} from 'lucide-react'

interface ConversionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (conversionData: any) => Promise<void>
}

const ConversionModal: React.FC<ConversionModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ownerFullName: '',
    nationalId: '',
    passportId: '',
    contact: '',
    email: '',
    vehicleRegistration: '',
    make: '',
    model: '',
    yearOfManufacture: '',
    engineCapacity: '',
    vinChassisNumber: '',
    currentFuelType: 'petrol' as 'petrol' | 'diesel' | 'hybrid',
    logbookNumber: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ownerFullName: '',
        nationalId: '',
        passportId: '',
        contact: '',
        email: '',
        vehicleRegistration: '',
        make: '',
        model: '',
        yearOfManufacture: '',
        engineCapacity: '',
        vinChassisNumber: '',
        currentFuelType: 'petrol',
        logbookNumber: ''
      })
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.ownerFullName || !formData.contact || !formData.vehicleRegistration) {
      alert('Please fill in all required fields (Owner Name, Contact, Vehicle Registration)')
      return
    }

    if (!formData.nationalId && !formData.passportId) {
      alert('Please provide either National ID or Passport ID')
      return
    }

    try {
      setSaving(true)
      
      // Prepare conversion data
      const conversionData: any = {
        ownerFullName: formData.ownerFullName,
        contact: formData.contact,
        vehicleRegistration: formData.vehicleRegistration,
        currentFuelType: formData.currentFuelType,
      }

      // Add optional fields only if they have values
      if (formData.nationalId) conversionData.nationalId = formData.nationalId
      if (formData.passportId) conversionData.passportId = formData.passportId
      if (formData.email) conversionData.email = formData.email
      if (formData.make) conversionData.make = formData.make
      if (formData.model) conversionData.model = formData.model
      if (formData.yearOfManufacture) conversionData.yearOfManufacture = Number(formData.yearOfManufacture)
      if (formData.engineCapacity) conversionData.engineCapacity = Number(formData.engineCapacity)
      if (formData.vinChassisNumber) conversionData.vinChassisNumber = formData.vinChassisNumber
      if (formData.logbookNumber) conversionData.logbookNumber = formData.logbookNumber

      await onSave(conversionData)
      onClose()
    } catch (error) {
      console.error('Error saving conversion:', error)
      alert(`Failed to save conversion: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold flex items-center gap-1">
            <Car className="h-3.5 w-3.5" />
            Add New Conversion
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Owner Information Section */}
          <div className="border-b pb-2 mb-2">
            <h3 className="text-[11px] font-semibold text-gray-900">Owner Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Full Name of Owner *
              </label>
              <input
                type="text"
                name="ownerFullName"
                value={formData.ownerFullName}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Contact *
              </label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                National ID
              </label>
              <input
                type="text"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter National ID"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Passport ID
              </label>
              <input
                type="text"
                name="passportId"
                value={formData.passportId}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter Passport ID"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email address"
              />
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="border-b pb-2 mb-2 mt-3">
            <h3 className="text-[11px] font-semibold text-gray-900">Vehicle Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Vehicle Registration *
              </label>
              <input
                type="text"
                name="vehicleRegistration"
                value={formData.vehicleRegistration}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Make
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Toyota, Honda"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Camry, Accord"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Year of Manufacture
              </label>
              <input
                type="number"
                name="yearOfManufacture"
                value={formData.yearOfManufacture}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2020"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Engine Capacity (cc)
              </label>
              <input
                type="number"
                name="engineCapacity"
                value={formData.engineCapacity}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2000"
                min="0"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                VIN/Chassis Number
              </label>
              <input
                type="text"
                name="vinChassisNumber"
                value={formData.vinChassisNumber}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter VIN or Chassis number"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Current Fuel Type
              </label>
              <select
                name="currentFuelType"
                value={formData.currentFuelType}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Logbook Number
              </label>
              <input
                type="text"
                name="logbookNumber"
                value={formData.logbookNumber}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter logbook number"
              />
            </div>
          </div>

          <div className="flex justify-end gap-1 pt-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-1.5 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ConversionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  conversion: Conversion | null
}

const ConversionDetailsModal: React.FC<ConversionDetailsModalProps> = ({ isOpen, onClose, conversion }) => {
  if (!isOpen || !conversion) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold flex items-center gap-1">
            <Car className="h-3.5 w-3.5" />
            Conversion Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Owner Information */}
          <div className="border-b pb-2">
            <h3 className="text-[11px] font-semibold text-gray-900 mb-2">Owner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Full Name</label>
                <p className="text-[10px] text-gray-900">{conversion.ownerFullName}</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Contact</label>
                <p className="text-[10px] text-gray-900">{conversion.contact}</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Email</label>
                <p className="text-[10px] text-gray-900">{conversion.email || '-'}</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">National ID</label>
                <p className="text-[10px] text-gray-900">{conversion.nationalId || '-'}</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Passport ID</label>
                <p className="text-[10px] text-gray-900">{conversion.passportId || '-'}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="border-b pb-2">
            <h3 className="text-[11px] font-semibold text-gray-900 mb-2">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Vehicle Registration</label>
                <p className="text-[10px] text-gray-900 font-medium">{conversion.vehicleRegistration}</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Make</label>
                <p className="text-[10px] text-gray-900">{conversion.make || '-'}</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Model</label>
                <p className="text-[10px] text-gray-900">{conversion.model || '-'}</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Year of Manufacture</label>
                <p className="text-[10px] text-gray-900">{conversion.yearOfManufacture || '-'}</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Engine Capacity (cc)</label>
                <p className="text-[10px] text-gray-900">{conversion.engineCapacity || '-'}</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">VIN/Chassis Number</label>
                <p className="text-[10px] text-gray-900">{conversion.vinChassisNumber || '-'}</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Current Fuel Type</label>
                <p className="text-[10px]">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] ${
                    conversion.currentFuelType === 'petrol' 
                      ? 'bg-blue-50 text-blue-700'
                      : conversion.currentFuelType === 'diesel'
                      ? 'bg-gray-50 text-gray-700'
                      : 'bg-green-50 text-green-700'
                  }`}>
                    {conversion.currentFuelType.charAt(0).toUpperCase() + conversion.currentFuelType.slice(1)}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Logbook Number</label>
                <p className="text-[10px] text-gray-900">{conversion.logbookNumber || '-'}</p>
              </div>
            </div>
          </div>

          {/* Status and Scheduling */}
          <div className="border-b pb-2">
            <h3 className="text-[11px] font-semibold text-gray-900 mb-2">Status & Scheduling</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Status</label>
                <p className="text-[10px]">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] ${
                    conversion.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : conversion.status === 'approved' 
                      ? 'bg-green-50 text-green-700'
                      : conversion.status === 'declined'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {(conversion.status || 'pending').charAt(0).toUpperCase() + (conversion.status || 'pending').slice(1)}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Scheduled Date</label>
                <p className="text-[10px] text-gray-900">{conversion.scheduledDate ? formatDate(conversion.scheduledDate) : '-'}</p>
              </div>
              {conversion.conversionDate && (
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Date of Conversion</label>
                  <p className="text-[10px] text-gray-900 font-medium">{new Date(conversion.conversionDate).toLocaleDateString()}</p>
                </div>
              )}
              {conversion.comment && (
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Comment</label>
                  <p className="text-[10px] text-gray-900">{conversion.comment}</p>
                </div>
              )}
              {conversion.conversionDescription && (
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Conversion Description</label>
                  <p className="text-[10px] text-gray-900 whitespace-pre-wrap">{conversion.conversionDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-[11px] font-semibold text-gray-900 mb-2">Record Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Created At</label>
                <p className="text-[10px] text-gray-900">{formatDate(conversion.createdAt)}</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Updated At</label>
                <p className="text-[10px] text-gray-900">{formatDate(conversion.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-1 pt-2 mt-3 border-t">
          <button
            onClick={onClose}
            className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  conversion: Conversion | null
  onSave: (id: number, scheduledDate: string) => Promise<void>
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, conversion, onSave }) => {
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && conversion) {
      if (conversion.scheduledDate) {
        const date = new Date(conversion.scheduledDate)
        setScheduledDate(date.toISOString().split('T')[0])
        setScheduledTime(date.toTimeString().slice(0, 5))
      } else {
        setScheduledDate('')
        setScheduledTime('')
      }
    }
  }, [isOpen, conversion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!conversion || !scheduledDate || !scheduledTime) {
      alert('Please select both date and time')
      return
    }

    try {
      setSaving(true)
      const dateTime = `${scheduledDate}T${scheduledTime}:00`
      await onSave(conversion.id, dateTime)
      onClose()
    } catch (error) {
      console.error('Error scheduling conversion:', error)
      alert(`Failed to schedule conversion: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !conversion) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-md">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Schedule Conversion
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-2 text-[10px] text-gray-600">
          <p><strong>Owner:</strong> {conversion.ownerFullName}</p>
          <p><strong>Vehicle:</strong> {conversion.vehicleRegistration}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
              Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
              Time *
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-1 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-1.5 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  conversion: Conversion | null
  status: 'approved' | 'declined'
  onSave: (id: number, status: 'approved' | 'declined', comment: string) => Promise<void>
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({ isOpen, onClose, conversion, status, onSave }) => {
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && conversion) {
      setComment(conversion.comment || '')
    }
  }, [isOpen, conversion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!conversion) return

    try {
      setSaving(true)
      await onSave(conversion.id, status, comment)
      onClose()
      setComment('')
    } catch (error) {
      console.error('Error updating conversion status:', error)
      alert(`Failed to ${status} conversion: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !conversion) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-md">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold flex items-center gap-1">
            {status === 'approved' ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <XCircleIcon className="h-3.5 w-3.5 text-red-600" />
            )}
            {status === 'approved' ? 'Approve' : 'Decline'} Conversion
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-2 text-[10px] text-gray-600">
          <p><strong>Owner:</strong> {conversion.ownerFullName}</p>
          <p><strong>Vehicle:</strong> {conversion.vehicleRegistration}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
              Comment {status === 'declined' ? '*' : ''}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              required={status === 'declined'}
              className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder={status === 'declined' ? 'Please provide a reason for declining...' : 'Add any comments (optional)...'}
            />
          </div>

          <div className="flex justify-end gap-1 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-1.5 py-0.5 text-[11px] text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${
                status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {saving ? 'Saving...' : status === 'approved' ? 'Approve' : 'Decline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface CompleteConversionModalProps {
  isOpen: boolean
  onClose: () => void
  conversion: Conversion | null
  onSave: (id: number, description: string, conversionDate: string) => Promise<void>
}

const CompleteConversionModal: React.FC<CompleteConversionModalProps> = ({ isOpen, onClose, conversion, onSave }) => {
  const [description, setDescription] = useState('')
  const [conversionDate, setConversionDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && conversion) {
      setDescription(conversion.conversionDescription || '')
      if (conversion.conversionDate) {
        setConversionDate(conversion.conversionDate.split('T')[0])
      } else {
        // Default to today's date
        setConversionDate(new Date().toISOString().split('T')[0])
      }
    }
  }, [isOpen, conversion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!conversion) return

    if (!description.trim()) {
      alert('Please provide a description of the completed conversion')
      return
    }

    if (!conversionDate) {
      alert('Please select the date of conversion')
      return
    }

    try {
      setSaving(true)
      await onSave(conversion.id, description, conversionDate)
      onClose()
      setDescription('')
      setConversionDate('')
    } catch (error) {
      console.error('Error completing conversion:', error)
      alert(`Failed to complete conversion: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !conversion) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-3 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Complete Conversion
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-3 text-sm text-gray-600">
          <p><strong>Owner:</strong> {conversion.ownerFullName}</p>
          <p><strong>Vehicle:</strong> {conversion.vehicleRegistration}</p>
          {conversion.scheduledDate && (
            <p><strong>Scheduled:</strong> {new Date(conversion.scheduledDate).toLocaleString()}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Conversion *
            </label>
            <input
              type="date"
              value={conversionDate}
              onChange={(e) => setConversionDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Select the date when the conversion was completed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={10}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the completed conversion work, any issues encountered, parts replaced, final status, etc..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide details about the conversion work completed
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Mark as Completed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ConversionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedConversion, setSelectedConversion] = useState<Conversion | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<'approved' | 'declined'>('approved')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [startDateFilter, setStartDateFilter] = useState<string>('')
  const [endDateFilter, setEndDateFilter] = useState<string>('')

  const filterDate = searchParams.get('date')

  useEffect(() => {
    fetchConversions()
  }, [])

  const fetchConversions = async () => {
    try {
      console.log('🔧 [ConversionsPage] Fetching conversions...')
      setLoading(true)
      const data = await adminApiService.getConversions()
      console.log('✅ [ConversionsPage] Conversions fetched:', data)
      setConversions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [ConversionsPage] Error fetching conversions:', error)
      setConversions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (conversionData: any) => {
    await adminApiService.createConversion(conversionData)
    await fetchConversions()
  }

  const handleSchedule = async (id: number, scheduledDate: string) => {
    await adminApiService.updateConversion(id, { scheduledDate })
    await fetchConversions()
  }

  const handleApproval = async (id: number, status: 'approved' | 'declined', comment: string) => {
    await adminApiService.updateConversion(id, { status, comment })
    await fetchConversions()
  }

  const handleComplete = async (id: number, description: string, conversionDate: string) => {
    await adminApiService.updateConversion(id, { 
      status: 'completed' as any, 
      conversionDescription: description,
      conversionDate: conversionDate
    })
    await fetchConversions()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const filteredConversions = conversions.filter(conversion => {
    // Filter by date if date parameter is present (from calendar click)
    if (filterDate) {
      if (!conversion.scheduledDate) return false
      try {
        const scheduledDate = new Date(conversion.scheduledDate)
        const scheduledDateStr = `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, '0')}-${String(scheduledDate.getDate()).padStart(2, '0')}`
        if (scheduledDateStr !== filterDate) return false
      } catch (error) {
        console.error('Error parsing date:', error)
        return false
      }
    }

    // Filter by status
    if (statusFilter !== 'all') {
      const conversionStatus = conversion.status || 'pending'
      if (conversionStatus !== statusFilter) return false
    }

    // Filter by date range (start date and end date)
    if (startDateFilter || endDateFilter) {
      if (!conversion.scheduledDate) return false
      try {
        const scheduledDate = new Date(conversion.scheduledDate)
        scheduledDate.setHours(0, 0, 0, 0) // Reset time to start of day
        
        if (startDateFilter) {
          const startDate = new Date(startDateFilter)
          startDate.setHours(0, 0, 0, 0)
          if (scheduledDate < startDate) return false
        }
        
        if (endDateFilter) {
          const endDate = new Date(endDateFilter)
          endDate.setHours(23, 59, 59, 999) // End of day
          if (scheduledDate > endDate) return false
        }
      } catch (error) {
        console.error('Error parsing date range:', error)
        return false
      }
    }

    // Filter by search term
    const searchLower = searchTerm.toLowerCase()
    return (
      conversion.ownerFullName.toLowerCase().includes(searchLower) ||
      conversion.contact.toLowerCase().includes(searchLower) ||
      conversion.vehicleRegistration.toLowerCase().includes(searchLower) ||
      conversion.email?.toLowerCase().includes(searchLower) ||
      conversion.make?.toLowerCase().includes(searchLower) ||
      conversion.model?.toLowerCase().includes(searchLower) ||
      conversion.nationalId?.toLowerCase().includes(searchLower) ||
      conversion.passportId?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold text-gray-900 flex items-center gap-1">
              <Car className="h-4 w-4" />
              Vehicle Conversions
            </h1>
            {filterDate && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                <Calendar className="h-3 w-3 text-blue-600" />
                <span className="text-[10px] text-blue-700 font-medium">
                  Filtered: {new Date(filterDate).toLocaleDateString()}
                </span>
                <button
                  onClick={() => {
                    setSearchParams({})
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                  title="Clear date filter"
                >
                  <XCircle className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] bg-green-800 text-white rounded hover:bg-blue-700"
          >
            <Plus className="h-3 w-3" />
            Add New Request
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-2 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
            <input
              type="text"
              placeholder="Search by owner name, contact, vehicle registration, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                End Date
              </label>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                min={startDateFilter || undefined}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setStartDateFilter('')
                  setEndDateFilter('')
                  setSearchTerm('')
                  setSearchParams({})
                }}
                className="w-full px-2 py-0.5 text-[10px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Conversions Table */}
        <div className="bg-white rounded border overflow-hidden">
          {filteredConversions.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-gray-500">
              {searchTerm ? 'No conversions found matching your search' : 'No conversions found. Click "Add New" to create one.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Owner Name</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Contact</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Email</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Vehicle Registration</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Make/Model</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Year</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Fuel Type</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Status</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Scheduled</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Created At</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredConversions.map((conversion) => (
                    <tr key={conversion.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-[10px] font-medium">{conversion.ownerFullName}</td>
                      <td className="px-2 py-1 text-[10px]">{conversion.contact}</td>
                      <td className="px-2 py-1 text-[10px]">{conversion.email || '-'}</td>
                      <td className="px-2 py-1 text-[10px] font-medium">{conversion.vehicleRegistration}</td>
                      <td className="px-2 py-1 text-[10px]">
                        {conversion.make && conversion.model 
                          ? `${conversion.make} ${conversion.model}`
                          : conversion.make || conversion.model || '-'}
                      </td>
                      <td className="px-2 py-1 text-[10px]">{conversion.yearOfManufacture || '-'}</td>
                      <td className="px-2 py-1 text-[10px]">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] ${
                          conversion.currentFuelType === 'petrol' 
                            ? 'bg-blue-50 text-blue-700'
                            : conversion.currentFuelType === 'diesel'
                            ? 'bg-gray-50 text-gray-700'
                            : 'bg-green-50 text-green-700'
                        }`}>
                          {conversion.currentFuelType.charAt(0).toUpperCase() + conversion.currentFuelType.slice(1)}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-[10px]">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] ${
                          (conversion.status as string) === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : conversion.status === 'approved' 
                            ? 'bg-green-50 text-green-700'
                            : conversion.status === 'declined'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}>
                          {(conversion.status || 'pending').charAt(0).toUpperCase() + (conversion.status || 'pending').slice(1)}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">
                        {conversion.scheduledDate ? formatDate(conversion.scheduledDate) : '-'}
                      </td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">{formatDate(conversion.createdAt)}</td>
                      <td className="px-2 py-1 text-[10px]">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedConversion(conversion)
                              setIsDetailsModalOpen(true)
                            }}
                            className="flex items-center gap-1 px-1 py-0.5 text-[9px] bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          {(conversion.status || 'pending') === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedConversion(conversion)
                                  setApprovalStatus('approved')
                                  setIsApprovalModalOpen(true)
                                }}
                                className="flex items-center gap-1 px-1 py-0.5 text-[9px] bg-green-50 text-green-700 rounded hover:bg-green-100"
                                title="Approve"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedConversion(conversion)
                                  setApprovalStatus('declined')
                                  setIsApprovalModalOpen(true)
                                }}
                                className="flex items-center gap-1 px-1 py-0.5 text-[9px] bg-red-50 text-red-700 rounded hover:bg-red-100"
                                title="Decline"
                              >
                                <XCircleIcon className="h-3 w-3" />
                              </button>
                            </>
                          )}
                          {(conversion.status || 'pending') === 'approved' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedConversion(conversion)
                                  setIsScheduleModalOpen(true)
                                }}
                                className="flex items-center gap-1 px-1 py-0.5 text-[9px] bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                                title="Schedule"
                              >
                                <Calendar className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedConversion(conversion)
                                  setIsCompleteModalOpen(true)
                                }}
                                className="flex items-center gap-1 px-1 py-0.5 text-[9px] bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100"
                                title="Mark as Completed"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <ConversionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* Details Modal */}
      <ConversionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedConversion(null)
        }}
        conversion={selectedConversion}
      />

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false)
          setSelectedConversion(null)
        }}
        conversion={selectedConversion}
        onSave={handleSchedule}
      />

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false)
          setSelectedConversion(null)
        }}
        conversion={selectedConversion}
        status={approvalStatus}
        onSave={handleApproval}
      />

      {/* Complete Conversion Modal */}
      <CompleteConversionModal
        isOpen={isCompleteModalOpen}
        onClose={() => {
          setIsCompleteModalOpen(false)
          setSelectedConversion(null)
        }}
        conversion={selectedConversion}
        onSave={handleComplete}
      />
    </div>
  )
}

export default ConversionsPage
