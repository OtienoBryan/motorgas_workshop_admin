import React, { useState, useEffect } from 'react'
import { adminApiService, PartCategory } from '../services/api'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  X,
  Tag,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

const PAGE_SIZE = 20

const PartCategories: React.FC = () => {
  const [categories, setCategories]   = useState<PartCategory[]>([])
  const [loading, setLoading]         = useState(true)
  const [searchTerm, setSearchTerm]   = useState('')
  const [page, setPage]               = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing]         = useState<PartCategory | null>(null)
  const [deleting, setDeleting]       = useState<number | null>(null)

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setCategories(await adminApiService.getPartCategories())
    } catch { setCategories([]) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category? Parts using it will keep their category text.')) return
    try {
      setDeleting(id)
      await adminApiService.deletePartCategory(id)
      await fetchCategories()
    } catch (e: any) {
      alert(`Failed to delete: ${e.message}`)
    } finally { setDeleting(null) }
  }

  const filtered = categories.filter(c => {
    const q = searchTerm.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const active   = categories.filter(c => c.is_active).length
  const inactive = categories.length - active

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="text-white px-5 py-3" style={{ backgroundColor: '#0b0f24' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-sm font-bold whitespace-nowrap">Part Categories</h1>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">{categories.length} total</span>
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-[10px] text-green-300">{active} active</span>
              {inactive > 0 && <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/50">{inactive} inactive</span>}
            </div>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input
              type="text" placeholder="Search categories…" value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <button
            onClick={() => { setEditing(null); setIsModalOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" /> Add Category
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Tag className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No categories found</p>
            <p className="text-xs text-gray-400 mt-1">Add your first part category to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">#</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(cat => (
                  <tr key={cat.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">#{cat.id}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                          <Tag className="h-3 w-3 text-indigo-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 max-w-xs truncate">
                      {cat.description || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {cat.is_active ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(cat); setIsModalOpen(true) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={deleting === cat.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          {deleting === cat.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-xs text-gray-400">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(n); return acc
                }, [])
                .map((n, i) => n === '…'
                  ? <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
                  : <button key={n} onClick={() => setPage(n as number)}
                      className={`w-7 h-7 text-xs rounded-lg border transition-colors ${safePage === n ? 'bg-green-600 border-green-600 text-white font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                      {n}
                    </button>
                )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating add button */}
      <button
        onClick={() => { setEditing(null); setIsModalOpen(true) }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-40"
        title="Add Category"
      >
        <Plus className="h-5 w-5" />
      </button>

      {isModalOpen && (
        <CategoryModal
          category={editing}
          onClose={() => { setIsModalOpen(false); setEditing(null) }}
          onSaved={fetchCategories}
        />
      )}
    </div>
  )
}

/* ── Add / Edit modal ── */
interface CategoryModalProps {
  category: PartCategory | null
  onClose: () => void
  onSaved: () => void
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, onClose, onSaved }) => {
  const [form, setForm] = useState({ name: '', description: '', is_active: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (category) {
      setForm({ name: category.name, description: category.description || '', is_active: category.is_active })
    } else {
      setForm({ name: '', description: '', is_active: true })
    }
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = { name: form.name, description: form.description || null, is_active: form.is_active }
      if (category) {
        await adminApiService.updatePartCategory(category.id, payload)
      } else {
        await adminApiService.createPartCategory(payload)
      }
      onSaved()
      onClose()
    } catch (err: any) {
      alert(`Failed to save: ${err.message || 'Unknown error'}`)
    } finally { setSaving(false) }
  }

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{category ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className={lbl}>Name *</label>
            <input className={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Filters" />
          </div>
          <div>
            <label className={lbl}>Description</label>
            <textarea rows={2} className={inp + ' resize-none'} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description…" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
            <label htmlFor="is_active" className="text-xs font-medium text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : category ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PartCategories
