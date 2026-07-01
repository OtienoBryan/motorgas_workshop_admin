import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Station, Region } from '../services/api'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Fuel,
  XCircle
} from 'lucide-react'

interface StationModalProps {
  isOpen: boolean
  onClose: () => void
  station?: Station | null
  onSave: (stationData: Partial<Station>) => Promise<void>
  isEditing: boolean
  regions: Region[]
}

const StationModal: React.FC<StationModalProps> = ({ isOpen, onClose, station, onSave, isEditing, regions }) => {
  const [formData, setFormData] = useState<Partial<Station>>({
    name: '',
    regionId: undefined,
    contact: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (isEditing && station) {
        setFormData({
          name: station.name || '',
          regionId: station.regionId || undefined,
          contact: station.contact || ''
        })
      } else {
        setFormData({
          name: '',
          regionId: undefined,
          contact: ''
        })
      }
    }
  }, [isOpen, isEditing, station])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving station:', error)
      alert(`Failed to save station: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'regionId' ? Number(value) : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold">
            {isEditing ? 'Edit Station' : 'Add New Station'}
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
              Station Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter station name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Region *
            </label>
            <select
              name="regionId"
              value={formData.regionId || ''}
              onChange={handleChange}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Contact
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact || ''}
              onChange={handleChange}
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter contact information"
            />
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

const Stations: React.FC = () => {
  const navigate = useNavigate()
  const [stations, setStations] = useState<Station[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStation, setEditingStation] = useState<Station | null>(null)
  const [deletingStation, setDeletingStation] = useState<number | null>(null)

  useEffect(() => {
    fetchStations()
    fetchRegions()
  }, [])

  const fetchStations = async () => {
    try {
      console.log('🚉 [Stations] Fetching stations...')
      setLoading(true)
      const data = await adminApiService.getStations()
      console.log('✅ [Stations] Stations fetched:', data)
      setStations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [Stations] Error fetching stations:', error)
      setStations([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRegions = async () => {
    try {
      console.log('🚉 [Stations] Fetching regions...')
      const data = await adminApiService.getRegions()
      console.log('✅ [Stations] Regions fetched:', data)
      setRegions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [Stations] Error fetching regions:', error)
      setRegions([])
    }
  }

  const handleCreate = () => {
    setEditingStation(null)
    setIsModalOpen(true)
  }

  const handleEdit = (station: Station) => {
    setEditingStation(station)
    setIsModalOpen(true)
  }

  const handleSave = async (stationData: Partial<Station>) => {
    try {
      if (editingStation) {
        await adminApiService.updateStation(editingStation.id, stationData)
      } else {
        await adminApiService.createStation(stationData as Omit<Station, 'id'>)
      }
      await fetchStations()
    } catch (error) {
      console.error('Error saving station:', error)
      throw error
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this station? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingStation(id)
      await adminApiService.deleteStation(id)
      await fetchStations()
    } catch (error) {
      console.error('Error deleting station:', error)
      alert(`Failed to delete station: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setDeletingStation(null)
    }
  }

  const getRegionName = (regionId: number) => {
    const region = regions.find(r => r.id === regionId)
    return region?.name || 'Unknown'
  }

  const filteredStations = stations.filter(station =>
    station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRegionName(station.regionId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.contact?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-xs font-bold text-gray-900">Stations</h1>
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

        {/* Stations Table */}
        {filteredStations.length === 0 ? (
          <div className="bg-white rounded border p-3 text-center text-[10px] text-gray-500">
            No stations found
          </div>
        ) : (
          <div className="bg-white rounded border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Name</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Region</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Contact</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Price</th>
                  <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStations.map((station) => (
                  <tr key={station.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-[10px]">{station.name}</td>
                    <td className="px-2 py-1 text-[10px] text-gray-600">{getRegionName(station.regionId)}</td>
                    <td className="px-2 py-1 text-[10px] text-gray-600">{station.contact || '-'}</td>
                    <td className="px-2 py-1 text-[10px] font-medium">{station.price ? `${Number(station.price).toFixed(2)}` : '-'}</td>
                    <td className="px-2 py-1 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/stations/${station.id}/fuel-prices`)}
                          className="p-0.5 text-green-600 hover:text-green-800"
                          title="Fuel Prices"
                        >
                          <Fuel className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleEdit(station)}
                          className="p-0.5 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(station.id)}
                          disabled={deletingStation === station.id}
                          className="p-0.5 text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingStation === station.id ? (
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

        {/* Station Modal */}
        <StationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingStation(null)
          }}
          station={editingStation}
          onSave={handleSave}
          isEditing={!!editingStation}
          regions={regions}
        />
      </div>
    </div>
  )
}

export default Stations

