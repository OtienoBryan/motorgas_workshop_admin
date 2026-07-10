import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Store, Part, PartCategory } from '../services/api'
import {
  Package,
  Store as StoreIcon,
  Search,
  AlertCircle,
  CheckCircle2,
  Edit,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Tag,
  Wrench
} from 'lucide-react'

interface Inventory {
  id: number
  store_id: number
  part_id: number
  quantity: number
  min_stock_level?: number | null
  location?: string | null
  last_updated: string
  store?: Store
  part?: Part
}

const UNITS = ['pcs', 'litres', 'kg', 'metres', 'box', 'set', 'pair', 'roll', 'sheet', 'can', 'bottle', 'drum', 'bag', 'carton']

const STATUS_OPTIONS = ['In Stock', 'Out of Stock', 'Ordered', 'Need to Order', 'Other']

const STATUS_STYLES: Record<string, string> = {
  'In Stock': 'bg-emerald-100 text-emerald-700',
  'Out of Stock': 'bg-red-100 text-red-700',
  'Ordered': 'bg-blue-100 text-blue-700',
  'Need to Order': 'bg-amber-100 text-amber-700',
  'Other': 'bg-gray-100 text-gray-600',
}

/* ── Stock status helper ── */
function stockStatus(qty: number, min?: number | null) {
  if (qty === 0)                              return { label: 'Out',  color: 'text-gray-500',  bg: 'bg-gray-100'  }
  if (min != null && qty <= min)              return { label: 'Low',  color: 'text-red-600',   bg: 'bg-red-50'    }
  return                                             { label: 'OK',   color: 'text-green-700', bg: 'bg-green-50'  }
}

/* ── Edit part details modal ── */
interface EditPartModalProps {
  isOpen: boolean
  onClose: () => void
  part: Part | null
  onSaved: () => void
}

