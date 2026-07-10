import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Category } from '../services/api'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  X,
  Hash,
  Building2,
  Folder,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Tag,
  ClipboardList,
} from 'lucide-react'

interface Part {
  id: number
  part_number: string
  name: string
  description?: string
  category?: string
  manufacturer?: string
  unit_price?: number
  unit_price_usd?: number
  selling_price?: number
  selling_price_usd?: number
  stock_quantity?: number
  min_stock_level?: number
  location?: string
  status?: string
  created_at: string
  updated_at: string
}

const STATUS_OPTIONS = ['In Stock', 'Out of Stock', 'Ordered', 'Need to Order', 'Other']

const STATUS_STYLES: Record<string, string> = {
  'In Stock': 'bg-emerald-100 text-emerald-700',
  'Out of Stock': 'bg-red-100 text-red-700',
  'Ordered': 'bg-blue-100 text-blue-700',
  'Need to Order': 'bg-amber-100 text-amber-700',
  'Other': 'bg-gray-100 text-gray-600',
}

/* ── Add / Edit modal ── */
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
    unit_price_usd: undefined,
    selling_price: undefined,
    selling_price_usd: undefined,
    min_stock_level: undefined,
    status: ''
  })
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    fetchCategories()
    setFormData(isEditing && part ? {
      part_number: part.part_number || '',
      name: part.name || '',
      description: part.description || '',
      category: part.category || '',
      manufacturer: part.manufacturer || '',
      unit_price: part.unit_price,
      unit_price_usd: part.unit_price_usd,
      selling_price: part.selling_price,
      selling_price_usd: part.selling_price_usd,
      min_stock_level: part.min_stock_level,
      status: part.status || ''
    } : {
      part_number: '', name: '', description: '', category: '',
      manufacturer: '', unit_price: undefined, unit_price_usd: undefined,
      selling_price: undefined, selling_price_usd: undefined, min_stock_level: undefined,
      status: ''
    })
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

  const NUMERIC_FIELDS = ['unit_price', 'unit_price_usd', 'selling_price', 'selling_price_usd', 'min_stock_level']

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: NUMERIC_FIELDS.includes(name)
        ? (value ? Number(value) : undefined)
        : value
    }))
  }

  const inp = 'w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400'
  const inpPlain = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1.5'
  const iconWrap = 'relative'
  const fieldIcon = 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center">
              <Package className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {isEditing ? 'Edit Part' : 'Add New Part'}
              </h2>
              <p className="text-xs text-gray-400">
                {isEditing ? 'Update part details' : 'Register a new part in inventory'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg p-1.5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Part Number *</label>
              <div className={iconWrap}>
                <Hash className={fieldIcon} />
                <input
                  type="text" name="part_number" value={formData.part_number || ''}
                  onChange={handleChange} required className={inp} placeholder="Enter part number"
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Part Name *</label>
              <div className={iconWrap}>
                <Package className={fieldIcon} />
                <input
                  type="text" name="name" value={formData.name || ''}
                  onChange={handleChange} required className={inp} placeholder="Enter part name"
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Category</label>
              <div className={iconWrap}>
                <Tag className={fieldIcon} />
                <select
                  name="category" value={formData.category || ''} onChange={handleChange}
                  disabled={loadingCategories} className={inp + ' disabled:bg-gray-50 disabled:cursor-not-allowed'}
                >
                  <option value="">{loadingCategories ? 'Loading categories…' : 'Select category'}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={lbl}>Manufacturer</label>
              <div className={iconWrap}>
                <Building2 className={fieldIcon} />
                <input
                  type="text" name="manufacturer" value={formData.manufacturer || ''}
                  onChange={handleChange} className={inp} placeholder="Enter manufacturer"
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Status</label>
              <div className={iconWrap}>
                <ClipboardList className={fieldIcon} />
                <select
                  name="status" value={formData.status || ''} onChange={handleChange}
                  className={inp}
                >
                  <option value="">Select status</option>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={lbl}>Unit Cost (KES)</label>
              <div className={iconWrap}>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none">KES</span>
                <input
                  type="number" name="unit_price" value={formData.unit_price ?? ''}
                  onChange={handleChange} min="0" step="0.01"
                  className={inp + ' pl-11'} placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Unit Cost (USD)</label>
              <div className={iconWrap}>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none">USD</span>
                <input
                  type="number" name="unit_price_usd" value={formData.unit_price_usd ?? ''}
                  onChange={handleChange} min="0" step="0.01"
                  className={inp + ' pl-11'} placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Selling Price (KES) *</label>
              <div className={iconWrap}>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none">KES</span>
                <input
                  type="number" name="selling_price" value={formData.selling_price ?? ''}
                  onChange={handleChange} required min="0" step="0.01"
                  className={inp + ' pl-11'} placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Selling Price (USD) *</label>
              <div className={iconWrap}>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none">USD</span>
                <input
                  type="number" name="selling_price_usd" value={formData.selling_price_usd ?? ''}
                  onChange={handleChange} required min="0" step="0.01"
                  className={inp + ' pl-11'} placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Minimum Stock Level</label>
              <input
                type="number" name="min_stock_level" value={formData.min_stock_level ?? ''}
                onChange={handleChange} min="0"
                className={inpPlain} placeholder="e.g. 5"
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Description</label>
            <textarea
              name="description" value={formData.description || ''} onChange={handleChange}
              rows={3} className={inpPlain + ' resize-none'} placeholder="Enter part description"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main page ── */
const PAGE_SIZE = 15

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
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

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
      setLoading(true)
      const data = await adminApiService.getParts()
      setParts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching parts:', error)
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
    if (editingPart) {
      await adminApiService.updatePart(editingPart.id, partData)
    } else {
      await adminApiService.createPart(partData as Omit<Part, 'id' | 'created_at' | 'updated_at'>)
    }
    await fetchParts()
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      setUpdatingStatusId(id)
      await adminApiService.updatePart(id, { status })
      setParts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    } catch (error) {
      console.error('Error updating status:', error)
      alert(`Failed to update status: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this part? This action cannot be undone.')) return
    try {
      setDeletingPart(id)
      await adminApiService.deletePart(id)
      await fetchParts()
    } catch (error) {
      console.error('Error deleting part:', error)
      alert(`Failed to delete part: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setDeletingPart(null)
    }
  }

  const filtered = parts.filter(part => {
    const q = searchTerm.toLowerCase()
    const matchesSearch = !q || [part.part_number, part.name, part.description, part.category, part.manufacturer]
      .some(v => v?.toLowerCase().includes(q))
    const matchesCategory = !selectedCategory || part.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const lowStockCount = parts.filter(p =>
    p.stock_quantity != null && p.min_stock_level != null && p.stock_quantity <= p.min_stock_level
  ).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Page header ── */}
      <div className="text-white px-5 py-3" style={{ backgroundColor: '#0b0f24' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-sm font-bold whitespace-nowrap">Parts</h1>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">
                {parts.length} total
              </span>
              {lowStockCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-[10px] text-red-300">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {lowStockCount} low stock
                </span>
              )}
            </div>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input
              type="text"
              placeholder="Search parts…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setPage(1) }}
              className="pl-7 pr-6 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
            >
              <option value="" className="text-gray-900">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name} className="text-gray-900">{category.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigate('/categories')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Folder className="h-3.5 w-3.5" />
            Categories
          </button>

          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Part
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Package className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No parts found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm || selectedCategory ? 'Try adjusting your search or filter' : 'Get started by adding your first part'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Part Number</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Cost (KES)</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Cost (USD)</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Selling Price (KES)</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Stock</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Stock Value</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(part => {
                  const isLowStock = part.stock_quantity != null && part.min_stock_level != null
                    && part.stock_quantity <= part.min_stock_level
                  return (
                    <tr key={part.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-1.5">
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                          <Hash className="h-2.5 w-2.5 text-gray-400" />
                          {part.part_number}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 text-xs font-medium text-gray-900 whitespace-nowrap">{part.name}</td>
                      <td className="px-4 py-1.5">
                        {part.category
                          ? <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700">
                              {part.category}
                            </span>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {part.unit_price != null ? `KES ${part.unit_price.toFixed(2)}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {part.unit_price_usd != null ? `$${part.unit_price_usd.toFixed(2)}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {part.selling_price != null ? `KES ${part.selling_price.toFixed(2)}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
                            {part.stock_quantity != null ? part.stock_quantity : '—'}
                          </span>
                          {isLowStock && (
                            <span className="flex items-center gap-0.5 text-[9px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              min {part.min_stock_level}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-1.5 text-xs font-medium text-gray-700 whitespace-nowrap">
                        {part.stock_quantity != null && part.unit_price != null
                          ? `KES ${(part.stock_quantity * part.unit_price).toFixed(2)}`
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="relative inline-block">
                          <select
                            value={part.status || ''}
                            onChange={e => handleStatusChange(part.id, e.target.value)}
                            disabled={updatingStatusId === part.id}
                            className={`appearance-none pl-2 pr-6 py-0.5 rounded-full text-[10px] font-medium border-0 outline-none cursor-pointer disabled:opacity-50 ${
                              part.status ? STATUS_STYLES[part.status] || STATUS_STYLES['Other'] : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <option value="" disabled>Set status</option>
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {updatingStatusId === part.id && (
                            <Loader2 className="absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 animate-spin" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(part)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(part.id)}
                            disabled={deletingPart === part.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Delete"
                          >
                            {deletingPart === part.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-xs text-gray-400">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '…'
                    ? <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
                    : <button key={n}
                        onClick={() => setPage(n as number)}
                        className={`w-7 h-7 text-xs rounded-lg border transition-colors ${
                          safePage === n
                            ? 'bg-green-600 border-green-600 text-white font-semibold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}>
                        {n}
                      </button>
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating add button ── */}
      <button
        onClick={handleCreate}
        className="fixed bottom-6 right-6 w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-40"
        title="Add Part"
      >
        <Plus className="h-5 w-5" />
      </button>

      <PartModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPart(null) }}
        part={editingPart}
        onSave={handleSave}
        isEditing={!!editingPart}
      />
    </div>
  )
}

export default Parts
