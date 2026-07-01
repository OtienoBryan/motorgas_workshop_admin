import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApiService, KeyAccount, Vehicle } from '../services/api'
import { 
  ArrowLeft,
  Edit,
  Save,
  X,
  UserCheck,
  UserX,
  Building2,
  Mail,
  Phone,
  FileText,
  Hash,
  Calendar,
  Car,
  Plus,
  Trash2,
  XCircle
} from 'lucide-react'

const KeyAccountManage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'details' | 'vehicles'>('details')
  const [keyAccount, setKeyAccount] = useState<KeyAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<KeyAccount>>({
    name: '',
    email: '',
    contact: '',
    account_number: '',
    description: '',
    is_active: 1
  })
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [vehicleFormData, setVehicleFormData] = useState<Partial<Vehicle>>({
    registration_number: '',
    vin_serial_number: '',
    vehicle_type: '',
    year: undefined,
    make: '',
    model: '',
    trim_option: '',
    transmission_type: '',
    driven_wheel: '',
    current_odo: undefined,
    color: '',
    driver_name: '',
    driver_contact: ''
  })
  const [savingVehicle, setSavingVehicle] = useState(false)
  const [deletingVehicle, setDeletingVehicle] = useState<number | null>(null)

  useEffect(() => {
    if (id) {
      fetchKeyAccount()
      fetchVehicles()
    }
  }, [id])

  useEffect(() => {
    if (activeTab === 'vehicles' && id) {
      fetchVehicles()
    }
  }, [activeTab, id])

  const fetchKeyAccount = async () => {
    if (!id) return
    try {
      setLoading(true)
      const accounts = await adminApiService.getKeyAccounts()
      const account = accounts.find(a => a.id === Number(id))
      if (account) {
        setKeyAccount(account)
        setFormData({
          name: account.name || '',
          email: account.email || '',
          contact: account.contact || '',
          account_number: account.account_number || '',
          description: account.description || '',
          is_active: account.is_active !== undefined ? account.is_active : 1
        })
      } else {
        alert('Key account not found')
        navigate('/key-accounts')
      }
    } catch (error) {
      console.error('Error fetching key account:', error)
      alert('Failed to load key account details')
      navigate('/key-accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!keyAccount) return
    try {
      setSaving(true)
      await adminApiService.updateKeyAccount(keyAccount.id, formData)
      await fetchKeyAccount()
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating key account:', error)
      alert('Failed to update key account')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (keyAccount) {
      setFormData({
        name: keyAccount.name || '',
        email: keyAccount.email || '',
        contact: keyAccount.contact || '',
        account_number: keyAccount.account_number || '',
        description: keyAccount.description || '',
        is_active: keyAccount.is_active !== undefined ? keyAccount.is_active : 1
      })
    }
    setIsEditing(false)
  }

  const handleToggleStatus = async () => {
    if (!keyAccount) return
    const newStatus = keyAccount.is_active === 1 ? 0 : 1
    const action = newStatus === 1 ? 'activate' : 'deactivate'
    
    if (!confirm(`Are you sure you want to ${action} this key account?`)) {
      return
    }

    try {
      await adminApiService.updateKeyAccount(keyAccount.id, { is_active: newStatus })
      await fetchKeyAccount()
    } catch (error) {
      console.error('Error toggling status:', error)
      alert(`Failed to ${action} key account`)
    }
  }

  const fetchVehicles = async () => {
    if (!id) return
    try {
      setLoadingVehicles(true)
      const data = await adminApiService.getVehiclesByKeyAccount(Number(id))
      setVehicles(data)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      setVehicles([])
    } finally {
      setLoadingVehicles(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'is_active' ? Number(value) : value
    }))
  }

  const handleVehicleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setVehicleFormData(prev => ({
      ...prev,
      [name]: (name === 'year' || name === 'current_odo') ? (value ? Number(value) : undefined) : value
    }))
  }

  const handleAddVehicle = () => {
    setEditingVehicle(null)
    setVehicleFormData({
      registration_number: '',
      vin_serial_number: '',
      vehicle_type: '',
      year: undefined,
      make: '',
      model: '',
      trim_option: '',
      transmission_type: '',
      driven_wheel: '',
      current_odo: undefined,
      color: '',
      driver_name: '',
      driver_contact: ''
    })
    setIsVehicleModalOpen(true)
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setVehicleFormData({
      registration_number: vehicle.registration_number || '',
      vin_serial_number: vehicle.vin_serial_number || '',
      vehicle_type: vehicle.vehicle_type || '',
      year: vehicle.year,
      make: vehicle.make || '',
      model: vehicle.model || '',
      trim_option: vehicle.trim_option || '',
      transmission_type: vehicle.transmission_type || '',
      driven_wheel: vehicle.driven_wheel || '',
      current_odo: vehicle.current_odo,
      color: vehicle.color || '',
      driver_name: vehicle.driver_name || '',
      driver_contact: vehicle.driver_contact || ''
    })
    setIsVehicleModalOpen(true)
  }

  const handleSaveVehicle = async () => {
    if (!id) return
    try {
      setSavingVehicle(true)
      if (editingVehicle) {
        await adminApiService.updateVehicle(editingVehicle.id, {
          ...vehicleFormData,
          key_account_id: Number(id)
        })
      } else {
        await adminApiService.createVehicle({
          ...vehicleFormData,
          key_account_id: Number(id)
        } as Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>)
      }
      await fetchVehicles()
      setIsVehicleModalOpen(false)
      setEditingVehicle(null)
      setVehicleFormData({
        registration_number: '',
        vin_serial_number: '',
        vehicle_type: '',
        year: undefined,
        make: '',
        model: '',
        trim_option: '',
        transmission_type: '',
        driven_wheel: '',
        current_odo: undefined,
        color: '',
        driver_name: '',
        driver_contact: ''
      })
    } catch (error) {
      console.error('Error saving vehicle:', error)
      alert(`Failed to save vehicle: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSavingVehicle(false)
    }
  }

  const handleDeleteVehicle = async (vehicleId: number) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return
    }
    try {
      setDeletingVehicle(vehicleId)
      await adminApiService.deleteVehicle(vehicleId)
      await fetchVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      alert('Failed to delete vehicle')
    } finally {
      setDeletingVehicle(null)
    }
  }

  const getStatusBadge = (isActive: number) => {
    return isActive === 1 ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
        <UserCheck className="h-3 w-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
        <UserX className="h-3 w-3 mr-1" />
        Inactive
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!keyAccount) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/key-accounts')}
              className="p-1 text-gray-600 hover:text-gray-800"
              title="Back to Key Accounts"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xs font-bold text-gray-900">Manage Key Account</h1>
          </div>
          <div className="flex gap-1.5">
            {!isEditing && activeTab === 'details' && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={handleToggleStatus}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded ${
                    keyAccount.is_active === 1
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {keyAccount.is_active === 1 ? (
                    <>
                      <UserX className="h-3 w-3" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3 w-3" />
                      Activate
                    </>
                  )}
                </button>
              </>
            )}
            {isEditing && activeTab === 'details' && (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-3 w-3" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-2 border-b border-gray-200">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1 text-[10px] font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Account Details
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-3 py-1 text-[10px] font-medium border-b-2 transition-colors flex items-center gap-1 ${
                activeTab === 'vehicles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Car className="h-3 w-3" />
              Vehicles ({vehicles.length})
            </button>
          </nav>
        </div>

        {/* Account Details Tab */}
        {activeTab === 'details' && (
        <div className="bg-white rounded border p-3 space-y-3">
          {/* Status Badge */}
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="text-[11px] font-medium text-gray-700">Account Status</span>
            </div>
            {getStatusBadge(keyAccount.is_active)}
          </div>

          {/* Basic Information */}
          <div>
            <h2 className="text-[11px] font-semibold text-gray-900 mb-2 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-[11px] text-gray-900">{keyAccount.name}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5 flex items-center gap-1">
                  <Hash className="h-2.5 w-2.5" />
                  Account Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="account_number"
                    value={formData.account_number || ''}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-[11px] text-gray-900">{keyAccount.account_number}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-[11px] font-semibold text-gray-900 mb-2 flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5 flex items-center gap-1">
                  <Mail className="h-2.5 w-2.5" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-[11px] text-gray-900">{keyAccount.email}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5 flex items-center gap-1">
                  <Phone className="h-2.5 w-2.5" />
                  Contact
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact || ''}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-[11px] text-gray-900">{keyAccount.contact}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-[11px] font-semibold text-gray-900 mb-2">Description</h2>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={4}
                className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="Enter description..."
              />
            ) : (
              <p className="text-[11px] text-gray-900 whitespace-pre-wrap">
                {keyAccount.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Status */}
          {isEditing && (
            <div>
              <h2 className="text-[11px] font-semibold text-gray-900 mb-2">Status</h2>
              <select
                name="is_active"
                value={formData.is_active !== undefined ? formData.is_active : 1}
                onChange={handleChange}
                className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-2 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5 flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  Created At
                </label>
                <p className="text-[10px] text-gray-600">
                  {new Date(keyAccount.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5 flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  Last Updated
                </label>
                <p className="text-[10px] text-gray-600">
                  {new Date(keyAccount.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === 'vehicles' && (
          <div className="space-y-2">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-semibold text-gray-900">Vehicles</h2>
              <button
                onClick={handleAddVehicle}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Vehicle
              </button>
            </div>

            {/* Vehicles List */}
            {loadingVehicles ? (
              <div className="bg-white rounded border p-3 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="bg-white rounded border p-3 text-center text-[10px] text-gray-500">
                No vehicles registered for this account
              </div>
            ) : (
              <div className="bg-white rounded border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Registration Number</th>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Model</th>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Driver Name</th>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Driver Contact</th>
                      <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-2 py-1 text-[10px] font-medium">{vehicle.registration_number}</td>
                        <td className="px-2 py-1 text-[10px] text-gray-600">{vehicle.model}</td>
                        <td className="px-2 py-1 text-[10px] text-gray-600">{vehicle.driver_name}</td>
                        <td className="px-2 py-1 text-[10px] text-gray-600">{vehicle.driver_contact}</td>
                        <td className="px-2 py-1 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleEditVehicle(vehicle)}
                              className="p-0.5 text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                              disabled={deletingVehicle === vehicle.id}
                              className="p-0.5 text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingVehicle === vehicle.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent"></div>
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Vehicle Modal */}
        {isVehicleModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-3 border-b">
                <h2 className="text-base font-semibold text-gray-900">
                  {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <button
                  onClick={() => {
                    setIsVehicleModalOpen(false)
                    setEditingVehicle(null)
                    setVehicleFormData({
                      registration_number: '',
                      vin_serial_number: '',
                      vehicle_type: '',
                      year: undefined,
                      make: '',
                      model: '',
                      trim_option: '',
                      transmission_type: '',
                      driven_wheel: '',
                      current_odo: undefined,
                      color: '',
                      driver_name: '',
                      driver_contact: ''
                    })
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-3">
                <form onSubmit={(e) => { e.preventDefault(); handleSaveVehicle(); }} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* VIN/Serial Number */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        VIN/Serial Number
                      </label>
                      <input
                        type="text"
                        name="vin_serial_number"
                        value={vehicleFormData.vin_serial_number || ''}
                        onChange={handleVehicleFormChange}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter VIN or serial number"
                      />
                    </div>

                    {/* License Plate */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        License Plate *
                      </label>
                      <input
                        type="text"
                        name="registration_number"
                        value={vehicleFormData.registration_number || ''}
                        onChange={handleVehicleFormChange}
                        required
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter license plate number"
                      />
                    </div>

                    {/* Vehicle Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Vehicle Type
                      </label>
                      <select
                        name="vehicle_type"
                        value={vehicleFormData.vehicle_type || ''}
                        onChange={handleVehicleFormChange}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select vehicle type</option>
                        <option value="Sedan">Sedan</option>
                        <option value="SUV">SUV</option>
                        <option value="Truck">Truck</option>
                        <option value="Van">Van</option>
                        <option value="Coupe">Coupe</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="Convertible">Convertible</option>
                        <option value="Wagon">Wagon</option>
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="Bus">Bus</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Year */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        name="year"
                        value={vehicleFormData.year || ''}
                        onChange={handleVehicleFormChange}
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter year"
                      />
                    </div>

                    {/* Make */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Make
                      </label>
                      <select
                        name="make"
                        value={vehicleFormData.make || ''}
                        onChange={handleVehicleFormChange}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select make</option>
                        <option value="Toyota">Toyota</option>
                        <option value="Honda">Honda</option>
                        <option value="Ford">Ford</option>
                        <option value="Chevrolet">Chevrolet</option>
                        <option value="Nissan">Nissan</option>
                        <option value="BMW">BMW</option>
                        <option value="Mercedes-Benz">Mercedes-Benz</option>
                        <option value="Audi">Audi</option>
                        <option value="Volkswagen">Volkswagen</option>
                        <option value="Hyundai">Hyundai</option>
                        <option value="Kia">Kia</option>
                        <option value="Mazda">Mazda</option>
                        <option value="Subaru">Subaru</option>
                        <option value="Jeep">Jeep</option>
                        <option value="GMC">GMC</option>
                        <option value="Ram">Ram</option>
                        <option value="Dodge">Dodge</option>
                        <option value="Lexus">Lexus</option>
                        <option value="Acura">Acura</option>
                        <option value="Infiniti">Infiniti</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Model */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Model *
                      </label>
                      <input
                        type="text"
                        name="model"
                        value={vehicleFormData.model || ''}
                        onChange={handleVehicleFormChange}
                        required
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter vehicle model"
                      />
                    </div>

                    {/* Trim Option */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Trim Option
                      </label>
                      <input
                        type="text"
                        name="trim_option"
                        value={vehicleFormData.trim_option || ''}
                        onChange={handleVehicleFormChange}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter trim option (e.g., LE, XLE, Limited)"
                      />
                    </div>

                    {/* Transmission Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Transmission Type
                      </label>
                      <select
                        name="transmission_type"
                        value={vehicleFormData.transmission_type || ''}
                        onChange={handleVehicleFormChange}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select transmission</option>
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                        <option value="CVT">CVT (Continuously Variable)</option>
                        <option value="DCT">DCT (Dual Clutch)</option>
                        <option value="AMT">AMT (Automated Manual)</option>
                      </select>
                    </div>

                    {/* Driven Wheel */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Driven Wheel
                      </label>
                      <select
                        name="driven_wheel"
                        value={vehicleFormData.driven_wheel || ''}
                        onChange={handleVehicleFormChange}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select driven wheel</option>
                        <option value="FWD">FWD (Front Wheel Drive)</option>
                        <option value="RWD">RWD (Rear Wheel Drive)</option>
                        <option value="AWD">AWD (All Wheel Drive)</option>
                        <option value="4WD">4WD (Four Wheel Drive)</option>
                      </select>
                    </div>

                    {/* Current ODO Reading */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Current ODO Reading
                      </label>
                      <input
                        type="number"
                        name="current_odo"
                        value={vehicleFormData.current_odo || ''}
                        onChange={handleVehicleFormChange}
                        min="0"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter current odometer reading"
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        name="color"
                        value={vehicleFormData.color || ''}
                        onChange={handleVehicleFormChange}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter vehicle color"
                      />
                    </div>

                    {/* Driver Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Driver Name *
                      </label>
                      <input
                        type="text"
                        name="driver_name"
                        value={vehicleFormData.driver_name || ''}
                        onChange={handleVehicleFormChange}
                        required
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter driver name"
                      />
                    </div>

                    {/* Driver Contact */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Driver Contact *
                      </label>
                      <input
                        type="text"
                        name="driver_contact"
                        value={vehicleFormData.driver_contact || ''}
                        onChange={handleVehicleFormChange}
                        required
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter driver contact"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setIsVehicleModalOpen(false)
                        setEditingVehicle(null)
                        setVehicleFormData({
                          registration_number: '',
                          vin_serial_number: '',
                          vehicle_type: '',
                          year: undefined,
                          make: '',
                          model: '',
                          trim_option: '',
                          transmission_type: '',
                          driven_wheel: '',
                          current_odo: undefined,
                          color: '',
                          driver_name: '',
                          driver_contact: ''
                        })
                      }}
                      className="px-4 py-2 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                      disabled={savingVehicle}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingVehicle}
                      className="px-4 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingVehicle ? 'Saving...' : editingVehicle ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default KeyAccountManage

