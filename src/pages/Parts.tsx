import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Category } from '../services/api'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Package,
  XCircle,
  Hash,
  DollarSign,
  Building2,
  Folder,
  Filter
} from 'lucide-react'

interface Part {
  id: number
  part_number: string
  name: string
  description?: string
  category?: string
  manufacturer?: string
  unit_price?: number
  stock_quantity?: number
  min_stock_level?: number
  location?: string
  created_at: string
  updated_at: string
}

interface PartModalProps {
  isOpen: boolean
  onClose: () => void
  part?: Part | null
  onSave: (partData: Partial<Part>) => Promise<void>
  isEditing: boolean
}

const PartModal: React.FC<PartModalProps> = ({ 
  isOpen, 
  onClose, 
  part, 
  onSave, 
  isEditing 
}) => {
  const [formData, setFormData] = useState<Partial<Part>>({
    part_number: '',
    name: '',
    description: '',
    category: '',
    manufacturer: '',
    unit_price: undefined,
    min_stock_level: undefined
  })
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      if (isEditing && part) {
        setFormData({
          part_number: part.part_number || '',
          name: part.name || '',
          description: part.description || '',
          category: part.category || '',
          manufacturer: part.manufacturer || '',
          unit_price: part.unit_price,
          min_stock_level: part.min_stock_level
        })
      } else {
        setFormData({
          part_number: '',
          name: '',
          description: '',
          category: '',
          manufacturer: '',
          unit_price: undefined,
          min_stock_level: undefined
        })
      }
    }
  }, [isOpen, isEditing, part])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const data = await adminApiService.getCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving part:', error)
      alert(`Failed to save part: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'unit_price' || name === 'min_stock_level') 
        ? (value ? Number(value) : undefined) 
        : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-3 border-b">
          <h2 className="text-base font-semibold text-gray-900">
            {isEditing ? 'Edit Part' : 'Add New Part'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Part Number */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Part Number *
                </label>
                <input
                  type="text"
                  name="part_number"
                  value={formData.part_number || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter part number"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Part Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter part name"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  disabled={loadingCategories}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {loadingCategories && (
                  <p className="text-[9px] text-gray-500 mt-0.5">Loading categories...</p>
                )}
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer || ''}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter manufacturer"
                />
              </div>

              {/* Unit Price */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price || ''}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter unit price"
                />
              </div>

              {/* Min Stock Level */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  name="min_stock_level"
                  value={formData.min_stock_level || ''}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter minimum stock level"
                />
              </div>

            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter part description"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const Parts: React.FC = () => {
  const navigate = useNavigate()
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)
  const [deletingPart, setDeletingPart] = useState<number | null>(null)

  useEffect(() => {
    fetchParts()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await adminApiService.getCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  const fetchParts = async () => {
    try {
      console.log('📦 [Parts] Fetching parts from database...')
      setLoading(true)
      const data = await adminApiService.getParts()
      console.log('✅ [Parts] Parts fetched from database:', data)
      setParts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [Parts] Error fetching parts:', error)
      setParts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingPart(null)
    setIsModalOpen(true)
  }

  const handleEdit = (part: Part) => {
    setEditingPart(part)
    setIsModalOpen(true)
  }

  const handleSave = async (partData: Partial<Part>) => {
    try {
      if (editingPart) {
        console.log('Updating part in database:', editingPart.id, partData)
        await adminApiService.updatePart(editingPart.id, partData)
      } else {
        console.log('Creating part in database:', partData)
        await adminApiService.createPart(partData as Omit<Part, 'id' | 'created_at' | 'updated_at'>)
      }
      await fetchParts()
    } catch (error) {
      console.error('Error saving part:', error)
      throw error
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingPart(id)
      console.log('Deleting part from database:', id)
      await adminApiService.deletePart(id)
      await fetchParts()
    } catch (error) {
      console.error('Error deleting part:', error)
      alert(`Failed to delete part: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setDeletingPart(null)
    }
  }

  const filteredParts = parts.filter(part => {
    const matchesSearch = 
      part.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || part.category === selectedCategory
    
    return matchesSearch && matchesCategory
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
            <Package className="h-5 w-5 text-blue-600" />
            <h1 className="text-base font-bold text-gray-900">Parts</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/categories')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors shadow-sm"
            >
              <Folder className="h-4 w-4" />
              Manage Categories
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Part
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-2 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
            <input
              type="text"
              placeholder="Search parts by number, name, category, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="w-48 relative">
            <Filter className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Parts Table */}
        {filteredParts.length === 0 ? (
          <div className="bg-white rounded border p-3 text-center text-[10px] text-gray-500">
            {searchTerm ? 'No parts found matching your search' : 'No parts registered'}
          </div>
        ) : (
          <div className="bg-white rounded border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Part Number</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Name</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Category</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Manufacturer</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Unit Price</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Stock</th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredParts.map((part) => (
                    <tr key={part.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-[10px] font-medium">
                        <div className="flex items-center gap-1">
                          <Hash className="h-2.5 w-2.5 text-gray-400" />
                          {part.part_number}
                        </div>
                      </td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">{part.name}</td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">{part.category || '-'}</td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">{part.manufacturer || '-'}</td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">
                        {part.unit_price ? `$${part.unit_price.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">
                        <div className="flex items-center gap-1">
                          <Package className="h-2.5 w-2.5 text-gray-400" />
                          {part.stock_quantity !== undefined ? part.stock_quantity : '-'}
                          {part.min_stock_level !== undefined && part.stock_quantity !== undefined && (
                            <span className={`text-[9px] ${
                              part.stock_quantity <= part.min_stock_level ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              (min: {part.min_stock_level})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(part)}
                            className="p-0.5 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(part.id)}
                            disabled={deletingPart === part.id}
                            className="p-0.5 text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingPart === part.id ? (
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
          Showing {filteredParts.length} of {parts.length} parts
        </div>

        {/* Part Modal */}
        <PartModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingPart(null)
          }}
          part={editingPart}
          onSave={handleSave}
          isEditing={!!editingPart}
        />
      </div>
    </div>
  )
}

export default Parts

