import React, { useState, useEffect, useCallback } from 'react'
import { adminApiService, Region, Country } from '../services/api'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  XCircle,
  MapPin
} from 'lucide-react'

interface RegionModalProps {
  isOpen: boolean
  onClose: () => void
  region?: Region | null
  onSave: (regionData: Partial<Region>) => Promise<void>
  isEditing: boolean
  countries: Country[]
}

const RegionModal: React.FC<RegionModalProps> = ({ isOpen, onClose, region, onSave, isEditing, countries }) => {
  const [formData, setFormData] = useState<Partial<Region>>({
    name: '',
    countryId: undefined,
    status: 1
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (isEditing && region) {
        setFormData({
          name: region.name || '',
          countryId: region.countryId || undefined,
          status: region.status ?? 1
        })
      } else {
        setFormData({
          name: '',
          countryId: undefined,
          status: 1
        })
      }
    }
  }, [isOpen, isEditing, region])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving region:', error)
      alert(`Failed to save region: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (name === 'countryId' || name === 'status' ? Number(value) : value)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold">
            {isEditing ? 'Edit Region' : 'Add New Region'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Region Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter region name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Country *
            </label>
            <select
              name="countryId"
              value={formData.countryId || ''}
              onChange={handleChange}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Status
            </label>
            <select
              name="status"
              value={formData.status ?? 1}
              onChange={handleChange}
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
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
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Regions: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [deletingRegion, setDeletingRegion] = useState<number | null>(null)

  useEffect(() => {
    fetchRegions()
    fetchCountries()
  }, [])

  const fetchRegions = async () => {
    try {
      console.log('🌍 [Regions] Fetching regions...')
      setLoading(true)
      const data = await adminApiService.getRegions()
      console.log('✅ [Regions] Regions fetched:', data)
      setRegions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [Regions] Error fetching regions:', error)
      setRegions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCountries = async () => {
    try {
      console.log('🌍 [Regions] Fetching countries...')
      const data = await adminApiService.getCountries()
      console.log('✅ [Regions] Countries fetched:', data)
      setCountries(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [Regions] Error fetching countries:', error)
      setCountries([])
    }
  }

  const handleCreate = () => {
    setEditingRegion(null)
    setIsModalOpen(true)
  }

  const handleEdit = (region: Region) => {
    setEditingRegion(region)
    setIsModalOpen(true)
  }

  const handleSave = async (regionData: Partial<Region>) => {
    try {
      if (editingRegion) {
        await adminApiService.updateRegion(editingRegion.id, regionData)
      } else {
        await adminApiService.createRegion(regionData as Omit<Region, 'id'>)
      }
      await fetchRegions()
    } catch (error) {
      console.error('Error saving region:', error)
      throw error
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this region? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingRegion(id)
      await adminApiService.deleteRegion(id)
      await fetchRegions()
    } catch (error) {
      console.error('Error deleting region:', error)
      alert(`Failed to delete region: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setDeletingRegion(null)
    }
  }

  const getCountryName = (countryId: number) => {
    const country = countries.find(c => c.id === countryId)
    return country?.name || 'Unknown'
  }

  const filteredRegions = regions.filter(region =>
    region.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCountryName(region.countryId).toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-xs font-bold text-gray-900">Regions</h1>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="h-2.5 w-2.5" />
            Add
          </button>
        </div>

        {/* Search */}
        <div className="mb-2">
          <div className="relative">
            <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Regions Table */}
        {filteredRegions.length === 0 ? (
          <div className="bg-white rounded border p-3 text-center text-[10px] text-gray-500">
            No regions found
          </div>
        ) : (
          <div className="bg-white rounded border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Name</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Country</th>
                  <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRegions.map((region) => (
                  <tr key={region.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-[10px]">{region.name}</td>
                    <td className="px-2 py-1 text-[10px] text-gray-600">{getCountryName(region.countryId)}</td>
                    <td className="px-2 py-1 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(region)}
                          className="p-0.5 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(region.id)}
                          disabled={deletingRegion === region.id}
                          className="p-0.5 text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingRegion === region.id ? (
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

        {/* Modal */}
        <RegionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingRegion(null)
          }}
          region={editingRegion}
          onSave={handleSave}
          isEditing={!!editingRegion}
          countries={countries}
        />
      </div>
    </div>
  )
}

export default Regions

