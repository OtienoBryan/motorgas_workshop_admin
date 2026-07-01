import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApiService, FuelPrice, Station } from '../services/api'
import { 
  ArrowLeft,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react'

const FuelPrices: React.FC = () => {
  const { stationId } = useParams<{ stationId: string }>()
  const navigate = useNavigate()
  const [station, setStation] = useState<Station | null>(null)
  const [history, setHistory] = useState<FuelPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    price: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [editingPrice, setEditingPrice] = useState<FuelPrice | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    price: '',
    notes: ''
  })
  const [deletingPrice, setDeletingPrice] = useState<number | null>(null)

  useEffect(() => {
    if (stationId) {
      fetchStation()
      fetchHistory()
    }
  }, [stationId])

  const fetchStation = async () => {
    if (!stationId) return
    try {
      const stations = await adminApiService.getStations()
      const foundStation = stations.find(s => s.id === Number(stationId))
      setStation(foundStation || null)
    } catch (error) {
      console.error('Error fetching station:', error)
    }
  }

  const fetchHistory = async () => {
    if (!stationId) return
    try {
      setLoading(true)
      const data = await adminApiService.getFuelPricesByStation(Number(stationId))
      setHistory(data)
    } catch (error) {
      console.error('Error fetching fuel price history:', error)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stationId) return

    try {
      setSaving(true)
      await adminApiService.createFuelPrice({
        stationId: Number(stationId),
        price: Number(formData.price),
        fuelType: null,
        notes: formData.notes || null
      })
      await fetchHistory()
      await fetchStation() // Refresh station to get updated price
      setFormData({ price: '', notes: '' })
    } catch (error) {
      console.error('Error saving fuel price:', error)
      alert(`Failed to save fuel price: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (price: FuelPrice) => {
    setEditingPrice(price)
    setEditFormData({
      price: String(price.price),
      notes: price.notes || ''
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPrice) return

    try {
      setSaving(true)
      await adminApiService.updateFuelPrice(editingPrice.id, {
        price: Number(editFormData.price),
        notes: editFormData.notes || null
      })
      await fetchHistory()
      await fetchStation() // Refresh station to get updated price
      setIsEditModalOpen(false)
      setEditingPrice(null)
      setEditFormData({ price: '', notes: '' })
    } catch (error) {
      console.error('Error updating fuel price:', error)
      alert(`Failed to update fuel price: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fuel price entry? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingPrice(id)
      await adminApiService.deleteFuelPrice(id)
      await fetchHistory()
      await fetchStation() // Refresh station to get updated price
    } catch (error) {
      console.error('Error deleting fuel price:', error)
      alert(`Failed to delete fuel price: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setDeletingPrice(null)
    }
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

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
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => navigate('/stations')}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Back to Stations"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xs font-bold text-gray-900">
            Fuel Prices - {station?.name || 'Unknown Station'}
          </h1>
        </div>

        {/* Form */}
        <div className="mb-2 bg-white rounded border p-2">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Add Price'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional notes..."
              />
            </div>
          </form>
        </div>

        {/* History Table */}
        <div className="bg-white rounded border overflow-hidden">
          <div className="p-2 border-b bg-gray-50">
            <h2 className="text-xs font-medium text-gray-700">Price History</h2>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-gray-500">
              No price history available
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Date</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Price</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Notes</th>
                  <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((price) => (
                  <tr key={price.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-[10px]">{formatDate(price.created_at)}</td>
                    <td className="px-2 py-1 text-[10px] font-medium">{Number(price.price).toFixed(2)}</td>
                    <td className="px-2 py-1 text-[10px] text-gray-600">{price.notes || '-'}</td>
                    <td className="px-2 py-1 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(price)}
                          className="p-0.5 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(price.id)}
                          disabled={deletingPrice === price.id}
                          className="p-0.5 text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingPrice === price.id ? (
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
          )}
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && editingPrice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-2 w-full max-w-md">
              <div className="flex justify-between items-center mb-1.5">
                <h2 className="text-sm font-semibold">Edit Fuel Price</h2>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingPrice(null)
                    setEditFormData({ price: '', notes: '' })
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-1.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={editFormData.price}
                    onChange={handleEditChange}
                    required
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={editFormData.notes}
                    onChange={handleEditChange}
                    rows={2}
                    className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional notes..."
                  />
                </div>
                <div className="flex justify-end gap-1 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setEditingPrice(null)
                      setEditFormData({ price: '', notes: '' })
                    }}
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
                    {saving ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FuelPrices