const EditPartModal: React.FC<EditPartModalProps> = ({ isOpen, onClose, part, onSaved }) => {
  const [form, setForm] = useState<Partial<Part>>({})
  const [saving, setSaving] = useState(false)
  const [partCategories, setPartCategories] = useState<PartCategory[]>([])

  useEffect(() => {
    if (isOpen && part) {
      setForm({ ...part })
      adminApiService.getPartCategories().then(setPartCategories).catch(() => setPartCategories([]))
    }
  }, [isOpen, part])

  const set = (k: keyof Part, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const { id, created_at, updated_at, stock_quantity, ...payload } = form as any
      await adminApiService.updatePart(part!.id, payload)
      onSaved()
      onClose()
    } catch (err: any) {
      alert(`Failed to save: ${err.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !part) return null

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Edit Part</h2>
            <p className="text-xs text-gray-400 mt-0.5">{part.part_number}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Part Number *</label>
              <input className={inp} value={form.part_number || ''} onChange={e => set('part_number', e.target.value)} required />
            </div>
            <div>
              <label className={lbl}>Name *</label>
              <input className={inp} value={form.name || ''} onChange={e => set('name', e.target.value)} required />
            </div>
          </div>

          <div>
            <label className={lbl}>Description</label>
            <textarea rows={2} className={inp + ' resize-none'} value={form.description || ''} placeholder="Part description…"
              onChange={e => set('description', e.target.value || null)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Category</label>
              <select className={inp} value={form.category || ''} onChange={e => set('category', e.target.value || null)}>
                <option value="">— Select category —</option>
                {partCategories.filter(c => c.is_active).map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Manufacturer</label>
              <input className={inp} value={form.manufacturer || ''} placeholder="Enter manufacturer"
                onChange={e => set('manufacturer', e.target.value || null)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Unit</label>
              <select className={inp} value={form.unit || ''} onChange={e => set('unit', e.target.value || null)}>
                <option value="">— Select unit —</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Location</label>
              <input className={inp} value={form.location || ''} placeholder="e.g. Shelf A3"
                onChange={e => set('location', e.target.value || null)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Cost (KES)</label>
              <input type="number" step="0.01" min="0" className={inp} value={form.unit_price ?? ''} placeholder="0.00"
                onChange={e => set('unit_price', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label className={lbl}>Cost (USD)</label>
              <input type="number" step="0.01" min="0" className={inp} value={form.unit_price_usd ?? ''} placeholder="0.00"
                onChange={e => set('unit_price_usd', e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Selling Price (KES)</label>
              <input type="number" step="0.01" min="0" className={inp} value={form.selling_price ?? ''} placeholder="0.00"
                onChange={e => set('selling_price', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label className={lbl}>Selling Price (USD)</label>
              <input type="number" step="0.01" min="0" className={inp} value={form.selling_price_usd ?? ''} placeholder="0.00"
                onChange={e => set('selling_price_usd', e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={form.status || ''} onChange={e => set('status', e.target.value)}>
                <option value="">Select status</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Alert Quantity</label>
              <input type="number" min="0" className={inp} value={form.min_stock_level ?? ''} placeholder="0"
                onChange={e => set('min_stock_level', e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>

          <div>
            <label className={lbl}>Notes</label>
            <textarea rows={2} className={inp + ' resize-none'} value={form.notes || ''} placeholder="Internal notes…"
              onChange={e => set('notes', e.target.value || null)} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Update inventory modal ── */
interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  part: Part | null
  stores: Store[]
  inventory: Inventory[]
  onSave: (updates: { store_id: number; quantity: number; min_stock_level: number; location: string | null }[]) => Promise<void>
}

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, part, stores, inventory, onSave }) => {
  const [storeData, setStoreData] = useState<Record<number, { quantity: number; min_stock_level: number; location: string | null }>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !part || stores.length === 0) return
    const init: typeof storeData = {}
    stores.forEach(s => {
      const ex = inventory.find(i => i.store_id === s.id && i.part_id === part.id)
      init[s.id] = ex
        ? { quantity: ex.quantity, min_stock_level: ex.min_stock_level ?? 0, location: ex.location ?? null }
        : { quantity: 0, min_stock_level: 0, location: null }
    })
    setStoreData(init)
    setError(null)
  }, [isOpen, part, stores, inventory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (Object.values(storeData).some(d => d.quantity < 0)) {
      setError('Quantities must be 0 or greater')
      return
    }
    try {
      setSaving(true)
      await onSave(Object.entries(storeData).map(([id, d]) => ({
        store_id: Number(id), quantity: d.quantity,
        min_stock_level: d.min_stock_level, location: d.location
      })))
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update inventory')
    } finally {
      setSaving(false)
    }
  }

  const set = (storeId: number, field: 'quantity' | 'min_stock_level' | 'location', val: number | string | null) =>
    setStoreData(p => ({ ...p, [storeId]: { ...p[storeId], [field]: val } }))

  if (!isOpen || !part) return null

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
  const lbl = 'block text-xs font-medium text-gray-500 mb-1'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Update Inventory</h2>
            <p className="text-xs text-gray-400 mt-0.5">{part.part_number} — {part.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2 rounded-lg">{error}</div>
          )}

          {stores.map(store => {
            const d = storeData[store.id] ?? { quantity: 0, min_stock_level: 0, location: null }
            const s = stockStatus(d.quantity, d.min_stock_level)
            return (
              <div key={store.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StoreIcon className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-800">{store.store_name}</span>
                    {store.store_code && <span className="text-[10px] text-gray-400">({store.store_code})</span>}
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={lbl}>Quantity *</label>
                    <input type="number" min="0" value={d.quantity} required className={inp}
                      onChange={e => set(store.id, 'quantity', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className={lbl}>Min Stock</label>
                    <input type="number" min="0" value={d.min_stock_level} className={inp}
                      onChange={e => set(store.id, 'min_stock_level', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className={lbl}>Location</label>
                    <input type="text" value={d.location || ''} className={inp} placeholder="e.g. Shelf A3"
                      onChange={e => set(store.id, 'location', e.target.value || null)} />
                  </div>
                </div>
              </div>
            )
          })}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main page ── */
const PAGE_SIZE = 20

const Inventory: React.FC = () => {
  const navigate = useNavigate()
  const [inventory, setInventory]       = useState<Inventory[]>([])
  const [parts, setParts]               = useState<Part[]>([])
  const [stores, setStores]             = useState<Store[]>([])
  const [loading, setLoading]           = useState(true)
  const [searchTerm, setSearchTerm]     = useState('')
  const [isModalOpen, setIsModalOpen]         = useState(false)
  const [editingPart, setEditingPart]         = useState<Part | null>(null)
  const [isEditPartOpen, setIsEditPartOpen]   = useState(false)
  const [editPartTarget, setEditPartTarget]   = useState<Part | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null)
  const [page, setPage]                       = useState(1)

  useEffect(() => {
    Promise.all([fetchInventory(), fetchStores(), fetchParts()])
  }, [])

  const fetchParts     = async () => { try { const d = await adminApiService.getParts(); setParts(Array.isArray(d) ? d : []) } catch { setParts([]) } }
  const fetchStores    = async () => { try { const d = await adminApiService.getStores(); setStores(Array.isArray(d) ? d : []) } catch { setStores([]) } }
  const fetchInventory = async () => {
    try {
      setLoading(true)
      const data = await adminApiService.getInventory()
      setInventory(Array.isArray(data) ? data : [])
    } catch { setInventory([]) }
    finally { setLoading(false) }
  }

  const handleSave = async (updates: { store_id: number; quantity: number; min_stock_level: number; location: string | null }[]) => {
    if (!editingPart) return
    for (const u of updates) {
      const ex = inventory.find(i => i.store_id === u.store_id && i.part_id === editingPart.id)
      if (ex) {
        await adminApiService.updateInventory(ex.id, { quantity: u.quantity, min_stock_level: u.min_stock_level, location: u.location })
      } else {
        await adminApiService.createInventory({ store_id: u.store_id, part_id: editingPart.id, quantity: u.quantity, min_stock_level: u.min_stock_level, location: u.location })
      }
    }
    await fetchInventory()
  }

  const handleStatusChange = async (partId: number, status: string) => {
    try {
      setUpdatingStatusId(partId)
      await adminApiService.updatePart(partId, { status })
      setParts(prev => prev.map(p => p.id === partId ? { ...p, status } : p))
    } catch (error) {
      console.error('Error updating status:', error)
      alert(`Failed to update status: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setUpdatingStatusId(null)
    }
  }

  /* Build per-part rows */
  const inventoryMap = inventory.reduce((acc, inv) => {
    acc[`${inv.part_id}-${inv.store_id}`] = inv
    return acc
  }, {} as Record<string, Inventory>)

  const allRows = parts.map(part => {
    const storeInvs = stores.map(s => inventoryMap[`${part.id}-${s.id}`] ?? null)
    const total     = storeInvs.reduce((sum, inv) => sum + (inv?.quantity ?? 0), 0)
    const isLow     = part.min_stock_level != null && total <= part.min_stock_level
    return { part, total, isLow }
  })

  const filtered = allRows.filter(r => {
    const q = searchTerm.toLowerCase()
    return !q || r.part.part_number?.toLowerCase().includes(q) || r.part.name?.toLowerCase().includes(q)
  })

  const lowStockTotal = allRows.filter(r => r.isLow).length

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

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
          {/* Title + stats */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-sm font-bold whitespace-nowrap">Parts Inventory</h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">{parts.length} parts</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">{stores.length} stores</span>
              {lowStockTotal > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/30 text-[10px] text-red-300 flex items-center gap-1">
                  <AlertCircle className="h-2.5 w-2.5" />{lowStockTotal} low stock
                </span>
              )}
            </div>
          </div>

          {/* Categories button */}
          <button
            onClick={() => navigate('/part-categories')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Tag className="h-3.5 w-3.5" />
            Categories
          </button>

          {/* Services button */}
          <button
            onClick={() => navigate('/services')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Wrench className="h-3.5 w-3.5" />
            Services
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input
              type="text" placeholder="Search part number or name…" value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
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
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Part No.</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Unit</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Cost (KES)</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Cost (USD)</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Sell Price</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Quantity</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Stock Value</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(({ part, total, isLow }) => {
                    return (
                      <tr key={part.id}
                        className="group hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/inventory/${part.id}`)}>
                        {/* Part number */}
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                            {part.part_number}
                          </span>
                        </td>

                        {/* Part name */}
                        <td className="px-4 py-2.5">
                          <p className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap">{part.name}</p>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-2.5">
                          {part.category
                            ? <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-medium whitespace-nowrap">{part.category}</span>
                            : <span className="text-xs text-gray-300">—</span>}
                        </td>

                        {/* Unit */}
                        <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{part.unit || <span className="text-gray-300">—</span>}</td>

                        {/* Cost (KES) */}
                        <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                          {part.unit_price != null ? `KES ${Number(part.unit_price).toLocaleString()}` : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Cost (USD) */}
                        <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                          {part.unit_price_usd != null ? `$${Number(part.unit_price_usd).toLocaleString()}` : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Selling price */}
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-900 whitespace-nowrap">
                          {part.selling_price != null
                            ? `KES ${Number(part.selling_price).toLocaleString()}`
                            : part.unit_price != null
                              ? `KES ${Number(part.unit_price).toLocaleString()}`
                              : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Quantity */}
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isLow ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                            {isLow ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                            {total}
                          </span>
                        </td>

                        {/* Stock value */}
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-700 whitespace-nowrap">
                          {part.unit_price != null
                            ? `KES ${(total * Number(part.unit_price)).toLocaleString()}`
                            : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
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

                        {/* Actions */}
                        <td className="px-4 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditPartTarget(part); setIsEditPartOpen(true) }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit part details"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingPart(part); setIsModalOpen(true) }}
                              className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                              title="Update stock"
                            >
                              <Package className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Pagination ── */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-xs text-gray-400">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) => n === '…'
                  ? <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
                  : <button key={n} onClick={() => setPage(n as number)}
                      className={`w-7 h-7 text-xs rounded-lg border transition-colors ${
                        safePage === n ? 'bg-green-600 border-green-600 text-white font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}>{n}</button>
                )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPart(null) }}
        part={editingPart}
        stores={stores}
        inventory={inventory}
        onSave={handleSave}
      />

      <EditPartModal
        isOpen={isEditPartOpen}
        onClose={() => { setIsEditPartOpen(false); setEditPartTarget(null) }}
        part={editPartTarget}
        onSaved={fetchParts}
      />
    </div>
  )
}

export default Inventory
