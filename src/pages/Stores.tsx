import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Store, Country } from '../services/api'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Store as StoreIcon,
  XCircle,
  Hash,
  MapPin,
  Globe,
  CheckCircle2,
  XCircle as XCircleIcon
} from 'lucide-react'

interface StoreModalProps {
  isOpen: boolean
  onClose: () => void
  store?: Store | null
  onSave: (storeData: Partial<Store>) => Promise<void>
  isEditing: boolean
}

const StoreModal: React.FC<StoreModalProps> = ({ 
  isOpen, 
  onClose, 
  store, 
  onSave, 
  isEditing 
}) => {
  const [formData, setFormData] = useState<Partial<Store>>({
    store_code: '',
    store_name: '',
    address: '',
    country_id: 0,
    is_active: true,
  })
  const [countries, setCountries] = useState<Country[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (store) {
        setFormData({
          store_code: store.store_code || '',
          store_name: store.store_name || '',
          address: store.address || '',
          country_id: store.country_id || 0,
          is_active: store.is_active !== undefined ? store.is_active : true,
        })
      } else {
        setFormData({
          store_name: '',
          address: '',
          country_id: 0,
          is_active: true,
        })
      }
      setError(null)
      fetchCountries()
    }
  }, [isOpen, store])

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true)
      const data = await adminApiService.getCountries()
      setCountries(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching countries:', error)
      setCountries([])
    } finally {
      setLoadingCountries(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.store_name?.trim()) {
      setError('Store name is required')
      return
    }

    if (!formData.country_id || formData.country_id === 0) {
      setError('Country is required')
      return
    }

    try {
      setSaving(true)
      // Don't send store_code when creating (it will be auto-generated)
      if (isEditing) {
        await onSave(formData)
      } else {
        // Remove store_code completely from the data when creating
        const { store_code, ...dataWithoutCode } = formData
        await onSave(dataWithoutCode)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save store')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-3 py-2 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-900">
            {isEditing ? 'Edit Store' : 'Add New Store'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 space-y-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[10px] px-2 py-1 rounded">
              {error}
            </div>
          )}

          {isEditing && (
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Store Code
              </label>
              <div className="relative">
                <Hash className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <input
                  type="text"
                  value={formData.store_code || ''}
                  onChange={(e) => setFormData({ ...formData, store_code: e.target.value })}
                  className="w-full pl-6 pr-2 py-1 text-[10px] border border-gray-300 rounded bg-gray-50 text-gray-600"
                  placeholder="Store code"
                  readOnly
                  disabled
                />
              </div>
              <p className="text-[9px] text-gray-500 mt-0.5">Store code is auto-generated and cannot be changed</p>
            </div>
          )}

          {!isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-[10px] text-blue-700">
                <strong>Note:</strong> Store code will be auto-generated (e.g., STR-0001, STR-0002, etc.)
              </p>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
              Store Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <StoreIcon className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
              <input
                type="text"
                value={formData.store_name || ''}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full pl-6 pr-2 py-1 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter store name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-1.5 top-1.5 text-gray-400 h-3 w-3" />
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-6 pr-2 py-1 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter store address"
                rows={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
              Country <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
              <select
                value={formData.country_id || 0}
                onChange={(e) => setFormData({ ...formData, country_id: parseInt(e.target.value) })}
                className="w-full pl-6 pr-2 py-1 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loadingCountries}
              >
                <option value={0}>Select a country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-medium text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_active !== undefined ? formData.is_active : true}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Active
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-2 py-1 text-[10px] font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-2 py-1 text-[10px] font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Stores: React.FC = () => {
  const navigate = useNavigate()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [deletingStore, setDeletingStore] = useState<number | null>(null)
  const [countries, setCountries] = useState<Country[]>([])

  useEffect(() => {
    fetchStores()
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    try {
      const data = await adminApiService.getCountries()
      setCountries(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching countries:', error)
    }
  }

  const getCountryName = (countryId: number): string => {
    const country = countries.find(c => c.id === countryId)
    return country ? country.name : `Country ID: ${countryId}`
  }

  const fetchStores = async () => {
    try {
      console.log('🏪 [Stores] Fetching stores from database...')
      setLoading(true)
      const data = await adminApiService.getStores()
      console.log('✅ [Stores] Stores fetched from database:', data)
      setStores(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [Stores] Error fetching stores:', error)
      setStores([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingStore(null)
    setIsModalOpen(true)
  }

  const handleEdit = (store: Store) => {
    setEditingStore(store)
    setIsModalOpen(true)
  }

  const handleSave = async (storeData: Partial<Store>) => {
    try {
      if (editingStore) {
        console.log('Updating store in database:', editingStore.id, storeData)
        // Don't allow updating store_code
        const { store_code, ...updateData } = storeData
        await adminApiService.updateStore(editingStore.id, updateData)
      } else {
        console.log('Creating store in database:', storeData)
        // Don't send store_code - it will be auto-generated
        const { store_code, ...createData } = storeData
        await adminApiService.createStore(createData as Omit<Store, 'id' | 'created_at' | 'store_code'>)
      }
      await fetchStores()
    } catch (error) {
      console.error('Error saving store:', error)
      throw error
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingStore(id)
      console.log('Deleting store from database:', id)
      await adminApiService.deleteStore(id)
      await fetchStores()
    } catch (error) {
      console.error('Error deleting store:', error)
      alert(`Failed to delete store: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setDeletingStore(null)
    }
  }

  const filteredStores = stores.filter(store => {
    const matchesSearch = 
      store.store_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCountryName(store.country_id).toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
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
        <div className="mb-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5 text-blue-600" />
            <h1 className="text-base font-bold text-gray-900">Stores</h1>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Store
          </button>
        </div>

        {/* Search */}
        <div className="mb-2">
          <div className="relative">
            <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
            <input
              type="text"
              placeholder="Search stores by code, name, address, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stores Table */}
        {filteredStores.length === 0 ? (
          <div className="bg-white rounded border p-3 text-center text-[10px] text-gray-500">
            {searchTerm ? 'No stores found matching your search' : 'No stores registered'}
          </div>
        ) : (
          <div className="bg-white rounded border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Store Code</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Store Name</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Address</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Country</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Status</th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStores.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-[10px] font-medium">
                        <div className="flex items-center gap-1">
                          <Hash className="h-2.5 w-2.5 text-gray-400" />
                          {store.store_code}
                        </div>
                      </td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">
                        <div className="flex items-center gap-1">
                          <StoreIcon className="h-2.5 w-2.5 text-gray-400" />
                          {store.store_name}
                        </div>
                      </td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">
                        {store.address ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5 text-gray-400" />
                            {store.address}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">
                        <div className="flex items-center gap-1">
                          <Globe className="h-2.5 w-2.5 text-gray-400" />
                          {getCountryName(store.country_id)}
                        </div>
                      </td>
                      <td className="px-2 py-1 text-[10px]">
                        {store.is_active ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircleIcon className="h-2.5 w-2.5" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(store)}
                            className="p-0.5 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(store.id)}
                            disabled={deletingStore === store.id}
                            className="p-0.5 text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingStore === store.id ? (
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
          </div>
        )}

        {/* Summary */}
        <div className="mt-2 text-[10px] text-gray-500">
          Showing {filteredStores.length} of {stores.length} stores
        </div>

        {/* Store Modal */}
        <StoreModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingStore(null)
          }}
          store={editingStore}
          onSave={handleSave}
          isEditing={!!editingStore}
        />
      </div>
    </div>
  )
}

export default Stores

